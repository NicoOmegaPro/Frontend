import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';

const inp =
  'input-field w-full border border-[#DFE1E6] rounded-lg px-3 py-2 text-sm text-[#172B4D] placeholder-[#B3BAC5] bg-white';

export default function CreateProjectModal({ onClose, onCreated }) {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    liderId: '',
    equipoId: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.getUsers().catch(() => []), api.getEquipos().catch(() => [])]).then(([u, e]) => {
      setUsers(Array.isArray(u) ? u : []);
      setEquipos(Array.isArray(e) ? e : []);
    });
  }, []);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    setLoading(true);
    try {
      await api.createProject({
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        liderId: form.liderId ? parseInt(form.liderId) : undefined,
        equipoId: form.equipoId ? parseInt(form.equipoId) : undefined,
      });
      addToast('Proyecto creado correctamente', 'success');
      onCreated();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 modal-backdrop">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md modal-center">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DFE1E6]">
          <h2 className="font-bold text-[#172B4D] text-base">Crear proyecto</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F4F5F7] text-[#6B778C] hover:text-[#172B4D]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">
              Nombre *
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={set('nombre')}
              required
              placeholder="Nombre del proyecto"
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
              placeholder="Descripción del proyecto (opcional)"
              rows={3}
              className={`${inp} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">
                Líder
              </label>
              <select value={form.liderId} onChange={set('liderId')} className={inp}>
                <option value="">Sin asignar</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">
                Equipo
              </label>
              <select value={form.equipoId} onChange={set('equipoId')} className={inp}>
                <option value="">Sin equipo</option>
                {equipos.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.nombre}
                  </option>
                ))}
              </select>
            </div>
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
              {loading ? 'Creando...' : 'Crear proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
