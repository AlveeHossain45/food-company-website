import express from 'express'
import cors from 'cors'
import { pool, initDb } from './db.js'
import { authRequired, HttpError, pgErrorStatus, asyncHandler } from './middleware.js'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import productionRoutes from './routes/production.js'
import deliveryRoutes from './routes/delivery.js'

const app = express()
const PORT = Number(process.env.PORT) || 4000

app.disable('x-powered-by')
app.use(cors())
app.use(express.json({ limit: '1mb' }))

/* ── Request log (method, path, status, ms) ──────────────────────── */
app.use((req, res, next) => {
  const start = process.hrtime.bigint()
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6
    const line = `${req.method} ${req.originalUrl} → ${res.statusCode} ${ms.toFixed(1)}ms`
    if (res.statusCode >= 500) console.error(line)
    else console.log(line)
  })
  next()
})

/* ── Public routes ───────────────────────────────────────────────── */
app.get('/api/health', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM products)::int           AS products,
       (SELECT COUNT(*) FROM production_records)::int AS production,
       (SELECT COUNT(*) FROM delivery_records)::int   AS delivery,
       (SELECT COUNT(*) FROM users)::int              AS users`
  )
  res.json({ ok: true, service: 'yfm-api', time: new Date().toISOString(), counts: rows[0] })
}))

app.use('/api/auth', authRoutes)

/* ── Protected CRUD ──────────────────────────────────────────────── */
app.use('/api/products', authRequired, productRoutes)
app.use('/api/production', authRequired, productionRoutes)
app.use('/api/delivery', authRequired, deliveryRoutes)

const localISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** GET /api/stats/overview — everything the dashboard needs in one call. */
app.get('/api/stats/overview', authRequired, asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(`
    WITH today AS (SELECT CURRENT_DATE AS d),
    prod AS (
      SELECT
        COUNT(*) FILTER (WHERE date = CURRENT_DATE)         AS today,
        COUNT(*) FILTER (WHERE date = CURRENT_DATE - 1)      AS yesterday,
        COUNT(*)                                            AS total
      FROM production_records
    ),
    prod_qty AS (
      SELECT
        COALESCE(SUM(quantity) FILTER (WHERE date = CURRENT_DATE), 0)     AS today,
        COALESCE(SUM(quantity) FILTER (WHERE date = CURRENT_DATE - 1), 0) AS yesterday,
        COALESCE(SUM(quantity), 0)                                       AS total
      FROM production_records
    ),
    del_qty AS (
      SELECT
        COALESCE(SUM(quantity) FILTER (WHERE date = CURRENT_DATE), 0)     AS today,
        COALESCE(SUM(quantity) FILTER (WHERE date = CURRENT_DATE - 1), 0) AS yesterday,
        COALESCE(SUM(quantity), 0)                                       AS total
      FROM delivery_records
    ),
    stock AS (
      SELECT p.id, p.name, p.kg_per_bag,
        COALESCE(pr.n, 0)  AS produced_bags,
        COALESCE(dv.n, 0)  AS delivered_bags
      FROM products p
      LEFT JOIN (
        SELECT product, SUM(quantity)::int AS n FROM production_records GROUP BY product
      ) pr ON pr.product = p.name
      LEFT JOIN (
        SELECT product, SUM(quantity)::int AS n FROM delivery_records GROUP BY product
      ) dv ON dv.product = p.name
    )
    SELECT
      (SELECT d FROM today)               AS date,
      (SELECT row_to_json(x) FROM (SELECT today, yesterday, total FROM prod_qty) x) AS production,
      (SELECT row_to_json(x) FROM (SELECT today, yesterday, total FROM del_qty) x)  AS delivery,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', id,
          'name', name,
          'kgPerBag', kg_per_bag::float,
          'producedBags', produced_bags,
          'deliveredBags', delivered_bags,
          'remainingBags', produced_bags - delivered_bags,
          'remainingKG', (produced_bags - delivered_bags) * kg_per_bag::float
        ) ORDER BY name)
        FROM stock
      ), '[]'::json) AS stock,
      (SELECT COALESCE(SUM(produced_bags - delivered_bags), 0) FROM stock) AS remaining_bags
  `)

  const r = rows[0]
  res.json({
    date: localISO(new Date()),
    production: r.production,
    delivery: r.delivery,
    stock: r.stock,
    stockTotals: {
      bags: Number(r.remaining_bags),
      kg: r.stock.reduce((s, p) => s + Number(p.remainingKG), 0),
    },
  })
}))

/** GET /api/stats/series?days=30 — daily production & delivery bags. */
app.get('/api/stats/series', authRequired, asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 365)
  const { rows } = await pool.query(
    `SELECT to_char(d, 'YYYY-MM-DD') AS date,
            COALESCE(p.n, 0)::int AS production,
            COALESCE(v.n, 0)::int AS delivery
       FROM generate_series(CURRENT_DATE - ($1::int - 1), CURRENT_DATE, '1 day') AS d
       LEFT JOIN (
         SELECT date, SUM(quantity) AS n FROM production_records GROUP BY date
       ) p ON p.date = d
       LEFT JOIN (
         SELECT date, SUM(quantity) AS n FROM delivery_records GROUP BY date
       ) v ON v.date = d
      ORDER BY d`,
    [days]
  )
  res.json(rows)
}))

/* ── 404 + error handler ─────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` })
})

app.use((err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message })
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }
  const pg = pgErrorStatus(err)
  if (pg) return res.status(pg.status).json({ error: pg.message })

  console.error('[error]', err)
  res.status(500).json({ error: 'Internal server error' })
})

/* ── Boot ────────────────────────────────────────────────────────── */
try {
  await initDb()
  const server = app.listen(PORT, () => {
    console.log(`✅ YFM API listening on http://localhost:${PORT}`)
  })
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `❌ Port ${PORT} is already in use.\n` +
        `   Another server instance is running — stop it first, or start with a different port:\n` +
        `   PORT=4001 npm run dev`
      )
      process.exit(1)
    }
    console.error('❌ Server failed to start:', err.message)
    process.exit(1)
  })
} catch (err) {
  console.error('FATAL: failed to initialise database:', err.message)
  process.exit(1)
}
