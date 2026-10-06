import { useEffect, useState } from 'react'
import { Mail, Phone, Calendar, Building2, MapPin, Package, MessageSquare } from 'lucide-react'
import { getAdminQuoteRequests, updateAdminQuoteStatus } from '../../api/admin'
import { formatDate } from '../../utils/format'
import { formatQuoteCategory } from '../../config/quoteCategories'
import {
  Alert, EmptyState, FilterChips, PageHeader, SearchInput, StatusSelect, cardClass,
} from '../../components/admin/AdminUI'

const QUOTE_STATUSES = ['all', 'received', 'contacted', 'quoted', 'closed']
const STATUS_TONES = { received: 'warning', contacted: 'info', quoted: 'success', closed: 'neutral' }

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
      <PageHeader
        title="Quote requests"
        subtitle={loading ? 'Loading quote requests…' : `${quotes.length} total · ${counts.received} new`}
      />

      {error && <Alert>{error}</Alert>}

      <div className={`${cardClass} p-3 mb-4 space-y-3`}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by reference, name, email or category" />
        <FilterChips
          value={statusFilter}
          onChange={setStatusFilter}
          label="Status"
          options={QUOTE_STATUSES.map(s => ({ value: s, label: s, count: counts[s] }))}
        />
      </div>

      <div className="space-y-4">
        {filtered.map(q => (
          <div key={q.reference} className={`${cardClass} p-5`}>
            <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-on-surface">{q.name}</h3>
                <p className="text-sm text-primary font-medium mt-1">{formatQuoteCategory(q.category_slug)}</p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{q.reference}</p>
              </div>
              <StatusSelect
                value={q.status}
                tone={STATUS_TONES[q.status]}
                options={QUOTE_STATUSES.filter(s => s !== 'all')}
                label={`Status for ${q.reference}`}
                onChange={status => updateStatus(q.reference, status)}
              />
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <Mail size={14} className="shrink-0 text-gray-400" />
                <a href={`mailto:${q.email}`} className="truncate hover:text-primary">{q.email}</a>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Phone size={14} className="shrink-0 text-gray-400" />
                <a href={`tel:${q.phone}`} className="hover:text-primary">{q.phone}</a>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="shrink-0 text-gray-400" />
                <span>{formatDate(q.created_at)}</span>
              </div>
              {q.company_name && <div className="flex items-center gap-2 min-w-0"><Building2 size={14} className="shrink-0 text-gray-400" /><span className="truncate">{q.company_name}</span></div>}
              {q.location && <div className="flex items-center gap-2 min-w-0"><MapPin size={14} className="shrink-0 text-gray-400" /><span className="truncate">{q.location}</span></div>}
              {q.quantity && <div className="flex items-center gap-2 min-w-0"><Package size={14} className="shrink-0 text-gray-400" /><span className="truncate">{q.quantity}</span></div>}
              {q.preferred_delivery_date && <div className="flex items-center gap-2"><Calendar size={14} className="shrink-0 text-gray-400" /><span>Preferred delivery: {q.preferred_delivery_date}</span></div>}
            </div>

            <p className="text-sm text-on-surface bg-gray-50 border border-gray-200 rounded p-3 whitespace-pre-wrap">{q.message}</p>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className={cardClass}>
            <EmptyState icon={MessageSquare} title={quotes.length === 0 ? 'No quote requests yet' : 'No quote requests match'}>
              {quotes.length === 0 ? 'Requests from the quote form will appear here.' : 'Try a different search or status.'}
            </EmptyState>
          </div>
        )}
      </div>
    </div>
  )
}
