import { useState, useEffect } from 'react';
import { Save, User, Mail, FileText, Shield } from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const ROL_LABEL = {
  1: 'Administrador',
  2: 'Jefe de Proyecto',
  3: 'Supervisor',
  4: 'Trabajador',
};

const ROL_COLOR = {
  1: { bg: '#FFEBE6', color: '#DE350B' },
  2: { bg: '#DEEBFF', color: '#0052CC' },
  3: { bg: '#EAE6FF', color: '#403294' },
  4: { bg: '#E3FCEF', color: '#00875A' },
};

const ACCION_ICON = {
  CREADO: '✨',
  ACTUALIZADO: '✏️',
  ELIMINADO: '🗑️',
  COMPLETADO: '✅',
};

const inp = 'input-field w-full border border-[#DFE1E6] rounded-lg px-3 py-2.5 text-sm text-[#172B4D] placeholder-[#B3BAC5] bg-white';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const [historial, setHistorial] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, done: 0, inProgress: 0 });

  useEffect(() => {
    if (!user) return;
    setForm({ nombre: user.nombre || '', descripcion: user.descripcion || '' });

    Promise.all([
      api.getHistorial().catch(() => []),
      api.getTasks().catch(() => []),
    ]).then(([h, t]) => {
      const myH = Array.isArray(h) ? h.filter((x) => x.usuarioId === user.id).slice(0, 20) : [];
      const myT = Array.isArray(t) ? t.filter((x) => x.asignadoAId === user.id) : [];
      setHistorial(myH);
      setMyTasks(myT);
      setStats({
        total: myT.length,
        done: myT.filter((t) => t.estado === 'FINALIZADO').length,
        inProgress: myT.filter((t) => t.estado === 'EN_PROGRESO').length,
      });
    });
  }, [user]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    setLoading(true);
    try {
      const updated = await api.updateUser(user.id, {
        nombre: form.nombre,
        descripcion: form.descripcion,
      });
      setUser((prev) => ({ ...prev, nombre: updated.nombre, descripcion: updated.descripcion }));
      addToast('Perfil actualizado', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const rolStyle = ROL_COLOR[user.rolId] || ROL_COLOR[4];
  const rolLabel = ROL_LABEL[user.rolId] || 'Usuario';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-[#172B4D]">Mi Perfil</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: avatar + stats */}
        <div className="space-y-4">
          {/* Avatar card */}
          <div className="bg-white rounded-xl border border-[#DFE1E6] p-6 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3"
              style={{ background: 'var(--primary)' }}
            >
              {user.nombre?.charAt(0).toUpperCase()}
            </div>
            <h2 className="font-bold text-[#172B4D] text-base">{user.nombre}</h2>
            <p className="text-sm text-[#6B778C] mt-0.5">{user.email}</p>
            <span
              className="badge mt-2"
              style={{ background: rolStyle.bg, color: rolStyle.color }}
            >
              <Shield size={10} />
              {rolLabel}
            </span>
            {user.descripcion && (
              <p className="text-xs text-[#6B778C] mt-3 text-left border-t border-[#F4F5F7] pt-3">
                {user.descripcion}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="bg-white rounded-xl border border-[#DFE1E6] p-5">
            <h3 className="text-xs font-semibold text-[#6B778C] uppercase tracking-wide mb-3">Mis estadísticas</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#172B4D]">Tareas asignadas</span>
                <span className="font-bold text-[#172B4D]">{stats.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#172B4D]">En progreso</span>
                <span className="font-bold text-[#FF991F]">{stats.inProgress}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#172B4D]">Finalizadas</span>
                <span className="font-bold text-[#00875A]">{stats.done}</span>
              </div>
              {stats.total > 0 && (
                <div className="pt-1">
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${Math.round((stats.done / stats.total) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#6B778C] mt-1">
                    {Math.round((stats.done / stats.total) * 100)}% completado
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: edit form + activity */}
        <div className="lg:col-span-2 space-y-4">
          {/* Edit profile */}
          <div className="bg-white rounded-xl border border-[#DFE1E6] p-6">
            <h2 className="font-semibold text-[#172B4D] text-sm mb-5 flex items-center gap-2">
              <User size={16} className="text-[#0052CC]" />
              Información personal
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={set('nombre')}
                  required
                  className={inp}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className={`${inp} opacity-60 cursor-not-allowed`}
                />
                <p className="text-[10px] text-[#6B778C] mt-1">El email no se puede modificar.</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">
                  Descripción / Bio
                </label>
                <textarea
                  value={form.descripcion}
                  onChange={set('descripcion')}
                  placeholder="Cuéntanos algo sobre ti..."
                  rows={3}
                  className={`${inp} resize-none`}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
                style={{ background: 'var(--primary)' }}
              >
                <Save size={14} />
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          </div>

          {/* Activity feed */}
          <div className="bg-white rounded-xl border border-[#DFE1E6] p-6">
            <h2 className="font-semibold text-[#172B4D] text-sm mb-4 flex items-center gap-2">
              <FileText size={16} className="text-[#0052CC]" />
              Mi actividad reciente
            </h2>
            {historial.length === 0 ? (
              <p className="text-sm text-[#6B778C] text-center py-6">Sin actividad registrada</p>
            ) : (
              <div className="space-y-3">
                {historial.map((h) => (
                  <div key={h.id} className="flex gap-3 items-start pb-3 border-b border-[#F4F5F7] last:border-0 last:pb-0">
                    <span className="text-lg flex-shrink-0">{ACCION_ICON[h.accion] || '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#172B4D]">
                        <span className="font-medium capitalize">{h.accion.toLowerCase()}</span>{' '}
                        <span className="text-[#6B778C]">{h.entidadTipo.toLowerCase()}</span>
                        {h.detalles && <span className="text-[#6B778C]"> — {h.detalles}</span>}
                      </p>
                      <p className="text-[10px] text-[#B3BAC5] mt-0.5">
                        {formatDistanceToNow(new Date(h.fecha), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
