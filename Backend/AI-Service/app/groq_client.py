"""
Thin wrapper around the Groq chat-completions API.

All prompts instruct the model to return ONLY the requested text with no
preamble/explanation/quotes, since responses are inserted directly into the
post composer / comment box on the frontend.
"""

import logging

from fastapi import HTTPException, status
from groq import Groq, GroqError

from app.config import settings

logger = logging.getLogger("ai-service")

_client: Groq | None = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        if not settings.groq_api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is not configured (missing GROQ_API_KEY).",
            )
        _client = Groq(api_key=settings.groq_api_key)
    return _client


def _complete(system_prompt: str, user_prompt: str, max_tokens: int | None = None) -> str:
    client = _get_client()
    try:
        completion = client.chat.completions.create(
            model=settings.groq_model,
            temperature=settings.groq_temperature,
            max_tokens=max_tokens or settings.groq_max_tokens,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
    except GroqError as exc:
        logger.error("Groq API error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI provider is temporarily unavailable. Please try again.",
        ) from exc

    content = completion.choices[0].message.content or ""
    return content.strip().strip('"').strip()


# ── Feature-specific prompts ─────────────────────────────────────────────────


def fix_grammar(text: str) -> str:
    system = (
        "You are a grammar and spelling correction assistant for a corporate social "
        "network. Correct grammar, spelling, and punctuation mistakes in the user's "
        "text. Preserve the original meaning, tone, language, and formatting "
        "(including line breaks, @mentions, emoji) as closely as possible. Do not "
        "rewrite the style or add new content. Return ONLY the corrected text, with "
        "no explanation, no quotes, and no preamble."
    )
    return _complete(system, text)


def rewrite(text: str, tone: str) -> str:
    tone_instructions = {
        "PROFESSIONAL": "clear, polished, and professional",
        "FRIENDLY": "warm, casual, and friendly",
        "CONCISE": "as short and to-the-point as possible while keeping the key message",
        "ENTHUSIASTIC": "upbeat, energetic, and enthusiastic",
        "FORMAL": "formal and business-appropriate",
    }
    style = tone_instructions.get(tone, "clear and professional")
    system = (
        f"You are a writing assistant for a corporate social network. Rewrite the "
        f"user's post so it sounds {style}, while keeping the same core meaning, "
        f"facts, @mentions, and language. Keep it roughly the same length unless the "
        f"tone requires otherwise. Return ONLY the rewritten text, with no "
        f"explanation, no quotes, and no preamble."
    )
    return _complete(system, text)


def generate_paragraph(topic: str, post_type: str | None, tone: str) -> str:
    tone_instructions = {
        "PROFESSIONAL": "clear, polished, and professional",
        "FRIENDLY": "warm, casual, and friendly",
        "CONCISE": "short and to-the-point (2-3 sentences)",
        "ENTHUSIASTIC": "upbeat and enthusiastic",
        "FORMAL": "formal and business-appropriate",
    }
    style = tone_instructions.get(tone, "clear and professional")
    type_hint = f" The post is of type '{post_type}'." if post_type else ""
    system = (
        f"You are a writing assistant for an internal corporate social network. "
        f"Write a single ready-to-publish post paragraph (2-5 sentences, no title, "
        f"no hashtags, no markdown) in a {style} tone, based on the topic or "
        f"instructions given by the user.{type_hint} Return ONLY the generated "
        f"paragraph, with no explanation, no quotes, and no preamble."
    )
    return _complete(system, topic, max_tokens=350)


def suggest_comments(post_content: str, post_type: str | None, count: int) -> list[str]:
    type_hint = f" (post type: {post_type})" if post_type else ""
    system = (
        f"You are a helpful assistant suggesting short, genuine, relevant comments "
        f"employees could post in response to a colleague's post on an internal "
        f"corporate social network{type_hint}. Suggest exactly {count} short, "
        f"varied comments (each under 25 words). They should sound natural, human, "
        f"and appropriate for a professional workplace (e.g. supportive, curious, "
        f"congratulatory, or a follow-up question, depending on what fits the post). "
        f"Avoid repeating the same opening words across suggestions. Return ONLY a "
        f"numbered list, one comment per line, formatted as:\n1. ...\n2. ...\nNo "
        f"other text."
    )
    raw = _complete(system, post_content, max_tokens=300)

    suggestions: list[str] = []
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        # Strip leading "1.", "1)", "-", "*" style list markers.
        stripped = line.lstrip("0123456789").lstrip(".)-* ").strip()
        if stripped:
            suggestions.append(stripped)

    return suggestions[:count] if suggestions else [raw] if raw else []
