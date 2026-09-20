import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import { submitQuote } from '../api/quotes'
import { validatePhone, formatPhone } from '../utils/format'
import Button from '../components/Button'
import useAuthStore from '../store/authStore'
import { whatsappLink } from '../config/contact'
import useSiteContentStore from '../store/siteContentStore'

export default function QuoteRequestPage() {
  const [searchParams] = useSearchParams()
  const profile = useAuthStore(s => s.profile)
  const content = useSiteContentStore(s => s.content)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const [form, setForm] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    company_name: '',
    location: '',
    category_slug: searchParams.get('category') || '',
    quantity: '',
    preferred_delivery_date: '',
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
      const res = await submitQuote({
        ...form,
        phone: formatPhone(form.phone),
        preferred_delivery_date: form.preferred_delivery_date || null,
      })
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
          <h1 className="text-h2 text-on-surface mb-sm">Quote Request Received!</h1>
          <p className="text-body text-secondary mb-md">Your reference is <strong className="text-primary">{result.reference}</strong>. The ChefWare team will review the requirement and follow up.</p>
          <Button onClick={() => setResult(null)} variant="ghost" size="md">Submit Another</Button>
        </div>
      </main>
    )
  }

  return (
    <main className="pt-20 min-h-screen bg-surface flex">

      {/* Full-height left image panel */}
      <div className="hidden lg:block sticky top-20 h-[calc(100vh-80px)] self-start flex-none w-[45%]">
        <div className="relative w-full h-full">
          <img
            src={content.quote_image_url}
            alt="Commercial kitchen equipment and machinery"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-10">
            <p className="text-white text-h1 font-bold leading-tight mb-3">Build Your Hospitality Solution</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
              <p className="text-white/75 text-body-sm">A proposal shaped around your venue, requirement and timeline</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right scrollable content */}
      <div className="flex-1 min-w-0 px-8 lg:px-16 py-10 md:py-14 bg-surface">
        <div className="max-w-2xl mx-auto">
        <div className="mb-lg">
          <h1 className="text-h1 text-on-surface">Tell Us What You Need</h1>
          <p className="text-body-lg text-secondary mt-2">For uniforms, branding, kitchen projects, disposables or robotics, share the business context the team needs to scope the right response.</p>
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
                <label className="block text-label uppercase text-secondary mb-xs" htmlFor="name">Full Name *</label>
                <input id="name" type="text" value={form.name} onChange={e => update('name', e.target.value)} className="w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Kwame Asante" required />
              </div>
              <div>
                <label className="block text-label uppercase text-secondary mb-xs" htmlFor="email">Email Address *</label>
                <input id="email" type="email" value={form.email} onChange={e => update('email', e.target.value)} className="w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary" placeholder="kwame@example.com" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <label className="block text-label uppercase text-secondary mb-xs" htmlFor="company_name">Company / Organisation</label>
                <input id="company_name" type="text" value={form.company_name} onChange={e => update('company_name', e.target.value)} className="w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Asante Catering" />
              </div>
              <div>
                <label className="block text-label uppercase text-secondary mb-xs" htmlFor="location">Project Location</label>
                <input id="location" type="text" value={form.location} onChange={e => update('location', e.target.value)} className="w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary" placeholder="East Legon, Accra" />
              </div>
            </div>

            <div>
              <label className="block text-label uppercase text-secondary mb-xs" htmlFor="phone">Phone Number *</label>
              <input id="phone" type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className="w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary" placeholder="+233244123456" required />
              <p className="text-label uppercase text-secondary mt-xs">Format: +233XXXXXXXXX</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <label className="block text-label uppercase text-secondary mb-xs" htmlFor="quantity">Quantity / Scale</label>
                <input id="quantity" type="text" value={form.quantity} onChange={e => update('quantity', e.target.value)} className="w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. 60 uniforms or 60-seat restaurant" />
              </div>
              <div>
                <label className="block text-label uppercase text-secondary mb-xs" htmlFor="preferred_delivery_date">Preferred Delivery Date</label>
                <input id="preferred_delivery_date" type="date" value={form.preferred_delivery_date} onChange={e => update('preferred_delivery_date', e.target.value)} className="w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>

            <div>
              <label className="block text-label uppercase text-secondary mb-xs" htmlFor="category">Service Category *</label>
              <select id="category" value={form.category_slug} onChange={e => update('category_slug', e.target.value)} className="w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer" required>
                <option value="">Select a category...</option>
                {(content.quote_options?.length ? content.quote_options : content.services).map(option => <option key={option.slug} value={option.slug}>{option.title}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-label uppercase text-secondary mb-xs" htmlFor="message">Requirements *</label>
              <textarea id="message" value={form.message} onChange={e => update('message', e.target.value)} rows={5} className="w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Describe the products, service, specifications or workflow you need help with." required />
            </div>

            <Button type="submit" loading={loading} variant="primary" size="lg" fullWidth>
              Request My Quote
            </Button>
          </form>

          <div className="mt-lg pt-lg border-t border-outline-variant text-center">
            <p className="text-body-sm text-secondary mb-sm">
              Prefer to talk it through? Chat directly with one of our reps.
            </p>
            <a
              href={whatsappLink(content.whatsapp_number, `Hello ${content.company_name}! I have a question about requesting a quote.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-md py-sm rounded-lg font-medium text-white transition-transform hover:scale-105"
              style={{ backgroundColor: '#25D366' }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="white" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Chat with a rep on WhatsApp
            </a>
          </div>
        </div>
        </div>
      </div>
    </main>
  )
}
