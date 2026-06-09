import { Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Pagination, { useClientPagination } from '../../common/Pagination';
import { ACCION_ICON } from './constants';

// Feed de actividad reciente del equipo.
export default function RecentActivity({ historial }) {
  const activityPg = useClientPagination(historial, 6);

  return (
    <div className="rounded-2xl border p-4 flex flex-col overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)', height: 420 }}>
      <div className="flex items-center gap-2 mb-3">
        <Activity size={15} style={{ color: 'var(--primary)' }} />
        <h2 className="font-semibold text-[14px]" style={{ color: 'var(--text)' }}>Actividad reciente</h2>
      </div>
      {historial.length === 0 ? (
        <p className="text-[13px] text-center py-6" style={{ color: 'var(--text-muted)' }}>Sin actividad reciente</p>
      ) : (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
            {activityPg.pageItems.map((h) => (
              <div key={h.id} className="flex gap-2 items-start">
                <span className="text-[14px] flex-shrink-0 mt-0.5">{ACCION_ICON[h.accion] || '📌'}</span>
                <div className="min-w-0">
                  <p className="text-[12px]" style={{ color: 'var(--text)' }}>
                    <span className="font-semibold">{h.usuario?.nombre || 'Usuario'}</span>{' '}
                    {h.detalles || `${h.accion.toLowerCase()} ${h.entidadTipo.toLowerCase()}`}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                    {formatDistanceToNow(new Date(h.fecha), { addSuffix: true, locale: es })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={activityPg.page} pages={activityPg.pages} onChange={activityPg.setPage} className="flex-shrink-0" />
        </>
      )}
    </div>
  );
}
