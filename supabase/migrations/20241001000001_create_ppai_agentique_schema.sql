-- ============================================================
-- PPAI - Schéma SQL Architecture Agentique Complète
-- Support pour 60+ processus métier SST + Orchestration BPMN
-- ============================================================

-- Extensions requises
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================================
-- TABLES PRINCIPALES - ORGANISATIONS ET ÉTABLISSEMENTS
-- ============================================================

-- Table des organisations/entreprises
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    sector VARCHAR NOT NULL, -- construction, manufacturier, municipal, etc.
    scian_code VARCHAR, -- Code SCIAN du secteur
    size_category VARCHAR NOT NULL, -- PME, grande_entreprise
    priority_group BOOLEAN DEFAULT FALSE, -- groupes prioritaires CNESST
    employee_count INTEGER,
    cnesst_number VARCHAR,
    address JSONB,
    contact_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des établissements
CREATE TABLE establishments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    site_type VARCHAR, -- chantier, usine, bureau, etc.
    address JSONB,
    employee_count INTEGER,
    main_activities TEXT[],
    risk_level VARCHAR DEFAULT 'medium', -- low, medium, high, critical
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AGENTS ET ORCHESTRATION
-- ============================================================

-- Table des agents disponibles
CREATE TABLE ai_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL, -- PPAI-Orchestrator, PPAI-RiskAnalyzer, etc.
    type VARCHAR NOT NULL, -- master_agent, specialist_agent, field_agent, connector_agent
    role VARCHAR NOT NULL,
    capabilities TEXT[],
    specialized_knowledge TEXT[],
    ai_model JSONB, -- {provider, model, temperature, max_tokens}
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des workflows