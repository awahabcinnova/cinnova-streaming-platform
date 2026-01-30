from __future__ import annotations

from fastapi import Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    status_code: int = 400
    code: str = "bad_request"
    message: str = "Bad request"

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.message)
        if message:
            self.message = message


class AuthRequired(AppError):
    status_code = 401
    code = "auth_required"
    message = "Authentication required"


class AuthInvalid(AppError):
    status_code = 401
    code = "auth_invalid"
    message = "Invalid authentication"


class Forbidden(AppError):
    status_code = 403
    code = "forbidden"
    message = "Forbidden"


class Conflict(AppError):
    status_code = 409
    code = "conflict"
    message = "Conflict"


async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message}},
    )
