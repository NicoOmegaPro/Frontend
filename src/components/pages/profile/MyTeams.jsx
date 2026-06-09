import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../api';
import { avatarSrc } from '../../../utils/avatar';
import SectionCard from './SectionCard';

// Lista de equipos del usuario (cada uno enlaza a su página).
export default function MyTeams() {
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState([]);

  useEffect(() => {
    api.getEquipos()
      .then((eq) => setEquipos(Array.isArray(eq) ? eq : []))
      .catch(() => setEquipos([]));
  }, []);

  if (equipos.length === 0) return null;

  return (
    <SectionCard title="Mis equipos" icon={Users}>
      <div className="space-y-2">
        {equipos.map((eq) => (
          <div
            key={eq.id}
            onClick={() => navigate(`/equipos?open=${eq.id}`)}
            className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-colors hover:brightness-110"
            style={{ background: 'var(--bg-secondary)' }}
            title={`Abrir ${eq.nombre}`}
          >
            {eq.imagen ? (
              <img
                src={avatarSrc(eq.imagen)}
                alt={eq.nombre}
                className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[15px] font-bold flex-shrink-0"
                style={{ background: 'var(--primary)' }}
              >
                {eq.nombre.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--text)' }}>
                {eq.nombre}
              </p>
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                {eq.usuarios?.length ?? 0} miembro{eq.usuarios?.length !== 1 ? 's' : ''}
                {eq.proyectos?.length > 0 && ` · ${eq.proyectos.length} proyecto${eq.proyectos.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
