import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FolderKanban, CheckSquare, Clock, AlertCircle, TrendingUp, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const ESTADO_COLOR = {
  PENDIENTE: '#6B778C',
  EN_PROGRESO: '#0052CC',
  EN_REVISION: '#FF991F',
  FINALIZADO: '#00875A',
};

const ESTADO_LABEL = {
  PENDIENTE: 'Pendiente',
  EN_PROGRESO: 'En progreso',
  EN_REVISION: 'En revisión',
  FINALIZADO: 'Finalizado',
};

const ACCION_ICON = {
  CREADO: '✨',
  ACTUALIZADO: '✏️',
  ELIMINADO: '🗑️',
  COMPLETADO: '✅',
};

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-[#DFE1E6] flex items-start gap-4">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}15` }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-[#172B4D]">{value}</p>
        <p className="text-sm font-medium text-[#172B4D]">{label}</p>
        {sub && <p className="text-xs text-[#6B778C] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getProjects().catch(() => []),
      api.getTasks().catch(() => []),
      api.getHistorial().catch(() => []),
    ]).then(([p, t, h]) => {
      setProjects(Array.isArray(p) ? p : []);
      setTasks(Array.isArray(t) ? t : []);
      setHistorial(Array.isArray(h) ? h.slice(0, 15) : []);
    }).finally(() => setLoading(false));
  }, []);

  const myTasks = tasks.filter((t) => t.asignadoAId === user?.id);
  const tasksByStatus = {
    PENDIENTE: tasks.filter((t) => t.estado === 'PENDIENTE').length,
    EN_PROGRESO: tasks.filter((t) => t.estado === 'EN_PROGRESO').length,
    EN_REVISION: tasks.filter((t) => t.estado === 'EN_REVISION').length,
    FINALIZADO: tasks.filter((t) => t.estado === 'FINALIZADO').length,
  };
  const activeProjects = projects.filter((p) => p.estado === 'ACTIVO').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-[#172B4D]">
          ¡Hola, {user?.nombre?.split(' ')[0]}! 👋
        </h1>
        <p className="text-[#6B778C] text-sm mt-1">
          Aquí tienes un resumen de la actividad del equipo.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FolderKanban}
          label="Proyectos activos"
          value={activeProjects}
          sub={`${projects.length} totales`}
          color="#0052CC"
        />
        <StatCard
          icon={Clock}
          label="En progreso"
          value={tasksByStatus.EN_PROGRESO}
          sub={`${tasksByStatus.PENDIENTE} pendientes`}
          color="#FF991F"
        />
        <StatCard
          icon={CheckSquare}
          label="Finalizadas"
          value={tasksByStatus.FINALIZADO}
          sub={`${tasks.length} tareas totales`}
          color="#00875A"
        />
        <StatCard
          icon={AlertCircle}
          label="Mis tareas"
          value={myTasks.length}
          sub="asignadas a mí"
          color="#DE350B"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task progress by status */}
        <div className="bg-white rounded-xl border border-[#DFE1E6] p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-[#0052CC]" />
            <h2 className="font-semibold text-[#172B4D] text-sm">Estado de tareas</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(ESTADO_LABEL).map(([key, label]) => {
              const count = tasksByStatus[key];
              const pct = tasks.length ? Math.round((count / tasks.length) * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#172B4D] font-medium">{label}</span>
                    <span className="text-[#6B778C]">{count} ({pct}%)</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${pct}%`, background: ESTADO_COLOR[key] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* My tasks */}
        <div className="bg-white rounded-xl border border-[#DFE1E6] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckSquare size={16} className="text-[#0052CC]" />
              <h2 className="font-semibold text-[#172B4D] text-sm">Mis tareas</h2>
            </div>
            <Link to="/projects" className="text-xs text-[#0052CC] hover:underline">Ver todas</Link>
          </div>
          {myTasks.length === 0 ? (
            <p className="text-sm text-[#6B778C] text-center py-6">Sin tareas asignadas</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {myTasks.slice(0, 8).map((t) => (
                <div
                  key={t.id}
                  onClick={() => navigate(`/projects/${t.proyectoId}`)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#F4F5F7] cursor-pointer group"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: ESTADO_COLOR[t.estado] }}
                  />
                  <span className="text-sm text-[#172B4D] truncate flex-1 group-hover:text-[#0052CC]">
                    {t.titulo}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                    style={{ background: `${ESTADO_COLOR[t.estado]}20`, color: ESTADO_COLOR[t.estado] }}
                  >
                    {ESTADO_LABEL[t.estado]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div className="bg-white rounded-xl border border-[#DFE1E6] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-[#0052CC]" />
            <h2 className="font-semibold text-[#172B4D] text-sm">Actividad reciente</h2>
          </div>
          {historial.length === 0 ? (
            <p className="text-sm text-[#6B778C] text-center py-6">Sin actividad</p>
          ) : (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {historial.map((h) => (
                <div key={h.id} className="flex gap-2.5 items-start">
                  <span className="text-base flex-shrink-0 mt-0.5">{ACCION_ICON[h.accion] || '📌'}</span>
                  <div className="min-w-0">
                    <p className="text-xs text-[#172B4D]">
                      <span className="font-semibold">{h.usuario?.nombre || 'Usuario'}</span>{' '}
                      {h.detalles || `${h.accion.toLowerCase()} ${h.entidadTipo.toLowerCase()}`}
                    </p>
                    <p className="text-[10px] text-[#6B778C] mt-0.5">
                      {formatDistanceToNow(new Date(h.fecha), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent projects */}
      {projects.length > 0 && (
        <div className="bg-white rounded-xl border border-[#DFE1E6] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderKanban size={16} className="text-[#0052CC]" />
              <h2 className="font-semibold text-[#172B4D] text-sm">Proyectos recientes</h2>
            </div>
            <Link to="/projects" className="text-xs text-[#0052CC] hover:underline">Ver todos</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.slice(0, 6).map((p) => {
              const projectTasks = tasks.filter((t) => t.proyectoId === p.id);
              const done = projectTasks.filter((t) => t.estado === 'FINALIZADO').length;
              const pct = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="p-4 rounded-lg border border-[#DFE1E6] hover:border-[#0052CC] cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-7 h-7 rounded bg-[#0052CC] flex items-center justify-center text-white text-xs font-bold">
                      {p.nombre.charAt(0).toUpperCase()}
                    </span>
                    <span className="font-semibold text-sm text-[#172B4D] group-hover:text-[#0052CC] truncate">
                      {p.nombre}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B778C] mb-3 line-clamp-2">
                    {p.descripcion || 'Sin descripción'}
                  </p>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#6B778C] mt-1.5">
                    <span>{projectTasks.length} tareas</span>
                    <span>{pct}% completado</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
