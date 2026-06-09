import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, Package, MessageSquare, Settings, LogOut, Menu, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)
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

  const sidebarVisible = mobileOpen || !desktopCollapsed

  return (
    <div className="pt-20 min-h-screen bg-surface-container-low">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-inverse-surface flex flex-col fixed top-20 left-0 bottom-0 overflow-y-auto z-40 transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        ${!desktopCollapsed ? 'lg:translate-x-0' : 'lg:-translate-x-full'}
      `}>
        <div className="px-md pt-md pb-sm flex items-start justify-between">
          <div>
            <p className="text-label text-xs text-secondary-fixed-dim uppercase tracking-widest mb-xs">Admin</p>
            <p className="text-body-sm text-surface font-medium truncate max-w-[140px]">{user?.name || 'Admin'}</p>
          </div>
          <div className="flex items-center gap-1">
            {/* Desktop collapse button */}
            <button
              onClick={() => setDesktopCollapsed(true)}
              className="hidden lg:flex text-secondary-fixed hover:text-surface p-1 mt-0.5 cursor-pointer rounded"
              title="Hide sidebar"
            >
              <PanelLeftClose size={17} />
            </button>
            {/* Mobile close button */}
            <button onClick={() => setMobileOpen(false)} className="lg:hidden text-secondary-fixed hover:text-surface p-1 mt-0.5 cursor-pointer">
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-sm py-sm">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
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
      <main className={`min-w-0 transition-all duration-300 ${desktopCollapsed ? 'lg:ml-0' : 'lg:ml-64'}`}>
        {/* Top bar — mobile hamburger + desktop expand button when collapsed */}
        <div className="sticky top-20 z-20 bg-white border-b border-outline-variant px-4 py-3 flex items-center gap-3">
          {/* Mobile open */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu size={22} className="text-on-surface-variant" />
          </button>

          {/* Desktop: show expand button only when collapsed */}
          {desktopCollapsed && (
            <button
              onClick={() => setDesktopCollapsed(false)}
              className="hidden lg:flex items-center gap-2 p-1 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
              title="Show sidebar"
            >
              <PanelLeftOpen size={20} className="text-on-surface-variant" />
            </button>
          )}

          {/* Desktop: show collapse button when sidebar is open */}
          {!desktopCollapsed && (
            <button
              onClick={() => setDesktopCollapsed(true)}
              className="hidden lg:flex items-center gap-2 p-1 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
              title="Hide sidebar"
            >
              <PanelLeftClose size={20} className="text-on-surface-variant" />
            </button>
          )}

          <span className="text-sm font-semibold text-on-surface">Admin Dashboard</span>
        </div>

        <div className="p-4 md:p-6">
          <ErrorBoundary><Outlet /></ErrorBoundary>
        </div>
      </main>
    </div>
  )
}
