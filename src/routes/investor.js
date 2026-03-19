const express = require('express');
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Ali's settlement data — SAR-to-SAR calculation
router.get('/settlement', (req, res) => {
  // Get all shared projects
  const sharedProjects = db.prepare('SELECT * FROM projects WHERE shared = 1').all();

  // BV projects (bv-b3-201 and bv-d2-101)
  const bvPaid = db.prepare(`
    SELECT SUM(sar_transferred) as total_sar
    FROM payments
    WHERE project_id IN ('bv-b3-201', 'bv-d2-101') AND status = 'PAID' AND sar_transferred > 0
  `).get();

  // MV project
  const mvPaid = db.prepare(`
    SELECT SUM(sar_transferred) as total_sar
    FROM payments
    WHERE project_id = 'mv-lvls' AND status = 'PAID' AND sar_transferred > 0
  `).get();

  // Ali's transfers
  const bvTransfers = db.prepare(`
    SELECT SUM(sar_amount) as total FROM ali_transfers WHERE project_group = 'Boutique Village'
  `).get();

  const mvTransfers = db.prepare(`
    SELECT SUM(sar_amount) as total FROM ali_transfers WHERE project_group = 'Mountain View'
  `).get();

  const allTransfers = db.prepare('SELECT * FROM ali_transfers ORDER BY date').all();

  const bvTotalSar = bvPaid.total_sar || 0;
  const mvTotalSar = mvPaid.total_sar || 0;
  const bvAliTransferred = bvTransfers.total || 0;
  const mvAliTransferred = mvTransfers.total || 0;

  const totalFahadPaid = bvTotalSar + mvTotalSar;
  const aliShare = totalFahadPaid / 2;
  const aliTotalTransferred = bvAliTransferred + mvAliTransferred;
  const aliRemaining = aliShare - aliTotalTransferred;

  // Per-project EGP totals for shared projects
  const projectBreakdown = sharedProjects.map(p => {
    const paid = db.prepare(`
      SELECT SUM(egp_amount) as paid_egp, SUM(sar_transferred) as paid_sar
      FROM payments WHERE project_id = ? AND status = 'PAID'
    `).get(p.id);

    const total = db.prepare(`
      SELECT SUM(egp_amount) as total_egp FROM payments WHERE project_id = ?
    `).get(p.id);

    return {
      id: p.id,
      short_name: p.short_name,
      color: p.color,
      total_egp: total.total_egp || 0,
      paid_egp: paid.paid_egp || 0,
      paid_sar: paid.paid_sar || 0
    };
  });

  res.json({
    summary: {
      bv_total_sar: bvTotalSar,
      mv_total_sar: mvTotalSar,
      total_fahad_paid_sar: totalFahadPaid,
      ali_50pct_share: aliShare,
      ali_total_transferred: aliTotalTransferred,
      ali_remaining: aliRemaining,
      bv_ali_transferred: bvAliTransferred,
      mv_ali_transferred: mvAliTransferred
    },
    projects: projectBreakdown,
    transfers: allTransfers
  });
});

// Create transfer (owner only)
router.post('/transfers', requireRole('owner'), (req, res) => {
  const { date, sar_amount, project_group, note } = req.body;

  if (!date || !sar_amount || !project_group) {
    return res.status(400).json({ error: 'date, sar_amount, and project_group are required' });
  }
  if (!['Boutique Village', 'Mountain View'].includes(project_group)) {
    return res.status(400).json({ error: 'project_group must be "Boutique Village" or "Mountain View"' });
  }
  if (Number(sar_amount) <= 0) {
    return res.status(400).json({ error: 'sar_amount must be positive' });
  }

  const result = db.prepare(
    'INSERT INTO ali_transfers (date, sar_amount, project_group, note) VALUES (?, ?, ?, ?)'
  ).run(date, Number(sar_amount), project_group, note || '');

  const transfer = db.prepare('SELECT * FROM ali_transfers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(transfer);
});

// Update transfer (owner only)
router.put('/transfers/:id', requireRole('owner'), (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM ali_transfers WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Transfer not found' });

  const { date, sar_amount, project_group, note } = req.body;

  if (!date || !sar_amount || !project_group) {
    return res.status(400).json({ error: 'date, sar_amount, and project_group are required' });
  }
  if (!['Boutique Village', 'Mountain View'].includes(project_group)) {
    return res.status(400).json({ error: 'project_group must be "Boutique Village" or "Mountain View"' });
  }
  if (Number(sar_amount) <= 0) {
    return res.status(400).json({ error: 'sar_amount must be positive' });
  }

  db.prepare(
    'UPDATE ali_transfers SET date = ?, sar_amount = ?, project_group = ?, note = ? WHERE id = ?'
  ).run(date, Number(sar_amount), project_group, note || '', id);

  const transfer = db.prepare('SELECT * FROM ali_transfers WHERE id = ?').get(id);
  res.json(transfer);
});

// Delete transfer (owner only)
router.delete('/transfers/:id', requireRole('owner'), (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM ali_transfers WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Transfer not found' });

  db.prepare('DELETE FROM ali_transfers WHERE id = ?').run(id);
  res.json({ ok: true });
});

module.exports = router;
