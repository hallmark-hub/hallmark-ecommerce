import { client } from './client'

const USE_MOCK = true
let quoteCounter = 0

export async function submitQuote(payload) {
  if (USE_MOCK) {
    quoteCounter++
    const ref = `QR-20260525-${String(quoteCounter).padStart(4, '0')}`
    return {
      success: true,
      data: { id: `quote-${quoteCounter}`, reference: ref, status: 'received' },
      message: 'Quote request received. We will contact you within 24 hours.',
    }
  }
  return client.post('/api/v1/quote-requests', payload)
}
