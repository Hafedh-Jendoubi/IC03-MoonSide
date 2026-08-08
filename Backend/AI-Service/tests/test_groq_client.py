"""Unit tests for app.groq_client."""
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException
from groq import GroqError

import app.groq_client as groq_client


def _fake_completion(content: str):
    """Build an object shaped like the Groq SDK's ChatCompletion response."""
    message = SimpleNamespace(content=content)
    choice = SimpleNamespace(message=message)
    return SimpleNamespace(choices=[choice])


@pytest.fixture(autouse=True)
def _reset_client_singleton():
    """`_client` is a module-level singleton; make sure tests don't leak state."""
    groq_client._client = None
    yield
    groq_client._client = None


class TestGetClient:
    def test_raises_503_when_api_key_missing(self, monkeypatch):
        from app.config import settings

        monkeypatch.setattr(settings, "groq_api_key", "")
        with pytest.raises(HTTPException) as exc_info:
            groq_client._get_client()
        assert exc_info.value.status_code == 503

    def test_builds_client_once_and_caches_it(self, monkeypatch):
        from app.config import settings

        monkeypatch.setattr(settings, "groq_api_key", "gsk_test")
        created = MagicMock(name="GroqInstance")
        constructor = MagicMock(return_value=created)
        monkeypatch.setattr(groq_client, "Groq", constructor)

        first = groq_client._get_client()
        second = groq_client._get_client()

        assert first is created
        assert second is created
        constructor.assert_called_once_with(api_key="gsk_test")


class TestComplete:
    def test_strips_whitespace_and_surrounding_quotes(self, monkeypatch):
        fake_client = MagicMock()
        fake_client.chat.completions.create.return_value = _fake_completion(
            '  "Hello there"  '
        )
        monkeypatch.setattr(groq_client, "_get_client", lambda: fake_client)

        result = groq_client._complete("system prompt", "user prompt")
        assert result == "Hello there"

    def test_passes_model_and_temperature_from_settings(self, monkeypatch):
        from app.config import settings

        fake_client = MagicMock()
        fake_client.chat.completions.create.return_value = _fake_completion("ok")
        monkeypatch.setattr(groq_client, "_get_client", lambda: fake_client)

        groq_client._complete("sys", "usr")

        _, kwargs = fake_client.chat.completions.create.call_args
        assert kwargs["model"] == settings.groq_model
        assert kwargs["temperature"] == settings.groq_temperature
        assert kwargs["max_tokens"] == settings.groq_max_tokens
        assert kwargs["messages"] == [
            {"role": "system", "content": "sys"},
            {"role": "user", "content": "usr"},
        ]

    def test_custom_max_tokens_overrides_settings_default(self, monkeypatch):
        fake_client = MagicMock()
        fake_client.chat.completions.create.return_value = _fake_completion("ok")
        monkeypatch.setattr(groq_client, "_get_client", lambda: fake_client)

        groq_client._complete("sys", "usr", max_tokens=42)

        _, kwargs = fake_client.chat.completions.create.call_args
        assert kwargs["max_tokens"] == 42

    def test_handles_missing_message_content(self, monkeypatch):
        fake_client = MagicMock()
        fake_client.chat.completions.create.return_value = _fake_completion(None)
        monkeypatch.setattr(groq_client, "_get_client", lambda: fake_client)

        assert groq_client._complete("sys", "usr") == ""

    def test_groq_error_is_translated_to_502(self, monkeypatch):
        fake_client = MagicMock()
        fake_client.chat.completions.create.side_effect = GroqError("upstream down")
        monkeypatch.setattr(groq_client, "_get_client", lambda: fake_client)

        with pytest.raises(HTTPException) as exc_info:
            groq_client._complete("sys", "usr")
        assert exc_info.value.status_code == 502


class TestFeaturePrompts:
    def test_fix_grammar_delegates_to_complete(self, monkeypatch):
        captured = {}

        def fake_complete(system, user, max_tokens=None):
            captured["system"] = system
            captured["user"] = user
            captured["max_tokens"] = max_tokens
            return "corrected text"

        monkeypatch.setattr(groq_client, "_complete", fake_complete)
        result = groq_client.fix_grammar("some text with erors")

        assert result == "corrected text"
        assert captured["user"] == "some text with erors"
        assert "grammar" in captured["system"].lower()

    @pytest.mark.parametrize(
        "tone,expected_fragment",
        [
            ("PROFESSIONAL", "professional"),
            ("FRIENDLY", "friendly"),
            ("CONCISE", "short and to-the-point"),
            ("ENTHUSIASTIC", "enthusiastic"),
            ("FORMAL", "formal"),
            ("SOME_UNKNOWN_TONE", "clear and professional"),
        ],
    )
    def test_rewrite_maps_tone_to_style_instruction(
        self, monkeypatch, tone, expected_fragment
    ):
        captured = {}

        def fake_complete(system, user, max_tokens=None):
            captured["system"] = system
            return "rewritten"

        monkeypatch.setattr(groq_client, "_complete", fake_complete)
        groq_client.rewrite("original text", tone)

        assert expected_fragment in captured["system"]

    def test_generate_paragraph_includes_post_type_hint(self, monkeypatch):
        captured = {}

        def fake_complete(system, user, max_tokens=None):
            captured["system"] = system
            captured["max_tokens"] = max_tokens
            return "generated paragraph"

        monkeypatch.setattr(groq_client, "_complete", fake_complete)
        result = groq_client.generate_paragraph("Q3 results", "ANNOUNCEMENT", "FORMAL")

        assert result == "generated paragraph"
        assert "ANNOUNCEMENT" in captured["system"]
        assert captured["max_tokens"] == 350

    def test_generate_paragraph_omits_hint_when_no_post_type(self, monkeypatch):
        captured = {}

        def fake_complete(system, user, max_tokens=None):
            captured["system"] = system
            return "generated"

        monkeypatch.setattr(groq_client, "_complete", fake_complete)
        groq_client.generate_paragraph("topic", None, "FRIENDLY")

        assert "post is of type" not in captured["system"]

    def test_suggest_comments_parses_numbered_list(self, monkeypatch):
        raw = "1. Great work!\n2. Congrats on the launch\n3. Nice job team"
        monkeypatch.setattr(groq_client, "_complete", lambda *a, **k: raw)

        result = groq_client.suggest_comments("We shipped v2!", "UPDATE", 3)

        assert result == ["Great work!", "Congrats on the launch", "Nice job team"]

    def test_suggest_comments_strips_bullet_and_dash_markers(self, monkeypatch):
        raw = "- Nice one\n* Well done\n1) Solid work"
        monkeypatch.setattr(groq_client, "_complete", lambda *a, **k: raw)

        result = groq_client.suggest_comments("post", None, 3)

        assert result == ["Nice one", "Well done", "Solid work"]

    def test_suggest_comments_truncates_to_requested_count(self, monkeypatch):
        raw = "1. one\n2. two\n3. three\n4. four\n5. five"
        monkeypatch.setattr(groq_client, "_complete", lambda *a, **k: raw)

        result = groq_client.suggest_comments("post", None, 2)

        assert result == ["one", "two"]

    def test_suggest_comments_falls_back_to_raw_when_unparseable(self, monkeypatch):
        # A raw response that becomes empty after marker-stripping on every line
        # still yields something rather than silently returning [] when non-empty.
        monkeypatch.setattr(groq_client, "_complete", lambda *a, **k: "just one line")

        result = groq_client.suggest_comments("post", None, 3)

        assert result == ["just one line"]

    def test_suggest_comments_returns_empty_list_for_blank_response(self, monkeypatch):
        monkeypatch.setattr(groq_client, "_complete", lambda *a, **k: "")

        result = groq_client.suggest_comments("post", None, 3)

        assert result == []
