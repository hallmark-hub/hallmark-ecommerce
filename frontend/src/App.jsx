import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

import WhatsAppButton from './components/WhatsAppButton'
import ErrorBoundary from './components/ErrorBoundary'
import { PageLoader } from './components/PageLoader'
import useSiteContentStore from './store/siteContentStore'
import { getProducts } from './api/products'
import HomePage from './pages/HomePage'

// Admin is a separate audience from the storefront — loading it on demand keeps
// it out of the bundle every customer downloads.
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'))
const AdminInventoryPage = lazy(() => import('./pages/admin/AdminInventoryPage'))
const AdminQuotesPage = lazy(() => import('./pages/admin/AdminQuotesPage'))
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'))
const ProductCatalogPage = lazy(() => import('./pages/ProductCatalogPage'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const PaymentVerifyPage = lazy(() => import('./pages/PaymentVerifyPage'))
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'))
const QuoteRequestPage = lazy(() => import('./pages/QuoteRequestPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const ServicesPage = lazy(() => import('./pages/ServicesPage'))
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage'))
const RoboticsPage = lazy(() => import('./pages/RoboticsPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const WarrantyReturnsPage = lazy(() => import('./pages/WarrantyReturnsPage'))
const TermsConditionsPage = lazy(() => import('./pages/TermsConditionsPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function StorefrontLayout({ children }) {
  const location = useLocation()
  const content = useSiteContentStore(state => state.content)
  const loading = useSiteContentStore(state => state.loading)
  const error = useSiteContentStore(state => state.error)
  const load = useSiteContentStore(state => state.load)

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (location.pathname === '/') {
      getProducts({ limit: 8 }).catch(() => {})
    } else if (location.pathname === '/products') {
      const query = new URLSearchParams(location.search)
      getProducts({
        category: query.get('category') || undefined,
        search: query.get('search') || undefined,
        page: parseInt(query.get('page') || '1', 10),
        limit: 12,
      }).catch(() => {})
    }
  }, [location.pathname, location.search])
  useEffect(() => {
    if (!content) return
    document.title = content.seo_title
    document.querySelector('meta[name="description"]')?.setAttribute('content', content.seo_description)
  }, [content])

  if (!content && loading) return <PageLoader />
  if (!content && error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-gutter bg-surface">
        <div className="max-w-md text-center">
          <h1 className="text-h2 text-on-surface">The storefront is temporarily unavailable.</h1>
          <p className="text-body text-secondary mt-3 mb-6">{error}</p>
          <button type="button" onClick={() => load(true)} className="px-5 py-2.5 rounded-lg bg-primary text-white font-semibold cursor-pointer">
            Try again
          </button>
        </div>
      </main>
    )
  }
  if (!content) return <PageLoader />

  return (
    <>
      <Navbar />
      <ErrorBoundary><Suspense fallback={<PageLoader />}>{children}</Suspense></ErrorBoundary>
      <Footer />
      <WhatsAppButton />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StorefrontLayout><HomePage /></StorefrontLayout>} />
        <Route path="/products" element={<StorefrontLayout><ProductCatalogPage /></StorefrontLayout>} />
        <Route path="/products/:slug" element={<StorefrontLayout><ProductDetailPage /></StorefrontLayout>} />
        <Route path="/checkout" element={<StorefrontLayout><CheckoutPage /></StorefrontLayout>} />
        <Route path="/payment/verify" element={<StorefrontLayout><PaymentVerifyPage /></StorefrontLayout>} />
        <Route path="/order-confirmation/:reference" element={<StorefrontLayout><OrderConfirmationPage /></StorefrontLayout>} />
        <Route path="/services" element={<StorefrontLayout><ServicesPage /></StorefrontLayout>} />
        <Route path="/services/:slug" element={<StorefrontLayout><ServiceDetailPage /></StorefrontLayout>} />
        <Route path="/robotics" element={<StorefrontLayout><RoboticsPage /></StorefrontLayout>} />
        <Route path="/about" element={<StorefrontLayout><AboutPage /></StorefrontLayout>} />
        <Route path="/warranty-returns" element={<StorefrontLayout><WarrantyReturnsPage /></StorefrontLayout>} />
        <Route path="/terms" element={<StorefrontLayout><TermsConditionsPage /></StorefrontLayout>} />
        <Route path="/quote" element={<StorefrontLayout><QuoteRequestPage /></StorefrontLayout>} />
        <Route path="/account" element={<StorefrontLayout><AccountPage /></StorefrontLayout>} />
        <Route path="/login" element={<StorefrontLayout><AuthPage /></StorefrontLayout>} />

        <Route path="/admin" element={<Suspense fallback={<PageLoader />}><AdminLayout /></Suspense>}>
          <Route index element={<Suspense fallback={<PageLoader />}><AdminDashboardPage /></Suspense>} />
          <Route path="orders" element={<Suspense fallback={<PageLoader />}><AdminOrdersPage /></Suspense>} />
          <Route path="quotes" element={<Suspense fallback={<PageLoader />}><AdminQuotesPage /></Suspense>} />
          <Route path="inventory" element={<Suspense fallback={<PageLoader />}><AdminInventoryPage /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<PageLoader />}><AdminSettingsPage /></Suspense>} />
        </Route>

        <Route path="*" element={<StorefrontLayout><NotFoundPage /></StorefrontLayout>} />
      </Routes>
    </BrowserRouter>
  )
}
