import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Truck, MapPin, ShieldCheck, ChevronRight, Star, Quote } from 'lucide-react'
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
  { value: '500+', label: 'Hotels & Restaurants' },
  { value: '10+', label: 'Years of Excellence' },
  { value: '24hr', label: 'Accra Delivery' },
  { value: '1,000+', label: 'Products in Stock' },
]

const TESTIMONIALS = [
  {
    quote: "ChefWare transformed our kitchen. The equipment quality is outstanding and delivery was next-day as promised. Our chefs love the uniforms.",
    name: 'Kwame Mensah',
    role: 'Executive Chef',
    company: 'Kempinski Hotel Gold Coast City',
    rating: 5,
  },
  {
    quote: "We've been sourcing all our front-of-house uniforms from ChefWare for 3 years. The embroidery quality is exceptional and the pricing is fair.",
    name: 'Ama Serwaa',
    role: 'F&B Operations Manager',
    company: 'Mövenpick Ambassador Hotel Accra',
    rating: 5,
  },
  {
    quote: "The kitchen setup service was seamless. They handled everything from design to installation. Highly recommend for any restaurant owner in Accra.",
    name: 'Abena Owusu',
    role: 'Owner',
    company: 'The Kitchen Restaurant, Osu',
    rating: 5,
  },
]

export default function HomePage() {
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProducts({ limit: 8 }).then(prods => {
      setFeatured(prods.data?.items?.filter(p => p.checkout_type === 'direct').slice(0, 4) || [])
      setLoading(false)
    })
  }, [])

  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="relative min-h-[600px] md:min-h-[680px] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={HERO_IMAGE} alt="Premium industrial kitchen in Accra" className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/65 to-black/90" />
        </div>
        <div className="relative z-10 w-full max-w-container-max mx-auto px-gutter pb-14 md:pb-20 flex flex-col items-center text-center">
          <span className="bg-gold/90 backdrop-blur-sm text-white text-label uppercase px-4 py-1.5 rounded-full mb-6 inline-block">
            Accra's #1 Hospitality Supplier
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tight leading-tight text-white mb-6 max-w-3xl">
            Premium Supplies for Ghana's Finest Kitchens
          </h1>
          <p className="text-body-lg text-white/80 mb-8 max-w-xl">
            Equipping leading hotels and restaurants with industrial-grade equipment, bespoke uniforms, and custom branding services.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button as={Link} to="/products" variant="gold" size="lg" iconRight={<ArrowRight />} className="shadow-lg">
              Shop Now
            </Button>
            <Button
              as={Link}
              to="/services"
              variant="ghost"
              size="lg"
              className="!bg-white/10 backdrop-blur-sm border-2 border-white/60 !text-white hover:!bg-white hover:!text-primary hover:border-white focus-visible:!ring-white"
            >
              Our Services
            </Button>
          </div>
          <div className="mt-8 flex items-center gap-2 text-white/70 text-body-sm">
            <Truck size={16} />
            <span>Free delivery on orders over GH₵ 250 across Greater Accra</span>
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
              <p className="text-body text-secondary mt-2">Trusted by Ghana's finest hotels and restaurants.</p>
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
              { icon: MapPin, title: 'Accra-Based Support', desc: 'Dedicated local team for consultations, deliveries, and after-sales support across Greater Accra.' },
              { icon: Truck, title: 'Free 24hr Delivery', desc: 'Complimentary next-day delivery on all orders over GH₵ 250 within Greater Accra.' },
              { icon: ShieldCheck, title: '12-Month Warranty', desc: 'Every piece of industrial kitchen equipment comes with a full 12-month standard warranty.' },
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

      {/* Testimonials */}
      <section className="py-16 md:py-28 bg-primary">
        <div className="max-w-container-max mx-auto px-gutter text-center mb-12 md:mb-16">
          <p className="text-label uppercase text-primary-fixed mb-3">Client Stories</p>
          <h2 className="text-h2 text-white">Trusted by Ghana's Best</h2>
        </div>
        <div className="overflow-hidden">
          <div className="flex marquee-track" style={{ width: 'max-content' }}>
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <div key={i} className="w-[340px] shrink-0 mr-6 bg-white/10 backdrop-blur-sm rounded-2xl p-7 border border-white/20 flex flex-col">
                <Quote size={28} className="text-gold mb-4 shrink-0" />
                <p className="text-white/90 text-body flex-1 mb-6">"{t.quote}"</p>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white font-bold text-body-sm">{t.name}</p>
                    <p className="text-white/60 text-body-sm mt-0.5">{t.role}</p>
                    <p className="text-gold text-body-sm font-semibold mt-0.5">{t.company}</p>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} size={14} className="text-gold fill-gold" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-section-mobile md:py-section px-gutter bg-surface-container-low text-center">
        <h2 className="text-h2 text-on-surface mb-4">Need a Custom Quote?</h2>
        <p className="text-body text-secondary max-w-md mx-auto mb-8">
          Services like kitchen setup, embroidery, and machine customization require a personalised quote. We respond within 24 hours.
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
