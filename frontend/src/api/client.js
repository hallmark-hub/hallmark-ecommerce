const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const AUTH_STORAGE_KEY = 'chefware-auth'

function persistedAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || '{}')?.state || {}
  } catch {
    return {}
  }
}

function authToken() {
  return persistedAuth().token || ''
}

// Supabase access tokens expire after an hour. A single in-flight refresh is
// shared so a burst of 401s does not fire one refresh call per request.
let refreshInFlight = null

async function refreshSession() {
  const refreshToken = persistedAuth().refreshToken
  if (!refreshToken) return null

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
        const json = await res.json().catch(() => null)
        if (!res.ok || !json?.success) return null
        const { default: useAuthStore } = await import('../store/authStore')
        useAuthStore.getState().applySession(json.data)
        return json.data.access_token
      } catch {
        return null
      } finally {
        refreshInFlight = null
      }
    })()
  }
  return refreshInFlight
}

async function endSession() {
  const { default: useAuthStore } = await import('../store/authStore')
  useAuthStore.getState().logout()
}

async function request(path, options = {}, retryOnUnauthorized = true) {
  const url = `${BASE_URL}${path}`
  const headers = { ...(options.headers || {}) }
  if (options.body) headers['Content-Type'] = 'application/json'
  const authenticated = options.auth || options.admin
  if (authenticated) {
    const token = authToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(url, { ...options, headers })

  if (res.status === 401 && authenticated && retryOnUnauthorized) {
    const token = await refreshSession()
    if (token) return request(path, options, false)
    await endSession()
  }

  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(json?.message || 'Request failed')
  return json
}

async function upload(path, formData, options = {}, retryOnUnauthorized = true) {
  const url = `${BASE_URL}${path}`
  const headers = { ...(options.headers || {}) }
  const authenticated = options.auth || options.admin
  if (authenticated) {
    const token = authToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(url, { method: 'POST', body: formData, headers })

  if (res.status === 401 && authenticated && retryOnUnauthorized) {
    const token = await refreshSession()
    if (token) return upload(path, formData, options, false)
    await endSession()
  }

  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(json?.message || 'Upload failed')
  return json
}

function withQuery(path, params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') qs.set(key, value)
  })
  const query = qs.toString()
  return `${path}${query ? `?${query}` : ''}`
}

export const client = {
  get: (path, params, options) => request(withQuery(path, params), options),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  authGet: (path, params) => request(withQuery(path, params), { auth: true }),
  patch: (path, body, options) => request(path, { method: 'PATCH', body: JSON.stringify(body), ...options }),
  adminGet: (path, params) => request(withQuery(path, params), { admin: true }),
  adminPatch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body), admin: true }),
  adminPut: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body), admin: true }),
  adminPost: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body), admin: true }),
  adminUpload: (path, formData) => upload(path, formData, { admin: true }),
}
