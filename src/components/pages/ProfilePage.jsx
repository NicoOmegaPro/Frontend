import { useState, useEffect, useRef } from 'react';
import { Save, User, Shield, Camera, Users, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { avatarSrc } from '../../utils/avatar';

const ADMIN_STYLE = { bg: 'rgba(248,81,73,.15)', color: '#f85149' };

const inp = 'w-full border rounded-xl px-4 py-3 text-sm placeholder-[#B3BAC5] input-field transition-all';

function SectionCard({ title, icon: Icon, children, className = '' }) {
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

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({ nombre: user.nombre || '', descripcion: user.descripcion || '' });

    api.getEquipos()
      .then((eq) => setEquipos(Array.isArray(eq) ? eq : []))
      .catch(() => setEquipos([]));
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
  const setPwField = (field) => (e) => setPwForm((prev) => ({ ...prev, [field]: e.target.value }));
  const toggleShow = (field) => setShowPw((prev) => ({ ...prev, [field]: !prev[field] }));

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      addToast('Las contraseñas nuevas no coinciden', 'error'); return;
    }
    if (pwForm.next.length < 6) {
      addToast('La contraseña debe tener al menos 6 caracteres', 'error'); return;
    }
    setPwLoading(true);
    try {
      await api.changePassword(user.id, pwForm.current, pwForm.next);
      addToast('Contraseña actualizada correctamente', 'success');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setPwLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    setLoading(true);
    try {
      const updated = await api.updateUser(user.id, {
        nombre: form.nombre,
        descripcion: form.descripcion,
      });
      setUser((prev) => ({
        ...prev,
        nombre: updated.user?.nombre ?? updated.nombre,
        descripcion: updated.user?.descripcion ?? updated.descripcion,
      }));
      addToast('Perfil actualizado', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const isAdmin = user.esAdmin;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>Mi Perfil</h1>
        <p className="text-[14px] mt-1" style={{ color: 'var(--text-muted)' }}>Gestiona tu información personal</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {}
        <div className="space-y-5">

          {}
          <SectionCard>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="relative group">
                {user.imagenPerfil ? (
                  <img
                    src={avatarSrc(user.imagenPerfil)}
                    alt={user.nombre}
                    className="w-28 h-28 rounded-full object-cover ring-4"
                    style={{ ringColor: 'var(--primary)' }}
                  />
                ) : (
                  <div
                    className="w-28 h-28 rounded-full flex items-center justify-center text-white text-5xl font-bold ring-4"
                    style={{ background: 'var(--primary)', ringColor: 'var(--border)' }}
                  >
                    {user.nombre?.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={handleAvatarClick}
                  disabled={uploadingPhoto}
                  className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.52)' }}
                  title="Cambiar foto"
                >
                  {uploadingPhoto
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Camera size={20} className="text-white" />
                  }
                </button>
                <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
              </div>

              <div>
                <h2 className="font-bold text-[20px] leading-tight" style={{ color: 'var(--text)' }}>
                  {user.nombre}
                </h2>
                <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
              </div>

              {user.descripcion && (
                <p
                  className="text-sm text-left w-full border-t pt-4"
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

          {}
          {equipos.length > 0 && (
            <SectionCard title="Mis equipos" icon={Users}>
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
                      <img
                        src={avatarSrc(eq.imagen)}
                        alt={eq.nombre}
                        className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[15px] font-bold flex-shrink-0"
                        style={{ background: 'var(--primary)' }}
                      >
                        {eq.nombre.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--text)' }}>
                        {eq.nombre}
                      </p>
                      <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
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

        {}
        <div className="lg:col-span-2">
          <SectionCard title="Información personal" icon={User}>
            <form onSubmit={handleSave} className="space-y-5">
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
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-faint)' }}>
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
                  rows={5}
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

            {}
            <div className="my-7" style={{ borderTop: '1px solid var(--border)' }} />

            {}
            <h2 className="font-semibold text-[15px] flex items-center gap-2.5 mb-6" style={{ color: 'var(--text)' }}>
              <Lock size={17} style={{ color: 'var(--primary)' }} />
              Cambiar contraseña
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {[
                { field: 'current', label: 'Contraseña actual' },
                { field: 'next',    label: 'Nueva contraseña' },
                { field: 'confirm', label: 'Confirmar nueva contraseña' },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                    {label}
                  </label>
                  <div className="relative">
                    <input
                      type={showPw[field] ? 'text' : 'password'}
                      value={pwForm[field]}
                      onChange={setPwField(field)}
                      required
                      placeholder="••••••••"
                      className={`${inp} pr-10`}
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleShow(field)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {showPw[field] ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="submit"
                disabled={pwLoading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
                style={{ background: 'var(--primary)' }}
              >
                <Shield size={15} />
                {pwLoading ? 'Actualizando...' : 'Cambiar contraseña'}
              </button>
            </form>
          </SectionCard>
        </div>

      </div>
    </div>
  );
}
