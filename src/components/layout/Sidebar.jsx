import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, FolderKanban, User, LogOut, ChevronRight, PanelLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

const ROL_LABEL = {
  1: 'Administrador',
  2: 'Jefe de Proyecto',
  3: 'Supervisor',
  4: 'Trabajador',
};

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Proyectos' },
  { to: '/profile', icon: User, label: 'Mi Perfil' },
];

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
        background: 'var(--primary-dark)',
        width: collapsed ? '56px' : '220px',
        transition: 'width 0.2s ease',
        flexShrink: 0,
      }}
      className="flex flex-col min-h-screen"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-4 border-b border-white/10">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-sm"
          style={{ background: 'var(--primary)', color: 'white' }}
        >
          K
        </div>
        {!collapsed && (
          <span className="text-white font-bold text-sm truncate flex-1">KanbanApp</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-white/50 hover:text-white flex-shrink-0"
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          <PanelLeft size={15} className={collapsed ? 'rotate-180' : ''} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `sidebar-link flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={17} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}

        {/* Recent projects */}
        {!collapsed && projects.length > 0 && (
          <div className="mt-4">
            <p className="text-white/35 text-[10px] font-semibold uppercase tracking-wider px-2.5 mb-1.5">
              Proyectos recientes
            </p>
            {projects.map((p) => (
              <NavLink
                key={p.id}
                to={`/projects/${p.id}`}
                className={({ isActive }) =>
                  `sidebar-link flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs ${
                    isActive ? 'bg-white/20 text-white' : 'text-white/55 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <span className="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                  {p.nombre.charAt(0).toUpperCase()}
                </span>
                <span className="truncate">{p.nombre}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Bottom: user + logout */}
      <div className="px-2 py-3 border-t border-white/10 flex-shrink-0">
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-2.5 py-2 mb-0.5">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.nombre?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user.nombre}</p>
              <p className="text-white/45 text-[10px] truncate">{ROL_LABEL[user.rolId] || 'Usuario'}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Cerrar sesión' : undefined}
          className="sidebar-link flex items-center gap-3 px-2.5 py-2 rounded-md text-sm text-white/65 hover:bg-white/10 hover:text-white w-full"
        >
          <LogOut size={17} className="flex-shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
