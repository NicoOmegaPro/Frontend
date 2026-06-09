import { useState, useEffect } from 'react';
import { X, Users } from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';

const inp =
  'input-field w-full border border-[#DFE1E6] rounded-lg px-3 py-2 text-sm text-[#172B4D] placeholder-[#B3BAC5] bg-white';

export default function CreateProjectModal({ onClose, onCreated }) {
  const { addToast } = useToast();
  const [equipos, setEquipos] = useState([]);
  const [form, setForm] = useState({ nombre: '', descripcion: '', equipoId: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getEquipos()
      .then((data) => {
        const liderados = (Array.isArray(data) ? data : []).filter((e) => e.myRol === 'JEFE_EQUIPO');
        setEquipos(liderados);
      })
      .catch(() => setEquipos([]));
  }, []);

  const equipoSel = equipos.find((e) => e.id === parseInt(form.equipoId));
  const miembrosEquipo = equipoSel?.usuarios || [];

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    if (!form.equipoId) {
      addToast('Selecciona un equipo', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.createProject({
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        equipoId: parseInt(form.equipoId),
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md modal-center max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DFE1E6]">
          <h2 className="font-bold text-[#172B4D] text-base">Crear proyecto</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F4F5F7] text-[#6B778C] hover:text-[#172B4D]">
            <X size={16} />
          </button>
        </div>

        {equipos.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-[#172B4D] font-medium">Aún no lideras ningún equipo</p>
            <p className="text-sm text-[#6B778C] mt-1">
              Crea un equipo en la sección <strong>Equipos</strong> para poder crear proyectos y asignar roles.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90"
              style={{ background: 'var(--primary)' }}
            >
              Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
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
                rows={2}
                className={`${inp} resize-none`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">
                Equipo *
              </label>
              <select value={form.equipoId} onChange={set('equipoId')} required className={inp}>
                <option value="">Selecciona un equipo</option>
                {equipos.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.nombre}
                  </option>
                ))}
              </select>
            </div>

            {equipoSel && (
              <div>
                <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Users size={12} /> Miembros del equipo ({miembrosEquipo.length})
                </label>
                <p className="text-xs text-[#6B778C] mb-2">
                  Todos los miembros del equipo participan en el proyecto con su rol de equipo (Jefe, Supervisor o Miembro). Los roles se gestionan desde <strong>Equipos</strong>.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {miembrosEquipo.map((m) => (
                    <span key={m.usuarioId} className="text-xs px-2 py-1 rounded-full bg-[#F4F5F7] text-[#172B4D]">
                      {m.usuario?.nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}

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
        )}
      </div>
    </div>
  );
}
