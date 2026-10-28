import { useCallback, useEffect, useRef, useState } from 'react'
import { getAdminOrders, getAdminQuoteRequests } from '../api/admin'

const POLL_MS = 30000
const SEEN_KEY = 'chefware-admin-seen'

function readSeen() {
  try {
    const stored = JSON.parse(localStorage.getItem(SEEN_KEY))
    if (stored) return { orders: new Set(stored.orders), quotes: new Set(stored.quotes) }
  } catch { /* storage unavailable or corrupt */ }
  return null
}

function writeSeen(seen) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify({ orders: [...seen.orders], quotes: [...seen.quotes] }))
  } catch { /* storage unavailable; the in-memory copy still works for this session */ }
}

// Polls for paid orders and quote requests the admin has not opened yet.
export default function useAdminAlerts(enabled) {
  const [alerts, setAlerts] = useState({ orders: [], quotes: [] })
  const seenRef = useRef(null)
  const latestRef = useRef({ orders: [], quotes: [] })

  useEffect(() => {
    if (!enabled) return undefined
    let active = true

    async function poll() {
      try {
        const [ordersRes, quotesRes] = await Promise.all([getAdminOrders(50), getAdminQuoteRequests(50)])
        if (!active || !ordersRes.success || !quotesRes.success) return
        const orders = (ordersRes.data || []).filter(o => o.payment_status === 'paid')
        const quotes = quotesRes.data || []
        latestRef.current = { orders: orders.map(o => o.reference), quotes: quotes.map(q => q.reference) }
        if (!seenRef.current) {
          // First visit on this browser: treat existing orders and quotes as already seen.
          seenRef.current = readSeen() || { orders: new Set(latestRef.current.orders), quotes: new Set(latestRef.current.quotes) }
          writeSeen(seenRef.current)
        }
        const seen = seenRef.current
        setAlerts({
          orders: orders.filter(o => !seen.orders.has(o.reference)),
          quotes: quotes.filter(q => !seen.quotes.has(q.reference)),
        })
      } catch { /* try again on the next poll */ }
    }

    poll()
    const timer = setInterval(poll, POLL_MS)
    return () => { active = false; clearInterval(timer) }
  }, [enabled])

  // kind is 'orders' or 'quotes'
  const markSeen = useCallback(kind => {
    const seen = seenRef.current
    if (!seen) return
    latestRef.current[kind].forEach(reference => seen[kind].add(reference))
    writeSeen(seen)
    setAlerts(current => ({ ...current, [kind]: [] }))
  }, [])

  return { newOrders: alerts.orders, newQuotes: alerts.quotes, markSeen }
}
