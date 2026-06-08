import { useState, useEffect, useRef } from 'react';
import {
  X, Trash2, Plus, Check, Send, Edit2, Upload, Image,
  FileText, File, ChevronDown,
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import Avatar from '../common/Avatar';

const BACKEND = import.meta.env.VITE_BACKEND_URL || (import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, '') : 'http://localhost:3000');
const ESTADOS = ['PENDIENTE', 'EN_PROGRESO', 'EN_REVISION', 'FINALIZADO'];
const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'];

function getAdjuntoUrl(rutaLocal) {
  if (!rutaLocal) return '';
  if (rutaLocal.startsWith('http')) return rutaLocal;
  return `${BACKEND}${rutaLocal}`;
}

function isImageFile(nombre, rutaLocal) {
  const str = (nombre || rutaLocal || '').toLowerCase();
  return /\.(jpg|jpeg|png|gif|webp|avif)$/.test(str) || str.includes('picsum.photos');
}

function FileIcon({ nombre }) {
  const ext = (nombre || '').split('.').pop().toLowerCase();
  return ext === 'pdf' ? (
    <FileText size={26} className="text-red-400" />
  ) : ['doc', 'docx'].includes(ext) ? (
    <FileText size={26} className="text-blue-400" />
  ) : (
    <File size={26} style={{ color: 'var(--text-muted)' }} />
  );
}

const ESTADO_STYLE = {
  PENDIENTE:   { bg: 'rgba(139,139,148,.18)', color: '#B6B6BF', label: 'Pendiente' },
  EN_PROGRESO: { bg: 'rgba(110,118,241,.18)', color: '#8A90F7', label: 'En progreso' },
  EN_REVISION: { bg: 'rgba(224,168,46,.18)',  color: '#E0A82E', label: 'En revisión' },
  FINALIZADO:  { bg: 'rgba(63,185,80,.18)',   color: '#4ED164', label: 'Finalizado' },
};

const PRI_STYLE = {
  BAJA:    { color: '#38BDF8', bg: 'rgba(56,189,248,.18)',  label: 'Baja',    dot: 'bg-sky-400' },
  MEDIA:   { color: '#6E76F1', bg: 'rgba(110,118,241,.18)', label: 'Media',   dot: 'bg-indigo-400' },
  ALTA:    { color: '#FB923C', bg: 'rgba(251,146,60,.18)',  label: 'Alta',    dot: 'bg-orange-400' },
  URGENTE: { color: '#F0556B', bg: 'rgba(240,85,107,.18)',  label: 'Urgente', dot: 'bg-rose-400' },
};

function PropLabel({ children }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
      {children}
    </p>
  );
}

function DropdownItem({ children, active, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors"
      style={{
        background: hovered || active ? 'var(--bg-secondary)' : 'transparent',
        color: 'var(--text)',
      }}
    >
      {children}
    </button>
  );
}

function SelectDropdown({ value, options, onChange, renderOption, renderValue }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors border w-full"
        style={{ borderColor: 'var(--border)', background: 'var(--card-hover)' }}
      >
        <span className="flex-1 text-left">{renderValue(value)}</span>
        <ChevronDown size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full mt-1 rounded-xl shadow-2xl z-30 w-full min-w-44 py-1.5 border"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          {options.map((opt) => (
            <DropdownItem
              key={opt}
              active={opt === value}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {renderOption(opt)}
              {opt === value && <Check size={11} className="ml-auto flex-shrink-0" style={{ color: 'var(--primary)' }} />}
            </DropdownItem>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ children }) {
  return (
    <h3
      className="text-[11px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1"
      style={{ color: 'var(--text-muted)' }}
    >
      {children}
    </h3>
  );
}

function Divider() {
  return <div className="h-px my-1" style={{ background: 'var(--border)' }} />;
}

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

        {}
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

        {}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {}
          <div className="flex-1 overflow-y-auto px-8 py-7 space-y-8">

            {}
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

            {}
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

            {}
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

            {}
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

            {}
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

          {}
          <div
            className="w-60 flex-shrink-0 border-l overflow-y-auto px-5 py-6 space-y-5"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
          >
            <div>
              <PropLabel>Estado</PropLabel>
              <SelectDropdown
                value={task.estado}
                options={ESTADOS}
                onChange={(v) => updateTask({ estado: v })}
                renderValue={(v) => { const s = ESTADO_STYLE[v]; return <span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>; }}
                renderOption={(v) => { const s = ESTADO_STYLE[v]; return <span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>; }}
              />
            </div>

            <div>
              <PropLabel>Prioridad</PropLabel>
              <SelectDropdown
                value={task.prioridad}
                options={PRIORIDADES}
                onChange={(v) => updateTask({ prioridad: v })}
                renderValue={(v) => { const p = PRI_STYLE[v]; return <span className="badge" style={{ background: p.bg, color: p.color }}><span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />{p.label}</span>; }}
                renderOption={(v) => { const p = PRI_STYLE[v]; return <span className="badge" style={{ background: p.bg, color: p.color }}><span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />{p.label}</span>; }}
              />
            </div>

            <div>
              <PropLabel>Etiquetas</PropLabel>
              <div className="flex flex-wrap gap-1.5">
                {etiquetas.map((et) => {
                  const active = (task.etiquetas || []).some((te) => te.etiquetaId === et.id);
                  return (
                    <button
                      key={et.id}
                      onClick={() => toggleEtiqueta(et.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all"
                      style={active
                        ? { background: `${et.color}22`, color: et.color, boxShadow: `inset 0 0 0 1px ${et.color}` }
                        : { background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                      title={active ? 'Quitar etiqueta' : 'Añadir etiqueta'}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: et.color }} />
                      {et.nombre}
                    </button>
                  );
                })}
                {etiquetas.length === 0 && (
                  <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>No hay etiquetas</span>
                )}
              </div>
            </div>

            <div>
              <PropLabel>Asignado a</PropLabel>
              <div className="flex items-center gap-2">
                {task.asignadoA && <Avatar user={task.asignadoA} size={26} />}
                <select
                  value={task.asignadoAId || ''}
                  onChange={(e) => updateTask({ asignadoAId: e.target.value ? parseInt(e.target.value) : null })}
                  className="flex-1 min-w-0 rounded-lg px-2.5 py-2 text-xs border focus:outline-none"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text)', colorScheme: 'dark' }}
                >
                  <option value="">Sin asignar</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <PropLabel>Sprint</PropLabel>
              <select
                value={task.sprintId || ''}
                onChange={(e) => updateTask({ sprintId: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full rounded-lg px-2.5 py-2 text-xs border focus:outline-none"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text)', colorScheme: 'dark' }}
              >
                <option value="">Sin sprint</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <PropLabel>Vencimiento</PropLabel>
              <input
                type="date"
                value={task.fechaVencimiento ? format(new Date(task.fechaVencimiento), 'yyyy-MM-dd') : ''}
                onChange={(e) => updateTask({ fechaVencimiento: e.target.value || null })}
                className="w-full rounded-lg px-2.5 py-2 text-xs border focus:outline-none"
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: isOverdue ? '#F0556B' : 'var(--border)',
                  color: isOverdue ? '#F0556B' : 'var(--text)',
                  colorScheme: 'dark',
                }}
              />
              {isOverdue && (
                <p className="text-[10px] mt-1 font-semibold" style={{ color: '#F0556B' }}>⚠ Vencida</p>
              )}
            </div>

            <Divider />

            <div>
              <PropLabel>Proyecto</PropLabel>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{task.proyecto?.nombre || '—'}</p>
            </div>

            {subtareas.length > 0 && (
              <div>
                <PropLabel>Progreso</PropLabel>
                <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${subtasksPct}%`, background: 'var(--primary)' }} />
                </div>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {subtasksDone}/{subtareas.length} subtareas · {subtasksPct}%
                </p>
              </div>
            )}

            {task.createdAt && (
              <div>
                <PropLabel>Creado</PropLabel>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {format(new Date(task.createdAt), 'dd MMM yyyy', { locale: es })}
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function SubtaskRow({ subtask: s, onToggle, onDelete }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="flex items-center gap-3 group px-2 py-1.5 rounded-lg transition-colors"
      style={{ background: hovered ? 'var(--bg-secondary)' : 'transparent' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onToggle}
        className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors"
        style={s.completada
          ? { background: '#22c55e', borderColor: '#22c55e' }
          : { background: 'transparent', borderColor: 'var(--border)' }
        }
      >
        {s.completada && <Check size={10} className="text-white" strokeWidth={3} />}
      </button>
      <span
        className="text-sm flex-1"
        style={{
          color: s.completada ? 'var(--text-faint)' : 'var(--text)',
          textDecoration: s.completada ? 'line-through' : 'none',
        }}
      >
        {s.titulo}
      </span>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-0.5 transition-opacity"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => e.currentTarget.style.color = '#F0556B'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <X size={12} />
      </button>
    </div>
  );
}

function AdjuntoCard({ adjunto: a, imgUrl, isImg, onDelete }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="group relative rounded-xl border overflow-hidden transition-colors"
      style={{ borderColor: hovered ? 'var(--primary)' : 'var(--border)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isImg ? (
        <a href={imgUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={imgUrl}
            alt={a.nombre}
            className="w-full h-24 object-cover"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
          <div className="hidden w-full h-24 items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
            <Image size={18} style={{ color: 'var(--text-faint)' }} />
          </div>
        </a>
      ) : (
        <a
          href={imgUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-2 h-24 transition-colors"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <FileIcon nombre={a.nombre} />
          <span className="text-[9px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
            {(a.nombre || '').split('.').pop().toUpperCase() || 'FILE'}
          </span>
        </a>
      )}
      <div className="px-2 py-1.5 flex items-center justify-between gap-1" style={{ background: 'var(--bg-secondary)' }}>
        <span className="text-[10px] truncate font-medium" style={{ color: 'var(--text)' }}>{a.nombre}</span>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-0.5 transition"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#F0556B'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <X size={11} />
        </button>
      </div>
    </div>
  );
}

function DropZone({ onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full border-2 border-dashed rounded-xl py-7 flex flex-col items-center gap-2 transition-colors"
      style={{ borderColor: hovered ? 'var(--primary)' : 'var(--border)' }}
    >
      <Upload size={20} style={{ color: 'var(--text-faint)' }} />
      <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Haz clic para subir imágenes o archivos</span>
      <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>JPG, PNG, GIF, PDF · Máx. 10 MB</span>
    </button>
  );
}

function CommentInput({ value, onChange, onSubmit, sending }) {
  return (
    <>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Añade un comentario... (Ctrl+Enter para enviar)"
        rows={2}
        onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) onSubmit(); }}
        className="w-full rounded-xl px-4 py-3 text-sm border resize-none focus:outline-none transition-colors"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text)' }}
        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
      {value.trim() && (
        <button
          onClick={onSubmit}
          disabled={sending}
          className="mt-2 flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
          style={{ background: 'var(--primary)' }}
        >
          <Send size={11} />
          {sending ? 'Enviando...' : 'Comentar'}
        </button>
      )}
    </>
  );
}
