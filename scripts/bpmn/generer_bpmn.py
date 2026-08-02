#!/usr/bin/env python3
# © 2026 Preventera — AgenticX5. Tous droits réservés. Voir LICENSE.md.
"""
Génère les diagrammes BPMN 2.0 des parcours de PPAI.

POURQUOI UN GÉNÉRATEUR PLUTÔT QUE DU XML ÉCRIT À LA MAIN
    Un fichier .bpmn n'est pas seulement un graphe : il porte aussi sa mise en
    page (« diagram interchange »). Sans coordonnées, un modeleur ouvre un
    document vide — le fichier est valide, et pourtant inutilisable. Les écrire
    à la main pour six processus est fastidieux et se désynchronise à la
    première correction.

    Ici, chaque processus est décrit comme une donnée : des voies, des nœuds
    rangés en colonnes, des flux. Le script en déduit la géométrie. Corriger un
    libellé ou insérer une étape ne demande aucun calcul.

SORTIES
    docs/processus-bpmn/*.bpmn   — BPMN 2.0 avec mise en page, ouvrable dans
                                   Camunda Modeler, bpmn.io, Signavio…
    docs/processus-bpmn/README.md — les mêmes parcours en Mermaid, qui se
                                   rendent directement sur GitHub.

USAGE
    python3 scripts/bpmn/generer_bpmn.py
"""

from __future__ import annotations

import html
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from pathlib import Path

SORTIE = Path("docs/processus-bpmn")

# Géométrie. Une colonne par étape, une voie par acteur.
LARGEUR_COLONNE = 200
HAUTEUR_VOIE = 170
X_POOL = 160          # place réservée aux étiquettes de voies
Y_POOL = 60

TAILLES = {
    "startEvent": (36, 36),
    "endEvent": (36, 36),
    "intermediateCatchEvent": (36, 36),
    "exclusiveGateway": (50, 50),
    "userTask": (150, 80),
    "serviceTask": (150, 80),
    "sendTask": (150, 80),
    "manualTask": (150, 80),
}

# Types BPMN qui portent une bordure épaisse ou une décoration ; sans effet
# sur la géométrie, mais utile pour le rendu Mermaid.
FORME_MERMAID = {
    "startEvent": ("([", "])"),
    "endEvent": ("([", "])"),
    "intermediateCatchEvent": ("([", "])"),
    "exclusiveGateway": ("{", "}"),
    "userTask": ("[", "]"),
    "serviceTask": ("[/", "/]"),
    "sendTask": ("[/", "/]"),
    "manualTask": ("[", "]"),
}


@dataclass
class Noeud:
    id: str
    type: str
    libelle: str
    voie: str
    colonne: int
    #  Décalage vertical dans la voie, pour éviter que deux nœuds d'une même
    #  voie et d'une même colonne se superposent (branches d'une passerelle).
    rang: int = 0


@dataclass
class Processus:
    id: str
    titre: str
    resume: str
    voies: list[str]
    noeuds: list[Noeud]
    flux: list[tuple[str, str, str]] = field(default_factory=list)

    def noeud(self, identifiant: str) -> Noeud:
        for n in self.noeuds:
            if n.id == identifiant:
                return n
        raise KeyError(f"{self.id}: nœud « {identifiant} » introuvable")


# ---------------------------------------------------------------------------
# Les six parcours
# ---------------------------------------------------------------------------

def _n(i, t, lib, voie, col, rang=0):
    return Noeud(i, t, lib, voie, col, rang)


P1 = Processus(
    id="acces-et-identite",
    titre="P1 — Accès et identité",
    resume=(
        "De la création de compte à la session ouverte, y compris la "
        "récupération d'un accès perdu. L'organisation et le profil sont "
        "créés par un déclencheur en base, de façon atomique : jamais un "
        "compte sans organisation propriétaire de ses données."
    ),
    voies=["Utilisateur", "Application PPAI", "Supabase Auth"],
    noeuds=[
        _n("p1_debut", "startEvent", "Besoin d'accès", "Utilisateur", 0),
        _n("p1_choix", "exclusiveGateway", "Compte existant ?", "Utilisateur", 1),

        # Branche inscription
        _n("p1_inscrire", "userTask", "Saisir courriel, mot de passe\net nom de l'entreprise", "Utilisateur", 2, rang=0),
        _n("p1_signup", "serviceTask", "signUp avec emailRedirectTo", "Application PPAI", 3, rang=0),
        _n("p1_declencheur", "serviceTask", "Créer organisation + profil\n(déclencheur atomique)", "Supabase Auth", 4, rang=0),
        _n("p1_courriel", "sendTask", "Expédier le lien\nde confirmation", "Supabase Auth", 5, rang=0),
        _n("p1_confirmer", "intermediateCatchEvent", "Lien de confirmation suivi", "Utilisateur", 6, rang=0),

        # Branche connexion / mot de passe perdu
        _n("p1_connexion", "userTask", "Se connecter", "Utilisateur", 2, rang=1),
        _n("p1_oublie", "exclusiveGateway", "Mot de passe connu ?", "Utilisateur", 3, rang=1),
        _n("p1_demande", "serviceTask", "resetPasswordForEmail\n(redirectTo /auth/reset)", "Application PPAI", 4, rang=1),
        _n("p1_lien", "sendTask", "Expédier le lien\nde réinitialisation", "Supabase Auth", 5, rang=1),
        _n("p1_nouveau", "userTask", "Choisir un nouveau\nmot de passe", "Utilisateur", 6, rang=1),

        _n("p1_session", "serviceTask", "Ouvrir la session\net charger le rôle", "Application PPAI", 7),
        _n("p1_fin", "endEvent", "Session active", "Utilisateur", 8),
    ],
    flux=[
        ("p1_debut", "p1_choix", ""),
        ("p1_choix", "p1_inscrire", "non"),
        ("p1_inscrire", "p1_signup", ""),
        ("p1_signup", "p1_declencheur", ""),
        ("p1_declencheur", "p1_courriel", ""),
        ("p1_courriel", "p1_confirmer", ""),
        ("p1_confirmer", "p1_session", ""),
        ("p1_choix", "p1_connexion", "oui"),
        ("p1_connexion", "p1_oublie", ""),
        ("p1_oublie", "p1_session", "oui"),
        ("p1_oublie", "p1_demande", "non"),
        ("p1_demande", "p1_lien", ""),
        ("p1_lien", "p1_nouveau", ""),
        ("p1_nouveau", "p1_session", ""),
        ("p1_session", "p1_fin", ""),
    ],
)


P2 = Processus(
    id="assujettissement-reglementaire",
    titre="P2 — Assujettissement réglementaire",
    resume=(
        "Deux données déclarées — effectif et sous-secteur SCIAN — déterminent "
        "l'ensemble des obligations. Rien n'est demandé à l'utilisateur qui "
        "puisse être déduit : le seuil de 20 travailleurs et l'annexe I du "
        "RMPPÉ font le reste."
    ),
    voies=["Direction / Responsable SST", "Application PPAI", "Référentiel CNESST"],
    noeuds=[
        _n("p2_debut", "startEvent", "Établissement à qualifier", "Direction / Responsable SST", 0),
        _n("p2_saisir", "userTask", "Déclarer l'effectif\net le sous-secteur SCIAN", "Direction / Responsable SST", 1),
        _n("p2_niveau", "serviceTask", "Résoudre le niveau\n(annexe I, 102 sous-secteurs)", "Référentiel CNESST", 2),
        _n("p2_calcul", "serviceTask", "determinerMecanismes()", "Application PPAI", 3),
        _n("p2_seuil", "exclusiveGateway", "20 travailleurs\nou plus ?", "Application PPAI", 4),

        _n("p2_programme", "serviceTask", "Programme de prévention\n+ comité + représentant", "Application PPAI", 5, rang=0),
        _n("p2_modalites", "serviceTask", "Composition (art. 7)\nRéunions (art. 19)\nLibération (art. 33)", "Référentiel CNESST", 6, rang=0),

        _n("p2_plan", "serviceTask", "Plan d'action\n+ agent de liaison", "Application PPAI", 5, rang=1),

        _n("p2_menu", "serviceTask", "Renommer l'entrée de menu\nselon le mécanisme retenu", "Application PPAI", 7),
        _n("p2_fin", "endEvent", "Obligations connues", "Direction / Responsable SST", 8),
    ],
    flux=[
        ("p2_debut", "p2_saisir", ""),
        ("p2_saisir", "p2_niveau", ""),
        ("p2_niveau", "p2_calcul", ""),
        ("p2_calcul", "p2_seuil", ""),
        ("p2_seuil", "p2_programme", "oui"),
        ("p2_programme", "p2_modalites", ""),
        ("p2_modalites", "p2_menu", ""),
        ("p2_seuil", "p2_plan", "non"),
        ("p2_plan", "p2_menu", ""),
        ("p2_menu", "p2_fin", ""),
    ],
)


P3 = Processus(
    id="constitution-du-registre",
    titre="P3 — Constitution du registre par propositions sectorielles",
    resume=(
        "Les 258 risques types dérivés de 680 517 lésions sont proposés, "
        "jamais imposés. Le point dur du parcours est délibéré : aucune "
        "adoption sans que l'employeur ait coté la probabilité, risque par "
        "risque. Elle n'est pas dérivable des données ouvertes, et la Loi la "
        "met à sa charge (LSST art. 59)."
    ),
    voies=["Responsable SST", "Application PPAI", "Référentiel CNESST"],
    noeuds=[
        _n("p3_debut", "startEvent", "Registre à constituer", "Responsable SST", 0),
        _n("p3_ouvrir", "userTask", "Ouvrir « Proposer les risques\nde mon secteur »", "Responsable SST", 1),
        _n("p3_secteur", "userTask", "Choisir le sous-secteur SCIAN", "Responsable SST", 2),
        _n("p3_plurivoque", "exclusiveGateway", "Code plurivoque ?\n(115)", "Application PPAI", 3),
        _n("p3_orientation", "userTask", "Trancher : agriculture\nou foresterie", "Responsable SST", 4, rang=1),
        _n("p3_charger", "serviceTask", "Charger les risques types\ndu grand secteur", "Référentiel CNESST", 5),
        _n("p3_vide", "exclusiveGateway", "Propositions\ndisponibles ?", "Application PPAI", 6),
        _n("p3_avertir", "serviceTask", "Signaler l'absence\nde données publiées", "Application PPAI", 7, rang=1),
        _n("p3_domaine", "userTask", "Choisir le domaine du registre\n(aucune valeur par défaut)", "Responsable SST", 7, rang=0),
        _n("p3_coter", "userTask", "Coter la probabilité\nde CHAQUE risque retenu", "Responsable SST", 8),
        _n("p3_bloquer", "exclusiveGateway", "Tout est coté ?", "Application PPAI", 9),
        _n("p3_adopter", "serviceTask", "Adopter en lot\n+ tracer l'origine", "Application PPAI", 10),
        _n("p3_fin", "endEvent", "Risques au registre", "Responsable SST", 11),
        _n("p3_fin_vide", "endEvent", "Saisie manuelle requise", "Responsable SST", 11, rang=1),
    ],
    flux=[
        ("p3_debut", "p3_ouvrir", ""),
        ("p3_ouvrir", "p3_secteur", ""),
        ("p3_secteur", "p3_plurivoque", ""),
        ("p3_plurivoque", "p3_orientation", "oui"),
        ("p3_orientation", "p3_charger", ""),
        ("p3_plurivoque", "p3_charger", "non"),
        ("p3_charger", "p3_vide", ""),
        ("p3_vide", "p3_avertir", "non"),
        ("p3_avertir", "p3_fin_vide", ""),
        ("p3_vide", "p3_domaine", "oui"),
        ("p3_domaine", "p3_coter", ""),
        ("p3_coter", "p3_bloquer", ""),
        ("p3_bloquer", "p3_coter", "non"),
        ("p3_bloquer", "p3_adopter", "oui"),
        ("p3_adopter", "p3_fin", ""),
    ],
)


P4 = Processus(
    id="signalement-terrain",
    titre="P4 — Signalement terrain et qualification",
    resume=(
        "Le chaînon entre le terrain et le registre. On ne demande pas au "
        "témoin d'un danger de produire une analyse : il décrit, le "
        "responsable SST cote. Tout signalement reçoit une suite explicite — "
        "un signalement écarté sans explication décourage le suivant."
    ),
    voies=["Travailleur", "Responsable SST", "Base de données (RLS)"],
    noeuds=[
        _n("p4_debut", "startEvent", "Situation dangereuse\nobservée", "Travailleur", 0),
        _n("p4_decrire", "userTask", "Décrire et situer\n(téléphone, 2 champs)", "Travailleur", 1),
        _n("p4_imposer", "serviceTask", "Imposer auteur et organisation\ndepuis la session", "Base de données (RLS)", 2),
        _n("p4_file", "serviceTask", "Déposer dans la file\nstatut « nouveau »", "Base de données (RLS)", 3),
        _n("p4_examiner", "userTask", "Examiner le signalement", "Responsable SST", 4),
        _n("p4_decision", "exclusiveGateway", "Devient un risque ?", "Responsable SST", 5),
        _n("p4_qualifier", "userTask", "Coter et compléter\n(formulaire prérempli)", "Responsable SST", 6, rang=0),
        _n("p4_creer", "serviceTask", "Créer le risque au registre", "Base de données (RLS)", 7, rang=0),
        _n("p4_note", "userTask", "Rédiger la note d'écartement\n(obligatoire)", "Responsable SST", 6, rang=1),
        _n("p4_statuer", "serviceTask", "Consigner la décision", "Base de données (RLS)", 8),
        _n("p4_suite", "intermediateCatchEvent", "Consulter la suite donnée", "Travailleur", 9),
        _n("p4_fin", "endEvent", "Signalement traité", "Travailleur", 10),
    ],
    flux=[
        ("p4_debut", "p4_decrire", ""),
        ("p4_decrire", "p4_imposer", ""),
        ("p4_imposer", "p4_file", ""),
        ("p4_file", "p4_examiner", ""),
        ("p4_examiner", "p4_decision", ""),
        ("p4_decision", "p4_qualifier", "oui"),
        ("p4_qualifier", "p4_creer", ""),
        ("p4_creer", "p4_statuer", ""),
        ("p4_decision", "p4_note", "non"),
        ("p4_note", "p4_statuer", ""),
        ("p4_statuer", "p4_suite", ""),
        ("p4_suite", "p4_fin", ""),
    ],
)


P5 = Processus(
    id="generation-documentaire",
    titre="P5 — Génération documentaire",
    resume=(
        "Le moteur distant est tenté d'abord, le moteur local prend le relais "
        "en cas d'échec — la génération n'échoue jamais faute de réseau ou de "
        "clé. Quel que soit le chemin emprunté, la provenance réglementaire "
        "est figée dans le document : sources, version des textes, moteur réel."
    ),
    voies=["Responsable SST", "Application PPAI", "Edge Function (Claude)", "Journal d'exécution"],
    noeuds=[
        _n("p5_debut", "startEvent", "Document à produire", "Responsable SST", 0),
        _n("p5_type", "userTask", "Choisir le type de document\n(langage métier)", "Responsable SST", 1),
        _n("p5_contexte", "serviceTask", "Assembler le contexte :\nregistre + mécanismes exigés", "Application PPAI", 2),
        _n("p5_backend", "exclusiveGateway", "Backend joignable ?", "Application PPAI", 3),
        _n("p5_claude", "serviceTask", "Générer par Claude", "Edge Function (Claude)", 4, rang=0),
        _n("p5_echec", "exclusiveGateway", "Génération réussie ?", "Application PPAI", 5),
        _n("p5_consigner", "serviceTask", "Consigner l'échec", "Journal d'exécution", 6, rang=1),
        _n("p5_local", "serviceTask", "Générer localement\n(déterministe)", "Application PPAI", 7, rang=1),
        _n("p5_provenance", "serviceTask", "Figer la provenance\n+ empreinte du registre", "Application PPAI", 8),
        _n("p5_journal", "serviceTask", "Journaliser durée, moteur,\njetons — jamais le document", "Journal d'exécution", 9),
        _n("p5_conserver", "serviceTask", "Conserver le programme", "Application PPAI", 10),
        _n("p5_fin", "endEvent", "Document traçable", "Responsable SST", 11),
    ],
    flux=[
        ("p5_debut", "p5_type", ""),
        ("p5_type", "p5_contexte", ""),
        ("p5_contexte", "p5_backend", ""),
        ("p5_backend", "p5_claude", "oui"),
        ("p5_claude", "p5_echec", ""),
        ("p5_echec", "p5_provenance", "oui"),
        ("p5_echec", "p5_consigner", "non"),
        ("p5_consigner", "p5_local", ""),
        ("p5_backend", "p5_local", "non"),
        ("p5_local", "p5_provenance", ""),
        ("p5_provenance", "p5_journal", ""),
        ("p5_journal", "p5_conserver", ""),
        ("p5_conserver", "p5_fin", ""),
    ],
)


P6 = Processus(
    id="gestion-des-roles",
    titre="P6 — Gestion des rôles",
    resume=(
        "Le masquage d'interface n'est pas la protection : la base refuse. "
        "Deux gardes s'appliquent en base, pas à l'écran — seul un "
        "administrateur modifie un rôle, et jamais le sien, pour qu'une "
        "organisation ne puisse pas perdre son dernier administrateur."
    ),
    voies=["Direction (admin)", "Application PPAI", "Base de données (RLS)"],
    noeuds=[
        _n("p6_debut", "startEvent", "Collègue à habiliter", "Direction (admin)", 0),
        _n("p6_ouvrir", "userTask", "Ouvrir « Utilisateurs »", "Direction (admin)", 1),
        _n("p6_garde", "exclusiveGateway", "Rôle administrateur ?", "Application PPAI", 2),
        _n("p6_refus", "serviceTask", "Expliquer le refus\n(pas de redirection muette)", "Application PPAI", 3, rang=1),
        _n("p6_lister", "serviceTask", "Lister les profils\nde l'organisation", "Base de données (RLS)", 3, rang=0),
        _n("p6_choisir", "userTask", "Attribuer un rôle", "Direction (admin)", 4),
        _n("p6_soi", "exclusiveGateway", "Son propre profil ?", "Base de données (RLS)", 5),
        _n("p6_bloque", "serviceTask", "Refuser : une organisation\ngarde son administrateur", "Base de données (RLS)", 6, rang=1),
        _n("p6_appliquer", "serviceTask", "Appliquer le rôle", "Base de données (RLS)", 6, rang=0),
        _n("p6_effet", "serviceTask", "Recomposer la navigation\net les droits d'écriture", "Application PPAI", 7),
        _n("p6_fin", "endEvent", "Habilitation effective", "Direction (admin)", 8),
        _n("p6_fin_refus", "endEvent", "Accès refusé, motif affiché", "Direction (admin)", 8, rang=1),
    ],
    flux=[
        ("p6_debut", "p6_ouvrir", ""),
        ("p6_ouvrir", "p6_garde", ""),
        ("p6_garde", "p6_refus", "non"),
        ("p6_refus", "p6_fin_refus", ""),
        ("p6_garde", "p6_lister", "oui"),
        ("p6_lister", "p6_choisir", ""),
        ("p6_choisir", "p6_soi", ""),
        ("p6_soi", "p6_bloque", "oui"),
        ("p6_bloque", "p6_fin_refus", ""),
        ("p6_soi", "p6_appliquer", "non"),
        ("p6_appliquer", "p6_effet", ""),
        ("p6_effet", "p6_fin", ""),
    ],
)

PROCESSUS = [P1, P2, P3, P4, P5, P6]


# ---------------------------------------------------------------------------
# Géométrie
# ---------------------------------------------------------------------------

def _voies_dimensionnees(p: Processus) -> dict[str, tuple[int, int]]:
    """
    Hauteur et ordonnée de chaque voie.

    Une voie qui accueille des branches parallèles doit être assez haute pour
    les recevoir côte à côte : sans cela, deux nœuds de même voie et de même
    colonne se superposent exactement, et le diagramme devient illisible sans
    que le fichier cesse d'être valide.
    """
    dimensions: dict[str, tuple[int, int]] = {}
    y = Y_POOL
    for voie in p.voies:
        rang_max = max((n.rang for n in p.noeuds if n.voie == voie), default=0)
        hauteur = HAUTEUR_VOIE * (rang_max + 1)
        dimensions[voie] = (y, hauteur)
        y += hauteur
    return dimensions


def geometrie(p: Processus) -> dict[str, tuple[int, int, int, int]]:
    """Position (x, y, largeur, hauteur) de chaque nœud."""
    voies = _voies_dimensionnees(p)
    boites: dict[str, tuple[int, int, int, int]] = {}

    for n in p.noeuds:
        largeur, hauteur = TAILLES[n.type]
        y_voie, _ = voies[n.voie]

        centre_x = X_POOL + 40 + n.colonne * LARGEUR_COLONNE + LARGEUR_COLONNE // 2
        centre_y = y_voie + n.rang * HAUTEUR_VOIE + HAUTEUR_VOIE // 2

        boites[n.id] = (centre_x - largeur // 2, centre_y - hauteur // 2, largeur, hauteur)

    return boites


def dimensions_pool(p: Processus) -> tuple[int, int]:
    colonnes = max(n.colonne for n in p.noeuds) + 1
    voies = _voies_dimensionnees(p)
    hauteur = sum(h for _, h in voies.values())
    return (40 + colonnes * LARGEUR_COLONNE + 40, hauteur)


# ---------------------------------------------------------------------------
# Émission BPMN 2.0
# ---------------------------------------------------------------------------

NS = {
    "bpmn": "http://www.omg.org/spec/BPMN/20100524/MODEL",
    "bpmndi": "http://www.omg.org/spec/BPMN/20100524/DI",
    "dc": "http://www.omg.org/spec/DD/20100524/DC",
    "di": "http://www.omg.org/spec/DD/20100524/DI",
}


def bpmn_xml(p: Processus) -> str:
    boites = geometrie(p)
    largeur_pool, hauteur_pool = dimensions_pool(p)

    lignes = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<bpmn:definitions xmlns:bpmn="{NS["bpmn"]}" xmlns:bpmndi="{NS["bpmndi"]}"',
        f'                  xmlns:dc="{NS["dc"]}" xmlns:di="{NS["di"]}"',
        f'                  id="defs_{p.id}" targetNamespace="http://agenticx5.com/ppai/bpmn">',
        f'  <!-- {p.titre} — © 2026 Preventera / AgenticX5. Généré par scripts/bpmn/generer_bpmn.py -->',
        f'  <bpmn:collaboration id="collab_{p.id}">',
        f'    <bpmn:participant id="pool_{p.id}" name="{html.escape(p.titre)}" processRef="proc_{p.id}" />',
        '  </bpmn:collaboration>',
        f'  <bpmn:process id="proc_{p.id}" isExecutable="false">',
        f'    <bpmn:laneSet id="laneset_{p.id}">',
    ]

    for i, voie in enumerate(p.voies):
        lignes.append(f'      <bpmn:lane id="lane_{p.id}_{i}" name="{html.escape(voie)}">')
        for n in [x for x in p.noeuds if x.voie == voie]:
            lignes.append(f'        <bpmn:flowNodeRef>{n.id}</bpmn:flowNodeRef>')
        lignes.append('      </bpmn:lane>')
    lignes.append('    </bpmn:laneSet>')

    entrants: dict[str, list[str]] = {n.id: [] for n in p.noeuds}
    sortants: dict[str, list[str]] = {n.id: [] for n in p.noeuds}
    for i, (src, dst, _) in enumerate(p.flux):
        fid = f"flow_{p.id}_{i}"
        sortants[src].append(fid)
        entrants[dst].append(fid)

    for n in p.noeuds:
        libelle = html.escape(n.libelle.replace("\n", " "))
        lignes.append(f'    <bpmn:{n.type} id="{n.id}" name="{libelle}">')
        for f in entrants[n.id]:
            lignes.append(f'      <bpmn:incoming>{f}</bpmn:incoming>')
        for f in sortants[n.id]:
            lignes.append(f'      <bpmn:outgoing>{f}</bpmn:outgoing>')
        lignes.append(f'    </bpmn:{n.type}>')

    for i, (src, dst, libelle) in enumerate(p.flux):
        nom = f' name="{html.escape(libelle)}"' if libelle else ""
        lignes.append(
            f'    <bpmn:sequenceFlow id="flow_{p.id}_{i}" sourceRef="{src}" targetRef="{dst}"{nom} />'
        )

    lignes.append('  </bpmn:process>')

    # ----- mise en page -----
    lignes += [
        f'  <bpmndi:BPMNDiagram id="diag_{p.id}">',
        f'    <bpmndi:BPMNPlane id="plane_{p.id}" bpmnElement="collab_{p.id}">',
        f'      <bpmndi:BPMNShape id="shape_pool_{p.id}" bpmnElement="pool_{p.id}" isHorizontal="true">',
        f'        <dc:Bounds x="{X_POOL}" y="{Y_POOL}" width="{largeur_pool}" height="{hauteur_pool}" />',
        '      </bpmndi:BPMNShape>',
    ]

    # Les bandes doivent épouser la hauteur réelle de leur voie : une voie qui
    # accueille des branches parallèles est plus haute que les autres. Réutiliser
    # ici la hauteur nominale décalait les bandes par rapport à leur contenu —
    # le diagramme restait valide, mais les tâches paraissaient hors de leur voie.
    voies_dim = _voies_dimensionnees(p)
    for i, voie in enumerate(p.voies):
        y, hauteur = voies_dim[voie]
        lignes += [
            f'      <bpmndi:BPMNShape id="shape_lane_{p.id}_{i}" bpmnElement="lane_{p.id}_{i}" isHorizontal="true">',
            f'        <dc:Bounds x="{X_POOL + 30}" y="{y}" width="{largeur_pool - 30}" height="{hauteur}" />',
            '      </bpmndi:BPMNShape>',
        ]

    for n in p.noeuds:
        x, y, w, h = boites[n.id]
        etiquette = ""
        if n.type in ("startEvent", "endEvent", "intermediateCatchEvent", "exclusiveGateway"):
            etiquette = (
                '\n          <bpmndi:BPMNLabel>'
                f'<dc:Bounds x="{x - 30}" y="{y + h + 4}" width="{w + 60}" height="28" />'
                '</bpmndi:BPMNLabel>'
            )
        lignes += [
            f'      <bpmndi:BPMNShape id="shape_{n.id}" bpmnElement="{n.id}">',
            f'        <dc:Bounds x="{x}" y="{y}" width="{w}" height="{h}" />{etiquette}',
            '      </bpmndi:BPMNShape>',
        ]

    for i, (src, dst, libelle) in enumerate(p.flux):
        xs, ys, ws, hs = boites[src]
        xd, yd, wd, hd = boites[dst]
        depart = (xs + ws, ys + hs // 2)
        arrivee = (xd, yd + hd // 2)

        # Retour en arrière : on contourne par le dessous.
        if xd < xs:
            depart = (xs + ws // 2, ys + hs)
            arrivee = (xd + wd // 2, yd + hd)
            milieu_y = max(depart[1], arrivee[1]) + 40
            points = [depart, (depart[0], milieu_y), (arrivee[0], milieu_y), arrivee]
        elif ys != yd:
            milieu_x = (depart[0] + arrivee[0]) // 2
            points = [depart, (milieu_x, depart[1]), (milieu_x, arrivee[1]), arrivee]
        else:
            points = [depart, arrivee]

        lignes.append(f'      <bpmndi:BPMNEdge id="edge_{p.id}_{i}" bpmnElement="flow_{p.id}_{i}">')
        for px, py in points:
            lignes.append(f'        <di:waypoint x="{px}" y="{py}" />')
        if libelle:
            mx, my = points[len(points) // 2]
            lignes.append(
                f'        <bpmndi:BPMNLabel><dc:Bounds x="{mx + 4}" y="{my - 22}" '
                'width="60" height="18" /></bpmndi:BPMNLabel>'
            )
        lignes.append('      </bpmndi:BPMNEdge>')

    lignes += ['    </bpmndi:BPMNPlane>', '  </bpmndi:BPMNDiagram>', '</bpmn:definitions>', '']
    return "\n".join(lignes)


# ---------------------------------------------------------------------------
# Émission Mermaid (rendu direct sur GitHub)
# ---------------------------------------------------------------------------

def mermaid(p: Processus) -> str:
    lignes = ["flowchart LR"]
    for i, voie in enumerate(p.voies):
        lignes.append(f'  subgraph voie{i}["{voie}"]')
        lignes.append("    direction LR")
        for n in [x for x in p.noeuds if x.voie == voie]:
            ouvre, ferme = FORME_MERMAID[n.type]
            texte = n.libelle.replace("\n", "<br/>")
            lignes.append(f'    {n.id}{ouvre}"{texte}"{ferme}')
        lignes.append("  end")

    for src, dst, libelle in p.flux:
        fleche = f'-- "{libelle}" -->' if libelle else "-->"
        lignes.append(f"  {src} {fleche} {dst}")

    return "\n".join(lignes)


# ---------------------------------------------------------------------------

def verifier(p: Processus) -> list[str]:
    """Contrôles de cohérence — un diagramme faux est pire qu'absent."""
    anomalies = []
    ids = [n.id for n in p.noeuds]

    if len(ids) != len(set(ids)):
        anomalies.append("identifiants de nœuds en double")

    for n in p.noeuds:
        if n.voie not in p.voies:
            anomalies.append(f"{n.id} : voie « {n.voie} » non déclarée")
        if n.type not in TAILLES:
            anomalies.append(f"{n.id} : type « {n.type} » inconnu")

    for src, dst, _ in p.flux:
        if src not in ids:
            anomalies.append(f"flux vers {dst} : source « {src} » inexistante")
        if dst not in ids:
            anomalies.append(f"flux depuis {src} : cible « {dst} » inexistante")

    # Tout nœud doit être relié, sauf les événements de début/fin aux extrémités.
    relies = {s for s, _, _ in p.flux} | {d for _, d, _ in p.flux}
    for n in p.noeuds:
        if n.id not in relies:
            anomalies.append(f"{n.id} : nœud isolé")

    depart = [n for n in p.noeuds if n.type == "startEvent"]
    fin = [n for n in p.noeuds if n.type == "endEvent"]
    if not depart:
        anomalies.append("aucun événement de début")
    if not fin:
        anomalies.append("aucun événement de fin")

    return anomalies


def main() -> int:
    SORTIE.mkdir(parents=True, exist_ok=True)
    total_anomalies = 0

    entete = [
        "# Parcours PPAI — modélisation BPMN",
        "",
        "> © 2026 Preventera — AgenticX5. Tous droits réservés. Voir `LICENSE.md`.",
        "",
        "Six parcours, décrits en BPMN 2.0. Les fichiers `.bpmn` s'ouvrent dans",
        "n'importe quel modeleur (Camunda Modeler, [bpmn.io](https://demo.bpmn.io),",
        "Signavio) ; les diagrammes Mermaid ci-dessous se rendent directement ici.",
        "",
        "Ces diagrammes ne sont pas décoratifs : ils décrivent le comportement",
        "réellement implémenté, y compris les points où l'application **refuse**",
        "d'agir à la place de l'employeur.",
        "",
        "**Ne pas modifier ce fichier à la main** — il est produit par",
        "`scripts/bpmn/generer_bpmn.py`. Corriger la description du processus dans",
        "le script, puis régénérer.",
        "",
        "## Vue d'ensemble",
        "",
        "| Parcours | Acteurs | Fichier |",
        "| --- | --- | --- |",
    ]
    for p in PROCESSUS:
        entete.append(f"| {p.titre} | {' · '.join(p.voies)} | [`{p.id}.bpmn`]({p.id}.bpmn) |")
    entete.append("")

    corps = []
    for p in PROCESSUS:
        anomalies = verifier(p)
        if anomalies:
            total_anomalies += len(anomalies)
            print(f"  ANOMALIE {p.id} :")
            for a in anomalies:
                print(f"    - {a}")
            continue

        (SORTIE / f"{p.id}.bpmn").write_text(bpmn_xml(p), encoding="utf-8")
        noeuds = len(p.noeuds)
        print(f"  OK  {p.id}.bpmn — {noeuds} nœuds, {len(p.flux)} flux, {len(p.voies)} voies")

        corps += [
            f"## {p.titre}",
            "",
            p.resume,
            "",
            "```mermaid",
            mermaid(p),
            "```",
            "",
        ]

    (SORTIE / "README.md").write_text("\n".join(entete + corps), encoding="utf-8")
    print(f"\n{len(PROCESSUS) - total_anomalies and len(PROCESSUS)} processus, {total_anomalies} anomalie(s)")
    return 1 if total_anomalies else 0


if __name__ == "__main__":
    raise SystemExit(main())
