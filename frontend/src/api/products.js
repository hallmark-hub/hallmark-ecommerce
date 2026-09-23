import { client } from './client'

const productRequests = new Map()

export async function getProducts(params = {}) {
  const key = JSON.stringify(params)
  const cached = productRequests.get(key)
  if (cached && Date.now() - cached.started < 10000) return cached.request

  const request = client.get('/api/v1/products', params).catch(error => {
    if (productRequests.get(key)?.request === request) productRequests.delete(key)
    throw error
  })
  productRequests.set(key, { request, started: Date.now() })
  return request
}

export async function getProduct(slug) {
  return client.get(`/api/v1/products/${slug}`)
}
