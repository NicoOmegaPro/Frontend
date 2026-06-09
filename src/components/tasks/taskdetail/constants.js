// Constantes y helpers de la tarjeta de detalle de tarea.
const BACKEND = import.meta.env.VITE_BACKEND_URL || (import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, '') : 'http://localhost:3000');

export const ESTADOS = ['PENDIENTE', 'EN_PROGRESO', 'EN_REVISION', 'FINALIZADO'];
export const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'];

export const ESTADO_STYLE = {
  PENDIENTE:   { bg: 'rgba(139,139,148,.18)', color: '#B6B6BF', label: 'Pendiente' },
  EN_PROGRESO: { bg: 'rgba(110,118,241,.18)', color: '#8A90F7', label: 'En progreso' },
  EN_REVISION: { bg: 'rgba(224,168,46,.18)',  color: '#E0A82E', label: 'En revisión' },
  FINALIZADO:  { bg: 'rgba(63,185,80,.18)',   color: '#4ED164', label: 'Finalizado' },
};

export const PRI_STYLE = {
  BAJA:    { color: '#38BDF8', bg: 'rgba(56,189,248,.18)',  label: 'Baja',    dot: 'bg-sky-400' },
  MEDIA:   { color: '#6E76F1', bg: 'rgba(110,118,241,.18)', label: 'Media',   dot: 'bg-indigo-400' },
  ALTA:    { color: '#FB923C', bg: 'rgba(251,146,60,.18)',  label: 'Alta',    dot: 'bg-orange-400' },
  URGENTE: { color: '#F0556B', bg: 'rgba(240,85,107,.18)',  label: 'Urgente', dot: 'bg-rose-400' },
};

// El backend a veces devuelve ruta relativa, le pego el host.
export function getAdjuntoUrl(rutaLocal) {
  if (!rutaLocal) return '';
  if (rutaLocal.startsWith('http')) return rutaLocal;
  return `${BACKEND}${rutaLocal}`;
}

export function isImageFile(nombre, rutaLocal) {
  const str = (nombre || rutaLocal || '').toLowerCase();
  return /\.(jpg|jpeg|png|gif|webp|avif)$/.test(str) || str.includes('picsum.photos');
}
