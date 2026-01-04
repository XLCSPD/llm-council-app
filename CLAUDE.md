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
- Tailwind CSS with CSS variables for theming
- Supabase Realtime subscriptions for live updates during runs
- Feature-based organization in `features/` (council-builder, help, pdf-export, peer-review, prompt-editor, reasoning, review, session, settings, synthesis)
- Path alias: `@/*` maps to `src/*`
- Strict TypeScript config: `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`

### Orchestrator (`orchestrator/`)
- FastAPI service that executes council deliberations
- Manages the three-phase LLM pipeline (reasoning → review → synthesis)
- Uses Supabase service role key (bypasses RLS) for data persistence
- Calls OpenRouter for LLM completions (parallel execution for efficiency)

### Supabase (Auth + Database)
- Authentication via magic links
- PostgreSQL with Row Level Security (RLS)
- Realtime subscriptions for live run updates
- Tables: `orgs`, `org_members`, `projects`, `sessions`, `prompts`, `runs`, `run_models`, `model_outputs`, `peer_reviews`, `artifacts`

## Four-Phase Deliberation Flow

1. **Setup** (Phase 1): Configure prompt, select models, assign roles (Thinker, Critic, Devil's Advocate, Chair)
2. **Reasoning** (Phase 2): Parallel LLM execution - each model generates independent response
3. **Review** (Phase 3): Each model ranks and critiques other models' responses
4. **Synthesis** (Phase 4): Chairman synthesizes final answer with confidence level

## Build Commands

### Frontend
```bash
cd frontend
npm install
npm run dev          # Development server (port 5173)
npm run build        # Production build (runs tsc -b && vite build)
npm run preview      # Preview production build locally
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

### Docker Deployment
```bash
# Copy and configure environment
cp .env.docker.example .env
# Edit .env with Supabase + OpenRouter credentials

# Build and run
docker-compose up -d --build

# Frontend: http://localhost (port 80)
# Orchestrator: http://localhost:8002
```

### Supabase
```bash
brew install supabase/tap/supabase
supabase link --project-ref <project-id>
supabase db push     # Apply migrations to cloud
supabase db reset    # Reset local database
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
DEBUG=true
```

## Core Domain Types (`frontend/src/types/index.ts`)

- **RoleType**: `'thinker' | 'critic' | 'devils_advocate' | 'synthesizer'` - Council member roles
- **PhaseType**: `'setup' | 'reasoning' | 'review' | 'synthesis'` - Deliberation phases
- **PhaseStatus**: `'pending' | 'running' | 'completed' | 'failed' | 'skipped'`
- **SessionStatus**: `'draft' | 'running' | 'completed' | 'failed'`
- **CouncilPreset**: `'fast' | 'balanced' | 'deep_analysis' | 'executive'`

Key interfaces: `Session`, `CouncilMember`, `PromptConfig`, `ModelOutput`, `PeerReview`, `SynthesisOutput`

## State Management (Zustand Stores)

- **councilStore** - Selected models and role assignments for current council
- **sessionStore** - Current session, prompt, run state, and deliberation results
- **authStore** - User authentication state, login/logout, Supabase session
- **uiStore** - Theme, sidebar state, mobile responsiveness
- **settingsStore** - User preferences
- **helpStore** - Help/tour system state

Stores are imported from `@/store/` and use Zustand's `create()` pattern.

## Realtime Subscription Pattern

The `useRealtimeRun` hook (`frontend/src/hooks/useRealtimeRun.ts`) subscribes to Supabase Realtime channels for live updates:
- Subscribes to `runs`, `run_models`, `model_outputs`, `peer_reviews` tables
- Uses `postgres_changes` event type with filters by `run_id`
- Provides callbacks: `onPhaseChange`, `onStatusChange`, `onModelOutput`, `onPeerReview`

## Key Files

### Orchestrator
- `main.py` - FastAPI entry point, run endpoints (`POST /api/runs`, `GET /api/runs/{run_id}`)
- `services/runner.py` - Deliberation pipeline (phases 2-4 execution)
- `services/openrouter.py` - LLM API client with parallel execution
- `services/prompts.py` - Prompt templates for reasoning, review, synthesis phases
- `services/prompt_enhancer.py` - AI-powered prompt enhancement service
- `db/supabase.py` - Database operations

### Frontend
- `src/App.tsx` - Main application, phase routing with AuthGuard
- `src/store/` - Zustand stores
- `src/features/` - Phase-specific components
- `src/api/orchestrator.ts` - Orchestrator API client
- `src/hooks/useRealtimeRun.ts` - Supabase realtime subscription hook
- `src/lib/supabase.ts` - Supabase client configuration

### Database
- `supabase/migrations/001_initial_schema.sql` - Full schema with RLS policies
- `supabase/migrations/20241228_setup_user_workspace.sql` - User workspace setup (auto-creates org/project on first login)

## API Endpoints

### Orchestrator (port 8002)
- `GET /health` - Health check
- `POST /api/runs` - Create and start a deliberation run (requires `X-User-ID` header)
- `GET /api/runs/{run_id}` - Get run status and results
- `POST /api/runs/{run_id}/cancel` - Cancel a running deliberation
- `POST /api/prompts/enhance` - AI-powered prompt enhancement (improves prompt clarity, suggests objectives/constraints)

## Development Workflow

Run both services in separate terminals for local development:
```bash
# Terminal 1 - Frontend
cd frontend && npm run dev

# Terminal 2 - Orchestrator
cd orchestrator && source .venv/bin/activate && python -m uvicorn main:app --port 8002 --reload
```

## Test Account

For Playwright MCP testing and development:
```
Email: claudecodetest@gmail.com
Password: TestPassword123!
```

## Notes

- The `/api` proxy in `vite.config.ts` points to port 8001 (legacy backend). The frontend uses `VITE_ORCHESTRATOR_URL` for orchestrator calls directly.
- `backend/` contains the legacy FastAPI backend (deprecated) - new development should use `orchestrator/`
- Run deliberations trigger background tasks in FastAPI; results appear via Supabase Realtime subscriptions
