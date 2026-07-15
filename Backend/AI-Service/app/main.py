import logging
from contextlib import asynccontextmanager

import py_eureka_client.eureka_client as eureka_client
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers.ai import router as ai_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup: register with Eureka so the Gateway can load-balance to us
    # via `lb://AI-SERVICE`, the same way it routes to every other backend
    # microservice (see Backend/Gateway/.../GatewayConfig.java).
    try:
        await eureka_client.init_async(
            eureka_server=settings.eureka_uri,
            app_name=settings.app_name,
            instance_port=settings.port,
            instance_host=settings.eureka_instance_host,
            health_check_url=f"http://{settings.eureka_instance_host}:{settings.port}/health",
        )
        logger.info("Registered with Eureka at %s as '%s'", settings.eureka_uri, settings.app_name)
    except Exception:
        logger.exception("Failed to register with Eureka (service will still run standalone)")

    yield

    try:
        await eureka_client.stop_async()
    except Exception:
        logger.exception("Error while de-registering from Eureka")


app = FastAPI(
    title="Moonside Connect - AI Service",
    description=(
        "Groq-powered AI assistance for posts and comments: grammar fixing, "
        "rewriting, paragraph generation, and comment suggestions."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(ai_router)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": str(exc.detail), "data": None},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"success": False, "message": "Invalid request", "data": exc.errors()},
    )


@app.get("/health")
def health():
    return {"status": "UP", "service": settings.app_name}
