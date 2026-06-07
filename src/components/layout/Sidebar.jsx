import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, FolderKanban, User, LogOut, PanelLeft, Users, Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { avatarSrc } from '../../utils/avatar';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects',  icon: FolderKanban,    label: 'Proyectos' },
  { to: '/equipos',   icon: Users,           label: 'Equipos'   },
  { to: '/profile',   icon: User,            label: 'Mi Perfil' },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    api.getProjects()
      .then((data) => setProjects(Array.isArray(data) ? data.slice(0, 6) : []))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className="flex flex-col h-screen flex-shrink-0"
      style={{
        background: 'color-mix(in srgb, var(--bg-elev) 80%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        width: collapsed ? '72px' : '256px',
        borderRight: '1px solid var(--border)',
        transition: 'width .22s cubic-bezier(.16,1,.3,1)',
      }}
    >
      {/* Brand */}
      <div className={`flex items-center h-[60px] flex-shrink-0 ${collapsed ? 'justify-center px-0' : 'px-4'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <img
              src="/logo.png"
              alt="Noir"
              className="h-8 w-auto object-contain flex-shrink-0"
            />
            <span className="font-semibold text-[15px] tracking-tight truncate" style={{ color: 'var(--text)' }}>
              Noir
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="icon-btn flex-shrink-0"
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          <PanelLeft size={17} className={collapsed ? 'rotate-180' : ''} />
        </button>
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-3 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden ${collapsed ? 'px-2.5' : 'px-3'}`}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `sidebar-link flex items-center gap-3 h-9 rounded-lg text-[13.5px] font-medium ${
                collapsed ? 'justify-center px-0' : 'px-3'
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? 'var(--bg-secondary)' : 'transparent',
              color: isActive ? 'var(--text)' : 'var(--text-muted)',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className="flex-shrink-0" style={{ color: isActive ? 'var(--primary)' : 'currentColor' }} />
                {!collapsed && <span className="truncate">{label}</span>}
              </>
            )}
          </NavLink>
        ))}

        {/* Recent projects */}
        {!collapsed && projects.length > 0 && (
          <div className="mt-6">
            <p className="text-[10.5px] font-semibold uppercase tracking-widest px-3 mb-1.5" style={{ color: 'var(--text-faint)' }}>
              Proyectos
            </p>
            {projects.map((p) => (
              <NavLink
                key={p.id}
                to={`/projects/${p.id}`}
                className="sidebar-link flex items-center gap-2.5 px-3 h-8 rounded-lg text-[13px]"
                style={({ isActive }) => ({
                  background: isActive ? 'var(--bg-secondary)' : 'transparent',
                  color: isActive ? 'var(--text)' : 'var(--text-muted)',
                })}
              >
                <span
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                >
                  {p.nombre.charAt(0).toUpperCase()}
                </span>
                <span className="truncate">{p.nombre}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Bottom: user + logout */}
      <div className={`py-3 flex-shrink-0 ${collapsed ? 'px-2.5' : 'px-3'}`} style={{ borderTop: '1px solid var(--border)' }}>
        {!collapsed && user && (
          <NavLink
            to="/profile"
            className="flex items-center gap-2.5 px-2 h-12 rounded-lg sidebar-link mb-1"
            style={{ color: 'var(--text)' }}
          >
            {user.imagenPerfil ? (
              <img
                src={avatarSrc(user.imagenPerfil)}
                alt={user.nombre}
                className="w-7 h-7 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
              >
                {user.nombre?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold truncate leading-tight" style={{ color: 'var(--text)' }}>{user.nombre}</p>
              <p className="text-[11px] truncate leading-tight" style={{ color: 'var(--text-faint)' }}>{user.email}</p>
            </div>
          </NavLink>
        )}

        <button
          onClick={handleLogout}
          title={collapsed ? 'Cerrar sesión' : undefined}
          className={`sidebar-link flex items-center gap-3 h-9 rounded-lg text-[13.5px] font-medium w-full ${collapsed ? 'justify-center px-0' : 'px-3'}`}
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(240,85,107,0.10)'; e.currentTarget.style.color = 'var(--danger)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
