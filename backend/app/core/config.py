from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = Field(default="VideoPlaying API", alias="APP_NAME")
    environment: str = Field(default="dev", alias="ENVIRONMENT")

    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/videoplaying",
        alias="DATABASE_URL",
    )

    jwt_secret_key: str = Field(
        default="CHANGE_ME__32_CHARS_MINIMUM",
        alias="JWT_SECRET_KEY",
    )
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")

    access_token_ttl_seconds: int = Field(
        default=900, alias="ACCESS_TOKEN_TTL_SECONDS")
    refresh_token_ttl_seconds: int = Field(
        default=30 * 24 * 3600, alias="REFRESH_TOKEN_TTL_SECONDS")
    session_ttl_seconds: int = Field(
        default=30 * 24 * 3600, alias="SESSION_TTL_SECONDS")

    cookie_secure: bool = Field(default=False, alias="COOKIE_SECURE")
    cookie_samesite: str = Field(default="lax", alias="COOKIE_SAMESITE")
    cookie_domain: str | None = Field(default=None, alias="COOKIE_DOMAIN")

    cookie_access_name: str = "access_token"
    cookie_refresh_name: str = "refresh_token"
    cookie_session_name: str = "session_token"

    google_client_id: str = Field(default="", alias="GOOGLE_CLIENT_ID")
    google_client_secret: str = Field(default="", alias="GOOGLE_CLIENT_SECRET")
    google_redirect_uri: str = Field(default="http://127.0.0.1:8000/api/v1/auth/google/callback", alias="GOOGLE_REDIRECT_URI")
    frontend_base_url: str = Field(default="http://localhost:3000", alias="FRONTEND_BASE_URL")


_settings: Settings | None = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings() 
    return _settings
