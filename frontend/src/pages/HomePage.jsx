import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardCheck, MapPin, PackageCheck, ChevronRight } from 'lucide-react'
import { getProducts } from '../api/products'
import ProductCard from '../components/ProductCard'
import { SkeletonCard } from '../components/PageLoader'
import Button from '../components/Button'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=80'
const CAT_IMAGES = {
  'chef-uniforms': 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=900&q=80',
  'kitchen-equipment-tools': 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=900&q=80',
  'staff-uniforms': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80',
}

const STATS = [
  { value: 'Uniforms', label: 'For kitchen and service teams' },
  { value: 'Equipment', label: 'For commercial kitchens' },
  { value: 'Branding', label: 'For a consistent team look' },
  { value: 'Quotes', label: 'For custom requirements' },
]

export default function HomePage() {
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadFeatured() {
      try {
        const prods = await getProducts({ limit: 8 })
        if (active) setFeatured(prods.data?.items?.filter(p => p.checkout_type === 'direct').slice(0, 4) || [])
      } catch {
        if (active) setFeatured([])
      } finally {
        if (active) setLoading(false)
      }
    }

    loadFeatured()
    return () => { active = false }
  }, [])

  return (
    <main className="pt-20 overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-[600px] md:min-h-[680px] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={HERO_IMAGE} alt="Premium industrial kitchen in Accra" className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/65 to-black/90" />
        </div>
        <div className="relative z-10 w-full min-w-0 max-w-container-max mx-auto px-gutter pb-14 md:pb-20 flex flex-col items-center text-center">
          <span className="max-w-full bg-gold/90 backdrop-blur-sm text-white text-label uppercase px-4 py-1.5 rounded-full mb-6 inline-block">
            Hospitality supplies for businesses in Ghana
          </span>
          <h1 className="max-w-3xl text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tight leading-tight text-white mb-6 break-words">
            Equip Your Hospitality Business with Confidence
          </h1>
          <p className="text-body-lg text-white/80 mb-8 max-w-xl">
            Source uniforms and stocked equipment, or get a tailored quote for kitchen setup, embroidery, and branding.
          </p>
          <div className="flex w-full flex-col sm:w-auto sm:flex-row justify-center gap-3 sm:gap-4">
            <Button as={Link} to="/products" variant="gold" size="lg" iconRight={<ArrowRight />} className="w-full shadow-lg sm:w-auto">
              Shop Stocked Products
            </Button>
            <Button
              as={Link} to="/quote"
              variant="ghost"
              size="lg"
              className="w-full !bg-white/10 backdrop-blur-sm border-2 border-white/60 !text-white hover:!bg-white hover:!text-primary hover:border-white focus-visible:!ring-white sm:w-auto"
            >
              Get a Business Quote
            </Button>
          </div>
          <div className="mt-8 flex max-w-full items-center gap-2 text-white/70 text-body-sm">
            <ClipboardCheck size={16} className="shrink-0" />
            <span>Choose the route that fits your order: buy online or request a tailored quote.</span>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-primary py-section-mobile md:py-section px-gutter">
        <div className="max-w-container-max mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="text-h1 text-white">{s.value}</p>
              <p className="text-primary-fixed text-body-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-section-mobile md:py-section bg-white">
        <div className="max-w-container-max mx-auto px-gutter">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div>
            <h2 className="text-h2 text-on-surface">Shop by Category</h2>
            <p className="text-body text-secondary mt-2">Specialized solutions for every hospitality need.</p>
          </div>
          <Link
            to="/products"
            className="text-primary text-body-sm font-semibold flex items-center gap-1 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
          >
            Browse All <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-1 gap-5 md:h-[500px]">
          {/* Chef Uniforms — hero card */}
          <div className="md:col-span-7 group relative rounded-2xl overflow-hidden h-[320px] md:h-auto">
            <img src={CAT_IMAGES['chef-uniforms']} alt="Chef Uniforms" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <p className="text-label uppercase text-gold mb-2">Most Popular</p>
              <h3 className="text-h1 text-white mb-2">Chef Uniforms</h3>
              <p className="text-white/70 text-body-sm mb-5">Forest green jackets, aprons, trousers & caps</p>
              <Button
                as={Link}
                to="/products?category=chef-uniforms"
                size="sm"
                variant="ghost"
                iconRight={<ArrowRight />}
                className="!bg-white !text-primary hover:!bg-gold hover:!text-white"
              >
                Shop Collection
              </Button>
            </div>
          </div>

          <div className="md:col-span-5 grid grid-rows-2 gap-5">
            {/* Industrial Equipment */}
            <div className="group relative rounded-2xl overflow-hidden h-[200px] md:h-auto">
              <img src={CAT_IMAGES['kitchen-equipment-tools']} alt="Kitchen Equipment" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-h3 text-white mb-1">Industrial Equipment</h3>
                <Link
                  to="/products?category=kitchen-equipment-tools"
                  className="text-gold text-body-sm font-semibold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 rounded"
                >
                  Browse Machines →
                </Link>
              </div>
            </div>

            {/* Services Strip */}
            <div className="group relative rounded-2xl overflow-hidden bg-primary-container h-[200px] md:h-auto">
              <img src={CAT_IMAGES['staff-uniforms']} alt="Staff Uniforms" className="w-full h-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <h3 className="text-h3 text-white mb-1">Branding & Customization</h3>
                <p className="text-white/70 text-body-sm mb-3">Embroidery, printing, kitchen setup</p>
                <Button as={Link} to="/services" variant="gold" size="sm" iconRight={<ArrowRight />} className="w-fit">
                  View Services
                </Button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Top Products */}
      <section className="py-section-mobile md:py-section bg-surface-container-low border-t border-outline-variant">
        <div className="max-w-container-max mx-auto px-gutter">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
            <div>
              <h2 className="text-h2 text-on-surface">Top Ghanaian Essentials</h2>
              <p className="text-body text-secondary mt-2">Stocked products for hospitality teams and commercial kitchens.</p>
            </div>
            <Button as={Link} to="/products" variant="ghost" size="md" iconRight={<ArrowRight />}>
              View Full Catalog
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : featured.map(p => <ProductCard key={p.id} product={p} />)
            }
          </div>
          {!loading && featured.length === 0 && (
            <div className="mt-5 rounded-xl border border-outline-variant bg-white p-6 text-center">
              <p className="text-body text-secondary">Our current catalogue is being updated.</p>
              <Button as={Link} to="/products" variant="ghost" size="sm" className="mt-3">Browse the catalogue</Button>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-section-mobile md:py-section px-gutter bg-white border-t border-outline-variant">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-12">
            <p className="text-label uppercase text-primary mb-3">Why ChefWare</p>
            <h2 className="text-h2 text-on-surface">Built for Ghana's Hospitality Industry</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: MapPin, title: 'Built for Ghanaian Hospitality', desc: 'Explore product categories made for kitchen teams, restaurants, hotels, and food-service businesses.' },
              { icon: PackageCheck, title: 'Buy What Is Ready', desc: 'Add stocked uniforms and equipment to cart when you know exactly what your team needs.' },
              { icon: ClipboardCheck, title: 'Quote What Is Custom', desc: 'Use a quote request for projects, branding, embroidery, and requirements that need a tailored plan.' },
            ].map(item => (
              <div key={item.title} className="flex flex-col items-center text-center p-8 bg-white rounded-2xl border border-outline-variant hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5">
                  <item.icon size={28} className="text-primary" />
                </div>
                <h3 className="text-h3 text-on-surface mb-2">{item.title}</h3>
                <p className="text-body-sm text-secondary">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary py-section-mobile md:py-section px-gutter text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-label uppercase text-primary-fixed mb-3">For a clear next step</p>
          <h2 className="text-h2 text-white mb-4">Tell Us What Your Business Needs</h2>
          <p className="text-body text-white/75 mb-8">For quantities, branding, kitchen projects, or a custom specification, send the details and the team can prepare the right quote.</p>
          <Button as={Link} to="/quote" variant="gold" size="lg" iconRight={<ArrowRight />}>Request a Business Quote</Button>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-section-mobile md:py-section px-gutter bg-surface-container-low text-center">
        <h2 className="text-h2 text-on-surface mb-4">Need a Custom Quote?</h2>
        <p className="text-body text-secondary max-w-md mx-auto mb-8">
          Kitchen setup, embroidery, machine customization, and branded teamwear need a tailored plan. Tell us what you need to get started.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button as={Link} to="/quote" variant="primary" size="lg" iconRight={<ArrowRight />}>
            Request a Free Quote
          </Button>
          <Button as={Link} to="/products" variant="secondary" size="lg">
            Browse Products
          </Button>
        </div>
      </section>
    </main>
  )
}
