require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('./db');
const bcrypt = require('bcrypt');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('owner','investor')),
    display_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    developer TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL,
    unit_no TEXT,
    total_egp REAL NOT NULL,
    maintenance_egp REAL DEFAULT 0,
    payment_plan TEXT,
    advance_pct TEXT,
    shared INTEGER DEFAULT 0,
    partner_name TEXT,
    split_pct INTEGER DEFAULT 100,
    start_date TEXT,
    delivery TEXT,
    description TEXT,
    color TEXT DEFAULT '#6366f1',
    bedrooms INTEGER,
    area TEXT,
    status TEXT DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL REFERENCES projects(id),
    date TEXT NOT NULL,
    egp_amount REAL NOT NULL,
    sar_transferred REAL DEFAULT 0,
    status TEXT NOT NULL CHECK(status IN ('PAID','DUE','UPCOMING','OVERDUE')),
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ali_transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    sar_amount REAL NOT NULL,
    project_group TEXT NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed users
const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (existingUsers.count === 0) {
  const insertUser = db.prepare('INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)');
  const fahadHash = bcrypt.hashSync('egypt2024!', 10);
  const aliHash = bcrypt.hashSync('investor2024!', 10);
  insertUser.run('fahad', fahadHash, 'owner', 'Fahad');
  insertUser.run('ali', aliHash, 'investor', 'Ali');
  console.log('Users seeded');
}

// Seed projects
const existingProjects = db.prepare('SELECT COUNT(*) as count FROM projects').get();
if (existingProjects.count === 0) {
  const projects = [
    { id: 'bv-b3-201', name: 'Boutique Village B3-201', short_name: 'BV B3-201', developer: 'Modon', location: 'Golden Square, New Cairo', type: 'Apartment', unit_no: 'BV-B3-201', total_egp: 6714000, maintenance_egp: 469980, payment_plan: '7Y Quarterly', advance_pct: '5%', shared: 1, partner_name: 'Ali', split_pct: 50, start_date: 'Sep 2023', description: 'Apartment in Boutique Village, Golden Square, New Cairo.', color: '#059669' },
    { id: 'bv-d2-101', name: 'Boutique Village D2-101', short_name: 'BV D2-101', developer: 'Modon', location: 'Golden Square, New Cairo', type: 'Apartment', unit_no: 'BV-D2-101', total_egp: 3891000, maintenance_egp: 272370, payment_plan: '7Y Quarterly', advance_pct: '5%', shared: 1, partner_name: 'Ali', split_pct: 50, start_date: 'Sep 2023', description: 'Apartment in Boutique Village, Golden Square, New Cairo.', color: '#10b981' },
    { id: 'mv-lvls', name: 'Mountain View LVLs', short_name: 'MV LVLs', developer: 'Mountain View', location: 'North Coast', type: 'Townhouse', unit_no: 'LV-SM-TH-335-A', total_egp: 17697363, maintenance_egp: 0, payment_plan: 'Semi-annual', advance_pct: '10%', shared: 1, partner_name: 'Ali', split_pct: 50, start_date: 'Jul 2023', description: 'Townhouse in Mountain View LVLs, North Coast beachfront.', color: '#0284c7' },
    { id: 'jirian', name: 'Jirian (Palm Hills)', short_name: 'Jirian', developer: 'Palm Hills', location: 'Maison Du Nil', type: 'Villa', unit_no: 'Jirian Villa', total_egp: 27437000, maintenance_egp: 0, payment_plan: '5Y Quarterly', advance_pct: '10%', shared: 0, partner_name: null, split_pct: 100, start_date: 'Jun 2025', description: '3BR waterfront villa, Jirian - Maison Du Nil by Palm Hills.', color: '#7c3aed', bedrooms: 3 },
    { id: 'px', name: 'Palm Hills PX Dawn', short_name: 'PX Dawn', developer: 'Palm Hills', location: '6th October, Cairo', type: 'Apartment', unit_no: 'PX Phase 1', total_egp: 19829000, maintenance_egp: 0, payment_plan: '10Y Monthly', advance_pct: '5%', shared: 0, partner_name: null, split_pct: 100, start_date: 'Feb 2025', description: 'Apartment in PX Dawn, Phase 1. 368 Feddan October.', color: '#dc2626', area: '90+28m²' }
  ];

  const insertProject = db.prepare(`INSERT INTO projects (id, name, short_name, developer, location, type, unit_no, total_egp, maintenance_egp, payment_plan, advance_pct, shared, partner_name, split_pct, start_date, description, color, bedrooms, area) VALUES (@id, @name, @short_name, @developer, @location, @type, @unit_no, @total_egp, @maintenance_egp, @payment_plan, @advance_pct, @shared, @partner_name, @split_pct, @start_date, @description, @color, @bedrooms, @area)`);

  for (const p of projects) {
    insertProject.run({
      ...p,
      bedrooms: p.bedrooms || null,
      area: p.area || null
    });
  }
  console.log('Projects seeded');
}

// Seed payments
const existingPayments = db.prepare('SELECT COUNT(*) as count FROM payments').get();
if (existingPayments.count === 0) {
  const payments = [
    // MV LVLs
    { project_id: 'mv-lvls', date: '2023-08', egp: 1592343, sar: 181993, status: 'PAID', note: '10% advance' },
    { project_id: 'mv-lvls', date: '2023-12', egp: 150000, sar: 0, status: 'PAID', note: 'remaining advance' },
    { project_id: 'mv-lvls', date: '2023-12', egp: 7393, sar: 0, status: 'PAID', note: 'remaining' },
    { project_id: 'mv-lvls', date: '2024-02', egp: 20000, sar: 0, status: 'PAID', note: 'remaining' },
    { project_id: 'mv-lvls', date: '2024-02', egp: 940172, sar: 150284, status: 'PAID', note: 'installment' },
    { project_id: 'mv-lvls', date: '2024-02', egp: 884868, sar: 0, status: 'PAID', note: 'installment' },
    { project_id: 'mv-lvls', date: '2024-08', egp: 940172, sar: 72995, status: 'PAID', note: 'installment' },
    { project_id: 'mv-lvls', date: '2025-02', egp: 940172, sar: 69977, status: 'PAID', note: 'installment' },
    { project_id: 'mv-lvls', date: '2025-08', egp: 940172, sar: 74205, status: 'PAID', note: 'installment' },
    { project_id: 'mv-lvls', date: '2026-02', egp: 940172, sar: 0, status: 'DUE', note: 'installment' },
    { project_id: 'mv-lvls', date: '2026-08', egp: 940172, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'mv-lvls', date: '2027-02', egp: 940172, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'mv-lvls', date: '2027-08', egp: 940172, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'mv-lvls', date: '2027-12', egp: 1415789, sar: 0, status: 'UPCOMING', note: 'maintenance' },
    { project_id: 'mv-lvls', date: '2028-02', egp: 940172, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'mv-lvls', date: '2028-08', egp: 940172, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'mv-lvls', date: '2029-02', egp: 940172, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'mv-lvls', date: '2029-08', egp: 940172, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'mv-lvls', date: '2030-02', egp: 940172, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'mv-lvls', date: '2030-08', egp: 940172, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'mv-lvls', date: '2031-02', egp: 940172, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'mv-lvls', date: '2031-08', egp: 940172, sar: 0, status: 'UPCOMING', note: 'installment' },

    // BV B3-201
    { project_id: 'bv-b3-201', date: '2023-09', egp: 335700, sar: 40939, status: 'PAID', note: '5% reservation' },
    { project_id: 'bv-b3-201', date: '2024-01', egp: 335700, sar: 22925, status: 'PAID', note: '5%' },
    { project_id: 'bv-b3-201', date: '2024-01', egp: 533760, sar: 36451, status: 'PAID', note: '5%+1st installment' },
    { project_id: 'bv-b3-201', date: '2024-04', egp: 198065, sar: 15930, status: 'PAID', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2024-07', egp: 198065, sar: 15728, status: 'PAID', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2024-10', egp: 198065, sar: 15066, status: 'PAID', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2025-01', egp: 198065, sar: 15051, status: 'PAID', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2025-04', egp: 198065, sar: 14742, status: 'PAID', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2025-07', egp: 198065, sar: 15295, status: 'PAID', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2025-10', egp: 198065, sar: 15707, status: 'PAID', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2026-01', egp: 198065, sar: 15295, status: 'PAID', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2026-01', egp: 469980, sar: 0, status: 'DUE', note: 'Maintenance' },
    { project_id: 'bv-b3-201', date: '2026-04', egp: 198065, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2026-07', egp: 198065, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2026-10', egp: 372625, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2027-01', egp: 198065, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2027-04', egp: 198065, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2027-07', egp: 198065, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2027-10', egp: 198065, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2028-01', egp: 198065, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2028-04', egp: 198065, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2028-07', egp: 198065, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2028-10', egp: 198065, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2029-01', egp: 198065, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2029-04', egp: 198065, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2029-07', egp: 198065, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2029-10', egp: 198065, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2030-01', egp: 198065, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2030-04', egp: 198065, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2030-07', egp: 198065, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-b3-201', date: '2030-10', egp: 184590, sar: 0, status: 'UPCOMING', note: 'final' },

    // BV D2-101
    { project_id: 'bv-d2-101', date: '2023-09', egp: 194550, sar: 23726, status: 'PAID', note: '5% reservation' },
    { project_id: 'bv-d2-101', date: '2024-01', egp: 194550, sar: 13286, status: 'PAID', note: '5%' },
    { project_id: 'bv-d2-101', date: '2024-01', egp: 309335, sar: 21125, status: 'PAID', note: '5%+1st installment' },
    { project_id: 'bv-d2-101', date: '2024-04', egp: 114782, sar: 9232, status: 'PAID', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2024-07', egp: 114782, sar: 9115, status: 'PAID', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2024-10', egp: 114782, sar: 8866, status: 'PAID', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2025-01', egp: 114782, sar: 8722, status: 'PAID', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2025-04', egp: 114782, sar: 8543, status: 'PAID', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2025-07', egp: 114782, sar: 8864, status: 'PAID', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2025-10', egp: 114782, sar: 9095, status: 'PAID', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2026-01', egp: 114782, sar: 8864, status: 'PAID', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2026-01', egp: 272370, sar: 0, status: 'DUE', note: 'Maintenance' },
    { project_id: 'bv-d2-101', date: '2026-04', egp: 114782, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2026-07', egp: 114782, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2026-10', egp: 215940, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2027-01', egp: 114782, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2027-04', egp: 114782, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2027-07', egp: 114782, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2027-10', egp: 114782, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2028-01', egp: 114782, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2028-04', egp: 114782, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2028-07', egp: 114782, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2028-10', egp: 114782, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2029-01', egp: 114782, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2029-04', egp: 114782, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2029-07', egp: 114782, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2029-10', egp: 114782, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2030-01', egp: 114782, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2030-04', egp: 114782, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2030-07', egp: 114782, sar: 0, status: 'UPCOMING', note: 'installment' },
    { project_id: 'bv-d2-101', date: '2030-10', egp: 107000, sar: 0, status: 'UPCOMING', note: 'final' },

    // Jirian
    { project_id: 'jirian', date: '2025-06', egp: 1371850, sar: 104482, status: 'PAID', note: '5% reservation' },
    { project_id: 'jirian', date: '2025-08', egp: 1371850, sar: 105934, status: 'PAID', note: '5% contract' },
    { project_id: 'jirian', date: '2025-11', egp: 771666, sar: 0, status: 'DUE', note: 'Q1' },
    { project_id: 'jirian', date: '2026-02', egp: 771666, sar: 0, status: 'DUE', note: 'Q2' },
    { project_id: 'jirian', date: '2026-05', egp: 771666, sar: 0, status: 'UPCOMING', note: 'Q3' },
    { project_id: 'jirian', date: '2026-08', egp: 771666, sar: 0, status: 'UPCOMING', note: 'Q4' },
    { project_id: 'jirian', date: '2026-11', egp: 771666, sar: 0, status: 'UPCOMING', note: 'Q5' },
    { project_id: 'jirian', date: '2027-02', egp: 771666, sar: 0, status: 'UPCOMING', note: 'Q6' },
    { project_id: 'jirian', date: '2027-05', egp: 771666, sar: 0, status: 'UPCOMING', note: 'Q7' },
    { project_id: 'jirian', date: '2027-08', egp: 771666, sar: 0, status: 'UPCOMING', note: 'Q8' },
    { project_id: 'jirian', date: '2027-11', egp: 771666, sar: 0, status: 'UPCOMING', note: 'Q9' },
    { project_id: 'jirian', date: '2028-02', egp: 771666, sar: 0, status: 'UPCOMING', note: 'Q10' },
    { project_id: 'jirian', date: '2028-05', egp: 771666, sar: 0, status: 'UPCOMING', note: 'Q11' },
    { project_id: 'jirian', date: '2028-08', egp: 771666, sar: 0, status: 'UPCOMING', note: 'Q12' },
    { project_id: 'jirian', date: '2028-11', egp: 771666, sar: 0, status: 'UPCOMING', note: 'Q13' },
    { project_id: 'jirian', date: '2029-02', egp: 771666, sar: 0, status: 'UPCOMING', note: 'Q14' },
    { project_id: 'jirian', date: '2029-05', egp: 771666, sar: 0, status: 'UPCOMING', note: 'Q15' },
    { project_id: 'jirian', date: '2029-08', egp: 771666, sar: 0, status: 'UPCOMING', note: 'Q16' },

    // PX Dawn
    { project_id: 'px', date: '2025-02', egp: 991450, sar: 73618, status: 'PAID', note: '5% reservation' },
    { project_id: 'px', date: '2025-03', egp: 33709, sar: 2567, status: 'PAID', note: 'monthly' },
    { project_id: 'px', date: '2025-04', egp: 33709, sar: 2567, status: 'PAID', note: 'monthly' },
    { project_id: 'px', date: '2025-05', egp: 33709, sar: 2567, status: 'PAID', note: 'monthly' },
    { project_id: 'px', date: '2025-06', egp: 33709, sar: 2567, status: 'PAID', note: 'monthly' },
    { project_id: 'px', date: '2025-07', egp: 33709, sar: 2603, status: 'PAID', note: 'monthly' },
    { project_id: 'px', date: '2025-08', egp: 33709, sar: 2603, status: 'PAID', note: 'monthly' },
    { project_id: 'px', date: '2025-09', egp: 33709, sar: 2666, status: 'PAID', note: 'monthly' },
    { project_id: 'px', date: '2025-10', egp: 33709, sar: 2666, status: 'PAID', note: 'monthly' },
    { project_id: 'px', date: '2025-11', egp: 33709, sar: 2665, status: 'PAID', note: 'monthly' },
    { project_id: 'px', date: '2025-12', egp: 33709, sar: 2665, status: 'PAID', note: 'monthly' },
    { project_id: 'px', date: '2026-01', egp: 1080681, sar: 0, status: 'DUE', note: 'annual lump' },
    { project_id: 'px', date: '2026-02', egp: 43624, sar: 0, status: 'DUE', note: 'monthly' },
    { project_id: 'px', date: '2026-03', egp: 43624, sar: 0, status: 'DUE', note: 'monthly' },
    { project_id: 'px', date: '2026-04', egp: 43624, sar: 0, status: 'UPCOMING', note: 'monthly' },
    { project_id: 'px', date: '2026-05', egp: 43624, sar: 0, status: 'UPCOMING', note: 'monthly' },
    { project_id: 'px', date: '2026-06', egp: 43624, sar: 0, status: 'UPCOMING', note: 'monthly' },
    { project_id: 'px', date: '2026-07', egp: 43624, sar: 0, status: 'UPCOMING', note: 'monthly' },
    { project_id: 'px', date: '2026-08', egp: 572397, sar: 0, status: 'UPCOMING', note: 'annual+monthly' },
    { project_id: 'px', date: '2026-09', egp: 43624, sar: 0, status: 'UPCOMING', note: 'monthly' },
    { project_id: 'px', date: '2026-10', egp: 43624, sar: 0, status: 'UPCOMING', note: 'monthly' },
    { project_id: 'px', date: '2026-11', egp: 43624, sar: 0, status: 'UPCOMING', note: 'monthly' },
    { project_id: 'px', date: '2026-12', egp: 43624, sar: 0, status: 'UPCOMING', note: 'monthly' },
    { project_id: 'px', date: '2027-01', egp: 1150082, sar: 0, status: 'UPCOMING', note: 'annual lump' }
  ];

  const insertPayment = db.prepare('INSERT INTO payments (project_id, date, egp_amount, sar_transferred, status, note) VALUES (?, ?, ?, ?, ?, ?)');
  const insertMany = db.transaction((items) => {
    for (const p of items) {
      insertPayment.run(p.project_id, p.date, p.egp, p.sar, p.status, p.note);
    }
  });
  insertMany(payments);
  console.log(`${payments.length} payments seeded`);
}

// Seed Ali transfers
const existingTransfers = db.prepare('SELECT COUNT(*) as count FROM ali_transfers').get();
if (existingTransfers.count === 0) {
  const transfers = [
    { date: '2024-01-18', sar_amount: 75000, project_group: 'Mountain View', note: '' },
    { date: '2024-02-27', sar_amount: 37700, project_group: 'Mountain View', note: '' },
    { date: '2024-06-27', sar_amount: 20000, project_group: 'Boutique Village', note: '' },
    { date: '2024-09-01', sar_amount: 75000, project_group: 'Boutique Village', note: '' },
    { date: '2025-09-16', sar_amount: 30000, project_group: 'Boutique Village', note: '' }
  ];

  const insertTransfer = db.prepare('INSERT INTO ali_transfers (date, sar_amount, project_group, note) VALUES (?, ?, ?, ?)');
  for (const t of transfers) {
    insertTransfer.run(t.date, t.sar_amount, t.project_group, t.note);
  }
  console.log('Ali transfers seeded');
}

console.log('Migration complete');
