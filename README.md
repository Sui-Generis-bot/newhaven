# Company Contact Directory

Secure, role-based internal staff directory web app.

## Quick Start (Development)

```bash
# Terminal 1 — Backend
cd backend
cp .env.example .env          # then edit SESSION_SECRET
npm install
node db/seed.js               # migrate + seed demo data
npm run dev                   # http://localhost:3001

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

**Login credentials (demo only — change in production):**
- Admin: `admin` / `Admin@123!`
- Viewer: `viewer` / `Viewer@123!`

## Full Documentation

See [BLUEPRINT.md](./BLUEPRINT.md) for:
- Tech stack decisions
- Full data schema + migrations
- Auth & authorization design
- UI design tokens + accessibility
- Production deploy instructions
- Complete test checklist
