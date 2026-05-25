export default function Button({ children, variant = 'primary', size = 'md', disabled, loading, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded cursor-pointer transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

  const variants = {
    primary: 'bg-primary-container text-white hover:brightness-110 focus-visible:ring-primary',
    cta: 'bg-gold text-on-tertiary-fixed hover:brightness-110 focus-visible:ring-gold',
    ghost: 'border border-outline-variant text-primary hover:bg-surface-container-low focus-visible:ring-primary',
    danger: 'bg-error text-on-error hover:brightness-110 focus-visible:ring-error',
  }

  const sizes = {
    sm: 'text-label px-3 py-1.5 text-xs',
    md: 'text-label px-6 py-3 text-sm',
    lg: 'text-label px-8 py-4 text-base',
  }

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  )
}
