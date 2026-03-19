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
            <div className="header-logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            Egypt Investments
          </div>
          <nav className="header-nav">
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>Dashboard</NavLink>
            <NavLink to="/payments" className={({ isActive }) => isActive ? 'active' : ''}>Payments</NavLink>
            {isOwner && <NavLink to="/investor" className={({ isActive }) => isActive ? 'active' : ''}>Settlement</NavLink>}
            {!isOwner && <NavLink to="/investor" className={({ isActive }) => isActive ? 'active' : ''}>My Settlement</NavLink>}
          </nav>
          <div className="header-right">
            <span className="header-user">{user?.display_name}</span>
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
            {isOwner ? 'Settlement' : 'My Settlement'}
          </NavLink>
        </div>
      </nav>
    </>
  );
}
