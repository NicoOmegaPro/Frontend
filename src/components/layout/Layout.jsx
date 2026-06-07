import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar collapsed={collapsed} />
        <main className="flex-1 overflow-auto">
          <div className="px-6 py-7 lg:px-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
