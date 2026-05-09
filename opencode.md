# Orchestra.AI — Project Memory

## Vision
A visual agent orchestration studio where users build workflows with multi-model agents. Both developers and non-developers can drag, drop, configure, and run agent pipelines using different LLM providers.

## Team
- Builder: shivthedev
- AI pair: opencode (big-pickle model)

## Tech Stack
- **Frontend**: React 18 + Vite (JSX)
- **Backend**: Python + FastAPI
- **Database**: PostgreSQL (via asyncpg + SQLAlchemy)
- **Deployment**: Local-first (Docker Compose)

## Architecture
```
React SPA (port 5173) → FastAPI (port 8000) → PostgreSQL (port 5432)
                              ↕
                    LLM Gateway (OpenAI, Anthropic, etc.)
```

## Project Location
`/home/shivthedev/projects/agent-orchestrator-project/`

## Directory Structure
```
├── frontend/          Vite + React SPA
│   ├── src/
│   │   ├── components/   TopBar, Library, Canvas, Inspector, RunOverlay, TweaksPanel, RobotAvatar
│   │   ├── data/         templates.js, models.js, skills.js
│   │   ├── api.js        REST client (ready for backend)
│   │   ├── App.jsx       Main app with state + run engine
│   │   └── styles.css    Full dark/light theme system
│   └── vite.config.js    Proxy /api → localhost:8000
├── backend/           FastAPI + PostgreSQL
│   └── app/
│       ├── models/       workflow, agent, connection, run, run_log
│       ├── schemas/      Pydantic request/response models
│       ├── routers/      CRUD endpoints for all entities
│       └── services/     workflow graph, execution engine (LLM stub)
└── docker-compose.yml  PostgreSQL + backend
```

## Status — Phase 1 Complete ✓
- [x] Frontend scaffolded: Vite + React, all 7 components migrated from Babel standalone
- [x] Canvas: drag-drop agents, pan/zoom (fixed), connections with 3 styles, minimap, ports
- [x] Inspector: full agent configuration (model, prompt, skills, params, avatar)
- [x] Run simulation: topological sort, animated progress, run log overlay
- [x] Design tweaks: draggable floating panel, theme/accent/density/connection toggles
- [x] Backend scaffolded: FastAPI, SQLAlchemy models, Pydantic schemas, CRUD routers
- [x] Docker Compose for PostgreSQL
- [x] Build verified: frontend builds (191KB JS), backend imports with 17 routes

## Roadmap

### Phase 2: Wire Frontend ↔ Backend
- [ ] Workflow CRUD (save/load/list/delete via API)
- [ ] Auto-save on changes
- [ ] API key management UI
- [ ] Multiple workflow support

### Phase 3: Real LLM Execution *(highest priority)*
- [ ] LLM Gateway (OpenAI + Anthropic via BYOK)
- [ ] Real execution engine replacing simulation
- [ ] WebSocket for live run logs
- [ ] Token usage tracking

### Phase 4: UX Polish
- [ ] Undo/redo state history
- [ ] Keyboard shortcuts
- [ ] Auto-layout, snap-to-grid
- [ ] Custom agent template creator
- [ ] Export/import workflows as JSON

### Phase 5: Multi-Tenant (future)
- [ ] JWT auth, organizations, sharing

## LLM Strategy
- **BYOK**: Users bring their own API keys per provider
- **Providers**: Start with OpenAI + Anthropic, expand later
- **Models**: Per-agent model selection (Opus 4.5, Sonnet 4.5, Haiku 4.5, GPT, etc.)

## Recurring Commands
```bash
# Frontend dev
cd frontend && npm run dev

# Frontend build
cd frontend && npm run build

# Backend dev (requires PostgreSQL on :5432)
cd backend && uvicorn app.main:app --reload

# Full stack
docker compose up

# DB connection (Docker)
psql -h localhost -p 5432 -U orchestra -d orchestra
# Password: #NikoBellic9299
```
