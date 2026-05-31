import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Eye, EyeOff, KanbanSquare, Users, Zap, CheckCircle2 } from 'lucide-react';

const FEATURES = [
  { icon: KanbanSquare, text: 'Tableros Kanban con arrastrar y soltar' },
  { icon: Users,        text: 'Equipos, roles e invitaciones' },
  { icon: Zap,          text: 'Sprints y seguimiento en tiempo real' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      addToast(err.message || 'Error al iniciar sesión', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0747A6 0%, #0052CC 50%, #2684FF 100%)' }}
    >
      <div className="w-full max-w-4xl grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl">
        {/* Brand panel */}
        <div
          className="hidden lg:flex flex-col justify-between p-10 text-white relative"
          style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03))', backdropFilter: 'blur(6px)' }}
        >
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: 'rgba(255,255,255,0.22)' }}
              >
                <span className="text-2xl font-black">K</span>
              </div>
              <span className="text-2xl font-bold tracking-tight">KanbanApp</span>
            </div>
            <h2 className="text-3xl font-extrabold leading-tight mb-3">
              Organiza el trabajo<br />de tu equipo, sin fricción.
            </h2>
            <p className="text-white/70 text-base leading-relaxed">
              Gestión colaborativa de proyectos al estilo Jira, hecha simple.
            </p>
          </div>

          <ul className="space-y-4 mt-10">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.18)' }}
                >
                  <Icon size={18} />
                </span>
                <span className="text-white/90 text-sm font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Form panel */}
        <div className="bg-white p-8 sm:p-10 flex flex-col justify-center">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white"
              style={{ background: 'var(--primary)' }}
            >
              <span className="text-xl font-black">K</span>
            </div>
            <span className="text-xl font-bold text-[#172B4D]">KanbanApp</span>
          </div>

          <h1 className="text-2xl font-extrabold text-[#172B4D] mb-1">Bienvenido de nuevo</h1>
          <p className="text-[#6B778C] text-sm mb-7">Inicia sesión para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#6B778C] uppercase tracking-wide mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="input-field w-full border border-[#DFE1E6] rounded-xl px-4 py-3 text-[15px] text-[#172B4D] placeholder-[#B3BAC5]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6B778C] uppercase tracking-wide mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="input-field w-full border border-[#DFE1E6] rounded-xl px-4 py-3 text-[15px] text-[#172B4D] placeholder-[#B3BAC5] pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B778C] hover:text-[#172B4D]"
                >
                  {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-[15px] disabled:opacity-60 transition-all hover:opacity-90 hover:shadow-lg flex items-center justify-center gap-2"
              style={{ background: 'var(--primary)' }}
            >
              {loading ? 'Iniciando sesión...' : (<><CheckCircle2 size={18} /> Iniciar sesión</>)}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6B778C]">
            ¿No tienes cuenta?{' '}
            <Link
              to="/register"
              className="font-bold hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
