/* © 2026 Preventera — AgenticX5. Tous droits réservés. Voir LICENSE.md. */
/* FICHIER GÉNÉRÉ — ne pas modifier à la main.
 * Produit par scripts/ontologie/extraire_obligations.py depuis les PDF
 * officiels de LégisQuébec.
 *
 * Ne contient que les articles CITÉS par le code : les seuils des
 * 1 100 autres articles porteurs n'ont rien à faire dans le bundle.
 */

export interface Seuil {
  /** Valeur numérique, point décimal. */
  valeur: string
  /** Unité telle qu'écrite au texte : m, dBA, travailleurs, jours… */
  unite: string
  /** Fragment de phrase autour du seuil — « 3 m » seul ne dit rien. */
  extrait: string
}

export interface Obligation {
  /** Sujets nommés par l'article : employeur, travailleur, maître d'œuvre. */
  sujets: readonly string[]
  seuils: readonly Seuil[]
  /** Normes techniques incorporées par renvoi. */
  normes: readonly string[]
}

/** Clé : « RSST 141.3 ». */
export const OBLIGATIONS: Readonly<Record<string, Obligation>> = {
  'LSST 49': { sujets: ['travailleur', 'toute_personne'], seuils: [], normes: [] },
  'LSST 51': { sujets: ['employeur', 'travailleur', 'toute_personne'], seuils: [], normes: [] },
  'LSST 58': { sujets: ['employeur'], seuils: [{ valeur: '20', unite: 'travailleurs', extrait: 'e établissement groupant au moins 20 travailleurs au cours de l’année. Lorsqu’au co' }], normes: [] },
  'LSST 59': { sujets: [], seuils: [{ valeur: '16', unite: 'ans', extrait: 'sécurité des travailleurs âgés de 16 ans et moins; 2° les mesures et les p' }], normes: [] },
  'LSST 68': { sujets: ['employeur'], seuils: [{ valeur: '20', unite: 'travailleurs', extrait: 'n établissement groupant au moins 20 travailleurs au cours de l’année. Lorsqu’au co' }, { valeur: '21', unite: 'jours', extrait: 'ins 20 travailleurs pour moins de 21 jours au cours de l’année. 1979, c. 63,' }], normes: [] },
  'LSST 78': { sujets: ['employeur', 'travailleur'], seuils: [{ valeur: '16', unite: 'ans', extrait: 'ièrement les travailleurs âgés de 16 ans et moins et à l’identification de' }], normes: [] },
  'LSST 209': { sujets: [], seuils: [{ valeur: '10', unite: 'travailleurs', extrait: 'occuperont simultanément au moins 10 travailleurs de la construction à un moment de' }], normes: [] },
  'LSST 223': { sujets: ['maitre_oeuvre', 'employeur', 'travailleur'], seuils: [{ valeur: '20', unite: 'travailleurs', extrait: 'n établissement groupant moins de 20 travailleurs, élaborer un programme de prévent' }], normes: [] },
  'RSST 14': { sujets: [], seuils: [{ valeur: '2.4', unite: 'kN', extrait: 't supporter une charge d’au moins 2,4 kN/m 2 . Lorsqu’un véhicule motorisé' }], normes: [] },
  'RSST 15': { sujets: [], seuils: [{ valeur: '600', unite: 'mm', extrait: 'ritaire du matériel et d’au moins 600 mm; 4° si elles servent d’accès dire' }, { valeur: '100', unite: 'mm', extrait: ', être d’une largeur d’au moins 1 100 mm; 5° être délimitées par des ligne' }, { valeur: '2', unite: 'm', extrait: 'porter un espace libre d’au moins 2 m au-dessus du plancher à moins que' }, { valeur: '2.4', unite: 'kN', extrait: 't supporter une charge d’au moins 2,4 kN/m 2 . Lorsqu’un véhicule motorisé' }], normes: [] },
  'RSST 33.3': { sujets: ['travailleur'], seuils: [{ valeur: '1.5', unite: 'm', extrait: 'gereuse; 2° soit d’une hauteur de 1,5 m ou plus dans un puits, un bassin,' }, { valeur: '3', unite: 'm', extrait: '3° soit d’une hauteur de plus de 3 m dans les autres cas. Cependant, l' }, { valeur: '0.7', unite: 'm', extrait: 'réteaux d’une hauteur minimale de 0,7 m, à une distance variant de 0,9 m' }, { valeur: '0.9', unite: 'm', extrait: '0,7 m, à une distance variant de 0,9 m à 1,2 m de l’endroit d’où un trav' }, { valeur: '1.2', unite: 'm', extrait: 'à une distance variant de 0,9 m à 1,2 m de l’endroit d’où un travailleur' }], normes: [] },
  'RSST 43': { sujets: ['employeur'], seuils: [{ valeur: '50', unite: 'travailleurs', extrait: 'ns tout établissement qui emploie 50 travailleurs ou plus et où la concentration de' }, { valeur: '5', unite: 'ans', extrait: 'er pendant une période d’au moins 5 ans. D. 885-2001, a. 43.' }], normes: [] },
  'RSST 45': { sujets: ['employeur'], seuils: [], normes: [] },
  'RSST 123': { sujets: ['employeur'], seuils: [{ valeur: '10', unite: '°C', extrait: 'la température est comprise entre 10 °C et 15 °C, ainsi qu’une douche par' }, { valeur: '15', unite: '°C', extrait: 'ature est comprise entre 10 °C et 15 °C, ainsi qu’une douche par 15 trava' }, { valeur: '15', unite: 'travailleurs', extrait: 'et 15 °C, ainsi qu’une douche par 15 travailleurs exposés. D. 885-2001, a. 123.' }], normes: [] },
  'RSST 124': { sujets: ['travailleur'], seuils: [], normes: [] },
  'RSST 135': { sujets: ['employeur'], seuils: [], normes: [] },
  'RSST 136': { sujets: ['employeur'], seuils: [], normes: [] },
  'RSST 138': { sujets: ['employeur'], seuils: [{ valeur: '30', unite: 'jours', extrait: 'urage doit être effectué dans les 30 jours de la fin du délai prévu pour l’i' }], normes: [] },
  'RSST 141': { sujets: ['employeur', 'fournisseur'], seuils: [], normes: ['CSA Z94.2-2014', 'NF EN 352-1', 'NF EN 352-2', 'NF EN 352-3', 'NF EN 352-4', 'NF EN 352-5', 'NF EN 352-6', 'NF EN 352-7', 'NF EN 458'] },
  'RSST 141.3': { sujets: ['employeur', 'travailleur'], seuils: [], normes: [] },
  'RSST 166': { sujets: ['travailleur'], seuils: [], normes: [] },
  'RSST 177': { sujets: [], seuils: [], normes: ['CSA Z432', 'ISO 12100'] },
  'RSST 280': { sujets: ['travailleur'], seuils: [], normes: [] },
  'RSST 288': { sujets: [], seuils: [{ valeur: '450', unite: 'mm', extrait: 'que ne doit pas être inférieure à 450 mm. D. 885-2001, a. 288.' }], normes: [] },
  'RSST 300': { sujets: ['travailleur'], seuils: [], normes: [] },
  'RSST 341': { sujets: ['travailleur'], seuils: [], normes: ['CAN/CSA Z94.1', 'CAN/CSA Z94.1-05'] },
  'RSST 343': { sujets: ['travailleur', 'fournisseur'], seuils: [], normes: ['CAN/CSA Z94.3', 'CAN/CSA Z94.3-02', 'CAN/CSA Z94.3-92', 'CAN/CSA Z94.3-99'] },
  'RSST 344': { sujets: ['travailleur'], seuils: [], normes: ['CAN/CSA-Z195-14'] },
  'RSST 345': { sujets: ['travailleur'], seuils: [], normes: [] },
  'RSST 347': { sujets: [], seuils: [{ valeur: '6', unite: 'kN', extrait: 'force maximale d’arrêt de chute à 6 kN ou la hauteur de chute libre à 1,' }, { valeur: '1.8', unite: 'm', extrait: 'kN ou la hauteur de chute libre à 1,8 m au maximum. D. 885-2001, a. 347;' }], normes: ['CAN/CSA Z259.10'] },
  'CSTC 2.8.4': { sujets: [], seuils: [], normes: ['CSA Z96'] },
  'CSTC 2.9.1': { sujets: [], seuils: [{ valeur: '300', unite: 'mm', extrait: 'placé à une distance maximale de 300 mm de la bordure du vide de tout end' }, { valeur: '1.2', unite: 'm', extrait: 'nt un danger; 4° d’une hauteur de 1,2 m ou plus lorsqu’il utilise un véhi' }, { valeur: '1.5', unite: 'm', extrait: 'un véhicule; 5° d’une hauteur de 1,5 m ou plus lorsqu’il manutentionne u' }, { valeur: '3', unite: 'm', extrait: 'arge; 6° d’une hauteur de plus de 3 m dans les autres cas. Le présent a' }], normes: [] },
  'CSTC 2.9.3': { sujets: [], seuils: [{ valeur: '3', unite: 'm', extrait: 'une personne de tomber de plus de 3 m de hauteur en chute libre; 3° êtr' }], normes: ['NF EN 1263-1', 'NF EN 1263-2'] },
  'CSTC 2.10.3': { sujets: ['toute_personne'], seuils: [], normes: ['CAN/CSA Z94.1'] },
  'CSTC 2.10.6': { sujets: ['toute_personne'], seuils: [], normes: ['CAN/CSA-Z195'] },
  'CSTC 2.10.12': { sujets: ['travailleur'], seuils: [{ valeur: '6', unite: 'kN', extrait: 'force maximale d’arrêt de chute à 6 kN ou la hauteur de chute libre à 1,' }, { valeur: '1.8', unite: 'm', extrait: 'kN ou la hauteur de chute libre à 1,8 m. Cette liaison d’arrêt de chute d' }, { valeur: '2', unite: 'm', extrait: 'it avoir une longueur maximale de 2 m; b) un enrouleur-dérouleur confor' }, { valeur: '90', unite: 'm', extrait: '. avoir une longueur inférieure à 90 m; iii. ne jamais être directement' }], normes: ['CSA Z259.10', 'CSA Z259.11', 'CSA Z259.12', 'CSA Z259.2.2', 'CSA Z259.2.4', 'CSA Z259.2.5'] },
  'CSTC 2.10.15': { sujets: [], seuils: [{ valeur: '18', unite: 'kN', extrait: 'ésistance à la rupture d’au moins 18 kN; b) conçu et installé selon un pl' }, { valeur: '12', unite: 'mm', extrait: 'd’acier d’un diamètre minimum de 12 mm relâché selon un angle minimum de' }, { valeur: '12', unite: 'm', extrait: 'ale; ii. une distance maximale de 12 m entre les ancrages d’extrémité; i' }, { valeur: '90', unite: 'kN', extrait: 'ésistance à la rupture d’au moins 90 kN; iv. utilisé par au plus 2 travai' }, { valeur: '2', unite: 'travailleurs', extrait: 'ns 90 kN; iv. utilisé par au plus 2 travailleurs à la fois; b) conçu et installé s' }, { valeur: '3', unite: 'm', extrait: 'décalé horizontalement de plus de 3 m ou d’un angle de 22 °; 2° ne peut' }], normes: ['CSA Z259.13', 'CSA Z259.15', 'CSA Z259.16'] },
  'CSTC 3.9.1': { sujets: ['travailleur'], seuils: [], normes: [] },
  'CSTC 5.2.1': { sujets: ['employeur'], seuils: [], normes: [] },
  'CSTC 10.4.1': { sujets: ['travailleur'], seuils: [], normes: ['CSA Z96'] },
}
