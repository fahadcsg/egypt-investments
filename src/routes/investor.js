const express = require('express');
const db = require('../db');

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

module.exports = router;
