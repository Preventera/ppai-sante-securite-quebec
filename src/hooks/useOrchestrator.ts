import { useState, useCallback, useRef, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Chargement paresseux de l'orchestrateur : un `await` au niveau module n'est pas
// supporté par la cible de build et faisait échouer `npm run build`.
let ppaiOrchestrator: any = null
let orchestratorLoaded = false

async function loadOrchestrator(): Promise<any | null> {
  if (orchestratorLoaded) return ppaiOrchestrator

  try {
    const orchestratorModule = await import('@/agentic/orchestrator/PPAIOrchestrator')
    ppaiOrchestrator = orchestratorModule.ppaiOrchestrator ?? null
  } catch (error) {
    console.warn('Orchestrateur PPAI non disponible, mode fallback activé:', error)
    ppaiOrchestrator = null
  }

  orchestratorLoaded = true
  return ppaiOrchestrator
}

// Vrai uniquement une fois le chargement tenté et l'orchestrateur indisponible
const isFallbackMode = () => orchestratorLoaded && !ppaiOrchestrator

// Types pour le hook
export interface OrchestratorState {
  isExecuting: boolean
  currentStep: string | null
  progress: number
  executionId: string | null
  results: any
  error: string | null
}

export interface ExecuteWorkflowParams {
  workflowId: string
  inputData: any
  onProgress?: (step: string, progress: number) => void
  onStepComplete?: (step: string, result: any) => void
}

export interface UseOrchestratorReturn {
  // État de l'orchestrateur
  state: OrchestratorState
  
  // Actions principales
  executeWorkflow: (params: ExecuteWorkflowParams) => Promise<any>
  cancelExecution: () => void
  resetState: () => void
  
  // Données des requêtes
  executionHistory: any[]
  performanceMetrics: any
  
  // États des requêtes
  isLoadingHistory: boolean
  isLoadingMetrics: boolean
  
  // Méthodes utilitaires
  getWorkflowStatus: (executionId: string) => Promise<any | null>
  retryExecution: (executionId: string) => Promise<any>
}

// Données de simulation pour le mode fallback
const MOCK_EXECUTION_HISTORY = [
  {
    id: 'mock-1',
    agent_name: 'program_generator',
    workflow_id: 'generate_prevention_program',
    execution_status: 'completed',
    execution_time_ms: 15000,
    created_at: new Date().toISOString(),
    input_data: { sector: 'construction' },
    output_data: { program_generated: true }
  },
  {
    id: 'mock-2',
    agent_name: 'risk_analyzer',
    workflow_id: 'analyze_workplace_risks',
    execution_status: 'completed',
    execution_time_ms: 12000,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    input_data: { establishment_id: 'test' },
    output_data: { risks_identified: 5 }
  }
]

const MOCK_PERFORMANCE_METRICS = {
  total_executions: 47,
  success_rate: 94.7,
  average_execution_time: 13500,
  agent_usage: {
    program_generator: 25,
    risk_analyzer: 15,
    inspection_agent: 7
  }
}

/**
 * Hook principal pour utiliser l'orchestrateur PPAI
 * Gère l'état, l'exécution des workflows et l'intégration avec React Query
 * Fonctionne en mode dégradé si Supabase n'est pas accessible
 */
export function useOrchestrator(): UseOrchestratorReturn {
  const queryClient = useQueryClient()
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // État local de l'orchestrateur
  const [state, setState] = useState<OrchestratorState>({
    isExecuting: false,
    currentStep: null,
    progress: 0,
    executionId: null,
    results: null,
    error: null
  })

  // Requête pour l'historique des exécutions (avec fallback)
  const {
    data: executionHistory = [],
    isLoading: isLoadingHistory,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['orchestrator', 'history'],
    queryFn: async () => {
      const orchestrator = await loadOrchestrator()
      if (!orchestrator) {
        // Simulation d'une requête
        await new Promise(resolve => setTimeout(resolve, 300))
        return MOCK_EXECUTION_HISTORY
      }
      return orchestrator.getExecutionHistory(20)
    },
    refetchInterval: () => (isFallbackMode() ? false : 30000),
    staleTime: 10000,
    retry: false,
    enabled: true
  })

  // Requête pour les métriques de performance (avec fallback)
  const {
    data: performanceMetrics,
    isLoading: isLoadingMetrics
  } = useQuery({
    queryKey: ['orchestrator', 'metrics'],
    queryFn: async () => {
      const orchestrator = await loadOrchestrator()
      if (!orchestrator) {
        // Simulation d'une requête
        await new Promise(resolve => setTimeout(resolve, 500))
        return MOCK_PERFORMANCE_METRICS
      }
      return orchestrator.getPerformanceMetrics()
    },
    refetchInterval: () => (isFallbackMode() ? false : 60000),
    staleTime: 30000,
    retry: false,
    enabled: true
  })

  // Simulateur d'orchestration pour le mode fallback
  const simulateOrchestration = useCallback(async (
    workflowId: string, 
    inputData: any, 
    callbacks: any
  ) => {
    const steps = [
      { agent: 'orchestrator', action: 'analyze_request_and_delegate' },
      { agent: 'program_generator', action: 'generate_prevention_program' },
      { agent: 'risk_analyzer', action: 'identify_priority_risks' },
      { agent: 'orchestrator', action: 'final_review_and_delivery' }
    ]

    let progress = 0

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      
      // Callback de début d'étape
      callbacks.onStepStart?.(step)
      
      // Simulation du travail
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))
      
      progress += 25
      setState(prev => ({
        ...prev,
        currentStep: `${step.agent}: ${step.action}`,
        progress: Math.min(progress, 95)
      }))

      // Résultat simulé
      const stepResult = {
        step_id: i + 1,
        agent: step.agent,
        action: step.action,
        success: true,
        output: `Résultat simulé pour ${step.action}`,
        timestamp: new Date().toISOString()
      }

      // Callback de fin d'étape
      callbacks.onStepComplete?.(step, stepResult)
    }

    // Résultat final
    return {
      execution_id: `sim-${Date.now()}`,
      workflow_id: workflowId,
      status: 'completed',
      input_data: inputData,
      output_data: {
        program_generated: true,
        risks_analyzed: true,
        compliance_verified: true,
        document_url: `https://ppai-demo.com/programs/${Date.now()}.pdf`,
        metadata: {
          sector: inputData.sector || 'construction',
          actor: inputData.responsible_actor || 'CoSS',
          generated_at: new Date().toISOString(),
          mode: 'simulation'
        }
      },
      execution_time_ms: 8000 + Math.random() * 7000,
      created_at: new Date().toISOString()
    }
  }, [])

  // Mutation pour l'exécution des workflows
  const executeWorkflowMutation = useMutation({
    mutationFn: async ({ workflowId, inputData, onProgress, onStepComplete }: ExecuteWorkflowParams) => {
      // Créer un nouveau AbortController pour cette exécution
      abortControllerRef.current = new AbortController()
      
      setState(prev => ({
        ...prev,
        isExecuting: true,
        currentStep: 'Initialisation...',
        progress: 0,
        error: null
      }))

      try {
        let result: any
        const orchestrator = await loadOrchestrator()

        if (!orchestrator) {
          // Mode simulation
          console.log('🔄 Mode simulation PPAI activé')
          result = await simulateOrchestration(workflowId, inputData, {
            onStepStart: (step: any) => {
              setState(prev => ({
                ...prev,
                currentStep: `${step.agent}: ${step.action}`,
                progress: Math.min(prev.progress + 20, 90)
              }))
              onProgress?.(step.action, Math.min(state.progress + 20, 90))
            },
            onStepComplete: (step: any, stepResult: any) => {
              setState(prev => ({
                ...prev,
                progress: Math.min(prev.progress + 10, 95)
              }))
              onStepComplete?.(step.action, stepResult)
            }
          })
        } else {
          // Mode orchestrateur réel
          result = await orchestrator.executeWorkflow(workflowId, inputData, {
            onStepStart: (step: any) => {
              setState(prev => ({
                ...prev,
                currentStep: `${step.agent}: ${step.action}`,
                progress: Math.min(prev.progress + 20, 90)
              }))
              onProgress?.(step.action, Math.min(state.progress + 20, 90))
            },
            
            onStepComplete: (step: any, stepResult: any) => {
              setState(prev => ({
                ...prev,
                progress: Math.min(prev.progress + 10, 95)
              }))
              onStepComplete?.(step.action, stepResult)
            },
            
            onError: (error: Error) => {
              setState(prev => ({
                ...prev,
                error: error.message,
                isExecuting: false
              }))
            }
          })
        }

        setState(prev => ({
          ...prev,
          isExecuting: false,
          currentStep: 'Terminé',
          progress: 100,
          results: result,
          executionId: result.execution_id
        }))

        // Invalider et actualiser les caches
        queryClient.invalidateQueries({ queryKey: ['orchestrator'] })
        
        return result

      } catch (error) {
        setState(prev => ({
          ...prev,
          isExecuting: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        }))
        throw error
      }
    },
    onSuccess: () => {
      // Actualiser l'historique après une exécution réussie
      if (!isFallbackMode()) {
        refetchHistory()
      }
    }
  })

  // Actions principales
  const executeWorkflow = useCallback(async (params: ExecuteWorkflowParams) => {
    return executeWorkflowMutation.mutateAsync(params)
  }, [executeWorkflowMutation])

  const cancelExecution = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setState(prev => ({
      ...prev,
      isExecuting: false,
      currentStep: 'Annulé',
      error: 'Exécution annulée par l\'utilisateur'
    }))
  }, [])

  const resetState = useCallback(() => {
    setState({
      isExecuting: false,
      currentStep: null,
      progress: 0,
      executionId: null,
      results: null,
      error: null
    })
  }, [])

  // Méthodes utilitaires
  const getWorkflowStatus = useCallback(async (executionId: string) => {
    try {
      const orchestrator = await loadOrchestrator()
      if (!orchestrator) {
        return MOCK_EXECUTION_HISTORY.find(exec => exec.id === executionId) || null
      }
      const history = await orchestrator.getExecutionHistory(100)
      return history.find((exec: any) => exec.id === executionId) || null
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error)
      return null
    }
  }, [])

  const retryExecution = useCallback(async (executionId: string) => {
    const execution = await getWorkflowStatus(executionId)
    if (!execution) {
      throw new Error('Exécution non trouvée')
    }

    // Re-exécuter avec les mêmes paramètres
    return executeWorkflow({
      workflowId: execution.workflow_id || 'default',
      inputData: execution.input_data
    })
  }, [getWorkflowStatus, executeWorkflow])

  return {
    // État
    state,
    
    // Actions
    executeWorkflow,
    cancelExecution,
    resetState,
    
    // Données
    executionHistory: executionHistory || [],
    performanceMetrics: performanceMetrics || MOCK_PERFORMANCE_METRICS,
    
    // États de chargement
    isLoadingHistory,
    isLoadingMetrics,
    
    // Utilitaires
    getWorkflowStatus,
    retryExecution
  }
}

// Hook pour les workflows spécialisés
export function useWorkflow(workflowId: string) {
  const orchestrator = useOrchestrator()
  
  const execute = useCallback(
    (inputData: any, options?: Omit<ExecuteWorkflowParams, 'workflowId' | 'inputData'>) => {
      return orchestrator.executeWorkflow({
        workflowId,
        inputData,
        ...options
      })
    },
    [orchestrator.executeWorkflow, workflowId]
  )

  return {
    ...orchestrator,
    execute
  }
}

// Hooks spécialisés pour chaque workflow PPAI
export const useProgramGeneration = () => useWorkflow('generate_prevention_program')
export const useRiskAnalysis = () => useWorkflow('analyze_workplace_risks') 
export const useInspectionPlanning = () => useWorkflow('plan_safety_inspection')
export const useTrainingManagement = () => useWorkflow('manage_safety_training')
export const useIncidentAnalysis = () => useWorkflow('analyze_incident_data')

// Hook pour le monitoring en temps réel
export function useOrchestratorMonitoring() {
  const { performanceMetrics, executionHistory, isLoadingMetrics } = useOrchestrator()
  
  // Calculer des statistiques en temps réel
  const stats = useMemo(() => {
    if (!performanceMetrics || !executionHistory) return null
    
    return {
      totalExecutions: performanceMetrics.total_executions || 0,
      successRate: performanceMetrics.success_rate || 0,
      averageTime: performanceMetrics.average_execution_time || 0,
      activeExecutions: executionHistory.filter((e: any) => e.execution_status === 'running').length,
      recentFailures: executionHistory.filter((e: any) => 
        e.execution_status === 'failed' && 
        new Date(e.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
      ).length
    }
  }, [performanceMetrics, executionHistory])

  return {
    stats,
    isLoading: isLoadingMetrics,
    performanceMetrics,
    executionHistory
  }
}