import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { pointerOnHover, centerTextPlugin, statusDoughnutDataset, statusDoughnutOptions } from '../../../utils/chartConfig';

// Chart.js es modular: hay que "registrar" las piezas que se usan (barras + doughnut)
// o no se dibujan. Esto se hace una vez al cargar el módulo.
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const CHART_GRID = 'rgba(255,255,255,0.06)';
const CHART_TICK = '#8B8B94';

// Las dos gráficas del proyecto: tareas por prioridad y por estado.
export default function ProjectCharts({ tasks, activeStatus, setActiveStatus }) {
  const priorityBarData = {
    labels: ['Urgente', 'Alta', 'Media', 'Baja'],
    datasets: [{
      label: 'Tareas',
      data: [
        tasks.filter((t) => t.prioridad === 'URGENTE').length,
        tasks.filter((t) => t.prioridad === 'ALTA').length,
        tasks.filter((t) => t.prioridad === 'MEDIA').length,
        tasks.filter((t) => t.prioridad === 'BAJA').length,
      ],
      backgroundColor: ['#F0556B', '#FB923C', '#6E76F1', '#38BDF8'],
      borderRadius: 8,
      barThickness: 48,
    }],
  };

  const priorityBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onHover: pointerOnHover,
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 12 }, color: CHART_TICK } },
      y: { ticks: { font: { size: 12 }, stepSize: 1, color: CHART_TICK }, grid: { color: CHART_GRID } },
    },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw} tarea${ctx.raw !== 1 ? 's' : ''}` } },
    },
  };

  const statusDoughnutData = {
    labels: ['Pendiente', 'En progreso', 'En revisión', 'Finalizado'],
    datasets: [
      statusDoughnutDataset(
        [
          tasks.filter((t) => t.estado === 'PENDIENTE').length,
          tasks.filter((t) => t.estado === 'EN_PROGRESO').length,
          tasks.filter((t) => t.estado === 'EN_REVISION').length,
          tasks.filter((t) => t.estado === 'FINALIZADO').length,
        ],
        activeStatus
      ),
    ],
  };

  const statusDoughnutOpts = statusDoughnutOptions(activeStatus, setActiveStatus, 'Tareas', '95%');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-white rounded-2xl border border-[#DFE1E6] p-5">
        <p className="text-xs font-bold text-[#6B778C] uppercase tracking-wide mb-3">Por prioridad</p>
        <div style={{ height: 230 }}>
          <Bar data={priorityBarData} options={priorityBarOptions} />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-[#DFE1E6] p-5">
        <p className="text-xs font-bold text-[#6B778C] uppercase tracking-wide mb-3">Por estado</p>
        <div style={{ height: 230 }}>
          <Doughnut data={statusDoughnutData} options={statusDoughnutOpts} plugins={[centerTextPlugin]} />
        </div>
      </div>
    </div>
  );
}
