import { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown } from 'lucide-react';

function DropdownItem({ children, active, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors"
      style={{
        background: hovered || active ? 'var(--bg-secondary)' : 'transparent',
        color: 'var(--text)',
      }}
    >
      {children}
    </button>
  );
}

export default function SelectDropdown({ value, options, onChange, renderOption, renderValue }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Cerrar al hacer click fuera.
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors border w-full"
        style={{ borderColor: 'var(--border)', background: 'var(--card-hover)' }}
      >
        <span className="flex-1 text-left">{renderValue(value)}</span>
        <ChevronDown size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full mt-1 rounded-xl shadow-2xl z-30 w-full min-w-44 py-1.5 border"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          {options.map((opt) => (
            <DropdownItem
              key={opt}
              active={opt === value}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {renderOption(opt)}
              {opt === value && <Check size={11} className="ml-auto flex-shrink-0" style={{ color: 'var(--primary)' }} />}
            </DropdownItem>
          ))}
        </div>
      )}
    </div>
  );
}
