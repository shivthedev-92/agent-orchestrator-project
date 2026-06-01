from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.workflow import Workflow
from app.schemas.workflow import WorkflowCreate, WorkflowUpdate, WorkflowResponse, WorkflowDetail

router = APIRouter(prefix="/api/workflows", tags=["workflows"])


@router.get("", response_model=list[WorkflowResponse])
async def list_workflows(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workflow).order_by(Workflow.updated_at.desc()))
    return result.scalars().all()


@router.post("", response_model=WorkflowResponse, status_code=201)
async def create_workflow(data: WorkflowCreate, db: AsyncSession = Depends(get_db)):
    wf = Workflow(name=data.name, description=data.description)
    db.add(wf)
    await db.commit()
    await db.refresh(wf)
    return wf


@router.get("/{workflow_id}", response_model=WorkflowDetail)
async def get_workflow(workflow_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Workflow)
        .options(selectinload(Workflow.agents), selectinload(Workflow.connections))
        .where(Workflow.id == workflow_id)
    )
    wf = result.scalar_one_or_none()
    if not wf:
        raise HTTPException(404, "Workflow not found")
    return wf


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(workflow_id: UUID, data: WorkflowUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    wf = result.scalar_one_or_none()
    if not wf:
        raise HTTPException(404, "Workflow not found")
    if data.name is not None:
        wf.name = data.name
    if data.description is not None:
        wf.description = data.description
    await db.commit()
    await db.refresh(wf)
    return wf


@router.delete("/{workflow_id}", status_code=204)
async def delete_workflow(workflow_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    wf = result.scalar_one_or_none()
    if not wf:
        raise HTTPException(404, "Workflow not found")
    await db.delete(wf)
    await db.commit()
