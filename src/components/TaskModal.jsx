import { useState } from 'react';

const inputClass = 'w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400';

export default function TaskModal({ projects, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    proyectoId: projects[0]?.id ?? '',
    prioridad: 'MEDIA',
  });

  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.titulo || !formData.proyectoId) return;
    onSubmit({ ...formData, proyectoId: parseInt(formData.proyectoId) });
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Crear Tarea</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Título"
            value={formData.titulo}
            onChange={set('titulo')}
            required
            className={inputClass}
          />
          <textarea
            placeholder="Descripción (opcional)"
            value={formData.descripcion}
            onChange={set('descripcion')}
            className={`${inputClass} h-20 resize-none`}
          />
          <select value={formData.proyectoId} onChange={set('proyectoId')} required className={inputClass}>
            <option value="">Selecciona un proyecto</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <select value={formData.prioridad} onChange={set('prioridad')} className={inputClass}>
            <option value="BAJA">Baja</option>
            <option value="MEDIA">Media</option>
            <option value="ALTA">Alta</option>
            <option value="URGENTE">Urgente</option>
          </select>
          <div className="flex gap-2 pt-4">
            <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded font-medium hover:bg-indigo-700 text-sm">
              Crear
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded font-medium hover:bg-gray-300 text-sm">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
