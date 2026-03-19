const express = require('express');
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all payments (with optional filters)
router.get('/', (req, res) => {
  const { project_id, status } = req.query;
  let sql = `SELECT p.*, pr.short_name as project_name, pr.color as project_color, pr.shared
    FROM payments p JOIN projects pr ON p.project_id = pr.id WHERE 1=1`;
  const params = [];

  if (req.user.role === 'investor') {
    sql += ' AND pr.shared = 1';
  }
  if (project_id) {
    sql += ' AND p.project_id = ?';
    params.push(project_id);
  }
  if (status) {
    sql += ' AND p.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY p.date, p.id';
  res.json(db.prepare(sql).all(...params));
});

// Create payment (owner only)
router.post('/', requireRole('owner'), (req, res) => {
  const { project_id, date, egp_amount, sar_transferred, status, note } = req.body;
  if (!project_id || !date || !egp_amount || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(project_id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const result = db.prepare('INSERT INTO payments (project_id, date, egp_amount, sar_transferred, status, note) VALUES (?, ?, ?, ?, ?, ?)')
    .run(project_id, date, egp_amount, sar_transferred || 0, status, note || null);

  res.status(201).json({ id: result.lastInsertRowid });
});

// Update payment (owner only)
router.put('/:id', requireRole('owner'), (req, res) => {
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });

  const { date, egp_amount, sar_transferred, status, note } = req.body;

  db.prepare('UPDATE payments SET date=?, egp_amount=?, sar_transferred=?, status=?, note=? WHERE id=?')
    .run(date, egp_amount, sar_transferred || 0, status, note || null, req.params.id);

  res.json({ ok: true });
});

// Delete payment (owner only)
router.delete('/:id', requireRole('owner'), (req, res) => {
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });

  db.prepare('DELETE FROM payments WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
