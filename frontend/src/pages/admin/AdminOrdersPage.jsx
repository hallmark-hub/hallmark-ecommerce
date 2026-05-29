import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, Search } from 'lucide-react'
import { getAdminOrders, updateAdminOrderStatus } from '../../api/admin'
import { formatPrice, formatDate } from '../../utils/format'

const ORDER_STATUSES = ['all', 'pending', 'confirmed', 'delivered']
const PAYMENT_STATUSES = ['all', 'paid', 'pending', 'failed']
const STATUS_STYLES = {
  pending: 'bg-tertiary-fixed/30 text-tertiary',
  confirmed: 'bg-surface-container text-primary',
  delivered: 'bg-primary-fixed/30 text-primary',
}
const PAYMENT_STATUS_STYLES = {
  paid: 'text-primary font-semibold',
  pending: 'text-tertiary font-semibold',
  failed: 'text-error font-semibold',
}

export default function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialPayment = PAYMENT_STATUSES.includes(searchParams.get('payment')) ? searchParams.get('payment') : 'all'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState(initialPayment)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function applyPaymentFilter(next) {
    setPaymentFilter(next)
    const params = new URLSearchParams(searchParams)
    if (next === 'all') params.delete('payment')
    else params.set('payment', next)
    setSearchParams(params, { replace: true })
  }

  useEffect(() => {
    async function loadOrders() {
      setLoading(true)
      setError('')
      try {
        const res = await getAdminOrders(100)
        if (!res.success) throw new Error(res.message)
        setOrders(res.data || [])
      } catch (e) {
        setError(e.message || 'Unable to load admin orders.')
      } finally {
        setLoading(false)
      }
    }
    loadOrders()
  }, [])

  async function updateStatus(reference, newStatus) {
    const previous = orders
    setOrders(prev => prev.map(o => o.reference === reference ? { ...o, order_status: newStatus } : o))
    try {
      const res = await updateAdminOrderStatus(reference, newStatus)
      if (!res.success) throw new Error(res.message)
    } catch (e) {
      setOrders(previous)
      setError(e.message || 'Unable to update order status.')
    }
  }

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.reference.includes(search.toUpperCase()) || o.customer_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.order_status === statusFilter
    const matchPayment = paymentFilter === 'all' || o.payment_status === paymentFilter
    return matchSearch && matchStatus && matchPayment
  })

  return (
    <div>
      <div className="mb-lg">
        <h1 className="text-h1 font-medium text-on-surface">Orders Management</h1>
        <p className="text-secondary text-body-sm">{loading ? 'Loading orders...' : `${orders.length} total orders`}</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-error-container text-on-error-container px-md py-sm rounded-lg mb-md">
          <AlertTriangle size={16} className="shrink-0" />
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-outline-variant p-md mb-md space-y-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order ref or client..."
            className="w-full pl-9 pr-4 py-2 border border-outline-variant rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-wrap gap-md">
          <div className="flex items-center gap-sm flex-wrap">
            <span className="text-label text-xs uppercase tracking-wide text-secondary">Order</span>
            {ORDER_STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-sm py-xs rounded-full text-label text-xs font-semibold capitalize cursor-pointer transition-colors ${statusFilter === s ? 'bg-primary text-white' : 'border border-outline-variant text-secondary hover:border-primary'}`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-sm flex-wrap">
            <span className="text-label text-xs uppercase tracking-wide text-secondary">Payment</span>
            {PAYMENT_STATUSES.map(s => (
              <button
                key={s}
                onClick={() => applyPaymentFilter(s)}
                className={`px-sm py-xs rounded-full text-label text-xs font-semibold capitalize cursor-pointer transition-colors ${paymentFilter === s ? 'bg-primary text-white' : 'border border-outline-variant text-secondary hover:border-primary'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-surface-container-low text-left">
              <th className="px-md py-sm text-label text-xs text-secondary uppercase tracking-wide">Order ID</th>
              <th className="px-md py-sm text-label text-xs text-secondary uppercase tracking-wide">Client</th>
              <th className="px-md py-sm text-label text-xs text-secondary uppercase tracking-wide">Amount</th>
              <th className="px-md py-sm text-label text-xs text-secondary uppercase tracking-wide">Payment</th>
              <th className="px-md py-sm text-label text-xs text-secondary uppercase tracking-wide">Status</th>
              <th className="px-md py-sm text-label text-xs text-secondary uppercase tracking-wide">Date</th>
              <th className="px-md py-sm text-label text-xs text-secondary uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {filtered.map(o => (
              <tr key={o.id} className="hover:bg-surface-container-low transition-colors">
                <td className="px-md py-sm text-body-sm font-medium text-primary">{o.reference}</td>
                <td className="px-md py-sm">
                  <p className="text-body-sm font-medium text-on-surface">{o.customer_name}</p>
                  <p className="text-label text-xs text-secondary">{o.customer_phone}</p>
                </td>
                <td className="px-md py-sm text-body-sm font-bold text-on-surface">{formatPrice(o.total_pesewas)}</td>
                <td className="px-md py-sm">
                  <p className={`text-body-sm ${PAYMENT_STATUS_STYLES[o.payment_status]}`}>{o.payment_status}</p>
                  <p className="text-label text-xs text-secondary capitalize">{o.payment_method.replace('_', ' ')}</p>
                </td>
                <td className="px-md py-sm">
                  <select
                    value={o.order_status}
                    onChange={e => updateStatus(o.reference, e.target.value)}
                    className={`px-2 py-0.5 rounded-full text-label text-xs font-semibold cursor-pointer border-0 focus:ring-1 focus:ring-primary outline-none ${STATUS_STYLES[o.order_status]}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </td>
                <td className="px-md py-sm text-body-sm text-secondary">{formatDate(o.created_at)}</td>
                <td className="px-md py-sm text-label text-xs text-secondary">Paystack</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-xl text-secondary text-body-sm">No orders match your filter.</div>
        )}
      </div>
    </div>
  )
}
