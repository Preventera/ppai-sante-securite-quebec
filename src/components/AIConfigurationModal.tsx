
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Key, Shield, ExternalLink, Bot } from "lucide-react";
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
  const [provider, setProvider] = useState<AIProvider>(currentConfig?.provider || 'openai');
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [isValid, setIsValid] = useState(false);

  const handleSave = () => {
    if (apiKey.trim() && isValid) {
      onConfigSet({ provider, apiKey: apiKey.trim() });
      onOpenChange(false);
    }
  };

  const validateApiKey = (key: string, selectedProvider: AIProvider) => {
    let isValidFormat = false;
    
    if (selectedProvider === 'openai') {
      isValidFormat = key.startsWith('sk-') && key.length > 40;
    } else if (selectedProvider === 'claude') {
      isValidFormat = key.startsWith('sk-ant-') && key.length > 50;
    }
    
    setIsValid(isValidFormat);
    return isValidFormat;
  };

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    setApiKey('');
    setIsValid(false);
  };

  const getProviderInfo = (provider: AIProvider) => {
    if (provider === 'openai') {
      return {
        name: "OpenAI GPT-4",
        url: "https://platform.openai.com",
        keyFormat: "sk-...",
        description: "Le modèle GPT-4 d'OpenAI, excellent pour la génération de texte structuré"
      };
    } else {
      return {
        name: "Claude 3.5 Sonnet",
        url: "https://console.anthropic.com",
        keyFormat: "sk-ant-...",
        description: "Le modèle Claude d'Anthropic, spécialisé dans l'analyse et la conformité"
      };
    }
  };

  const providerInfo = getProviderInfo(provider);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            Configuration IA
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
            <Label htmlFor="provider">Fournisseur IA *</Label>
            <Select value={provider} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    OpenAI GPT-4
                  </div>
                </SelectItem>
                <SelectItem value="claude">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Claude 3.5 Sonnet
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">Clé API {providerInfo.name} *</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                validateApiKey(e.target.value, provider);
              }}
              placeholder={providerInfo.keyFormat}
              className={`${apiKey && !isValid ? 'border-red-500' : ''}`}
            />
            {apiKey && !isValid && (
              <p className="text-sm text-red-600">
                Format de clé invalide. La clé doit commencer par "{providerInfo.keyFormat.split('...')[0]}"
              </p>
            )}
          </div>

          <div className="bg-blue-50 p-3 rounded-lg text-sm">
            <p className="font-medium text-blue-800 mb-1">Comment obtenir votre clé API {providerInfo.name} :</p>
            <p className="text-blue-700 mb-2">{providerInfo.description}</p>
            <ol className="list-decimal list-inside text-blue-700 space-y-1">
              <li>Créez un compte sur <a href={providerInfo.url} target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">{providerInfo.url.replace('https://', '')} <ExternalLink className="w-3 h-3" /></a></li>
              <li>Naviguez vers "API Keys" dans votre dashboard</li>
              <li>Créez une nouvelle clé secrète</li>
              <li>Copiez-la ici (elle commence par "{providerInfo.keyFormat.split('...')[0]}")</li>
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
              Configurer {providerInfo.name}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
