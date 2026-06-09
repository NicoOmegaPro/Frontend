import { Zap } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SprintBadge({ sprint }) {
  if (!sprint) return null;
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-[#DEEBFF] rounded-full">
      <Zap size={12} className="text-[#0052CC]" />
      <span className="text-xs font-semibold text-[#0052CC]">{sprint.nombre}</span>
      {sprint.fechaFin && (
        <span className="text-[10px] text-[#5E6C84]">
          · {format(new Date(sprint.fechaFin), 'dd MMM', { locale: es })}
        </span>
      )}
    </div>
  );
}
