import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data || error)
  }
)

// Auth - uses /auth path not /api/auth
const authClient = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
})
authClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error.response?.data || error)
)

export const authAPI = {
  login: (email, password) => authClient.post('/auth/login', { email, password }),
  verify: (token) => authClient.post('/auth/verify', { token }),
  refresh: (token) => authClient.post('/auth/refresh', { token }),
}

// Users
export const usersAPI = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}

// Products
export const productsAPI = {
  list: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  getChildren: (id) => api.get(`/products/${id}/children`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  restore: (id) => api.put(`/products/${id}/restore`),
  getEAP: () => api.get('/products/eap/active'),
}

// Clients
export const clientsAPI = {
  list: (params) => api.get('/clients', { params }),
  get: (id) => api.get(`/clients/${id}`),
  getDeployments: (id) => api.get(`/clients/${id}/deployments`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  restore: (id) => api.put(`/clients/${id}/restore`),
}

// Deployments
export const deploymentsAPI = {
  list: (params) => api.get('/deployments', { params }),
  get: (id) => api.get(`/deployments/${id}`),
  create: (data) => api.post('/deployments', data),
  update: (id, data) => api.put(`/deployments/${id}`, data),
  delete: (id) => api.delete(`/deployments/${id}`),
  restore: (id) => api.put(`/deployments/${id}/restore`),
  updateStatus: (id, status, blockedComment) =>
    api.put(`/deployments/${id}/status`, { status, blockedComment }),
  getByStatus: (status) => api.get('/deployments/by-status', { params: { status } }),
}

// Checklists
export const checklistsAPI = {
  getByDeployment: (deploymentId) => api.get(`/checklists/deployment/${deploymentId}`),
  updateItem: (id, itemKey, completed) =>
    api.put(`/checklists/${id}/item`, { itemKey, completed }),
  markAllComplete: (id) => api.put(`/checklists/${id}/complete-all`),
  resetAll: (id) => api.put(`/checklists/${id}/reset`),
}

// Checklist Templates (Admin)
export const checklistTemplatesAPI = {
  list: (params) => api.get('/checklist-templates', { params }),
  getActive: () => api.get('/checklist-templates/active'),
  get: (id) => api.get(`/checklist-templates/${id}`),
  create: (data) => api.post('/checklist-templates', data),
  update: (id, data) => api.put(`/checklist-templates/${id}`, data),
  delete: (id) => api.delete(`/checklist-templates/${id}`),
  reorder: (items) => api.post('/checklist-templates/reorder', { items }),
  seedDefaults: () => api.post('/checklist-templates/seed'),
}

// Release Note Templates
export const releaseNoteTemplatesAPI = {
  list: (params) => api.get('/release-note-templates', { params }),
  getActive: () => api.get('/release-note-templates/active'),
  get: (id) => api.get(`/release-note-templates/${id}`),
}

// Release Notes
export const releaseNotesAPI = {
  list: (params) => api.get('/release-notes', { params }),
  get: (id) => api.get(`/release-notes/${id}`),
  getByProduct: (productId) => api.get(`/release-notes/product/${productId}`),
  getForExport: (id, templateId) => api.get(`/release-notes/${id}/export`, { params: { templateId } }),
  create: (data) => api.post('/release-notes', data),
  update: (id, data) => api.put(`/release-notes/${id}`, data),
  delete: (id) => api.delete(`/release-notes/${id}`),
}

// Approvals
export const approvalsAPI = {
  list: (params) => api.get('/approvals', { params }),
  get: (id) => api.get(`/approvals/${id}`),
  request: (data) => api.post('/approvals', data),
  approve: (id) => api.put(`/approvals/${id}/approve`),
  reject: (id, comment) => api.put(`/approvals/${id}/reject`, { comment }),
}

// Reports
export const reportsAPI = {
  getDashboardMetrics: (params) => api.get('/reports/dashboard', { params }),
  getDeploymentReport: (params) => api.get('/reports/deployments', { params }),
  getClientReport: (params) => api.get('/reports/clients', { params }),
  getProductReport: (params) => api.get('/reports/products', { params }),
}

// Engineering
export const engineeringAPI = {
  getTeamCapacity: (params) => api.get('/engineering/capacity', { params }),
  createTeamCapacity: (data) => api.post('/engineering/capacity', data),
  updateTeamCapacity: (id, data) => api.put(`/engineering/capacity/${id}`, data),
  getResourceAllocation: (params) => api.get('/engineering/allocation', { params }),
  allocateResource: (data) => api.post('/engineering/allocation', data),
}

// Audit Logs
export const auditAPI = {
  list: (params) => api.get('/audit', { params }),
  get: (id) => api.get(`/audit/${id}`),
}

// Config
export const configAPI = {
  list: () => api.get('/config'),
  get: (key) => api.get(`/config/${key}`),
  update: (key, value) => api.put(`/config/${key}`, { value }),
}

export default api
