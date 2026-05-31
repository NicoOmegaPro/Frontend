import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';
import { useTheme } from '../../context/ThemeContext';

const COL_CONFIG = {
  PENDIENTE: {
    label: 'Pendiente',
    accent: '#7A869A',
    light: { body: '#F1F2F5', border: '#D7DAE0' },
    dark:  { body: 'rgba(122,134,154,0.10)', border: 'rgba(122,134,154,0.40)' },
  },
  EN_PROGRESO: {
    label: 'En progreso',
    accent: '#0065FF',
    light: { body: '#EAF1FF', border: '#B3D0FF' },
    dark:  { body: 'rgba(90,156,248,0.12)', border: 'rgba(90,156,248,0.45)' },
  },
  EN_REVISION: {
    label: 'En revisión',
    accent: '#FF991F',
    light: { body: '#FFF6E6', border: '#FFD699' },
    dark:  { body: 'rgba(232,169,43,0.12)', border: 'rgba(232,169,43,0.45)' },
  },
  FINALIZADO: {
    label: 'Finalizado',
    accent: '#00C781',
    light: { body: '#E6FAF1', border: '#9FE9CB' },
    dark:  { body: 'rgba(69,210,104,0.12)', border: 'rgba(69,210,104,0.45)' },
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
  const { dark } = useTheme();
  const palette = dark ? cfg.dark : cfg.light;
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="kanban-col">
      {/* Accent bar */}
      <div
        className="h-1.5 rounded-full mb-2.5"
        style={{ background: cfg.accent }}
      />

      {/* Column header */}
      <div className="kanban-col-header flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="w-3 h-3 rounded-full"
            style={{ background: cfg.accent }}
          />
          <span className="text-base font-bold" style={{ color: cfg.accent }}>
            {cfg.label}
          </span>
          <span
            className="min-w-6 h-6 px-1.5 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: `${cfg.accent}26`, color: cfg.accent }}
          >
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAddTask}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: cfg.accent, background: `${cfg.accent}14` }}
          title={`Crear tarea en ${cfg.label}`}
        >
          <Plus size={17} />
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`kanban-col-body flex flex-col gap-3 ${isOver ? 'col-drop-active' : ''}`}
        style={{
          background: isOver ? `${cfg.accent}1f` : palette.body,
          borderColor: isOver ? cfg.accent : palette.border,
        }}
      >
        {tasks.length === 0 && !isOver && (
          <div
            className="flex items-center justify-center h-28 text-sm rounded-xl border-2 border-dashed"
            style={{ color: cfg.accent, borderColor: `${cfg.accent}40`, opacity: 0.7 }}
          >
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
