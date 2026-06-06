const API_BASE = 'http://localhost:3000/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Construye un query string a partir de un objeto, ignorando valores vacíos.
function qs(params) {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return entries.length ? '?' + new URLSearchParams(Object.fromEntries(entries)).toString() : '';
}

async function request(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: getHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error de red' }));
    throw new Error(err.error || 'Error en la petición');
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  register: (data) => request('POST', '/auth/register', data),
  me: () => request('GET', '/auth/me'),

  getProjects: () => request('GET', '/projects'),
  getProject: (id) => request('GET', `/projects/${id}`),
  createProject: (data) => request('POST', '/projects', data),
  updateProject: (id, data) => request('PUT', `/projects/${id}`, data),
  deleteProject: (id) => request('DELETE', `/projects/${id}`),
  // Miembros y roles del proyecto
  addProjectMember: (projectId, data) => request('POST', `/projects/${projectId}/miembros`, data),
  updateProjectMember: (projectId, userId, rol) => request('PUT', `/projects/${projectId}/miembros/${userId}`, { rol }),
  removeProjectMember: (projectId, userId) => request('DELETE', `/projects/${projectId}/miembros/${userId}`),

  // filtros opcionales: { proyectoId, estado, prioridad, asignadoAId, sprintId, q, vencidas }
  getTasks: (filtros) => {
    const qs = filtros ? '?' + new URLSearchParams(
      Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== ''))
    ).toString() : '';
    return request('GET', `/tasks${qs}`);
  },
  getTask: (id) => request('GET', `/tasks/${id}`),
  createTask: (data) => request('POST', '/tasks', data),
  updateTask: (id, data) => request('PUT', `/tasks/${id}`, data),
  reorderTasks: (ids) => request('PUT', '/tasks/reorder', { ids }),
  deleteTask: (id) => request('DELETE', `/tasks/${id}`),

  getSubtareas: (tareaId) => request('GET', `/subtareas?tareaId=${tareaId}`),
  createSubtarea: (data) => request('POST', '/subtareas', data),
  updateSubtarea: (id, data) => request('PUT', `/subtareas/${id}`, data),
  deleteSubtarea: (id) => request('DELETE', `/subtareas/${id}`),

  getComentarios: (tareaId) => request('GET', `/comentarios?tareaId=${tareaId}`),
  createComentario: (data) => request('POST', '/comentarios', data),
  deleteComentario: (id) => request('DELETE', `/comentarios/${id}`),

  getDashboard: () => request('GET', '/dashboard'),

  // Sin params → array completo (para selects). Con { page } → { items, total, page, pages }.
  getUsers: (params) => request('GET', `/users${qs(params)}`),
  getUser: (id) => request('GET', `/users/${id}`),
  updateUser: (id, data) => request('PUT', `/users/${id}`, data),

  // Sin params → array completo. Con { page } → { items, total, page, pages }.
  getEquipos: (params) => request('GET', `/equipos${qs(params)}`),
  getEquipo: (id) => request('GET', `/equipos/${id}`),
  createEquipo: (data) => request('POST', '/equipos', data),
  updateEquipo: (id, data) => request('PUT', `/equipos/${id}`, data),
  deleteEquipo: (id) => request('DELETE', `/equipos/${id}`),
  // Invitaciones (los invitados entran como miembros del equipo)
  invitarMiembro: (equipoId, email) => request('POST', `/equipos/${equipoId}/invitar`, { email }),
  aceptarInvitacion: (equipoId) => request('PUT', `/equipos/${equipoId}/aceptar`),
  rechazarInvitacion: (equipoId) => request('DELETE', `/equipos/${equipoId}/rechazar`),
  // Gestión de miembros
  expulsarMiembro: (equipoId, userId) => request('DELETE', `/equipos/${equipoId}/miembros/${userId}`),

  getSprints: (proyectoId) => request('GET', `/sprints?proyectoId=${proyectoId}`),
  createSprint: (data) => request('POST', '/sprints', data),
  updateSprint: (id, data) => request('PUT', `/sprints/${id}`, data),
  deleteSprint: (id) => request('DELETE', `/sprints/${id}`),

  getEtiquetas: () => request('GET', '/etiquetas'),
  createEtiqueta: (data) => request('POST', '/etiquetas', data),
  deleteEtiqueta: (id) => request('DELETE', `/etiquetas/${id}`),

  getAdjuntos: (tareaId) => request('GET', `/adjuntos?tareaId=${tareaId}`),
  createAdjunto: (data) => request('POST', '/adjuntos', data),
  deleteAdjunto: (id) => request('DELETE', `/adjuntos/${id}`),

  changePassword: (id, currentPassword, newPassword) =>
    request('POST', `/users/${id}/change-password`, { currentPassword, newPassword }),

  uploadAvatar: async (id, file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await fetch(`${API_BASE}/users/${id}/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error de red' }));
      throw new Error(err.error || 'Error al subir el avatar');
    }
    return res.json();
  },

  uploadAdjunto: async (file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/adjuntos/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error de red' }));
      throw new Error(err.error || 'Error al subir el archivo');
    }
    return res.json();
  },

  // Devuelve { items, total, noLeidas, page, pages }
  getNotificaciones: (params) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request('GET', `/notificaciones${qs}`);
  },
  updateNotificacion: (id, data) => request('PUT', `/notificaciones/${id}`, data),
  marcarTodasNotificaciones: () => request('PUT', '/notificaciones/marcar-todas'),

  // Devuelve { items, total, page, pages }
  getHistorial: (params) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request('GET', `/historial${qs}`);
  },

  getRoles: () => request('GET', '/roles'),
};

export default api;
