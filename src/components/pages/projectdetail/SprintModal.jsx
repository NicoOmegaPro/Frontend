import { useState } from 'react';
import { api } from '../../../api';
import { useToast } from '../../../context/ToastContext';

export default function SprintModal({ projectId, onClose, onCreated }) {
  const { addToast } = useToast();
  const [newSprint, setNewSprint] = useState({ nombre: '', fechaInicio: '', fechaFin: '' });
  const [loading, setLoading] = useState(false);

  const handleCreateSprint = async (e) => {
    e.preventDefault();
    if (!newSprint.nombre.trim() || !newSprint.fechaInicio || !newSprint.fechaFin) return;
    setLoading(true);
    try {
      await api.createSprint({
        nombre: newSprint.nombre,
        fechaInicio: new Date(newSprint.fechaInicio).toISOString(),
        fechaFin: new Date(newSprint.fechaFin).toISOString(),
        proyectoId: projectId,
      });
      addToast('Sprint creado', 'success');
      onCreated();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 modal-backdrop">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm modal-center">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DFE1E6]">
          <h2 className="font-bold text-[#172B4D]">Crear sprint</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#F4F5F7] text-[#6B778C]"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleCreateSprint} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">Nombre *</label>
            <input
              type="text"
              value={newSprint.nombre}
              onChange={(e) => setNewSprint((p) => ({ ...p, nombre: e.target.value }))}
              required
              placeholder="Sprint 1"
              className="input-field w-full border border-[#DFE1E6] rounded-lg px-3 py-2 text-sm text-[#172B4D] placeholder-[#B3BAC5]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">Inicio *</label>
              <input
                type="date"
                value={newSprint.fechaInicio}
                onChange={(e) => setNewSprint((p) => ({ ...p, fechaInicio: e.target.value }))}
                required
                className="input-field w-full border border-[#DFE1E6] rounded-lg px-3 py-2 text-sm text-[#172B4D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">Fin *</label>
              <input
                type="date"
                value={newSprint.fechaFin}
                onChange={(e) => setNewSprint((p) => ({ ...p, fechaFin: e.target.value }))}
                required
                className="input-field w-full border border-[#DFE1E6] rounded-lg px-3 py-2 text-sm text-[#172B4D]"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-[#DFE1E6] text-sm font-medium text-[#6B778C] hover:bg-[#F4F5F7]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-60 hover:opacity-90"
              style={{ background: 'var(--primary)' }}
            >
              {loading ? 'Creando...' : 'Crear sprint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
