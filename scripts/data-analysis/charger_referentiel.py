#!/usr/bin/env python3
"""
Génère le SQL de chargement du référentiel sectoriel à partir de fichiers CSV.

Aucun accès réseau, aucune clé d'API : le script produit des instructions SQL
que l'on colle dans l'éditeur SQL de Supabase. C'est délibéré — le chargement
d'un référentiel réglementaire mérite d'être relu avant exécution.

FICHIERS ATTENDUS
-----------------

1) secteurs.csv — correspondance SCIAN → niveau de risque
   Colonnes : code,libelle,niveau
   Le niveau est un entier de 1 à 4, ou vide s'il est inconnu.

     code,libelle,niveau
     2361,Construction résidentielle,1
     3211,Scieries et préservation du bois,1
     5411,Services juridiques,4

   Source : outil « Niveau des activités de l'établissement » de la CNESST.

2) effectifs.csv — dénominateur d'emploi, facultatif mais requis pour tout taux
   Colonnes : code,annee,nb_travailleurs[,region]

     code,annee,nb_travailleurs,region
     2361,2023,48210,ENSEMBLE

   Source : Statistique Canada ou Institut de la statistique du Québec.

USAGE
-----
    python3 charger_referentiel.py --secteurs secteurs.csv > charger.sql
    python3 charger_referentiel.py --secteurs secteurs.csv --effectifs effectifs.csv > charger.sql

Puis coller `charger.sql` dans l'éditeur SQL du projet Supabase.
"""

import argparse
import csv
import sys
from pathlib import Path

NIVEAUX_VALIDES = {1, 2, 3, 4}


def echapper(valeur: str) -> str:
    """Littéral SQL entre apostrophes, apostrophes internes doublées."""
    return "'" + str(valeur).replace("'", "''") + "'"


def lire_secteurs(chemin: Path) -> list[dict]:
    lignes = []
    with chemin.open(encoding="utf-8-sig", newline="") as fichier:
        for numero, ligne in enumerate(csv.DictReader(fichier), start=2):
            code = (ligne.get("code") or "").strip()
            libelle = (ligne.get("libelle") or "").strip()
            niveau_brut = (ligne.get("niveau") or "").strip()

            if not code or not libelle:
                print(f"  ligne {numero} ignorée : code ou libellé manquant", file=sys.stderr)
                continue

            niveau = None
            if niveau_brut:
                try:
                    niveau = int(niveau_brut)
                except ValueError:
                    print(f"  ligne {numero} : niveau « {niveau_brut} » non numérique", file=sys.stderr)
                    continue
                if niveau not in NIVEAUX_VALIDES:
                    print(f"  ligne {numero} : niveau {niveau} hors de 1-4", file=sys.stderr)
                    continue

            lignes.append({"code": code, "libelle": libelle, "niveau": niveau})
    return lignes


def lire_effectifs(chemin: Path) -> list[dict]:
    lignes = []
    with chemin.open(encoding="utf-8-sig", newline="") as fichier:
        for numero, ligne in enumerate(csv.DictReader(fichier), start=2):
            code = (ligne.get("code") or "").strip()
            try:
                annee = int((ligne.get("annee") or "").strip())
                nb = int((ligne.get("nb_travailleurs") or "").strip())
            except ValueError:
                print(f"  ligne {numero} ignorée : année ou effectif non numérique", file=sys.stderr)
                continue

            if not code or nb <= 0:
                print(f"  ligne {numero} ignorée : code manquant ou effectif nul", file=sys.stderr)
                continue

            lignes.append({
                "code": code,
                "annee": annee,
                "nb": nb,
                "region": (ligne.get("region") or "ENSEMBLE").strip() or "ENSEMBLE",
            })
    return lignes


def main() -> int:
    analyseur = argparse.ArgumentParser(description=__doc__,
                                        formatter_class=argparse.RawDescriptionHelpFormatter)
    analyseur.add_argument("--secteurs", required=True, help="CSV code,libelle,niveau")
    analyseur.add_argument("--effectifs", help="CSV code,annee,nb_travailleurs[,region]")
    analyseur.add_argument("--source-secteurs",
                           default="CNESST — Niveau des activités de l'établissement")
    analyseur.add_argument("--source-effectifs", default="Statistique Canada")
    arguments = analyseur.parse_args()

    secteurs = lire_secteurs(Path(arguments.secteurs))
    if not secteurs:
        print("Aucun secteur exploitable.", file=sys.stderr)
        return 1

    sortie = [
        "-- Chargement du référentiel sectoriel PPAI",
        f"-- {len(secteurs)} secteur(s) — généré par charger_referentiel.py",
        "-- Idempotent : réexécutable, met à jour libellés et niveaux.",
        "BEGIN;",
        "",
    ]

    for secteur in secteurs:
        niveau = "NULL" if secteur["niveau"] is None else str(secteur["niveau"])
        sortie.append(
            "INSERT INTO scian_sectors (code, libelle, niveau_risque, source) VALUES "
            f"({echapper(secteur['code'])}, {echapper(secteur['libelle'])}, {niveau}, "
            f"{echapper(arguments.source_secteurs)}) "
            "ON CONFLICT (code) DO UPDATE SET libelle = EXCLUDED.libelle, "
            "niveau_risque = EXCLUDED.niveau_risque, source = EXCLUDED.source, updated_at = NOW();"
        )

    sans_niveau = sum(1 for s in secteurs if s["niveau"] is None)
    if sans_niveau:
        sortie.append("")
        sortie.append(f"-- ATTENTION : {sans_niveau} secteur(s) sans niveau de risque.")
        sortie.append("-- Les modalités du comité et du représentant resteront indéterminées.")

    if arguments.effectifs:
        effectifs = lire_effectifs(Path(arguments.effectifs))
        sortie += ["", f"-- {len(effectifs)} ligne(s) d'effectifs"]
        for e in effectifs:
            sortie.append(
                "INSERT INTO cnesst_effectifs (secteur_scian, region, annee, nb_travailleurs, source) "
                f"VALUES ({echapper(e['code'])}, {echapper(e['region'])}, {e['annee']}, {e['nb']}, "
                f"{echapper(arguments.source_effectifs)}) "
                "ON CONFLICT (secteur_scian, region, annee) DO UPDATE SET "
                "nb_travailleurs = EXCLUDED.nb_travailleurs, source = EXCLUDED.source;"
            )

    sortie += ["", "COMMIT;"]
    print("\n".join(sortie))

    print(f"\n-- {len(secteurs)} secteur(s), dont {sans_niveau} sans niveau", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
