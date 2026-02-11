# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LLM Council is a multi-agent AI deliberation platform that assembles configurable councils of AI models to provide independent reasoning, peer critique, and synthesized outcomes. The core principle is that better decisions come from structured disagreement, not single answers.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    Frontend     │────▶│     Supabase     │◀────│   Orchestrator   │
│  (React + TS)   │     │  (Auth + Data)   │     │    (FastAPI)     │
│   Port 5173     │     │   (Cloud/Local)  │     │    Port 8002     │
└─────────────────┘     └──────────────────┘     └──────────────────┘
                                                          │
                                                          ▼
                                                 ┌──────────────────┐
                                                 │   OpenRouter     │
                                                 │   (LLM API)      │
                                                 └──────────────────┘
```

### Frontend (`frontend/`)
- React 18 + TypeScript + Vite
- Zustand for state management
- Tailwind CSS with CSS custom properties for theming (see Theming section)
- Framer Motion for animations
- React Three Fiber + GLSL shaders for 3D visualization (`components/ui/Orb3D/`)
- Supabase Realtime subscriptions for live updates during runs
- Feature-based organization in `src/features/`
- Path alias: `@/*` maps to `src/*`
- Strict TypeScript: `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`
- No test framework configured — no Jest, Vitest, or Playwright tests exist

### Orchestrator (`orchestrator/`)
- FastAPI service that executes council deliberations
- Three-phase LLM pipeline: reasoning → review → synthesis
- Uses Supabase service role key (bypasses RLS) for data persistence
- Calls OpenRouter for LLM completions with parallel execution
- Configuration via pydantic-settings (`config.py`): max 10 concurrent models, 120s timeout

### Supabase (Auth + Database)
- Authentication via magic links and email/password
- PostgreSQL with Row Level Security (RLS)
- Realtime subscriptions for live run updates
- Core tables: `orgs`, `org_members`, `projects`, `sessions`, `prompts`, `runs`, `run_models`, `model_outputs`, `peer_reviews`, `artifacts`
- Decision Memory tables: `session_annotations`, `session_tags`, `tags`, `council_templates`, `template_members`, `smart_history_sessions`
- Admin tables: `org_invites`, `audit_logs`, `admin_users`
- Migrations in `supabase/migrations/` — apply with `supabase db push`

## Four-Phase Deliberation Flow

1. **Setup** (Phase 1): Configure prompt, select models, assign roles (Thinker, Critic, Devil's Advocate, Chair)
2. **Reasoning** (Phase 2): Parallel LLM execution — each model generates independent response
3. **Review** (Phase 3): Each model ranks and critiques other models' responses
4. **Synthesis** (Phase 4): Chairman synthesizes final answer with confidence level

## Build Commands

### Frontend
```bash
cd frontend
npm install
npm run dev          # Development server (port 5173)
npm run build        # Production build (runs tsc -b && vite build)
npm run lint         # ESLint
npx tsc --noEmit     # Type check only
```

### Orchestrator
```bash
cd orchestrator
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

### Local Development
Run both services in separate terminals:
```bash
# Terminal 1 - Frontend
cd frontend && npm run dev

# Terminal 2 - Orchestrator
cd orchestrator && source .venv/bin/activate && python -m uvicorn main:app --port 8002 --reload
```

### Supabase
```bash
brew install supabase/tap/supabase
supabase link --project-ref <project-id>
supabase db push     # Apply migrations to cloud
supabase db reset    # Reset local database
```

### Docker
```bash
cp .env.docker.example .env   # Then edit with credentials
docker-compose up -d --build  # Frontend: port 80, Orchestrator: port 8002
```

## Environment Variables

### Frontend (`frontend/.env`)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ORCHESTRATOR_URL=http://localhost:8002
```

### Orchestrator (`orchestrator/.env`)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENROUTER_API_KEY=your-openrouter-key
OPENAI_API_KEY=your-openai-key  # Optional, required for voice transcription
FRONTEND_URL=http://localhost:5173  # CORS origin
DEBUG=true
```

## Theming System

Dark theme is default. All colors use CSS custom properties defined in `frontend/src/styles/variables.css` and mapped to Tailwind classes in `tailwind.config.js`.

**Use Tailwind classes, not raw CSS variables:**
- Backgrounds: `bg-bg-base`, `bg-bg-primary`, `bg-bg-secondary`, `bg-bg-tertiary`, `bg-bg-elevated`
- Glass effects: `bg-glass-bg`, `border-glass-border`
- Text: `text-text-primary`, `text-text-secondary`, `text-text-muted`
- Borders: `border-border`, `border-border-focus`
- Accents: `text-accent`, `bg-accent`, `text-accent-success`, `text-accent-warning`, `text-accent-error`
- Roles: `text-role-thinker`, `text-role-critic`, `text-role-devils-advocate`, `text-role-synthesizer`
- Shadows: `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-glow-teal`, `shadow-glow-cyan`

**Fonts:** General Sans (body), Satoshi (display/`font-display`), JetBrains Mono (`font-mono`)

**Animations:** `animate-fade-in`, `animate-slide-in`, `animate-glow-pulse`, `animate-gradient-shift`, `animate-float`, `animate-float-delayed`, `animate-float-slow`, `animate-particle`

## Core Domain Types (`frontend/src/types/index.ts`)

- **RoleType**: `'thinker' | 'critic' | 'devils_advocate' | 'synthesizer'`
- **PhaseType**: `'setup' | 'reasoning' | 'review' | 'synthesis'`
- **PhaseStatus**: `'pending' | 'running' | 'completed' | 'failed' | 'skipped'`
- **SessionStatus**: `'draft' | 'running' | 'completed' | 'failed'`
- **CouncilPreset**: `'fast' | 'balanced' | 'deep_analysis' | 'executive'`
- **ModelTier**: `'fast' | 'balanced' | 'deep' | 'executive' | 'code' | 'critic'`

Key interfaces: `Session`, `CouncilMember`, `PromptConfig`, `ModelOutput`, `PeerReview`, `SynthesisOutput`, `PromptAttachment`

## System Presets & Council Balance

### System Presets (`frontend/src/data/systemPresets.ts`)
Five immutable, pre-balanced council configurations identified by `system:` prefix IDs:
- **Fast Brainstorm** (`system:fast`) — Quick ideation with efficient models
- **Decision Brief** (`system:balanced`) — Executive recommendations
- **Deep Analysis** (`system:deep_analysis`) — Maximum rigor with premium models
- **Red Team** (`system:red_team`) — Critique-first approach
- **Code Review** (`system:code_review`) — Technical analysis with coding-focused models

### Council Balance Enforcement (`frontend/src/utils/councilValidation.ts`)
Councils require at least one adversarial role (`critic` or `devils_advocate`) for balanced deliberation:
- `getBalanceStatus()` — Validates adversarial role, member count (≥2), chair count (≤1)
- `applyOneClickFix()` — Converts cheapest non-chair model to critic role
- Auto-balance setting in user preferences automatically promotes a model to critic when missing

## State Management

Zustand stores in `src/store/`:
- **councilStore** — Selected models and role assignments
- **sessionStore** — Current session, prompt, run state, deliberation results
- **authStore** — User authentication, Supabase session
- **uiStore** — Theme, sidebar, mobile responsiveness
- **settingsStore** — User preferences
- **helpStore** — Help/tour system
- **decisionMemoryStore** — Command palette (⌘K/Ctrl+K), session search, templates, annotations

**Important:** Use selector pattern to avoid unnecessary re-renders:
```typescript
const currentPhase = useSessionStore((state) => state.currentPhase);
```

## Key Frontend Patterns

- **Lazy-loaded phase components** via `React.lazy()` in `App.tsx` for code splitting
- **AuthGuard** wrapper for protected routes
- **Realtime subscriptions** via `useRealtimeRun` hook — subscribes to `runs`, `run_models`, `model_outputs`, `peer_reviews` tables filtered by `run_id`
- **Replay mode** via `useReplayMode` hook — loads historical session data into phase components
- **Voice input** via `useVoiceRecording` hook — MediaRecorder API with WebM/Opus, transcribed by OpenAI Whisper
- **Command Palette** (⌘K/Ctrl+K) — Quick search across sessions by prompt content, tags, metadata
- **PDF extraction** for prompt attachments via `pdfjs-dist` + Tesseract.js OCR

## Key Files

### Frontend
- `src/App.tsx` — Main app with phase routing, lazy loading, AuthGuard
- `src/store/` — Zustand stores
- `src/features/` — Feature modules by domain
- `src/api/orchestrator.ts` — Orchestrator API client
- `src/hooks/useRealtimeRun.ts` — Supabase Realtime subscription
- `src/styles/variables.css` — CSS custom property definitions
- `src/data/systemPresets.ts` — System council preset definitions
- `src/utils/councilValidation.ts` — Council balance validation

### Orchestrator
- `main.py` — FastAPI entry point with all API routes
- `config.py` — pydantic-settings configuration
- `services/runner.py` — Deliberation pipeline (phases 2–4), includes MODEL_COSTS
- `services/openrouter.py` — LLM API client with parallel execution
- `services/prompts.py` — Prompt templates for reasoning, review, synthesis
- `services/prompt_enhancer.py` — AI-powered prompt enhancement
- `services/whisper.py` — OpenAI Whisper transcription
- `services/admin.py` — User management, audit logs
- `services/analytics.py` — Usage and cost analytics
- `services/invites.py` — Organization invite management
- `db/supabase.py` — Database operations

## API Endpoints (Orchestrator, port 8002)

**Core:** `POST /api/runs`, `GET /api/runs/{run_id}`, `POST /api/runs/{run_id}/cancel`, `POST /api/prompts/enhance`, `POST /api/transcribe`

**Team:** `POST /api/invites`, `GET /api/orgs/{org_id}/invites`, `GET /api/orgs/{org_id}/members`, `POST /api/invites/{id}/cancel`, `POST /api/invites/{id}/resend`

**Admin:** `GET /api/admin/users`, `GET /api/admin/is-platform-admin`, `GET /api/orgs/{org_id}/members/detailed`, `PATCH /api/orgs/{org_id}/members/{id}/role`, `DELETE /api/orgs/{org_id}/members/{id}`, `GET /api/orgs/{org_id}/audit-logs`

**Analytics:** `GET /api/analytics/summary`, `GET /api/analytics/usage`, `GET /api/analytics/costs`, `GET /api/analytics/models`

All endpoints require `X-User-ID` header for auth context.

## Test Account

For Playwright MCP testing and development:
```
Email: claudecodetest@gmail.com
Password: TestPassword123!
```

## Deployment

- **Frontend (Vercel):** Set Root Directory to `frontend` in Vercel project settings (monorepo)
- **Orchestrator:** Deploy separately (Railway, Fly.io, etc.)
- **Docker:** Multi-stage build — Node builder + Nginx for frontend, Python 3.11 slim for orchestrator

## Notes

- The `/api` proxy in `vite.config.ts` points to port 8001 (legacy backend). The frontend uses `VITE_ORCHESTRATOR_URL` for orchestrator calls directly.
- `backend/` contains the legacy FastAPI backend (deprecated) — use `orchestrator/` for new development
- `video/` contains Remotion-based marketing video generation (separate from main app)
- Run deliberations trigger background tasks in FastAPI; results appear via Supabase Realtime subscriptions
- `vite-plugin-glsl` is used for GLSL shader imports in the 3D Orb visualization
