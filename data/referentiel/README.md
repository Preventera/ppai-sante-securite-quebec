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

## `niveaux_risque_cnesst.csv`

Extrait **partiel**. Il ne contient que les affectations effectivement obtenues
de l'outil « Recherche du classement de l'établissement par niveau » de la
CNESST. Aucune ligne n'est déduite, extrapolée ou complétée par analogie : un
niveau erroné produirait des obligations erronées dans un document remis à un
inspecteur.

Colonnes : `code,libelle,niveau,source`

La colonne `code` est **vide** pour les trois lignes actuelles : l'outil CNESST
a été consulté par libellé d'activité, et le code SCIAN correspondant n'a pas
été relevé. Le chargeur ignore ces lignes en le signalant — c'est voulu. Pour
les activer, relever le code affiché par l'outil et le reporter dans la
colonne.

## Chargement

```bash
python3 scripts/data-analysis/charger_referentiel.py \
  --secteurs data/referentiel/niveaux_risque_cnesst.csv > charger.sql
```

Le script produit du SQL idempotent, à relire puis à coller dans l'éditeur SQL
du projet Supabase. Il refuse tout niveau hors de l'intervalle 1–4 et signale
les lignes incomplètes.

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
