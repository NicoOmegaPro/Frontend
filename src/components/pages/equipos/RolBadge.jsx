import { Crown, Shield, User as UserIcon } from 'lucide-react';

const ROL_META = {
  JEFE_EQUIPO: { label: 'Jefe de Equipo', icon: Crown,    color: '#f5a623', bg: 'rgba(245,166,35,.15)' },
  SUPERVISOR:  { label: 'Supervisor',     icon: Shield,   color: '#a78bfa', bg: 'rgba(167,139,250,.15)' },
  MIEMBRO:     { label: 'Miembro',         icon: UserIcon, color: '#3fb950', bg: 'rgba(63,185,80,.15)' },
};

export default function RolBadge({ rol }) {
  const m = ROL_META[rol] || ROL_META.MIEMBRO;
  const Icon = m.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1 rounded-full" style={{ background: m.bg, color: m.color }}>
      <Icon size={12} />
      {m.label}
    </span>
  );
}
