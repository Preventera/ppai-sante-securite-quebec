#!/usr/bin/env python3
# © 2026 Preventera — AgenticX5. Tous droits réservés. Voir LICENSE.md.
"""
Corpus interrogeable des articles du RSST et du CSTC.

À QUOI ÇA SERT
    Rattacher une mesure de prévention à l'article qui la fonde suppose de lire
    le CONTENU des articles, pas seulement leur intitulé. Ce module découpe les
    PDF officiels article par article et permet de les chercher.

CE QUI N'EST PAS ÉCRIT SUR DISQUE
    Rien. Le corpus se reconstruit à chaque appel depuis les PDF et vit en
    mémoire. Le dépôt ne reçoit que des NUMÉROS d'articles rattachés à nos
    propres formulations — jamais le texte des Publications du Québec.

    C'est la raison d'être de ce module plutôt que d'un fichier intermédiaire :
    l'outil de recherche ne doit pas devenir un exemplaire du règlement.

USAGE
    python3 scripts/ontologie/corpus.py chercher "garde-corps" --instrument CSTC
    python3 scripts/ontologie/corpus.py article RSST 347
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    print("PyMuPDF requis : pip install pymupdf", file=sys.stderr)
    raise SystemExit(1)

DOSSIER = Path("textes-officiels")
INDEX = Path("data/reglementation/articles-index.json")

CORPS_NUMERO = 13.0
GRAS = 16


def normaliser(texte: str) -> str:
    """Minuscules sans accents : « GARDE-CORPS » et « garde-corps » se valent."""
    sans = unicodedata.normalize("NFD", texte.lower())
    return "".join(c for c in sans if unicodedata.category(c) != "Mn")


def charger(sigle: str) -> dict[str, dict]:
    """Découpe un règlement en articles, du numéro jusqu'au numéro suivant."""
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    if sigle not in index:
        raise SystemExit(f"Instrument inconnu : {sigle}")

    doc = fitz.open(DOSSIER / index[sigle]["source"])
    meta = {a["numero"]: a for a in index[sigle]["articles"]}

    # Parcours linéaire : chaque numéro en gras corps 13 ouvre un article et
    # ferme le précédent.
    articles: dict[str, dict] = {}
    courant: str | None = None
    morceaux: list[str] = []

    for numero_page in range(doc.page_count):
        for bloc in doc[numero_page].get_text("dict")["blocks"]:
            for ligne in bloc.get("lines", []):
                for s in ligne["spans"]:
                    texte = s["text"].strip()
                    if not texte:
                        continue
                    gras = bool(s["flags"] & GRAS) or "Bold" in s["font"]
                    if gras and abs(s["size"] - CORPS_NUMERO) < 0.6 and re.fullmatch(
                        r"\d+(?:\.\d+)*\.?", texte
                    ):
                        if courant:
                            articles[courant]["texte"] = re.sub(
                                r"\s+", " ", " ".join(morceaux)
                            ).strip()
                        courant = texte.rstrip(".")
                        morceaux = []
                        articles[courant] = {
                            **meta.get(courant, {"numero": courant}),
                            "texte": "",
                        }
                    elif courant:
                        morceaux.append(texte)

    if courant:
        articles[courant]["texte"] = re.sub(r"\s+", " ", " ".join(morceaux)).strip()

    return articles


def chercher(termes: list[str], sigles: list[str], limite: int) -> None:
    for sigle in sigles:
        articles = charger(sigle)
        motifs = [normaliser(t) for t in termes]
        resultats = []
        for numero, a in articles.items():
            if a.get("abroge"):
                continue
            foin = normaliser(f"{a.get('intitule', '')} {a['texte']}")
            score = sum(foin.count(m) for m in motifs)
            if score and all(m in foin for m in motifs):
                resultats.append((score, numero, a))

        resultats.sort(key=lambda r: (-r[0], [int(x) for x in r[1].split(".")]))
        print(f"\n===== {sigle} — {len(resultats)} article(s) =====")
        for score, numero, a in resultats[:limite]:
            titre = a.get("intitule") or "(sans intitulé)"
            print(f"\n  {sigle} art. {numero} — {titre}   [{score} occurrence(s)]")
            print(f"    section : {a.get('section', '')[:80]}")
            extrait = a["texte"][:340]
            print(f"    {extrait}{'…' if len(a['texte']) > 340 else ''}")


def montrer(sigle: str, numero: str) -> None:
    articles = charger(sigle)
    a = articles.get(numero)
    if not a:
        raise SystemExit(f"{sigle} art. {numero} : absent de l'index")
    print(f"{sigle} art. {numero} — {a.get('intitule') or '(sans intitulé)'}")
    print(f"section      : {a.get('section', '')}")
    print(f"sous-section : {a.get('sousSection', '')}")
    print(f"abrogé       : {a.get('abroge')}")
    print(f"\n{a['texte']}")


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    sous = p.add_subparsers(dest="commande", required=True)

    c = sous.add_parser("chercher")
    c.add_argument("termes", nargs="+")
    c.add_argument("--instrument", default="RSST,CSTC")
    c.add_argument("--limite", type=int, default=6)

    m = sous.add_parser("article")
    m.add_argument("instrument")
    m.add_argument("numero")

    args = p.parse_args()
    if args.commande == "chercher":
        chercher(args.termes, args.instrument.split(","), args.limite)
    else:
        montrer(args.instrument, args.numero)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
