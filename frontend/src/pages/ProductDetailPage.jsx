import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, FileText, ChevronLeft, Truck, RefreshCw, Star } from 'lucide-react'
import { getProduct, getProducts } from '../api/products'
import useCartStore from '../store/cartStore'
import PriceDisplay from '../components/PriceDisplay'
import ProductCard from '../components/ProductCard'
import Button from '../components/Button'
import { PageLoader } from '../components/PageLoader'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const addItem = useCartStore(s => s.addItem)
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

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
  const images = product.images?.length ? product.images : ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800']

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
              <img src={images[activeImg]} alt={product.name} className="w-full h-full object-cover" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-sm">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} className={`w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer ${i === activeImg ? 'border-primary' : 'border-outline-variant'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <p className="text-label text-[11px] uppercase tracking-wider text-primary mb-xs">{product.category_slug?.replace(/-/g, ' ')}</p>
            <h1 className="text-h1 font-medium text-on-surface mb-sm">{product.name}</h1>

            {/* Star rating placeholder */}
            <div className="flex items-center gap-1 mb-md">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} className={i < 4 ? 'text-gold fill-gold' : 'text-outline-variant'} />)}
              <span className="text-body-sm text-secondary ml-1">(12 reviews)</span>
            </div>

            <PriceDisplay pesewas={product.price_pesewas} label={product.price_label} size="lg" className="mb-md" />

            <p className="text-body text-on-surface-variant mb-md leading-relaxed">{product.description}</p>

            {/* Feature bullets */}
            <ul className="mb-md space-y-xs">
              <li className="flex items-center gap-2 text-body-sm text-on-surface">
                <Truck size={16} className="text-primary shrink-0" /> Next-day delivery across Accra on in-stock items
              </li>
              <li className="flex items-center gap-2 text-body-sm text-on-surface">
                <RefreshCw size={16} className="text-error shrink-0" />
                <span className="text-error font-medium">No refunds. Exchange only within 3 days of purchase.</span>
              </li>
              <li className="flex items-center gap-2 text-body-sm text-on-surface">
                <ShoppingCart size={16} className="text-primary shrink-0" />
                {product.in_stock ? `In Stock (${product.stock_qty} available)` : 'Out of Stock'}
              </li>
            </ul>

            {isQuote ? (
              <div className="flex flex-col gap-sm">
                <Link to={`/quote?product=${product.id}`}>
                  <Button variant="cta" size="lg" className="w-full">
                    <FileText size={18} /> Request a Quote
                  </Button>
                </Link>
                <p className="text-body-sm text-secondary text-center">We'll respond within 24 hours with pricing.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-sm">
                <div className="flex items-center gap-sm">
                  <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-surface-container cursor-pointer text-on-surface font-medium">−</button>
                    <span className="px-4 py-2 text-body font-medium">{qty}</span>
                    <button onClick={() => setQty(q => q + 1)} className="px-3 py-2 hover:bg-surface-container cursor-pointer text-on-surface font-medium">+</button>
                  </div>
                  <Button
                    onClick={handleAddToCart}
                    disabled={!product.in_stock}
                    variant="primary"
                    size="lg"
                    className="flex-1"
                  >
                    <ShoppingCart size={18} />
                    {added ? 'Added!' : 'Add to Cart'}
                  </Button>
                </div>
                {product.category_slug === 'kitchen-equipment-tools' && (
                  <Link to="/quote">
                    <Button variant="ghost" size="lg" className="w-full">Request Professional Installation</Button>
                  </Link>
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
              ['Category', product.category_slug?.replace(/-/g, ' ')],
              ['SKU', product.slug.toUpperCase().slice(0, 12)],
              ['Stock Status', product.in_stock ? 'In Stock' : 'Out of Stock'],
              ['Availability', 'Ghana — Greater Accra delivery'],
              ['Warranty', product.category_slug?.includes('equipment') ? '12-month standard warranty' : 'Exchange within 3 days'],
              ['Payment', 'MTN MoMo · Vodafone Cash · Bank Transfer · Card'],
            ].map(([key, val], i) => (
              <div key={key} className={`flex justify-between px-md py-sm text-body-sm ${i % 2 === 0 ? 'bg-primary-fixed/10' : 'bg-white'}`}>
                <span className="text-secondary font-medium">{key}</span>
                <span className="text-on-surface capitalize">{val}</span>
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
