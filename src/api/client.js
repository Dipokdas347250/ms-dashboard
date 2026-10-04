// Thin fetch wrapper around the Express API.
// Server responses look like { success, message?, data } or { success: false, error, details? }.

export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const TOKEN_KEY = 'ms_admin_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

// Fired on 401 so the auth context can log the user out.
export const UNAUTHORIZED_EVENT = 'ms:unauthorized'

// "/uploads/products/x.jpg" → absolute URL when the API lives on another origin.
export const assetUrl = (path) => (path && path.startsWith('/') ? `${API_URL}${path}` : path)

function buildQuery(params) {
  if (!params) return ''
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    qs.set(key, Array.isArray(value) ? value.join(',') : String(value))
  }
  const str = qs.toString()
  return str ? `?${str}` : ''
}

export async function request(method, path, { body, params, auth = true } = {}) {
  const headers = {}
  const token = tokenStore.get()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  const isForm = body instanceof FormData
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(`${API_URL}/api${path}${buildQuery(params)}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Cannot reach the server. Is the API running?', 0)
  }

  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.success === false) {
    if (res.status === 401 && auth && token) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    throw new ApiError(json.error || `Request failed (${res.status})`, res.status, json.details)
  }
  return { data: json.data, message: json.message }
}

export const http = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, body, opts) => request('POST', path, { ...opts, body }),
  put: (path, body, opts) => request('PUT', path, { ...opts, body }),
  patch: (path, body, opts) => request('PATCH', path, { ...opts, body }),
  delete: (path, body, opts) => request('DELETE', path, { ...opts, body }),
}
