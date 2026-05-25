import { client } from './client'

const USE_MOCK = true

export async function initializePaystack(orderId) {
  if (USE_MOCK) {
    return {
      success: true,
      data: {
        authorization_url: 'https://checkout.paystack.com/mock-abc123',
        access_code: 'mock-abc123',
        reference: 'CW-20260525-MOCK',
      },
      message: 'Paystack initialized',
    }
  }
  return client.post('/api/v1/payments/paystack/initialize', { order_id: orderId })
}

export async function verifyPaystack(reference) {
  if (USE_MOCK) {
    return {
      success: true,
      data: { reference, payment_status: 'paid', order_id: 'order-mock' },
      message: 'Payment verified',
    }
  }
  return client.get(`/api/v1/payments/paystack/verify/${reference}`)
}

export async function bankTransfer(orderId, bank) {
  if (USE_MOCK) {
    const banks = {
      gcb: { bank_name: 'GCB Bank', branch: 'TBC', account_name: 'TBC', account_number: 'TBC' },
      stanbic: { bank_name: 'Stanbic Bank', branch: 'TBC', account_name: 'TBC', account_number: 'TBC' },
    }
    const details = banks[bank] || banks.gcb
    return {
      success: true,
      data: {
        reference: 'CW-20260525-MOCK',
        ...details,
        amount_pesewas: 90000,
        instructions: 'Transfer exactly GHS 900.00 and use reference CW-20260525-MOCK as payment narration.',
      },
      message: 'Bank transfer details retrieved',
    }
  }
  return client.post('/api/v1/payments/bank-transfer', { order_id: orderId, bank })
}
