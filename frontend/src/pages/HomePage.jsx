import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bot, ClipboardCheck, Clock, Mail, MapPin, Phone, PackageCheck, ChevronRight } from 'lucide-react'
import { getProducts } from '../api/products'
import ProductCard from '../components/ProductCard'
import { SkeletonCard } from '../components/PageLoader'
import Button from '../components/Button'
import HeroMedia from '../components/HeroMedia'
import { mapsDirectionsUrl, mapsEmbedUrl } from '../config/contact'
import useSiteContentStore from '../store/siteContentStore'

const STATS = [
  { value: 'Uniforms', label: 'Professional hospitality wear' },
  { value: 'Branding', label: 'Embroidery and printing' },
  { value: 'Kitchen', label: 'Equipment and full setup' },
  { value: 'Disposables', label: 'Tissues, packs and essentials' },
  { value: 'Robotics', label: 'Smarter hospitality support' },
]

const TRUSTED_BY = [
  { name: 'Labadi Beach Hotel', logo_url: '/clients-logo/labadi-removebg-preview.png' },
  { name: 'Lancaster Hotels', logo_url: '/clients-logo/lancaster-removebg-preview.png' },
  { name: 'Pomona', logo_url: null },
  { name: "Moka's Express", logo_url: '/clients-logo/moka-removebg-preview.png' },
  { name: 'Hallmark Cafe', logo_url: '/clients-logo/hallmark-removebg-preview.png' },
]

export default function HomePage() {
  const content = useSiteContentStore(state => state.content)
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
          <img src={content.home_hero_image_url} alt={`${content.company_name} hospitality offering`} className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/65 to-black/90" />
        </div>
        <div className="relative z-10 w-full min-w-0 max-w-container-max mx-auto px-gutter pb-14 md:pb-20 flex flex-col items-center text-center">
          <span className="max-w-full bg-gold/90 backdrop-blur-sm text-white text-label uppercase px-4 py-1.5 rounded-full mb-6 inline-block">
            {content.home_hero_eyebrow}
          </span>
          <h1 className="max-w-3xl text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tight leading-tight text-white mb-6 break-words">
            {content.home_hero_title}
          </h1>
          <p className="text-body-lg text-white/80 mb-8 max-w-xl">
            {content.home_hero_body}
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
        <div className="max-w-container-max mx-auto grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
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
            <p className="text-body text-secondary mt-2">Shop defined products online, then request a quote for a tailored requirement.</p>
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
            <img src={content.home_uniform_image_url} alt="Chef Uniforms" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <p className="text-label uppercase text-gold mb-2">Professional teamwear</p>
              <h3 className="text-h1 text-white mb-2">Chef Uniforms</h3>
              <p className="text-white/70 text-body-sm mb-5">Jackets, aprons, trousers, caps and coordinated sets</p>
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
              <img src={content.home_equipment_image_url} alt="Kitchen Equipment" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
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
              <img src={content.home_branding_image_url} alt="Staff Uniforms" className="w-full h-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <h3 className="text-h3 text-white mb-1">Branding & Customization</h3>
              <p className="text-white/70 text-body-sm mb-3">Embroidery, printing and customised teamwear</p>
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
              <h2 className="text-h2 text-on-surface">Featured Products</h2>
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

      {/* Robotics — a focused high-value path, not a competing catalogue */}
      {content.show_robotics_page && <section className="bg-inverse-surface text-white overflow-hidden">
        <div className="max-w-container-max mx-auto grid lg:grid-cols-2 min-h-[520px]">
          <div className="px-gutter py-section-mobile md:py-section flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 w-fit rounded-full bg-white/10 border border-white/15 px-3 py-1.5 mb-5">
              <Bot size={16} className="text-primary-fixed" />
              <span className="text-label uppercase text-white">Hospitality Robotics</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight max-w-xl">
              {content.home_robotics_title}
            </h2>
            <p className="text-body-lg text-white/70 max-w-xl mt-5 mb-8">
              {content.home_robotics_body}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button as={Link} to="/robotics" variant="gold" size="lg" iconRight={<ArrowRight />}>
                Explore Robotics
              </Button>
              <Button
                as={Link}
                to="/quote?category=robotics"
                variant="ghost"
                size="lg"
                className="!text-white border border-white/35 hover:!bg-white hover:!text-primary"
              >
                Book a Robot Demonstration
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/15 pt-6">
              <p className="text-label uppercase text-white/70">Robotics partners</p>
              {content.global_partners
                .filter(p => ['KEENON', 'ALPHA ROBOTICS COMPANY'].includes(p.title))
                .map(p => p.image_url ? (
                  <img key={p.title} src={p.image_url} alt={p.image_alt || `${p.title} logo`} loading="lazy" className="h-10 w-auto object-contain bg-white rounded-lg px-2 py-1" />
                ) : (
                  <span key={p.title} className="text-white/85 font-semibold">{p.title}</span>
                ))}
            </div>
          </div>
          <div className="relative min-h-[360px] lg:min-h-full">
            <HeroMedia
              src={content.home_robotics_image_url}
              alt={`${content.company_name} hospitality robotics`}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/70 to-transparent lg:bg-gradient-to-r lg:from-inverse-surface/40 lg:to-transparent" />
          </div>
        </div>
      </section>}

      {/* Why Choose Us */}
      <section className="py-section-mobile md:py-section px-gutter bg-white border-t border-outline-variant">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-12">
            <p className="text-label uppercase text-primary mb-3">Why ChefWare</p>
            <h2 className="text-h2 text-on-surface">One supplier. A clearer buying journey.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: MapPin, title: 'Built Around Hospitality Work', desc: 'Uniforms, branding, kitchen solutions, disposables and robotics in one practical place.' },
              { icon: PackageCheck, title: 'Shop What Is Stocked', desc: 'Add available uniforms and equipment to cart when you know exactly what your team needs.' },
              { icon: ClipboardCheck, title: 'Plan What Needs Scope', desc: 'Use a quote request for branding, disposables, kitchen projects and robotics.' },
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

      {/* Trusted by — featured clients marquee */}
      <section className="border-t border-outline-variant bg-white py-12 overflow-hidden">
        <div className="max-w-container-max mx-auto px-gutter mb-10 text-center">
          <p className="text-label uppercase text-primary mb-3">Trusted by Businesses Across Ghana</p>
          <h2 className="text-h3 text-on-surface">Featured clients & projects</h2>
        </div>
        <div className="overflow-hidden">
          <div className="marquee-track-ltr flex w-max">
            {[...TRUSTED_BY, ...TRUSTED_BY].map((client, i) => (
              <div key={i} className="flex items-center justify-center mx-8 shrink-0">
                {client.logo_url ? (
                  <img src={client.logo_url} alt={client.name} className="h-10 w-auto object-contain opacity-70" />
                ) : (
                  <span className="text-h3 text-secondary whitespace-nowrap">{client.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary py-section-mobile md:py-section px-gutter">
        <div className="max-w-container-max mx-auto grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <p className="text-label uppercase text-primary-fixed mb-3">{content.company_name}</p>
            <h2 className="text-h2 md:text-h1 text-white mb-3">{content.home_company_title}</h2>
            <p className="text-body text-white/75 max-w-2xl">
              {content.established_year && `Established in ${content.established_year}. `}{content.home_company_body}
            </p>
          </div>
          {content.show_about_page && (
            <Button as={Link} to="/about" variant="gold" size="lg" iconRight={<ArrowRight />}>
              About {content.company_name}
            </Button>
          )}
        </div>
      </section>

      {/* Find Us */}
      <section className="bg-white py-section-mobile md:py-section px-gutter border-t border-outline-variant">
        <div className="max-w-container-max mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-label uppercase text-primary mb-3">Find us here</p>
            <h2 className="text-h2 text-on-surface mb-4">Visit {content.company_name} in Accra</h2>
            <div className="space-y-3 text-body text-secondary">
              <p className="flex items-start gap-3">
                <MapPin size={20} className="text-primary shrink-0 mt-0.5" />
                <span>{content.contact_address}</span>
              </p>
              <p className="flex items-start gap-3">
                <Phone size={20} className="text-primary shrink-0 mt-0.5" />
                <span className="flex flex-col">
                  <a href={`tel:${content.contact_phone.replace(/\s/g, '')}`} className="hover:text-primary transition-colors">{content.contact_phone}</a>
                  <a href={`tel:${content.contact_secondary_phone.replace(/\s/g, '')}`} className="hover:text-primary transition-colors">{content.contact_secondary_phone}</a>
                </span>
              </p>
              <p className="flex items-start gap-3">
                <Mail size={20} className="text-primary shrink-0 mt-0.5" />
                <a href={`mailto:${content.contact_email}`} className="hover:text-primary transition-colors">{content.contact_email}</a>
              </p>
              <p className="flex items-start gap-3">
                <Clock size={20} className="text-primary shrink-0 mt-0.5" />
                <span>{content.business_hours}</span>
              </p>
            </div>
            <a
              href={mapsDirectionsUrl(content.company_name, content.contact_address)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-7 px-5 py-3 bg-gold hover:brightness-110 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <MapPin size={16} /> Get Directions on Google Maps
            </a>
          </div>
          <div className="overflow-hidden rounded-2xl border border-outline-variant shadow-sm">
            <iframe
              title={`Map to ${content.company_name}`}
              src={mapsEmbedUrl(content.company_name, content.contact_address)}
              className="w-full h-[320px] md:h-[420px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-section-mobile md:py-section px-gutter bg-surface-container-low text-center">
        <h2 className="text-h2 text-on-surface mb-4">Need a Custom Quote?</h2>
        <p className="text-body text-secondary max-w-md mx-auto mb-8">
          Uniforms, branding, kitchen projects, disposables and robotics need a tailored plan. Tell us what you need to get started.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button as={Link} to="/quote" variant="primary" size="lg" iconRight={<ArrowRight />}>
            Request a Business Quote
          </Button>
          <Button as={Link} to="/products" variant="secondary" size="lg">
            Browse Products
          </Button>
        </div>
      </section>
    </main>
  )
}
