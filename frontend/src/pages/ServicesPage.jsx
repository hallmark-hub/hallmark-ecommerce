import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Button from '../components/Button'
import useSiteContentStore from '../store/siteContentStore'

export default function ServicesPage() {
  const services = useSiteContentStore(state => state.content.services)

  return (
    <main className="pt-20 bg-surface min-h-screen">
      <section className="bg-primary py-section-mobile md:py-section px-gutter text-center">
        <p className="text-label uppercase text-primary-fixed mb-3">Services</p>
        <h1 className="text-h1 md:text-display-sm text-white mb-4 max-w-2xl mx-auto">
          Services Built Around Your Operation
        </h1>
        <p className="text-body-lg text-on-primary/80 max-w-xl mx-auto">
          Open a service to understand the offering, then send the team your requirement for a tailored quote.
        </p>
      </section>

      <section className="max-w-container-max mx-auto px-gutter py-section-mobile md:py-section">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg">
          {services.map(service => (
            <article key={service.slug} className="group bg-white rounded-2xl border border-outline-variant overflow-hidden flex flex-col hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
              <Link to={`/services/${service.slug}`} className="block aspect-[4/3] overflow-hidden">
                <img src={service.image_url} alt={service.image_alt} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </Link>
              <div className="flex flex-col flex-1 p-lg gap-3">
                <h2 className="text-h3 text-on-surface">{service.title}</h2>
                <p className="text-body-sm text-on-surface-variant">{service.body}</p>
                <Button as={Link} to={`/services/${service.slug}`} variant="primary" size="md" fullWidth iconRight={<ArrowRight />} className="mt-auto">
                  View Service
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
