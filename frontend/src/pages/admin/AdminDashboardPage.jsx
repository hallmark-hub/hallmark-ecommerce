import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, DollarSign, Clock, CheckCircle, AlertTriangle, ArrowRight, TrendingUp, Users, Package, MessageSquare } from 'lucide-react'
import { getAdminAnalyticsSummary, getAdminOrders } from '../../api/admin'
import { getProducts } from '../../api/products'
import { formatPrice, formatDate } from '../../utils/format'

const MONTHLY_REVENUE = [
  { month: 'Jan', value: 62 },
  { month: 'Feb', value: 48 },
  { month: 'Mar', value: 75 },
  { month: 'Apr', value: 55 },
  { month: 'May', value: 88 },
]

const STATUS_STYLES = {
  pending: 'bg-gold/15 text-gold',
  confirmed: 'bg-blue-50 text-blue-700',
  delivered: 'bg-green-50 text-green-700',
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')
  const maxRevenue = Math.max(...MONTHLY_REVENUE.map(r => r.value))
  const lowStock = products.filter(product => product.stock_qty <= 5).slice(0, 4)
  const stats = useMemo(() => {
    const totalOrders = summary?.total_orders || 0
    const delivered = summary?.orders_by_status?.delivered || 0
    const deliveredRate = totalOrders ? Math.round((delivered / totalOrders) * 100) : 0
    return [
      { label: 'Total Revenue', value: formatPrice(summary?.paid_revenue_pesewas || 0), sub: 'Paid orders', icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10', trend: null, up: true },
      { label: 'Total Orders', value: String(totalOrders), sub: 'All orders', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50', trend: null, up: true },
      { label: 'Pending Payments', value: String(summary?.pending_payment_count || 0), sub: 'Needs attention', icon: Clock, color: 'text-gold', bg: 'bg-gold/10', trend: null, up: false },
      { label: 'Delivered', value: String(delivered), sub: `${deliveredRate}% completion`, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', trend: `${deliveredRate}%`, up: true },
      { label: 'Products', value: String(products.length), sub: 'Catalog items', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', trend: null, up: true },
      { label: 'Quote Requests', value: 'TBC', sub: 'Endpoint pending', icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-50', trend: null, up: null },
    ]
  }, [summary, products.length])

  useEffect(() => {
    async function loadDashboard() {
      setError('')
      try {
        const [summaryRes, ordersRes, productsRes] = await Promise.all([
          getAdminAnalyticsSummary(),
          getAdminOrders(5),
          getProducts({ limit: 100 }),
        ])
        if (!summaryRes.success) throw new Error(summaryRes.message)
        if (!ordersRes.success) throw new Error(ordersRes.message)
        if (!productsRes.success) throw new Error(productsRes.message)
        setSummary(summaryRes.data)
        setOrders(ordersRes.data || [])
        setProducts(productsRes.data?.items || [])
      } catch (e) {
        setError(e.message || 'Unable to load dashboard data.')
      }
    }
    loadDashboard()
  }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-on-surface">Enterprise Overview</h1>
          <p className="text-secondary text-sm mt-1">ChefWare Enterprise — live backend data</p>
        </div>
        <Link to="/admin/orders">
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-container transition-colors cursor-pointer">
            <Package size={16} /> Manage Orders
          </button>
        </Link>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container rounded-xl p-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-error" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-outline-variant p-5">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon size={20} className={s.color} />
              </div>
              <p className="text-xl font-black text-on-surface leading-tight">{s.value}</p>
              <p className="text-xs text-secondary mt-0.5">{s.label}</p>
              {s.trend && (
                <p className={`text-xs font-semibold mt-2 ${s.up ? 'text-green-600' : 'text-gold'}`}>
                  {s.up && <TrendingUp size={10} className="inline mr-0.5" />}{s.trend}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Chart + Orders */}
        <div className="xl:col-span-2 space-y-6">
          {/* Mini Revenue Chart */}
          <div className="bg-white rounded-2xl border border-outline-variant p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-on-surface">Monthly Revenue</h2>
                <p className="text-xs text-secondary mt-0.5">Jan – May 2026</p>
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">↑ 12% vs last month</span>
            </div>
            <div className="flex items-end gap-3 h-28">
              {MONTHLY_REVENUE.map(r => (
                <div key={r.month} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-secondary font-medium">{Math.round(r.value * 485)}k</span>
                  <div className="w-full rounded-t-lg bg-primary/10 relative overflow-hidden" style={{ height: `${(r.value / maxRevenue) * 80}px` }}>
                    <div className="absolute inset-0 bg-primary rounded-t-lg" />
                  </div>
                  <span className="text-[10px] text-secondary">{r.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
              <h2 className="font-bold text-on-surface">Recent Orders</h2>
              <Link to="/admin/orders" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">View All <ArrowRight size={12} /></Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container-lowest text-left">
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-secondary">Reference</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-secondary hidden md:table-cell">Client</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-secondary">Amount</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-secondary">Status</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-secondary hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-primary">{o.reference}</td>
                      <td className="px-6 py-4 text-sm text-secondary hidden md:table-cell">{o.customer_name}</td>
                      <td className="px-6 py-4 text-sm font-bold text-on-surface">{formatPrice(o.total_pesewas)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${STATUS_STYLES[o.order_status]}`}>{o.order_status}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-secondary hidden lg:table-cell">{formatDate(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Inventory Alerts */}
          <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden">
            <div className="px-5 py-4 border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-bold text-on-surface">Inventory Alerts</h3>
              <Link to="/admin/inventory" className="text-xs text-primary font-semibold hover:underline">Manage</Link>
            </div>
            <div className="divide-y divide-outline-variant">
              {lowStock.map(item => (
                <div key={item.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden max-w-[80px]">
                        <div
                          className={`h-full rounded-full ${item.stock_qty === 0 ? 'bg-error' : item.stock_qty <= 3 ? 'bg-gold' : 'bg-primary'}`}
                          style={{ width: `${Math.min(100, (item.stock_qty / 5) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-secondary">{item.stock_qty}/5</span>
                    </div>
                  </div>
                  {item.stock_qty === 0
                    ? <span className="text-[10px] font-bold text-error bg-error/10 px-2 py-0.5 rounded-full shrink-0">Empty</span>
                    : <AlertTriangle size={15} className="text-gold shrink-0" />
                  }
                </div>
              ))}
              {lowStock.length === 0 && (
                <div className="px-5 py-4 text-sm text-secondary">No low-stock products.</div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-outline-variant">
              <Link to="/admin/inventory" className="text-xs text-primary font-semibold hover:underline cursor-pointer">Reorder Low Stock →</Link>
            </div>
          </div>

          {/* Quote Requests */}
          <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden">
            <div className="px-5 py-4 border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-bold text-on-surface">Quote Requests</h3>
              <span className="text-[10px] font-bold bg-gold/15 text-gold px-2 py-0.5 rounded-full">Pending</span>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-secondary">Admin quote request listing is not exposed by the backend yet.</p>
            </div>
            <div className="px-5 py-3 border-t border-outline-variant">
              <button className="text-xs text-primary font-semibold hover:underline cursor-pointer">Reply to All →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
