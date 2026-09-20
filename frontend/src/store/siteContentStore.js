import { create } from 'zustand'
import { getSiteContent } from '../api/siteContent'

const useSiteContentStore = create((set, get) => ({
  content: null,
  loading: false,
  loaded: false,
  error: '',

  async load(force = false) {
    if (!force && (get().loading || get().loaded)) return get().content
    set({ loading: true, error: '' })
    try {
      const response = await getSiteContent()
      if (!response.success) throw new Error(response.message)
      set({ content: response.data, loaded: true })
      return response.data
    } catch (error) {
      set({ error: error.message || 'Website content is unavailable.' })
      return null
    } finally {
      set({ loading: false })
    }
  },

  replace(content) {
    set({ content, loaded: true, error: '' })
  },
}))

export default useSiteContentStore
