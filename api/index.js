/* ============================================================
 * Vercel serverless entry — serves the Express API at /api/*
 * ------------------------------------------------------------
 * vercel.json rewrites every /api request to this handler.
 * ensureDbReady() runs the (idempotent) schema + seed once per
 * cold start and retries on subsequent invocations if it failed.
 * ============================================================ */
import app from '../server/app.js'
import { ensureDbReady } from '../server/db.js'

export default async function handler(req, res) {
  await ensureDbReady()
  return app(req, res)
}
