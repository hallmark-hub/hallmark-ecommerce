import { AlertTriangle, CheckCircle2, Search } from 'lucide-react'

// Shared admin look. The storefront's Tailwind tokens (13px/800 labels, 24-40px
// spacing, 16-24px radii) are sized for marketing pages, so admin screens use
// the default Tailwind scale with the brand green for accents.

export const cardClass = 'bg-white rounded-md border border-gray-200 shadow-sm'

export const inputClass = 'w-full h-10 px-3 rounded border border-gray-300 bg-white text-sm text-on-surface placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed'

export const primaryButtonClass = 'inline-flex items-center justify-center gap-2 h-10 px-4 rounded bg-primary text-white text-sm font-semibold hover:bg-primary-container focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'

export const secondaryButtonClass = 'inline-flex items-center justify-center gap-2 h-10 px-4 rounded border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'

const TONES = {
  success: 'bg-green-50 text-green-800 ring-green-600/20',
  warning: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  info: 'bg-blue-50 text-blue-800 ring-blue-600/20',
  danger: 'bg-red-50 text-red-800 ring-red-600/20',
  neutral: 'bg-gray-100 text-gray-700 ring-gray-500/20',
}

export const tableHeadClass = 'px-3 sm:px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500'

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-on-surface">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export function Alert({ tone = 'error', children }) {
  const isError = tone === 'error'
  const Icon = isError ? AlertTriangle : CheckCircle2
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-md border px-4 py-3 mb-4 text-sm ${isError ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'}`}
    >
      <Icon size={18} className="shrink-0 mt-px" />
      <p>{children}</p>
    </div>
  )
}

export function Field({ label, hint, required, wide, children }) {
  return (
    <label className={`block ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-600"> *</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-gray-500 mt-1.5">{hint}</span>}
    </label>
  )
}

export function StatusPill({ tone = 'neutral', children }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold first-letter:uppercase ring-1 ring-inset ${TONES[tone] || TONES.neutral}`}>
      {children}
    </span>
  )
}

export function SkeletonRows({ rows = 5, cols }) {
  return Array.from({ length: rows }, (_, row) => (
    <tr key={row}>
      {Array.from({ length: cols }, (_, col) => (
        <td key={col} className="px-3 sm:px-4 py-4"><div className="skeleton h-4 rounded w-full max-w-[140px]" /></td>
      ))}
    </tr>
  ))
}

export function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="flex flex-col items-center text-center px-4 py-12">
      {Icon && <span className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center mb-3"><Icon size={20} className="text-gray-500" /></span>}
      <p className="text-sm font-semibold text-on-surface">{title}</p>
      {children && <p className="text-sm text-gray-500 mt-1 max-w-sm">{children}</p>}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative flex-1 min-w-0 md:max-w-md">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`${inputClass} pl-9`}
      />
    </div>
  )
}

// options: [{ value, label, count? }]
export function FilterChips({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      {label && <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 mr-1">{label}</span>}
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`h-8 px-3 rounded-full text-sm font-medium capitalize transition-colors cursor-pointer ${value === option.value ? 'bg-primary text-white' : 'bg-white border border-gray-300 text-gray-600 hover:border-primary hover:text-primary'}`}
        >
          {option.label}
          {option.count !== undefined && <span className="ml-1.5 opacity-70">{option.count}</span>}
        </button>
      ))}
    </div>
  )
}

// Native select dressed as a status pill, so the status stays editable in place.
export function StatusSelect({ value, tone, options, onChange, label }) {
  return (
    <select
      value={value}
      aria-label={label}
      onChange={event => onChange(event.target.value)}
      className={`h-8 pl-3 pr-7 rounded-full text-xs font-semibold capitalize ring-1 ring-inset cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${TONES[tone] || TONES.neutral}`}
    >
      {options.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
  )
}
