import { Risk } from '@/types/risk'
import { determinerRegime, echeanceMiseEnApplication, echeanceTransmission } from '@/lib/lmrsst'

/**
 * Générateur de programme de prévention entièrement local et déterministe.
 *
 * Il sert de repli lorsque l'Edge Function Claude n'est pas joignable (clé API
 * absente, backend hors ligne, démonstration sans réseau). Le document produit
 * couvre les dix exigences de la LSST et s'appuie sur les risques réels du
 * registre : ce n'est pas un texte factice, mais une composition des données
 * saisies selon la structure réglementaire attendue.
 *
 * Aucun aléa n'est utilisé : deux exécutions sur les mêmes données produisent
 * exactement le même document.
 */

export interface LocalProgramParams {
  companyName: string
  secteurScian: string
  groupePrioritaire: number
  nombreEmployes: number
  activitesPrincipales: string
  typeDocument: string
  acteurResponsable: string
  risks: Risk[]
}

/** Niveaux de la hiérarchie de prévention (LSST art. 51, al. 1 à 5). */
const HIERARCHY = [
  "Élimination du danger à la source",
  "Substitution par un procédé ou produit moins dangereux",
  "Contrôles techniques (protection collective, ventilation, encoffrement)",
  "Mesures administratives (procédures, permis, formation, signalisation)",
  "Équipements de protection individuelle, en dernier recours"
] as const

const formatDate = (date: Date) => date.toISOString().slice(0, 10)

const addMonths = (months: number) => {
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  return formatDate(date)
}

/** Délai de correction : plus l'indice est élevé, plus l'échéance est courte. */
const deadlineFor = (initialRisk: number) => {
  if (initialRisk >= 15) return addMonths(1)
  if (initialRisk >= 10) return addMonths(3)
  return addMonths(6)
}

const priorityLabel = (initialRisk: number) => {
  if (initialRisk >= 15) return 'Priorité 1 — critique'
  if (initialRisk >= 10) return 'Priorité 2 — élevée'
  if (initialRisk >= 5) return 'Priorité 3 — modérée'
  return 'Priorité 4 — faible'
}

/** Niveau de la hiérarchie déduit du vocabulaire des mesures déclarées. */
const hierarchyLevelFor = (measures: string): string => {
  const text = measures.toLowerCase()
  if (/élimin|supprim|retrait|neutralis/.test(text)) return HIERARCHY[0]
  if (/substitu|remplac/.test(text)) return HIERARCHY[1]
  if (/garde-corps|ventilation|captage|étaie|blindage|encoffr|carter|disjoncteur|détection/.test(text)) {
    return HIERARCHY[2]
  }
  if (/procédure|permis|formation|balisage|signal|inspection|plan de|rotation|certifi/.test(text)) {
    return HIERARCHY[3]
  }
  if (/harnais|apr|epi|masque|casque|gant|protection individuelle/.test(text)) return HIERARCHY[4]
  return HIERARCHY[3]
}

export function generateLocalPreventionProgram(params: LocalProgramParams): string {
  const { risks } = params
  const today = formatDate(new Date())

  const sorted = [...risks].sort((a, b) => b.initialRisk - a.initialRisk)
  const critical = sorted.filter(risk => risk.initialRisk >= 15)
  const moderate = sorted.filter(risk => risk.initialRisk >= 10 && risk.initialRisk < 15)
  const low = sorted.filter(risk => risk.initialRisk < 10)

  const totalInitial = sorted.reduce((sum, risk) => sum + risk.initialRisk, 0)
  const totalResidual = sorted.reduce((sum, risk) => sum + risk.residualRisk, 0)
  const reduction =
    totalInitial > 0 ? Math.round(((totalInitial - totalResidual) / totalInitial) * 100) : 0

  const categories = [...new Set(sorted.map(risk => risk.category).filter(Boolean))]
  const owners = [...new Set(sorted.map(risk => risk.responsible).filter(Boolean))]
  const missingOwner = sorted.filter(risk => !risk.responsible.trim())
  const missingMeasures = sorted.filter(risk => !risk.measures.trim())

  const riskLine = (risk: Risk) =>
    `| ${risk.id} | ${risk.name} | ${risk.phase || '—'} | ${risk.category || '—'} | ${risk.probability} | ${risk.gravity} | **${risk.initialRisk}** | ${risk.residualRisk} | ${risk.responsible || '_à désigner_'} |`

  const riskTable = (subset: Risk[]) =>
    subset.length === 0
      ? '_Aucun risque dans cette catégorie._\n'
      : [
          '| Code | Description | Phase | Catégorie | P | G | Indice | Résiduel | Responsable |',
          '|---|---|---|---|---|---|---|---|---|',
          ...subset.map(riskLine)
        ].join('\n') + '\n'

  // Les lignes de contexte non renseignées sont omises plutôt qu'affichées vides.
  const contextRow = (label: string, value: string | number) => {
    const text = typeof value === 'number' ? (value > 0 ? String(value) : '') : value.trim()
    return text ? [`| ${label} | ${text} |`] : []
  }

  // Le document exigé découle de l'effectif, non plus du « groupe prioritaire »
  // du régime antérieur (Règlement sur les mécanismes de prévention et de
  // participation en établissement, en vigueur le 1er octobre 2025).
  const regime = determinerRegime(params.nombreEmployes)

  const contextTable = [
    ...contextRow('Entreprise', params.companyName),
    ...contextRow('Secteur SCIAN', params.secteurScian),
    ...contextRow('Nombre de travailleurs', params.nombreEmployes),
    ...contextRow('Document exigé (LMRSST)', regime.libelle),
    ...contextRow('Activités principales', params.activitesPrincipales),
    ...contextRow('Responsable du programme', params.acteurResponsable),
    ...contextRow('Risques au registre', sorted.length)
  ].join('\n')

  return `# ${params.typeDocument} — ${params.companyName}

> Document généré le ${today} par PPAI (moteur local déterministe).
> Conforme aux exigences de la Loi sur la santé et la sécurité du travail (RLRQ c. S-2.1)
> et du Règlement sur la santé et la sécurité du travail (S-2.1, r. 13).

## Contexte de l'établissement

| Élément | Valeur |
|---|---|
${contextTable}

**Synthèse du niveau de risque** — indice initial cumulé ${totalInitial}, indice résiduel cumulé ${totalResidual}, soit une réduction attendue de **${reduction} %** grâce aux mesures prévues.

**Régime applicable** — ${regime.justification} Le document doit être élaboré et mis en application dans un délai de ${regime.delaiMiseEnApplicationMois} mois, soit au plus tard le ${echeanceMiseEnApplication()}. Les priorités d'action, l'état d'avancement des mesures et le suivi des mesures en place sont transmis à la CNESST tous les ${regime.periodiciteTransmissionAnnees} ans, prochaine échéance le ${echeanceTransmission()}.

---

## 1. Identification des principales sources de risques (LSST art. 59)

L'identification s'appuie sur le registre des risques de l'établissement, qui recense **${sorted.length} risques** répartis sur ${categories.length} catégorie(s) : ${categories.join(', ') || 'non catégorisés'}.

### 1.1 Risques critiques — indice ≥ 15 (${critical.length})

${riskTable(critical)}
### 1.2 Risques modérés — indice de 10 à 14 (${moderate.length})

${riskTable(moderate)}
### 1.3 Risques faibles — indice < 10 (${low.length})

${riskTable(low)}
---

## 2. Mesures de prévention selon la hiérarchie (LSST art. 51)

Chaque mesure est rattachée au niveau de la hiérarchie de prévention qu'elle met en œuvre. Les niveaux supérieurs sont privilégiés ; l'équipement de protection individuelle n'intervient qu'en dernier recours.

${HIERARCHY.map((level, index) => `${index + 1}. ${level}`).join('\n')}

${sorted.length === 0
    ? '_Aucun risque au registre : aucune mesure à documenter._\n'
    : sorted
        .map(
          risk =>
            `### ${risk.id} — ${risk.name}\n\n` +
            `- **Indice initial** : ${risk.probability} × ${risk.gravity} = ${risk.initialRisk} (${priorityLabel(risk.initialRisk)})\n` +
            `- **Niveau de la hiérarchie visé** : ${hierarchyLevelFor(risk.measures)}\n` +
            `- **Mesures retenues** : ${risk.measures || '_À définir — aucune mesure documentée à ce jour._'}\n` +
            `- **Indice résiduel attendu** : ${risk.residualRisk}\n` +
            `- **Statut actuel** : ${risk.status}\n`
        )
        .join('\n')}
---

## 3. Échéancier et responsabilités

Les échéances sont calculées selon la criticité : un mois pour les risques d'indice ≥ 15, trois mois de 10 à 14, six mois en dessous.

${sorted.length === 0
    ? '_Aucune action planifiée._\n'
    : [
        '| Code | Action | Responsable | Échéance | Priorité |',
        '|---|---|---|---|---|',
        ...sorted.map(
          risk =>
            `| ${risk.id} | ${risk.measures ? 'Mettre en œuvre et vérifier les mesures' : 'Définir les mesures de prévention'} | ${risk.responsible || '_à désigner_'} | ${deadlineFor(risk.initialRisk)} | ${priorityLabel(risk.initialRisk)} |`
        )
      ].join('\n') + '\n'}
${missingOwner.length > 0
    ? `\n> ⚠️ **Écart de conformité** : ${missingOwner.length} risque(s) sans responsable désigné (${missingOwner.map(r => r.id).join(', ')}). La désignation est requise avant l'approbation du programme.\n`
    : ''}${missingMeasures.length > 0
    ? `\n> ⚠️ **Écart de conformité** : ${missingMeasures.length} risque(s) sans mesure documentée (${missingMeasures.map(r => r.id).join(', ')}).\n`
    : ''}
---

## 4. Mesures assurant la durabilité des correctifs

- Inscription de chaque correctif au registre des risques avec son indice résiduel.
- Vérification de l'efficacité des mesures lors des inspections planifiées.
- Révision de l'indice de risque après chaque modification des procédés ou des équipements.
- Traçabilité des correctifs : date, responsable, résultat de la vérification.

---

## 5. Formation et information des travailleurs (LSST art. 51, al. 9)

Programme de formation établi à partir des catégories de risques présentes dans l'établissement :

${categories.length === 0
    ? '_Aucune catégorie de risque enregistrée._'
    : categories
        .map(category => {
          const related = sorted.filter(risk => risk.category === category)
          const maxIndex = Math.max(...related.map(risk => risk.initialRisk))
          return `- **${category}** — ${related.length} risque(s), indice maximal ${maxIndex}. Formation obligatoire à l'accueil puis rappel annuel.`
        })
        .join('\n')}

Toute nouvelle affectation, tout nouveau procédé et toute modification d'équipement déclenchent une information préalable du travailleur concerné.

---

## 6. Équipements de protection individuelle

Les EPI complètent les mesures collectives sans les remplacer. Les besoins découlent directement des mesures inscrites au registre :

${sorted.filter(risk => /harnais|apr|masque|casque|gant|protection individuelle|epi|visibilité/i.test(risk.measures)).length === 0
    ? '_Aucun EPI spécifique identifié dans les mesures du registre ; les EPI de base du chantier demeurent obligatoires._'
    : sorted
        .filter(risk => /harnais|apr|masque|casque|gant|protection individuelle|epi|visibilité/i.test(risk.measures))
        .map(risk => `- **${risk.id}** — ${risk.measures}`)
        .join('\n')}

---

## 7. Surveillance et entretien

- Inspection préventive des équipements critiques avant chaque quart de travail.
- Registre d'entretien tenu pour les équipements de levage, d'accès en hauteur et de détection.
- Retrait immédiat de tout équipement non conforme jusqu'à remise en état.
- Reconduction de l'inspection après tout incident ou quasi-accident.

---

## 8. Participation des travailleurs

- Consultation du comité de santé et de sécurité sur le présent programme et ses révisions.
- Mécanisme de signalement des situations dangereuses accessible à tous les travailleurs (LSST art. 49).
- Participation des travailleurs concernés à l'analyse des risques de leur poste.
- Diffusion des comptes rendus et du suivi des actions correctives.

---

## 9. Service de premiers soins

- Secouristes en nombre suffisant et présents sur chaque quart de travail.
- Trousses de premiers soins conformes, vérifiées mensuellement.
- Procédure d'appel des services d'urgence affichée aux accès du site.
- Registre des interventions de premiers soins tenu à jour.

---

## 10. Surveillance de la santé des travailleurs

${sorted.filter(risk => risk.sector === 'Santé').length === 0
    ? '- Aucun risque à caractère sanitaire spécifique inscrit au registre ; la surveillance générale s\'applique.'
    : sorted
        .filter(risk => risk.sector === 'Santé')
        .map(risk => `- **${risk.id}** — ${risk.name} : surveillance médicale adaptée et registre d'exposition.`)
        .join('\n')}

- Registre d'exposition conservé pour les agents à effets différés.
- Examens de santé selon les protocoles applicables aux expositions constatées.

---

## 11. Révision et mise à jour

| Déclencheur | Action | Échéance |
|---|---|---|
| Mise en application (LMRSST) | Élaboration et application du ${regime.libelle.toLowerCase()} | ${echeanceMiseEnApplication()} |
| Transmission à la CNESST | Priorités d'action, état d'avancement, suivi des mesures | ${echeanceTransmission()} |
| Nouveau risque au registre | Mise à jour des sections 1 à 3 | en continu |
| Accident ou quasi-accident | Analyse et révision des mesures concernées | sans délai |
| Modification des procédés ou équipements | Réévaluation des indices de risque | sans délai |

---

## Responsables identifiés

${owners.length === 0
    ? '_Aucun responsable désigné au registre._'
    : owners.map(owner => {
        const related = sorted.filter(risk => risk.responsible === owner)
        return `- **${owner}** — ${related.length} risque(s) : ${related.map(risk => risk.id).join(', ')}`
      }).join('\n')}

---

_Programme établi sous la responsabilité de ${params.acteurResponsable}. Ce document doit être approuvé, daté et diffusé aux travailleurs conformément à la LSST._
`
}
