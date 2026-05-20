import api from './axios';

export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login:  (data) => api.post('/auth/login',  data),
  logout: ()     => api.post('/auth/logout'),
  me:     ()     => api.get('/auth/me'),
};

export const projectsAPI = {
  list:         ()              => api.get('/projects'),
  get:          (id)            => api.get(`/projects/${id}`),
  create:       (data)          => api.post('/projects', data),
  update:       (id, data)      => api.put(`/projects/${id}`, data),
  delete:       (id)            => api.delete(`/projects/${id}`),
  addMember:    (id, userId)    => api.post(`/projects/${id}/members`, { userId }),
  removeMember: (id, userId)    => api.delete(`/projects/${id}/members/${userId}`),
  getAuditLog:  (id)            => api.get(`/projects/${id}/audit`),
};

export const tasksAPI = {
  listByProject: (projectId, params) => api.get(`/projects/${projectId}/tasks`, { params }),
  getStats:      (projectId)         => api.get(`/projects/${projectId}/tasks/stats`),
  getDashboard:  ()                  => api.get('/tasks/dashboard'),
  create:        (projectId, data)   => api.post(`/projects/${projectId}/tasks`, data),
  update:        (taskId, data)      => api.put(`/tasks/${taskId}`, data),
  delete:        (taskId)            => api.delete(`/tasks/${taskId}`),
  getAuditLog:   (taskId)            => api.get(`/tasks/${taskId}/audit`),
};

export const usersAPI = {
  list: () => api.get('/users'),
};
