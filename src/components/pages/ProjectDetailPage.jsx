import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Settings, ChevronDown, Search, Filter, Zap, Calendar,
} from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import KanbanBoard from '../kanban/KanbanBoard';
import TaskDetailModal from '../tasks/TaskDetailModal';
import CreateTaskModal from '../tasks/CreateTaskModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';

import { pointerOnHover, centerTextPlugin, statusDoughnutDataset, statusDoughnutOptions } from '../../utils/chartConfig';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const PROYECTO_ESTADO_STYLE = {
  ACTIVO:     { bg: 'rgba(63,185,80,.14)', color: '#4ED164' },
  COMPLETADO: { bg: 'var(--primary-soft)', color: 'var(--primary-hover)' },
  ARCHIVADO:  { bg: 'rgba(139,139,148,.14)', color: '#9B9BA5' },
};
const CHART_GRID = 'rgba(255,255,255,0.06)';
const CHART_TICK = '#8B8B94';

function SprintBadge({ sprint }) {
  if (!sprint) return null;
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-[#DEEBFF] rounded-full">
      <Zap size={12} className="text-[#0052CC]" />
      <span className="text-xs font-semibold text-[#0052CC]">{sprint.nombre}</span>
      {sprint.fechaFin && (
        <span className="text-[10px] text-[#5E6C84]">
          · {format(new Date(sprint.fechaFin), 'dd MMM', { locale: es })}
        </span>
      )}
    </div>
  );
}

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
  const [showSprintDropdown, setShowSprintDropdown] = useState(false);

  const [newSprint, setNewSprint] = useState({ nombre: '', fechaInicio: '', fechaFin: '' });
  const [creatingSprintLoading, setCreatingSprintLoading] = useState(false);

  const canManage = true; // Se calcula después de cargar el proyecto (ver myTeamRole abajo)

  const load = useCallback(async () => {
    try {
      // getProject ya incluye sprints y miembros. getTasks({proyectoId}) trae _count para los contadores.
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
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (taskId, newStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, estado: newStatus } : t)));
    try {
      await api.updateTask(taskId, { estado: newStatus });
    } catch (err) {
      addToast(err.message, 'error');
      load();
    }
  };

  const handleCreateSprint = async (e) => {
    e.preventDefault();
    if (!newSprint.nombre.trim() || !newSprint.fechaInicio || !newSprint.fechaFin) return;
    setCreatingSprintLoading(true);
    try {
      await api.createSprint({
        nombre: newSprint.nombre,
        fechaInicio: new Date(newSprint.fechaInicio).toISOString(),
        fechaFin: new Date(newSprint.fechaFin).toISOString(),
        proyectoId: projectId,
      });
      addToast('Sprint creado', 'success');
      setShowSprintModal(false);
      setNewSprint({ nombre: '', fechaInicio: '', fechaFin: '' });
      load();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setCreatingSprintLoading(false);
    }
  };

  // Filter tasks
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

  // Miembros del proyecto (para el filtro de asignado). Vienen incluidos en GET /projects/:id.
  const projectMembers = (project?.miembros || [])
    .map((m) => m.usuario)
    .filter(Boolean);

  // Rol del usuario en este proyecto (viene del backend)
  const myTeamRole = project?.myProjectRole ?? null;
  const canManageProject = myTeamRole === 'JEFE_EQUIPO' || myTeamRole === 'JEFE_PROYECTO' || user?.rolId === 1;
  const canCreateSprint  = canManageProject || myTeamRole === 'SUPERVISOR';
  const canCreateTask    = !!myTeamRole; // cualquier miembro del proyecto puede crear tarea

  const priorityBarData = {
    labels: ['Urgente', 'Alta', 'Media', 'Baja'],
    datasets: [{
      label: 'Tareas',
      data: [
        tasks.filter((t) => t.prioridad === 'URGENTE').length,
        tasks.filter((t) => t.prioridad === 'ALTA').length,
        tasks.filter((t) => t.prioridad === 'MEDIA').length,
        tasks.filter((t) => t.prioridad === 'BAJA').length,
      ],
      backgroundColor: ['#F0556B', '#FB923C', '#6E76F1', '#38BDF8'],
      borderRadius: 8,
      barThickness: 48,
    }],
  };

  const priorityBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onHover: pointerOnHover,
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 12 }, color: CHART_TICK } },
      y: { ticks: { font: { size: 12 }, stepSize: 1, color: CHART_TICK }, grid: { color: CHART_GRID } },
    },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw} tarea${ctx.raw !== 1 ? 's' : ''}` } },
    },
  };

  const statusDoughnutData = {
    labels: ['Pendiente', 'En progreso', 'En revisión', 'Finalizado'],
    datasets: [
      statusDoughnutDataset(
        [
          tasks.filter((t) => t.estado === 'PENDIENTE').length,
          tasks.filter((t) => t.estado === 'EN_PROGRESO').length,
          tasks.filter((t) => t.estado === 'EN_REVISION').length,
          tasks.filter((t) => t.estado === 'FINALIZADO').length,
        ],
        activeStatus
      ),
    ],
  };

  const statusDoughnutOpts = statusDoughnutOptions(activeStatus, setActiveStatus, 'Tareas', '95%');

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
      {/* Project header */}
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
                  <span className="text-xs text-[#6B778C] flex items-center gap-1">
                    <span className="w-5 h-5 rounded-full bg-[#0052CC] flex items-center justify-center text-white text-[10px] font-bold">
                      {project.lider.nombre.charAt(0)}
                    </span>
                    {project.lider.nombre}
                  </span>
                )}
                <span className="text-xs text-[#6B778C]">{tasks.length} tareas</span>
                <span className="text-xs text-[#6B778C]">{sprints.length} sprints</span>
                {myTeamRole && (
                  <span className="badge" style={{
                    background: myTeamRole === 'JEFE_EQUIPO' ? 'rgba(245,166,35,.15)' : myTeamRole === 'JEFE_PROYECTO' ? 'rgba(90,156,248,.15)' : myTeamRole === 'SUPERVISOR' ? 'rgba(167,139,250,.15)' : 'rgba(63,185,80,.15)',
                    color: myTeamRole === 'JEFE_EQUIPO' ? '#f5a623' : myTeamRole === 'JEFE_PROYECTO' ? '#5a9cf8' : myTeamRole === 'SUPERVISOR' ? '#a78bfa' : '#3fb950',
                  }}>
                    {{ JEFE_EQUIPO: 'Jefe de Equipo', JEFE_PROYECTO: 'Jefe de Proyecto', SUPERVISOR: 'Supervisor', TRABAJADOR: 'Trabajador' }[myTeamRole]}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
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

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Sprint selector */}
        <div className="relative">
          <button
            onClick={() => setShowSprintDropdown(!showSprintDropdown)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-[#DFE1E6] rounded-lg text-sm font-medium text-[#172B4D] hover:bg-[#F4F5F7] transition-colors"
          >
            <Zap size={14} className="text-[#0052CC]" />
            {selectedSprint === 'ALL' ? 'Todos los sprints' : sprints.find((s) => s.id === selectedSprint)?.nombre || 'Sprint'}
            <ChevronDown size={13} />
          </button>
          {showSprintDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSprintDropdown(false)} />
              <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-[#DFE1E6] z-20 min-w-48 py-1">
                <button
                  onClick={() => { setSelectedSprint('ALL'); setShowSprintDropdown(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F4F5F7] ${selectedSprint === 'ALL' ? 'font-semibold text-[#0052CC]' : 'text-[#172B4D]'}`}
                >
                  Todos los sprints
                </button>
                {sprints.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedSprint(s.id); setShowSprintDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F4F5F7] ${selectedSprint === s.id ? 'font-semibold text-[#0052CC]' : 'text-[#172B4D]'}`}
                  >
                    <div>{s.nombre}</div>
                    <div className="text-[10px] text-[#6B778C]">
                      {format(new Date(s.fechaInicio), 'dd MMM', { locale: es })} — {format(new Date(s.fechaFin), 'dd MMM', { locale: es })}
                    </div>
                  </button>
                ))}
                {canCreateSprint && (
                  <>
                    <div className="border-t border-[#DFE1E6] my-1" />
                    <button
                      onClick={() => { setShowSprintDropdown(false); setShowSprintModal(true); }}
                      className="w-full text-left px-3 py-2 text-sm text-[#0052CC] hover:bg-[#F4F5F7] flex items-center gap-2"
                    >
                      <Plus size={13} /> Crear sprint
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B778C]" />
          <input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Buscar tarea..."
            className="pl-8 pr-3 py-2 text-sm border border-[#DFE1E6] rounded-lg input-field bg-white text-[#172B4D] placeholder-[#B3BAC5] w-44"
          />
        </div>

        {/* Priority filter */}
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

        {/* Assignee filter — solo miembros de este proyecto */}
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
          {/* En estado vacío el CTA central ya cubre la creación: evitamos el botón duplicado. */}
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

      {/* Charts row */}
      {tasks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-[#DFE1E6] p-5">
            <p className="text-xs font-bold text-[#6B778C] uppercase tracking-wide mb-3">Por prioridad</p>
            <div style={{ height: 230 }}>
              <Bar data={priorityBarData} options={priorityBarOptions} />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#DFE1E6] p-5">
            <p className="text-xs font-bold text-[#6B778C] uppercase tracking-wide mb-3">Por estado</p>
            <div style={{ height: 230 }}>
              <Doughnut data={statusDoughnutData} options={statusDoughnutOpts} plugins={[centerTextPlugin]} />
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
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

      {/* Task detail modal */}
      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask}
          members={projectMembers}
          onClose={() => setSelectedTask(null)}
          onUpdated={load}
          onDeleted={() => { setSelectedTask(null); load(); }}
        />
      )}

      {/* Create task modal */}
      {showCreateTask && (
        <CreateTaskModal
          projectId={projectId}
          members={projectMembers}
          defaultStatus={createTaskStatus}
          onClose={() => setShowCreateTask(false)}
          onCreated={(newTask) => {
            setShowCreateTask(false);
            // Inserción optimista: la tarea aparece al instante, sin esperar al refetch.
            if (newTask && newTask.id && newTask.proyectoId === projectId) {
              setTasks((prev) =>
                prev.some((t) => t.id === newTask.id) ? prev : [...prev, newTask]
              );
            }
            load();
          }}
        />
      )}

      {/* Create sprint modal */}
      {showSprintModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 modal-backdrop">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm modal-center">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DFE1E6]">
              <h2 className="font-bold text-[#172B4D]">Crear sprint</h2>
              <button
                onClick={() => setShowSprintModal(false)}
                className="p-1.5 rounded-lg hover:bg-[#F4F5F7] text-[#6B778C]"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSprint} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">Nombre *</label>
                <input
                  type="text"
                  value={newSprint.nombre}
                  onChange={(e) => setNewSprint((p) => ({ ...p, nombre: e.target.value }))}
                  required
                  placeholder="Sprint 1"
                  className="input-field w-full border border-[#DFE1E6] rounded-lg px-3 py-2 text-sm text-[#172B4D] placeholder-[#B3BAC5]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">Inicio *</label>
                  <input
                  
                    type="date"
                    value={newSprint.fechaInicio}
                    onChange={(e) => setNewSprint((p) => ({ ...p, fechaInicio: e.target.value }))}
                    required
                    className="input-field w-full border border-[#DFE1E6] rounded-lg px-3 py-2 text-sm text-[#172B4D]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">Fin *</label>
                  <input
                    type="date"
                    value={newSprint.fechaFin}
                    onChange={(e) => setNewSprint((p) => ({ ...p, fechaFin: e.target.value }))}
                    required
                    className="input-field w-full border border-[#DFE1E6] rounded-lg px-3 py-2 text-sm text-[#172B4D]"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSprintModal(false)}
                  className="flex-1 py-2 rounded-lg border border-[#DFE1E6] text-sm font-medium text-[#6B778C] hover:bg-[#F4F5F7]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingSprintLoading}
                  className="flex-1 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-60 hover:opacity-90"
                  style={{ background: 'var(--primary)' }}
                >
                  {creatingSprintLoading ? 'Creando...' : 'Crear sprint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
