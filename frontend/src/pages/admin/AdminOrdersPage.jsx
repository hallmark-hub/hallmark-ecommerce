import { useState } from 'react'
import { Search } from 'lucide-react'
import { formatPrice, formatDate } from '../../utils/format'

const MOCK_ORDERS = [
  { id: 'o1', reference: 'CW-20260525-0042', client: 'Kempinski Hotel Accra', phone: '+233302000001', amount_pesewas: 480000, payment_method: 'paystack', payment_status: 'paid', status: 'confirmed', date: '2026-05-25T10:00:00Z' },
  { id: 'o2', reference: 'CW-20260524-0041', client: 'Movenpick Hotel', phone: '+233302000002', amount_pesewas: 185000, payment_method: 'bank_transfer', payment_status: 'pending', status: 'pending', date: '2026-05-24T14:00:00Z' },
  { id: 'o3', reference: 'CW-20260523-0040', client: 'Holiday Inn Accra', phone: '+233302000003', amount_pesewas: 90000, payment_method: 'paystack', payment_status: 'paid', status: 'delivered', date: '2026-05-23T09:00:00Z' },
  { id: 'o4', reference: 'CW-20260522-0039', client: 'La Palm Royal Beach', phone: '+233302000004', amount_pesewas: 210000, payment_method: 'paystack', payment_status: 'paid', status: 'confirmed', date: '2026-05-22T11:00:00Z' },
  { id: 'o5', reference: 'CW-20260521-0038', client: 'Labadi Beach Hotel', phone: '+233302000005', amount_pesewas: 650000, payment_method: 'bank_transfer', payment_status: 'pending', status: 'pending', date: '2026-05-21T08:00:00Z' },
]

const ORDER_STATUSES = ['all', 'pending', 'confirmed', 'delivered']
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
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [orders, setOrders] = useState(MOCK_ORDERS)

  function updateStatus(id, newStatus) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
  }

  function confirmBankPayment(id) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, payment_status: 'paid', status: 'confirmed' } : o))
  }

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.reference.includes(search.toUpperCase()) || o.client.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div>
      <div className="mb-lg">
        <h1 className="text-h1 font-medium text-on-surface">Orders Management</h1>
        <p className="text-secondary text-body-sm">{orders.length} total orders</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-outline-variant p-md mb-md flex flex-wrap gap-md items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order ref or client..."
            className="w-full pl-9 pr-4 py-2 border border-outline-variant rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-sm">
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
                  <p className="text-body-sm font-medium text-on-surface">{o.client}</p>
                  <p className="text-label text-xs text-secondary">{o.phone}</p>
                </td>
                <td className="px-md py-sm text-body-sm font-bold text-on-surface">{formatPrice(o.amount_pesewas)}</td>
                <td className="px-md py-sm">
                  <p className={`text-body-sm ${PAYMENT_STATUS_STYLES[o.payment_status]}`}>{o.payment_status}</p>
                  <p className="text-label text-xs text-secondary capitalize">{o.payment_method.replace('_', ' ')}</p>
                </td>
                <td className="px-md py-sm">
                  <select
                    value={o.status}
                    onChange={e => updateStatus(o.id, e.target.value)}
                    className={`px-2 py-0.5 rounded-full text-label text-xs font-semibold cursor-pointer border-0 focus:ring-1 focus:ring-primary outline-none ${STATUS_STYLES[o.status]}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </td>
                <td className="px-md py-sm text-body-sm text-secondary">{formatDate(o.date)}</td>
                <td className="px-md py-sm">
                  {o.payment_method === 'bank_transfer' && o.payment_status === 'pending' && (
                    <button
                      onClick={() => confirmBankPayment(o.id)}
                      className="text-label text-xs text-primary hover:underline cursor-pointer font-semibold"
                    >
                      Confirm Transfer
                    </button>
                  )}
                </td>
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
