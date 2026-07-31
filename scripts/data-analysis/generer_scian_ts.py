#!/usr/bin/env python3
"""
Régénère `src/lib/scianNiveaux.ts` à partir du CSV du référentiel.

Le CSV `data/referentiel/niveaux_risque_cnesst.csv` est la source de vérité :
c'est lui que l'on relit contre la page de la CNESST. Le module TypeScript en
est un artefact généré, versionné pour que l'application fonctionne sans base
de données — le mode démonstration n'a pas de Supabase à interroger.

Deux copies d'une même table réglementaire finissent toujours par diverger. La
génération évite le problème plutôt que de compter sur la vigilance.

USAGE
    python3 scripts/data-analysis/generer_scian_ts.py
    python3 scripts/data-analysis/generer_scian_ts.py --verifier   # ne réécrit rien

`--verifier` renvoie un code de sortie non nul si le fichier généré ne
correspond plus au CSV : utilisable en intégration continue.
"""

import argparse
import csv
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parents[2]
CSV_SOURCE = RACINE / "data" / "referentiel" / "niveaux_risque_cnesst.csv"
CIBLE_TS = RACINE / "src" / "lib" / "scianNiveaux.ts"

NIVEAUX_VALIDES = {1, 2, 3, 4}

ENTETE = '''/**
 * Niveaux liés aux activités d'un établissement — correspondance SCIAN 2012.
 *
 * FICHIER GÉNÉRÉ — ne pas modifier à la main.
 * Source de vérité : data/referentiel/niveaux_risque_cnesst.csv
 * Régénérer : python3 scripts/data-analysis/generer_scian_ts.py
 *
 * Source normative : CNESST, « Classement de l'établissement par niveau ».
 * Le modèle multicritère a été développé par la CNESST avec l'Institut de
 * recherche Robert-Sauvé en santé et en sécurité du travail (IRSST) et des
 * chercheurs recommandés par les associations syndicales. Il tient compte des
 * réalités propres aux hommes et aux femmes, des données de lésions
 * professionnelles et des données de risques psychosociaux et ergonomiques.
 *
 * SENS DE L'ÉCHELLE — NON DOCUMENTÉ ICI
 * La source consultée n'indique pas laquelle des deux extrémités correspond au
 * régime le plus exigeant, et la répartition ne permet pas de le déduire : la
 * construction de bâtiments est au niveau 1 alors que la foresterie et
 * l'extraction minière sont au niveau 4. Le niveau doit donc être présenté tel
 * quel — « niveau 3 » — et jamais traduit en « risque élevé » ou « risque
 * faible », ni coloré selon une échelle de gravité. Voir
 * `LIBELLE_NIVEAU_NEUTRE`.
 */

import type { NiveauRisque } from '@/lib/lmrsst'

export interface SecteurScian {
  /** Code SCIAN 2012 à trois chiffres (sous-secteur). */
  code: string
  libelle: string
  niveau: NiveauRisque
}
'''

PIED = '''
/** Index par code, pour une recherche directe. */
const PAR_CODE = new Map<string, SecteurScian>(SECTEURS_SCIAN.map(s => [s.code, s]))

/**
 * Retrouve le sous-secteur SCIAN correspondant à un code saisi.
 *
 * Le classement de la CNESST est publié au niveau du sous-secteur, soit trois
 * chiffres. Les codes plus fins — quatre à six chiffres — sont ramenés à leurs
 * trois premiers. Un code plus court, ou absent de la table, renvoie `null` :
 * l'absence est une information, pas un motif pour retenir un niveau voisin.
 */
export function secteurPourCode(code: string | null | undefined): SecteurScian | null {
  const chiffres = (code ?? '').replace(/\\D/g, '')
  if (chiffres.length < 3) return null
  return PAR_CODE.get(chiffres.slice(0, 3)) ?? null
}

/** Niveau associé à un code SCIAN, ou `null` s'il est inconnu. */
export function niveauPourCode(code: string | null | undefined): NiveauRisque | null {
  return secteurPourCode(code)?.niveau ?? null
}

/**
 * Libellé à afficher pour un niveau. Délibérément neutre : le sens de
 * l'échelle n'est pas documenté dans la source, et présenter le niveau 4 comme
 * « risque élevé » — ou l'inverse — serait une invention.
 */
export function LIBELLE_NIVEAU_NEUTRE(niveau: NiveauRisque): string {
  return `Niveau ${niveau} (CNESST–IRSST, SCIAN 2012)`
}

/**
 * Établissements que le classement ne couvre pas, d'après l'outil de recherche
 * de la CNESST. Un établissement absent n'a pas un niveau « inconnu par
 * défaut » : il peut relever d'un régime distinct.
 */
export const CAS_NON_COUVERTS = [
  "les établissements sans NEQ (numéro d'entreprise du Québec) sont exclus de l'outil de recherche",
  'certains établissements ne sont pas couverts par le classement',
  "les secteurs de l'éducation ainsi que de la santé et des services sociaux font l'objet de dispositions particulières"
] as const
'''


def echapper_ts(valeur: str) -> str:
    """Littéral TypeScript entre apostrophes simples."""
    return valeur.replace("\\", "\\\\").replace("'", "\\'")


def lire_csv() -> list[dict]:
    secteurs = []
    vus = set()
    with CSV_SOURCE.open(encoding="utf-8-sig", newline="") as fichier:
        for numero, ligne in enumerate(csv.DictReader(fichier), start=2):
            code = (ligne.get("code") or "").strip()
            libelle = (ligne.get("libelle") or "").strip()
            niveau_brut = (ligne.get("niveau") or "").strip()

            if not code:
                print(f"  ligne {numero} ignorée : code SCIAN absent pour « {libelle} »",
                      file=sys.stderr)
                continue

            if not niveau_brut:
                print(f"  ligne {numero} ignorée : niveau absent pour {code}", file=sys.stderr)
                continue

            niveau = int(niveau_brut)
            if niveau not in NIVEAUX_VALIDES:
                raise SystemExit(f"ligne {numero} : niveau {niveau} hors de 1-4")

            if code in vus:
                raise SystemExit(f"ligne {numero} : code {code} en double")
            vus.add(code)

            secteurs.append({"code": code, "libelle": libelle, "niveau": niveau})

    if not secteurs:
        raise SystemExit("Aucun secteur exploitable dans le CSV.")
    return sorted(secteurs, key=lambda s: s["code"])


def composer(secteurs: list[dict]) -> str:
    lignes = [
        f"  {{ code: '{s['code']}', libelle: '{echapper_ts(s['libelle'])}', niveau: {s['niveau']} }},"
        for s in secteurs
    ]
    tableau = (
        f"\n/** {len(secteurs)} sous-secteurs SCIAN 2012, triés par code. */\n"
        "export const SECTEURS_SCIAN: readonly SecteurScian[] = [\n"
        + "\n".join(lignes)
        + "\n]\n"
    )
    return ENTETE + tableau + PIED


def main() -> int:
    analyseur = argparse.ArgumentParser(description=__doc__,
                                        formatter_class=argparse.RawDescriptionHelpFormatter)
    analyseur.add_argument("--verifier", action="store_true",
                           help="Comparer sans réécrire ; sortie non nulle en cas d'écart")
    arguments = analyseur.parse_args()

    secteurs = lire_csv()
    contenu = composer(secteurs)

    if arguments.verifier:
        actuel = CIBLE_TS.read_text(encoding="utf-8") if CIBLE_TS.exists() else ""
        if actuel != contenu:
            print(f"{CIBLE_TS.relative_to(RACINE)} ne correspond plus au CSV. "
                  "Exécuter generer_scian_ts.py.", file=sys.stderr)
            return 1
        print(f"{CIBLE_TS.relative_to(RACINE)} est à jour ({len(secteurs)} secteurs).")
        return 0

    CIBLE_TS.write_text(contenu, encoding="utf-8")
    repartition = {n: sum(1 for s in secteurs if s["niveau"] == n) for n in sorted(NIVEAUX_VALIDES)}
    print(f"{CIBLE_TS.relative_to(RACINE)} régénéré : {len(secteurs)} secteurs "
          f"(répartition {repartition}).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
