"""
Centralized configuration for the AI-Service.

All values are read from environment variables so the service behaves the
same way as the other Moonside Connect microservices (see Backend/docker-compose.yml),
where every service is configured purely through env vars with sane local
defaults for `docker compose up` / running outside Docker.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # ── Service identity ────────────────────────────────────────────────
    app_name: str = "ai-service"
    port: int = 8089

    # ── Eureka service discovery ────────────────────────────────────────
    eureka_uri: str = "http://localhost:8761/eureka/"
    eureka_instance_host: str = "localhost"

    # ── JWT (shared secret with User-Service / all other services) ─────
    # Same default used across the other services' application.properties files,
    # so the AI-Service can validate tokens issued by User-Service out of the box.
    jwt_secret: str = "3cfa76ef14937c1c0ea519f8fc057a80fcd04a7420f8e8bcd0a7567c272e007b"

    # ── Groq (LLM provider) ─────────────────────────────────────────────
    groq_api_key: str = ""
    # openai/gpt-oss-120b is Groq's recommended general-purpose model as of
    # mid-2026 (Llama 3.3 70B Versatile was deprecated). Override via env var
    # if you'd rather use a different model from https://console.groq.com/docs/models
    groq_model: str = "openai/gpt-oss-120b"
    groq_temperature: float = 0.5
    groq_max_tokens: int = 600


settings = Settings()
