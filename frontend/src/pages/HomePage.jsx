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
  'kitchen-equipment-tools': 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=900&q=80',
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
    <main>
      {/* Hero */}
      <section className="relative h-[640px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={HERO_IMAGE} alt="Premium industrial kitchen in Accra" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="relative z-10 w-full max-w-container-max mx-auto px-gutter flex flex-col items-center text-center">
          <span className="bg-gold/90 backdrop-blur-sm text-white text-xs font-bold px-4 py-1.5 rounded-full mb-5 uppercase tracking-widest inline-block">
            Accra's #1 Hospitality Supplier
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-5 leading-[1.1] max-w-3xl">
            Premium Supplies for Ghana's Finest Kitchens
          </h1>
          <p className="text-lg text-white/80 mb-8 max-w-xl leading-relaxed">
            Equipping leading hotels and restaurants with industrial-grade equipment, bespoke uniforms, and custom branding services.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/products">
              <button className="flex items-center gap-2 px-7 py-3.5 bg-gold hover:bg-gold/90 text-white text-base font-bold rounded-xl transition-all duration-200 cursor-pointer shadow-lg">
                Shop Now <ArrowRight size={18} />
              </button>
            </Link>
            <Link to="/services">
              <button className="flex items-center gap-2 px-7 py-3.5 bg-white/10 backdrop-blur-sm hover:bg-white hover:text-primary text-white text-base font-semibold rounded-xl border-2 border-white/60 transition-all duration-200 cursor-pointer">
                Our Services
              </button>
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-2 text-white/70 text-sm">
            <Truck size={16} />
            <span>Free delivery on orders over GH₵ 250 across Greater Accra</span>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-primary py-6 px-gutter">
        <div className="max-w-container-max mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="text-3xl font-black text-white">{s.value}</p>
              <p className="text-primary-fixed text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 px-gutter max-w-container-max mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">What We Offer</p>
            <h2 className="text-3xl font-bold text-on-surface">Shop by Category</h2>
            <p className="text-secondary mt-2">Specialized solutions for every hospitality need.</p>
          </div>
          <Link to="/products" className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline mt-4 md:mt-0">
            Browse All <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-1 gap-5 md:h-[500px]">
          {/* Chef Uniforms — hero card */}
          <div className="md:col-span-7 group relative rounded-2xl overflow-hidden h-[320px] md:h-auto cursor-pointer">
            <img src={CAT_IMAGES['chef-uniforms']} alt="Chef Uniforms" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-gold mb-2">Most Popular</p>
              <h3 className="text-2xl font-bold text-white mb-2">Chef Uniforms</h3>
              <p className="text-white/70 text-sm mb-5">Forest green jackets, aprons, trousers & caps</p>
              <Link to="/products?category=chef-uniforms" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-primary text-sm font-bold rounded-xl hover:bg-gold hover:text-white transition-colors">
                Shop Collection <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          <div className="md:col-span-5 grid grid-rows-2 gap-5">
            {/* Industrial Equipment */}
            <div className="group relative rounded-2xl overflow-hidden cursor-pointer h-[200px] md:h-auto">
              <img src={CAT_IMAGES['kitchen-equipment-tools']} alt="Kitchen Equipment" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-lg font-bold text-white">Industrial Equipment</h3>
                <Link to="/products?category=kitchen-equipment-tools" className="text-gold text-xs font-semibold hover:underline">Browse Machines →</Link>
              </div>
            </div>

            {/* Services Strip */}
            <div className="group relative rounded-2xl overflow-hidden bg-primary-container cursor-pointer h-[200px] md:h-auto">
              <img src={CAT_IMAGES['staff-uniforms']} alt="Staff Uniforms" className="w-full h-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gold mb-1">All Services</p>
                <h3 className="text-lg font-bold text-white mb-1">Branding & Customization</h3>
                <p className="text-white/70 text-xs mb-3">Embroidery, printing, kitchen setup</p>
                <Link to="/services" className="inline-flex items-center gap-1.5 px-4 py-2 bg-gold hover:bg-gold/90 text-white text-xs font-bold rounded-lg transition-colors w-fit">
                  View Services <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Products */}
      <section className="py-16 bg-surface-container-lowest">
        <div className="max-w-container-max mx-auto px-gutter">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Bestsellers</p>
              <h2 className="text-3xl font-bold text-on-surface">Top Ghanaian Essentials</h2>
              <p className="text-secondary mt-2">Trusted by Ghana's finest hotels and restaurants.</p>
            </div>
            <Link to="/products">
              <Button variant="ghost" size="md">View Full Catalog <ArrowRight size={16} /></Button>
            </Link>
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
      <section className="py-16 px-gutter bg-surface">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Why ChefWare</p>
            <h2 className="text-3xl font-bold text-on-surface">Built for Ghana's Hospitality Industry</h2>
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
                <h3 className="text-lg font-bold text-on-surface mb-2">{item.title}</h3>
                <p className="text-secondary text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-gutter bg-primary">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-fixed mb-2">Client Stories</p>
            <h2 className="text-3xl font-bold text-white">Trusted by Ghana's Best</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white/10 backdrop-blur-sm rounded-2xl p-7 border border-white/20 flex flex-col">
                <Quote size={28} className="text-gold mb-4 shrink-0" />
                <p className="text-white/90 text-sm leading-relaxed flex-1 mb-6">"{t.quote}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-sm">{t.name}</p>
                    <p className="text-white/60 text-xs mt-0.5">{t.role}</p>
                    <p className="text-gold text-xs font-semibold mt-0.5">{t.company}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} size={13} className="text-gold fill-gold" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-gutter bg-surface-container-lowest text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Get Started Today</p>
        <h2 className="text-3xl font-bold text-on-surface mb-4">Need a Custom Quote?</h2>
        <p className="text-secondary max-w-md mx-auto mb-8 text-sm leading-relaxed">
          Services like kitchen setup, embroidery, and machine customization require a personalised quote. We respond within 24 hours.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/quote">
            <button className="flex items-center gap-2 px-7 py-3.5 bg-primary hover:bg-primary-container text-white font-bold rounded-xl transition-colors cursor-pointer">
              Request a Free Quote <ArrowRight size={18} />
            </button>
          </Link>
          <Link to="/products">
            <button className="flex items-center gap-2 px-7 py-3.5 border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold rounded-xl transition-colors cursor-pointer">
              Browse Products
            </button>
          </Link>
        </div>
      </section>
    </main>
  )
}
