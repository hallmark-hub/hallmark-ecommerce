import { client } from './client'

export async function getProducts(params = {}) {
  return client.get('/api/v1/products', params)
}

export async function getProduct(slug) {
  return client.get(`/api/v1/products/${slug}`)
}
