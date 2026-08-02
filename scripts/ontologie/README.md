# Ontologie réglementaire — chaîne de traitement

Ce dossier transforme les textes officiels en données vérifiables. Il ne
reproduit pas les règlements : il en extrait la **structure**.

## Ce qui est produit aujourd'hui

| Sortie | Contenu | Qui l'utilise |
|---|---|---|
| `data/reglementation/articles-index.json` | 1 329 articles : numéro, intitulé, section, sous-section, abrogation, page — plus 20 annexes et leur rattachement | les scripts, la suite du travail d'ontologie |
| `src/lib/articlesCitables.genere.ts` | les seuls numéros citables, en vigueur et abrogés | l'application, pour valider une citation |

Le second est volontairement maigre : 13 ko contre 250. Les intitulés et les
sections n'ont rien à faire dans un bundle de navigateur tant qu'aucun écran ne
les affiche.

## Lancer la chaîne

```sh
pip install pymupdf
python3 scripts/ontologie/extraire_articles.py   # dépouille les PDF
python3 scripts/ontologie/valider_articles.py    # contrôle le résultat
python3 scripts/verifier_citations.py            # contrôle le code
```

Les trois se lancent depuis la racine du dépôt. Le premier exige les PDF
officiels dans `textes-officiels/` — voir le README de ce dossier.

## Comment les articles sont repérés

Par la **typographie**, pas par le texte. Dans les deux PDF, le numéro d'article
est le seul élément en gras corps 13 ; son intitulé suit en gras corps 11, le
texte courant est en romain corps 11. Les énumérations (« 1° », « a) »), les
grilles d'annexes et les paragraphes de définitions n'ont aucune de ces
propriétés et disparaissent d'eux-mêmes.

Une détection par expression régulière sur le texte brut donnait 507 faux
positifs pour le seul CSTC.

## Comment le résultat est prouvé

Un règlement se cite lui-même : « conformément à l'article 347 », « sous réserve
des articles 312.46 à 312.54 ». Ces renvois sont écrits par le législateur, pas
par l'extracteur — ils forment donc un jeu d'épreuve indépendant. Si l'index est
complet, **tout renvoi interne doit y résoudre**.

C'est le cas : 124 renvois pour le RSST, 83 pour le CSTC, aucun orphelin.

Trois familles de renvois sont écartées avant ce contrôle, et le validateur
annonce chacune :

1. **Renvois à une norme.** Le règlement incorpore par renvoi des articles de
   CAN/CSA, NF EN, ACNOR, ANSI. « les articles 4.11.2 à 4.11.5 de la norme
   CAN/CSA Z275.2-11 » n'a rien à voir avec sa propre numérotation.
2. **Renvois hors forme.** Un numéro que la numérotation du texte ne peut pas
   produire ne peut désigner un de ses articles, quel que soit le contexte.
3. **Renvois internes aux annexes.** Les annexes portent leur propre
   numérotation — l'annexe 8 du CSTC contient les dispositions 8.1 à 8.4, qui
   ne sont pas les articles 8.1 à 8.4 du corps.

Le rattachement déclaré par chaque annexe sert de contrôle croisé
supplémentaire : « ANNEXE 8 (a. 7.2.1) » n'a de sens que si l'article 7.2.1
existe.

## Ce que la chaîne ne fait pas

- **Elle ne conserve pas le texte des articles.** Numéro, intitulé, section.
  Le produit cite et lie les Publications du Québec, il ne les republie pas.
- **Elle ne dit rien du contenu.** Elle établit que la liste des numéros est
  juste. C'est exactement ce sur quoi reposent les citations du produit, et rien
  de plus.
- **Elle ne couvre pas la LSST.** Son PDF n'a pas été déposé. Ses articles
  restent soumis à la règle de corroboration.

## Étape suivante

L'index est la fondation, pas l'ontologie. Ce qui reste à extraire du texte :
sujets (employeur, travailleur, maître d'œuvre), conditions d'application,
seuils chiffrés, classes d'équipements, renvois de normes — puis le rattachement
aux genres d'accident de `src/lib/prevention.ts`.

Les annexes rattachées sont le meilleur point de départ : l'annexe I du RSST
(art. 41) porte les valeurs d'exposition admissibles, l'annexe VI (art. 125) les
niveaux d'éclairement, l'annexe IV (art. 117) les normes de température.
