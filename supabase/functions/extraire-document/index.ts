import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Extraction de risques et de mesures depuis un document SST existant.
 *
 * POURQUOI CÔTÉ SERVEUR
 *   La clé Anthropic ne doit jamais atteindre le navigateur. Tout ce qui est
 *   préfixé VITE_ finit dans le bundle public ; la clé vit donc dans les
 *   secrets de cette fonction, comme pour `generate-prevention-program`.
 *
 * CE QUE LE MODÈLE DOIT PRODUIRE, ET CE QU'IL NE DOIT PAS
 *   Il relève ce que le document DIT. Il ne complète pas, ne déduit pas, et
 *   surtout n'invente pas trois choses :
 *
 *     1. La PROBABILITÉ d'occurrence. Le produit refuse depuis toujours de la
 *        dériver — les données ouvertes n'ont pas de dénominateur d'exposition.
 *        Un modèle qui « estime » une probabilité à partir d'une prose produit
 *        un chiffre sans fondement, qui finirait dans une matrice 5×5 présentée
 *        comme une analyse. Le champ n'est donc pas demandé.
 *     2. Les NUMÉROS D'ARTICLES. Le modèle peut en citer, mais chacun est
 *        revérifié côté client contre l'index des textes officiels. Ce qui ne
 *        résout pas est écarté, pas affiché.
 *     3. Le RATTACHEMENT à un niveau de prévention qu'il aurait imaginé : la
 *        hiérarchie a SIX niveaux depuis le RMPPÉ art. 6, et ils sont énoncés
 *        au prompt plutôt que laissés à sa mémoire — la présentation courante
 *        en cinq niveaux est celle qu'il a le plus vue à l'entraînement.
 *
 * L'ANCRAGE EST OBLIGATOIRE
 *   Chaque élément extrait porte la page et la phrase du document d'où il
 *   vient. Sans ça, l'utilisateur ne peut pas vérifier, et une extraction
 *   invérifiable ne vaut pas mieux qu'une saisie à la main.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParametresExtraction {
  /** PDF encodé en base64, sans préfixe `data:`. */
  pdfBase64: string;
  nomDocument: string;
  /** Type déclaré par l'utilisateur : il oriente la lecture, sans la contraindre. */
  typeDocument?: string;
}

/** Les six niveaux du RMPPÉ art. 6, énoncés plutôt que supposés connus. */
const HIERARCHIE = [
  "1. l'élimination du risque à la source",
  '2. le remplacement de matériaux, de processus ou d’équipements afin de réduire le risque',
  "3. la mise en place de mesures de contrôle technique du risque",
  "4. la mise en place de signaux permettant de mettre en évidence le risque",
  "5. la mise en place de mesures de contrôle administratif du risque",
  "6. la mise en place de moyens et d’équipements de protection individuels ou collectifs",
];

const PROMPT_SYSTEME = `Tu analyses un document de santé et sécurité du travail québécois (programme de prévention, analyse de risques, rapport d'audit ou d'inspection) pour en extraire les risques et les mesures qu'il DÉCRIT.

RÈGLE CARDINALE — TU RELÈVES, TU N'INVENTES PAS
Tout élément que tu produis doit se trouver dans le document. Si le document ne dit rien sur un point, laisse le champ vide plutôt que de le combler. Une extraction incomplète est utilisable ; une extraction inventée ne l'est pas.

CE QUE TU NE DOIS JAMAIS PRODUIRE
- Une PROBABILITÉ d'occurrence. Même si le document contient une cote, ne la transpose pas : elle sera saisie par l'employeur, qui répond de son établissement.
- Un numéro d'article dont tu n'es pas certain. Chaque numéro que tu cites sera revérifié contre le texte officiel ; un numéro faux sera écarté et desservira l'extraction entière. En cas de doute, nomme l'instrument sans l'article.

LA HIÉRARCHIE DES MESURES COMPTE SIX NIVEAUX
Le Règlement sur les mécanismes de prévention et de participation en établissement (RMPPÉ, art. 6) les énonce ainsi :
${HIERARCHIE.join('\n')}

Attention : la présentation courante en CINQ niveaux fusionne la signalisation du risque avec le contrôle administratif. Elle est dépassée. Range chaque mesure sur l'un des six niveaux ci-dessus, en te fondant sur ce que la mesure fait, pas sur le vocabulaire employé.

ANCRAGE OBLIGATOIRE
Chaque élément extrait porte "page" et "extrait" : le numéro de page et la phrase exacte du document qui le fonde. L'extrait est cité verbatim, sans reformulation. Un élément sans ancrage sera rejeté.

FORMAT DE RÉPONSE — uniquement ce JSON, sans texte autour :

{
  "risques": [
    {
      "nom": "libellé du risque tel que le document le nomme",
      "categorie": "Chimique|Physique|Biologique|Ergonomique|Psychosocial|Mécanique|Électrique|Chute|Autre",
      "phase": "phase ou secteur d'activité si le document en nomme un, sinon vide",
      "gravite": 1,
      "gravitePresente": true,
      "responsable": "fonction désignée par le document, sinon vide",
      "page": 12,
      "extrait": "phrase exacte du document"
    }
  ],
  "mesures": [
    {
      "risque": "nom du risque auquel elle se rattache, identique au champ nom ci-dessus",
      "libelle": "la mesure telle que décrite",
      "niveau": 3,
      "instrument": "LSST|RSST|CSTC|RMPPÉ ou vide",
      "articles": ["141.3"],
      "page": 14,
      "extrait": "phrase exacte du document"
    }
  ],
  "avertissements": ["ce que tu n'as pas pu établir, en une phrase chacun"]
}

PRÉCISIONS SUR LES CHAMPS
- "gravite" : de 1 (négligeable) à 5 (catastrophique), UNIQUEMENT si le document l'énonce ou la cote. Sinon mets 0 et "gravitePresente": false.
- "articles" : liste de numéros nus, sans le sigle ni le mot « article ». Vide si tu n'es pas certain.
- "niveau" : entier de 1 à 6, selon la hiérarchie ci-dessus.
- "avertissements" : signale ici ce que le document laisse dans l'ombre — un risque nommé sans mesure, une mesure sans responsable, une section illisible.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY non configurée');
    }

    const params: ParametresExtraction = await req.json();
    if (!params?.pdfBase64 || !params?.nomDocument) {
      return new Response(
        JSON.stringify({ error: 'pdfBase64 et nomDocument sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const contexte = params.typeDocument
      ? `Le document est déclaré de type « ${params.typeDocument} ». Cette indication oriente ta lecture ; elle ne la contraint pas.`
      : 'Le type du document n’a pas été déclaré : détermine-le à la lecture.';

    const reponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-sonnet-5',
        max_tokens: 8000,
        system: PROMPT_SYSTEME,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: { type: 'base64', media_type: 'application/pdf', data: params.pdfBase64 },
              },
              {
                type: 'text',
                text: `${contexte}\n\nExtrais les risques et les mesures de « ${params.nomDocument} ». Réponds uniquement par le JSON demandé.`,
              },
            ],
          },
        ],
      }),
    });

    if (!reponse.ok) {
      const detail = await reponse.text();
      throw new Error(`Anthropic a répondu ${reponse.status} : ${detail.slice(0, 400)}`);
    }

    const data = await reponse.json();
    const texte: string = data?.content?.[0]?.text ?? '';

    // Le modèle encadre parfois le JSON d'une clôture Markdown malgré la
    // consigne. On la retire plutôt que d'échouer sur un détail de forme.
    const nettoye = texte.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

    let extraction: unknown;
    try {
      extraction = JSON.parse(nettoye);
    } catch {
      return new Response(
        JSON.stringify({
          error: "La réponse du modèle n'est pas du JSON exploitable.",
          apercu: nettoye.slice(0, 500),
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        extraction,
        metadonnees: {
          document: params.nomDocument,
          modele: data?.model ?? 'claude',
          extraitLe: new Date().toISOString(),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (erreur) {
    return new Response(
      JSON.stringify({
        error: erreur instanceof Error ? erreur.message : String(erreur),
        details: 'Vérifiez que ANTHROPIC_API_KEY est configurée dans les secrets de la fonction.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
