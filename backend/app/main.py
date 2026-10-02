"""StreamSense API — FastAPI entry point.

AI-powered citizen science platform for urban stream health monitoring.
Part of the OneAquaHealth IEEE Global Hackathon 2026.
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.router import api_router
from app.config import settings
from app.database import engine
from app.middleware.errors import register_exception_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events.

    On startup: verify database connectivity via a SELECT 1 probe.
    On shutdown: dispose the engine connection pool.
    """
    print("🌊 StreamSense API starting up...")
    # Verify database connectivity
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        print("✅ Database connected")
    except Exception as e:
        print(f"⚠️  Database connection failed: {e}")
        print("   The API will start but database-dependent endpoints will fail.")

    yield

    # Cleanup
    await engine.dispose()
    print("🌊 StreamSense API shut down.")


app = FastAPI(
    title="StreamSense API",
    description=(
        "AI-powered citizen science platform for urban stream health monitoring. "
        "Processes volunteer stream photos through 7 specialized AI agents to produce "
        "validated ecological data and FHIR R4 health resources."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "http://192.168.1.109:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register global exception handlers (consistent JSON error format)
register_exception_handlers(app)

# Mount all API routes under /api/v1
app.include_router(api_router)


@app.get("/health")
async def health_check():
    """Root health check endpoint."""
    return {
        "status": "healthy",
        "service": "streamsense-api",
        "version": "0.1.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
