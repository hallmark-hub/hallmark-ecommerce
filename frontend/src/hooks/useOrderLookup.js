import { useState } from 'react'
import { lookupOrder } from '../api/orders'
import { validatePhone, formatPhone } from '../utils/format'

export default function useOrderLookup() {
  const [reference, setReference] = useState('')
  const [phone, setPhone] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function lookup(e) {
    e.preventDefault()
    setError('')
    setResult(null)
    if (!reference.trim()) { setError('Order reference is required.'); return }
    if (!validatePhone(formatPhone(phone))) { setError('Phone must be +233XXXXXXXXX.'); return }
    setLoading(true)
    try {
      const res = await lookupOrder(reference.trim(), formatPhone(phone))
      if (res.success) setResult(res.data)
      else setError(res.message)
    } catch {
      setError('Lookup failed. Check your reference and phone number.')
    } finally {
      setLoading(false)
    }
  }

  return { reference, setReference, phone, setPhone, result, error, loading, lookup }
}
