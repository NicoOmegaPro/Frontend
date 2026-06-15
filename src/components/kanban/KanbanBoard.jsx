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

// Los 4 estados = las 4 columnas del tablero, en este orden.
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
  const [activeTask, setActiveTask] = useState(null); // tarea que se está arrastrando ahora mismo (para el overlay)
  const [justFinishedId, setJustFinishedId] = useState(null); // id de la tarea recién finalizada (animación de celebración)

  // Sensor del ratón: solo empieza a arrastrar tras mover 6px (así un click normal no arrastra).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // Agrupo subtareas y comentarios por tareaId para pasárselos a cada tarjeta sin recalcular.
  const subtareasByTask = subtareas.reduce((acc, s) => {
    if (!acc[s.tareaId]) acc[s.tareaId] = []; //comprobamos que no exista el array para esa tarea, si no existe lo creamos
    acc[s.tareaId].push(s); // agregamos la subtarea al array de esa tarea
    return acc;
  }, {});

  const comentariosByTask = comentarios.reduce((acc, c) => {
    if (!acc[c.tareaId]) acc[c.tareaId] = []; //Lo mismo que con las subtareas, comprobamos que exista el array para comentarios, si no existe lo creamos
    acc[c.tareaId].push(c);
    return acc;
  }, {});

  // Al empezar a arrastrar: guardo la tarea para mostrarla en el DragOverlay.
  const handleDragStart = ({ active }) => {
    const task = tasks.find((t) => String(t.id) === String(active.id));
    setActiveTask(task || null);
  };

  // Al soltar: 'over' es la columna donde caí. Si es válida y distinta, cambio el estado.
  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;                          // soltó fuera de cualquier columna
    const targetStatus = over.id;               // el id de la columna ES el estado
    if (!ESTADOS.includes(targetStatus)) return;
    const task = tasks.find((t) => String(t.id) === String(active.id));
    if (!task) return;
    if (task.estado === targetStatus) return;   // no se movió de columna

    // Solo jefes y supervisores pueden mover una tarea a FINALIZADO.
    if (targetStatus === 'FINALIZADO' && !['JEFE_EQUIPO', 'SUPERVISOR'].includes(myTeamRole)) return;

    if (targetStatus === 'FINALIZADO') {
      setJustFinishedId(task.id);
      setTimeout(() => setJustFinishedId(null), 2400);
    }

    onStatusChange(task.id, targetStatus);
  };

  const handleDragCancel = () => setActiveTask(null);

  return (
    // DndContext envuelve todo el drag & drop y dispara los eventos onDrag*.
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/* Pinto una columna por estado, pasándole solo sus tareas */}
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

      {/* La "copia fantasma" que sigue al cursor mientras arrastras */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}