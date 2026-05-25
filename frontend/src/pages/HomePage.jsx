import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Truck, MapPin, ShieldCheck, ChevronRight } from 'lucide-react'
import { getProducts } from '../api/products'
import ProductCard from '../components/ProductCard'
import { SkeletonCard } from '../components/PageLoader'
import Button from '../components/Button'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=80'
const CAT_IMAGES = {
  'chef-uniforms': 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=900&q=80',
  'kitchen-equipment-tools': 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=900&q=80',
}

export default function HomePage() {
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProducts({ limit: 4 }).then(prods => {
      setFeatured(prods.data?.items || [])
      setLoading(false)
    })
  }, [])

  return (
    <main>
      {/* Hero */}
      <section className="relative h-[600px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={HERO_IMAGE} alt="Premium industrial kitchen in Accra" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
        </div>
        <div className="relative z-10 w-full max-w-container-max mx-auto px-gutter flex flex-col items-center text-center">
          <span className="bg-gold text-on-tertiary-fixed text-label px-3 py-1 rounded-full mb-base inline-block">Accra-based Premium Supplier</span>
          <h1 className="text-h1 md:text-4xl font-bold text-white mb-md leading-tight max-w-2xl">
            Premium Hospitality Supplies for Ghana's Finest Kitchens.
          </h1>
          <p className="text-body text-surface-container-high mb-lg max-w-xl">
            Equipping the nation's leading hotels and restaurants with industrial-grade equipment and bespoke uniforms.
          </p>
          <div className="flex flex-wrap justify-center gap-md">
            <Link to="/products">
              <Button variant="primary" size="lg">
                Explore Catalog <ArrowRight size={18} />
              </Button>
            </Link>
            <Link to="/quote">
              <Button variant="cta" size="lg">Request Quote</Button>
            </Link>
          </div>
          <div className="mt-xl flex items-center gap-base">
            <Truck size={18} className="text-tertiary-fixed" />
            <p className="text-label text-tertiary-fixed">GHS 250+ Orders Ship Free Across Accra</p>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-xl px-gutter max-w-container-max mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-lg">
          <div>
            <h2 className="text-h2 text-primary">Featured Categories</h2>
            <p className="text-body text-secondary mt-2">Specialized solutions for every hospitality need.</p>
          </div>
          <Link to="/products" className="text-primary text-label flex items-center gap-1 hover:underline mt-4 md:mt-0">
            View All <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-md h-auto md:h-[480px]">
          {/* Chef Uniforms — large card */}
          <div className="md:col-span-8 group relative rounded-xl overflow-hidden border border-outline-variant bg-white min-h-[280px]">
            <img
              src={CAT_IMAGES['chef-uniforms']}
              alt="Chef Uniforms"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 right-0 p-lg bg-gradient-to-t from-black/80 to-transparent">
              <h3 className="text-h2 text-white font-medium">Chef Uniforms</h3>
              <p className="text-surface-container-highest mb-base text-body-sm">Durable, elegant forest green jackets and aprons.</p>
              <Link to="/products?category=chef-uniforms" className="text-white border border-white px-base py-xs rounded-lg text-label text-xs hover:bg-white hover:text-primary transition-colors inline-block">
                Shop Collection
              </Link>
            </div>
          </div>
          {/* Industrial Equipment */}
          <div className="md:col-span-4 group relative rounded-xl overflow-hidden border border-outline-variant bg-white min-h-[200px]">
            <img
              src={CAT_IMAGES['kitchen-equipment-tools']}
              alt="Industrial Equipment"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 right-0 p-md bg-gradient-to-t from-black/80 to-transparent">
              <h3 className="text-h3 text-white font-medium">Industrial Equipment</h3>
              <Link to="/products?category=kitchen-equipment-tools" className="text-white text-label text-xs mt-base underline block">Browse Machines</Link>
            </div>
          </div>
          {/* Branding Services — full-width strip */}
          <div className="md:col-span-12 group relative rounded-xl overflow-hidden border border-outline-variant h-36">
            <div className="absolute inset-0 bg-primary-container" />
            <div className="relative z-10 flex items-center justify-between h-full px-xl">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <span className="text-white text-xl">✦</span>
                </div>
                <div>
                  <h3 className="text-h3 text-white font-medium">Branding Services</h3>
                  <p className="text-on-primary-container text-body-sm">Custom logo embroidery and uniform personalization for your staff.</p>
                </div>
              </div>
              <Link to="/quote">
                <Button variant="cta" size="md">Start Customizing</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Top Ghanaian Essentials */}
      <section className="py-xl bg-surface-container-lowest">
        <div className="max-w-container-max mx-auto px-gutter">
          <div className="mb-lg">
            <h2 className="text-h2 text-on-surface">Top Ghanaian Essentials</h2>
            <p className="text-body text-secondary">High-quality equipment priced in GHS.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : featured.map(p => <ProductCard key={p.id} product={p} />)
            }
          </div>
          <div className="text-center mt-lg">
            <Link to="/products">
              <Button variant="ghost" size="lg">View Full Catalog <ArrowRight size={18} /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="py-xl bg-primary text-on-primary">
        <div className="max-w-container-max mx-auto px-gutter grid grid-cols-1 md:grid-cols-3 gap-xl">
          <div className="flex items-start gap-md">
            <div className="bg-primary-container p-sm rounded-lg shrink-0">
              <MapPin size={32} className="text-on-primary-container" />
            </div>
            <div>
              <h4 className="text-h3 font-medium mb-2">Accra-based Support</h4>
              <p className="text-body-sm opacity-80">Localized logistics and on-site consultations for Ghanaian hospitality businesses.</p>
            </div>
          </div>
          <div className="flex items-start gap-md">
            <div className="bg-primary-container p-sm rounded-lg shrink-0">
              <Truck size={32} className="text-on-primary-container" />
            </div>
            <div>
              <h4 className="text-h3 font-medium mb-2">Free Delivery</h4>
              <p className="text-body-sm opacity-80">Complimentary shipping on all orders over GH₵ 250 within Greater Accra.</p>
            </div>
          </div>
          <div className="flex items-start gap-md">
            <div className="bg-primary-container p-sm rounded-lg shrink-0">
              <ShieldCheck size={32} className="text-on-primary-container" />
            </div>
            <div>
              <h4 className="text-h3 font-medium mb-2">Premium Warranty</h4>
              <p className="text-body-sm opacity-80">12-month standard warranty on all industrial kitchen equipment.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
