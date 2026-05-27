import { useState, useEffect, useRef } from 'react';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Topbar() {
  const { user } = useAuth();
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
      style={{ background: 'white', borderBottom: '1px solid var(--border)', height: '52px' }}
    >
      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B778C]" />
        <input
          placeholder="Buscar..."
          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md bg-[#F4F5F7] border border-transparent focus:border-[#0052CC] focus:bg-white input-field placeholder-[#B3BAC5] text-[#172B4D]"
        />
      </div>

      <div className="flex items-center gap-2 ml-4">
        {/* Notifications */}
        <div ref={ref} className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg hover:bg-[#F4F5F7] text-[#6B778C] hover:text-[#172B4D] transition-colors"
          >
            <Bell size={17} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 text-[9px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div
              className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-2xl border border-[#DFE1E6] z-50"
              style={{ maxHeight: '360px' }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#DFE1E6]">
                <span className="font-semibold text-sm text-[#172B4D]">Notificaciones</span>
                {unread > 0 && (
                  <button onClick={markAll} className="text-xs text-[#0052CC] hover:underline">
                    Marcar todo leído
                  </button>
                )}
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: '280px' }}>
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-sm text-[#6B778C]">
                    <Bell size={24} className="mx-auto mb-2 opacity-30" />
                    Sin notificaciones
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markRead(n)}
                      className={`px-4 py-3 border-b border-[#F4F5F7] cursor-pointer hover:bg-[#F4F5F7] transition-colors ${
                        !n.leida ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      <div className="flex gap-2 items-start">
                        {!n.leida && (
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#172B4D]">{n.mensaje}</p>
                          <p className="text-xs text-[#6B778C] mt-0.5">
                            {formatDistanceToNow(new Date(n.fecha), { addSuffix: true, locale: es })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-[#DFE1E6]">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
              style={{ background: 'var(--primary)' }}
            >
              {user.nombre?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-[#172B4D] leading-none">{user.nombre}</p>
              <p className="text-[11px] text-[#6B778C] leading-none mt-0.5">{user.rol?.nombre}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
