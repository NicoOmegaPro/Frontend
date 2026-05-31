import { useState, useEffect, useRef } from 'react';
import { Save, User, FileText, Shield, Camera, Users, CheckSquare, Clock, Target } from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const API_BASE = 'http://localhost:3000';

// El único rol global es Administrador (rolId === 1). Los demás roles son por
// equipo y por proyecto, así que el resto de cuentas no muestran badge global.
const ADMIN_STYLE = { bg: 'rgba(248,81,73,.15)', color: '#f85149' };

const ACCION_ICON = { CREADO: '✨', ACTUALIZADO: '✏️', ELIMINADO: '🗑️', COMPLETADO: '✅' };
const ENTIDAD_LABEL = {
  TAREA: 'tarea', PROYECTO: 'proyecto', SPRINT: 'sprint',
  SUBTAREA: 'subtarea', COMENTARIO: 'comentario', ADJUNTO: 'adjunto',
};

const inp = 'w-full border rounded-xl px-4 py-3 text-sm placeholder-[#B3BAC5] input-field transition-all';

function SectionCard({ title, icon: Icon, children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border p-6 ${className}`}
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {title && (
        <h2
          className="font-semibold text-sm flex items-center gap-2 mb-5"
          style={{ color: 'var(--text)' }}
        >
          {Icon && <Icon size={16} style={{ color: 'var(--primary)' }} />}
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { addToast } = useToast();
  const fileRef = useRef(null);

  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const [historial, setHistorial] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [stats, setStats] = useState({ total: 0, done: 0, inProgress: 0, pending: 0, revision: 0 });

  useEffect(() => {
    if (!user) return;
    setForm({ nombre: user.nombre || '', descripcion: user.descripcion || '' });

    Promise.all([
      api.getHistorial().catch(() => []),
      api.getTasks().catch(() => []),
      api.getEquipos().catch(() => []),
    ]).then(([h, t, eq]) => {
      const myH = Array.isArray(h) ? h.filter((x) => x.usuarioId === user.id).slice(0, 30) : [];
      const myT = Array.isArray(t) ? t.filter((x) => x.asignadoAId === user.id) : [];
      setHistorial(myH);
      setMyTasks(myT);
      setEquipos(Array.isArray(eq) ? eq : []);
      setStats({
        total:      myT.length,
        done:       myT.filter((t) => t.estado === 'FINALIZADO').length,
        inProgress: myT.filter((t) => t.estado === 'EN_PROGRESO').length,
        revision:   myT.filter((t) => t.estado === 'EN_REVISION').length,
        pending:    myT.filter((t) => t.estado === 'PENDIENTE').length,
      });
    });
  }, [user]);

  const handleAvatarClick = () => fileRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const result = await api.uploadAvatar(user.id, file);
      setUser((prev) => ({ ...prev, imagenPerfil: result.imagenPerfil }));
      addToast('Foto de perfil actualizada', 'success');
    } catch (err) {
      addToast(err.message || 'Error al subir la foto', 'error');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    setLoading(true);
    try {
      const updated = await api.updateUser(user.id, {
        nombre: form.nombre,
        descripcion: form.descripcion,
      });
      setUser((prev) => ({ ...prev, nombre: updated.user?.nombre ?? updated.nombre, descripcion: updated.user?.descripcion ?? updated.descripcion }));
      addToast('Perfil actualizado', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const isAdmin = user.rolId === 1;
  const completionPct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const doughnutData = {
    labels: ['Finalizadas', 'En progreso', 'En revisión', 'Pendientes'],
    datasets: [{
      data: [stats.done, stats.inProgress, stats.revision, stats.pending],
      backgroundColor: ['#3fb950', '#5a9cf8', '#d29922', '#8892aa'],
      borderWidth: 0,
      hoverOffset: 5,
    }],
  };
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 10, usePointStyle: true, pointStyleWidth: 8 } },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw}` } },
    },
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Mi Perfil</h1>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Gestiona tu información personal
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ── */}
        <div className="space-y-5">

          {/* Avatar card */}
          <SectionCard>
            <div className="flex flex-col items-center text-center gap-3">
              {/* Avatar with upload overlay */}
              <div className="relative group">
                {user.imagenPerfil ? (
                  <img
                    src={`${API_BASE}${user.imagenPerfil}`}
                    alt={user.nombre}
                    className="w-24 h-24 rounded-full object-cover ring-4"
                    style={{ ringColor: 'var(--primary)' }}
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-bold ring-4"
                    style={{ background: 'var(--primary)', ringColor: 'var(--border)' }}
                  >
                    {user.nombre?.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={handleAvatarClick}
                  disabled={uploadingPhoto}
                  className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.5)' }}
                  title="Cambiar foto"
                >
                  {uploadingPhoto ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera size={20} className="text-white" />
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div>
                <h2 className="font-bold text-lg leading-tight" style={{ color: 'var(--text)' }}>
                  {user.nombre}
                </h2>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                {isAdmin && (
                  <span
                    className="badge mt-2"
                    style={{ background: ADMIN_STYLE.bg, color: ADMIN_STYLE.color }}
                  >
                    <Shield size={11} />
                    Administrador
                  </span>
                )}
              </div>

              {user.descripcion && (
                <p
                  className="text-sm text-left w-full border-t pt-3"
                  style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
                >
                  {user.descripcion}
                </p>
              )}

              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                Haz clic en la foto para cambiarla
              </p>
            </div>
          </SectionCard>

          {/* Task stats */}
          <SectionCard title="Mis estadísticas" icon={Target}>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Asignadas', value: stats.total, color: 'var(--text)' },
                { label: 'Finalizadas', value: stats.done, color: '#3fb950' },
                { label: 'En progreso', value: stats.inProgress, color: '#5a9cf8' },
                { label: 'Pendientes', value: stats.pending, color: '#8892aa' },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="rounded-xl p-3 text-center"
                  style={{ background: 'var(--bg-secondary)' }}
                >
                  <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
                </div>
              ))}
            </div>

            {stats.total > 0 && (
              <div style={{ height: 180 }}>
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            )}

            {stats.total === 0 && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                Sin tareas asignadas
              </p>
            )}
          </SectionCard>

          {/* Teams */}
          {equipos.length > 0 && (
            <SectionCard title="Mis equipos" icon={Users}>
              <div className="space-y-2">
                {equipos.map((eq) => (
                  <div
                    key={eq.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: 'var(--primary)' }}
                    >
                      {eq.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                        {eq.nombre}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {eq.usuarios?.length ?? 0} miembro{eq.usuarios?.length !== 1 ? 's' : ''}
                        {eq.proyectos?.length > 0 && ` · ${eq.proyectos.length} proyecto${eq.proyectos.length !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Edit profile form */}
          <SectionCard title="Información personal" icon={User}>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={setField('nombre')}
                  required
                  placeholder="Tu nombre"
                  className={inp}
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className={`${inp} opacity-50 cursor-not-allowed`}
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                  El email no se puede modificar.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                  Descripción / Bio
                </label>
                <textarea
                  value={form.descripcion}
                  onChange={setField('descripcion')}
                  placeholder="Cuéntanos algo sobre ti..."
                  rows={4}
                  className={`${inp} resize-none`}
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
                style={{ background: 'var(--primary)' }}
              >
                <Save size={15} />
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          </SectionCard>

          {/* My tasks preview */}
          {myTasks.length > 0 && (
            <SectionCard title="Mis tareas recientes" icon={CheckSquare}>
              <div className="space-y-2">
                {myTasks.slice(0, 6).map((t) => {
                  const colors = {
                    PENDIENTE: '#8892aa', EN_PROGRESO: '#5a9cf8',
                    EN_REVISION: '#d29922', FINALIZADO: '#3fb950',
                  };
                  const labels = {
                    PENDIENTE: 'Pendiente', EN_PROGRESO: 'En progreso',
                    EN_REVISION: 'En revisión', FINALIZADO: 'Finalizado',
                  };
                  const c = colors[t.estado] ?? '#8892aa';
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: 'var(--bg-secondary)' }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c }} />
                      <span className="flex-1 text-sm truncate" style={{ color: 'var(--text)' }}>{t.titulo}</span>
                      <span
                        className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0"
                        style={{ background: `${c}20`, color: c }}
                      >
                        {labels[t.estado]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* Activity feed */}
          <SectionCard title="Mi actividad reciente" icon={Clock}>
            {historial.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
                Sin actividad registrada
              </p>
            ) : (
              <div className="space-y-1">
                {historial.map((h) => (
                  <div
                    key={h.id}
                    className="flex gap-3 items-start p-3 rounded-xl transition-colors hover:bg-[#F4F5F7]"
                  >
                    <span className="text-xl flex-shrink-0 mt-0.5">{ACCION_ICON[h.accion] || '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: 'var(--text)' }}>
                        <span className="font-medium capitalize">{h.accion.toLowerCase()}</span>{' '}
                        <span style={{ color: 'var(--text-muted)' }}>
                          {ENTIDAD_LABEL[h.entidadTipo] || h.entidadTipo.toLowerCase()}
                        </span>
                        {h.detalles && (
                          <span style={{ color: 'var(--text-muted)' }}> — {h.detalles}</span>
                        )}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                        {formatDistanceToNow(new Date(h.fecha), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
