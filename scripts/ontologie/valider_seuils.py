#!/usr/bin/env python3
# © 2026 Preventera — AgenticX5. Tous droits réservés. Voir LICENSE.md.
"""
Confronte les seuils codés dans le produit au texte officiel.

CE QUE CE CONTRÔLE ATTRAPE
    Un produit de conformité décide sur des nombres : 20 travailleurs pour le
    programme de prévention, 21 jours pour le comité, 10 sur un chantier. Ces
    nombres étaient jusqu'ici tenus de seconde main — une synthèse de la CNESST,
    une lecture antérieure — sans moyen de les confronter à la Loi.

    Chaque constante annotée `@seuil <SIGLE> art. <numéro> · <valeur> <unité>`
    est vérifiée contre la couche d'obligations extraite du texte. Trois façons
    d'échouer : l'article n'existe pas, il ne porte pas ce seuil, ou la valeur
    codée diffère de celle annotée.

    Une modification réglementaire qui déplacerait un seuil ferait donc échouer
    ce contrôle au lieu de passer inaperçue.

CE QU'IL NE FAIT PAS
    Il ne lit pas le sens de l'article. Qu'un article porte « 20 travailleurs »
    n'établit pas qu'il l'impose dans le sens que le produit lui prête — c'est
    au commentaire de la constante de le justifier, et à un humain de le
    relire. Le contrôle garantit l'existence et la valeur, pas l'interprétation.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

OBLIGATIONS = Path("data/reglementation/obligations.json")
SOURCE = Path("src")

# « @seuil LSST art. 58 · 20 travailleurs »
ANNOTATION = re.compile(
    r"@seuil\s+(LSST|RSST|CSTC|RMPPÉ|RMPPE)\s+art\.\s*([\d.]+)\s*[·:-]\s*"
    r"(\d+(?:[.,]\d+)?)\s*(\S+)"
)
# La constante suit l'annotation : « export const X = 20 »
CONSTANTE = re.compile(r"export const (\w+)\s*(?::\s*\w+)?\s*=\s*(\d+(?:\.\d+)?)")


def main() -> int:
    if not OBLIGATIONS.exists():
        print(f"{OBLIGATIONS} introuvable — lancer extraire_obligations.py d'abord.")
        return 1

    donnees = json.loads(OBLIGATIONS.read_text(encoding="utf-8"))
    # (sigle, article) -> ensemble des (valeur, unité) relevés au texte
    releves: dict[tuple[str, str], set[tuple[str, str]]] = {}
    extraits: dict[tuple[str, str, str], str] = {}
    for sigle, bloc in donnees.items():
        for o in bloc["obligations"]:
            cle = (sigle, o["article"])
            for s in o["seuils"]:
                releves.setdefault(cle, set()).add((s["valeur"], s["unite"]))
                extraits[(sigle, o["article"], s["valeur"])] = s["extrait"]

    anomalies: list[str] = []
    verifies = 0

    fichiers = sorted(
        f for f in SOURCE.rglob("*") if f.suffix in {".ts", ".tsx"} and f.is_file()
    )

    for fichier in fichiers:
        contenu = fichier.read_text(encoding="utf-8")
        for m in ANNOTATION.finditer(contenu):
            sigle, article, valeur, unite = m.groups()
            sigle = "RMPPÉ" if sigle == "RMPPE" else sigle
            ligne = contenu[: m.start()].count("\n") + 1
            valeur = valeur.replace(",", ".")

            # La constante que l'annotation documente est la suivante.
            suite = CONSTANTE.search(contenu, m.end())
            if not suite:
                anomalies.append(f"{fichier}:{ligne} — annotation sans constante à sa suite")
                continue
            nom, codee = suite.group(1), suite.group(2)
            verifies += 1

            if codee != valeur:
                anomalies.append(
                    f"{fichier}:{ligne} — {nom} vaut {codee} mais l'annotation "
                    f"annonce {valeur}"
                )
                continue

            portes = releves.get((sigle, article))
            if portes is None:
                anomalies.append(
                    f"{fichier}:{ligne} — {nom} : {sigle} art. {article} ne porte "
                    f"aucun seuil relevé au texte"
                )
                continue

            # L'unité annotée peut être au singulier là où le texte est au
            # pluriel, et inversement.
            racine = unite.rstrip("s").lower()
            trouve = [
                (v, u) for v, u in portes if v == valeur and u.rstrip("s").lower() == racine
            ]
            if not trouve:
                dispo = ", ".join(f"{v} {u}" for v, u in sorted(portes))
                anomalies.append(
                    f"{fichier}:{ligne} — {nom} : {sigle} art. {article} ne porte pas "
                    f"« {valeur} {unite} ». Relevé au texte : {dispo}"
                )
                continue

            extrait = extraits.get((sigle, article, valeur), "")
            print(f"  OK  {nom} = {codee} — {sigle} art. {article}")
            print(f"      …{extrait}…")

    print(f"\n{verifies} seuil(s) confronté(s) au texte officiel.")

    if anomalies:
        print(f"\nÉCHEC — {len(anomalies)} anomalie(s) :")
        for a in anomalies:
            print(f"  - {a}")
        return 1

    if verifies == 0:
        print("Aucune annotation @seuil trouvée — rien à contrôler.")
        return 0

    print("OK — chaque seuil codé se retrouve au texte, à l'article annoncé.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
