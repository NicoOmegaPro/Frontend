import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, FolderKanban, User, LogOut, PanelLeft, Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects',  icon: FolderKanban,    label: 'Proyectos'  },
  { to: '/equipos',   icon: Users,           label: 'Equipos'    },
  { to: '/profile',   icon: User,             label: 'Mi Perfil'  },
];

const API_BASE = 'http://localhost:3000';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

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
      style={{
        background: 'var(--sidebar-bg)',
        width: collapsed ? '64px' : '260px',
        transition: 'width 0.2s ease',
        flexShrink: 0,
      }}
      className="flex flex-col min-h-screen"
    >
      {/* Header */}
      <div
        className={`flex items-center gap-2.5 py-5 border-b ${collapsed ? 'justify-center px-0' : 'px-3'}`}
        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
      >
        {!collapsed && (
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm shadow-md"
            style={{ background: 'rgba(255,255,255,0.25)', color: 'white' }}
          >
            K
          </div>
        )}
        {!collapsed && (
          <span className="text-white font-bold text-base truncate flex-1 tracking-tight">
            KanbanApp
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex-shrink-0 transition-opacity opacity-60 hover:opacity-100 cursor-pointer p-1.5 rounded-lg hover:bg-white/10"
          style={{ color: 'white' }}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          <PanelLeft size={18} className={collapsed ? 'rotate-180' : ''} />
        </button>
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-4 flex flex-col gap-1 overflow-y-auto overflow-x-hidden ${collapsed ? 'px-2' : 'px-2.5'}`}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `sidebar-link flex items-center gap-3 py-3 rounded-xl text-[15px] font-semibold cursor-pointer ${
                collapsed ? 'justify-center px-0' : 'px-3.5'
              } ${
                isActive
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={20} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}

        {/* Recent projects */}
        {!collapsed && projects.length > 0 && (
          <div className="mt-5">
            <p
              className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              Proyectos recientes
            </p>
            {projects.map((p) => (
              <NavLink
                key={p.id}
                to={`/projects/${p.id}`}
                className={({ isActive }) =>
                  `sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/55 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <span
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
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
      <div
        className={`py-4 border-t flex-shrink-0 space-y-1 ${collapsed ? 'px-2' : 'px-2.5'}`}
        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
      >
        {!collapsed && user && (
          <NavLink
            to="/profile"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors mb-1"
          >
            {user.imagenPerfil ? (
              <img
                src={`${API_BASE}${user.imagenPerfil}`}
                alt={user.nombre}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2"
                style={{ ringColor: 'rgba(255,255,255,0.4)' }}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: 'var(--primary)' }}
              >
                {user.nombre?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate leading-tight">{user.nombre}</p>
            </div>
          </NavLink>
        )}

        <button
          onClick={handleLogout}
          title={collapsed ? 'Cerrar sesión' : undefined}
          className={`flex items-center gap-3 py-3 rounded-xl text-[15px] font-semibold w-full transition-colors cursor-pointer ${
            collapsed ? 'justify-center px-0' : 'px-3.5'
          }`}
          style={{ color: '#ffd7d3', background: 'rgba(248,81,73,0.16)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248,81,73,0.30)'; e.currentTarget.style.color = '#ffffff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(248,81,73,0.16)'; e.currentTarget.style.color = '#ffd7d3'; }}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
