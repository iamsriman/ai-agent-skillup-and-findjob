import asyncio
import logging
from collections.abc import Mapping, Sequence
from typing import Any

from fastapi import APIRouter, HTTPException

from ..agents import agent
from .schemas import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")
AGENT_TIMEOUT_SECONDS = 90


def _text_from_content(content: Any) -> str:
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, Mapping):
        text = content.get("text")
        if isinstance(text, str):
            return text.strip()
        if text is not None:
            return _text_from_content(text)
        nested_content = content.get("content")
        if nested_content is not None:
            return _text_from_content(nested_content)
        return ""

    if isinstance(content, Sequence) and not isinstance(content, (str, bytes)):
        parts = [_text_from_content(block) for block in content]
        return "\n".join(part for part in parts if part)

    text = getattr(content, "text", None)
    if isinstance(text, str):
        return text.strip()

    nested_content = getattr(content, "content", None)
    if nested_content is not None:
        return _text_from_content(nested_content)
    return ""


def extract_assistant_text(result: Any) -> str:
    if not isinstance(result, Mapping):
        raise ValueError("Agent returned an unexpected result.")

    messages = result.get("messages")
    if not isinstance(messages, Sequence) or isinstance(messages, (str, bytes)):
        raise ValueError("Agent response did not contain a messages list.")

    for message in reversed(messages):
        if isinstance(message, Mapping):
            message_type = message.get("type") or message.get("role")
            content = message.get("content")
        else:
            message_type = getattr(message, "type", None) or getattr(
                message, "role", None
            )
            content = getattr(message, "content", None)

        if message_type in ("ai", "assistant"):
            text = _text_from_content(content)
            if text:
                return text

    raise ValueError("Agent response did not contain assistant text.")


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(
                agent.invoke,
                {"messages": [{"role": "user", "content": request.message}]},
            ),
            timeout=AGENT_TIMEOUT_SECONDS,
        )
        response_text = extract_assistant_text(result)
        return ChatResponse(response=response_text, success=True)
    except asyncio.TimeoutError as exc:
        logger.warning("Agent request timed out after %s seconds", AGENT_TIMEOUT_SECONDS)
        raise HTTPException(
            status_code=504,
            detail="The request took too long. Please try again.",
        ) from exc
    except Exception as exc:
        logger.exception("Agent request failed")
        raise HTTPException(
            status_code=502,
            detail="The assistant could not complete your request. Please try again.",
        ) from exc
