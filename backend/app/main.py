from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1_router import v1_router
from app.core.config import get_settings
from app.core.errors import AppError, app_error_handler
from app.middleware.auth import AuthContextMiddleware


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name)

    # Add CORS middleware for frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000",
                       "http://172.16.40.156:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_middleware(AuthContextMiddleware)
    app.add_exception_handler(AppError, app_error_handler)

    # Serve media files (videos, thumbnails)
    from fastapi.staticfiles import StaticFiles
    import os
    media_dir = os.path.abspath(os.path.join(
        os.path.dirname(__file__), '../media'))
    app.mount("/media", StaticFiles(directory=media_dir), name="media")

    app.include_router(v1_router)

    @app.get("/healthz")
    async def healthz() -> dict:
        """Simple health check endpoint that doesn't require DB"""
        return {"ok": True, "status": "healthy"}

    @app.get("/")
    async def root() -> dict:
        """API root endpoint"""
        return {
            "name": settings.app_name,
            "version": "1.0.0",
            "status": "running"
        }

    return app


app = create_app()
