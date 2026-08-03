#!/usr/bin/env python3
# © 2026 Preventera — AgenticX5. Tous droits réservés. Voir LICENSE.md.
"""
Interdit au produit d'affirmer une conformité qu'il ne peut pas établir.

CE QUE CE CONTRÔLE EMPÊCHE
    « Conforme CNESST », « programmes conformes aux exigences CNESST »,
    « Conforme aux exigences CNESST/LMRSST » — jusqu'à sept endroits l'écrivaient,
    dont deux à l'intérieur du document produit.

    Trois raisons de ne plus l'écrire :

      1. La CNESST ne certifie aucun logiciel. Rien ne fonde le label.
      2. La conformité se juge sur un ÉTABLISSEMENT, pas sur un outil. Un
         programme parfaitement composé ne rend pas conforme un employeur qui
         ne l'applique pas.
      3. C'est l'affirmation qu'un acheteur institutionnel vérifie en premier,
         et celle dont il tirera les conséquences si elle est fausse.

CE QUI RESTE PERMIS
    Dire ce qui est vrai : le produit est ALIGNÉ sur des textes qu'il nomme,
    date et cite à l'article. Et dire à qui la conformité incombe.

    Le mot « conforme » reste également permis là où il qualifie l'objet du
    droit et non le produit : un indicateur « conforme » à son seuil, un
    équipement « conforme à la norme CSA », une réponse « Non conforme » dans
    un tableau de bord. Ce sont des états mesurés, pas des prétentions.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

SOURCE = Path("src")

# Ce que le produit ne peut pas affirmer de LUI-MÊME ou de ce qu'il produit.
INTERDIT = re.compile(
    r"(?:"
    r"[Cc]onforme[s]?\s+(?:aux?\s+(?:exigences|normes)\s+)?(?:CNESST|LMRSST|LSST)"
    r"|[Cc]onformité\s+(?:CNESST|LMRSST|LSST)\s+(?:intégrée|garantie|assurée)"
    r"|certifié[e]?\s+(?:par\s+la\s+)?CNESST"
    r"|garantit\s+la\s+conformité"
    r"|assure\s+la\s+conformité"
    r")"
)

BLOC = re.compile(r"/\*.*?\*/", re.DOTALL)
LIGNE = re.compile(r"//[^\n]*")


def sans_commentaires(texte: str) -> str:
    """Les commentaires DISCUTENT la règle — l'en-tête de ce script en cite
    les formulations proscrites. Ils ne parviennent jamais à l'utilisateur."""
    texte = BLOC.sub(lambda m: re.sub(r"[^\n]", " ", m.group(0)), texte)
    return LIGNE.sub(lambda m: " " * len(m.group(0)), texte)


def main() -> int:
    if not SOURCE.exists():
        print(f"{SOURCE} introuvable — lancer depuis la racine du dépôt.")
        return 1

    anomalies: list[tuple[str, int, str]] = []
    fichiers = sorted(
        f for f in SOURCE.rglob("*") if f.suffix in {".ts", ".tsx"} and f.is_file()
    )

    for fichier in fichiers:
        contenu = sans_commentaires(fichier.read_text(encoding="utf-8"))
        for m in INTERDIT.finditer(contenu):
            ligne = contenu[: m.start()].count("\n") + 1
            texte_ligne = contenu.split("\n")[ligne - 1].strip()
            anomalies.append((str(fichier), ligne, texte_ligne[:110]))

    print(f"{len(fichiers)} fichier(s) parcouru(s).")

    if anomalies:
        print(f"\nÉCHEC — {len(anomalies)} affirmation(s) de conformité non fondée(s) :")
        for chemin, ligne, extrait in anomalies:
            print(f"  - {chemin}:{ligne}")
            print(f"      {extrait}")
        print(
            "\n  Dire plutôt ce qui est vrai : le produit est aligné sur des textes"
            "\n  qu'il nomme et date, et la conformité relève de l'employeur."
        )
        return 1

    print("OK — le produit n'affirme aucune conformité qu'il ne peut établir.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
