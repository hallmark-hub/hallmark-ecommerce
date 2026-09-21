export const PRODUCT_IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80'

const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogv', 'mov', 'm4v']

export function isVideoUrl(url = '') {
  const ext = url.split('?')[0].split('.').pop().toLowerCase()
  return VIDEO_EXTENSIONS.includes(ext)
}

export function productImage(product) {
  return product?.images?.[0] || PRODUCT_IMAGE_FALLBACK
}

export function useFallbackImage(event) {
  if (event.currentTarget.src !== PRODUCT_IMAGE_FALLBACK) {
    event.currentTarget.src = PRODUCT_IMAGE_FALLBACK
  }
}
