-- ============================================================
-- LinguaForge Database Schema
-- Version: 001
-- Date: 2026-02-06
-- ============================================================

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    nationality_code TEXT DEFAULT 'IT',
    native_language TEXT DEFAULT 'Italian',
    active_target_language TEXT DEFAULT 'en',
    current_level TEXT DEFAULT 'B1',
    target_level TEXT DEFAULT 'C1',
    study_goal TEXT DEFAULT 'general',
    specializations TEXT[] DEFAULT '{}',
    daily_goal_minutes INTEGER DEFAULT 20,
    language_profiles JSONB DEFAULT '{}',
    -- Gamification
    xp_total INTEGER DEFAULT 0,
    streak_current INTEGER DEFAULT 0,
    streak_longest INTEGER DEFAULT 0,
    last_study_date DATE,
    achievements TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LEARNING ITEMS
-- ============================================================
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    target_language TEXT NOT NULL DEFAULT 'en',
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    definition TEXT,
    translations JSONB DEFAULT '{}',
    ipa_pronunciation TEXT,
    part_of_speech TEXT,
    cefr_level TEXT NOT NULL,
    frequency_rank INTEGER,
    frequency_tier TEXT,
    category TEXT,
    specialization TEXT,
    examples TEXT[],
    collocations TEXT[],
    contexts TEXT,
    register TEXT DEFAULT 'neutral',
    related_items INTEGER[],
    prereq_grammar TEXT,
    l1_interference_patterns JSONB DEFAULT '{}',
    difficulty_intrinsic INTEGER DEFAULT 3,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_items_lang ON items(target_language);
CREATE INDEX idx_items_lang_level ON items(target_language, cefr_level);
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_frequency ON items(frequency_rank);
CREATE INDEX idx_items_tier ON items(frequency_tier);
CREATE INDEX idx_items_specialization ON items(specialization);

-- ============================================================
-- USER PROGRESS (SM-2 Spaced Repetition)
-- ============================================================
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    -- SM-2 Algorithm Fields
    ease_factor REAL DEFAULT 2.5,
    interval_days INTEGER DEFAULT 0,
    repetitions INTEGER DEFAULT 0,
    next_review DATE DEFAULT CURRENT_DATE,
    -- Performance
    times_correct INTEGER DEFAULT 0,
    times_incorrect INTEGER DEFAULT 0,
    last_reviewed TIMESTAMPTZ,
    mastery REAL DEFAULT 0,
    -- Discipline-specific mastery
    mastery_reading REAL DEFAULT 0,
    mastery_writing REAL DEFAULT 0,
    mastery_listening REAL DEFAULT 0,
    mastery_speaking REAL DEFAULT 0,
    mastery_grammar REAL DEFAULT 0,
    -- Usage Tracking
    times_used_correctly INTEGER DEFAULT 0,
    times_used_spontaneously INTEGER DEFAULT 0,
    last_used DATE,
    usage_contexts TEXT,
    UNIQUE(user_id, item_id)
);

CREATE INDEX idx_progress_review ON user_progress(user_id, next_review);
CREATE INDEX idx_progress_mastery ON user_progress(user_id, mastery);
CREATE INDEX idx_progress_usage ON user_progress(user_id, last_used);

-- ============================================================
-- USAGE LOG
-- ============================================================
CREATE TABLE usage_log (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id),
    session_id INTEGER,
    used_at TIMESTAMPTZ DEFAULT NOW(),
    context TEXT,
    was_prompted BOOLEAN DEFAULT FALSE,
    quality INTEGER,
    discipline TEXT
);

-- ============================================================
-- MISSED OPPORTUNITIES
-- ============================================================
CREATE TABLE missed_opportunities (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id),
    session_id INTEGER,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    user_said TEXT,
    could_have_used TEXT,
    context TEXT,
    acknowledged BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- STUDY SESSIONS
-- ============================================================
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_language TEXT NOT NULL DEFAULT 'en',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_minutes REAL,
    session_type TEXT,
    disciplines_practiced TEXT[],
    items_reviewed INTEGER DEFAULT 0,
    items_correct INTEGER DEFAULT 0,
    items_incorrect INTEGER DEFAULT 0,
    new_items_introduced INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    notes TEXT,
    mood TEXT
);

-- ============================================================
-- ERROR TRACKING
-- ============================================================
CREATE TABLE user_errors (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES sessions(id),
    error_type TEXT NOT NULL,
    error_category TEXT,
    user_input TEXT NOT NULL,
    correct_form TEXT NOT NULL,
    explanation TEXT,
    l1_interference BOOLEAN DEFAULT FALSE,
    interference_pattern TEXT,
    item_id INTEGER REFERENCES items(id),
    discipline TEXT,
    error_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_errors_user ON user_errors(user_id);
CREATE INDEX idx_errors_category ON user_errors(user_id, error_category);
CREATE INDEX idx_errors_l1 ON user_errors(user_id, l1_interference);
CREATE INDEX idx_errors_pattern ON user_errors(user_id, interference_pattern);

-- ============================================================
-- L1 INTERFERENCE PATTERNS
-- ============================================================
CREATE TABLE l1_errors (
    id SERIAL PRIMARY KEY,
    target_language TEXT NOT NULL DEFAULT 'en',
    nationality_code TEXT NOT NULL,
    error_category TEXT NOT NULL,
    common_mistake TEXT NOT NULL,
    correct_form TEXT NOT NULL,
    explanation TEXT,
    explanation_native TEXT,
    cefr_level TEXT,
    frequency_rank INTEGER
);

-- ============================================================
-- PLACEMENT TESTS
-- ============================================================
CREATE TABLE placement_tests (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_language TEXT NOT NULL DEFAULT 'en',
    test_date TIMESTAMPTZ DEFAULT NOW(),
    grammar_score REAL,
    vocabulary_score REAL,
    reading_score REAL,
    listening_score REAL,
    speaking_score REAL,
    use_of_english_score REAL,
    overall_score REAL,
    assigned_level TEXT,
    detailed_results JSONB,
    weaknesses_identified TEXT[],
    strengths_identified TEXT[]
);

-- ============================================================
-- MATERIALS
-- ============================================================
CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    target_language TEXT NOT NULL DEFAULT 'en',
    title TEXT NOT NULL,
    material_type TEXT,
    cefr_level TEXT,
    content TEXT,
    source_url TEXT,
    transcript TEXT,
    target_structures TEXT[],
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE missed_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users own progress" ON user_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own usage" ON usage_log FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own missed" ON missed_opportunities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own sessions" ON sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own errors" ON user_errors FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own tests" ON placement_tests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own materials" ON materials FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- Items and l1_errors are read-only for all authenticated users
CREATE POLICY "Read items" ON items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read l1" ON l1_errors FOR SELECT USING (auth.role() = 'authenticated');
