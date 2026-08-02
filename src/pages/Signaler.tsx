import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Megaphone, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { signalementService, type StatutSignalement } from '@/services/signalementService'

/**
 * Signaler un risque — le parcours du terrain.
 *
 * Conçu pour un téléphone tenu d'une main dans un atelier : deux champs, gros
 * boutons, aucune notion à connaître. La personne qui voit une situation
 * dangereuse la décrit ; la cotation et les mesures relèvent de la
 * qualification par le responsable SST (LSST art. 49 pour la participation du
 * travailleur, art. 51 pour les obligations de l'employeur).
 *
 * La liste « Mes signalements » montre le sort réservé à chacun : un
 * signalement sans suite visible décourage le suivant.
 */

const LIBELLE_STATUT: Record<StatutSignalement, { texte: string; classe: string }> = {
  nouveau: { texte: 'Reçu — en attente de traitement', classe: 'bg-blue-100 text-blue-800' },
  qualifie: { texte: 'Intégré au registre des risques', classe: 'bg-green-100 text-green-800' },
  rejete: { texte: 'Traité sans suite', classe: 'bg-gray-100 text-gray-700' }
}

const Signaler = () => {
  const queryClient = useQueryClient()
  const [description, setDescription] = useState('')
  const [lieu, setLieu] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoye, setEnvoye] = useState(false)

  const { data: signalements = [] } = useQuery({
    queryKey: ['signalements'],
    queryFn: () => signalementService.getSignalements()
  })

  const creer = useMutation({
    mutationFn: () => signalementService.creerSignalement({ description, lieu }),
    onSuccess: () => {
      setEnvoye(true)
      setDescription('')
      setLieu('')
      queryClient.invalidateQueries({ queryKey: ['signalements'] })
    },
    onError: (e) => setErreur(e instanceof Error ? e.message : 'Envoi impossible')
  })

  const soumettre = (event: React.FormEvent) => {
    event.preventDefault()
    setErreur(null)
    creer.mutate()
  }

  return (
    <div className="p-4 sm:p-6 max-w-lg mx-auto space-y-6">
      <div className="text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-sst-blue flex items-center justify-center sm:justify-start gap-2">
          <Megaphone className="w-7 h-7" />
          Signaler un risque
        </h1>
        <p className="text-gray-600 mt-1 text-sm">
          Vous voyez quelque chose de dangereux ? Décrivez-le, c'est tout.
          Le responsable SST prend le relais.
        </p>
      </div>

      {envoye ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              Signalement transmis
            </CardTitle>
            <CardDescription>
              Le responsable SST le verra dans sa file de traitement. Vous
              pourrez suivre la suite donnée ci-dessous.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => setEnvoye(false)}>
              Signaler autre chose
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            {erreur && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{erreur}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={soumettre} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sig-description">Qu'avez-vous vu ? *</Label>
                <Textarea
                  id="sig-description"
                  required
                  minLength={10}
                  rows={4}
                  placeholder="Ex : garde-corps manquant au quai de chargement, plancher glissant près des cuves…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sig-lieu">Où ? </Label>
                <Input
                  id="sig-lieu"
                  placeholder="Ex : quai 3, atelier de soudure, 2e étage…"
                  value={lieu}
                  onChange={(e) => setLieu(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={creer.isPending}>
                {creer.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Transmettre le signalement
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {signalements.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-2">Mes signalements</h2>
          <div className="space-y-2">
            {signalements.map(s => (
              <Card key={s.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="text-sm font-medium min-w-0">{s.description}</p>
                    <Badge className={LIBELLE_STATUT[s.statut].classe}>
                      {LIBELLE_STATUT[s.statut].texte}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {s.lieu && <>{s.lieu} · </>}
                    {new Date(s.createdAt).toLocaleDateString('fr-CA')}
                    {s.decisionNote && <> — {s.decisionNote}</>}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Signaler
