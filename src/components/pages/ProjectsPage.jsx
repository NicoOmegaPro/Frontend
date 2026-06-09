import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Trash2, Archive, Search, Users } from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import CreateProjectModal from '../projects/CreateProjectModal';
import Avatar from '../common/Avatar';

const ESTADO_STYLE = {
  ACTIVO:     { bg: 'rgba(63,185,80,.14)',   color: '#4ED164', label: 'Activo' },
  COMPLETADO: { bg: 'var(--primary-soft)',   color: 'var(--primary-hover)', label: 'Completado' },
  ARCHIVADO:  { bg: 'rgba(139,139,148,.14)', color: '#9B9BA5', label: 'Archivado' },
};

const FILTER_TABS = [
  { key: 'ALL',       label: 'Todos' },
  { key: 'ACTIVO',    label: 'Activos' },
  { key: 'COMPLETADO',label: 'Completados' },
  { key: 'ARCHIVADO', label: 'Archivados' },
];

export default function ProjectsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isLeader, setIsLeader] = useState(false);

  const canManage = user?.esAdmin || isLeader;

  const load = async () => {
    setLoading(true);
    try {
      const [p, t, eq] = await Promise.all([
        api.getProjects(),
        api.getTasks().catch(() => []),
        api.getEquipos().catch(() => []),
      ]);
      setProjects(Array.isArray(p) ? p : []);
      setTasks(Array.isArray(t) ? t : []);
      setIsLeader((Array.isArray(eq) ? eq : []).some((e) => e.myRol === 'JEFE_EQUIPO'));
    } catch {
      addToast('Error al cargar proyectos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar este proyecto? Se eliminarán todas sus tareas.')) return;
    try {
      await api.deleteProject(id);
      addToast('Proyecto eliminado', 'success');
      load();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleArchive = async (e, p) => {
    e.stopPropagation();
    try {
      await api.updateProject(p.id, { estado: p.estado === 'ARCHIVADO' ? 'ACTIVO' : 'ARCHIVADO' });
      addToast('Proyecto actualizado', 'success');
      load();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const filtered = projects.filter((p) => {
    const matchStatus = filter === 'ALL' || p.estado === filter;
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.descripcion || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>Proyectos</h1>
          <p className="text-[14px] mt-1" style={{ color: 'var(--text-muted)' }}>
            {projects.length} {projects.length === 1 ? 'proyecto' : 'proyectos'} en total
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-[14px] font-semibold hover:opacity-90 transition-opacity"
            style={{ background: 'var(--primary)' }}
          >
            <Plus size={16} />
            Nuevo proyecto
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar proyecto..."
            className="pl-10 pr-4 py-2.5 text-[14px] rounded-xl input-field"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>
        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="px-4 py-2.5 text-[13px] font-medium transition-all"
              style={{
                background: filter === tab.key ? 'var(--primary)' : 'var(--bg-secondary)',
                color: filter === tab.key ? '#fff' : 'var(--text-muted)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-9 h-9 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <FolderKanban size={48} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--text)' }} />
          <p className="font-semibold text-[16px]" style={{ color: 'var(--text)' }}>Sin proyectos</p>
          <p className="text-[14px] mt-2" style={{ color: 'var(--text-muted)' }}>
            {canManage
              ? 'Crea tu primer proyecto con el botón de arriba.'
              : 'No hay proyectos disponibles aún.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((p) => {
            const projectTasks = tasks.filter((t) => t.proyectoId === p.id);
            const done = projectTasks.filter((t) => t.estado === 'FINALIZADO').length;
            const pct = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;
            const statusStyle = ESTADO_STYLE[p.estado] || ESTADO_STYLE.ACTIVO;

            return (
              <div
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="border rounded-2xl p-5 cursor-pointer transition-all group relative hover:shadow-xl"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                {canManage && (
                  <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleArchive(e, p)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
                      title={p.estado === 'ARCHIVADO' ? 'Activar' : 'Archivar'}
                    >
                      <Archive size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, p.id)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-[15px] flex-shrink-0"
                    style={{ background: 'var(--primary)' }}
                  >
                    {p.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[15px] truncate pr-12 group-hover:underline" style={{ color: 'var(--text)' }}>
                      {p.nombre}
                    </h3>
                    <span className="badge mt-1" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                      {statusStyle.label}
                    </span>
                  </div>
                </div>

                <p className="text-[13px] mb-4 line-clamp-2 min-h-[38px]" style={{ color: 'var(--text-muted)' }}>
                  {p.descripcion || 'Sin descripción'}
                </p>

                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {p.lider && (
                    <div className="flex items-center gap-2">
                      <Avatar user={p.lider} size={20} />
                      <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{p.lider.nombre}</span>
                    </div>
                  )}
                  {p.equipo?.nombre && (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                      title="Equipo del proyecto"
                    >
                      <Users size={11} /> {p.equipo.nombre}
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-[12px] mb-2" style={{ color: 'var(--text-muted)' }}>
                    <span>{projectTasks.length} tareas</span>
                    <span>{pct}% completado</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}
    </div>
  );
}
