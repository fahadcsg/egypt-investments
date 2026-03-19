const express = require('express');
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all projects (investor only sees shared)
router.get('/', (req, res) => {
  let projects;
  if (req.user.role === 'investor') {
    projects = db.prepare('SELECT * FROM projects WHERE shared = 1 ORDER BY start_date').all();
  } else {
    projects = db.prepare('SELECT * FROM projects ORDER BY start_date').all();
  }

  // Attach payment summaries
  const paymentSummary = db.prepare(`
    SELECT project_id,
      SUM(egp_amount) as total_egp,
      SUM(CASE WHEN status = 'PAID' THEN egp_amount ELSE 0 END) as paid_egp,
      SUM(CASE WHEN status = 'PAID' THEN sar_transferred ELSE 0 END) as paid_sar,
      SUM(CASE WHEN status IN ('DUE','OVERDUE') THEN egp_amount ELSE 0 END) as due_egp,
      COUNT(*) as total_count,
      SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) as paid_count
    FROM payments GROUP BY project_id
  `).all();

  const summaryMap = {};
  for (const s of paymentSummary) {
    summaryMap[s.project_id] = s;
  }

  const result = projects.map(p => ({
    ...p,
    payments: summaryMap[p.id] || { total_egp: 0, paid_egp: 0, paid_sar: 0, due_egp: 0, total_count: 0, paid_count: 0 }
  }));

  res.json(result);
});

// Get single project with all payments
router.get('/:id', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (req.user.role === 'investor' && !project.shared) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const payments = db.prepare('SELECT * FROM payments WHERE project_id = ? ORDER BY date, id').all(req.params.id);
  res.json({ ...project, payments });
});

// Create project (owner only)
router.post('/', requireRole('owner'), (req, res) => {
  const { id, name, short_name, developer, location, type, unit_no, total_egp, maintenance_egp, payment_plan, advance_pct, shared, partner_name, split_pct, start_date, delivery, description, color, bedrooms, area } = req.body;

  if (!id || !name || !short_name || !developer || !location || !type || !total_egp) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    db.prepare(`INSERT INTO projects (id, name, short_name, developer, location, type, unit_no, total_egp, maintenance_egp, payment_plan, advance_pct, shared, partner_name, split_pct, start_date, delivery, description, color, bedrooms, area)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, name, short_name, developer, location, type, unit_no || null, total_egp, maintenance_egp || 0, payment_plan || null, advance_pct || null, shared ? 1 : 0, partner_name || null, split_pct || 100, start_date || null, delivery || null, description || null, color || '#6366f1', bedrooms || null, area || null);
    res.status(201).json({ id });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Project ID already exists' });
    }
    throw err;
  }
});

// Update project (owner only)
router.put('/:id', requireRole('owner'), (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const { name, short_name, developer, location, type, unit_no, total_egp, maintenance_egp, payment_plan, advance_pct, shared, partner_name, split_pct, start_date, delivery, description, color, bedrooms, area, status } = req.body;

  db.prepare(`UPDATE projects SET name=?, short_name=?, developer=?, location=?, type=?, unit_no=?, total_egp=?, maintenance_egp=?, payment_plan=?, advance_pct=?, shared=?, partner_name=?, split_pct=?, start_date=?, delivery=?, description=?, color=?, bedrooms=?, area=?, status=? WHERE id=?`)
    .run(name, short_name, developer, location, type, unit_no, total_egp, maintenance_egp, payment_plan, advance_pct, shared ? 1 : 0, partner_name, split_pct, start_date, delivery, description, color, bedrooms, area, status || 'Active', req.params.id);

  res.json({ ok: true });
});

module.exports = router;
