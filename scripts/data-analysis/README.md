# Ingestion des données CNESST

## Récupérer les données

```bash
python3 cnesst_ingest.py --list              # lister les ressources publiées
python3 cnesst_ingest.py --download --out output/
```

Le script interroge l'API CKAN de Données Québec. Il refuse d'écrire un fichier
dont le contenu est du HTML — c'est exactement l'erreur du script précédent,
qui enregistrait la page web sous le nom `cnesst_raw_data.csv`.

## Contrainte méthodologique — à lire avant tout usage

Le grain des données est **« une ligne = une lésion survenue »**. Il n'existe
aucun contre-exemple : aucun travailleur sans lésion n'apparaît dans le jeu de
données.

| Usage | Légitime |
|---|---|
| Caractériser les agents causals dominants d'un secteur | oui |
| Estimer la **gravité** (nature, siège, jours d'arrêt) | oui |
| Estimer la **probabilité d'occurrence** | **non** |
| Calculer un taux pour 100 travailleurs | seulement avec un dénominateur d'effectifs |

Présenter une classification de type de lésion comme une « probabilité
d'accident » est une faute méthodologique. Le dénominateur d'effectifs par
secteur doit être obtenu séparément (Statistique Canada, Institut de la
statistique du Québec) et alimente la table `cnesst_effectifs`.

## Destination

Les fichiers récupérés alimentent le référentiel sectoriel partagé, créé par
`supabase/migrations/20241001000004_referentiel_sectoriel.sql` :

| Table | Contenu |
|---|---|
| `scian_sectors` | Codes SCIAN 2012, libellés, niveau de risque 1 à 4 |
| `cnesst_lesions` | Décomptes par secteur × région × année × nature × siège × agent |
| `cnesst_effectifs` | Dénominateur d'emploi, source distincte |
| `risk_templates` | Risques proposés par secteur, gravité suggérée |

Ce référentiel **propose** un registre de départ ; il ne le constitue jamais.
L'article 59 de la LSST exige que l'employeur identifie les risques de **son**
établissement — une statistique sectorielle ne peut s'y substituer.

## Charger le référentiel sectoriel

La correspondance SCIAN → niveau de risque n'est pas récupérable
automatiquement : l'outil de la CNESST et le portail de Statistique Canada
refusent les requêtes automatisées. Le chargement passe donc par un CSV que
tu prépares, converti en SQL relu avant exécution.

```bash
python3 charger_referentiel.py --secteurs secteurs.csv > charger.sql
python3 charger_referentiel.py --secteurs secteurs.csv --effectifs effectifs.csv > charger.sql
```

Puis coller `charger.sql` dans l'éditeur SQL du projet Supabase.

### Format attendu

`secteurs.csv` — source : outil « Niveau des activités de l'établissement »
de la CNESST.

```csv
code,libelle,niveau
2361,Construction résidentielle,1
5411,Services juridiques,4
6221,Hôpitaux généraux et chirurgicaux,
```

Le niveau est un entier de 1 à 4, ou vide s'il est inconnu. Les lignes dont le
niveau est hors bornes sont rejetées avec un avertissement.

`effectifs.csv` — source : Statistique Canada ou Institut de la statistique du
Québec. Sans ce fichier, aucun taux pour 100 travailleurs n'est calculable.

```csv
code,annee,nb_travailleurs,region
2361,2023,48210,ENSEMBLE
```

Le SQL produit est idempotent : le rejouer met à jour les libellés et les
niveaux sans créer de doublon.
