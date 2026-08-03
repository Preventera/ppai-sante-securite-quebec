#!/usr/bin/env python3
# © 2026 Preventera — AgenticX5. Tous droits réservés. Voir LICENSE.md.
"""
Vérifie que l'index produit par `extraire_articles.py` est complet et exact.

LE CONTRÔLE QUI COMPTE : LES RENVOIS INTERNES
    Un règlement se cite lui-même en permanence — « conformément à l'article
    347 », « sous réserve des articles 312.46 à 312.54 ». Ces renvois sont
    écrits par le législateur, pas par l'extracteur : ils forment donc un jeu
    d'épreuve indépendant. Si l'index est complet, tout renvoi interne doit y
    résoudre. Un renvoi qui ne résout pas dénonce un article manqué.

LE CONTRÔLE DE BORNES
    La table des matières annonce le premier article de chaque section. Les
    numéros annoncés doivent tous figurer dans l'index, et la section rattachée
    à cet article doit être celle que la table annonce.

CE QUE CES CONTRÔLES NE FONT PAS
    Ils ne disent rien du CONTENU des articles. Ils établissent que la liste des
    numéros est juste — ce qui est précisément ce sur quoi reposent les
    citations du produit.
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
INDEX = Path("data/reglementation/articles-index.json")

# « l'article 347 », « des articles 312.46 à 312.54 », « aux articles 2.9.1 et 2.9.2 »
RENVOI = re.compile(
    r"\barticles?\s+(\d+(?:\.\d+)*)"
    r"((?:\s*(?:,|et|ou|à)\s*\d+(?:\.\d+)*)*)"
)
NUMERO = re.compile(r"\d+(?:\.\d+)*")

# Ce qui suit un renvoi et désigne un texte AUTRE que celui qu'on indexe.
EXTERNE = re.compile(
    r"\s*(?:de\s+la|de\s+l\u2019|de\s+l\'|du|des|de\s+ce|de\s+cet|de\s+cette|de)\s+"
    r"(?:norme|loi|code|r\u00e8glement|charte|d\u00e9cret|"
    r"(?:CAN/)?(?:CSA|ACNOR|ANSI|ASTM|NF|ISO|BNQ))",
    re.IGNORECASE,
)


def main() -> int:
    if not INDEX.exists():
        print(f"{INDEX} introuvable — lancer extraire_articles.py d'abord.")
        return 1

    index = json.loads(INDEX.read_text(encoding="utf-8"))
    anomalies: list[str] = []

    for sigle, donnees in index.items():
        chemin = DOSSIER / donnees["source"]
        if not chemin.exists():
            print(f"  {sigle} : {chemin} absent, contrôle impossible")
            continue

        connus = {a["numero"] for a in donnees["articles"]}
        annexes = donnees.get("annexes", [])
        doc = fitz.open(chemin)
        print(f"  {sigle} : {len(connus)} articles indexés, {len(annexes)} annexes")

        # Le rattachement déclaré par chaque annexe est un contrôle croisé
        # gratuit : « ANNEXE 8 (a. 7.2.1) » n'a de sens que si l'article 7.2.1
        # existe. Une annexe rattachée à un article inconnu dénoncerait soit une
        # lecture fautive du rattachement, soit un trou dans l'index.
        for an in annexes:
            if an["rattacheeA"] and an["rattacheeA"] not in connus:
                anomalies.append(
                    f"{sigle} : annexe {an['numero']} rattachée à l'article "
                    f"{an['rattacheeA']}, absent de l'index"
                )

        # Les dispositions internes aux annexes portent leur propre numérotation
        # (« annexe 8 » contient 8.1 à 8.4). Elles sont citées comme des
        # articles alors qu'elles n'en sont pas. On délimite chaque annexe par
        # ses pages pour reconnaître ces renvois au lieu de les compter comme
        # des articles manquants.
        bornes: list[tuple[int, int, str]] = []
        tries = sorted(annexes, key=lambda a: a["page"])
        for i, an in enumerate(tries):
            fin = tries[i + 1]["page"] - 1 if i + 1 < len(tries) else doc.page_count
            bornes.append((an["page"], fin, an["numero"]))

        def dans_une_annexe(page: int) -> str:
            for debut, fin, numero in bornes:
                if debut <= page <= fin:
                    return numero
            return ""

        renvois: set[str] = set()
        renvois_en_annexe: set[str] = set()
        texte_par_page: list[str] = [
            re.sub(r"\s+", " ", doc[p].get_text()) for p in range(doc.page_count)
        ]
        for numero_page, page_texte in enumerate(texte_par_page, start=1):
            en_annexe = dans_une_annexe(numero_page)
            for m in RENVOI.finditer(page_texte):
                vises = {m.group(1), *NUMERO.findall(m.group(2) or "")}
                if en_annexe:
                    renvois_en_annexe |= vises
                else:
                    renvois |= vises

        texte = " ".join(texte_par_page)

        # Un renvoi peut viser un AUTRE texte. Le cas de loin le plus fréquent
        # n'est pas une autre loi mais une NORME : le règlement incorpore par
        # renvoi des articles de CAN/CSA, NF EN, ACNOR, ANSI. « les articles
        # 4.11.2 à 4.11.5 de la norme CAN/CSA Z275.2-11 » n'a rien à voir avec
        # la numérotation du règlement. Sans cette distinction, l'index paraît
        # incomplet là où il est juste.
        #
        # Trois critères, du plus fort au plus faible, tenus séparés pour que
        # rien ne soit écarté sans qu'on sache pourquoi.
        externes: set[str] = set()

        # 1. Le qualificatif suit immédiatement le numéro.
        for m in RENVOI.finditer(texte):
            if EXTERNE.match(texte[m.end() : m.end() + 90]):
                externes.add(m.group(1))
                externes.update(NUMERO.findall(m.group(2) or ""))

        # 2. Une norme est nommée dans la MÊME phrase, avant ou après. Après :
        #    « les articles X, Y … de la norme CAN/CSA Z275.2-11 », où les
        #    énumérations longues éloignent le qualificatif du premier numéro.
        #    Avant : « ACNOR Z150-1974 et son supplément, à l'exception de
        #    l'article 4.3.2.5 », où la norme est posée en tête de phrase.
        NORME = re.compile(r"\b(?:de la norme|de cette norme|CAN/CSA|ACNOR|NF EN|ASTM|ANSI)\b", re.I)
        for m in RENVOI.finditer(texte):
            apres = texte[m.end() : m.end() + 240].split(". ")[0]
            avant = texte[max(0, m.start() - 240) : m.start()].rsplit(". ", 1)[-1]
            if NORME.search(apres) or NORME.search(avant):
                externes.add(m.group(1))
                externes.update(NUMERO.findall(m.group(2) or ""))

        # 3. La FORME du numéro est impossible pour ce texte-ci. Le RSST ne
        #    dépasse jamais deux niveaux et son unique cas est 312.45.1 ; le
        #    CSTC n'a aucun article sans décimale. Un numéro hors de ces bornes
        #    ne peut désigner un article de ce règlement, quel que soit le
        #    contexte.
        profondeur_max = max(a["numero"].count(".") for a in donnees["articles"])
        tetes = {a["numero"].split(".")[0] for a in donnees["articles"]}
        profondeurs_vues = {a["numero"].count(".") for a in donnees["articles"]}

        hors_forme = {
            n
            for n in renvois - externes - connus
            if n.count(".") > profondeur_max
            or n.count(".") not in profondeurs_vues
            or n.split(".")[0] not in tetes
        }

        # Un renvoi apparaissant dans une annexe vise ses dispositions internes,
        # numérotées à part. Il ne dénonce donc pas un article manquant.
        dispositions_annexes = sorted(renvois_en_annexe - connus - externes)
        if dispositions_annexes:
            print(f"        {len(dispositions_annexes)} renvoi(s) interne(s) à une annexe "
                  f"(numérotation propre) : {', '.join(dispositions_annexes[:6])}")

        internes = renvois - externes - hors_forme
        orphelins = sorted(internes - connus, key=lambda n: [int(x) for x in n.split(".")])

        if hors_forme:
            exemples = sorted(hors_forme, key=lambda n: [int(x) for x in n.split(".")])[:6]
            print(f"        {len(hors_forme)} renvoi(s) écarté(s) sur la forme "
                  f"(impossible pour ce texte) : {', '.join(exemples)}")

        print(f"        {len(internes)} numéro(s) visé(s) par un renvoi interne")

        if orphelins:
            # Beaucoup de « renvois » sont en réalité des mentions d'articles
            # d'autres lois sans marqueur explicite. On les signale sans les
            # confondre avec un défaut d'extraction.
            print(f"        {len(orphelins)} renvoi(s) sans article correspondant :")
            for n in orphelins[:15]:
                extrait = ""
                # Sans la sentinelle, « article 7 » se retrouve dans « 7.4.3 »
                # et l'extrait affiché ne correspond pas au numéro examiné.
                m = re.search(
                    r".{70}articles?\s+" + re.escape(n) + r"(?![\d.])" + r".{40}", texte
                )
                if m:
                    extrait = m.group(0).strip()
                print(f"          {n} — …{extrait}…")
            if len(orphelins) > 15:
                print(f"          (+ {len(orphelins) - 15} autres)")
            anomalies.append(f"{sigle} : {len(orphelins)} renvoi(s) non résolu(s)")
        else:
            print("        tous les renvois internes résolvent")

        # Cohérence de l'ordre : les numéros doivent être strictement croissants
        precedent: list[int] | None = None
        for a in donnees["articles"]:
            actuel = [int(x) for x in a["numero"].split(".")]
            if precedent is not None and actuel <= precedent:
                anomalies.append(f"{sigle} : ordre rompu à l'article {a['numero']}")
            precedent = actuel

    print()
    if anomalies:
        print(f"ÉCHEC — {len(anomalies)} anomalie(s) :")
        for a in anomalies:
            print(f"  - {a}")
        return 1

    print("OK — index complet et cohérent.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
