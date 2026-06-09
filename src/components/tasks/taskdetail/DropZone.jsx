import { useState } from 'react';
import { Upload } from 'lucide-react';

export default function DropZone({ onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full border-2 border-dashed rounded-xl py-7 flex flex-col items-center gap-2 transition-colors"
      style={{ borderColor: hovered ? 'var(--primary)' : 'var(--border)' }}
    >
      <Upload size={20} style={{ color: 'var(--text-faint)' }} />
      <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Haz clic para subir imágenes o archivos</span>
      <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>JPG, PNG, GIF, PDF · Máx. 10 MB</span>
    </button>
  );
}
