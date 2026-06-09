import { useState, useEffect, useRef } from 'react';
import { X, Trash2, Plus, Check, Edit2 } from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Avatar from '../common/Avatar';
import { SectionHeader } from './taskdetail/ui';
import { getAdjuntoUrl, isImageFile } from './taskdetail/constants';
import SubtaskRow from './taskdetail/SubtaskRow';
import AdjuntoCard from './taskdetail/AdjuntoCard';
import DropZone from './taskdetail/DropZone';
import CommentInput from './taskdetail/CommentInput';
import TaskSidebar from './taskdetail/TaskSidebar';

export default function TaskDetailModal({ taskId, members, onClose, onUpdated, onDeleted }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [task, setTask] = useState(null);
  const [subtareas, setSubtareas] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [adjuntos, setAdjuntos] = useState([]);
  const [users, setUsers] = useState(Array.isArray(members) ? members : []);
  const [sprints, setSprints] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [titleVal, setTitleVal] = useState('');
  const [descVal, setDescVal] = useState('');

  const [newSubtask, setNewSubtask] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);

  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const [uploadingAdjunto, setUploadingAdjunto] = useState(false);
  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const t = await api.getTask(taskId);
      const [allSprints, etiq] = await Promise.all([
        api.getSprints(t.proyectoId).catch(() => []),
        api.getEtiquetas().catch(() => []),
      ]);
      setTask(t);
      setTitleVal(t.titulo);
      setDescVal(t.descripcion || '');
      setSubtareas(Array.isArray(t.subtareas) ? t.subtareas : []);
      setComentarios(Array.isArray(t.comentarios) ? t.comentarios : []);
      setAdjuntos(Array.isArray(t.adjuntos) ? t.adjuntos : []);
      setUsers(Array.isArray(members) ? members : []);
      setSprints(Array.isArray(allSprints) ? allSprints : []);
      setEtiquetas(Array.isArray(etiq) ? etiq : []);
    } catch {
      addToast('Error al cargar la tarea', 'error');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [taskId]);

  const updateTask = async (data) => {
    try {
      const updated = await api.updateTask(taskId, data);
      setTask((prev) => ({ ...prev, ...updated }));
      onUpdated?.();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const toggleEtiqueta = async (etiquetaId) => {
    const has = (task.etiquetas || []).some((te) => te.etiquetaId === etiquetaId);
    try {
      const nuevas = has
        ? await api.removeEtiquetaTarea(taskId, etiquetaId)
        : await api.addEtiquetaTarea(taskId, etiquetaId);
      setTask((prev) => ({ ...prev, etiquetas: Array.isArray(nuevas) ? nuevas : prev.etiquetas }));
      onUpdated?.();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const saveTitle = async () => {
    if (!titleVal.trim() || titleVal === task.titulo) { setEditingTitle(false); return; }
    await updateTask({ titulo: titleVal });
    setEditingTitle(false);
  };

  const saveDesc = async () => {
    if (descVal === task.descripcion) { setEditingDesc(false); return; }
    await updateTask({ descripcion: descVal });
    setEditingDesc(false);
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar la tarea "${task.titulo}"?`)) return;
    try {
      await api.deleteTask(taskId);
      addToast('Tarea eliminada', 'success');
      onDeleted?.();
      onClose();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    try {
      const s = await api.createSubtarea({ titulo: newSubtask, tareaId: taskId });
      setSubtareas((prev) => [...prev, s]);
      setNewSubtask('');
      setAddingSubtask(false);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const toggleSubtask = async (s) => {
    try {
      const updated = await api.updateSubtarea(s.id, { completada: !s.completada });
      setSubtareas((prev) => prev.map((x) => (x.id === s.id ? updated : x)));
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const deleteSubtask = async (id) => {
    try {
      await api.deleteSubtarea(id);
      setSubtareas((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const sendComment = async () => {
    if (!newComment.trim()) return;
    setSendingComment(true);
    try {
      const c = await api.createComentario({ contenido: newComment, tareaId: taskId });
      setComentarios((prev) => [...prev, c.autor ? c : { ...c, autor: { nombre: user.nombre } }]);
      setNewComment('');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSendingComment(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAdjunto(true);
    try {
      const uploaded = await api.uploadAdjunto(file);
      const a = await api.createAdjunto({ nombre: uploaded.nombre, rutaLocal: uploaded.rutaLocal, tareaId: taskId });
      setAdjuntos((prev) => [...prev, a]);
      addToast('Archivo subido correctamente', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setUploadingAdjunto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deleteAdjunto = async (id) => {
    try {
      await api.deleteAdjunto(id);
      setAdjuntos((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const subtasksDone = subtareas.filter((s) => s.completada).length;
  const subtasksPct = subtareas.length ? Math.round((subtasksDone / subtareas.length) * 100) : 0;
  const isOverdue = task && task.fechaVencimiento && task.estado !== 'FINALIZADO' && new Date(task.fechaVencimiento) < new Date();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center modal-backdrop">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-7 h-7 rounded-full border-[3px] animate-spin"
            style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
          />
        </div>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 modal-backdrop"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl flex flex-col rounded-2xl shadow-2xl overflow-hidden modal-center"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Cabecera: ruta de la tarea + acciones */}
        <div
          className="flex items-center justify-between px-6 py-3.5 flex-shrink-0 border-b"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="font-medium">{task.proyecto?.nombre || 'Proyecto'}</span>
            <span>/</span>
            <span className="font-semibold" style={{ color: 'var(--text)' }}>TAREA-{task.id}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(240,85,107,.12)'; e.currentTarget.style.color = '#F0556B'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              title="Eliminar tarea"
            >
              <Trash2 size={15} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Cuerpo: columna principal + barra lateral */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Columna principal */}
          <div className="flex-1 overflow-y-auto px-8 py-7 space-y-8">

            {/* Título (editable al hacer click) */}
            <div>
              {editingTitle ? (
                <div className="flex gap-2 items-start">
                  <input
                    autoFocus
                    value={titleVal}
                    onChange={(e) => setTitleVal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                    className="flex-1 text-[22px] font-bold border-b-2 outline-none bg-transparent pb-1"
                    style={{ color: 'var(--text)', borderColor: 'var(--primary)' }}
                  />
                  <button onClick={saveTitle} className="mt-1.5 p-1.5 rounded-lg" style={{ color: 'var(--primary)' }}>
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingTitle(false)} className="mt-1.5 p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-start gap-2 group cursor-pointer" onClick={() => setEditingTitle(true)}>
                  <h1 className="text-[22px] font-bold flex-1 leading-snug" style={{ color: 'var(--text)' }}>
                    {task.titulo}
                  </h1>
                  <Edit2 size={14} className="mt-2 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" style={{ color: 'var(--text-muted)' }} />
                </div>
              )}
            </div>

            {/* Descripción */}
            <div>
              <SectionHeader>Descripción</SectionHeader>
              {editingDesc ? (
                <div>
                  <textarea
                    autoFocus
                    value={descVal}
                    onChange={(e) => setDescVal(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl px-4 py-3 text-sm border resize-none focus:outline-none"
                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--primary)', color: 'var(--text)' }}
                    placeholder="Añade una descripción..."
                  />
                  <div className="flex gap-2 mt-2.5">
                    <button
                      onClick={saveDesc}
                      className="px-4 py-1.5 rounded-lg text-white text-xs font-semibold"
                      style={{ background: 'var(--primary)' }}
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingDesc(false)}
                      className="px-4 py-1.5 rounded-lg text-xs border transition-colors"
                      style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setEditingDesc(true)}
                  className="text-sm rounded-xl px-4 py-3 cursor-pointer min-h-[52px] transition-opacity hover:opacity-80"
                  style={{
                    color: task.descripcion ? 'var(--text)' : 'var(--text-faint)',
                    background: 'var(--bg-secondary)',
                    fontStyle: task.descripcion ? 'normal' : 'italic',
                  }}
                >
                  {task.descripcion || 'Haz clic para añadir una descripción...'}
                </div>
              )}
            </div>

            {/* Subtareas */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <SectionHeader>
                  Subtareas
                  {subtareas.length > 0 && (
                    <span className="ml-1 text-[10px] normal-case font-medium" style={{ color: 'var(--text-muted)' }}>
                      {subtasksDone}/{subtareas.length}
                    </span>
                  )}
                </SectionHeader>
                <button
                  onClick={() => setAddingSubtask(true)}
                  className="flex items-center gap-1 text-xs font-semibold"
                  style={{ color: 'var(--primary)' }}
                >
                  <Plus size={13} /> Añadir
                </button>
              </div>

              {subtareas.length > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${subtasksPct}%`, background: 'var(--primary)' }}
                    />
                  </div>
                  <span className="text-[11px] font-medium flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {subtasksPct}%
                  </span>
                </div>
              )}

              <div className="space-y-1">
                {subtareas.map((s) => (
                  <SubtaskRow
                    key={s.id}
                    subtask={s}
                    onToggle={() => toggleSubtask(s)}
                    onDelete={() => deleteSubtask(s.id)}
                  />
                ))}
              </div>

              {addingSubtask && (
                <div className="flex gap-2 mt-3">
                  <input
                    autoFocus
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addSubtask(); if (e.key === 'Escape') setAddingSubtask(false); }}
                    placeholder="Nombre de la subtarea..."
                    className="flex-1 rounded-lg px-3 py-2 text-sm border focus:outline-none"
                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                  <button
                    onClick={addSubtask}
                    className="px-3 py-2 rounded-lg text-white text-xs font-semibold"
                    style={{ background: 'var(--primary)' }}
                  >
                    Añadir
                  </button>
                  <button onClick={() => setAddingSubtask(false)} className="px-2 py-2" style={{ color: 'var(--text-muted)' }}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Adjuntos */}
            <div>
              <SectionHeader>Adjuntos ({adjuntos.length})</SectionHeader>
              <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt" className="hidden" onChange={handleFileUpload} />

              {adjuntos.length === 0 && !uploadingAdjunto && (
                <DropZone onClick={() => fileInputRef.current?.click()} />
              )}

              {uploadingAdjunto && (
                <div className="flex items-center justify-center gap-2.5 py-5 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
                  Subiendo archivo...
                </div>
              )}

              {adjuntos.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {adjuntos.map((a) => {
                    const imgUrl = getAdjuntoUrl(a.rutaLocal);
                    const isImg = isImageFile(a.nombre, a.rutaLocal);
                    return (
                      <AdjuntoCard
                        key={a.id}
                        adjunto={a}
                        imgUrl={imgUrl}
                        isImg={isImg}
                        onDelete={() => deleteAdjunto(a.id)}
                      />
                    );
                  })}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAdjunto}
                    className="border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 h-28 disabled:opacity-50 transition-colors"
                    style={{ borderColor: 'var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <Plus size={18} style={{ color: 'var(--text-faint)' }} />
                    <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Añadir</span>
                  </button>
                </div>
              )}
            </div>

            {/* Comentarios */}
            <div>
              <SectionHeader>Comentarios ({comentarios.length})</SectionHeader>

              <div className="flex gap-3 mb-6">
                <Avatar user={user} size={28} />
                <div className="flex-1">
                  <CommentInput
                    value={newComment}
                    onChange={setNewComment}
                    onSubmit={sendComment}
                    sending={sendingComment}
                  />
                </div>
              </div>

              <div className="space-y-5">
                {[...comentarios].reverse().map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <Avatar user={c.autor} size={28} />
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2.5 mb-1.5">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                          {c.autor?.nombre || 'Usuario'}
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {formatDistanceToNow(new Date(c.fecha), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                      <div className="rounded-xl px-4 py-2.5 text-sm leading-relaxed" style={{ background: 'var(--card-hover)', color: 'var(--text)' }}>
                        {c.contenido}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Barra lateral con las propiedades de la tarea */}
          <TaskSidebar
            task={task}
            etiquetas={etiquetas}
            sprints={sprints}
            users={users}
            subtareas={subtareas}
            subtasksDone={subtasksDone}
            subtasksPct={subtasksPct}
            isOverdue={isOverdue}
            onUpdate={updateTask}
            onToggleEtiqueta={toggleEtiqueta}
          />

        </div>
      </div>
    </div>
  );
}