import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Eye, EyeOff, KanbanSquare, Users, Zap, ArrowRight } from 'lucide-react';

const FEATURES = [
  { icon: KanbanSquare, title: 'Tableros Kanban', text: 'Arrastra y suelta, en tiempo real.' },
  { icon: Users,        title: 'Equipos y roles', text: 'Invitaciones, permisos y supervisión.' },
  { icon: Zap,          title: 'Sprints',         text: 'Planifica y mide el progreso.' },
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
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Brand panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[46%] p-12 relative overflow-hidden"
        style={{ borderRight: '1px solid var(--border)' }}
      >
        <div
          className="absolute inset-0 opacity-[0.35] pointer-events-none"
          style={{
            background: 'radial-gradient(600px 400px at 20% 10%, var(--primary-soft), transparent 60%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(var(--hairline) 1px, transparent 1px), linear-gradient(90deg, var(--hairline) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(80% 80% at 50% 30%, #000, transparent)',
          }}
        />

        <div />

        <div className="relative">
          <div className="flex items-center gap-5 mb-8">
            <img
              src="/logo.png"
              alt="Noir"
              className="h-44 w-auto object-contain"
              style={{ filter: 'drop-shadow(0 10px 40px var(--ring))' }}
            />
            <span className="text-[52px] font-bold tracking-tight leading-none" style={{ color: 'var(--text)' }}>Noir</span>
          </div>
          <h2 className="text-[40px] font-bold leading-[1.1] tracking-tight" style={{ color: 'var(--text)' }}>
            El trabajo de tu equipo,<br />
            <span style={{ color: 'var(--text-faint)' }}>sin fricción.</span>
          </h2>
          <p className="mt-4 text-[15px] max-w-sm" style={{ color: 'var(--text-muted)' }}>
            Gestión de proyectos colaborativa, diseñada para moverse rápido.
          </p>

          <div className="mt-10 space-y-1">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-start gap-3.5 p-3 rounded-xl transition-colors hover:bg-[var(--bg-secondary)]">
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--primary-hover)' }}
                >
                  <Icon size={17} />
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>{title}</p>
                  <p className="text-[12.5px]" style={{ color: 'var(--text-muted)' }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-[12px]" style={{ color: 'var(--text-faint)' }}>
          © {new Date().getFullYear()} Noir · Gestión de proyectos
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[380px] fade-up">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img src="/logo.png" alt="Noir" className="h-10 w-auto object-contain" />
            <span className="text-[26px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>Noir</span>
          </div>

          <h1 className="text-[26px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>Bienvenido de nuevo</h1>
          <p className="text-[14px] mt-1.5 mb-8" style={{ color: 'var(--text-muted)' }}>Inicia sesión para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="••••••••"
                  className="input-field w-full px-3.5 py-2.5 text-[14px] pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-faint)' }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full !py-2.5 mt-2 group">
              {loading ? 'Iniciando sesión...' : (<>Iniciar sesión <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></>)}
            </button>
          </form>

          <p className="mt-7 text-center text-[13.5px]" style={{ color: 'var(--text-muted)' }}>
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--primary-hover)' }}>
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
