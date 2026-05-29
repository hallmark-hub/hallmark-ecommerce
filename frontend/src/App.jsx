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
import NotFoundPage from './pages/NotFoundPage'

import WhatsAppButton from './components/WhatsAppButton'
import ErrorBoundary from './components/ErrorBoundary'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminInventoryPage from './pages/admin/AdminInventoryPage'
import AdminQuotesPage from './pages/admin/AdminQuotesPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'

function StorefrontLayout({ children }) {
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
        <Route path="/quote" element={<StorefrontLayout><QuoteRequestPage /></StorefrontLayout>} />
        <Route path="/account" element={<StorefrontLayout><AccountPage /></StorefrontLayout>} />
        <Route path="/login" element={<StorefrontLayout><AuthPage /></StorefrontLayout>} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="quotes" element={<AdminQuotesPage />} />
          <Route path="inventory" element={<AdminInventoryPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        <Route path="*" element={<StorefrontLayout><NotFoundPage /></StorefrontLayout>} />
      </Routes>
    </BrowserRouter>
  )
}
