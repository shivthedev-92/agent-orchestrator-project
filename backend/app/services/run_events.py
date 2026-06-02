"""Optional Redis Streams relay for low-latency workflow run events."""
from datetime import datetime, timezone
import json
from typing import Any
from uuid import UUID

from app.config import settings

try:
    import redis.asyncio as redis
    from redis.exceptions import RedisError
except ImportError:  # Redis is optional for local development.
    redis = None

    class RedisError(Exception):
        pass


_client = None


def _get_client():
    global _client
    if redis is None or not settings.redis_url:
        return None
    if _client is None:
        _client = redis.from_url(settings.redis_url, decode_responses=True)
    return _client


def _stream_name(run_id: UUID) -> str:
    return f"andromeda:run:{run_id}:events"


async def publish_run_event(run_id: UUID, event_type: str, **payload: Any) -> bool:
    """Append a run event when Redis is available; execution never depends on it."""
    client = _get_client()
    if client is None:
        return False
    try:
        stream_name = _stream_name(run_id)
        await client.xadd(
            stream_name,
            {
                "type": event_type,
                "emitted_at": datetime.now(timezone.utc).isoformat(),
                "payload": json.dumps(payload, ensure_ascii=False, default=str),
            },
            maxlen=settings.redis_stream_maxlen,
            approximate=True,
        )
        await client.expire(stream_name, settings.redis_stream_ttl_seconds)
        return True
    except RedisError:
        return False


async def read_run_events(run_id: UUID, after: str = "0-0", count: int = 100) -> dict[str, Any]:
    """Read events newer than ``after`` without making Redis a hard dependency."""
    client = _get_client()
    if client is None:
        return {"available": False, "events": []}
    try:
        streams = await client.xread({_stream_name(run_id): after}, count=count)
    except RedisError:
        return {"available": False, "events": []}

    events = []
    for _, entries in streams:
        for event_id, fields in entries:
            try:
                payload = json.loads(fields.get("payload", "{}"))
            except json.JSONDecodeError:
                payload = {}
            events.append({
                "id": event_id,
                "type": fields.get("type", "unknown"),
                "emitted_at": fields.get("emitted_at", ""),
                "payload": payload,
            })
    return {"available": True, "events": events}


async def close_redis() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None
