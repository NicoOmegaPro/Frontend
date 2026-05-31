import { useState, useEffect } from 'react';
import { X, Crown } from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const inp =
  'input-field w-full border border-[#DFE1E6] rounded-lg px-3 py-2 text-sm text-[#172B4D] placeholder-[#B3BAC5] bg-white';

const ROL_OPTIONS = [
  { value: 'TRABAJADOR', label: 'Trabajador' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'JEFE_PROYECTO', label: 'Jefe de Proyecto' },
];

export default function CreateProjectModal({ onClose, onCreated }) {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [equipos, setEquipos] = useState([]);
  const [form, setForm] = useState({ nombre: '', descripcion: '', equipoId: '' });
  // Mapa usuarioId -> rol de proyecto, para los miembros (sin contar al creador).
  const [roles, setRoles] = useState({});
  const [loading, setLoading] = useState(false);

  // Solo se pueden crear proyectos en equipos donde soy Jefe de Equipo.
  useEffect(() => {
    api.getEquipos()
      .then((data) => {
        const liderados = (Array.isArray(data) ? data : []).filter((e) => e.myRol === 'JEFE_EQUIPO');
        setEquipos(liderados);
      })
      .catch(() => setEquipos([]));
  }, []);

  const equipoSel = equipos.find((e) => e.id === parseInt(form.equipoId));
  // Miembros del equipo distintos del creador (al creador lo asignamos como Jefe de Proyecto).
  const otrosMiembros = (equipoSel?.usuarios || []).filter((m) => m.usuarioId !== user?.id);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const setRol = (usuarioId, rol) => setRoles((prev) => ({ ...prev, [usuarioId]: rol }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    if (!form.equipoId) {
      addToast('Selecciona un equipo', 'error');
      return;
    }
    setLoading(true);
    try {
      const miembros = otrosMiembros.map((m) => ({
        usuarioId: m.usuarioId,
        rol: roles[m.usuarioId] || 'TRABAJADOR',
      }));
      await api.createProject({
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        equipoId: parseInt(form.equipoId),
        miembros,
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

            {/* Asignación de roles del proyecto a los miembros del equipo */}
            {equipoSel && (
              <div>
                <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-2">
                  Roles del proyecto
                </label>
                <div className="space-y-2">
                  {/* El creador es siempre Jefe de Proyecto */}
                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#F4F5F7]">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#172B4D] truncate">
                        {user?.nombre} <span className="text-xs text-[#6B778C]">(tú)</span>
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(90,156,248,.15)', color: '#5a9cf8' }}>
                      <Crown size={11} /> Jefe de Proyecto
                    </span>
                  </div>

                  {otrosMiembros.length === 0 ? (
                    <p className="text-xs text-[#6B778C]">
                      Este equipo todavía no tiene más miembros. Invita compañeros desde la sección Equipos.
                    </p>
                  ) : (
                    otrosMiembros.map((m) => (
                      <div key={m.usuarioId} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-[#DFE1E6]">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#172B4D] truncate">{m.usuario?.nombre}</p>
                          <p className="text-xs text-[#6B778C] truncate">{m.usuario?.email}</p>
                        </div>
                        <select
                          value={roles[m.usuarioId] || 'TRABAJADOR'}
                          onChange={(e) => setRol(m.usuarioId, e.target.value)}
                          className="text-xs border border-[#DFE1E6] rounded-lg px-2 py-1.5 input-field bg-white text-[#172B4D] flex-shrink-0"
                        >
                          {ROL_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    ))
                  )}
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
