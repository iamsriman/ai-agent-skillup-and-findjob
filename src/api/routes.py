import asyncio
import logging
from collections.abc import Mapping, Sequence
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from ..agents import agent
from .auth import get_current_user                      # NEW
from .db import (                                       # NEW
    create_conversation,
    delete_conversation,
    get_conversation,
    list_conversations,
    touch_conversation,
)
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


@router.get("/conversations")
def get_conversations(user: dict = Depends(get_current_user)) -> list[dict]:
    """Sidebar list: all chats of the logged-in user."""
    return list_conversations(user["id"])


@router.get("/conversations/{conversation_id}/messages")
def get_conversation_messages(
    conversation_id: str, user: dict = Depends(get_current_user)
) -> dict:
    """Load one full chat. Messages come from the CHECKPOINTER, not our tables."""
    if not get_conversation(user["id"], conversation_id):
        raise HTTPException(status_code=404, detail="Conversation not found")

    config = {"configurable": {"thread_id": conversation_id}}
    state = agent.get_state(config)

    messages = []
    if state and state.values:
        for m in state.values.get("messages", []):
            role = getattr(m, "type", None) or getattr(m, "role", "")
            if role not in ("human", "ai"):
                continue  # skip tool calls / system messages
            content = getattr(m, "content", "")
            if not isinstance(content, str):
                content = str(content)
            messages.append({"role": role, "content": content})
    return {"conversation_id": conversation_id, "messages": messages}


@router.delete("/conversations/{conversation_id}")
def remove_conversation(
    conversation_id: str, user: dict = Depends(get_current_user)
) -> dict[str, bool]:
    if not delete_conversation(user["id"], conversation_id):
        raise HTTPException(status_code=404, detail="Conversation not found")
    try:
        agent.checkpointer.delete_thread(conversation_id)  # also wipe saved messages
    except Exception:
        pass  # older langgraph versions: row deletion is enough
    return {"success": True}


# ---------------- updated chat endpoint ----------------

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, user: dict = Depends(get_current_user)) -> ChatResponse:
    conversation_id = request.conversation_id

    if conversation_id:
        # Must own this conversation
        if not get_conversation(user["id"], conversation_id):
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        # First message of a new chat -> create it
        conversation_id = create_conversation(user["id"], request.message[:50])

    config = {"configurable": {"thread_id": conversation_id}}

    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(
                agent.invoke,
                {"messages": [{"role": "user", "content": request.message}]},
                config,
            ),
            timeout=AGENT_TIMEOUT_SECONDS,
        )

        print("\n===== TOKEN DEBUG =====")

        for message in result.get("messages", []):
            usage = getattr(message, "usage_metadata", None)

            if usage:
                print("Message type:", getattr(message, "type", None))
                print("Usage:", usage)

        print("=======================\n")

        touch_conversation(conversation_id)

        response_text = extract_assistant_text(result)

        return ChatResponse(
            response=response_text,
            success=True,
            conversation_id=conversation_id,
        )

    except asyncio.TimeoutError as exc:
        logger.warning("Agent request timed out")
        raise HTTPException(
            status_code=504,
            detail="The request took too long."
        ) from exc

    except Exception as exc:
        logger.exception("Agent request failed")
        raise HTTPException(
            status_code=502,
            detail="Assistant error. Try again."
        ) from exc