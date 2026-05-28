import { client } from './client'

export async function initializePaystack(orderId) {
  return client.post('/api/v1/payments/paystack/initialize', { order_id: orderId })
}

export async function verifyPaystack(reference) {
  return client.get(`/api/v1/payments/paystack/verify/${reference}`)
}
