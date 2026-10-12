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

// Mirrors the backend upload limits (ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES) so admins hear about it before uploading
const UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_UPLOAD_BYTES = 5_000_000

export function imageFileError(file) {
  if (!UPLOAD_TYPES.includes(file.type)) return 'Only JPEG, PNG and WebP images can be uploaded.'
  if (file.size > MAX_UPLOAD_BYTES) return `This image is ${(file.size / 1_000_000).toFixed(1)} MB. Please use one under 5 MB.`
  return ''
}
