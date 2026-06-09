import { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../../api';
import { useToast } from '../../../context/ToastContext';
import { inp, inpStyle } from './constants';

export default function CreateEquipoModal({ onClose, onCreated }) {
  const { addToast } = useToast();
  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    setLoading(true);
    try {
      const eq = await api.createEquipo({ nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || undefined });
      addToast(`Equipo "${eq.nombre}" creado`, 'success');
      onCreated(eq);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 modal-backdrop">
      <div className="w-full max-w-md rounded-2xl shadow-2xl modal-center" style={{ background: 'var(--card)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-bold text-base" style={{ color: 'var(--text)' }}>Crear nuevo equipo</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F4F5F7]" style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Nombre *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm(p => ({ ...p, nombre: e.target.value }))}
              required
              placeholder="Nombre del equipo"
              className={inp}
              style={inpStyle}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm(p => ({ ...p, descripcion: e.target.value }))}
              placeholder="Descripción del equipo (opcional)"
              rows={3}
              className={`${inp} resize-none`}
              style={inpStyle}
            />
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Serás automáticamente el <strong>Jefe de Equipo</strong>.
          </p>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 hover:opacity-90" style={{ background: 'var(--primary)' }}>
              {loading ? 'Creando...' : 'Crear equipo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
