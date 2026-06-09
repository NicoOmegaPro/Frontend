import { useState } from 'react';
import { Save, User, Lock, Shield, Eye, EyeOff } from 'lucide-react';
import { api } from '../../../api';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import SectionCard from './SectionCard';

const inp = 'w-full border rounded-xl px-4 py-3 text-sm placeholder-[#B3BAC5] input-field transition-all';

export default function PersonalInfoForm() {
  const { user, setUser } = useAuth();
  const { addToast } = useToast();

  const [form, setForm] = useState({ nombre: user.nombre || '', descripcion: user.descripcion || '' });
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const setPwField = (field) => (e) => setPwForm((prev) => ({ ...prev, [field]: e.target.value }));
  const toggleShow = (field) => setShowPw((prev) => ({ ...prev, [field]: !prev[field] }));

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

  return (
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

      {/* Separador */}
      <div className="my-7" style={{ borderTop: '1px solid var(--border)' }} />

      {/* Cambio de contraseña */}
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
  );
}
