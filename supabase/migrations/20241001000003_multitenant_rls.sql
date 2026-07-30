-- ============================================================
-- PPAI — Cloisonnement multi-entreprises et politiques RLS réelles
--
-- La migration précédente ouvrait lecture ET écriture au rôle `anon`
-- (politique `demo_full_access`) : quiconque disposait de la clé publique
-- du projet pouvait lire, modifier et supprimer l'intégralité des données.
-- Cette migration remplace ce dispositif par un cloisonnement strict :
-- chaque utilisateur appartient à une organisation et ne voit que les
-- données de celle-ci.
--
-- Idempotente : rejouable sans effet de bord.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- Profils : rattachement d'un compte à une organisation
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    full_name VARCHAR,
    role VARCHAR NOT NULL DEFAULT 'membre' CHECK (role IN ('admin', 'membre')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles (organization_id);

-- ------------------------------------------------------------
-- Rattachement des données métier à une organisation
--
-- `risks` et `agent_executions` n'avaient aucune colonne de rattachement :
-- sans elle, aucune politique ne peut cloisonner les lignes.
-- ------------------------------------------------------------

ALTER TABLE risks
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE agent_executions
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_risks_organization ON risks (organization_id);
CREATE INDEX IF NOT EXISTS idx_executions_organization ON agent_executions (organization_id);

-- Le code de risque était unique globalement : deux entreprises n'auraient
-- pas pu posséder chacune un risque « RC4-001 ». L'unicité devient locale
-- à l'organisation.
ALTER TABLE risks DROP CONSTRAINT IF EXISTS risks_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_risks_code_per_organization
    ON risks (organization_id, code);

-- ------------------------------------------------------------
-- Organisation de l'appelant
--
-- SECURITY DEFINER : une politique de `profiles` qui interrogerait
-- `profiles` déclencherait une récursion infinie. La fonction contourne
-- le RLS, et son search_path est figé pour éviter tout détournement.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION auth_organization_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION auth_organization_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth_organization_id() TO authenticated;

-- ------------------------------------------------------------
-- Création du compte : organisation + profil, de façon atomique
--
-- Déclenché à l'inscription. Le nom d'entreprise est transmis par le
-- client via `options.data` de signUp, et se retrouve dans
-- raw_user_meta_data. Le premier compte d'une organisation en est admin.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    new_org_id UUID;
    org_name TEXT;
BEGIN
    org_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data ->> 'organization_name'), ''),
        'Organisation de ' || COALESCE(NEW.email, 'nouvel utilisateur')
    );

    INSERT INTO organizations (name, sector, size_category)
    VALUES (
        org_name,
        COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'sector'), ''), 'non précisé'),
        'PME'
    )
    RETURNING id INTO new_org_id;

    INSERT INTO profiles (id, organization_id, full_name, role)
    VALUES (
        NEW.id,
        new_org_id,
        NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
        'admin'
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ------------------------------------------------------------
-- Reprise des comptes existants
--
-- Le déclencheur ci-dessus ne s'applique qu'aux nouvelles inscriptions. Les
-- comptes créés avant cette migration n'auraient aucun profil, donc aucune
-- organisation, et se verraient refuser l'accès à toutes les données.
--
-- Chaque compte existant reçoit sa PROPRE organisation. C'est le choix
-- prudent : regrouper automatiquement des comptes par domaine de courriel
-- ferait cohabiter dans une même organisation des personnes sans lien entre
-- elles (cas des adresses gmail.com, par exemple). Pour réunir des collègues
-- a posteriori, il suffit d'aligner leur `organization_id` :
--
--   UPDATE profiles SET organization_id = '<organisation cible>'
--   WHERE id IN ('<uuid>', '<uuid>');
-- ------------------------------------------------------------

DO $$
DECLARE
    u RECORD;
    new_org_id UUID;
BEGIN
    FOR u IN
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN profiles p ON p.id = au.id
        WHERE p.id IS NULL
    LOOP
        INSERT INTO organizations (name, sector, size_category)
        VALUES (
            COALESCE(
                NULLIF(TRIM(u.raw_user_meta_data ->> 'organization_name'), ''),
                'Organisation de ' || COALESCE(u.email, u.id::text)
            ),
            'non précisé',
            'PME'
        )
        RETURNING id INTO new_org_id;

        INSERT INTO profiles (id, organization_id, full_name, role)
        VALUES (
            u.id,
            new_org_id,
            NULLIF(TRIM(u.raw_user_meta_data ->> 'full_name'), ''),
            'admin'
        );

        RAISE NOTICE 'Profil créé pour le compte existant % (organisation %)', u.email, new_org_id;
    END LOOP;
END $$;

-- ------------------------------------------------------------
-- Purge des données de démonstration non rattachées
--
-- Le seed de la migration précédente n'appartient à aucune organisation :
-- il serait invisible pour tous et fausserait les décomptes. Le mode
-- démonstration de l'application fournit ces mêmes données côté client.
-- Seules les lignes issues du seed sont supprimées.
-- ------------------------------------------------------------

DELETE FROM risks WHERE source = 'seed' AND organization_id IS NULL;

-- ------------------------------------------------------------
-- Politiques RLS
--
-- Remplacement intégral de `demo_full_access`. Le rôle `anon` ne conserve
-- aucun accès : toute lecture comme toute écriture exige un compte
-- authentifié rattaché à l'organisation propriétaire de la ligne.
-- ------------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'organizations', 'establishments', 'ai_agents',
        'risks', 'prevention_programs', 'agent_executions', 'workflows'
    ]
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS demo_full_access ON %I', t);
    END LOOP;
END $$;

-- Données métier cloisonnées par organisation
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'establishments', 'risks', 'prevention_programs', 'agent_executions'
    ]
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS org_isolation ON %I', t);
        EXECUTE format(
            'CREATE POLICY org_isolation ON %I
             FOR ALL TO authenticated
             USING (organization_id = auth_organization_id())
             WITH CHECK (organization_id = auth_organization_id())', t
        );
    END LOOP;
END $$;

-- Une organisation n'est visible que par ses propres membres
DROP POLICY IF EXISTS org_members_select ON organizations;
CREATE POLICY org_members_select ON organizations
    FOR SELECT TO authenticated
    USING (id = auth_organization_id());

DROP POLICY IF EXISTS org_admins_update ON organizations;
CREATE POLICY org_admins_update ON organizations
    FOR UPDATE TO authenticated
    USING (id = auth_organization_id())
    WITH CHECK (id = auth_organization_id());

-- Profils : visibles entre collègues, modifiables uniquement par soi-même
DROP POLICY IF EXISTS profiles_select_same_org ON profiles;
CREATE POLICY profiles_select_same_org ON profiles
    FOR SELECT TO authenticated
    USING (organization_id = auth_organization_id());

DROP POLICY IF EXISTS profiles_update_self ON profiles;
CREATE POLICY profiles_update_self ON profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Référentiels partagés : lecture seule, aucune écriture depuis le client
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['ai_agents', 'workflows']
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS reference_read ON %I', t);
        EXECUTE format(
            'CREATE POLICY reference_read ON %I
             FOR SELECT TO authenticated USING (TRUE)', t
        );
    END LOOP;
END $$;

-- ------------------------------------------------------------
-- Privilèges de table
--
-- Le RLS ne s'applique qu'aux rôles disposant déjà du privilège. On retire
-- explicitement tout accès à `anon` pour que la suppression des politiques
-- permissives ne laisse aucune porte ouverte.
-- ------------------------------------------------------------

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON
    establishments, risks, prevention_programs, agent_executions
    TO authenticated;

GRANT SELECT, UPDATE ON organizations, profiles TO authenticated;
GRANT SELECT ON ai_agents, workflows TO authenticated;
