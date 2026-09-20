import { Link } from 'react-router-dom'

import { whatsappLink } from '../config/contact'
import useSiteContentStore from '../store/siteContentStore'

const SOCIALS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/chefware_ent',
    icon: (
      <svg viewBox="0 0 24 24" width="17" height="17" fill="white" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/chefware_ent',
    icon: (
      <svg viewBox="0 0 24 24" width="17" height="17" fill="white" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@chefware_ent',
    icon: (
      <svg viewBox="0 0 24 24" width="17" height="17" fill="white" aria-hidden="true">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    ),
  },
]

const WARRANTY_ITEMS = [
  ['Uniforms & Branding', 'Quality guaranteed; exchange for manufacturing defects.'],
  ['Kitchen Equipment', '6–12 months warranty depending on supplier.'],
  ['Robots', '1-year warranty plus after-sales support.'],
  ['Returns', 'Within 3 days for defects only.'],
  ['Customised Items', 'Custom-branded items are not returnable.'],
]

export default function Footer() {
  const content = useSiteContentStore(state => state.content)

  return (
    <footer className="bg-inverse-surface text-secondary-fixed">
      <div className="max-w-container-max mx-auto px-gutter pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">

          {/* Brand column */}
          <div className="md:col-span-4">
            <div className="text-2xl font-black text-white mb-3">{content.company_name}</div>
            <p className="text-secondary-fixed/70 text-sm leading-relaxed mb-6 max-w-xs">
              {content.company_tagline}
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3 mb-6">
              {SOCIALS.map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-colors hover:bg-white/10 cursor-pointer"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
              <a
                href={whatsappLink(content.whatsapp_number)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-colors cursor-pointer"
                style={{ backgroundColor: '#25D366' }}
                aria-label="WhatsApp"
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
            {/* Contact */}
            <div className="space-y-1.5 text-sm text-secondary-fixed/70">
              <p>{content.contact_address}</p>
              <p><a href={`tel:${content.contact_phone.replace(/\s/g, '')}`} className="hover:text-white transition-colors">{content.contact_phone}</a></p>
              <p><a href={`tel:${content.contact_secondary_phone.replace(/\s/g, '')}`} className="hover:text-white transition-colors">{content.contact_secondary_phone}</a></p>
              <p><a href={`mailto:${content.contact_email}`} className="hover:text-white transition-colors">{content.contact_email}</a></p>
              <p>{content.business_hours}</p>
            </div>
          </div>

          {/* Shop */}
          <div className="md:col-span-2">
            <h5 className="text-xs font-bold uppercase tracking-widest text-primary-fixed mb-5">Shop</h5>
            <nav className="flex flex-col gap-3">
              <Link to="/products?category=chef-uniforms" className="text-sm text-secondary-fixed/70 hover:text-white transition-colors">Chef Uniforms</Link>
              <Link to="/products?category=staff-uniforms-branding" className="text-sm text-secondary-fixed/70 hover:text-white transition-colors">Staff Uniforms</Link>
              <Link to="/products?category=kitchen-equipment-tools" className="text-sm text-secondary-fixed/70 hover:text-white transition-colors">Kitchen Equipment</Link>
              <Link to="/products" className="text-sm text-secondary-fixed/70 hover:text-white transition-colors">All Products</Link>
            </nav>
          </div>

          {/* Services */}
          <div className="md:col-span-2">
            <h5 className="text-xs font-bold uppercase tracking-widest text-primary-fixed mb-5">Services</h5>
            <nav className="flex flex-col gap-3">
              {content.services.map(service => (
                <Link
                  key={service.slug}
                  to={`/services/${service.slug}`}
                  className="text-sm text-secondary-fixed/70 hover:text-white transition-colors"
                >
                  {service.title}
                </Link>
              ))}
              <Link to="/quote" className="text-sm text-gold hover:text-gold/80 font-semibold transition-colors">Request a Quote →</Link>
            </nav>
          </div>

          {/* Company */}
          <div className="md:col-span-2">
            <h5 className="text-xs font-bold uppercase tracking-widest text-primary-fixed mb-5">Company</h5>
            <nav className="flex flex-col gap-3">
              {content.show_about_page && <Link to="/about" className="text-sm text-secondary-fixed/70 hover:text-white transition-colors">About {content.company_name}</Link>}
              {content.show_robotics_page && <Link to="/robotics" className="text-sm text-secondary-fixed/70 hover:text-white transition-colors">Hospitality Robotics</Link>}
              <Link to="/account" className="text-sm text-secondary-fixed/70 hover:text-white transition-colors">My Account</Link>
              <Link to="/account" className="text-sm text-secondary-fixed/70 hover:text-white transition-colors">Track Order</Link>
            </nav>
          </div>

          {/* Enquiry */}
          <div className="md:col-span-2">
            <h5 className="text-xs font-bold uppercase tracking-widest text-primary-fixed mb-5">Business Enquiries</h5>
            <p className="text-sm text-secondary-fixed/70 mb-4">Tell the team about quantities, branding, a kitchen project, specialised equipment, or robotics.</p>
            <Link to="/quote" className="inline-flex w-full justify-center py-2.5 px-4 bg-gold hover:brightness-110 text-white text-sm font-semibold rounded-lg transition-colors">
              Request a Quote
            </Link>
          </div>
        </div>

        {/* Warranty & Returns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12 border-t border-white/10 pt-10">
          <div className="md:col-span-2">
            <h5 className="text-xs font-bold uppercase tracking-widest text-primary-fixed mb-4">Warranty & Returns</h5>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
              {WARRANTY_ITEMS.map(([label, detail]) => (
                <div key={label}>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-sm text-secondary-fixed/70 leading-relaxed">{detail}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-secondary-fixed/50">Exact warranty terms are confirmed with the team at the time of your order or quote.</p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-xs text-secondary-fixed/50">© 2026 {content.company_name}. All rights reserved.</p>
          <div className="flex items-center gap-4 justify-center">
            <p className="text-xs text-secondary-fixed/50">Follow us on Facebook · Instagram · TikTok as <span className="text-white/70">chefware_ent</span></p>
          </div>
          <p className="text-xs text-secondary-fixed/50">Online payments are processed through Paystack.</p>
        </div>
      </div>
    </footer>
  )
}