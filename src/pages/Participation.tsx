import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Users, Loader2, Info, CalendarClock, Clock3, GraduationCap, Link2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { roleEffectif, peutRediger } from '@/lib/roles'
import { determinerMecanismes } from '@/lib/lmrsst'
import {
  nombreRepresentantsTravailleurs, fonctionnementComite, tempsLiberationMensuel
} from '@/lib/rmppe'
import { SECTEURS_SCIAN, secteurPourCode, LIBELLE_NIVEAU_NEUTRE } from '@/lib/scianNiveaux'

/**
 * Mécanismes de prévention et de participation de l'établissement.
 *
 * La page rend visible ce que `determinerMecanismes()` calcule depuis la
 * refonte LMRSST : mécanisme exigé (plan d'action ou programme de
 * prévention), participation (agent de liaison, ou comité et représentant),
 * et les modalités chiffrées du RMPPÉ — composition, réunions, temps de
 * libération, formations.
 *
 * Elle est aussi l'endroit où se déclare ce dont tout dépend : l'effectif et
 * le code SCIAN de l'organisation. Cette saisie engage l'employeur (elle
 * détermine ses obligations) : elle est donc réservée à la direction et au
 * responsable SST — la base le garantit (politique `org_admins_update`,
 * migration 005), l'écran l'explique.
 */
const Participation = () => {
  const { organization, profile, demoMode, rafraichirOrganisation } = useAuth()
  const { toast } = useToast()
  const role = roleEffectif(profile?.role, demoMode)

  // En démonstration il n'y a pas d'organisation : la saisie reste locale et
  // la page devient un simulateur. En mode réel, les valeurs viennent de la
  // fiche d'organisation et y retournent.
  const [effectifSaisi, setEffectifSaisi] = useState<string>(
    organization?.employee_count ? String(organization.employee_count) : ''
  )
  const [scianSaisi, setScianSaisi] = useState<string>(organization?.scian_code ?? '')
  const [enregistrement, setEnregistrement] = useState(false)

  const effectif = Number.parseInt(effectifSaisi, 10) || 0
  const sousSecteur = secteurPourCode(scianSaisi)
  const niveau = sousSecteur?.niveau

  const mecanismes = useMemo(
    () => (effectif > 0 ? determinerMecanismes({ effectif, niveauRisque: niveau }) : null),
    [effectif, niveau]
  )

  const comiteExige = mecanismes?.participation.comiteSanteSecurite ?? false
  const composition = comiteExige ? nombreRepresentantsTravailleurs(effectif) : null
  const reunions = comiteExige && niveau ? fonctionnementComite(niveau) : null
  const liberation = comiteExige && niveau ? tempsLiberationMensuel(effectif, niveau) : null

  const enregistrer = async () => {
    if (!organization) return
    setEnregistrement(true)
    const { error } = await supabase
      .from('organizations')
      .update({
        employee_count: effectif || null,
        scian_code: scianSaisi || null
      })
      .eq('id', organization.id)
    setEnregistrement(false)

    if (error) {
      toast({ title: 'Enregistrement refusé', description: error.message, variant: 'destructive' })
      return
    }
    await rafraichirOrganisation()
    toast({
      title: 'Établissement mis à jour',
      description: 'La navigation et les mécanismes reflètent la nouvelle situation.'
    })
  }

  const modifiable = peutRediger(role)
  const valeursChangees =
    effectif !== (organization?.employee_count ?? 0) ||
    (scianSaisi || null) !== (organization?.scian_code ?? null)

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-sst-blue flex items-center gap-2">
          <Users className="w-8 h-8" />
          Participation et mécanismes de prévention
        </h1>
        <p className="text-gray-600 mt-1">
          Ce que la LSST modernisée exige de votre établissement, selon son
          effectif et son secteur — et les modalités qui s'appliquent à défaut
          d'entente entre les parties.
        </p>
      </div>

      {demoMode && (
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>
            Mode démonstration : les valeurs saisies ici ne sont pas conservées.
            Utilisez la page comme simulateur — l'effectif et le secteur changent
            les mécanismes exigés.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Votre établissement</CardTitle>
          <CardDescription>
            {modifiable
              ? "Ces deux valeurs déterminent les obligations affichées plus bas — et l'entrée de menu qui y mène. Leur saisie engage l'employeur."
              : 'Ces valeurs sont déclarées par la direction ou le responsable SST.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="effectif">Nombre de travailleurs</Label>
              <Input
                id="effectif"
                type="number"
                min={0}
                value={effectifSaisi}
                onChange={(e) => setEffectifSaisi(e.target.value)}
                disabled={!modifiable}
                placeholder="Ex : 45"
              />
              <p className="text-xs text-gray-500">
                Sur une période d'un an. Le seuil de 20 travailleurs sépare les
                deux régimes de la Loi.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Sous-secteur SCIAN</Label>
              <Select
                value={scianSaisi || undefined}
                onValueChange={setScianSaisi}
                disabled={!modifiable}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir le sous-secteur…" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {SECTEURS_SCIAN.map(s => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.code} — {s.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sousSecteur && (
                <p className="text-xs text-gray-500">
                  {LIBELLE_NIVEAU_NEUTRE(sousSecteur.niveau)} (annexe I du RMPPÉ).
                </p>
              )}
            </div>
          </div>
          {modifiable && !demoMode && organization && (
            <Button onClick={enregistrer} disabled={enregistrement || !valeursChangees}>
              {enregistrement && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          )}
        </CardContent>
      </Card>

      {!mecanismes ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-600">
            Indiquez le nombre de travailleurs pour connaître les mécanismes exigés.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {mecanismes.prevention.libelle}
                <Badge variant="outline">exigé</Badge>
              </CardTitle>
              <CardDescription>{mecanismes.prevention.justification}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Mise à jour annuelle obligatoire. Contenu minimal :
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-700 list-disc pl-5">
                {mecanismes.prevention.contenuMinimal.map((element, i) => (
                  <li key={i}>{element}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {comiteExige
                  ? 'Comité de santé et de sécurité, et représentant'
                  : 'Agent de liaison en santé et sécurité'}
              </CardTitle>
              <CardDescription>{mecanismes.participation.justification}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {comiteExige ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex gap-3">
                    <Users className="w-5 h-5 text-sst-blue flex-none mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">
                        {composition?.nombreRepresentants} représentant(s) des travailleurs
                      </p>
                      <p className="text-gray-500">
                        RSS compris ({composition?.article})
                        {composition?.nombreSiGroupeNonRepresente &&
                          ` · ${composition.nombreSiGroupeNonRepresente} si un groupe non syndiqué désigne un membre`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CalendarClock className="w-5 h-5 text-sst-blue flex-none mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">
                        {reunions
                          ? `${reunions.reunionsParAnnee} réunions par année`
                          : 'Réunions : niveau sectoriel requis'}
                      </p>
                      <p className="text-gray-500">
                        {reunions
                          ? `au moins une par trimestre (${reunions.article})`
                          : 'Choisissez le sous-secteur SCIAN pour la fréquence exacte.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Clock3 className="w-5 h-5 text-sst-blue flex-none mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">
                        {liberation
                          ? `${liberation.heuresParMois} h de libération par mois`
                          : 'Libération : niveau sectoriel requis'}
                      </p>
                      <p className="text-gray-500">
                        {liberation
                          ? `à partager entre représentants (${liberation.article})`
                          : 'Choisissez le sous-secteur SCIAN pour le barème.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 text-sm">
                  <Link2 className="w-5 h-5 text-sst-blue flex-none mt-0.5" />
                  <p className="text-gray-700">
                    L'agent de liaison est désigné parmi les travailleurs. Il coopère avec
                    l'employeur, reçoit les plaintes et signale les situations de risque —
                    c'est le mécanisme de participation des établissements de moins de
                    20 travailleurs.
                  </p>
                </div>
              )}

              {mecanismes.formations.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium flex items-center gap-2 mb-2">
                    <GraduationCap className="w-4 h-4" />
                    Formations obligatoires
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {mecanismes.formations.map(f => (
                      <li key={f.mecanisme}>
                        <span className="font-medium">{f.libelle} :</span> {f.formationInitiale}
                        {f.formationContinue && <> Formation continue : {f.formationContinue}</>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {mecanismes.avertissements.length > 0 && (
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                <ul className="space-y-1">
                  {mecanismes.avertissements.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <p className="text-xs text-gray-500">
            Modalités à défaut d'entente entre les parties — une entente peut prévoir
            davantage. Sources : {mecanismes.reference} ; RMPPÉ, RLRQ c. S-2.1, r. 8.3.
          </p>
        </>
      )}
    </div>
  )
}

export default Participation
