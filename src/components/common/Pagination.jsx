import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Calcula el rango de páginas a mostrar alrededor de la actual (máx 5 números).
function pageRange(current, total) {
  let start = Math.max(1, current - 2);
  let end = Math.min(total, current + 2);
  if (current <= 3) end = Math.min(total, 5);
  if (current >= total - 2) start = Math.max(1, total - 4);
  const pages = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
}

/**
 * Controles de paginación por páginas numeradas.
 * Props: page (1-based), pages (total), onChange(page), total? (nº registros), label?
 */
export default function Pagination({ page, pages, onChange, total, label = 'registros', className = '' }) {
  if (!pages || pages <= 1) return null;
  const nums = pageRange(page, pages);

  const Btn = ({ disabled, active, onClick, children, ariaLabel }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className="min-w-[32px] h-8 px-2 rounded-lg text-[13px] font-medium inline-flex items-center justify-center transition-colors disabled:opacity-40 disabled:pointer-events-none"
      style={{
        background: active ? 'var(--primary)' : 'var(--bg-secondary)',
        color: active ? '#fff' : 'var(--text-muted)',
        border: '1px solid var(--border)',
      }}
    >
      {children}
    </button>
  );

  return (
    <div className={`flex items-center justify-between gap-3 flex-wrap mt-4 ${className}`}>
      {total !== undefined ? (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Página {page} de {pages} · {total} {label}
        </span>
      ) : <span />}
      <div className="inline-flex items-center gap-1.5">
        <Btn disabled={page <= 1} onClick={() => onChange(page - 1)} ariaLabel="Anterior">
          <ChevronLeft size={15} />
        </Btn>
        {nums[0] > 1 && (
          <>
            <Btn onClick={() => onChange(1)}>1</Btn>
            {nums[0] > 2 && <span className="px-1" style={{ color: 'var(--text-faint)' }}>…</span>}
          </>
        )}
        {nums.map((p) => (
          <Btn key={p} active={p === page} onClick={() => onChange(p)}>{p}</Btn>
        ))}
        {nums[nums.length - 1] < pages && (
          <>
            {nums[nums.length - 1] < pages - 1 && <span className="px-1" style={{ color: 'var(--text-faint)' }}>…</span>}
            <Btn onClick={() => onChange(pages)}>{pages}</Btn>
          </>
        )}
        <Btn disabled={page >= pages} onClick={() => onChange(page + 1)} ariaLabel="Siguiente">
          <ChevronRight size={15} />
        </Btn>
      </div>
    </div>
  );
}

/**
 * Hook para paginar una lista en memoria (cliente).
 * Devuelve { pageItems, page, pages, setPage, total }.
 */
export function useClientPagination(items, perPage = 8) {
  const [page, setPage] = useState(1);
  const list = Array.isArray(items) ? items : [];
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, pages);
  const pageItems = useMemo(
    () => list.slice((safePage - 1) * perPage, safePage * perPage),
    [list, safePage, perPage]
  );
  return { pageItems, page: safePage, pages, setPage, total };
}
