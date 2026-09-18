import { create } from 'zustand'

function persist(items) {
  localStorage.setItem('hd_cart', JSON.stringify(items))
}

const initialItems = (() => {
  try {
    return JSON.parse(localStorage.getItem('hd_cart') || '[]')
  } catch {
    return []
  }
})()

export const useCartStore = create((set, get) => ({
  items: initialItems,
  addItem(product, quantity = 1) {
    set((state) => {
      quantity = Number.isFinite(Number(quantity)) && Number(quantity) > 0 ? Math.floor(Number(quantity)) : 1
      const existing = state.items.find((item) => item.id === product.id)
      const items = existing
        ? state.items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item)
        : [...state.items, { ...product, quantity }]
      persist(items)
      return { items }
    })
  },
  removeItem(id) {
    set((state) => {
      const items = state.items.filter((item) => item.id !== id)
      persist(items)
      return { items }
    })
  },
  updateQty(id, quantity) {
    set((state) => {
      const parsed = Number(quantity)
      const safeQuantity = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1
      const items = state.items.map((item) => item.id === id ? { ...item, quantity: safeQuantity } : item)
      persist(items)
      return { items }
    })
  },
  clear() {
    persist([])
    set({ items: [] })
  },
  subtotal() {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  },
}))
