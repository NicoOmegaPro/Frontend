export default function Navbar({ user, onLogout }) {
  return (
    <nav className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm">
      <span className="font-bold text-indigo-600 text-lg">KanbanApp</span>
      <div className="flex items-center gap-4">
        {user && <span className="text-sm text-gray-600"><strong>{user.nombre}</strong></span>}
        <button onClick={onLogout} className="text-sm text-red-500 hover:underline font-medium">
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
