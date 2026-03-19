import { useState, useEffect } from 'react';
import { api } from '../api';
import { fmtNum, fmtDate, fmtEGP, fmtSAR } from '../utils';
import ProgressBar from '../components/ProgressBar';

export default function InvestorView({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSettlement().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading...</div>;
  if (!data) return <div style={{ padding: '2rem' }}>No data</div>;

  const { summary, projects, transfers } = data;
  const paidPct = summary.ali_50pct_share > 0
    ? Math.round((summary.ali_total_transferred / summary.ali_50pct_share) * 100)
    : 0;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{user.role === 'investor' ? 'My Settlement' : "Ali's Settlement"}</h1>
      </div>

      <div className="settlement-card">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <div className="settlement-title">Ali Owes (Remaining)</div>
            <div className="settlement-value">{fmtNum(summary.ali_remaining)} SAR</div>
          </div>
        </div>

        <ProgressBar pct={paidPct} color="#22d3ee" />
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.375rem' }}>
          {paidPct}% settled &middot; {fmtNum(summary.ali_total_transferred)} / {fmtNum(summary.ali_50pct_share)} SAR
        </div>

        <div className="settlement-grid">
          <div className="settlement-item">
            <div className="settlement-sub">Fahad Total SAR Paid</div>
            <div className="settlement-val">{fmtNum(summary.total_fahad_paid_sar)}</div>
          </div>
          <div className="settlement-item">
            <div className="settlement-sub">Ali's 50% Share</div>
            <div className="settlement-val">{fmtNum(summary.ali_50pct_share)}</div>
          </div>
          <div className="settlement-item">
            <div className="settlement-sub">Ali Transferred</div>
            <div className="settlement-val">{fmtNum(summary.ali_total_transferred)}</div>
          </div>
          <div className="settlement-item">
            <div className="settlement-sub">BV SAR (Fahad)</div>
            <div className="settlement-val">{fmtNum(summary.bv_total_sar)}</div>
          </div>
          <div className="settlement-item">
            <div className="settlement-sub">MV SAR (Fahad)</div>
            <div className="settlement-val">{fmtNum(summary.mv_total_sar)}</div>
          </div>
          <div className="settlement-item">
            <div className="settlement-sub">BV Ali Sent</div>
            <div className="settlement-val">{fmtNum(summary.bv_ali_transferred)}</div>
          </div>
          <div className="settlement-item">
            <div className="settlement-sub">MV Ali Sent</div>
            <div className="settlement-val">{fmtNum(summary.mv_ali_transferred)}</div>
          </div>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">Shared Projects</h2>
        <div className="project-grid">
          {projects.map(p => {
            const pct = p.total_egp > 0 ? Math.round((p.paid_egp / p.total_egp) * 100) : 0;
            return (
              <div key={p.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div className="project-dot" style={{ background: p.color }} />
                  <strong>{p.short_name}</strong>
                </div>
                <div className="project-card-stats">
                  <div>
                    <div className="project-stat-label">Total EGP</div>
                    <div className="project-stat-value">{fmtNum(p.total_egp)}</div>
                  </div>
                  <div>
                    <div className="project-stat-label">Paid EGP</div>
                    <div className="project-stat-value">{fmtNum(p.paid_egp)}</div>
                  </div>
                  <div>
                    <div className="project-stat-label">SAR Transferred</div>
                    <div className="project-stat-value">{fmtNum(p.paid_sar)}</div>
                  </div>
                </div>
                <ProgressBar pct={pct} color={p.color} />
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.375rem', textAlign: 'right' }}>
                  {pct}% paid
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">Ali's Transfer History</h2>
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>SAR Amount</th>
                  <th>Project Group</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map(t => (
                  <tr key={t.id}>
                    <td className="mono">{fmtDate(t.date)}</td>
                    <td className="mono">{fmtNum(t.sar_amount)}</td>
                    <td>{t.project_group}</td>
                    <td>{t.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
