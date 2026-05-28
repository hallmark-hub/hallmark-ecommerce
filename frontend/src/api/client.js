const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authToken() {
  try {
    const stored = JSON.parse(localStorage.getItem('chefware-auth') || '{}')
    return stored?.state?.token || ''
  } catch {
    return ''
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const headers = { ...(options.headers || {}) }
  if (options.body) headers['Content-Type'] = 'application/json'
  if (options.auth || options.admin) {
    const token = authToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(url, { ...options, headers })
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(json?.message || 'Request failed')
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
  adminPost: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body), admin: true }),
}
