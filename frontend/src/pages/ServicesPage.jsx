import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, MessageSquare, FileText, Truck } from 'lucide-react'

const SERVICES = [
  {
    slug: 'kitchen-setup',
    label: 'Kitchen Infrastructure',
    title: 'Industrial Kitchen Setup',
    desc: 'End-to-end design, supply, and installation of commercial kitchens for hotels, restaurants, and catering companies across Ghana.',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80',
    includes: [
      'Space planning & 3D kitchen design',
      'Equipment sourcing & procurement',
      'Professional installation & commissioning',
    ],
    tag: 'Turnkey Solution',
  },
  {
    slug: 'machine-preorders',
    label: 'Custom Manufacturing',
    title: 'Machine Pre-Orders',
    desc: 'Bespoke industrial kitchen equipment built to your exact specification. Ideal for large-scale operations with unique requirements.',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=900&q=80',
    includes: [
      'Specification consultation',
      'Custom fabrication & quality testing',
      '6–8 week lead time with progress updates',
    ],
    tag: '6–8 Week Lead Time',
  },
  {
    slug: 'machine-customization',
    label: 'Equipment Upgrade',
    title: 'Machine Customization',
    desc: 'Modify and upgrade your existing kitchen equipment to meet growing operational demands — without replacing your entire setup.',
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=900&q=80',
    includes: [
      'Equipment assessment & diagnostics',
      'Capacity upgrades & component replacement',
      'Post-modification testing & warranty',
    ],
    tag: 'Upgrade & Optimise',
  },
  {
    slug: 'embroidery',
    label: 'Uniform Branding',
    title: 'Embroidery Services',
    desc: 'Professional logo embroidery on chef jackets, aprons, caps, and any garment. Minimum 10 pieces. Sharp, durable, and brand-perfect.',
    image: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=900&q=80',
    includes: [
      'Logo digitisation & sample approval',
      'Multi-colour thread embroidery',
      'Minimum order: 10 pieces',
    ],
    tag: 'Min. 10 Pieces',
  },
  {
    slug: 'logo-printing-branding',
    label: 'Garment Branding',
    title: 'Logo Printing & Garment Branding',
    desc: 'Screen printing, heat transfer, and full garment branding for uniforms, promotional wear, and hospitality merchandise.',
    image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=900&q=80',
    includes: [
      'Screen printing & heat transfer options',
      'Full-colour logo reproduction',
      'Bulk pricing available',
    ],
    tag: 'Bulk Pricing',
  },
]

const HOW_IT_WORKS = [
  {
    icon: MessageSquare,
    step: '01',
    title: 'Tell Us What You Need',
    desc: 'Fill in our quote form with your service requirements, quantities, and any references or files.',
  },
  {
    icon: FileText,
    step: '02',
    title: 'We Send a Custom Quote',
    desc: 'Our team reviews your request and sends a detailed, itemised quote within 24 hours.',
  },
  {
    icon: Truck,
    step: '03',
    title: 'We Deliver & Install',
    desc: 'On approval, we schedule production or installation and keep you updated every step of the way.',
  },
]

export default function ServicesPage() {
  return (
    <main className="pt-20 bg-surface min-h-screen">

      {/* Hero */}
      <section className="bg-primary text-on-primary py-16 px-gutter text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary-fixed mb-3">What We Offer</p>
        <h1 className="text-h1 md:text-5xl font-bold text-white mb-4 max-w-2xl mx-auto leading-tight">
          Bespoke Services for Ghana's Hospitality Industry
        </h1>
        <p className="text-body text-on-primary/80 max-w-xl mx-auto mb-8">
          From custom embroidery to full kitchen installations — every service is tailored to your operation and priced with a free quote.
        </p>
        <Link
          to="/quote"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gold hover:bg-gold/90 text-white font-semibold rounded-xl transition-colors cursor-pointer text-base"
        >
          Request a Free Quote <ArrowRight size={18} />
        </Link>
      </section>

      {/* Services Grid */}
      <section className="max-w-container-max mx-auto px-gutter py-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg">
          {SERVICES.map(service => (
            <div key={service.slug} className="group bg-white rounded-2xl border border-outline-variant overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-300">
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-widest bg-gold text-white px-2.5 py-1 rounded-full">
                  {service.tag}
                </span>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-lg">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{service.label}</p>
                <h2 className="text-h3 font-semibold text-on-surface mb-3 leading-snug">{service.title}</h2>
                <p className="text-body-sm text-on-surface-variant mb-4 leading-relaxed">{service.desc}</p>

                {/* Includes */}
                <ul className="space-y-2 mb-6">
                  {service.includes.map(item => (
                    <li key={item} className="flex items-start gap-2 text-body-sm text-on-surface">
                      <CheckCircle size={15} className="text-primary shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  to={`/quote?service=${service.slug}`}
                  className="mt-auto flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-primary-container text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Request a Quote <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-surface-container-lowest py-xl px-gutter">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-xl">
            <h2 className="text-h2 font-bold text-on-surface mb-2">How It Works</h2>
            <p className="text-body text-secondary">Simple, transparent, and always on time.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative flex flex-col items-center text-center p-lg bg-white rounded-2xl border border-outline-variant">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-12 -right-8 w-16 border-t-2 border-dashed border-outline-variant z-10" />
                )}
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-md">
                  <step.icon size={26} className="text-primary" />
                </div>
                <span className="text-4xl font-black text-primary/10 absolute top-4 right-6 leading-none select-none">{step.step}</span>
                <h3 className="text-h3 font-semibold text-on-surface mb-2">{step.title}</h3>
                <p className="text-body-sm text-secondary leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-primary py-xl px-gutter text-center">
        <h2 className="text-h2 font-bold text-white mb-3">Ready to Get Started?</h2>
        <p className="text-on-primary/80 text-body mb-8 max-w-md mx-auto">
          Tell us what you need and we'll get back with a detailed quote within 24 hours.
        </p>
        <div className="flex flex-wrap justify-center gap-md">
          <Link
            to="/quote"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold hover:bg-gold/90 text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Request a Free Quote <ArrowRight size={18} />
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white/60 hover:bg-white hover:text-primary text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Browse Products
          </Link>
        </div>
      </section>

    </main>
  )
}
