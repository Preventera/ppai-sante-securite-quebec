
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Shield, ExternalLink } from "lucide-react";

interface AIConfigurationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApiKeySet: (apiKey: string) => void;
  currentApiKey?: string;
}

export function AIConfigurationModal({ 
  open, 
  onOpenChange, 
  onApiKeySet, 
  currentApiKey 
}: AIConfigurationModalProps) {
  const [apiKey, setApiKey] = useState(currentApiKey || '');
  const [isValid, setIsValid] = useState(false);

  const handleSave = () => {
    if (apiKey.trim()) {
      onApiKeySet(apiKey.trim());
      onOpenChange(false);
    }
  };

  const validateApiKey = (key: string) => {
    // Validation basique du format de clé OpenAI
    const isValidFormat = key.startsWith('sk-') && key.length > 40;
    setIsValid(isValidFormat);
    return isValidFormat;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            Configuration IA OpenAI
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <Shield className="w-4 h-4" />
            <AlertDescription>
              Votre clé API est stockée localement et utilisée uniquement pour générer vos programmes.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="apiKey">Clé API OpenAI *</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                validateApiKey(e.target.value);
              }}
              placeholder="sk-..."
              className={`${apiKey && !isValid ? 'border-red-500' : ''}`}
            />
            {apiKey && !isValid && (
              <p className="text-sm text-red-600">
                Format de clé invalide. La clé doit commencer par "sk-"
              </p>
            )}
          </div>

          <div className="bg-blue-50 p-3 rounded-lg text-sm">
            <p className="font-medium text-blue-800 mb-1">Comment obtenir votre clé API :</p>
            <ol className="list-decimal list-inside text-blue-700 space-y-1">
              <li>Créez un compte sur <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">platform.openai.com <ExternalLink className="w-3 h-3" /></a></li>
              <li>Naviguez vers "API Keys" dans votre dashboard</li>
              <li>Créez une nouvelle clé secrète</li>
              <li>Copiez-la ici (elle commence par "sk-")</li>
            </ol>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!apiKey || !isValid}
            >
              Configurer l'IA
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
