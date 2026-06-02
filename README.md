# Andromeda.ai - Visual Agent Orchestration Studio

Andromeda.ai is a visual workflow studio for building and running connected AI agents. It combines a React canvas, reusable agent templates, project persistence, run logs, and provider-aware LLM execution.

The current version supports real workflow execution through OpenAI, Anthropic, Ollama, and an OpenCode-compatible endpoint. It also includes a focused file-reading and translation workflow for local document experiments.

## Current Capabilities

- Create, open, save, and delete workflow projects.
- Add agents from templates or create custom agents.
- Configure an agent model, prompt, skills, tools, and visual identity.
- Connect agents on the canvas and execute them in dependency order.
- View current project agents from the left pane.
- Use the right pane tabs to create agents, browse existing agents, and inspect the marketplace.
- Enter workflow input and inspect live run logs from the terminal docked below the canvas.
- Store workflow structure, run state, logs, and token usage in PostgreSQL.
- Relay live run events through optional Redis Streams with automatic PostgreSQL fallback.
- Use bring-your-own-key OpenAI and Anthropic execution.
- Run the verified local Ollama model `qwen3:8b` without an API key.

## Studio Layout

```text
+-------------------------------------------------------------+
| Top bar: project, save, run, provider keys                   |
+----------------+--------------------------+------------------+
| Left pane      | Workflow canvas          | Right pane       |
|                |                          |                  |
| Project agents | Nodes and connections    | Create Agent     |
| Agent inspector|                          | My Agents        |
|                +--------------------------+ Marketplace      |
|                | Run terminal             |                  |
|                | Input | Backend output   |                  |
+----------------+--------------------------+------------------+
```

The terminal belongs to the center workspace only. The left and right panes remain visible while a workflow runs.

## Execution Flow

1. A user adds agents and connects them on the canvas.
2. `Save` persists agents and connections to the backend.
3. `Run` first saves the current canvas, then starts a backend run with the terminal input and configured provider keys.
4. The backend topologically sorts connected agents so upstream work completes before downstream work begins.
5. Each agent receives a structured JSON envelope containing the workflow input, available files, and upstream outputs.
6. The executor runs deterministic local skills where supported, or sends the prompt to the selected LLM provider.
7. Logs and token usage are persisted with the run.
8. After each durable commit, the backend publishes a bounded Redis Stream event when Redis is available.
9. The frontend polls the run-events API and displays progress in the docked terminal. If Redis is unavailable, it falls back to persisted PostgreSQL logs.

The application currently uses REST polling for run updates. Redis Streams reduces relay overhead, but WebSockets and Server-Sent Events are not implemented.

## File Reading And Translation Demo

The current prototype includes two exact skill names with special runtime behavior:

- `Read`: reads files from `trial-folder/` and returns their contents without calling an LLM.
- `Translate`: asks the selected model for structured translated files, extracts the translated text, and writes timestamped results to `trial-folder/output/`.

Example workflow:

```text
Reading Agent [Read] -> Translation Agent [Translate]
```

To try it:

1. Place a source document in `trial-folder/`, such as `trial-folder/sample-english-document.txt`.
2. Create a reading agent with the `Read` skill.
3. Create a translation agent with the `Translate` skill and select `qwen3:8b` for local execution.
4. Connect the reading agent to the translation agent.
5. Run the workflow and inspect the bottom terminal.
6. Find generated files under `trial-folder/output/`.

`trial-folder/output/` is ignored by Git. File access is intentionally constrained to the project trial folder while this feature is still a prototype.

## Model Providers

| Provider | Authentication | Runtime notes |
| --- | --- | --- |
| OpenAI | API key supplied at run time | Uses the OpenAI chat completions API. Available models depend on the account key. |
| Anthropic | API key supplied at run time | Uses the Anthropic messages API. Available models depend on the account key. |
| Ollama | No API key | Uses native Ollama `/api/chat`. Local `qwen3:8b` has been verified with thinking disabled for workflow output. |
| OpenCode-compatible | Optional API key and base URL | Uses a compatible chat completions endpoint. Without a configured key, the current implementation falls back to simulated output. |

The model dropdown currently includes Claude options, `gpt-4o`, `gpt-4o-mini`, and `qwen3:8b`. On the local Ollama instance used for development, `qwen3:8b` is the installed and tested model.

Provider keys are kept in browser storage and sent with run requests. The backend does not yet provide a production secrets vault.

## Architecture

```text
React + Vite frontend
        |
        | REST API and run polling
        v
FastAPI backend ---------> PostgreSQL (durable state and logs)
        |
        +---------------> Redis Streams (optional live event relay)
        |
        +---------------> OpenAI API
        +---------------> Anthropic API
        +---------------> Ollama /api/chat
        +---------------> OpenCode-compatible endpoint
```

The default executor runs agents in the backend process. Redis Streams is an optional low-latency relay; PostgreSQL remains the durable source of truth. An optional Docker executor scaffold is also included for later isolated per-agent execution work.

## Project Structure

```text
agent-orchestrator-project/
|-- frontend/
|   |-- src/
|   |   |-- components/       # Studio, projects page, agent UI, terminal
|   |   |-- data/             # Models, templates, marketplace data
|   |   |-- services/         # Backend API client
|   |   `-- styles/           # Application styling
|   `-- package.json
|-- backend/
|   |-- app/
|   |   |-- api/              # Workflow, agent, connection, and run routes
|   |   |-- services/         # Execution, LLM gateway, Docker executor
|   |   |-- models.py         # SQLAlchemy models
|   |   `-- schemas.py        # Request and response schemas
|   |-- agent_runner/         # Optional container runner
|   `-- requirements.txt
|-- trial-folder/             # Local file-workflow inputs
|-- docker-compose.yml        # Redis, PostgreSQL, and backend
|-- docker-compose.hermes.yml # Optional Hermes services
`-- README.md
```

## Quick Start

### Prerequisites

- Node.js and npm
- Python 3.11+
- PostgreSQL, or Docker Compose
- Redis for the optional live event relay
- Ollama only if using local `qwen3:8b`

### Start PostgreSQL And Backend With Docker

```bash
docker compose up -d
```

This starts Redis on `localhost:6379`, PostgreSQL on host port `5434`, and the FastAPI backend on `http://localhost:8000`.

### Start Backend Manually

Set `DATABASE_URL` for your PostgreSQL environment, then install dependencies and run FastAPI:

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Example Docker database URL when running the backend outside Docker:

```bash
export DATABASE_URL='postgresql+asyncpg://orchestra:orchestra@localhost:5434/orchestra'
```

### Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

### Start Ollama For Local Runs

```bash
ollama serve
ollama pull qwen3:8b
curl http://localhost:11434/api/tags
redis-cli ping
```

Select `qwen3:8b` on an agent to run through the local Ollama service.

## API Overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Backend health check |
| `GET` | `/api/workflows` | List projects |
| `POST` | `/api/workflows` | Create a project |
| `GET` | `/api/workflows/{id}` | Load project details |
| `PUT` | `/api/workflows/{id}` | Update a project |
| `DELETE` | `/api/workflows/{id}` | Delete a project |
| `POST` | `/api/workflows/{id}/agents` | Add an agent |
| `PUT` | `/api/agents/{id}` | Update an agent |
| `DELETE` | `/api/agents/{id}` | Delete an agent |
| `POST` | `/api/workflows/{id}/connections` | Add a connection |
| `DELETE` | `/api/connections/{id}` | Delete a connection |
| `POST` | `/api/workflows/{id}/runs` | Start a run |
| `GET` | `/api/runs/{id}` | Poll durable run status and logs |
| `GET` | `/api/runs/{id}/events?after={stream-id}` | Read optional Redis Stream events |

Example run body:

```json
{
  "input_text": "Translate the available document into French.",
  "api_keys": {
    "openai": "",
    "anthropic": ""
  }
}
```

## Known Prototype Limits

- Authentication and social login controls are placeholders.
- Run updates use Redis-backed REST polling with PostgreSQL fallback rather than WebSockets or Server-Sent Events.
- Provider keys are browser-managed, not stored in a backend secrets vault.
- `Run` auto-saves the canvas, but arbitrary edits are not continuously synchronized.
- Generic file tools are not implemented; the `Read` and `Translate` behaviors are constrained prototypes.
- Undo, redo, export, settings, shared marketplace publishing, and collaboration are not complete.
- The frontend still includes visual run animation while backend logs provide the authoritative execution result.
- The Docker executor is optional groundwork; the default executor is in-process.

## Development Checks

```bash
cd frontend
npm run build

cd ../backend
python3 -m compileall app agent_runner
```

For a basic live check:

```bash
curl http://localhost:8000/api/health
curl http://localhost:11434/api/tags
```

## Supporting Notes

- `SUMMARY.md` contains a broader project snapshot and should be treated as supplementary notes.
- `opencode.md` contains the original implementation brief and historical design direction.
- The current README documents the implemented workflow as of June 1, 2026.
