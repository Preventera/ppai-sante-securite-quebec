#!/usr/bin/env python3
# © 2026 Preventera — AgenticX5. Tous droits réservés. Voir LICENSE.md.
"""
Valide les fichiers BPMN produits par `generer_bpmn.py`.

Un fichier BPMN peut être parfaitement bien formé et pourtant s'ouvrir vide ou
illisible dans un modeleur : références qui ne résolvent pas, formes empilées
au même endroit, arêtes orphelines. Ce script contrôle ce qu'un simple
« ça parse » ne dit pas.
"""

from __future__ import annotations

import sys
import xml.etree.ElementTree as ET
from itertools import combinations
from pathlib import Path

NS = {
    "bpmn": "http://www.omg.org/spec/BPMN/20100524/MODEL",
    "bpmndi": "http://www.omg.org/spec/BPMN/20100524/DI",
    "dc": "http://www.omg.org/spec/DD/20100524/DC",
    "di": "http://www.omg.org/spec/DD/20100524/DI",
}

TYPES_NOEUDS = {
    "startEvent", "endEvent", "intermediateCatchEvent",
    "exclusiveGateway", "userTask", "serviceTask", "sendTask", "manualTask",
}


def chevauchent(a, b) -> bool:
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    return ax < bx + bw and bx < ax + aw and ay < by + bh and by < ay + ah


def valider(chemin: Path) -> list[str]:
    anomalies: list[str] = []

    try:
        racine = ET.parse(chemin).getroot()
    except ET.ParseError as e:
        return [f"XML mal formé : {e}"]

    proc = racine.find("bpmn:process", NS)
    if proc is None:
        return ["aucun élément bpmn:process"]

    # Nœuds déclarés
    noeuds: dict[str, str] = {}
    for enfant in proc:
        balise = enfant.tag.split("}")[-1]
        if balise in TYPES_NOEUDS:
            noeuds[enfant.get("id")] = balise

    if not noeuds:
        anomalies.append("aucun nœud")

    # Les voies doivent référencer des nœuds existants, et tous les couvrir
    references_voies: set[str] = set()
    for lane in proc.iter(f"{{{NS['bpmn']}}}lane"):
        for ref in lane.findall("bpmn:flowNodeRef", NS):
            identifiant = (ref.text or "").strip()
            if identifiant not in noeuds:
                anomalies.append(f"voie « {lane.get('name')} » référence un nœud inconnu : {identifiant}")
            references_voies.add(identifiant)

    for identifiant in noeuds:
        if identifiant not in references_voies:
            anomalies.append(f"nœud {identifiant} n'appartient à aucune voie")

    # Flux
    flux: dict[str, tuple[str, str]] = {}
    for f in proc.findall("bpmn:sequenceFlow", NS):
        src, dst = f.get("sourceRef"), f.get("targetRef")
        flux[f.get("id")] = (src, dst)
        if src not in noeuds:
            anomalies.append(f"flux {f.get('id')} : source inconnue « {src} »")
        if dst not in noeuds:
            anomalies.append(f"flux {f.get('id')} : cible inconnue « {dst} »")

    # Les événements de début n'ont pas d'entrant ; ceux de fin, pas de sortant
    for identifiant, type_noeud in noeuds.items():
        entrants = [f for f, (_, d) in flux.items() if d == identifiant]
        sortants = [f for f, (s, _) in flux.items() if s == identifiant]
        if type_noeud == "startEvent" and entrants:
            anomalies.append(f"{identifiant} : événement de début avec un flux entrant")
        if type_noeud == "endEvent" and sortants:
            anomalies.append(f"{identifiant} : événement de fin avec un flux sortant")
        if type_noeud not in ("startEvent", "endEvent") and not (entrants and sortants):
            anomalies.append(f"{identifiant} : nœud non traversé (entrants={len(entrants)}, sortants={len(sortants)})")

    # Mise en page : chaque forme doit référencer un élément existant
    boites: dict[str, tuple[float, float, float, float]] = {}
    elements_connus = set(noeuds) | {
        e.get("id") for e in proc.iter() if e.get("id")
    } | {
        p.get("id") for p in racine.iter(f"{{{NS['bpmn']}}}participant")
    }

    for forme in racine.iter(f"{{{NS['bpmndi']}}}BPMNShape"):
        cible = forme.get("bpmnElement")
        if cible not in elements_connus:
            anomalies.append(f"forme {forme.get('id')} référence un élément inconnu : {cible}")
        bounds = forme.find("dc:Bounds", NS)
        if bounds is None:
            anomalies.append(f"forme {forme.get('id')} sans géométrie — le modeleur l'ignorera")
            continue
        if cible in noeuds:
            boites[cible] = (
                float(bounds.get("x")), float(bounds.get("y")),
                float(bounds.get("width")), float(bounds.get("height")),
            )

    for identifiant in noeuds:
        if identifiant not in boites:
            anomalies.append(f"{identifiant} : nœud sans forme — invisible dans le modeleur")

    # Aucun empilement : deux nœuds superposés rendent le diagramme illisible
    for (a, ba), (b, bb) in combinations(boites.items(), 2):
        if chevauchent(ba, bb):
            anomalies.append(f"chevauchement : {a} et {b} occupent le même espace")

    # Chaque nœud doit se trouver DANS la bande de sa voie. Une bande décalée
    # produit un diagramme parfaitement valide où les tâches paraissent
    # appartenir à un autre acteur — le pire des défauts, puisqu'il se lit
    # comme une information et non comme une erreur.
    bandes: dict[str, tuple[float, float, str]] = {}
    for forme in racine.iter(f"{{{NS['bpmndi']}}}BPMNShape"):
        cible = forme.get("bpmnElement")
        if not (cible or "").startswith("lane_"):
            continue
        b = forme.find("dc:Bounds", NS)
        if b is None:
            continue
        bandes[cible] = (float(b.get("y")), float(b.get("y")) + float(b.get("height")), cible)

    voie_du_noeud: dict[str, str] = {}
    for lane in proc.iter(f"{{{NS['bpmn']}}}lane"):
        for ref in lane.findall("bpmn:flowNodeRef", NS):
            voie_du_noeud[(ref.text or "").strip()] = lane.get("id")

    for identifiant, (x, y, w, h) in boites.items():
        lane_id = voie_du_noeud.get(identifiant)
        if lane_id not in bandes:
            continue
        haut, bas, _ = bandes[lane_id]
        if y < haut or y + h > bas:
            anomalies.append(
                f"{identifiant} déborde de sa voie : nœud [{y:.0f}–{y + h:.0f}] "
                f"hors de la bande [{haut:.0f}–{bas:.0f}]"
            )

    # Arêtes
    for arete in racine.iter(f"{{{NS['bpmndi']}}}BPMNEdge"):
        cible = arete.get("bpmnElement")
        if cible not in flux:
            anomalies.append(f"arête {arete.get('id')} référence un flux inconnu : {cible}")
        points = arete.findall("di:waypoint", NS)
        if len(points) < 2:
            anomalies.append(f"arête {arete.get('id')} : moins de deux points")

    for identifiant in flux:
        trouve = any(
            a.get("bpmnElement") == identifiant
            for a in racine.iter(f"{{{NS['bpmndi']}}}BPMNEdge")
        )
        if not trouve:
            anomalies.append(f"flux {identifiant} sans arête — invisible dans le modeleur")

    return anomalies


def main() -> int:
    dossier = Path("docs/processus-bpmn")
    fichiers = sorted(dossier.glob("*.bpmn"))
    if not fichiers:
        print("Aucun fichier .bpmn à valider.")
        return 1

    total = 0
    for f in fichiers:
        anomalies = valider(f)
        total += len(anomalies)
        if anomalies:
            print(f"  ÉCHEC {f.name}")
            for a in anomalies:
                print(f"     - {a}")
        else:
            print(f"  OK    {f.name}")

    print(f"\n{len(fichiers)} fichier(s), {total} anomalie(s)")
    return 1 if total else 0


if __name__ == "__main__":
    raise SystemExit(main())
