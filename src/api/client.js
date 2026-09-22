/* ============================================================
 * api/client.js — tiny fetch wrapper for the YFM backend
 * ------------------------------------------------------------
 * - Adds Bearer token automatically
 * - Normalises errors to ApiError { message, status }
 * - status 0 means the server was unreachable (offline)
 * ============================================================ */
import { storage, STORAGE_KEYS } from '../utils/storage.js'

const BASE = '/api'

export class ApiError extends Error {
  constructor(message, status = 0, body = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
  /** true when the request never reached the server */
  get isNetwork() {
    return this.status === 0
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = api.token()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Cannot reach the server', 0)
  }

  if (res.status === 204) return null

  let data = null
  try {
    data = await res.json()
  } catch {
    /* non-JSON body */
  }

  if (!res.ok) {
    throw new ApiError(
      data?.error || `Request failed (${res.status})`,
      res.status,
      data
    )
  }
  return data
}

export const api = {
  token: () => storage.get(STORAGE_KEYS.TOKEN, null),
  setToken: (t) => storage.set(STORAGE_KEYS.TOKEN, t),
  clearToken: () => storage.remove(STORAGE_KEYS.TOKEN),

  request,
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),

  /** Lightweight connectivity probe used by DataProvider. */
  async health(timeoutMs = 4000) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const res = await fetch(BASE + '/health', { signal: ctrl.signal })
      if (!res.ok) throw new Error('bad status')
      return await res.json()
    } finally {
      clearTimeout(timer)
    }
  },
}
