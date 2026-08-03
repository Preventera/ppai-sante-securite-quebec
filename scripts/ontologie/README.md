# Ontologie réglementaire — chaîne de traitement

Ce dossier transforme les textes officiels en données vérifiables. Il ne
reproduit pas les règlements : il en extrait la **structure**.

## Ce qui est produit aujourd'hui

| Sortie | Contenu | Qui l'utilise |
|---|---|---|
| `data/reglementation/articles-index.json` | 1 850 articles : numéro, intitulé, section, sous-section, abrogation, page — plus 20 annexes et leur rattachement | les scripts, la suite du travail d'ontologie |
| `src/lib/articlesCitables.genere.ts` | les seuls numéros citables, en vigueur et abrogés | l'application, pour valider une citation |
| `data/reglementation/obligations.json` | pour ~1 100 articles : sujet, caractère, seuils chiffrés, normes incorporées, renvois | les scripts, l'audit des règles métier |
| `src/lib/obligations.genere.ts` | idem, restreint aux 40 articles que le code cite | l'application, pour afficher les conditions |

Les modules d'exécution sont volontairement maigres : 17 ko et 9 ko, contre 340 ko et 500 ko pour les index complets. Les intitulés et les
sections n'ont rien à faire dans un bundle de navigateur tant qu'aucun écran ne
les affiche.

## Lancer la chaîne

```sh
pip install pymupdf
python3 scripts/ontologie/extraire_articles.py     # index des articles
python3 scripts/ontologie/valider_articles.py      # contrôle l'index
python3 scripts/ontologie/extraire_obligations.py  # couche normative
python3 scripts/ontologie/valider_seuils.py        # confronte les seuils du produit au texte
python3 scripts/verifier_citations.py              # contrôle les citations du code
```

Tous se lancent depuis la racine du dépôt. Les deux extracteurs exigent les PDF
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

C'est le cas : 164 renvois pour la LSST, 124 pour le RSST, 83 pour le CSTC,
aucun orphelin.

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
- **Elle ne couvre pas le RMPPÉ.** Son PDF n'a pas été déposé ; son contenu a
  été établi autrement, article par article, et `rmppe.ts` en porte les valeurs.
- **Elle ne lit pas le droit.** La couche normative relève des marqueurs de
  surface. Un « doit » dans une subordonnée peut porter sur autre chose que le
  sujet principal. Elle sert à PROPOSER et à expliquer, jamais à trancher
  l'applicabilité à la place de l'employeur.

## La couche normative

`extraire_obligations.py` relève, pour chaque article : le **sujet** (employeur,
travailleur, maître d'œuvre), le **caractère** (obligation ou faculté), les
**seuils** chiffrés avec leur unité, les **normes** incorporées par renvoi, et
les **renvois** internes.

684 seuils, 152 normes. L'interface les affiche sous la mesure : « Garde-corps
sur toute ouverture » porte RSST art. 33.3 · CSTC art. 2.9.1, et les valeurs
1,5 m · 3 m · 0,7 m · 0,9 m · 1,2 m · 300 mm — chacune avec, en infobulle, le
fragment de texte qui lui donne son sens. « 3 m » seul ne dit rien : trois
mètres de quoi, mesurés d'où ?

Les unités ne sont pas que physiques. Le seuil qui décide de tout dans ce
produit — « au moins 20 travailleurs » — se compte en personnes. Sans lui, la
LSST ne rendait aucun seuil, ne parlant ni de mètres ni de décibels.

### L'audit des règles métier

`valider_seuils.py` confronte les constantes du produit au texte. Une constante
annotée `@seuil LSST art. 58 · 20 travailleurs` est vérifiée sur trois points :
l'article existe, il porte ce seuil, et la valeur codée correspond à
l'annotation. Trois constantes sont ainsi tenues — `SEUIL_EFFECTIF`,
`SEUIL_JOURS_PRESENCE_CSS`, `SEUIL_CHANTIER_CONSTRUCTION` — qui décidaient
jusqu'ici sur la foi d'une synthèse. Une modification réglementaire qui les
déplacerait ferait échouer le contrôle au lieu de passer inaperçue.

Ce contrôle ne lit pas le SENS de l'article : qu'il porte « 20 travailleurs »
n'établit pas qu'il l'impose dans l'acception que le produit lui prête. Le
commentaire de la constante le justifie, un humain le relit.

## Étape suivante

Le rattachement fin : croiser les 21 agents causals de la nomenclature CNESST
avec les 20 genres d'accident, et relier les conditions d'application aux
caractéristiques déclarées de l'établissement — pour passer de « voici la
condition » à « voici pourquoi elle vous vise ».

Les annexes rattachées sont le meilleur point de départ : l'annexe I du RSST
(art. 41) porte les valeurs d'exposition admissibles, l'annexe VI (art. 125) les
niveaux d'éclairement, l'annexe IV (art. 117) les normes de température.
