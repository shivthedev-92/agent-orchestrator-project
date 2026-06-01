# Andromeda.ai — Project Summary

## What It Is

Andromeda.ai is a **visual agent orchestration studio** where users build, automate, and run AI-powered workflows by connecting agents (LLM-powered bots) on a drag-and-drop canvas. It targets tech teams across software development, testing, DevOps, data engineering, and Scrum/Agile domains.

- **Version**: 0.4.0
- **Builder**: shivthedev (with opencode AI pair)
- **Repository**: `agent-orchestrator-project`

---

## Architecture Overview

### Frontend (React 18 + Vite)
- SPA running on `localhost:5173` with Vite dev server
- Proxy configured to forward `/api` requests to backend `localhost:8000`
- 11 components organized under `frontend/src/components/`
- State managed in `App.jsx` via React hooks (no external state library)
- Dark/light theme system with OKLCH color tokens

### Backend (Python + FastAPI)
- REST API running on `localhost:8000`
- SQLAlchemy async ORM with PostgreSQL (via `asyncpg`)
- Auto-creates tables on startup via `Base.metadata.create_all`
- 4 routers: `workflows`, `agents`, `connections`, `runs`
- LLM Gateway with support for OpenAI, Anthropic, Ollama, and Opencode providers
- Two execution modes: **in-process** (direct HTTP) and **Docker** (per-agent containers)

### Database (PostgreSQL 16)
- Managed via Docker Compose, port `5434` (host) → `5432` (container)
- Tables: `workflows`, `agents`, `connections`, `runs`, `run_logs`

### Docker Infrastructure
| File | Purpose |
|---|---|
| `docker-compose.yml` | PostgreSQL + backend API stack |
| `docker-compose.hermes.yml` | Hermes autonomous AI agent (disabled by default, port `8642`) |
| `backend/Dockerfile` | Backend container image |
| `backend/agent_runner/Dockerfile` | Per-agent execution container |

---

## Key Files and Their Roles

### Frontend
| File | Role |
|---|---|
| `frontend/src/App.jsx` | Root app: routing, state management, run engine, canvas coordination |
| `frontend/src/components/TopBar.jsx` | Top navigation: branding, workspace switcher, save/run/settings, theme toggle, New dropdown |
| `frontend/src/components/Library.jsx` | Left sidebar: searchable/filterable agent templates, drag-to-canvas, inline create/edit agent form |
| `frontend/src/components/ProjectsPage.jsx` | Project list/landing after auth: grid of workflows, New Project modal with LLM provider selection |
| `frontend/src/components/Canvas.jsx` | Canvas: agent positioning, connections, pan/zoom, mini-map, drop targets |
| `frontend/src/components/Inspector.jsx` | Right panel: agent config (name, model, prompt, skills, params, avatar) |
| `frontend/src/components/Landing.jsx` | Promotional hero page with Get Started / Sign In |
| `frontend/src/components/AuthPage.jsx` | Sign in / sign up with email, Google, Apple |
| `frontend/src/components/ApiKeySetup.jsx` | BYOK onboarding for OpenAI, Anthropic, Opencode |
| `frontend/src/components/RunOverlay.jsx` | Run progress bar and live log viewer |
| `frontend/src/components/TweaksPanel.jsx` | Floating settings: theme, accent color, density, canvas background, connection style |
| `frontend/src/components/RobotAvatar.jsx` | SVG avatar generator per agent |
| `frontend/src/api.js` | REST client for all backend endpoints |
| `frontend/src/data/templates.js` | Agent template library (~40 templates across 5 domains) |
| `frontend/src/data/models.js` | Available LLM models |
| `frontend/src/data/skills.js` | Skill taxonomy bank |
| `frontend/src/styles.css` | ~1885 lines: full design system, all component styles, dark/light theme |

### Backend
| File | Role |
|---|---|
| `backend/app/main.py` | FastAPI app factory, CORS, router registration |
| `backend/app/models/workflow.py` | Workflow SQLAlchemy model |
| `backend/app/models/agent.py` | Agent SQLAlchemy model |
| `backend/app/models/connection.py` | Connection (edge) SQLAlchemy model |
| `backend/app/models/run.py` | Run + RunLog SQLAlchemy models |
| `backend/app/routers/workflows.py` | CRUD: list, create, get, update, delete workflows |
| `backend/app/routers/agents.py` | CRUD: add, update, delete agents within a workflow |
| `backend/app/routers/connections.py` | CRUD: add, delete connections within a workflow |
| `backend/app/routers/runs.py` | Start run, get run status/logs |
| `backend/app/services/llm_gateway.py` | LLM Gateway: routes to OpenAI, Anthropic, Ollama, Opencode with BYOK |
| `backend/app/services/execution.py` | Workflow execution engine: topological sort, step-by-step LLM calls |
| `backend/app/services/workflow.py` | Graph loader + topological sort utility |
| `backend/app/services/docker_executor.py` | Docker-based per-agent execution via subprocess |
| `backend/app/config.py` | Settings: DB URL, executor mode, container limits |
| `backend/agent_runner/runner.py` | Standalone script run inside Docker containers to call LLMs |

---

## Features Implemented

### Core Canvas & Workflow Builder
- Drag-and-drop agent placement from library sidebar onto canvas
- Visual connections (edges) between agents with 3 styles (curved, stepped, straight)
- Pan/zoom canvas with mini-map overview
- Agent cards with name, role, prompt preview, skills, status indicators
- Input/output ports on agents for connection drawing
- Connection labels on edges
- Runtime status per agent (idle, running, done, error) with animated pulse

### Agent Library
- ~40 built-in agent templates across 5 groups: Software Development, Testing & QA, Data Engineering, DevOps, Scrum & Agile
- Search/filter by name, role, skill
- Tab filtering by group
- **Create custom agents** with inline form (name, role, prompt, model, skills, temperature, max tokens)
- Edit and delete custom agents
- Drag from library or double-click to spawn on canvas

### Inspector Panel
- Edit agent name, role, system prompt
- Model selection grid (per-agent)
- Skill toggles
- Temperature and max tokens sliders
- Avatar seed picker (6-per-row grid)
- Delete agent

### Projects Page
- Grid of saved workflows with agent count and last-updated timestamp
- **New Project modal** with project name, description, LLM provider selection (Ollama, OpenAI, Anthropic, Opencode) and model picker
- Delete workflow with confirmation dialog
- Empty state with "Create your first project" CTA

### TopBar
- Branding with Andromeda.ai logo and version badge
- "Back to Projects" button
- Workspace switcher dropdown (list of workflows)
- Inline workflow name editing (click-to-rename)
- Save button (disabled when clean), **New dropdown** with "New Agent" and "New Project"
- Delete workflow button
- Undo/Redo buttons (placeholder visuals)
- Settings and Export buttons
- Light/dark theme toggle
- Run/Stop button with play/stop icons

### Run Engine
- Frontend simulation: topological sort execution order, animated per-agent progress
- Run overlay with stage progress bar and live log viewer
- Timer and step counter
- Backend execution engine with real LLM calls via gateway

### LLM Integration
- **OpenAI**: GPT-4o, GPT-4o-mini, GPT-3.5-turbo
- **Anthropic**: Claude Sonnet 4, Opus 3, Sonnet 3
- **Ollama** (local): Qwen3 8B, Llama 3.2 3B, Mistral 7B, CodeLlama 7B
- **Opencode**: Default model
- Bring Your Own Keys (BYOK) model via API key setup page
- Simulated responses when no key is configured

### Theming & UX
- Dark and light themes
- 6 accent colors (Iris, Cobalt, Mint, Amber, Magenta, Cyan)
- Compact/regular density modes
- 3 background patterns (dots, grid, blank)
- Drag ghost preview when dragging agents
- Drop zone highlights on canvas
- Keyboard shortcut hints

### Docker Infrastructure
- PostgreSQL + backend Compose stack
- Hermes autonomous agent profile (manual, disabled by default)
- Per-agent containerized execution with resource limits, security hardening

### Authentication & Onboarding
- Landing page with hero, features, nav
- Sign in / sign up with email, Google, Apple
- API key setup page on first login
- Session flow: Landing → Auth → API Keys (or skip) → Projects

---

## Recent Changes (This Session)

### Projects Page & New Project Modal
- Created `frontend/src/components/ProjectsPage.jsx` (untracked, new file)
- Project grid with card hover effects, delete button, timestamps
- Modal for creating new projects with name, description, LLM provider selector, model picker
- Provider options: Ollama (Local), OpenAI, Anthropic, Opencode

### Library — Create Agent
- Inline "Create Agent" form in Library sidebar (`Library.jsx`)
- Fields: name, role, system prompt, model, skills, temperature range, max tokens range
- Edit/delete custom agents stored in localStorage

### Collapsible Library
- Library sidebar can be toggled open/closed via a fixed-position button on the right edge
- Uses CSS class `.closed` to collapse width to 0

### TopBar — New Dropdown
- "New" button with dropdown containing "New Agent" (opens create form in library) and "New Project" (opens project modal)

### Right-Side Layout Swap
- CSS grid layout: Inspector on the left (`grid-area: inspector`), Library on the right (`grid-area: library`)
- `grid-template-columns: 280px 1fr auto` — inspector 280px, canvas flexible, library auto-width

### Ollama Support
- Ollama provider added to `llm_gateway.py` (`_call_ollama`) with local endpoint `http://localhost:11434/v1/chat/completions`
- Ollama model options in `runner.py`
- Ollama appears in the Projects page New Project modal provider selection
- No API key needed for Ollama

### Empty Canvas Instead of Demo Seed
- New workflows start with empty agents/connections arrays instead of the 7-agent demo seed (`buildSeed()`)
- The demo reset button remains in TweaksPanel

### Delete Workflow Confirmation
- Delete button on workflow cards shows `confirm()` dialog: `Delete "${name}"? This cannot be undone.`

### Hermes Docker Setup
- New `docker-compose.hermes.yml` with Hermes autonomous agent container
- Ports `8642` (Gateway API) and `9119` (Dashboard)
- Memory limit 4G, CPU limit 2 cores, security hardening
- Requires manual profile activation

---

## Current State

### What's Working
- Full frontend SPA with all 11 components
- Backend API with 17+ routes for CRUD on workflows, agents, connections, runs
- Workflow persistence (save/load/list/delete via API)
- Agent canvas with drag-drop, connections, pan/zoom, minimap
- Inspector with full agent configuration
- Agent library with search, filter, custom agent creation
- Projects page with grid and new project modal
- LLM Gateway for 4 providers (OpenAI, Anthropic, Ollama, Opencode)
- Docker Compose stack for PostgreSQL + backend
- Dark/light theme with 6 accent colors
- Run simulation with animated progress and logs
- Hermes autonomous agent Docker profile

### In Progress / Pending
- Auto-save on changes
- API key management UI (backend storage, not just localStorage)
- WebSocket for live run logs (currently polling/simulation)
- Token usage tracking per run
- Undo/redo state history
- Keyboard shortcuts
- Auto-layout and snap-to-grid
- Export/import workflows as JSON
- Connection labels/constraints inspector
- Bidirectional connection support
- Logo redesign (current SVG too small)
- Google OAuth flow (currently uses placeholder)
- Multi-tenant auth (JWT, organizations, sharing)
- Plugin marketplace (DB connectors, SaaS integrations)
- User collaboration / team invites
- Version history / snapshot logs

### Known Issues
- Google login bypass: clicking Google immediately navigates to studio without actual auth
- Backend `delete_workflow` may cascade-delete agents/connections properly but needs verification with `cascade="all, delete-orphan"`
- The `buildSeed()` demo function is still in code but workflows start empty
