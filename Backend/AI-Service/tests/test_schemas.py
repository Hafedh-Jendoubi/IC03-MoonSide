"""Unit tests for app.schemas (Pydantic request/response models)."""
import pytest
from pydantic import ValidationError

from app.schemas import (
    ApiResponse,
    CommentSuggestionsRequest,
    GenerateRequest,
    GrammarFixRequest,
    RewriteRequest,
    Tone,
)


class TestApiResponse:
    def test_ok_builds_success_envelope_with_default_message(self):
        resp = ApiResponse.ok({"foo": "bar"})
        assert resp.success is True
        assert resp.message == "Operation successful"
        assert resp.data == {"foo": "bar"}

    def test_ok_accepts_custom_message(self):
        resp = ApiResponse.ok(None, message="Nothing to report")
        assert resp.message == "Nothing to report"
        assert resp.data is None


class TestGrammarFixRequest:
    def test_rejects_empty_text(self):
        with pytest.raises(ValidationError):
            GrammarFixRequest(text="")

    def test_rejects_text_over_max_length(self):
        with pytest.raises(ValidationError):
            GrammarFixRequest(text="a" * 5001)

    def test_accepts_valid_text(self):
        req = GrammarFixRequest(text="hello world")
        assert req.text == "hello world"


class TestRewriteRequest:
    def test_defaults_to_professional_tone(self):
        req = RewriteRequest(text="hello")
        assert req.tone == Tone.PROFESSIONAL

    def test_rejects_unknown_tone(self):
        with pytest.raises(ValidationError):
            RewriteRequest(text="hello", tone="MADE_UP_TONE")


class TestGenerateRequest:
    def test_accepts_camel_case_alias_for_post_type(self):
        req = GenerateRequest(topic="Q3 recap", postType="ANNOUNCEMENT")
        assert req.post_type == "ANNOUNCEMENT"

    def test_accepts_snake_case_via_populate_by_name(self):
        req = GenerateRequest(topic="Q3 recap", post_type="ANNOUNCEMENT")
        assert req.post_type == "ANNOUNCEMENT"

    def test_post_type_defaults_to_none(self):
        req = GenerateRequest(topic="Q3 recap")
        assert req.post_type is None

    def test_rejects_empty_topic(self):
        with pytest.raises(ValidationError):
            GenerateRequest(topic="")


class TestCommentSuggestionsRequest:
    def test_default_count_is_three(self):
        req = CommentSuggestionsRequest(postContent="Shipped a new feature!")
        assert req.count == 3

    def test_rejects_count_above_max(self):
        with pytest.raises(ValidationError):
            CommentSuggestionsRequest(postContent="hi", count=6)

    def test_rejects_count_below_min(self):
        with pytest.raises(ValidationError):
            CommentSuggestionsRequest(postContent="hi", count=0)

    def test_accepts_alias_and_snake_case_field(self):
        via_alias = CommentSuggestionsRequest(postContent="hi", postType="UPDATE")
        via_name = CommentSuggestionsRequest(post_content="hi", post_type="UPDATE")
        assert via_alias.post_content == "hi"
        assert via_alias.post_type == "UPDATE"
        assert via_name.post_content == "hi"
        assert via_name.post_type == "UPDATE"
