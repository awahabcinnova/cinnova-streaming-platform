# StreamFlow — Streaming & Video Platform

Fast, modern, YouTube-style streaming platform built with a **FastAPI + PostgreSQL** backend and a **React (Vite)** frontend.

<div align="center">

**Backend**

FastAPI • PostgreSQL • SQLAlchemy (Async) • Alembic • HttpOnly Cookie Auth • Google OAuth

**Frontend**

React • Vite • React Router • TypeScript • Lucide Icons

</div>

## Features

- **Secure authentication (cookie-based)**
  - Short-lived access JWT + long-lived refresh JWT in **HttpOnly** cookies
  - Server-side sessions in DB (supports session revoke)
- **Google Login (OAuth 2.0)**
  - Local development supported via redirect URIs
- **Core product flows**
  - Home feed
  - Watch page
  - Watch history (sessionStorage) with **Clear History**
- **Channel profile customization**
  - Upload custom **avatar** and **banner**
- **Media hosting**
  - Backend serves `/media/*` (thumbnails, videos, avatars, banners)
  - Frontend dev server proxies `/media/*` so URLs remain same-origin

## Repo structure

- `backend/`
  - FastAPI app, auth, models, migrations, media storage, API routes
- `frontend/`
  - React UI (Vite), pages, components, API client, auth hydration

## Architecture (quick view)

- **Frontend** calls backend via same-origin paths:
  - `/api/v1/*` (API)
  - `/media/*` (assets)
- In development, **Vite proxy** forwards those to `http://127.0.0.1:8000`
- **Backend auth** sets cookies via responses (no token JSON).

## Quick start (local development)

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

## Environment variables

Backend config is in `backend/.env`.

Minimum:

- `DATABASE_URL`
- `JWT_SECRET_KEY`

Optional (Google login):

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `FRONTEND_BASE_URL`

## Common scripts

### Frontend

- `npm run dev`
- `npm run build`
- `npm run preview`

### Backend

- `uvicorn app.main:app --reload --port 8000`
- `alembic upgrade head`

## Notes

- Keep secrets out of git (see `.gitignore` for `.env`).
