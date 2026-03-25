import api from './api';

export const eventsService = {
  getAll: (params) => api.get('/events/', { params }),
  getById: (id) => api.get(`/events/${id}/`),
  create: (data) => api.post('/events/', data),
  update: (id, data) => api.put(`/events/${id}/`, data),
  delete: (id) => api.delete(`/events/${id}/`),
  getParticipants: (id) => api.get(`/events/${id}/participants/`),
};

export const participantsService = {
  getAll: (params) => api.get('/participants/', { params }),
  getById: (id) => api.get(`/participants/${id}/`),
  create: (data) => api.post('/participants/', data),
  update: (id, data) => api.put(`/participants/${id}/`, data),
  delete: (id) => api.delete(`/participants/${id}/`),
};

export const registrationsService = {
  getAll: () => api.get('/registrations/'),
  create: (data) => api.post('/registrations/', data),
  delete: (id) => api.delete(`/registrations/${id}/`),
};
