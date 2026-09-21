import { Menu, Search, Bell } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getInitials } from '../utils/format.js'
import ThemeToggle from './ThemeToggle.jsx'

const TITLES = {
  '/':           { title: 'Dashboard',  sub: 'Production overview & key metrics' },
  '/production': { title: 'Production', sub: 'Manage daily production records' },
  '/delivery':   { title: 'Delivery',   sub: 'Track outgoing deliveries & customers' },
  '/stock':      { title: 'Stock',      sub: 'Current inventory across all products' },
  '/history':    { title: 'History',    sub: 'Complete production & delivery archive' },
  '/analytics':  { title: 'Analytics',  sub: 'Trends, comparisons & insights' },
  '/products':   { title: 'Products',   sub: 'All flour & wheat products' },
  '/profile':    { title: 'Profile',    sub: 'Your account information' },
  '/settings':   { title: 'Settings',   sub: 'Preferences & configuration' },
}

export default function Navbar({ onMenuClick }) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const meta = TITLES[pathname] || { title: 'Dashboard', sub: '' }

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          className="hamburger icon-btn"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="page-title">
          <h2>{meta.title}</h2>
          <p>{meta.sub}</p>
        </div>
      </div>

      <div className="navbar-right">
        <button className="icon-btn hide-mobile" aria-label="Search">
          <Search size={19} />
        </button>
        <button className="icon-btn hide-mobile" aria-label="Notifications">
          <Bell size={19} />
          <span className="badge-dot" />
        </button>
        <ThemeToggle />
        <div className="navbar-avatar" title={user?.name}>
          {getInitials(user?.name)}
        </div>
      </div>
    </header>
  )
}