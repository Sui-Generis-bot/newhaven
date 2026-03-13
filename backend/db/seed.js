// db/seed.js
const bcrypt = require('bcryptjs');
const path = require('path');

process.env.DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/directory.db');
require('./migrate'); // ensure schema exists

const Database = require('better-sqlite3');
const db = new Database(process.env.DB_PATH);

const seed = db.transaction(() => {
  // Seed users
  const adminHash = bcrypt.hashSync('Admin@123!', 12);
  const viewerHash = bcrypt.hashSync('Viewer@123!', 12);

  db.prepare(`
    INSERT OR IGNORE INTO users (id, username, email, password_hash, role)
    VALUES (?,?,?,?,?)
  `).run('admin-seed-001', 'admin', 'admin@company.com', adminHash, 'admin');

  db.prepare(`
    INSERT OR IGNORE INTO users (id, username, email, password_hash, role)
    VALUES (?,?,?,?,?)
  `).run('viewer-seed-001', 'viewer', 'viewer@company.com', viewerHash, 'viewer');

  // Seed contacts
  const contacts = [
    {
      id: 'contact-001', name: 'Maria Santos', title: 'Chief Executive Officer',
      email: 'maria.santos@company.com', mobile: '+63 917 123 4567', telephone: '+63 2 8123 4567',
      fax: '+63 2 8123 4568', office_address: '12/F Ayala Tower One, Ayala Ave, Makati City 1226',
      website: 'https://company.com/team/maria-santos', department: 'Executive'
    },
    {
      id: 'contact-002', name: 'James Reyes', title: 'Chief Technology Officer',
      email: 'james.reyes@company.com', mobile: '+63 918 234 5678', telephone: '+63 2 8234 5678',
      fax: null, office_address: '12/F Ayala Tower One, Ayala Ave, Makati City 1226',
      website: 'https://company.com/team/james-reyes', department: 'Technology'
    },
    {
      id: 'contact-003', name: 'Ana Dela Cruz', title: 'Head of Human Resources',
      email: 'ana.delacruz@company.com', mobile: '+63 919 345 6789', telephone: '+63 2 8345 6789',
      fax: '+63 2 8345 6790', office_address: '10/F Ayala Tower One, Ayala Ave, Makati City 1226',
      website: null, department: 'Human Resources'
    },
    {
      id: 'contact-004', name: 'Roberto Lim', title: 'Finance Director',
      email: 'roberto.lim@company.com', mobile: '+63 920 456 7890', telephone: '+63 2 8456 7890',
      fax: '+63 2 8456 7891', office_address: '11/F Ayala Tower One, Ayala Ave, Makati City 1226',
      website: 'https://company.com/team/roberto-lim', department: 'Finance'
    },
    {
      id: 'contact-005', name: 'Grace Tan', title: 'Marketing Manager',
      email: 'grace.tan@company.com', mobile: '+63 921 567 8901', telephone: '+63 2 8567 8901',
      fax: null, office_address: '9/F Ayala Tower One, Ayala Ave, Makati City 1226',
      website: 'https://company.com/team/grace-tan', department: 'Marketing'
    },
    {
      id: 'contact-006', name: 'Miguel Torres', title: 'Senior Software Engineer',
      email: 'miguel.torres@company.com', mobile: '+63 922 678 9012', telephone: null,
      fax: null, office_address: '12/F Ayala Tower One, Ayala Ave, Makati City 1226',
      website: 'https://github.com/mtorres', department: 'Technology'
    },
    {
      id: 'contact-007', name: 'Isabelle Garcia', title: 'Operations Manager',
      email: 'isabelle.garcia@company.com', mobile: '+63 923 789 0123', telephone: '+63 2 8789 0123',
      fax: '+63 2 8789 0124', office_address: '8/F Ayala Tower One, Ayala Ave, Makati City 1226',
      website: null, department: 'Operations'
    },
    {
      id: 'contact-008', name: 'Daniel Ramos', title: 'Legal Counsel',
      email: 'daniel.ramos@company.com', mobile: '+63 924 890 1234', telephone: '+63 2 8890 1234',
      fax: '+63 2 8890 1235', office_address: '7/F Ayala Tower One, Ayala Ave, Makati City 1226',
      website: 'https://company.com/legal', department: 'Legal'
    },
  ];

  const insertContact = db.prepare(`
    INSERT OR IGNORE INTO contacts (id,name,title,email,mobile,telephone,fax,office_address,website,department,created_by,updated_by)
    VALUES (@id,@name,@title,@email,@mobile,@telephone,@fax,@office_address,@website,@department,'admin-seed-001','admin-seed-001')
  `);

  contacts.forEach(c => insertContact.run(c));
});

seed();
console.log('✅ Seed complete.');
console.log('   Admin login: admin / Admin@123!');
console.log('   Viewer login: viewer / Viewer@123!');
