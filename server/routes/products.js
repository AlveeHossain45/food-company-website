import { Router } from 'express'
import { pool, mapProduct, COLS, producedBags, deliveredBags } from '../db.js'
import { HttpError, asyncHandler } from '../middleware.js'
import { isNonEmptyString, cleanString, isUUID } from '../validate.js'

const router = Router()

const validKgPerBag = (v) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 && n <= 1000
}

const loadOr404 = async (id) => {
  if (!isUUID(id)) throw new HttpError(400, 'Invalid product id')
  const { rows } = await pool.query(
    `SELECT ${COLS.PRODUCT_COLS} FROM products WHERE id = $1`, [id]
  )
  if (!rows[0]) throw new HttpError(404, 'Product not found')
  return rows[0]
}

/** GET /api/products */
router.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT ${COLS.PRODUCT_COLS} FROM products ORDER BY name ASC`
  )
  res.json(rows.map(mapProduct))
}))

/** GET /api/products/:id */
router.get('/:id', asyncHandler(async (req, res) => {
  res.json(mapProduct(await loadOr404(req.params.id)))
}))

/** POST /api/products { name, description?, kgPerBag? } */
router.post('/', asyncHandler(async (req, res) => {
  const { name, description = '', kgPerBag = 50 } = req.body || {}

  if (!isNonEmptyString(name, 120)) throw new HttpError(400, 'Product name is required')
  if (!validKgPerBag(kgPerBag)) throw new HttpError(400, 'kgPerBag must be a positive number (max 1000)')

  const trimmed = cleanString(name, 120)
  const dup = await pool.query('SELECT 1 FROM products WHERE lower(name) = lower($1)', [trimmed])
  if (dup.rows.length) throw new HttpError(409, 'A product with this name already exists')

  const { rows } = await pool.query(
    `INSERT INTO products (name, description, kg_per_bag)
     VALUES ($1, $2, $3)
     RETURNING ${COLS.PRODUCT_COLS}`,
    [trimmed, cleanString(description, 300) || '—', Number(kgPerBag)]
  )
  res.status(201).json(mapProduct(rows[0]))
}))

/** PUT /api/products/:id — rename cascades to records via FK. */
router.put('/:id', asyncHandler(async (req, res) => {
  const existing = await loadOr404(req.params.id)
  const { name, description, kgPerBag } = req.body || {}

  if (name !== undefined) {
    if (!isNonEmptyString(name, 120)) throw new HttpError(400, 'Product name is required')
    const trimmed = cleanString(name, 120)
    const dup = await pool.query(
      'SELECT 1 FROM products WHERE lower(name) = lower($1) AND id <> $2',
      [trimmed, existing.id]
    )
    if (dup.rows.length) throw new HttpError(409, 'A product with this name already exists')
  }
  if (kgPerBag !== undefined && !validKgPerBag(kgPerBag)) {
    throw new HttpError(400, 'kgPerBag must be a positive number (max 1000)')
  }

  const { rows } = await pool.query(
    `UPDATE products SET
       name        = COALESCE($2, name),
       description = COALESCE($3, description),
       kg_per_bag  = COALESCE($4, kg_per_bag),
       updated_at  = now()
     WHERE id = $1
     RETURNING ${COLS.PRODUCT_COLS}`,
    [
      existing.id,
      name !== undefined ? cleanString(name, 120) : null,
      description !== undefined ? (cleanString(description, 300) || '—') : null,
      kgPerBag !== undefined ? Number(kgPerBag) : null,
    ]
  )
  res.json(mapProduct(rows[0]))
}))

/** DELETE /api/products/:id — blocked while records reference it. */
router.delete('/:id', asyncHandler(async (req, res) => {
  const existing = await loadOr404(req.params.id)

  const used = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM production_records WHERE product = $1) +
       (SELECT COUNT(*) FROM delivery_records   WHERE product = $1) AS n`,
    [existing.name]
  )
  if (Number(used.rows[0].n) > 0) {
    throw new HttpError(409, 'Cannot delete: product has production or delivery records')
  }

  await pool.query('DELETE FROM products WHERE id = $1', [existing.id])
  res.status(204).end()
}))

/** GET /api/products/:id/stock — produced / delivered / remaining. */
router.get('/:id/stock', asyncHandler(async (req, res) => {
  const existing = await loadOr404(req.params.id)
  const produced = await producedBags(pool, existing.name)
  const delivered = await deliveredBags(pool, existing.name)
  res.json({
    id: existing.id,
    name: existing.name,
    kgPerBag: Number(existing.kg_per_bag),
    producedBags: produced,
    deliveredBags: delivered,
    remainingBags: produced - delivered,
    remainingKG: (produced - delivered) * Number(existing.kg_per_bag),
  })
}))

export default router
