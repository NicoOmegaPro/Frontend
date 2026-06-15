import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate, useLocation } from 'react-router-dom';
import { avatarSrc } from '../../utils/avatar';

const PAGE_TITLES = [
  { match: '/dashboard', title: 'Dashboard' },
  { match: '/projects',  title: 'Proyectos' },
  { match: '/equipos',   title: 'Equipos'   },
  { match: '/profile',   title: 'Mi Perfil' },
  { match: '/users',     title: 'Perfil'    },
];

export default function Topbar({ collapsed = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const ref = useRef(null);

  const pageTitle = PAGE_TITLES.find((p) => location.pathname.startsWith(p.match))?.title || 'Noir'; //title de la página según la ruta actual, si no coincide con ninguna ruta conocida, mostrar "Noir"

  useEffect(() => { // Al montar, cargo las notificaciones del usuario. Si no hay usuario, no hago nada.
    if (!user) return;
    api.getNotificaciones({ limit: 20 }) 
      .then((data) => setNotifications(Array.isArray(data?.items) ? data.items : []))
      .catch(() => {});
  }, [user]);

  useEffect(() => { // Cierro el dropdown de notificaciones si hago click fuera de él. En cualquier parte de la pag.
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setShowNotifs(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const unread = notifications.filter((n) => !n.leida).length;

  const markRead = async (n) => {
    if (n.leida) return;
    await api.updateNotificacion(n.id, { leida: true }).catch(() => {});
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, leida: true } : x))); // actualizo el estado local para que desaparezca el punto rojo sin recargar la página
  };

  const markAll = async () => { // marco todas como leídas. No hago nada si no hay notificaciones.
    await api.marcarTodasNotificaciones().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  return (
    <header
      className="flex items-center justify-between px-6 lg:px-10 flex-shrink-0 sticky top-0 z-30"
      style={{
        background: 'color-mix(in srgb, var(--bg-elev) 80%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        height: '60px',
      }}
    >
      <div className="flex items-center min-w-0">
        <div
          className="flex items-center overflow-hidden"
          style={{
            maxWidth: collapsed ? '160px' : '0px',
            opacity: collapsed ? 1 : 0,
            transform: collapsed ? 'translateX(0)' : 'translateX(-10px)',
            transition: 'max-width .3s cubic-bezier(.16,1,.3,1), opacity .25s ease, transform .3s cubic-bezier(.16,1,.3,1)',
            pointerEvents: collapsed ? 'auto' : 'none',
          }}
        >
          <img src="/logo.png" alt="Noir" className="h-7 w-auto object-contain flex-shrink-0" />
          <span className="font-semibold text-[15px] tracking-tight ml-2" style={{ color: 'var(--text)' }}>
            Noir
          </span>
          <span className="mx-3 h-5 w-px flex-shrink-0" style={{ background: 'var(--border)' }} />
        </div>
        <h1 className="text-[15px] font-semibold tracking-tight truncate" style={{ color: 'var(--text)' }}>
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-1.5">
        <div ref={ref} className="relative">
          <button onClick={() => setShowNotifs(!showNotifs)} className="icon-btn relative">
            <Bell size={17} />
            {unread > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[15px] h-[15px] px-0.5 text-[9px] font-bold text-white rounded-full flex items-center justify-center"
                style={{ background: 'var(--danger)', boxShadow: '0 0 0 2px var(--bg-elev)' }}
              >
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div
              className="absolute right-0 top-full mt-2 w-[340px] rounded-2xl z-50 overflow-hidden fade-up"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-pop)' }}
            >
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="font-semibold text-[13.5px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  Notificaciones
                  {unread > 0 && (
                    <span className="badge tone-accent">{unread} nuevas</span>
                  )}
                </span>
                {unread > 0 && (
                  <button onClick={markAll} className="text-[12px] font-medium hover:underline" style={{ color: 'var(--primary-hover)' }}>
                    Marcar leídas
                  </button>
                )}
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
                {notifications.length === 0 ? (
                  <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                    <Bell size={26} className="mx-auto mb-2 opacity-30" />
                    <p className="text-[13px]">Sin notificaciones</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    let invData = null;
                    if (n.tipo === 'INVITACION_EQUIPO') {
                      try { invData = JSON.parse(n.mensaje); } catch {}
                    }
                    return (
                      <div
                        key={n.id}
                        className="px-4 py-3 transition-colors"
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: !n.leida ? 'var(--primary-soft)' : 'transparent',
                          cursor: invData ? 'default' : 'pointer',
                        }}
                        onClick={() => !invData && markRead(n)}
                      >
                        <div className="flex gap-2.5 items-start">
                          {!n.leida && <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--primary)' }} />}
                          <div className="flex-1 min-w-0">
                            {invData ? (
                              <>
                                <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>Invitación al equipo</p>
                                <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                  <strong style={{ color: 'var(--text)' }}>{invData.invitadoPor}</strong> te invita a <strong style={{ color: 'var(--text)' }}>{invData.equipoNombre}</strong> como {invData.rol?.toLowerCase()}
                                </p>
                                {!n.leida && (
                                  <div className="flex gap-2 mt-2.5">
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          await api.aceptarInvitacion(invData.equipoId);
                                          setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, leida: true } : x));
                                          window.location.href = '/equipos';
                                        } catch {}
                                      }}
                                      className="btn btn-primary !py-1.5 !px-3 !text-[12px]"
                                    >
                                      <Check size={12} /> Aceptar
                                    </button>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          await api.rechazarInvitacion(invData.equipoId);
                                          setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, leida: true } : x));
                                        } catch {}
                                      }}
                                      className="btn btn-danger !py-1.5 !px-3 !text-[12px]"
                                    >
                                      <X size={12} /> Rechazar
                                    </button>
                                  </div>
                                )}
                              </>
                            ) : (
                              <p className="text-[13px]" style={{ color: 'var(--text)' }}>{n.mensaje}</p>
                            )}
                            <p className="text-[11px] mt-1" style={{ color: 'var(--text-faint)' }}>
                              {formatDistanceToNow(new Date(n.fecha), { addSuffix: true, locale: es })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {user && (
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2.5 pl-2.5 ml-1 hover:opacity-80 transition-opacity"
            style={{ borderLeft: '1px solid var(--border)' }}
          >
            {user.imagenPerfil ? (
              <img src={avatarSrc(user.imagenPerfil)} alt={user.nombre} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-bold"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
              >
                {user.nombre?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden sm:block text-[13px] font-medium" style={{ color: 'var(--text)' }}>
              {user.nombre?.split(' ')[0]}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}