import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-inverse-surface text-secondary-fixed">
      <div className="w-full py-xl px-gutter grid grid-cols-1 md:grid-cols-4 gap-md max-w-container-max mx-auto">
        <div className="md:col-span-1">
          <div className="text-h3 font-bold text-surface mb-md">ChefWare Enterprise</div>
          <p className="text-body-sm text-secondary-fixed mb-md opacity-80">Premium Ghanaian hospitality supplies. Equipping the nation's finest hotels and restaurants.</p>
        </div>
        <div>
          <h5 className="text-label text-primary-fixed mb-md uppercase tracking-widest">Office Location</h5>
          <p className="text-body-sm text-secondary-fixed mb-2">Accra Office, Osu — Oxford Street</p>
          <p className="text-body-sm text-secondary-fixed mb-2">+233 302 000 000</p>
          <p className="text-body-sm text-secondary-fixed">info@chefware.com.gh</p>
        </div>
        <div>
          <h5 className="text-label text-primary-fixed mb-md uppercase tracking-widest">Customer Support</h5>
          <nav className="flex flex-col gap-2">
            <Link to="/products" className="text-body-sm text-secondary-fixed hover:text-surface transition-colors">Browse Catalog</Link>
            <Link to="/quote" className="text-body-sm text-secondary-fixed hover:text-surface transition-colors">Request a Quote</Link>
            <a href="#" className="text-body-sm text-secondary-fixed hover:text-surface transition-colors">MTN MoMo Payments</a>
            <a href="#" className="text-body-sm text-secondary-fixed hover:text-surface transition-colors">Track Order</a>
          </nav>
        </div>
        <div>
          <h5 className="text-label text-primary-fixed mb-md uppercase tracking-widest">Legal &amp; Privacy</h5>
          <nav className="flex flex-col gap-2">
            <a href="#" className="text-body-sm text-secondary-fixed hover:text-surface transition-colors">Terms of Service</a>
            <a href="#" className="text-body-sm text-secondary-fixed hover:text-surface transition-colors">Privacy Policy</a>
            <a href="#" className="text-body-sm text-secondary-fixed hover:text-surface transition-colors">Returns &amp; Exchanges</a>
          </nav>
        </div>
      </div>
      <div className="max-w-container-max mx-auto px-gutter border-t border-outline/20 py-md flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
        <p className="text-body-sm text-secondary-fixed opacity-60">© 2026 ChefWare Enterprise. Premium Ghanaian Hospitality Supplies.</p>
        <div className="flex items-center gap-sm text-body-sm text-secondary-fixed opacity-60">
          <span>MTN MoMo</span>
          <span>·</span>
          <span>Vodafone Cash</span>
          <span>·</span>
          <span>Bank Transfer</span>
        </div>
      </div>
    </footer>
  )
}
