// Category API service
import { api } from 'boot/axios'

export const categoryService = {
  // Mendapatkan kategori berdasarkan type (masuk/keluar)
  getCategories: (type) => {
    return api.get(`/categories?type=${type}`)
  },

  // Mendapatkan semua kategori
  getAllCategories: () => {
    return api.get('/categories')
  }
}

export default categoryService
