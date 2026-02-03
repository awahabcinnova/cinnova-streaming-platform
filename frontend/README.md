# Frontend — StreamFlow UI

Modern React UI built with Vite and TypeScript, designed to feel like a polished video platform.

**Tech Stack**
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [React Router](https://reactrouter.com/)
- [Lucide Icons](https://lucide.dev/)

**Key Behaviors**
- Cookie-auth hydration via `GET /api/v1/auth/users/me`
- HashRouter routes (`/#/watch/:id`, `/#/history`, `/#/channel`)
- Watch history stored in `sessionStorage`

**Dev Proxy**
The frontend calls backend via same-origin paths:
- `/api/v1/*`
- `/media/*`

`vite.config.ts` proxies these to the backend server (`http://127.0.0.1:8000`).

**Run Locally**
```bash
npm install
npm run dev
```

Open:
- `http://localhost:3000`

**Build**
```bash
npm run build
npm run preview
```
