# Phase 0 — LinguaForge

## Complete Specification for Claude Code

> **LinguaForge** — A multi-language AI learning platform.
> Phase 0 launches with English as the first target language.
> The architecture is language-agnostic: adding German, French, Spanish, or any other target language requires only new content seeds and L1↔L2 interference data — no structural changes.

---

## 1. PROJECT OVERVIEW

### What We're Building

A personal, AI-powered **multi-language** learning web application with full voice interaction. Phase 0 targets English, but the architecture is designed so that adding any new target language (German, French, Spanish, etc.) requires only new content data — no code changes. The user (Alessandro, Italian native speaker, estimated B1/B2 English) speaks into the browser microphone, receives real-time transcription, gets intelligent feedback from Claude, and hears responses spoken back via text-to-speech.

This is not just a flashcard app — it's a **Proactive Language Coach** that tracks what you know, what you avoid, what you misuse, and forces you to improve across all dimensions.

### Multi-Language Design Principle

Every part of the system (DB schema, services, UI, content) references a `target_language` parameter rather than hardcoding "English":

- **Database**: All items, grammar rules, L1 errors, and placement questions carry a `target_language` field
- **Services**: The scheduler, coach, and Claude prompts are parameterized by language
- **UI**: Language selector in settings; all labels/prompts are driven by the active target language
- **Content**: Stored per-language in seed files (`data/en/`, `data/de/`, etc.)

To add German for your girlfriend in the future: create `data/de/` seeds (vocabulary, grammar, L1 interference IT→DE), and the entire app works without touching a single component.

### Why a Web App (Not Terminal)

- Browser microphone access is native (`navigator.mediaDevices.getUserMedia`) — no OS-specific audio drivers
- Cross-device sync: study on PC, review on phone, speak on laptop — all synced via Supabase
- Deepgram WebSocket streaming works natively in browsers (their primary use case)
- TTS playback is trivial via Web Audio API
- This Phase 0 becomes the direct prototype for the future Capacitor mobile app — no throwaway code

### Core Philosophy

- **Active Recall + Spaced Repetition (SM-2)** — proven learning science, not passive review
- **Five Disciplines**: Reading, Writing, Listening, Speaking, Grammar — interleaved for maximum retention
- **All exercises are Level 5 (Active Production)** — challenging, varied angles, multiple methods of thinking
- **Italian L1 Interference Detection** — catch errors that Italian speakers specifically make
- **Proactive Coaching** — don't just correct errors, detect missed opportunities and force usage of dormant items
- **Frequency-first** — learn the most useful 5000 words first (Paul Nation's approach = 90% of the language)
- **Every exercise supports both Write and Speak input** — user can toggle between typing and microphone on any exercise
- **Every Claude response shows text + optional audio** — text is always visible, clicking a 🔊 icon triggers TTS playback

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Monorepo | **Nx** | Structured workspace, code generation, dependency graph, build caching, future libs for shared logic |
| Frontend | **Angular 21** | Modern, TypeScript-native, future Capacitor compatibility |
| UI Components | **Angular Material** | Official Material Design components, accessible, well-maintained, consistent design system |
| Database + Auth | Supabase (free tier, 500MB) | PostgreSQL, auth, real-time subscriptions, Edge Functions |
| Backend Proxy | Supabase Edge Functions (Deno) | Securely call Deepgram + Claude APIs, no separate server |
| Speech-to-Text | Deepgram Nova-3 Monolingual (Streaming) | $0.0077/min, WebSocket, ~300ms latency |
| Text-to-Speech | Deepgram Aura-2 | $0.030/1k chars, natural voices, multiple accents |
| AI Engine | Claude API (Sonnet) | Grammar evaluation, conversation, exercise generation |
| State Management | Angular Signals | Built-in reactivity, lightweight, no extra dependencies |

### Cost Estimate (Personal Use)

Study plan: every other day, 20-30 min sessions.

| Component | Monthly Estimate |
|-----------|-----------------|
| Deepgram STT | ~$1.00–1.75 |
| Deepgram TTS | ~$2.00–3.50 |
| Claude API | ~$1.00–2.00 |
| Supabase | Free tier |
| **Total** | **~$4–7/month** |

---

## 2. ARCHITECTURE

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (Angular 21)                       │
│                                                               │
│  ┌──────────┐    ┌───────────┐    ┌──────────────────────┐   │
│  │ Mic Input │───▶│ Audio     │───▶│ Deepgram WebSocket   │   │
│  │ (WebRTC)  │    │ Processor │    │ (Direct Connection)  │   │
│  └──────────┘    └───────────┘    └──────────┬───────────┘   │
│                                               │               │
│                                    Transcript ▼               │
│  ┌──────────┐    ┌───────────┐    ┌──────────────────────┐   │
│  │ Speaker   │◀──│ Audio     │◀──│ TTS Audio Response    │   │
│  │ (WebAudio)│    │ Player    │    │                      │   │
│  └──────────┘    └───────────┘    └──────────────────────┘   │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │              Angular App (UI + State)                   │   │
│  │  - Dashboard, Study Session, Flashcards, Progress      │   │
│  │  - SM-2 Scheduler, Session Timer, Error Tracker        │   │
│  │  - Proactive Coach, Usage Debt, Gamification           │   │
│  └─────────────────────────┬─────────────────────────────┘   │
│                             │                                 │
└─────────────────────────────┼─────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE EDGE FUNCTIONS (Deno)                   │
│                                                               │
│  /api/deepgram-key     → Generate temp STT key for client    │
│  /api/claude-evaluate  → Send transcript + context to Claude │
│  /api/tts              → Text → Deepgram TTS → audio bytes  │
│  /api/exercise-generate → Claude generates exercises         │
│                                                               │
└─────────────────────────────┬─────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                      │
│                                                               │
│  users, items, user_progress, sessions, errors,              │
│  materials, usage_log, missed_opportunities, l1_errors       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Deepgram Integration Pattern

1. **Client requests a temporary API key** from Supabase Edge Function
2. **Edge Function** calls Deepgram to generate a short-lived key (10-minute TTL)
3. **Client connects directly** to Deepgram's WebSocket using the temp key
4. **Audio streams browser → Deepgram** (no proxying through backend)
5. **Transcripts stream back** in real-time

**Multi-language STT**: The WebSocket connection URL includes a `language` parameter derived from the user's `active_target_language`:
- English: `language=en` (Nova-3 Monolingual)
- German: `language=de` (Nova-3 Monolingual)
- French: `language=fr`, etc.
Deepgram supports 40+ languages — adding a new target language requires zero backend changes.

For TTS: client sends text to Edge Function → calls Deepgram TTS API → returns audio → client plays via Web Audio API.

Available TTS voices for accent training (English — Phase 0):
- aura-asteria-en: Female, US accent
- aura-luna-en: Female, UK accent
- aura-orion-en: Male, US accent
- aura-arcas-en: Male, US accent (deeper)
- User should be able to switch voices to train ear for different accents

When adding German TTS, swap to `aura-*-de` voices (Deepgram supports German, French, Spanish, etc.).

### Folder Structure (Nx Monorepo)

```
lingua-forge/                              # Nx workspace root
├── apps/
│   └── lingua-forge/                      # Angular 21 application
│       ├── src/
│       │   ├── app/
│       │   │   ├── core/
│       │   │   │   ├── services/
│       │   │   │   │   ├── supabase.service.ts
│       │   │   │   │   ├── deepgram.service.ts
│       │   │   │   │   ├── claude.service.ts
│       │   │   │   │   ├── scheduler.service.ts      # SM-2 spaced repetition
│       │   │   │   │   ├── session.service.ts
│       │   │   │   │   ├── audio.service.ts           # Mic capture + TTS playback
│       │   │   │   │   ├── l1-detector.service.ts     # Multi-nationality interference
│       │   │   │   │   ├── proactive-coach.service.ts # Missed opportunities, usage debt
│       │   │   │   │   ├── gamification.service.ts    # XP, streaks, achievements
│       │   │   │   │   └── language.service.ts        # Active target language management
│       │   │   │   └── guards/
│       │   │   │       └── auth.guard.ts
│       │   │   ├── features/
│       │   │   │   ├── dashboard/                     # Home + stats + usage debt
│       │   │   │   ├── placement-test/                # Adaptive initial assessment
│       │   │   │   ├── study-session/                 # Active learning session
│       │   │   │   │   ├── speaking/
│       │   │   │   │   ├── listening/
│       │   │   │   │   ├── reading/
│       │   │   │   │   ├── writing/
│       │   │   │   │   ├── grammar/
│       │   │   │   │   ├── pronunciation/
│       │   │   │   │   └── media-based/               # Video/podcast exercises
│       │   │   │   ├── flashcards/
│       │   │   │   ├── quick-add/
│       │   │   │   ├── progress/
│       │   │   │   └── settings/                      # Language selector, preferences
│       │   │   ├── shared/
│       │   │   │   ├── components/
│       │   │   │   │   ├── input-mode-toggle/         # Write ✍️ / Speak 🎤 toggle
│       │   │   │   │   ├── tts-button/                # 🔊 Play audio on any text
│       │   │   │   │   ├── mic-button/
│       │   │   │   │   ├── audio-player/
│       │   │   │   │   ├── feedback-card/
│       │   │   │   │   └── timer/
│       │   │   │   └── models/
│       │   │   │       ├── item.model.ts
│       │   │   │       ├── session.model.ts
│       │   │   │       ├── user.model.ts
│       │   │   │       └── language.model.ts          # TargetLanguage enum, config
│       │   │   └── app.routes.ts
│       │   ├── environments/
│       │   └── styles/                                # Angular Material custom theme
│       └── project.json
├── libs/                                              # Nx libraries (future)
│   └── shared/
│       └── models/                                    # Shared types across apps/libs
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── functions/
│       ├── deepgram-key/index.ts
│       ├── claude-evaluate/index.ts
│       ├── tts/index.ts
│       └── exercise-generate/index.ts
├── data/                                              # Content seeds per language
│   ├── en/                                            # English content
│   │   ├── oxford_5000.json
│   │   ├── top_200_phrasal_verbs.json
│   │   ├── top_500_collocations.json
│   │   ├── common_expressions_500.json
│   │   ├── grammar_rules_a1_c2.json
│   │   ├── tech_english.json
│   │   ├── finance_english.json
│   │   ├── business_english.json
│   │   ├── placement_questions.json
│   │   └── l1_interference/
│   │       ├── italian.json
│   │       ├── spanish.json
│   │       └── ... (other nationalities)
│   └── de/                                            # German content (future)
│       ├── top_5000_vocabulary.json
│       ├── grammar_rules.json
│       ├── placement_questions.json
│       └── l1_interference/
│           └── italian.json                           # IT→DE specific errors
├── nx.json
├── package.json
├── tsconfig.base.json
├── MASTER_PLAN.md                                     # Progress tracker
└── README.md
```

### Why Nx?

- **Code generation**: `nx g @nx/angular:component` scaffolds consistently
- **Build caching**: Rebuilds only what changed — fast iterations
- **Dependency graph**: `nx graph` visualizes module dependencies
- **Library extraction**: When shared logic grows (SM-2 algorithm, models), extract to `libs/` and reuse across future apps (e.g., a Capacitor mobile app in `apps/lingua-forge-mobile/`)
- **Enforced boundaries**: `eslint` rules prevent circular imports between features

---

## 3. DATABASE SCHEMA (Supabase PostgreSQL)

```sql
-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    nationality_code TEXT DEFAULT 'IT',
    native_language TEXT DEFAULT 'Italian',
    active_target_language TEXT DEFAULT 'en',   -- Currently studying: 'en', 'de', 'fr', etc.
    current_level TEXT DEFAULT 'B1',            -- Per active target language
    target_level TEXT DEFAULT 'C1',
    study_goal TEXT DEFAULT 'general',
    specializations TEXT[] DEFAULT '{}',
    daily_goal_minutes INTEGER DEFAULT 20,
    -- Per-language levels stored as JSONB for multi-language support
    -- e.g. {"en": {"level": "B1", "goal": "C1"}, "de": {"level": "A1", "goal": "B2"}}
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
-- LEARNING ITEMS (vocabulary, grammar, phrasal verbs, expressions)
-- ============================================================
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    target_language TEXT NOT NULL DEFAULT 'en', -- 'en', 'de', 'fr', etc.
    type TEXT NOT NULL,                        -- 'vocabulary', 'grammar', 'phrasal_verb', 'expression', 'collocation'
    content TEXT NOT NULL,
    definition TEXT,
    translations JSONB DEFAULT '{}',           -- {"it": "casa", "es": "casa", "de": "Haus"}
    ipa_pronunciation TEXT,
    part_of_speech TEXT,
    cefr_level TEXT NOT NULL,
    frequency_rank INTEGER,
    frequency_tier TEXT,                       -- 'core_1000', 'expansion_3000', 'consolidation_5000', 'specialization'
    category TEXT,
    specialization TEXT,                       -- NULL, 'tech', 'finance', 'business', 'academic', 'medical', 'legal'
    examples TEXT[],
    collocations TEXT[],
    contexts TEXT,                             -- JSON: ["formal", "casual", "business", "travel"]
    register TEXT DEFAULT 'neutral',
    related_items INTEGER[],
    prereq_grammar TEXT,
    l1_interference_patterns JSONB DEFAULT '{}', -- {"it": "pattern for Italians", "es": "pattern for Spanish speakers"}
    difficulty_intrinsic INTEGER DEFAULT 3,
    source TEXT,                               -- 'oxford_5000', 'custom', 'textbook_b2', etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_items_lang ON items(target_language);
CREATE INDEX idx_items_lang_level ON items(target_language, cefr_level);
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_frequency ON items(frequency_rank);
CREATE INDEX idx_items_tier ON items(frequency_tier);
CREATE INDEX idx_items_specialization ON items(specialization);

-- ============================================================
-- USER PROGRESS (SM-2 Spaced Repetition per item)
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
    -- USAGE TRACKING (Proactive Coach)
    times_used_correctly INTEGER DEFAULT 0,
    times_used_spontaneously INTEGER DEFAULT 0,    -- Without prompting
    last_used DATE,
    usage_contexts TEXT,                            -- JSON: ["email", "conversation", "writing"]
    UNIQUE(user_id, item_id)
);

CREATE INDEX idx_progress_review ON user_progress(user_id, next_review);
CREATE INDEX idx_progress_mastery ON user_progress(user_id, mastery);
CREATE INDEX idx_progress_usage ON user_progress(user_id, last_used);

-- ============================================================
-- USAGE LOG (every time an item is used in context)
-- ============================================================
CREATE TABLE usage_log (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id),
    session_id INTEGER,
    used_at TIMESTAMPTZ DEFAULT NOW(),
    context TEXT,                               -- 'business_email', 'casual_chat', 'roleplay'
    was_prompted BOOLEAN DEFAULT FALSE,         -- TRUE if system forced it, FALSE if spontaneous
    quality INTEGER,                            -- 1-5 how natural/correct
    discipline TEXT                             -- 'speaking', 'writing'
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
    user_said TEXT,                             -- What the user wrote/said
    could_have_used TEXT,                       -- How they could have said it better
    context TEXT,
    acknowledged BOOLEAN DEFAULT FALSE          -- User has seen the feedback
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
    error_count INTEGER DEFAULT 1,             -- How many times this exact error
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_errors_user ON user_errors(user_id);
CREATE INDEX idx_errors_category ON user_errors(user_id, error_category);
CREATE INDEX idx_errors_l1 ON user_errors(user_id, l1_interference);
CREATE INDEX idx_errors_pattern ON user_errors(user_id, interference_pattern);

-- ============================================================
-- L1 INTERFERENCE PATTERNS (multi-nationality)
-- ============================================================
CREATE TABLE l1_errors (
    id SERIAL PRIMARY KEY,
    target_language TEXT NOT NULL DEFAULT 'en', -- The language being learned
    nationality_code TEXT NOT NULL,             -- The learner's L1: 'IT', 'ES', 'FR'
    error_category TEXT NOT NULL,
    common_mistake TEXT NOT NULL,
    correct_form TEXT NOT NULL,
    explanation TEXT,
    explanation_native TEXT,                    -- In the user's native language
    cefr_level TEXT,
    frequency_rank INTEGER                     -- 1-10 how common
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
-- MATERIALS (user-uploaded + media library)
-- ============================================================
CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),         -- NULL for system materials
    target_language TEXT NOT NULL DEFAULT 'en',
    title TEXT NOT NULL,
    material_type TEXT,                         -- 'textbook', 'video', 'podcast', 'tv_show', 'ted_talk', 'article', 'custom_list'
    cefr_level TEXT,
    content TEXT,
    source_url TEXT,                            -- YouTube link, podcast URL, etc.
    transcript TEXT,                            -- For audio/video materials
    target_structures TEXT[],                   -- Grammar/vocab this material is good for
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
```

---

## 4. CONTENT STRUCTURE PER CEFR LEVEL

### Overview

| Level | Vocabulary | Study Hours | Goal |
|-------|-----------|-------------|------|
| A1 | ~500 | 80-100h | Basic survival |
| A2 | ~1,000 | 180-200h | Daily situations |
| B1 | ~2,000 | 350-400h | Independence |
| B2 | ~4,000 | 500-600h | Fluency |
| C1 | ~8,000 | 700-800h | Mastery |
| C2 | ~16,000 | 1000-1200h | Near-native |

### 4A. Vocabulary per Level

```yaml
A1 (500 words):
  - numbers, colors, days, months
  - family, food, body parts
  - basic adjectives (big, small, good, bad)
  - common verbs (be, have, go, do, like, want)

A2 (1,000 cumulative):
  - travel, shopping, health
  - weather, transport, hobbies
  - emotions, relationships
  - jobs, places in town

B1 (2,000 cumulative):
  - abstract concepts
  - work environment
  - news and media
  - technology basics

B2 (4,000 cumulative):
  - idiomatic expressions
  - formal vs informal register
  - advanced collocations
  - topic-specific vocabulary

C1 (8,000 cumulative):
  - domain-specific (see specializations)
  - nuanced synonyms
  - academic vocabulary
  - sophisticated hedging language
```

### 4B. Grammar per Level

```yaml
A1:
  - Present simple
  - Articles (a/an/the basics)
  - Plurals (regular)
  - Basic prepositions (in, on, at)
  - Question words (what, where, when)
  - Can for ability

A2:
  - Past simple (regular + irregular)
  - Future (going to, will)
  - Comparatives/Superlatives
  - Present continuous
  - Some/any, much/many
  - Adverbs of frequency

B1:
  - Present perfect (experience, duration)
  - Past continuous
  - First conditional
  - Second conditional
  - Passive voice (basic)
  - Relative clauses (who, which, that)
  - Modal verbs (should, must, might)

B2:
  - Third conditional
  - Mixed conditionals
  - Passive (all tenses)
  - Reported speech
  - Wish/If only
  - Inversion
  - Cleft sentences

C1:
  - Advanced inversion
  - Subjunctive
  - Complex noun phrases
  - Advanced passive constructions
  - Emphasis structures
```

### 4C. Phrasal Verbs per Level

```yaml
A1 (10): get up, wake up, sit down, stand up, turn on/off, put on, take off
A2 (30): look for, look after, look forward to, give up, pick up, set up
B1 (80): come up with, put up with, run out of, break down, carry on, figure out
B2 (150+): Mastery of all common multi-word verbs
```

### 4D. Expressions per Level

```yaml
A1: Greetings, introductions, basic requests, numbers/prices
A2: Giving directions, making appointments, agreeing/disagreeing politely
B1: Expressing opinions, making suggestions, complaining politely, negotiating
B2: Hedging language, formal writing phrases, debate and argumentation
```

---

## 5. CORE CONTENT TO SEED (The Knowledge Base)

```
CORE (First priority — 90% of the language):
├── Oxford 5000 (5000 most used words)
├── Top 200 Phrasal Verbs
├── Top 500 Collocations
├── Essential Grammar Structures (A1-B2)
└── Common Expressions & Idioms (500)

SECTORAL (Second priority — user's professional world):
├── Tech English
│   ├── Programming terminology
│   ├── Code review language
│   ├── Technical documentation
│   ├── Stand-up / Sprint vocabulary
│   └── ~500 domain terms
├── Finance English
│   ├── Investment terms
│   ├── Crypto vocabulary
│   ├── Trading expressions
│   ├── Financial reports language
│   └── ~300 domain terms
└── Business English
    ├── Meetings & negotiations
    ├── Email formulas
    ├── Presentations
    ├── Small talk professionale
    └── ~400 domain terms

MEDIA LIBRARY (Listening & Cultural):
├── YouTube videos (tech talks, finance news)
├── Podcast episodes (with transcripts)
├── TV Shows (Simpsons, The Office, Silicon Valley)
└── TED Talks (with timestamps for structures)
```

### Content Sources

| Source | What to Extract | License |
|--------|----------------|---------|
| English Profile | CEFR-official word lists | Open |
| Oxford 3000/5000 | Core vocabulary | Reference |
| Cambridge English | Grammar, common errors | Reference |
| Wikipedia Simple English | Simplified texts | CC |
| News in Levels | Reading per level | Check |
| User's own materials | Phrasal verbs, expressions, textbooks A1-C2 | Own |

---

## 6. C1 SPECIALIZATION PATHS

### Onboarding for B2+ Users

When user reaches B2, show specialization selection:

```
Which field(s) are you working in?
[ ] 💻 Tech/IT
[ ] 💼 Business
[ ] 🎓 Academic
[ ] ⚕️ Medical
[ ] ⚖️ Legal
[ ] 🌍 General
(Multiple selection allowed)
```

### Tech/IT Content

```yaml
vocabulary: deploy, containerized, microservices, CI/CD pipeline, technical debt, refactoring, PR review
reading: Tech blog posts, documentation, Stack Overflow discussions, release notes
speaking_scenarios: Code review, stand-up meetings, technical interviews, explaining bugs to non-tech people
```

### Business Content

```yaml
vocabulary: ROI, KPIs, stakeholders, leverage synergies, action items, deliverables
reading: Business news (FT, Bloomberg), case studies, annual reports
speaking_scenarios: Presentations, negotiations, performance reviews, networking events
```

### Academic Content

```yaml
vocabulary: "It could be argued that...", "The findings suggest...", "Further research is needed..."
reading: Academic papers, thesis excerpts, peer reviews
speaking_scenarios: Conference presentations, thesis defense, seminars, office hours
```

---

## 7. PLACEMENT TEST (Adaptive)

### Structure

The test starts at B1 (assumed level) and adapts up/down based on answers.

```
Question 1 (B1) ──┬── Correct ──▶ Question 2 (B2)
                   └── Incorrect ──▶ Question 2 (A2)

~15-20 questions → accurate result
```

### Areas & Weights

| Area | Weight | Question Types |
|------|--------|---------------|
| Grammar | 30% | Fill the gap, error correction |
| Vocabulary | 25% | Definitions, synonyms, context |
| Reading | 20% | Short text comprehension |
| Listening | 15% | Audio comprehension (TTS-generated) |
| Use of English | 10% | Collocations, phrasal verbs |

### Example Questions per Level

```
A1: "She ___ a student." (is/are/am)
A2: "I ___ to the cinema yesterday." (go/went/going)
B1: "If I ___ rich, I would travel the world." (am/was/were)
B2: "Not only ___ the exam, but she also got the highest score." (she passed/did she pass/passed she)
C1: "The committee ___ yet to reach a decision." (has/have/is/are)
```

### Scoring & Level Assignment

```
0-20: A1 | 21-40: A2 | 41-60: B1 | 61-75: B2 | 76-90: C1 | 91-100: C2

CRITICAL: The system identifies SPECIFIC weaknesses, not just a level.
e.g., "B1 overall, but A2 in articles/prepositions and B2 in vocabulary"
This drives the personalized study plan.
```

### Question Pool: ~200 questions

Pre-loaded in `data/placement_questions.json`, covering all CEFR levels and all test areas.

---

## 8. EXERCISE TYPES (All Level 5 — Active Production)

### CRITICAL UX RULE: Every exercise supports BOTH input modes

Every exercise displays:
- A **✍️/🎤 toggle** — user can switch between typing and speaking at any time
- For speaking: tap mic → speak → Deepgram transcribes → submit
- For writing: type in text area → submit

Every Claude/system response displays:
- **Text always visible** (the written response/feedback)
- A **🔊 button** next to each response — tapping it calls TTS API and plays audio
- User controls when to listen; audio never auto-plays unexpectedly

### 8A. Writing Exercises

| Exercise | Description |
|----------|------------|
| Context Response | Situation described → write your response |
| Email Drafting | Write professional emails (formal/informal) |
| Story Continuation | Continue a story using target vocabulary X |
| Paraphrasing | Rewrite sentences using phrasal verbs |
| Error Correction | Find and correct errors in given text |

### 8B. Speaking Exercises

| Exercise | Description |
|----------|------------|
| Roleplay Scenarios | Simulate work calls, meetings, negotiations |
| Picture Description | Describe an image using target structures |
| Opinion Expression | Express and defend an opinion on a topic |
| Shadowing | Listen to native speaker → repeat immediately |
| Impromptu Speech | Speak for 1 minute on a random topic |

### 8C. Listening Exercises

| Exercise | Description |
|----------|------------|
| Dictation | Listen → write exactly what you hear |
| Gap Fill Audio | Listen and complete missing words |
| Video Comprehension | Watch clip → answer comprehension questions |
| Podcast Summary | Listen 5 min → summarize what you heard |
| Accent Training | Distinguish UK vs US vs AU pronunciation |

### 8D. Pronunciation Exercises

| Exercise | Description |
|----------|------------|
| Minimal Pairs | ship/sheep, bit/beat — distinguish and produce |
| Tongue Twisters | Practice difficult sound combinations |
| Stress Patterns | Record + compare with model pronunciation |
| Connected Speech | Practice linking, elision, weak forms |
| Intonation Practice | Questions vs statements, emphasis patterns |

### 8E. Grammar Drills (Only Targeting Weaknesses)

| Exercise | Description |
|----------|------------|
| Tense Transformation | Change the tense of given sentences |
| Preposition Drill | Focus on user's error patterns |
| Sentence Building | Reorder + expand sentence fragments |
| Italian Interference Fix | Exercises targeting specific L1 patterns |

### 8F. Media-Based Exercises

| Exercise | Description |
|----------|------------|
| Simpsons Clip Analysis | Watch clip, note expressions and idioms |
| TED Talk Vocabulary | Extract target vocabulary, use in context |
| Movie Scene Roleplay | Act out/continue a scene using learned items |
| News Report Summary | Listen, summarize, give opinion |

---

## 9. PROACTIVE COACHING SYSTEM

### The Concept: "Proactive Language Coach"

This system goes far beyond traditional spaced repetition:

| Feature | Traditional SR | This System |
|---------|---------------|-------------|
| Errors | ✅ Track and re-test | ✅ Track and re-test |
| Missed usage | ❌ Not tracked | ✅ "You could have used X here" |
| Passive decay | ⚠️ Only when timer expires | ✅ Forces usage if dormant N days |
| Negative patterns | ❌ Not analyzed | ✅ "You always make this IT→EN error" |
| Avoided contexts | ❌ Not detected | ✅ "You never use X in formal context" |

### 9A. Proactive Intervention Triggers

| Condition | Action |
|-----------|--------|
| Item not used for 7+ days | Create exercise that REQUIRES that item |
| Same error 3+ times | Forced drill on that specific pattern |
| Context never practiced | "Today let's do a simulated work call" |
| Phrasal verb studied but never used spontaneously | Insert as MANDATORY in next exercise |
| Recurring Italian pattern | Mini-lesson + 5 targeted exercises |
| User always avoids formal register | "Write an email to the CEO" |

### 9B. Usage Debt Dashboard

```
🔴 USAGE DEBT — Items studied but NEVER used spontaneously
• come across (studied 12 days ago, 0 spontaneous uses)
• get away with (studied 8 days ago, 0 spontaneous uses)
• bring up (studied 15 days ago, used 1 time forced)

🟡 UNDERUSED — Used but rarely
• look forward to (2 uses in 30 days, too few)
• turn out (1 use in 20 days)

🔴 RECURRING ERRORS — Patterns not improving
• "discuss about" instead of "discuss" (5 occurrences)
• "depend from" instead of "depend on" (3 occurrences)
• Missing present perfect usage (12 occurrences)

🟡 AVOIDED CONTEXTS
• Phone calls (never practiced)
• Negotiations (last time: 18 days ago)
• Technical presentations (never practiced)
```

### 9C. Missed Opportunity Detection

During every interaction, Claude analyzes what the user said and checks:
- Could they have used a studied phrasal verb instead of a simpler word?
- Could they have used a more natural expression?
- Did they avoid a structure they should know by now?

Example feedback:
```
❌ Error: "discussed about" → "discussed"
   Italian interference from "discutere di". 3rd time this week.

💡 Missed opportunity: You said "I met my colleague" — you could have said
   "I came across my colleague" → "come across" hasn't been used in 5 days!

📝 Try again: Rewrite using "come across" and without "about" after "discuss"
```

---

## 10. SPACED REPETITION ENGINE (SM-2)

### Algorithm

```typescript
function sm2(quality: number, currentEF: number, currentInterval: number, currentReps: number): SM2Result {
    // quality: 0-5 (0-2 = incorrect, 3 = hard, 4 = good, 5 = easy)
    let newEF = currentEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEF = Math.max(1.3, newEF);

    let newInterval: number;
    let newReps: number;

    if (quality < 3) {
        newReps = 0;
        newInterval = 1;
    } else {
        newReps = currentReps + 1;
        if (newReps === 1) newInterval = 1;
        else if (newReps === 2) newInterval = 6;
        else newInterval = Math.round(currentInterval * newEF);
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);
    return { easeFactor: newEF, interval: newInterval, repetitions: newReps, nextReview };
}
```

### Session Item Selection Priority

```
1. OVERDUE REVIEWS (40% of session)
   - Items where next_review <= today
   - Ordered by: most overdue first, then lowest mastery

2. WEAKNESS DRILLING (30% of session)
   - Items with mastery < 50%
   - Items related to recent errors
   - Items tagged with user's L1 interference patterns
   - Items in "usage debt" (studied but never used spontaneously)

3. NEW ITEMS (20% of session)
   - From the next frequency tier not yet mastered
   - Respecting prerequisites
   - Maximum 5 new items per session

4. INTEGRATION EXERCISES (10% of session)
   - Combine multiple items in context
   - Force usage of dormant items
   - Speaking/listening that tests items in natural usage
```

---

## 11. ITALIAN L1 INTERFERENCE PATTERNS (Pre-loaded)

### Italian-Specific Patterns

(See data/italian_l1_interference.json for full list — 50+ patterns)

Key patterns include:
- **Prepositions**: discuss about, depend from, go at home, married with
- **Tense**: Present Perfect vs Past Simple ("Yesterday I have been...")
- **Articles**: Overuse with abstract concepts ("The life is beautiful")
- **Syntax**: Missing subject ("Is raining"), double negatives
- **False friends**: actually/currently, eventually/possibly, sensible/sensitive, sympathetic/nice
- **Uncountables**: informations, advices, furnitures
- **Word choice**: make/do confusion, say/tell confusion
- **Adjective order**: "A red big car" → "A big red car"
- **Stative verbs**: "I am knowing" → "I know"

### Multi-Nationality Support (data/multi_nationality_l1_errors.json)

| Nationality | Common Errors | Example |
|-------------|--------------|---------|
| 🇮🇹 Italian | Articles, prepositions, false friends | "I go at home" → "I go home" |
| 🇪🇸 Spanish | Articles, pronunciation, word order | "I have 25 years" → "I am 25" |
| 🇫🇷 French | False friends, pronunciation, prepositions | "I am agree" → "I agree" |
| 🇩🇪 German | Word order, present perfect | "I live here since 2020" → "I've lived..." |
| 🇵🇹 Portuguese | Articles, prepositions, gerund | "I am studying for 2 years" |
| 🇵🇱 Polish | Articles (none in PL), prepositions | "I go to work by foot" |
| 🇯🇵 Japanese | Articles, plurals, L/R | "I have many informations" |
| 🇨🇳 Chinese | Tenses, articles, plurals | "Yesterday I go shopping" |
| 🇧🇷 Brazilian | False friends, prepositions | "I stayed in line" → "I stood in line" |
| 🇷🇺 Russian | Articles, verbal aspect | "I am student" → "I am a student" |
| 🇸🇦 Arabic | Articles, sounds, structure | "The life is beautiful" → "Life is beautiful" |

---

## 12. CLAUDE API INTEGRATION

### Edge Function: `/api/claude-evaluate`

```typescript
// Dynamic system prompt built per session:
`You are an English tutor for a ${user.nationality} native speaker at ${user.level} level.

CRITICAL RULES:
1. Always respond in English.
2. Provide corrections with brief ${user.native_language} explanations for WHY.
3. Track these L1 interference patterns specifically: [loaded from l1_errors table].
4. Rate each response: grammar (1-5), vocabulary (1-5), naturalness (1-5).
5. DETECT MISSED OPPORTUNITIES: If the user could have used a studied item but didn't, flag it.
6. Keep conversation flowing — correct inline, don't lecture.
7. If user scores consistently 4-5/5, push harder material.

PROACTIVE COACHING:
- Items in usage debt: [list from DB]. TRY to create situations where user MUST use these.
- Recent errors: [list from DB]. Watch for these patterns.
- Avoided contexts: [list from DB]. Occasionally push toward these.

RESPONSE FORMAT (JSON):
{
    "conversational_reply": "...",
    "corrections": [...],
    "missed_opportunities": [...],
    "scores": { "grammar": N, "vocabulary": N, "naturalness": N },
    "follow_up_question": "...",
    "items_to_reinforce": [...],
    "items_used_correctly": [...]
}`
```

### Edge Function: `/api/exercise-generate`

Claude generates exercises calibrated to weaknesses. For listening exercises, the generated text is then sent to Deepgram TTS with various voices and accents, creating personalized audio content that targets exactly what the user needs to practice.

---

## 13. STUDY SESSION FLOW

### Lifecycle

```
1. USER OPENS APP → Dashboard shows: items due, streak, usage debt, suggested session

2. START SESSION → "How much time?" (10 / 20 / 30 / 60 min or "just one question")
   → Auto-record start timestamp

3. INTERLEAVED PRACTICE (example 20-min session):
   - 2 min: Grammar drill (targeting weaknesses only)
   - 3 min: Vocabulary flashcards (SM-2 review)
   - 5 min: Speaking exercise (voice conversation with Claude)
   - 3 min: Listening exercise (TTS audio + comprehension)
   - 2 min: Writing exercise (using target items)
   - 5 min: Free conversation (integration, forcing dormant items)

4. REAL-TIME FEEDBACK → Every response gets immediate correction + missed opportunity detection

5. SESSION END → Auto-record end timestamp
   → AI generates session summary
   → Show: items practiced, accuracy, XP earned, errors to focus on
   → Preview: what's coming next session
```

### Dynamic Adaptation

- Keeps making tense errors → increase grammar drills mid-session
- Nails vocabulary → reduce flashcards, add more speaking time
- "Just one quick question" → single focused interaction
- Timer visible but soft — "one more?" prompt at end

---

## 14. GAMIFICATION

### XP System

| Action | XP |
|--------|-----|
| Complete a session | 50 |
| Correct answer | 10 |
| Spontaneous use of studied item | 25 |
| Perfect score on exercise | 20 |
| Daily streak maintained | 15/day |

### Achievements (Examples)

- 🔥 7-Day Streak, 30-Day Streak, 100-Day Streak
- 📚 First 100 Words Mastered, 500 Words, 1000 Words
- 🎯 Zero Errors in a Session
- 💪 Used 5 Phrasal Verbs Spontaneously in One Session
- 🌍 Practiced in All 5 Disciplines in One Day
- 🧠 Fixed a Recurring Error Pattern

---

## 15. UI/UX GUIDELINES

### Responsive Design

- Mobile-first (primary: phone for speaking exercises, flashcard review)
- Desktop-enhanced (full dashboard, analytics, material management)
- Dark mode support
- Minimum touch target: 48x48px

### Key UI Pattern: Input Mode Toggle

Every exercise screen includes:

```
┌─────────────────────────────────────┐
│  Exercise prompt here...            │
│                                     │
│  Your answer:                       │
│  ┌──────────────────────────────┐   │
│  │                              │   │
│  │  [text area / transcript]    │   │
│  │                              │   │
│  └──────────────────────────────┘   │
│                                     │
│    [✍️ Type]  [🎤 Speak]    [Send] │
│                                     │
└─────────────────────────────────────┘
```

### Key UI Pattern: Response with Audio

Every Claude response includes:

```
┌─────────────────────────────────┐
│ 🤖 Great! You went to the      │
│ cinema — nice! What movie       │
│ did you see?             🔊     │  ← Tap to hear TTS
│                                 │
│ ✏️ Correction:                  │
│ "I have been" → "I went"       │
│ 💡 Past Simple for finished     │
│ actions with 'yesterday'        │
│                                 │
│ Score: Grammar 3/5 | Vocab 4/5 │
└─────────────────────────────────┘
```

### Key Screens

1. **Dashboard**: Progress, streak, XP, items due, usage debt panel, quick-start
2. **Study Session**: Clean, distraction-free. Input toggle + mic. Chat-like flow.
3. **Flashcards**: Swipe cards. Front/back. Rate: Again/Hard/Good/Easy. 🔊 on each card.
4. **Quick Add**: FAB → type or speak a word → auto-categorize → add to review queue
5. **Progress**: Charts (mastery by discipline, error trends, problematic categories, history)
6. **Usage Debt**: Visual dashboard of dormant items, recurring errors, avoided contexts
7. **Placement Test**: Guided assessment with progress indicator

---

## 16. MASTER PLAN TRACKER

Create `MASTER_PLAN.md` in project root to track implementation progress:

```markdown
# LinguaForge - Master Plan

## Current Phase: 0 - Web App
## Started: 2026-02-06
## Streak: 0 days

## Content Loaded
- [ ] Oxford 5000 (0/5000)
- [ ] Top Phrasal Verbs (0/200)
- [ ] Top 500 Collocations (0/500)
- [ ] Common Expressions (0/500)
- [ ] Grammar Rules A1-C2 (0/100)
- [ ] Tech English (0/500)
- [ ] Finance English (0/300)
- [ ] Business English (0/400)
- [ ] Italian L1 Patterns (0/50+)
- [ ] Multi-nationality L1 (0/110)
- [ ] Placement Test Questions (0/200)
- [ ] User's textbook content A1-C2 (0/?)

## Features Implemented
- [ ] Angular scaffold + routing
- [ ] Supabase setup + auth
- [ ] Database migration
- [ ] Deepgram STT integration
- [ ] Deepgram TTS integration
- [ ] Claude API integration
- [ ] Input mode toggle (write/speak)
- [ ] TTS button on responses
- [ ] SM-2 spaced repetition
- [ ] Flashcard review
- [ ] Placement test (adaptive)
- [ ] Error tracking
- [ ] Missed opportunity detection
- [ ] Usage debt dashboard
- [ ] Proactive coaching triggers
- [ ] Exercise types (all 8A-8F)
- [ ] Gamification (XP, streak, achievements)
- [ ] Session lifecycle
- [ ] Quick-add vocabulary
- [ ] Progress analytics
- [ ] Media library integration
- [ ] Responsive design
- [ ] Dark mode
```

---

## 17. IMPLEMENTATION PHASES

### Phase 0.1: Skeleton (Week 1)
- [ ] Angular 21 project scaffold with routing
- [ ] Supabase project + database migration (all tables from Section 3)
- [ ] Auth integration (email/password + Google OAuth)
- [ ] Basic dashboard page
- [ ] Environment config

### Phase 0.2: Voice Pipeline (Week 2)
- [ ] Edge Function: `/api/deepgram-key` (temp key generation)
- [ ] `deepgram.service.ts`: mic → WebSocket → real-time transcript
- [ ] Edge Function: `/api/tts`
- [ ] `audio.service.ts`: TTS playback
- [ ] **Input mode toggle component** (✍️ Write / 🎤 Speak)
- [ ] **TTS button component** (🔊 on any text)
- [ ] Basic speaking screen

### Phase 0.3: AI Brain (Week 3)
- [ ] Edge Function: `/api/claude-evaluate` with dynamic system prompt
- [ ] L1 interference detection (Italian + multi-nationality)
- [ ] Error tracking → `user_errors` table
- [ ] **Missed opportunity detection** → `missed_opportunities` table
- [ ] **Usage logging** → `usage_log` table
- [ ] Conversational flow with inline corrections

### Phase 0.4: Content & Spaced Repetition (Week 4)
- [ ] SM-2 algorithm in `scheduler.service.ts`
- [ ] **Seed Oxford 5000 vocabulary**
- [ ] **Seed Top 200 phrasal verbs**
- [ ] **Seed Top 500 collocations**
- [ ] **Seed 500 common expressions**
- [ ] Seed grammar rules (A1-C2)
- [ ] Flashcard review screen (with 🔊 on each card)
- [ ] Item selection algorithm (overdue → weakness → new → integration)
- [ ] Quick-add feature

### Phase 0.5: Full Sessions & Exercises (Week 5-6)
- [ ] Session lifecycle (start, timer, end, summary)
- [ ] Interleaved discipline switching
- [ ] Placement test (adaptive, all areas)
- [ ] **All exercise types** (8A through 8F)
- [ ] Exercise generation via Claude
- [ ] **Proactive coaching triggers** (Section 9A)
- [ ] **Usage debt dashboard** (Section 9B)
- [ ] Gamification (XP, streak, achievements)

### Phase 0.6: Polish (Week 7-8)
- [ ] Progress dashboard with charts
- [ ] Session history
- [ ] **Seed sectoral content** (tech, finance, business)
- [ ] Media library (video/podcast references)
- [ ] Responsive design optimization
- [ ] Dark mode
- [ ] Offline flashcard review (service worker)
- [ ] Push notifications for review reminders

---

## 18. COACHING PERSONALITY

```
TONE: Friendly, encouraging, patient but direct. Like a supportive colleague.
LANGUAGE: Always respond in the target language. Use the user's native language ONLY for brief error explanations.
CORRECTIONS: Inline and natural. Correct, explain briefly, move on.
PRAISE: Acknowledge specifically when user gets something right that they previously struggled with.
CHALLENGE: If consistently scoring 4-5/5, push harder material.
HUMOR: Light, occasional. Never at user's expense.
MISSED OPPORTUNITIES: Always flag when user could have used a studied item.
FRUSTRATION: If user seems frustrated, simplify and encourage. Suggest a break if needed.
```

---

## 19. DEFERRED TO FUTURE PHASES

### Near-Future: German Support (data/de/)
- [ ] German vocabulary seeds (Top 5000)
- [ ] German grammar rules (A1-C2)
- [ ] IT→DE L1 interference patterns
- [ ] German placement test questions
- [ ] German TTS voice mapping (Deepgram aura-*-de)
- [ ] Language selector in settings UI

### Later Phases
- [ ] Capacitor mobile app (`apps/lingua-forge-mobile/` in Nx workspace)
- [ ] Additional target languages (French, Spanish, etc.)
- [ ] Additional nationality support beyond initial 11
- [ ] Video recommendations based on weaknesses
- [ ] Community features / leaderboards
- [ ] Multi-user support
- [ ] Payment system / subscription model
- [ ] BYOK (Bring Your Own Key) option
- [ ] Advanced analytics with AI study reports
- [ ] Voice cloning for personalized TTS

---

## END OF SPECIFICATION

This document should be provided to Claude Code as the primary reference for building the LinguaForge web application. All sections are designed to be implementable with the described tech stack. Start with Phase 0.1 and proceed sequentially.
