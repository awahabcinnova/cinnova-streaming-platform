# Backend (FastAPI)

Production-oriented FastAPI backend with:

- Cookie-only auth (**no tokens in JSON responses**): short-lived access JWT + long-lived refresh JWT + server-side session token
- PostgreSQL + SQLAlchemy 2.0 async ORM
- Alembic migrations

## Local setup

1. Create a venv and install deps:

```bash
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
```

2. Copy env:

```bash
copy .env.example .env
```

3. Run migrations:

```bash
alembic upgrade head
```

4. Run the API:

```bash
uvicorn app.main:app --reload --port 8000
```

## Notes

- Cookies are set with `HttpOnly`, `Secure` (configurable), and `SameSite=Strict`.
- In production you must use HTTPS and set `COOKIE_SECURE=true`.
