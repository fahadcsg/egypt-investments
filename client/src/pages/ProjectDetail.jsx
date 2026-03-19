import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { fmtEGP, fmtSAR, fmtNum, fmtDate, fmtRate, pctOf } from '../utils';
import ProgressBar from '../components/ProgressBar';
import StatusPill from '../components/StatusPill';
import ShareUpdate from '../components/ShareUpdate';

const PROJECT_COLORS = {
  '#059669': { from: '#059669', to: '#047857' },
  '#10b981': { from: '#10b981', to: '#059669' },
  '#0284c7': { from: '#0284c7', to: '#0369a1' },
  '#7c3aed': { from: '#7c3aed', to: '#6d28d9' },
  '#dc2626': { from: '#dc2626', to: '#b91c1c' },
};

function getGradient(color) {
  const c = PROJECT_COLORS[color] || { from: color || '#6366f1', to: '#4f46e5' };
  return `linear-gradient(135deg, ${c.from} 0%, ${c.to} 100%)`;
}

export default function ProjectDetail({ user }) {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingPayment, setEditingPayment] = useState(null);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showShare, setShowShare] = useState(false);

  function load() {
    api.getProject(id).then(setProject).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="loading-screen">Loading property...</div>;
  if (!project) return <div className="empty-state">Project not found</div>;

  const payments = project.payments || [];
  const totalWithMaint = project.total_egp + (project.maintenance_egp || 0);
  const paidEGP = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.egp_amount, 0);
  const paidSAR = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.sar_transferred, 0);
  const dueEGP = payments.filter(p => p.status === 'DUE' || p.status === 'OVERDUE').reduce((s, p) => s + p.egp_amount, 0);
  const remainingEGP = totalWithMaint - paidEGP;
  const paidPct = pctOf(paidEGP, totalWithMaint);

  return (
    <>
      <Link to="/" className="back-link">&larr; Back to Portfolio</Link>

      <div className="project-hero">
        <div className="project-hero-gradient" style={{ background: getGradient(project.color) }}>
          <div className="project-hero-top">
            <div className="project-hero-dot" />
            <div>
              <div className="project-hero-name">{project.name}</div>
              <div className="project-hero-meta">
                {project.developer} &middot; {project.type} &middot; {project.location}
                {project.shared ? <span className="pill pill-shared" style={{ marginLeft: 10, fontSize: '0.625rem' }}>50/50 with {project.partner_name}</span> : null}
              </div>
            </div>
          </div>
        </div>
        <div className="project-hero-body">
          <div className="project-hero-stats">
            <div>
              <div className="kpi-label">Total Price</div>
              <div className="kpi-value" style={{ fontSize: '1.25rem' }}>{fmtEGP(totalWithMaint)}</div>
              {project.maintenance_egp > 0 && <div className="kpi-sub">incl. {fmtEGP(project.maintenance_egp)} maintenance</div>}
            </div>
            <div>
              <div className="kpi-label">Paid</div>
              <div className="kpi-value" style={{ fontSize: '1.25rem', color: '#059669' }}>{fmtEGP(paidEGP)}</div>
              <div className="kpi-sub">{paidPct}% complete</div>
            </div>
            <div>
              <div className="kpi-label">SAR Transferred</div>
              <div className="kpi-value" style={{ fontSize: '1.25rem' }}>{fmtSAR(paidSAR)}</div>
            </div>
            <div>
              <div className="kpi-label">Remaining</div>
              <div className="kpi-value" style={{ fontSize: '1.25rem', color: '#dc2626' }}>{fmtEGP(remainingEGP)}</div>
            </div>
            <div>
              <div className="kpi-label">Due Now</div>
              <div className="kpi-value" style={{ fontSize: '1.25rem', color: '#d97706' }}>{fmtEGP(dueEGP)}</div>
            </div>
          </div>
          <ProgressBar pct={paidPct} color={project.color} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem', fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 500 }}>
            {project.payment_plan && <span>Plan: {project.payment_plan}</span>}
            {project.advance_pct && <span>Advance: {project.advance_pct}</span>}
            {project.start_date && <span>Started: {project.start_date}</span>}
            {project.unit_no && <span>Unit: {project.unit_no}</span>}
            {project.bedrooms && <span>{project.bedrooms} BR</span>}
            {project.area && <span>{project.area}</span>}
          </div>
        </div>
      </div>

      <div className="card-header">
        <h2 className="section-title" style={{ margin: 0 }}>Payment Schedule</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {user.role === 'owner' && project.shared && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowShare(true)}>Share Update</button>
          )}
          {user.role === 'owner' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddPayment(true)}>+ Add Payment</button>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '0.5rem' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>EGP Amount</th>
                <th>SAR Transferred</th>
                <th>Rate</th>
                <th>Note</th>
                <th>Status</th>
                {user.role === 'owner' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td className="mono">{fmtDate(p.date)}</td>
                  <td className="mono">{fmtNum(p.egp_amount)}</td>
                  <td className="mono">{p.sar_transferred ? fmtNum(p.sar_transferred) : '—'}</td>
                  <td className="mono">{fmtRate(p.egp_amount, p.sar_transferred)}</td>
                  <td style={{ color: '#64748b' }}>{p.note}</td>
                  <td><StatusPill status={p.status} /></td>
                  {user.role === 'owner' && (
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingPayment(p)}>Edit</button>
                    </td>
                  )}
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={user.role === 'owner' ? 7 : 6} className="empty-state">No payments yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(showAddPayment || editingPayment) && (
        <PaymentModal
          payment={editingPayment}
          projectId={id}
          onClose={() => { setShowAddPayment(false); setEditingPayment(null); }}
          onSaved={() => { setShowAddPayment(false); setEditingPayment(null); load(); }}
        />
      )}

      {showShare && <ShareUpdate onClose={() => setShowShare(false)} projectId={id} />}
    </>
  );
}

function PaymentModal({ payment, projectId, onClose, onSaved }) {
  const isEdit = !!payment;
  const [form, setForm] = useState({
    date: payment?.date || '',
    egp_amount: payment?.egp_amount || '',
    sar_transferred: payment?.sar_transferred || '',
    status: payment?.status || 'UPCOMING',
    note: payment?.note || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = {
        ...form,
        project_id: projectId,
        egp_amount: Number(form.egp_amount),
        sar_transferred: Number(form.sar_transferred) || 0
      };
      if (isEdit) {
        await api.updatePayment(payment.id, data);
      } else {
        await api.createPayment(data);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this payment?')) return;
    await api.deletePayment(payment.id);
    onSaved();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3 className="modal-title">{isEdit ? 'Edit Payment' : 'Add Payment'}</h3>
        {error && <div className="login-error">{error}</div>}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date (YYYY-MM)</label>
            <input className="form-input" value={form.date} onChange={e => update('date', e.target.value)} placeholder="2026-04" required />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => update('status', e.target.value)}>
              <option value="PAID">PAID</option>
              <option value="DUE">DUE</option>
              <option value="UPCOMING">UPCOMING</option>
              <option value="OVERDUE">OVERDUE</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">EGP Amount</label>
            <input className="form-input" type="number" value={form.egp_amount} onChange={e => update('egp_amount', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">SAR Transferred</label>
            <input className="form-input" type="number" value={form.sar_transferred} onChange={e => update('sar_transferred', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Note</label>
          <input className="form-input" value={form.note} onChange={e => update('note', e.target.value)} />
        </div>
        <div className="modal-actions">
          {isEdit && <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>}
          <div style={{ flex: 1 }} />
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}
