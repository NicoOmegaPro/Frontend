import { useAuth } from '../../context/AuthContext';
import ProfileCard from './profile/ProfileCard';
import MyTeams from './profile/MyTeams';
import PersonalInfoForm from './profile/PersonalInfoForm';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>Mi Perfil</h1>
        <p className="text-[14px] mt-1" style={{ color: 'var(--text-muted)' }}>Gestiona tu información personal</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Columna izquierda: foto y equipos */}
        <div className="space-y-5">
          <ProfileCard />
          <MyTeams />
        </div>

        {/* Columna derecha: datos personales y contraseña */}
        <div className="lg:col-span-2">
          <PersonalInfoForm />
        </div>
      </div>
    </div>
  );
}
