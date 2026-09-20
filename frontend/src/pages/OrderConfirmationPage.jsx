import { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle, Printer, Home } from 'lucide-react'
import Button from '../components/Button'
import { formatPrice, formatDate } from '../utils/format'
import { lookupOrder } from '../api/orders'

const PENDING_ORDER_KEY = 'chefware-pending-order'

export default function OrderConfirmationPage() {
  const { reference } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [phone, setPhone] = useState('')
  const [verifying, setVerifying] = useState(false)

  // Order status is only ever read from the backend. Never assume a payment
  // succeeded from the fact that the customer landed on this URL — they may be
  // on a different device, or the payment may have failed.
  const fetchOrder = useCallback(async (customerPhone) => {
    const res = await lookupOrder(reference, customerPhone)
    if (!res.success) throw new Error(res.message)
    return res.data
  }, [reference])

  useEffect(() => {
    async function loadOrder() {
      setLoading(true)
      setError('')
      const stored = JSON.parse(sessionStorage.getItem(PENDING_ORDER_KEY) || '{}')
      if (!stored.phone) {
        setLoading(false)
        return
      }

      try {
        setOrder(await fetchOrder(stored.phone))
      } catch (e) {
        setError(e.message || 'Unable to load order details.')
      } finally {
        setLoading(false)
      }
    }
    loadOrder()
  }, [reference, fetchOrder])

  async function handleVerify(e) {
    e.preventDefault()
    setVerifying(true)
    setError('')
    try {
      setOrder(await fetchOrder(phone))
    } catch {
      setError('No order found for that reference and phone number.')
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <main className="pt-20 min-h-screen bg-surface">
        <div className="max-w-2xl mx-auto px-gutter py-section-mobile md:py-section text-center">
          <p className="text-body text-secondary">Loading order details...</p>
        </div>
      </main>
    )
  }

  if (!order) {
    return (
      <main className="pt-20 min-h-screen bg-surface">
        <div className="max-w-md mx-auto px-gutter py-section-mobile md:py-section text-center">
          <AlertTriangle size={48} className="text-tertiary mx-auto mb-md" />
          <h1 className="text-h2 text-on-surface mb-sm">Confirm Your Order</h1>
          <p className="text-body text-secondary mb-xs">
            Order reference <span className="font-semibold text-primary">{reference}</span>
          </p>
          <p className="text-body-sm text-secondary mb-md">
            Enter the phone number used at checkout to view this order's status and receipt.
          </p>
          <form onSubmit={handleVerify} className="space-y-sm text-left">
            <label className="block text-label uppercase text-secondary" htmlFor="lookup-phone">Phone Number</label>
            <input
              id="lookup-phone"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+233244123456"
              className="w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            {error && <p className="text-body-sm text-error">{error}</p>}
            <Button type="submit" loading={verifying} variant="primary" size="lg" fullWidth>
              View Order
            </Button>
          </form>
          <div className="mt-md">
            <Button as={Link} to="/" variant="ghost" size="md" iconLeft={<Home />}>Back to Home</Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="pt-20 min-h-screen bg-surface">
      <div className="max-w-2xl mx-auto px-gutter py-section-mobile md:py-section">
        {/* Success header */}
        <div className="text-center mb-xl">
          <CheckCircle size={64} className="text-primary mx-auto mb-md" />
          <h1 className="text-h1 text-on-surface mb-sm">Order Confirmed!</h1>
          <p className="text-body-lg text-secondary">Medaase! Thank you for your order.</p>
          {order.customer.phone && <p className="text-body-sm text-secondary mt-xs">Save your reference above — quote it to our team on WhatsApp for any updates.</p>}
          {error && <p className="text-body-sm text-tertiary mt-xs">{error}</p>}
        </div>

        <div className="bg-white rounded-xl border border-outline-variant p-xl mb-md">
          <div className="flex justify-between items-start mb-md pb-md border-b border-outline-variant">
            <div>
              <p className="text-label uppercase text-secondary mb-xs">Order Reference</p>
              <p className="text-h3 text-primary">{order.reference}</p>
            </div>
            <div className="text-right">
              <p className="text-label uppercase text-secondary mb-xs">Date</p>
              <p className="text-body-sm text-on-surface">{formatDate(order.created_at)}</p>
            </div>
          </div>

          {/* Items */}
          <div className="mb-md">
            <h3 className="text-h3 text-on-surface mb-sm">Items Ordered</h3>
            <div className="space-y-sm">
              {order.items.length > 0 ? order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-body">
                  <span className="text-on-surface">{item.product_name} <span className="text-secondary">× {item.quantity}</span></span>
                  <span className="font-semibold text-primary whitespace-nowrap">{formatPrice(item.unit_price_pesewas * item.quantity)}</span>
                </div>
              )) : (
                <p className="text-body-sm text-secondary">Receipt details will be available from order lookup.</p>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-outline-variant pt-md space-y-2">
            <div className="flex justify-between text-body text-secondary">
              <span>Subtotal</span><span>{formatPrice(order.total_pesewas)}</span>
            </div>
            <div className="flex justify-between text-body text-secondary">
              <span>Delivery</span><span className="text-primary font-semibold">Free (Accra)</span>
            </div>
            <div className="flex justify-between items-baseline pt-sm border-t border-outline-variant">
              <span className="text-h3 text-on-surface">Total Paid</span>
              <span className="text-price text-primary whitespace-nowrap">{formatPrice(order.total_pesewas)}</span>
            </div>
          </div>
        </div>

        {/* Delivery & Payment cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-md">
          <div className="bg-white rounded-xl border border-outline-variant p-md">
            <p className="text-label uppercase text-secondary mb-sm">Delivery</p>
            <p className="text-body-sm font-medium text-on-surface">24 hours after payment confirmed</p>
            <p className="text-body-sm text-secondary mt-xs">Greater Accra delivery only.</p>
          </div>
          <div className="bg-white rounded-xl border border-outline-variant p-md">
            <p className="text-label uppercase text-secondary mb-sm">Payment</p>
            <p className="text-body-sm font-medium text-on-surface capitalize">{order.payment_method.replace('_', ' ')}</p>
            <p className={`text-label uppercase mt-xs ${order.payment_status === 'paid' ? 'text-primary' : 'text-tertiary'}`}>
              {order.payment_status === 'paid' ? '✓ Payment received' : 'Pending confirmation'}
            </p>
          </div>
        </div>

        {/* Returns notice */}
        <div className="bg-error-container/30 border border-error/30 rounded-lg p-md mb-xl">
          <p className="text-body-sm text-error font-medium">{order.returns_policy}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-sm">
          <Button as={Link} to="/" variant="primary" size="lg" iconLeft={<Home />} className="flex-1">
            Back to Home
          </Button>
          <Button variant="ghost" size="lg" onClick={() => window.print()} iconLeft={<Printer />} className="flex-1">
            Print Receipt
          </Button>
        </div>
      </div>
    </main>
  )
}
