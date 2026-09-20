import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

import HomePage from './pages/HomePage'
import ProductCatalogPage from './pages/ProductCatalogPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CheckoutPage from './pages/CheckoutPage'
import PaymentVerifyPage from './pages/PaymentVerifyPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import QuoteRequestPage from './pages/QuoteRequestPage'
import AccountPage from './pages/AccountPage'
import AuthPage from './pages/AuthPage'
import ServicesPage from './pages/ServicesPage'
import ServiceDetailPage from './pages/ServiceDetailPage'
import RoboticsPage from './pages/RoboticsPage'
import AboutPage from './pages/AboutPage'
import WarrantyReturnsPage from './pages/WarrantyReturnsPage'
import TermsConditionsPage from './pages/TermsConditionsPage'
import NotFoundPage from './pages/NotFoundPage'

import WhatsAppButton from './components/WhatsAppButton'
import ErrorBoundary from './components/ErrorBoundary'
import { PageLoader } from './components/PageLoader'
import useSiteContentStore from './store/siteContentStore'

// Admin is a separate audience from the storefront — loading it on demand keeps
// it out of the bundle every customer downloads.
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'))
const AdminInventoryPage = lazy(() => import('./pages/admin/AdminInventoryPage'))
const AdminQuotesPage = lazy(() => import('./pages/admin/AdminQuotesPage'))
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'))

function StorefrontLayout({ children }) {
  const content = useSiteContentStore(state => state.content)
  const loading = useSiteContentStore(state => state.loading)
  const error = useSiteContentStore(state => state.error)
  const load = useSiteContentStore(state => state.load)

  useEffect(() => { load() }, [load])
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
      <ErrorBoundary>{children}</ErrorBoundary>
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
