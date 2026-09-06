"""
KisanSeva — Unified LLM Provider
Wraps Gemini, Groq, DeepSeek, NVIDIA NIM, OpenAI with automatic
fallback chain and response caching.

Priority: Gemini → Groq → DeepSeek → OpenAI
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class LLMProvider(str, Enum):
    GEMINI    = "gemini"
    GROQ      = "groq"
    DEEPSEEK  = "deepseek"
    NVIDIA    = "nvidia"
    OPENAI    = "openai"


@dataclass
class LLMMessage:
    role: str    # "user" | "assistant" | "system"
    content: str


@dataclass
class LLMResponse:
    content: str
    provider: str
    model: str
    prompt_tokens: int
    completion_tokens: int
    latency_ms: int
    cached: bool = False
    error: Optional[str] = None


@dataclass
class LLMConfig:
    primary:   LLMProvider = LLMProvider.GEMINI
    fallbacks: List[LLMProvider] = field(default_factory=lambda: [
        LLMProvider.GROQ, LLMProvider.DEEPSEEK, LLMProvider.OPENAI
    ])
    temperature:     float = 0.3
    max_tokens:      int   = 1024
    timeout_seconds: float = 30.0
    cache_ttl:       int   = 3600   # 1 hour in-memory cache
    system_prompt:   str   = (
        "You are KisanSeva AI, an expert agricultural advisor for smallholder "
        "farmers in India. Provide concise, actionable advice. When answering "
        "in Hindi or regional languages, use simple vocabulary farmers understand. "
        "Always prioritise safety — for critical diseases, advise consulting a "
        "Krishi Vigyan Kendra (KVK) expert."
    )


# ── Simple in-memory LRU cache ─────────────────────────────
_cache: Dict[str, tuple[str, float]] = {}


def _cache_get(key: str, ttl: int) -> Optional[str]:
    if key in _cache:
        value, ts = _cache[key]
        if time.time() - ts < ttl:
            return value
        del _cache[key]
    return None


def _cache_set(key: str, value: str) -> None:
    if len(_cache) > 500:  # Evict oldest 100 entries
        oldest = sorted(_cache.items(), key=lambda x: x[1][1])[:100]
        for k, _ in oldest:
            del _cache[k]
    _cache[key] = (value, time.time())


def _cache_key(messages: List[LLMMessage], provider: str) -> str:
    payload = json.dumps([{"r": m.role, "c": m.content} for m in messages])
    return hashlib.sha256(f"{provider}:{payload}".encode()).hexdigest()


# ── Provider implementations ────────────────────────────────

async def _call_gemini(
    messages: List[LLMMessage],
    config: LLMConfig,
    client: httpx.AsyncClient,
) -> LLMResponse:
    """Call Google Gemini via REST API."""
    api_key = os.getenv("GEMINI_API_KEY", "")
    model   = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    base    = os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta")

    # Build Gemini content format
    contents = []
    system_text = config.system_prompt
    for msg in messages:
        if msg.role == "system":
            system_text = msg.content
            continue
        contents.append({
            "role": "user" if msg.role == "user" else "model",
            "parts": [{"text": msg.content}]
        })

    payload = {
        "system_instruction": {"parts": [{"text": system_text}]},
        "contents": contents,
        "generationConfig": {
            "temperature": config.temperature,
            "maxOutputTokens": config.max_tokens,
            "topP": 0.95,
        },
        "safetySettings": [
            {"category": "HARM_CATEGORY_HARASSMENT",       "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH",      "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT","threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT","threshold": "BLOCK_NONE"},
        ]
    }

    t0 = time.perf_counter()
    resp = await client.post(
        f"{base}/models/{model}:generateContent",
        params={"key": api_key},
        json=payload,
        timeout=config.timeout_seconds,
    )
    resp.raise_for_status()
    data = resp.json()
    latency = int((time.perf_counter() - t0) * 1000)

    candidate = data["candidates"][0]
    text = candidate["content"]["parts"][0]["text"]
    usage = data.get("usageMetadata", {})

    return LLMResponse(
        content=text,
        provider=LLMProvider.GEMINI,
        model=model,
        prompt_tokens=usage.get("promptTokenCount", 0),
        completion_tokens=usage.get("candidatesTokenCount", 0),
        latency_ms=latency,
    )


async def _call_openai_compatible(
    messages: List[LLMMessage],
    config: LLMConfig,
    client: httpx.AsyncClient,
    provider: LLMProvider,
) -> LLMResponse:
    """Call any OpenAI-compatible API (Groq, DeepSeek, NVIDIA NIM, OpenAI)."""
    provider_configs = {
        LLMProvider.GROQ: {
            "key": os.getenv("GROQ_API_KEY", ""),
            "base": os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1"),
            "model": os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        },
        LLMProvider.DEEPSEEK: {
            "key": os.getenv("DEEPSEEK_API_KEY", ""),
            "base": os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1"),
            "model": os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
        },
        LLMProvider.NVIDIA: {
            "key": os.getenv("NVIDIA_NIM_KEY", ""),
            "base": os.getenv("NVIDIA_NIM_BASE_URL", "https://integrate.api.nvidia.com/v1"),
            "model": os.getenv("NVIDIA_NIM_MODEL", "meta/llama-3.1-70b-instruct"),
        },
        LLMProvider.OPENAI: {
            "key": os.getenv("OPENAI_API_KEY", ""),
            "base": os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
            "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        },
    }

    cfg = provider_configs[provider]
    oai_messages = [{"role": m.role, "content": m.content} for m in messages]

    # Inject system prompt if not already present
    if not any(m["role"] == "system" for m in oai_messages):
        oai_messages.insert(0, {"role": "system", "content": config.system_prompt})

    t0 = time.perf_counter()
    resp = await client.post(
        f"{cfg['base']}/chat/completions",
        headers={"Authorization": f"Bearer {cfg['key']}", "Content-Type": "application/json"},
        json={
            "model": cfg["model"],
            "messages": oai_messages,
            "temperature": config.temperature,
            "max_tokens": config.max_tokens,
            "stream": False,
        },
        timeout=config.timeout_seconds,
    )
    resp.raise_for_status()
    data = resp.json()
    latency = int((time.perf_counter() - t0) * 1000)

    usage = data.get("usage", {})
    return LLMResponse(
        content=data["choices"][0]["message"]["content"],
        provider=provider,
        model=cfg["model"],
        prompt_tokens=usage.get("prompt_tokens", 0),
        completion_tokens=usage.get("completion_tokens", 0),
        latency_ms=latency,
    )


# ── Main LLMProvider class ──────────────────────────────────

class LLMClient:
    """Unified LLM client with automatic provider fallback and caching.

    Usage::

        client = LLMClient()
        response = await client.chat([
            LLMMessage(role="user", content="Best treatment for tomato blight?")
        ])
        print(response.content)
    """

    def __init__(self, config: Optional[LLMConfig] = None) -> None:
        self.config = config or LLMConfig()
        self._http: Optional[httpx.AsyncClient] = None

    async def _get_http(self) -> httpx.AsyncClient:
        if self._http is None or self._http.is_closed:
            self._http = httpx.AsyncClient(
                timeout=httpx.Timeout(self.config.timeout_seconds),
                headers={"User-Agent": "KisanSeva-Agent/1.0"},
            )
        return self._http

    async def close(self) -> None:
        if self._http and not self._http.is_closed:
            await self._http.aclose()

    async def chat(
        self,
        messages: List[LLMMessage],
        system_prompt: Optional[str] = None,
        use_cache: bool = True,
    ) -> LLMResponse:
        """Send messages to the best available LLM provider.

        Tries primary provider, then falls back in order.

        Args:
            messages: Conversation history.
            system_prompt: Override the default system prompt.
            use_cache: Return cached response if available.

        Returns:
            LLMResponse from the first successful provider.
        """
        if system_prompt:
            self.config.system_prompt = system_prompt

        # Cache check
        cache_key = _cache_key(messages, self.config.primary.value)
        if use_cache:
            cached = _cache_get(cache_key, self.config.cache_ttl)
            if cached:
                logger.debug("LLM cache hit")
                return LLMResponse(
                    content=cached, provider="cache", model="cache",
                    prompt_tokens=0, completion_tokens=0,
                    latency_ms=0, cached=True,
                )

        client = await self._get_http()
        providers = [self.config.primary] + self.config.fallbacks

        last_error: Optional[Exception] = None
        for provider in providers:
            try:
                logger.info(f"Calling LLM provider: {provider.value}")
                if provider == LLMProvider.GEMINI:
                    response = await _call_gemini(messages, self.config, client)
                else:
                    response = await _call_openai_compatible(messages, self.config, client, provider)

                # Cache successful response
                if use_cache:
                    _cache_set(cache_key, response.content)

                logger.info(
                    f"LLM response: provider={provider.value} "
                    f"tokens={response.prompt_tokens}+{response.completion_tokens} "
                    f"latency={response.latency_ms}ms"
                )
                return response

            except httpx.HTTPStatusError as e:
                logger.warning(f"[{provider.value}] HTTP {e.response.status_code}: {e.response.text[:200]}")
                last_error = e
            except httpx.TimeoutException:
                logger.warning(f"[{provider.value}] Timeout after {self.config.timeout_seconds}s")
                last_error = TimeoutError(f"{provider.value} timed out")
            except Exception as e:
                logger.warning(f"[{provider.value}] Error: {e}")
                last_error = e

        # All providers failed — return error response
        logger.error(f"All LLM providers failed. Last error: {last_error}")
        return LLMResponse(
            content="I'm having trouble connecting to the AI service right now. Please try again shortly.",
            provider="none", model="none",
            prompt_tokens=0, completion_tokens=0,
            latency_ms=0, error=str(last_error),
        )

    async def complete(self, prompt: str, **kwargs: Any) -> str:
        """Simple single-turn completion shorthand.

        Args:
            prompt: User prompt text.
            **kwargs: Forwarded to chat().

        Returns:
            Response text string.
        """
        response = await self.chat([LLMMessage(role="user", content=prompt)], **kwargs)
        return response.content

    async def translate(self, text: str, target_lang: str) -> str:
        """Translate agricultural text to a target language.

        Args:
            text: English advisory text.
            target_lang: Target language code (hi, ta, te, kn, bn).

        Returns:
            Translated text, or original if translation fails.
        """
        lang_names = {
            "hi": "Hindi", "ta": "Tamil", "te": "Telugu",
            "kn": "Kannada", "bn": "Bengali", "mr": "Marathi", "gu": "Gujarati",
        }
        lang_name = lang_names.get(target_lang, "Hindi")
        prompt = (
            f"Translate the following agricultural advisory to {lang_name}. "
            f"Use simple vocabulary that rural farmers understand. "
            f"Keep numbers, chemical names, and units (g/L, mm, qtl) unchanged.\n\n"
            f"Text: {text}"
        )
        try:
            return await self.complete(prompt, use_cache=True)
        except Exception as e:
            logger.warning(f"Translation failed: {e}")
            return text  # Fallback to original

    async def classify_intent(self, query: str, lang: str = "en") -> Dict[str, Any]:
        """Use LLM to classify farmer query intent.

        Args:
            query: Farmer's query in any language.
            lang: Detected language code.

        Returns:
            Dict with primary_intent, confidence, entities.
        """
        prompt = f"""Classify this farmer query into one of these intents:
disease_diagnosis | irrigation_advice | fertilizer_advice | price_check |
price_alert | weather_query | pest_info | general_crop_advice | help

Query: "{query}"

Respond ONLY with valid JSON:
{{"primary_intent": "...", "confidence": 0.0-1.0, "crop": "or null", "location": "or null", "requires_image": true/false}}"""

        try:
            response = await self.complete(prompt, use_cache=True)
            # Extract JSON from response
            start = response.find("{")
            end   = response.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(response[start:end])
        except Exception as e:
            logger.warning(f"LLM intent classification failed: {e}")

        # Fallback: keyword-based
        q = query.lower()
        if any(w in q for w in ["disease", "blight", "spot", "rot", "rog", "bimari", "पत्ती", "धब्बे"]):
            return {"primary_intent": "disease_diagnosis", "confidence": 0.7, "crop": None, "requires_image": True}
        if any(w in q for w in ["price", "mandi", "bhav", "daam", "भाव"]):
            return {"primary_intent": "price_check", "confidence": 0.8, "crop": None, "requires_image": False}
        if any(w in q for w in ["water", "irrigation", "paani", "सिंचाई"]):
            return {"primary_intent": "irrigation_advice", "confidence": 0.75, "crop": None, "requires_image": False}
        if any(w in q for w in ["fertilizer", "urea", "dap", "khad", "खाद"]):
            return {"primary_intent": "fertilizer_advice", "confidence": 0.75, "crop": None, "requires_image": False}
        return {"primary_intent": "general_crop_advice", "confidence": 0.5, "crop": None, "requires_image": False}

    async def generate_advisory(
        self,
        disease: str,
        crop: str,
        severity: str,
        treatment_steps: List[str],
        lang: str = "en",
    ) -> str:
        """Generate a warm, conversational advisory from structured diagnosis data.

        Args:
            disease: Disease name.
            crop: Crop name.
            severity: low | moderate | high | critical.
            treatment_steps: List of treatment strings.
            lang: Target language.

        Returns:
            Farmer-friendly advisory paragraph.
        """
        lang_names = {"hi": "Hindi", "ta": "Tamil", "te": "Telugu", "en": "English"}
        lang_name = lang_names.get(lang, "English")
        steps_text = "\n".join(f"{i+1}. {s}" for i, s in enumerate(treatment_steps))

        prompt = f"""Write a warm, concise advisory for an Indian smallholder farmer in {lang_name}.

Diagnosis: {disease} on {crop} (severity: {severity})
Treatment steps: 
{steps_text}

Guidelines:
- Use simple language farmers understand
- Be encouraging but honest about severity
- Keep it under 100 words
- If severity is high/critical, add urgency
- Do NOT use markdown formatting"""

        return await self.complete(prompt, use_cache=False)


# ── Singleton factory ───────────────────────────────────────
_default_client: Optional[LLMClient] = None


def get_llm_client() -> LLMClient:
    """Get or create the shared LLMClient singleton."""
    global _default_client
    if _default_client is None:
        _default_client = LLMClient()
    return _default_client
