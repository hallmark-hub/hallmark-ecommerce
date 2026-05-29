import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, DollarSign, Clock, AlertTriangle, ArrowRight, Package, MessageSquare } from 'lucide-react'
import { getAdminAnalyticsSummary, getAdminOrders, getAdminQuoteRequests, updateAdminQuoteStatus } from '../../api/admin'
import { getProducts } from '../../api/products'
import { formatPrice, formatDate } from '../../utils/format'

const STATUS_STYLES = {
  pending: 'bg-gold/15 text-gold',
  confirmed: 'bg-blue-50 text-blue-700',
  delivered: 'bg-green-50 text-green-700',
}
const QUOTE_STATUS_STYLES = {
  received: 'bg-gold/15 text-gold',
  contacted: 'bg-blue-50 text-blue-700',
  quoted: 'bg-primary/10 text-primary',
  closed: 'bg-surface-container text-secondary',
}
const QUOTE_STATUSES = ['received', 'contacted', 'quoted', 'closed']

const DAY_MS = 24 * 60 * 60 * 1000

function bucketRevenue(orders) {
  const now = Date.now()
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const dayMs = startOfDay.getTime()
  const buckets = { today: 0, week: 0, month: 0 }
  for (const order of orders) {
    if (order.payment_status !== 'paid') continue
    const ts = new Date(order.created_at).getTime()
    if (Number.isNaN(ts)) continue
    const age = now - ts
    if (ts >= dayMs) buckets.today += order.total_pesewas || 0
    if (age <= 7 * DAY_MS) buckets.week += order.total_pesewas || 0
    if (age <= 30 * DAY_MS) buckets.month += order.total_pesewas || 0
  }
  return buckets
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [quotes, setQuotes] = useState([])
  const [error, setError] = useState('')
  const lowStock = products.filter(product => product.stock_qty <= 5).slice(0, 4)
  const revenue = useMemo(() => bucketRevenue(orders), [orders])
  const stats = useMemo(() => {
    const totalOrders = summary?.total_orders || 0
    const newQuotes = quotes.filter(quote => quote.status === 'received').length
    return [
      { label: 'Paid Revenue', value: formatPrice(summary?.paid_revenue_pesewas || 0), sub: 'lifetime', icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10', to: '/admin/orders?payment=paid' },
      { label: 'Total Orders', value: String(totalOrders), sub: 'all-time count', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50', to: '/admin/orders' },
      { label: 'Pending Payments', value: String(summary?.pending_payment_count || 0), sub: 'awaiting confirmation', icon: Clock, color: 'text-gold', bg: 'bg-gold/10', to: '/admin/orders?payment=pending' },
      { label: 'Quote Requests', value: String(quotes.length), sub: newQuotes ? `${newQuotes} new` : 'none new', icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-50', to: '/admin/quotes' },
    ]
  }, [summary, quotes])

  useEffect(() => {
    async function loadDashboard() {
      setError('')
      try {
        const [summaryRes, ordersRes, productsRes, quotesRes] = await Promise.all([
          getAdminAnalyticsSummary(),
          getAdminOrders(50),
          getProducts({ limit: 100 }),
          getAdminQuoteRequests(5),
        ])
        if (!summaryRes.success) throw new Error(summaryRes.message)
        if (!ordersRes.success) throw new Error(ordersRes.message)
        if (!productsRes.success) throw new Error(productsRes.message)
        if (!quotesRes.success) throw new Error(quotesRes.message)
        setSummary(summaryRes.data)
        setOrders(ordersRes.data || [])
        setProducts(productsRes.data?.items || [])
        setQuotes(quotesRes.data || [])
      } catch (e) {
        setError(e.message || 'Unable to load dashboard data.')
      }
    }
    loadDashboard()
  }, [])

  async function updateQuoteStatus(reference, status) {
    const previous = quotes
    setQuotes(current => current.map(quote => quote.reference === reference ? { ...quote, status } : quote))
    try {
      const res = await updateAdminQuoteStatus(reference, status)
      if (!res.success) throw new Error(res.message)
    } catch (e) {
      setQuotes(previous)
      setError(e.message || 'Unable to update quote request.')
    }
  }

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <Link
              key={s.label}
              to={s.to}
              className="group bg-white rounded-2xl border border-outline-variant p-5 hover:border-primary hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-secondary">{s.label}</p>
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                  <Icon size={18} className={s.color} />
                </div>
              </div>
              <p className="text-2xl font-black text-on-surface leading-tight">{s.value}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-secondary">{s.sub}</p>
                <ArrowRight size={14} className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue windows + Orders */}
        <div className="xl:col-span-2 space-y-6">
          {/* Paid Revenue Windows */}
          <div className="bg-white rounded-2xl border border-outline-variant p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-on-surface">Paid Revenue</h2>
                <p className="text-xs text-secondary mt-0.5">Computed from the last 50 orders</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Today', value: revenue.today },
                { label: 'Last 7 days', value: revenue.week },
                { label: 'Last 30 days', value: revenue.month },
              ].map(window => (
                <div key={window.label} className="rounded-xl bg-surface-container-lowest border border-outline-variant p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary">{window.label}</p>
                  <p className="text-xl font-black text-on-surface mt-2 leading-tight">{formatPrice(window.value)}</p>
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
                  {orders.slice(0, 5).map(o => (
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
              {quotes.filter(q => q.status === 'received').length > 0 && (
                <span className="text-xs font-bold bg-gold/15 text-gold px-2 py-0.5 rounded-full">
                  {quotes.filter(q => q.status === 'received').length} new
                </span>
              )}
            </div>
            <div className="divide-y divide-outline-variant">
              {quotes.map(q => (
                <div key={q.reference} className="px-5 py-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">{q.name}</p>
                      <p className="text-xs text-primary font-medium capitalize mt-0.5">{q.category_slug.replace(/-/g, ' ')}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shrink-0 ${QUOTE_STATUS_STYLES[q.status]}`}>{q.status}</span>
                  </div>
                  <div className="text-xs text-secondary space-y-0.5">
                    <p className="truncate">{q.email}</p>
                    <p>{q.phone}</p>
                  </div>
                  <p className="text-xs text-on-surface line-clamp-2 leading-relaxed">{q.message}</p>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <p className="text-[11px] text-secondary">{formatDate(q.created_at)}</p>
                    <select
                      value={q.status}
                      onChange={(event) => updateQuoteStatus(q.reference, event.target.value)}
                      className="rounded-lg border border-outline-variant bg-white px-2 py-1 text-xs font-semibold capitalize text-on-surface focus:border-primary focus:outline-none cursor-pointer"
                    >
                      {QUOTE_STATUSES.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
              {quotes.length === 0 && (
                <div className="px-5 py-6 text-sm text-secondary text-center">No quote requests yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
