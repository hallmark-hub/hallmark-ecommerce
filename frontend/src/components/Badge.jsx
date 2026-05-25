export default function Badge({ variant = 'in-stock', children }) {
  const styles = {
    'in-stock': 'bg-primary-fixed/30 text-primary',
    'out-of-stock': 'bg-secondary-container text-secondary',
    'quote': 'bg-tertiary-fixed/40 text-tertiary',
    'top-rated': 'bg-primary-container text-white',
  }
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-label text-[11px] font-semibold uppercase tracking-wider ${styles[variant] || styles['in-stock']}`}>
      {children}
    </span>
  )
}
