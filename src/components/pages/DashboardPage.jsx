import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FolderKanban, FilePlus2, CalendarClock, AlertCircle, TrendingUp, Activity, CheckSquare } from 'lucide-react';
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

import { pointerOnHover, CHART_GRID, CHART_TICK, centerTextPlugin, statusDoughnutDataset, statusDoughnutOptions } from '../../utils/chartConfig';
import Pagination, { useClientPagination } from '../common/Pagination';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const ESTADO_COLOR = {
  PENDIENTE: '#8B8B94',
  EN_PROGRESO: '#6E76F1',
  EN_REVISION: '#E0A82E',
  FINALIZADO: '#3FB950',
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
    <div
      className="rounded-2xl p-6 border flex flex-col gap-4 hover:shadow-xl transition-all"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}1a` }}
        >
          <Icon size={28} style={{ color }} />
        </div>
        <div>
          <p className="text-[44px] font-extrabold leading-none" style={{ color: 'var(--text)' }}>{value}</p>
          <p className="text-[15px] font-semibold mt-1.5" style={{ color: 'var(--text)' }}>{label}</p>
          {sub && <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
        </div>
      </div>

      {items && items.length > 0 && (
        <ul className="space-y-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          {items.slice(0, 3).map((t) => (
            <li
              key={t.id}
              onClick={() => onItemClick?.(t)}
              className="flex items-center gap-2 text-[13px] truncate cursor-pointer transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}
              title={t.titulo}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="truncate">{t.titulo}</span>
            </li>
          ))}
          {items.length > 3 && (
            <li className="text-xs pl-3.5" style={{ color: 'var(--text-faint)' }}>+{items.length - 3} más</li>
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
  const [activeStatus, setActiveStatus] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getProjects().catch(() => []),
      api.getTasks().catch(() => []),
      api.getHistorial({ limit: 60 }).catch(() => ({ items: [] })),
    ]).then(([p, t, h]) => {
      setProjects(Array.isArray(p) ? p : []);
      setTasks(Array.isArray(t) ? t : []);
      setHistorial(Array.isArray(h?.items) ? h.items : []);
    }).finally(() => setLoading(false));
  }, []);

  const myTasks = tasks.filter((t) => t.asignadoAId === user?.id);
  const enProgresoTasks = tasks.filter((t) => t.estado === 'EN_PROGRESO');
  const finalizadasTasks = tasks.filter((t) => t.estado === 'FINALIZADO');

  const now = Date.now();
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  const creadasRecientes = tasks.filter((t) => {
    if (!t.createdAt) return false;
    const c = new Date(t.createdAt).getTime();
    return c <= now && now - c <= WEEK;
  });
  const vencenPronto = tasks.filter((t) => {
    if (!t.fechaVencimiento || t.estado === 'FINALIZADO') return false;
    const v = new Date(t.fechaVencimiento).getTime();
    return v >= now && v - now <= WEEK;
  });

  const tasksByStatus = {
    PENDIENTE: tasks.filter((t) => t.estado === 'PENDIENTE').length,
    EN_PROGRESO: enProgresoTasks.length,
    EN_REVISION: tasks.filter((t) => t.estado === 'EN_REVISION').length,
    FINALIZADO: finalizadasTasks.length,
  };
  const activeProjectsList = projects.filter((p) => p.estado === 'ACTIVO');
  const activeProjects = activeProjectsList.length;

  const tareasUrgentes = tasks.filter(
    (t) =>
      t.prioridad === 'URGENTE' &&
      t.estado !== 'FINALIZADO' &&
      (t.asignadoAId == null || t.asignadoAId === user?.id)
  );

  const projectsSlice = projects.slice(0, 6);

  const myTasksPg = useClientPagination(myTasks, 6);
  const activityPg = useClientPagination(historial, 6);
  const projectsPg = useClientPagination(projects, 6);

  const taskDoughnutData = {
    labels: ['Pendiente', 'En progreso', 'En revisión', 'Finalizado'],
    datasets: [
      statusDoughnutDataset(
        [tasksByStatus.PENDIENTE, tasksByStatus.EN_PROGRESO, tasksByStatus.EN_REVISION, tasksByStatus.FINALIZADO],
        activeStatus
      ),
    ],
  };

  const doughnutOptions = statusDoughnutOptions(activeStatus, setActiveStatus);

  const projectBarData = {
    labels: projectsSlice.map((p) => p.nombre.length > 16 ? p.nombre.slice(0, 16) + '…' : p.nombre),
    datasets: [{
      label: '% completado',
      data: projectsSlice.map((p) => {
        const pt = tasks.filter((t) => t.proyectoId === p.id);
        return pt.length ? Math.round((pt.filter((t) => t.estado === 'FINALIZADO').length / pt.length) * 100) : 0;
      }),
      backgroundColor: '#6E76F1',
      borderRadius: 6,
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
        ticks: { font: { size: 11 }, callback: (v) => `${v}%`, color: CHART_TICK },
        grid: { color: CHART_GRID },
      },
      y: { ticks: { font: { size: 11 }, color: CHART_TICK }, grid: { display: false } },
    },
    onHover: pointerOnHover,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw}% completado` } },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-9 h-9 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {}
      <div>
        <h1 className="text-[32px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          Hola, {user?.nombre?.split(' ')[0]}
        </h1>
        <p className="text-[15px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
          Tu actividad y la de tu equipo, en un vistazo.
        </p>
      </div>

      {}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={FolderKanban}
          label="Proyectos activos"
          value={activeProjects}
          sub={null}
          color="#6E76F1"
          items={activeProjectsList.map((p) => ({ id: p.id, titulo: p.nombre }))}
          onItemClick={(p) => navigate(`/projects/${p.id}`)}
        />
        <StatCard
          icon={FilePlus2}
          label="Tareas creadas"
          value={creadasRecientes.length}
          sub="en los últimos 7 días"
          color="#3FB950"
          items={creadasRecientes}
          onItemClick={(t) => navigate(`/projects/${t.proyectoId}`)}
        />
        <StatCard
          icon={CalendarClock}
          label="Vencen pronto"
          value={vencenPronto.length}
          sub="en los próximos 7 días"
          color="#E0A82E"
          items={vencenPronto}
          onItemClick={(t) => navigate(`/projects/${t.proyectoId}`)}
        />
        <StatCard
          icon={AlertCircle}
          label="Tareas urgentes"
          value={tareasUrgentes.length}
          sub="asignadas a ti o sin asignar"
          color="#F0556B"
          items={tareasUrgentes}
          onItemClick={(t) => navigate(`/projects/${t.proyectoId}`)}
        />
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {}
        <div className="rounded-2xl border p-4 flex flex-col overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)', height: 420 }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={15} style={{ color: 'var(--primary)' }} />
            <h2 className="font-semibold text-[14px]" style={{ color: 'var(--text)' }}>Resumen de estado</h2>
          </div>
          {tasks.length === 0 ? (
            <p className="text-[13px] text-center py-8" style={{ color: 'var(--text-muted)' }}>Sin tareas registradas</p>
          ) : (
            <div className="flex-1 min-h-0" style={{ minHeight: 220 }}>
              <Doughnut data={taskDoughnutData} options={doughnutOptions} plugins={[centerTextPlugin]} />
            </div>
          )}
        </div>

        {}
        <div className="rounded-2xl border p-4 flex flex-col overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)', height: 420 }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckSquare size={15} style={{ color: 'var(--primary)' }} />
              <h2 className="font-semibold text-[14px]" style={{ color: 'var(--text)' }}>Mis tareas</h2>
            </div>
            <Link to="/projects" className="text-[12px] font-medium hover:underline" style={{ color: 'var(--primary-hover)' }}>
              Ver todas
            </Link>
          </div>
          {myTasks.length === 0 ? (
            <p className="text-[13px] text-center py-6" style={{ color: 'var(--text-muted)' }}>
              No tienes tareas asignadas
            </p>
          ) : (
            <>
              <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
                {myTasksPg.pageItems.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => navigate(`/projects/${t.proyectoId}`)}
                    className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors group"
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: ESTADO_COLOR[t.estado] }}
                    />
                    <span className="text-[13px] truncate flex-1 group-hover:underline" style={{ color: 'var(--text)' }}>
                      {t.titulo}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                      style={{ background: `${ESTADO_COLOR[t.estado]}20`, color: ESTADO_COLOR[t.estado] }}
                    >
                      {ESTADO_LABEL[t.estado]}
                    </span>
                  </div>
                ))}
              </div>
              <Pagination page={myTasksPg.page} pages={myTasksPg.pages} onChange={myTasksPg.setPage} className="flex-shrink-0" />
            </>
          )}
        </div>

        {}
        <div className="rounded-2xl border p-4 flex flex-col overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)', height: 420 }}>
          <div className="flex items-center gap-2 mb-3">
            <Activity size={15} style={{ color: 'var(--primary)' }} />
            <h2 className="font-semibold text-[14px]" style={{ color: 'var(--text)' }}>Actividad reciente</h2>
          </div>
          {historial.length === 0 ? (
            <p className="text-[13px] text-center py-6" style={{ color: 'var(--text-muted)' }}>Sin actividad reciente</p>
          ) : (
            <>
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
                {activityPg.pageItems.map((h) => (
                  <div key={h.id} className="flex gap-2 items-start">
                    <span className="text-[14px] flex-shrink-0 mt-0.5">{ACCION_ICON[h.accion] || '📌'}</span>
                    <div className="min-w-0">
                      <p className="text-[12px]" style={{ color: 'var(--text)' }}>
                        <span className="font-semibold">{h.usuario?.nombre || 'Usuario'}</span>{' '}
                        {h.detalles || `${h.accion.toLowerCase()} ${h.entidadTipo.toLowerCase()}`}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                        {formatDistanceToNow(new Date(h.fecha), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination page={activityPg.page} pages={activityPg.pages} onChange={activityPg.setPage} className="flex-shrink-0" />
            </>
          )}
        </div>
      </div>

      {}
      {projects.length > 0 && (
        <div className="rounded-2xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <FolderKanban size={18} style={{ color: 'var(--primary)' }} />
              <h2 className="font-semibold text-[16px]" style={{ color: 'var(--text)' }}>Proyectos</h2>
            </div>
            <Link to="/projects" className="text-[13px] font-medium hover:underline" style={{ color: 'var(--primary-hover)' }}>
              Ver todos
            </Link>
          </div>
          {projectsSlice.length > 1 && (
            <div className="mb-6" style={{ height: projectsSlice.length * 36 + 10 }}>
              <Bar data={projectBarData} options={projectBarOptions} />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectsPg.pageItems.map((p) => {
              const projectTasks = tasks.filter((t) => t.proyectoId === p.id);
              const done = projectTasks.filter((t) => t.estado === 'FINALIZADO').length;
              const pct = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="p-5 rounded-xl border cursor-pointer transition-all group hover:shadow-md"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: 'var(--primary)' }}
                    >
                      {p.nombre.charAt(0).toUpperCase()}
                    </span>
                    <span className="font-semibold text-[14px] truncate group-hover:underline" style={{ color: 'var(--text)' }}>
                      {p.nombre}
                    </span>
                  </div>
                  <p className="text-[12px] mb-4 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                    {p.descripcion || 'Sin descripción'}
                  </p>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] mt-2" style={{ color: 'var(--text-faint)' }}>
                    <span>{projectTasks.length} tareas</span>
                    <span>{pct}% completado</span>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination page={projectsPg.page} pages={projectsPg.pages} onChange={projectsPg.setPage} total={projects.length} label="proyectos" />
        </div>
      )}
    </div>
  );
}
