import { CheckSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import Pagination, { useClientPagination } from '../../common/Pagination';
import { ESTADO_COLOR, ESTADO_LABEL } from './constants';

// Panel con las tareas asignadas al usuario actual.
export default function MyTasks({ tasks, userId, onTaskClick }) {
  const myTasks = tasks.filter((t) => t.asignadoAId === userId);
  const myTasksPg = useClientPagination(myTasks, 6);

  return (
    <div className="rounded-2xl border p-4 flex flex-col overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)', height: 420 }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckSquare size={15} style={{ color: 'var(--primary)' }} />
          <h2 className="font-semibold text-[14px]" style={{ color: 'var(--text)' }}>Mis tareas</h2>
        </div>
        <Link to="/projects" className="text-[12px] font-medium hover:underline" style={{ color: 'var(--primary-hover)' }}>
          Ver todas
        </Link>
      </div>
      {myTasks.length === 0 ? (
        <p className="text-[13px] text-center py-6" style={{ color: 'var(--text-muted)' }}>
          No tienes tareas asignadas
        </p>
      ) : (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
            {myTasksPg.pageItems.map((t) => (
              <div
                key={t.id}
                onClick={() => onTaskClick(t)}
                className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors group"
                style={{ background: 'var(--bg-secondary)' }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: ESTADO_COLOR[t.estado] }}
                />
                <span className="text-[13px] truncate flex-1 group-hover:underline" style={{ color: 'var(--text)' }}>
                  {t.titulo}
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                  style={{ background: `${ESTADO_COLOR[t.estado]}20`, color: ESTADO_COLOR[t.estado] }}
                >
                  {ESTADO_LABEL[t.estado]}
                </span>
              </div>
            ))}
          </div>
          <Pagination page={myTasksPg.page} pages={myTasksPg.pages} onChange={myTasksPg.setPage} className="flex-shrink-0" />
        </>
      )}
    </div>
  );
}
