import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';

const COL_CONFIG = {
  PENDIENTE: {
    label: 'Pendiente',
    headerColor: '#6B778C',
    dotColor: 'bg-gray-400',
    bg: '#F4F5F7',
  },
  EN_PROGRESO: {
    label: 'En progreso',
    headerColor: '#0052CC',
    dotColor: 'bg-blue-500',
    bg: '#EFF3FF',
  },
  EN_REVISION: {
    label: 'En revisión',
    headerColor: '#FF991F',
    dotColor: 'bg-orange-400',
    bg: '#FFFAE6',
  },
  FINALIZADO: {
    label: 'Finalizado',
    headerColor: '#00875A',
    dotColor: 'bg-green-500',
    bg: '#E3FCEF',
  },
};

export default function KanbanColumn({
  status,
  tasks,
  subtareasByTask,
  comentariosByTask,
  onTaskClick,
  onAddTask,
}) {
  const cfg = COL_CONFIG[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col flex-shrink-0" style={{ width: '270px', minWidth: '270px' }}>
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${cfg.dotColor}`} />
          <span className="text-sm font-semibold" style={{ color: cfg.headerColor }}>
            {cfg.label}
          </span>
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ background: `${cfg.headerColor}20`, color: cfg.headerColor }}
          >
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAddTask}
          className="p-1 rounded-md hover:bg-[#DFE1E6] text-[#6B778C] hover:text-[#172B4D] transition-colors"
          title={`Crear tarea en ${cfg.label}`}
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2.5 flex-1 rounded-xl p-2 min-h-64 transition-colors ${
          isOver ? 'col-drop-active' : ''
        }`}
        style={{ background: isOver ? `${cfg.headerColor}10` : cfg.bg }}
      >
        {tasks.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-24 text-[#B3BAC5] text-xs">
            Arrastra tareas aquí
          </div>
        )}
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            subtareas={subtareasByTask[task.id] || []}
            comentarios={comentariosByTask[task.id] || []}
            onClick={() => onTaskClick(task)}
          />
        ))}
      </div>
    </div>
  );
}
