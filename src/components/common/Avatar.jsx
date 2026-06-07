import { avatarSrc } from '../../utils/avatar';

// Avatar de usuario: muestra su foto de perfil si existe; si no, la inicial del nombre.
// Úsalo en TODOS los sitios donde aparezca un usuario para mantener coherencia.
export default function Avatar({ user, size = 28, className = '', title, ring = false }) {
  const src = avatarSrc(user?.imagenPerfil);
  const nombre = user?.nombre || '';
  const tooltip = title ?? nombre;
  const base = {
    width: size,
    height: size,
    ...(ring ? { boxShadow: '0 0 0 2px var(--bg-elev)' } : {}),
  };

  if (src) {
    return (
      <img
        src={src}
        alt={nombre}
        title={tooltip}
        style={base}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      title={tooltip}
      style={{
        ...base,
        background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
        fontSize: Math.max(10, Math.round(size * 0.4)),
      }}
      className={`rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}
    >
      {(nombre.charAt(0) || '?').toUpperCase()}
    </div>
  );
}
