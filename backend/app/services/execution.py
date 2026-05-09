"""Workflow execution engine.

This module handles executing agent workflows:
1. Loads workflow graph (agents + connections)
2. Topological sort
3. For each agent: collect context, call LLM, pass output downstream
4. Emit status updates via WebSocket

LLM integration will be added in a future phase.
"""
import asyncio
import json
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory
from app.models.run import Run, RunLog
from app.services.workflow import get_workflow_graph, topological_sort


async def execute_workflow(run_id: UUID, workflow_id: UUID):
    """Execute a workflow asynchronously."""
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

                # TODO: Call actual LLM here based on agent.model_provider / agent.model
                # For now, simulate with a placeholder response
                await asyncio.sleep(0.5)
                output = {
                    "result": f"Simulated output from {agent.name}",
                    "tokens": 150,
                    "latency_ms": 500,
                }

                context[agent_id_str] = output

                log_entry.status = "completed"
                log_entry.output_data = output
                log_entry.tokens_used = 150
                log_entry.latency_ms = 500
                await db.commit()

            run.status = "completed"
            run.finished_at = datetime.now(timezone.utc)
            await db.commit()

        except Exception as e:
            run.status = "failed"
            run.error = str(e)
            run.finished_at = datetime.now(timezone.utc)
            await db.commit()
