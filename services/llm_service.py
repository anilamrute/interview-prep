import httpx
import json
from config import LLM_PROVIDER, LLM_API_KEY, LLM_MODEL, BASE_URL

async def chat_completion(messages: list, temperature: float = 0.7, max_tokens: int = 4000) -> str:
    headers = {"Content-Type": "application/json"}
    if LLM_PROVIDER != "ollama":
        headers["Authorization"] = f"Bearer {LLM_API_KEY}"
    
    if not LLM_API_KEY and LLM_PROVIDER != "ollama":
        raise RuntimeError(f"LLM_API_KEY is required for provider: {LLM_PROVIDER}. Set it in .env file.")
    
    payload = {
        "model": LLM_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    
    # Gemini uses a slightly different payload structure
    if LLM_PROVIDER == "gemini":
        url = f"{BASE_URL}/models/{LLM_MODEL}:generateContent?key={LLM_API_KEY}"
        gemini_messages = []
        for m in messages:
            role = "user" if m["role"] == "user" else "model"
            gemini_messages.append({"role": role, "parts": [{"text": m["content"]}]})
        payload = {
            "contents": gemini_messages,
            "generationConfig": {"temperature": temperature, "maxOutputTokens": max_tokens},
        }
        headers.pop("Authorization", None)
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            f"{BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]
