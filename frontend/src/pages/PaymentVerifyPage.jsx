import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { XCircle, Clock } from 'lucide-react'
import { initializeSeevcash, verifySeevcash } from '../api/payments'
import useCartStore from '../store/cartStore'
import { PageLoader } from '../components/PageLoader'
import Button from '../components/Button'
import { usePageTitle } from '../hooks/usePageTitle'

const PENDING_ORDER_KEY = 'chefware-pending-order'

export default function PaymentVerifyPage() {
  usePageTitle('Payment')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  // Seev Plus doesn't document which query parameter it appends, so our order reference travels as `order`.
  const reference = searchParams.get('order') || searchParams.get('reference') || searchParams.get('trxref')
  const [status, setStatus] = useState(reference ? 'loading' : 'error')
  const [checkCount, setCheckCount] = useState(0)
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState('')
  const removePurchasedItems = useCartStore(s => s.removePurchasedItems)

  useEffect(() => {
    async function verify() {
      if (!reference) return
      try {
        const res = await verifySeevcash(reference)
        if (res.success && res.data.payment_status === 'paid') {
          const stored = JSON.parse(sessionStorage.getItem(PENDING_ORDER_KEY) || '{}')
          const cartClearedKey = `chefware-cart-cleared-${reference}`
          if (stored.reference === reference && Array.isArray(stored.items) && !sessionStorage.getItem(cartClearedKey)) {
            removePurchasedItems(stored.items)
            sessionStorage.setItem(cartClearedKey, 'true')
          }
          if (!stored.reference || stored.reference === reference) {
            sessionStorage.setItem(PENDING_ORDER_KEY, JSON.stringify({ ...stored, reference }))
          }
          navigate(`/order-confirmation/${reference}`, { replace: true })
        } else if (res.success) {
          setStatus(res.data.payment_status === 'failed' ? 'failed' : 'pending')
        } else {
          setStatus('error')
        }
      } catch {
        setStatus('error')
      }
    }
    verify()
  }, [reference, navigate, removePurchasedItems, checkCount])

  // Re-open payment for the same order instead of creating a new one at checkout
  async function retryPayment() {
    const stored = JSON.parse(sessionStorage.getItem(PENDING_ORDER_KEY) || '{}')
    if (stored.reference !== reference || !stored.id) { navigate('/checkout'); return }
    setRetryError('')
    setRetrying(true)
    try {
      const payRes = await initializeSeevcash(stored.id)
      if (!payRes.success) throw new Error(payRes.message)
      window.location.href = payRes.data.authorization_url
    } catch (e) {
      setRetryError(e.message || 'Payment could not be opened. Please try again.')
      setRetrying(false)
    }
  }

  const MESSAGES = {
    pending: {
      title: 'Payment not completed',
      body: 'We haven\'t received your payment yet. If you approved the prompt on your phone, wait a minute and check again. Otherwise you can retry. Your order is saved.',
    },
    failed: {
      title: 'Payment didn\'t go through',
      body: 'Your mobile money payment was not successful. Your order is saved, so you can try again without re-entering your details.',
    },
    error: {
      title: 'We couldn\'t confirm your payment',
      body: 'If you were charged, contact us with your order reference and we will sort it out.',
    },
  }
  const message = MESSAGES[status] || MESSAGES.error

  if (status === 'loading') {
    return (
      <main className="pt-20 min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <PageLoader />
          <p className="text-body text-secondary mt-md">Verifying your payment...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="pt-20 min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center max-w-sm px-gutter">
        {status === 'pending'
          ? <Clock size={56} className="text-tertiary mx-auto mb-md" />
          : <XCircle size={56} className="text-error mx-auto mb-md" />}
        <h1 className="text-h2 text-on-surface mb-sm">{message.title}</h1>
        <p className="text-body text-secondary mb-sm">{message.body}</p>
        {reference && <p className="text-body-sm text-secondary mb-md">Order reference: <strong className="text-on-surface">{reference}</strong></p>}
        {retryError && <p role="alert" className="text-body-sm text-error mb-sm">{retryError}</p>}
        <div className="flex flex-col gap-sm">
          {reference && <Button onClick={retryPayment} loading={retrying} variant="primary" size="lg" fullWidth>Try payment again</Button>}
          {status === 'pending' && <Button onClick={() => { setStatus('loading'); setCheckCount(c => c + 1) }} variant="secondary" size="lg" fullWidth>Check again</Button>}
          <Button onClick={() => navigate('/')} variant="ghost" size="lg" fullWidth>Back to Home</Button>
        </div>
      </div>
    </main>
  )
}
