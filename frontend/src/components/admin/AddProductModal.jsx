import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, Star, X } from 'lucide-react'
import { createAdminProduct, updateAdminProduct, uploadAdminProductImage } from '../../api/admin'
import { Alert, Field, inputClass, primaryButtonClass, secondaryButtonClass } from './AdminUI'
import { imageFileError } from '../../utils/images'

const MAX_IMAGES = 8

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
}

// Pre-fill the form from an existing product when editing
function formFromProduct(product) {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    category_slug: product.category_slug || '',
    checkout_type: product.checkout_type,
    price_ghs: product.price_pesewas != null ? String(product.price_pesewas / 100) : '',
    price_label: product.price_label || '',
    stock_qty: String(product.stock_qty ?? 0),
    tags: (product.tags || []).join(', '),
  }
}

export default function AddProductModal({ product, categories, categoriesLoading, categoriesError, onClose, onSaved }) {
  const isEdit = Boolean(product)
  const [initialForm] = useState(() => (isEdit ? formFromProduct(product) : EMPTY_FORM))
  const [form, setForm] = useState(initialForm)
  const [slugEdited, setSlugEdited] = useState(isEdit)
  // Gallery entries: saved images are { id, url }; new uploads also carry the File, with url as a local preview
  const [initialImages] = useState(() => (product?.images || []).map(url => ({ id: url, url })))
  const [images, setImages] = useState(initialImages)
  const [linkInput, setLinkInput] = useState('')
  const [stage, setStage] = useState('')
  const [error, setError] = useState('')
  const saving = Boolean(stage)

  // Previews are object URLs, so release any still held when the modal closes
  const imagesRef = useRef(images)
  useEffect(() => { imagesRef.current = images })
  useEffect(() => () => imagesRef.current.forEach(image => image.file && URL.revokeObjectURL(image.url)), [])

  function addFiles(fileList) {
    const files = Array.from(fileList || [])
    const room = MAX_IMAGES - images.length
    const problems = files.map(file => imageFileError(file) && `${file.name}: ${imageFileError(file)}`).filter(Boolean)
    const valid = files.filter(file => !imageFileError(file))
    if (valid.length > room) problems.push(`A product can have up to ${MAX_IMAGES} images, so ${valid.length - room} were not added.`)
    setError(problems.join(' '))
    setImages(current => [...current, ...valid.slice(0, room).map(file => ({ id: `${file.name}-${file.lastModified}-${Math.random()}`, url: URL.createObjectURL(file), file }))])
  }

  function addLink() {
    const url = linkInput.trim()
    if (!isValidImageUrl(url)) { setError('The image link must be a valid HTTPS address.'); return }
    if (images.length >= MAX_IMAGES) { setError(`A product can have up to ${MAX_IMAGES} images.`); return }
    setError('')
    setImages(current => [...current, { id: url, url }])
    setLinkInput('')
  }

  function removeImage(id) {
    setImages(current => {
      const removed = current.find(image => image.id === id)
      if (removed?.file) URL.revokeObjectURL(removed.url)
      return current.filter(image => image.id !== id)
    })
  }

  function makeMain(id) {
    setImages(current => [current.find(image => image.id === id), ...current.filter(image => image.id !== id)])
  }

  // Ask before throwing away typed changes (Escape, backdrop click, close and cancel all come here)
  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm)
    || images.map(image => image.id).join() !== initialImages.map(image => image.id).join()
  function requestClose() {
    if (saving) return
    if (dirty && !window.confirm('Discard your changes to this product?')) return
    onClose()
  }
  const requestCloseRef = useRef(requestClose)
  useEffect(() => { requestCloseRef.current = requestClose })

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') requestCloseRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [])

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
    if (images.length === 0) { setError('Add at least one product image: upload a file or paste an image link.'); return }
    if (!form.category_slug) { setError('Choose a category.'); return }
    if (form.checkout_type === 'direct' && !form.price_ghs) { setError('Products sold online need a price.'); return }
    try {
      const pending = images.filter(image => image.file)
      const urls = []
      for (const image of images) {
        if (!image.file) { urls.push(image.url); continue }
        setStage(`Uploading image ${pending.indexOf(image) + 1} of ${pending.length}…`)
        const uploadRes = await uploadAdminProductImage(image.file)
        if (!uploadRes.success) throw new Error(uploadRes.message)
        const uploadedUrl = uploadRes.data.secure_url
        urls.push(uploadedUrl)
        // Swap in the uploaded URL so a retry after a failed save doesn't upload it again
        URL.revokeObjectURL(image.url)
        setImages(current => current.map(item => item.id === image.id ? { id: image.id, url: uploadedUrl } : item))
      }
      setStage('Saving product…')
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        category_slug: form.category_slug,
        checkout_type: form.checkout_type,
        price_pesewas: form.checkout_type === 'direct' ? Math.round(Number(form.price_ghs) * 100) : null,
        price_label: form.checkout_type === 'quote' ? (form.price_label || 'Request a quote') : null,
        images: urls,
        in_stock: Number(form.stock_qty) > 0,
        stock_qty: Number(form.stock_qty),
        tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      }
      const saveRes = isEdit ? await updateAdminProduct(product.slug, payload) : await createAdminProduct(payload)
      if (!saveRes.success) throw new Error(saveRes.message)
      onSaved(saveRes.data)
    } catch (e) {
      setError(e.message || (isEdit ? 'Unable to save changes.' : 'Unable to create product.'))
      setStage('')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:p-4"
      onMouseDown={event => { if (event.target === event.currentTarget) requestClose() }}
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
            <h2 id="add-product-title" className="text-lg font-bold text-on-surface">{isEdit ? 'Edit product' : 'Add product'}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{isEdit ? 'Changes show in the shop as soon as they are saved.' : 'New products appear in the shop as soon as they are saved.'}</p>
          </div>
          <button type="button" onClick={requestClose} disabled={saving} className="p-1.5 -mr-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-on-surface cursor-pointer disabled:opacity-50" aria-label="Close">
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
              <p className="text-sm font-medium text-gray-700 mb-1.5">Product images <span className="text-red-600">*</span></p>
              <p className="text-xs text-gray-500 mb-2">The first image is the main one shown in the shop. Up to {MAX_IMAGES} images; JPEG, PNG or WebP under 5 MB, stored on Cloudinary.</p>
              <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 space-y-3">
                {images.length > 0 && (
                  <ul className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {images.map((image, index) => (
                      <li key={image.id} className="relative">
                        <img src={image.url} alt={`Product image ${index + 1}`} className={`w-full aspect-square object-cover rounded border bg-white ${index === 0 ? 'border-primary ring-1 ring-primary' : 'border-gray-200'}`} />
                        {index === 0
                          ? <span className="absolute left-1 bottom-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">Main</span>
                          : (
                            <button type="button" onClick={() => makeMain(image.id)} disabled={saving} className="absolute left-1 bottom-1 flex items-center gap-1 rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700 shadow hover:text-primary cursor-pointer" aria-label={`Make image ${index + 1} the main image`}>
                              <Star size={10} /> Make main
                            </button>
                          )}
                        <button type="button" onClick={() => removeImage(image.id)} disabled={saving} className="absolute right-1 top-1 w-7 h-7 flex items-center justify-center rounded-full bg-white/95 text-gray-600 shadow hover:text-red-600 cursor-pointer" aria-label={`Remove image ${index + 1}`}>
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <label className={`${secondaryButtonClass} h-9 ${saving || images.length >= MAX_IMAGES ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    <ImagePlus size={16} /> {images.length ? 'Add more images' : 'Upload images'}
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp"
                      disabled={saving || images.length >= MAX_IMAGES}
                      onChange={event => { addFiles(event.target.files); event.target.value = '' }}
                      className="sr-only"
                    />
                  </label>
                  <div className="flex flex-1 min-w-[220px] gap-2">
                    <input
                      type="url"
                      value={linkInput}
                      onChange={event => setLinkInput(event.target.value)}
                      onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addLink() } }}
                      aria-label="Image link"
                      placeholder="…or paste an https:// image link"
                      className={`${inputClass} h-9`}
                    />
                    <button type="button" onClick={addLink} disabled={saving || !linkInput.trim()} className={`${secondaryButtonClass} h-9`}>Add</button>
                  </div>
                </div>
              </div>
            </div>

            <Field label="URL slug" hint={isEdit ? 'Fixed after creation so existing links keep working.' : 'Part of the product link. Filled in from the name; edit only if you need to.'} wide>
              <input
                required
                disabled={isEdit}
                value={form.slug}
                onChange={event => { setSlugEdited(true); updateForm('slug', event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-')) }}
                onBlur={event => updateForm('slug', slugify(event.target.value))}
                className={`${inputClass} font-mono`}
              />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-md">
          <button type="button" onClick={requestClose} disabled={saving} className={secondaryButtonClass}>Cancel</button>
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? stage : isEdit ? 'Save changes' : 'Create product'}
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
