import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Inbox, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AddRiskModal } from '@/components/AddRiskModal'
import { signalementService, type Signalement } from '@/services/signalementService'
import { useRiskMutations } from '@/hooks/useRisks'

/**
 * File de qualification des signalements — le pendant « bureau » du parcours
 * terrain. Chaque signalement reçoit une suite explicite :
 *
 *   - QUALIFIER : ouvre le formulaire de risque prérempli avec la
 *     description ; à l'enregistrement, le signalement est marqué « intégré
 *     au registre » avec le code du risque créé.
 *   - TRAITER SANS SUITE : exige une note — l'auteur la verra. Un
 *     signalement écarté sans explication décourage le suivant.
 *
 * La cotation reste celle du responsable SST : le signalement fournit la
 * description, jamais la probabilité ni la gravité.
 */

const Signalements = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { createRisk } = useRiskMutations()
  const [rejetEnCours, setRejetEnCours] = useState<string | null>(null)
  const [noteRejet, setNoteRejet] = useState('')

  const { data: signalements = [], isLoading } = useQuery({
    queryKey: ['signalements'],
    queryFn: () => signalementService.getSignalements()
  })

  const statuer = useMutation({
    mutationFn: (args: Parameters<typeof signalementService.statuer>) =>
      signalementService.statuer(...args),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['signalements'] }),
    onError: (e) =>
      toast({
        title: 'Action refusée',
        description: e instanceof Error ? e.message : String(e),
        variant: 'destructive'
      })
  })

  const nouveaux = signalements.filter(s => s.statut === 'nouveau')
  const traites = signalements.filter(s => s.statut !== 'nouveau')

  const qualifier = async (signalement: Signalement, input: Parameters<typeof createRisk.mutateAsync>[0]) => {
    const risque = await createRisk.mutateAsync(input)
    await statuer.mutateAsync([
      signalement.id,
      {
        statut: 'qualifie',
        risqueCode: (risque as { id?: string })?.id,
        note: `Intégré au registre sous ${(risque as { id?: string })?.id ?? 'un nouveau code'}`
      }
    ])
    toast({ title: 'Signalement qualifié', description: 'Le risque est au registre et l\'auteur voit la suite donnée.' })
  }

  const rejeter = async (signalement: Signalement) => {
    if (noteRejet.trim().length < 5) {
      toast({
        title: 'Note requise',
        description: "Expliquez en quelques mots pourquoi ce signalement est traité sans suite : l'auteur la lira.",
        variant: 'destructive'
      })
      return
    }
    await statuer.mutateAsync([signalement.id, { statut: 'rejete', note: noteRejet.trim() }])
    setRejetEnCours(null)
    setNoteRejet('')
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-sst-blue flex items-center gap-2">
          <Inbox className="w-8 h-8" />
          Signalements
        </h1>
        <p className="text-gray-600 mt-1">
          Ce que le terrain a vu. Chaque signalement mérite une suite explicite —
          qualification en risque, ou note expliquant l'absence de suite.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-600 p-6">
          <Loader2 className="w-5 h-5 animate-spin" />
          Chargement…
        </div>
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="font-semibold mb-2">
              À traiter {nouveaux.length > 0 && <Badge className="ml-1">{nouveaux.length}</Badge>}
            </h2>
            {nouveaux.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun signalement en attente.</p>
            ) : (
              <div className="space-y-3">
                {nouveaux.map(s => (
                  <Card key={s.id}>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="font-medium">{s.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {s.lieu && <>{s.lieu} · </>}
                          {new Date(s.createdAt).toLocaleDateString('fr-CA')}
                          {s.auteur && <> · signalé par {s.auteur}</>}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <AddRiskModal
                          onSave={(input) => qualifier(s, input)}
                          valeursInitiales={{ name: s.description.slice(0, 120) }}
                          trigger={
                            <Button size="sm">
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Qualifier en risque
                            </Button>
                          }
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRejetEnCours(rejetEnCours === s.id ? null : s.id)
                            setNoteRejet('')
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Traiter sans suite
                        </Button>
                      </div>
                      {rejetEnCours === s.id && (
                        <div className="space-y-2 border-t pt-3">
                          <Textarea
                            placeholder="Pourquoi ce signalement ne devient-il pas un risque ? L'auteur lira cette note."
                            value={noteRejet}
                            onChange={(e) => setNoteRejet(e.target.value)}
                            rows={2}
                          />
                          <Button size="sm" variant="secondary" onClick={() => rejeter(s)} disabled={statuer.isPending}>
                            Confirmer
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {traites.length > 0 && (
            <section>
              <h2 className="font-semibold mb-2 text-gray-700">Traités</h2>
              <div className="space-y-2">
                {traites.map(s => (
                  <Card key={s.id} className="bg-gray-50">
                    <CardContent className="p-3 flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="text-sm">{s.description}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.decisionNote}</p>
                      </div>
                      <Badge variant="outline">
                        {s.statut === 'qualifie' ? `Au registre${s.risqueCode ? ` (${s.risqueCode})` : ''}` : 'Sans suite'}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

export default Signalements
