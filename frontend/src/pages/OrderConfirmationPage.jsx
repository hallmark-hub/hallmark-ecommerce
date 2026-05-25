import { useParams, Link } from 'react-router-dom'
import { CheckCircle, Printer, Home } from 'lucide-react'
import Button from '../components/Button'
import { formatPrice, formatDate } from '../utils/format'

export default function OrderConfirmationPage() {
  const { reference } = useParams()

  // Mock order data for display — real data would come from order lookup
  const order = {
    reference,
    customer: { name: 'Ama Boateng', phone: '+233201987654' },
    items: [
      { product_name: 'Classic White Chef Jacket', quantity: 2, unit_price_pesewas: 45000 },
    ],
    total_pesewas: 90000,
    payment_method: 'paystack',
    payment_status: 'paid',
    order_status: 'confirmed',
    returns_policy: 'No refunds. Exchange only within 3 days of purchase.',
    created_at: new Date().toISOString(),
  }

  return (
    <main className="pt-20 min-h-screen bg-surface">
      <div className="max-w-2xl mx-auto px-gutter py-xl">
        {/* Success header */}
        <div className="text-center mb-xl">
          <CheckCircle size={64} className="text-primary mx-auto mb-md" />
          <h1 className="text-h1 font-medium text-on-surface mb-sm">Order Confirmed!</h1>
          <p className="text-body text-secondary">Medaase! Thank you for your order.</p>
          <p className="text-body-sm text-secondary mt-xs">We'll send confirmation updates to {order.customer.phone}</p>
        </div>

        <div className="bg-white rounded-xl border border-outline-variant p-xl mb-md">
          <div className="flex justify-between items-start mb-md pb-md border-b border-outline-variant">
            <div>
              <p className="text-label text-xs text-secondary uppercase tracking-wide mb-xs">Order Reference</p>
              <p className="text-h3 font-bold text-primary">{order.reference}</p>
            </div>
            <div className="text-right">
              <p className="text-label text-xs text-secondary uppercase tracking-wide mb-xs">Date</p>
              <p className="text-body-sm text-on-surface">{formatDate(order.created_at)}</p>
            </div>
          </div>

          {/* Items */}
          <div className="mb-md">
            <h3 className="text-h3 font-medium text-on-surface mb-sm">Items Ordered</h3>
            <div className="space-y-sm">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-body-sm">
                  <span className="text-on-surface">{item.product_name} <span className="text-secondary">× {item.quantity}</span></span>
                  <span className="font-medium text-primary">{formatPrice(item.unit_price_pesewas * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-outline-variant pt-md space-y-xs">
            <div className="flex justify-between text-body-sm text-secondary">
              <span>Subtotal</span><span>{formatPrice(order.total_pesewas)}</span>
            </div>
            <div className="flex justify-between text-body-sm text-secondary">
              <span>Delivery</span><span className="text-primary font-medium">Free (Accra)</span>
            </div>
            <div className="flex justify-between text-h3 font-semibold text-on-surface pt-sm">
              <span>Total Paid</span><span>{formatPrice(order.total_pesewas)}</span>
            </div>
          </div>
        </div>

        {/* Delivery & Payment cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-md">
          <div className="bg-white rounded-xl border border-outline-variant p-md">
            <p className="text-label text-xs text-secondary uppercase tracking-wide mb-sm">Delivery</p>
            <p className="text-body-sm font-medium text-on-surface">24 hours after payment confirmed</p>
            <p className="text-body-sm text-secondary mt-xs">Greater Accra delivery only.</p>
          </div>
          <div className="bg-white rounded-xl border border-outline-variant p-md">
            <p className="text-label text-xs text-secondary uppercase tracking-wide mb-sm">Payment</p>
            <p className="text-body-sm font-medium text-on-surface capitalize">{order.payment_method.replace('_', ' ')}</p>
            <p className={`text-label text-xs mt-xs font-semibold ${order.payment_status === 'paid' ? 'text-primary' : 'text-tertiary'}`}>
              {order.payment_status === 'paid' ? '✓ Payment received' : 'Pending confirmation'}
            </p>
          </div>
        </div>

        {/* Returns notice */}
        <div className="bg-error-container/30 border border-error/30 rounded-lg p-md mb-xl">
          <p className="text-body-sm text-error font-medium">{order.returns_policy}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-sm">
          <Link to="/" className="flex-1">
            <Button variant="primary" className="w-full"><Home size={18} /> Back to Home</Button>
          </Link>
          <Button variant="ghost" onClick={() => window.print()} className="flex-1">
            <Printer size={18} /> Print Receipt
          </Button>
        </div>
      </div>
    </main>
  )
}
