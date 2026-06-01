"""Docker-based agent executor — runs each agent in an isolated container."""

import asyncio
import json
from typing import Any

from app.config import settings


async def run_agent_in_docker(
    provider: str,
    model: str,
    system_prompt: str,
    messages: list[dict] | None = None,
    api_keys: dict[str, str] | None = None,
    temperature: float = 0.4,
    max_tokens: int = 2048,
) -> dict[str, Any]:
    """Spawn a Docker container to execute a single agent step."""
    api_key = (api_keys or {}).get(provider, "")

    payload = {
        "provider": provider,
        "model": model,
        "system_prompt": system_prompt,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "api_key": api_key,
    }

    cmd = [
        "docker", "run", "--rm", "-i",
        "--cpus", str(settings.container_cpus),
        "--memory", settings.container_memory,
        "--network", "host",
        "--pids-limit", "64",
        "--read-only",
        "--tmpfs", "/tmp:size=64m",
        "--security-opt", "no-new-privileges:true",
        "--cap-drop", "ALL",
        settings.agent_runner_image,
    ]

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        payload_bytes = (json.dumps(payload) + "\n").encode()
        stdout, stderr = await asyncio.wait_for(
            proc.communicate(payload_bytes),
            timeout=settings.container_timeout,
        )

        if proc.returncode != 0:
            return {
                "content": None,
                "error": f"Container exited with code {proc.returncode}: {stderr.decode()[:500]}",
                "tokens": 0,
                "latency_ms": 0,
            }

        result = json.loads(stdout.decode())
        return result

    except asyncio.TimeoutError:
        return {
            "content": None,
            "error": f"Container timed out after {settings.container_timeout}s",
            "tokens": 0,
            "latency_ms": 0,
        }
    except FileNotFoundError:
        return {
            "content": None,
            "error": "Docker not found. Install Docker or set executor_mode=inprocess",
            "tokens": 0,
            "latency_ms": 0,
        }
    except Exception as e:
        return {
            "content": None,
            "error": str(e),
            "tokens": 0,
            "latency_ms": 0,
        }
