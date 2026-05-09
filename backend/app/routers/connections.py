from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.workflow import Workflow
from app.models.connection import Connection
from app.schemas.connection import ConnectionCreate, ConnectionResponse

router = APIRouter(tags=["connections"])


@router.post("/api/workflows/{workflow_id}/connections", response_model=ConnectionResponse, status_code=201)
async def add_connection(workflow_id: UUID, data: ConnectionCreate, db: AsyncSession = Depends(get_db)):
    wf = await db.get(Workflow, workflow_id)
    if not wf:
        raise HTTPException(404, "Workflow not found")
    conn = Connection(workflow_id=workflow_id, **data.model_dump())
    db.add(conn)
    await db.commit()
    await db.refresh(conn)
    return conn


@router.delete("/api/workflows/{workflow_id}/connections/{connection_id}", status_code=204)
async def delete_connection(workflow_id: UUID, connection_id: UUID, db: AsyncSession = Depends(get_db)):
    conn = await db.get(Connection, connection_id)
    if not conn or conn.workflow_id != workflow_id:
        raise HTTPException(404, "Connection not found")
    await db.delete(conn)
    await db.commit()
