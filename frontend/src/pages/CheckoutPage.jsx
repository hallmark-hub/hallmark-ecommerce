import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Smartphone, ChevronRight, AlertTriangle, ShieldCheck, Truck, Lock } from 'lucide-react'
import useCartStore from '../store/cartStore'
import { createOrder } from '../api/orders'
import { initializePaystack } from '../api/payments'
import { formatPrice } from '../utils/format'
import { validatePhone, formatPhone } from '../utils/format'
import Button from '../components/Button'
import { productImage, useFallbackImage } from '../utils/images'

const STEP_SHIPPING = 1
const STEP_PAYMENT = 2
const PENDING_ORDER_KEY = 'chefware-pending-order'

const PAYMENT_METHODS = [
  { id: 'mtn_momo', label: 'MTN MoMo', desc: 'Pay instantly with MTN Mobile Money', icon: Smartphone },
  { id: 'vodafone', label: 'Vodafone Cash', desc: 'Pay with Vodafone Cash', icon: Smartphone },
  { id: 'airteltigo', label: 'AirtelTigo Money', desc: 'Pay with AirtelTigo Mobile Money', icon: Smartphone },
  { id: 'card', label: 'Debit / Credit Card', desc: 'Visa, Mastercard and bank cards', icon: Smartphone },
]

const inputCls = 'w-full h-12 px-4 bg-white border border-outline-variant rounded-xl text-body text-on-surface placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors'

export default function CheckoutPage() {
  const items = useCartStore(s => s.items)
  const total = useCartStore(s => s.total)
  const clearCart = useCartStore(s => s.clearCart)
  const navigate = useNavigate()

  const [step, setStep] = useState(STEP_SHIPPING)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [acceptedPolicy, setAcceptedPolicy] = useState(false)

  const [shipping, setShipping] = useState({ name: '', email: '', company: '', address: '', phone: '' })
  const [paymentMethod, setPaymentMethod] = useState('mtn_momo')

  function updateShipping(field, val) {
    setShipping(prev => ({ ...prev, [field]: val }))
  }

  function validateShipping() {
    if (!shipping.name.trim()) return 'Full name is required.'
    if (!shipping.email.trim() || !/\S+@\S+\.\S+/.test(shipping.email)) return 'A valid email address is required.'
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

    const payload = {
      customer: {
        name: shipping.name,
        email: shipping.email,
        phone: formatPhone(shipping.phone),
      },
      items: items.map(i => ({ product_id: i.id, quantity: i.quantity })),
      payment_method: 'paystack',
      accepted_returns_policy: true,
    }

    try {
      const orderRes = await createOrder(payload)
      if (!orderRes.success) throw new Error(orderRes.message)
      sessionStorage.setItem(PENDING_ORDER_KEY, JSON.stringify({
        reference: orderRes.data.reference,
        phone: payload.customer.phone,
        customer: payload.customer,
      }))
      const payRes = await initializePaystack(orderRes.data.id)
      if (!payRes.success) throw new Error(payRes.message)
      clearCart()
      window.location.href = payRes.data.authorization_url
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <main className="pt-20 min-h-screen bg-surface-container-low">
        <div className="max-w-2xl mx-auto px-gutter py-20 text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-card">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-secondary">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <h1 className="text-h2 text-on-surface mb-2">Your cart is empty</h1>
          <p className="text-body text-secondary mb-8 max-w-sm mx-auto">Browse our catalog to get started.</p>
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <Button onClick={() => navigate('/products')} variant="primary" size="lg">Browse Products</Button>
            <Button onClick={() => navigate('/quote')} variant="gold" size="lg">Request a Quote</Button>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center border-t border-outline-variant pt-8">
            {[
              { label: 'Chef Uniforms', to: '/products?category=chef-uniforms' },
              { label: 'Kitchen Equipment', to: '/products?category=kitchen-equipment-tools' },
              { label: 'Staff Uniforms', to: '/products?category=staff-uniforms-branding' },
            ].map(c => (
              <button
                key={c.label}
                onClick={() => navigate(c.to)}
                className="py-3 px-2 rounded-xl border border-outline-variant text-body-sm text-secondary hover:border-primary hover:text-primary transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="pt-20 min-h-screen bg-surface-container-low flex">

      {/* Full-height left image panel */}
      <div className="hidden lg:block sticky top-20 h-[calc(100vh-80px)] self-start flex-none w-[400px] xl:w-[460px]">
        <div className="relative w-full h-full">
          <img
            src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=900&q=80"
            alt="Professional chef in kitchen"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-10">
            <p className="text-white text-h1 font-bold leading-tight mb-3">Accra's #1<br />Hospitality Supplier</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
              <p className="text-white/75 text-body-sm">Trusted by 500+ Hotels & Restaurants</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right scrollable content */}
      <div className="flex-1 min-w-0 px-8 lg:px-12 py-10 md:py-14 bg-surface-container-low">
        <div className="max-w-2xl mx-auto lg:max-w-none">

        {/* Step Progress */}
        <div className="flex items-center max-w-xs mb-10">
          <div className={`flex items-center gap-2.5 ${step >= STEP_SHIPPING ? 'text-primary' : 'text-secondary'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-body-sm font-bold shrink-0 ${step >= STEP_SHIPPING ? 'bg-primary text-white' : 'bg-white border-2 border-outline-variant text-secondary'}`}>1</span>
            <span className="text-body-sm font-semibold">Shipping</span>
          </div>
          <div className={`flex-1 h-0.5 mx-3 rounded-full ${step >= STEP_PAYMENT ? 'bg-primary' : 'bg-outline-variant'}`} />
          <div className={`flex items-center gap-2.5 ${step >= STEP_PAYMENT ? 'text-primary' : 'text-secondary'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-body-sm font-bold shrink-0 ${step >= STEP_PAYMENT ? 'bg-primary text-white' : 'bg-white border-2 border-outline-variant text-secondary'}`}>2</span>
            <span className="text-body-sm font-semibold">Payment</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* ── Form Panel ── */}
          <div className="lg:col-span-2 space-y-4">
            {error && (
              <div className="flex items-center gap-3 bg-error-container border border-error/30 text-on-error-container px-4 py-3 rounded-xl">
                <AlertTriangle size={16} className="shrink-0 text-error" />
                <p className="text-body-sm">{error}</p>
              </div>
            )}

            {step === STEP_SHIPPING && (
              <div className="bg-white rounded-2xl border border-outline-variant shadow-card overflow-hidden">
                <div className="px-8 py-6 border-b border-outline-variant bg-surface-container-lowest">
                  <h2 className="text-h2 text-on-surface">Shipping Information</h2>
                  <p className="text-body-sm text-secondary mt-1">We deliver within Greater Accra in 24 hours after payment.</p>
                </div>
                <div className="px-8 py-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div>
                      <label className="block text-label uppercase text-secondary mb-2" htmlFor="name">Full Name <span className="text-error">*</span></label>
                      <input id="name" type="text" value={shipping.name} onChange={e => updateShipping('name', e.target.value)} className={inputCls} placeholder="Kwame Asante" />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-label uppercase text-secondary mb-2" htmlFor="phone">Phone Number <span className="text-error">*</span></label>
                      <input id="phone" type="tel" value={shipping.phone} onChange={e => updateShipping('phone', e.target.value)} className={inputCls} placeholder="+233244123456" />
                      <p className="text-label uppercase text-secondary mt-2">Format: +233XXXXXXXXX</p>
                    </div>

                    {/* Email */}
                    <div className="sm:col-span-2">
                      <label className="block text-label uppercase text-secondary mb-2" htmlFor="email">Email Address <span className="text-error">*</span></label>
                      <input id="email" type="email" value={shipping.email} onChange={e => updateShipping('email', e.target.value)} className={inputCls} placeholder="kwame@example.com" />
                    </div>

                    {/* Company */}
                    <div className="sm:col-span-2">
                      <label className="block text-label uppercase text-secondary mb-2" htmlFor="company">Company / Restaurant <span className="text-secondary/60">(optional)</span></label>
                      <input id="company" type="text" value={shipping.company} onChange={e => updateShipping('company', e.target.value)} className={inputCls} placeholder="Kempinski Hotel Accra" />
                    </div>

                    {/* Address */}
                    <div className="sm:col-span-2">
                      <label className="block text-label uppercase text-secondary mb-2" htmlFor="address">Delivery Address (Accra) <span className="text-error">*</span></label>
                      <input id="address" type="text" value={shipping.address} onChange={e => updateShipping('address', e.target.value)} className={inputCls} placeholder="House 12, Osu Oxford Street, Accra" />
                      <div className="flex items-center gap-1.5 mt-2">
                        <Truck size={12} className="text-primary shrink-0" />
                        <p className="text-label uppercase text-primary">Delivery within Greater Accra · 24 hrs after payment confirmed</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-8 pb-8">
                  <Button onClick={handleShippingNext} variant="primary" size="lg" fullWidth iconRight={<ChevronRight />}>
                    Continue to Payment
                  </Button>
                  <div className="flex items-center justify-center gap-1.5 mt-4 text-secondary">
                    <Lock size={12} />
                    <span className="text-label uppercase">Secured with SSL encryption</span>
                  </div>
                </div>
              </div>
            )}

            {step === STEP_PAYMENT && (
              <div className="bg-white rounded-2xl border border-outline-variant shadow-card overflow-hidden">
                <div className="px-8 py-6 border-b border-outline-variant bg-surface-container-lowest">
                  <button
                    onClick={() => setStep(STEP_SHIPPING)}
                    className="flex items-center gap-1 text-body-sm text-secondary hover:text-primary mb-3 transition-colors focus:outline-none focus-visible:underline"
                  >
                    ← Back to Shipping
                  </button>
                  <h2 className="text-h2 text-on-surface">Payment Method</h2>
                  <p className="text-body-sm text-secondary mt-1">All transactions are secured and encrypted.</p>
                </div>

                <div className="px-8 py-8 space-y-3">
                  {PAYMENT_METHODS.map(m => {
                    const Icon = m.icon
                    const active = paymentMethod === m.id
                    return (
                      <label
                        key={m.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          active ? 'border-primary bg-primary/5 shadow-sm' : 'border-outline-variant hover:border-primary/40 hover:bg-surface-container-lowest'
                        }`}
                      >
                        <input type="radio" name="payment" value={m.id} checked={active} onChange={() => setPaymentMethod(m.id)} className="sr-only" />
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${active ? 'bg-primary text-white' : 'bg-surface-container text-secondary'}`}>
                          <Icon size={22} />
                        </div>
                        <div className="flex-1">
                          <p className="text-body font-semibold text-on-surface">{m.label}</p>
                          <p className="text-body-sm text-secondary">{m.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${active ? 'border-primary' : 'border-outline-variant'}`}>
                          {active && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                      </label>
                    )
                  })}
                </div>

                {/* Returns Policy */}
                <div className="px-8 pb-8 space-y-5">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                    <p className="text-body-sm font-semibold text-amber-900 mb-1">Returns Policy</p>
                    <p className="text-body-sm text-amber-800">No refunds. Exchange only within 3 days of purchase. Ensure items are correct before placing your order.</p>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${acceptedPolicy ? 'bg-primary border-primary' : 'border-outline-variant group-hover:border-primary'}`}>
                      {acceptedPolicy && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <input type="checkbox" checked={acceptedPolicy} onChange={e => setAcceptedPolicy(e.target.checked)} className="sr-only" />
                    <span className="text-body-sm text-on-surface leading-relaxed">
                      I have read and accept the returns policy — <span className="font-semibold">No refunds. Exchange only within 3 days of purchase.</span>
                    </span>
                  </label>

                  <div>
                    <Button onClick={handlePlaceOrder} loading={loading} variant="primary" size="lg" fullWidth iconRight={<ShieldCheck />}>
                      Place Order
                    </Button>
                    <div className="flex items-center justify-center gap-1.5 mt-4 text-secondary">
                      <Lock size={12} />
                      <span className="text-label uppercase">Secured with SSL encryption</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Order Summary Sidebar ── */}
          <aside className="bg-white rounded-2xl border border-outline-variant shadow-card overflow-hidden lg:sticky lg:top-28">
            <div className="px-6 py-5 border-b border-outline-variant bg-surface-container-lowest">
              <h2 className="text-h3 text-on-surface">Order Summary</h2>
              <p className="text-body-sm text-secondary mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''}</p>
            </div>

            <div className="px-6 py-2 divide-y divide-outline-variant/60">
              {items.map(item => (
                <div key={item.id} className="py-4 flex gap-3 items-start">
                  <img src={productImage(item)} alt={item.name} onError={useFallbackImage} className="w-14 h-14 rounded-xl object-cover bg-surface-container shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-on-surface line-clamp-2 leading-snug">{item.name}</p>
                    <p className="text-body-sm text-secondary mt-1">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-body-sm font-bold text-primary shrink-0 whitespace-nowrap">{formatPrice(item.price_pesewas * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="px-6 py-5 border-t border-outline-variant space-y-3">
              <div className="flex justify-between text-body text-secondary">
                <span>Subtotal</span><span className="text-on-surface">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-body">
                <span className="text-secondary">Delivery</span>
                <span className="text-primary font-semibold">Free (Accra)</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-outline-variant">
                <span className="text-h3 text-on-surface">Total</span>
                <span className="text-price text-primary whitespace-nowrap">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="px-6 pb-5 space-y-2">
              <p className="text-label uppercase text-secondary">VAT treatment TBC. Prices shown inclusive.</p>
              <div className="flex items-center gap-2 pt-2">
                <Truck size={14} className="text-primary shrink-0" />
                <p className="text-label uppercase text-primary">Free delivery · Greater Accra · 24hrs</p>
              </div>
            </div>
          </aside>

        </div>
        </div>
      </div>
    </main>
  )
}
