import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Smartphone, Building2, ChevronRight, AlertTriangle } from 'lucide-react'
import useCartStore from '../store/cartStore'
import { createOrder } from '../api/orders'
import { initializePaystack, bankTransfer } from '../api/payments'
import { formatPrice } from '../utils/format'
import { validatePhone, formatPhone } from '../utils/format'
import Button from '../components/Button'

const STEP_SHIPPING = 1
const STEP_PAYMENT = 2

const PAYMENT_METHODS = [
  { id: 'mtn_momo', label: 'MTN MoMo', desc: 'Pay instantly with MTN Mobile Money', icon: Smartphone, apiValue: 'paystack' },
  { id: 'vodafone', label: 'Vodafone Cash', desc: 'Pay with Vodafone Cash', icon: Smartphone, apiValue: 'paystack' },
  { id: 'bank_gcb', label: 'GCB Bank Transfer', desc: 'Manual bank transfer — GCB Bank', icon: Building2, apiValue: 'bank_transfer', bank: 'gcb' },
  { id: 'bank_stanbic', label: 'Stanbic Bank Transfer', desc: 'Manual bank transfer — Stanbic Bank', icon: Building2, apiValue: 'bank_transfer', bank: 'stanbic' },
]

export default function CheckoutPage() {
  const items = useCartStore(s => s.items)
  const total = useCartStore(s => s.total)
  const clearCart = useCartStore(s => s.clearCart)
  const navigate = useNavigate()

  const [step, setStep] = useState(STEP_SHIPPING)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bankDetails, setBankDetails] = useState(null)
  const [acceptedPolicy, setAcceptedPolicy] = useState(false)

  const [shipping, setShipping] = useState({ name: '', company: '', address: '', phone: '' })
  const [paymentMethod, setPaymentMethod] = useState('mtn_momo')

  function updateShipping(field, val) {
    setShipping(prev => ({ ...prev, [field]: val }))
  }

  function validateShipping() {
    if (!shipping.name.trim()) return 'Full name is required.'
    if (!shipping.address.trim()) return 'Delivery address is required.'
    if (!shipping.phone.trim()) return 'Phone number is required.'
    const normalized = formatPhone(shipping.phone)
    if (!validatePhone(normalized)) return 'Phone must be in +233XXXXXXXXX format (10 digits after +233).'
    return ''
  }

  function handleShippingNext() {
    const err = validateShipping()
    if (err) { setError(err); return }
    setError('')
    setStep(STEP_PAYMENT)
  }

  async function handlePlaceOrder() {
    if (!acceptedPolicy) { setError('You must acknowledge the returns policy to continue.'); return }
    setError('')
    setLoading(true)

    const selected = PAYMENT_METHODS.find(m => m.id === paymentMethod)
    const payload = {
      customer: {
        name: shipping.name,
        email: 'customer@example.com',
        phone: formatPhone(shipping.phone),
      },
      items: items.map(i => ({ product_id: i.id, quantity: i.quantity, unit_price_pesewas: i.price_pesewas })),
      payment_method: selected.apiValue,
      accepted_returns_policy: true,
    }

    try {
      const orderRes = await createOrder(payload)
      if (!orderRes.success) throw new Error(orderRes.message)
      const order = orderRes.data

      if (selected.apiValue === 'paystack') {
        const payRes = await initializePaystack(order.id)
        if (!payRes.success) throw new Error(payRes.message)
        clearCart()
        window.location.href = payRes.data.authorization_url
      } else {
        const transferRes = await bankTransfer(order.id, selected.bank)
        if (!transferRes.success) throw new Error(transferRes.message)
        setBankDetails(transferRes.data)
        clearCart()
      }
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0 && !bankDetails) {
    return (
      <main className="pt-20 min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-h3 font-medium text-on-surface mb-4">Your cart is empty</p>
          <Button onClick={() => navigate('/products')}>Continue Shopping</Button>
        </div>
      </main>
    )
  }

  if (bankDetails) {
    return (
      <main className="pt-20 min-h-screen bg-surface">
        <div className="max-w-lg mx-auto px-gutter py-xl text-center">
          <div className="bg-white rounded-xl border border-outline-variant p-xl">
            <Building2 size={48} className="text-primary mx-auto mb-md" />
            <h1 className="text-h2 font-medium text-on-surface mb-sm">Bank Transfer Instructions</h1>
            <p className="text-secondary text-body-sm mb-md">{bankDetails.instructions}</p>
            <div className="text-left space-y-sm bg-surface-container-low rounded-lg p-md mb-md">
              <div className="flex justify-between text-body-sm"><span className="text-secondary">Bank</span><span className="font-medium">{bankDetails.bank_name}</span></div>
              <div className="flex justify-between text-body-sm"><span className="text-secondary">Account Name</span><span className="font-medium">{bankDetails.account_name}</span></div>
              <div className="flex justify-between text-body-sm"><span className="text-secondary">Account Number</span><span className="font-medium">{bankDetails.account_number}</span></div>
              <div className="flex justify-between text-body-sm"><span className="text-secondary">Branch</span><span className="font-medium">{bankDetails.branch}</span></div>
              <div className="flex justify-between text-body-sm"><span className="text-secondary">Reference</span><span className="font-bold text-primary">{bankDetails.reference}</span></div>
              <div className="flex justify-between text-body-sm"><span className="text-secondary">Amount</span><span className="font-bold text-primary">{formatPrice(bankDetails.amount_pesewas)}</span></div>
            </div>
            <p className="text-body-sm text-error font-medium mb-md">Use the reference number exactly as shown above.</p>
            <Button onClick={() => navigate('/')} variant="primary" className="w-full">Back to Home</Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="pt-20 min-h-screen bg-surface">
      <div className="max-w-container-max mx-auto px-gutter py-xl">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-xl">
          <div className={`flex items-center gap-2 text-body-sm font-medium ${step >= STEP_SHIPPING ? 'text-primary' : 'text-secondary'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= STEP_SHIPPING ? 'bg-primary text-white' : 'bg-secondary-container text-secondary'}`}>1</span>
            Shipping
          </div>
          <ChevronRight size={16} className="text-outline-variant" />
          <div className={`flex items-center gap-2 text-body-sm font-medium ${step >= STEP_PAYMENT ? 'text-primary' : 'text-secondary'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= STEP_PAYMENT ? 'bg-primary text-white' : 'bg-secondary-container text-secondary'}`}>2</span>
            Payment
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
          {/* Form */}
          <div className="lg:col-span-2">
            {error && (
              <div className="flex items-center gap-2 bg-error-container text-on-error-container px-md py-sm rounded-lg mb-md">
                <AlertTriangle size={16} className="shrink-0" />
                <p className="text-body-sm">{error}</p>
              </div>
            )}

            {step === STEP_SHIPPING && (
              <div className="bg-white rounded-xl border border-outline-variant p-xl">
                <h2 className="text-h2 font-medium text-on-surface mb-md">Shipping Information</h2>
                <div className="space-y-md">
                  <div>
                    <label className="block text-label text-xs font-semibold text-secondary uppercase tracking-wide mb-xs" htmlFor="name">Full Name *</label>
                    <input id="name" type="text" value={shipping.name} onChange={e => updateShipping('name', e.target.value)} className="w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Kwame Asante" />
                  </div>
                  <div>
                    <label className="block text-label text-xs font-semibold text-secondary uppercase tracking-wide mb-xs" htmlFor="company">Company / Restaurant (optional)</label>
                    <input id="company" type="text" value={shipping.company} onChange={e => updateShipping('company', e.target.value)} className="w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Kempinski Hotel Accra" />
                  </div>
                  <div>
                    <label className="block text-label text-xs font-semibold text-secondary uppercase tracking-wide mb-xs" htmlFor="address">Delivery Address (Accra) *</label>
                    <input id="address" type="text" value={shipping.address} onChange={e => updateShipping('address', e.target.value)} className="w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary" placeholder="House 12, Osu Oxford Street, Accra" />
                    <p className="text-label text-xs text-secondary mt-xs">Delivery within Greater Accra. 24 hours after payment confirmed.</p>
                  </div>
                  <div>
                    <label className="block text-label text-xs font-semibold text-secondary uppercase tracking-wide mb-xs" htmlFor="phone">Phone Number *</label>
                    <input id="phone" type="tel" value={shipping.phone} onChange={e => updateShipping('phone', e.target.value)} className="w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary" placeholder="+233244123456" />
                    <p className="text-label text-xs text-secondary mt-xs">Format: +233XXXXXXXXX</p>
                  </div>
                </div>
                <Button onClick={handleShippingNext} variant="primary" size="lg" className="w-full mt-xl">
                  Continue to Payment <ChevronRight size={18} />
                </Button>
              </div>
            )}

            {step === STEP_PAYMENT && (
              <div className="bg-white rounded-xl border border-outline-variant p-xl">
                <button onClick={() => setStep(STEP_SHIPPING)} className="text-secondary hover:text-primary text-body-sm mb-md flex items-center gap-1 cursor-pointer">
                  ← Back to Shipping
                </button>
                <h2 className="text-h2 font-medium text-on-surface mb-md">Payment Method</h2>
                <div className="space-y-sm mb-md">
                  {PAYMENT_METHODS.map(m => {
                    const Icon = m.icon
                    return (
                      <label key={m.id} className={`flex items-center gap-md p-md rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === m.id ? 'border-primary bg-surface-container-low' : 'border-outline-variant hover:border-primary/50'}`}>
                        <input type="radio" name="payment" value={m.id} checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} className="accent-primary" />
                        <Icon size={24} className={paymentMethod === m.id ? 'text-primary' : 'text-secondary'} />
                        <div>
                          <p className="text-body font-medium text-on-surface">{m.label}</p>
                          <p className="text-body-sm text-secondary">{m.desc}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>

                {/* Returns policy */}
                <div className="bg-error-container/30 border border-error/30 rounded-lg p-md mb-md">
                  <p className="text-body-sm text-on-surface font-medium mb-sm">Returns Policy</p>
                  <p className="text-body-sm text-error font-semibold">No refunds. Exchange only within 3 days of purchase.</p>
                </div>
                <label className="flex items-start gap-sm cursor-pointer mb-md">
                  <input type="checkbox" checked={acceptedPolicy} onChange={e => setAcceptedPolicy(e.target.checked)} className="mt-0.5 accent-primary" />
                  <span className="text-body-sm text-on-surface">I have read and accept the returns policy — No refunds. Exchange only within 3 days of purchase.</span>
                </label>

                <Button onClick={handlePlaceOrder} loading={loading} variant="primary" size="lg" className="w-full">
                  Place Order
                </Button>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <aside className="bg-white rounded-xl border border-outline-variant p-xl h-fit">
            <h2 className="text-h3 font-medium text-on-surface mb-md">Order Summary</h2>
            <div className="divide-y divide-outline-variant mb-md">
              {items.map(item => (
                <div key={item.id} className="py-sm flex gap-sm">
                  <img src={item.images?.[0]} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-surface-container" />
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium line-clamp-1">{item.name}</p>
                    <p className="text-label text-xs text-secondary">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-body-sm font-bold text-primary shrink-0">{formatPrice(item.price_pesewas * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-xs">
              <div className="flex justify-between text-body-sm text-secondary">
                <span>Subtotal</span><span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-body-sm text-secondary">
                <span>Delivery</span><span className="text-primary font-medium">Free (Accra)</span>
              </div>
              <div className="flex justify-between text-h3 font-semibold text-on-surface pt-sm border-t border-outline-variant">
                <span>Total</span><span>{formatPrice(total)}</span>
              </div>
            </div>
            <p className="text-label text-xs text-secondary mt-md">VAT treatment TBC. Prices shown inclusive.</p>
          </aside>
        </div>
      </div>
    </main>
  )
}
