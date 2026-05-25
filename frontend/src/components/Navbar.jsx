import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, Search, Menu, X } from 'lucide-react'
import useCartStore from '../store/cartStore'
import CartDrawer from './CartDrawer'

export default function Navbar() {
  const [cartOpen, setCartOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const itemCount = useCartStore(s => s.items.reduce((sum, i) => sum + i.quantity, 0))

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
    }
  }

  const navLinks = [
    { to: '/products?category=chef-uniforms', label: 'Uniforms' },
    { to: '/products?category=kitchen-equipment-tools', label: 'Equipment' },
    { to: '/products?category=embroidery', label: 'Services' },
  ]

  return (
    <>
      <header className={`bg-surface border-b border-outline-variant fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-md h-16' : 'h-20'}`}>
        <div className="flex justify-between items-center px-gutter w-full max-w-container-max mx-auto h-full">
          <div className="flex items-center gap-xl">
            <Link to="/" className="text-h2 font-bold text-primary shrink-0">ChefWare Enterprise</Link>
            <nav className="hidden md:flex items-center gap-md">
              {navLinks.map(l => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `text-label text-sm transition-colors px-2 py-1 rounded ${isActive ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary hover:bg-surface-container-low'}`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-sm">
            <form onSubmit={handleSearch} className="hidden lg:flex relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search equipment..."
                className="w-56 pl-9 pr-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </form>

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

            <Link to="/account" className="p-2 hover:bg-surface-container-low rounded-full transition-colors" aria-label="My account">
              <User size={22} className="text-on-surface-variant" />
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-outline-variant px-gutter py-sm">
            <form onSubmit={handleSearch} className="flex gap-2 mb-sm">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="flex-1 px-3 py-2 rounded-lg border border-outline-variant text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button type="submit" className="px-3 py-2 bg-primary-container text-white rounded-lg cursor-pointer">
                <Search size={16} />
              </button>
            </form>
            {navLinks.map(l => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-secondary hover:text-primary text-body-sm font-medium"
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
