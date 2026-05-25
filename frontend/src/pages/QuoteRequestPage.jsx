import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import { submitQuote } from '../api/quotes'
import { validatePhone, formatPhone } from '../utils/format'
import Button from '../components/Button'

const CATEGORIES = [
  { slug: 'kitchen-setup', name: 'Industrial Kitchen Setup' },
  { slug: 'machine-preorders', name: 'Customized Machine Pre-Orders' },
  { slug: 'machine-customization', name: 'Machine Customization' },
  { slug: 'embroidery', name: 'Embroidery Services' },
  { slug: 'logo-printing-branding', name: 'Logo Printing & Garment Branding' },
]

export default function QuoteRequestPage() {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    category_slug: searchParams.get('category') || '',
    message: '',
  })

  function update(field, val) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('Name is required.'); return }
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) { setError('Valid email is required.'); return }
    if (!validatePhone(formatPhone(form.phone))) { setError('Phone must be in +233XXXXXXXXX format.'); return }
    if (!form.category_slug) { setError('Please select a category.'); return }
    if (!form.message.trim()) { setError('Please describe your requirements.'); return }

    setLoading(true)
    try {
      const res = await submitQuote({ ...form, phone: formatPhone(form.phone) })
      if (!res.success) throw new Error(res.message)
      setResult(res.data)
    } catch (e) {
      setError(e.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <main className="pt-20 min-h-screen bg-surface flex items-center justify-center">
        <div className="max-w-md mx-auto px-gutter text-center">
          <CheckCircle size={56} className="text-primary mx-auto mb-md" />
          <h1 className="text-h2 font-medium text-on-surface mb-sm">Quote Request Received!</h1>
          <p className="text-body text-secondary mb-md">Your reference is <strong className="text-primary">{result.reference}</strong>. Our team will contact you within 24 hours.</p>
          <Button onClick={() => setResult(null)} variant="ghost">Submit Another</Button>
        </div>
      </main>
    )
  }

  return (
    <main className="pt-20 min-h-screen bg-surface">
      <div className="max-w-2xl mx-auto px-gutter py-xl">
        <div className="mb-lg">
          <h1 className="text-h1 font-medium text-on-surface">Request a Quote</h1>
          <p className="text-body text-secondary mt-2">Tell us about your requirements and we'll prepare a custom quote within 24 hours.</p>
        </div>

        <div className="bg-white rounded-xl border border-outline-variant p-xl">
          {error && (
            <div className="flex items-center gap-2 bg-error-container text-on-error-container px-md py-sm rounded-lg mb-md">
              <AlertTriangle size={16} className="shrink-0" />
              <p className="text-body-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <label className="block text-label text-xs font-semibold text-secondary uppercase tracking-wide mb-xs" htmlFor="name">Full Name *</label>
                <input id="name" type="text" value={form.name} onChange={e => update('name', e.target.value)} className="w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Kwame Asante" required />
              </div>
              <div>
                <label className="block text-label text-xs font-semibold text-secondary uppercase tracking-wide mb-xs" htmlFor="email">Email Address *</label>
                <input id="email" type="email" value={form.email} onChange={e => update('email', e.target.value)} className="w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary" placeholder="kwame@example.com" required />
              </div>
            </div>

            <div>
              <label className="block text-label text-xs font-semibold text-secondary uppercase tracking-wide mb-xs" htmlFor="phone">Phone Number *</label>
              <input id="phone" type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className="w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary" placeholder="+233244123456" required />
              <p className="text-label text-xs text-secondary mt-xs">Format: +233XXXXXXXXX</p>
            </div>

            <div>
              <label className="block text-label text-xs font-semibold text-secondary uppercase tracking-wide mb-xs" htmlFor="category">Service Category *</label>
              <select id="category" value={form.category_slug} onChange={e => update('category_slug', e.target.value)} className="w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer" required>
                <option value="">Select a category...</option>
                {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-label text-xs font-semibold text-secondary uppercase tracking-wide mb-xs" htmlFor="message">Requirements *</label>
              <textarea id="message" value={form.message} onChange={e => update('message', e.target.value)} rows={5} className="w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Describe your needs — e.g. 'We need a full kitchen setup for a 60-seat restaurant, including industrial ovens and prep stations.'" required />
            </div>

            <Button type="submit" loading={loading} variant="primary" size="lg" className="w-full">
              Submit Quote Request
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
