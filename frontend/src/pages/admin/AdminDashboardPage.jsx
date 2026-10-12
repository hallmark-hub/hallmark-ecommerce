import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, DollarSign, Clock, AlertTriangle, ArrowRight, Package, MessageSquare } from 'lucide-react'
import { getAdminAnalyticsSummary, getAdminOrders, getAdminQuoteRequests, updateAdminQuoteStatus } from '../../api/admin'
import { getProducts } from '../../api/products'
import { formatPrice, formatDate } from '../../utils/format'
import useAuthStore from '../../store/authStore'
import {
  Alert, PageHeader, StatusPill, StatusSelect, cardClass, primaryButtonClass, tableHeadClass,
} from '../../components/admin/AdminUI'

const ORDER_TONES = { pending: 'warning', confirmed: 'info', delivered: 'success' }
const QUOTE_TONES = { received: 'warning', contacted: 'info', quoted: 'success', closed: 'neutral' }
const QUOTE_STATUSES = ['received', 'contacted', 'quoted', 'closed']

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [quotes, setQuotes] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const user = useAuthStore(state => state.user)
  const firstName = (user?.name || '').trim().split(' ')[0]
  const lowStock = products.filter(product => product.stock_qty <= 5).slice(0, 4)
  const stats = useMemo(() => {
    const totalOrders = summary?.total_orders || 0
    const newQuotes = summary?.quote_requests_new || 0
    return [
      { label: 'Paid Revenue', value: formatPrice(summary?.paid_revenue_pesewas || 0), sub: 'lifetime', icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10', to: '/admin/orders?payment=paid' },
      { label: 'Total Orders', value: String(totalOrders), sub: 'all-time count', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50', to: '/admin/orders' },
      { label: 'Pending Payments', value: String(summary?.pending_payment_count || 0), sub: 'awaiting confirmation', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', to: '/admin/orders?payment=pending' },
      { label: 'Quote Requests', value: String(summary?.quote_requests_total || 0), sub: newQuotes ? `${newQuotes} new` : 'none new', icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-50', to: '/admin/quotes' },
    ]
  }, [summary])

  useEffect(() => {
    async function loadDashboard() {
      setError('')
      try {
        const [summaryRes, ordersRes, productsRes, quotesRes] = await Promise.all([
          getAdminAnalyticsSummary(),
          getAdminOrders(5),
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
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  async function updateQuoteStatus(reference, status) {
    const previous = quotes
    const previousSummary = summary
    const wasNew = quotes.find(quote => quote.reference === reference)?.status === 'received'
    const newDelta = (status === 'received' ? 1 : 0) - (wasNew ? 1 : 0)
    setQuotes(current => current.map(quote => quote.reference === reference ? { ...quote, status } : quote))
    setSummary(current => current && { ...current, quote_requests_new: current.quote_requests_new + newDelta })
    try {
      const res = await updateAdminQuoteStatus(reference, status)
      if (!res.success) throw new Error(res.message)
    } catch (e) {
      setQuotes(previous)
      setSummary(previousSummary)
      setError(e.message || 'Unable to update quote request.')
    }
  }

  const newQuotes = summary?.quote_requests_new || 0

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}${firstName ? `, ${firstName}` : ''}`}
        subtitle={new Date().toLocaleDateString('en-GH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      >
        <Link to="/admin/orders" className={primaryButtonClass}>
          <Package size={16} /> Manage orders
        </Link>
      </PageHeader>

      {error && <Alert>{error}</Alert>}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <Link
              key={s.label}
              to={s.to}
              className={`group ${cardClass} p-4 md:p-5 hover:border-primary/50 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <p className="text-sm font-medium text-gray-500">{s.label}</p>
                <div className={`w-9 h-9 rounded-md ${s.bg} flex items-center justify-center shrink-0`}>
                  <Icon size={18} className={s.color} />
                </div>
              </div>
              {loading
                ? <div className="skeleton h-8 w-28 rounded" />
                : <p className="text-lg sm:text-2xl font-bold text-on-surface leading-tight whitespace-nowrap">{s.value}</p>}
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-gray-500">{s.sub}</p>
                <ArrowRight size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 items-start">
        {/* Revenue windows + Orders */}
        <div className="xl:col-span-2 space-y-4 md:space-y-6">
          <div className={`${cardClass} p-5`}>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-on-surface">Paid revenue</h2>
              <p className="text-xs text-gray-500 mt-0.5">Paid orders only</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Today', value: summary?.paid_revenue_today_pesewas || 0 },
                { label: 'Last 7 days', value: summary?.paid_revenue_7d_pesewas || 0 },
                { label: 'Last 30 days', value: summary?.paid_revenue_30d_pesewas || 0 },
              ].map(window => (
                <div key={window.label} className="rounded bg-gray-50 border border-gray-200 p-4">
                  <p className="text-xs font-medium text-gray-500">{window.label}</p>
                  {loading
                    ? <div className="skeleton h-6 w-24 rounded mt-2" />
                    : <p className="text-xl font-bold text-on-surface mt-1.5 leading-tight">{formatPrice(window.value)}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Paid sales by category: one series, sorted by revenue, bar length = share of the top category */}
          {!loading && summary?.sales_by_category?.length > 0 && (
            <div className={`${cardClass} p-5`}>
              <h2 className="text-base font-semibold text-on-surface">Paid sales by category</h2>
              <p className="text-xs text-gray-500 mt-0.5 mb-4">All paid orders</p>
              <ul className="space-y-3">
                {summary.sales_by_category.map(row => {
                  const share = row.revenue_pesewas / summary.sales_by_category[0].revenue_pesewas
                  const detail = `${row.orders} order${row.orders === 1 ? '' : 's'} · ${row.units} unit${row.units === 1 ? '' : 's'}`
                  return (
                    <li key={row.category} title={`${row.category}: ${formatPrice(row.revenue_pesewas)} (${detail})`} aria-label={`${row.category}: ${formatPrice(row.revenue_pesewas)}, ${detail}`}>
                      <div className="flex justify-between gap-3 text-sm mb-1">
                        <span className="text-on-surface truncate">{row.category}</span>
                        <span className="font-semibold text-on-surface whitespace-nowrap">{formatPrice(row.revenue_pesewas)}</span>
                      </div>
                      <div className="h-2 rounded bg-gray-100" aria-hidden="true">
                        <div className="h-2 rounded bg-primary" style={{ width: `${Math.max(share * 100, 2)}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{detail}</p>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <div className={`${cardClass} overflow-hidden`}>
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-base font-semibold text-on-surface">Recent orders</h2>
              <Link to="/admin/orders" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">View all <ArrowRight size={14} /></Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className={tableHeadClass}>Reference</th>
                    <th className={`${tableHeadClass} hidden md:table-cell`}>Client</th>
                    <th className={tableHeadClass}>Amount</th>
                    <th className={tableHeadClass}>Status</th>
                    <th className={`${tableHeadClass} hidden lg:table-cell`}>Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.slice(0, 5).map(o => (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-4 py-3 font-semibold text-primary">{o.reference}</td>
                      <td className="px-3 sm:px-4 py-3 text-gray-600 hidden md:table-cell">{o.customer_name}</td>
                      <td className="px-3 sm:px-4 py-3 font-semibold text-on-surface whitespace-nowrap">{formatPrice(o.total_pesewas)}</td>
                      <td className="px-3 sm:px-4 py-3"><StatusPill tone={ORDER_TONES[o.order_status]}>{o.order_status}</StatusPill></td>
                      <td className="px-3 sm:px-4 py-3 text-gray-500 hidden lg:table-cell whitespace-nowrap">{formatDate(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loading && orders.length === 0 && (
              <p className="px-5 py-8 text-sm text-gray-500 text-center">No orders yet. New orders will appear here.</p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4 md:space-y-6">
          <div className={`${cardClass} overflow-hidden`}>
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-base font-semibold text-on-surface">Inventory alerts</h3>
              <Link to="/admin/inventory" className="text-sm text-primary font-medium hover:underline">Manage</Link>
            </div>
            <div className="divide-y divide-gray-100">
              {lowStock.map(item => (
                <div key={item.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[80px]">
                        <div
                          className={`h-full rounded-full ${item.stock_qty === 0 ? 'bg-red-500' : item.stock_qty <= 3 ? 'bg-amber-500' : 'bg-primary'}`}
                          style={{ width: `${Math.min(100, (item.stock_qty / 5) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{item.stock_qty}/5</span>
                    </div>
                  </div>
                  {item.stock_qty === 0
                    ? <StatusPill tone="danger">Empty</StatusPill>
                    : <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                  }
                </div>
              ))}
              {!loading && lowStock.length === 0 && (
                <p className="px-5 py-6 text-sm text-gray-500 text-center">Everything is well stocked.</p>
              )}
            </div>
            {lowStock.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-200">
                <Link to="/admin/inventory" className="text-sm text-primary font-medium hover:underline">Restock now →</Link>
              </div>
            )}
          </div>

          <div className={`${cardClass} overflow-hidden`}>
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-base font-semibold text-on-surface">Quote requests</h3>
              {newQuotes > 0
                ? <StatusPill tone="warning">{newQuotes} new</StatusPill>
                : <Link to="/admin/quotes" className="text-sm text-primary font-medium hover:underline">View all</Link>}
            </div>
            <div className="divide-y divide-gray-100">
              {quotes.map(q => (
                <div key={q.reference} className="px-5 py-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">{q.name}</p>
                      <p className="text-xs text-primary font-medium capitalize mt-0.5">{q.category_slug.replace(/-/g, ' ')}</p>
                    </div>
                    <StatusSelect
                      value={q.status}
                      tone={QUOTE_TONES[q.status]}
                      options={QUOTE_STATUSES}
                      label={`Status for ${q.reference}`}
                      onChange={status => updateQuoteStatus(q.reference, status)}
                    />
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <p className="truncate">{q.email}</p>
                    <p>{q.phone}</p>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{q.message}</p>
                  <p className="text-xs text-gray-400">{formatDate(q.created_at)}</p>
                </div>
              ))}
              {!loading && quotes.length === 0 && (
                <p className="px-5 py-8 text-sm text-gray-500 text-center">No quote requests yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
