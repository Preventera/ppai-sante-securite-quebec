
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, ExternalLink, Bot, CheckCircle } from "lucide-react";
import { AIProvider } from "@/services/aiGenerationService";

interface AIConfigurationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigSet: (config: { provider: AIProvider; apiKey: string }) => void;
  currentConfig?: { provider: AIProvider; apiKey: string };
}

export function AIConfigurationModal({ 
  open, 
  onOpenChange, 
  onConfigSet, 
  currentConfig 
}: AIConfigurationModalProps) {

  const handleConfirm = () => {
    // Configuration automatique pour Supabase
    onConfigSet({ 
      provider: 'claude', 
      apiKey: 'configured-in-supabase' 
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            Configuration IA - Supabase
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription>
              <strong>Félicitations !</strong> Votre IA Claude est déjà configurée via Supabase avec votre clé ANTHROPIC_API_KEY.
            </AlertDescription>
          </Alert>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">✅ Configuration Active</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• <strong>Modèle :</strong> Claude 3.5 Sonnet</li>
              <li>• <strong>Backend :</strong> Supabase Edge Function</li>
              <li>• <strong>Sécurité :</strong> Clé API protégée côté serveur</li>
              <li>• <strong>Conformité :</strong> Validation CNESST automatique</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg text-sm">
            <p className="font-medium text-blue-800 mb-1">Avantages Supabase :</p>
            <ul className="text-blue-700 space-y-1">
              <li>🔒 Clés API sécurisées (pas exposées dans le navigateur)</li>
              <li>⚡ Pas de problèmes CORS</li>
              <li>🎯 Optimisé pour les programmes CNESST</li>
              <li>📊 Intégration avec les données CNESST</li>
            </ul>
          </div>

          <div className="text-xs text-gray-500">
            <p>💡 <strong>Gestion des clés :</strong> Vos clés API sont stockées de manière sécurisée dans Supabase et ne sont jamais exposées dans le navigateur.</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
            <Button onClick={handleConfirm}>
              Confirmer la Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
