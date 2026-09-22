/* Local dev entry — builds schema, then listens on PORT (default 4000).
 * On Vercel the API is served by api/index.js instead (no listen). */
const PORT = Number(process.env.PORT) || 4000

try {
  const { default: app } = await import('./app.js')
  const { ensureDbReady } = await import('./db.js')

  await ensureDbReady()

  const server = app.listen(PORT, () => {
    console.log(`✅ YFM API listening on http://localhost:${PORT}`)
  })
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `❌ Port ${PORT} is already in use.\n` +
        `   Another server instance is running — stop it first, or start with a different port:\n` +
        `   PORT=4001 npm run dev`
      )
      process.exit(1)
    }
    console.error('❌ Server failed to start:', err.message)
    process.exit(1)
  })
} catch (err) {
  console.error('FATAL:', err.message)
  process.exit(1)
}
