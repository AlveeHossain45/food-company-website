import { createContext, useContext, useEffect, useState } from 'react'
import { storage, STORAGE_KEYS } from '../utils/storage.js'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => storage.get(STORAGE_KEYS.THEME, 'light')
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    storage.set(STORAGE_KEYS.THEME, theme)
  }, [theme])

  const toggleTheme = () =>
    setTheme(t => (t === 'light' ? 'dark' : 'light'))

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}