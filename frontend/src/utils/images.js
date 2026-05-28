export const PRODUCT_IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80'

export function productImage(product) {
  return product?.images?.[0] || PRODUCT_IMAGE_FALLBACK
}

export function useFallbackImage(event) {
  if (event.currentTarget.src !== PRODUCT_IMAGE_FALLBACK) {
    event.currentTarget.src = PRODUCT_IMAGE_FALLBACK
  }
}
