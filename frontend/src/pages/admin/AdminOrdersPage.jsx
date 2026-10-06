import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { getAdminOrders, updateAdminOrderStatus } from '../../api/admin'
import { formatPrice, formatDate } from '../../utils/format'
import {
  Alert, EmptyState, FilterChips, PageHeader, SearchInput, SkeletonRows, StatusPill, StatusSelect,
  cardClass, tableHeadClass,
} from '../../components/admin/AdminUI'

const ORDER_STATUSES = ['all', 'pending', 'confirmed', 'delivered']
const PAYMENT_STATUSES = ['all', 'paid', 'pending', 'failed']
const ORDER_TONES = { pending: 'warning', confirmed: 'info', delivered: 'success' }
const PAYMENT_TONES = { paid: 'success', pending: 'warning', failed: 'danger' }
const toOptions = statuses => statuses.map(value => ({ value, label: value }))

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
      <PageHeader
        title="Orders"
        subtitle={loading ? 'Loading orders…' : filtered.length === orders.length ? `${orders.length} total orders` : `Showing ${filtered.length} of ${orders.length} orders`}
      />

      {error && <Alert>{error}</Alert>}

      <div className={`${cardClass} p-3 mb-4 space-y-3`}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by order reference or client" />
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <FilterChips label="Order" value={statusFilter} onChange={setStatusFilter} options={toOptions(ORDER_STATUSES)} />
          <FilterChips label="Payment" value={paymentFilter} onChange={applyPaymentFilter} options={toOptions(PAYMENT_STATUSES)} />
        </div>
      </div>

      <div className={`${cardClass} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className={tableHeadClass}>Order</th>
                <th className={`${tableHeadClass} hidden sm:table-cell`}>Client</th>
                <th className={`${tableHeadClass} hidden sm:table-cell`}>Amount</th>
                <th className={`${tableHeadClass} hidden md:table-cell`}>Payment</th>
                <th className={tableHeadClass}>Status</th>
                <th className={`${tableHeadClass} hidden lg:table-cell`}>Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && <SkeletonRows cols={6} />}
              {!loading && filtered.map(o => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 sm:px-4 py-3">
                    <p className="font-semibold text-primary">{o.reference}</p>
                    <p className="text-xs text-gray-500 sm:hidden mt-0.5">{o.customer_name}</p>
                    <p className="text-xs font-semibold text-on-surface sm:hidden">{formatPrice(o.total_pesewas)}</p>
                  </td>
                  <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">
                    <p className="font-medium text-on-surface">{o.customer_name}</p>
                    <p className="text-xs text-gray-500">{o.customer_phone}</p>
                  </td>
                  <td className="px-3 sm:px-4 py-3 font-semibold text-on-surface whitespace-nowrap hidden sm:table-cell">{formatPrice(o.total_pesewas)}</td>
                  <td className="px-3 sm:px-4 py-3 hidden md:table-cell">
                    <StatusPill tone={PAYMENT_TONES[o.payment_status]}>{o.payment_status}</StatusPill>
                    <p className="text-xs text-gray-500 capitalize mt-1">{o.payment_method.replace('_', ' ')}</p>
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <StatusSelect
                      value={o.order_status}
                      tone={ORDER_TONES[o.order_status]}
                      options={ORDER_STATUSES.slice(1)}
                      label={`Order status for ${o.reference}`}
                      onChange={status => updateStatus(o.reference, status)}
                    />
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-gray-500 hidden lg:table-cell whitespace-nowrap">{formatDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <EmptyState icon={ShoppingBag} title={orders.length === 0 ? 'No orders yet' : 'No orders match'}>
            {orders.length === 0 ? 'Orders will show up here as customers check out.' : 'Try a different search or reset the filters.'}
          </EmptyState>
        )}
      </div>
    </div>
  )
}
