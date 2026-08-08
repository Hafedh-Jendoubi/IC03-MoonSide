"""
Shared pytest fixtures for the AI-Service test suite.

We stub `py_eureka_client` interactions and force known Settings values
*before* `app.main` is imported anywhere, since `app.config.settings` is a
module-level singleton and several modules (`security`, `groq_client`) close
over it at call time via `from app.config import settings`.
"""
import base64

import pytest
from fastapi.testclient import TestClient

TEST_JWT_SECRET = base64.b64encode(b"unit-test-secret-key-0123456789").decode()
TEST_GROQ_API_KEY = "gsk_test_key"


@pytest.fixture(autouse=True)
def _configure_settings(monkeypatch):
    """Point the shared Settings singleton at deterministic test values."""
    from app.config import settings

    monkeypatch.setattr(settings, "jwt_secret", TEST_JWT_SECRET)
    monkeypatch.setattr(settings, "groq_api_key", TEST_GROQ_API_KEY)
    monkeypatch.setattr(settings, "app_name", "ai-service")
    yield


@pytest.fixture
def client(monkeypatch):
    """A TestClient whose lifespan doesn't try to hit a real Eureka server."""
    import py_eureka_client.eureka_client as eureka_client

    async def _fake_init_async(*args, **kwargs):
        return None

    async def _fake_stop_async(*args, **kwargs):
        return None

    monkeypatch.setattr(eureka_client, "init_async", _fake_init_async)
    monkeypatch.setattr(eureka_client, "stop_async", _fake_stop_async)

    from app.main import app

    with TestClient(app) as test_client:
        yield test_client


def make_token(secret_b64: str = TEST_JWT_SECRET, **claims) -> str:
    """Build a signed JWT the same way User-Service would (HS384, base64 key)."""
    import jwt

    payload = {"sub": "jdoe", "userId": "user-123", "roles": ["EMPLOYEE"]}
    payload.update(claims)
    key = base64.b64decode(secret_b64)
    return jwt.encode(payload, key, algorithm="HS384")


@pytest.fixture
def auth_headers():
    token = make_token()
    return {"Authorization": f"Bearer {token}"}
