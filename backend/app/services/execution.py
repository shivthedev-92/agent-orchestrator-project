"""Workflow execution engine.

Handles executing agent workflows:
1. Loads workflow graph (agents + connections)
2. Topological sort
3. For each agent: collect context, call LLM, pass output downstream
"""
from datetime import datetime, timezone
import json
from pathlib import Path
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import async_session_factory
from app.models.run import Run, RunLog
from app.services.workflow import get_workflow_graph, topological_sort
from app.services.llm_gateway import call_llm
from app.services.docker_executor import run_agent_in_docker


WORKFLOW_FILES_DIR = Path(__file__).resolve().parents[3] / "trial-folder"
OUTPUT_DIR = WORKFLOW_FILES_DIR / "output"
MAX_FILE_CHARS = 100_000


def _has_skill(agent, skill: str) -> bool:
    return any(str(value).lower() == skill.lower() for value in (agent.skills or []))


def _read_workflow_files() -> list[dict[str, str]]:
    if not WORKFLOW_FILES_DIR.exists():
        return []
    files = []
    for path in sorted(WORKFLOW_FILES_DIR.iterdir()):
        if path.is_file():
            files.append({"name": path.name, "content": path.read_text(errors="replace")[:MAX_FILE_CHARS]})
    return files


def _extract_translated_text(content: str) -> str:
    def collect(value) -> list[str]:
        found = []
        if isinstance(value, dict):
            files = value.get("files")
            if isinstance(files, list):
                found.extend(str(item.get("content", "")) for item in files if isinstance(item, dict) and item.get("content"))
            for nested in value.values():
                found.extend(collect(nested))
        elif isinstance(value, list):
            for nested in value:
                found.extend(collect(nested))
        elif isinstance(value, str):
            try:
                found.extend(collect(json.loads(value)))
            except json.JSONDecodeError:
                pass
        return found

    cleaned = content.strip().removeprefix("```json").removesuffix("```").strip()
    cleaned = cleaned.replace("\\'", "'")
    try:
        candidates = collect(json.loads(cleaned))
    except json.JSONDecodeError:
        return content.strip()
    return candidates[-1].strip() if candidates else content.strip()


def _write_translation_output(agent_name: str, content: str) -> str:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    safe_name = "".join(char if char.isalnum() else "-" for char in agent_name.lower()).strip("-")
    output_path = OUTPUT_DIR / f"{timestamp}-{safe_name or 'translation'}.txt"
    output_path.write_text(content)
    return str(output_path)


async def execute_workflow(
    run_id: UUID,
    workflow_id: UUID,
    api_keys: dict[str, str] | None = None,
    initial_input: str = "",
):
    """Execute a workflow asynchronously, calling real LLMs via the gateway."""
    async with async_session_factory() as db:
        run = await db.get(Run, run_id)
        if not run:
            return

        run.status = "running"
        await db.commit()

        try:
            graph = await get_workflow_graph(db, workflow_id)
            agents = graph["agents"]
            connections = graph["connections"]

            order = topological_sort(agents, connections)

            context = {}
            for i, agent_id_str in enumerate(order):
                agent_id = UUID(agent_id_str)
                agent = next((a for a in agents if a.id == agent_id), None)
                if not agent:
                    continue

                upstream = [c for c in connections if str(c.to_agent_id) == agent_id_str]
                input_data = {}
                for c in upstream:
                    src_id = str(c.from_agent_id)
                    if src_id in context:
                        input_data[str(c.id)] = context[src_id]

                log_entry = RunLog(
                    run_id=run_id,
                    agent_id=agent_id,
                    agent_name=agent.name,
                    step=i,
                    status="running",
                    input_data=input_data,
                )
                db.add(log_entry)
                await db.commit()

                workflow_envelope = {
                    "workflow_input": initial_input.strip() if not upstream else "",
                    "files": _read_workflow_files() if not upstream and _has_skill(agent, "Read") else [],
                    "upstream_outputs": input_data,
                }
                task_instruction = (
                    "Translate every source document in upstream_outputs into French. "
                    "Return only JSON using this exact shape: {\"files\":[{\"name\":\"source-name\",\"content\":\"French translation\"}]}. "
                    "Do not echo the input envelope, explain your work, or ask for filesystem access."
                    if _has_skill(agent, "Translate")
                    else "Process this workflow envelope using the supplied content directly. Do not ask for filesystem access."
                )
                messages = [{
                    "role": "user",
                    "content": task_instruction + "\n" + json.dumps(workflow_envelope, ensure_ascii=False),
                }]

                if _has_skill(agent, "Read"):
                    files = workflow_envelope["files"]
                    result = {
                        "content": json.dumps({"files": files}, ensure_ascii=False),
                        "tokens": 0,
                        "latency_ms": 0,
                    }
                    if not files:
                        result["error"] = f"No readable files found in {WORKFLOW_FILES_DIR}."
                elif settings.executor_mode == "docker":
                    result = await run_agent_in_docker(
                        provider=agent.model_provider or "anthropic",
                        model=agent.model,
                        system_prompt=agent.system_prompt or "You are an AI agent. Complete the assigned task.",
                        messages=messages,
                        api_keys=api_keys,
                        temperature=agent.temperature or 0.4,
                        max_tokens=agent.max_tokens or 2048,
                    )
                else:
                    result = await call_llm(
                        provider=agent.model_provider or "anthropic",
                        model=agent.model,
                        system_prompt=agent.system_prompt or "You are an AI agent. Complete the assigned task.",
                        messages=messages,
                        api_keys=api_keys,
                        temperature=agent.temperature or 0.4,
                        max_tokens=agent.max_tokens or 2048,
                    )

                output = {
                    "result": result.get("content") or result.get("error", "No output"),
                    "tokens": result.get("tokens", 0),
                    "latency_ms": result.get("latency_ms", 0),
                }

                if _has_skill(agent, "Read"):
                    output["files"] = workflow_envelope["files"]
                if result.get("error"):
                    output["error"] = result["error"]
                elif _has_skill(agent, "Translate") and result.get("content"):
                    output["raw_result"] = result["content"]
                    output["result"] = _extract_translated_text(result["content"])
                    output["output_file"] = _write_translation_output(agent.name, output["result"])

                context[agent_id_str] = output

                log_entry.status = "completed" if not result.get("error") else "failed"
                log_entry.output_data = output
                log_entry.tokens_used = result.get("tokens", 0)
                log_entry.latency_ms = result.get("latency_ms", 0)
                if result.get("error"):
                    log_entry.error = result["error"]
                await db.commit()

            run.status = "completed"
            run.finished_at = datetime.now(timezone.utc)
            await db.commit()

        except Exception as e:
            run.status = "failed"
            run.error = str(e)
            run.finished_at = datetime.now(timezone.utc)
            await db.commit()
