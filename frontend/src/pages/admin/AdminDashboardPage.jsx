import { Link } from 'react-router-dom'
import { ShoppingBag, DollarSign, Wrench, AlertTriangle, ArrowRight } from 'lucide-react'
import { formatPrice, formatDate } from '../../utils/format'

const MOCK_STATS = [
  { label: 'Total Orders', value: '142', icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary-fixed/20' },
  { label: 'Revenue (Month)', value: formatPrice(4850000), icon: DollarSign, color: 'text-primary', bg: 'bg-primary-fixed/20' },
  { label: 'Active Services', value: '8', icon: Wrench, color: 'text-tertiary', bg: 'bg-tertiary-fixed/20' },
]

const MOCK_RECENT_ORDERS = [
  { id: 'o1', reference: 'CW-20260525-0042', client: 'Kempinski Hotel Accra', amount_pesewas: 480000, status: 'confirmed', date: '2026-05-25T10:00:00Z' },
  { id: 'o2', reference: 'CW-20260524-0041', client: 'Movenpick Hotel', amount_pesewas: 185000, status: 'pending', date: '2026-05-24T14:00:00Z' },
  { id: 'o3', reference: 'CW-20260523-0040', client: 'Holiday Inn Accra', amount_pesewas: 90000, status: 'delivered', date: '2026-05-23T09:00:00Z' },
  { id: 'o4', reference: 'CW-20260522-0039', client: 'La Palm Royal Beach', amount_pesewas: 210000, status: 'confirmed', date: '2026-05-22T11:00:00Z' },
]

const MOCK_LOW_STOCK = [
  { name: 'Industrial Gas Range 6-Burner', stock: 2, threshold: 5 },
  { name: 'Classic White Chef Jacket (XL)', stock: 3, threshold: 10 },
  { name: 'Commercial Double Fryer', stock: 0, threshold: 3 },
]

const MOCK_QUOTES = [
  { reference: 'QR-20260525-0001', name: 'Kwame Asante', category: 'Kitchen Setup', date: '2026-05-25T08:00:00Z' },
  { reference: 'QR-20260524-0002', name: 'Abena Osei', category: 'Embroidery Services', date: '2026-05-24T16:00:00Z' },
]

const STATUS_STYLES = {
  pending: 'bg-tertiary-fixed/30 text-tertiary',
  confirmed: 'bg-surface-container text-primary',
  delivered: 'bg-primary-fixed/30 text-primary',
}

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-lg">
        <h1 className="text-h1 font-medium text-on-surface">Enterprise Overview</h1>
        <p className="text-secondary text-body-sm">ChefWare Enterprise — Admin Dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl">
        {MOCK_STATS.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-xl border border-outline-variant p-md">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-sm`}>
                <Icon size={20} className={s.color} />
              </div>
              <p className="text-h2 font-bold text-on-surface">{s.value}</p>
              <p className="text-body-sm text-secondary">{s.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-outline-variant overflow-hidden">
          <div className="px-md py-sm border-b border-outline-variant flex justify-between items-center">
            <h2 className="text-h3 font-medium text-on-surface">Recent Orders</h2>
            <Link to="/admin/orders" className="text-label text-xs text-primary hover:underline flex items-center gap-1">View All <ArrowRight size={12} /></Link>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low text-left">
                <th className="px-md py-sm text-label text-xs text-secondary uppercase tracking-wide">Order</th>
                <th className="px-md py-sm text-label text-xs text-secondary uppercase tracking-wide hidden md:table-cell">Client</th>
                <th className="px-md py-sm text-label text-xs text-secondary uppercase tracking-wide">Amount</th>
                <th className="px-md py-sm text-label text-xs text-secondary uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {MOCK_RECENT_ORDERS.map(o => (
                <tr key={o.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-md py-sm text-body-sm font-medium text-primary">{o.reference}</td>
                  <td className="px-md py-sm text-body-sm text-secondary hidden md:table-cell">{o.client}</td>
                  <td className="px-md py-sm text-body-sm font-bold text-on-surface">{formatPrice(o.amount_pesewas)}</td>
                  <td className="px-md py-sm">
                    <span className={`px-2 py-0.5 rounded-full text-label text-[11px] font-semibold capitalize ${STATUS_STYLES[o.status]}`}>{o.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-md">
          {/* Inventory alerts */}
          <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
            <div className="px-md py-sm border-b border-outline-variant flex justify-between items-center">
              <h3 className="text-h3 font-medium text-on-surface">Inventory Alerts</h3>
              <Link to="/admin/inventory" className="text-label text-xs text-primary hover:underline">Manage</Link>
            </div>
            <div className="divide-y divide-outline-variant">
              {MOCK_LOW_STOCK.map(item => (
                <div key={item.name} className="px-md py-sm flex items-center justify-between">
                  <div>
                    <p className="text-body-sm font-medium text-on-surface line-clamp-1">{item.name}</p>
                    <p className="text-label text-xs text-secondary">Stock: {item.stock}</p>
                  </div>
                  {item.stock === 0
                    ? <span className="text-error text-label text-[11px] font-semibold">Out of Stock</span>
                    : <AlertTriangle size={16} className="text-tertiary shrink-0" />
                  }
                </div>
              ))}
            </div>
            <div className="px-md py-sm border-t border-outline-variant">
              <Link to="/admin/inventory">
                <button className="text-label text-xs text-primary hover:underline cursor-pointer">Reorder All Low Stock →</button>
              </Link>
            </div>
          </div>

          {/* New quote requests */}
          <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
            <div className="px-md py-sm border-b border-outline-variant">
              <h3 className="text-h3 font-medium text-on-surface">New Quote Requests</h3>
            </div>
            <div className="divide-y divide-outline-variant">
              {MOCK_QUOTES.map(q => (
                <div key={q.reference} className="px-md py-sm">
                  <div className="flex items-center justify-between mb-xs">
                    <p className="text-body-sm font-medium text-on-surface">{q.name}</p>
                    <p className="text-label text-[11px] text-secondary">{formatDate(q.date)}</p>
                  </div>
                  <p className="text-body-sm text-secondary mb-xs">{q.category}</p>
                  <p className="text-label text-xs text-primary">{q.reference}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
