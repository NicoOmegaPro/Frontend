import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users, Plus, Crown, User as UserIcon, Shield, Camera,
  Mail, ChevronDown, ChevronUp, Trash2, X,
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Pagination, { useClientPagination } from '../common/Pagination';
import { avatarSrc } from '../../utils/avatar';

// Único nivel de rol: el del equipo. El jefe puede ascender miembros a Supervisor.
const ROL_META = {
  JEFE_EQUIPO: { label: 'Jefe de Equipo', icon: Crown,    color: '#f5a623', bg: 'rgba(245,166,35,.15)' },
  SUPERVISOR:  { label: 'Supervisor',     icon: Shield,   color: '#a78bfa', bg: 'rgba(167,139,250,.15)' },
  MIEMBRO:     { label: 'Miembro',         icon: UserIcon, color: '#3fb950', bg: 'rgba(63,185,80,.15)' },
};

const inp = 'w-full border rounded-xl px-4 py-2.5 text-sm input-field transition-all';
const inpStyle = { background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text)' };

function RolBadge({ rol }) {
  const m = ROL_META[rol] || ROL_META.MIEMBRO;
  const Icon = m.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1 rounded-full" style={{ background: m.bg, color: m.color }}>
      <Icon size={12} />
      {m.label}
    </span>
  );
}

function Avatar({ user }) {
  if (user?.imagenPerfil) {
    return <img src={avatarSrc(user.imagenPerfil)} alt={user.nombre} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />;
  }
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[15px] font-bold flex-shrink-0" style={{ background: 'var(--primary)' }}>
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
function EquipoCard({ equipo, currentUserId, onUpdate, autoOpen }) {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!autoOpen) return;
    setExpanded(true);
    setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }, [autoOpen]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const isJefe = equipo.myRol === 'JEFE_EQUIPO';
  const membersPg = useClientPagination(equipo.usuarios || [], 6);
  const imgRef = useRef(null);
  const [uploadingImg, setUploadingImg] = useState(false);

  const handleUploadImagen = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      await api.uploadEquipoImagen(equipo.id, file);
      addToast('Imagen del equipo actualizada', 'success');
      onUpdate();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setUploadingImg(false);
      e.target.value = '';
    }
  };

  const handleCambiarRol = async (userId, rol) => {
    try {
      await api.cambiarRolMiembro(equipo.id, userId, rol);
      addToast('Rol actualizado', 'success');
      onUpdate();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

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
    <div ref={cardRef} className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      {/* Header del equipo */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 group/img">
              {equipo.imagen ? (
                <img src={avatarSrc(equipo.imagen)} alt={equipo.nombre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold" style={{ background: 'var(--primary)' }}>
                  {equipo.nombre.charAt(0).toUpperCase()}
                </div>
              )}
              {isJefe && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); imgRef.current?.click(); }}
                    disabled={uploadingImg}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.5)' }}
                    title="Cambiar imagen del equipo"
                  >
                    {uploadingImg
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Camera size={16} className="text-white" />}
                  </button>
                  <input ref={imgRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleUploadImagen} />
                </>
              )}
            </div>
            <div>
              <h3 className="font-bold text-[17px]" style={{ color: 'var(--text)' }}>{equipo.nombre}</h3>
              {equipo.descripcion && (
                <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{equipo.descripcion}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--text)' }}>{equipo.usuarios?.length ?? 0}</strong> miembro{equipo.usuarios?.length !== 1 ? 's' : ''}
                </span>
                <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[14px] font-semibold text-white hover:opacity-90"
                style={{ background: 'var(--primary)' }}
              >
                <Plus size={15} /> Invitar
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2.5 rounded-xl transition-colors"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}
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
                  <img src={avatarSrc(m.usuario.imagenPerfil)} alt={m.usuario.nombre} className="w-full h-full object-cover" />
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
            Los invitados entran como <strong>Miembro</strong>. Luego puedes ascenderlos a <strong>Supervisor</strong> desde la lista de miembros.
          </p>
        </div>
      )}

      {/* Lista de miembros (expanded) */}
      {expanded && (
        <div className="border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="p-6 space-y-2">
            <p className="text-[12px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
              Miembros ({equipo.usuarios?.length ?? 0})
            </p>
            {membersPg.pageItems.map((m) => {
              const isMe = m.usuarioId === currentUserId;
              const isJefeTarget = m.rol === 'JEFE_EQUIPO';
              return (
                <div
                  key={m.usuarioId}
                  onClick={() => navigate(isMe ? '/profile' : `/users/${m.usuarioId}`)}
                  className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-colors hover:brightness-110"
                  style={{ background: 'var(--bg-secondary)' }}
                  title={isMe ? 'Ver mi perfil' : `Ver perfil de ${m.usuario?.nombre}`}
                >
                  <Avatar user={m.usuario} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold hover:underline" style={{ color: 'var(--text)' }}>
                      {m.usuario?.nombre} {isMe && <span className="text-[12px] font-normal" style={{ color: 'var(--text-muted)' }}>(tú)</span>}
                    </p>
                    <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{m.usuario?.email}</p>
                  </div>

                  {/* Rol: editable por el jefe (Supervisor/Miembro), si no badge */}
                  {isJefe && !isMe && !isJefeTarget ? (
                    <select
                      value={m.rol === 'SUPERVISOR' ? 'SUPERVISOR' : 'MIEMBRO'}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => { e.stopPropagation(); handleCambiarRol(m.usuarioId, e.target.value); }}
                      className="text-[12px] font-semibold rounded-lg px-2 py-1 border cursor-pointer flex-shrink-0"
                      style={{ background: 'var(--bg-elev)', borderColor: 'var(--border)', color: 'var(--text)', colorScheme: 'dark' }}
                      title="Cambiar rol del miembro"
                    >
                      <option value="MIEMBRO">Miembro</option>
                      <option value="SUPERVISOR">Supervisor</option>
                    </select>
                  ) : (
                    <RolBadge rol={m.rol} />
                  )}

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
            <Pagination page={membersPg.page} pages={membersPg.pages} onChange={membersPg.setPage} />
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
  const location = useLocation();
  const openId = parseInt(new URLSearchParams(location.search).get('open')) || null;
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const equiposPg = useClientPagination(equipos, 5);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getEquipos();
      const list = Array.isArray(data) ? data : [];
      setEquipos(list);
      if (openId) {
        const idx = list.findIndex((e) => e.id === openId);
        if (idx >= 0) equiposPg.setPage(Math.floor(idx / 5) + 1);
      }
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
          <h1 className="text-[28px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>Mis Equipos</h1>
          <p className="text-[14px] mt-1" style={{ color: 'var(--text-muted)' }}>
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
        <>
          <div className="space-y-4">
            {equiposPg.pageItems.map((eq) => (
              <EquipoCard
                key={eq.id}
                equipo={eq}
                currentUserId={user?.id}
                onUpdate={load}
                autoOpen={eq.id === openId}
              />
            ))}
          </div>
          <Pagination page={equiposPg.page} pages={equiposPg.pages} onChange={equiposPg.setPage} total={equipos.length} label="equipos" />
        </>
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
