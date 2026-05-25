import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, FileText, Check } from 'lucide-react'
import PriceDisplay from './PriceDisplay'
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
    <article className="group bg-white rounded-2xl border border-outline-variant overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col">
      <Link to={`/products/${product.slug}`} className="block relative overflow-hidden aspect-square bg-surface-container">
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {!product.in_stock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-secondary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Out of Stock</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
            {product.category_slug?.replace(/-/g, ' ')}
          </span>
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <Link to={`/products/${product.slug}`}>
          <h3 className="text-sm font-semibold text-on-surface line-clamp-2 mb-3 group-hover:text-primary transition-colors leading-snug">{product.name}</h3>
        </Link>

        <div className="flex items-center justify-between gap-2 mt-auto">
          <PriceDisplay pesewas={product.price_pesewas} label={product.price_label} />

          {isQuote ? (
            <Link
              to={`/quote?product=${product.id}`}
              className="flex items-center gap-1.5 px-3 py-2 bg-gold hover:bg-gold/90 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileText size={14} /> Get Quote
            </Link>
          ) : (
            <button
              onClick={handleAdd}
              disabled={!product.in_stock}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap ${
                added
                  ? 'bg-green-500 text-white'
                  : 'bg-primary hover:bg-primary-container text-white'
              }`}
            >
              {added ? <><Check size={14} /> Added</> : <><ShoppingCart size={14} /> Add to Cart</>}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
