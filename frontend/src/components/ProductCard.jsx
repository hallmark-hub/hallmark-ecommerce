import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, FileText, Check } from 'lucide-react'
import PriceDisplay from './PriceDisplay'
import Button from './Button'
import useCartStore from '../store/cartStore'

export default function ProductCard({ product }) {
  const addItem = useCartStore(s => s.addItem)
  const isQuote = product.checkout_type === 'quote'
  const img = product.images?.[0] || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400'
  const [added, setAdded] = useState(false)

  function handleAdd(e) {
    e.preventDefault()
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <article className="group bg-white rounded-2xl border border-outline-variant overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
      <Link
        to={`/products/${product.slug}`}
        className="block relative overflow-hidden aspect-square bg-surface-container focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {!product.in_stock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-on-surface px-3 py-1 rounded-full text-label uppercase">Out of Stock</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="bg-white/95 backdrop-blur-sm text-primary text-label uppercase px-2.5 py-1 rounded-full">
            {product.category_slug?.replace(/-/g, ' ')}
          </span>
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1 gap-3">
        <Link
          to={`/products/${product.slug}`}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          <h3 className="text-h3 text-on-surface line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto flex flex-col gap-3">
          <PriceDisplay pesewas={product.price_pesewas} label={product.price_label} size="md" />

          {isQuote ? (
            <Button
              as={Link}
              to={`/quote?product=${product.id}`}
              variant="gold"
              size="sm"
              fullWidth
              iconLeft={<FileText />}
            >
              Get Quote
            </Button>
          ) : !product.in_stock ? (
            <Button variant="ghost" size="sm" fullWidth disabled>
              Out of Stock
            </Button>
          ) : (
            <Button
              onClick={handleAdd}
              variant="primary"
              size="sm"
              fullWidth
              iconLeft={added ? <Check /> : <ShoppingCart />}
            >
              {added ? 'Added to Cart' : 'Add to Cart'}
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
