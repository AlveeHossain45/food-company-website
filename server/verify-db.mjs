import pg from 'pg'

const raw = process.env.DATABASE_URL
if (!raw) {
  console.error('FAIL: DATABASE_URL missing (server/.env)')
  process.exit(1)
}

const url = new URL(raw)
url.searchParams.delete('sslmode')

const client = new pg.Client({
  connectionString: url.toString(),
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  const r = await client.query(
    'SELECT version() AS v, current_database() AS db, current_user AS u'
  )
  console.log('OK  version:', r.rows[0].v.split(',')[0])
  console.log('    database:', r.rows[0].db, '| user:', r.rows[0].u)
  const t = await client.query(
    `SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY 1`
  )
  console.log('    tables:', t.rows.map(x => x.table_name).join(', ') || '(none yet)')
} catch (e) {
  console.error('FAIL:', e.message)
  process.exitCode = 1
} finally {
  await client.end()
}
