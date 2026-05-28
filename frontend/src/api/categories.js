import { client } from './client'

export async function getCategories() {
  return client.get('/api/v1/categories')
}
