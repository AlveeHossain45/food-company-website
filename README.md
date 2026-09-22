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

## Deploy to Vercel

The repo is configured as a single Vercel project: the Vite frontend is
served statically and every `/api/*` request is routed to the serverless
function in `api/index.js`, which runs the same Express app
(`server/app.js`) against PostgreSQL.

1. Push the repo to GitHub/GitLab/Bitbucket and import it in Vercel
   (framework auto-detected as **Vite**; `vercel.json` wires the API routes).
2. In **Project → Settings → Environment Variables**, add:
   - `DATABASE_URL` — your Postgres connection string (same one as `server/.env`)
   - `JWT_SECRET` — a long random string (otherwise a dev fallback is used)
3. Deploy. On first cold start the function creates the schema and seeds
   the demo admin/products automatically (idempotent).
4. Set the Vercel deployment region close to your database region
   (Settings → Functions → Region) to keep queries fast.

Notes:
- `server/.env` is only used for local dev — Vercel reads env vars from
  the dashboard, never from files.
- Frontend and API share the origin in production, so the relative
  `/api` base URL works with no CORS or rewrites changes.
- Local workflow is unchanged: `npm run server` + `npm run dev`.
