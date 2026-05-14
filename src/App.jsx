import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { KanbanSquare, LogIn, UserPlus, Lock, Mail, User } from 'lucide-react';

const API_URL = 'http://localhost:3000';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al iniciar sesión');
      
      localStorage.setItem('token', data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-700/50 z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-500 p-3 rounded-2xl mb-4 shadow-lg shadow-indigo-500/30">
            <KanbanSquare size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Bienvenido de nuevo</h2>
          <p className="text-slate-400 mt-2 text-sm">Ingresa tus credenciales para continuar</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm text-center font-medium">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" size={20} />
            <input 
              type="email" 
              placeholder="Correo electrónico" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-500"
              required 
            />
          </div>
          
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" size={20} />
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-500"
              required 
            />
          </div>

          <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transform hover:-translate-y-0.5 active:translate-y-0">
            <LogIn size={20} />
            Iniciar Sesión
          </button>
        </form>

        <p className="text-center text-slate-400 mt-8 text-sm">
          ¿No tienes una cuenta? <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}

function Register() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al registrarse');
      
      setSuccess('¡Cuenta creada con éxito! Ya puedes iniciar sesión.');
      setNombre(''); setEmail(''); setPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-[20%] left-[-10%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-700/50 z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-pink-500 p-3 rounded-2xl mb-4 shadow-lg shadow-pink-500/30">
            <UserPlus size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Crear Cuenta</h2>
          <p className="text-slate-400 mt-2 text-sm">Únete a nuestro sistema Kanban</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm text-center font-medium">{error}</div>}
        {success && <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-xl mb-6 text-sm text-center font-medium">{success}</div>}

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-400 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Nombre completo" 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all placeholder-slate-500"
              required 
            />
          </div>

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-400 transition-colors" size={20} />
            <input 
              type="email" 
              placeholder="Correo electrónico" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all placeholder-slate-500"
              required 
            />
          </div>
          
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-400 transition-colors" size={20} />
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all placeholder-slate-500"
              required 
            />
          </div>

          <button type="submit" className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transform hover:-translate-y-0.5 active:translate-y-0">
            Registrarse
          </button>
        </form>

        <p className="text-center text-slate-400 mt-8 text-sm">
          ¿Ya tienes cuenta? <Link to="/" className="text-pink-400 hover:text-pink-300 font-semibold transition-colors">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState({ users: [], projects: [], tasks: [] });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/');

    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [usersRes, projectsRes, tasksRes] = await Promise.all([
          fetch(`${API_URL}/users`, { headers }),
          fetch(`${API_URL}/projects`, { headers }), // No están protegidas en el backend actualmente por AuthGuard (solo users lo está en tu base), pero le pasamos el token por si acaso
          fetch(`${API_URL}/tasks`, { headers })
        ]);
        
        const users = await usersRes.json();
        const projects = await projectsRes.json();
        const tasks = await tasksRes.json();

        setData({
          users: Array.isArray(users) ? users : [],
          projects: Array.isArray(projects) ? projects : [],
          tasks: Array.isArray(tasks) ? tasks : []
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-xl">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <KanbanSquare className="text-indigo-400" size={32} />
            Panel Principal
          </h1>
          <button onClick={() => { localStorage.removeItem('token'); navigate('/'); }} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold px-4 py-2 rounded-xl transition-all border border-red-500/50">
            Cerrar Sesión
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-xl">
            <h2 className="text-xl font-semibold mb-4 text-pink-400 flex items-center gap-2">
              <User size={20} /> Usuarios Registrados
            </h2>
            <ul className="space-y-3">
              {data.users.length === 0 ? <p className="text-slate-500 text-sm">No hay usuarios</p> : null}
              {data.users.map(u => (
                <li key={u.id} className="bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                  <p className="font-medium text-white">{u.nombre}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-xl">
            <h2 className="text-xl font-semibold mb-4 text-indigo-400 flex items-center gap-2">
              <KanbanSquare size={20} /> Proyectos Activos
            </h2>
            <ul className="space-y-3">
              {data.projects.length === 0 ? <p className="text-slate-500 text-sm">No hay proyectos todavía</p> : null}
              {data.projects.map(p => (
                <li key={p.id} className="bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                  {p.nombre}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-xl">
            <h2 className="text-xl font-semibold mb-4 text-purple-400 flex items-center gap-2">
              <KanbanSquare size={20} /> Tareas
            </h2>
            <ul className="space-y-3">
              {data.tasks.length === 0 ? <p className="text-slate-500 text-sm">No hay tareas todavía</p> : null}
              {data.tasks.map(t => (
                <li key={t.id} className="bg-slate-900/50 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                  <span>{t.titulo}</span>
                  <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg">{t.estado}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
