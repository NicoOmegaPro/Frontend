import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API, authHeaders } from '../api';
import Navbar from './Navbar';
import TaskModal from './TaskModal';
import KanbanBoard from './KanbanBoard';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const fetchData = () => {
    const headers = authHeaders();
    Promise.all([
      fetch(`${API}/auth/me`, { headers }).then(r => r.json()),
      fetch(`${API}/projects`, { headers }).then(r => r.json()),
      fetch(`${API}/tasks`, { headers }).then(r => r.json()),
    ]).then(([me, proj, tsk]) => {
      setUser(me);
      setProjects(Array.isArray(proj) ? proj : []);
      setTasks(Array.isArray(tsk) ? tsk : []);
    }).catch(console.error);
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) return navigate('/');
    fetchData();
  }, [navigate]);

  const handleCreateTask = async (formData) => {
    const res = await fetch(`${API}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setShowModal(false);
      fetchData();
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={logout} />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded font-medium hover:bg-indigo-700 text-sm"
          >
            + Crear Tarea
          </button>
        </div>
        {showModal && (
          <TaskModal
            projects={projects}
            onSubmit={handleCreateTask}
            onClose={() => setShowModal(false)}
          />
        )}
        <KanbanBoard tasks={tasks} />
      </div>
    </div>
  );
}
