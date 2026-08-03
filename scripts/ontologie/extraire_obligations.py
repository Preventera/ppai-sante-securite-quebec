#!/usr/bin/env python3
# © 2026 Preventera — AgenticX5. Tous droits réservés. Voir LICENSE.md.
"""
Extrait la couche normative : qui doit quoi, à partir de quel seuil.

CE QUE CETTE COUCHE AJOUTE
    L'index des articles dit qu'un numéro existe. Il ne dit pas ce que
    l'article impose, ni à qui, ni quand. Cette couche relève, pour chaque
    article :

      • le SUJET          — employeur, travailleur, maître d'œuvre
      • le CARACTÈRE      — obligation (« doit ») ou faculté (« peut »)
      • les SEUILS        — valeurs chiffrées avec leur unité
      • les NORMES        — CSA, ANSI, ISO, BNQ incorporées par renvoi
      • les RENVOIS       — articles que celui-ci appelle

    C'est ce qui permet de passer de « voici des mesures » à « cette mesure
    vous est proposée parce que l'article X l'impose à l'employeur au-delà de
    3 m ».

CE QUI N'EST PAS EXTRAIT : LE TEXTE
    Les seuils sont accompagnés d'un fragment de phrase — quelques mots autour
    du nombre — sans lequel « 3 m » ne veut rien dire. Une citation de cette
    longueur est un renvoi, pas une reproduction. Le corps des articles reste
    hors du dépôt, et les annexes chiffrées du RSST — valeurs d'exposition,
    niveaux d'éclairement, normes de température — sont LIÉES à leur article,
    jamais recopiées.

CE QUE L'EXTRACTION NE PRÉTEND PAS ÊTRE
    Une lecture juridique. Elle relève des marqueurs de surface : un « doit »
    dans une phrase subordonnée peut porter sur autre chose que le sujet
    principal. Les résultats servent à PROPOSER et à expliquer, jamais à
    trancher l'applicabilité à la place de l'employeur.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from corpus import charger  # noqa: E402

SORTIE = Path("data/reglementation/obligations.json")
SORTIE_RUNTIME = Path("src/lib/obligations.genere.ts")

SIGLES = ["LSST", "RSST", "CSTC"]

# Le sujet de l'obligation. L'ordre compte : « le maître d'œuvre » avant
# « l'employeur », un chantier pouvant nommer les deux dans la même phrase.
SUJETS = [
    ("maitre_oeuvre", re.compile(r"\b[Ll]e ma[îi]tre d[e’']\s?œuvre\b")),
    ("employeur", re.compile(r"\b[Ll]['’]employeur\b")),
    ("travailleur", re.compile(r"\b(?:[Tt]out|[Ll]e|[Ll]es|[Aa]ucun) travailleurs?\b")),
    ("fournisseur", re.compile(r"\b[Ll]e (?:fournisseur|fabricant|vendeur)\b")),
    ("toute_personne", re.compile(r"\b[Tt]oute personne\b")),
]

OBLIGATION = re.compile(
    r"\b(?:doit|doivent|est obligatoire|sont obligatoires|il est interdit"
    r"|ne doit|ne doivent|est interdit|sont interdits?)\b"
)
FACULTE = re.compile(r"\b(?:peut|peuvent)\b")

# Valeur chiffrée suivie d'une unité. Le « , » décimal du français est admis.
#
# Les unités NE SONT PAS que physiques. Le seuil qui décide de tout dans ce
# produit — « un établissement groupant au moins 20 travailleurs » — se compte
# en personnes, et les échéances en jours ou en mois. Les omettre revenait à
# ne rien trouver dans la LSST, qui ne parle ni de mètres ni de décibels.
SEUIL = re.compile(
    r"(\d+(?:[.,]\d+)?)\s?"
    r"(mm|cm|m²|m³|m|km/h|kN|kPa|kg|dBA|dBC|dB|lux|°C|ppm|mg/m³"
    r"|travailleurs?|employ[ée]s?|personnes?|heures?|jours?|mois|ans?|ann[ée]es?)"
    r"(?![\w°])"
)

NORME = re.compile(
    r"\b((?:CAN/)?(?:CSA|ACNOR|ANSI(?:/ASSP)?|ASTM|NF\s?EN|ISO|BNQ|UL|NFPA)"
    r"[\s\-]?[A-Z]?[\d][\w.\-/:]*)"
)

RENVOI = re.compile(r"\barticles?\s+(\d+(?:\.\d+)*)")

# Unités dont la valeur n'est presque jamais un seuil normatif : les durées
# servent surtout aux délais de conservation de registres, et « % » aux
# proportions de composition.
UNITES_STRUCTURANTES = {
    # dimensions et forces
    "m", "mm", "cm", "m²", "m³", "kN", "kPa", "kg", "km/h",
    # ambiances
    "dBA", "dBC", "dB", "lux", "°C", "ppm", "mg/m³",
    # effectif — c'est lui qui décide de l'assujettissement
    "travailleur", "travailleurs", "employé", "employés", "employée", "employées",
    "personne", "personnes",
    # échéances
    "heure", "heures", "jour", "jours", "mois", "an", "ans", "année", "années",
}


def fragment(texte: str, debut: int, fin: int, marge: int = 34) -> str:
    """Quelques mots autour du seuil — « 3 m » seul ne veut rien dire."""
    extrait = texte[max(0, debut - marge) : min(len(texte), fin + marge)]
    return re.sub(r"\s+", " ", extrait).strip()


def analyser(article: dict) -> dict | None:
    texte = article["texte"]
    if not texte or article.get("abroge"):
        return None

    sujets = [nom for nom, motif in SUJETS if motif.search(texte)]

    if OBLIGATION.search(texte):
        caractere = "obligation"
    elif FACULTE.search(texte):
        caractere = "faculte"
    else:
        caractere = "indetermine"

    seuils = []
    vus = set()
    for m in SEUIL.finditer(texte):
        unite = m.group(2)
        if unite not in UNITES_STRUCTURANTES:
            continue
        cle = (m.group(1), unite)
        if cle in vus:
            continue
        vus.add(cle)
        seuils.append(
            {
                "valeur": m.group(1).replace(",", "."),
                "unite": unite,
                "extrait": fragment(texte, m.start(), m.end()),
            }
        )

    normes = sorted({re.sub(r"[\s.,;:]+$", "", n) for n in NORME.findall(texte)})
    renvois = sorted(set(RENVOI.findall(texte)))

    if not (seuils or normes or caractere == "obligation"):
        return None

    return {
        "article": article["numero"],
        "intitule": article.get("intitule", ""),
        "section": article.get("section", ""),
        "sujets": sujets,
        "caractere": caractere,
        "seuils": seuils,
        "normes": normes,
        "renvois": renvois,
    }


def main() -> int:
    resultat: dict[str, dict] = {}
    total_seuils = total_normes = 0

    for sigle in SIGLES:
        try:
            articles = charger(sigle)
        except SystemExit:
            print(f"  {sigle} : index absent, ignoré")
            continue

        obligations = [o for o in (analyser(a) for a in articles.values()) if o]
        obligations.sort(key=lambda o: [int(x) for x in o["article"].split(".")])

        avec_seuil = [o for o in obligations if o["seuils"]]
        avec_norme = [o for o in obligations if o["normes"]]
        par_sujet: dict[str, int] = {}
        for o in obligations:
            for s in o["sujets"] or ["(non nommé)"]:
                par_sujet[s] = par_sujet.get(s, 0) + 1

        total_seuils += sum(len(o["seuils"]) for o in avec_seuil)
        total_normes += len({n for o in obligations for n in o["normes"]})

        resultat[sigle] = {"obligations": obligations}
        print(
            f"  {sigle} : {len(obligations)} articles porteurs "
            f"({len(avec_seuil)} avec seuil, {len(avec_norme)} avec norme)"
        )
        print(f"        sujets : {dict(sorted(par_sujet.items(), key=lambda kv: -kv[1]))}")

    SORTIE.parent.mkdir(parents=True, exist_ok=True)
    SORTIE.write_text(
        json.dumps(resultat, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
    )
    print(f"\n{total_seuils} seuil(s), {total_normes} norme(s) — écrits dans {SORTIE}")

    ecrire_module_runtime(resultat)
    return 0


# Articles cités par le code : « RSST, art. 141.3 », « CSTC art. 2.10.15 »
CITATION_CODE = re.compile(
    r"\b(LSST|RSST|CSTC)\s*,?\s*art\.\s*"
    r"(\d+(?:\.\d+)*(?:\s*(?:,|et|à)\s*\d+(?:\.\d+)*)*)"
)
NUMERO_SEUL = re.compile(r"\d+(?:\.\d+)*")


def articles_cites() -> dict[str, set[str]]:
    """Relève les articles que le code cite réellement.

    Le module d'exécution ne porte QUE ceux-là. Embarquer les 1 100 articles
    porteurs mettrait des centaines de kilooctets dans le navigateur pour
    afficher une poignée de seuils.
    """
    cites: dict[str, set[str]] = {}
    for fichier in sorted(Path("src").rglob("*")):
        if fichier.suffix not in {".ts", ".tsx"} or not fichier.is_file():
            continue
        if fichier.name.endswith(".genere.ts"):
            continue
        for m in CITATION_CODE.finditer(fichier.read_text(encoding="utf-8")):
            cites.setdefault(m.group(1), set()).update(NUMERO_SEUL.findall(m.group(2)))
    return cites


def ecrire_module_runtime(resultat: dict) -> None:
    """Écrit ce que l'interface affiche : seuils et normes des articles cités."""
    cites = articles_cites()
    lignes = [
        "/* © 2026 Preventera — AgenticX5. Tous droits réservés. Voir LICENSE.md. */",
        "/* FICHIER GÉNÉRÉ — ne pas modifier à la main.",
        " * Produit par scripts/ontologie/extraire_obligations.py depuis les PDF",
        " * officiels de LégisQuébec.",
        " *",
        " * Ne contient que les articles CITÉS par le code : les seuils des",
        " * 1 100 autres articles porteurs n'ont rien à faire dans le bundle.",
        " */",
        "",
        "export interface Seuil {",
        "  /** Valeur numérique, point décimal. */",
        "  valeur: string",
        "  /** Unité telle qu'écrite au texte : m, dBA, travailleurs, jours… */",
        "  unite: string",
        "  /** Fragment de phrase autour du seuil — « 3 m » seul ne dit rien. */",
        "  extrait: string",
        "}",
        "",
        "export interface Obligation {",
        "  /** Sujets nommés par l'article : employeur, travailleur, maître d'œuvre. */",
        "  sujets: readonly string[]",
        "  seuils: readonly Seuil[]",
        "  /** Normes techniques incorporées par renvoi. */",
        "  normes: readonly string[]",
        "}",
        "",
        "/** Clé : « RSST 141.3 ». */",
        "export const OBLIGATIONS: Readonly<Record<string, Obligation>> = {",
    ]

    retenues = 0
    for sigle, bloc in resultat.items():
        voulus = cites.get(sigle, set())
        for o in bloc["obligations"]:
            if o["article"] not in voulus:
                continue
            if not (o["seuils"] or o["normes"] or o["sujets"]):
                continue
            retenues += 1
            seuils = ", ".join(
                "{ valeur: %r, unite: %r, extrait: %r }"
                % (s["valeur"], s["unite"], s["extrait"])
                for s in o["seuils"]
            )
            lignes.append(
                f"  {sigle + ' ' + o['article']!r}: {{ "
                f"sujets: {list(o['sujets'])!r}, "
                f"seuils: [{seuils}], "
                f"normes: {list(o['normes'])!r} }},"
            )

    lignes += ["}", ""]
    # Python écrit les chaînes en apostrophes simples, ce qui convient au style
    # du projet ; seuls les échappements diffèrent.
    contenu = "\n".join(lignes).replace('\\x27', "\\'")
    SORTIE_RUNTIME.parent.mkdir(parents=True, exist_ok=True)
    SORTIE_RUNTIME.write_text(contenu, encoding="utf-8")
    print(f"{retenues} article(s) cité(s) porté(s) dans {SORTIE_RUNTIME}")


if __name__ == "__main__":
    raise SystemExit(main())
