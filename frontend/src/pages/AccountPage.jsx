import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Package, Wallet, CalendarClock, ArrowRight, LogOut, Mail, Phone, User } from 'lucide-react'
import { formatPrice, formatDate } from '../utils/format'
import Button from '../components/Button'
import useAuthStore from '../store/authStore'
import { getCustomerOrders } from '../api/auth'

const STATUS_STYLES = {
  pending: 'bg-tertiary-fixed/30 text-tertiary',
  confirmed: 'bg-surface-container text-primary',
  delivered: 'bg-primary-fixed/30 text-primary',
}

export default function AccountPage() {
  const navigate = useNavigate()
  const { profile, token, isAdmin, logout, refreshProfile } = useAuthStore()
  const [orders, setOrders] = useState([])
  const [ordersError, setOrdersError] = useState('')
  const [ordersLoading, setOrdersLoading] = useState(true)

  useEffect(() => {
    async function loadOrders() {
      if (!token) return
      try {
        const latestProfile = await refreshProfile()
        if (latestProfile?.role === 'admin') {
          navigate('/admin', { replace: true })
          return
        }
      } catch {
        logout()
        navigate('/login', { replace: true })
        return
      }
      setOrdersLoading(true)
      setOrdersError('')
      try {
        const res = await getCustomerOrders()
        if (!res.success) throw new Error(res.message)
        setOrders(res.data || [])
      } catch (e) {
        setOrdersError(e.message || 'Unable to load orders.')
      } finally {
        setOrdersLoading(false)
      }
    }
    loadOrders()
  }, [token, refreshProfile, logout, navigate])

  const stats = useMemo(() => {
    const activeOrders = orders.filter(order => order.order_status !== 'delivered').length
    const totalSpent = orders
      .filter(order => order.payment_status === 'paid')
      .reduce((sum, order) => sum + (order.total_pesewas || 0), 0)
    const lastOrder = orders.length
      ? [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      : null
    return [
      { label: 'Active Orders', value: String(activeOrders), sub: activeOrders === 1 ? 'order in progress' : 'orders in progress', icon: Package, color: 'text-primary' },
      { label: 'Total Spent', value: formatPrice(totalSpent), sub: 'paid orders to date', icon: Wallet, color: 'text-primary' },
      { label: 'Last Order', value: lastOrder ? formatDate(lastOrder.created_at) : '—', sub: lastOrder ? lastOrder.reference : 'no orders yet', icon: CalendarClock, color: 'text-tertiary' },
    ]
  }, [orders])

  if (!token) return <Navigate to="/login" replace />
  if (isAdmin) return <Navigate to="/admin" replace />

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <main className="pt-20 min-h-screen bg-surface">
      <div className="max-w-container-max mx-auto px-gutter py-section-mobile md:py-section">
        <div className="mb-xl flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-h1 text-on-surface">Welcome back, {profile?.name || 'Customer'}</h1>
            <p className="text-body-lg text-secondary mt-1">Manage your orders and services</p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-md py-sm border border-outline-variant rounded-lg text-body-sm font-semibold text-secondary hover:text-error hover:border-error transition-colors cursor-pointer"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-md mb-xl">
          {stats.map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-white rounded-xl border border-outline-variant p-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-label uppercase text-secondary tracking-wide">{stat.label}</p>
                    <p className="text-h2 text-on-surface mt-xs truncate">{stat.value}</p>
                    <p className="text-body-sm text-secondary mt-xs truncate">{stat.sub}</p>
                  </div>
                  <Icon size={22} className={`${stat.color} shrink-0`} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
          {/* Recent orders */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
              <div className="px-md py-sm border-b border-outline-variant flex justify-between items-center">
                <h2 className="text-h3 text-on-surface">Recent Orders</h2>
                <Link to="/products" className="text-label uppercase text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded">Browse Catalog</Link>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container-low text-left">
                    <th className="px-md py-sm text-label uppercase text-secondary">Order ID</th>
                    <th className="px-md py-sm text-label uppercase text-secondary">Date</th>
                    <th className="px-md py-sm text-label uppercase text-secondary">Status</th>
                    <th className="px-md py-sm text-label uppercase text-secondary text-right">Total</th>
                    <th className="px-md py-sm w-8" aria-label="View" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {orders.map(o => (
                    <tr
                      key={o.id}
                      onClick={() => navigate(`/order-confirmation/${o.reference}`)}
                      className="hover:bg-surface-container-low transition-colors cursor-pointer focus-within:bg-surface-container-low"
                    >
                      <td className="px-md py-sm text-body-sm font-medium text-primary">{o.reference}</td>
                      <td className="px-md py-sm text-body-sm text-secondary">{formatDate(o.created_at)}</td>
                      <td className="px-md py-sm">
                        <span className={`px-2 py-0.5 rounded-full text-label uppercase capitalize ${STATUS_STYLES[o.order_status]}`}>{o.order_status}</span>
                      </td>
                      <td className="px-md py-sm text-body-sm font-bold text-primary text-right">{formatPrice(o.total_pesewas)}</td>
                      <td className="px-md py-sm text-secondary"><ArrowRight size={14} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ordersLoading && <div className="p-md text-body-sm text-secondary">Loading orders...</div>}
              {ordersError && <div className="p-md text-body-sm text-error">{ordersError}</div>}
              {!ordersLoading && !ordersError && orders.length === 0 && (
                <div className="p-md text-body-sm text-secondary">No orders found for this account yet.</div>
              )}
            </div>

            {/* Quick procurement */}
            <div className="bg-white rounded-xl border border-outline-variant p-md mt-md">
              <h3 className="text-h3 text-on-surface mb-md">Quick Procurement</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-sm">
                {['Chef Uniforms', 'Equipment', 'Branding', 'Kitchen Setup', 'Embroidery', 'Pre-orders'].map(cat => (
                  <Link
                    key={cat}
                    to="/products"
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-outline-variant hover:border-primary hover:bg-surface-container-low transition-all text-body-sm text-on-surface cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {cat} <ArrowRight size={14} className="text-secondary" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div>
            {/* Profile snapshot */}
            <div className="bg-white rounded-xl border border-outline-variant p-md mb-md">
              <h3 className="text-h3 text-on-surface mb-md">Account Details</h3>
              <div className="space-y-sm">
                <div className="flex items-center gap-3 text-body-sm">
                  <User size={16} className="text-secondary shrink-0" />
                  <span className="text-on-surface truncate">{profile?.name || '—'}</span>
                </div>
                <div className="flex items-center gap-3 text-body-sm">
                  <Mail size={16} className="text-secondary shrink-0" />
                  <span className="text-on-surface truncate">{profile?.email || '—'}</span>
                </div>
                <div className="flex items-center gap-3 text-body-sm">
                  <Phone size={16} className="text-secondary shrink-0" />
                  <span className="text-on-surface truncate">{profile?.phone || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Kitchen Audit CTA */}
            <div className="bg-primary-container rounded-xl p-md text-white">
              <h3 className="text-h3 mb-xs">Need a Kitchen Audit?</h3>
              <p className="text-body-sm text-on-primary-container mb-sm">Free expert review of your current setup. We'll recommend upgrades and equipment.</p>
              <Button as={Link} to="/quote" variant="gold" size="sm">Request Audit</Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
