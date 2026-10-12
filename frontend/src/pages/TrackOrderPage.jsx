import { Link } from 'react-router-dom'
import { PackageSearch } from 'lucide-react'
import Button from '../components/Button'
import useOrderLookup from '../hooks/useOrderLookup'
import { formatPrice, formatDate } from '../utils/format'
import { usePageTitle } from '../hooks/usePageTitle'

const inputCls = 'w-full h-12 px-4 bg-white border border-outline-variant rounded-xl text-body text-on-surface placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors'

export default function TrackOrderPage() {
  usePageTitle('Track Your Order')
  const { reference, setReference, phone, setPhone, result, error, loading, lookup } = useOrderLookup()

  return (
    <main className="pt-20 min-h-screen bg-surface">
      <div className="max-w-md mx-auto px-gutter py-section-mobile md:py-section">
        <PackageSearch size={48} className="text-primary mb-md" />
        <h1 className="text-h1 text-on-surface mb-sm">Track Your Order</h1>
        <p className="text-body text-secondary mb-lg">Enter your order reference and the phone number used at checkout.</p>

        <form onSubmit={lookup} className="space-y-md" noValidate>
          <div>
            <label htmlFor="track-reference" className="block text-label uppercase text-secondary mb-1.5">Order Reference</label>
            <input id="track-reference" value={reference} onChange={e => setReference(e.target.value)} autoComplete="off" placeholder="e.g. CW-20261012-AB12CD" className={inputCls} />
          </div>
          <div>
            <label htmlFor="track-phone" className="block text-label uppercase text-secondary mb-1.5">Phone Number</label>
            <input id="track-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+233244123456" className={inputCls} />
          </div>
          {error && <p role="alert" className="text-body-sm text-error">{error}</p>}
          <Button type="submit" loading={loading} variant="primary" size="lg" fullWidth>Find Order</Button>
        </form>

        {result && (
          <div className="mt-lg bg-white rounded-xl border border-outline-variant p-md space-y-sm" aria-live="polite">
            <div className="flex justify-between gap-md">
              <span className="text-body-sm text-secondary">Reference</span>
              <span className="text-body-sm font-semibold text-primary">{result.reference}</span>
            </div>
            <div className="flex justify-between gap-md">
              <span className="text-body-sm text-secondary">Placed</span>
              <span className="text-body-sm text-on-surface">{formatDate(result.created_at)}</span>
            </div>
            <div className="flex justify-between gap-md">
              <span className="text-body-sm text-secondary">Order status</span>
              <span className="text-body-sm font-semibold text-on-surface capitalize">{result.order_status}</span>
            </div>
            <div className="flex justify-between gap-md">
              <span className="text-body-sm text-secondary">Payment</span>
              <span className={`text-body-sm font-semibold ${result.payment_status === 'paid' ? 'text-primary' : 'text-tertiary'}`}>
                {result.payment_status === 'paid' ? 'Paid' : result.payment_status === 'failed' ? 'Failed' : 'Pending'}
              </span>
            </div>
            <div className="flex justify-between gap-md pt-sm border-t border-outline-variant">
              <span className="text-body font-semibold text-on-surface">Total</span>
              <span className="text-body font-bold text-primary">{formatPrice(result.total_pesewas)}</span>
            </div>
          </div>
        )}

        <p className="text-body-sm text-secondary mt-lg">
          Have an account? <Link to="/account" className="text-primary font-semibold hover:underline">See all your orders</Link>
        </p>
      </div>
    </main>
  )
}
