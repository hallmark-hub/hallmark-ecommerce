import { client } from './client'

const MOCK_CATEGORIES = [
  { id: '1', name: 'Chef Uniforms', slug: 'chef-uniforms', description: 'Premium chef jackets, trousers, aprons, hats, and complete kitchen attire.', checkout_type: 'direct', image_url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600' },
  { id: '2', name: 'Restaurant Staff Uniforms & Branding', slug: 'staff-uniforms-branding', description: 'Professional front-of-house and service staff uniforms with custom branding.', checkout_type: 'direct', image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600' },
  { id: '3', name: 'Industrial Kitchen Equipment & Tools', slug: 'kitchen-equipment-tools', description: 'Commercial-grade ovens, ranges, prep stations and professional tools.', checkout_type: 'direct', image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600' },
  { id: '4', name: 'Industrial Kitchen Setup', slug: 'kitchen-setup', description: 'Complete turnkey kitchen design and installation for hotels and restaurants.', checkout_type: 'quote', image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600' },
  { id: '5', name: 'Customized Machine Pre-Orders', slug: 'machine-preorders', description: 'Bespoke industrial equipment built to specification with 6–8 week lead time.', checkout_type: 'quote', image_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600' },
  { id: '6', name: 'Machine Customization', slug: 'machine-customization', description: 'Modify and upgrade existing kitchen equipment for your specific operations.', checkout_type: 'quote', image_url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600' },
  { id: '7', name: 'Embroidery Services', slug: 'embroidery', description: 'Custom logo embroidery on uniforms, aprons, and garments.', checkout_type: 'quote', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600' },
  { id: '8', name: 'Logo Printing & Garment Branding', slug: 'logo-printing-branding', description: 'Screen printing, heat transfer, and full garment branding services.', checkout_type: 'quote', image_url: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600' },
]

const USE_MOCK = true

export async function getCategories() {
  if (USE_MOCK) {
    return { success: true, data: MOCK_CATEGORIES, message: 'OK' }
  }
  return client.get('/api/v1/categories')
}
