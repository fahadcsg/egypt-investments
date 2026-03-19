import { useState, useEffect } from 'react';
import { api } from '../api';
import { fmtNum, fmtDate } from '../utils';
import ProgressBar from '../components/ProgressBar';

export default function InvestorView({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState(null);
  const [toast, setToast] = useState('');

  function load() {
    api.getSettlement().then(setData).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function handleSaved(msg) {
    setShowTransferModal(false);
    setEditingTransfer(null);
    load();
    showToast(msg);
  }

  if (loading) return <div className="loading-screen">Loading settlement...</div>;
  if (!data) return <div className="empty-state">No settlement data available</div>;

  const { summary, projects, transfers } = data;
  const paidPct = summary.ali_50pct_share > 0
    ? Math.round((summary.ali_total_transferred / summary.ali_50pct_share) * 100)
    : 0;
  const isOwner = user.role === 'owner';

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{isOwner ? "Ali's Settlement" : 'My Settlement'}</h1>
      </div>

      <div className="settlement-card">
        <div style={{ marginBottom: '1.25rem' }}>
          <div className="settlement-title">Outstanding Balance</div>
          <div className="settlement-value">{fmtNum(summary.ali_remaining)} SAR</div>
        </div>

        <ProgressBar pct={paidPct} color="#818cf8" />
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.5rem', fontWeight: 500 }}>
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
        <h2 className="section-title">Shared Properties</h2>
        <div className="project-grid">
          {projects.map(p => {
            const pct = p.total_egp > 0 ? Math.round((p.paid_egp / p.total_egp) * 100) : 0;
            return (
              <div key={p.id} className="project-card">
                <div className="project-card-accent" style={{ background: `linear-gradient(90deg, ${p.color}, ${p.color}99)` }} />
                <div className="project-card-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
                    <div className="project-dot" style={{ background: p.color }} />
                    <strong style={{ fontSize: '1.0625rem', letterSpacing: '-0.01em' }}>{p.short_name}</strong>
                  </div>
                  <div className="project-card-stats" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                    <div>
                      <div className="project-stat-label">Total EGP</div>
                      <div className="project-stat-value">{fmtNum(p.total_egp)}</div>
                    </div>
                    <div>
                      <div className="project-stat-label">Paid EGP</div>
                      <div className="project-stat-value" style={{ color: '#059669' }}>{fmtNum(p.paid_egp)}</div>
                    </div>
                    <div>
                      <div className="project-stat-label">SAR Transferred</div>
                      <div className="project-stat-value">{fmtNum(p.paid_sar)}</div>
                    </div>
                  </div>
                  <ProgressBar pct={pct} color={p.color} />
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', textAlign: 'right', fontWeight: 500 }}>
                    {pct}% paid
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section">
        <div className="card-header">
          <h2 className="section-title" style={{ margin: 0 }}>Transfer History</h2>
          {isOwner && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowTransferModal(true)}>+ Record Transfer</button>
          )}
        </div>
        <div className="card" style={{ marginTop: '0.5rem' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>SAR Amount</th>
                  <th>Project Group</th>
                  <th>Note</th>
                  {isOwner && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {transfers.map(t => (
                  <tr key={t.id}>
                    <td className="mono">{fmtDate(t.date)}</td>
                    <td className="mono">{fmtNum(t.sar_amount)}</td>
                    <td>{t.project_group}</td>
                    <td style={{ color: '#64748b' }}>{t.note || '\u2014'}</td>
                    {isOwner && (
                      <td style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingTransfer(t)}>Edit</button>
                        <DeleteTransferBtn id={t.id} onDeleted={() => handleSaved('Transfer deleted')} />
                      </td>
                    )}
                  </tr>
                ))}
                {transfers.length === 0 && (
                  <tr><td colSpan={isOwner ? 5 : 4} className="empty-state">No transfers yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {(showTransferModal || editingTransfer) && (
        <TransferModal
          transfer={editingTransfer}
          onClose={() => { setShowTransferModal(false); setEditingTransfer(null); }}
          onSaved={handleSaved}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

function TransferModal({ transfer, onClose, onSaved }) {
  const isEdit = !!transfer;
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    date: transfer?.date || today,
    sar_amount: transfer?.sar_amount || '',
    project_group: transfer?.project_group || 'Boutique Village',
    note: transfer?.note || ''
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
      const data = { ...form, sar_amount: Number(form.sar_amount) };
      if (isEdit) {
        await api.updateTransfer(transfer.id, data);
      } else {
        await api.createTransfer(data);
      }
      onSaved(isEdit ? 'Transfer updated' : 'Transfer recorded');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3 className="modal-title">{isEdit ? 'Edit Transfer' : 'Record Transfer'}</h3>
        {error && <div className="login-error">{error}</div>}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.date} onChange={e => update('date', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Amount (SAR)</label>
            <input className="form-input" type="number" step="any" min="0.01" value={form.sar_amount} onChange={e => update('sar_amount', e.target.value)} required />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Project Group</label>
          <select className="form-select" value={form.project_group} onChange={e => update('project_group', e.target.value)}>
            <option value="Boutique Village">Boutique Village</option>
            <option value="Mountain View">Mountain View</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Note (optional)</label>
          <input className="form-input" value={form.note} onChange={e => update('note', e.target.value)} placeholder="e.g. Bank transfer ref..." />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}

function DeleteTransferBtn({ id, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('Delete this transfer?')) return;
    setDeleting(true);
    try {
      await api.deleteTransfer(id);
      onDeleted();
    } catch {
      alert('Failed to delete transfer');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
      {deleting ? '...' : 'Delete'}
    </button>
  );
}
