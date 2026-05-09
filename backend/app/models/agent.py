import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Float
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Agent(Base):
    __tablename__ = "agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    template_id = Column(String(64), default="")
    name = Column(String(255), nullable=False)
    role = Column(String(255), default="")
    model_provider = Column(String(64), default="anthropic")
    model = Column(String(64), nullable=False)
    system_prompt = Column(Text, default="")
    temperature = Column(Float, default=0.4)
    max_tokens = Column(Integer, default=2048)
    retries = Column(Integer, default=1)
    output_schema = Column(String(32), default="freeform")
    skills = Column(JSONB, default=list)
    config = Column(JSONB, default=dict)
    position_x = Column(Float, default=0)
    position_y = Column(Float, default=0)
    avatar_seed = Column(String(128), default="")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    workflow = relationship("Workflow", back_populates="agents")
