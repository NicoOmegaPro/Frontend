// Tarjeta con título e icono usada por toda la página de perfil.
export default function SectionCard({ title, icon: Icon, children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border p-7 ${className}`}
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {title && (
        <h2
          className="font-semibold text-[15px] flex items-center gap-2.5 mb-6"
          style={{ color: 'var(--text)' }}
        >
          {Icon && <Icon size={17} style={{ color: 'var(--primary)' }} />}
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
