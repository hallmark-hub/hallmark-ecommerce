import { useEffect, useRef, useState } from 'react'
import { X, Phone, Mail, MapPin, Building2 } from 'lucide-react'
import { getAdminOrder } from '../../api/admin'
import { formatPrice, formatDate } from '../../utils/format'
import { Alert, StatusPill } from './AdminUI'

const PAYMENT_TONES = { paid: 'success', pending: 'warning', failed: 'danger' }
const ORDER_TONES = { pending: 'warning', confirmed: 'info', delivered: 'success' }

// Side panel with everything needed to fulfil an order: items, delivery address and contact.
export default function OrderDetailDrawer({ summary, onClose }) {
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const closeRef = useRef(null)

  useEffect(() => {
    getAdminOrder(summary.reference)
      .then(res => {
        if (!res.success) throw new Error(res.message)
        setOrder(res.data)
      })
      .catch(e => setError(e.message || 'Unable to load this order.'))
  }, [summary.reference])

  useEffect(() => {
    const opener = document.activeElement
    closeRef.current?.focus()
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      opener?.focus?.()
    }
  }, [onClose])

  const customer = order?.customer

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <aside role="dialog" aria-modal="true" aria-labelledby="order-detail-title" className="bg-white w-full max-w-md h-full flex flex-col shadow-xl">
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-200">
          <div>
            <h2 id="order-detail-title" className="text-lg font-bold text-primary">{summary.reference}</h2>
            <p className="text-sm text-gray-500 mt-0.5">Placed {formatDate(summary.created_at)}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="p-2 -mr-2 rounded text-gray-500 hover:bg-gray-100 hover:text-on-surface cursor-pointer" aria-label="Close order details">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 space-y-6 text-sm">
          {error && <Alert>{error}</Alert>}

          <div className="flex flex-wrap gap-2">
            <StatusPill tone={ORDER_TONES[summary.order_status]}>{summary.order_status}</StatusPill>
            <StatusPill tone={PAYMENT_TONES[summary.payment_status]}>payment {summary.payment_status}</StatusPill>
          </div>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Items</h3>
            {!order && !error && <p className="text-gray-500">Loading items…</p>}
            {order && (
              <ul className="divide-y divide-gray-100 border border-gray-200 rounded">
                {order.items.map((item, i) => (
                  <li key={i} className="flex justify-between gap-3 px-3 py-2.5">
                    <span className="text-on-surface"><span className="font-semibold">{item.quantity} ×</span> {item.product_name}</span>
                    <span className="text-gray-600 whitespace-nowrap">{formatPrice(item.unit_price_pesewas * item.quantity)}</span>
                  </li>
                ))}
                <li className="flex justify-between gap-3 px-3 py-2.5 font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(order.total_pesewas)}</span>
                </li>
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Deliver to</h3>
            <div className="space-y-2 text-on-surface">
              <p className="font-semibold">{summary.customer_name}</p>
              {(customer?.company_name || summary.company_name) && (
                <p className="flex gap-2"><Building2 size={16} className="text-gray-400 shrink-0 mt-0.5" />{customer?.company_name || summary.company_name}</p>
              )}
              <p className="flex gap-2"><MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />{customer?.delivery_address || summary.delivery_address || '—'}</p>
              <a href={`tel:${summary.customer_phone}`} className="flex gap-2 text-primary hover:underline"><Phone size={16} className="shrink-0 mt-0.5" />{summary.customer_phone}</a>
              {summary.customer_email && (
                <a href={`mailto:${summary.customer_email}`} className="flex gap-2 text-primary hover:underline break-all"><Mail size={16} className="shrink-0 mt-0.5" />{summary.customer_email}</a>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Payment</h3>
            <p className="text-on-surface capitalize">{summary.payment_method.replace('_', ' ')} · {summary.payment_status}</p>
          </section>
        </div>
      </aside>
    </div>
  )
}
