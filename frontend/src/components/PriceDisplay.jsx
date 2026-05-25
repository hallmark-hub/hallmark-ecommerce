import { formatPrice } from '../utils/format'

export default function PriceDisplay({ pesewas, label, size = 'md', className = '' }) {
  const sizes = { sm: 'text-base font-semibold', md: 'text-price-lg font-bold', lg: 'text-3xl font-bold' }
  if (pesewas === null || pesewas === undefined) {
    return <span className={`text-tertiary font-semibold ${sizes[size]} ${className}`}>{label || 'Request a quote'}</span>
  }
  return <span className={`text-primary ${sizes[size]} ${className}`}>{formatPrice(pesewas)}</span>
}
