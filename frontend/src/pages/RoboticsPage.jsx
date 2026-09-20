import { Link, Navigate } from 'react-router-dom'
import { ArrowRight, Bot, Building2, CheckCircle, Sparkles } from 'lucide-react'
import Button from '../components/Button'
import useSiteContentStore from '../store/siteContentStore'

const DISCOVERY = [
  'Your venue, operating environment and intended use case',
  'The tasks, routes and customer touchpoints involved',
  'Site suitability, product availability and commercial scope',
  'A demonstration or proposal where appropriate',
]

export default function RoboticsPage() {
  const content = useSiteContentStore(state => state.content)
  if (!content.show_robotics_page) return <Navigate to="/" replace />

  return (
    <main className="pt-20 bg-surface min-h-screen">
      <section className="relative overflow-hidden bg-inverse-surface text-white">
        <img
          src={content.robotics_hero_image_url}
          alt={`${content.company_name} hospitality robotics`}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-inverse-surface via-inverse-surface/90 to-inverse-surface/30" />
        <div className="relative max-w-container-max mx-auto px-gutter py-24 md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1.5 mb-6">
              <Bot size={16} className="text-primary-fixed" />
              <span className="text-label uppercase text-white">Hospitality Robotics</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05]">
              {content.robotics_title}
            </h1>
            <p className="text-body-lg text-white/75 max-w-xl mt-6 mb-8">
              {content.robotics_body}
            </p>
            <Button as={Link} to="/quote?category=robotics" variant="gold" size="lg" iconRight={<ArrowRight />}>
              Discuss a Robotics Project
            </Button>
          </div>
        </div>
      </section>

      <section className="max-w-container-max mx-auto px-gutter py-section-mobile md:py-section">
        <div className="max-w-2xl mb-10">
          <p className="text-label uppercase text-primary mb-3">Explore by use case</p>
          <h2 className="text-h1 text-on-surface mb-3">{content.robotics_intro_title}</h2>
          <p className="text-body text-secondary">
            {content.robotics_intro_body}
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {content.robotics_cards.map(robot => (
            <article key={robot.title} className="group bg-white rounded-2xl border border-outline-variant overflow-hidden">
              <div className="aspect-[4/3] overflow-hidden bg-white">
                <img src={robot.image_url} alt={robot.image_alt} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6">
                <h3 className="text-h3 text-on-surface mb-2">{robot.title}</h3>
                <p className="text-body-sm text-secondary">{robot.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-primary text-white px-gutter py-section-mobile md:py-section">
        <div className="max-w-container-max mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <Building2 className="text-primary-fixed" />
              <p className="text-label uppercase text-primary-fixed">Project discovery</p>
            </div>
            <h2 className="text-h1 mb-4">Begin with the venue and workflow—not the machine.</h2>
            <p className="text-body-lg text-white/75 max-w-xl">
              A useful proposal needs enough operational context to assess what type of solution may fit.
            </p>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-2xl p-6 md:p-8">
            <ul className="space-y-4">
              {DISCOVERY.map(item => (
                <li key={item} className="flex items-start gap-3 text-body text-white/90">
                  <CheckCircle size={19} className="text-primary-fixed shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <Button as={Link} to="/quote?category=robotics" variant="gold" size="lg" fullWidth className="mt-7" iconRight={<Sparkles />}>
              Start a Robotics Enquiry
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
