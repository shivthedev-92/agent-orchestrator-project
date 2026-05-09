from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.workflow import Workflow
from app.models.agent import Agent
from app.schemas.agent import AgentCreate, AgentUpdate, AgentResponse

router = APIRouter(tags=["agents"])


@router.post("/api/workflows/{workflow_id}/agents", response_model=AgentResponse, status_code=201)
async def add_agent(workflow_id: UUID, data: AgentCreate, db: AsyncSession = Depends(get_db)):
    wf = await db.get(Workflow, workflow_id)
    if not wf:
        raise HTTPException(404, "Workflow not found")
    agent = Agent(workflow_id=workflow_id, **data.model_dump())
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent


@router.put("/api/workflows/{workflow_id}/agents/{agent_id}", response_model=AgentResponse)
async def update_agent(workflow_id: UUID, agent_id: UUID, data: AgentUpdate, db: AsyncSession = Depends(get_db)):
    agent = await db.get(Agent, agent_id)
    if not agent or agent.workflow_id != workflow_id:
        raise HTTPException(404, "Agent not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(agent, field, value)
    await db.commit()
    await db.refresh(agent)
    return agent


@router.delete("/api/workflows/{workflow_id}/agents/{agent_id}", status_code=204)
async def delete_agent(workflow_id: UUID, agent_id: UUID, db: AsyncSession = Depends(get_db)):
    agent = await db.get(Agent, agent_id)
    if not agent or agent.workflow_id != workflow_id:
        raise HTTPException(404, "Agent not found")
    await db.delete(agent)
    await db.commit()
