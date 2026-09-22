/* End-to-end API smoke test: every action + critical error paths.
 * Usage: npm run test:api   (server must be running)
 */
const BASE = process.env.API_URL || 'http://localhost:4000/api'

let pass = 0
let fail = 0
const failures = []

const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`) }
  else { fail++; failures.push(name + (detail ? ` — ${detail}` : '')); console.log(`  ✗ ${name} ${detail}`) }
}

const req = async (path, { method = 'GET', token, body } = {}) => {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  let res
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (e) {
    return { status: 0, data: {}, networkError: e.message }
  }
  let data = null
  try { data = await res.json() } catch { /* 204 etc. */ }
  return { status: res.status, data }
}

const today = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})()

/* ── Health ─────────────────────────────────────────────────────── */
console.log('\n── Health ──')
{
  const r = await req('/health')
  check('health 200', r.status === 200 && r.data.ok === true)
  check('health has counts', r.data.counts?.products >= 7)
}

/* ── Auth ───────────────────────────────────────────────────────── */
console.log('\n── Auth ──')
let token = null
{
  const noCreds = await req('/auth/login', { method: 'POST', body: {} })
  check('login empty → 400', noCreds.status === 400)

  const bad = await req('/auth/login', { method: 'POST', body: { email: 'admin@yusufflowermills.com', password: 'wrong' } })
  check('login wrong password → 401', bad.status === 401)
  check('login error message', /invalid email or password/i.test(bad.data?.error || ''))

  const ok = await req('/auth/login', { method: 'POST', body: { email: 'admin@yusufflowermills.com', password: 'admin123' } })
  check('login success → token+user', ok.status === 200 && !!ok.data.token && ok.data.user?.email === 'admin@yusufflowermills.com')
  check('login response has no password hash', !JSON.stringify(ok.data).includes('password_hash') && !JSON.stringify(ok.data).includes('$2'))
  token = ok.data.token

  const me = await req('/auth/me', { token })
  check('GET /me with token', me.status === 200 && me.data.user?.email === 'admin@yusufflowermills.com')
  check('/me includes profile fields', typeof me.data.user?.position === 'string' && typeof me.data.user?.company === 'string')

  const noTok = await req('/auth/me')
  check('GET /me without token → 401', noTok.status === 401)

  const badTok = await req('/auth/me', { token: 'not.a.jwt' })
  check('GET /me bad token → 401', badTok.status === 401)

  const expiredStyle = await req('/auth/me', { token: token + 'x' })
  check('GET /me tampered token → 401', expiredStyle.status === 401)
}

/* ── Products ───────────────────────────────────────────────────── */
console.log('\n── Products ──')
let products = []
let tempProductId = null
{
  const noAuth = await req('/products')
  check('GET /products no auth → 401', noAuth.status === 401)

  const r = await req('/products', { token })
  check('GET /products → 200', r.status === 200 && Array.isArray(r.data))
  products = r.data
  check('7 seed products', products.length === 7, `got ${products.length}`)
  const prem = products.find(p => p.name === 'Premium Maida')
  check('kgPerBag is number (50)', prem?.kgPerBag === 50)
  const mota = products.find(p => p.name === 'Mota Vushi')
  check('Mota Vushi kgPerBag 37', mota?.kgPerBag === 37)

  const dup = await req('/products', { method: 'POST', token, body: { name: 'Premium Maida' } })
  check('duplicate product → 409', dup.status === 409)

  const badKg = await req('/products', { method: 'POST', token, body: { name: 'Bad KG', kgPerBag: -3 } })
  check('invalid kgPerBag → 400', badKg.status === 400)

  const noName = await req('/products', { method: 'POST', token, body: { name: '   ' } })
  check('empty product name → 400', noName.status === 400)

  const created = await req('/products', { method: 'POST', token, body: { name: 'Temp Test Flour', description: 'temp', kgPerBag: 40 } })
  check('create product → 201', created.status === 201 && created.data.kgPerBag === 40)
  tempProductId = created.data?.id

  const badId = await req('/products/12345', { token })
  check('GET product invalid uuid → 400', badId.status === 400)

  const missing = await req('/products/00000000-0000-4000-8000-000000000000', { token })
  check('GET missing product → 404', missing.status === 404)
}

/* ── Production CRUD ────────────────────────────────────────────── */
console.log('\n── Production ──')
let prodId = null
{
  const r = await req('/production', { token })
  check('GET /production → 200 array', r.status === 200 && Array.isArray(r.data) && r.data.length >= 22, `got ${r.data?.length}`)
  check('records have camelCase shape',
    r.data[0] && typeof r.data[0].addedBy === 'string' && typeof r.data[0].createdAt === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(r.data[0].date) && r.data[0].unit === 'Bags')

  const filtered = await req('/production?product=Premium%20Maida', { token })
  check('filter by product', filtered.status === 200 && filtered.data.every(x => x.product === 'Premium Maida'))
  check('filter returns rows', filtered.data.length >= 5, `got ${filtered.data.length}`)

  const q = await req('/production?q=morning', { token })
  check('search q=morning', q.status === 200 && q.data.length >= 1)

  const badDate = await req('/production', { method: 'POST', token, body: { date: '2026-13-45', product: 'Premium Maida', quantity: 5 } })
  check('invalid date → 400', badDate.status === 400)

  const badQty = await req('/production', { method: 'POST', token, body: { date: today, product: 'Premium Maida', quantity: 0 } })
  check('quantity 0 → 400', badQty.status === 400)

  const fracQty = await req('/production', { method: 'POST', token, body: { date: today, product: 'Premium Maida', quantity: 2.5 } })
  check('fractional bags → 400', fracQty.status === 400)

  const unknown = await req('/production', { method: 'POST', token, body: { date: today, product: 'No Such Flour', quantity: 5 } })
  check('unknown product → 400', unknown.status === 400)

  const ok = await req('/production', { method: 'POST', token, body: { date: today, product: 'Premium Maida', quantity: 5, note: 'smoke test', addedBy: 'Smoke Bot' } })
  check('create production → 201', ok.status === 201 && ok.data.quantity === 5 && ok.data.note === 'smoke test')
  prodId = ok.data?.id

  const edited = await req(`/production/${prodId}`, { method: 'PUT', token, body: { quantity: 9, note: 'edited' } })
  check('update production → 200', edited.status === 200 && edited.data.quantity === 9 && edited.data.note === 'edited')

  const badEdit = await req(`/production/${prodId}`, { method: 'PUT', token, body: { quantity: -1 } })
  check('update with bad qty → 400', badEdit.status === 400)

  const missing = await req('/production/00000000-0000-4000-8000-000000000000', { method: 'PUT', token, body: { quantity: 3 } })
  check('update missing → 404', missing.status === 404)

  const del = await req(`/production/${prodId}`, { method: 'DELETE', token })
  check('delete production → 204', del.status === 204)

  const delAgain = await req(`/production/${prodId}`, { method: 'DELETE', token })
  check('delete again → 404', delAgain.status === 404)
}

/* ── Delivery + stock enforcement ───────────────────────────────── */
console.log('\n── Delivery + stock ──')
let delId = null
{
  const stock = await req('/delivery/stock/Premium%20Maida', { token })
  check('stock lookup → number', stock.status === 200 && Number.isInteger(stock.data.availableBags))
  const available = stock.data.availableBags
  console.log(`    (Premium Maida available: ${available} bags)`)

  const over = await req('/delivery', { method: 'POST', token, body: { date: today, product: 'Premium Maida', quantity: available + 1, customer: 'Too Greedy Ltd' } })
  check('oversell → 400 with stock message', over.status === 400 && /bags available in stock/.test(over.data?.error || ''), got(over))

  const noCustomer = await req('/delivery', { method: 'POST', token, body: { date: today, product: 'Premium Maida', quantity: 1, customer: '' } })
  check('missing customer → 400', noCustomer.status === 400)

  const ok = await req('/delivery', { method: 'POST', token, body: { date: today, product: 'Premium Maida', quantity: 2, customer: 'Smoke Test Bakery', note: 'smoke', addedBy: 'Smoke Bot' } })
  check('create delivery → 201', ok.status === 201 && ok.data.customer === 'Smoke Test Bakery')
  delId = ok.data?.id

  const stockAfter = await req('/delivery/stock/Premium%20Maida', { token })
  check('stock decreased by 2', stockAfter.data.availableBags === available - 2, `${stockAfter.data.availableBags} vs ${available - 2}`)

  const hugeEdit = await req(`/delivery/${delId}`, { method: 'PUT', token, body: { quantity: available + 50 } })
  check('edit beyond stock → 400', hugeEdit.status === 400)

  const goodEdit = await req(`/delivery/${delId}`, { method: 'PUT', token, body: { quantity: 1, customer: 'Renamed Customer' } })
  check('valid edit → 200', goodEdit.status === 200 && goodEdit.data.customer === 'Renamed Customer')

  const del = await req(`/delivery/${delId}`, { method: 'DELETE', token })
  check('delete delivery → 204', del.status === 204)

  const stockRestored = await req('/delivery/stock/Premium%20Maida', { token })
  check('stock restored after delete', stockRestored.data.availableBags === available, `${stockRestored.data.availableBags} vs ${available}`)
}

/* ── Product rename cascade + delete guards ─────────────────────── */
console.log('\n── Rename cascade / delete guards ──')
{
  // temp product created earlier
  check('temp product exists', !!tempProductId)
  const delTemp = await req(`/products/${tempProductId}`, { method: 'DELETE', token })
  check('delete unused product → 204', delTemp.status === 204)

  const prem = products.find(p => p.name === 'Premium Maida')
  const rename = await req(`/products/${prem.id}`, { method: 'PUT', token, body: { name: 'Premium Maida X' } })
  check('rename product → 200', rename.status === 200 && rename.data.name === 'Premium Maida X')

  const moved = await req('/production?product=Premium%20Maida%20X', { token })
  check('records cascaded to new name', moved.status === 200 && moved.data.length === 5, `got ${moved.data.length}`)

  const delProtected = await req(`/products/${prem.id}`, { method: 'DELETE', token })
  check('delete referenced product → 409', delProtected.status === 409)

  const renameBack = await req(`/products/${prem.id}`, { method: 'PUT', token, body: { name: 'Premium Maida' } })
  check('rename back → 200', renameBack.status === 200 && renameBack.data.name === 'Premium Maida')

  const back = await req('/production?product=Premium%20Maida', { token })
  check('records cascaded back', back.data.length === 5, `got ${back.data.length}`)
}

/* ── Stats ──────────────────────────────────────────────────────── */
console.log('\n── Stats ──')
{
  const ov = await req('/stats/overview', { token })
  check('overview 200', ov.status === 200)
  check('production.today number', typeof ov.data.production?.today === 'number')
  check('stock is non-empty array', Array.isArray(ov.data.stock) && ov.data.stock.length === 7)
  check('stock item shape',
    ov.data.stock[0]?.producedBags !== undefined &&
    ov.data.stock[0]?.remainingKG !== undefined &&
    typeof ov.data.stock[0]?.kgPerBag === 'number')
  check('stockTotals present', typeof ov.data.stockTotals?.bags === 'number' && typeof ov.data.stockTotals?.kg === 'number')

  const series = await req('/stats/series?days=7', { token })
  check('series 7 rows', series.status === 200 && series.data.length === 7, `got ${series.data.length}`)
  check('series row shape', /^\d{4}-\d{2}-\d{2}$/.test(series.data[0]?.date) &&
    typeof series.data[0]?.production === 'number' && typeof series.data[0]?.delivery === 'number')

  const huge = await req('/stats/series?days=99999', { token })
  check('series days capped at 365', huge.data.length === 365, `got ${huge.data.length}`)
}

/* ── Profile update ─────────────────────────────────────────────── */
console.log('\n── Profile ──')
{
  const shortPw = await req('/auth/profile', { method: 'PUT', token, body: { password: '123' } })
  check('short password → 400', shortPw.status === 400)

  const upd = await req('/auth/profile', { method: 'PUT', token, body: { phone: '+880 1711-111111' } })
  check('update phone → 200', upd.status === 200 && upd.data.user?.phone === '+880 1711-111111')

  const me = await req('/auth/me', { token })
  check('change persisted', me.data.user?.phone === '+880 1711-111111')

  // restore
  await req('/auth/profile', { method: 'PUT', token, body: { phone: '+880 1700-000000' } })
}

/* ── Protocol edge cases ────────────────────────────────────────── */
console.log('\n── Protocol edge cases ──')
{
  const r = await fetch(BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{not json',
  })
  check('malformed JSON → 400', r.status === 400)

  const nf = await req('/nope')
  check('unknown route → 404', nf.status === 404 && /not found/i.test(nf.data?.error || ''))
}

function got(r) { return `(status ${r.status}: ${r.data?.error || ''})` }

/* ── Summary ────────────────────────────────────────────────────── */
console.log(`\n${'═'.repeat(50)}`)
console.log(`RESULT: ${pass} passed, ${fail} failed`)
if (failures.length) {
  console.log('Failed checks:')
  failures.forEach(f => console.log('  ✗ ' + f))
  process.exitCode = 1
}
console.log('═'.repeat(50))
