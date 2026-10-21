import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Never let the cart hold more than the stock we know about
function capToStock(item, quantity) {
  return typeof item.stock_qty === 'number' ? Math.min(quantity, item.stock_qty) : quantity
}

// Carts saved by older versions of the site can hold ids the API rejects at checkout
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem(product, quantity = 1) {
        const items = get().items
        const existing = items.find(i => i.id === product.id)
        if (existing) {
          set({ items: items.map(i => i.id === product.id ? { ...i, quantity: capToStock(i, i.quantity + quantity) } : i) })
        } else {
          set({ items: [...items, { ...product, quantity: capToStock(product, quantity) }] })
        }
      },

      removeItem(id) {
        set({ items: get().items.filter(i => i.id !== id) })
      },

      updateQty(id, quantity) {
        if (quantity < 1) {
          get().removeItem(id)
          return
        }
        set({ items: get().items.map(i => i.id === id ? { ...i, quantity: capToStock(i, quantity) } : i) })
      },

      clearCart() {
        set({ items: [] })
      },

      removePurchasedItems(purchasedItems) {
        const quantities = new Map(purchasedItems.map(item => [item.id, item.quantity]))
        set({ items: get().items.flatMap(item => {
          const remaining = item.quantity - (quantities.get(item.id) || 0)
          return remaining > 0 ? [{ ...item, quantity: remaining }] : []
        }) })
      },

    }),
    {
      name: 'chefware-cart',
      merge: (persisted, current) => ({
        ...current,
        items: (persisted?.items ?? []).filter(item => UUID_PATTERN.test(item.id)),
      }),
    }
  )
)

export default useCartStore
