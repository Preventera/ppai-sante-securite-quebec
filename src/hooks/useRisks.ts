import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { riskService, RiskInput } from '@/services/riskService'
import { getBackendMode, type BackendMode } from '@/lib/backend'
import { toast } from '@/hooks/use-toast'

export const RISKS_QUERY_KEY = ['risks'] as const

/** Registre des risques, source unique de vérité pour toutes les vues. */
export function useRisks() {
  return useQuery({
    queryKey: RISKS_QUERY_KEY,
    queryFn: () => riskService.getAllRisks(),
    staleTime: 30_000
  })
}

/** Mode backend courant (`live` ou `demo`), pour l'affichage d'état. */
export function useBackendMode() {
  return useQuery<BackendMode>({
    queryKey: ['backend-mode'],
    queryFn: () => getBackendMode(),
    staleTime: Infinity
  })
}

/**
 * Mutations du registre. Chaque mutation invalide le cache afin que la matrice,
 * les indices et les graphiques se recalculent immédiatement.
 */
export function useRiskMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: RISKS_QUERY_KEY })

  const reportError = (action: string) => (error: unknown) => {
    toast({
      variant: 'destructive',
      title: `${action} impossible`,
      description: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }

  const createRisk = useMutation({
    mutationFn: (input: RiskInput) => riskService.createRisk(input),
    onSuccess: risk => {
      invalidate()
      toast({ title: 'Risque ajouté', description: `${risk.id} — ${risk.name}` })
    },
    onError: reportError("Ajout du risque")
  })

  const updateRisk = useMutation({
    mutationFn: ({ code, changes }: { code: string; changes: Partial<RiskInput> }) =>
      riskService.updateRisk(code, changes),
    onSuccess: risk => {
      invalidate()
      toast({ title: 'Risque mis à jour', description: `${risk.id} — indice ${risk.initialRisk}` })
    },
    onError: reportError('Mise à jour du risque')
  })

  const deleteRisk = useMutation({
    mutationFn: (code: string) => riskService.deleteRisk(code),
    onSuccess: (_data, code) => {
      invalidate()
      toast({ title: 'Risque supprimé', description: `${code} retiré du registre` })
    },
    onError: reportError('Suppression du risque')
  })

  const importRisks = useMutation({
    mutationFn: (inputs: RiskInput[]) => riskService.importRisks(inputs),
    onSuccess: count => {
      invalidate()
      toast({
        title: 'Import terminé',
        description: `${count} risque(s) ajouté(s) au registre`
      })
    },
    onError: reportError('Import des risques')
  })

  const resetDemoRegistry = useMutation({
    mutationFn: () => riskService.resetDemoRegistry(),
    onSuccess: () => {
      invalidate()
      toast({ title: 'Registre réinitialisé', description: 'Jeu de démonstration restauré' })
    },
    onError: reportError('Réinitialisation')
  })

  return { createRisk, updateRisk, deleteRisk, importRisks, resetDemoRegistry }
}
