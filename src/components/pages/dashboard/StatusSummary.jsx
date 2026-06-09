import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { centerTextPlugin, statusDoughnutDataset, statusDoughnutOptions } from '../../../utils/chartConfig';

ChartJS.register(ArcElement, Tooltip, Legend);

// Doughnut con el reparto de tareas por estado.
export default function StatusSummary({ tasks }) {
  const [activeStatus, setActiveStatus] = useState(null);

  const counts = [
    tasks.filter((t) => t.estado === 'PENDIENTE').length,
    tasks.filter((t) => t.estado === 'EN_PROGRESO').length,
    tasks.filter((t) => t.estado === 'EN_REVISION').length,
    tasks.filter((t) => t.estado === 'FINALIZADO').length,
  ];

  const data = {
    labels: ['Pendiente', 'En progreso', 'En revisión', 'Finalizado'],
    datasets: [statusDoughnutDataset(counts, activeStatus)],
  };
  const options = statusDoughnutOptions(activeStatus, setActiveStatus);

  return (
    <div className="rounded-2xl border p-4 flex flex-col overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)', height: 420 }}>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={15} style={{ color: 'var(--primary)' }} />
        <h2 className="font-semibold text-[14px]" style={{ color: 'var(--text)' }}>Resumen de estado</h2>
      </div>
      {tasks.length === 0 ? (
        <p className="text-[13px] text-center py-8" style={{ color: 'var(--text-muted)' }}>Sin tareas registradas</p>
      ) : (
        <div className="flex-1 min-h-0" style={{ minHeight: 220 }}>
          <Doughnut data={data} options={options} plugins={[centerTextPlugin]} />
        </div>
      )}
    </div>
  );
}
