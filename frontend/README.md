# Frontend — StreamFlow UI

Modern React UI built with **Vite** and **TypeScript**, designed to feel like a polished video platform.

## Tech stack

- **React**
- **Vite**
- **TypeScript**
- **React Router**
- **lucide-react** (icons)

## Key behaviors

- **Cookie-auth hydration on refresh**
  - On startup, the app calls `GET /api/v1/auth/users/me` (same-origin) to restore session.
- **Routing**
  - Uses HashRouter (`/#/watch/:id`, `/#/history`, `/#/channel`, etc.)
- **Watch history**
  - Stored in `sessionStorage` with one-click clear.

## API proxy (development)

To keep auth cookies stable, the frontend calls backend via same-origin paths:

- `/api/v1/*`
- `/media/*`

`vite.config.ts` proxies these to the backend server (typically `http://127.0.0.1:8000`).

## Run locally

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000`

## Build

```bash
npm run build
npm run preview
```
