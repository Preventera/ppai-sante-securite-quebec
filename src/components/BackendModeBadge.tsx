import { Badge } from '@/components/ui/badge'
import { Cloud, HardDrive, Loader2 } from 'lucide-react'
import { useBackendMode } from '@/hooks/useRisks'

/**
 * Indique la provenance des données affichées.
 *
 * En démonstration, l'application est pleinement fonctionnelle : les données
 * sont persistées localement dans le navigateur. En mode « live », elles
 * proviennent de Supabase.
 */
export function BackendModeBadge({ className = '' }: { className?: string }) {
  const { data: mode, isLoading } = useBackendMode()

  if (isLoading || !mode) {
    return (
      <Badge variant="outline" className={`gap-1 font-normal ${className}`}>
        <Loader2 className="w-3 h-3 animate-spin" />
        Vérification du backend…
      </Badge>
    )
  }

  if (mode === 'live') {
    return (
      <Badge
        variant="outline"
        className={`gap-1 font-normal border-green-300 bg-green-50 text-green-800 ${className}`}
        title="Les données proviennent de Supabase"
      >
        <Cloud className="w-3 h-3" />
        Supabase connecté
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className={`gap-1 font-normal border-amber-300 bg-amber-50 text-amber-800 ${className}`}
      title="Backend non joignable — données persistées localement dans ce navigateur"
    >
      <HardDrive className="w-3 h-3" />
      Mode démonstration
    </Badge>
  )
}
