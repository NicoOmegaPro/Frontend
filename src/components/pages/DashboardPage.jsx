import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, FilePlus2, CalendarClock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import StatCard from './dashboard/StatCard';
import StatusSummary from './dashboard/StatusSummary';
import MyTasks from './dashboard/MyTasks';
import RecentActivity from './dashboard/RecentActivity';
import ProjectsSection from './dashboard/ProjectsSection';

// Una semana en milisegundos (para comparar fechas con Date.now()).
const WEEK = 7 * 24 * 60 * 60 * 1000;

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Las 3 llamadas a la vez; cada una con su .catch para que un fallo no tumbe el dashboard.
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

  const now = Date.now();
  // Creadas en los últimos 7 días (entre hace una semana y ahora).
  const creadasRecientes = tasks.filter((t) => {
    if (!t.createdAt) return false;
    const c = new Date(t.createdAt).getTime();
    return c <= now && now - c <= WEEK;
  });
  // Vencen en los próximos 7 días y aún no están finalizadas.
  const vencenPronto = tasks.filter((t) => {
    if (!t.fechaVencimiento || t.estado === 'FINALIZADO') return false;
    const v = new Date(t.fechaVencimiento).getTime();
    return v >= now && v - now <= WEEK;
  });
  // Urgentes sin terminar, mías o sin asignar (== null compara null y undefined a la vez).
  const tareasUrgentes = tasks.filter(
    (t) =>
      t.prioridad === 'URGENTE' &&
      t.estado !== 'FINALIZADO' &&
      (t.asignadoAId == null || t.asignadoAId === user?.id)
  );

  const activeProjectsList = projects.filter((p) => p.estado === 'ACTIVO');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-9 h-9 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Saludo */}
      <div>
        <h1 className="text-[32px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          Hola, {user?.nombre?.split(' ')[0]}
        </h1>
        <p className="text-[15px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
          Tu actividad y la de tu equipo, en un vistazo.
        </p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={FolderKanban}
          label="Proyectos activos"
          value={activeProjectsList.length}
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

      {/* Gráfica de estado + mis tareas + actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatusSummary tasks={tasks} />
        <MyTasks tasks={tasks} userId={user?.id} onTaskClick={(t) => navigate(`/projects/${t.proyectoId}`)} />
        <RecentActivity historial={historial} />
      </div>

      {/* Proyectos */}
      {projects.length > 0 && (
        <ProjectsSection projects={projects} tasks={tasks} onProjectClick={(p) => navigate(`/projects/${p.id}`)} />
      )}
    </div>
  );
}
