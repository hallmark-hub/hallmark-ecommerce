import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import Button from '../components/Button'

const WARRANTY_ITEMS = [
  ['Uniforms & Branding', 'Quality guaranteed; exchange for manufacturing defects.'],
  ['Kitchen Equipment', '6–12 months warranty depending on supplier.'],
  ['Robots', '1-year warranty plus after-sales support.'],
  ['Returns', 'Within 3 days for defects only.'],
  ['Customised Items', 'Custom-branded items are not returnable.'],
]

export default function WarrantyReturnsPage() {
  return (
    <main className="pt-20 min-h-screen bg-surface">
      <section className="border-b border-outline-variant bg-surface-container-low">
        <div className="max-w-container-max mx-auto px-gutter py-section-mobile md:py-section">
          <p className="text-label uppercase text-primary mb-3">Warranty & Returns</p>
          <h1 className="text-h1 text-on-surface">Our policies at a glance</h1>
          <p className="text-body text-secondary max-w-2xl mt-3">
            Exchange and warranty cover for the products and services ChefWare supplies.
          </p>
        </div>
      </section>

      <section className="max-w-container-max mx-auto px-gutter py-section-mobile md:py-section">
        <div className="grid gap-5 md:grid-cols-2">
          {WARRANTY_ITEMS.map(([label, detail]) => (
            <div key={label} className="rounded-2xl border border-outline-variant bg-white p-6">
              <div className="flex items-center gap-3 mb-3">
                <ShieldCheck size={20} className="text-primary" />
                <h2 className="text-h3 text-on-surface">{label}</h2>
              </div>
              <p className="text-body text-secondary">{detail}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-body-sm text-secondary max-w-2xl">
          Exact warranty terms are confirmed with the team at the time of your order or quote.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Button as={Link} to="/quote" variant="gold" iconRight={<ArrowRight />}>Request a Quote</Button>
          <Button as={Link} to="/products" variant="secondary">Browse Products</Button>
        </div>
      </section>
    </main>
  )
}