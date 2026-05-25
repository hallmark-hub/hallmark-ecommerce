import { formatPrice } from '../utils/format'

const SIZES = {
  sm: 'text-body font-semibold',
  md: 'text-price',
  lg: 'text-price-lg',
}

export default function PriceDisplay({ pesewas, label, size = 'md', className = '' }) {
  const sizeCls = SIZES[size]
  if (pesewas === null || pesewas === undefined) {
    return (
      <span className={`text-tertiary font-semibold whitespace-nowrap ${sizeCls} ${className}`}>
        {label || 'Request a quote'}
      </span>
    )
  }
  return (
    <span className={`text-primary whitespace-nowrap ${sizeCls} ${className}`}>
      {formatPrice(pesewas)}
    </span>
  )
}
