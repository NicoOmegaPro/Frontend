import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { MessageSquare, Paperclip, CheckSquare } from 'lucide-react';

const PRIORIDAD_CONFIG = {
  URGENTE: { color: '#DE350B', bg: '#FFEBE6', label: 'Urgente' },
  ALTA: { color: '#FF5630', bg: '#FFF0E6', label: 'Alta' },
  MEDIA: { color: '#0065FF', bg: '#DEEBFF', label: 'Media' },
  BAJA: { color: '#00B8D9', bg: '#E6FCFF', label: 'Baja' },
};

const PRI_DOT = {
  URGENTE: 'bg-red-500',
  ALTA: 'bg-orange-500',
  MEDIA: 'bg-blue-500',
  BAJA: 'bg-cyan-400',
};

export function TaskCardOverlay({ task }) {
  const pri = PRIORIDAD_CONFIG[task.prioridad] || PRIORIDAD_CONFIG.MEDIA;
  return (
    <div className="bg-white rounded-lg border border-[#DFE1E6] p-3 shadow-2xl drag-overlay w-64">
      <p className="text-sm font-medium text-[#172B4D] mb-2 line-clamp-2">{task.titulo}</p>
      <span
        className="badge"
        style={{ background: pri.bg, color: pri.color }}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${PRI_DOT[task.prioridad]}`} />
        {pri.label}
      </span>
    </div>
  );
}

export default function TaskCard({ task, onClick, subtareas = [], comentarios = [] }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(task.id),
    data: { task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  const pri = PRIORIDAD_CONFIG[task.prioridad] || PRIORIDAD_CONFIG.MEDIA;
  const doneSubtasks = subtareas.filter((s) => s.completada).length;
  const totalSubtasks = subtareas.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="task-card bg-white rounded-lg border border-[#DFE1E6] p-3 select-none"
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      {/* Labels row */}
      {task.etiquetas && task.etiquetas.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.etiquetas.slice(0, 3).map((te) => (
            <span
              key={te.etiquetaId}
              className="h-1.5 w-8 rounded-full"
              style={{ background: te.etiqueta?.color || '#DFE1E6' }}
            />
          ))}
        </div>
      )}

      {/* Title */}
      <p className="text-sm font-medium text-[#172B4D] mb-2 line-clamp-3 leading-snug">
        {task.titulo}
      </p>

      {/* Priority + project */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="badge"
          style={{ background: pri.bg, color: pri.color }}
        >
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRI_DOT[task.prioridad]}`} />
          {pri.label}
        </span>
        {task.proyecto?.nombre && (
          <span className="text-[10px] text-[#6B778C] truncate max-w-20">{task.proyecto.nombre}</span>
        )}
      </div>

      {/* Bottom row: subtasks / comments / assignee */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F4F5F7]">
        <div className="flex items-center gap-2.5">
          {totalSubtasks > 0 && (
            <div className="flex items-center gap-1 text-[#6B778C]">
              <CheckSquare size={11} />
              <span className="text-[10px] font-medium">{doneSubtasks}/{totalSubtasks}</span>
            </div>
          )}
          {comentarios.length > 0 && (
            <div className="flex items-center gap-1 text-[#6B778C]">
              <MessageSquare size={11} />
              <span className="text-[10px] font-medium">{comentarios.length}</span>
            </div>
          )}
        </div>

        {task.asignadoA && (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
            style={{ background: 'var(--primary)' }}
            title={task.asignadoA.nombre}
          >
            {task.asignadoA.nombre?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}
