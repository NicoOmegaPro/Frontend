import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.register({ nombre, email, password });
      addToast('Cuenta creada correctamente. ¡Inicia sesión!', 'success');
      navigate('/login');
    } catch (err) {
      addToast(err.message || 'Error al registrarse', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{ background: 'radial-gradient(700px 420px at 50% -10%, var(--primary-soft), transparent 60%)' }}
      />
      <div className="w-full max-w-[400px] relative fade-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <img
              src="/logo.png"
              alt="Noir"
              className="h-10 w-auto object-contain"
              style={{ filter: 'drop-shadow(0 4px 16px var(--ring))' }}
            />
            <span className="text-[26px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>Noir</span>
          </div>
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>Crea tu cuenta</h1>
          <p className="text-[13.5px] mt-1" style={{ color: 'var(--text-muted)' }}>Empieza a organizar tu trabajo</p>
        </div>

        <div className="surface p-7" style={{ boxShadow: 'var(--shadow-md)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Nombre completo</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                placeholder="Tu nombre"
                className="input-field w-full px-3.5 py-2.5 text-[14px]"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="input-field w-full px-3.5 py-2.5 text-[14px]"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Contraseña</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="input-field w-full px-3.5 py-2.5 text-[14px] pr-11"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <p className="text-[12px] leading-relaxed rounded-lg p-3" style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              Tu cuenta se crea sin rol. Obtendrás uno al crear un equipo (serás su Jefe de Equipo) o al unirte a uno (Miembro, y el jefe podrá ascenderte a Supervisor).
            </p>

            <button type="submit" disabled={loading} className="btn btn-primary w-full !py-2.5 group">
              {loading ? 'Creando cuenta...' : (<>Crear cuenta <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></>)}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[13.5px]" style={{ color: 'var(--text-muted)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--primary-hover)' }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
