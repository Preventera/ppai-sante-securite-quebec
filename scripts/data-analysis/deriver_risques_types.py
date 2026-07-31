#!/usr/bin/env python3
"""
Dérive des risques types par secteur à partir des lésions professionnelles
ouvertes de la CNESST.

CONTRAINTE MÉTHODOLOGIQUE — À LIRE AVANT DE MODIFIER CE SCRIPT
    Le grain des données ouvertes est « une ligne = une lésion survenue ». Il
    n'existe aucun contre-exemple : aucun travailleur sans lésion n'y figure.
    On ne peut donc PAS en dériver une probabilité d'occurrence, et ce script
    n'en produit aucune.

    Ce qu'on peut défendre, c'est la GRAVITÉ : elle s'appuie sur les natures et
    les sièges de lésion réellement observés. Et le RANG : quels agents causals
    dominent dans un secteur. Le décompte sert à classer, pas à estimer une
    fréquence par travailleur — un taux exigerait un dénominateur d'effectifs,
    obtenu séparément (`cnesst_effectifs`).

    L'employeur reste seul juge de la probabilité dans SON établissement
    (LSST art. 59). Ce script propose, il ne dispose pas.

GRANULARITÉ — DIVERGENCE À CONNAÎTRE
    La colonne SECTEUR_SCIAN des fichiers publiés ne contient PAS un code SCIAN
    mais l'un des 22 libellés de grand secteur de la CNESST (« SOINS DE SANTE ET
    ASSISTANCE SOCIALE »). L'annexe I du RMPPÉ travaille elle à 102 sous-secteurs
    à trois chiffres. Les lésions du secteur santé couvrent donc indistinctement
    621, 622, 623 et 624, qui n'ont pas le même niveau.

    Les risques types sont par conséquent rattachés au LIBELLÉ de grand secteur,
    jamais à un code à trois chiffres : attribuer les lésions de tout le secteur
    santé aux seuls centres d'hébergement serait une invention.

COVID-19 — EXCLU PAR DÉFAUT
    19,4 % des lésions de 2017 et 2020-2023 sont des cas de COVID-19, et 41,5 %
    pour la seule année 2022. Conservés, ils placent « agents infectieux » en
    tête du secteur de la santé et écrasent les risques persistants — manutention
    de bénéficiaires, violence. Ils sont donc écartés par défaut ; `--inclure-covid`
    les réintègre pour une analyse rétrospective assumée.

SOUPLESSE DE SCHÉMA
    Les en-têtes des fichiers publiés varient d'une année et d'un jeu à l'autre.
    Les colonnes sont donc reconnues par correspondance approximative plutôt que
    par nom exact, et le script AFFICHE la correspondance retenue pour qu'elle
    soit relue. Il refuse de travailler si une colonne essentielle manque plutôt
    que de deviner.

USAGE
    python3 deriver_risques_types.py --lesions fichier.csv > risques_types.sql
    python3 deriver_risques_types.py --lesions fichier.csv --inspecter
"""

import argparse
import csv
import hashlib
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

# Nombre maximal de risques types proposés par secteur.
TOP_PAR_SECTEUR = 12

# Un agent causal vu moins de fois que ce seuil dans un secteur n'est pas
# proposé : trop rare pour constituer un risque type du secteur.
SEUIL_OCCURRENCES = 5


def sans_accent(texte: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", texte.lower()) if unicodedata.category(c) != "Mn"
    )


# Correspondances : nom logique -> fragments recherchés dans l'en-tête.
COLONNES_ATTENDUES = {
    "secteur": ["secteur_scian", "secteur", "activite economique", "sae"],
    "agent_causal": ["agent_causal_lesion", "agent causal", "agent_causal"],
    "nature_lesion": ["nature_lesion", "nature"],
    "siege_lesion": ["siege_lesion", "siege", "partie du corps"],
    "genre_accident": ["genre", "type d'evenement"],
    "annee": ["annee", "year"],
    "nb_cas": ["nb_cas", "nombre", "decompte"],
    "covid": ["covid"],
    "tms": ["tms"],
    "psy": ["psy"],
    "machine": ["machine"],
    "surdite": ["surdite"],
}

# Colonnes sans lesquelles le script ne peut rien produire.
COLONNES_ESSENTIELLES = ["secteur", "agent_causal"]


def associer_colonnes(entetes: list[str]) -> dict[str, str | None]:
    """Associe chaque nom logique à un en-tête réel, ou à None."""
    normalises = {entete: sans_accent(entete) for entete in entetes}
    correspondance: dict[str, str | None] = {}

    for logique, fragments in COLONNES_ATTENDUES.items():
        trouve = None
        for entete, norm in normalises.items():
            if any(fragment in norm for fragment in fragments):
                trouve = entete
                break
        correspondance[logique] = trouve

    return correspondance


# ---------------------------------------------------------------------------
# Gravité — déduite de la nature et du siège de la lésion
#
# Échelle 1 à 5, alignée sur celle du registre des risques de l'application.
# Chaque règle est justifiable devant un inspecteur : elle se lit dans la nature
# de la lésion observée, pas dans une pondération arbitraire.
# ---------------------------------------------------------------------------

REGLES_GRAVITE: list[tuple[int, list[str]]] = [
    (5, ["deces", "mortel", "amputation", "asphyxie", "electrocution", "ecrasement"]),
    (4, ["fracture", "brulure", "traumatisme cranien", "commotion", "intoxication",
         "perte de conscience", "hernie discale", "lesion interne"]),
    (3, ["entorse", "foulure", "luxation", "dechirure", "tendinite", "bursite",
         "trouble musculo", "surdite", "dermatite"]),
    (2, ["contusion", "meurtrissure", "coupure", "laceration", "piqure", "irritation"]),
    (1, ["egratignure", "eraflure", "ampoule", "corps etranger"]),
]

GRAVITE_PAR_DEFAUT = 3


def gravite_pour(nature: str, siege: str) -> tuple[int, str]:
    """Gravité 1-5 et sa justification, à partir de la nature et du siège."""
    texte = sans_accent(f"{nature} {siege}")

    for niveau, motifs in REGLES_GRAVITE:
        for motif in motifs:
            if motif in texte:
                return niveau, f"nature de lésion observée : « {motif} »"

    return GRAVITE_PAR_DEFAUT, "nature de lésion non reconnue, valeur médiane retenue"


def echapper(valeur) -> str:
    return "'" + str(valeur).replace("'", "''") + "'"


def oui(valeur: str | None) -> bool:
    return (valeur or "").strip().upper() == "OUI"


def categoriser(entree: dict) -> str:
    """
    Catégorie déduite des indicateurs publiés par la CNESST plutôt que du
    vocabulaire de l'agent causal, qui est peu lisible pour un utilisateur
    (« PERSONNE-TRAVAILLEUR BLESSE,MALADE » désigne un effort excessif).
    """
    part = lambda cle: entree[cle] / entree["nb"] if entree["nb"] else 0
    if part("psy") >= 0.5:
        return "Psychosocial"
    if part("tms") >= 0.5:
        return "Ergonomique (TMS)"
    if part("machine") >= 0.5:
        return "Mécanique"
    if part("surdite") >= 0.5:
        return "Bruit"
    return "Autre risque professionnel"


def dedupliquer(chemins: list[Path]) -> tuple[list[Path], list[tuple[Path, Path]]]:
    """
    Écarte les fichiers dont le contenu est identique à un fichier déjà retenu.

    Les extractions successives du portail portent des noms différents pour un
    même millésime. Les additionner double silencieusement les décomptes d'une
    année — une erreur invisible dans le résultat, et qui fausse tout classement.
    """
    vus: dict[str, Path] = {}
    retenus: list[Path] = []
    doublons: list[tuple[Path, Path]] = []

    for chemin in chemins:
        empreinte = hashlib.md5(chemin.read_bytes()).hexdigest()
        if empreinte in vus:
            doublons.append((chemin, vus[empreinte]))
            continue
        vus[empreinte] = chemin
        retenus.append(chemin)

    return retenus, doublons


def lire(chemins: list[Path], correspondance: dict[str, str | None],
         inclure_covid: bool) -> dict:
    """Agrège les lésions par secteur, agent causal et genre d'accident."""
    agregat: dict[tuple[str, str, str], dict] = defaultdict(
        lambda: {"nb": 0, "natures": Counter(), "sieges": Counter(),
                 "tms": 0, "psy": 0, "machine": 0, "surdite": 0, "annees": set()}
    )
    ignorees = 0
    exclues_covid = 0

    for chemin in chemins:
        annee = "".join(c for c in chemin.stem if c.isdigit())[:4]
        with chemin.open(encoding="utf-8-sig", newline="") as fichier:
            for ligne in csv.DictReader(fichier):
                secteur = (ligne.get(correspondance["secteur"]) or "").strip()
                agent = (ligne.get(correspondance["agent_causal"]) or "").strip()

                if not secteur or not agent:
                    ignorees += 1
                    continue

                col_covid = correspondance.get("covid")
                if col_covid and oui(ligne.get(col_covid)) and not inclure_covid:
                    exclues_covid += 1
                    continue

                genre = ((ligne.get(correspondance["genre_accident"]) or "").strip()
                         if correspondance.get("genre_accident") else "")

                # Un fichier de lésions individuelles n'a pas de colonne de
                # décompte : chaque ligne vaut une lésion.
                col_nb = correspondance.get("nb_cas")
                try:
                    nb = int(float((ligne.get(col_nb) or "1").strip() or 1)) if col_nb else 1
                except (ValueError, AttributeError):
                    nb = 1
                if nb <= 0:
                    ignorees += 1
                    continue

                e = agregat[(secteur, agent, genre)]
                e["nb"] += nb
                for logique in ("nature_lesion", "siege_lesion"):
                    col = correspondance.get(logique)
                    if col:
                        valeur = (ligne.get(col) or "").strip()
                        if valeur:
                            e[logique.split("_")[0] + "s"][valeur] += nb
                for logique in ("tms", "psy", "machine", "surdite"):
                    col = correspondance.get(logique)
                    if col and oui(ligne.get(col)):
                        e[logique] += nb
                if annee:
                    e["annees"].add(annee)

    return {"agregat": agregat, "ignorees": ignorees, "exclues_covid": exclues_covid}


def main() -> int:
    analyseur = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    analyseur.add_argument("--lesions", required=True, nargs="+",
                           help="Un ou plusieurs CSV de lésions professionnelles")
    analyseur.add_argument("--inspecter", action="store_true",
                           help="Afficher la correspondance et un aperçu, sans produire de SQL")
    analyseur.add_argument("--inclure-covid", action="store_true",
                           help="Réintégrer les cas de COVID-19, exclus par défaut")
    analyseur.add_argument("--secteurs-csv",
                           help="Écrire la liste des secteurs rencontrés dans ce fichier CSV")
    analyseur.add_argument("--source", default="Données Québec — CNESST, lésions professionnelles")
    arguments = analyseur.parse_args()

    chemins, doublons = dedupliquer([Path(c) for c in arguments.lesions])
    for double, original in doublons:
        print(f"  doublon écarté : {double.name} est identique à {original.name}",
              file=sys.stderr)
    if doublons:
        print(f"{len(doublons)} fichier(s) en double écarté(s) — sans quoi ces années "
              "auraient été comptées deux fois.", file=sys.stderr)

    with chemins[0].open(encoding="utf-8-sig", newline="") as fichier:
        entetes = next(csv.reader(fichier))

    correspondance = associer_colonnes(entetes)

    print("Correspondance des colonnes retenue :", file=sys.stderr)
    for logique, reelle in correspondance.items():
        marque = "OK" if reelle else ("MANQUE" if logique in COLONNES_ESSENTIELLES else "--")
        print(f"  {marque:>6}  {logique:<16} -> {reelle or 'absente'}", file=sys.stderr)

    manquantes = [c for c in COLONNES_ESSENTIELLES if not correspondance[c]]
    if manquantes:
        print(f"\nColonnes essentielles introuvables : {', '.join(manquantes)}.", file=sys.stderr)
        print("En-têtes du fichier :", ", ".join(entetes), file=sys.stderr)
        return 1

    resultat = lire(chemins, correspondance, arguments.inclure_covid)
    agregat = resultat["agregat"]
    if not agregat:
        print("Aucune ligne exploitable.", file=sys.stderr)
        return 1

    total_lesions = sum(e["nb"] for e in agregat.values())
    print(f"\n{total_lesions} lésion(s) retenue(s) sur {len(chemins)} fichier(s) ; "
          f"{resultat['exclues_covid']} cas de COVID-19 écarté(s) ; "
          f"{resultat['ignorees']} ligne(s) ignorée(s).", file=sys.stderr)

    par_secteur: dict[str, list] = defaultdict(list)
    for (secteur, agent, genre), e in agregat.items():
        if e["nb"] < SEUIL_OCCURRENCES:
            continue
        nature = e["natures"].most_common(1)[0][0] if e["natures"] else ""
        siege = e["sieges"].most_common(1)[0][0] if e["sieges"] else ""
        gravite, justification = gravite_pour(nature, siege)
        par_secteur[secteur].append({
            "agent": agent, "genre": genre, "nb": e["nb"], "nature": nature, "siege": siege,
            "gravite": gravite, "justification": justification,
            "categorie": categoriser(e), "annees": sorted(e["annees"]),
        })

    for secteur in par_secteur:
        par_secteur[secteur].sort(key=lambda x: x["nb"], reverse=True)
        par_secteur[secteur] = par_secteur[secteur][:TOP_PAR_SECTEUR]

    total = sum(len(v) for v in par_secteur.values())
    print(f"{len(par_secteur)} secteur(s), {total} risque(s) type(s).", file=sys.stderr)

    if arguments.secteurs_csv:
        with open(arguments.secteurs_csv, "w", encoding="utf-8", newline="") as f:
            w = csv.writer(f)
            w.writerow(["secteur_cnesst", "nb_lesions", "codes_scian_annexe_I"])
            for secteur in sorted(par_secteur, key=lambda s: -sum(e["nb"] for e in par_secteur[s])):
                w.writerow([secteur, sum(e["nb"] for e in par_secteur[secteur]), ""])
        print(f"Liste des secteurs écrite dans {arguments.secteurs_csv} — "
              "la colonne des codes SCIAN est à compléter à la main.", file=sys.stderr)

    if arguments.inspecter:
        for secteur in sorted(par_secteur, key=lambda s: -sum(e["nb"] for e in par_secteur[s]))[:4]:
            print(f"\n-- {secteur} --", file=sys.stderr)
            for e in par_secteur[secteur][:6]:
                print(f"   {e['nb']:>6} | gravité {e['gravite']} | {e['categorie']:<26} | "
                      f"{e['genre'][:34]}", file=sys.stderr)
        return 0

    sortie = [
        "-- Risques types dérivés des lésions professionnelles CNESST",
        f"-- {total} proposition(s) sur {len(par_secteur)} secteur(s), {total_lesions} lésions",
        f"-- COVID-19 {'INCLUS' if arguments.inclure_covid else 'exclu'}",
        "--",
        "-- AUCUNE PROBABILITÉ n'est produite : le grain est « une ligne = une lésion",
        "-- survenue », sans contre-exemple. La gravité s'appuie sur la nature de",
        "-- lésion observée ; le décompte sert à classer, pas à estimer une fréquence.",
        "-- Le secteur est le LIBELLÉ CNESST, pas un code SCIAN à trois chiffres :",
        "-- les données ne descendent pas au sous-secteur de l'annexe I du RMPPÉ.",
        "BEGIN;",
        "",
        "DELETE FROM risk_templates WHERE source = " + echapper(arguments.source) + ";",
        "",
    ]

    for secteur in sorted(par_secteur):
        for e in par_secteur[secteur]:
            libelle = e["genre"] or e["agent"]
            mesures = (
                f"Agent causal dominant : {e['agent']}. "
                f"Nature de lésion dominante : {e['nature'] or 'non précisée'}. "
                f"Siège dominant : {e['siege'] or 'non précisé'}. "
                f"Gravité proposée d'après {e['justification']}. "
                f"Observé sur {', '.join(e['annees']) or 'période non précisée'}. "
                "À valider et compléter par l'employeur pour son établissement."
            )
            sortie.append(
                "INSERT INTO risk_templates "
                "(secteur_cnesst, libelle, categorie, agent_causal, gravite_suggeree, "
                "mesures_types, nb_cas_observes, source) VALUES ("
                f"{echapper(secteur)}, {echapper(libelle)}, {echapper(e['categorie'])}, "
                f"{echapper(e['agent'])}, {e['gravite']}, {echapper(mesures)}, {e['nb']}, "
                f"{echapper(arguments.source)});"
            )

    sortie += ["", "COMMIT;"]
    print("\n".join(sortie))
    return 0


if __name__ == "__main__":
    sys.exit(main())
