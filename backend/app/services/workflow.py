from uuid import UUID
from collections import defaultdict, deque

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent
from app.models.connection import Connection


async def get_workflow_graph(db: AsyncSession, workflow_id: UUID) -> dict:
    """Return agents and connections for a workflow."""
    agents_result = await db.execute(
        select(Agent).where(Agent.workflow_id == workflow_id).order_by(Agent.created_at)
    )
    agents = agents_result.scalars().all()

    conns_result = await db.execute(
        select(Connection).where(Connection.workflow_id == workflow_id)
    )
    conns = conns_result.scalars().all()

    return {"agents": agents, "connections": conns}


def topological_sort(agents: list[Agent], connections: list[Connection]) -> list[str]:
    """Return agent IDs in topological execution order."""
    agent_ids = {a.id for a in agents}
    incoming = defaultdict(int)
    adjacency = defaultdict(list)

    for a in agents:
        incoming[a.id] = 0

    for c in connections:
        if c.from_agent_id in agent_ids and c.to_agent_id in agent_ids:
            incoming[c.to_agent_id] += 1
            adjacency[c.from_agent_id].append(c.to_agent_id)

    queue = deque(aid for aid in agent_ids if incoming[aid] == 0)
    ordered = []

    while queue:
        nid = queue.popleft()
        ordered.append(str(nid))
        for neighbor in adjacency[nid]:
            incoming[neighbor] -= 1
            if incoming[neighbor] == 0:
                queue.append(neighbor)

    # Append any remaining (orphans)
    for a in agents:
        if str(a.id) not in ordered:
            ordered.append(str(a.id))

    return ordered
