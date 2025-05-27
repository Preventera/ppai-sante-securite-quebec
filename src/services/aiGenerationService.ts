
interface ProgramGenerationParams {
  companyName: string;
  secteurScian: string;
  groupePrioritaire: number;
  nombreEmployes: number;
  activitesPrincipales: string;
  typeDocument: string;
  acteurResponsable: string;
  risquesIdentifies?: string[];
  cnessData?: any;
}

interface AIGenerationResponse {
  content: string;
  metadata: {
    secteur: string;
    groupe: number;
    conformite: boolean;
    referencesLegales: string[];
  };
}

export class AIGenerationService {
  private apiKey: string;
  
  constructor() {
    // Pour l'instant, nous utiliserons une clé temporaire ou localStorage
    // En production, cela devrait venir de variables d'environnement sécurisées
    this.apiKey = localStorage.getItem('openai_api_key') || '';
  }

  async generatePreventionProgram(params: ProgramGenerationParams): Promise<AIGenerationResponse> {
    if (!this.apiKey) {
      throw new Error('Clé API OpenAI requise. Veuillez la configurer dans les paramètres.');
    }

    const prompt = this.buildStructuredPrompt(params);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur API OpenAI: ${response.status}`);
      }

      const data = await response.json();
      const generatedContent = data.choices[0].message.content;

      return {
        content: generatedContent,
        metadata: {
          secteur: params.secteurScian,
          groupe: params.groupePrioritaire,
          conformite: this.validateBasicCompliance(generatedContent),
          referencesLegales: this.extractLegalReferences(generatedContent)
        }
      };
    } catch (error) {
      console.error('Erreur génération IA:', error);
      throw new Error('Impossible de générer le programme. Vérifiez votre connexion et votre clé API.');
    }
  }

  private getSystemPrompt(): string {
    return `Tu es PPAI, un expert en santé-sécurité au travail spécialisé dans les normes québécoises CNESST/LMRSST.

EXIGENCES OBLIGATOIRES basées sur la LSST :
1. Identification des principales sources de risques (Art. 59)
2. Mesures pour éliminer/contrôler les risques selon la hiérarchie de prévention (Art. 51)
3. Mesures pour garantir la durabilité des correctifs
4. Échéancier et modalités de réalisation avec responsables désignés
5. Mesures de surveillance et d'entretien
6. Formation et information des travailleurs
7. Identification des équipements de protection individuelle
8. Participation des travailleurs (comité SST)
9. Service de premiers soins
10. Surveillance de la santé des travailleurs

HIÉRARCHIE DE PRÉVENTION (Art. 51 LSST) :
1. Élimination du danger à la source
2. Substitution par quelque chose de moins dangereux
3. Contrôles techniques (ventilation, protection collective)
4. Mesures administratives (procédures, formation)
5. Équipements de protection individuelle (en dernier recours)

FORMAT REQUIS :
- Structure claire avec sections numérotées
- Mesures concrètes et applicables
- Références légales précises (LSST, RSST)
- Échéanciers réalistes avec responsables nommés
- Indicateurs de suivi mesurables

Génère UNIQUEMENT du contenu conforme aux exigences CNESST/LMRSST.`;
  }

  private buildStructuredPrompt(params: ProgramGenerationParams): string {
    let cnessContext = '';
    if (params.cnessData) {
      cnessContext = `\n📊 DONNÉES CNESST DISPONIBLES:
- Secteur d'activité avec statistiques d'incidents
- Agents causals spécifiques au secteur
- Mesures préventives recommandées avec efficacité prouvée
- Intégrer ces données dans les recommandations`;
    }

    return `Génère un ${params.typeDocument} complet pour :

**CONTEXTE ENTREPRISE :**
- Nom : ${params.companyName}
- Secteur SCIAN : ${params.secteurScian}
- Groupe prioritaire CNESST : ${params.groupePrioritaire}
- Nombre d'employés : ${params.nombreEmployes}
- Activités principales : ${params.activitesPrincipales}
- Acteur responsable : ${params.acteurResponsable}
${params.risquesIdentifies ? `- Risques identifiés : ${params.risquesIdentifies.join(', ')}` : ''}${cnessContext}

**SPÉCIFICITÉS SECTORIELLES :**
Adapte le contenu aux risques typiques du secteur ${params.secteurScian} et respecte les obligations du groupe ${params.groupePrioritaire} CNESST.

**STRUCTURE ATTENDUE :**
1. IDENTIFICATION DES PRINCIPALES SOURCES DE RISQUES
2. MESURES DE PRÉVENTION (hiérarchie Art. 51)
3. ÉCHÉANCIER ET RESPONSABILITÉS
4. FORMATION ET INFORMATION
5. ÉQUIPEMENTS DE PROTECTION
6. SURVEILLANCE ET ENTRETIEN
7. PARTICIPATION DES TRAVAILLEURS
8. PREMIERS SOINS
9. SURVEILLANCE MÉDICALE
10. RÉVISION ET MISE À JOUR

Génère un document professionnel, détaillé et conforme CNESST.`;
  }

  private validateBasicCompliance(content: string): boolean {
    const requiredElements = [
      'identification',
      'risques',
      'prévention',
      'mesures',
      'responsable',
      'échéancier',
      'formation',
      'surveillance'
    ];

    return requiredElements.every(element => 
      content.toLowerCase().includes(element)
    );
  }

  private extractLegalReferences(content: string): string[] {
    const references: string[] = [];
    const lsstRegex = /LSST\s+(Art\.|Article)\s*(\d+)/gi;
    const rsstRegex = /RSST\s+(Art\.|Article)\s*(\d+)/gi;
    
    let match;
    while ((match = lsstRegex.exec(content)) !== null) {
      references.push(`LSST Art. ${match[2]}`);
    }
    
    while ((match = rsstRegex.exec(content)) !== null) {
      references.push(`RSST Art. ${match[2]}`);
    }
    
    return [...new Set(references)]; // Éliminer les doublons
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    localStorage.setItem('openai_api_key', apiKey);
  }

  hasApiKey(): boolean {
    return !!this.apiKey;
  }
}
