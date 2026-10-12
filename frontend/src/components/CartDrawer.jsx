import { useEffect, useRef } from 'react'
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import useCartStore from '../store/cartStore'
import { formatPrice } from '../utils/format'
import Button from './Button'
import { productImage, useFallbackImage } from '../utils/images'

export default function CartDrawer({ open, onClose }) {
  const items = useCartStore(s => s.items)
  const removeItem = useCartStore(s => s.removeItem)
  const updateQty = useCartStore(s => s.updateQty)
  const total = useCartStore(s => s.items.reduce((sum, i) => sum + i.price_pesewas * i.quantity, 0))
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const closeRef = useRef(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  // Dialog behaviour: focus inside on open, Escape closes, focus returns to the opener,
  // and the Tawk chat bubble (which sits above everything) is hidden while the cart is open.
  useEffect(() => {
    if (!open) return undefined
    const opener = document.activeElement
    closeRef.current?.focus()
    const onKey = e => { if (e.key === 'Escape') onCloseRef.current() }
    document.addEventListener('keydown', onKey)
    window.Tawk_API?.hideWidget?.()
    return () => {
      document.removeEventListener('keydown', onKey)
      window.Tawk_API?.showWidget?.()
      opener?.focus?.()
    }
  }, [open])

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-[55]" onClick={onClose} />}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        inert={!open}
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-[60] shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-md py-base border-b border-outline-variant">
          <h2 id="cart-drawer-title" className="text-h3 font-medium text-on-surface">Your Cart ({itemCount})</h2>
          <button ref={closeRef} onClick={onClose} className="p-3 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer" aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-md">
            <ShoppingBag size={48} className="text-outline-variant" />
            <p className="text-h3 font-medium text-on-surface">Your cart is empty</p>
            <p className="text-body-sm text-secondary">Add products to get started.</p>
            <Button onClick={onClose}>Continue Shopping</Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-md py-sm divide-y divide-outline-variant">
              {items.map(item => (
                <div key={item.id} className="py-sm flex gap-sm">
                  <img
                    src={productImage(item)}
                    alt={item.name}
                    onError={useFallbackImage}
                    className="w-16 h-16 rounded-lg object-cover bg-surface-container flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-on-surface line-clamp-1">{item.name}</p>
                    <p className="text-label text-secondary mt-xs">{formatPrice(item.price_pesewas)} each</p>
                    <div className="flex items-center gap-1 mt-xs -ml-2">
                      <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-10 h-10 flex items-center justify-center hover:bg-surface-container rounded-lg cursor-pointer" aria-label={`Decrease quantity of ${item.name}`}>
                        <Minus size={14} />
                      </button>
                      <span className="text-body-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.quantity + 1)} disabled={item.quantity >= (item.stock_qty ?? Infinity)} className="w-10 h-10 flex items-center justify-center hover:bg-surface-container rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" aria-label={`Increase quantity of ${item.name}`}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-body-sm font-bold text-primary">{formatPrice(item.price_pesewas * item.quantity)}</p>
                    <button onClick={() => removeItem(item.id)} className="w-10 h-10 -mr-2 flex items-center justify-center rounded-lg text-error hover:text-red-700 hover:bg-error-container/40 cursor-pointer" aria-label={`Remove ${item.name} from cart`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-outline-variant px-md py-md">
              <div className="flex justify-between text-body-sm text-secondary mb-md">
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-h3 font-semibold text-on-surface mb-md">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <Button as={Link} to="/checkout" onClick={onClose} variant="primary" fullWidth>Proceed to Checkout</Button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
