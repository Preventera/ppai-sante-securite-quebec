# Données de référence à charger dans Supabase

Ces fichiers se collent dans **Supabase > SQL Editor > New query > Run**.
Tous sont **idempotents** : les rejouer ne cause aucun dommage.

## Ordre de chargement

| # | Fichier | Contenu | Dépend de |
| --- | --- | --- | --- |
| 1 | `../migrations/20241001000002_complete_ppai_schema.sql` | Tables de base | — |
| 2 | `../migrations/20241001000003_multitenant_rls.sql` | Organisations, profils, cloisonnement | 2 |
| 3 | `referentiel_cnesst_complet.sql` | Migration 004 **+** 102 sous-secteurs **+** 258 risques types | 2 |
| 4 | `../migrations/20241001000005_roles_applicatifs.sql` | Quatre rôles appliqués par RLS | 3 |
| 5 | `../migrations/20241001000006_signalements.sql` | Signalements terrain | 5 |

Le fichier 3 se suffit à lui-même : il contient la migration 004 *et* les
données. Les fichiers 4 et 5 doivent être appliqués dans cet ordre — la table
des signalements s'appuie sur la fonction `auth_role()` créée par le 4.

## Vérifier que le chargement a réussi

```sql
SELECT
  (SELECT count(*) FROM scian_sectors)  AS sous_secteurs,   -- attendu : 102
  (SELECT count(*) FROM risk_templates) AS risques_types,   -- attendu : 258
  (SELECT count(DISTINCT secteur_cnesst) FROM risk_templates) AS secteurs; -- attendu : 22
```

## Ce que ces données ne disent pas

Aucune probabilité d'occurrence. Le grain des données ouvertes est « une ligne
= une lésion survenue », sans aucun contre-exemple : rien n'y permet d'estimer
une fréquence. Les décomptes servent à **classer**. La probabilité relève de
l'employeur pour son établissement (LSST art. 59), et l'application la lui
demande, risque par risque.
