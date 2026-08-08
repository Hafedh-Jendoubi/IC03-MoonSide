"""Tests for app.main: health check, exception handlers, and app lifespan."""
from fastapi.testclient import TestClient


class TestHealthEndpoint:
    def test_health_returns_up_and_service_name(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "UP"
        assert body["service"] == "ai-service"


class TestExceptionHandlers:
    def test_404_for_unknown_route_uses_default_fastapi_handling(self, client):
        resp = client.get("/does-not-exist")
        assert resp.status_code == 404

    def test_validation_error_envelope_shape(self, client, auth_headers):
        resp = client.post("/ai/rewrite", json={}, headers=auth_headers)
        assert resp.status_code == 422
        body = resp.json()
        assert body["success"] is False
        assert body["message"] == "Invalid request"
        assert isinstance(body["data"], list)
        assert len(body["data"]) > 0


class TestLifespan:
    def test_eureka_registration_failure_does_not_prevent_startup(self, monkeypatch):
        """If Eureka registration throws, the app must still come up (see the
        broad except/logger.exception in app.main.lifespan)."""
        import py_eureka_client.eureka_client as eureka_client

        async def _boom(*args, **kwargs):
            raise RuntimeError("eureka unreachable")

        async def _fake_stop_async(*args, **kwargs):
            return None

        monkeypatch.setattr(eureka_client, "init_async", _boom)
        monkeypatch.setattr(eureka_client, "stop_async", _fake_stop_async)

        from app.main import app

        with TestClient(app) as test_client:
            resp = test_client.get("/health")
            assert resp.status_code == 200

    def test_eureka_deregistration_failure_does_not_raise_on_shutdown(self, monkeypatch):
        import py_eureka_client.eureka_client as eureka_client

        async def _fake_init_async(*args, **kwargs):
            return None

        async def _boom(*args, **kwargs):
            raise RuntimeError("eureka unreachable on shutdown")

        monkeypatch.setattr(eureka_client, "init_async", _fake_init_async)
        monkeypatch.setattr(eureka_client, "stop_async", _boom)

        from app.main import app

        # Should not raise even though stop_async blows up during teardown.
        with TestClient(app) as test_client:
            test_client.get("/health")
