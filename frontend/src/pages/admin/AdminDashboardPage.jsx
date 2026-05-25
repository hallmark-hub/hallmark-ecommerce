import { Link } from 'react-router-dom'
import { ShoppingBag, DollarSign, Clock, CheckCircle, AlertTriangle, ArrowRight, TrendingUp, Users, Package, MessageSquare } from 'lucide-react'
import { formatPrice, formatDate } from '../../utils/format'

const MOCK_STATS = [
  { label: 'Total Revenue', value: formatPrice(48500000), sub: '+12% this month', icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10', trend: '+12%', up: true },
  { label: 'Total Orders', value: '142', sub: '18 this week', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+18', up: true },
  { label: 'Pending Orders', value: '6', sub: 'Needs attention', icon: Clock, color: 'text-gold', bg: 'bg-gold/10', trend: null, up: false },
  { label: 'Delivered', value: '128', sub: '90.1% completion', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', trend: '90.1%', up: true },
  { label: 'Active Clients', value: '89', sub: 'Hotels & restaurants', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+5', up: true },
  { label: 'Quote Requests', value: '14', sub: '3 awaiting reply', icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-50', trend: '3 new', up: null },
]

const MOCK_RECENT_ORDERS = [
  { id: 'o1', reference: 'CW-20260525-0042', client: 'Kempinski Hotel Accra', amount_pesewas: 480000, status: 'confirmed', date: '2026-05-25T10:00:00Z', items: 4 },
  { id: 'o2', reference: 'CW-20260524-0041', client: 'Mövenpick Hotel', amount_pesewas: 185000, status: 'pending', date: '2026-05-24T14:00:00Z', items: 2 },
  { id: 'o3', reference: 'CW-20260523-0040', client: 'Holiday Inn Accra', amount_pesewas: 90000, status: 'delivered', date: '2026-05-23T09:00:00Z', items: 3 },
  { id: 'o4', reference: 'CW-20260522-0039', client: 'La Palm Royal Beach', amount_pesewas: 210000, status: 'confirmed', date: '2026-05-22T11:00:00Z', items: 6 },
  { id: 'o5', reference: 'CW-20260521-0038', client: 'Accra City Hotel', amount_pesewas: 65000, status: 'delivered', date: '2026-05-21T08:00:00Z', items: 1 },
]

const MOCK_LOW_STOCK = [
  { name: 'Industrial Gas Range 6-Burner', stock: 2, threshold: 5 },
  { name: 'Classic White Chef Jacket (XL)', stock: 3, threshold: 10 },
  { name: 'Commercial Double Fryer', stock: 0, threshold: 3 },
  { name: 'Stainless Prep Table 1.5m', stock: 4, threshold: 8 },
]

const MOCK_QUOTES = [
  { reference: 'QR-20260525-0001', name: 'Kwame Asante', company: 'Frankie\'s Hotel', category: 'Industrial Kitchen Setup', date: '2026-05-25T08:00:00Z', urgent: true },
  { reference: 'QR-20260524-0002', name: 'Abena Osei', company: 'Volta Hotel', category: 'Embroidery Services', date: '2026-05-24T16:00:00Z', urgent: false },
  { reference: 'QR-20260524-0003', name: 'Kofi Mensah', company: 'Fiesta Royale', category: 'Machine Pre-Orders', date: '2026-05-24T11:00:00Z', urgent: false },
]

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
  const maxRevenue = Math.max(...MONTHLY_REVENUE.map(r => r.value))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-on-surface">Enterprise Overview</h1>
          <p className="text-secondary text-sm mt-1">ChefWare Enterprise — May 2026</p>
        </div>
        <Link to="/admin/orders">
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-container transition-colors cursor-pointer">
            <Package size={16} /> Manage Orders
          </button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {MOCK_STATS.map(s => {
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
                  {MOCK_RECENT_ORDERS.map(o => (
                    <tr key={o.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-primary">{o.reference}</td>
                      <td className="px-6 py-4 text-sm text-secondary hidden md:table-cell">{o.client}</td>
                      <td className="px-6 py-4 text-sm font-bold text-on-surface">{formatPrice(o.amount_pesewas)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${STATUS_STYLES[o.status]}`}>{o.status}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-secondary hidden lg:table-cell">{formatDate(o.date)}</td>
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
              {MOCK_LOW_STOCK.map(item => (
                <div key={item.name} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden max-w-[80px]">
                        <div
                          className={`h-full rounded-full ${item.stock === 0 ? 'bg-error' : item.stock <= 3 ? 'bg-gold' : 'bg-primary'}`}
                          style={{ width: `${Math.min(100, (item.stock / item.threshold) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-secondary">{item.stock}/{item.threshold}</span>
                    </div>
                  </div>
                  {item.stock === 0
                    ? <span className="text-[10px] font-bold text-error bg-error/10 px-2 py-0.5 rounded-full shrink-0">Empty</span>
                    : <AlertTriangle size={15} className="text-gold shrink-0" />
                  }
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-outline-variant">
              <Link to="/admin/inventory" className="text-xs text-primary font-semibold hover:underline cursor-pointer">Reorder Low Stock →</Link>
            </div>
          </div>

          {/* Quote Requests */}
          <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden">
            <div className="px-5 py-4 border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-bold text-on-surface">Quote Requests</h3>
              <span className="text-[10px] font-bold bg-gold/15 text-gold px-2 py-0.5 rounded-full">{MOCK_QUOTES.length} new</span>
            </div>
            <div className="divide-y divide-outline-variant">
              {MOCK_QUOTES.map(q => (
                <div key={q.reference} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-on-surface">{q.name}</p>
                    {q.urgent && <span className="text-[9px] font-bold uppercase tracking-wider bg-error/10 text-error px-1.5 py-0.5 rounded-full shrink-0">Urgent</span>}
                  </div>
                  <p className="text-xs text-secondary mb-0.5">{q.company}</p>
                  <p className="text-xs text-primary font-medium">{q.category}</p>
                  <p className="text-[10px] text-secondary mt-1">{formatDate(q.date)} · {q.reference}</p>
                </div>
              ))}
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
