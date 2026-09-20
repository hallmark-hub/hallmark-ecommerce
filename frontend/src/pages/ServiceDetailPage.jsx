import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'
import Button from '../components/Button'
import useSiteContentStore from '../store/siteContentStore'

const QUOTE_STEPS = [
  'Share your requirement and quantity',
  'The team reviews and clarifies the scope',
  'Receive a proposal for the agreed requirement',
]

const QUOTE_CATEGORY_BY_SERVICE = {
  uniforms: 'uniforms',
  'branding-embroidery': 'branding-embroidery',
  'kitchen-solutions': 'kitchen-setup',
  disposables: 'disposables',
  robotics: 'robotics',
}

export default function ServiceDetailPage() {
  const { slug } = useParams()
  const services = useSiteContentStore(state => state.content.services)
  const service = services.find(item => item.slug === slug)

  if (!service) return <Navigate to="/services" replace />

  const quoteCategory = QUOTE_CATEGORY_BY_SERVICE[service.slug] || service.slug

  return (
    <main className="pt-20 min-h-screen bg-surface">
      <section className="max-w-container-max mx-auto px-gutter py-section-mobile md:py-section">
        <Link to="/services" className="inline-flex items-center gap-2 text-body-sm font-semibold text-primary mb-lg hover:underline">
          <ArrowLeft size={17} /> All Services
        </Link>
        <div className="grid lg:grid-cols-2 gap-xl items-center">
          <div className="rounded-2xl overflow-hidden border border-outline-variant bg-white aspect-[4/3]">
            <img src={service.image_url} alt={service.image_alt} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-label uppercase text-primary mb-3">Business Service</p>
            <h1 className="text-h1 md:text-display-sm text-on-surface mb-4">{service.title}</h1>
            <p className="text-body-lg text-on-surface-variant mb-lg">{service.body}</p>
            <div className="space-y-3 mb-lg">
              {QUOTE_STEPS.map(item => (
                <p key={item} className="flex items-start gap-2 text-body text-on-surface">
                  <CheckCircle size={18} className="text-primary shrink-0 mt-0.5" /> {item}
                </p>
              ))}
            </div>
            <Button as={Link} to={`/quote?category=${quoteCategory}`} variant="gold" size="lg" iconRight={<ArrowRight />}>
              Request a Quote
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
