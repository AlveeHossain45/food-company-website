import { useState } from 'react'
import { Sun, Moon, Bell, Factory, Truck, AlertTriangle, Building2, LogOut } from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { storage, STORAGE_KEYS } from '../utils/storage.js'
import Button from '../components/Button.jsx'
import { useNavigate } from 'react-router-dom'

const DEFAULT_SETTINGS = {
  notifProduction: true,
  notifDelivery: true,
  notifLowStock: true,
  companyName: 'Yusuf Flower Mills LTD',
  companyAddress: 'Industrial Area, Bangladesh',
}

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const { logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [settings, setSettings] = useState(
    () => storage.get(STORAGE_KEYS.SETTINGS, null) || DEFAULT_SETTINGS
  )

  const update = (patch) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    storage.set(STORAGE_KEYS.SETTINGS, next)
  }

  const toggle = (key) => update({ [key]: !settings[key] })

  const handleLogout = () => {
    logout()
    showToast('Logged out successfully', 'info')
    navigate('/login')
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Preferences and system configuration</p>
        </div>
      </div>

      {/* Appearance */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <h3>Appearance</h3>
            <p>Customize how the app looks</p>
          </div>
        </div>

        <div className="setting-item">
          <div className="si-left">
            <div className="si-icon">{theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}</div>
            <div>
              <h4>{theme === 'light' ? 'Day Mode' : 'Night Mode'}</h4>
              <p>Switch between light and dark themes</p>
            </div>
          </div>
          <div className="chip-group">
            <button className={`chip ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>
              Day
            </button>
            <button className={`chip ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
              Night
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <h3>Notifications</h3>
            <p>Control what alerts you receive</p>
          </div>
        </div>

        <SettingToggle
          icon={<Factory size={18} />}
          title="Production notifications"
          desc="Get notified when production is added"
          on={settings.notifProduction}
          onToggle={() => toggle('notifProduction')}
        />
        <SettingToggle
          icon={<Truck size={18} />}
          title="Delivery notifications"
          desc="Get notified when a delivery is dispatched"
          on={settings.notifDelivery}
          onToggle={() => toggle('notifDelivery')}
        />
        <SettingToggle
          icon={<AlertTriangle size={18} />}
          title="Low stock alerts"
          desc="Get alerted when stock falls below threshold"
          on={settings.notifLowStock}
          onToggle={() => toggle('notifLowStock')}
        />
      </div>

      {/* Company Info */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <h3>Company Information</h3>
            <p>Basic mill details</p>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Company Name</label>
          <input
            className="form-input"
            value={settings.companyName}
            onChange={e => update({ companyName: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Company Address</label>
          <input
            className="form-input"
            value={settings.companyAddress}
            onChange={e => update({ companyAddress: e.target.value })}
          />
        </div>
        <Button onClick={() => showToast('Settings saved successfully', 'success')}>
          Save Changes
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3>Account</h3>
            <p>Manage your session</p>
          </div>
        </div>
        <div className="setting-item">
          <div className="si-left">
            <div className="si-icon"><LogOut size={18} /></div>
            <div>
              <h4>Log Out</h4>
              <p>Sign out of your account</p>
            </div>
          </div>
          <Button variant="danger" onClick={handleLogout}>Log Out</Button>
        </div>
      </div>
    </>
  )
}

function SettingToggle({ icon, title, desc, on, onToggle }) {
  return (
    <div className="setting-item">
      <div className="si-left">
        <div className="si-icon">{icon}</div>
        <div>
          <h4>{title}</h4>
          <p>{desc}</p>
        </div>
      </div>
      <div className={`switch ${on ? 'on' : ''}`} onClick={onToggle} role="switch" aria-checked={on} />
    </div>
  )
}