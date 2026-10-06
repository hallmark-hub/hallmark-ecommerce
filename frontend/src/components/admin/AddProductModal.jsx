import { useEffect, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { createAdminProduct, uploadAdminProductImage } from '../../api/admin'
import { Alert, Field, inputClass, primaryButtonClass, secondaryButtonClass } from './AdminUI'

const EMPTY_FORM = {
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
}

export default function AddProductModal({ categories, categoriesLoading, categoriesError, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [slugEdited, setSlugEdited] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [filePreview, setFilePreview] = useState('')
  const [stage, setStage] = useState('')
  const [error, setError] = useState('')
  const saving = Boolean(stage)

  // Previews are object URLs, so release them when the file changes or the modal closes.
  useEffect(() => () => { if (filePreview) URL.revokeObjectURL(filePreview) }, [filePreview])

  function chooseImage(file) {
    setImageFile(file)
    setFilePreview(file ? URL.createObjectURL(file) : '')
  }

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape' && !saving) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [saving, onClose])

  function updateForm(field, value) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'name' && !slugEdited) next.slug = slugify(value)
      if (field === 'category_slug') {
        const category = categories.find(item => item.slug === value)
        if (category) next.checkout_type = category.checkout_type
      }
      return next
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const imageUrlInput = form.image_url.trim()
    if (!imageFile && !imageUrlInput) { setError('Add a product image: upload a file or paste an image link.'); return }
    if (!imageFile && !isValidImageUrl(imageUrlInput)) { setError('The image link must be a valid HTTPS address.'); return }
    if (!form.category_slug) { setError('Choose a category.'); return }
    if (form.checkout_type === 'direct' && !form.price_ghs) { setError('Products sold online need a price.'); return }
    try {
      let imageUrl = imageUrlInput
      if (imageFile) {
        setStage('Uploading image…')
        const uploadRes = await uploadAdminProductImage(imageFile)
        if (!uploadRes.success) throw new Error(uploadRes.message)
        imageUrl = uploadRes.data.secure_url
      }
      setStage('Saving product…')
      const createRes = await createAdminProduct({
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
      })
      if (!createRes.success) throw new Error(createRes.message)
      onCreated(createRes.data)
    } catch (e) {
      setError(e.message || 'Unable to create product.')
      setStage('')
    }
  }

  const previewSrc = filePreview || (isValidImageUrl(form.image_url.trim()) ? form.image_url.trim() : '')

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:p-4"
      onMouseDown={event => { if (event.target === event.currentTarget && !saving) onClose() }}
    >
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-product-title"
        className="bg-white w-full sm:max-w-2xl max-h-[92vh] flex flex-col rounded-t-xl sm:rounded-md shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-200">
          <div>
            <h2 id="add-product-title" className="text-lg font-bold text-on-surface">Add product</h2>
            <p className="text-sm text-gray-500 mt-0.5">New products appear in the shop as soon as they are saved.</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="p-1.5 -mr-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-on-surface cursor-pointer disabled:opacity-50" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {error && <Alert>{error}</Alert>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
            <Field label="Product name" required wide>
              <input autoFocus required value={form.name} onChange={event => updateForm('name', event.target.value)} className={inputClass} placeholder="e.g. Executive Chef Jacket" />
            </Field>

            <Field label="Category" required hint={categoriesError ? 'Showing the standard categories while the list reloads.' : undefined}>
              <select required value={form.category_slug} onChange={event => updateForm('category_slug', event.target.value)} className={inputClass}>
                <option value="">{categoriesLoading ? 'Loading categories…' : 'Select a category'}</option>
                {categories.map(category => (
                  <option key={category.id} value={category.slug}>{category.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Stock quantity" required hint="Units currently on hand.">
              <input required type="number" min="0" inputMode="numeric" value={form.stock_qty} onChange={event => updateForm('stock_qty', event.target.value)} className={inputClass} />
            </Field>

            {form.category_slug && (form.checkout_type === 'direct' ? (
              <Field label="Price" required hint="Customers pay this price at checkout.">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">GH₵</span>
                  <input required type="number" min="0" step="0.01" inputMode="decimal" value={form.price_ghs} onChange={event => updateForm('price_ghs', event.target.value)} className={`${inputClass} pl-12`} placeholder="0.00" />
                </div>
              </Field>
            ) : (
              <Field label="Price label" hint="Quote items show this instead of a price.">
                <input value={form.price_label} onChange={event => updateForm('price_label', event.target.value)} className={inputClass} placeholder="Request a quote" />
              </Field>
            ))}

            <Field label="Tags" hint="Separate with commas, e.g. jacket, uniform">
              <input value={form.tags} onChange={event => updateForm('tags', event.target.value)} className={inputClass} placeholder="jacket, uniform" />
            </Field>

            <Field label="Description" wide>
              <textarea rows={3} value={form.description} onChange={event => updateForm('description', event.target.value)} className={`${inputClass} h-auto py-2 resize-y`} placeholder="What makes this product a good choice?" />
            </Field>

            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-gray-700 mb-1.5">Product image <span className="text-red-600">*</span></p>
              <div className="flex items-start gap-4 rounded-md border border-dashed border-gray-300 bg-gray-50 p-4">
                <div className="w-20 h-20 shrink-0 rounded bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                  {previewSrc
                    ? <img src={previewSrc} alt="Selected product" className="w-full h-full object-cover" />
                    : <ImagePlus size={24} className="text-gray-400" />}
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className={`${secondaryButtonClass} h-9 ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}>
                      {imageFile ? 'Change image' : 'Upload image'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        disabled={saving}
                        onChange={event => chooseImage(event.target.files?.[0] || null)}
                        className="sr-only"
                      />
                    </label>
                    {imageFile && (
                      <>
                        <span className="text-sm text-gray-600 truncate max-w-[200px]">{imageFile.name}</span>
                        <button type="button" onClick={() => chooseImage(null)} className="text-sm text-gray-500 hover:text-red-600 cursor-pointer">Remove</button>
                      </>
                    )}
                  </div>
                  {!imageFile && (
                    <input
                      type="url"
                      value={form.image_url}
                      onChange={event => updateForm('image_url', event.target.value)}
                      aria-label="Image link"
                      placeholder="…or paste an https:// image link"
                      className={`${inputClass} h-9`}
                    />
                  )}
                  <p className="text-xs text-gray-500">JPEG, PNG or WebP. Uploads are stored on Cloudinary.</p>
                </div>
              </div>
            </div>

            <Field label="URL slug" hint="Part of the product link. Filled in from the name; edit only if you need to." wide>
              <input
                required
                value={form.slug}
                onChange={event => { setSlugEdited(true); updateForm('slug', event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-')) }}
                onBlur={event => updateForm('slug', slugify(event.target.value))}
                className={`${inputClass} font-mono`}
              />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-md">
          <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>Cancel</button>
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? stage : 'Create product'}
          </button>
        </div>
      </form>
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
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}
