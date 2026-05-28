import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { XCircle } from 'lucide-react'
import { verifyPaystack } from '../api/payments'
import { PageLoader } from '../components/PageLoader'
import Button from '../components/Button'

const PENDING_ORDER_KEY = 'chefware-pending-order'

export default function PaymentVerifyPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const reference = searchParams.get('reference') || searchParams.get('trxref')
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    async function verify() {
      if (!reference) { setStatus('error'); return }
      try {
        const res = await verifyPaystack(reference)
        if (res.success && res.data.payment_status === 'paid') {
          const stored = JSON.parse(sessionStorage.getItem(PENDING_ORDER_KEY) || '{}')
          if (!stored.reference || stored.reference === reference) {
            sessionStorage.setItem(PENDING_ORDER_KEY, JSON.stringify({ ...stored, reference }))
          }
          navigate(`/order-confirmation/${reference}`, { replace: true })
        } else {
          setStatus('error')
        }
      } catch {
        setStatus('error')
      }
    }
    verify()
  }, [reference, navigate])

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
        <XCircle size={56} className="text-error mx-auto mb-md" />
        <h1 className="text-h2 text-on-surface mb-sm">Payment Verification Failed</h1>
        <p className="text-body text-secondary mb-md">We couldn't verify your payment. If you were charged, please contact us with reference: <strong>{reference}</strong></p>
        <div className="flex flex-col gap-sm">
          <Button onClick={() => navigate('/checkout')} variant="primary" size="lg" fullWidth>Try Again</Button>
          <Button onClick={() => navigate('/')} variant="ghost" size="lg" fullWidth>Back to Home</Button>
        </div>
      </div>
    </main>
  )
}
