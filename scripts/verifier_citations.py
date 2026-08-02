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
    Un article ne se cite que si le texte de son instrument a été consulté, ou
    si ce numéro précis est corroboré par le renvoi d'un texte consulté. La
    liste fait foi dans `src/lib/instruments.ts` — ce script la lit plutôt que
    de la redéclarer, pour qu'il n'y ait qu'un seul endroit à tenir à jour.

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


def lire_instruments() -> dict[str, dict]:
    """Extrait de `instruments.ts` la forme, l'état de consultation et les
    articles corroborés de chaque instrument."""
    texte = INSTRUMENTS.read_text(encoding="utf-8")
    instruments: dict[str, dict] = {}

    # Chaque déclaration « export const X: Instrument = { ... } »
    for bloc in re.finditer(
        r"export const \w+: Instrument = \{(.*?)\n\}", texte, re.DOTALL
    ):
        corps = bloc.group(1)
        sigle = re.search(r"sigle:\s*'([^']+)'", corps)
        forme = re.search(r"formeArticle:\s*'([^']+)'", corps)
        consulte = re.search(r"texteConsulte:\s*(true|false)", corps)
        if not (sigle and forme and consulte):
            continue
        corrobores = re.search(r"articlesCorrobores:\s*\[([^\]]*)\]", corps)
        instruments[sigle.group(1)] = {
            "forme": forme.group(1),
            "consulte": consulte.group(1) == "true",
            "corrobores": set(re.findall(r"'([^']+)'", corrobores.group(1)))
            if corrobores
            else set(),
        }

    return instruments


def bien_forme(forme: str, article: str) -> bool:
    if forme == "decimal":
        return re.fullmatch(r"\d+(\.\d+)+", article) is not None
    return re.fullmatch(r"\d+(\.\d+)?", article) is not None


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
        etat = "texte consulté" if i["consulte"] else "texte NON consulté"
        extra = f", corroborés : {', '.join(sorted(i['corrobores']))}" if i["corrobores"] else ""
        print(f"  {sigle:<6} numérotation {i['forme']:<8} {etat}{extra}")
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
                if not bien_forme(instrument["forme"], article):
                    anomalies.append(
                        f"{fichier}:{ligne} — « {sigle} art. {article} » : numérotation "
                        f"{instrument['forme']} attendue pour cet instrument"
                    )
                elif not instrument["consulte"] and article not in instrument["corrobores"]:
                    anomalies.append(
                        f"{fichier}:{ligne} — « {sigle} art. {article} » : texte non "
                        f"consulté et numéro non corroboré"
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
