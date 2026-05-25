export function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <svg className="animate-spin h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-secondary text-body-sm">Loading...</p>
      </div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-outline-variant p-base">
      <div className="w-full aspect-square skeleton rounded-lg mb-sm" />
      <div className="h-3 w-1/3 skeleton rounded mb-xs" />
      <div className="h-4 w-3/4 skeleton rounded mb-xs" />
      <div className="h-4 w-1/2 skeleton rounded mb-md" />
      <div className="h-9 w-full skeleton rounded-lg" />
    </div>
  )
}
