import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { api } from '../../../api';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { avatarSrc } from '../../../utils/avatar';
import SectionCard from './SectionCard';

// Tarjeta con la foto de perfil (y su subida) más nombre, email y bio.
export default function ProfileCard() {
  const { user, setUser } = useAuth();
  const { addToast } = useToast();
  const fileRef = useRef(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleAvatarClick = () => fileRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const result = await api.uploadAvatar(user.id, file);
      setUser((prev) => ({ ...prev, imagenPerfil: result.imagenPerfil }));
      addToast('Foto de perfil actualizada', 'success');
    } catch (err) {
      addToast(err.message || 'Error al subir la foto', 'error');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  return (
    <SectionCard>
      <div className="flex flex-col items-center text-center gap-4">
        <div className="relative group">
          {user.imagenPerfil ? (
            <img
              src={avatarSrc(user.imagenPerfil)}
              alt={user.nombre}
              className="w-28 h-28 rounded-full object-cover ring-4"
              style={{ ringColor: 'var(--primary)' }}
            />
          ) : (
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center text-white text-5xl font-bold ring-4"
              style={{ background: 'var(--primary)', ringColor: 'var(--border)' }}
            >
              {user.nombre?.charAt(0).toUpperCase()}
            </div>
          )}
          <button
            onClick={handleAvatarClick}
            disabled={uploadingPhoto}
            className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.52)' }}
            title="Cambiar foto"
          >
            {uploadingPhoto
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Camera size={20} className="text-white" />
            }
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
        </div>

        <div>
          <h2 className="font-bold text-[20px] leading-tight" style={{ color: 'var(--text)' }}>
            {user.nombre}
          </h2>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
        </div>

        {user.descripcion && (
          <p
            className="text-sm text-left w-full border-t pt-4"
            style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
          >
            {user.descripcion}
          </p>
        )}

        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
          Haz clic en la foto para cambiarla
        </p>
      </div>
    </SectionCard>
  );
}
