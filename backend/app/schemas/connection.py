from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ConnectionBase(BaseModel):
    from_agent_id: UUID
    to_agent_id: UUID
    label: str = ""
    transform: dict = {}


class ConnectionCreate(ConnectionBase):
    pass


class ConnectionResponse(ConnectionBase):
    id: UUID
    workflow_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}
