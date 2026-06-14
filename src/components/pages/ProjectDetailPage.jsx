import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Users } from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import KanbanBoard from '../kanban/KanbanBoard';
import TaskDetailModal from '../tasks/TaskDetailModal';
import Avatar from '../common/Avatar';
import CreateTaskModal from '../tasks/CreateTaskModal';
import SprintBadge from './projectdetail/SprintBadge';
import SprintDropdown from './projectdetail/SprintDropdown';
import ProjectCharts from './projectdetail/ProjectCharts';
import SprintModal from './projectdetail/SprintModal';
import ProjectTeamsModal from './projectdetail/ProjectTeamsModal';

const PROYECTO_ESTADO_STYLE = {
  ACTIVO:     { bg: 'rgba(63,185,80,.14)', color: '#4ED164' },
  COMPLETADO: { bg: 'var(--primary-soft)', color: 'var(--primary-hover)' },
  ARCHIVADO:  { bg: 'rgba(139,139,148,.14)', color: '#9B9BA5' },
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = parseInt(id);
  const { addToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [subtareas, setSubtareas] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeStatus, setActiveStatus] = useState(null);
  const [selectedSprint, setSelectedSprint] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [prioridadFilter, setPrioridadFilter] = useState('ALL');
  const [asignadoFilter, setAsignadoFilter] = useState('ALL');

  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [createTaskStatus, setCreateTaskStatus] = useState('PENDIENTE');
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [showTeamsModal, setShowTeamsModal] = useState(false);

  const load = async () => {
    try {
      const [proj, projTasks] = await Promise.all([
        api.getProject(projectId),
        api.getTasks({ proyectoId: projectId }).catch(() => []),
      ]);
      setProject(proj);
      setTasks(Array.isArray(projTasks) ? projTasks : []);
      setSprints(Array.isArray(proj.sprints) ? proj.sprints : []);
    } catch {
      addToast('Error al cargar el proyecto', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [projectId]);

  const handleStatusChange = async (taskId, newStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, estado: newStatus } : t)));
    try {
      await api.updateTask(taskId, { estado: newStatus });
    } catch (err) {
      addToast(err.message, 'error');
      load();
    }
  };

  const currentSprint = sprints.find((s) => s.id === selectedSprint) || null;

  const filteredTasks = tasks.filter((t) => {
    if (selectedSprint !== 'ALL' && t.sprintId !== selectedSprint) return false;
    if (searchFilter && !t.titulo.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    if (prioridadFilter !== 'ALL' && t.prioridad !== prioridadFilter) return false;
    if (asignadoFilter !== 'ALL') {
      if (asignadoFilter === 'ME' && t.asignadoAId !== user?.id) return false;
      if (asignadoFilter !== 'ME' && t.asignadoAId !== parseInt(asignadoFilter)) return false;
    }
    return true;
  });

  const doneTasks = tasks.filter((t) => t.estado === 'FINALIZADO').length;
  const progress = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const projectMembers = (project?.miembros || [])
    .map((m) => m.usuario)
    .filter(Boolean);

  const myTeamRole = project?.myProjectRole ?? null;
  const canManageProject = myTeamRole === 'JEFE_EQUIPO' || user?.esAdmin;
  const canCreateSprint = canManageProject || myTeamRole === 'SUPERVISOR';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-[#6B778C]">Proyecto no encontrado.</p>
        <button onClick={() => navigate('/projects')} className="mt-2 text-sm text-[#0052CC] hover:underline">
          Volver a proyectos
        </button>
      </div>
    );
  }

  const estadoStyle = PROYECTO_ESTADO_STYLE[project.estado] || PROYECTO_ESTADO_STYLE.ACTIVO;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Cabecera del proyecto */}
      <div className="bg-white rounded-xl border border-[#DFE1E6] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate('/projects')}
              className="mt-0.5 p-1.5 rounded-lg hover:bg-[#F4F5F7] text-[#6B778C] hover:text-[#172B4D] flex-shrink-0"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-[#172B4D]">{project.nombre}</h1>
                <span className="badge" style={{ background: estadoStyle.bg, color: estadoStyle.color }}>
                  {project.estado}
                </span>
              </div>
              {project.descripcion && (
                <p className="text-sm text-[#6B778C] mt-1">{project.descripcion}</p>
              )}
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {project.lider && (
                  <span className="text-xs text-[#6B778C] flex items-center gap-1.5">
                    <Avatar user={project.lider} size={20} />
                    {project.lider.nombre}
                  </span>
                )}
                <span className="text-xs text-[#6B778C]">{tasks.length} tareas</span>
                <span className="text-xs text-[#6B778C]">{sprints.length} sprints</span>
                {myTeamRole && (
                  <span className="badge" style={{
                    background: myTeamRole === 'JEFE_EQUIPO' ? 'rgba(245,166,35,.15)' : myTeamRole === 'SUPERVISOR' ? 'rgba(167,139,250,.15)' : 'rgba(63,185,80,.15)',
                    color: myTeamRole === 'JEFE_EQUIPO' ? '#f5a623' : myTeamRole === 'SUPERVISOR' ? '#a78bfa' : '#3fb950',
                  }}>
                    {{ JEFE_EQUIPO: 'Jefe de Equipo', SUPERVISOR: 'Supervisor', MIEMBRO: 'Miembro' }[myTeamRole]}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setShowTeamsModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#DFE1E6] text-sm font-medium text-[#172B4D] hover:bg-[#F4F5F7]"
              title="Equipos del proyecto"
            >
              <Users size={15} />
              Equipos ({project.equipos?.length ?? 0})
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-lg font-bold text-[#172B4D]">{progress}%</p>
              <p className="text-[10px] text-[#6B778C]">completado</p>
            </div>
            <div className="w-16">
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <SprintDropdown
          selectedSprint={selectedSprint}
          onSelect={setSelectedSprint}
          sprints={sprints}
          canCreateSprint={canCreateSprint}
          onCreateSprint={() => setShowSprintModal(true)}
        />

        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B778C]" />
          <input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Buscar tarea..."
            className="pl-8 pr-3 py-2 text-sm border border-[#DFE1E6] rounded-lg input-field bg-white text-[#172B4D] placeholder-[#B3BAC5] w-44"
          />
        </div>

        <select
          value={prioridadFilter}
          onChange={(e) => setPrioridadFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-[#DFE1E6] rounded-lg bg-white text-[#172B4D] input-field"
        >
          <option value="ALL">Todas las prioridades</option>
          <option value="URGENTE">Urgente</option>
          <option value="ALTA">Alta</option>
          <option value="MEDIA">Media</option>
          <option value="BAJA">Baja</option>
        </select>

        <select
          value={asignadoFilter}
          onChange={(e) => setAsignadoFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-[#DFE1E6] rounded-lg bg-white text-[#172B4D] input-field"
        >
          <option value="ALL">Todos los usuarios</option>
          <option value="ME">Mis tareas</option>
          {projectMembers.map((u) => (
            <option key={u.id} value={u.id}>{u.nombre}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2">
          {currentSprint && <SprintBadge sprint={currentSprint} />}
          {tasks.length > 0 && (
            <button
              onClick={() => { setCreateTaskStatus('PENDIENTE'); setShowCreateTask(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
              style={{ background: 'var(--primary)' }}
            >
              <Plus size={16} />
              Nueva tarea
            </button>
          )}
        </div>
      </div>

      {/* Gráficas resumen */}
      {tasks.length > 0 && (
        <ProjectCharts tasks={tasks} activeStatus={activeStatus} setActiveStatus={setActiveStatus} />
      )}

      {/* Tablero kanban */}
      <div className="flex-1">
        {tasks.length === 0 ? (
          <div className="text-center py-20 text-[#6B778C]">
            <div className="text-5xl mb-4">🗂️</div>
            <p className="font-semibold text-[#172B4D] text-lg">Sin tareas todavía</p>
            <p className="text-sm mt-1 mb-4">Crea la primera tarea de este proyecto</p>
            <button
              onClick={() => setShowCreateTask(true)}
              className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90"
              style={{ background: 'var(--primary)' }}
            >
              + Crear tarea
            </button>
          </div>
        ) : (
          <KanbanBoard
            tasks={filteredTasks}
            subtareas={subtareas}
            comentarios={comentarios}
            onStatusChange={handleStatusChange}
            onTaskClick={(task) => setSelectedTask(task.id)}
            onAddTask={(status) => {
              setCreateTaskStatus(status);
              setShowCreateTask(true);
            }}
            myTeamRole={myTeamRole}
          />
        )}
      </div>

      {/* Modal de detalle de tarea */}
      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask}
          members={projectMembers}
          onClose={() => setSelectedTask(null)}
          onUpdated={load}
          onDeleted={() => { setSelectedTask(null); load(); }}
        />
      )}

      {/* Modal de nueva tarea */}
      {showCreateTask && (
        <CreateTaskModal
          projectId={projectId}
          members={projectMembers}
          defaultStatus={createTaskStatus}
          onClose={() => setShowCreateTask(false)}
          onCreated={(newTask) => {
            setShowCreateTask(false);
            if (newTask && newTask.id && newTask.proyectoId === projectId) {
              setTasks((prev) =>
                prev.some((t) => t.id === newTask.id) ? prev : [...prev, newTask]
              );
            }
            load();
          }}
        />
      )}

      {/* Modal de crear sprint */}
      {showSprintModal && (
        <SprintModal
          projectId={projectId}
          onClose={() => setShowSprintModal(false)}
          onCreated={() => { setShowSprintModal(false); load(); }}
        />
      )}

      {/* Modal de equipos del proyecto */}
      {showTeamsModal && (
        <ProjectTeamsModal
          projectId={projectId}
          equipos={project.equipos || []}
          canManage={canManageProject}
          onClose={() => setShowTeamsModal(false)}
          onChanged={load}
        />
      )}
    </div>
  );
}
