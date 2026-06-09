// Trocitos visuales que se repiten dentro del modal de tarea.

export function PropLabel({ children }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
      {children}
    </p>
  );
}

export function SectionHeader({ children }) {
  return (
    <h3
      className="text-[11px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1"
      style={{ color: 'var(--text-muted)' }}
    >
      {children}
    </h3>
  );
}

export function Divider() {
  return <div className="h-px my-1" style={{ background: 'var(--border)' }} />;
}
