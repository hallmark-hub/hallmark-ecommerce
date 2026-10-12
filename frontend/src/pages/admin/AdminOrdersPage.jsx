import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, ShoppingBag } from 'lucide-react'
import { getAdminOrders, updateAdminOrderStatus } from '../../api/admin'
import { formatPrice, formatDate } from '../../utils/format'
import { downloadCsv } from '../../utils/csv'
import {
  Alert, EmptyState, FilterChips, PageHeader, SearchInput, SkeletonRows, StatusPill, StatusSelect,
  cardClass, inputClass, secondaryButtonClass, tableHeadClass,
} from '../../components/admin/AdminUI'
import OrderDetailDrawer from '../../components/admin/OrderDetailDrawer'

const ORDER_STATUSES = ['all', 'pending', 'confirmed', 'delivered']
const PAYMENT_STATUSES = ['all', 'paid', 'pending', 'failed']
const ORDER_TONES = { pending: 'warning', confirmed: 'info', delivered: 'success' }
const PAYMENT_TONES = { paid: 'success', pending: 'warning', failed: 'danger' }
const toOptions = statuses => statuses.map(value => ({ value, label: value }))
const PAGE_SIZE = 50
const SORTS = {
  newest: { label: 'Newest first', compare: (a, b) => new Date(b.created_at) - new Date(a.created_at) },
  oldest: { label: 'Oldest first', compare: (a, b) => new Date(a.created_at) - new Date(b.created_at) },
  amount_desc: { label: 'Amount: high to low', compare: (a, b) => b.total_pesewas - a.total_pesewas },
  amount_asc: { label: 'Amount: low to high', compare: (a, b) => a.total_pesewas - b.total_pesewas },
}
const CSV_COLUMNS = [
  { label: 'Reference', value: o => o.reference },
  { label: 'Date', value: o => o.created_at },
  { label: 'Customer', value: o => o.customer_name },
  { label: 'Phone', value: o => o.customer_phone },
  { label: 'Email', value: o => o.customer_email },
  { label: 'Company', value: o => o.company_name },
  { label: 'Delivery address', value: o => o.delivery_address },
  { label: 'Total (GHS)', value: o => (o.total_pesewas / 100).toFixed(2) },
  { label: 'Payment method', value: o => o.payment_method },
  { label: 'Payment status', value: o => o.payment_status },
  { label: 'Order status', value: o => o.order_status },
]

export default function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialPayment = PAYMENT_STATUSES.includes(searchParams.get('payment')) ? searchParams.get('payment') : 'all'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState(initialPayment)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [notice, setNotice] = useState('')
  const [sort, setSort] = useState('newest')
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [exporting, setExporting] = useState(false)
  const closeDetail = useCallback(() => setSelected(null), [])

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
        const res = await getAdminOrders(PAGE_SIZE)
        if (!res.success) throw new Error(res.message)
        setOrders(res.data || [])
        setHasMore((res.data || []).length === PAGE_SIZE)
      } catch (e) {
        setError(e.message || 'Unable to load admin orders.')
      } finally {
        setLoading(false)
      }
    }
    loadOrders()
  }, [])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const res = await getAdminOrders(PAGE_SIZE, orders.length)
      if (!res.success) throw new Error(res.message)
      const next = res.data || []
      setOrders(prev => [...prev, ...next.filter(o => !prev.some(p => p.id === o.id))])
      setHasMore(next.length === PAGE_SIZE)
    } catch (e) {
      setError(e.message || 'Unable to load more orders.')
    } finally {
      setLoadingMore(false)
    }
  }

  // Exports every order, not just the loaded ones, fetching 100 at a time
  async function exportCsv() {
    setExporting(true)
    setError('')
    try {
      const all = []
      for (;;) {
        const res = await getAdminOrders(100, all.length)
        if (!res.success) throw new Error(res.message)
        all.push(...(res.data || []))
        if ((res.data || []).length < 100) break
      }
      downloadCsv(`chefware-orders-${new Date().toISOString().slice(0, 10)}.csv`, CSV_COLUMNS, all)
    } catch (e) {
      setError(e.message || 'Unable to export orders.')
    } finally {
      setExporting(false)
    }
  }

  async function updateStatus(reference, newStatus) {
    const order = orders.find(o => o.reference === reference)
    if (newStatus === 'delivered') {
      const unpaid = order.payment_status !== 'paid'
      const question = unpaid
        ? `${reference} has NOT been paid (payment ${order.payment_status}). Mark it delivered anyway?`
        : `Mark ${reference} as delivered?`
      if (!window.confirm(question)) return
    }
    setNotice('')
    const previous = orders
    setOrders(prev => prev.map(o => o.reference === reference ? { ...o, order_status: newStatus } : o))
    try {
      const res = await updateAdminOrderStatus(reference, newStatus)
      if (!res.success) throw new Error(res.message)
      setNotice(`${reference} marked ${newStatus}.`)
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
  }).sort(SORTS[sort].compare)

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={loading ? 'Loading orders…' : `Showing ${filtered.length} of ${orders.length}${hasMore ? '+' : ''} orders`}
      >
        <button type="button" onClick={exportCsv} disabled={exporting || loading} className={secondaryButtonClass}>
          <Download size={16} /> {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </PageHeader>

      {error && <Alert>{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}

      <div className={`${cardClass} p-3 mb-4 space-y-3`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by order reference or client" />
          <select value={sort} onChange={event => setSort(event.target.value)} aria-label="Sort orders" className={`${inputClass} sm:w-56`}>
            {Object.entries(SORTS).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}
          </select>
        </div>
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
                    <button type="button" onClick={() => setSelected(o)} className="font-semibold text-primary hover:underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded" aria-label={`View order ${o.reference}`}>{o.reference}</button>
                    <p className="text-xs text-gray-500 sm:hidden mt-0.5">{o.customer_name}</p>
                    <p className="text-xs font-semibold text-on-surface sm:hidden">{formatPrice(o.total_pesewas)}</p>
                    <div className="md:hidden mt-1"><StatusPill tone={PAYMENT_TONES[o.payment_status]}>{o.payment_status}</StatusPill></div>
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

      {hasMore && !loading && (
        <div className="flex justify-center mt-4">
          <button type="button" onClick={loadMore} disabled={loadingMore} className={secondaryButtonClass}>
            {loadingMore ? 'Loading…' : 'Load more orders'}
          </button>
        </div>
      )}

      {selected && <OrderDetailDrawer summary={selected} onClose={closeDetail} />}
    </div>
  )
}
