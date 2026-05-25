import { Link } from 'react-router-dom'
import { ShoppingCart, FileText } from 'lucide-react'
import PriceDisplay from './PriceDisplay'
import useCartStore from '../store/cartStore'

export default function ProductCard({ product }) {
  const addItem = useCartStore(s => s.addItem)
  const isQuote = product.checkout_type === 'quote'
  const img = product.images?.[0] || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400'

  return (
    <article className="group bg-white rounded-xl border border-outline-variant p-base hover:shadow-card-hover transition-all duration-300 cursor-pointer">
      <Link to={`/products/${product.slug}`} className="block">
        <div className="relative overflow-hidden rounded-lg mb-sm aspect-square bg-surface-container">
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {!product.in_stock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-secondary-container text-secondary px-3 py-1 rounded-full text-label text-xs font-semibold uppercase">Out of Stock</span>
            </div>
          )}
        </div>
        <p className="text-label text-[11px] uppercase tracking-wider text-primary mb-xs">{product.category_slug?.replace(/-/g, ' ')}</p>
        <h3 className="text-h3 text-on-surface font-medium line-clamp-1 mb-xs">{product.name}</h3>
      </Link>
      <div className="flex items-end justify-between gap-base mt-sm">
        <PriceDisplay pesewas={product.price_pesewas} label={product.price_label} />
        {isQuote ? (
          <Link
            to={`/quote?product=${product.id}`}
            className="p-2 bg-gold text-on-tertiary-fixed rounded-lg hover:brightness-110 transition-all"
            aria-label="Request quote"
          >
            <FileText size={18} />
          </Link>
        ) : (
          <button
            onClick={() => addItem(product)}
            disabled={!product.in_stock}
            className="p-2 bg-primary-container text-white rounded-lg hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Add to cart"
          >
            <ShoppingCart size={18} />
          </button>
        )}
      </div>
    </article>
  )
}
