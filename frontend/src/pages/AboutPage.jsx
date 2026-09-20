import { Link, Navigate } from 'react-router-dom'
import { ArrowRight, Building2, ChefHat, PackageSearch, Sparkles } from 'lucide-react'
import Button from '../components/Button'
import useSiteContentStore from '../store/siteContentStore'

const CAPABILITY_ICONS = [ChefHat, PackageSearch, Building2, Sparkles]

export default function AboutPage() {
  const content = useSiteContentStore(state => state.content)
  if (!content.show_about_page) return <Navigate to="/" replace />

  return (
    <main className="pt-20 bg-surface min-h-screen">
      <section className="bg-primary text-white overflow-hidden">
        <div className="max-w-container-max mx-auto grid lg:grid-cols-2 min-h-[520px]">
          <div className="px-gutter py-section-mobile md:py-section flex flex-col justify-center">
            <p className="text-label uppercase text-primary-fixed mb-4">About {content.company_name}</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight max-w-xl">
              {content.about_title}
            </h1>
            <p className="text-body-lg text-white/75 max-w-xl mt-6">
              {content.established_year && `Established in ${content.established_year}. `}{content.about_body}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Button as={Link} to="/products" variant="gold" size="lg" iconRight={<ArrowRight />}>
                Shop Products
              </Button>
              <Button
                as={Link}
                to="/quote"
                variant="ghost"
                size="lg"
                className="!text-white border border-white/40 hover:!bg-white hover:!text-primary"
              >
                Discuss a Requirement
              </Button>
            </div>
          </div>
          <div className="relative min-h-[420px] lg:min-h-full">
            <img
              src={content.about_image_url}
              alt={`${content.company_name} hospitality offering`}
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-primary/30 lg:to-transparent" />
          </div>
        </div>
      </section>

      <section className="max-w-container-max mx-auto px-gutter py-section-mobile md:py-section">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-20 items-start">
          <div>
            <p className="text-label uppercase text-primary mb-3">Why the business exists</p>
            <h2 className="text-h1 text-on-surface mb-5">{content.about_purpose_title}</h2>
            <p className="text-body-lg text-secondary">
              {content.about_purpose_body}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {content.about_capabilities.map((item, index) => {
              const Icon = CAPABILITY_ICONS[index % CAPABILITY_ICONS.length]
              return (
              <article key={item.title} className="bg-white border border-outline-variant rounded-2xl p-6">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <Icon size={22} className="text-primary" />
                </div>
                <h3 className="text-h3 text-on-surface mb-2">{item.title}</h3>
                <p className="text-body-sm text-secondary">{item.body}</p>
              </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low px-gutter py-section-mobile md:py-section">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-label uppercase text-primary mb-3">Two clear ways to begin</p>
          <h2 className="text-h2 md:text-h1 text-on-surface">Buy what is ready. Plan what is custom.</h2>
          <p className="text-body-lg text-secondary max-w-2xl mx-auto mt-4 mb-8">
            Use the catalogue for defined products, or send a business requirement for quantities,
            branding, kitchen projects, specialised equipment or robotics.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button as={Link} to="/products" variant="primary" size="lg">Browse the Catalogue</Button>
            <Button as={Link} to="/quote" variant="secondary" size="lg">Request a Business Quote</Button>
          </div>
        </div>
      </section>
    </main>
  )
}
