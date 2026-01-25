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
- Feature-based organization in `features/` (admin, analytics, council-builder, decision-memory, help, pdf-export, peer-review, prompt-editor, reasoning, review, session, settings, synthesis, team-management)
- 3D visualization with React Three Fiber (`components/ui/Orb3D/`)
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
- Core tables: `orgs`, `org_members`, `projects`, `sessions`, `prompts`, `runs`, `run_models`, `model_outputs`, `peer_reviews`, `artifacts`
- Decision Memory tables: `session_annotations`, `session_tags`, `tags`, `council_templates`, `template_members`, `smart_history_sessions`
- Admin tables: `org_invites`, `audit_logs`, `admin_users`

### Video (`video/`)
- Remotion-based marketing video generation
- Next.js for rendering pipeline
- Separate from main app - used for generating promotional content

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
OPENAI_API_KEY=your-openai-key  # Required for voice transcription
DEBUG=true
```

## Core Domain Types (`frontend/src/types/index.ts`)

- **RoleType**: `'thinker' | 'critic' | 'devils_advocate' | 'synthesizer'` - Council member roles
- **PhaseType**: `'setup' | 'reasoning' | 'review' | 'synthesis'` - Deliberation phases
- **PhaseStatus**: `'pending' | 'running' | 'completed' | 'failed' | 'skipped'`
- **SessionStatus**: `'draft' | 'running' | 'completed' | 'failed'`
- **CouncilPreset**: `'fast' | 'balanced' | 'deep_analysis' | 'executive'`
- **ModelTier**: `'fast' | 'balanced' | 'deep' | 'executive' | 'code' | 'critic'` - Model categorization

Key interfaces: `Session`, `CouncilMember`, `PromptConfig`, `ModelOutput`, `PeerReview`, `SynthesisOutput`, `PromptAttachment`

Note: `PromptConfig` supports text and PDF attachments via the `attachments` field.

## State Management (Zustand Stores)

- **councilStore** - Selected models and role assignments for current council
- **sessionStore** - Current session, prompt, run state, and deliberation results
- **authStore** - User authentication state, login/logout, Supabase session
- **uiStore** - Theme, sidebar state, mobile responsiveness
- **settingsStore** - User preferences
- **helpStore** - Help/tour system state
- **decisionMemoryStore** - Command palette (⌘K/Ctrl+K), session search, council templates, annotations

Stores are imported from `@/store/` and use Zustand's `create()` pattern.

## Keyboard Shortcuts

- **⌘K / Ctrl+K** - Open Command Palette for quick session search and navigation

## Voice Input

Live microphone recording with OpenAI Whisper transcription for all prompt text fields:
- **Main content**: Append mode (dictate in chunks)
- **Objective/Audience**: Replace mode (single statements)
- **Context**: Append with newlines
- **Constraints**: Each recording adds a new constraint

Requires `OPENAI_API_KEY` environment variable in orchestrator. Uses browser MediaRecorder API with WebM/Opus format.

## Decision Memory System

The `decision-memory` feature provides session organization and retrieval:
- **Command Palette** (⌘K/Ctrl+K) - Quick search across sessions by prompt content, tags, and metadata
- **Smart History** - Grouped session list with pinning, archiving, and quick filters
- **Council Templates** - Save and reuse council configurations across sessions
- **Session Annotations** - Star ratings, notes, and tags for organizing deliberations
- **Re-run Actions** - Exact re-run, reuse council only, or reuse prompt only

## Admin & Analytics

The admin panel (`/admin` route) provides organization management features:
- **User Management** - View all platform users, manage org members
- **Role Management** - Assign roles (member, admin) to org members
- **Invite System** - Send email invites, track pending invites, resend/cancel
- **Audit Logs** - Track member changes, invites, and admin actions

The analytics dashboard (`/analytics` route) shows:
- **Usage Metrics** - Total sessions, runs, token usage over time
- **Cost Tracking** - Cost per model, daily/weekly/monthly breakdown
- **Model Performance** - Response times, success rates by model

Access requires admin role in the organization.

## Realtime Subscription Pattern

The `useRealtimeRun` hook (`frontend/src/hooks/useRealtimeRun.ts`) subscribes to Supabase Realtime channels for live updates:
- Subscribes to `runs`, `run_models`, `model_outputs`, `peer_reviews` tables
- Uses `postgres_changes` event type with filters by `run_id`
- Provides callbacks: `onPhaseChange`, `onStatusChange`, `onModelOutput`, `onPeerReview`

## Key Files

### Orchestrator
- `main.py` - FastAPI entry point with all API routes
- `services/runner.py` - Deliberation pipeline (phases 2-4 execution)
- `services/openrouter.py` - LLM API client with parallel execution
- `services/prompts.py` - Prompt templates for reasoning, review, synthesis phases
- `services/prompt_enhancer.py` - AI-powered prompt enhancement service
- `services/whisper.py` - OpenAI Whisper transcription service
- `services/admin.py` - Admin operations (user management, audit logs)
- `services/analytics.py` - Usage and cost analytics
- `services/invites.py` - Organization invite management
- `db/supabase.py` - Database operations

### Frontend
- `src/App.tsx` - Main application, phase routing with AuthGuard
- `src/store/` - Zustand stores (council, session, auth, ui, settings, help, decisionMemory)
- `src/features/` - Feature modules organized by domain
- `src/features/decision-memory/` - Command palette, smart history, council templates, session annotations
- `src/features/admin/` - Admin panel with user management, audit logs
- `src/features/analytics/` - Usage metrics, cost tracking, model performance dashboard
- `src/features/team-management/` - Team invites, member management
- `src/api/orchestrator.ts` - Orchestrator API client
- `src/hooks/useRealtimeRun.ts` - Supabase realtime subscription hook
- `src/hooks/useReplayMode.ts` - Access historical session data in phase components
- `src/hooks/useVoiceRecording.ts` - Browser audio recording hook
- `src/components/ui/VoiceInputButton.tsx` - Reusable voice input button
- `src/lib/supabase.ts` - Supabase client configuration
- `src/components/ui/Orb3D/` - 3D Intelligence Orb visualization

### Database
- `supabase/migrations/` - Database migrations (apply in order with `supabase db push`)
  - `001_initial_schema.sql` - Full schema with RLS policies
  - `20241228_setup_user_workspace.sql` - Auto-creates org/project on first login
  - `20260103_decision_memory.sql` - Session annotations, tags, templates
  - `20260118_org_invites.sql` - Organization invite system
  - `20260122_admin_analytics.sql` - Analytics views and admin tables
  - `20260125_admin_panel.sql` - Admin panel tables and audit logs

## API Endpoints

### Orchestrator (port 8002)

**Core Deliberation:**
- `GET /health` - Health check
- `POST /api/runs` - Create and start a deliberation run (requires `X-User-ID` header)
- `GET /api/runs/{run_id}` - Get run status and results
- `POST /api/runs/{run_id}/cancel` - Cancel a running deliberation
- `POST /api/prompts/enhance` - AI-powered prompt enhancement
- `POST /api/transcribe` - Audio-to-text transcription (OpenAI Whisper, max 25MB)

**Team & Invites:**
- `POST /api/invites` - Create org invite
- `GET /api/orgs/{org_id}/invites` - List pending invites
- `GET /api/orgs/{org_id}/members` - List org members
- `POST /api/invites/{invite_id}/cancel` - Cancel invite
- `POST /api/invites/{invite_id}/resend` - Resend invite email

**Admin (requires admin role):**
- `GET /api/admin/users` - List all platform users
- `GET /api/admin/is-platform-admin` - Check if user is platform admin
- `GET /api/orgs/{org_id}/members/detailed` - Detailed member list
- `PATCH /api/orgs/{org_id}/members/{member_id}/role` - Update member role
- `DELETE /api/orgs/{org_id}/members/{member_id}` - Remove member
- `POST /api/orgs/{org_id}/members/bulk` - Bulk member operations
- `GET /api/orgs/{org_id}/audit-logs` - Organization audit logs

**Analytics:**
- `GET /api/analytics/summary` - Usage summary statistics
- `GET /api/analytics/usage` - Detailed usage metrics
- `GET /api/analytics/costs` - Cost breakdown by model
- `GET /api/analytics/models` - Model performance metrics

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

## Deployment

### Vercel (Frontend)
The frontend deploys to Vercel. **Important**: In Vercel Project Settings → General, set **Root Directory** to `frontend` since this is a monorepo.

### Orchestrator
Deploy separately (Railway, Fly.io, etc.) with `OPENAI_API_KEY` for voice transcription support.

## Notes

- The `/api` proxy in `vite.config.ts` points to port 8001 (legacy backend). The frontend uses `VITE_ORCHESTRATOR_URL` for orchestrator calls directly.
- `backend/` contains the legacy FastAPI backend (deprecated) - new development should use `orchestrator/`
- Run deliberations trigger background tasks in FastAPI; results appear via Supabase Realtime subscriptions
