#!/usr/bin/env python3
# © 2026 Preventera — AgenticX5. Tous droits réservés. Voir LICENSE.md.
"""
Contrôle les citations d'articles réglementaires présentes dans le code.

CE QUE CE SCRIPT EMPÊCHE
    Un produit de conformité qui cite un article inexistant, ou qui applique à
    un texte la numérotation d'un autre, se disqualifie devant l'organisme qu'il
    prétend outiller. Le code en portait dix-sept, héritées de la génération
    initiale et jamais vérifiées ; quatre d'entre elles écrivaient « RSST
    art. 2.4.1 », c'est-à-dire la numérotation décimale du CSTC appliquée au
    RSST, qui numérote en entiers.

LA RÈGLE APPLIQUÉE
    Un article ne se cite que s'il figure, EN VIGUEUR, dans l'index extrait du
    texte officiel — ou, pour un instrument sans index, si son texte a été
    travaillé article par article. Les listes viennent de
    `src/lib/articlesCitables.genere.ts`, produit depuis les PDF de LégisQuébec.
    Ce script les lit plutôt que de les redéclarer.

CE QU'IL NE CONTRÔLE PAS
    Les commentaires. Ils servent à discuter la règle — l'en-tête de
    `prevention.ts` cite « RSST art. 2.9.1 » comme exemple de la faute à ne pas
    commettre — et ne parviennent jamais à l'utilisateur.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

SOURCE = Path("src")
INSTRUMENTS = Path("src/lib/instruments.ts")
ARTICLES = Path("src/lib/articlesCitables.genere.ts")

# « RSST art. 2.4.1 », « LSST Art. 51 », « CSTC article 3.9.1 », et les
# énumérations : « LSST art. 51, 58-59 », « art. 68-78, 88 et s. ». Ne contrôler
# que le premier numéro laisserait passer tout ce qui suit la virgule.
CITATION = re.compile(
    r"\b(LSST|RSST|CSTC|RMPPÉ|RMPPE)\s*,?\s*"
    r"(?:art\.|Art\.|articles?)\s*"
    r"(\d+(?:\.\d+)*(?:\s*(?:,|et|à|-|–)\s*\d+(?:\.\d+)*)*)"
)

NUMERO = re.compile(r"\d+(?:\.\d+)*")

BLOC = re.compile(r"/\*.*?\*/", re.DOTALL)
LIGNE = re.compile(r"//[^\n]*")


def lire_index_articles() -> dict[str, dict[str, set[str]]]:
    """Lit les ensembles d'articles en vigueur et abrogés du module généré."""
    if not ARTICLES.exists():
        return {}
    texte = ARTICLES.read_text(encoding="utf-8")
    index: dict[str, dict[str, set[str]]] = {}
    for prefixe, cle in (("ARTICLES", "vigueur"), ("ABROGES", "abroges")):
        motif = rf"export const {prefixe}_(\w+): ReadonlySet<string> = new Set\(\[(.*?)\]\)"
        for m in re.finditer(motif, texte, re.DOTALL):
            index.setdefault(m.group(1), {}).setdefault(cle, set()).update(
                re.findall(r"'([^']+)'", m.group(2))
            )
    return index


def lire_instruments() -> dict[str, dict]:
    """Croise les désignations de `instruments.ts` avec l'index des articles."""
    texte = INSTRUMENTS.read_text(encoding="utf-8")
    articles = lire_index_articles()
    instruments: dict[str, dict] = {}

    # Chaque déclaration « export const X: Instrument = { ... } »
    for bloc in re.finditer(
        r"export const \w+: Instrument = \{(.*?)\n\}", texte, re.DOTALL
    ):
        corps = bloc.group(1)
        sigle = re.search(r"sigle:\s*'([^']+)'", corps)
        if not sigle:
            continue
        nom = sigle.group(1)
        consulte = re.search(r"texteConsulte:\s*(true|false)", corps)
        # Le nom de la constante générée n'est pas accentué : RMPPÉ -> RMPPE.
        cle_index = nom.replace("É", "E")
        instruments[nom] = {
            "consulte": bool(consulte and consulte.group(1) == "true"),
            "vigueur": articles.get(cle_index, {}).get("vigueur", set()),
            "abroges": articles.get(cle_index, {}).get("abroges", set()),
        }

    return instruments


def sans_commentaires(texte: str) -> str:
    """Neutralise les commentaires en préservant le numéro des lignes."""
    texte = BLOC.sub(lambda m: re.sub(r"[^\n]", " ", m.group(0)), texte)
    return LIGNE.sub(lambda m: " " * len(m.group(0)), texte)


def main() -> int:
    if not INSTRUMENTS.exists():
        print(f"{INSTRUMENTS} introuvable — lancer depuis la racine du dépôt.")
        return 1

    instruments = lire_instruments()
    if not instruments:
        print("Aucun instrument lu depuis instruments.ts — format inattendu.")
        return 1

    print("Instruments déclarés :")
    for sigle, i in instruments.items():
        if i["vigueur"]:
            etat = f"{len(i['vigueur'])} articles en vigueur, {len(i['abroges'])} abrogés"
        elif i["consulte"]:
            etat = "sans index, texte travaillé article par article"
        else:
            etat = "sans index ni texte travaillé — aucune citation admise"
        print(f"  {sigle:<6} {etat}")
    print()

    anomalies: list[str] = []
    citations = 0

    fichiers = sorted(
        f for f in SOURCE.rglob("*") if f.suffix in {".ts", ".tsx"} and f.is_file()
    )

    for fichier in fichiers:
        contenu = sans_commentaires(fichier.read_text(encoding="utf-8"))
        for m in CITATION.finditer(contenu):
            sigle = "RMPPÉ" if m.group(1) == "RMPPE" else m.group(1)
            instrument = instruments.get(sigle)
            if instrument is None:
                continue
            ligne = contenu[: m.start()].count("\n") + 1

            # Une énumération se contrôle numéro par numéro : « art. 51, 58-59 »
            # compte pour trois citations, dont une seule est corroborée.
            for article in NUMERO.findall(m.group(2)):
                citations += 1
                if article in instrument["abroges"]:
                    anomalies.append(
                        f"{fichier}:{ligne} — « {sigle} art. {article} » : article "
                        f"ABROGÉ — il figure au texte mais ne fonde plus rien"
                    )
                elif instrument["vigueur"]:
                    if article not in instrument["vigueur"]:
                        anomalies.append(
                            f"{fichier}:{ligne} — « {sigle} art. {article} » : "
                            f"absent du texte officiel"
                        )
                elif not instrument["consulte"]:
                    anomalies.append(
                        f"{fichier}:{ligne} — « {sigle} art. {article} » : instrument "
                        f"sans index et texte non travaillé"
                    )

    print(f"{len(fichiers)} fichier(s) parcouru(s), {citations} citation(s) d'article.")

    if anomalies:
        print(f"\nÉCHEC — {len(anomalies)} citation(s) non autorisée(s) :")
        for a in anomalies:
            print(f"  - {a}")
        return 1

    print("OK — toutes les citations sont autorisées.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
