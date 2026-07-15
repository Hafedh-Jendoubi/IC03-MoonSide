import logging

from fastapi import APIRouter, Depends

from app import groq_client
from app.schemas import (
    ApiResponse,
    CommentSuggestionsRequest,
    CommentSuggestionsResponse,
    GenerateRequest,
    GenerateResponse,
    GrammarFixRequest,
    GrammarFixResponse,
    RewriteRequest,
    RewriteResponse,
)
from app.security import CurrentUser, get_current_user

logger = logging.getLogger("ai-service")

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/grammar", response_model=ApiResponse[GrammarFixResponse])
def grammar_fix(
    body: GrammarFixRequest,
    user: CurrentUser = Depends(get_current_user),
) -> ApiResponse[GrammarFixResponse]:
    corrected = groq_client.fix_grammar(body.text)
    result = GrammarFixResponse(
        original=body.text,
        corrected=corrected,
        changed=corrected.strip() != body.text.strip(),
    )
    return ApiResponse.ok(result)


@router.post("/rewrite", response_model=ApiResponse[RewriteResponse])
def rewrite_text(
    body: RewriteRequest,
    user: CurrentUser = Depends(get_current_user),
) -> ApiResponse[RewriteResponse]:
    rewritten = groq_client.rewrite(body.text, body.tone.value)
    result = RewriteResponse(original=body.text, rewritten=rewritten, tone=body.tone)
    return ApiResponse.ok(result)


@router.post("/generate", response_model=ApiResponse[GenerateResponse])
def generate(
    body: GenerateRequest,
    user: CurrentUser = Depends(get_current_user),
) -> ApiResponse[GenerateResponse]:
    generated = groq_client.generate_paragraph(body.topic, body.post_type, body.tone.value)
    return ApiResponse.ok(GenerateResponse(generated=generated))


@router.post("/comments/suggest", response_model=ApiResponse[CommentSuggestionsResponse])
def suggest_comments(
    body: CommentSuggestionsRequest,
    user: CurrentUser = Depends(get_current_user),
) -> ApiResponse[CommentSuggestionsResponse]:
    suggestions = groq_client.suggest_comments(body.post_content, body.post_type, body.count)
    return ApiResponse.ok(CommentSuggestionsResponse(suggestions=suggestions))
