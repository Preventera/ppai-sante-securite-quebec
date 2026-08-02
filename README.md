<p align="center"><img src="public/agenticx5.svg" alt="AgenticX5" width="120" /></p>

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
| **Démonstration** | Variables Supabase absentes, backend injoignable ou schéma manquant | Registre de 15 risques pré-chargé, persisté dans le navigateur | Moteur local déterministe |
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
- **Signalement terrain** — toute personne de l'organisation peut signaler une
  situation dangereuse en deux champs (`/signaler`, conçu pour téléphone) ; le
  responsable SST qualifie chaque signalement en risque coté ou le traite sans
  suite avec une note que l'auteur voit (`/signalements`). L'auteur et
  l'organisation sont imposés par la base (migration `20241001000006`).
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

> **Sans la CLI Supabase** — tous les fichiers SQL se collent directement dans
> *Supabase > SQL Editor*. Ils sont téléchargeables depuis ce dépôt :
> [`supabase/seed/`](supabase/seed/) (référentiel CNESST complet) et
> [`supabase/migrations/`](supabase/migrations/). L'ordre de chargement et une
> requête de vérification figurent dans
> [`supabase/seed/README.md`](supabase/seed/README.md).

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

   Dès que le backend répond, l'application exige une **connexion** : la page
   `/auth` permet de créer un compte en indiquant le nom de l'entreprise, ce qui
   crée l'organisation propriétaire des données.

3. Pour la génération par Claude, déployer la fonction et son secret :

   ```bash
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   supabase functions deploy generate-prevention-program
   ```

   Sans clé API, la génération bascule silencieusement sur le moteur local : la
   provenance réelle est indiquée sur chaque programme (« Claude » ou
   « Moteur local »).

### Sécurité et cloisonnement multi-entreprises

La migration `20241001000003_multitenant_rls.sql` remplace les politiques
permissives initiales par un cloisonnement strict :

- Chaque compte est rattaché à une **organisation** via la table `profiles`.
  À l'inscription, un déclencheur crée l'organisation et le profil de façon
  atomique ; le premier compte en est administrateur.
- Chaque compte porte un **rôle applicatif** appliqué par les politiques RLS
  (migration `20241001000005_roles_applicatifs.sql`) :

  | Rôle | Libellé | Ce que la base lui permet |
  | --- | --- | --- |
  | `admin` | Direction | Tout, plus l'attribution des rôles (écran Utilisateurs) |
  | `preventionniste` | Responsable SST | Écrire dans le registre, générer les documents |
  | `comite` | Comité / RSS | Lire le registre et les programmes |
  | `membre` | Membre | Lire les programmes |

  Deux garde-fous, appliqués par déclencheur côté base : personne ne peut
  changer **son propre** rôle (une organisation ne doit pas perdre son dernier
  administrateur par erreur), et seuls les admins changent celui des autres.
  Voie de secours : l'éditeur SQL du tableau de bord Supabase n'est pas soumis
  à ces gardes — `UPDATE profiles SET role = 'admin' WHERE email = '…';`.
- L'**effectif** et le **code SCIAN** de l'organisation se déclarent sur la
  page Participation (direction et responsable SST seulement) : ils
  déterminent les mécanismes exigés, et l'entrée de menu correspondante —
  « Comité SST » à 20 travailleurs et plus, « Agent de liaison » en dessous.
- Les politiques RLS de `risks`, `prevention_programs`, `establishments` et
  `agent_executions` filtrent sur `auth_organization_id()`. Une entreprise ne
  peut ni lire, ni modifier, ni supprimer les données d'une autre.
- Le rôle `anon` **n'a plus aucun privilège** : sans session, toute requête est
  refusée au niveau des privilèges de table, avant même le RLS.
- `auth_organization_id()` est `SECURITY DEFINER` avec `search_path` figé, afin
  d'éviter la récursion infinie d'une politique de `profiles` qui interrogerait
  `profiles`.
- L'unicité du code de risque est passée de globale à locale
  (`UNIQUE (organization_id, code)`) : deux entreprises peuvent chacune posséder
  un risque `RC4-001`.

Ces politiques ont été vérifiées sur PostgreSQL 16 avec deux organisations
distinctes : lecture croisée, modification, suppression, insertion avec
`organization_id` forcé et déplacement d'une ligne vers une autre organisation
sont tous refusés.

> **Confirmation des courriels** — activez-la dans Supabase (*Authentication >
> Providers > Email*) avant toute mise en production, sinon n'importe qui peut
> créer un compte avec une adresse qu'il ne contrôle pas.

### Réinitialisation du mot de passe

Le parcours complet est dans l'application :

| Étape | Où |
| --- | --- |
| Demander un lien | `/auth`, lien « Mot de passe oublié ? » sous le formulaire de connexion |
| Choisir le nouveau mot de passe | `/auth/reset`, atteinte par le lien du courriel |
| Changer son mot de passe en étant connecté | Barre latérale, « Changer mon mot de passe » (même écran) |

**Une configuration Supabase est indispensable**, sans quoi le courriel part mais
son lien ne revient nulle part. Dans *Authentication > URL Configuration* :

- **Site URL** : l'adresse de production, par exemple `https://votre-site.netlify.app`.
- **Redirect URLs** : ajouter `https://votre-site.netlify.app/auth/reset`.
  Une adresse non déclarée est ignorée par Supabase, qui rabat alors le lien sur
  la *Site URL* — donc sur la racine, où aucun écran ne sait traiter le jeton.
  Pour le développement local, ajouter aussi `http://localhost:5173/auth/reset`.

Le lien est valable **une heure** et ne sert qu'une fois. L'écran `/auth/reset`
reconnaît les trois formes de retour employées par Supabase selon le flux et le
gabarit de courriel (`#access_token=…`, `?code=…`, `?token_hash=…`) et affiche un
message explicite quand le lien est expiré plutôt qu'une page vide.

### Aucun courriel ne part : diagnostic

C'est le blocage le plus fréquent, et il ne vient pas de l'application — celle-ci
ne fait qu'appeler Supabase, qui décide d'envoyer ou non.

**Le service d'envoi intégré de Supabase est un service de test.** Il est
soumis à deux limites qui expliquent la quasi-totalité des cas :

1. **Un débit de quelques messages par heure seulement.** Au-delà, les envois
   suivants sont refusés — parfois sans erreur visible côté application.
2. **Il n'expédie qu'aux adresses des membres de votre organisation Supabase.**
   Un courriel destiné à une adresse tierce est accepté par l'API puis
   abandonné. L'application affiche « Vérifiez votre courriel » en toute bonne
   foi : elle n'a aucun moyen de savoir que le message n'est jamais parti.

**Vérifier ce qui s'est réellement passé** : *Supabase > Logs > Auth Logs*.
Chaque tentative y figure, avec le motif du refus le cas échéant. C'est la
seule source qui tranche — l'absence de message dans la boîte de réception ne
dit pas *pourquoi*.

**Débloquer immédiatement**, sans attendre la configuration SMTP :

- *Authentication > Users > ⋯ > **Confirm email*** confirme un compte à la
  main, sans qu'aucun courriel ne soit nécessaire ;
- ou, pendant la mise au point seulement, désactiver *Confirm email* dans
  *Authentication > Providers > Email* — à réactiver avant toute ouverture à
  des utilisateurs, sinon n'importe qui peut créer un compte avec une adresse
  qu'il ne contrôle pas.

**Régler durablement** : configurer un SMTP applicatif dans
*Authentication > Emails > SMTP Settings* (et non dans *Sign In / Providers*,
où l'on cherche naturellement mais où il n'est pas). Sans cette étape, ni la
confirmation d'inscription ni la réinitialisation de mot de passe ne
fonctionneront pour de vrais utilisateurs.

Configuration en service, à titre d'exemple reproductible — Brevo, retenu
parce qu'il valide une adresse d'expéditeur **par simple clic dans un
courriel**, sans exiger d'accès aux DNS du domaine :

| Champ | Valeur |
| --- | --- |
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | l'identifiant technique affiché sous « Connexion » chez Brevo, de la forme `xxxxxxx@smtp-brevo.com` — **pas** l'adresse courriel |
| Password | une clé SMTP générée dans *SMTP & API* (visible en entier une seule fois) |
| Sender email | une adresse validée dans *Expéditeurs, domaine, IP* |

Deux pièges rencontrés :

- **Le plafond d'envoi de Supabase ne se lève pas tout seul.**
  *Authentication > Rate Limits > « Rate limit for sending emails »* reste à sa
  valeur basse même après avoir branché un SMTP externe. Sans cette
  modification, on a changé de serveur sans rien débloquer.
- **Ne pas activer le blocage par adresse IP** chez le fournisseur SMTP : les
  serveurs de Supabase n'ont pas d'adresse fixe déclarable, et l'activer coupe
  tous les envois.

D'autres services conviennent (Resend, Postmark, SendGrid, Amazon SES). Ceux
qui exigent une authentification DNS du domaine offrent une meilleure
délivrabilité, au prix d'un accès à la zone DNS.

> **Les deux adresses de retour doivent être déclarées.** Dans
> *Authentication > URL Configuration > Redirect URLs*, il en faut **deux** :
> `<site>/auth/reset` pour la réinitialisation, et `<site>/` pour la
> confirmation d'inscription. Une adresse non déclarée est ignorée par
> Supabase, qui rabat le lien sur la *Site URL* — restée par défaut sur
> `http://localhost:3000` dans un projet neuf.

> **Dépannage immédiat** — si plus personne ne peut se connecter, un mot de passe
> se réinitialise depuis le tableau de bord Supabase (*Authentication > Users >
> ⋯ > Send password recovery*). Ne supprimez pas le compte pour le recréer : les
> risques et programmes restent rattachés à l'ancienne `organization_id` et
> deviendraient invisibles.

## Mettre la démo en ligne (Netlify)

Le site se déploie **sans backend** : sans variables Supabase, il tourne en mode
démonstration, pleinement fonctionnel.

1. Netlify > **Add new site** > *Import an existing project* > GitHub >
   `Preventera/ppai-sante-securite-quebec`.
2. Laisser Netlify lire `netlify.toml` — commande et dossier de publication y
   sont déjà définis (`npm run build`, `dist`).
3. Déployer. Rien d'autre n'est requis pour une démonstration.

Pour passer en mode « live », ajouter dans *Site configuration > Environment
variables* : `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`, puis appliquer les
migrations (voir plus haut). Ne jamais y placer la clé `service_role` : toute
variable préfixée `VITE_` est incluse dans le bundle public.

> **Redirection SPA** — la règle `/*  →  /index.html` de `netlify.toml` est
> indispensable : sans elle, toute URL profonde (`/risks`, `/programs`) renvoie
> 404 au rechargement ou en accès direct. Elle doit rester la dernière règle.

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

## Propriété et licence

© 2026 Preventera — **AgenticX5**. Tous droits réservés (voir `LICENSE.md`).

Le logiciel est protégé par la **Loi sur le droit d'auteur** (L.R.C. 1985,
ch. C-42), qui range les programmes d'ordinateur parmi les œuvres
littéraires. La protection naît automatiquement à la création : aucun dépôt
n'est requis. Ce dépôt n'est pas sous licence libre — sa visibilité ne
constitue pas une autorisation d'utilisation.

Les données ouvertes de la CNESST demeurent régies par les conditions de
leurs sources et ne sont pas revendiquées. Ce qui l'est, c'est le travail
d'agrégation, de traitement et de modélisation qui leur est appliqué —
chaîne de dérivation des 258 risques types, contrainte méthodologique sur la
probabilité, encodage du régime LMRSST/RMPPÉ, correspondances sectorielles,
architecture d'orchestration IA et de traçabilité. `LICENSE.md` détaille ces
apports et leur fondement.
