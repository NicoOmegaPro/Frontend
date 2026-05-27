import { useState, useEffect, useRef } from 'react';
import {
  X, Trash2, Plus, Check, MessageSquare, Paperclip, ChevronDown,
  Send, Edit2, Upload, Image, FileText, File,
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

const BACKEND = 'http://localhost:3000';
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
  const isPdf = ext === 'pdf';
  const isDoc = ['doc', 'docx'].includes(ext);
  return (
    <>
      {isPdf ? (
        <FileText size={28} className="text-red-400" />
      ) : isDoc ? (
        <FileText size={28} className="text-blue-400" />
      ) : (
        <File size={28} className="text-[#6B778C]" />
      )}
      <span className="text-[10px] text-[#6B778C] font-medium uppercase">{ext || 'FILE'}</span>
    </>
  );
}

const ESTADO_STYLE = {
  PENDIENTE:   { bg: '#F4F5F7', color: '#6B778C', label: 'Pendiente' },
  EN_PROGRESO: { bg: '#DEEBFF', color: '#0052CC', label: 'En progreso' },
  EN_REVISION: { bg: '#FFF0B3', color: '#974F0C', label: 'En revisión' },
  FINALIZADO:  { bg: '#E3FCEF', color: '#00875A', label: 'Finalizado' },
};

const PRI_STYLE = {
  BAJA:    { color: '#00B8D9', bg: '#E6FCFF', label: 'Baja', dot: 'bg-cyan-400' },
  MEDIA:   { color: '#0065FF', bg: '#DEEBFF', label: 'Media', dot: 'bg-blue-500' },
  ALTA:    { color: '#FF5630', bg: '#FFF0E6', label: 'Alta', dot: 'bg-orange-500' },
  URGENTE: { color: '#DE350B', bg: '#FFEBE6', label: 'Urgente', dot: 'bg-red-500' },
};

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
        className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-[#F4F5F7] text-sm transition-colors border border-transparent hover:border-[#DFE1E6]"
      >
        {renderValue(value)}
        <ChevronDown size={12} className="text-[#6B778C]" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-[#DFE1E6] z-20 min-w-36 py-1">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F4F5F7] flex items-center gap-2 ${opt === value ? 'font-semibold' : ''}`}
            >
              {renderOption(opt)}
              {opt === value && <Check size={12} className="ml-auto text-[#0052CC]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TaskDetailModal({ taskId, onClose, onUpdated, onDeleted }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [task, setTask] = useState(null);
  const [subtareas, setSubtareas] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [adjuntos, setAdjuntos] = useState([]);
  const [users, setUsers] = useState([]);
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
      const [t, allSubs, allComments, allAdj, u, allSprints, etiq] = await Promise.all([
        api.getTask(taskId),
        api.getSubtareas().catch(() => []),
        api.getComentarios().catch(() => []),
        api.getAdjuntos().catch(() => []),
        api.getUsers().catch(() => []),
        api.getSprints().catch(() => []),
        api.getEtiquetas().catch(() => []),
      ]);
      setTask(t);
      setTitleVal(t.titulo);
      setDescVal(t.descripcion || '');
      setSubtareas(Array.isArray(allSubs) ? allSubs.filter((s) => s.tareaId === taskId) : []);
      setComentarios(Array.isArray(allComments) ? allComments.filter((c) => c.tareaId === taskId) : []);
      setAdjuntos(Array.isArray(allAdj) ? allAdj.filter((a) => a.tareaId === taskId) : []);
      setUsers(Array.isArray(u) ? u : []);
      setSprints(Array.isArray(allSprints) ? allSprints.filter((s) => s.proyectoId === t.proyectoId) : []);
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
      const c = await api.createComentario({
        contenido: newComment,
        tareaId: taskId,
        autorId: user.id,
      });
      setComentarios((prev) => [...prev, { ...c, autor: { nombre: user.nombre } }]);
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
      const a = await api.createAdjunto({
        nombre: uploaded.nombre,
        rutaLocal: uploaded.rutaLocal,
        tareaId: taskId,
        subidoPor: user.id,
      });
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-end modal-backdrop">
        <div className="bg-white w-full max-w-2xl h-full sm:h-auto sm:min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!task) return null;

  const est = ESTADO_STYLE[task.estado] || ESTADO_STYLE.PENDIENTE;
  const pri = PRI_STYLE[task.prioridad] || PRI_STYLE.MEDIA;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex modal-backdrop" onClick={onClose}>
      <div
        className="ml-auto bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl modal-panel flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DFE1E6] flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#6B778C]">
            <span>{task.proyecto?.nombre || 'Proyecto'}</span>
            <span>/</span>
            <span className="font-medium text-[#172B4D]">TAREA-{task.id}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg hover:bg-red-50 text-[#6B778C] hover:text-red-500 transition-colors"
              title="Eliminar tarea"
            >
              <Trash2 size={15} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#F4F5F7] text-[#6B778C] hover:text-[#172B4D] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Title */}
            <div>
              {editingTitle ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={titleVal}
                    onChange={(e) => setTitleVal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                    className="flex-1 text-xl font-bold text-[#172B4D] border-b-2 border-[#0052CC] outline-none bg-transparent pb-1"
                  />
                  <button onClick={saveTitle} className="text-[#0052CC] hover:text-[#0747A6]"><Check size={16} /></button>
                  <button onClick={() => setEditingTitle(false)} className="text-[#6B778C]"><X size={16} /></button>
                </div>
              ) : (
                <div
                  className="flex items-start gap-2 group cursor-pointer"
                  onClick={() => setEditingTitle(true)}
                >
                  <h1 className="text-xl font-bold text-[#172B4D] flex-1 leading-tight">{task.titulo}</h1>
                  <Edit2 size={14} className="mt-1 text-[#6B778C] opacity-0 group-hover:opacity-100 flex-shrink-0" />
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-semibold text-[#6B778C] uppercase tracking-wide mb-2">Descripción</h3>
              {editingDesc ? (
                <div>
                  <textarea
                    autoFocus
                    value={descVal}
                    onChange={(e) => setDescVal(e.target.value)}
                    rows={4}
                    className="w-full border border-[#0052CC] rounded-lg px-3 py-2 text-sm text-[#172B4D] resize-none focus:outline-none"
                    placeholder="Añade una descripción..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={saveDesc}
                      className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold"
                      style={{ background: 'var(--primary)' }}
                    >
                      Guardar
                    </button>
                    <button onClick={() => setEditingDesc(false)} className="px-3 py-1.5 rounded-lg text-xs text-[#6B778C] border border-[#DFE1E6] hover:bg-[#F4F5F7]">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setEditingDesc(true)}
                  className={`text-sm rounded-lg px-3 py-2.5 cursor-pointer min-h-12 hover:bg-[#F4F5F7] transition-colors ${
                    task.descripcion ? 'text-[#172B4D]' : 'text-[#B3BAC5] italic'
                  }`}
                >
                  {task.descripcion || 'Haz clic para añadir una descripción...'}
                </div>
              )}
            </div>

            {/* Subtasks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-[#6B778C] uppercase tracking-wide flex items-center gap-2">
                  Subtareas
                  {subtareas.length > 0 && (
                    <span className="text-[10px] font-medium normal-case text-[#6B778C]">
                      {subtasksDone}/{subtareas.length}
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => setAddingSubtask(true)}
                  className="flex items-center gap-1 text-xs text-[#0052CC] hover:underline"
                >
                  <Plus size={12} /> Añadir
                </button>
              </div>

              {subtareas.length > 0 && (
                <div className="mb-3">
                  <div className="progress-bar mb-1">
                    <div className="progress-bar-fill" style={{ width: `${subtasksPct}%` }} />
                  </div>
                  <span className="text-[10px] text-[#6B778C]">{subtasksPct}% completado</span>
                </div>
              )}

              <div className="space-y-1.5">
                {subtareas.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 group px-1 py-0.5 rounded hover:bg-[#F4F5F7]">
                    <button
                      onClick={() => toggleSubtask(s)}
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        s.completada
                          ? 'bg-[#00875A] border-[#00875A]'
                          : 'border-[#DFE1E6] hover:border-[#0052CC]'
                      }`}
                    >
                      {s.completada && <Check size={10} className="text-white" strokeWidth={3} />}
                    </button>
                    <span className={`text-sm flex-1 ${s.completada ? 'line-through text-[#B3BAC5]' : 'text-[#172B4D]'}`}>
                      {s.titulo}
                    </span>
                    <button
                      onClick={() => deleteSubtask(s.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-[#6B778C] hover:text-red-500 transition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {addingSubtask && (
                <div className="flex gap-2 mt-2">
                  <input
                    autoFocus
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addSubtask(); if (e.key === 'Escape') setAddingSubtask(false); }}
                    placeholder="Nombre de la subtarea..."
                    className="flex-1 border border-[#DFE1E6] rounded-lg px-3 py-1.5 text-sm input-field text-[#172B4D] placeholder-[#B3BAC5]"
                  />
                  <button
                    onClick={addSubtask}
                    className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold"
                    style={{ background: 'var(--primary)' }}
                  >
                    Añadir
                  </button>
                  <button onClick={() => setAddingSubtask(false)} className="px-2 py-1.5 text-[#6B778C]">
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Attachments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-[#6B778C] uppercase tracking-wide">
                  Adjuntos <span className="normal-case text-[10px]">({adjuntos.length})</span>
                </h3>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAdjunto}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#0052CC] hover:text-[#0747A6] disabled:opacity-50"
                >
                  <Upload size={12} />
                  {uploadingAdjunto ? 'Subiendo...' : 'Subir archivo'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {/* Upload drop zone (click to open file picker) */}
              {adjuntos.length === 0 && !uploadingAdjunto && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#DFE1E6] rounded-xl py-6 flex flex-col items-center gap-2 hover:border-[#0052CC] hover:bg-[#F4F5F7] transition-colors group"
                >
                  <Upload size={20} className="text-[#B3BAC5] group-hover:text-[#0052CC]" />
                  <span className="text-xs text-[#B3BAC5] group-hover:text-[#6B778C]">
                    Haz clic para subir imágenes o archivos
                  </span>
                  <span className="text-[10px] text-[#C1C7D0]">JPG, PNG, GIF, PDF · Máx. 10 MB</span>
                </button>
              )}

              {uploadingAdjunto && (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-[#6B778C]">
                  <div className="w-4 h-4 border-2 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
                  Subiendo archivo...
                </div>
              )}

              {adjuntos.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {adjuntos.map((a) => {
                    const imgUrl = getAdjuntoUrl(a.rutaLocal);
                    const isImg = isImageFile(a.nombre, a.rutaLocal);
                    return (
                      <div key={a.id} className="group relative rounded-lg border border-[#DFE1E6] overflow-hidden hover:border-[#0052CC] transition-colors">
                        {isImg ? (
                          <a href={imgUrl} target="_blank" rel="noopener noreferrer">
                            <img
                              src={imgUrl}
                              alt={a.nombre}
                              className="w-full h-28 object-cover"
                              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                            <div className="hidden w-full h-28 items-center justify-center bg-[#F4F5F7] flex-col gap-1">
                              <Image size={20} className="text-[#B3BAC5]" />
                              <span className="text-[10px] text-[#B3BAC5]">Sin vista previa</span>
                            </div>
                          </a>
                        ) : (
                          <a
                            href={imgUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center gap-1.5 h-28 bg-[#F4F5F7] hover:bg-[#EBECF0] transition-colors"
                          >
                            <FileIcon nombre={a.nombre} />
                          </a>
                        )}
                        <div className="px-2 py-1.5 flex items-center justify-between gap-1">
                          <span className="text-[10px] text-[#172B4D] truncate font-medium">{a.nombre}</span>
                          <button
                            onClick={() => deleteAdjunto(a.id)}
                            className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-0.5 text-[#6B778C] hover:text-red-500 transition"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add more button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAdjunto}
                    className="border-2 border-dashed border-[#DFE1E6] rounded-lg h-28 flex flex-col items-center justify-center gap-1 hover:border-[#0052CC] hover:bg-[#F4F5F7] transition-colors group disabled:opacity-50"
                  >
                    <Plus size={18} className="text-[#B3BAC5] group-hover:text-[#0052CC]" />
                    <span className="text-[10px] text-[#B3BAC5] group-hover:text-[#6B778C]">Añadir más</span>
                  </button>
                </div>
              )}
            </div>

            {/* Comments */}
            <div>
              <h3 className="text-xs font-semibold text-[#6B778C] uppercase tracking-wide mb-3">
                Comentarios ({comentarios.length})
              </h3>

              <div className="flex gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-full bg-[#0052CC] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {user?.nombre?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Añade un comentario..."
                    rows={2}
                    onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) sendComment(); }}
                    className="w-full border border-[#DFE1E6] rounded-lg px-3 py-2 text-sm input-field text-[#172B4D] placeholder-[#B3BAC5] resize-none"
                  />
                  {newComment.trim() && (
                    <button
                      onClick={sendComment}
                      disabled={sendingComment}
                      className="mt-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-60"
                      style={{ background: 'var(--primary)' }}
                    >
                      <Send size={11} />
                      {sendingComment ? 'Enviando...' : 'Comentar'}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {comentarios.map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#6B778C] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {(c.autor?.nombre || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-semibold text-[#172B4D]">{c.autor?.nombre || 'Usuario'}</span>
                        <span className="text-[10px] text-[#6B778C]">
                          {formatDistanceToNow(new Date(c.fecha), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                      <div className="bg-[#F4F5F7] rounded-lg px-3 py-2 text-sm text-[#172B4D] leading-relaxed">
                        {c.contenido}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar — details */}
          <div
            className="w-52 flex-shrink-0 border-l border-[#DFE1E6] px-4 py-5 space-y-5 overflow-y-auto"
            style={{ background: '#FAFBFC' }}
          >
            {/* Status */}
            <div>
              <p className="text-[10px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">Estado</p>
              <SelectDropdown
                value={task.estado}
                options={ESTADOS}
                onChange={(v) => updateTask({ estado: v })}
                renderValue={(v) => {
                  const s = ESTADO_STYLE[v];
                  return (
                    <span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                  );
                }}
                renderOption={(v) => {
                  const s = ESTADO_STYLE[v];
                  return <span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
                }}
              />
            </div>

            {/* Priority */}
            <div>
              <p className="text-[10px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">Prioridad</p>
              <SelectDropdown
                value={task.prioridad}
                options={PRIORIDADES}
                onChange={(v) => updateTask({ prioridad: v })}
                renderValue={(v) => {
                  const p = PRI_STYLE[v];
                  return (
                    <span className="badge" style={{ background: p.bg, color: p.color }}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />{p.label}
                    </span>
                  );
                }}
                renderOption={(v) => {
                  const p = PRI_STYLE[v];
                  return (
                    <span className="badge" style={{ background: p.bg, color: p.color }}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />{p.label}
                    </span>
                  );
                }}
              />
            </div>

            {/* Assignee */}
            <div>
              <p className="text-[10px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">Asignado a</p>
              <select
                value={task.asignadoAId || ''}
                onChange={(e) => updateTask({ asignadoAId: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full border border-[#DFE1E6] rounded-lg px-2 py-1.5 text-xs input-field bg-white text-[#172B4D]"
              >
                <option value="">Sin asignar</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.nombre}</option>
                ))}
              </select>
            </div>

            {/* Sprint */}
            <div>
              <p className="text-[10px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">Sprint</p>
              <select
                value={task.sprintId || ''}
                onChange={(e) => updateTask({ sprintId: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full border border-[#DFE1E6] rounded-lg px-2 py-1.5 text-xs input-field bg-white text-[#172B4D]"
              >
                <option value="">Sin sprint</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>

            {/* Project */}
            <div>
              <p className="text-[10px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1">Proyecto</p>
              <p className="text-sm text-[#172B4D] font-medium">{task.proyecto?.nombre || '—'}</p>
            </div>

            {/* Subtasks progress */}
            {subtareas.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5">Progreso</p>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${subtasksPct}%` }} />
                </div>
                <p className="text-[10px] text-[#6B778C] mt-1">{subtasksDone}/{subtareas.length} subtareas</p>
              </div>
            )}

            {/* Dates */}
            {task.createdAt && (
              <div>
                <p className="text-[10px] font-semibold text-[#6B778C] uppercase tracking-wide mb-1">Creado</p>
                <p className="text-xs text-[#6B778C]">
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
