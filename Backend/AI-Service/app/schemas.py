from enum import Enum
from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """Mirrors tn.moonside.*.dtos.responses.ApiResponse so the frontend's
    shared `apiFetch` helper (which unwraps `.data`) works unmodified."""

    success: bool
    message: str
    data: T | None = None

    @classmethod
    def ok(cls, data: T, message: str = "Operation successful") -> "ApiResponse[T]":
        return cls(success=True, message=message, data=data)


class Tone(str, Enum):
    PROFESSIONAL = "PROFESSIONAL"
    FRIENDLY = "FRIENDLY"
    CONCISE = "CONCISE"
    ENTHUSIASTIC = "ENTHUSIASTIC"
    FORMAL = "FORMAL"


# ── Grammar fix ──────────────────────────────────────────────────────────────


class GrammarFixRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)


class GrammarFixResponse(BaseModel):
    original: str
    corrected: str
    changed: bool


# ── Rewrite ──────────────────────────────────────────────────────────────────


class RewriteRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    tone: Tone = Tone.PROFESSIONAL


class RewriteResponse(BaseModel):
    original: str
    rewritten: str
    tone: Tone


# ── Generate paragraph ────────────────────────────────────────────────────────


class GenerateRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=1000)
    post_type: str | None = Field(default=None, alias="postType")
    tone: Tone = Tone.PROFESSIONAL

    model_config = {"populate_by_name": True}


class GenerateResponse(BaseModel):
    generated: str


# ── Comment suggestions ───────────────────────────────────────────────────────


class CommentSuggestionsRequest(BaseModel):
    post_content: str = Field(..., min_length=1, max_length=5000, alias="postContent")
    post_type: str | None = Field(default=None, alias="postType")
    count: int = Field(default=3, ge=1, le=5)

    model_config = {"populate_by_name": True}


class CommentSuggestionsResponse(BaseModel):
    suggestions: list[str]
