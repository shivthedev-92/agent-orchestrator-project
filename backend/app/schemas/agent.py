from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AgentBase(BaseModel):
    template_id: str = ""
    name: str
    role: str = ""
    model_provider: str = "anthropic"
    model: str = "sonnet-4"
    system_prompt: str = ""
    temperature: float = 0.4
    max_tokens: int = 2048
    retries: int = 1
    output_schema: str = "freeform"
    skills: list[str] = []
    config: dict = {}
    position_x: float = 0
    position_y: float = 0
    avatar_seed: str = ""


class AgentCreate(AgentBase):
    pass


class AgentUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    model_provider: str | None = None
    model: str | None = None
    system_prompt: str | None = None
    temperature: float | None = None
    max_tokens: int | None = None
    retries: int | None = None
    output_schema: str | None = None
    skills: list[str] | None = None
    config: dict | None = None
    position_x: float | None = None
    position_y: float | None = None
    avatar_seed: str | None = None


class AgentResponse(AgentBase):
    id: UUID
    workflow_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}
