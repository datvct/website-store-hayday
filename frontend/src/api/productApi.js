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
    return request('/categories').then((res) =>
      (Array.isArray(res) ? res : res.items || [])
        .map((item) => typeof item === 'string' ? item : item?.name)
        .filter(Boolean)
    )
  },
  adminCategories() {
    return request('/admin/categories').then((res) => {
      const items = Array.isArray(res) ? res : res.items || []
      return items.map((item, index) => typeof item === 'string'
        ? { id: `legacy-${index}`, name: item, isActive: true }
        : item
      )
    })
  },
  adminCreateCategory(name) {
    return request('/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  },
  adminUpdateCategory(id, payload) {
    return request(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },
  adminDeleteCategory(id) {
    return request(`/admin/categories/${id}`, { method: 'DELETE' })
  },
  adminList({ page = 1, limit = 20, query = '', categoryId = '' } = {}) {
    const search = new URLSearchParams({ page, limit })
    if (query.trim()) search.set('query', query.trim())
    if (categoryId && categoryId !== 'all') search.set('categoryId', categoryId)
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
  adminUploadImage(id, file) {
    const form = new FormData()
    form.append('image', file)
    const token = localStorage.getItem('hd_token')
    return fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/admin/products/${id}/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }).then(async (response) => {
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload.success === false) throw new Error(payload.message || 'Không thể upload ảnh')
      return payload.data
    })
  },
  adminDelete(id) {
    return request(`/admin/products/${id}`, {
      method: 'DELETE',
    })
  },
}
