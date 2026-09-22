import { createContext, useContext, useEffect, useState } from 'react'
import { storage, STORAGE_KEYS } from '../utils/storage.js'
import { api, ApiError } from '../api/client.js'

const AuthContext = createContext(null)

// Demo credentials — used only when the backend is unreachable (offline mode)
const DEMO_USER = {
  email: 'admin@yusufflowermills.com',
  password: 'admin123',
  name: 'Alvee Hossain',
  position: 'Software Developer / Administrator',
  company: 'Yusuf Flower Mills LTD',
  phone: '+880 1700-000000',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => storage.get(STORAGE_KEYS.AUTH, null))
  const [initializing, setInitializing] = useState(true)

  /* Restore session from a stored token (server mode) */
  useEffect(() => {
    let dead = false
    const token = api.token()

    if (!token) {
      setInitializing(false)
      return
    }

    ;(async () => {
      try {
        const { user } = await api.get('/auth/me')
        if (dead) return
        setUser(user)
        storage.set(STORAGE_KEYS.AUTH, user)
      } catch (err) {
        if (dead) return
        // 401 → session invalid: drop it. Network error → keep cached user.
        if (err instanceof ApiError && err.status === 401) {
          api.clearToken()
          setUser(null)
          storage.remove(STORAGE_KEYS.AUTH)
        }
      } finally {
        if (!dead) setInitializing(false)
      }
    })()

    return () => { dead = true }
  }, [])

  /**
   * Login against the backend; falls back to demo credentials
   * when the server is unreachable (offline/static deploy).
   */
  const login = async (email, password) => {
    try {
      const { token, user } = await api.post(
        '/auth/login',
        { email, password },
        { auth: false }
      )
      api.setToken(token)
      setUser(user)
      storage.set(STORAGE_KEYS.AUTH, user)
      return { success: true }
    } catch (err) {
      // Treat "unreachable" as: fetch failed, 404 (no API behind the
      // proxy/static host), or 5xx (proxy target down). 401/400 from a
      // live server always surface as-is.
      const unreachable =
        err instanceof ApiError &&
        (err.isNetwork || err.status === 404 || err.status >= 500)
      if (!unreachable) {
        return { success: false, error: err.message }
      }
      // Server unreachable → offline demo credentials
      if (email === DEMO_USER.email && password === DEMO_USER.password) {
        const sessionUser = {
          email: DEMO_USER.email,
          name: DEMO_USER.name,
          position: DEMO_USER.position,
          company: DEMO_USER.company,
          phone: DEMO_USER.phone,
        }
        setUser(sessionUser)
        storage.set(STORAGE_KEYS.AUTH, sessionUser)
        return { success: true }
      }
      return {
        success: false,
        error: 'Cannot reach the server. Check credentials for offline demo.',
      }
    }
  }

  /**
   * Persist profile edits to the backend when a server session exists;
   * otherwise (offline demo) fall back to the cached local user.
   */
  const updateProfile = async (patch) => {
    if (api.token()) {
      const { user: updated } = await api.put('/auth/profile', patch)
      setUser(updated)
      storage.set(STORAGE_KEYS.AUTH, updated)
      return updated
    }
    const updated = { ...user, ...patch }
    setUser(updated)
    storage.set(STORAGE_KEYS.AUTH, updated)
    return updated
  }

  const logout = () => {
    setUser(null)
    api.clearToken()
    storage.remove(STORAGE_KEYS.AUTH)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateProfile,
        initializing,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
