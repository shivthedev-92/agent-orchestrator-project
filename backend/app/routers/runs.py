from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.workflow import Workflow
from app.models.run import Run, RunLog
from app.schemas.run import RunResponse, RunCreateResponse

router = APIRouter(tags=["runs"])


@router.post("/api/workflows/{workflow_id}/run", response_model=RunCreateResponse, status_code=201)
async def start_run(workflow_id: UUID, db: AsyncSession = Depends(get_db)):
    wf = await db.get(Workflow, workflow_id)
    if not wf:
        raise HTTPException(404, "Workflow not found")
    run = Run(workflow_id=workflow_id, status="pending")
    db.add(run)
    await db.commit()
    await db.refresh(run)
    return run


@router.get("/api/workflows/{workflow_id}/runs", response_model=list[RunResponse])
async def list_runs(workflow_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Run).where(Run.workflow_id == workflow_id).order_by(Run.started_at.desc())
    )
    return result.scalars().all()


@router.get("/api/runs/{run_id}", response_model=RunResponse)
async def get_run(run_id: UUID, db: AsyncSession = Depends(get_db)):
    run = await db.get(Run, run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    return run
