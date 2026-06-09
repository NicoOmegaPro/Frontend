import { useState } from 'react';
import { X, Image, FileText, File } from 'lucide-react';

function FileIcon({ nombre }) {
  const ext = (nombre || '').split('.').pop().toLowerCase();
  return ext === 'pdf' ? (
    <FileText size={26} className="text-red-400" />
  ) : ['doc', 'docx'].includes(ext) ? (
    <FileText size={26} className="text-blue-400" />
  ) : (
    <File size={26} style={{ color: 'var(--text-muted)' }} />
  );
}

export default function AdjuntoCard({ adjunto: a, imgUrl, isImg, onDelete }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="group relative rounded-xl border overflow-hidden transition-colors"
      style={{ borderColor: hovered ? 'var(--primary)' : 'var(--border)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isImg ? (
        <a href={imgUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={imgUrl}
            alt={a.nombre}
            className="w-full h-24 object-cover"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
          <div className="hidden w-full h-24 items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
            <Image size={18} style={{ color: 'var(--text-faint)' }} />
          </div>
        </a>
      ) : (
        <a
          href={imgUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-2 h-24 transition-colors"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <FileIcon nombre={a.nombre} />
          <span className="text-[9px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
            {(a.nombre || '').split('.').pop().toUpperCase() || 'FILE'}
          </span>
        </a>
      )}
      <div className="px-2 py-1.5 flex items-center justify-between gap-1" style={{ background: 'var(--bg-secondary)' }}>
        <span className="text-[10px] truncate font-medium" style={{ color: 'var(--text)' }}>{a.nombre}</span>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-0.5 transition"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#F0556B'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <X size={11} />
        </button>
      </div>
    </div>
  );
}
