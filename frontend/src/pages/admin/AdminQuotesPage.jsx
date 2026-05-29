import { useEffect, useState } from 'react'
import { AlertTriangle, Search, Mail, Phone, Calendar } from 'lucide-react'
import { getAdminQuoteRequests, updateAdminQuoteStatus } from '../../api/admin'
import { formatDate } from '../../utils/format'

const QUOTE_STATUSES = ['all', 'received', 'contacted', 'quoted', 'closed']
const STATUS_STYLES = {
  received: 'bg-gold/15 text-gold',
  contacted: 'bg-blue-50 text-blue-700',
  quoted: 'bg-primary/10 text-primary',
  closed: 'bg-surface-container text-secondary',
}

export default function AdminQuotesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadQuotes() {
      setLoading(true)
      setError('')
      try {
        const res = await getAdminQuoteRequests(100)
        if (!res.success) throw new Error(res.message)
        setQuotes(res.data || [])
      } catch (e) {
        setError(e.message || 'Unable to load quote requests.')
      } finally {
        setLoading(false)
      }
    }
    loadQuotes()
  }, [])

  async function updateStatus(reference, newStatus) {
    const previous = quotes
    setQuotes(prev => prev.map(q => q.reference === reference ? { ...q, status: newStatus } : q))
    try {
      const res = await updateAdminQuoteStatus(reference, newStatus)
      if (!res.success) throw new Error(res.message)
    } catch (e) {
      setQuotes(previous)
      setError(e.message || 'Unable to update quote status.')
    }
  }

  const filtered = quotes.filter(q => {
    const term = search.toLowerCase()
    const matchSearch = !term ||
      q.reference.toLowerCase().includes(term) ||
      q.name.toLowerCase().includes(term) ||
      q.email.toLowerCase().includes(term) ||
      q.category_slug.toLowerCase().includes(term)
    const matchStatus = statusFilter === 'all' || q.status === statusFilter
    return matchSearch && matchStatus
  })

  const counts = QUOTE_STATUSES.reduce((acc, s) => {
    acc[s] = s === 'all' ? quotes.length : quotes.filter(q => q.status === s).length
    return acc
  }, {})

  return (
    <div>
      <div className="mb-lg">
        <h1 className="text-h1 font-medium text-on-surface">Quote Requests</h1>
        <p className="text-secondary text-body-sm">
          {loading ? 'Loading quote requests...' : `${quotes.length} total · ${counts.received} new`}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-error-container text-on-error-container px-md py-sm rounded-lg mb-md">
          <AlertTriangle size={16} className="shrink-0" />
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-outline-variant p-md mb-md space-y-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by reference, name, email, or category..."
            className="w-full pl-9 pr-4 py-2 border border-outline-variant rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-wrap gap-sm">
          {QUOTE_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-sm py-xs rounded-full text-label text-xs font-semibold capitalize cursor-pointer transition-colors ${statusFilter === s ? 'bg-primary text-white' : 'border border-outline-variant text-secondary hover:border-primary'}`}
            >
              {s} <span className="opacity-70">({counts[s]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-md">
        {filtered.map(q => (
          <div key={q.reference} className="bg-white rounded-xl border border-outline-variant p-md">
            <div className="flex items-start justify-between gap-3 mb-sm flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-body font-bold text-on-surface">{q.name}</h3>
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLES[q.status]}`}>{q.status}</span>
                </div>
                <p className="text-body-sm text-primary font-medium capitalize mt-1">{q.category_slug.replace(/-/g, ' ')}</p>
                <p className="text-label text-xs text-secondary font-mono mt-1">{q.reference}</p>
              </div>
              <select
                value={q.status}
                onChange={e => updateStatus(q.reference, e.target.value)}
                className="rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-body-sm font-semibold capitalize text-on-surface focus:border-primary focus:outline-none cursor-pointer"
              >
                {QUOTE_STATUSES.filter(s => s !== 'all').map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-sm text-body-sm text-secondary mb-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Mail size={14} className="shrink-0" />
                <a href={`mailto:${q.email}`} className="truncate hover:text-primary">{q.email}</a>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Phone size={14} className="shrink-0" />
                <a href={`tel:${q.phone}`} className="truncate hover:text-primary">{q.phone}</a>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Calendar size={14} className="shrink-0" />
                <span className="truncate">{formatDate(q.created_at)}</span>
              </div>
            </div>

            <p className="text-body-sm text-on-surface bg-surface-container-lowest border border-outline-variant rounded-lg p-sm whitespace-pre-wrap">{q.message}</p>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-outline-variant text-center py-xl text-secondary text-body-sm">
            {quotes.length === 0 ? 'No quote requests yet.' : 'No quote requests match your filter.'}
          </div>
        )}
      </div>
    </div>
  )
}
