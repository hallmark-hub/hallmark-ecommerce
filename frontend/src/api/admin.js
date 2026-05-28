import { client } from './client'

export async function getAdminAnalyticsSummary() {
  return client.adminGet('/api/v1/admin/analytics/summary')
}

export async function getAdminOrders(limit = 50) {
  return client.adminGet('/api/v1/admin/orders', { limit })
}

export async function updateAdminOrderStatus(reference, orderStatus) {
  return client.adminPatch(`/api/v1/admin/orders/${reference}/status`, { order_status: orderStatus })
}

export async function updateAdminProductStock(slug, stockQty, inStock) {
  return client.adminPatch(`/api/v1/admin/products/${slug}/stock`, {
    stock_qty: stockQty,
    in_stock: inStock,
  })
}
