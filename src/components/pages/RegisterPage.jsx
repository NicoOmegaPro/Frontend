import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api';
import { Eye, EyeOff } from 'lucide-react';

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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0747A6 0%, #0052CC 55%, #2684FF 100%)' }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl shadow-2xl mb-3"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
          >
            <span className="text-white text-2xl font-black">K</span>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">KanbanApp</h1>
          <p className="text-white/60 text-sm mt-1">Crea tu cuenta para empezar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-[#172B4D] text-lg font-semibold mb-6">Crear cuenta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">
                Nombre completo
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                placeholder="Tu nombre"
                className="input-field w-full border border-[#DFE1E6] rounded-lg px-3 py-2.5 text-sm text-[#172B4D] placeholder-[#B3BAC5]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="input-field w-full border border-[#DFE1E6] rounded-lg px-3 py-2.5 text-sm text-[#172B4D] placeholder-[#B3BAC5]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="input-field w-full border border-[#DFE1E6] rounded-lg px-3 py-2.5 text-sm text-[#172B4D] placeholder-[#B3BAC5] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B778C] hover:text-[#172B4D]"
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <p className="text-xs text-[#6B778C] leading-relaxed">
              Tu cuenta se crea sin rol. Obtendrás un rol al crear un equipo (serás su Jefe de Equipo)
              o cuando te asignen uno dentro de un proyecto.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-white font-semibold text-sm disabled:opacity-60 hover:opacity-90 transition-opacity mt-2"
              style={{ background: 'var(--primary)' }}
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#6B778C]">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
