import { cloneElement, isValidElement } from 'react'

const VARIANTS = {
  primary:   'bg-primary text-white hover:bg-primary-container focus-visible:ring-primary',
  secondary: 'bg-white text-primary border border-primary hover:bg-primary hover:text-white focus-visible:ring-primary',
  ghost:     'bg-transparent text-primary hover:bg-surface-container-low focus-visible:ring-primary',
  gold:      'bg-gold text-white hover:brightness-110 focus-visible:ring-gold',
  danger:    'bg-error text-white hover:brightness-110 focus-visible:ring-error',
}

const SIZES = {
  sm: { cls: 'h-9 px-4 text-body-sm gap-1.5',  icon: 14 },
  md: { cls: 'h-11 px-5 text-body gap-2',      icon: 16 },
  lg: { cls: 'h-12 px-7 text-body gap-2',      icon: 18 },
}

const BASE = 'inline-flex items-center justify-center font-semibold rounded-xl cursor-pointer transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

function sizeIcon(node, px) {
  return isValidElement(node) ? cloneElement(node, { size: px }) : node
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  fullWidth = false,
  loading = false,
  disabled,
  as: Comp = 'button',
  className = '',
  ...props
}) {
  const { cls, icon } = SIZES[size]
  const width = fullWidth ? 'w-full' : ''
  const composed = `${BASE} ${VARIANTS[variant]} ${cls} ${width} ${className}`.trim()

  const isButton = Comp === 'button'
  const buttonProps = isButton
    ? { type: props.type || 'button', disabled: disabled || loading }
    : {}

  return (
    <Comp {...props} {...buttonProps} className={composed}>
      {loading ? (
        <svg className="animate-spin" width={icon} height={icon} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      ) : (
        iconLeft && sizeIcon(iconLeft, icon)
      )}
      {children}
      {iconRight && sizeIcon(iconRight, icon)}
    </Comp>
  )
}
