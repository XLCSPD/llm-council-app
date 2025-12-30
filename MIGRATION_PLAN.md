# LLM Council - Supabase Migration Plan

## STEP 0: Architecture Audit Summary

### Current Architecture Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  src/App.tsx ──> src/store/ (Zustand) ──> src/api/client.ts    │
│                                                │                 │
│  Components:                                   ▼                 │
│  - SetupPhase.tsx (Phase 1 UI)            axios /api/*          │
│  - MainLayout, Sidebar, Header                 │                 │
└────────────────────────────────────────────────┼─────────────────┘
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI)                          │
│  app/main.py ──> app/api/router.py                              │
│                                                                  │
│  Endpoints:                                                      │
│  - /api/sessions (CRUD)                                         │
│  - /api/councils (CRUD + presets)                               │
│  - /api/models (list available LLMs)                            │
│                         │                                        │
│                         ▼                                        │
│  Storage: app/storage/base.py (JsonFileStorage)                 │
│           └── data/sessions/*.json                              │
│           └── data/councils/*.json                              │
└─────────────────────────────────────────────────────────────────┘
```

### Files to Modify/Replace

| File | Action | Reason |
|------|--------|--------|
| `backend/app/storage/` | REPLACE | Replace JSON with Supabase |
| `backend/app/api/endpoints/sessions.py` | MODIFY | Use Supabase client |
| `backend/app/api/endpoints/councils.py` | MODIFY | Use Supabase client |
| `backend/app/config.py` | MODIFY | Add Supabase env vars |
| `frontend/src/api/client.ts` | MODIFY | Add Supabase client |
| `frontend/src/App.tsx` | MODIFY | Add auth wrapper |
| `frontend/src/main.tsx` | MODIFY | Add Supabase provider |

### New Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/*.sql` | Database schema |
| `orchestrator/` | New service for council execution |
| `frontend/src/lib/supabase.ts` | Supabase client config |
| `frontend/src/hooks/useAuth.ts` | Auth hook |
| `frontend/src/hooks/useRealtime.ts` | Realtime subscriptions |
| `frontend/src/features/run/` | Run execution UI |

---

## STEP 1: Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│                                                                  │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ Supabase    │    │ Supabase     │    │ Orchestrator │       │
│  │ Auth        │    │ Realtime     │    │ API          │       │
│  └─────────────┘    └──────────────┘    └──────────────┘       │
│         │                  │                   │                 │
│         ▼                  ▼                   ▼                 │
│  Auth state         Subscribe to:       POST /api/runs          │
│                     - runs                                       │
│                     - run_models                                │
│                     - model_outputs                             │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐  ┌─────────────┐  ┌─────────────────────────┐
│   Supabase      │  │  Supabase   │  │     ORCHESTRATOR        │
│   Auth          │  │  Postgres   │  │     (FastAPI)           │
│   (Magic Link)  │  │  + Realtime │  │                         │
└─────────────────┘  └─────────────┘  │  - POST /api/runs       │
                            ▲         │  - OpenRouter calls     │
                            │         │  - Phase state machine  │
                            │         │  - Write to Supabase    │
                            │         └────────────┬────────────┘
                            │                      │
                            └──────────────────────┘
                              (Service Role Key)
```

---

## STEP 2: Migration Checkpoints

### Checkpoint 1: Supabase Setup ✅
- [ ] Create Supabase project (or use local)
- [ ] Apply schema migrations
- [ ] Configure RLS policies
- [ ] Set up Auth (magic link + password)

### Checkpoint 2: Backend Rewiring ✅
- [ ] Add Supabase Python client to backend
- [ ] Replace JsonFileStorage with Supabase queries
- [ ] Update session/council endpoints
- [ ] Verify existing Phase 1 API works

### Checkpoint 3: Frontend Auth ✅
- [ ] Add @supabase/supabase-js
- [ ] Create auth context/hooks
- [ ] Add login page
- [ ] Protect routes

### Checkpoint 4: Orchestrator MVP ✅
- [ ] Create orchestrator service
- [ ] Implement POST /api/runs
- [ ] Implement Phase 2 (parallel model calls)
- [ ] Write outputs to Supabase

### Checkpoint 5: Realtime UI ✅
- [ ] Subscribe to run status changes
- [ ] Subscribe to model_outputs
- [ ] Update UI progressively
- [ ] Show phase timeline

### Checkpoint 6: Full Pipeline ✅
- [ ] Implement Phase 3 (peer review)
- [ ] Implement Phase 4 (synthesis)
- [ ] End-to-end smoke test
- [ ] Remove legacy JSON storage

---

## STEP 3: Detailed Implementation Plan

### 3.1 Schema (see supabase/migrations/)

Tables:
1. `orgs` - Organizations/teams
2. `org_members` - User membership in orgs
3. `projects` - Project containers
4. `councils` - Saved council templates
5. `sessions` - Decision threads
6. `prompts` - User prompt submissions
7. `runs` - Council execution instances
8. `run_models` - Models participating in a run
9. `model_outputs` - Output from each model per phase
10. `peer_reviews` - Model-to-model rankings

### 3.2 Orchestrator Endpoints

```
POST /api/runs
  Input: { session_id, prompt_id, council_config }
  Creates: run + run_models records
  Returns: { run_id }
  Triggers: Background execution

GET /api/runs/:run_id
  Returns: Current run status (polling fallback)

POST /api/runs/:run_id/cancel
  Cancels a running execution
```

### 3.3 Execution Flow

```
START
  │
  ▼
┌─────────────────┐
│ Create run      │ status='queued'
│ Create run_models│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PHASE 2:        │ status='running', current_phase=2
│ Parallel calls  │
│ to N models     │
│ Write outputs   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PHASE 3:        │ current_phase=3
│ Each model      │
│ ranks others    │
│ Write reviews   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PHASE 4:        │ current_phase=4
│ Chair model     │
│ synthesizes     │
│ Write final     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ COMPLETE        │ status='succeeded'
└─────────────────┘
```

---

## STEP 4: File Changes Summary

### Backend Changes
```
backend/
├── app/
│   ├── config.py              # ADD: SUPABASE_URL, SUPABASE_KEY
│   ├── db/                    # NEW: Supabase client
│   │   ├── __init__.py
│   │   └── supabase.py
│   ├── api/endpoints/
│   │   ├── sessions.py        # MODIFY: Use Supabase
│   │   ├── councils.py        # MODIFY: Use Supabase
│   │   └── runs.py            # NEW: Run management
│   └── storage/               # DEPRECATED (keep for reference)
```

### Orchestrator Service (New)
```
orchestrator/
├── __init__.py
├── main.py                    # FastAPI app
├── config.py                  # Environment config
├── db/
│   └── supabase.py           # Supabase service client
├── services/
│   ├── openrouter.py         # OpenRouter API client
│   ├── runner.py             # Run execution logic
│   └── prompts.py            # Role-specific prompts
├── models/
│   └── schemas.py            # Pydantic models
└── requirements.txt
```

### Frontend Changes
```
frontend/src/
├── lib/
│   └── supabase.ts           # NEW: Supabase client
├── hooks/
│   ├── useAuth.ts            # NEW: Auth hook
│   ├── useRealtime.ts        # NEW: Realtime subscriptions
│   └── useRun.ts             # NEW: Run management
├── components/
│   └── AuthGuard.tsx         # NEW: Route protection
├── features/
│   └── run/                   # NEW: Run execution UI
│       ├── RunPage.tsx
│       ├── PhaseTimeline.tsx
│       └── ModelCard.tsx
├── App.tsx                    # MODIFY: Add auth routing
└── main.tsx                   # MODIFY: Add providers
```

---

## STEP 5: Environment Variables

### Backend (.env)
```bash
# Existing
OPENROUTER_API_KEY=sk-or-...

# New - Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Only for orchestrator
```

### Frontend (.env)
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_ORCHESTRATOR_URL=http://localhost:8002
```

---

## STEP 6: Testing Checklist

### Smoke Tests
- [ ] Create org and project
- [ ] Create session with prompt
- [ ] Configure council (3+ models)
- [ ] Start run
- [ ] Verify Phase 2 outputs appear in real-time
- [ ] Verify Phase 3 reviews complete
- [ ] Verify Phase 4 synthesis appears
- [ ] Run completes with status='succeeded'

### Edge Cases
- [ ] Model timeout handling
- [ ] Model failure (partial success)
- [ ] Run cancellation
- [ ] Invalid council config
- [ ] Network errors

---

## Next Steps

1. Create Supabase schema SQL
2. Build orchestrator service
3. Rewire frontend with Supabase
4. Implement realtime subscriptions
5. End-to-end testing
