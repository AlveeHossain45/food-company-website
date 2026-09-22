import { Router } from 'express'
import { pool, mapProduction, COLS } from '../db.js'
import { HttpError, asyncHandler } from '../middleware.js'
import {
  validateProductionInput, productNames, cleanString, isNonEmptyString, isUUID,
} from '../validate.js'

const router = Router()

/** GET /api/production?from=&to=&product=&q= */
router.get('/', asyncHandler(async (req, res) => {
  const { from, to, product, q } = req.query
  const { rows } = await pool.query(
    `SELECT ${COLS.PRODUCTION_COLS}
       FROM production_records
      WHERE ($1::date IS NULL OR date >= $1::date)
        AND ($2::date IS NULL OR date <= $2::date)
        AND ($3::text    IS NULL OR lower(product) = lower($3))
        AND ($4::text    IS NULL
             OR product ILIKE '%' || $4 || '%'
             OR note     ILIKE '%' || $4 || '%')
      ORDER BY date DESC, created_at DESC`,
    [
      from || null,
      to || null,
      product || null,
      q ? String(q) : null,
    ]
  )
  res.json(rows.map(mapProduction))
}))

/** GET /api/production/:id */
router.get('/:id', asyncHandler(async (req, res) => {
  if (!isUUID(req.params.id)) throw new HttpError(400, 'Invalid record id')
  const { rows } = await pool.query(
    `SELECT ${COLS.PRODUCTION_COLS} FROM production_records WHERE id = $1`,
    [req.params.id]
  )
  if (!rows[0]) throw new HttpError(404, 'Production record not found')
  res.json(mapProduction(rows[0]))
}))

/** POST /api/production { date, product, quantity, note?, addedBy? } */
router.post('/', asyncHandler(async (req, res) => {
  const body = { ...req.body }
  const names = await productNames(pool)
  const { errors, ok } = validateProductionInput(body, names)
  if (!ok) throw new HttpError(400, Object.values(errors)[0])

  const { rows } = await pool.query(
    `INSERT INTO production_records (date, product, quantity, note, added_by)
     VALUES ($1::date, $2, $3, $4, $5)
     RETURNING ${COLS.PRODUCTION_COLS}`,
    [
      body.date,
      body.product.trim(),
      Number(body.quantity),
      cleanString(body.note || '', 500),
      cleanString(body.addedBy || req.user.name || 'Admin', 120),
    ]
  )
  res.status(201).json(mapProduction(rows[0]))
}))

/** PUT /api/production/:id — merge patch over existing row, then validate. */
router.put('/:id', asyncHandler(async (req, res) => {
  if (!isUUID(req.params.id)) throw new HttpError(400, 'Invalid record id')
  const current = await pool.query(
    `SELECT ${COLS.PRODUCTION_COLS} FROM production_records WHERE id = $1`,
    [req.params.id]
  )
  if (!current.rows[0]) throw new HttpError(404, 'Production record not found')
  const existing = mapProduction(current.rows[0])

  const body = { ...existing, ...req.body }
  const names = await productNames(pool)
  const { errors, ok } = validateProductionInput(body, names)
  if (!ok) throw new HttpError(400, Object.values(errors)[0])

  const { rows } = await pool.query(
    `UPDATE production_records SET
       date = $2::date,
       product = $3,
       quantity = $4,
       note = $5,
       added_by = $6,
       updated_at = now()
     WHERE id = $1
     RETURNING ${COLS.PRODUCTION_COLS}`,
    [
      req.params.id,
      body.date,
      body.product.trim(),
      Number(body.quantity),
      cleanString(body.note || '', 500),
      isNonEmptyString(body.addedBy, 120) ? cleanString(body.addedBy, 120) : existing.addedBy,
    ]
  )
  res.json(mapProduction(rows[0]))
}))

/** DELETE /api/production/:id */
router.delete('/:id', asyncHandler(async (req, res) => {
  if (!isUUID(req.params.id)) throw new HttpError(400, 'Invalid record id')
  const { rowCount } = await pool.query(
    'DELETE FROM production_records WHERE id = $1', [req.params.id]
  )
  if (!rowCount) throw new HttpError(404, 'Production record not found')
  res.status(204).end()
}))

export default router
