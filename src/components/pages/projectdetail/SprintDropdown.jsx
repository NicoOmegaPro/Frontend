import { useState } from 'react';
import { Zap, ChevronDown, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Selector de sprint (filtra el tablero por sprint).
export default function SprintDropdown({ selectedSprint, onSelect, sprints, canCreateSprint, onCreateSprint }) {
  const [open, setOpen] = useState(false);

  const pick = (value) => { onSelect(value); setOpen(false); };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-[#DFE1E6] rounded-lg text-sm font-medium text-[#172B4D] hover:bg-[#F4F5F7] transition-colors"
      >
        <Zap size={14} className="text-[#0052CC]" />
        {selectedSprint === 'ALL' ? 'Todos los sprints' : sprints.find((s) => s.id === selectedSprint)?.nombre || 'Sprint'}
        <ChevronDown size={13} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-[#DFE1E6] z-20 min-w-48 py-1">
            <button
              onClick={() => pick('ALL')}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F4F5F7] ${selectedSprint === 'ALL' ? 'font-semibold text-[#0052CC]' : 'text-[#172B4D]'}`}
            >
              Todos los sprints
            </button>
            {sprints.map((s) => (
              <button
                key={s.id}
                onClick={() => pick(s.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F4F5F7] ${selectedSprint === s.id ? 'font-semibold text-[#0052CC]' : 'text-[#172B4D]'}`}
              >
                <div>{s.nombre}</div>
                <div className="text-[10px] text-[#6B778C]">
                  {format(new Date(s.fechaInicio), 'dd MMM', { locale: es })} — {format(new Date(s.fechaFin), 'dd MMM', { locale: es })}
                </div>
              </button>
            ))}
            {canCreateSprint && (
              <>
                <div className="border-t border-[#DFE1E6] my-1" />
                <button
                  onClick={() => { setOpen(false); onCreateSprint(); }}
                  className="w-full text-left px-3 py-2 text-sm text-[#0052CC] hover:bg-[#F4F5F7] flex items-center gap-2"
                >
                  <Plus size={13} /> Crear sprint
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
