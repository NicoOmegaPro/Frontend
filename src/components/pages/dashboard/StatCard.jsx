// Tarjeta de estadística con su lista de items (proyectos/tareas).
export default function StatCard({ icon: Icon, label, value, sub, color, items, onItemClick }) {
  return (
    <div
      className="rounded-2xl p-6 border flex flex-col gap-4 hover:shadow-xl transition-all"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}1a` }}
        >
          <Icon size={28} style={{ color }} />
        </div>
        <div>
          <p className="text-[44px] font-extrabold leading-none" style={{ color: 'var(--text)' }}>{value}</p>
          <p className="text-[15px] font-semibold mt-1.5" style={{ color: 'var(--text)' }}>{label}</p>
          {sub && <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
        </div>
      </div>

      {items && items.length > 0 && (
        <ul className="space-y-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          {items.slice(0, 3).map((t) => (
            <li
              key={t.id}
              onClick={() => onItemClick?.(t)}
              className="flex items-center gap-2 text-[13px] truncate cursor-pointer transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}
              title={t.titulo}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="truncate">{t.titulo}</span>
            </li>
          ))}
          {items.length > 3 && (
            <li className="text-xs pl-3.5" style={{ color: 'var(--text-faint)' }}>+{items.length - 3} más</li>
          )}
        </ul>
      )}
    </div>
  );
}
