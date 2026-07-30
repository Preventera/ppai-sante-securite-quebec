
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  customPrompt?: string;
  /**
   * Synthèse formatée du registre des risques, envoyée par le client.
   * Ce champ était absent de l'interface : la synthèse était transmise puis
   * silencieusement ignorée, si bien que le programme généré ne tenait aucun
   * compte du registre.
   */
  registryRisks?: string;
  /** Décomptes du registre, réémis dans les métadonnées pour l'affichage client. */
  risksAnalyzed?: number;
  criticalRisksCount?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY non configurée');
    }

    const params: ProgramGenerationParams = await req.json();
    
    // Construction du prompt système pour Claude
    const systemPrompt = `Tu es PPAI, un expert en santé-sécurité au travail spécialisé dans les normes québécoises CNESST/LMRSST.

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

    // Construction du prompt utilisateur
    let userPrompt = '';
    
    // Le registre des risques prime sur les données génériques : il décrit la
    // situation réelle de l'établissement et doit piloter les priorités.
    const registryContext = params.registryRisks?.trim()
      ? `\n${params.registryRisks}\n`
      : '';

    if (params.customPrompt) {
      // Si un prompt personnalisé est fourni (du générateur intelligent)
      userPrompt = `${params.customPrompt}${registryContext}`;
    } else {
      // Construction automatique pour le générateur de prototypes
      let cnessContext = '';
      if (params.cnessData) {
        cnessContext = `\n📊 DONNÉES CNESST DISPONIBLES:
- Secteur d'activité avec statistiques d'incidents
- Agents causals spécifiques au secteur
- Mesures préventives recommandées avec efficacité prouvée
- Intégrer ces données dans les recommandations`;
      }

      userPrompt = `Génère un ${params.typeDocument} complet pour :

**CONTEXTE ENTREPRISE :**
- Nom : ${params.companyName}
- Secteur SCIAN : ${params.secteurScian}
- Document exigé : ${params.nombreEmployes >= 20 ? 'Programme de prévention (20 travailleurs et plus)' : "Plan d'action (19 travailleurs et moins)"}
- Nombre d'employés : ${params.nombreEmployes}
- Activités principales : ${params.activitesPrincipales}
- Acteur responsable : ${params.acteurResponsable}
${params.risquesIdentifies ? `- Risques identifiés : ${params.risquesIdentifies.join(', ')}` : ''}${cnessContext}${registryContext}

**SPÉCIFICITÉS SECTORIELLES :**
Adapte le contenu aux risques typiques du secteur ${params.secteurScian}.
Le régime applicable découle de l'effectif de l'établissement (Règlement sur les
mécanismes de prévention et de participation en établissement, en vigueur le
1er octobre 2025) : programme de prévention à partir de 20 travailleurs, plan
d'action en deçà. N'emploie PAS la notion de « groupe prioritaire », qui relève
du régime antérieur.

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

    console.log('Génération avec Claude pour:', params.companyName);

    // Appel à l'API Claude
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        // Surchargeable via le secret ANTHROPIC_MODEL sans redéploiement du code.
        model: Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-sonnet-5',
        max_tokens: 4000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erreur API Claude:', response.status, errorData);
      throw new Error(`Erreur API Claude: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.content[0].text;

    // Validation basique de conformité
    const validateBasicCompliance = (content: string): boolean => {
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
    };

    // Extraction des références légales
    const extractLegalReferences = (content: string): string[] => {
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
      
      return [...new Set(references)];
    };

    const isCompliant = validateBasicCompliance(generatedContent);
    const legalRefs = extractLegalReferences(generatedContent);

    const result = {
      content: generatedContent,
      metadata: {
        secteur: params.secteurScian,
        groupe: params.groupePrioritaire,
        conformite: isCompliant,
        referencesLegales: legalRefs,
        generatedAt: new Date().toISOString(),
        model: data.model ?? 'claude',
        source: 'claude',
        tokens: data.usage?.output_tokens || 0,
        risksAnalyzed: params.risksAnalyzed ?? 0,
        criticalRisksCount: params.criticalRisksCount ?? 0
      }
    };

    console.log('Programme généré avec succès, conformité:', isCompliant);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erreur dans generate-prevention-program:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      details: 'Vérifiez que ANTHROPIC_API_KEY est correctement configurée'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
