#!/usr/bin/env python3
"""
Ingestion des données ouvertes CNESST sur les lésions professionnelles.

Remplace `cnesst_data_analyzer.py`, qui grattait la page HTML de Données Québec
et enregistrait le code source de la page sous le nom `cnesst_raw_data.csv` :
le fichier produit n'a jamais contenu la moindre donnée.

Ce script interroge l'API CKAN du portail, qui expose les métadonnées du jeu de
données et les URL réelles des ressources. Aucune analyse de HTML n'est requise,
et la structure reste stable dans le temps.

CONTRAINTE MÉTHODOLOGIQUE
    Le grain est « une ligne = une lésion survenue ». Il n'existe aucun
    contre-exemple, c'est-à-dire aucun travailleur sans lésion. On ne peut donc
    PAS en dériver une probabilité d'occurrence. Tout taux exige un dénominateur
    d'effectifs, obtenu séparément. Ce script n'expose que des décomptes.

Usage :
    python cnesst_ingest.py --list
    python cnesst_ingest.py --download --out output/
"""

import argparse
import json
import sys
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

PORTAIL = "https://www.donneesquebec.ca"
API_PACKAGE_SHOW = f"{PORTAIL}/recherche/api/3/action/package_show"
JEU_DE_DONNEES = "lesions-professionnelles"

# Formats retenus : on écarte les documents de description au profit des données.
FORMATS_DONNEES = {"CSV", "XLSX", "JSON"}


def appeler_api(url: str, params: dict | None = None) -> dict:
    """Appelle l'API CKAN et renvoie la charge utile, ou lève une erreur explicite."""
    if params:
        url = f"{url}?{urlencode(params)}"

    requete = Request(url, headers={"User-Agent": "PPAI-SST-Quebec/1.0"})
    with urlopen(requete, timeout=60) as reponse:
        contenu = reponse.read()

    # Le grattage précédent échouait silencieusement en enregistrant du HTML :
    # on vérifie explicitement que la réponse est bien du JSON.
    try:
        charge = json.loads(contenu)
    except json.JSONDecodeError as erreur:
        apercu = contenu[:200].decode("utf-8", errors="replace")
        raise RuntimeError(
            f"Réponse non-JSON de {url} — le portail a probablement renvoyé une "
            f"page HTML. Début de la réponse : {apercu}"
        ) from erreur

    if not charge.get("success"):
        raise RuntimeError(f"L'API a refusé la requête : {charge.get('error')}")

    return charge["result"]


def lister_ressources() -> list[dict]:
    """Ressources téléchargeables du jeu de données."""
    resultat = appeler_api(API_PACKAGE_SHOW, {"id": JEU_DE_DONNEES})
    ressources = [
        r for r in resultat.get("resources", [])
        if (r.get("format") or "").upper() in FORMATS_DONNEES
    ]
    return sorted(ressources, key=lambda r: r.get("name") or "")


def telecharger(ressource: dict, dossier: Path) -> Path:
    """Télécharge une ressource et refuse silencieusement d'écrire du HTML."""
    dossier.mkdir(parents=True, exist_ok=True)
    url = ressource["url"]
    nom = ressource.get("name") or url.rsplit("/", 1)[-1]
    extension = (ressource.get("format") or "csv").lower()
    chemin = dossier / f"{nom.replace('/', '-')}.{extension}"

    requete = Request(url, headers={"User-Agent": "PPAI-SST-Quebec/1.0"})
    with urlopen(requete, timeout=300) as reponse:
        contenu = reponse.read()

    # Garde-fou : c'est précisément l'erreur du script précédent.
    debut = contenu[:512].lstrip().lower()
    if debut.startswith(b"<!doctype html") or debut.startswith(b"<html"):
        raise RuntimeError(
            f"La ressource « {nom} » a renvoyé une page HTML au lieu de données. "
            f"URL : {url}"
        )

    chemin.write_bytes(contenu)
    return chemin


def main() -> int:
    analyseur = argparse.ArgumentParser(description=__doc__)
    analyseur.add_argument("--list", action="store_true", help="Lister les ressources disponibles")
    analyseur.add_argument("--download", action="store_true", help="Télécharger les ressources")
    analyseur.add_argument("--out", default="output", help="Dossier de destination")
    arguments = analyseur.parse_args()

    if not (arguments.list or arguments.download):
        analyseur.print_help()
        return 1

    try:
        ressources = lister_ressources()
    except Exception as erreur:
        print(f"Échec de l'interrogation du portail : {erreur}", file=sys.stderr)
        return 2

    if not ressources:
        print("Aucune ressource de données trouvée pour ce jeu de données.", file=sys.stderr)
        return 3

    print(f"{len(ressources)} ressource(s) de données :")
    for ressource in ressources:
        taille = ressource.get("size") or "taille inconnue"
        print(f"  - {ressource.get('name')} [{ressource.get('format')}] ({taille})")
        print(f"    {ressource.get('url')}")

    if arguments.download:
        dossier = Path(arguments.out)
        print(f"\nTéléchargement vers {dossier.resolve()}")
        for ressource in ressources:
            try:
                chemin = telecharger(ressource, dossier)
                print(f"  OK   {chemin.name} ({chemin.stat().st_size} octets)")
            except Exception as erreur:
                print(f"  ÉCHEC {ressource.get('name')} : {erreur}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
