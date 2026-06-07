// Resuelve la URL de una imagen de perfil.
// - Si ya es absoluta (http/https), p. ej. un avatar sembrado, se usa tal cual.
// - Si es una ruta local subida por el usuario (/uploads/...), se antepone el backend.
const API_BASE = 'http://localhost:3000';

export function avatarSrc(imagenPerfil) {
  if (!imagenPerfil) return null;
  return /^https?:\/\//i.test(imagenPerfil) ? imagenPerfil : `${API_BASE}${imagenPerfil}`;
}
