import asyncio
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.workflow import Workflow
from app.models.run import Run, RunLog
from app.schemas.run import RunStartRequest, RunResponse, RunCreateResponse
from app.services.execution import execute_workflow
from app.services.run_events import read_run_events

router = APIRouter(tags=["runs"])


@router.post("/api/workflows/{workflow_id}/run", response_model=RunCreateResponse, status_code=201)
async def start_run(workflow_id: UUID, body: RunStartRequest = RunStartRequest(), db: AsyncSession = Depends(get_db)):
    wf = await db.get(Workflow, workflow_id)
    if not wf:
        raise HTTPException(404, "Workflow not found")
    run = Run(workflow_id=workflow_id, status="pending")
    db.add(run)
    await db.commit()
    await db.refresh(run)

    asyncio.create_task(execute_workflow(run_id=run.id, workflow_id=workflow_id, api_keys=body.api_keys, initial_input=body.input_text))
    return run


@router.get("/api/workflows/{workflow_id}/runs", response_model=list[RunResponse])
async def list_runs(workflow_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Run)
        .options(selectinload(Run.logs))
        .where(Run.workflow_id == workflow_id)
        .order_by(Run.started_at.desc())
    )
    return result.scalars().all()


@router.get("/api/runs/{run_id}", response_model=RunResponse)
async def get_run(run_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Run).options(selectinload(Run.logs)).where(Run.id == run_id)
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(404, "Run not found")
    return run


@router.get("/api/runs/{run_id}/events")
async def get_run_events(
    run_id: UUID,
    after: str = Query("0-0", pattern=r"^(\d+)-(\d+)$"),
    count: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    if not await db.get(Run, run_id):
        raise HTTPException(404, "Run not found")
    return await read_run_events(run_id, after=after, count=count)
