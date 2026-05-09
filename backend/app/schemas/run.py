from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class RunLogResponse(BaseModel):
    id: UUID
    run_id: UUID
    agent_id: UUID | None = None
    agent_name: str = ""
    step: int = 0
    status: str = "running"
    input_data: dict | None = None
    output_data: dict | None = None
    tokens_used: int = 0
    latency_ms: int = 0
    error: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class RunResponse(BaseModel):
    id: UUID
    workflow_id: UUID
    status: str
    started_at: datetime
    finished_at: datetime | None = None
    error: str | None = None
    logs: list[RunLogResponse] = []

    model_config = {"from_attributes": True}


class RunCreateResponse(BaseModel):
    id: UUID
    status: str
    started_at: datetime
