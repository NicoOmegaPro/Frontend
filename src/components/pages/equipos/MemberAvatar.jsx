import { avatarSrc } from '../../../utils/avatar';

// Avatar de un miembro del equipo (foto o inicial).
export default function MemberAvatar({ user }) {
  if (user?.imagenPerfil) {
    return <img src={avatarSrc(user.imagenPerfil)} alt={user.nombre} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />;
  }
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[15px] font-bold flex-shrink-0" style={{ background: 'var(--primary)' }}>
      {user?.nombre?.charAt(0).toUpperCase()}
    </div>
  );
}
