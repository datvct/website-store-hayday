import { request } from './client'

export const orderApi = {
  create(payload) {
    return request('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  track(payload) {
    const search = new URLSearchParams(payload)
    return request(`/orders/track?${search.toString()}`)
  },
  adminList() {
    return request('/admin/orders')
  },
  adminGet(id) {
    return request(`/admin/orders/${id}`)
  },
  adminStats() {
    return request('/admin/stats')
  },
  adminUpdateStatus(id, payload) {
    return request(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },
}
