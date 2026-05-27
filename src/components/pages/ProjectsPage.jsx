import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Trash2, Archive, Search } from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import CreateProjectModal from '../projects/CreateProjectModal';

const ESTADO_STYLE = {
  ACTIVO: { bg: '#E3FCEF', color: '#00875A', label: 'Activo' },
  COMPLETADO: { bg: '#DEEBFF', color: '#0052CC', label: 'Completado' },
  ARCHIVADO: { bg: '#F4F5F7', color: '#6B778C', label: 'Archivado' },
};

const FILTER_TABS = [
  { key: 'ALL', label: 'Todos' },
  { key: 'ACTIVO', label: 'Activos' },
  { key: 'COMPLETADO', label: 'Completados' },
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

  const canManage = user?.rolId === 1 || user?.rolId === 2;

  const load = async () => {
    setLoading(true);
    try {
      const [p, t] = await Promise.all([api.getProjects(), api.getTasks()]);
      setProjects(Array.isArray(p) ? p : []);
      setTasks(Array.isArray(t) ? t : []);
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
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#172B4D]">Proyectos</h1>
          <p className="text-sm text-[#6B778C]">{projects.length} proyectos en total</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: 'var(--primary)' }}
          >
            <Plus size={16} />
            Nuevo proyecto
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B778C]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar proyecto..."
            className="pl-8 pr-3 py-1.5 text-sm border border-[#DFE1E6] rounded-lg input-field bg-white text-[#172B4D] placeholder-[#B3BAC5]"
          />
        </div>
        <div className="flex bg-white border border-[#DFE1E6] rounded-lg overflow-hidden">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-[#0052CC] text-white'
                  : 'text-[#6B778C] hover:bg-[#F4F5F7] hover:text-[#172B4D]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#6B778C]">
          <FolderKanban size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-[#172B4D]">Sin proyectos</p>
          <p className="text-sm mt-1">
            {canManage ? 'Crea tu primer proyecto haciendo clic en "Nuevo proyecto".' : 'No hay proyectos disponibles.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const projectTasks = tasks.filter((t) => t.proyectoId === p.id);
            const done = projectTasks.filter((t) => t.estado === 'FINALIZADO').length;
            const pct = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;
            const statusStyle = ESTADO_STYLE[p.estado] || ESTADO_STYLE.ACTIVO;

            return (
              <div
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="bg-white border border-[#DFE1E6] rounded-xl p-5 cursor-pointer hover:border-[#0052CC] hover:shadow-md transition-all group relative"
              >
                {/* Actions */}
                {canManage && (
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleArchive(e, p)}
                      className="p-1.5 rounded-lg hover:bg-[#F4F5F7] text-[#6B778C] hover:text-[#172B4D]"
                      title={p.estado === 'ARCHIVADO' ? 'Activar' : 'Archivar'}
                    >
                      <Archive size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, p.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-[#6B778C] hover:text-red-500"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: 'var(--primary)' }}
                  >
                    {p.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[#172B4D] group-hover:text-[#0052CC] text-sm truncate pr-10">
                      {p.nombre}
                    </h3>
                    <span
                      className="badge mt-0.5"
                      style={{ background: statusStyle.bg, color: statusStyle.color }}
                    >
                      {statusStyle.label}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#6B778C] mb-4 line-clamp-2 min-h-8">
                  {p.descripcion || 'Sin descripción'}
                </p>

                {p.lider && (
                  <p className="text-xs text-[#6B778C] mb-3 flex items-center gap-1">
                    <span className="w-5 h-5 rounded-full bg-[#0052CC] flex items-center justify-center text-white text-[10px] font-bold">
                      {p.lider.nombre.charAt(0)}
                    </span>
                    {p.lider.nombre}
                  </p>
                )}

                <div>
                  <div className="flex justify-between text-[11px] text-[#6B778C] mb-1.5">
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
