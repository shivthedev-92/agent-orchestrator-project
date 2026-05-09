# Orchestra.AI — Agent Orchestration Studio

> **Build visual agent workflows with multi-model AI.** Drag, drop, configure, and run agent pipelines using different LLM providers — all from a beautiful studio interface.

---

## Overview

Orchestra.AI is a visual agent orchestration studio that lets you build workflows with agents powered by different AI models. Instead of being locked into a single provider, you can mix models from OpenAI, Anthropic, and more within the same workflow — each agent configured with its own model, prompt, skills, and parameters.

Whether you're building a data pipeline, planning a trip, or automating a multi-step research workflow, Orchestra.AI gives you a canvas to design it visually and an engine to execute it.

### Target Audience

- **Developers** — build complex agent pipelines with fine-grained control
- **Non-developers** — configure and run workflows through a visual interface

---

## Features

### Current (Phase 1 ✓)

| Feature | Description |
|---|---|
| **Visual Canvas** | Pan/zoom canvas with drag-and-drop agent placement |
| **Agent Cards** | Draggable cards with avatar, name, model, skills, status |
| **Connections** | Route messages between agents with 3 connection styles (curved, stepped, straight) |
| **Inspector Panel** | Full agent configuration — model, system prompt, skills, temperature, max tokens, retries, I/O schema |
| **Agent Library** | 15+ pre-built agent templates across 5 categories (Data Pipeline, Travel, Control Flow, Communication, Research) |
| **Generative Avatars** | Deterministic SVG robot avatars — randomized per agent, swappable in inspector |
| **Run Simulation** | Topologically-sorted execution with animated progress, live log overlay, and per-agent status |
| **Minimap** | Bird's-eye view of the canvas with viewport indicator |
| **Theme System** | Dark/light mode with customizable accent color (6 options) |
| **Design Tweaks** | Draggable floating panel for live theme, density, and canvas tweaks |

### Upcoming

- **Phase 2**: Save/load workflows, auto-save, API key management, multiple workflows
- **Phase 3**: Real LLM execution (OpenAI + Anthropic via BYOK), WebSocket live logs, token tracking
- **Phase 4**: Undo/redo, keyboard shortcuts, auto-layout, snap-to-grid, workflow export/import
- **Phase 5**: Auth, organizations, sharing

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite 6 | Modern SPA with HMR and fast builds |
| **Backend** | Python 3.13, FastAPI | Async REST API with auto-generated OpenAPI docs |
| **Database** | PostgreSQL 16, SQLAlchemy 2.0 | Relational storage with JSONB for flexible configs |
| **Containerization** | Docker Compose | Local development environment |

### Architecture

```
┌─────────────────────────────────────────────────────┐
│  React SPA (localhost:5173)                          │
│  ┌──────────┐ ┌──────────┐ ┌────────────────────┐   │
│  │  Library │ │  Canvas  │ │   Inspector Panel  │   │
│  └────┬─────┘ └────┬─────┘ └────────────────────┘   │
│       │            │                                 │
│       └───────┬────┘                                 │
│           HTTP REST + WebSocket                      │
└───────────────┼─────────────────────────────────────┘
                │
┌───────────────┼─────────────────────────────────────┐
│  FastAPI Server (localhost:8000)                     │
│  ┌──────────┐ ┌──────────────┐ ┌─────────────────┐  │
│  │ REST API │ │  WebSocket   │ │  LLM Gateway    │  │
│  │  CRUD    │ │  (run logs)  │ │  (BYOK proxy)   │  │
│  └────┬─────┘ └──────────────┘ └────────┬────────┘  │
│       │                                 │           │
│  ┌────┴────────────────┐  ┌─────────────┴────────┐  │
│  │  Execution Engine   │  │  OpenAI · Anthropic   │  │
│  │  (topological sort, │  │  · Google · Local     │  │
│  │   retry, context)   │  │                       │  │
│  └─────────────────────┘  └───────────────────────┘  │
│       │                                               │
│  ┌────┴──────────────────────────────────────────┐   │
│  │  PostgreSQL (port 5432)                        │   │
│  │  workflows · agents · connections · runs       │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Project Structure

```
agent-orchestrator-project/
│
├── frontend/                          # React + Vite SPA
│   ├── index.html                     # Entry HTML
│   ├── package.json                   # Dependencies & scripts
│   ├── vite.config.js                 # Vite config + API proxy
│   └── src/
│       ├── main.jsx                   # React DOM entry point
│       ├── App.jsx                    # Main app (state, run engine)
│       ├── api.js                     # REST API client
│       ├── styles.css                 # Full theme system (800+ lines)
│       ├── components/
│       │   ├── TopBar.jsx             # Header: branding, run controls, theme toggle
│       │   ├── Library.jsx            # Left sidebar: agent template search & drag
│       │   ├── Canvas.jsx             # Center: pan/zoom canvas, agent cards, connections
│       │   ├── Inspector.jsx          # Right panel: agent property editor
│       │   ├── RunOverlay.jsx         # Run progress bar + log viewer
│       │   ├── TweaksPanel.jsx        # Draggable floating design tweaks
│       │   └── RobotAvatar.jsx        # Deterministic generative SVG avatars
│       └── data/
│           ├── templates.js           # 15 agent template definitions
│           ├── models.js              # Model catalog + provider mapping
│           └── skills.js              # 30+ skill definitions
│
├── backend/                           # FastAPI server
│   ├── requirements.txt
│   ├── Dockerfile
│   └── app/
│       ├── main.py                    # FastAPI app factory, CORS, lifespan
│       ├── config.py                  # Settings (env-based via pydantic-settings)
│       ├── database.py                # Async SQLAlchemy engine + session
│       ├── models/
│       │   ├── workflow.py            # workflows table
│       │   ├── agent.py               # agents table
│       │   ├── connection.py          # connections table
│       │   └── run.py                 # runs + run_logs tables
│       ├── schemas/
│       │   ├── workflow.py            # WorkflowCreate/Update/Response
│       │   ├── agent.py               # AgentCreate/Update/Response
│       │   ├── connection.py          # ConnectionCreate/Response
│       │   └── run.py                 # RunResponse, RunLogResponse
│       ├── routers/
│       │   ├── workflows.py           # CRUD /api/workflows
│       │   ├── agents.py              # CRUD agents within workflows
│       │   ├── connections.py         # CRUD connections
│       │   └── runs.py                # Start run, list runs, get run
│       └── services/
│           ├── workflow.py            # Graph builder + topological sort
│           └── execution.py           # Async execution engine (LLM stub ready)
│
├── docker-compose.yml                 # PostgreSQL + backend containers
├── opencode.md                        # Project memory for AI pair programming
└── README.md                          # This file
```

---

## Setup Guide

### Prerequisites

- **Node.js** ≥ 18 (tested with 20)
- **Python** ≥ 3.12 (tested with 3.13)
- **PostgreSQL** 16 (or Docker)
- **npm** or yarn

### Quick Start (Frontend Only)

The frontend works standalone with built-in seed data and a simulated run engine — no database or backend needed.

```bash
# 1. Navigate to the project
cd /home/shivthedev/projects/agent-orchestrator-project/frontend

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open **http://localhost:5173** in your browser.

### Full Stack (with Docker)

```bash
# 1. Start PostgreSQL + backend
cd /home/shivthedev/projects/agent-orchestrator-project
docker compose up -d

# 2. Start frontend
cd frontend && npm install && npm run dev
```

### Full Stack (without Docker)

#### Backend Setup

```bash
# 1. Create a PostgreSQL database
psql -U postgres -c "CREATE USER orchestra WITH PASSWORD 'orchestra';"
psql -U postgres -c "CREATE DATABASE orchestra OWNER orchestra;"

# 2. Install Python dependencies
cd backend
pip install -r requirements.txt

# 3. Start the server
uvicorn app.main:app --reload
```

The API will be available at **http://localhost:8000**. Auto-generated docs at **http://localhost:8000/docs**.

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to the backend automatically.

---

## API Reference

Once the backend is running, visit **http://localhost:8000/docs** for the interactive Swagger UI.

### Core Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/workflows` | List all workflows |
| `POST` | `/api/workflows` | Create a workflow |
| `GET` | `/api/workflows/{id}` | Get workflow with agents + connections |
| `PUT` | `/api/workflows/{id}` | Update workflow |
| `DELETE` | `/api/workflows/{id}` | Delete workflow |
| `POST` | `/api/workflows/{id}/agents` | Add agent to workflow |
| `PUT` | `/api/workflows/{id}/agents/{aid}` | Update agent |
| `DELETE` | `/api/workflows/{id}/agents/{aid}` | Delete agent |
| `POST` | `/api/workflows/{id}/connections` | Add connection |
| `DELETE` | `/api/workflows/{id}/connections/{cid}` | Delete connection |
| `POST` | `/api/workflows/{id}/run` | Start a workflow run |
| `GET` | `/api/workflows/{id}/runs` | List runs for a workflow |
| `GET` | `/api/runs/{id}` | Get run details with logs |
| `GET` | `/api/health` | Health check |

---

## Roadmap

### Phase 1 ✓ — Foundation (Current)
Frontend SPA, backend scaffold, DB models, Docker Compose.

### Phase 2 — Frontend ↔ Backend Integration
Workflow CRUD, auto-save, API key management, multiple workflow support.

### Phase 3 — Real LLM Execution *(highest priority)*
BYOK provider integration (OpenAI + Anthropic), real execution engine, WebSocket live logs, token tracking.

### Phase 4 — UX Polish
Undo/redo, keyboard shortcuts, auto-layout, snap-to-grid, workflow export/import, custom templates.

### Phase 5 — Multi-Tenant (future)
JWT auth, organizations, sharing, usage analytics.

---

## LLM Integration Strategy

- **BYOK (Bring Your Own Key)**: Users configure their own API keys per provider
- **Starting providers**: OpenAI (GPT models) + Anthropic (Claude models)
- **Per-agent model selection**: Each agent picks its model independently within a workflow
- **Unified message format**: Standardized context passing between agents regardless of underlying model

---

## Development Commands

```bash
# Frontend
cd frontend
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build → dist/
npm run preview      # Preview production build

# Backend
cd backend
uvicorn app.main:app --reload    # Dev server (localhost:8000)

# Database (Docker)
docker compose up -d             # Start PostgreSQL
docker compose down              # Stop
psql -h localhost -U orchestra -d orchestra  # Connect
```

---

## Design System

- **Theme**: Dark/light with CSS custom properties (OKLCH color space)
- **Typography**: Geist (sans-serif) + Geist Mono (monospace) via Google Fonts
- **Accent**: 6 preset hues (Iris, Cobalt, Mint, Amber, Magenta, Cyan)
- **Icons**: Inline SVG throughout (no icon library dependency)
- **Layout**: CSS Grid (280px sidebar | 1fr canvas | 340px inspector)

---

## Contributing

This project is under active development. See `opencode.md` for the current sprint focus and `docker-compose.yml` for the development environment setup.
