# LinguaForge - Master Plan

## Current Phase: 0 - Web App
## Started: 2026-02-06
## Streak: 0 days

---

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

---

## Features Implemented

### Phase 0.1: Skeleton
- [x] Angular scaffold + routing
- [x] Folder structure
- [ ] Supabase setup + auth
- [ ] Database migration
- [ ] Environment config
- [ ] Basic dashboard page

### Phase 0.2: Voice Pipeline
- [ ] Edge Function: `/api/deepgram-key`
- [ ] `deepgram.service.ts`: mic → WebSocket → transcript
- [ ] Edge Function: `/api/tts`
- [ ] `audio.service.ts`: TTS playback
- [ ] Input mode toggle component (✍️/🎤)
- [ ] TTS button component (🔊)
- [ ] Basic speaking screen

### Phase 0.3: AI Brain
- [ ] Edge Function: `/api/claude-evaluate`
- [ ] L1 interference detection
- [ ] Error tracking → `user_errors` table
- [ ] Missed opportunity detection
- [ ] Usage logging

### Phase 0.4: Content & Spaced Repetition
- [ ] SM-2 algorithm in `scheduler.service.ts`
- [ ] Seed Oxford 5000 vocabulary
- [ ] Seed Top 200 phrasal verbs
- [ ] Seed Top 500 collocations
- [ ] Seed 500 common expressions
- [ ] Seed grammar rules (A1-C2)
- [ ] Flashcard review screen
- [ ] Item selection algorithm
- [ ] Quick-add feature

### Phase 0.5: Full Sessions & Exercises
- [ ] Session lifecycle (start, timer, end, summary)
- [ ] Interleaved discipline switching
- [ ] Placement test (adaptive)
- [ ] All exercise types (8A-8F)
- [ ] Exercise generation via Claude
- [ ] Proactive coaching triggers
- [ ] Usage debt dashboard
- [ ] Gamification (XP, streak, achievements)

### Phase 0.6: Polish
- [ ] Progress dashboard with charts
- [ ] Session history
- [ ] Seed sectoral content (tech, finance, business)
- [ ] Media library
- [ ] Responsive design optimization
- [ ] Dark mode
- [ ] Offline flashcard review (service worker)

---

## API Keys Required
- [ ] Supabase URL
- [ ] Supabase Anon Key
- [ ] Supabase Service Role Key
- [ ] Deepgram API Key
- [ ] Anthropic/Claude API Key

---

## Notes
- Target: MVP in 2-3 weeks
- User: Alessandro (Italian, B1/B2 English)
- Primary use: Personal learning tool
- Future: Potential paid product
