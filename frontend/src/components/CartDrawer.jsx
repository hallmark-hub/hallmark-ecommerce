import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import useCartStore from '../store/cartStore'
import { formatPrice } from '../utils/format'
import Button from './Button'

export default function CartDrawer({ open, onClose }) {
  const items = useCartStore(s => s.items)
  const removeItem = useCartStore(s => s.removeItem)
  const updateQty = useCartStore(s => s.updateQty)
  const total = useCartStore(s => s.total)

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-md py-base border-b border-outline-variant">
          <h2 className="text-h3 font-medium text-on-surface">Your Cart ({items.length})</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer" aria-label="Close cart">
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
                    src={item.images?.[0]}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover bg-surface-container flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-on-surface line-clamp-1">{item.name}</p>
                    <p className="text-label text-secondary mt-xs">{formatPrice(item.price_pesewas)} each</p>
                    <div className="flex items-center gap-2 mt-xs">
                      <button onClick={() => updateQty(item.id, item.quantity - 1)} className="p-1 hover:bg-surface-container rounded cursor-pointer" aria-label="Decrease quantity">
                        <Minus size={14} />
                      </button>
                      <span className="text-body-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.quantity + 1)} className="p-1 hover:bg-surface-container rounded cursor-pointer" aria-label="Increase quantity">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-body-sm font-bold text-primary">{formatPrice(item.price_pesewas * item.quantity)}</p>
                    <button onClick={() => removeItem(item.id)} className="text-error hover:text-red-700 cursor-pointer" aria-label="Remove item">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-outline-variant px-md py-md">
              <div className="flex justify-between text-body-sm text-secondary mb-xs">
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-body-sm text-secondary mb-md">
                <span>Delivery (Accra Central)</span>
                <span className="text-primary font-medium">Free on orders over GH₵ 250</span>
              </div>
              <div className="flex justify-between text-h3 font-semibold text-on-surface mb-md">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <Link to="/checkout" onClick={onClose}>
                <Button variant="primary" className="w-full">Proceed to Checkout</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  )
}
