const STATES = ['PENDIENTE', 'EN_PROGRESO', 'EN_REVISION', 'FINALIZADO'];

const stateColors = {
  PENDIENTE: 'bg-yellow-50 border-yellow-200',
  EN_PROGRESO: 'bg-blue-50 border-blue-200',
  EN_REVISION: 'bg-purple-50 border-purple-200',
  FINALIZADO: 'bg-green-50 border-green-200',
};

const prioridadBg = {
  BAJA: 'bg-green-100 text-green-700',
  MEDIA: 'bg-yellow-100 text-yellow-700',
  ALTA: 'bg-orange-100 text-orange-700',
  URGENTE: 'bg-red-100 text-red-700',
};

function TaskCard({ task }) {
  return (
    <div className="bg-white border rounded p-3 shadow-xs hover:shadow-sm transition text-sm">
      <p className="font-medium text-gray-800">{task.titulo}</p>
      {task.descripcion && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.descripcion}</p>
      )}
      <div className="flex justify-between items-center mt-2">
        <span className={`text-xs px-2 py-1 rounded font-medium ${prioridadBg[task.prioridad] || 'bg-gray-100'}`}>
          {task.prioridad}
        </span>
        {task.proyecto && <span className="text-xs text-gray-400">{task.proyecto.nombre}</span>}
      </div>
    </div>
  );
}

export default function KanbanBoard({ tasks }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {STATES.map(state => (
        <div key={state} className={`border rounded ${stateColors[state]} min-h-96 p-4`}>
          <h3 className="font-semibold text-sm mb-4 text-gray-700">{state}</h3>
          <div className="space-y-3">
            {tasks.filter(t => t.estado === state).map(t => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
