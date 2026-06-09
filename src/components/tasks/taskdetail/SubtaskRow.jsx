import { useState } from 'react';
import { Check, X } from 'lucide-react';

export default function SubtaskRow({ subtask: s, onToggle, onDelete }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="flex items-center gap-3 group px-2 py-1.5 rounded-lg transition-colors"
      style={{ background: hovered ? 'var(--bg-secondary)' : 'transparent' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onToggle}
        className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors"
        style={s.completada
          ? { background: '#22c55e', borderColor: '#22c55e' }
          : { background: 'transparent', borderColor: 'var(--border)' }
        }
      >
        {s.completada && <Check size={10} className="text-white" strokeWidth={3} />}
      </button>
      <span
        className="text-sm flex-1"
        style={{
          color: s.completada ? 'var(--text-faint)' : 'var(--text)',
          textDecoration: s.completada ? 'line-through' : 'none',
        }}
      >
        {s.titulo}
      </span>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-0.5 transition-opacity"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => e.currentTarget.style.color = '#F0556B'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <X size={12} />
      </button>
    </div>
  );
}
