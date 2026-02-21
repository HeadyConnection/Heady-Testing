
-- Heady IMMEDIATE Production Database Setup
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Socratic Sessions Table
CREATE TABLE IF NOT EXISTS socratic_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    hypothesis TEXT,
    questions_asked JSONB DEFAULT '[]',
    insights_gained JSONB DEFAULT '{}',
    context VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Stories Table
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scope VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    timeline JSONB DEFAULT '{}',
    summary TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    impact_score INTEGER DEFAULT 0,
    refs JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Story Events Table
CREATE TABLE IF NOT EXISTS story_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    refs JSONB DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT NOW()
);

-- HeadySoul Escalations Table
CREATE TABLE IF NOT EXISTS headysoul_escalations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    description TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'PENDING',
    response TEXT,
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Pattern Engine Table
CREATE TABLE IF NOT EXISTS patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    source VARCHAR(100),
    description TEXT,
    impact_score INTEGER DEFAULT 0,
    risk_score INTEGER DEFAULT 0,
    integration_status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    value DECIMAL(10,2),
    unit VARCHAR(50),
    context JSONB DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_socratic_sessions_user_id ON socratic_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_scope ON stories(scope);
CREATE INDEX IF NOT EXISTS idx_story_events_story_id ON story_events(story_id);
CREATE INDEX IF NOT EXISTS idx_headysoul_escalations_status ON headysoul_escalations(status);
CREATE INDEX IF NOT EXISTS idx_patterns_integration_status ON patterns(integration_status);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);

