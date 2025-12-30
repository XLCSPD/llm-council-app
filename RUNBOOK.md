# LLM Council Runbook

This document provides instructions for setting up and running the LLM Council platform.

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    Frontend     │────▶│     Supabase     │◀────│   Orchestrator   │
│  (React + TS)   │     │  (Auth + Data)   │     │    (FastAPI)     │
└─────────────────┘     └──────────────────┘     └──────────────────┘
                                                          │
                                                          ▼
                                                 ┌──────────────────┐
                                                 │   OpenRouter     │
                                                 │   (LLM API)      │
                                                 └──────────────────┘
```

## Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account (or local Supabase via Docker)
- OpenRouter API key

## Setup

### 1. Supabase Setup

#### Option A: Supabase Cloud

1. Create a project at https://supabase.com
2. Go to **Settings > API** and note:
   - Project URL (`SUPABASE_URL`)
   - `anon public` key (`SUPABASE_ANON_KEY`)
   - `service_role secret` key (`SUPABASE_SERVICE_ROLE_KEY`)

3. Run the migration:
   - Go to **SQL Editor**
   - Paste contents of `supabase/migrations/001_initial_schema.sql`
   - Execute

#### Option B: Local Supabase (Docker)

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Start local Supabase
cd llm-council
supabase start

# Apply migrations
supabase db reset
```

### 2. OpenRouter Setup

1. Get an API key at https://openrouter.ai/keys
2. Add credits to your account

### 3. Orchestrator Setup

```bash
cd orchestrator

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env from example
cp .env.example .env

# Edit .env with your values:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# OPENROUTER_API_KEY=your-openrouter-key
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env from example
cp .env.example .env

# Edit .env with your values:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Running the Application

### Start Orchestrator

```bash
cd orchestrator
source .venv/bin/activate
python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

### Start Frontend

```bash
cd frontend
npm run dev
```

### Access

- Frontend: http://localhost:5173
- Orchestrator: http://localhost:8002
- Orchestrator Docs: http://localhost:8002/docs

## Smoke Tests

### 1. Health Check

```bash
curl http://localhost:8002/health
# Expected: {"status":"healthy","service":"orchestrator"}
```

### 2. Authentication Flow

1. Open http://localhost:5173
2. Enter an email address
3. Check email for magic link
4. Click link to authenticate

### 3. Create a Run (API)

```bash
# Replace with actual IDs
curl -X POST http://localhost:8002/api/runs \
  -H "Content-Type: application/json" \
  -H "X-User-ID: your-user-uuid" \
  -d '{
    "session_id": "existing-session-uuid",
    "prompt": {
      "content": "What are the pros and cons of remote work?",
      "objective": "Provide a balanced analysis"
    },
    "council": {
      "members": [
        {"model_key": "openai/gpt-4o", "display_name": "GPT-4o", "role": "thinker"},
        {"model_key": "anthropic/claude-3.5-sonnet", "display_name": "Claude 3.5", "role": "critic"}
      ]
    }
  }'
```

### 4. Check Run Status

```bash
curl http://localhost:8002/api/runs/{run_id}
```

## Troubleshooting

### Common Issues

#### "Supabase environment variables not set"

Ensure your `.env` file exists and has valid values:
```bash
# Frontend
cat frontend/.env

# Orchestrator
cat orchestrator/.env
```

#### "401 Unauthorized" from Orchestrator

The orchestrator requires `X-User-ID` header. This should match an authenticated Supabase user ID.

#### RLS Blocking Queries

Ensure:
1. The user is a member of the organization owning the resource
2. The service role key is used for orchestrator (bypasses RLS)

#### OpenRouter Errors

Check:
1. API key is valid
2. Account has credits
3. Model name is correct (e.g., `openai/gpt-4o`)

## Monitoring

### Supabase Dashboard

- **Table Editor**: View/edit data
- **Logs**: Check function and database logs
- **Realtime Inspector**: Debug subscription issues

### Orchestrator Logs

Logs print to stdout. For structured logging, consider adding:
- `python-json-logger` for JSON output
- Integration with your logging platform

## Production Checklist

- [ ] Configure CORS properly (not `*`)
- [ ] Set `DEBUG=false` in orchestrator
- [ ] Enable Supabase Row Level Security (already configured)
- [ ] Set up rate limiting
- [ ] Configure proper SSL/TLS
- [ ] Set up monitoring and alerting
- [ ] Back up Supabase database
- [ ] Review OpenRouter spending limits
