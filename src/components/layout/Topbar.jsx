import { useState, useEffect, useRef } from 'react';
import { Bell, Sun, Moon, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:3000';

export default function Topbar() {
  const { user } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!user) return;
    api.getNotificaciones()
      .then((data) =>
        setNotifications(
          Array.isArray(data)
            ? data.filter((n) => n.usuarioId === user.id).slice(0, 20)
            : []
        )
      )
      .catch(() => {});
  }, [user]);

  useEffect(() => {
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
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, leida: true } : x)));
  };

  const markAll = async () => {
    const unreadList = notifications.filter((n) => !n.leida);
    await Promise.all(unreadList.map((n) => api.updateNotificacion(n.id, { leida: true }).catch(() => {})));
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  return (
    <header
      className="flex items-center justify-between px-6 flex-shrink-0"
      style={{
        background: 'var(--card)',
        borderBottom: '1px solid var(--border)',
        height: '60px',
        transition: 'background 0.25s',
      }}
    >
      {/* Left: app title on mobile or breadcrumb */}
      <div className="flex items-center gap-3 flex-1">
        <span className="text-base font-semibold" style={{ color: 'var(--text-muted)' }}>
          Panel de gestión
        </span>
      </div>

      <div className="flex items-center gap-1">
        {/* Dark / Light toggle */}
        <button
          onClick={toggle}
          title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          className="relative p-2.5 rounded-xl transition-all duration-200 hover:scale-105"
          style={{
            background: dark ? 'rgba(90,156,248,0.15)' : 'rgba(0,82,204,0.08)',
            color: dark ? '#5a9cf8' : '#0052CC',
          }}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div ref={ref} className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2.5 rounded-xl transition-colors hover:bg-[#F4F5F7]"
            style={{ color: 'var(--text-muted)' }}
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 text-[9px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div
              className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-2xl z-50 border"
              style={{
                background: 'var(--card)',
                borderColor: 'var(--border)',
                maxHeight: '380px',
              }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                  Notificaciones
                  {unread > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                      {unread}
                    </span>
                  )}
                </span>
                {unread > 0 && (
                  <button
                    onClick={markAll}
                    className="text-xs font-medium hover:underline"
                    style={{ color: 'var(--primary)' }}
                  >
                    Marcar todo leído
                  </button>
                )}
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
                {notifications.length === 0 ? (
                  <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
                    <Bell size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Sin notificaciones</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    // Parsear si es invitación de equipo
                    let invData = null;
                    if (n.tipo === 'INVITACION_EQUIPO') {
                      try { invData = JSON.parse(n.mensaje); } catch {}
                    }

                    return (
                      <div
                        key={n.id}
                        className="px-4 py-3 border-b transition-colors"
                        style={{
                          borderColor: 'var(--border)',
                          background: !n.leida ? 'rgba(0,82,204,0.06)' : 'transparent',
                          cursor: invData ? 'default' : 'pointer',
                        }}
                        onClick={() => !invData && markRead(n)}
                      >
                        <div className="flex gap-2.5 items-start">
                          {!n.leida && (
                            <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--primary)' }} />
                          )}
                          <div className="flex-1 min-w-0">
                            {invData ? (
                              <>
                                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                                  Invitación al equipo
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                  <strong>{invData.invitadoPor}</strong> te invita a <strong>{invData.equipoNombre}</strong> como {invData.rol?.toLowerCase()}
                                </p>
                                {!n.leida && (
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          await api.aceptarInvitacion(invData.equipoId);
                                          setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, leida: true } : x));
                                          window.location.href = '/equipos';
                                        } catch {}
                                      }}
                                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                                      style={{ background: 'var(--success)' }}
                                    >
                                      <Check size={11} /> Aceptar
                                    </button>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          await api.rechazarInvitacion(invData.equipoId);
                                          setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, leida: true } : x));
                                        } catch {}
                                      }}
                                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                                      style={{ background: 'rgba(248,81,73,.15)', color: 'var(--danger)' }}
                                    >
                                      <X size={11} /> Rechazar
                                    </button>
                                  </div>
                                )}
                              </>
                            ) : (
                              <p className="text-sm" style={{ color: 'var(--text)' }}>{n.mensaje}</p>
                            )}
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
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

        {/* User avatar */}
        {user && (
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2.5 pl-3 ml-1 border-l hover:opacity-80 transition-opacity"
            style={{ borderColor: 'var(--border)' }}
          >
            {user.imagenPerfil ? (
              <img
                src={`${API_BASE}${user.imagenPerfil}`}
                alt={user.nombre}
                className="w-9 h-9 rounded-full object-cover ring-2"
                style={{ ringColor: 'var(--primary)' }}
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: 'var(--primary)' }}
              >
                {user.nombre?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold leading-none" style={{ color: 'var(--text)' }}>
                {user.nombre}
              </p>
            </div>
          </button>
        )}
      </div>
    </header>
  );
}
