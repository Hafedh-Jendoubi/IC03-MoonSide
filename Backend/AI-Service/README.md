# AI-Service

Python FastAPI microservice that powers AI writing assistance across Moonside
Connect, using [Groq](https://console.groq.com) as the LLM provider. It
registers itself with Eureka and is reachable through the Gateway at `/ai/**`,
exactly like every other backend microservice.

## Endpoints

All endpoints require a valid `Authorization: Bearer <jwt>` header (the same
token issued by User-Service on login).

| Method | Path                  | Purpose                                             |
|--------|-----------------------|------------------------------------------------------|
| POST   | `/ai/grammar`         | Fix grammar/spelling/punctuation in a piece of text  |
| POST   | `/ai/rewrite`         | Rewrite text in a chosen tone                        |
| POST   | `/ai/generate`        | Generate a new post paragraph from a topic/prompt    |
| POST   | `/ai/comments/suggest`| Suggest 1-5 short comments for a given post          |
| GET    | `/health`             | Health check (no auth)                               |

Tones: `PROFESSIONAL`, `FRIENDLY`, `CONCISE`, `ENTHUSIASTIC`, `FORMAL`.

### Example

```bash
curl -X POST http://localhost:8080/ai/rewrite \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "we finished the sprint early good job team", "tone": "ENTHUSIASTIC"}'
```

## Local development

```bash
cd Backend/AI-Service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in GROQ_API_KEY
uvicorn app.main:app --reload --port 8089
```

## Configuration

All configuration is via environment variables (see `.env.example` /
`Backend/docker-compose.yml`):

- `GROQ_API_KEY` — required, from https://console.groq.com/keys
- `GROQ_MODEL` — defaults to `openai/gpt-oss-120b` (Groq's general-purpose
  recommendation as of mid-2026; check https://console.groq.com/docs/models
  if you want something else — Groq deprecates models periodically)
- `JWT_SECRET` — must match the other services' shared secret
- `EUREKA_URI`, `EUREKA_INSTANCE_HOST`, `PORT`

CORS is handled solely by the Gateway (`CorsWebFilter`) for every service in
the platform — the AI-Service intentionally does not set its own CORS
headers, to avoid duplicate `Access-Control-Allow-Origin` headers when
requests pass through the Gateway.

If `GROQ_API_KEY` is missing, the AI endpoints return `503` rather than
crashing the service, so the rest of the platform keeps working.
