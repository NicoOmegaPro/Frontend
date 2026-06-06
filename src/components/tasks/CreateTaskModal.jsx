import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';

const inp =
  'input-field w-full border border-[#DFE1E6] rounded-lg px-3 py-2 text-sm text-[#172B4D] placeholder-[#B3BAC5] bg-white';

export default function CreateTaskModal({ projectId, members, defaultStatus = 'PENDIENTE', onClose, onCreated }) {
  const { addToast } = useToast();
  const [users, setUsers] = useState(Array.isArray(members) ? members : []);
  const [sprints, setSprints] = useState([]);
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    estado: defaultStatus,
    prioridad: 'MEDIA',
    asignadoAId: '',
    sprintId: '',
    fechaVencimiento: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getSprints(projectId)
      .then((s) => setSprints(Array.isArray(s) ? s : []))
      .catch(() => setSprints([]));
    setUsers(Array.isArray(members) ? members : []);
  }, [projectId, members]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;
    setLoading(true);
    try {
      const created = await api.createTask({
        titulo: form.titulo,
        descripcion: form.descripcion || undefined,
        estado: form.estado,
        prioridad: form.prioridad,
        proyectoId: projectId,
        asignadoAId: form.asignadoAId ? parseInt(form.asignadoAId) : undefined,
        sprintId: form.sprintId ? parseInt(form.sprintId) : undefined,
        fechaVencimiento: form.fechaVencimiento || undefined,
      });
      addToast('Tarea creada correctamente', 'success');
      onCreated(created);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const ESTADOS = [
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'EN_PROGRESO', label: 'En progreso' },
    { value: 'EN_REVISION', label: 'En revisión' },
    { value: 'FINALIZADO', label: 'Finalizado' },
  ];

  const PRIORIDADES = [
    { value: 'BAJA', label: 'Baja' },
    { value: 'MEDIA', label: 'Media' },
    { value: 'ALTA', label: 'Alta' },
    { value: 'URGENTE', label: 'Urgente' },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 modal-backdrop">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg modal-center">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DFE1E6]">
          <h2 className="font-bold text-[#172B4D] text-base">Crear tarea</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F4F5F7] text-[#6B778C] hover:text-[#172B4D]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">
              Título *
            </label>
            <input
              type="text"
              value={form.titulo}
              onChange={set('titulo')}
              required
              autoFocus
              placeholder="¿Qué hay que hacer?"
              className={inp}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">
              Descripción
            </label>
            <textarea
              value={form.descripcion}
              onChange={set('descripcion')}
              placeholder="Detalles adicionales (opcional)"
              rows={3}
              className={`${inp} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">
                Estado
              </label>
              <select value={form.estado} onChange={set('estado')} className={inp}>
                {ESTADOS.map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">
                Prioridad
              </label>
              <select value={form.prioridad} onChange={set('prioridad')} className={inp}>
                {PRIORIDADES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">
                Asignar a
              </label>
              <select value={form.asignadoAId} onChange={set('asignadoAId')} className={inp}>
                <option value="">Sin asignar</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">
                Sprint
              </label>
              <select value={form.sprintId} onChange={set('sprintId')} className={inp}>
                <option value="">Sin sprint</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">
              Fecha de vencimiento
            </label>
            <input type="date" value={form.fechaVencimiento} onChange={set('fechaVencimiento')} className={inp} />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-[#DFE1E6] text-sm font-medium text-[#6B778C] hover:bg-[#F4F5F7] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
              style={{ background: 'var(--primary)' }}
            >
              {loading ? 'Creando...' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
