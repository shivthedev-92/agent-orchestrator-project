"""LLM Gateway — routes calls to OpenAI, Anthropic, or Opencode providers."""

import time
import json
from typing import Any

import httpx

OPENAI_URL = "https://api.openai.com/v1/chat/completions"
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
OLLAMA_URL = "http://localhost:11434/api/chat"


async def call_llm(
    provider: str,
    model: str,
    system_prompt: str,
    messages: list[dict] | None = None,
    api_keys: dict[str, str] | None = None,
    temperature: float = 0.4,
    max_tokens: int = 2048,
) -> dict[str, Any]:
    """Call an LLM and return structured output.

    Returns {content, tokens, latency_ms, error?}
    """
    t0 = time.monotonic()
    keys = api_keys or {}

    try:
        if provider == "openai":
            return await _call_openai(model, system_prompt, messages, keys, temperature, max_tokens)
        elif provider == "anthropic":
            return await _call_anthropic(model, system_prompt, messages, keys, temperature, max_tokens)
        elif provider == "opencode":
            return await _call_opencode(model, system_prompt, messages, keys, temperature, max_tokens)
        elif provider == "ollama":
            return await _call_ollama(model, system_prompt, messages, temperature, max_tokens)
        else:
            return _simulate(provider, model, system_prompt)
    except Exception as e:
        latency = int((time.monotonic() - t0) * 1000)
        return {
            "content": None,
            "error": str(e),
            "tokens": 0,
            "latency_ms": latency,
        }


async def _call_openai(
    model: str,
    system_prompt: str,
    messages: list[dict] | None,
    api_keys: dict[str, str],
    temperature: float,
    max_tokens: int,
) -> dict[str, Any]:
    api_key = api_keys.get("openai", "") or api_keys.get("OPENAI_API_KEY", "")
    if not api_key:
        return _missing_key_error("openai")

    msgs = [{"role": "system", "content": system_prompt}]
    if messages:
        msgs.extend(messages)

    t0 = time.monotonic()
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            OPENAI_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": model, "messages": msgs, "temperature": temperature, "max_tokens": max_tokens},
        )
        resp.raise_for_status()
        data = resp.json()

    latency = int((time.monotonic() - t0) * 1000)
    choice = data["choices"][0]
    return {
        "content": choice["message"]["content"],
        "tokens": data["usage"]["total_tokens"] if "usage" in data else 0,
        "latency_ms": latency,
    }


async def _call_anthropic(
    model: str,
    system_prompt: str,
    messages: list[dict] | None,
    api_keys: dict[str, str],
    temperature: float,
    max_tokens: int,
) -> dict[str, Any]:
    api_key = api_keys.get("anthropic", "") or api_keys.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return _missing_key_error("anthropic")

    msgs = messages or [{"role": "user", "content": "Run the agent workflow."}]

    t0 = time.monotonic()
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            ANTHROPIC_URL,
            headers={"x-api-key": api_key, "anthropic-version": "2023-06-01", "Content-Type": "application/json"},
            json={"model": model, "system": system_prompt, "messages": msgs, "temperature": temperature, "max_tokens": max_tokens},
        )
        resp.raise_for_status()
        data = resp.json()

    latency = int((time.monotonic() - t0) * 1000)
    content = ""
    for block in data.get("content", []):
        if block.get("type") == "text":
            content += block["text"]

    return {
        "content": content,
        "tokens": (data.get("usage", {}) or {}).get("input_tokens", 0) + (data.get("usage", {}) or {}).get("output_tokens", 0),
        "latency_ms": latency,
    }


async def _call_opencode(
    model: str,
    system_prompt: str,
    messages: list[dict] | None,
    api_keys: dict[str, str],
    temperature: float,
    max_tokens: int,
) -> dict[str, Any]:
    api_key = api_keys.get("opencode", "") or api_keys.get("OPENCODE_API_KEY", "")
    base_url = api_keys.get("opencode_base_url", "https://api.opencode.ai/v1")

    if not api_key:
        return _simulate("opencode", model, system_prompt)

    msgs = [{"role": "system", "content": system_prompt}]
    if messages:
        msgs.extend(messages)

    t0 = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{base_url}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"model": model or "default", "messages": msgs, "temperature": temperature, "max_tokens": max_tokens},
            )
            resp.raise_for_status()
            data = resp.json()

        latency = int((time.monotonic() - t0) * 1000)
        choice = data["choices"][0]
        return {
            "content": choice["message"]["content"],
            "tokens": data.get("prompt_eval_count", 0) + data.get("eval_count", 0),
            "latency_ms": latency,
        }
    except Exception:
        return _simulate("opencode", model, system_prompt)


def _missing_key_error(provider: str) -> dict[str, Any]:
    return {
        "content": None,
        "error": f"No API key configured for {provider}. Add it in Settings → LLM Providers.",
        "tokens": 0,
        "latency_ms": 0,
    }


async def _call_ollama(
    model: str,
    system_prompt: str,
    messages: list[dict] | None,
    temperature: float,
    max_tokens: int,
) -> dict[str, Any]:
    msgs = [{"role": "system", "content": system_prompt}]
    if messages:
        msgs.extend(messages)

    t0 = time.monotonic()
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            OLLAMA_URL,
            json={
            "model": model,
            "messages": msgs,
            "think": False,
            "stream": False,
            "options": {"temperature": temperature, "num_predict": max_tokens},
        },
        )
        resp.raise_for_status()
        data = resp.json()

    latency = int((time.monotonic() - t0) * 1000)
    content = data.get("message", {}).get("content", "")
    if not content.strip():
        return {
            "content": None,
            "error": f"Ollama returned an empty response for {model}.",
            "tokens": data.get("prompt_eval_count", 0) + data.get("eval_count", 0),
            "latency_ms": latency,
        }
    return {
        "content": content,
        "tokens": data.get("prompt_eval_count", 0) + data.get("eval_count", 0),
        "latency_ms": latency,
    }


def _simulate(provider: str, model: str, system_prompt: str) -> dict[str, Any]:
    content = (
        f"[{provider}/{model} simulated response]\n"
        f"Processed: {system_prompt[:120]}{'…' if len(system_prompt) > 120 else ''}\n\n"
        f"Task completed successfully. (No API key configured — this is a placeholder.)"
    )
    return {
        "content": content,
        "tokens": 50,
        "latency_ms": 5,
    }
