import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { getProducts } from '../api/products'
import { getCategories } from '../api/categories'
import ProductCard from '../components/ProductCard'
import { SkeletonCard } from '../components/PageLoader'
import Button from '../components/Button'

const SORT_OPTIONS = [
  { value: '', label: 'Recommended' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
]

export default function ProductCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const category = searchParams.get('category') || ''
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const sort = searchParams.get('sort') || ''

  useEffect(() => {
    getCategories().then(res => setCategories(res.data || []))
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await getProducts({ category: category || undefined, search: search || undefined, page, limit: 12 })
      let items = res.data?.items || []
      if (sort === 'price_asc') items = [...items].sort((a, b) => (a.price_pesewas || 0) - (b.price_pesewas || 0))
      if (sort === 'price_desc') items = [...items].sort((a, b) => (b.price_pesewas || 0) - (a.price_pesewas || 0))
      setProducts(items)
      setTotal(res.data?.total || 0)
      setPages(res.data?.pages || 1)
      setLoading(false)
    }
    load()
  }, [category, search, page, sort])

  function setParam(key, val) {
    const next = new URLSearchParams(searchParams)
    if (val) next.set(key, val); else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  function setPage(p) {
    const next = new URLSearchParams(searchParams)
    next.set('page', p)
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const currentCat = categories.find(c => c.slug === category)
  const isQuoteCat = currentCat?.checkout_type === 'quote'

  return (
    <main className="pt-20 min-h-screen flex max-w-[1440px] mx-auto">
      {/* Sidebar */}
      <aside className="w-64 hidden md:flex flex-col h-[calc(100vh-80px)] py-md px-base sticky top-20 border-r border-outline-variant bg-surface-container-lowest overflow-y-auto shrink-0">
        <div className="mb-lg">
          <h3 className="text-label text-secondary uppercase tracking-widest mb-md">Category</h3>
          <div className="space-y-base">
            <label className="flex items-center gap-sm cursor-pointer group">
              <input
                type="radio"
                name="cat"
                checked={!category}
                onChange={() => setParam('category', '')}
                className="accent-primary"
              />
              <span className="text-body text-sm group-hover:text-primary">All Products</span>
            </label>
            {categories.map(c => (
              <label key={c.id} className="flex items-center gap-sm cursor-pointer group">
                <input
                  type="radio"
                  name="cat"
                  checked={category === c.slug}
                  onChange={() => setParam('category', c.slug)}
                  className="accent-primary"
                />
                <span className="text-body text-sm group-hover:text-primary">{c.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-lg">
          <Link to="/quote">
            <Button variant="cta" className="w-full">
              <FileText size={16} /> Request Quote
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main grid */}
      <section className="flex-1 p-gutter bg-surface min-w-0">
        <div className="flex justify-between items-start mb-lg flex-wrap gap-4">
          <div>
            <h1 className="text-h1 text-on-surface">
              {currentCat ? currentCat.name : search ? `Results for "${search}"` : 'Premium Supplies'}
            </h1>
            <p className="text-body text-secondary">
              {loading ? 'Loading...' : `Showing ${products.length} of ${total} products`}
            </p>
          </div>
          <div className="flex items-center gap-sm">
            <span className="text-label text-secondary text-xs">Sort by:</span>
            <select
              value={sort}
              onChange={e => setParam('sort', e.target.value)}
              className="bg-white border border-outline-variant rounded-lg text-body-sm py-1 pl-3 pr-8 focus:ring-primary focus:ring-2 outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Mobile category chips */}
        <div className="md:hidden flex gap-2 flex-wrap mb-md">
          <button onClick={() => setParam('category', '')} className={`px-3 py-1 rounded-full text-label text-xs border cursor-pointer ${!category ? 'bg-primary text-white border-primary' : 'border-outline-variant text-secondary hover:border-primary'}`}>All</button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setParam('category', c.slug)} className={`px-3 py-1 rounded-full text-label text-xs border cursor-pointer ${category === c.slug ? 'bg-primary text-white border-primary' : 'border-outline-variant text-secondary hover:border-primary'}`}>{c.name}</button>
          ))}
        </div>

        {isQuoteCat && (
          <div className="mb-md p-md bg-tertiary-fixed/30 border border-outline-variant rounded-xl flex items-center justify-between gap-4">
            <p className="text-body-sm text-on-surface">This category requires a custom quote. Fill in our form to get pricing.</p>
            <Link to="/quote"><Button variant="cta" size="sm">Request Quote</Button></Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
            : products.length === 0
              ? (
                <div className="col-span-full flex flex-col items-center justify-center py-xl text-center">
                  <p className="text-h3 font-medium text-on-surface mb-2">No products found</p>
                  <p className="text-secondary text-body-sm mb-md">Try a different category or search term.</p>
                  <Button onClick={() => setSearchParams({})} variant="ghost">Clear Filters</Button>
                </div>
              )
              : products.map(p => <ProductCard key={p.id} product={p} />)
          }
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-xl">
            <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container disabled:opacity-40 cursor-pointer">
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-lg text-body-sm font-medium cursor-pointer ${p === page ? 'bg-primary text-white' : 'border border-outline-variant hover:bg-surface-container'}`}>{p}</button>
            ))}
            <button onClick={() => setPage(page + 1)} disabled={page >= pages} className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container disabled:opacity-40 cursor-pointer">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </section>
    </main>
  )
}
