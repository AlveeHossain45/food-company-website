import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wheat, Mail, Lock, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Button from '../components/Button.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'

export default function Login() {
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [email, setEmail] = useState('admin@yusufflowermills.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(email.trim(), password)
      if (res.success) {
        showToast('Welcome back!', 'success')
        navigate('/')
      } else {
        setError(res.error)
        showToast(res.error, 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 2 }}>
        <ThemeToggle />
      </div>

      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <div className="brand-logo"><Wheat size={30} /></div>
          <h1>Yusuf Flower Mills LTD</h1>
          <p>Production & Delivery Management System</p>
        </div>

        <div className="demo-hint">
          <strong>Demo Credentials</strong><br />
          Email: admin@yusufflowermills.com<br />
          Password: admin123
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--text-muted)' }} />
            <input
              type="email"
              className="form-input"
              style={{ paddingLeft: 38 }}
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--text-muted)' }} />
            <input
              type="password"
              className="form-input"
              style={{ paddingLeft: 38 }}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

        <Button
          className="w-full"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Signing in…' : (<><LogIn size={16} /> Sign In</>)}
        </Button>
      </form>
    </div>
  )
}
