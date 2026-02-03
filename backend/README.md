# Backend — StreamFlow API

Production-oriented backend providing video APIs, authentication, media handling, and search.

**Tech Stack**
- [FastAPI](https://fastapi.tiangolo.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [SQLAlchemy (Async)](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
- [Alembic](https://alembic.sqlalchemy.org/)
- [Pydantic](https://docs.pydantic.dev/)
- [httpx](https://www.python-httpx.org/)

**Auth Model**
- Access JWT + Refresh JWT stored in HttpOnly cookies
- Server-side session stored in DB for revocation

**Google OAuth 2.0**
Routes:
- `GET /api/v1/auth/google/login`
- `GET /api/v1/auth/google/callback`

Required env vars (in `backend/.env`):
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `FRONTEND_BASE_URL`

Cookie note:
- For OAuth redirects, `COOKIE_SAMESITE` should be `lax` in local dev

**Media Storage**
Uploads are stored under:
- `backend/media/avatars`
- `backend/media/banners`
- `backend/media/thumbnails`
- `backend/media/videos`

Served from:
- `/media/*`

**Local Setup**
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

**Useful Commands**
- `alembic current`
- `alembic history`
- `python -m compileall app`
