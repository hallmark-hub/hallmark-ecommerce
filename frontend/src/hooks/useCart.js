import useCartStore from '../store/cartStore'

export function useCart() {
  const items = useCartStore(s => s.items)
  const addItem = useCartStore(s => s.addItem)
  const removeItem = useCartStore(s => s.removeItem)
  const updateQty = useCartStore(s => s.updateQty)
  const clearCart = useCartStore(s => s.clearCart)
  const total = items.reduce((sum, i) => sum + i.price_pesewas * i.quantity, 0)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  return { items, addItem, removeItem, updateQty, clearCart, total, itemCount }
}
