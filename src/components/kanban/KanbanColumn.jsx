import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';

const COL_CONFIG = {
  PENDIENTE:   { label: 'Pendiente',   accent: '#8B8B94' },
  EN_PROGRESO: { label: 'En progreso', accent: '#6E76F1' },
  EN_REVISION: { label: 'En revisión', accent: '#E0A82E' },
  FINALIZADO:  { label: 'Finalizado',  accent: '#3FB950' },
};

export default function KanbanColumn({
  status,
  tasks,
  subtareasByTask,
  comentariosByTask,
  onTaskClick,
  onAddTask,
  justFinishedId,
}) {
  const cfg = COL_CONFIG[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="kanban-col">
      {/* Header */}
      <div className="kanban-col-header flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full" style={{ background: cfg.accent, boxShadow: `0 0 8px ${cfg.accent}80` }} />
          <span className="text-[13px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>{cfg.label}</span>
          <span
            className="min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[11px] font-semibold"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
          >
            {tasks.length}
          </span>
        </div>
        <button onClick={onAddTask} className="icon-btn !w-7 !h-7" title={`Crear tarea en ${cfg.label}`}>
          <Plus size={16} />
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`kanban-col-body flex flex-col gap-2.5 ${isOver ? 'col-drop-active' : ''}`}
      >
        {tasks.length === 0 && !isOver && (
          <div
            className="flex items-center justify-center h-24 text-[12.5px] rounded-xl"
            style={{ color: 'var(--text-faint)', border: '1px dashed var(--border)' }}
          >
            Sin tareas
          </div>
        )}
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            subtareas={subtareasByTask[task.id] || []}
            comentarios={comentariosByTask[task.id] || []}
            onClick={() => onTaskClick(task)}
            justFinished={task.id === justFinishedId && status === 'FINALIZADO'}
          />
        ))}
      </div>
    </div>
  );
}
