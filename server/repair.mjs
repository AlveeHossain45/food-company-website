/* One-off repair: wipe demo tables (keeping users) and reseed atomically.
 * Usage: node --env-file-if-exists=.env repair.mjs
 */
import { pool, initDb, withTransaction } from './db.js'

try {
  await withTransaction(async (client) => {
    await client.query('TRUNCATE TABLE delivery_records, production_records, products RESTART IDENTITY CASCADE')
  })
  console.log('[repair] demo tables truncated (users kept)')

  await initDb()

  const { rows } = await pool.query(`
    SELECT (SELECT COUNT(*) FROM products)::int           AS products,
           (SELECT COUNT(*) FROM production_records)::int AS production,
           (SELECT COUNT(*) FROM delivery_records)::int   AS delivery,
           (SELECT COUNT(*) FROM users)::int              AS users
  `)
  console.log('[repair] counts after reseed:', rows[0])

  const ok =
    rows[0].products === 7 &&
    rows[0].production === 22 &&
    rows[0].delivery === 18 &&
    rows[0].users >= 1

  console.log(ok ? '[repair] OK — seed restored' : '[repair] FAIL — unexpected counts')
  process.exitCode = ok ? 0 : 1
} catch (e) {
  console.error('[repair] FAILED:', e.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
