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
- Zustand for state management (councilStore, sessionStore, authStore, uiStore)
- Tailwind CSS with CSS variables for theming
- Supabase Realtime subscriptions for live updates during runs
- Feature-based organization (`features/council-builder`, `features/reasoning`, `features/review`, `features/synthesis`)
- Path alias: `@/*` maps to `src/*` (e.g., `import { supabase } from '@/lib/supabase'`)

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

### Legacy Backend (`backend/`)
- Original FastAPI backend (being migrated to orchestrator + Supabase)
- JSON file-based storage with repository pattern

## Four-Phase Deliberation Flow

1. **Setup** (Phase 1): Configure prompt, select models, assign roles (Thinker, Critic, Devil's Advocate, Chair)
2. **Reasoning** (Phase 2): Parallel LLM execution - each model generates independent response
3. **Review** (Phase 3): Each model ranks and critiques other models' responses
4. **Synthesis** (Phase 4): Chairman synthesizes final answer with confidence level

## Build Commands

### Orchestrator (Main Backend)
```bash
cd orchestrator

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run development server (port 8002)
python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload

# Check health
curl http://localhost:8002/health
```

### Frontend
```bash
cd frontend

npm install
npm run dev          # Development server (port 5173)
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # Type check
```
Note: `vite.config.ts` proxies `/api` to port 8001 (legacy backend). The frontend uses `VITE_ORCHESTRATOR_URL` env var for orchestrator calls.

### Supabase (Local Development)
```bash
# Install CLI
brew install supabase/tap/supabase

# Start local Supabase
supabase start

# Apply migrations
supabase db reset

# Link to cloud project
supabase link --project-ref <project-id>
supabase db push
```

### Legacy Backend (deprecated)
```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8001
uv run pytest
uv run ruff check app/
uv run ruff format app/
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

## API Endpoints

### Orchestrator (port 8002)
- `GET /health` - Health check
- `POST /api/runs` - Create and start a deliberation run (requires `X-User-ID` header)
- `GET /api/runs/{run_id}` - Get run status and results
- `POST /api/runs/{run_id}/cancel` - Cancel a running deliberation

### Supabase Realtime
The frontend subscribes to `runs`, `run_models`, `model_outputs`, and `peer_reviews` tables for live updates during deliberation.

## Key Files

### Orchestrator
- `orchestrator/main.py` - FastAPI entry point, run endpoints
- `orchestrator/services/runner.py` - Deliberation pipeline (phases 2-4 execution)
- `orchestrator/services/openrouter.py` - LLM API client
- `orchestrator/services/prompts.py` - Prompt templates for each phase
- `orchestrator/db/supabase.py` - Database operations

### Frontend
- `frontend/src/App.tsx` - Main application, phase routing with AuthGuard
- `frontend/src/store/` - Zustand stores (councilStore, sessionStore, authStore, uiStore)
- `frontend/src/features/` - Phase-specific components
- `frontend/src/api/orchestrator.ts` - Orchestrator API client
- `frontend/src/hooks/useRealtimeRun.ts` - Supabase realtime subscription hook
- `frontend/src/lib/supabase.ts` - Supabase client configuration

### Database
- `supabase/migrations/001_initial_schema.sql` - Full schema with RLS policies
