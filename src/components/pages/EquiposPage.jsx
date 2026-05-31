import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, Crown, User as UserIcon,
  Mail, ChevronDown, ChevronUp, Trash2, X,
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const API_BASE = 'http://localhost:3000';

// En un equipo solo hay dos roles: jefe de equipo y miembro.
// Los rangos de proyecto se asignan al crear cada proyecto.
const ROL_META = {
  JEFE_EQUIPO: { label: 'Jefe de Equipo', icon: Crown,    color: '#f5a623', bg: 'rgba(245,166,35,.15)' },
  MIEMBRO:     { label: 'Miembro',         icon: UserIcon, color: '#3fb950', bg: 'rgba(63,185,80,.15)' },
};

const inp = 'w-full border rounded-xl px-4 py-2.5 text-sm input-field transition-all';
const inpStyle = { background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text)' };

function RolBadge({ rol }) {
  const m = ROL_META[rol] || ROL_META.MIEMBRO;
  const Icon = m.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: m.bg, color: m.color }}>
      <Icon size={11} />
      {m.label}
    </span>
  );
}

function Avatar({ user }) {
  if (user?.imagenPerfil) {
    return <img src={`${API_BASE}${user.imagenPerfil}`} alt={user.nombre} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />;
  }
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: 'var(--primary)' }}>
      {user?.nombre?.charAt(0).toUpperCase()}
    </div>
  );
}

/* ─── Modal crear equipo ─── */
function CreateEquipoModal({ onClose, onCreated }) {
  const { addToast } = useToast();
  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    setLoading(true);
    try {
      const eq = await api.createEquipo({ nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || undefined });
      addToast(`Equipo "${eq.nombre}" creado`, 'success');
      onCreated(eq);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 modal-backdrop">
      <div className="w-full max-w-md rounded-2xl shadow-2xl modal-center" style={{ background: 'var(--card)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-bold text-base" style={{ color: 'var(--text)' }}>Crear nuevo equipo</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F4F5F7]" style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Nombre *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm(p => ({ ...p, nombre: e.target.value }))}
              required
              placeholder="Nombre del equipo"
              className={inp}
              style={inpStyle}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm(p => ({ ...p, descripcion: e.target.value }))}
              placeholder="Descripción del equipo (opcional)"
              rows={3}
              className={`${inp} resize-none`}
              style={inpStyle}
            />
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Serás automáticamente el <strong>Jefe de Equipo</strong>.
          </p>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 hover:opacity-90" style={{ background: 'var(--primary)' }}>
              {loading ? 'Creando...' : 'Crear equipo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Panel de un equipo ─── */
function EquipoCard({ equipo, currentUserId, onUpdate }) {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const isJefe = equipo.myRol === 'JEFE_EQUIPO';

  const handleInvitar = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await api.invitarMiembro(equipo.id, inviteEmail.trim());
      addToast(res.message, 'success');
      setInviteEmail('');
      setShowInvite(false);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleExpulsar = async (userId, nombre) => {
    if (!confirm(`¿Expulsar a ${nombre} del equipo?`)) return;
    try {
      await api.expulsarMiembro(equipo.id, userId);
      addToast(`${nombre} eliminado del equipo`, 'success');
      onUpdate();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleEliminarEquipo = async () => {
    if (!confirm(`¿Eliminar el equipo "${equipo.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.deleteEquipo(equipo.id);
      addToast('Equipo eliminado', 'success');
      onUpdate();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      {/* Header del equipo */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0" style={{ background: 'var(--primary)' }}>
              {equipo.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>{equipo.nombre}</h3>
              {equipo.descripcion && (
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{equipo.descripcion}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--text)' }}>{equipo.usuarios?.length ?? 0}</strong> miembro{equipo.usuarios?.length !== 1 ? 's' : ''}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--text)' }}>{equipo.proyectos?.length ?? 0}</strong> proyecto{equipo.proyectos?.length !== 1 ? 's' : ''}
                </span>
                <RolBadge rol={equipo.myRol} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isJefe && (
              <button
                onClick={() => setShowInvite(!showInvite)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90"
                style={{ background: 'var(--primary)' }}
              >
                <Plus size={14} /> Invitar
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 rounded-xl hover:bg-[#F4F5F7]"
              style={{ color: 'var(--text-muted)' }}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Mini avatars */}
        {!expanded && equipo.usuarios?.length > 0 && (
          <div className="flex items-center gap-1 mt-3 pl-1">
            {equipo.usuarios.slice(0, 8).map((m) => (
              <div key={m.usuarioId} title={m.usuario?.nombre} className="w-7 h-7 rounded-full border-2 overflow-hidden flex-shrink-0" style={{ borderColor: 'var(--card)' }}>
                {m.usuario?.imagenPerfil ? (
                  <img src={`${API_BASE}${m.usuario.imagenPerfil}`} alt={m.usuario.nombre} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: 'var(--primary)' }}>
                    {m.usuario?.nombre?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))}
            {equipo.usuarios.length > 8 && (
              <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>+{equipo.usuarios.length - 8}</span>
            )}
          </div>
        )}
      </div>

      {/* Formulario de invitar */}
      {showInvite && (
        <div className="px-5 pb-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mt-4 mb-3" style={{ color: 'var(--text-muted)' }}>Invitar miembro por email</p>
          <form onSubmit={handleInvitar} className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              required
              className={`${inp} flex-1`}
              style={inpStyle}
            />
            <button
              type="submit"
              disabled={inviting}
              className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 hover:opacity-90 flex-shrink-0"
              style={{ background: 'var(--primary)' }}
            >
              {inviting ? '...' : <Mail size={15} />}
            </button>
          </form>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Los roles de proyecto (Jefe de Proyecto, Supervisor, Trabajador) se asignan al crear cada proyecto.
          </p>
        </div>
      )}

      {/* Lista de miembros (expanded) */}
      {expanded && (
        <div className="border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="p-5 space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Miembros ({equipo.usuarios?.length ?? 0})
            </p>
            {equipo.usuarios?.map((m) => {
              const isMe = m.usuarioId === currentUserId;
              const isJefeTarget = m.rol === 'JEFE_EQUIPO';
              return (
                <div
                  key={m.usuarioId}
                  onClick={() => navigate(isMe ? '/profile' : `/users/${m.usuarioId}`)}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:brightness-110"
                  style={{ background: 'var(--bg-secondary)' }}
                  title={isMe ? 'Ver mi perfil' : `Ver perfil de ${m.usuario?.nombre}`}
                >
                  <Avatar user={m.usuario} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold hover:underline" style={{ color: 'var(--text)' }}>
                      {m.usuario?.nombre} {isMe && <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>(tú)</span>}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.usuario?.email}</p>
                  </div>

                  <RolBadge rol={m.rol} />

                  {/* Expulsar */}
                  {isJefe && !isMe && !isJefeTarget && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleExpulsar(m.usuarioId, m.usuario?.nombre); }}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      style={{ color: 'var(--danger)' }}
                      title="Expulsar del equipo"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Proyectos del equipo */}
          {equipo.proyectos?.length > 0 && (
            <div className="px-5 pb-5">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                Proyectos ({equipo.proyectos.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {equipo.proyectos.map((p) => (
                  <button
                    key={p.id}
                    onClick={(e) => { e.stopPropagation(); navigate(`/projects/${p.id}`); }}
                    className="text-xs px-3 py-1.5 rounded-full font-medium cursor-pointer transition-opacity hover:opacity-80 hover:underline"
                    style={{ background: 'rgba(0,82,204,0.12)', color: 'var(--primary)' }}
                    title={`Abrir ${p.nombre}`}
                  >
                    {p.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Eliminar equipo (solo JEFE_EQUIPO) */}
          {isJefe && (
            <div className="px-5 pb-5 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={handleEliminarEquipo}
                className="text-xs flex items-center gap-1.5 hover:underline"
                style={{ color: 'var(--danger)' }}
              >
                <Trash2 size={12} /> Eliminar equipo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   PÁGINA PRINCIPAL
   ════════════════════════════════════════ */
export default function EquiposPage() {
  const { user } = useAuth();
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getEquipos();
      setEquipos(Array.isArray(data) ? data : []);
    } catch {
      setEquipos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Mis Equipos</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {equipos.length === 0
              ? 'Crea tu primer equipo e invita a compañeros.'
              : `Eres miembro de ${equipos.length} equipo${equipos.length !== 1 ? 's' : ''}.`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
          style={{ background: 'var(--primary)' }}
        >
          <Plus size={16} /> Crear equipo
        </button>
      </div>

      {/* Equipos list */}
      {equipos.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <Users size={48} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--text)' }} />
          <p className="font-semibold text-lg" style={{ color: 'var(--text)' }}>Sin equipos todavía</p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            Usa el botón <strong>+ Crear equipo</strong> de arriba a la derecha para empezar.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {equipos.map((eq) => (
            <EquipoCard
              key={eq.id}
              equipo={eq}
              currentUserId={user?.id}
              onUpdate={load}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateEquipoModal
          onClose={() => setShowCreate(false)}
          onCreated={(eq) => {
            setEquipos((prev) => [...prev, { ...eq, myRol: 'JEFE_EQUIPO' }]);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}
