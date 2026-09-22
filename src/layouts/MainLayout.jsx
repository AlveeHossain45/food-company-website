import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { WifiOff } from 'lucide-react'
import Sidebar from '../components/Sidebar.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useData } from '../context/DataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { mode } = useData()
  const { isAuthenticated } = useAuth()

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <div className="main-area">
        <Navbar onMenuClick={() => setSidebarOpen(s => !s)} />
        {isAuthenticated && mode === 'local' && (
          <div
            role="status"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 600,
              background: '#fef3c7',
              color: '#92400e',
              borderBottom: '1px solid #fde68a',
            }}
          >
            <WifiOff size={15} />
            Offline mode — the database is unreachable. Changes are saved on this
            device only and will not sync to the server.
          </div>
        )}
        <main className="page-content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}