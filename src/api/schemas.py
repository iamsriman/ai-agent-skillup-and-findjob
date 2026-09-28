from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


# ---------- auth ----------

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None

    @field_validator("password")
    @classmethod
    def password_min_length(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ---------- chat ----------

class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None  # null = start a new chat

    @field_validator("message")
    @classmethod
    def message_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message cannot be empty.")
        return value


class ChatResponse(BaseModel):
    response: str
    success: bool
    conversation_id: str


class MessageOut(BaseModel):
    role: str  # "human" or "ai"
    content: str