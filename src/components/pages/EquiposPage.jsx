import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Users, Plus } from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import Pagination, { useClientPagination } from '../common/Pagination';
import CreateEquipoModal from './equipos/CreateEquipoModal';
import EquipoCard from './equipos/EquipoCard';

export default function EquiposPage() {
  const { user } = useAuth();
  const location = useLocation();
  // ?open=ID en la URL: al llegar desde una notificación, abre ese equipo directamente.
  const openId = parseInt(new URLSearchParams(location.search).get('open')) || null;
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const equiposPg = useClientPagination(equipos, 5); // paginación local, 5 equipos por página

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getEquipos();
      const list = Array.isArray(data) ? data : [];
      setEquipos(list);
      // Si venimos con ?open=ID, salto a la página donde está ese equipo para que se vea.
      if (openId) {
        const idx = list.findIndex((e) => e.id === openId);
        if (idx >= 0) equiposPg.setPage(Math.floor(idx / 5) + 1); // 5 equipos por página
      }
    } catch {
      setEquipos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cabecera + botón de crear */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>Mis Equipos</h1>
          <p className="text-[14px] mt-1" style={{ color: 'var(--text-muted)' }}>
            {equipos.length === 0
              ? 'Crea tu primer equipo e invita a compañeros.'
              : `Eres miembro de ${equipos.length} equipo${equipos.length !== 1 ? 's' : ''}.`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
          style={{ background: 'var(--primary)' }}
        >
          <Plus size={16} /> Crear equipo
        </button>
      </div>

      {/* Lista de equipos (o estado vacío) */}
      {equipos.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <Users size={48} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--text)' }} />
          <p className="font-semibold text-lg" style={{ color: 'var(--text)' }}>Sin equipos todavía</p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            Usa el botón <strong>+ Crear equipo</strong> de arriba a la derecha para empezar.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {equiposPg.pageItems.map((eq) => (
              <EquipoCard
                key={eq.id}
                equipo={eq}
                currentUserId={user?.id}
                onUpdate={load}
                autoOpen={eq.id === openId}
              />
            ))}
          </div>
          <Pagination page={equiposPg.page} pages={equiposPg.pages} onChange={equiposPg.setPage} total={equipos.length} label="equipos" />
        </>
      )}

      {showCreate && (
        <CreateEquipoModal
          onClose={() => setShowCreate(false)}
          onCreated={(eq) => {
            setEquipos((prev) => [...prev, { ...eq, myRol: 'JEFE_EQUIPO' }]);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}
