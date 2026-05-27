const API_BASE = 'http://localhost:3000/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
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

  getTasks: () => request('GET', '/tasks'),
  getTask: (id) => request('GET', `/tasks/${id}`),
  createTask: (data) => request('POST', '/tasks', data),
  updateTask: (id, data) => request('PUT', `/tasks/${id}`, data),
  deleteTask: (id) => request('DELETE', `/tasks/${id}`),

  getSubtareas: () => request('GET', '/subtareas'),
  createSubtarea: (data) => request('POST', '/subtareas', data),
  updateSubtarea: (id, data) => request('PUT', `/subtareas/${id}`, data),
  deleteSubtarea: (id) => request('DELETE', `/subtareas/${id}`),

  getComentarios: () => request('GET', '/comentarios'),
  createComentario: (data) => request('POST', '/comentarios', data),
  deleteComentario: (id) => request('DELETE', `/comentarios/${id}`),

  getUsers: () => request('GET', '/users'),
  updateUser: (id, data) => request('PUT', `/users/${id}`, data),

  getEquipos: () => request('GET', '/equipos'),
  createEquipo: (data) => request('POST', '/equipos', data),
  updateEquipo: (id, data) => request('PUT', `/equipos/${id}`, data),
  deleteEquipo: (id) => request('DELETE', `/equipos/${id}`),

  getSprints: () => request('GET', '/sprints'),
  createSprint: (data) => request('POST', '/sprints', data),
  updateSprint: (id, data) => request('PUT', `/sprints/${id}`, data),
  deleteSprint: (id) => request('DELETE', `/sprints/${id}`),

  getEtiquetas: () => request('GET', '/etiquetas'),
  createEtiqueta: (data) => request('POST', '/etiquetas', data),
  deleteEtiqueta: (id) => request('DELETE', `/etiquetas/${id}`),

  getAdjuntos: () => request('GET', '/adjuntos'),
  createAdjunto: (data) => request('POST', '/adjuntos', data),
  deleteAdjunto: (id) => request('DELETE', `/adjuntos/${id}`),

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

  getNotificaciones: () => request('GET', '/notificaciones'),
  updateNotificacion: (id, data) => request('PUT', `/notificaciones/${id}`, data),

  getHistorial: () => request('GET', '/historial'),
  createHistorial: (data) => request('POST', '/historial', data),

  getRoles: () => request('GET', '/roles'),
};

export default api;
