import { useState, useEffect } from 'react';
import { Users, Trash2, Crown, Search, Plus } from 'lucide-react';
import { api } from '../../../api';
import { useToast } from '../../../context/ToastContext';

// Gestión de los equipos de un proyecto: el jefe del equipo dueño puede invitar
// equipos colaboradores (búsqueda por nombre) y quitarlos (no se puede quitar el dueño).
export default function ProjectTeamsModal({ projectId, equipos = [], canManage, onClose, onChanged }) {
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  // Búsqueda async con debounce: el backend devuelve solo coincidencias limitadas.
  useEffect(() => {
    if (!canManage) return;
    let cancelado = false;
    setBuscando(true);
    const t = setTimeout(() => {
      api.getProjectTeamsDisponibles(projectId, search.trim())
        .then((data) => { if (!cancelado) setResultados(Array.isArray(data) ? data : []); })
        .catch(() => { if (!cancelado) setResultados([]); })
        .finally(() => { if (!cancelado) setBuscando(false); });
    }, 300);
    return () => { cancelado = true; clearTimeout(t); };
  }, [search, projectId, canManage]);

  const handleAdd = async (equipoId) => {
    setAddingId(equipoId);
    try {
      await api.addProjectTeam(projectId, equipoId);
      addToast('Equipo añadido al proyecto', 'success');
      setResultados((prev) => prev.filter((e) => e.id !== equipoId));
      onChanged();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setAddingId(null);
    }
  };

  const handleRemove = async (equipoId) => {
    setRemovingId(equipoId);
    try {
      await api.removeProjectTeam(projectId, equipoId);
      addToast('Equipo quitado del proyecto', 'success');
      onChanged();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 modal-backdrop">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md modal-center max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Users size={16} /> Equipos del proyecto
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F4F5F7]" style={{ color: 'var(--text-muted)' }}>
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Equipos actuales del proyecto */}
          <div className="space-y-2">
            {equipos.map((eq) => (
              <div
                key={eq.id}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>{eq.nombre}</span>
                  {eq.esDueno && (
                    <span className="badge inline-flex items-center gap-1" style={{ background: 'rgba(245,166,35,.15)', color: '#f5a623' }}>
                      <Crown size={11} /> Dueño
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{eq.numMiembros} miembros</span>
                  {canManage && !eq.esDueno && (
                    <button
                      onClick={() => handleRemove(eq.id)}
                      disabled={removingId === eq.id}
                      className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      style={{ color: 'var(--text-muted)' }}
                      title="Quitar equipo"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Buscar e invitar otro equipo */}
          {canManage && (
            <div className="pt-3 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
              <label className="block text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Invitar equipo
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar equipo por nombre…"
                  className="input-field w-full border rounded-lg pl-9 pr-3 py-2 text-sm"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  autoFocus
                />
              </div>

              {/* Resultados de la búsqueda */}
              <div className="max-h-56 overflow-y-auto rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                {buscando ? (
                  <p className="text-xs px-3 py-3 text-center" style={{ color: 'var(--text-muted)' }}>Buscando…</p>
                ) : resultados.length === 0 ? (
                  <p className="text-xs px-3 py-3 text-center" style={{ color: 'var(--text-muted)' }}>
                    {search.trim() ? 'Sin equipos que coincidan' : 'No hay equipos disponibles para invitar'}
                  </p>
                ) : (
                  resultados.map((eq) => (
                    <button
                      key={eq.id}
                      onClick={() => handleAdd(eq.id)}
                      disabled={addingId === eq.id}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-[var(--card-hover)] disabled:opacity-50 transition-colors"
                    >
                      <span className="text-sm truncate" style={{ color: 'var(--text)' }}>{eq.nombre}</span>
                      <span className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{eq.numMiembros} miembros</span>
                        <Plus size={14} style={{ color: 'var(--primary)' }} />
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
