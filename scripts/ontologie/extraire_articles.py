#!/usr/bin/env python3
# © 2026 Preventera — AgenticX5. Tous droits réservés. Voir LICENSE.md.
"""
Extrait l'index des articles du RSST et du CSTC depuis les PDF officiels.

POURQUOI UN INDEX PLUTÔT QU'UNE RÈGLE DE FORME
    `instruments.ts` validait les citations sur la forme du numéro : entiers
    pour le RSST, décimales pour le CSTC. Le texte contredit les deux. Le RSST
    numérote en entiers mais admet des suffixes d'insertion sur deux niveaux —
    l'article 312.45.1 existe. Le CSTC numérote en décimales, mais ses annexes
    et ses paragraphes de définitions produisent des lignes en entiers qui
    ressemblent à des articles sans en être.

    Une règle de forme ne peut pas trancher ça. La liste exacte, si : un numéro
    cité est valide s'il figure dans l'index extrait du texte officiel, et faux
    sinon. C'est une vérification, plus une heuristique.

COMMENT LES ARTICLES SONT REPÉRÉS
    Par la typographie, pas par le texte. Dans les deux PDF, le numéro d'article
    est le seul élément composé en gras corps 13 ; l'intitulé qui le suit est en
    gras corps 11, le texte courant en romain corps 11. Les énumérations
    (« 1° », « a) »), les grilles d'annexes et les paragraphes de définitions
    n'ont aucune de ces propriétés — ils disparaissent d'eux-mêmes.

CE QUI EST CONSERVÉ, ET CE QUI NE L'EST PAS
    Le numéro, l'intitulé et la section. PAS le corps de l'article : le produit
    cite et lie les textes des Publications du Québec, il ne les republie pas.
    Un index de numéros et d'intitulés est une table des matières — une donnée
    de référence, pas une reproduction de l'œuvre.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    print("PyMuPDF requis : pip install pymupdf", file=sys.stderr)
    raise SystemExit(1)

DOSSIER = Path("textes-officiels")
# L'index complet sert aux scripts d'ontologie et à la vérification. Il ne doit
# PAS être importé par l'application : 250 ko de sections, d'intitulés et de
# pages n'ont rien à faire dans un bundle de navigateur.
SORTIE = Path("data/reglementation/articles-index.json")
# Ce que l'application embarque : les seuls numéros citables. Quelques ko.
SORTIE_RUNTIME = Path("src/lib/articlesCitables.genere.ts")

TEXTES = [
    ("RSST", "S-2.1, R. 13.pdf", "RLRQ c. S-2.1, r. 13"),
    ("CSTC", "S-2.1, R. 4.pdf", "RLRQ c. S-2.1, r. 4"),
]

# Le numéro d'article : gras, corps 13. Le seul élément du document à l'être.
CORPS_NUMERO = 13.0
GRAS = 16  # bit « bold » des flags PyMuPDF

NUMERO = re.compile(r"^(\d+(?:\.\d+)*)\.?$")
SECTION = re.compile(r"^(SECTION|CHAPITRE|ANNEXE)\b")
# « ANNEXE 8 » suivi de « (a. 7.2.1) » : l'article du corps auquel elle se rattache.
ENTETE_ANNEXE = re.compile(r"^ANNEXE\s+(\S+)\s*$")
RATTACHEMENT = re.compile(r"^\(\s*a\.\s*([\d.]+)")
SOUS_SECTION = re.compile(r"^§\s*[\d.]+\s*[—–-]\s*(.+)$")
# « (Abrogé). », « (Abrogée). » — l'article n'a plus de contenu normatif.
ABROGE = re.compile(r"^\(Abrog[ée]e?\)")


def est_gras(span: dict) -> bool:
    return bool(span["flags"] & GRAS) or "Bold" in span["font"]


def extraire_annexes(chemin: Path) -> list[dict]:
    """
    Relève les annexes, leur intitulé et l'article auquel elles se rattachent.

    Les annexes ne sont PAS composées comme le corps : leurs dispositions sont
    en romain corps 11, sans gras ni corps 13. La détection typographique du
    corps les manque donc entièrement — et c'est délibérément qu'on les traite
    à part plutôt que d'assouplir la règle, ce qui ferait rentrer toutes les
    énumérations avec elles.

    Leur contenu compte : les annexes du RSST portent les valeurs limites
    d'exposition, celles du CSTC les grilles d'inspection. Ce relevé les rend
    citables comme annexes, sans les confondre avec des articles du corps —
    « annexe 8, disposition 8.2 » n'est pas « article 8.2 ».
    """
    doc = fitz.open(chemin)
    annexes: list[dict] = []

    for numero_page in range(doc.page_count):
        spans = [
            s
            for bloc in doc[numero_page].get_text("dict")["blocks"]
            for ligne in bloc.get("lines", [])
            for s in ligne["spans"]
            if s["text"].strip()
        ]
        for i, s in enumerate(spans):
            m = ENTETE_ANNEXE.match(s["text"].strip())
            if not (m and est_gras(s)):
                continue
            suite = [x["text"].strip() for x in spans[i + 1 : i + 5]]
            rattache = ""
            titre_parts: list[str] = []
            for texte_suite in suite:
                mr = RATTACHEMENT.match(texte_suite)
                if mr and not rattache:
                    rattache = mr.group(1)
                elif texte_suite and not texte_suite.startswith("("):
                    titre_parts.append(texte_suite)
            titre = " ".join(titre_parts).strip()
            # La table des matières des annexes n'a PAS de points de conduite :
            # elle enchaîne les intitulés. Le seul marqueur fiable du sommaire
            # est qu'une annexe y est suivie immédiatement d'une autre.
            # Un intitulé d'annexe ne contient jamais le mot ANNEXE : quand il
            # apparaît, c'est qu'on lit la liste des annexes du sommaire, où
            # elles s'enchaînent sans intitulé propre.
            if "...." in titre or "ANNEXE" in titre.upper():
                continue
            annexes.append(
                {
                    "numero": m.group(1),
                    "titre": re.sub(r"\s+", " ", titre),
                    "rattacheeA": rattache,
                    "abrogee": bool(re.match(r"\(Abrog[ée]e?\)", titre)),
                    "page": numero_page + 1,
                }
            )

    # Une annexe reparaît en en-tête de page et dans le sommaire. Retenir celle
    # qui porte un rattachement — c'est nécessairement l'occurrence du corps —
    # et à défaut la dernière vue, le corps venant après le sommaire.
    vues: dict[str, dict] = {}
    for a in annexes:
        precedent = vues.get(a["numero"])
        if precedent is None or (a["rattacheeA"] and not precedent["rattacheeA"]):
            vues[a["numero"]] = a
        elif not precedent["rattacheeA"]:
            vues[a["numero"]] = a
    return sorted(vues.values(), key=lambda a: a["page"])


def extraire(chemin: Path, sigle: str) -> list[dict]:
    doc = fitz.open(chemin)
    articles: list[dict] = []
    section_courante = ""
    sous_section_courante = ""

    for numero_page in range(doc.page_count):
        page = doc[numero_page]
        spans: list[dict] = []
        for bloc in page.get_text("dict")["blocks"]:
            for ligne in bloc.get("lines", []):
                for s in ligne["spans"]:
                    if s["text"].strip():
                        spans.append(s)

        for i, s in enumerate(spans):
            texte = s["text"].strip()
            suivant = spans[i + 1]["text"].strip() if i + 1 < len(spans) else ""

            # La table des matières reprend tous les intitulés de sections, avec
            # des points de conduite. Un intitulé suivi de points est une entrée
            # de sommaire, pas un en-tête de section dans le corps.
            if SECTION.match(texte) and est_gras(s):
                if "...." not in suivant:
                    section_courante = f"{texte} {suivant}".strip()
                    sous_section_courante = ""
                continue

            m_sous = SOUS_SECTION.match(texte)
            if m_sous and "...." not in texte:
                sous_section_courante = m_sous.group(1).strip()
                continue

            if not (est_gras(s) and abs(s["size"] - CORPS_NUMERO) < 0.6):
                continue

            m = NUMERO.match(texte)
            if not m:
                continue

            # L'intitulé est le span suivant s'il est en gras corps 11 ; sinon
            # l'article n'en porte pas, ce qui est fréquent dans le CSTC.
            intitule = ""
            debut_corps = ""
            if i + 1 < len(spans):
                s1 = spans[i + 1]
                if est_gras(s1) and s1["size"] < CORPS_NUMERO - 0.6:
                    intitule = s1["text"].strip().rstrip(":").strip()
                    debut_corps = spans[i + 2]["text"].strip() if i + 2 < len(spans) else ""
                else:
                    debut_corps = s1["text"].strip()

            articles.append(
                {
                    "numero": m.group(1),
                    "intitule": intitule,
                    "section": section_courante,
                    "sousSection": sous_section_courante,
                    # Un article abrogé ne fonde plus aucune obligation : le
                    # citer comme telle serait pire qu'inventer un numéro.
                    "abroge": bool(ABROGE.match(debut_corps)),
                    "page": numero_page + 1,
                }
            )

    return articles


def cle_tri(numero: str) -> list[int]:
    return [int(x) for x in numero.split(".")]


def main() -> int:
    if not DOSSIER.exists():
        print(f"{DOSSIER} introuvable — déposer les PDF officiels d'abord.")
        return 1

    resultat: dict[str, dict] = {}
    total = 0

    for sigle, nom_fichier, chapitre in TEXTES:
        chemin = DOSSIER / nom_fichier
        if not chemin.exists():
            print(f"  MANQUANT {chemin}")
            continue

        articles = extraire(chemin, sigle)

        # Un même numéro ne doit apparaître qu'une fois. Les doublons révèlent
        # une reprise de titre en en-tête de page.
        vus: dict[str, dict] = {}
        doublons = 0
        for a in articles:
            if a["numero"] in vus:
                doublons += 1
                continue
            vus[a["numero"]] = a

        ordonnes = sorted(vus.values(), key=lambda a: cle_tri(a["numero"]))
        profondeurs: dict[int, int] = {}
        for a in ordonnes:
            p = a["numero"].count(".")
            profondeurs[p] = profondeurs.get(p, 0) + 1

        annexes = extraire_annexes(chemin)
        resultat[sigle] = {
            "chapitre": chapitre,
            "source": nom_fichier,
            "articles": ordonnes,
            "annexes": annexes,
        }
        total += len(ordonnes)

        sans_intitule = sum(1 for a in ordonnes if not a["intitule"])
        abroges = sum(1 for a in ordonnes if a["abroge"])
        sans_section = sum(1 for a in ordonnes if not a["section"])
        print(
            f"  {sigle} : {len(ordonnes)} articles "
            f"({doublons} doublon(s) écarté(s), {sans_intitule} sans intitulé, "
            f"{abroges} abrogé(s), {sans_section} sans section)"
        )
        print(f"        profondeurs {dict(sorted(profondeurs.items()))}")
        print(f"        de {ordonnes[0]['numero']} à {ordonnes[-1]['numero']}")
        rattachees = sum(1 for a in annexes if a["rattacheeA"])
        print(f"        {len(annexes)} annexe(s), dont {rattachees} rattachée(s) à un article")

    SORTIE.parent.mkdir(parents=True, exist_ok=True)
    SORTIE.write_text(
        json.dumps(resultat, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
    )

    ecrire_module_runtime(resultat)

    print(f"\n{total} articles écrits dans {SORTIE}")
    print(f"Module d'exécution écrit dans {SORTIE_RUNTIME}")
    return 0


def ecrire_module_runtime(resultat: dict) -> None:
    """
    Écrit le module que l'application importe : les numéros citables, rien de
    plus. Les articles ABROGÉS en sont exclus — les citer comme fondement d'une
    obligation serait plus grave qu'inventer un numéro, puisque le numéro, lui,
    existe et donne le change.
    """
    lignes = [
        "/* © 2026 Preventera — AgenticX5. Tous droits réservés. Voir LICENSE.md. */",
        "/* FICHIER GÉNÉRÉ — ne pas modifier à la main.",
        " * Produit par scripts/ontologie/extraire_articles.py depuis les PDF",
        " * officiels de LégisQuébec. Régénérer plutôt que corriger ici.",
        " *",
        " * Les articles abrogés sont exclus : ils existent au texte mais ne",
        " * fondent plus rien.",
        " */",
        "",
    ]
    for sigle, donnees in resultat.items():
        vivants = [a["numero"] for a in donnees["articles"] if not a["abroge"]]
        abroges = [a["numero"] for a in donnees["articles"] if a["abroge"]]
        lignes.append(
            f"/** {len(vivants)} articles en vigueur du {sigle} "
            f"({donnees['chapitre']}). */"
        )
        lignes.append(
            f"export const ARTICLES_{sigle}: ReadonlySet<string> = new Set(["
        )
        for i in range(0, len(vivants), 12):
            lignes.append("  " + ", ".join(f"'{n}'" for n in vivants[i : i + 12]) + ",")
        lignes.append("])")
        lignes.append("")
        lignes.append(f"/** {len(abroges)} articles abrogés du {sigle}. */")
        lignes.append(
            f"export const ABROGES_{sigle}: ReadonlySet<string> = new Set(["
        )
        for i in range(0, len(abroges), 12):
            lignes.append("  " + ", ".join(f"'{n}'" for n in abroges[i : i + 12]) + ",")
        lignes.append("])")
        lignes.append("")

    SORTIE_RUNTIME.parent.mkdir(parents=True, exist_ok=True)
    SORTIE_RUNTIME.write_text("\n".join(lignes), encoding="utf-8")


if __name__ == "__main__":
    raise SystemExit(main())
