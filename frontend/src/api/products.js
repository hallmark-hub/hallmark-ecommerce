import { client } from './client'

const MOCK_PRODUCTS = [
  { id: 'p1', name: 'Classic White Chef Jacket', slug: 'classic-white-chef-jacket', description: 'Premium cotton double-breasted chef jacket with heat-resistant fabric and reinforced stitching.', category_id: '1', category_slug: 'chef-uniforms', checkout_type: 'direct', price_pesewas: 45000, price_label: null, images: ['https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800'], in_stock: true, stock_qty: 48, tags: ['jacket', 'uniform', 'chef'], created_at: '2026-01-01T00:00:00Z' },
  { id: 'p2', name: 'Forest Green Executive Chef Jacket', slug: 'forest-green-exec-jacket', description: 'Premium forest green chef jacket with embroidered logo option. Industry-standard double breast.', category_id: '1', category_slug: 'chef-uniforms', checkout_type: 'direct', price_pesewas: 65000, price_label: null, images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'], in_stock: true, stock_qty: 30, tags: ['jacket', 'green', 'executive'], created_at: '2026-01-02T00:00:00Z' },
  { id: 'p3', name: 'Chef Trouser Set (3-Pack)', slug: 'chef-trouser-set', description: 'Durable black and white checkered chef trousers. Elastic waistband for all-day comfort.', category_id: '1', category_slug: 'chef-uniforms', checkout_type: 'direct', price_pesewas: 38000, price_label: null, images: ['https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800'], in_stock: true, stock_qty: 60, tags: ['trousers', 'uniform'], created_at: '2026-01-03T00:00:00Z' },
  { id: 'p4', name: 'Professional Bib Apron', slug: 'professional-bib-apron', description: 'Heavy-duty canvas bib apron with multiple pockets. Adjustable neck strap. Available in green and black.', category_id: '1', category_slug: 'chef-uniforms', checkout_type: 'direct', price_pesewas: 15000, price_label: null, images: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800'], in_stock: true, stock_qty: 120, tags: ['apron'], created_at: '2026-01-04T00:00:00Z' },
  { id: 'p5', name: 'Industrial Gas Range 6-Burner', slug: 'industrial-gas-range-6-burner', description: 'Heavy-duty commercial 6-burner gas range. 200,000 BTU. Stainless steel construction. 1-year warranty.', category_id: '3', category_slug: 'kitchen-equipment-tools', checkout_type: 'direct', price_pesewas: 480000, price_label: null, images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800'], in_stock: true, stock_qty: 8, tags: ['gas', 'range', 'burner'], created_at: '2026-01-05T00:00:00Z' },
  { id: 'p6', name: 'Industrial Stock Pot 50L', slug: 'industrial-stock-pot-50l', description: 'Restaurant-grade 50-litre stockpot. 18/8 stainless steel. Heavy gauge base for even heat distribution.', category_id: '3', category_slug: 'kitchen-equipment-tools', checkout_type: 'direct', price_pesewas: 125000, price_label: null, images: ['https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800'], in_stock: true, stock_qty: 20, tags: ['pot', 'equipment'], created_at: '2026-01-06T00:00:00Z' },
  { id: 'p7', name: 'Stainless Steel Prep Table 1.5m', slug: 'ss-prep-table-1-5m', description: '1.5m commercial prep table with undershelf. 304 stainless steel. Easy-clean flat surface.', category_id: '3', category_slug: 'kitchen-equipment-tools', checkout_type: 'direct', price_pesewas: 210000, price_label: null, images: ['https://images.unsplash.com/photo-1534527489986-3e3394ca569c?w=800'], in_stock: true, stock_qty: 12, tags: ['table', 'prep', 'stainless'], created_at: '2026-01-07T00:00:00Z' },
  { id: 'p8', name: 'Signature 8" Chef Knife', slug: 'signature-chef-knife-8', description: 'High-carbon stainless steel 8-inch chef knife. Ergonomic handle. Full-tang construction.', category_id: '3', category_slug: 'kitchen-equipment-tools', checkout_type: 'direct', price_pesewas: 89000, price_label: null, images: ['https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800'], in_stock: true, stock_qty: 35, tags: ['knife', 'cutlery'], created_at: '2026-01-08T00:00:00Z' },
  { id: 'p9', name: 'Waiter Vest & Bow Tie Set', slug: 'waiter-vest-bow-tie', description: 'Premium front-of-house waiter vest with matching bow tie. Available in black and navy.', category_id: '2', category_slug: 'staff-uniforms-branding', checkout_type: 'direct', price_pesewas: 22000, price_label: null, images: ['https://images.unsplash.com/photo-1554568218-0f1715e72254?w=800'], in_stock: true, stock_qty: 45, tags: ['waiter', 'vest', 'uniform'], created_at: '2026-01-09T00:00:00Z' },
  { id: 'p10', name: 'Full Kitchen Turnkey Setup', slug: 'full-kitchen-setup', description: 'Complete design, supply, and installation of commercial kitchen for 60–200 seat restaurants.', category_id: '4', category_slug: 'kitchen-setup', checkout_type: 'quote', price_pesewas: null, price_label: 'Request a quote', images: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800'], in_stock: true, stock_qty: null, tags: ['setup', 'installation', 'turnkey'], created_at: '2026-01-10T00:00:00Z' },
  { id: 'p11', name: 'Logo Embroidery on Uniforms', slug: 'logo-embroidery', description: 'Custom logo embroidery on chef jackets, aprons, caps. Minimum order 10 pieces.', category_id: '7', category_slug: 'embroidery', checkout_type: 'quote', price_pesewas: null, price_label: 'Request a quote', images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], in_stock: true, stock_qty: null, tags: ['embroidery', 'logo', 'branding'], created_at: '2026-01-11T00:00:00Z' },
  { id: 'p12', name: 'Commercial Double Deep Fryer', slug: 'commercial-double-fryer', description: '2x25L double deep fryer. Stainless steel. Separate temperature controls. 12-month warranty.', category_id: '3', category_slug: 'kitchen-equipment-tools', checkout_type: 'direct', price_pesewas: 185000, price_label: null, images: ['https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800'], in_stock: false, stock_qty: 0, tags: ['fryer', 'equipment'], created_at: '2026-01-12T00:00:00Z' },
]

const USE_MOCK = true

export async function getProducts(params = {}) {
  if (USE_MOCK) {
    let items = [...MOCK_PRODUCTS]
    if (params.category) items = items.filter(p => p.category_slug === params.category)
    if (params.in_stock !== undefined) items = items.filter(p => p.in_stock === params.in_stock)
    if (params.search) {
      const q = params.search.toLowerCase()
      items = items.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    }
    const page = params.page || 1
    const limit = params.limit || 20
    const total = items.length
    const sliced = items.slice((page - 1) * limit, page * limit)
    return { success: true, data: { items: sliced, total, page, limit, pages: Math.ceil(total / limit) }, message: 'OK' }
  }
  const qs = new URLSearchParams(params).toString()
  return client.get(`/api/v1/products${qs ? `?${qs}` : ''}`)
}

export async function getProduct(slug) {
  if (USE_MOCK) {
    const product = MOCK_PRODUCTS.find(p => p.slug === slug)
    if (!product) return { success: false, data: null, message: 'Product not found' }
    return { success: true, data: product, message: 'OK' }
  }
  return client.get(`/api/v1/products/${slug}`)
}
