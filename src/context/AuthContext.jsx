import { createContext, useContext, useState } from 'react'
import { storage, STORAGE_KEYS } from '../utils/storage.js'

const AuthContext = createContext(null)

// Demo credentials — replace with real auth later
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

  const login = (email, password) => {
    if (email === DEMO_USER.email && password === DEMO_USER.password) {
      const sessionUser = {
        email: DEMO_USER.email,
        name: DEMO_USER.name,
        position: DEMO_USER.position,
        company: DEMO_USER.company,
      }
      setUser(sessionUser)
      storage.set(STORAGE_KEYS.AUTH, sessionUser)
      return { success: true }
    }
    return { success: false, error: 'Invalid email or password' }
  }

  const logout = () => {
    setUser(null)
    storage.remove(STORAGE_KEYS.AUTH)
  }

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user }}
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