import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  rectIntersection,
} from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';
import { TaskCardOverlay } from './TaskCard';

const ESTADOS = ['PENDIENTE', 'EN_PROGRESO', 'EN_REVISION', 'FINALIZADO'];

export default function KanbanBoard({
  tasks,
  subtareas,
  comentarios,
  onStatusChange,
  onTaskClick,
  onAddTask,
  myTeamRole,
}) {
  const [activeTask, setActiveTask] = useState(null);
  const [justFinishedId, setJustFinishedId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const subtareasByTask = subtareas.reduce((acc, s) => {
    if (!acc[s.tareaId]) acc[s.tareaId] = [];
    acc[s.tareaId].push(s);
    return acc;
  }, {});

  const comentariosByTask = comentarios.reduce((acc, c) => {
    if (!acc[c.tareaId]) acc[c.tareaId] = [];
    acc[c.tareaId].push(c);
    return acc;
  }, {});

  const handleDragStart = ({ active }) => {
    const task = tasks.find((t) => String(t.id) === String(active.id));
    setActiveTask(task || null);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;
    const targetStatus = over.id;
    if (!ESTADOS.includes(targetStatus)) return;
    const task = tasks.find((t) => String(t.id) === String(active.id));
    if (!task) return;
    if (task.estado === targetStatus) return;

    if (targetStatus === 'FINALIZADO' && !['JEFE_EQUIPO', 'SUPERVISOR'].includes(myTeamRole)) return;

    if (targetStatus === 'FINALIZADO') {
      setJustFinishedId(task.id);
      setTimeout(() => setJustFinishedId(null), 2400);
    }

    onStatusChange(task.id, targetStatus);
  };

  const handleDragCancel = () => setActiveTask(null);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
        {ESTADOS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasks.filter((t) => t.estado === status)}
            subtareasByTask={subtareasByTask}
            comentariosByTask={comentariosByTask}
            onTaskClick={onTaskClick}
            onAddTask={() => onAddTask(status)}
            justFinishedId={justFinishedId}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
