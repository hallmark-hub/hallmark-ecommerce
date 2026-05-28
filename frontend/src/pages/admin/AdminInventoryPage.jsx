import { useEffect, useState } from 'react'
import { Search, AlertTriangle, CheckCircle, XCircle, Plus } from 'lucide-react'
import { getProducts } from '../../api/products'
import { updateAdminProductStock } from '../../api/admin'
import { formatPrice } from '../../utils/format'

const DEFAULT_THRESHOLD = 5

function stockStatus(stock, threshold) {
  if (stock === 0) return 'out'
  if (stock <= threshold) return 'low'
  return 'ok'
}

const STOCK_BADGES = {
  ok: { label: 'In Stock', cls: 'bg-primary-fixed/30 text-primary', Icon: CheckCircle },
  low: { label: 'Low Stock', cls: 'bg-tertiary-fixed/30 text-tertiary', Icon: AlertTriangle },
  out: { label: 'Out of Stock', cls: 'bg-error-container text-error', Icon: XCircle },
}

export default function AdminInventoryPage() {
  const [search, setSearch] = useState('')
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadInventory() {
      setLoading(true)
      setError('')
      try {
        const res = await getProducts({ limit: 100 })
        if (!res.success) throw new Error(res.message)
        setInventory((res.data?.items || []).map(product => ({
          ...product,
          stock: product.stock_qty,
          threshold: DEFAULT_THRESHOLD,
          sku: product.slug.toUpperCase().replace(/-/g, '-').slice(0, 16),
          category: product.category_slug,
        })))
      } catch (e) {
        setError(e.message || 'Unable to load inventory.')
      } finally {
        setLoading(false)
      }
    }
    loadInventory()
  }, [])

  async function updateStock(id, delta) {
    const product = inventory.find(item => item.id === id)
    if (!product) return
    const nextStock = Math.max(0, product.stock + delta)
    const previous = inventory
    setInventory(prev => prev.map(item =>
      item.id === id ? { ...item, stock: nextStock, stock_qty: nextStock, in_stock: nextStock > 0 } : item
    ))
    try {
      const res = await updateAdminProductStock(product.slug, nextStock, nextStock > 0)
      if (!res.success) throw new Error(res.message)
    } catch (e) {
      setInventory(previous)
      setError(e.message || 'Unable to update stock.')
    }
  }

  const filtered = inventory.filter(item =>
    !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.includes(search.toUpperCase())
  )
  const lowStock = inventory.filter(i => stockStatus(i.stock, i.threshold) !== 'ok')

  return (
    <div>
      <div className="flex justify-between items-start mb-lg flex-wrap gap-4">
        <div>
          <h1 className="text-h1 font-medium text-on-surface">Inventory Management</h1>
          <p className="text-secondary text-body-sm">{loading ? 'Loading products...' : `${inventory.length} products tracked`}</p>
        </div>
        <button className="inline-flex items-center gap-2 px-md py-sm bg-primary-container text-white rounded-lg text-label text-sm font-semibold hover:brightness-110 transition-all cursor-pointer">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container rounded-xl p-md mb-md flex items-center gap-2">
          <AlertTriangle size={18} className="text-error" />
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      {/* Alerts */}
      {lowStock.length > 0 && (
        <div className="bg-error-container/30 border border-error/30 rounded-xl p-md mb-md flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-error" />
            <p className="text-body-sm font-medium text-on-surface">{lowStock.length} items need restocking</p>
          </div>
          <p className="text-body-sm text-secondary">{lowStock.map(i => i.name).join(', ')}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-outline-variant mb-md px-md py-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full pl-9 pr-4 py-2 text-body-sm focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-surface-container-low text-left">
              <th className="px-md py-sm text-label text-xs text-secondary uppercase tracking-wide">Product</th>
              <th className="px-md py-sm text-label text-xs text-secondary uppercase tracking-wide">SKU</th>
              <th className="px-md py-sm text-label text-xs text-secondary uppercase tracking-wide">Price</th>
              <th className="px-md py-sm text-label text-xs text-secondary uppercase tracking-wide">Stock</th>
              <th className="px-md py-sm text-label text-xs text-secondary uppercase tracking-wide">Status</th>
              <th className="px-md py-sm text-label text-xs text-secondary uppercase tracking-wide">Adjust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {filtered.map(item => {
              const ss = stockStatus(item.stock, item.threshold)
              const { label, cls, Icon } = STOCK_BADGES[ss]
              return (
                <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-md py-sm">
                    <p className="text-body-sm font-medium text-on-surface">{item.name}</p>
                    <p className="text-label text-xs text-secondary">{item.category}</p>
                  </td>
                  <td className="px-md py-sm text-body-sm text-secondary font-mono">{item.sku}</td>
                  <td className="px-md py-sm text-body-sm font-bold text-primary">{formatPrice(item.price_pesewas)}</td>
                  <td className="px-md py-sm text-body text-on-surface font-semibold">{item.stock}</td>
                  <td className="px-md py-sm">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label text-[11px] font-semibold ${cls}`}>
                      <Icon size={12} /> {label}
                    </span>
                  </td>
                  <td className="px-md py-sm">
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateStock(item.id, -1)} className="w-6 h-6 rounded border border-outline-variant hover:bg-surface-container flex items-center justify-center text-body text-secondary cursor-pointer">−</button>
                      <button onClick={() => updateStock(item.id, 10)} className="px-2 py-0.5 rounded bg-primary-fixed/20 text-primary text-label text-xs font-semibold hover:bg-primary-fixed/40 cursor-pointer">+10</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-xl text-secondary text-body-sm">No products match your search.</div>
        )}
      </div>
    </div>
  )
}
