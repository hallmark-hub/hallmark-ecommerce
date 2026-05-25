import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Wrench, FileText, Award, Search, ArrowRight } from 'lucide-react'
import { lookupOrder } from '../api/orders'
import { validatePhone, formatPhone, formatPrice, formatDate } from '../utils/format'
import Button from '../components/Button'

const MOCK_ORDERS = [
  { id: 'o1', reference: 'CW-20260520-0001', date: '2026-05-20T10:00:00Z', status: 'delivered', total_pesewas: 90000 },
  { id: 'o2', reference: 'CW-20260518-0002', date: '2026-05-18T14:30:00Z', status: 'confirmed', total_pesewas: 185000 },
  { id: 'o3', reference: 'CW-20260510-0003', date: '2026-05-10T09:00:00Z', status: 'pending', total_pesewas: 45000 },
]

const STATUS_STYLES = {
  pending: 'bg-tertiary-fixed/30 text-tertiary',
  confirmed: 'bg-surface-container text-primary',
  delivered: 'bg-primary-fixed/30 text-primary',
}

export default function AccountPage() {
  const [lookup, setLookup] = useState({ reference: '', phone: '' })
  const [lookupResult, setLookupResult] = useState(null)
  const [lookupError, setLookupError] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)

  async function handleLookup(e) {
    e.preventDefault()
    setLookupError('')
    setLookupResult(null)
    if (!lookup.reference.trim()) { setLookupError('Order reference is required.'); return }
    if (!validatePhone(formatPhone(lookup.phone))) { setLookupError('Phone must be +233XXXXXXXXX.'); return }
    setLookupLoading(true)
    try {
      const res = await lookupOrder(lookup.reference.trim(), formatPhone(lookup.phone))
      if (res.success) setLookupResult(res.data)
      else setLookupError(res.message)
    } catch {
      setLookupError('Lookup failed. Check your reference and phone number.')
    } finally {
      setLookupLoading(false)
    }
  }

  return (
    <main className="pt-20 min-h-screen bg-surface">
      <div className="max-w-container-max mx-auto px-gutter py-xl">
        <div className="mb-xl">
          <h1 className="text-h1 font-medium text-on-surface">Welcome back, Kwame</h1>
          <p className="text-body text-secondary">Manage your orders and services</p>
          <p className="text-label text-xs text-tertiary mt-xs font-semibold uppercase tracking-wide">Mock UI — real auth pending backend contract</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-xl">
          {[
            { label: 'Active Orders', value: '2', icon: Package, color: 'text-primary' },
            { label: 'Equipment in Service', value: '5', icon: Wrench, color: 'text-primary' },
            { label: 'Service Requests', value: '1', icon: FileText, color: 'text-tertiary' },
            { label: 'Loyalty Tier', value: 'Gold', icon: Award, color: 'text-gold' },
          ].map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-white rounded-xl border border-outline-variant p-md">
                <Icon size={24} className={`${stat.color} mb-sm`} />
                <p className="text-h2 font-bold text-on-surface">{stat.value}</p>
                <p className="text-body-sm text-secondary">{stat.label}</p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
          {/* Recent orders */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
              <div className="px-md py-sm border-b border-outline-variant flex justify-between items-center">
                <h2 className="text-h3 font-medium text-on-surface">Recent Orders</h2>
                <Link to="/products" className="text-label text-xs text-primary hover:underline">Browse Catalog</Link>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container-low text-left">
                    <th className="px-md py-sm text-label text-xs text-secondary uppercase tracking-wide">Order ID</th>
                    <th className="px-md py-sm text-label text-xs text-secondary uppercase tracking-wide">Date</th>
                    <th className="px-md py-sm text-label text-xs text-secondary uppercase tracking-wide">Status</th>
                    <th className="px-md py-sm text-label text-xs text-secondary uppercase tracking-wide">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {MOCK_ORDERS.map(o => (
                    <tr key={o.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-md py-sm text-body-sm font-medium text-primary">{o.reference}</td>
                      <td className="px-md py-sm text-body-sm text-secondary">{formatDate(o.date)}</td>
                      <td className="px-md py-sm">
                        <span className={`px-2 py-0.5 rounded-full text-label text-[11px] font-semibold capitalize ${STATUS_STYLES[o.status]}`}>{o.status}</span>
                      </td>
                      <td className="px-md py-sm text-body-sm font-bold text-primary">{formatPrice(o.total_pesewas)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick procurement */}
            <div className="bg-white rounded-xl border border-outline-variant p-md mt-md">
              <h3 className="text-h3 font-medium text-on-surface mb-md">Quick Procurement</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-sm">
                {['Chef Uniforms', 'Equipment', 'Branding', 'Kitchen Setup', 'Embroidery', 'Pre-orders'].map(cat => (
                  <Link key={cat} to="/products" className="flex items-center justify-between px-sm py-xs rounded-lg border border-outline-variant hover:border-primary hover:bg-surface-container-low transition-all text-body-sm text-on-surface cursor-pointer">
                    {cat} <ArrowRight size={14} className="text-secondary" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Order lookup */}
          <div>
            <div className="bg-white rounded-xl border border-outline-variant p-md mb-md">
              <h3 className="text-h3 font-medium text-on-surface mb-md">Track an Order</h3>
              <form onSubmit={handleLookup} className="space-y-sm">
                <input
                  type="text"
                  value={lookup.reference}
                  onChange={e => setLookup(p => ({ ...p, reference: e.target.value }))}
                  placeholder="Order reference (CW-...)"
                  className="w-full px-sm py-xs border border-outline-variant rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="tel"
                  value={lookup.phone}
                  onChange={e => setLookup(p => ({ ...p, phone: e.target.value }))}
                  placeholder="Phone (+233...)"
                  className="w-full px-sm py-xs border border-outline-variant rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {lookupError && <p className="text-body-sm text-error">{lookupError}</p>}
                <Button type="submit" loading={lookupLoading} variant="primary" size="sm" className="w-full">
                  <Search size={14} /> Track Order
                </Button>
              </form>
              {lookupResult && (
                <div className="mt-md pt-md border-t border-outline-variant">
                  <p className="text-body-sm font-medium text-on-surface mb-xs">{lookupResult.reference}</p>
                  <p className="text-body-sm text-secondary">Status: <span className="font-semibold capitalize text-primary">{lookupResult.order_status}</span></p>
                  <p className="text-body-sm text-secondary">Total: <span className="font-semibold text-primary">{formatPrice(lookupResult.total_pesewas)}</span></p>
                </div>
              )}
            </div>

            {/* Promo cards */}
            <div className="bg-primary-container rounded-xl p-md text-white mb-md">
              <h3 className="text-h3 font-medium mb-xs">Kitchen Audit</h3>
              <p className="text-body-sm text-on-primary-container mb-sm">Free audit of your current kitchen setup by our experts.</p>
              <Link to="/quote"><Button variant="cta" size="sm">Book Audit</Button></Link>
            </div>
            <div className="bg-surface-container-highest rounded-xl p-md">
              <p className="text-label text-xs uppercase tracking-wide text-secondary mb-xs">New Arrival</p>
              <h3 className="text-h3 font-medium text-on-surface mb-xs">Heritage Collection</h3>
              <p className="text-body-sm text-secondary mb-sm">Explore our new line of premium forest green uniforms.</p>
              <Link to="/products?category=chef-uniforms"><Button variant="ghost" size="sm">View Collection <ArrowRight size={14} /></Button></Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
