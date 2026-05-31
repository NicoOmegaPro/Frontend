import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FolderKanban, CheckSquare, Clock, AlertCircle, TrendingUp, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

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

function StatCard({ icon: Icon, label, value, sub, color, items, onItemClick }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#DFE1E6] flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}1f` }}
        >
          <Icon size={24} style={{ color }} />
        </div>
        <div>
          <p className="text-3xl font-extrabold text-[#172B4D] leading-tight">{value}</p>
          <p className="text-[15px] font-semibold text-[#172B4D]">{label}</p>
          {sub && <p className="text-sm text-[#6B778C] mt-0.5">{sub}</p>}
        </div>
      </div>

      {/* Lista de tareas reales en este estado, para que se entienda de un vistazo */}
      {items && items.length > 0 && (
        <ul className="space-y-1.5 border-t border-[#F4F5F7] pt-3">
          {items.slice(0, 3).map((t) => (
            <li
              key={t.id}
              onClick={() => onItemClick?.(t)}
              className="flex items-center gap-2 text-sm text-[#172B4D] truncate cursor-pointer hover:text-[#0052CC]"
              title={t.titulo}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="truncate">{t.titulo}</span>
            </li>
          ))}
          {items.length > 3 && (
            <li className="text-xs text-[#6B778C] pl-3.5">+{items.length - 3} más</li>
          )}
        </ul>
      )}
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
  const enProgresoTasks = tasks.filter((t) => t.estado === 'EN_PROGRESO');
  const finalizadasTasks = tasks.filter((t) => t.estado === 'FINALIZADO');
  const tasksByStatus = {
    PENDIENTE: tasks.filter((t) => t.estado === 'PENDIENTE').length,
    EN_PROGRESO: enProgresoTasks.length,
    EN_REVISION: tasks.filter((t) => t.estado === 'EN_REVISION').length,
    FINALIZADO: finalizadasTasks.length,
  };
  const activeProjects = projects.filter((p) => p.estado === 'ACTIVO').length;

  const projectsSlice = projects.slice(0, 6);

  const taskDoughnutData = {
    labels: ['Pendiente', 'En progreso', 'En revisión', 'Finalizado'],
    datasets: [{
      data: [tasksByStatus.PENDIENTE, tasksByStatus.EN_PROGRESO, tasksByStatus.EN_REVISION, tasksByStatus.FINALIZADO],
      backgroundColor: ['#6B778C', '#0052CC', '#FF991F', '#00875A'],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { size: 13 }, padding: 14, usePointStyle: true, pointStyleWidth: 9, color: '#5E6C84' },
      },
      tooltip: {
        callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw} tarea${ctx.raw !== 1 ? 's' : ''}` },
      },
    },
  };

  const projectBarData = {
    labels: projectsSlice.map((p) => p.nombre.length > 16 ? p.nombre.slice(0, 16) + '…' : p.nombre),
    datasets: [{
      label: '% completado',
      data: projectsSlice.map((p) => {
        const pt = tasks.filter((t) => t.proyectoId === p.id);
        return pt.length ? Math.round((pt.filter((t) => t.estado === 'FINALIZADO').length / pt.length) * 100) : 0;
      }),
      backgroundColor: '#0052CC',
      borderRadius: 4,
      barThickness: 16,
    }],
  };

  const projectBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: {
        min: 0,
        max: 100,
        ticks: { font: { size: 10 }, callback: (v) => `${v}%` },
        grid: { color: '#F4F5F7' },
      },
      y: { ticks: { font: { size: 10 } }, grid: { display: false } },
    },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw}% completado` } },
    },
  };

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
        <h1 className="text-3xl font-extrabold text-[#172B4D]">
          ¡Hola, {user?.nombre?.split(' ')[0]}! 👋
        </h1>
        <p className="text-[#6B778C] text-base mt-1.5">
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
          items={enProgresoTasks}
          onItemClick={(t) => navigate(`/projects/${t.proyectoId}`)}
        />
        <StatCard
          icon={CheckSquare}
          label="Finalizadas"
          value={tasksByStatus.FINALIZADO}
          sub={`${tasks.length} tareas totales`}
          color="#00875A"
          items={finalizadasTasks}
          onItemClick={(t) => navigate(`/projects/${t.proyectoId}`)}
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
        {/* Task status doughnut */}
        <div className="bg-white rounded-xl border border-[#DFE1E6] p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-[#0052CC]" />
            <h2 className="font-semibold text-[#172B4D] text-base">Estado de tareas</h2>
          </div>
          {tasks.length === 0 ? (
            <p className="text-sm text-[#6B778C] text-center py-10">Sin tareas</p>
          ) : (
            <div className="flex-1" style={{ height: 250 }}>
              <Doughnut data={taskDoughnutData} options={doughnutOptions} />
            </div>
          )}
        </div>

        {/* My tasks */}
        <div className="bg-white rounded-xl border border-[#DFE1E6] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckSquare size={16} className="text-[#0052CC]" />
              <h2 className="font-semibold text-[#172B4D] text-base">Mis tareas</h2>
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
            <h2 className="font-semibold text-[#172B4D] text-base">Actividad reciente</h2>
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
              <h2 className="font-semibold text-[#172B4D] text-base">Proyectos recientes</h2>
            </div>
            <Link to="/projects" className="text-xs text-[#0052CC] hover:underline">Ver todos</Link>
          </div>
          {projectsSlice.length > 1 && (
            <div className="mb-5" style={{ height: projectsSlice.length * 34 + 10 }}>
              <Bar data={projectBarData} options={projectBarOptions} />
            </div>
          )}

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
