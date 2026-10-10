import { create } from 'zustand'
import { getSiteContent } from '../api/siteContent'
import snapshot from './siteContentSnapshot.json'

// The storefront renders instantly from the last saved copy (or, on a first
// visit, a bundled snapshot of the live content) while a fresh one loads.
const CACHE_KEY = 'chefware-site-content'

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
  } catch {
    return null
  }
}

function writeCache(content) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(content))
  } catch {
    // Storage full or blocked — the live fetch still works.
  }
}

const useSiteContentStore = create((set, get) => ({
  content: readCache() || snapshot,
  loading: false,
  loaded: false,
  error: '',

  async load(force = false) {
    if (!force && (get().loading || get().loaded)) return get().content
    set({ loading: true, error: '' })
    try {
      const response = await getSiteContent()
      if (!response.success) throw new Error(response.message)
      writeCache(response.data)
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
    writeCache(content)
    set({ content, loaded: true, error: '' })
  },
}))

export default useSiteContentStore
