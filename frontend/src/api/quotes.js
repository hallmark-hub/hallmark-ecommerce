import { client } from './client'

export async function submitQuote(payload) {
  return client.post('/api/v1/quote-requests', payload)
}

export async function getCustomerQuotes() {
  return client.authGet('/api/v1/customer/quotes')
}
