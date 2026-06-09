import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, Package, MessageSquare, Settings, LogOut, Menu, X } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import ErrorBoundary from '../../components/ErrorBoundary'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/quotes', label: 'Quote Requests', icon: MessageSquare },
  { to: '/admin/inventory', label: 'Inventory', icon: Package },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const { user, token, isAdmin, logout, refreshProfile } = useAuthStore()
  const [checkingRole, setCheckingRole] = useState(Boolean(token))
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    async function checkRole() {
      if (!token) { setCheckingRole(false); return }
      try { await refreshProfile() } catch { logout() } finally { setCheckingRole(false) }
    }
    checkRole()
  }, [token, refreshProfile, logout])

  if (checkingRole) {
    return (
      <main className="pt-20 min-h-screen bg-surface flex items-center justify-center">
        <p className="text-body text-secondary">Checking admin access...</p>
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <main className="pt-20 min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center px-gutter">
          <h1 className="text-h2 font-medium text-on-surface mb-sm">Admin Access Only</h1>
          <p className="text-secondary text-body-sm mb-md">Sign in with admin credentials to access this area.</p>
          <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
        </div>
      </main>
    )
  }

  function closeSidebar() { setSidebarOpen(false) }

  return (
    <div className="pt-20 min-h-screen bg-surface-container-low">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-inverse-surface flex flex-col fixed top-20 left-0 bottom-0 overflow-y-auto z-40 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="px-md pt-md pb-sm flex items-start justify-between">
          <div>
            <p className="text-label text-xs text-secondary-fixed-dim uppercase tracking-widest mb-xs">Admin</p>
            <p className="text-body-sm text-surface font-medium truncate max-w-[160px]">{user?.name || 'Admin'}</p>
          </div>
          <button onClick={closeSidebar} className="lg:hidden text-secondary-fixed hover:text-surface p-1 mt-0.5 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-sm py-sm">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-sm px-sm py-xs rounded-lg mb-xs text-body-sm font-medium transition-colors ${isActive ? 'bg-primary-container text-white' : 'text-secondary-fixed hover:bg-white/10 hover:text-surface'}`
              }
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => { logout(); navigate('/') }}
          className="flex items-center gap-sm px-md py-md text-body-sm text-secondary-fixed hover:text-surface cursor-pointer transition-colors"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </aside>

      {/* Content */}
      <main className="lg:ml-64 min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-20 z-20 bg-white border-b border-outline-variant px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu size={22} className="text-on-surface-variant" />
          </button>
          <span className="text-sm font-semibold text-on-surface">Admin Dashboard</span>
        </div>

        <div className="p-4 md:p-6">
          <ErrorBoundary><Outlet /></ErrorBoundary>
        </div>
      </main>
    </div>
  )
}
