/* ── Input validators (sync, used before any SQL runs) ─────────── */

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isUUID = (v) => typeof v === 'string' && UUID_RE.test(v)

export const isISODate = (v) => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  const d = new Date(`${v}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v
}

export const isNonEmptyString = (v, max = 500) =>
  typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max

/** Bags are discrete units: a positive whole number. */
export const isBags = (v) => {
  const n = Number(v)
  return Number.isInteger(n) && n > 0 && n <= 1_000_000
}

export const cleanString = (v, max = 500) =>
  typeof v === 'string' ? v.trim().slice(0, max) : ''

/** Returns { errors, ok } — errors keyed by field for form display. */
export const validateProductionInput = (body, knownProducts) => {
  const errors = {}
  if (!isISODate(body.date)) errors.date = 'Date is required (YYYY-MM-DD)'
  if (!isNonEmptyString(body.product, 120)) errors.product = 'Product is required'
  else if (!knownProducts.includes(body.product.trim()))
    errors.product = 'Unknown product'
  if (!isBags(body.quantity))
    errors.quantity = 'Quantity must be a positive whole number of bags'
  if (body.note != null && typeof body.note !== 'string')
    errors.note = 'Note must be text'
  return { errors, ok: Object.keys(errors).length === 0 }
}

export const validateDeliveryInput = (body, knownProducts) => {
  const errors = {}
  if (!isISODate(body.date)) errors.date = 'Date is required (YYYY-MM-DD)'
  if (!isNonEmptyString(body.product, 120)) errors.product = 'Product is required'
  else if (!knownProducts.includes(body.product.trim()))
    errors.product = 'Unknown product'
  if (!isBags(body.quantity))
    errors.quantity = 'Quantity must be a positive whole number of bags'
  if (!isNonEmptyString(body.customer, 200))
    errors.customer = 'Customer name is required'
  if (body.note != null && typeof body.note !== 'string')
    errors.note = 'Note must be text'
  return { errors, ok: Object.keys(errors).length === 0 }
}

/** Fetch every product name once for validation lookups. */
export const productNames = async (pool) => {
  const { rows } = await pool.query('SELECT name FROM products')
  return rows.map(r => r.name)
}
