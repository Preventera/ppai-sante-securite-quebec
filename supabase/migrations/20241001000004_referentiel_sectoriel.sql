-- ============================================================
-- PPAI — Référentiel sectoriel CNESST
--
-- Données de référence PARTAGÉES entre tous les locataires, par opposition au
-- registre des risques qui reste cloisonné par organisation.
--
-- Distinction fondamentale : les statistiques de lésions professionnelles sont
-- agrégées par secteur, région et année. Elles décrivent une population, pas un
-- établissement. L'article 59 de la LSST exigeant que l'employeur identifie les
-- risques DE SON établissement, ce référentiel ne constitue jamais le registre :
-- il propose, l'employeur dispose.
--
-- Idempotente.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- Secteurs d'activité économique
--
-- `niveau_risque` : 1 à 4, modèle multicritères CNESST–IRSST fondé sur les
-- codes SCIAN 2012. Il détermine la fréquence des réunions du comité de santé
-- et de sécurité, le temps de libération du représentant en santé et sécurité
-- et les délais de formation.
--
-- Volontairement NULLABLE : la table officielle de correspondance n'est pas
-- encore intégrée. Une valeur inventée produirait des obligations erronées
-- dans les documents remis à un inspecteur.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS scian_sectors (
    code VARCHAR PRIMARY KEY,
    libelle TEXT NOT NULL,
    niveau_risque SMALLINT CHECK (niveau_risque BETWEEN 1 AND 4),
    version_scian VARCHAR NOT NULL DEFAULT '2012',
    source TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN scian_sectors.niveau_risque IS
    'Niveau 1 à 4 (CNESST–IRSST, SCIAN 2012). NULL tant que la table officielle n''est pas intégrée.';

-- ------------------------------------------------------------
-- Lésions professionnelles, agrégées
--
-- Grain : une ligne = un décompte pour un croisement secteur × région × année
-- × nature × siège × genre × agent causal. Correspond aux données ouvertes
-- publiées par la CNESST sur Données Québec.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cnesst_lesions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    secteur_scian VARCHAR NOT NULL REFERENCES scian_sectors(code) ON DELETE CASCADE,
    region VARCHAR,
    annee SMALLINT NOT NULL,
    nature_lesion VARCHAR,
    siege_lesion VARCHAR,
    genre_accident VARCHAR,
    agent_causal VARCHAR,
    nb_cas INTEGER NOT NULL CHECK (nb_cas >= 0),
    source TEXT NOT NULL DEFAULT 'Données Québec — CNESST',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesions_secteur_annee ON cnesst_lesions (secteur_scian, annee);
CREATE INDEX IF NOT EXISTS idx_lesions_agent ON cnesst_lesions (agent_causal);

-- ------------------------------------------------------------
-- Effectifs sectoriels — le dénominateur
--
-- SANS cette table, aucun taux ne peut être calculé. Les données de lésions ne
-- contiennent que des cas survenus, jamais de contre-exemples : en déduire une
-- probabilité d'occurrence serait une faute méthodologique. Un taux pour 100
-- travailleurs exige un dénominateur d'emploi, à obtenir séparément
-- (Statistique Canada ou Institut de la statistique du Québec).
-- ------------------------------------------------------------

-- `region` porte la valeur « ENSEMBLE » pour un effectif provincial : une clé
-- primaire ne peut pas contenir d'expression, un NULL empêcherait donc
-- l'unicité de jouer sur les lignes sans découpage régional.
CREATE TABLE IF NOT EXISTS cnesst_effectifs (
    secteur_scian VARCHAR NOT NULL REFERENCES scian_sectors(code) ON DELETE CASCADE,
    region VARCHAR NOT NULL DEFAULT 'ENSEMBLE',
    annee SMALLINT NOT NULL,
    nb_travailleurs INTEGER NOT NULL CHECK (nb_travailleurs > 0),
    source TEXT NOT NULL,
    PRIMARY KEY (secteur_scian, region, annee)
);

-- ------------------------------------------------------------
-- Risques types proposés par secteur
--
-- Alimenté par dérivation des agents causals dominants. La GRAVITÉ est
-- défendable — elle s'appuie sur les natures et sièges de lésion réellement
-- observés. La PROBABILITÉ est délibérément absente : elle relève du jugement
-- de l'employeur sur son propre établissement, ou d'un taux calculé avec un
-- dénominateur d'effectifs.
-- ------------------------------------------------------------

-- `secteur_cnesst` porte le LIBELLÉ de grand secteur des données ouvertes — 22
-- valeurs — et non un code SCIAN. Les fichiers de lésions ne descendent pas au
-- sous-secteur à trois chiffres de l'annexe I : attribuer les lésions de tout le
-- secteur de la santé aux seuls centres d'hébergement serait une invention.
-- `secteur_scian` reste disponible pour les rares sources déjà codées, sans être
-- exigé.
CREATE TABLE IF NOT EXISTS risk_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    secteur_cnesst TEXT NOT NULL,
    secteur_scian VARCHAR REFERENCES scian_sectors(code) ON DELETE CASCADE,
    libelle TEXT NOT NULL,
    categorie VARCHAR,
    agent_causal VARCHAR,
    gravite_suggeree SMALLINT CHECK (gravite_suggeree BETWEEN 1 AND 5),
    mesures_types TEXT,
    nb_cas_observes INTEGER,
    source TEXT NOT NULL DEFAULT 'Données Québec — CNESST',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_secteur ON risk_templates (secteur_cnesst);

COMMENT ON TABLE risk_templates IS
    'Propositions de risques par secteur. Ne constitue pas un registre : l''employeur valide, retire et complète (LSST art. 59).';

-- ------------------------------------------------------------
-- Sécurité
--
-- Référentiel public entre locataires authentifiés : lecture seule. Aucune
-- écriture depuis le client — l'alimentation passe par le pipeline d'ingestion,
-- avec la clé de service.
-- ------------------------------------------------------------

ALTER TABLE scian_sectors     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cnesst_lesions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE cnesst_effectifs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_templates    ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['scian_sectors', 'cnesst_lesions', 'cnesst_effectifs', 'risk_templates']
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS reference_read ON %I', t);
        EXECUTE format(
            'CREATE POLICY reference_read ON %I FOR SELECT TO authenticated USING (TRUE)', t
        );
        EXECUTE format('REVOKE ALL ON %I FROM anon', t);
        EXECUTE format('GRANT SELECT ON %I TO authenticated', t);
    END LOOP;
END $$;
