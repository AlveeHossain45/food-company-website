import pg from 'pg'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { buildSeed } from './seed.js'

const { Pool } = pg

/* ── Pool setup ─────────────────────────────────────────────────────
 * Aiven sends a cert chain Node doesn't trust by default, and the
 * driver promotes sslmode=require to verify-full — so we strip the
 * query param and opt out of chain verification explicitly.
 * ------------------------------------------------------------------ */
const rawUrl = process.env.DATABASE_URL
if (!rawUrl) {
  throw new Error(
    'FATAL: DATABASE_URL is not set. Create server/.env for local dev, ' +
    'or set DATABASE_URL in your Vercel project settings.'
  )
}

const url = new URL(rawUrl)
url.searchParams.delete('sslmode')

export const pool = new Pool({
  connectionString: url.toString(),
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
})

pool.on('error', err => console.error('[pg] idle client error:', err.message))

export const query = (text, params) => pool.query(text, params)

/** Run fn inside a transaction; rolls back on any throw. */
export const withTransaction = async (fn) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    try { await client.query('ROLLBACK') } catch { /* ignore */ }
    throw err
  } finally {
    client.release()
  }
}

/* ── Row mappers (snake_case → frontend camelCase) ─────────────── */

export const mapProduct = (r) => r && ({
  id: r.id,
  name: r.name,
  description: r.description,
  kgPerBag: Number(r.kg_per_bag),
  createdAt: iso(r.created_at),
  updatedAt: iso(r.updated_at),
})

export const mapProduction = (r) => r && ({
  id: r.id,
  date: r.date,
  product: r.product,
  quantity: Number(r.quantity),
  unit: r.unit,
  note: r.note,
  addedBy: r.added_by,
  createdAt: iso(r.created_at),
  updatedAt: iso(r.updated_at),
})

export const mapDelivery = (r) => r && ({
  id: r.id,
  date: r.date,
  product: r.product,
  quantity: Number(r.quantity),
  unit: r.unit,
  customer: r.customer,
  note: r.note,
  addedBy: r.added_by,
  createdAt: iso(r.created_at),
  updatedAt: iso(r.updated_at),
})

export const mapUser = (r) => r && ({
  id: r.id,
  email: r.email,
  name: r.name,
  position: r.position,
  company: r.company,
  phone: r.phone,
  createdAt: iso(r.created_at),
})

const iso = (v) => (v ? new Date(v).toISOString() : null)

const PRODUCTION_COLS =
  'id, date::text AS date, product, quantity, unit, note, added_by, created_at, updated_at'
const DELIVERY_COLS =
  'id, date::text AS date, product, quantity, unit, customer, note, added_by, created_at, updated_at'
const PRODUCT_COLS =
  'id, name, description, kg_per_bag, created_at, updated_at'

export const COLS = { PRODUCTION_COLS, DELIVERY_COLS, PRODUCT_COLS }

/* ── Stock helpers (SQL) ───────────────────────────────────────── */

export const producedBags = async (clientOrPool, productName) => {
  const { rows } = await clientOrPool.query(
    'SELECT COALESCE(SUM(quantity), 0)::int AS n FROM production_records WHERE product = $1',
    [productName]
  )
  return rows[0].n
}

export const deliveredBags = async (clientOrPool, productName, excludeId = null) => {
  const { rows } = await clientOrPool.query(
    `SELECT COALESCE(SUM(quantity), 0)::int AS n
       FROM delivery_records
      WHERE product = $1
        AND ($2::uuid IS NULL OR id <> $2::uuid)`,
    [productName, excludeId]
  )
  return rows[0].n
}

export const availableBags = async (clientOrPool, productName, excludeDeliveryId = null) => {
  const { rows } = await clientOrPool.query(
    `SELECT (
        (SELECT COALESCE(SUM(quantity), 0)::int FROM production_records WHERE product = $1)
        -
        (SELECT COALESCE(SUM(quantity), 0)::int
           FROM delivery_records
          WHERE product = $1
            AND ($2::uuid IS NULL OR id <> $2::uuid))
      ) AS n`,
    [productName, excludeDeliveryId]
  )
  return rows[0].n
}

/* ── Schema + seed ─────────────────────────────────────────────── */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  position      TEXT NOT NULL DEFAULT '',
  company       TEXT NOT NULL DEFAULT '',
  phone         TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '—',
  kg_per_bag  NUMERIC(6,2) NOT NULL DEFAULT 50
              CHECK (kg_per_bag > 0 AND kg_per_bag <= 1000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS production_records (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date       DATE NOT NULL,
  product    TEXT NOT NULL
             REFERENCES products(name) ON UPDATE CASCADE ON DELETE RESTRICT,
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  unit       TEXT NOT NULL DEFAULT 'Bags',
  note       TEXT NOT NULL DEFAULT '',
  added_by   TEXT NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS delivery_records (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date       DATE NOT NULL,
  product    TEXT NOT NULL
             REFERENCES products(name) ON UPDATE CASCADE ON DELETE RESTRICT,
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  unit       TEXT NOT NULL DEFAULT 'Bags',
  customer   TEXT NOT NULL CHECK (btrim(customer) <> ''),
  note       TEXT NOT NULL DEFAULT '',
  added_by   TEXT NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_production_date    ON production_records (date DESC);
CREATE INDEX IF NOT EXISTS idx_production_product ON production_records (product);
CREATE INDEX IF NOT EXISTS idx_delivery_date      ON delivery_records (date DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_product   ON delivery_records (product);
CREATE INDEX IF NOT EXISTS idx_users_email        ON users (lower(email));
`

const seedAdmin = async () => {
  const { rows } = await pool.query('SELECT 1 FROM users LIMIT 1')
  if (rows.length > 0) return false

  await pool.query(
    `INSERT INTO users (email, password_hash, name, position, company, phone)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      'admin@yusufflowermills.com',
      await bcrypt.hash('admin123', 10),
      'Alvee Hossain',
      'Software Developer / Administrator',
      'Yusuf Flower Mills LTD',
      '+880 1700-000000',
    ]
  )
  console.log('[seed] default admin user created')
  return true
}

const seedDemoData = async () => {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM products')
  if (rows[0].n > 0) return false

  const seed = buildSeed()

  // All-or-nothing: a failure mid-seed must never leave partial data
  // behind (that previously stranded delivery rows unseeded).
  await withTransaction(async (client) => {
    for (const p of seed.products) {
      await client.query(
        `INSERT INTO products (id, name, description, kg_per_bag, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $5)`,
        [p.id, p.name, p.description, p.kgPerBag, p.createdAt]
      )
    }

    for (const r of seed.production) {
      await client.query(
        `INSERT INTO production_records
           (id, date, product, quantity, unit, note, added_by, created_at, updated_at)
         VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $8)`,
        [r.id, r.date, r.product, r.quantity, r.unit, r.note, r.addedBy, r.createdAt]
      )
    }

    for (const r of seed.delivery) {
      await client.query(
        `INSERT INTO delivery_records
           (id, date, product, quantity, unit, customer, note, added_by, created_at, updated_at)
         VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $9, $9)`,
        [r.id, r.date, r.product, r.quantity, r.unit, r.customer, r.note, r.addedBy, r.createdAt]
      )
    }
  })

  console.log('[seed] demo products / production / delivery loaded')
  return true
}

export const initDb = async () => {
  await query(SCHEMA)
  await seedAdmin()
  await seedDemoData()
}

/* Run initDb once per process (serverless cold start), retrying after failures. */
let readyPromise = null
export const ensureDbReady = () => {
  if (!readyPromise) {
    readyPromise = initDb().catch((err) => {
      readyPromise = null
      throw err
    })
  }
  return readyPromise
}

export const newId = () => randomUUID()
