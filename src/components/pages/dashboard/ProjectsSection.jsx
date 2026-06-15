import { FolderKanban } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { pointerOnHover, CHART_GRID, CHART_TICK } from '../../../utils/chartConfig';
import Pagination, { useClientPagination } from '../../common/Pagination';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Bloque de proyectos: barra de % completado + tarjetas paginadas.
export default function ProjectsSection({ projects, tasks, onProjectClick }) {
  const projectsSlice = projects.slice(0, 6);
  const projectsPg = useClientPagination(projects, 6);

  const projectBarData = {
    labels: projectsSlice.map((p) => p.nombre.length > 16 ? p.nombre.slice(0, 16) + '…' : p.nombre),
    datasets: [{
      label: '% completado',
      data: projectsSlice.map((p) => {
        const pt = tasks.filter((t) => t.proyectoId === p.id);
        return pt.length ? Math.round((pt.filter((t) => t.estado === 'FINALIZADO').length / pt.length) * 100) : 0; // Porcentaje de tareas completadas
      }),
      backgroundColor: '#6E76F1',
      borderRadius: 6,
      barThickness: 16,
    }],
  };

  const projectBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y', // Horizontal bar chart
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

  return (
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
              onClick={() => onProjectClick(p)}
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
  );
}
