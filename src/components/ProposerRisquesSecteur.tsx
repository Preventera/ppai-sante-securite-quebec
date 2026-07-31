import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Lightbulb, AlertTriangle, Loader2 } from 'lucide-react'
import { SECTEURS_SCIAN } from '@/lib/scianNiveaux'
import {
  getRiskTemplates,
  secteursCnesstCandidats,
  estIssuDesDonneesOuvertes,
  templateVersRisque,
  type RiskTemplate
} from '@/services/riskTemplateService'
import type { Risk } from '@/types/risk'
import type { RiskInput } from '@/services/riskService'

/**
 * Propose à l'employeur les risques types de son secteur, dérivés des lésions
 * professionnelles publiées par la CNESST.
 *
 * CE QUE CET ÉCRAN REFUSE DE FAIRE À LA PLACE DE L'UTILISATEUR
 *   Il ne cote pas la probabilité. Elle n'est pas dérivable des données — le
 *   grain est « une ligne = une lésion survenue », sans contre-exemple — et la
 *   Loi la met à la charge de l'employeur pour SON établissement (art. 59). Une
 *   proposition ne peut donc pas être adoptée sans que quelqu'un la cote, et
 *   c'est délibérément un frein.
 *
 *   Il ne devine pas non plus le domaine du registre : quatre domaines d'un
 *   côté, 22 grands secteurs CNESST de l'autre, sans correspondance déductible.
 */

const SECTEURS_REGISTRE: Risk['sector'][] = ['Construction', 'Électricité', 'Sécurité', 'Santé']

interface Props {
  onAdopter: (risques: RiskInput[]) => Promise<unknown>
  trigger?: React.ReactNode
}

export function ProposerRisquesSecteur({ onAdopter, trigger }: Props) {
  const [ouvert, setOuvert] = useState(false)
  const [codeScian, setCodeScian] = useState('')
  const [orientation, setOrientation] = useState('')
  // Aucune valeur par défaut : un menu prérempli inscrirait « Construction »
  // dans le registre d'un CHSLD sans que personne ne l'ait choisi. Le bouton
  // d'ajout reste bloqué tant que le domaine n'est pas désigné.
  const [secteurRegistre, setSecteurRegistre] = useState<Risk['sector'] | ''>('')
  const [propositions, setPropositions] = useState<RiskTemplate[]>([])
  const [chargement, setChargement] = useState(false)
  const [enregistrement, setEnregistrement] = useState(false)
  /** Probabilité retenue par proposition ; absente tant que rien n'est coté. */
  const [cotations, setCotations] = useState<Record<string, number>>({})

  const candidats = useMemo(
    () => (codeScian ? secteursCnesstCandidats(codeScian) : []),
    [codeScian]
  )
  const orientationRequise = candidats.length > 1

  useEffect(() => {
    if (!codeScian || (orientationRequise && !orientation)) {
      setPropositions([])
      return
    }
    let annule = false
    setChargement(true)
    getRiskTemplates(codeScian, { orientation: orientation || undefined })
      .then(t => {
        if (!annule) setPropositions(t)
      })
      .finally(() => {
        if (!annule) setChargement(false)
      })
    return () => {
      annule = true
    }
  }, [codeScian, orientation, orientationRequise])

  const retenues = propositions.filter(p => cotations[p.id] > 0)
  const issuDeDonneesReelles = propositions.some(estIssuDesDonneesOuvertes)

  const adopter = async () => {
    if (retenues.length === 0 || !secteurRegistre) return
    setEnregistrement(true)
    try {
      await onAdopter(
        retenues.map(p =>
          templateVersRisque(p, { probabilite: cotations[p.id], secteurRegistre })
        )
      )
      setOuvert(false)
      setCotations({})
      setSecteurRegistre('')
      setCodeScian('')
      setOrientation('')
    } finally {
      setEnregistrement(false)
    }
  }

  return (
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="gap-2">
            <Lightbulb className="h-4 w-4" aria-hidden="true" />
            Proposer les risques de mon secteur
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Risques types du secteur</DialogTitle>
          <DialogDescription>
            Dérivés des lésions professionnelles publiées par la CNESST. Ce sont des
            propositions : l'employeur reste responsable d'identifier les risques de son
            établissement (LSST art. 59).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="prop-scian">Sous-secteur SCIAN 2012 de l'établissement</Label>
            <Select value={codeScian} onValueChange={v => { setCodeScian(v); setOrientation('') }}>
              <SelectTrigger id="prop-scian">
                <SelectValue placeholder="Sélectionnez votre sous-secteur" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {SECTEURS_SCIAN.map(s => (
                  <SelectItem key={s.code} value={s.code}>
                    {s.code} — {s.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {orientationRequise && (
            <div className="space-y-2 border rounded-lg p-4">
              <Label>Orientation de l'établissement</Label>
              <p className="text-xs text-muted-foreground">
                Ce code recouvre deux réalités aux profils de lésions distincts. Le classement
                réglementaire est le même dans les deux cas ; seules les propositions diffèrent.
              </p>
              <RadioGroup value={orientation} onValueChange={setOrientation} className="pt-1">
                {candidats.map(c => (
                  <div key={c} className="flex items-start gap-2">
                    <RadioGroupItem value={c} id={`orient-${c}`} />
                    <Label htmlFor={`orient-${c}`} className="font-normal cursor-pointer">
                      {c}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {chargement && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Chargement des propositions…
            </p>
          )}

          {!chargement && codeScian && !orientationRequise && propositions.length === 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>
                Aucune proposition pour ce sous-secteur. Le référentiel n'est peut-être pas encore
                chargé en base, ou ce secteur n'est pas couvert par les données publiées.
              </AlertDescription>
            </Alert>
          )}

          {propositions.length > 0 && (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>
                  <strong>Chaque risque retenu doit être coté.</strong> La probabilité ne se déduit
                  pas des statistiques de lésions : elles recensent des lésions survenues, jamais
                  des situations sans lésion. Elle relève de votre appréciation pour votre
                  établissement. La gravité proposée, elle, s'appuie sur les natures de lésion
                  réellement observées.
                </AlertDescription>
              </Alert>

              {!issuDeDonneesReelles && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  <AlertDescription>
                    Ces propositions viennent du <strong>jeu de démonstration</strong>, pas des
                    données de la CNESST.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="prop-domaine">Domaine du registre pour les risques adoptés</Label>
                <Select
                  value={secteurRegistre}
                  onValueChange={v => setSecteurRegistre(v as Risk['sector'])}
                >
                  <SelectTrigger id="prop-domaine">
                    <SelectValue placeholder="Choisissez le domaine" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTEURS_REGISTRE.map(s => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Le registre classe en quatre domaines, les données CNESST en 22 grands
                  secteurs : la correspondance ne se déduit pas, c'est à vous de la faire.
                </p>
              </div>

              <div className="space-y-3">
                {propositions.map(p => {
                  const cotee = cotations[p.id] > 0
                  return (
                    <div
                      key={p.id}
                      className={`border rounded-lg p-3 ${cotee ? 'border-blue-400 bg-blue-50/50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`prop-${p.id}`}
                          checked={cotee}
                          onCheckedChange={checked =>
                            setCotations(c => {
                              const suite = { ...c }
                              if (checked) suite[p.id] = 3
                              else delete suite[p.id]
                              return suite
                            })
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={`prop-${p.id}`}
                            className="font-medium cursor-pointer block"
                          >
                            {p.libelle}
                          </label>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {p.categorie && <Badge variant="secondary">{p.categorie}</Badge>}
                            <Badge variant="outline">
                              Gravité proposée : {p.graviteSuggeree ?? '—'}
                            </Badge>
                            {p.nbCasObserves != null && (
                              <span className="text-xs text-muted-foreground">
                                {p.nbCasObserves.toLocaleString('fr-CA')} cas observés dans le
                                secteur
                              </span>
                            )}
                          </div>

                          {cotee && (
                            <div className="mt-3 flex items-center gap-2">
                              <Label
                                htmlFor={`proba-${p.id}`}
                                className="text-sm whitespace-nowrap"
                              >
                                Probabilité pour votre établissement
                              </Label>
                              <Select
                                value={String(cotations[p.id])}
                                onValueChange={v =>
                                  setCotations(c => ({ ...c, [p.id]: Number(v) }))
                                }
                              >
                                <SelectTrigger id={`proba-${p.id}`} className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[1, 2, 3, 4, 5].map(n => (
                                    <SelectItem key={n} value={String(n)}>
                                      {n}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <span className="text-xs text-muted-foreground">
                                indice initial : {cotations[p.id] * (p.graviteSuggeree ?? 0)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOuvert(false)}>
            Annuler
          </Button>
          <Button onClick={adopter} disabled={retenues.length === 0 || !secteurRegistre || enregistrement}>
            {enregistrement && <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />}
            Ajouter {retenues.length > 0 ? `${retenues.length} risque(s)` : ''} au registre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
