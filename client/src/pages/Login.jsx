import { useState } from 'react';
import { api } from '../api';

export default function Login({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await api.login(username, password);
      setUser(user);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <h1 className="login-title">Egypt Investments</h1>
        <p className="login-sub">Real estate portfolio tracker</p>
        {error && <div className="login-error">{error}</div>}
        <div className="form-group">
          <label className="form-label">Username</label>
          <input className="form-input" type="text" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem 1rem', fontSize: '0.9375rem' }} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
