# Parcours PPAI — modélisation BPMN

> © 2026 Preventera — AgenticX5. Tous droits réservés. Voir `LICENSE.md`.

Six parcours, décrits en BPMN 2.0. Les fichiers `.bpmn` s'ouvrent dans
n'importe quel modeleur (Camunda Modeler, [bpmn.io](https://demo.bpmn.io),
Signavio) ; les diagrammes Mermaid ci-dessous se rendent directement ici.

Ces diagrammes ne sont pas décoratifs : ils décrivent le comportement
réellement implémenté, y compris les points où l'application **refuse**
d'agir à la place de l'employeur.

**Ne pas modifier ce fichier à la main** — il est produit par
`scripts/bpmn/generer_bpmn.py`. Corriger la description du processus dans
le script, puis régénérer.

## Vue d'ensemble

| Parcours | Acteurs | Fichier |
| --- | --- | --- |
| P1 — Accès et identité | Utilisateur · Application PPAI · Supabase Auth | [`acces-et-identite.bpmn`](acces-et-identite.bpmn) |
| P2 — Assujettissement réglementaire | Direction / Responsable SST · Application PPAI · Référentiel CNESST | [`assujettissement-reglementaire.bpmn`](assujettissement-reglementaire.bpmn) |
| P3 — Constitution du registre par propositions sectorielles | Responsable SST · Application PPAI · Référentiel CNESST | [`constitution-du-registre.bpmn`](constitution-du-registre.bpmn) |
| P4 — Signalement terrain et qualification | Travailleur · Responsable SST · Base de données (RLS) | [`signalement-terrain.bpmn`](signalement-terrain.bpmn) |
| P5 — Génération documentaire | Responsable SST · Application PPAI · Edge Function (Claude) · Journal d'exécution | [`generation-documentaire.bpmn`](generation-documentaire.bpmn) |
| P6 — Gestion des rôles | Direction (admin) · Application PPAI · Base de données (RLS) | [`gestion-des-roles.bpmn`](gestion-des-roles.bpmn) |

## P1 — Accès et identité

De la création de compte à la session ouverte, y compris la récupération d'un accès perdu. L'organisation et le profil sont créés par un déclencheur en base, de façon atomique : jamais un compte sans organisation propriétaire de ses données.

```mermaid
flowchart LR
  subgraph voie0["Utilisateur"]
    direction LR
    p1_debut(["Besoin d'accès"])
    p1_choix{"Compte existant ?"}
    p1_inscrire["Saisir courriel, mot de passe<br/>et nom de l'entreprise"]
    p1_confirmer(["Lien de confirmation suivi"])
    p1_connexion["Se connecter"]
    p1_oublie{"Mot de passe connu ?"}
    p1_nouveau["Choisir un nouveau<br/>mot de passe"]
    p1_fin(["Session active"])
  end
  subgraph voie1["Application PPAI"]
    direction LR
    p1_signup[/"signUp avec emailRedirectTo"/]
    p1_demande[/"resetPasswordForEmail<br/>(redirectTo /auth/reset)"/]
    p1_session[/"Ouvrir la session<br/>et charger le rôle"/]
  end
  subgraph voie2["Supabase Auth"]
    direction LR
    p1_declencheur[/"Créer organisation + profil<br/>(déclencheur atomique)"/]
    p1_courriel[/"Expédier le lien<br/>de confirmation"/]
    p1_lien[/"Expédier le lien<br/>de réinitialisation"/]
  end
  p1_debut --> p1_choix
  p1_choix -- "non" --> p1_inscrire
  p1_inscrire --> p1_signup
  p1_signup --> p1_declencheur
  p1_declencheur --> p1_courriel
  p1_courriel --> p1_confirmer
  p1_confirmer --> p1_session
  p1_choix -- "oui" --> p1_connexion
  p1_connexion --> p1_oublie
  p1_oublie -- "oui" --> p1_session
  p1_oublie -- "non" --> p1_demande
  p1_demande --> p1_lien
  p1_lien --> p1_nouveau
  p1_nouveau --> p1_session
  p1_session --> p1_fin
```

## P2 — Assujettissement réglementaire

Deux données déclarées — effectif et sous-secteur SCIAN — déterminent l'ensemble des obligations. Rien n'est demandé à l'utilisateur qui puisse être déduit : le seuil de 20 travailleurs et l'annexe I du RMPPÉ font le reste.

```mermaid
flowchart LR
  subgraph voie0["Direction / Responsable SST"]
    direction LR
    p2_debut(["Établissement à qualifier"])
    p2_saisir["Déclarer l'effectif<br/>et le sous-secteur SCIAN"]
    p2_fin(["Obligations connues"])
  end
  subgraph voie1["Application PPAI"]
    direction LR
    p2_calcul[/"determinerMecanismes()"/]
    p2_seuil{"20 travailleurs<br/>ou plus ?"}
    p2_programme[/"Programme de prévention<br/>+ comité + représentant"/]
    p2_plan[/"Plan d'action<br/>+ agent de liaison"/]
    p2_menu[/"Renommer l'entrée de menu<br/>selon le mécanisme retenu"/]
  end
  subgraph voie2["Référentiel CNESST"]
    direction LR
    p2_niveau[/"Résoudre le niveau<br/>(annexe I, 102 sous-secteurs)"/]
    p2_modalites[/"Composition (art. 7)<br/>Réunions (art. 19)<br/>Libération (art. 33)"/]
  end
  p2_debut --> p2_saisir
  p2_saisir --> p2_niveau
  p2_niveau --> p2_calcul
  p2_calcul --> p2_seuil
  p2_seuil -- "oui" --> p2_programme
  p2_programme --> p2_modalites
  p2_modalites --> p2_menu
  p2_seuil -- "non" --> p2_plan
  p2_plan --> p2_menu
  p2_menu --> p2_fin
```

## P3 — Constitution du registre par propositions sectorielles

Les 258 risques types dérivés de 680 517 lésions sont proposés, jamais imposés. Le point dur du parcours est délibéré : aucune adoption sans que l'employeur ait coté la probabilité, risque par risque. Elle n'est pas dérivable des données ouvertes, et la Loi la met à sa charge (LSST art. 59).

```mermaid
flowchart LR
  subgraph voie0["Responsable SST"]
    direction LR
    p3_debut(["Registre à constituer"])
    p3_ouvrir["Ouvrir « Proposer les risques<br/>de mon secteur »"]
    p3_secteur["Choisir le sous-secteur SCIAN"]
    p3_orientation["Trancher : agriculture<br/>ou foresterie"]
    p3_domaine["Choisir le domaine du registre<br/>(aucune valeur par défaut)"]
    p3_coter["Coter la probabilité<br/>de CHAQUE risque retenu"]
    p3_fin(["Risques au registre"])
    p3_fin_vide(["Saisie manuelle requise"])
  end
  subgraph voie1["Application PPAI"]
    direction LR
    p3_plurivoque{"Code plurivoque ?<br/>(115)"}
    p3_vide{"Propositions<br/>disponibles ?"}
    p3_avertir[/"Signaler l'absence<br/>de données publiées"/]
    p3_bloquer{"Tout est coté ?"}
    p3_adopter[/"Adopter en lot<br/>+ tracer l'origine"/]
  end
  subgraph voie2["Référentiel CNESST"]
    direction LR
    p3_charger[/"Charger les risques types<br/>du grand secteur"/]
  end
  p3_debut --> p3_ouvrir
  p3_ouvrir --> p3_secteur
  p3_secteur --> p3_plurivoque
  p3_plurivoque -- "oui" --> p3_orientation
  p3_orientation --> p3_charger
  p3_plurivoque -- "non" --> p3_charger
  p3_charger --> p3_vide
  p3_vide -- "non" --> p3_avertir
  p3_avertir --> p3_fin_vide
  p3_vide -- "oui" --> p3_domaine
  p3_domaine --> p3_coter
  p3_coter --> p3_bloquer
  p3_bloquer -- "non" --> p3_coter
  p3_bloquer -- "oui" --> p3_adopter
  p3_adopter --> p3_fin
```

## P4 — Signalement terrain et qualification

Le chaînon entre le terrain et le registre. On ne demande pas au témoin d'un danger de produire une analyse : il décrit, le responsable SST cote. Tout signalement reçoit une suite explicite — un signalement écarté sans explication décourage le suivant.

```mermaid
flowchart LR
  subgraph voie0["Travailleur"]
    direction LR
    p4_debut(["Situation dangereuse<br/>observée"])
    p4_decrire["Décrire et situer<br/>(téléphone, 2 champs)"]
    p4_suite(["Consulter la suite donnée"])
    p4_fin(["Signalement traité"])
  end
  subgraph voie1["Responsable SST"]
    direction LR
    p4_examiner["Examiner le signalement"]
    p4_decision{"Devient un risque ?"}
    p4_qualifier["Coter et compléter<br/>(formulaire prérempli)"]
    p4_note["Rédiger la note d'écartement<br/>(obligatoire)"]
  end
  subgraph voie2["Base de données (RLS)"]
    direction LR
    p4_imposer[/"Imposer auteur et organisation<br/>depuis la session"/]
    p4_file[/"Déposer dans la file<br/>statut « nouveau »"/]
    p4_creer[/"Créer le risque au registre"/]
    p4_statuer[/"Consigner la décision"/]
  end
  p4_debut --> p4_decrire
  p4_decrire --> p4_imposer
  p4_imposer --> p4_file
  p4_file --> p4_examiner
  p4_examiner --> p4_decision
  p4_decision -- "oui" --> p4_qualifier
  p4_qualifier --> p4_creer
  p4_creer --> p4_statuer
  p4_decision -- "non" --> p4_note
  p4_note --> p4_statuer
  p4_statuer --> p4_suite
  p4_suite --> p4_fin
```

## P5 — Génération documentaire

Le moteur distant est tenté d'abord, le moteur local prend le relais en cas d'échec — la génération n'échoue jamais faute de réseau ou de clé. Quel que soit le chemin emprunté, la provenance réglementaire est figée dans le document : sources, version des textes, moteur réel.

```mermaid
flowchart LR
  subgraph voie0["Responsable SST"]
    direction LR
    p5_debut(["Document à produire"])
    p5_type["Choisir le type de document<br/>(langage métier)"]
    p5_fin(["Document traçable"])
  end
  subgraph voie1["Application PPAI"]
    direction LR
    p5_contexte[/"Assembler le contexte :<br/>registre + mécanismes exigés"/]
    p5_backend{"Backend joignable ?"}
    p5_echec{"Génération réussie ?"}
    p5_local[/"Générer localement<br/>(déterministe)"/]
    p5_provenance[/"Figer la provenance<br/>+ empreinte du registre"/]
    p5_conserver[/"Conserver le programme"/]
  end
  subgraph voie2["Edge Function (Claude)"]
    direction LR
    p5_claude[/"Générer par Claude"/]
  end
  subgraph voie3["Journal d'exécution"]
    direction LR
    p5_consigner[/"Consigner l'échec"/]
    p5_journal[/"Journaliser durée, moteur,<br/>jetons — jamais le document"/]
  end
  p5_debut --> p5_type
  p5_type --> p5_contexte
  p5_contexte --> p5_backend
  p5_backend -- "oui" --> p5_claude
  p5_claude --> p5_echec
  p5_echec -- "oui" --> p5_provenance
  p5_echec -- "non" --> p5_consigner
  p5_consigner --> p5_local
  p5_backend -- "non" --> p5_local
  p5_local --> p5_provenance
  p5_provenance --> p5_journal
  p5_journal --> p5_conserver
  p5_conserver --> p5_fin
```

## P6 — Gestion des rôles

Le masquage d'interface n'est pas la protection : la base refuse. Deux gardes s'appliquent en base, pas à l'écran — seul un administrateur modifie un rôle, et jamais le sien, pour qu'une organisation ne puisse pas perdre son dernier administrateur.

```mermaid
flowchart LR
  subgraph voie0["Direction (admin)"]
    direction LR
    p6_debut(["Collègue à habiliter"])
    p6_ouvrir["Ouvrir « Utilisateurs »"]
    p6_choisir["Attribuer un rôle"]
    p6_fin(["Habilitation effective"])
    p6_fin_refus(["Accès refusé, motif affiché"])
  end
  subgraph voie1["Application PPAI"]
    direction LR
    p6_garde{"Rôle administrateur ?"}
    p6_refus[/"Expliquer le refus<br/>(pas de redirection muette)"/]
    p6_effet[/"Recomposer la navigation<br/>et les droits d'écriture"/]
  end
  subgraph voie2["Base de données (RLS)"]
    direction LR
    p6_lister[/"Lister les profils<br/>de l'organisation"/]
    p6_soi{"Son propre profil ?"}
    p6_bloque[/"Refuser : une organisation<br/>garde son administrateur"/]
    p6_appliquer[/"Appliquer le rôle"/]
  end
  p6_debut --> p6_ouvrir
  p6_ouvrir --> p6_garde
  p6_garde -- "non" --> p6_refus
  p6_refus --> p6_fin_refus
  p6_garde -- "oui" --> p6_lister
  p6_lister --> p6_choisir
  p6_choisir --> p6_soi
  p6_soi -- "oui" --> p6_bloque
  p6_bloque --> p6_fin_refus
  p6_soi -- "non" --> p6_appliquer
  p6_appliquer --> p6_effet
  p6_effet --> p6_fin
```
