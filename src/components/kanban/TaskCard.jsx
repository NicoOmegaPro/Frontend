import { useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { MessageSquare, CheckSquare, Paperclip, Calendar } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import Avatar from '../common/Avatar';

export const PRIORIDAD_CONFIG = {
  URGENTE: { color: '#F0556B', label: 'Urgente' },
  ALTA:    { color: '#FB923C', label: 'Alta'    },
  MEDIA:   { color: '#6E76F1', label: 'Media'   },
  BAJA:    { color: '#38BDF8', label: 'Baja'    },
};

function PriorityBadge({ prioridad }) {
  const pri = PRIORIDAD_CONFIG[prioridad] || PRIORIDAD_CONFIG.MEDIA;
  return (
    <span className="badge" style={{ background: `${pri.color}1f`, color: pri.color }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: pri.color }} />
      {pri.label}
    </span>
  );
}

// Versión simplificada de la tarjeta que se ve flotando mientras arrastras (el DragOverlay).
export function TaskCardOverlay({ task }) {
  return (
    <div className="surface drag-overlay p-3.5 w-[290px]">
      <p className="text-[14px] font-medium mb-2.5 line-clamp-2" style={{ color: 'var(--text)' }}>{task.titulo}</p>
      <PriorityBadge prioridad={task.prioridad} />
    </div>
  );
}

// Tarjeta de una tarea. Es el elemento "draggable" que se arrastra entre columnas.
export default function TaskCard({ task, onClick, subtareas = [], comentarios = [], justFinished = false }) {
  // useDraggable hace la tarjeta arrastrable:
  // setNodeRef = registra el nodo · attributes/listeners = enganchan el arrastre
  // transform = desplazamiento mientras arrastras · isDragging = si se está arrastrando
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(task.id),
    data: { task },
  });

  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    if (!justFinished) return;
    setCelebrating(true);
    const t = setTimeout(() => setCelebrating(false), 1900);
    return () => clearTimeout(t);
  }, [justFinished]);

  // Mueve la tarjeta con el cursor; mientras arrastras la oculto (opacity 0) porque
  // su "copia" la dibuja el DragOverlay.
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  // Contadores del pie: uso la lista cargada y, si no hay, el _count que manda el backend.
  const doneSubtasks = subtareas.filter((s) => s.completada).length;
  const totalSubtasks = subtareas.length || task._count?.subtareas || 0;
  const totalComentarios = comentarios.length || task._count?.comentarios || 0;
  const totalAdjuntos = task._count?.adjuntos || 0;

  const due = task.fechaVencimiento ? new Date(task.fechaVencimiento) : null;
  const vencida = due && task.estado !== 'FINALIZADO' && isPast(due) && !isToday(due); // isPast devuelve true si la fecha es anterior a hoy, pero también devuelve true si es hoy, por eso agrego !isToday(due) para que solo sea vencida si es anterior a hoy.
  const venceHoy = due && task.estado !== 'FINALIZADO' && isToday(due); // isToday devuelve true si la fecha es hoy, por eso no necesito agregar !isPast(due) porque si es hoy, no es vencida.

  return (
    // ref + attributes + listeners = lo que conecta este div con el drag de dnd-kit
    <div
      ref={setNodeRef}
      style={style}
      className="task-card surface p-3.5 select-none relative"
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      {celebrating && <div className="celebrate-overlay" />}

      {task.etiquetas && task.etiquetas.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {task.etiquetas.slice(0, 4).map((te) => {
            const color = te.etiqueta?.color || 'var(--border-strong)';
            return (
              <span
                key={te.etiquetaId}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-semibold"
                style={{ background: `${color}1f`, color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                {te.etiqueta?.nombre}
              </span>
            );
          })}
        </div>
      )}

      <p className="text-[14px] font-medium mb-3 line-clamp-3 leading-snug" style={{ color: 'var(--text)' }}>
        {task.titulo}
      </p>

      <div className="flex items-center justify-between gap-2 mb-3">
        <PriorityBadge prioridad={task.prioridad} />
        {task.proyecto?.nombre && (
          <span className="text-[11px] truncate max-w-[110px]" style={{ color: 'var(--text-faint)' }}>{task.proyecto.nombre}</span>
        )}
      </div>

      {due && (
        <div
          className="inline-flex items-center gap-1.5 mb-3 px-2 py-1 rounded-md text-[11px] font-medium"
          style={{
            background: vencida ? 'rgba(240,85,107,.14)' : venceHoy ? 'rgba(224,168,46,.14)' : 'var(--bg-secondary)',
            color: vencida ? '#F0556B' : venceHoy ? '#E0A82E' : 'var(--text-muted)',
          }}
          title={vencida ? 'Tarea vencida' : venceHoy ? 'Vence hoy' : 'Fecha de vencimiento'}
        >
          <Calendar size={12} />
          {vencida ? 'Vencida · ' : venceHoy ? 'Hoy · ' : ''}
          {format(due, 'dd MMM', { locale: es })}
        </div>
      )}

      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          {totalSubtasks > 0 && (
            <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <CheckSquare size={13} />
              <span className="text-[11.5px] font-medium">
                {subtareas.length ? `${doneSubtasks}/${totalSubtasks}` : totalSubtasks}
              </span>
            </div>
          )}
          {totalComentarios > 0 && (
            <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <MessageSquare size={13} />
              <span className="text-[11.5px] font-medium">{totalComentarios}</span>
            </div>
          )}
          {totalAdjuntos > 0 && (
            <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <Paperclip size={13} />
              <span className="text-[11.5px] font-medium">{totalAdjuntos}</span>
            </div>
          )}
        </div>

        {task.asignadoA && <Avatar user={task.asignadoA} size={24} />}
      </div>
    </div>
  );
}
