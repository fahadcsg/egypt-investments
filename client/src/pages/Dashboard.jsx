import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { fmtEGP, fmtSAR, fmtNum, fmtDate, pctOf } from '../utils';
import KPICard from '../components/KPICard';
import ProgressBar from '../components/ProgressBar';
import StatusPill from '../components/StatusPill';

export default function Dashboard({ user }) {
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.getProjects(), api.getPayments()])
      .then(([p, pay]) => { setProjects(p); setPayments(pay); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen">Loading portfolio...</div>;

  const totalPortfolioEGP = projects.reduce((s, p) => s + p.total_egp + (p.maintenance_egp || 0), 0);
  const totalPaidEGP = projects.reduce((s, p) => s + (p.payments?.paid_egp || 0), 0);
  const totalPaidSAR = projects.reduce((s, p) => s + (p.payments?.paid_sar || 0), 0);
  const totalDueEGP = projects.reduce((s, p) => s + (p.payments?.due_egp || 0), 0);

  const upcoming = payments
    .filter(p => p.status === 'DUE' || p.status === 'OVERDUE')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Portfolio</h1>
        {user.role === 'owner' && (
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/projects/new')}>+ Add Project</button>
        )}
      </div>

      <div className="kpi-grid">
        <KPICard label="Total Portfolio" value={fmtEGP(totalPortfolioEGP)} sub={`${projects.length} properties`} />
        <KPICard label="Total Paid" value={fmtEGP(totalPaidEGP)} sub={`${pctOf(totalPaidEGP, totalPortfolioEGP)}% of total`} />
        <KPICard label="SAR Transferred" value={fmtSAR(totalPaidSAR)} />
        <KPICard label="Due Now" value={fmtEGP(totalDueEGP)} sub={`${upcoming.length} payments pending`} />
      </div>

      <div className="section">
        <h2 className="section-title">Properties</h2>
        <div className="project-grid">
          {projects.map(p => {
            const totalWithMaint = p.total_egp + (p.maintenance_egp || 0);
            const paidPct = pctOf(p.payments?.paid_egp || 0, totalWithMaint);
            return (
              <div key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}`)}>
                <div className="project-card-accent" style={{ background: `linear-gradient(90deg, ${p.color}, ${p.color}99)` }} />
                <div className="project-card-body">
                  <div className="project-card-header">
                    <div className="project-dot" style={{ background: p.color }} />
                    <div style={{ flex: 1 }}>
                      <div className="project-card-name">{p.short_name}</div>
                      <div className="project-card-developer">{p.developer} &middot; {p.type}</div>
                    </div>
                    {p.shared ? <span className="pill pill-shared">Shared</span> : null}
                  </div>
                  <div className="project-card-meta">
                    <span>{p.location}</span>
                  </div>
                  <div className="project-card-stats">
                    <div>
                      <div className="project-stat-label">Total Price</div>
                      <div className="project-stat-value">{fmtEGP(totalWithMaint)}</div>
                    </div>
                    <div>
                      <div className="project-stat-label">Paid</div>
                      <div className="project-stat-value" style={{ color: '#059669' }}>{fmtEGP(p.payments?.paid_egp || 0)}</div>
                    </div>
                  </div>
                  <ProgressBar pct={paidPct} color={p.color} />
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', textAlign: 'right', fontWeight: 500 }}>
                    {paidPct}% paid &middot; {p.payments?.paid_count || 0}/{p.payments?.total_count || 0} installments
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {upcoming.length > 0 && (
        <div className="section">
          <h2 className="section-title">Due &amp; Overdue</h2>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Project</th>
                    <th>Amount (EGP)</th>
                    <th>Note</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map(p => (
                    <tr key={p.id}>
                      <td className="mono">{fmtDate(p.date)}</td>
                      <td>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: p.project_color, marginRight: 8, boxShadow: `0 0 0 2px ${p.project_color}33` }} />
                        {p.project_name}
                      </td>
                      <td className="mono">{fmtNum(p.egp_amount)}</td>
                      <td style={{ color: '#64748b' }}>{p.note}</td>
                      <td><StatusPill status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
