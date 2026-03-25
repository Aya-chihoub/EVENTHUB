import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Layout() {
  const { user, logout, isEditor } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        background: '#1e293b', color: 'white', padding: '0 2rem',
        display: 'flex', alignItems: 'center', gap: '2rem', height: 60
      }}>
        <span style={{ fontWeight: 700, fontSize: 20, color: '#60a5fa' }}>EventHub</span>
        {[
          { to: '/dashboard', label: 'Dashboard' },
          { to: '/events', label: 'Events' },
          { to: '/participants', label: 'Participants' },
        ].map(({ to, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            color: isActive ? '#60a5fa' : '#cbd5e1',
            textDecoration: 'none', fontWeight: isActive ? 600 : 400
          })}>
            {label}
          </NavLink>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#94a3b8', fontSize: 14 }}>
            {user?.username} ({isEditor ? 'Editor' : 'Viewer'})
          </span>
          <button onClick={handleLogout} style={{
            background: '#ef4444', color: 'white', border: 'none',
            borderRadius: 6, padding: '6px 14px', cursor: 'pointer'
          }}>
            Logout
          </button>
        </div>
      </nav>
      <main style={{ flex: 1, padding: '2rem', background: '#f8fafc' }}>
        <Outlet />
      </main>
    </div>
  );
}
