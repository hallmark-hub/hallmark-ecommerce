import { Link } from 'react-router-dom'
import { ArrowRight, CreditCard, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import Button from '../components/Button'

const SECTIONS = [
  {
    icon: CreditCard,
    title: 'Orders & Payment',
    body: 'Online orders are paid at checkout through Paystack, which supports cards, mobile money and connected bank rails. Payment is taken in Ghana Cedis (GH₵).',
  },
  {
    icon: Truck,
    title: 'Delivery',
    body: 'Stocked items are delivered within 24 hours after full payment. Pre-ordered or customised items generally take 6–8 weeks. Delivery and setup options for equipment and larger projects are confirmed with the team at the time of your order or quote.',
  },
  {
    icon: RotateCcw,
    title: 'Returns & Refunds',
    body: 'Goods once sold are not returnable after 3 days. Exchange is available for verified manufacturing defects, and no refunds are issued. Custom-branded and customised items are not returnable. See our Warranty & Returns page for the full policy.',
  },
  {
    icon: ShieldCheck,
    title: 'Warranty & Custom Requests',
    body: 'Uniforms and branding are quality guaranteed with exchange for manufacturing defects; kitchen equipment carries a 6–12 month supplier-dependent warranty; robots include a 1-year warranty plus after-sales support. Products without a listed price — larger kitchen equipment, banqueting trolleys and robotics — are supplied on request through a quote, with terms confirmed in writing.',
  },
]

export default function TermsConditionsPage() {
  return (
    <main className="pt-20 min-h-screen bg-surface">
      <section className="border-b border-outline-variant bg-surface-container-low">
        <div className="max-w-container-max mx-auto px-gutter py-section-mobile md:py-section">
          <p className="text-label uppercase text-primary mb-3">Terms & Conditions</p>
          <h1 className="text-h1 text-on-surface">How we fulfil orders</h1>
          <p className="text-body text-secondary max-w-2xl mt-3">
            The conditions below reflect ChefWare&apos;s documented trading policies for online orders and quote-based supply.
          </p>
        </div>
      </section>

      <section className="max-w-container-max mx-auto px-gutter py-section-mobile md:py-section">
        <div className="grid gap-5 md:grid-cols-2">
          {SECTIONS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-outline-variant bg-white p-6">
              <div className="flex items-center gap-3 mb-3">
                <Icon size={20} className="text-primary" />
                <h2 className="text-h3 text-on-surface">{title}</h2>
              </div>
              <p className="text-body text-secondary">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-outline-variant bg-surface-container-low p-5 max-w-3xl">
          <p className="text-body-sm text-secondary">
            Exact warranty and delivery terms are confirmed with the team at the time of your order or quote,
            and the full Warranty & Returns policy is available separately. These terms are subject to final
            ChefWare approval before launch.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Button as={Link} to="/warranty-returns" variant="secondary">Warranty & Returns</Button>
          <Button as={Link} to="/quote" variant="gold" iconRight={<ArrowRight />}>Request a Quote</Button>
        </div>
      </section>
    </main>
  )
}