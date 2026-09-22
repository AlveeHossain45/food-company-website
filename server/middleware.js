import jwt from 'jsonwebtoken'
import { pool } from './db.js'

export const JWT_SECRET = process.env.JWT_SECRET || 'yfm-dev-secret-change-me'
export const JWT_EXPIRES = '7d'

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

/** Wraps async handlers/middleware so rejections hit the error middleware. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

export const signToken = (user) =>
  jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES })

export const authRequired = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) throw new HttpError(401, 'Authentication required')

  let payload
  try {
    payload = jwt.verify(token, JWT_SECRET)
  } catch {
    throw new HttpError(401, 'Invalid or expired session')
  }

  const { rows } = await pool.query(
    'SELECT id, email, name, position, company, phone FROM users WHERE id = $1',
    [payload.sub]
  )
  if (!rows[0]) throw new HttpError(401, 'Session no longer valid')

  req.user = rows[0]
  next()
})

/* ── Map PostgreSQL error codes to clean HTTP responses ─────────── */
export const pgErrorStatus = (err) => {
  switch (err.code) {
    case '23505': return { status: 409, message: 'That record already exists (unique constraint)' }
    case '23503': return { status: 409, message: 'Cannot delete: this record is referenced by other data' }
    case '23514': return { status: 400, message: 'A value failed a database check constraint' }
    case '22P02': return { status: 400, message: 'Invalid id or value format' }
    case '22007': return { status: 400, message: 'Invalid date format' }
    case '42703': return { status: 400, message: 'Unknown field in request' }
    default: return null
  }
}
