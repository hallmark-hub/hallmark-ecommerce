import { client } from './client'

export async function getSiteContent() {
  return client.get('/api/v1/site-content')
}

export async function getAdminSiteContent() {
  return client.adminGet('/api/v1/admin/site-content')
}

export async function updateAdminSiteContent(payload) {
  return client.adminPut('/api/v1/admin/site-content', payload)
}
