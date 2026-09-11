import { request } from './client'

export const productApi = {
  list(params = {}) {
    const search = new URLSearchParams()
    if (params.query) search.set('query', params.query)
    if (params.category) search.set('category', params.category)
    search.set('page', params.page || 1)
    search.set('limit', params.limit || 24)
    return request(`/products?${search.toString()}`)
  },
  async listAll(params = {}) {
    const limit = 100
    let page = 1
    let all = []
    let total = 0
    do {
      const result = await this.list({ ...params, page, limit })
      all = all.concat(result.items || [])
      total = result.total || all.length
      page += 1
    } while (all.length < total)
    return { items: all, total }
  },
  get(id) {
    return request(`/products/${id}`)
  },
  categories() {
    return request('/categories').then((res) => res.items || [])
  },
  adminList({ page = 1, limit = 20, query = '' } = {}) {
    const search = new URLSearchParams({ page, limit })
    if (query.trim()) search.set('query', query.trim())
    return request(`/admin/products?${search.toString()}`)
  },
  async adminListAll() {
    let page = 1
    let all = []
    let total = 0
    do {
      const result = await request(`/admin/products?page=${page}&limit=100`)
      all = all.concat(result.items || [])
      total = result.total || all.length
      page += 1
    } while (all.length < total)
    return { items: all, total }
  },
  adminCreate(payload) {
    return request('/admin/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  adminUpdate(id, payload) {
    return request(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },
  adminDelete(id) {
    return request(`/admin/products/${id}`, {
      method: 'DELETE',
    })
  },
}
