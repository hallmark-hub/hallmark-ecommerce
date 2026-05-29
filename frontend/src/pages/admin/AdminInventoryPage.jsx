import { useEffect, useState } from 'react'
import { Search, AlertTriangle, CheckCircle, XCircle, Plus } from 'lucide-react'
import { getProducts } from '../../api/products'
import { getCategories } from '../../api/categories'
import { createAdminProduct, updateAdminProductStock, uploadAdminProductImage } from '../../api/admin'
import { formatPrice } from '../../utils/format'
import { productImage, useFallbackImage } from '../../utils/images'

const DEFAULT_THRESHOLD = 5
const FALLBACK_CATEGORIES = [
  { id: 'chef-uniforms', name: 'Chef Uniforms', slug: 'chef-uniforms', checkout_type: 'direct' },
  { id: 'staff-uniforms-branding', name: 'Restaurant Staff Uniforms & Branding', slug: 'staff-uniforms-branding', checkout_type: 'direct' },
  { id: 'kitchen-equipment-tools', name: 'Industrial Kitchen Equipment & Tools', slug: 'kitchen-equipment-tools', checkout_type: 'direct' },
  { id: 'kitchen-setup', name: 'Industrial Kitchen Setup', slug: 'kitchen-setup', checkout_type: 'quote' },
  { id: 'machine-preorders', name: 'Customized Machine Pre-Orders', slug: 'machine-preorders', checkout_type: 'quote' },
  { id: 'machine-customization', name: 'Machine Customization', slug: 'machine-customization', checkout_type: 'quote' },
  { id: 'embroidery', name: 'Embroidery Services', slug: 'embroidery', checkout_type: 'quote' },
  { id: 'logo-printing-branding', name: 'Logo Printing & Garment Branding', slug: 'logo-printing-branding', checkout_type: 'quote' },
]

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
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    category_slug: '',
    checkout_type: 'direct',
    price_ghs: '',
    price_label: '',
    stock_qty: '0',
    tags: '',
    image_url: '',
  })
  const [imageFile, setImageFile] = useState(null)

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

  function updateForm(field, value) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'name' && !prev.slug) next.slug = slugify(value)
      const category = categories.find(item => item.slug === next.category_slug)
      if (field === 'category_slug' && category) next.checkout_type = category.checkout_type
      return next
    })
  }

  async function handleCreateProduct(event) {
    event.preventDefault()
    setError('')
    if (!imageFile && !form.image_url.trim()) { setError('Upload an image or provide an image URL.'); return }
    if (form.image_url.trim() && !isValidImageUrl(form.image_url.trim())) { setError('Image URL must be a valid HTTPS image URL.'); return }
    if (!form.category_slug) { setError('Category is required.'); return }
    if (form.checkout_type === 'direct' && !form.price_ghs) { setError('Direct products need a price.'); return }
    setSaving(true)
    try {
      let imageUrl = form.image_url.trim()
      if (imageFile) {
        const uploadRes = await uploadAdminProductImage(imageFile)
        if (!uploadRes.success) throw new Error(uploadRes.message)
        imageUrl = uploadRes.data.secure_url
      }
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        category_slug: form.category_slug,
        checkout_type: form.checkout_type,
        price_pesewas: form.checkout_type === 'direct' ? Math.round(Number(form.price_ghs) * 100) : null,
        price_label: form.checkout_type === 'quote' ? (form.price_label || 'Request a quote') : null,
        images: [imageUrl],
        in_stock: Number(form.stock_qty) > 0,
        stock_qty: Number(form.stock_qty),
        tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      }
      const createRes = await createAdminProduct(payload)
      if (!createRes.success) throw new Error(createRes.message)
      const created = createRes.data
      setInventory(prev => [{
        ...created,
        stock: created.stock_qty,
        threshold: DEFAULT_THRESHOLD,
        sku: created.slug.toUpperCase().replace(/-/g, '-').slice(0, 16),
        category: created.category_slug,
      }, ...prev])
      setShowAdd(false)
      setImageFile(null)
      setForm({
        name: '',
        slug: '',
        description: '',
        category_slug: '',
        checkout_type: 'direct',
        price_ghs: '',
        price_label: '',
        stock_qty: '0',
        tags: '',
        image_url: '',
      })
    } catch (e) {
      setError(e.message || 'Unable to create product.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-lg flex-wrap gap-4">
        <div>
          <h1 className="text-h1 font-medium text-on-surface">Inventory Management</h1>
          <p className="text-secondary text-body-sm">{loading ? 'Loading products...' : `${inventory.length} products tracked`}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-md py-sm bg-primary-container text-white rounded-lg text-label text-sm font-semibold hover:brightness-110 transition-all cursor-pointer"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-outline-variant p-md mb-md">
          <div className="flex items-start justify-between gap-4 mb-md">
            <div>
              <h2 className="text-h3 text-on-surface">Add Product</h2>
              <p className="text-body-sm text-secondary">Images upload through the backend to Cloudinary before the product is saved.</p>
            </div>
            <button onClick={() => setShowAdd(false)} className="text-secondary hover:text-error text-body-sm cursor-pointer">Cancel</button>
          </div>
          <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <AdminInput label="Name" value={form.name} onChange={value => updateForm('name', value)} required />
            <AdminInput label="Slug" value={form.slug} onChange={value => updateForm('slug', slugify(value))} required />
            <div>
              <label className="block text-label uppercase text-secondary mb-xs">Category</label>
              <select value={form.category_slug} onChange={event => updateForm('category_slug', event.target.value)} className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary" required>
                <option value="">{categoriesLoading ? 'Loading categories...' : 'Select category...'}</option>
                {categories.map(category => (
                  <option key={category.id} value={category.slug}>{category.name}</option>
                ))}
              </select>
              {categoriesError && (
                <p className="text-label uppercase text-tertiary mt-xs">Category API unavailable; using contract categories.</p>
              )}
            </div>
            <AdminInput label="Stock Quantity" type="number" min="0" value={form.stock_qty} onChange={value => updateForm('stock_qty', value)} required />
            {form.checkout_type === 'direct' ? (
              <AdminInput label="Price (GHS)" type="number" min="0" step="0.01" value={form.price_ghs} onChange={value => updateForm('price_ghs', value)} required />
            ) : (
              <AdminInput label="Price Label" value={form.price_label} onChange={value => updateForm('price_label', value)} placeholder="Request a quote" />
            )}
            <AdminInput label="Tags" value={form.tags} onChange={value => updateForm('tags', value)} placeholder="jacket, uniform" />
            <div className="md:col-span-2">
              <label className="block text-label uppercase text-secondary mb-xs">Description</label>
              <textarea value={form.description} onChange={event => updateForm('description', event.target.value)} rows={3} className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-label uppercase text-secondary mb-xs">Product Image</label>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => setImageFile(event.target.files?.[0] || null)} className="w-full text-body-sm" />
              <p className="text-label uppercase text-secondary mt-xs">JPEG, PNG, or WebP. Max size is controlled by backend `MAX_UPLOAD_BYTES`.</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-label uppercase text-secondary mb-xs">Or Image URL</label>
              <input
                type="url"
                value={form.image_url}
                onChange={event => updateForm('image_url', event.target.value)}
                placeholder="https://res.cloudinary.com/.../product.jpg"
                className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-label uppercase text-secondary mt-xs">Use this only for already-hosted HTTPS product images. If a file is selected, the uploaded image is used.</p>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button disabled={saving} className="inline-flex items-center gap-2 px-md py-sm bg-primary text-white rounded-lg text-label text-sm font-semibold hover:brightness-110 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                {saving ? 'Saving...' : 'Upload Image & Create Product'}
              </button>
            </div>
          </form>
        </div>
      )}

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
                    <div className="flex items-center gap-3">
                      <img src={productImage(item)} alt="" onError={useFallbackImage} className="w-10 h-10 rounded-lg object-cover bg-surface-container shrink-0" />
                      <div>
                        <p className="text-body-sm font-medium text-on-surface">{item.name}</p>
                        <p className="text-label text-xs text-secondary">{item.category}</p>
                      </div>
                    </div>
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

function AdminInput({ label, value, onChange, type = 'text', ...props }) {
  return (
    <div>
      <label className="block text-label uppercase text-secondary mb-xs">{label}</label>
      <input
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
        {...props}
      />
    </div>
  )
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function isValidImageUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:'
  } catch {
    return false
  }
}
