-- ============================================================
-- PPAI — Rôles applicatifs appliqués jusqu'aux politiques RLS
--
-- La migration 003 stockait un rôle (`admin` | `membre`) qu'aucune
-- politique n'appliquait : tout membre authentifié pouvait écrire dans le
-- registre, et — plus grave — la politique `profiles_update_self` couvrait
-- la ligne entière du profil, colonne `role` comprise. N'importe quel
-- compte pouvait donc s'auto-promouvoir administrateur par un simple appel
-- API. Cette migration ferme cette porte et donne au rôle un effet réel.
--
-- Quatre rôles, calqués sur les responsabilités que la LSST nomme :
--   admin            direction — décide, attribue les rôles
--   preventionniste  responsable SST — tient le registre, génère les documents
--   comite           membre du CSS ou RSS — consulte, donne des avis
--   membre           travailleur — consulte
--
-- Écritures métier (risks, prevention_programs, establishments,
-- agent_executions) : admin et preventionniste. Lecture : toute
-- l'organisation. Le cloisonnement par organisation de la migration 003
-- reste inchangé — le rôle s'ajoute, il ne remplace rien.
--
-- Idempotente : rejouable sans effet de bord.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Le rôle passe de deux à quatre valeurs
-- ------------------------------------------------------------

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('admin', 'preventionniste', 'comite', 'membre'));

-- ------------------------------------------------------------
-- 2. Courriel sur le profil
--
-- L'écran Utilisateurs doit présenter des personnes reconnaissables.
-- `auth.users` n'est pas lisible depuis le client ; le courriel est donc
-- recopié sur le profil à l'inscription, et maintenant pour les comptes
-- existants.
-- ------------------------------------------------------------

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email VARCHAR;

UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id AND p.email IS NULL;

-- ------------------------------------------------------------
-- 3. Rôle de l'appelant
--
-- Même construction que auth_organization_id() (migration 003) et pour la
-- même raison : SECURITY DEFINER avec search_path figé, sans quoi une
-- politique de `profiles` qui interroge `profiles` boucle indéfiniment.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION auth_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth_role() TO authenticated;

-- ------------------------------------------------------------
-- 4. Le déclencheur d'inscription recopie le courriel
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

    -- Le premier compte d'une organisation en est l'administrateur : il n'y a
    -- personne d'autre pour lui attribuer un rôle.
    INSERT INTO profiles (id, organization_id, full_name, role, email)
    VALUES (
        NEW.id,
        new_org_id,
        NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
        'admin',
        NEW.email
    );

    RETURN NEW;
END;
$$;

-- ------------------------------------------------------------
-- 5. Garde contre l'élévation de privilèges
--
-- Les politiques RLS d'UPDATE ne savent pas comparer l'ancienne et la
-- nouvelle valeur d'une colonne : elles ne peuvent donc pas dire « modifiable,
-- sauf le rôle ». Ce déclencheur le dit à leur place :
--
--   - changer un rôle exige d'être admin, et jamais sur son propre profil
--     (un admin qui se rétrograde par erreur laisserait l'organisation sans
--     administrateur — le verrouillage serait définitif côté application) ;
--   - déplacer un profil vers une autre organisation est refusé depuis le
--     client, quel que soit le rôle.
--
-- La garde ne s'applique qu'aux requêtes authentifiées (auth.uid() non nul) :
-- l'éditeur SQL du tableau de bord Supabase et les opérations service_role
-- restent libres — c'est la voie de secours documentée si une organisation
-- se retrouve sans admin.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION garde_profils()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
        RAISE EXCEPTION 'Le rattachement d''organisation ne se modifie pas depuis l''application.';
    END IF;

    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF auth_role() <> 'admin' THEN
            RAISE EXCEPTION 'Seul un administrateur peut modifier un rôle.';
        END IF;
        IF OLD.id = auth.uid() THEN
            RAISE EXCEPTION 'Un administrateur ne peut pas modifier son propre rôle.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS garde_profils ON profiles;
CREATE TRIGGER garde_profils
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION garde_profils();

-- Les administrateurs peuvent modifier les profils de leur organisation
-- (le déclencheur ci-dessus limite ce qui peut effectivement changer).
DROP POLICY IF EXISTS profiles_update_admin ON profiles;
CREATE POLICY profiles_update_admin ON profiles
    FOR UPDATE TO authenticated
    USING (organization_id = auth_organization_id() AND auth_role() = 'admin')
    WITH CHECK (organization_id = auth_organization_id());

-- ------------------------------------------------------------
-- 6. Écritures métier réservées à la direction et au responsable SST
--
-- La politique unique `org_isolation FOR ALL` est scindée : lecture pour
-- toute l'organisation, écritures pour admin et preventionniste. Les
-- comptes existants sont tous admin (migration 003) : rien ne casse.
-- ------------------------------------------------------------

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'establishments', 'risks', 'prevention_programs', 'agent_executions'
    ]
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS org_isolation ON %I', t);

        EXECUTE format('DROP POLICY IF EXISTS org_read ON %I', t);
        EXECUTE format(
            'CREATE POLICY org_read ON %I
             FOR SELECT TO authenticated
             USING (organization_id = auth_organization_id())', t
        );

        EXECUTE format('DROP POLICY IF EXISTS org_insert_redaction ON %I', t);
        EXECUTE format(
            'CREATE POLICY org_insert_redaction ON %I
             FOR INSERT TO authenticated
             WITH CHECK (organization_id = auth_organization_id()
                         AND auth_role() IN (''admin'', ''preventionniste''))', t
        );

        EXECUTE format('DROP POLICY IF EXISTS org_update_redaction ON %I', t);
        EXECUTE format(
            'CREATE POLICY org_update_redaction ON %I
             FOR UPDATE TO authenticated
             USING (organization_id = auth_organization_id()
                    AND auth_role() IN (''admin'', ''preventionniste''))
             WITH CHECK (organization_id = auth_organization_id())', t
        );

        EXECUTE format('DROP POLICY IF EXISTS org_delete_redaction ON %I', t);
        EXECUTE format(
            'CREATE POLICY org_delete_redaction ON %I
             FOR DELETE TO authenticated
             USING (organization_id = auth_organization_id()
                    AND auth_role() IN (''admin'', ''preventionniste''))', t
        );
    END LOOP;
END $$;

-- ------------------------------------------------------------
-- 7. La fiche d'organisation suit la même règle
--
-- La politique `org_admins_update` de la migration 003 portait mal son
-- nom : elle vérifiait l'appartenance, pas le rôle. Tout membre pouvait
-- modifier la fiche (nom, effectif, code SCIAN). Or l'effectif et le SCIAN
-- déterminent les mécanismes de prévention exigés — leur saisie engage
-- l'employeur et revient à la direction et au responsable SST.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS org_admins_update ON organizations;
CREATE POLICY org_admins_update ON organizations
    FOR UPDATE TO authenticated
    USING (id = auth_organization_id()
           AND auth_role() IN ('admin', 'preventionniste'))
    WITH CHECK (id = auth_organization_id());
