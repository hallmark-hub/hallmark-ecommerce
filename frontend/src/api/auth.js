import { client } from './client'

export async function registerCustomer(payload) {
  return client.post('/api/v1/auth/register', payload)
}

export async function loginCustomer(payload) {
  return client.post('/api/v1/auth/login', payload)
}

export async function getCurrentCustomer() {
  return client.authGet('/api/v1/auth/me')
}

export async function getCustomerOrders() {
  return client.authGet('/api/v1/customer/orders')
}

export async function requestPasswordReset(email) {
  return client.post('/api/v1/auth/forgot-password', { email })
}

export async function resetPassword(accessToken, password) {
  return client.post('/api/v1/auth/reset-password', { access_token: accessToken, password })
}
