# Backend — FastAPI API

Production-oriented backend providing video APIs, authentication, and media handling.

## Tech stack

- **FastAPI**
- **PostgreSQL**
- **SQLAlchemy 2.x (async)** + **asyncpg**
- **Alembic** migrations
- **Cookie-based auth** (HttpOnly cookies)
- **Google OAuth 2.0** (optional)
- **httpx** for outbound OAuth calls

## Auth model (important)

- Access JWT + Refresh JWT are stored in **HttpOnly cookies** (tokens are not returned in JSON).
- Server-side session token is stored in DB for revocation.

Endpoints live under:

- `/api/v1/auth/*`

## Google login (OAuth 2.0)

Routes:

- `GET /api/v1/auth/google/login`
- `GET /api/v1/auth/google/callback`

Required env vars (in `backend/.env`):

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (must match Google Console exactly)
- `FRONTEND_BASE_URL`

Cookie note:

- For OAuth redirects, `COOKIE_SAMESITE` should be `lax` in local dev.

## Media storage

Uploads are stored under:

- `backend/media/avatars`
- `backend/media/banners`
- `backend/media/thumbnails`
- `backend/media/videos`

Served from:

- `/media/*`

## Local setup

1) Create a venv and install dependencies:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

2) Configure env:

```bash
copy .env.example .env
```

3) Run migrations:

```bash
alembic upgrade head
```

4) Start API:

```bash
uvicorn app.main:app --reload --port 8000
```

## Useful commands

- `alembic current`
- `alembic history`
- `python -m compileall app`
