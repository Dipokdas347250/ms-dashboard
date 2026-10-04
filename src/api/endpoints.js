import { http } from './client'

// One function per server endpoint — see server/README.md.
// Each resolves to { data, message }.

const enc = encodeURIComponent

export const systemApi = {
  health: () => http.get('/health', { auth: false }),
}

export const authApi = {
  login: (email, password) => http.post('/admin/login', { email, password }, { auth: false }),
  register: (payload) => http.post('/admin/register', payload, { auth: false }),
  me: () => http.get('/admin/me'),
  changePassword: (currentPassword, newPassword) => http.put('/admin/password', { currentPassword, newPassword }),
}

export const dashboardApi = {
  summary: () => http.get('/admin/dashboard'),
}

export const adminsApi = {
  list: () => http.get('/admin/admins'),
  create: (payload) => http.post('/admin/admins', payload),
  update: (id, payload) => http.patch(`/admin/admins/${id}`, payload),
}

export const ordersApi = {
  list: (params) => http.get('/orders', { params }),
  get: (id) => http.get(`/orders/${enc(id)}`),
  updateStatus: (id, status, note) => http.patch(`/orders/${enc(id)}/status`, { status, note: note || undefined }),
  update: (id, payload) => http.patch(`/orders/${enc(id)}`, payload),
  sendToCourier: (id) => http.post(`/orders/${enc(id)}/courier`),
  syncCourier: (id) => http.post(`/orders/${enc(id)}/courier/sync`),
  // Public endpoints
  place: (payload) => http.post('/orders', payload, { auth: false }),
  track: (orderId, phone) => http.get(`/orders/track/${enc(orderId)}`, { params: { phone }, auth: false }),
}

export const productsApi = {
  listAll: (params) => http.get('/products/admin/all', { params }),
  get: (id) => http.get(`/products/admin/${enc(id)}`),
  create: (payload) => http.post('/products', payload),
  update: (id, payload) => http.put(`/products/${enc(id)}`, payload),
  updateStock: (id, variants) => http.patch(`/products/${enc(id)}/stock`, { variants }),
  remove: (id) => http.delete(`/products/${enc(id)}`),
  uploadImages: (id, files) => {
    const form = new FormData()
    for (const file of files) form.append('images', file)
    return http.post(`/products/${enc(id)}/images`, form)
  },
  removeImage: (id, url) => http.delete(`/products/${enc(id)}/images`, { url }),
  // Public endpoints (what the shop shows customers)
  listPublic: () => http.get('/products', { auth: false }),
  getPublic: (slug) => http.get(`/products/${enc(slug)}`, { auth: false }),
}

export const videosApi = {
  listAll: () => http.get('/videos/admin/all'),
  create: (payload) => http.post('/videos', payload),
  update: (id, payload) => http.patch(`/videos/${id}`, payload),
  reorder: (ids) => http.put('/videos/reorder', { ids }),
  remove: (id) => http.delete(`/videos/${id}`),
  listPublic: () => http.get('/videos', { auth: false }),
}

export const settingsApi = {
  get: () => http.get('/settings'),
  update: (payload) => http.put('/settings', payload),
  testSteadfast: () => http.post('/settings/steadfast/test'),
}

export const customersApi = {
  list: (params) => http.get('/customers', { params }),
  get: (id) => http.get(`/customers/${id}`),
  update: (id, payload) => http.patch(`/customers/${id}`, payload),
}
