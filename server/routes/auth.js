import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool, mapUser } from '../db.js'
import { HttpError, asyncHandler, authRequired, signToken } from '../middleware.js'
import { isNonEmptyString, cleanString } from '../validate.js'

const router = Router()

/** POST /api/auth/login { email, password } → { token, user } */
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body || {}
  if (!isNonEmptyString(email, 254) || typeof password !== 'string' || !password) {
    throw new HttpError(400, 'Email and password are required')
  }

  const { rows } = await pool.query(
    'SELECT * FROM users WHERE lower(email) = lower($1)',
    [email.trim()]
  )
  const user = rows[0]
  if (!user) throw new HttpError(401, 'Invalid email or password')

  const match = await bcrypt.compare(password, user.password_hash)
  if (!match) throw new HttpError(401, 'Invalid email or password')

  res.json({ token: signToken(user), user: mapUser(user) })
}))

/** GET /api/auth/me (Bearer) → { user } */
router.get('/me', authRequired, (req, res) => {
  res.json({ user: {
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    position: req.user.position,
    company: req.user.company,
    phone: req.user.phone,
  } })
})

/** PUT /api/auth/profile — update signed-in user's fields. */
router.put('/profile', authRequired, asyncHandler(async (req, res) => {
  const { name, phone, position, company, password } = req.body || {}

  if (name !== undefined && !isNonEmptyString(name, 120)) {
    throw new HttpError(400, 'Name must be a non-empty string')
  }

  let passwordHash
  if (password !== undefined) {
    if (typeof password !== 'string' || password.length < 8) {
      throw new HttpError(400, 'Password must be at least 8 characters')
    }
    passwordHash = await bcrypt.hash(password, 10)
  }

  const { rows } = await pool.query(
    `UPDATE users SET
       name      = COALESCE($2, name),
       phone     = COALESCE($3, phone),
       position  = COALESCE($4, position),
       company   = COALESCE($5, company),
       password_hash = COALESCE($6, password_hash),
       updated_at = now()
     WHERE id = $1
     RETURNING id, email, name, position, company, phone, created_at`,
    [
      req.user.id,
      name !== undefined ? cleanString(name, 120) : null,
      phone !== undefined ? cleanString(phone, 40) : null,
      position !== undefined ? cleanString(position, 120) : null,
      company !== undefined ? cleanString(company, 160) : null,
      passwordHash ?? null,
    ]
  )
  if (!rows[0]) throw new HttpError(404, 'User not found')

  res.json({ user: mapUser(rows[0]) })
}))

export default router
