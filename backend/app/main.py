from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database.connection import init_db
from app.api import applications, model_info, assistant
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the database tables on startup."""
    print("[CredIntel] Initializing database...")
    init_db()
    print("[CredIntel] Database ready.")
    yield
    print("[CredIntel] Shutting down.")


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Backend API for CredIntel AI — Intelligent Loan Analysis & Decision Support Platform. "
        "Powered by a Random Forest model trained on the German Credit dataset."
    ),
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS middleware — allow the Vite dev server and production frontend
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(applications.router)
app.include_router(model_info.router)
app.include_router(assistant.router)


# ---------------------------------------------------------------------------
# Core endpoints
# ---------------------------------------------------------------------------
@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint to verify the backend is running."""
    return {
        "status": "ok",
        "message": "CredIntel AI backend is up and running!",
        "version": settings.VERSION,
    }


@app.get("/", tags=["System"])
async def root():
    """Root redirect hint."""
    return {
        "message": "Welcome to CredIntel AI API",
        "docs": "/docs",
        "health": "/health",
    }
