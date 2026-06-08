const API_BASE = import.meta.env.VITE_BACKEND_URL || (import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, '') : 'http://localhost:3000');

export function avatarSrc(imagenPerfil) {
  if (!imagenPerfil) return null;
  return /^https?:\/\//i.test(imagenPerfil) ? imagenPerfil : `${API_BASE}${imagenPerfil}`;
}
