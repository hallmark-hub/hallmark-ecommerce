import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Archive, ArchiveRestore, Download, PackageSearch, Pencil, Plus } from 'lucide-react'
import { getCategories } from '../../api/categories'
import { getAdminProducts, setAdminProductActive, updateAdminProductStock } from '../../api/admin'
import { formatPrice } from '../../utils/format'
import { downloadCsv } from '../../utils/csv'
import { productImage, useFallbackImage } from '../../utils/images'
import AddProductModal from '../../components/admin/AddProductModal'
import {
  Alert, EmptyState, FilterChips, PageHeader, SearchInput, SkeletonRows, StatusPill,
  cardClass, inputClass, primaryButtonClass, secondaryButtonClass, tableHeadClass,
} from '../../components/admin/AdminUI'

const DEFAULT_THRESHOLD = 5
const FALLBACK_CATEGORIES = [
  { id: 'chef-uniforms', name: 'Chef Uniforms', slug: 'chef-uniforms', checkout_type: 'direct' },
  { id: 'staff-uniforms-branding', name: 'Restaurant Staff Uniforms & Branding', slug: 'staff-uniforms-branding', checkout_type: 'direct' },
  { id: 'kitchen-equipment-tools', name: 'Industrial Kitchen Equipment & Tools', slug: 'kitchen-equipment-tools', checkout_type: 'direct' },
  { id: 'uniforms', name: 'Uniforms', slug: 'uniforms', checkout_type: 'quote' },
  { id: 'branding-embroidery', name: 'Branding & Embroidery', slug: 'branding-embroidery', checkout_type: 'quote' },
  { id: 'kitchen-equipment', name: 'Kitchen Equipment', slug: 'kitchen-equipment', checkout_type: 'quote' },
  { id: 'kitchen-setup', name: 'Kitchen Setup', slug: 'kitchen-setup', checkout_type: 'quote' },
  { id: 'disposables', name: 'Disposables', slug: 'disposables', checkout_type: 'quote' },
  { id: 'robotics', name: 'Hospitality Robotics', slug: 'robotics', checkout_type: 'quote' },
  { id: 'other', name: 'Other', slug: 'other', checkout_type: 'quote' },
]

function stockStatus(stock, threshold) {
  if (stock === 0) return 'out'
  if (stock <= threshold) return 'low'
  return 'ok'
}

const STOCK_BADGES = {
  ok: { label: 'In stock', tone: 'success', qty: 'text-on-surface' },
  low: { label: 'Low stock', tone: 'warning', qty: 'text-amber-700' },
  out: { label: 'Out of stock', tone: 'danger', qty: 'text-red-700' },
}

const SORTS = {
  newest: { label: 'Newest first', compare: () => 0 },
  name: { label: 'Name A–Z', compare: (a, b) => a.name.localeCompare(b.name) },
  stock_asc: { label: 'Stock: lowest first', compare: (a, b) => a.stock - b.stock },
  price_desc: { label: 'Price: high to low', compare: (a, b) => (b.price_pesewas ?? -1) - (a.price_pesewas ?? -1) },
}

const rowActionClass = 'inline-flex items-center gap-1.5 h-8 px-2.5 rounded border text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors cursor-pointer'
const stepButtonClass = 'h-8 min-w-8 px-2 rounded border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'

function toInventoryItem(product) {
  return {
    ...product,
    stock: product.stock_qty,
    threshold: DEFAULT_THRESHOLD,
    sku: product.slug.toUpperCase().replace(/-/g, '-').slice(0, 16),
    category: product.category_slug,
  }
}

export default function AdminInventoryPage() {
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [inventory, setInventory] = useState([])
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    async function loadInventory() {
      setLoading(true)
      setError('')
      try {
        const res = await getAdminProducts()
        if (!res.success) throw new Error(res.message)
        setInventory((res.data || []).map(toInventoryItem))
      } catch (e) {
        setError(e.message || 'Unable to load inventory.')
      } finally {
        setLoading(false)
      }
    }
    loadInventory()
  }, [])

  useEffect(() => {
    async function loadCategories() {
      setCategoriesLoading(true)
      setCategoriesError('')
      try {
        const res = await getCategories()
        if (!res.success) throw new Error(res.message)
        const loaded = res.data || []
        setCategories(loaded.length ? loaded : FALLBACK_CATEGORIES)
      } catch (e) {
        setCategories(FALLBACK_CATEGORIES)
        setCategoriesError(e.message || 'Using fallback categories.')
      } finally {
        setCategoriesLoading(false)
      }
    }
    loadCategories()
  }, [])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 5000)
    return () => clearTimeout(timer)
  }, [notice])

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

  function handleSaved(saved) {
    const wasEdit = inventory.some(item => item.id === saved.id)
    setInventory(prev => wasEdit
      ? prev.map(item => item.id === saved.id ? toInventoryItem({ ...item, ...saved }) : item)
      : [toInventoryItem({ ...saved, is_active: true }), ...prev])
    setShowAdd(false)
    setEditing(null)
    setError('')
    setNotice(wasEdit ? `“${saved.name}” was updated.` : `“${saved.name}” was added to your inventory.`)
  }

  async function toggleActive(item) {
    const archiving = item.is_active
    if (archiving && !window.confirm(`Archive “${item.name}”? It will be hidden from the shop until you restore it.`)) return
    const previous = inventory
    setInventory(prev => prev.map(row => row.id === item.id ? { ...row, is_active: !archiving } : row))
    try {
      const res = await setAdminProductActive(item.slug, !archiving)
      if (!res.success) throw new Error(res.message)
      setNotice(archiving ? `“${item.name}” was archived.` : `“${item.name}” is back in the shop.`)
    } catch (e) {
      setInventory(previous)
      setError(e.message || 'Unable to update the product.')
    }
  }

  const categoryNames = useMemo(() => Object.fromEntries(categories.map(c => [c.slug, c.name])), [categories])
  const active = inventory.filter(i => i.is_active)
  const archivedCount = inventory.length - active.length
  const lowCount = active.filter(i => stockStatus(i.stock, i.threshold) === 'low').length
  const outCount = active.filter(i => stockStatus(i.stock, i.threshold) === 'out').length
  const needsRestock = active.filter(i => stockStatus(i.stock, i.threshold) !== 'ok')
  const filtered = inventory.filter(item => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.includes(search.toUpperCase())
    const matchStock = stockFilter === 'archived' ? !item.is_active
      : !item.is_active ? false
        : stockFilter === 'all' || stockStatus(item.stock, item.threshold) === stockFilter
    return matchSearch && matchStock
  }).sort(SORTS[sort].compare)

  function exportCsv() {
    downloadCsv(`chefware-inventory-${new Date().toISOString().slice(0, 10)}.csv`, [
      { label: 'Name', value: i => i.name },
      { label: 'Slug', value: i => i.slug },
      { label: 'Category', value: i => categoryNames[i.category] || i.category },
      { label: 'Checkout', value: i => i.checkout_type },
      { label: 'Price (GHS)', value: i => (i.price_pesewas == null ? '' : (i.price_pesewas / 100).toFixed(2)) },
      { label: 'Stock', value: i => i.stock },
      { label: 'Status', value: i => (i.is_active ? STOCK_BADGES[stockStatus(i.stock, i.threshold)].label : 'Archived') },
    ], inventory)
  }
  const restockNames = needsRestock.slice(0, 3).map(i => i.name).join(', ')

  return (
    <div>
      <PageHeader title="Inventory" subtitle={loading ? 'Loading products…' : `${inventory.length} product${inventory.length === 1 ? '' : 's'} tracked`}>
        <div className="flex gap-2">
          <button type="button" onClick={exportCsv} disabled={loading || inventory.length === 0} className={secondaryButtonClass}>
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => setShowAdd(true)} className={primaryButtonClass}>
            <Plus size={16} /> Add product
          </button>
        </div>
      </PageHeader>

      {(showAdd || editing) && (
        <AddProductModal
          product={editing}
          categories={categories}
          categoriesLoading={categoriesLoading}
          categoriesError={categoriesError}
          onClose={() => { setShowAdd(false); setEditing(null) }}
          onSaved={handleSaved}
        />
      )}

      {notice && <Alert tone="success">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      {needsRestock.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 mb-4 text-sm text-amber-900">
          <AlertTriangle size={18} className="shrink-0 mt-px text-amber-600" />
          <p>
            <span className="font-semibold">{needsRestock.length} {needsRestock.length === 1 ? 'product needs' : 'products need'} restocking.</span>{' '}
            {restockNames}{needsRestock.length > 3 && ` and ${needsRestock.length - 3} more`}
          </p>
        </div>
      )}

      <div className={`${cardClass} p-3 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3`}>
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or SKU" />
          <select value={sort} onChange={event => setSort(event.target.value)} aria-label="Sort products" className={`${inputClass} sm:w-52`}>
            {Object.entries(SORTS).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}
          </select>
        </div>
        <FilterChips
          label="Stock"
          value={stockFilter}
          onChange={setStockFilter}
          options={[
            { value: 'all', label: 'All', count: active.length },
            { value: 'low', label: 'Low', count: lowCount },
            { value: 'out', label: 'Out', count: outCount },
            { value: 'archived', label: 'Archived', count: archivedCount },
          ]}
        />
      </div>

      <div className={`${cardClass} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className={tableHeadClass}>Product</th>
                <th className={`${tableHeadClass} hidden md:table-cell`}>SKU</th>
                <th className={`${tableHeadClass} hidden sm:table-cell`}>Price</th>
                <th className={tableHeadClass}>Stock</th>
                <th className={`${tableHeadClass} hidden sm:table-cell`}>Status</th>
                <th className={tableHeadClass}>Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && <SkeletonRows cols={6} />}
              {!loading && filtered.map(item => {
                const status = stockStatus(item.stock, item.threshold)
                const { label, tone, qty } = STOCK_BADGES[status]
                return (
                  <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${item.is_active ? '' : 'opacity-60'}`}>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={productImage(item)} alt="" onError={useFallbackImage} className="hidden sm:block w-10 h-10 rounded object-cover bg-gray-100 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-on-surface truncate max-w-[110px] sm:max-w-[280px]">{item.name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[110px] sm:max-w-[280px]">{categoryNames[item.category] || item.category}</p>
                          <div className="flex gap-2 mt-2">
                            <button type="button" onClick={() => setEditing(item)} className={`${rowActionClass} border-primary/40 bg-primary/5 text-primary hover:bg-primary/10`} aria-label={`Edit ${item.name}`}><Pencil size={14} />Edit</button>
                            <button type="button" onClick={() => toggleActive(item)} className={`${rowActionClass} ${item.is_active ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50' : 'border-primary/40 bg-primary/5 text-primary hover:bg-primary/10'}`} aria-label={`${item.is_active ? 'Archive' : 'Restore'} ${item.name}`}>
                              {item.is_active ? <Archive size={14} /> : <ArchiveRestore size={14} />}{item.is_active ? 'Archive' : 'Restore'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-gray-500 font-mono text-xs hidden md:table-cell">{item.sku}</td>
                    <td className="px-3 sm:px-4 py-3 font-semibold text-on-surface hidden sm:table-cell whitespace-nowrap">{formatPrice(item.price_pesewas)}</td>
                    <td className={`px-3 sm:px-4 py-3 font-semibold ${qty}`}>{item.stock}</td>
                    <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">{item.is_active ? <StatusPill tone={tone}>{label}</StatusPill> : <StatusPill>Archived</StatusPill>}</td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateStock(item.id, -1)} disabled={item.stock === 0} aria-label={`Remove 1 from ${item.name}`} className={stepButtonClass}>−1</button>
                        <button onClick={() => updateStock(item.id, 1)} aria-label={`Add 1 to ${item.name}`} className={stepButtonClass}>+1</button>
                        <button onClick={() => updateStock(item.id, 10)} aria-label={`Add 10 to ${item.name}`} className={`${stepButtonClass} border-primary/30 bg-primary/5 text-primary hover:bg-primary/10`}>+10</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          inventory.length === 0
            ? <EmptyState icon={PackageSearch} title="No products yet">Add your first product to start tracking stock.</EmptyState>
            : <EmptyState icon={PackageSearch} title="No products match">Try a different search or clear the stock filter.</EmptyState>
        )}
      </div>
    </div>
  )
}
