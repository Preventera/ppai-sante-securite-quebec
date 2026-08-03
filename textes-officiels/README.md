# Textes officiels — dossier de dépôt temporaire

Ce dossier reçoit les textes réglementaires que l'environnement de
développement ne peut pas atteindre : le réseau y refuse
`legisquebec.gouv.qc.ca`, `cnesst.gouv.qc.ca` et les hébergeurs tiers.

## Ce qu'on y dépose

| Fichier attendu | Texte | Page officielle |
|---|---|---|
| `S-2.1.pdf` | Loi sur la santé et la sécurité du travail (RLRQ c. S-2.1) | [LégisQuébec](https://www.legisquebec.gouv.qc.ca/fr/document/lc/S-2.1) |
| `rsst.pdf` | Règlement sur la santé et la sécurité du travail (RLRQ c. S-2.1, r. 13) | [LégisQuébec](https://www.legisquebec.gouv.qc.ca/fr/document/rc/S-2.1,%20r.%2013) |
| `cstc.pdf` | Code de sécurité pour les travaux de construction (RLRQ c. S-2.1, r. 4) | [LégisQuébec](https://www.legisquebec.gouv.qc.ca/fr/document/rc/S-2.1,%20r.%204) |

Le bouton **PDF** rouge, en haut à droite de chaque page, produit le fichier.
Le nom exact n'a pas d'importance.

## Ce qui en a déjà été tiré

L'index des articles : 1 850 numéros avec leur intitulé, leur section et leur
état d'abrogation, plus 20 annexes et l'article auquel chacune se rattache.
Voir `scripts/ontologie/README.md`. Les citations du code sont désormais
validées contre cet index plutôt que contre une règle de forme.

La couche normative : sujets, caractère, seuils chiffrés, normes incorporées.
684 seuils et 152 normes, dont ceux qu'affiche l'interface sous chaque mesure.

## Ce qui reste à en tirer

Le croisement des 21 agents causals avec les 20 genres d'accident, et le
rattachement des conditions d'application aux caractéristiques déclarées de
l'établissement.

## Ce dossier n'est pas destiné à rester

Les textes des Publications du Québec ne sont pas republiés par ce produit :
ils sont cités et liés. Les PDF restent le temps du travail d'ontologie, qui
les relit ; ils se retirent ensuite en une commande :

```sh
git rm "textes-officiels/S-2.1.pdf" \
       "textes-officiels/S-2.1, R. 13.pdf" \
       "textes-officiels/S-2.1, R. 4.pdf"
```

Rien n'en dépend à l'exécution : l'application n'embarque que des numéros
d'articles rattachés à des formulations qui nous appartiennent. Seule la
régénération de l'index exige de les redéposer.
