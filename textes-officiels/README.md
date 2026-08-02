# Textes officiels — dossier de dépôt temporaire

Ce dossier reçoit les textes réglementaires que l'environnement de
développement ne peut pas atteindre : le réseau y refuse
`legisquebec.gouv.qc.ca`, `cnesst.gouv.qc.ca` et les hébergeurs tiers.

## Ce qu'on y dépose

| Fichier attendu | Texte | Page officielle |
|---|---|---|
| `rsst.pdf` | Règlement sur la santé et la sécurité du travail (RLRQ c. S-2.1, r. 13) | [LégisQuébec](https://www.legisquebec.gouv.qc.ca/fr/document/rc/S-2.1,%20r.%2013) |
| `cstc.pdf` | Code de sécurité pour les travaux de construction (RLRQ c. S-2.1, r. 4) | [LégisQuébec](https://www.legisquebec.gouv.qc.ca/fr/document/rc/S-2.1,%20r.%204) |

Le bouton **PDF** rouge, en haut à droite de chaque page, produit le fichier.
Le nom exact n'a pas d'importance.

## Ce qu'on en fait

1. **Rattacher les numéros d'articles** aux mesures de `src/lib/prevention.ts`,
   qui nomment aujourd'hui l'instrument sans le citer. Chaque numéro ajouté
   passe le contrôle de `scripts/verifier_citations.py`.
2. **Extraire l'ontologie du domaine** : sujets, conditions d'application,
   seuils, classes d'équipements, renvois de normes — la couche normative qui
   manque au-dessus de la matrice empirique des genres d'accident.

## Ce dossier n'est pas destiné à rester

Les textes des Publications du Québec ne sont pas republiés par ce produit :
ils sont cités et liés. Les PDF sont retirés du dépôt une fois l'extraction
faite. Ce qui subsiste, ce sont des numéros d'articles rattachés à des
formulations qui nous appartiennent — pas le texte officiel recopié.
