-- ============================================================
-- PPAI — Signalements terrain
--
-- Le registre des risques n'était alimenté que par les rôles qui rédigent.
-- Or la source la plus riche est le terrain : la personne qui VOIT la
-- situation dangereuse. La LSST attend d'ailleurs du travailleur qu'il
-- participe à l'identification des risques (art. 49).
--
-- Le signalement est volontairement plus simple qu'un risque : une
-- description, un lieu, c'est tout. La cotation (probabilité, gravité,
-- mesures) relève de la qualification par le responsable SST — on ne
-- demande pas au témoin d'un danger de produire une analyse.
--
-- CE QUE LES POLITIQUES DISENT
--   - Tout membre de l'organisation peut créer un signalement : c'est le but.
--   - L'auteur voit ses propres signalements et leur sort ; les rôles de
--     rédaction et le comité voient tout — le comité a un droit de regard
--     sur la prévention, pas seulement la direction.
--   - Seuls les rôles de rédaction qualifient (mise à jour) ou suppriment.
--   - L'auteur et l'organisation sont imposés par la base, pas par le
--     client : un signalement ne peut être déposé ni au nom d'un autre,
--     ni dans une autre organisation.
--
-- Idempotente : rejouable sans effet de bord.
-- ============================================================

CREATE TABLE IF NOT EXISTS signalements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    description TEXT NOT NULL CHECK (length(trim(description)) >= 10),
    lieu TEXT,
    statut VARCHAR NOT NULL DEFAULT 'nouveau'
        CHECK (statut IN ('nouveau', 'qualifie', 'rejete')),
    -- Renseignés à la qualification, pour que l'auteur voie le sort réservé
    -- à son signalement — un signalement sans suite visible décourage le
    -- suivant.
    decision_note TEXT,
    risque_code VARCHAR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    traite_le TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_signalements_org ON signalements (organization_id, statut, created_at DESC);

ALTER TABLE signalements ENABLE ROW LEVEL SECURITY;

-- L'auteur et l'organisation viennent de la session, jamais du client.
CREATE OR REPLACE FUNCTION garde_signalements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NOT NULL THEN
        NEW.reporter_id := auth.uid();
        NEW.organization_id := auth_organization_id();
        NEW.statut := 'nouveau';
        NEW.decision_note := NULL;
        NEW.risque_code := NULL;
        NEW.traite_le := NULL;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS garde_signalements ON signalements;
CREATE TRIGGER garde_signalements
    BEFORE INSERT ON signalements
    FOR EACH ROW EXECUTE FUNCTION garde_signalements();

-- Créer : tout membre authentifié de l'organisation.
DROP POLICY IF EXISTS signalements_insert ON signalements;
CREATE POLICY signalements_insert ON signalements
    FOR INSERT TO authenticated
    WITH CHECK (organization_id = auth_organization_id());

-- Lire : l'auteur voit les siens ; rédaction et comité voient tout.
DROP POLICY IF EXISTS signalements_select ON signalements;
CREATE POLICY signalements_select ON signalements
    FOR SELECT TO authenticated
    USING (
        organization_id = auth_organization_id()
        AND (
            reporter_id = auth.uid()
            OR auth_role() IN ('admin', 'preventionniste', 'comite')
        )
    );

-- Qualifier ou rejeter : rédaction seulement.
DROP POLICY IF EXISTS signalements_update ON signalements;
CREATE POLICY signalements_update ON signalements
    FOR UPDATE TO authenticated
    USING (organization_id = auth_organization_id()
           AND auth_role() IN ('admin', 'preventionniste'))
    WITH CHECK (organization_id = auth_organization_id());

DROP POLICY IF EXISTS signalements_delete ON signalements;
CREATE POLICY signalements_delete ON signalements
    FOR DELETE TO authenticated
    USING (organization_id = auth_organization_id()
           AND auth_role() IN ('admin', 'preventionniste'));

GRANT SELECT, INSERT, UPDATE, DELETE ON signalements TO authenticated;
