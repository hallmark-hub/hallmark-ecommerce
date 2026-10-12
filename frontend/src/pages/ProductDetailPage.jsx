import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, FileText, ChevronLeft, Truck, RefreshCw } from 'lucide-react'
import { getProduct, getProducts } from '../api/products'
import useCartStore from '../store/cartStore'
import PriceDisplay from '../components/PriceDisplay'
import ProductCard from '../components/ProductCard'
import Button from '../components/Button'
import { PageLoader } from '../components/PageLoader'
import { PRODUCT_IMAGE_FALLBACK, useFallbackImage } from '../utils/images'
import { usePageTitle } from '../hooks/usePageTitle'
import { RETURNS_POLICY } from '../utils/format'
import { useCategories } from '../hooks/useCategories'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const addItem = useCartStore(s => s.addItem)
  const [product, setProduct] = useState(null)
  usePageTitle(product?.name)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const { categories } = useCategories()

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await getProduct(slug)
      if (!res.success) { navigate('/404'); return }
      setProduct(res.data)
      setActiveImg(0)
      const r = await getProducts({ category: res.data.category_slug, limit: 4 })
      setRelated((r.data?.items || []).filter(p => p.slug !== slug).slice(0, 4))
      setLoading(false)
    }
    load()
  }, [slug, navigate])

  function handleAddToCart() {
    addItem(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) return <div className="pt-20"><PageLoader /></div>
  if (!product) return null

  const isQuote = product.checkout_type === 'quote'
  const images = product.images?.length ? product.images : [PRODUCT_IMAGE_FALLBACK]
  const categoryName = categories.find(c => c.slug === product.category_slug)?.name || product.category_slug?.replace(/-/g, ' ')
  const deliveryNote = isQuote
    ? 'Lead time confirmed in your quote. Pre-orders typically take 6–8 weeks.'
    : 'Delivered within 24 hours of payment (Greater Accra)'

  return (
    <main className="pt-20 bg-surface min-h-screen">
      <div className="max-w-container-max mx-auto px-gutter py-md">
        <Link to="/products" className="inline-flex items-center gap-1 text-secondary hover:text-primary text-body-sm mb-md cursor-pointer">
          <ChevronLeft size={16} /> Back to Catalog
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
          {/* Gallery */}
          <div>
            <div className="aspect-square rounded-xl overflow-hidden bg-surface-container border border-outline-variant mb-sm">
              <img src={images[activeImg]} alt={product.name} onError={useFallbackImage} className="w-full h-full object-cover" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-sm">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    aria-label={`View image ${i + 1}`}
                    aria-current={i === activeImg ? 'true' : undefined}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${i === activeImg ? 'border-primary ring-1 ring-primary/30' : 'border-outline-variant hover:border-primary/60 opacity-70 hover:opacity-100'}`}
                  >
                    <img src={img} alt="" onError={useFallbackImage} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <p className="text-label uppercase text-primary mb-xs">{categoryName}</p>
            <h1 className="text-h1 text-on-surface mb-md">{product.name}</h1>

            <PriceDisplay pesewas={product.price_pesewas} label={product.price_label} size="lg" className="mb-md" />

            <p className="text-body text-on-surface-variant mb-md leading-relaxed">{product.description}</p>

            {/* Feature bullets */}
            <ul className="mb-md space-y-xs">
              <li className="flex items-center gap-2 text-body-sm text-on-surface">
                <Truck size={16} className="text-primary shrink-0" /> {deliveryNote}
              </li>
              <li className="flex items-center gap-2 text-body-sm text-on-surface">
                <RefreshCw size={16} className="text-error shrink-0" />
                <span className="text-error font-medium">{RETURNS_POLICY} Custom-branded items are not returnable.</span>
              </li>
              <li className="flex items-center gap-2 text-body-sm text-on-surface">
                <ShoppingCart size={16} className="text-primary shrink-0" />
                {product.in_stock ? `In Stock (${product.stock_qty} available)` : 'Out of Stock'}
              </li>
            </ul>

            {isQuote ? (
              <div className="flex flex-col gap-sm">
                <Button
                  as={Link}
                  to={`/quote?product=${product.slug}`}
                  variant="gold"
                  size="lg"
                  fullWidth
                  iconLeft={<FileText />}
                >
                  Request a Quote
                </Button>
                <p className="text-body-sm text-secondary text-center">The team will review the requirement and follow up.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-sm">
                <div className="flex items-center gap-sm">
                  <div className="flex items-center border border-outline-variant rounded-xl overflow-hidden h-12">
                    <button
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                      className="h-full px-4 hover:bg-surface-container cursor-pointer text-on-surface text-body font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                    >
                      −
                    </button>
                    <span className="px-4 text-body font-semibold min-w-[2ch] text-center">{qty}</span>
                    <button
                      onClick={() => setQty(q => Math.min(q + 1, product.stock_qty ?? Infinity))}
                      disabled={qty >= (product.stock_qty ?? Infinity)}
                      aria-label="Increase quantity"
                      className="h-full px-4 hover:bg-surface-container cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-on-surface text-body font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                    >
                      +
                    </button>
                  </div>
                  <Button
                    onClick={handleAddToCart}
                    disabled={!product.in_stock}
                    variant="primary"
                    size="lg"
                    className="flex-1"
                    iconLeft={<ShoppingCart />}
                  >
                    {added ? 'Added!' : 'Add to Cart'}
                  </Button>
                </div>
                {product.category_slug === 'kitchen-equipment-tools' && (
                  <Button as={Link} to="/quote" variant="ghost" size="lg" fullWidth>
                    Request Professional Installation
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Technical Details */}
        <section className="mt-xl">
          <h2 className="text-h2 text-on-surface mb-md">Technical Details</h2>
          <div className="rounded-xl border border-outline-variant overflow-hidden">
            {[
              ['Category', categoryName],
              ['Stock Status', product.in_stock ? 'In Stock' : 'Out of Stock'],
              ['Delivery', deliveryNote],
              ['Warranty', product.category_slug?.includes('equipment') ? '6–12 months warranty, depending on supplier' : RETURNS_POLICY],
              ['Payment', 'MTN MoMo · Telecel Cash · AT Money'],
            ].map(([key, val], i) => (
              <div key={key} className={`flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-md px-md py-sm text-body-sm ${i % 2 === 0 ? 'bg-primary-fixed/10' : 'bg-white'}`}>
                <span className="text-secondary font-medium shrink-0">{key}</span>
                <span className="text-on-surface sm:text-right">{val}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-xl">
            <h2 className="text-h2 text-on-surface mb-md">Complete Your Kitchen</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
