import { client } from './client'

export async function createOrder(payload) {
  return client.post('/api/v1/orders', payload)
}

export async function lookupOrder(reference, phone) {
  return client.get('/api/v1/orders/lookup', { reference, phone })
}
