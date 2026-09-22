# Yusuf Flower Mills — Production & Delivery Management

React (Vite) frontend + Express/PostgreSQL backend.

## Stack

| Layer    | Tech                                      |
|----------|-------------------------------------------|
| Frontend | React 18, Vite, React Router, Recharts    |
| Backend  | Express 4, node-postgres, JWT, bcryptjs   |
| Database | PostgreSQL (Aiven) — credentials in `server/.env` |

## Run

```bash
# Terminal 1 — API on :4000
npm run server:start        # or: npm run server (watch mode)

# Terminal 2 — frontend on :5173 (proxies /api → :4000)
npm run dev
```

Open http://localhost:5173

**Login:** `admin@yusufflowermills.com` / `admin123`

## Scripts

| Command            | What it does                                  |
|--------------------|-----------------------------------------------|
| `npm run dev`      | Vite dev server with `/api` proxy             |
| `npm run build`    | Production build → `dist/`                    |
| `npm run server:start` | Start API (`node --env-file-if-exists=.env index.js`) |
| `npm run server`   | API in watch mode                             |
| `npm run verify:db`| Verify database connectivity                  |
| `npm run test:api` | Full API smoke suite (67 checks — API must be running) |

## API overview

All routes except `POST /api/auth/login`, `GET /api/health` require `Authorization: Bearer <token>`.

- `GET  /api/health`
- `POST /api/auth/login` · `GET /api/auth/me` · `PUT /api/auth/profile`
- `GET|POST /api/products` · `GET|PUT|DELETE /api/products/:id` · `GET /api/products/:id/stock`
- `GET|POST /api/production` · `GET|PUT|DELETE /api/production/:id` — filters: `?from&to&product&q`
- `GET|POST /api/delivery` · `GET|PUT|DELETE /api/delivery/:id` · `GET /api/delivery/stock/:product`
- `GET  /api/stats/overview` · `GET /api/stats/series?days=30`

Server-side rules: bags must be positive integers, deliveries can never exceed stock,
products with records can't be deleted, product renames cascade to historical records
(FK `ON UPDATE CASCADE`), all SQL is parameterized.

## Offline fallback

If the API is unreachable, the frontend automatically runs in **local mode**
(localStorage-backed, demo credentials still work). Server mode is the source of
truth whenever the API responds.

## Configuration

`server/.env` (git-ignored):

```
PORT=4000
JWT_SECRET=<random string>
DATABASE_URL=postgres://...?sslmode=require
```
