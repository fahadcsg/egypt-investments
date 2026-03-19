import { useState, useEffect } from 'react';
import { api } from '../api';
import { fmtNum, fmtDate, fmtRate } from '../utils';
import StatusPill from '../components/StatusPill';

export default function Payments({ user }) {
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    Promise.all([api.getPayments(), api.getProjects()])
      .then(([pay, prj]) => { setPayments(pay); setProjects(prj); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen">Loading payments...</div>;

  let filtered = payments;
  if (filterProject) filtered = filtered.filter(p => p.project_id === filterProject);
  if (filterStatus) filtered = filtered.filter(p => p.status === filterStatus);

  const totalEGP = filtered.reduce((s, p) => s + p.egp_amount, 0);
  const totalSAR = filtered.reduce((s, p) => s + p.sar_transferred, 0);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">All Payments</h1>
      </div>

      <div className="filter-bar">
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.short_name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="PAID">PAID</option>
          <option value="DUE">DUE</option>
          <option value="UPCOMING">UPCOMING</option>
          <option value="OVERDUE">OVERDUE</option>
        </select>
        <span style={{ fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 500 }}>
          {filtered.length} payments &middot; EGP {fmtNum(totalEGP)} {totalSAR > 0 && `· SAR ${fmtNum(totalSAR)}`}
        </span>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Project</th>
                <th>EGP Amount</th>
                <th>SAR Transferred</th>
                <th>Rate</th>
                <th>Note</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td className="mono">{fmtDate(p.date)}</td>
                  <td>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: p.project_color, marginRight: 8, boxShadow: `0 0 0 2px ${p.project_color}33` }} />
                    {p.project_name}
                  </td>
                  <td className="mono">{fmtNum(p.egp_amount)}</td>
                  <td className="mono">{p.sar_transferred ? fmtNum(p.sar_transferred) : '—'}</td>
                  <td className="mono">{fmtRate(p.egp_amount, p.sar_transferred)}</td>
                  <td style={{ color: '#64748b' }}>{p.note}</td>
                  <td><StatusPill status={p.status} /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="empty-state">No payments found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
