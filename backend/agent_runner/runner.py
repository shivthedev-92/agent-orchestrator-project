"""Agent runner — executed inside a Docker container per agent step."""
import json
import os
import sys
import time
import httpx


OPENAI_URL = "https://api.openai.com/v1/chat/completions"
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434/api/chat")


def main():
    payload = json.loads(sys.stdin.read())

    provider = payload.get("provider", "anthropic")
    model = payload.get("model", "claude-sonnet-4-20250514")
    system_prompt = payload.get("system_prompt", "")
    messages = payload.get("messages")
    temperature = payload.get("temperature", 0.4)
    max_tokens = payload.get("max_tokens", 2048)
    api_key = payload.get("api_key", "")

    t0 = time.monotonic()

    try:
        if provider == "openai":
            result = _call_openai(api_key, model, system_prompt, messages, temperature, max_tokens)
        elif provider == "anthropic":
            result = _call_anthropic(api_key, model, system_prompt, messages, temperature, max_tokens)
        elif provider == "opencode":
            result = _call_opencode(api_key, model, system_prompt, messages, temperature, max_tokens)
        elif provider == "ollama":
            result = _call_ollama(model, system_prompt, messages, temperature, max_tokens)
        else:
            result = {"content": f"[{provider}] Unknown provider. Using simulation.", "tokens": 0}

        latency = int((time.monotonic() - t0) * 1000)
        result["latency_ms"] = latency
        print(json.dumps(result))
        sys.exit(0)

    except Exception as e:
        latency = int((time.monotonic() - t0) * 1000)
        print(json.dumps({"content": None, "error": str(e), "tokens": 0, "latency_ms": latency}))
        sys.exit(1)


def _call_openai(api_key, model, system_prompt, messages, temperature, max_tokens):
    if not api_key:
        return {"content": None, "error": "No API key configured for openai."}
    msgs = [{"role": "system", "content": system_prompt}]
    if messages:
        msgs.extend(messages)
    resp = httpx.post(
        OPENAI_URL,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={"model": model, "messages": msgs, "temperature": temperature, "max_tokens": max_tokens},
        timeout=120,
    )
    resp.raise_for_status()
    data = resp.json()
    content = data.get("message", {}).get("content", "")
    if not content.strip():
        return {"content": None, "error": f"Ollama returned an empty response for {model}.", "tokens": 0}
    return {"content": content, "tokens": data.get("prompt_eval_count", 0) + data.get("eval_count", 0)}


def _call_anthropic(api_key, model, system_prompt, messages, temperature, max_tokens):
    if not api_key:
        return {"content": None, "error": "No API key configured for anthropic."}
    msgs = messages or [{"role": "user", "content": "Run the agent workflow."}]
    resp = httpx.post(
        ANTHROPIC_URL,
        headers={"x-api-key": api_key, "anthropic-version": "2023-06-01", "Content-Type": "application/json"},
        json={"model": model, "system": system_prompt, "messages": msgs, "temperature": temperature, "max_tokens": max_tokens},
        timeout=120,
    )
    resp.raise_for_status()
    data = resp.json()
    content = "".join(b["text"] for b in data.get("content", []) if b.get("type") == "text")
    tokens = (data.get("usage", {}) or {}).get("input_tokens", 0) + (data.get("usage", {}) or {}).get("output_tokens", 0)
    return {"content": content, "tokens": tokens}


def _call_opencode(api_key, model, system_prompt, messages, temperature, max_tokens):
    if not api_key:
        return {"content": f"[opencode/{model}] No key — simulated: {system_prompt[:80]}", "tokens": 0}
    base_url = os.environ.get("OPENCODE_BASE_URL", "https://api.opencode.ai/v1")
    msgs = [{"role": "system", "content": system_prompt}]
    if messages:
        msgs.extend(messages)
    try:
        resp = httpx.post(
            f"{base_url}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": model or "default", "messages": msgs, "temperature": temperature, "max_tokens": max_tokens},
            timeout=120,
        )
        resp.raise_for_status()
        data = resp.json()
        choice = data["choices"][0]
        return {"content": choice["message"]["content"], "tokens": data.get("usage", {}).get("total_tokens", 0)}
    except Exception:
        return {"content": f"[opencode/{model}] Simulated: {system_prompt[:80]}", "tokens": 0}


def _call_ollama(model, system_prompt, messages, temperature, max_tokens):
    msgs = [{"role": "system", "content": system_prompt}]
    if messages:
        msgs.extend(messages)
    resp = httpx.post(
        OLLAMA_URL,
        json={
            "model": model,
            "messages": msgs,
            "think": False,
            "stream": False,
            "options": {"temperature": temperature, "num_predict": max_tokens},
        },
        timeout=120,
    )
    resp.raise_for_status()
    data = resp.json()
    content = data.get("message", {}).get("content", "")
    if not content.strip():
        return {"content": None, "error": f"Ollama returned an empty response for {model}.", "tokens": 0}
    return {"content": content, "tokens": data.get("prompt_eval_count", 0) + data.get("eval_count", 0)}


if __name__ == "__main__":
    main()
