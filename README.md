# StreamFlow — Video Platform

A modern YouTube-style video platform with a FastAPI backend and a React (Vite) frontend.

<div align="center">

**Tech Stack**

FastAPI • PostgreSQL • SQLAlchemy (Async) • Alembic • JWT + HttpOnly Cookies • React • Vite • React Router • Lucide

</div>

## Highlights

- **Cookie-based authentication**
  - Access + refresh JWT stored in **HttpOnly cookies**
  - Server-side session token stored in DB (session revocation supported)
- **Google OAuth login** (local dev supported)
- **Video browsing + watch page**
- **Watch history** stored in browser session storage with one-click clear
- **Channel profile**
  - Upload custom **avatar** and **banner**
- **Media hosting** via backend `/media/*` (served through the frontend dev proxy in development)

## Repo Structure

- `backend/`
  - FastAPI API, DB models, migrations, cookie auth, Google OAuth, media uploads
- `frontend/`
  - React UI (Vite), routes, API client, auth hydration, channel/history/watch pages

## Quick Start (Local)

### 1) Backend

From `backend/`:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 2) Frontend

From `frontend/`:

```bash
npm install
npm run dev
```

Open:

- Frontend: `http://localhost:3000`
- Backend: `http://127.0.0.1:8000`

## Development Notes

### Vite proxy (recommended)
In development the frontend proxies backend calls:

- `/api/v1/*` → `http://127.0.0.1:8000`
- `/media/*` → `http://127.0.0.1:8000`

This keeps cookie auth stable on refresh.

### Environment variables

Backend lives in `backend/.env`.

At minimum:

- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (optional if you don’t use Google login)

## Scripts

### Frontend

- `npm run dev`
- `npm run build`
- `npm run preview`

### Backend

- `uvicorn app.main:app --reload --port 8000`
- `alembic upgrade head`

## License

Private project (add a license if you plan to distribute).
