# PPAI — Santé et Sécurité Québec

Application de génération de programmes de prévention SST intégrant un registre
des risques, conforme aux exigences CNESST / LSST / RSST.

## Démarrage rapide

```bash
npm install
npm run dev
```

**Aucune configuration n'est requise.** L'application détecte au démarrage si un
backend Supabase exploitable est joignable :

| Mode | Déclenchement | Données | Génération de programme |
|---|---|---|---|
| **Démonstration** | Backend absent, injoignable ou schéma manquant | Registre de 15 risques pré-chargé, persisté dans le navigateur | Moteur local déterministe |
| **Live** | Supabase joignable avec le schéma appliqué | Tables PostgreSQL | Claude via Edge Function, repli local en cas d'échec |

Le mode actif est affiché en permanence dans l'interface (badge « Mode
démonstration » / « Supabase connecté »). Les deux modes exposent exactement les
mêmes fonctionnalités : création, modification, suppression et import de risques,
génération et conservation des programmes.

## Fonctionnalités

- **Registre des risques** — matrice 5×5, CRUD complet, recalcul immédiat des
  indices, recherche, tri, export CSV / Markdown / JSON.
- **Génération de programmes** — les risques du registre alimentent réellement le
  document produit, structuré selon les dix exigences de la LSST et la hiérarchie
  de prévention de l'article 51. Les programmes générés sont conservés et
  consultables.
- **Analytique** — répartition par catégorie, effet des mesures par secteur,
  indicateurs de maîtrise et écarts de conformité, tous calculés sur le registre.
- **Import CNESST** — lecture réelle de fichiers CSV/TSV (détection du séparateur,
  guillemets échappés, BOM), cartographie automatique des colonnes vers les champs
  du registre et import en lot.

## Configuration

Copier `.env.example` en `.env.local`. Toutes les variables sont facultatives ;
voir les commentaires du fichier.

Pour forcer une démonstration hors ligne totalement déterministe :

```bash
echo "VITE_DEMO_MODE=true" >> .env.local
```

## Activer le mode « live »

1. Appliquer les migrations sur le projet Supabase :

   ```bash
   supabase db push
   ```

   `supabase/migrations/20241001000002_complete_ppai_schema.sql` crée les tables
   `risks`, `prevention_programs`, `agent_executions` et `workflows`, active RLS
   et insère le registre de référence. Elle est **idempotente** et rattrape les
   tables manquantes de la première migration.

   > La migration `20241001000001` requiert l'extension `pg_cron` : si elle n'est
   > pas activée sur le projet, cette migration échoue — la seconde crée malgré
   > tout l'ensemble des tables nécessaires.

2. Renseigner `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans `.env.local`.

3. Pour la génération par Claude, déployer la fonction et son secret :

   ```bash
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   supabase functions deploy generate-prevention-program
   ```

   Sans clé API, la génération bascule silencieusement sur le moteur local : la
   provenance réelle est indiquée sur chaque programme (« Claude » ou
   « Moteur local »).

### Sécurité — à traiter avant toute mise en production

Le MVP n'a pas d'authentification. Les politiques RLS de la migration
(`demo_full_access`) ouvrent la lecture **et l'écriture** au rôle `anon`,
c'est-à-dire à quiconque possède la clé publique du projet. Elles doivent être
remplacées par des politiques fondées sur `auth.uid()` et le rattachement de
l'utilisateur à son organisation.

## Scénario de démonstration suggéré

1. **Tableau de bord** — indicateurs et écarts de conformité calculés sur le registre.
2. **Registre des risques** — ouvrir la matrice 5×5, ajouter un risque critique
   (probabilité 5 × gravité 5) : indices, matrice, graphiques et alertes se
   recalculent immédiatement. Le modifier, puis le supprimer.
3. **Générateur de programme** — activer l'intégration du registre et générer :
   le document reprend les risques réels, les priorise et signale les écarts
   (risques sans responsable ou sans mesure).
4. **Programmes enregistrés** — retrouver le document, le prévisualiser, l'exporter.
5. **Import CNESST** — déposer un CSV : colonnes réellement lues, risques détectés,
   import dans le registre.

Le bouton « Réinitialiser » du registre restaure le jeu de démonstration d'origine.

## Architecture technique

- **Frontend** : React 18, TypeScript, Vite
- **UI** : Tailwind CSS, shadcn/ui (Radix)
- **État serveur** : TanStack Query
- **Graphiques** : Recharts, D3
- **Backend** : Supabase (PostgreSQL, Edge Functions Deno)
- **IA** : Claude via Edge Function, avec repli local déterministe

### Points de repère

| Chemin | Rôle |
|---|---|
| `src/lib/env.ts` | Configuration d'exécution — ne lève jamais d'exception |
| `src/lib/backend.ts` | Sonde de disponibilité du backend, bascule live / démo |
| `src/services/riskService.ts` | Registre des risques, hybride Supabase / local |
| `src/services/programService.ts` | Conservation des programmes générés |
| `src/services/localProgramGenerator.ts` | Générateur déterministe conforme LSST |
| `src/utils/csvImport.ts` | Lecture CSV et cartographie des colonnes |
| `src/lib/chartTheme.ts` | Jetons de visualisation (palette validée) |
| `supabase/migrations/` | Schéma PostgreSQL, RLS et seed |

## Scripts

```bash
npm run dev        # serveur de développement
npm run build      # build de production
npm run lint       # ESLint
npx tsc --noEmit -p tsconfig.app.json   # vérification des types
```
