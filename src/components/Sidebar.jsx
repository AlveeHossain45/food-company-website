import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Factory, Truck, Package, History as HistoryIcon,
  BarChart3, Boxes, User, Settings as SettingsIcon, Wheat,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getInitials } from '../utils/format.js'

const MENU = [
  { to: '/',           label: 'Dashboard',  icon: LayoutDashboard, end: true },
  { to: '/production', label: 'Production', icon: Factory },
  { to: '/delivery',   label: 'Delivery',   icon: Truck },
  { to: '/stock',      label: 'Stock',      icon: Package },
  { to: '/history',    label: 'History',    icon: HistoryIcon },
  { to: '/analytics',  label: 'Analytics',  icon: BarChart3 },
  { to: '/products',   label: 'Products',   icon: Boxes },
]

const BOTTOM_MENU = [
  { to: '/profile',  label: 'Profile',  icon: User },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Sidebar({ open, onNavigate }) {
  const { user } = useAuth()

  const linkClass = ({ isActive }) =>
    `nav-item ${isActive ? 'active' : ''}`

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-logo">
          <Wheat size={24} />
        </div>
        <div className="brand-text">
          <h1>Yusuf Flower Mills</h1>
          <p>Production System</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-label">Main Menu</div>
        {MENU.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={linkClass}
            onClick={onNavigate}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="nav-label">Account</div>
        {BOTTOM_MENU.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={linkClass}
            onClick={onNavigate}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="user-chip">
          <div className="avatar">{getInitials(user?.name)}</div>
          <div className="info">
            <strong>{user?.name || 'Admin'}</strong>
            <span>{user?.position || 'Administrator'}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}