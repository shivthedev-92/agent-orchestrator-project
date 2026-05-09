from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class WorkflowBase(BaseModel):
    name: str
    description: str = ""


class WorkflowCreate(WorkflowBase):
    pass


class WorkflowUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class WorkflowResponse(WorkflowBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkflowDetail(WorkflowResponse):
    agents: list["AgentResponse"] = []
    connections: list["ConnectionResponse"] = []
