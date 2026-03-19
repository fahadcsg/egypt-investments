import { NavLink, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Layout({ children, user, setUser }) {
  const navigate = useNavigate();
  const isOwner = user?.role === 'owner';

  async function handleLogout() {
    await api.logout();
    setUser(null);
    navigate('/login');
  }

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="header-logo">
            <span>🏠</span> Egypt Investments
          </div>
          <nav className="header-nav">
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>Dashboard</NavLink>
            <NavLink to="/payments" className={({ isActive }) => isActive ? 'active' : ''}>Payments</NavLink>
            {isOwner && <NavLink to="/investor" className={({ isActive }) => isActive ? 'active' : ''}>Investor</NavLink>}
            {!isOwner && <NavLink to="/investor" className={({ isActive }) => isActive ? 'active' : ''}>My Settlement</NavLink>}
          </nav>
          <div className="header-right">
            <span className="header-user">{user?.display_name} ({user?.role})</span>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>
      <main className="container" style={{ paddingTop: '0.5rem', paddingBottom: '2rem' }}>
        {children}
      </main>
      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink>
          <NavLink to="/payments" className={({ isActive }) => isActive ? 'active' : ''}>Payments</NavLink>
          <NavLink to="/investor" className={({ isActive }) => isActive ? 'active' : ''}>
            {isOwner ? 'Investor' : 'Settlement'}
          </NavLink>
        </div>
      </nav>
    </>
  );
}
