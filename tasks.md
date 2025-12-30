# LLM Council - Implementation Tasks

## Supabase Migration (Current Focus)

| Task | Status |
|------|--------|
| Audit existing repo structure and implementation | ✅ Complete |
| Create migration plan with checkpoints | ✅ Complete |
| Design and implement Supabase schema + RLS | ✅ Complete |
| Build orchestrator service skeleton | ✅ Complete |
| Implement Phase 2 execution (Independent Reasoning) | ✅ Complete |
| Implement Phase 3 execution (Peer Review) | ✅ Complete |
| Implement Phase 4 execution (Synthesis) | ✅ Complete |
| Rewire frontend with Supabase Auth | ✅ Complete |
| Add Supabase realtime subscriptions | ✅ Complete |
| Create runbook and smoke tests | ✅ Complete |

---

## Phase 1: Foundation
| Task | Status |
|------|--------|
| Create backend project structure with FastAPI | ✅ Complete |
| Create domain models (Session, Council, CouncilMember, Output, Vote) | ✅ Complete |
| Create JSON storage layer with repositories | ✅ Complete (Replaced with Supabase) |
| Create config with environment settings | ✅ Complete |
| Create frontend project with Vite + React + TypeScript | ✅ Complete |
| Set up Tailwind + CSS variables theme system | ✅ Complete |
| Create Zustand stores (council, session, ui, auth) | ✅ Complete |
| Create MainLayout with Sidebar and Header | ✅ Complete |
| Create PhaseNavigation component | ✅ Complete |
| Create API client with Axios | ✅ Complete (+ Supabase client) |

## Phase 2: Council Builder
| Task | Status |
|------|--------|
| Models API (list available models) | ✅ Complete |
| Councils API (CRUD operations) | ✅ Complete |
| Templates API with presets | ✅ Complete |
| ModelSelector with search/filter | ✅ Complete |
| ModelCard with role dropdown, weight slider | ✅ Complete |
| PresetSelector (Fast, Balanced, Deep, Executive) | ⏳ Pending |
| PromptEditor with structured fields | ✅ Complete |
| Cost estimation display | ⏳ Pending |

## Phase 3: Deliberation Engine
| Task | Status |
|------|--------|
| Phase state machine | ✅ Complete (in orchestrator) |
| Setup phase handler | ✅ Complete |
| Reasoning phase handler | ✅ Complete |
| Review phase handler | ✅ Complete |
| Synthesis phase handler | ✅ Complete |
| Role-specific prompt templates | ✅ Complete |
| OpenRouter provider with parallel execution | ✅ Complete |
| SSE streaming endpoint | ⏳ Pending |
| WebSocket/SSE client in frontend | ✅ Complete (polling-based) |
| ModelResponseCard with status display | ✅ Complete |
| ReasoningPhase UI component | ✅ Complete |
| ParallelExecutionViz timeline | ⏳ Pending |

## Phase 4: Peer Review & Visualizations
| Task | Status |
|------|--------|
| Ranking parser from model responses | ✅ Complete |
| Aggregate ranking calculator | ✅ Complete (consensus score in RankingsMatrix) |
| Analytics endpoints (rankings matrix, agreement scores) | ✅ Complete (peer_reviews in RunResponse) |
| RankingsDisplay bar chart | ✅ Complete (AgreementChart component) |
| AgreementHeatmap (NxN grid) | ✅ Complete (RankingsMatrix with color intensity) |
| MinorityOpinionCard | ✅ Complete (in KeyPoints component) |
| Vote breakdown display | ✅ Complete (RankingsMatrix with per-reviewer scores) |
| CritiqueCard component | ✅ Complete (rationale modal in ReviewPhase) |
| **ReviewPhase UI component** | ✅ Complete |

## Phase 5: Synthesis & Polish
| Task | Status |
|------|--------|
| Synthesis handler with confidence extraction | ✅ Complete |
| Re-synthesize endpoint | ⏳ Pending |
| Export endpoint (JSON, Markdown) | ⏳ Pending (backend) |
| FinalAnswer with markdown rendering | ✅ Complete (ReactMarkdown in SynthesisPhase) |
| ConfidenceIndicator gauge | ✅ Complete (ConfidenceIndicator + ConfidenceBadge) |
| KeyDisagreements display | ✅ Complete (KeyPoints component) |
| ChairmanSelector for re-synthesis | ⏳ Pending |
| Session history sidebar | ✅ Complete |
| Export functionality in UI | ✅ Complete (copy + markdown export) |
| **SynthesisPhase UI component** | ✅ Complete |

---

## Recent Features (Dec 2025)

| Task | Status |
|------|--------|
| Phase Skip Bug Fix - Remove auto-advance from Reasoning/Review | ✅ Complete |
| Email/Password Authentication (alongside magic links) | ✅ Complete |
| Session Replay - Full read-only replay of historical sessions | ✅ Complete |
| Smart Prompt Creator - Freeform editor with AI enhancement | ✅ Complete |
| Prompt Templates - 6 templates with category filters | ✅ Complete |
| AI Enhancement Backend - `/api/prompts/enhance` endpoint | ✅ Complete |

---

## Summary

| Phase | Complete | Pending | Total |
|-------|----------|---------|-------|
| Supabase Migration | 10 | 0 | 10 |
| Phase 1: Foundation | 10 | 0 | 10 |
| Phase 2: Council Builder | 6 | 2 | 8 |
| Phase 3: Deliberation Engine | 10 | 2 | 12 |
| Phase 4: Peer Review & Visualizations | 9 | 0 | 9 |
| Phase 5: Synthesis & Polish | 8 | 2 | 10 |
| Recent Features | 6 | 0 | 6 |
| **Total** | **59** | **6** | **65** |

---

## Current Status

**Overall Progress: ~91% Complete**

### What's Working Now

**Backend (Orchestrator):**
- FastAPI orchestrator service on port 8002
- Supabase integration with service role key
- OpenRouter client for LLM calls
- Full deliberation pipeline: Phase 2 (Reasoning) → Phase 3 (Peer Review) → Phase 4 (Synthesis)
- Role-specific system prompts (Thinker, Critic, Devil's Advocate, Chair)
- Parallel model execution with asyncio
- Run lifecycle management (queued → running → succeeded/failed/canceled)
- Peer reviews included in run response
- **AI Prompt Enhancement endpoint** (`/api/prompts/enhance`) using Gemini 2.0 Flash

**Database (Supabase):**
- Complete schema with 11 tables
- Row Level Security (RLS) policies
- Organization-based multi-tenancy
- Realtime enabled for runs, run_models, model_outputs, peer_reviews
- `setup_user_workspace` RPC function for automatic org/project creation

**Frontend:**
- React + TypeScript + Vite
- Supabase Auth with magic link + **email/password authentication**
- Auth guard protecting routes
- Zustand stores for state management (council, session, auth, ui)
- Tailwind CSS with light/dark theme
- **Setup Phase UI** - Model selector, role config, **Smart Prompt Creator**
- **Reasoning Phase UI** - Model response cards with status polling
- **Review Phase UI** - Rankings matrix, agreement charts, score distribution, rationale modal
- **Synthesis Phase UI** - Final answer with markdown, confidence indicator, key points, export
- **Session Replay** - Full read-only replay of historical sessions with phase navigation
- **Prompt Templates** - 6 templates (Binary Decision, Problem Solving, Brainstorming, Pros & Cons, Strategic Approach, Risk Assessment)
- **AI Enhancement** - Suggestions for content, objective, constraints, context, audience

### End-to-End Flow (Working)

1. User logs in via magic link
2. User selects models and configures roles
3. User enters prompt and clicks "Start Deliberation"
4. Frontend auto-creates org/project/session via Supabase RPC
5. Frontend calls orchestrator to create run
6. Orchestrator executes phases in background
7. **Reasoning Phase**: Frontend polls and displays model responses
8. **Review Phase**: Frontend displays rankings matrix, charts, and rationales
9. **Synthesis Phase**: Frontend displays final synthesis with confidence and key points

### Architecture

```
Frontend (React)          Supabase                 Orchestrator (FastAPI)
     │                       │                            │
     ├──[Auth]──────────────▶│                            │
     ├──[Realtime]◀──────────│                            │
     ├──[Data CRUD]─────────▶│◀───[Service Role]─────────┤
     │                       │                            │
     │                       │                            ├──▶ OpenRouter
     │                       │                            │
```

### Frontend Phase Components

| Phase | Component | Features |
|-------|-----------|----------|
| Setup | `SetupPhase.tsx` | Model selector, role config, **PromptCreator** with templates & AI enhancement |
| Reasoning | `ReasoningPhase.tsx` | Model cards, status polling, live updates, **replay mode** |
| Review | `ReviewPhase.tsx` | RankingsMatrix, AgreementChart, ScoreDistribution, rationale modal, **replay mode** |
| Synthesis | `SynthesisPhase.tsx` | ConfidenceIndicator, KeyPoints, markdown rendering, export, **replay mode** |

### New Components (Dec 2025)

| Component | Location | Features |
|-----------|----------|----------|
| `PromptCreator` | `features/council-builder/components/PromptCreator/` | Freeform/Templates toggle, AI enhance button |
| `TemplateSelector` | `PromptCreator/TemplateSelector.tsx` | 6 templates, category filters, placeholder customization |
| `AIEnhancer` | `PromptCreator/AIEnhancer.tsx` | Review AI suggestions, apply individual/all |
| `FreeformEditor` | `PromptCreator/FreeformEditor.tsx` | Full prompt form with AI enhancement |
| `ReplayModeIndicator` | `components/replay/` | Read-only badge |
| `ReplayPhaseNavigation` | `components/replay/` | Phase navigation for replay mode |
| `useReplayMode` | `hooks/useReplayMode.ts` | Convenience hook for replay data |
| `LoginPage` | `components/auth/LoginPage.tsx` | Login/Signup tabs, email/password + magic link |
| `ResetPasswordPage` | `components/auth/ResetPasswordPage.tsx` | Password reset flow |

### Remaining Tasks

1. **PresetSelector** - Quick council presets (Fast, Balanced, Deep, Executive)
2. **Cost Estimation** - Show estimated cost before running
3. **SSE Streaming** - Real-time model output streaming
4. **ParallelExecutionViz** - Timeline visualization for reasoning phase
5. **Re-synthesize** - Allow changing chairman and regenerating synthesis
6. **Backend Export** - JSON/Markdown export endpoints
