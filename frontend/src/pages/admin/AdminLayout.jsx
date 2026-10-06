import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, Package, MessageSquare, FilePenLine, LogOut, Menu, X, PanelLeftClose, PanelLeftOpen, ExternalLink } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import ErrorBoundary from '../../components/ErrorBoundary'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/quotes', label: 'Quote Requests', icon: MessageSquare },
  { to: '/admin/inventory', label: 'Inventory', icon: Package },
  { to: '/admin/settings', label: 'Website Content', icon: FilePenLine },
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

  // The customer chat bubble is for the storefront; keep it off the admin screens.
  useEffect(() => {
    const tawk = window.Tawk_API
    if (!tawk) return undefined
    tawk.onLoad = () => tawk.hideWidget?.()
    tawk.hideWidget?.()
    return () => {
      tawk.onLoad = undefined
      tawk.showWidget?.()
    }
  }, [])

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

  const adminName = user?.name || 'Admin'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-white border-r border-gray-200 flex flex-col fixed top-0 left-0 bottom-0 overflow-y-auto z-40 transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        ${!desktopCollapsed ? 'lg:translate-x-0' : 'lg:-translate-x-full'}
      `}>
        <div className="px-5 pt-5 pb-4 flex items-start justify-between">
          <div>
            <p className="text-lg font-extrabold text-primary leading-tight">ChefWare Admin</p>
            <p className="text-xs text-gray-500 mt-0.5">Enterprise Portal</p>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-gray-500 hover:text-on-surface p-1 -mr-1 cursor-pointer" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${isActive ? 'bg-primary-container text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-on-surface'}`
              }
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
              {adminName.trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-on-surface truncate">{adminName}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/') }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-on-surface cursor-pointer transition-colors"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className={`min-w-0 transition-all duration-300 ${desktopCollapsed ? 'lg:ml-0' : 'lg:ml-64'}`}>
        <div className="sticky top-0 z-20 h-14 bg-white border-b border-gray-200 px-4 flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1.5 -ml-1.5 rounded hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu size={22} className="text-gray-600" />
          </button>
          <button
            onClick={() => setDesktopCollapsed(collapsed => !collapsed)}
            className="hidden lg:flex p-1.5 -ml-1.5 rounded hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label={desktopCollapsed ? 'Show sidebar' : 'Hide sidebar'}
            title={desktopCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          >
            {desktopCollapsed ? <PanelLeftOpen size={20} className="text-gray-600" /> : <PanelLeftClose size={20} className="text-gray-600" />}
          </button>
          <span className={`text-sm font-bold text-primary ${desktopCollapsed ? '' : 'lg:hidden'}`}>ChefWare Admin</span>
          <Link to="/" target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary transition-colors">
            View store <ExternalLink size={14} />
          </Link>
        </div>

        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-8 md:py-8">
          <ErrorBoundary><Outlet /></ErrorBoundary>
        </div>
      </main>
    </div>
  )
}
