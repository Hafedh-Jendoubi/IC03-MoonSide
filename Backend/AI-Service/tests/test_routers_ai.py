"""Integration tests for app.routers.ai, exercised through FastAPI's TestClient."""
import app.groq_client as groq_client


class TestGrammarEndpoint:
    def test_requires_authentication(self, client):
        resp = client.post("/ai/grammar", json={"text": "helo wrld"})
        assert resp.status_code == 401

    def test_returns_corrected_text(self, client, auth_headers, monkeypatch):
        monkeypatch.setattr(groq_client, "fix_grammar", lambda text: "Hello world")

        resp = client.post("/ai/grammar", json={"text": "helo wrld"}, headers=auth_headers)

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["original"] == "helo wrld"
        assert body["data"]["corrected"] == "Hello world"
        assert body["data"]["changed"] is True

    def test_changed_is_false_when_text_unmodified(self, client, auth_headers, monkeypatch):
        monkeypatch.setattr(groq_client, "fix_grammar", lambda text: text)

        resp = client.post(
            "/ai/grammar", json={"text": "Already correct."}, headers=auth_headers
        )

        assert resp.json()["data"]["changed"] is False

    def test_rejects_empty_text_with_422(self, client, auth_headers):
        resp = client.post("/ai/grammar", json={"text": ""}, headers=auth_headers)
        assert resp.status_code == 422
        body = resp.json()
        assert body["success"] is False
        assert body["message"] == "Invalid request"


class TestRewriteEndpoint:
    def test_returns_rewritten_text_with_requested_tone(self, client, auth_headers, monkeypatch):
        monkeypatch.setattr(groq_client, "rewrite", lambda text, tone: f"[{tone}] {text}")

        resp = client.post(
            "/ai/rewrite",
            json={"text": "we shipped it", "tone": "ENTHUSIASTIC"},
            headers=auth_headers,
        )

        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["rewritten"] == "[ENTHUSIASTIC] we shipped it"
        assert data["tone"] == "ENTHUSIASTIC"

    def test_defaults_tone_to_professional(self, client, auth_headers, monkeypatch):
        captured = {}

        def fake_rewrite(text, tone):
            captured["tone"] = tone
            return "rewritten"

        monkeypatch.setattr(groq_client, "rewrite", fake_rewrite)

        resp = client.post("/ai/rewrite", json={"text": "hi"}, headers=auth_headers)

        assert resp.status_code == 200
        assert captured["tone"] == "PROFESSIONAL"

    def test_invalid_tone_returns_422(self, client, auth_headers):
        resp = client.post(
            "/ai/rewrite", json={"text": "hi", "tone": "SARCASTIC"}, headers=auth_headers
        )
        assert resp.status_code == 422


class TestGenerateEndpoint:
    def test_returns_generated_paragraph(self, client, auth_headers, monkeypatch):
        monkeypatch.setattr(
            groq_client, "generate_paragraph", lambda topic, post_type, tone: "Generated!"
        )

        resp = client.post(
            "/ai/generate",
            json={"topic": "team offsite", "postType": "EVENT", "tone": "FRIENDLY"},
            headers=auth_headers,
        )

        assert resp.status_code == 200
        assert resp.json()["data"]["generated"] == "Generated!"

    def test_requires_authentication(self, client):
        resp = client.post("/ai/generate", json={"topic": "hi"})
        assert resp.status_code == 401


class TestCommentSuggestEndpoint:
    def test_returns_suggestions_list(self, client, auth_headers, monkeypatch):
        monkeypatch.setattr(
            groq_client,
            "suggest_comments",
            lambda content, post_type, count: ["Nice!", "Congrats!"],
        )

        resp = client.post(
            "/ai/comments/suggest",
            json={"postContent": "We launched v2 today", "count": 2},
            headers=auth_headers,
        )

        assert resp.status_code == 200
        assert resp.json()["data"]["suggestions"] == ["Nice!", "Congrats!"]

    def test_rejects_count_above_max_with_422(self, client, auth_headers):
        resp = client.post(
            "/ai/comments/suggest",
            json={"postContent": "hi", "count": 10},
            headers=auth_headers,
        )
        assert resp.status_code == 422

    def test_invalid_bearer_token_returns_401(self, client):
        resp = client.post(
            "/ai/comments/suggest",
            json={"postContent": "hi"},
            headers={"Authorization": "Bearer not-a-real-token"},
        )
        assert resp.status_code == 401
        body = resp.json()
        assert body["success"] is False
