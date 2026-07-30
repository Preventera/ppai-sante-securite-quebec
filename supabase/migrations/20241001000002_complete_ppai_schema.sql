-- ============================================================
-- PPAI - Complétion du schéma
--
-- La migration 20241001000001 s'interrompt sur un commentaire orphelin
-- (« -- Table des workflows ») : elle ne crée que organizations,
-- establishments et ai_agents. Les tables réellement interrogées par
-- l'application (risks, prevention_programs, agent_executions, workflows)
-- n'existaient pas, ce qui vidait le registre des risques à l'exécution.
--
-- Cette migration est idempotente : elle peut être appliquée sur une base
-- vierge comme sur une base où la première migration a été partiellement jouée.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- Tables de la première migration, en filet de sécurité
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    sector VARCHAR NOT NULL,
    scian_code VARCHAR,
    size_category VARCHAR NOT NULL DEFAULT 'PME',
    priority_group BOOLEAN DEFAULT FALSE,
    employee_count INTEGER,
    cnesst_number VARCHAR,
    address JSONB,
    contact_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS establishments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    site_type VARCHAR,
    address JSONB,
    employee_count INTEGER,
    main_activities TEXT[],
    risk_level VARCHAR NOT NULL DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    role VARCHAR NOT NULL,
    capabilities TEXT[],
    specialized_knowledge TEXT[],
    ai_model JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Registre des risques
--
-- `initial_risk` est une colonne générée : l'indice probabilité × gravité ne
-- peut pas devenir incohérent avec ses facteurs.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS risks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID REFERENCES establishments(id) ON DELETE SET NULL,
    code VARCHAR NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phase VARCHAR,
    category VARCHAR,
    probability SMALLINT NOT NULL CHECK (probability BETWEEN 1 AND 5),
    gravity SMALLINT NOT NULL CHECK (gravity BETWEEN 1 AND 5),
    initial_risk SMALLINT GENERATED ALWAYS AS (probability * gravity) STORED,
    measures TEXT,
    residual_risk SMALLINT CHECK (residual_risk BETWEEN 1 AND 25),
    status VARCHAR NOT NULL DEFAULT 'En surveillance',
    responsible VARCHAR,
    sector VARCHAR NOT NULL,
    source VARCHAR NOT NULL DEFAULT 'manuel',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risks_initial_risk ON risks (initial_risk DESC);
CREATE INDEX IF NOT EXISTS idx_risks_sector ON risks (sector);
CREATE INDEX IF NOT EXISTS idx_risks_establishment ON risks (establishment_id);

-- ------------------------------------------------------------
-- Programmes de prévention générés
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS prevention_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    document_type VARCHAR NOT NULL,
    sector VARCHAR NOT NULL,
    responsible_actor VARCHAR NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    status VARCHAR NOT NULL DEFAULT 'brouillon',
    version INTEGER NOT NULL DEFAULT 1,
    approved_by VARCHAR,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_programs_created_at ON prevention_programs (created_at DESC);

-- ------------------------------------------------------------
-- Traces d'exécution de l'orchestrateur agentique
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS agent_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name VARCHAR NOT NULL,
    workflow_id VARCHAR,
    input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_data JSONB,
    execution_status VARCHAR NOT NULL DEFAULT 'pending'
        CHECK (execution_status IN ('pending', 'running', 'completed', 'failed')),
    execution_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_executions_created_at ON agent_executions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_executions_agent ON agent_executions (agent_name);

-- ------------------------------------------------------------
-- Définitions de workflows BPMN (P1-P10)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_key VARCHAR NOT NULL UNIQUE,
    name VARCHAR NOT NULL,
    trigger VARCHAR,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    success_criteria TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Tenue à jour de updated_at
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'organizations', 'establishments', 'risks', 'prevention_programs', 'agent_executions'
    ]
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I', t, t);
        EXECUTE format(
            'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t
        );
    END LOOP;
END $$;

-- ------------------------------------------------------------
-- Row Level Security
--
-- ATTENTION — Politiques de DÉMONSTRATION.
-- Le MVP n'a pas encore d'authentification : les politiques ci-dessous
-- ouvrent la lecture ET l'écriture au rôle `anon`, c'est-à-dire à quiconque
-- possède la clé publique du projet.
--
-- À REMPLACER AVANT TOUTE MISE EN PRODUCTION par des politiques basées sur
-- `auth.uid()` et un rattachement de l'utilisateur à son organisation.
-- ------------------------------------------------------------

ALTER TABLE organizations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE establishments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks                ENABLE ROW LEVEL SECURITY;
ALTER TABLE prevention_programs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows            ENABLE ROW LEVEL SECURITY;

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
        EXECUTE format(
            'CREATE POLICY demo_full_access ON %I
             FOR ALL TO anon, authenticated
             USING (TRUE) WITH CHECK (TRUE)', t
        );
    END LOOP;
END $$;

-- ------------------------------------------------------------
-- Seed : registre des risques de référence (chantier de construction)
--
-- Aligné sur `src/data/seedRisks.ts` afin que les modes « live » et
-- « démonstration » présentent les mêmes données de départ.
-- ------------------------------------------------------------

INSERT INTO risks (code, name, phase, category, probability, gravity, measures, residual_risk, status, responsible, sector, source)
VALUES
    ('RC4-001', 'Chute d''objets depuis grue mobile 30 T', 'Démolition', 'Équipements de levage', 4, 5,
     'Balisage de la zone de manœuvre, attestation de conformité de l''appareil, opérateur certifié, élingues inspectées avant chaque quart (CSTC art. 3.9.1)',
     8, 'Contrôles actifs', 'Chef de chantier', 'Construction', 'seed'),

    ('RC4-002', 'Chute de hauteur depuis une toiture sans garde-corps', 'Réfection toiture', 'Chute (CSTC)', 4, 5,
     'Installation de garde-corps périmétriques, harnais avec ancrage certifié, plan de sauvetage en hauteur (CSTC art. 2.9.1 et 2.10.12)',
     6, 'Action requise', 'Contremaître toiture', 'Construction', 'seed'),

    ('RC4-003', 'Contact avec une ligne électrique aérienne sous tension', 'Montage structure', 'Électricité (CSTC)', 3, 5,
     'Demande de neutralisation auprès du distributeur, respect des distances d''approche, signaleur dédié aux manœuvres (CSTC art. 5.2.1)',
     5, 'Contrôles actifs', 'Maître électricien', 'Électricité', 'seed'),

    ('RC4-004', 'Ensevelissement lors de travaux en tranchée de plus de 1,2 m', 'Terrassement', 'Creusement, excavation', 3, 5,
     'Étaiement ou talutage validé par ingénieur, inspection quotidienne des parois, accès par échelle à moins de 8 m du poste (CSTC art. 3.15.3)',
     5, 'Contrôles actifs', 'Chef de chantier', 'Construction', 'seed'),

    ('RC4-005', 'Exposition aux fibres d''amiante lors du retrait de calorifuge', 'Désamiantage', 'Autres risques professionnels', 3, 5,
     'Enceinte étanche en dépression, APR à adduction d''air, échantillonnage d''air en continu, registre d''exposition (RSST art. 69.1 et s.)',
     4, 'Contrôles actifs', 'Hygiéniste du travail', 'Santé', 'seed'),

    ('RC4-006', 'Chute dans une ouverture de plancher non protégée', 'Structure', 'Chute (CSTC)', 4, 4,
     'Obturation systématique des ouvertures, couvercles fixés et identifiés, inspection en fin de quart (CSTC art. 3.8.1)',
     6, 'En surveillance', 'Contremaître structure', 'Construction', 'seed'),

    ('RC4-007', 'Incendie lors de travaux à chaud (soudage et oxycoupage)', 'Installation', 'Incendies et explosions', 3, 4,
     'Permis de travail à chaud, retrait des matières combustibles sur 11 m, surveillance incendie 60 min après les travaux (CSTC art. 4.2.1)',
     4, 'Contrôles actifs', 'Responsable prévention', 'Sécurité', 'seed'),

    ('RC4-008', 'Électrisation par outil portatif défectueux', 'Finitions', 'Électricité (CSTC)', 3, 4,
     'Disjoncteur différentiel sur tous les circuits de chantier, inspection mensuelle des cordons, retrait immédiat du matériel non conforme (CSTC art. 5.3.1)',
     4, 'Contrôles actifs', 'Maître électricien', 'Électricité', 'seed'),

    ('RC4-009', 'Troubles musculosquelettiques liés à la manutention manuelle répétée', 'Gros œuvre', 'Autres risques professionnels', 4, 3,
     'Aides mécaniques à la manutention, rotation des postes, formation aux techniques de levage, suivi ergonomique trimestriel',
     9, 'En surveillance', 'Médecin du travail', 'Santé', 'seed'),

    ('RC4-010', 'Exposition à la silice cristalline lors de la découpe de béton', 'Démolition', 'Autres risques professionnels', 4, 4,
     'Découpe à l''eau ou captage à la source, APR P100, délimitation de la zone, surveillance médicale pulmonaire (RSST annexe I)',
     6, 'Action requise', 'Hygiéniste du travail', 'Santé', 'seed'),

    ('RC4-011', 'Heurt par véhicule de chantier effectuant une marche arrière', 'Terrassement', 'Autres risques professionnels', 3, 4,
     'Plan de circulation séparant piétons et engins, signaleur formé, avertisseur de recul et caméra, vêtements haute visibilité (CSTC art. 3.10.4)',
     4, 'Contrôles actifs', 'Signaleur de chantier', 'Sécurité', 'seed'),

    ('RC4-012', 'Renversement de chariot élévateur télescopique sur terrain en pente', 'Gros œuvre', 'Équipements de levage', 2, 5,
     'Compactage et nivellement des aires de circulation, respect de l''abaque de charge, ceinture de sécurité obligatoire, cariste certifié',
     4, 'Contrôles actifs', 'Chef de chantier', 'Construction', 'seed'),

    ('RC4-013', 'Effondrement d''un échafaudage mal ancré', 'Structure', 'Chute (CSTC)', 2, 5,
     'Montage par personne compétente, plan d''ancrage signé par ingénieur, étiquetage de conformité, inspection avant chaque quart (CSTC art. 3.9.4)',
     3, 'Contrôles actifs', 'Contremaître structure', 'Construction', 'seed'),

    ('RC4-014', 'Explosion en espace clos par accumulation de gaz', 'Fondations', 'Incendies et explosions', 2, 5,
     'Permis d''entrée en espace clos, détection multigaz continue, ventilation mécanique, surveillant à l''extérieur et équipement de sauvetage (RSST art. 297 et s.)',
     3, 'Contrôles actifs', 'Responsable prévention', 'Sécurité', 'seed'),

    ('RC4-015', 'Chute de plain-pied due à l''encombrement des aires de circulation', 'Finitions', 'Autres risques professionnels', 4, 2,
     'Rangement en fin de quart, éclairage minimal de 50 lux dans les circulations, dégagement des câbles et boyaux (CSTC art. 3.2.4)',
     4, 'En contrôle', 'Contremaître finitions', 'Sécurité', 'seed')
ON CONFLICT (code) DO NOTHING;

-- ------------------------------------------------------------
-- Seed : agents et workflows de l'architecture agentique
-- ------------------------------------------------------------

INSERT INTO workflows (workflow_key, name, trigger, steps, success_criteria)
VALUES
    ('generate_prevention_program', 'Génération Programme SST Personnalisé', 'user_request_new_program',
     '[{"agent":"orchestrator","action":"analyze_request_and_delegate"},
       {"agent":"risk_analyzer","action":"comprehensive_risk_assessment"},
       {"agent":"program_generator","action":"generate_prevention_program"},
       {"agent":"program_generator","action":"validate_regulatory_compliance"}]'::jsonb,
     ARRAY['programme_conforme_lsst', 'risques_couverts', 'echeancier_defini']),

    ('analyze_workplace_risks', 'Analyse des risques en milieu de travail', 'risk_assessment_requested',
     '[{"agent":"orchestrator","action":"scope_assessment"},
       {"agent":"risk_analyzer","action":"identify_priority_risks"}]'::jsonb,
     ARRAY['matrice_5x5_produite', 'risques_prioritaires_identifies'])
ON CONFLICT (workflow_key) DO NOTHING;
