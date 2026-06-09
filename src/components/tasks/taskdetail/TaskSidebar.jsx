import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Avatar from '../../common/Avatar';
import SelectDropdown from './SelectDropdown';
import { PropLabel, Divider } from './ui';
import { ESTADOS, PRIORIDADES, ESTADO_STYLE, PRI_STYLE } from './constants';

// Columna derecha del modal: estado, prioridad, etiquetas, asignación, etc.
export default function TaskSidebar({
  task,
  etiquetas,
  sprints,
  users,
  subtareas,
  subtasksDone,
  subtasksPct,
  isOverdue,
  onUpdate,
  onToggleEtiqueta,
}) {
  return (
    <div
      className="w-60 flex-shrink-0 border-l overflow-y-auto px-5 py-6 space-y-5"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
    >
      <div>
        <PropLabel>Estado</PropLabel>
        <SelectDropdown
          value={task.estado}
          options={ESTADOS}
          onChange={(v) => onUpdate({ estado: v })}
          renderValue={(v) => { const s = ESTADO_STYLE[v]; return <span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>; }}
          renderOption={(v) => { const s = ESTADO_STYLE[v]; return <span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>; }}
        />
      </div>

      <div>
        <PropLabel>Prioridad</PropLabel>
        <SelectDropdown
          value={task.prioridad}
          options={PRIORIDADES}
          onChange={(v) => onUpdate({ prioridad: v })}
          renderValue={(v) => { const p = PRI_STYLE[v]; return <span className="badge" style={{ background: p.bg, color: p.color }}><span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />{p.label}</span>; }}
          renderOption={(v) => { const p = PRI_STYLE[v]; return <span className="badge" style={{ background: p.bg, color: p.color }}><span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />{p.label}</span>; }}
        />
      </div>

      <div>
        <PropLabel>Etiquetas</PropLabel>
        <div className="flex flex-wrap gap-1.5">
          {etiquetas.map((et) => {
            const active = (task.etiquetas || []).some((te) => te.etiquetaId === et.id);
            return (
              <button
                key={et.id}
                onClick={() => onToggleEtiqueta(et.id)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all"
                style={active
                  ? { background: `${et.color}22`, color: et.color, boxShadow: `inset 0 0 0 1px ${et.color}` }
                  : { background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                title={active ? 'Quitar etiqueta' : 'Añadir etiqueta'}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: et.color }} />
                {et.nombre}
              </button>
            );
          })}
          {etiquetas.length === 0 && (
            <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>No hay etiquetas</span>
          )}
        </div>
      </div>

      <div>
        <PropLabel>Asignado a</PropLabel>
        <div className="flex items-center gap-2">
          {task.asignadoA && <Avatar user={task.asignadoA} size={26} />}
          <select
            value={task.asignadoAId || ''}
            onChange={(e) => onUpdate({ asignadoAId: e.target.value ? parseInt(e.target.value) : null })}
            className="flex-1 min-w-0 rounded-lg px-2.5 py-2 text-xs border focus:outline-none"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text)', colorScheme: 'dark' }}
          >
            <option value="">Sin asignar</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <PropLabel>Sprint</PropLabel>
        <select
          value={task.sprintId || ''}
          onChange={(e) => onUpdate({ sprintId: e.target.value ? parseInt(e.target.value) : null })}
          className="w-full rounded-lg px-2.5 py-2 text-xs border focus:outline-none"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text)', colorScheme: 'dark' }}
        >
          <option value="">Sin sprint</option>
          {sprints.map((s) => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>
      </div>

      <div>
        <PropLabel>Vencimiento</PropLabel>
        <input
          type="date"
          value={task.fechaVencimiento ? format(new Date(task.fechaVencimiento), 'yyyy-MM-dd') : ''}
          onChange={(e) => onUpdate({ fechaVencimiento: e.target.value || null })}
          className="w-full rounded-lg px-2.5 py-2 text-xs border focus:outline-none"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: isOverdue ? '#F0556B' : 'var(--border)',
            color: isOverdue ? '#F0556B' : 'var(--text)',
            colorScheme: 'dark',
          }}
        />
        {isOverdue && (
          <p className="text-[10px] mt-1 font-semibold" style={{ color: '#F0556B' }}>⚠ Vencida</p>
        )}
      </div>

      <Divider />

      <div>
        <PropLabel>Proyecto</PropLabel>
        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{task.proyecto?.nombre || '—'}</p>
      </div>

      {subtareas.length > 0 && (
        <div>
          <PropLabel>Progreso</PropLabel>
          <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${subtasksPct}%`, background: 'var(--primary)' }} />
          </div>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {subtasksDone}/{subtareas.length} subtareas · {subtasksPct}%
          </p>
        </div>
      )}

      {task.createdAt && (
        <div>
          <PropLabel>Creado</PropLabel>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {format(new Date(task.createdAt), 'dd MMM yyyy', { locale: es })}
          </p>
        </div>
      )}
    </div>
  );
}
