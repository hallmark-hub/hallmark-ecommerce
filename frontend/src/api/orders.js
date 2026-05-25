import { client } from './client'

const USE_MOCK = true

let mockOrderCounter = 42

export async function createOrder(payload) {
  if (USE_MOCK) {
    mockOrderCounter++
    const ref = `CW-20260525-${String(mockOrderCounter).padStart(4, '0')}`
    const subtotal = payload.items.reduce((sum, item) => sum + item.unit_price_pesewas * item.quantity, 0)
    return {
      success: true,
      data: {
        id: `order-${mockOrderCounter}`,
        reference: ref,
        subtotal_pesewas: subtotal,
        total_pesewas: subtotal,
        payment_method: payload.payment_method,
        payment_status: 'pending',
        order_status: 'pending',
        returns_policy: 'No refunds. Exchange only within 3 days of purchase.',
        created_at: new Date().toISOString(),
      },
      message: 'Order created',
    }
  }
  return client.post('/api/v1/orders', payload)
}

export async function lookupOrder(reference, phone) {
  if (USE_MOCK) {
    return {
      success: true,
      data: {
        id: 'order-mock',
        reference,
        customer: { name: 'Ama Boateng', phone },
        items: [{ product_name: 'Classic White Chef Jacket', quantity: 2, unit_price_pesewas: 45000 }],
        total_pesewas: 90000,
        payment_method: 'paystack',
        payment_status: 'paid',
        order_status: 'confirmed',
        returns_policy: 'No refunds. Exchange only within 3 days of purchase.',
        created_at: new Date().toISOString(),
      },
      message: 'OK',
    }
  }
  return client.get(`/api/v1/orders/lookup?reference=${reference}&phone=${encodeURIComponent(phone)}`)
}
