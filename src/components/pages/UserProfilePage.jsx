import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Users, CheckSquare, Clock, Target, Mail } from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const API_BASE = 'http://localhost:3000';

// El único rol global es Administrador (rolId === 1). El resto de roles son por equipo/proyecto.
const ADMIN_STYLE = { bg: 'rgba(248,81,73,.15)', color: '#f85149' };

const ACCION_ICON = { CREADO: '✨', ACTUALIZADO: '✏️', ELIMINADO: '🗑️', COMPLETADO: '✅' };
const ENTIDAD_LABEL = {
  TAREA: 'tarea', PROYECTO: 'proyecto', SPRINT: 'sprint',
  SUBTAREA: 'subtarea', COMENTARIO: 'comentario', ADJUNTO: 'adjunto', EQUIPO: 'equipo',
};

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="rounded-2xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      {title && (
        <h2 className="font-semibold text-base flex items-center gap-2 mb-5" style={{ color: 'var(--text)' }}>
          {Icon && <Icon size={17} style={{ color: 'var(--primary)' }} />}
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

export default function UserProfilePage() {
  const { id } = useParams();
  const userId = parseInt(id);
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Si miro mi propio id, voy a la página editable.
  useEffect(() => {
    if (me && userId === me.id) navigate('/profile', { replace: true });
  }, [me, userId, navigate]);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    Promise.all([
      api.getUser(userId).catch(() => null),
      api.getTasks().catch(() => []),
      api.getHistorial().catch(() => []),
    ]).then(([u, t, h]) => {
      if (!u) { setNotFound(true); return; }
      setProfile(u);
      setTasks(Array.isArray(t) ? t.filter((x) => x.asignadoAId === userId) : []);
      setHistorial(Array.isArray(h) ? h.filter((x) => x.usuarioId === userId).slice(0, 30) : []);
    }).finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="text-center py-16">
        <p style={{ color: 'var(--text-muted)' }}>No se ha podido cargar este perfil.</p>
        <button onClick={() => navigate(-1)} className="mt-3 text-sm hover:underline cursor-pointer" style={{ color: 'var(--primary)' }}>
          Volver
        </button>
      </div>
    );
  }

  const isAdmin = (profile.rolId ?? profile.rol?.id) === 1;

  const stats = {
    total:      tasks.length,
    done:       tasks.filter((t) => t.estado === 'FINALIZADO').length,
    inProgress: tasks.filter((t) => t.estado === 'EN_PROGRESO').length,
    revision:   tasks.filter((t) => t.estado === 'EN_REVISION').length,
    pending:    tasks.filter((t) => t.estado === 'PENDIENTE').length,
  };

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
      legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 12, usePointStyle: true, pointStyleWidth: 9, color: '#8892aa' } },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw}` } },
    },
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-white/5 cursor-pointer"
          style={{ color: 'var(--text-muted)' }}
          title="Volver"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>Perfil de {profile.nombre}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="space-y-5">
          <SectionCard>
            <div className="flex flex-col items-center text-center gap-3">
              {profile.imagenPerfil ? (
                <img
                  src={`${API_BASE}${profile.imagenPerfil}`}
                  alt={profile.nombre}
                  className="w-24 h-24 rounded-full object-cover ring-4"
                  style={{ ringColor: 'var(--primary)' }}
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-bold ring-4"
                  style={{ background: 'var(--primary)', ringColor: 'var(--border)' }}
                >
                  {profile.nombre?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="font-bold text-lg leading-tight" style={{ color: 'var(--text)' }}>{profile.nombre}</h2>
                <p className="text-sm mt-0.5 flex items-center justify-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <Mail size={13} /> {profile.email}
                </p>
                {isAdmin && (
                  <span className="badge mt-2" style={{ background: ADMIN_STYLE.bg, color: ADMIN_STYLE.color }}>
                    <Shield size={11} />
                    Administrador
                  </span>
                )}
              </div>
              {profile.descripcion && (
                <p className="text-sm text-left w-full border-t pt-3" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                  {profile.descripcion}
                </p>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Estadísticas" icon={Target}>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Asignadas', value: stats.total, color: 'var(--text)' },
                { label: 'Finalizadas', value: stats.done, color: '#3fb950' },
                { label: 'En progreso', value: stats.inProgress, color: '#5a9cf8' },
                { label: 'Pendientes', value: stats.pending, color: '#8892aa' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-secondary)' }}>
                  <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
                </div>
              ))}
            </div>
            {stats.total > 0 ? (
              <div style={{ height: 180 }}>
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            ) : (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                Sin tareas asignadas
              </p>
            )}
          </SectionCard>
        </div>

        {/* Right */}
        <div className="lg:col-span-2 space-y-5">
          <SectionCard title="Tareas recientes" icon={CheckSquare}>
            {tasks.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                Sin tareas asignadas
              </p>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 8).map((t) => {
                  const colors = { PENDIENTE: '#8892aa', EN_PROGRESO: '#5a9cf8', EN_REVISION: '#d29922', FINALIZADO: '#3fb950' };
                  const labels = { PENDIENTE: 'Pendiente', EN_PROGRESO: 'En progreso', EN_REVISION: 'En revisión', FINALIZADO: 'Finalizado' };
                  const c = colors[t.estado] ?? '#8892aa';
                  return (
                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c }} />
                      <span className="flex-1 text-sm truncate" style={{ color: 'var(--text)' }}>{t.titulo}</span>
                      <span className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0" style={{ background: `${c}20`, color: c }}>
                        {labels[t.estado]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Actividad reciente" icon={Clock}>
            {historial.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
                Sin actividad registrada
              </p>
            ) : (
              <div className="space-y-1">
                {historial.map((h) => (
                  <div key={h.id} className="flex gap-3 items-start p-3 rounded-xl">
                    <span className="text-xl flex-shrink-0 mt-0.5">{ACCION_ICON[h.accion] || '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: 'var(--text)' }}>
                        <span className="font-medium capitalize">{h.accion.toLowerCase()}</span>{' '}
                        <span style={{ color: 'var(--text-muted)' }}>
                          {ENTIDAD_LABEL[h.entidadTipo] || h.entidadTipo.toLowerCase()}
                        </span>
                        {h.detalles && <span style={{ color: 'var(--text-muted)' }}> — {h.detalles}</span>}
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
