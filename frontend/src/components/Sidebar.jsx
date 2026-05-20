/**
 * components/Sidebar.jsx
 * Minimalist Monochrome navigation sidebar.
 */
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { getInitials } from '../utils/helpers';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('LOGGED OUT');
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/projects',  label: 'Projects' },
    { to: '/kanban',    label: 'Kanban Board' },
    { to: '/audit',     label: 'Audit Log' },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ marginBottom: 64 }}>
        <div style={{ fontSize: 24, fontFamily: 'var(--font-serif)', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1 }}>
          TASKFLOW
        </div>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 8 }}>
          System
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
          Index
        </div>
        {navItems.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User Card */}
      <div style={{ marginTop: 'auto', paddingTop: 32, borderTop: '4px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 48, height: 48,
            background: 'var(--foreground)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--background)'
          }}>
            {getInitials(user?.name)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--muted-foreground)' }}>
              {user?.role}
            </div>
          </div>
        </div>
        <button className="btn btn-outline" style={{ width: '100%' }} onClick={handleLogout}>
          Log out
        </button>
      </div>
    </aside>
  );
}
