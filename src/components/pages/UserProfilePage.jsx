import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Users, Mail, User } from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { avatarSrc } from '../../utils/avatar';

const ADMIN_STYLE = { bg: 'rgba(248,81,73,.15)', color: '#f85149' };

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="rounded-2xl border p-7" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      {title && (
        <h2 className="font-semibold text-[15px] flex items-center gap-2.5 mb-6" style={{ color: 'var(--text)' }}>
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
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Si abro mi propio id, me redirige a /profile (mi perfil editable) en vez de a la vista pública.
  useEffect(() => {
    if (me && userId === me.id) navigate('/profile', { replace: true });
  }, [me, userId, navigate]);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api.getUser(userId)
      .then((u) => {
        if (!u) { setNotFound(true); return; }
        setProfile(u);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
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

  const isAdmin = !!profile.esAdmin;
  // El backend devuelve equipos como filas EquipoUsuario; saco el equipo de cada una.
  const equipos = (profile.equipos || []).map((m) => m.equipo).filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg cursor-pointer transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-[28px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          Perfil de {profile.nombre}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        <div className="space-y-5">

          <SectionCard>
            <div className="flex flex-col items-center text-center gap-4">
              {profile.imagenPerfil ? (
                <img
                  src={avatarSrc(profile.imagenPerfil)}
                  alt={profile.nombre}
                  className="w-28 h-28 rounded-full object-cover ring-4"
                  style={{ ringColor: 'var(--primary)' }}
                />
              ) : (
                <div
                  className="w-28 h-28 rounded-full flex items-center justify-center text-white text-5xl font-bold ring-4"
                  style={{ background: 'var(--primary)', ringColor: 'var(--border)' }}
                >
                  {profile.nombre?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="font-bold text-[20px] leading-tight" style={{ color: 'var(--text)' }}>
                  {profile.nombre}
                </h2>
                <p className="text-[13px] mt-1 flex items-center justify-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <Mail size={13} /> {profile.email}
                </p>
              </div>
              {profile.descripcion && (
                <p className="text-sm text-left w-full border-t pt-4" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                  {profile.descripcion}
                </p>
              )}
            </div>
          </SectionCard>

          {equipos.length > 0 && (
            <SectionCard title="Equipos" icon={Users}>
              <div className="space-y-2">
                {equipos.map((eq) => (
                  <div
                    key={eq.id}
                    onClick={() => navigate(`/equipos?open=${eq.id}`)}
                    className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-colors hover:brightness-110"
                    style={{ background: 'var(--bg-secondary)' }}
                    title={`Abrir ${eq.nombre}`}
                  >
                    {eq.imagen ? (
                      <img src={avatarSrc(eq.imagen)} alt={eq.nombre} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[15px] font-bold flex-shrink-0"
                        style={{ background: 'var(--primary)' }}
                      >
                        {eq.nombre.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--text)' }}>{eq.nombre}</p>
                      <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                        {eq._count?.usuarios ?? 0} miembro{eq._count?.usuarios !== 1 ? 's' : ''}
                        {eq._count?.proyectos > 0 && ` · ${eq._count.proyectos} proyecto${eq._count.proyectos !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        <div className="lg:col-span-2">
          <SectionCard title="Información personal" icon={User}>
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Nombre</p>
                <div
                  className="w-full border rounded-xl px-4 py-3 text-sm"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  {profile.nombre}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Email</p>
                <div
                  className="w-full border rounded-xl px-4 py-3 text-sm flex items-center gap-2"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  <Mail size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  {profile.email}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Descripción / Bio</p>
                <div
                  className="w-full border rounded-xl px-4 py-3 text-sm min-h-[120px]"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border)',
                    color: profile.descripcion ? 'var(--text)' : 'var(--text-faint)',
                    fontStyle: profile.descripcion ? 'normal' : 'italic',
                  }}
                >
                  {profile.descripcion || 'Sin descripción'}
                </div>
              </div>

              {isAdmin && (
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: 'rgba(248,81,73,.08)', border: '1px solid rgba(248,81,73,.2)' }}
                >
                  <Shield size={15} style={{ color: '#f85149', flexShrink: 0 }} />
                  <p className="text-sm font-semibold" style={{ color: '#f85149' }}>Administrador del sistema</p>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

      </div>
    </div>
  );
}
