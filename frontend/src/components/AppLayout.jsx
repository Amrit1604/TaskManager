/**
 * components/AppLayout.jsx
 * Wraps authenticated pages with the sidebar.
 */
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-layout fade-in">
        <Outlet />
      </main>
    </div>
  );
}
