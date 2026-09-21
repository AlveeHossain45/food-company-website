import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      className="icon-btn"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={theme === 'light' ? 'Switch to night mode' : 'Switch to day mode'}
    >
      {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
    </button>
  )
}