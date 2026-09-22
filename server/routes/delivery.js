import { Router } from 'express'
import { pool, mapDelivery, COLS, availableBags, withTransaction } from '../db.js'
import { HttpError, asyncHandler } from '../middleware.js'
import {
  validateDeliveryInput, productNames, cleanString, isNonEmptyString, isUUID,
} from '../validate.js'

const router = Router()

/** GET /api/delivery?from=&to=&product=&q= */
router.get('/', asyncHandler(async (req, res) => {
  const { from, to, product, q } = req.query
  const { rows } = await pool.query(
    `SELECT ${COLS.DELIVERY_COLS}
       FROM delivery_records
      WHERE ($1::date IS NULL OR date >= $1::date)
        AND ($2::date IS NULL OR date <= $2::date)
        AND ($3::text  IS NULL OR lower(product) = lower($3))
        AND ($4::text  IS NULL
             OR product  ILIKE '%' || $4 || '%'
             OR customer ILIKE '%' || $4 || '%'
             OR note    ILIKE '%' || $4 || '%')
      ORDER BY date DESC, created_at DESC`,
    [
      from || null,
      to || null,
      product || null,
      q ? String(q) : null,
    ]
  )
  res.json(rows.map(mapDelivery))
}))

/** GET /api/delivery/:id */
router.get('/:id', asyncHandler(async (req, res) => {
  if (!isUUID(req.params.id)) throw new HttpError(400, 'Invalid record id')
  const { rows } = await pool.query(
    `SELECT ${COLS.DELIVERY_COLS} FROM delivery_records WHERE id = $1`,
    [req.params.id]
  )
  if (!rows[0]) throw new HttpError(404, 'Delivery record not found')
  res.json(mapDelivery(rows[0]))
}))

/** POST /api/delivery — server-side stock enforcement (no overselling).
 *  Stock check + insert run in one transaction behind a product row lock
 *  so two concurrent deliveries can't both claim the last bags. */
router.post('/', asyncHandler(async (req, res) => {
  const body = { ...req.body }
  const names = await productNames(pool)
  const { errors, ok } = validateDeliveryInput(body, names)
  if (!ok) throw new HttpError(400, Object.values(errors)[0])

  const rows = await withTransaction(async (client) => {
    await client.query('SELECT 1 FROM products WHERE name = $1 FOR UPDATE', [
      body.product.trim(),
    ])
    const stock = await availableBags(client, body.product.trim())
    if (Number(body.quantity) > stock) {
      throw new HttpError(400, `Only ${stock} bags available in stock`)
    }
    const { rows } = await client.query(
      `INSERT INTO delivery_records (date, product, quantity, customer, note, added_by)
       VALUES ($1::date, $2, $3, $4, $5, $6)
       RETURNING ${COLS.DELIVERY_COLS}`,
      [
        body.date,
        body.product.trim(),
        Number(body.quantity),
        cleanString(body.customer, 200),
        cleanString(body.note || '', 500),
        cleanString(body.addedBy || req.user.name || 'Admin', 120),
      ]
    )
    return rows
  })
  res.status(201).json(mapDelivery(rows[0]))
}))

/** PUT /api/delivery/:id — stock check excludes the record being edited. */
router.put('/:id', asyncHandler(async (req, res) => {
  if (!isUUID(req.params.id)) throw new HttpError(400, 'Invalid record id')
  const current = await pool.query(
    `SELECT ${COLS.DELIVERY_COLS} FROM delivery_records WHERE id = $1`,
    [req.params.id]
  )
  if (!current.rows[0]) throw new HttpError(404, 'Delivery record not found')
  const existing = mapDelivery(current.rows[0])

  const body = { ...existing, ...req.body }
  const names = await productNames(pool)
  const { errors, ok } = validateDeliveryInput(body, names)
  if (!ok) throw new HttpError(400, Object.values(errors)[0])

  const rows = await withTransaction(async (client) => {
    await client.query('SELECT 1 FROM products WHERE name = $1 FOR UPDATE', [
      body.product.trim(),
    ])
    const stock = await availableBags(client, body.product.trim(), req.params.id)
    if (Number(body.quantity) > stock) {
      throw new HttpError(400, `Only ${stock} bags available in stock`)
    }
    const { rows } = await client.query(
      `UPDATE delivery_records SET
         date = $2::date,
         product = $3,
         quantity = $4,
         customer = $5,
         note = $6,
         added_by = $7,
         updated_at = now()
       WHERE id = $1
       RETURNING ${COLS.DELIVERY_COLS}`,
      [
        req.params.id,
        body.date,
        body.product.trim(),
        Number(body.quantity),
        cleanString(body.customer, 200),
        cleanString(body.note || '', 500),
        isNonEmptyString(body.addedBy, 120) ? cleanString(body.addedBy, 120) : existing.addedBy,
      ]
    )
    return rows
  })
  res.json(mapDelivery(rows[0]))
}))

/** DELETE /api/delivery/:id */
router.delete('/:id', asyncHandler(async (req, res) => {
  if (!isUUID(req.params.id)) throw new HttpError(400, 'Invalid record id')
  const { rowCount } = await pool.query(
    'DELETE FROM delivery_records WHERE id = $1', [req.params.id]
  )
  if (!rowCount) throw new HttpError(404, 'Delivery record not found')
  res.status(204).end()
}))

/** GET /api/delivery/stock/:product — available bags for one product. */
router.get('/stock/:product', asyncHandler(async (req, res) => {
  const product = String(req.params.product)
  const names = await productNames(pool)
  if (!names.some(n => n.toLowerCase() === product.toLowerCase())) {
    throw new HttpError(404, 'Product not found')
  }
  const bags = await availableBags(pool, product)
  res.json({ product, availableBags: bags })
}))

export default router
