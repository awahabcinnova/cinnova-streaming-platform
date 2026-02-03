# StreamFlow — Streaming & Video Platform

A modern YouTube-style streaming platform with a FastAPI + PostgreSQL backend and a React (Vite) frontend.

**Tech Stack**
- [FastAPI](https://fastapi.tiangolo.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [SQLAlchemy (Async)](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
- [Alembic](https://alembic.sqlalchemy.org/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [React Router](https://reactrouter.com/)
- [Lucide Icons](https://lucide.dev/)

**Highlights**
- Cookie-based auth with refresh sessions
- Google OAuth 2.0 login
- Watch page, history, likes, subscriptions
- Media hosting via `/media/*`
- User profiles with avatar and banner upload

**Repo Structure**
- `backend/` FastAPI app, auth, models, migrations, media storage, API routes
- `frontend/` React UI (Vite), pages, components, API client, auth hydration

**Local Development**

Backend (from `backend/`):
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Frontend (from `frontend/`):
```bash
npm install
npm run dev
```

Open:
- Frontend: `http://localhost:3000`
- Backend: `http://127.0.0.1:8000`

**Environment Variables**
Backend config is in `backend/.env`.

Minimum:
- `DATABASE_URL`
- `JWT_SECRET_KEY`

Optional (Google login):
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `FRONTEND_BASE_URL`

**Notes**
- Keep secrets out of git (see `.gitignore`)
- Media is served from `/media/*` and proxied in dev
