import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('hd_token') || '',
  admin: JSON.parse(localStorage.getItem('hd_admin') || 'null'),
  setAuth(token, admin) {
    localStorage.setItem('hd_token', token)
    localStorage.setItem('hd_admin', JSON.stringify(admin))
    set({ token, admin })
  },
  clearAuth() {
    localStorage.removeItem('hd_token')
    localStorage.removeItem('hd_admin')
    set({ token: '', admin: null })
  },
}))
