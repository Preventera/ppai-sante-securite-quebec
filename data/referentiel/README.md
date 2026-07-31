# Référentiel sectoriel — niveau de risque de l'établissement

## Ce que le niveau détermine, et ce qu'il ne détermine pas

Le niveau de risque — 1 à 4, modèle multicritères CNESST–IRSST sur les codes
SCIAN 2012 — **ne détermine pas** quels mécanismes de prévention et de
participation s'appliquent. C'est l'effectif de l'établissement qui le fait, et
ce calcul est déjà implémenté dans `src/lib/lmrsst.ts`.

Le niveau conditionne les **modalités supplétives** du Règlement sur les
mécanismes de prévention et de participation en établissement (RMPPÉ) :

- le nombre de représentants des travailleuses et travailleurs au comité ;
- les modalités de désignation des membres du comité ;
- la fréquence des rencontres du comité ;
- le temps de libération du représentant en santé et en sécurité.

Point important, souvent inversé : ces modalités sont **d'abord convenues par
entente** entre les parties. Le RMPPÉ — et donc le niveau de risque —
n'intervient qu'**à défaut d'entente** (CNESST, DC200-7107-1, p. 8 et 9). Une
application qui imposerait la valeur réglementaire à tous les établissements
serait donc fausse dans le cas général.

Conséquence pour PPAI : `modalitesSelonNiveau()` énonce la règle d'entente et
renvoie au texte réglementaire. Les valeurs supplétives chiffrées ne sont pas
intégrées tant qu'elles n'ont pas été obtenues du Règlement lui-même.

## Le sens de l'échelle n'est pas documenté

La source publiée ne dit pas laquelle des deux extrémités correspond au régime
le plus exigeant, et la répartition ne permet pas de le déduire : la
construction de bâtiments (236) est au **niveau 1** tandis que la foresterie
(113) et l'extraction minière (212) sont au **niveau 4**.

Conséquence tenue dans le code : le niveau est affiché tel quel — « niveau 3 » —
et **jamais** traduit en « risque élevé » ou « risque faible », ni coloré selon
une échelle de gravité. Voir `LIBELLE_NIVEAU_NEUTRE` dans
`src/lib/scianNiveaux.ts`. Le jour où la CNESST documente le sens de l'échelle,
c'est ce seul point qu'il faudra reprendre.

## `niveaux_risque_cnesst.csv`

Table **complète** : les 102 sous-secteurs SCIAN 2012 publiés par la CNESST,
avec leur niveau. Aucune ligne n'est déduite, extrapolée ou complétée par
analogie — un niveau erroné produirait des obligations erronées dans un
document remis à un inspecteur.

Colonnes : `code,libelle,niveau,source`

Le code est celui du **sous-secteur**, à trois chiffres. Un code plus fin —
quatre à six chiffres — est ramené à ses trois premiers par
`secteurPourCode()`. Un code absent de la table renvoie `null` : l'absence est
une information, pas un motif pour retenir un niveau voisin.

Répartition : niveau 1 → 37 secteurs, niveau 2 → 24, niveau 3 → 9, niveau 4 → 32.

## Module TypeScript généré

`src/lib/scianNiveaux.ts` est **généré** depuis ce CSV et versionné, pour que
l'application résolve un niveau sans base de données — le mode démonstration
n'a pas de Supabase à interroger.

```bash
python3 scripts/data-analysis/generer_scian_ts.py            # régénérer
python3 scripts/data-analysis/generer_scian_ts.py --verifier # contrôler, sortie non nulle si écart
```

Ne pas modifier le fichier `.ts` à la main : deux copies d'une même table
réglementaire finissent toujours par diverger.

## Chargement en base

```bash
python3 scripts/data-analysis/charger_referentiel.py \
  --secteurs data/referentiel/niveaux_risque_cnesst.csv > charger.sql
```

Le script produit du SQL idempotent, à relire puis à coller dans l'éditeur SQL
du projet Supabase. Il refuse tout niveau hors de l'intervalle 1–4 et signale
les lignes incomplètes.

Vérifié sur PostgreSQL 16 : 102 lignes chargées, rejeu sans doublon, accents et
apostrophes préservés, contrainte `CHECK (niveau_risque BETWEEN 1 AND 4)`
opposée à un niveau 7, lecture refusée à `anon` et accordée à `authenticated`.

## Limites de l'outil de classement de la CNESST

À retenir avant de présenter un niveau comme acquis :

- la recherche se fait par numéro civique et code postal, ou par NEQ (10
  chiffres) ;
- les établissements **sans NEQ** sont exclus de l'outil ;
- certains établissements ne sont **pas couverts** par le classement ;
- les secteurs de l'**éducation** et de la **santé et des services sociaux**
  font l'objet de dispositions particulières.

Un établissement absent de l'outil n'a donc pas un niveau « inconnu par
défaut » : il peut relever d'un régime distinct. La colonne
`scian_sectors.niveau_risque` est délibérément nullable pour cette raison.

## Effectifs — le dénominateur

`cnesst_effectifs` reste vide tant qu'aucune source d'emploi n'est chargée.
Sans ce dénominateur, aucun taux de lésion ne peut être calculé : les données
ouvertes de la CNESST recensent les lésions survenues et ne contiennent aucun
contre-exemple. En dériver une probabilité d'occurrence serait une faute
méthodologique. Voir le commentaire en tête de
`supabase/migrations/20241001000004_referentiel_sectoriel.sql`.
