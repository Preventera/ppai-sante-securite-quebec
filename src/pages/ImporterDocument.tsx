/* © 2026 Preventera — AgenticX5. Tous droits réservés. Voir LICENSE.md. */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { FileUp, Quote, AlertTriangle, Info, Loader2, ArrowRight } from 'lucide-react'
import {
  extraireDocument, validerFichier, ErreurExtraction,
  TYPES_DOCUMENT, type TypeDocument, type ResultatExtraction
} from '@/services/extractionService'
import { mesuresDuRisque, mesuresOrphelines, type RisqueExtrait } from '@/lib/extraction'
import { LIBELLE_NIVEAU } from '@/lib/prevention'
import { riskService } from '@/services/riskService'
import { useQueryClient } from '@tanstack/react-query'
import { RISKS_QUERY_KEY } from '@/hooks/useRisks'
import type { RiskSector } from '@/types/risk'

/**
 * Reprendre les risques et les mesures d'un document SST existant.
 *
 * CE QUE CET ÉCRAN REFUSE DE FAIRE
 *   Écrire au registre ce qu'un modèle a lu. Chaque risque proposé montre la
 *   page et la phrase du document d'où il vient ; rien ne part au registre sans
 *   que l'utilisateur l'ait accepté et coté.
 *
 * LA PROBABILITÉ EST TOUJOURS SAISIE ICI
 *   Elle n'est jamais extraite. Le produit refuse de la dériver des lésions
 *   publiées faute de dénominateur d'exposition ; la faire deviner à un modèle
 *   à partir d'une prose serait pire. C'est l'employeur qui cote la probabilité
 *   sur SON établissement, et l'écran l'y oblige avant d'autoriser l'écriture.
 *
 * LES RÉSERVES SE VOIENT
 *   Un article écarté parce qu'il n'existe pas, une catégorie rapprochée, un
 *   niveau hors hiérarchie : tout est affiché sur l'élément concerné. Cacher
 *   une réserve reviendrait à présenter comme sûr ce qui ne l'est pas.
 */

const SECTEURS: RiskSector[] = ['Construction', 'Électricité', 'Sécurité', 'Santé']

/** Ce que l'utilisateur ajoute à un risque extrait avant de l'accepter. */
interface Cotation {
  retenu: boolean
  probabilite: number
  gravite: number
  secteur: RiskSector
}

export default function ImporterDocument() {
  const navigate = useNavigate()
  const { toast } = useToast()
  // Les écritures passent par `riskService` plutôt que par `useRiskMutations`,
  // pour n'émettre qu'une notification à la fin plutôt qu'une par risque. Le
  // cache doit donc être invalidé à la main : sans ça, le registre affiche son
  // état d'avant l'import et l'utilisateur croit que rien n'a été écrit.
  const queryClient = useQueryClient()

  const [fichier, setFichier] = useState<File | null>(null)
  const [typeDocument, setTypeDocument] = useState<TypeDocument>(TYPES_DOCUMENT[0])
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<{ message: string; detail?: string } | null>(null)
  const [resultat, setResultat] = useState<ResultatExtraction | null>(null)
  const [cotations, setCotations] = useState<Record<string, Cotation>>({})
  const [enregistrement, setEnregistrement] = useState(false)

  const extraction = resultat?.extraction
  const orphelines = useMemo(() => (extraction ? mesuresOrphelines(extraction) : []), [extraction])

  const retenus = useMemo(
    () => (extraction ?? { risques: [] }).risques.filter(r => cotations[r.cle]?.retenu),
    [extraction, cotations],
  )

  const choisirFichier = (f: File | null) => {
    setErreur(null)
    setResultat(null)
    if (!f) return setFichier(null)
    const probleme = validerFichier(f)
    if (probleme) {
      setFichier(null)
      setErreur({ message: probleme })
      return
    }
    setFichier(f)
  }

  const lancer = async () => {
    if (!fichier) return
    setEnCours(true)
    setErreur(null)
    try {
      const r = await extraireDocument(fichier, typeDocument)
      setResultat(r)
      // Chaque risque arrive NON retenu : l'acceptation est un geste, pas un
      // défaut. La gravité du document sert de proposition, la probabilité
      // reste à 0 pour forcer la cotation.
      setCotations(
        Object.fromEntries(
          r.extraction.risques.map(risque => [
            risque.cle,
            { retenu: false, probabilite: 0, gravite: risque.gravite ?? 0, secteur: 'Sécurité' as RiskSector },
          ]),
        ),
      )
      if (r.extraction.risques.length === 0) {
        toast({
          title: 'Aucun risque retenu',
          description: "Le document n'a livré aucun risque vérifiable. Voyez les réserves plus bas.",
        })
      }
    } catch (e) {
      const err = e as ErreurExtraction
      setErreur({ message: err.message, detail: err.detail })
    } finally {
      setEnCours(false)
    }
  }

  const majCotation = (cle: string, champ: keyof Cotation, valeur: number | boolean | string) =>
    setCotations(prev => ({ ...prev, [cle]: { ...prev[cle], [champ]: valeur } as Cotation }))

  /** Un risque n'est écrivable que coté sur les deux axes. */
  const cotationComplete = (cle: string) => {
    const c = cotations[cle]
    return !!c && c.probabilite >= 1 && c.probabilite <= 5 && c.gravite >= 1 && c.gravite <= 5
  }

  const incomplets = retenus.filter(r => !cotationComplete(r.cle))

  const enregistrer = async () => {
    if (!extraction || retenus.length === 0 || incomplets.length > 0) return
    setEnregistrement(true)
    let ecrits = 0
    try {
      for (const risque of retenus) {
        const c = cotations[risque.cle]
        // Les mesures reprennent l'ordre de la hiérarchie du RMPPÉ, et portent
        // leur fondement quand il a survécu à la vérification.
        const mesures = mesuresDuRisque(extraction, risque.nom)
          .map(m => {
            const niveau = m.niveau ? `${m.niveau}. ${LIBELLE_NIVEAU[m.niveau]} — ` : ''
            const fondement = m.fondement ? ` [${m.fondement}]` : ''
            return `${niveau}${m.libelle}${fondement}`
          })
          .join('\n')

        await riskService.createRisk({
          name: risque.nom,
          phase: risque.phase,
          category: risque.categorie,
          probability: c.probabilite,
          gravity: c.gravite,
          measures:
            mesures ||
            `Repris de « ${resultat!.metadonnees.document} », page ${risque.ancrage.page}. Mesures à décrire.`,
          status: 'En surveillance',
          responsible: risque.responsable,
          sector: c.secteur,
        })
        ecrits++
      }
      await queryClient.invalidateQueries({ queryKey: RISKS_QUERY_KEY })
      toast({
        title: `${ecrits} risque(s) ajouté(s) au registre`,
        description: `Repris de « ${resultat!.metadonnees.document} ».`,
      })
      navigate('/risks')
    } catch (e) {
      // Les risques déjà écrits le restent : invalider quand même, sinon le
      // registre les cacherait et l'utilisateur les ressaisirait.
      await queryClient.invalidateQueries({ queryKey: RISKS_QUERY_KEY })
      toast({
        variant: 'destructive',
        title: `Écriture interrompue après ${ecrits} risque(s)`,
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setEnregistrement(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-sst-blue">Importer un document</h1>
        <p className="text-gray-600 mt-1">
          Reprenez les risques et les mesures d'un programme de prévention, d'une analyse de
          risques ou d'un rapport d'audit existant, plutôt que de les ressaisir.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileUp className="w-5 h-5 text-sst-blue" />
            Le document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fichier">Fichier PDF</Label>
              <input
                id="fichier"
                type="file"
                accept="application/pdf,.pdf"
                onChange={e => choisirFichier(e.target.files?.[0] ?? null)}
                className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-sst-blue file:px-3 file:py-2 file:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Type de document</Label>
              <Select value={typeDocument} onValueChange={v => setTypeDocument(v as TypeDocument)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES_DOCUMENT.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription className="text-sm">
              La lecture propose ; elle ne décide pas. Chaque risque vous sera présenté avec la
              page et la phrase du document dont il est tiré, et rien n'entrera au registre sans
              que vous l'ayez accepté et coté.
            </AlertDescription>
          </Alert>

          <Button onClick={lancer} disabled={!fichier || enCours}>
            {enCours ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Lecture en cours…</> : 'Lire le document'}
          </Button>

          {erreur && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <p className="font-medium">{erreur.message}</p>
                {erreur.detail && <p className="text-xs mt-1 opacity-90">{erreur.detail}</p>}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {extraction && (
        <>
          {extraction.avertissements.length > 0 && (
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription className="text-sm">
                <p className="font-medium mb-1">Ce que le document ne dit pas</p>
                <ul className="list-disc pl-5 space-y-0.5">
                  {extraction.avertissements.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {extraction.rejets.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-sm">
                <p className="font-medium mb-1">
                  {extraction.rejets.length} élément(s) écarté(s) avant de vous être montré(s)
                </p>
                <ul className="list-disc pl-5 space-y-0.5">
                  {extraction.rejets.map((r, i) => <li key={i}>{r.quoi} — {r.motif}</li>)}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {extraction.risques.length} risque(s) proposé(s)
              </CardTitle>
              <p className="text-sm text-gray-500">
                Cochez ce que vous retenez, puis cotez la probabilité et la gravité.
                La probabilité n'est jamais extraite : elle vous appartient.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {extraction.risques.map(risque => (
                <FicheRisque
                  key={risque.cle}
                  risque={risque}
                  mesures={mesuresDuRisque(extraction, risque.nom)}
                  cotation={cotations[risque.cle]}
                  onChange={(champ, valeur) => majCotation(risque.cle, champ, valeur)}
                />
              ))}

              {orphelines.length > 0 && (
                <div className="rounded-lg border border-dashed p-3">
                  <p className="text-sm font-medium">
                    {orphelines.length} mesure(s) sans risque rattaché
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    Elles ne partiront pas au registre : une mesure sans risque n'y a pas de place.
                    Elles sont listées pour que vous décidiez quoi en faire.
                  </p>
                  <ul className="text-sm space-y-1">
                    {orphelines.map(m => (
                      <li key={m.cle} className="text-gray-600">
                        • {m.libelle} <span className="text-xs text-gray-400">— page {m.ancrage.page}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-4 flex-wrap sticky bottom-0 bg-white/95 border-t py-3">
            <p className="text-sm text-gray-600">
              {retenus.length} retenu(s)
              {incomplets.length > 0 && (
                <span className="text-amber-700">
                  {' '}— {incomplets.length} encore à coter avant l'enregistrement
                </span>
              )}
            </p>
            <Button
              onClick={enregistrer}
              disabled={retenus.length === 0 || incomplets.length > 0 || enregistrement}
            >
              {enregistrement
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement…</>
                : <>Ajouter au registre <ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

function FicheRisque({
  risque, mesures, cotation, onChange,
}: {
  risque: RisqueExtrait
  mesures: ReturnType<typeof mesuresDuRisque>
  cotation?: Cotation
  onChange: (champ: keyof Cotation, valeur: number | boolean | string) => void
}) {
  const retenu = cotation?.retenu ?? false
  const indice = (cotation?.probabilite ?? 0) * (cotation?.gravite ?? 0)

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${retenu ? 'border-sst-blue bg-sst-blue/5' : ''}`}>
      <div className="flex items-start gap-3">
        <Checkbox
          id={risque.cle}
          checked={retenu}
          onCheckedChange={v => onChange('retenu', v === true)}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <label htmlFor={risque.cle} className="font-medium cursor-pointer">{risque.nom}</label>
          <p className="text-xs text-gray-500 mt-0.5">
            {risque.categorie}
            {risque.phase && ` · ${risque.phase}`}
            {risque.responsable && ` · ${risque.responsable}`}
          </p>

          {/* L'ancrage est ce qui rend l'élément vérifiable : il ne se replie pas. */}
          <blockquote className="mt-2 border-l-2 border-gray-300 pl-3 text-sm text-gray-600 italic">
            <Quote className="w-3 h-3 inline mr-1 opacity-50" />
            {risque.ancrage.extrait}
            <span className="not-italic text-xs text-gray-400"> — page {risque.ancrage.page}</span>
          </blockquote>

          {risque.reserves.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {risque.reserves.map((r, i) => (
                <li key={i} className="text-xs text-amber-700">⚠ {r.motif}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {retenu && (
        <div className="pl-8 space-y-3">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">
                Probabilité <span className="text-amber-700">— à coter</span>
              </Label>
              <Select
                value={cotation?.probabilite ? String(cotation.probabilite) : ''}
                onValueChange={v => onChange('probabilite', Number(v))}
              >
                <SelectTrigger><SelectValue placeholder="1 à 5" /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">
                Gravité {risque.gravite ? <span className="text-gray-400">— proposée par le document</span> : null}
              </Label>
              <Select
                value={cotation?.gravite ? String(cotation.gravite) : ''}
                onValueChange={v => onChange('gravite', Number(v))}
              >
                <SelectTrigger><SelectValue placeholder="1 à 5" /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Secteur</Label>
              <Select value={cotation?.secteur} onValueChange={v => onChange('secteur', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SECTEURS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Indice</Label>
              <div className="h-10 flex items-center font-semibold tabular-nums">
                {indice > 0 ? indice : '—'}
              </div>
            </div>
          </div>

          {mesures.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">
                {mesures.length} mesure(s) reprise(s) du document
              </p>
              <ul className="space-y-1.5">
                {mesures.map(m => (
                  <li key={m.cle} className="text-sm">
                    <span className="text-xs font-bold text-sst-blue tabular-nums mr-1">
                      {m.niveau ?? '–'}
                    </span>
                    {m.libelle}
                    {m.fondement && (
                      <Badge variant="outline" className="ml-2 text-[10px]">{m.fondement}</Badge>
                    )}
                    <span className="block text-xs text-gray-400 ml-4">
                      page {m.ancrage.page}
                      {m.niveau && ` · ${LIBELLE_NIVEAU[m.niveau]}`}
                    </span>
                    {m.reserves.map((r, i) => (
                      <span key={i} className="block text-xs text-amber-700 ml-4">⚠ {r.motif}</span>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
