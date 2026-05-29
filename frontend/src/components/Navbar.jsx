import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, Search, Menu, X, ChevronDown, FileText, LogOut } from 'lucide-react'
import useCartStore from '../store/cartStore'
import useAuthStore from '../store/authStore'
import CartDrawer from './CartDrawer'

const NAV_GROUPS = [
  {
    label: 'Uniforms',
    items: [
      { label: 'Chef Uniforms', desc: 'Jackets, trousers, aprons & caps', to: '/products?category=chef-uniforms' },
      { label: 'Staff Uniforms & Branding', desc: 'Front-of-house and service staff', to: '/products?category=staff-uniforms-branding' },
    ],
  },
  {
    label: 'Equipment',
    items: [
      { label: 'Kitchen Equipment & Tools', desc: 'Commercial ranges, prep stations & tools', to: '/products?category=kitchen-equipment-tools' },
      { label: 'Industrial Kitchen Setup', desc: 'Turnkey design & installation', to: '/quote', badge: 'Quote' },
    ],
  },
  {
    label: 'Services',
    items: [
      { label: 'All Services', desc: 'Overview of everything we offer', to: '/services' },
      { label: 'Embroidery Services', desc: 'Custom logo embroidery on uniforms', to: '/services', badge: 'Quote' },
      { label: 'Logo Printing & Branding', desc: 'Screen printing & heat transfer', to: '/services', badge: 'Quote' },
      { label: 'Kitchen Setup & Machines', desc: 'Turnkey installation & custom builds', to: '/services', badge: 'Quote' },
    ],
  },
]

function DropdownGroup({ group, onClose }) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-xl shadow-xl border border-outline-variant min-w-[260px] py-2 z-50 animate-fade-in">
      <p className="px-4 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-secondary border-b border-outline-variant mb-1">
        {group.label}
      </p>
      {group.items.map(item => (
        <Link
          key={item.to + item.label}
          to={item.to}
          onClick={onClose}
          className="flex items-start gap-3 px-4 py-2.5 hover:bg-surface-container-low group transition-colors cursor-pointer"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-body-sm font-medium text-on-surface group-hover:text-primary transition-colors">{item.label}</span>
              {item.badge && (
                <span className="text-[9px] font-bold uppercase tracking-wider bg-gold/15 text-gold px-1.5 py-0.5 rounded-full">{item.badge}</span>
              )}
            </div>
            <p className="text-[11px] text-secondary mt-0.5 leading-snug">{item.desc}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default function Navbar() {
  const [cartOpen, setCartOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState(null)
  const [activeGroup, setActiveGroup] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const itemCount = useCartStore(s => s.items.reduce((sum, i) => sum + i.quantity, 0))
  const token = useAuthStore(s => s.token)
  const isAdmin = useAuthStore(s => s.isAdmin)
  const logout = useAuthStore(s => s.logout)
  const closeTimer = useRef(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`)
      setSearch('')
      setMobileOpen(false)
    }
  }

  function openGroup(label) {
    clearTimeout(closeTimer.current)
    setActiveGroup(label)
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setActiveGroup(null), 120)
  }

  function handleLogout() {
    logout()
    setMobileOpen(false)
    navigate('/login')
  }

  return (
    <>
      <header className={`bg-surface border-b border-outline-variant fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-md h-16' : 'h-20'}`}>
        <div className="flex justify-between items-center px-gutter w-full max-w-container-max mx-auto h-full">

          {/* Logo */}
          <Link to="/" className="text-h2 font-bold text-primary shrink-0">ChefWare</Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_GROUPS.map(group => (
              <div
                key={group.label}
                className="relative"
                onMouseEnter={() => openGroup(group.label)}
                onMouseLeave={scheduleClose}
              >
                <button
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeGroup === group.label
                      ? 'bg-primary text-white'
                      : 'text-secondary hover:text-primary hover:bg-surface-container-low'
                  }`}
                >
                  {group.label}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${activeGroup === group.label ? 'rotate-180' : ''}`} />
                </button>
                {activeGroup === group.label && (
                  <DropdownGroup
                    group={group}
                    onClose={() => setActiveGroup(null)}
                  />
                )}
              </div>
            ))}

            <Link
              to="/products"
              className="px-3 py-2 rounded-lg text-sm font-medium text-secondary hover:text-primary hover:bg-surface-container-low transition-colors"
            >
              All Products
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <form onSubmit={handleSearch} className="hidden lg:flex relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-48 pl-8 pr-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-sm focus:outline-none focus:ring-2 focus:ring-primary focus:w-60 transition-all duration-200"
              />
            </form>

            {/* Quote CTA */}
            <Link
              to="/quote"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gold hover:bg-gold/90 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <FileText size={14} />
              Get Quote
            </Link>

            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer"
              aria-label="Open cart"
            >
              <ShoppingCart size={22} className="text-on-surface-variant" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>

            {/* Account */}
            <Link to={isAdmin ? '/admin' : '/account'} className="p-2 hover:bg-surface-container-low rounded-full transition-colors" aria-label={isAdmin ? 'Admin dashboard' : 'My account'}>
              <User size={22} className="text-on-surface-variant" />
            </Link>

            {token && (
              <button
                onClick={handleLogout}
                className="hidden md:flex p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={20} className="text-on-surface-variant" />
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-outline-variant px-gutter py-sm max-h-[80vh] overflow-y-auto">
            <form onSubmit={handleSearch} className="flex gap-2 mb-sm">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="flex-1 px-3 py-2 rounded-lg border border-outline-variant text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button type="submit" className="px-3 py-2 bg-primary text-white rounded-lg cursor-pointer">
                <Search size={16} />
              </button>
            </form>

            {NAV_GROUPS.map(group => (
              <div key={group.label} className="border-b border-outline-variant last:border-0">
                <button
                  onClick={() => setMobileExpanded(mobileExpanded === group.label ? null : group.label)}
                  className="w-full flex justify-between items-center py-3 text-body-sm font-semibold text-on-surface cursor-pointer"
                >
                  {group.label}
                  <ChevronDown size={16} className={`text-secondary transition-transform ${mobileExpanded === group.label ? 'rotate-180' : ''}`} />
                </button>
                {mobileExpanded === group.label && (
                  <div className="pb-2 space-y-1">
                    {group.items.map(item => (
                      <Link
                        key={item.label}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between pl-4 pr-2 py-2 rounded-lg hover:bg-surface-container-low cursor-pointer"
                      >
                        <span className="text-body-sm text-secondary">{item.label}</span>
                        {item.badge && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-gold/15 text-gold px-1.5 py-0.5 rounded-full">{item.badge}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="pt-sm pb-2 flex flex-col gap-2">
              <Link to={isAdmin ? '/admin' : '/account'} onClick={() => setMobileOpen(false)} className="block py-2 text-body-sm font-medium text-secondary hover:text-primary">{isAdmin ? 'Admin Dashboard' : 'My Account'}</Link>
              <Link to="/products" onClick={() => setMobileOpen(false)} className="block py-2 text-body-sm font-medium text-secondary hover:text-primary">All Products</Link>
              <Link to="/quote" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2 px-3 bg-gold text-white text-body-sm font-semibold rounded-lg">
                <FileText size={14} /> Request a Quote
              </Link>
              {token && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 py-2 px-3 border border-outline-variant text-secondary text-body-sm font-semibold rounded-lg"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
