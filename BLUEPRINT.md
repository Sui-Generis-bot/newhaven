# Company Contact Directory — Complete Blueprint & MVP Guide

---

## A. MINIMAL ASSUMPTIONS

| Assumption | Decision |
|---|---|
| Deployment target | Node.js host (Railway, Render, VPS) or local |
| Team size | Small internal team; single-instance DB acceptable |
| Concurrent users | < 200 simultaneous; SQLite is sufficient |
| Gotham font | Licensed commercial font — fallback stack provided; instructions to activate Gotham if licensed |
| Mobile support | Responsive design required, native app not required |
| SSO / LDAP | Not required in MVP; password-based auth only |
| Email notifications | Not required in MVP |
| File attachments | Not required in MVP |
| Multi-tenancy | Single company / single tenant |
| Audit retention | Logs kept indefinitely in MVP; add cleanup job if needed |

---

## B. RECOMMENDED TECH STACK

| Layer | Choice | Justification |
|---|---|---|
| **Backend runtime** | Node.js 20 LTS | Ubiquitous, excellent SQLite bindings, same language as frontend tooling |
| **HTTP framework** | Express 4 | Minimal, mature, ecosystem of security middleware |
| **Database** | SQLite via `better-sqlite3` | Zero-ops, synchronous API (no async bugs), WAL mode for concurrency, trivially portable. Swap to Postgres/MySQL if you need horizontal scaling |
| **Password hashing** | `bcryptjs` (cost 12) | Industry standard; pure-JS, no native build required |
| **Sessions** | `express-session` + in-memory store (dev) | Simple; swap to `connect-sqlite3` or Redis for prod |
| **Security middleware** | `helmet`, `express-rate-limit`, `express-validator` | CSP, XSS headers, brute-force protection, input validation |
| **Frontend** | React 18 + Vite | Fast DX, small bundle, component model fits CRUD UI perfectly |
| **Routing** | React Router v6 | Standard; protected route wrapper pattern |
| **Styling** | Vanilla CSS with CSS custom properties | Zero dependencies, full design token control, no class-name collisions |
| **Fonts** | PT Sans (Google Fonts) + Gotham fallback | PT Sans is free; Gotham fallback: Century Gothic → Futura → Trebuchet MS |

**Why not a full-stack framework (Next.js)?**
The requirement is an *internal* app with a clear API/UI split. Express + Vite gives finer control over auth middleware, session handling, and CSP — all of which are non-negotiable in the security requirements.

**Why SQLite instead of Postgres?**
For < 200 concurrent internal users, SQLite with WAL mode is faster and requires zero infrastructure. The schema is fully portable to Postgres — just swap `better-sqlite3` for `pg` and add `RETURNING *` clauses.

---

## C. DATA SCHEMA (SQL) + MIGRATIONS + SEED

### Schema (SQLite-flavored SQL)

```sql
-- USERS
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK(role IN ('admin','viewer')) DEFAULT 'viewer',
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_login    TEXT
);

-- CONTACTS
CREATE TABLE IF NOT EXISTS contacts (
  id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name           TEXT NOT NULL,                   -- required
  title          TEXT NOT NULL,                   -- required (Title/Position)
  email          TEXT NOT NULL,                   -- required; unique among active contacts
  mobile         TEXT,                            -- optional
  telephone      TEXT,                            -- optional
  fax            TEXT,                            -- optional
  office_address TEXT,                            -- optional
  website        TEXT,                            -- optional; validated URL
  department     TEXT,                            -- optional grouping field
  is_active      INTEGER NOT NULL DEFAULT 1,      -- soft delete flag
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  created_by     TEXT REFERENCES users(id),
  updated_by     TEXT REFERENCES users(id)
);

-- AUDIT LOG
CREATE TABLE IF NOT EXISTS audit_log (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id     TEXT REFERENCES users(id),
  username    TEXT,
  action      TEXT NOT NULL CHECK(action IN
              ('CREATE','UPDATE','DELETE','LOGIN','LOGOUT','LOGIN_FAIL')),
  entity      TEXT,         -- 'contact' | null
  entity_id   TEXT,
  details     TEXT,         -- JSON blob: { name, email } or error reason
  ip_address  TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_contacts_name   ON contacts(name);
CREATE INDEX IF NOT EXISTS idx_contacts_email  ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_title  ON contacts(title);
CREATE INDEX IF NOT EXISTS idx_contacts_active ON contacts(is_active);
CREATE INDEX IF NOT EXISTS idx_audit_user      ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity    ON audit_log(entity_id);
```

### Migration Strategy
- `backend/db/migrate.js` is idempotent (uses `CREATE TABLE IF NOT EXISTS`)
- Runs automatically on server start via `require('./db/migrate')` in `server.js`
- For schema changes: add numbered migration scripts (e.g. `migrate_002_add_photo.js`)

### Seed Credentials (dev only — change immediately in production!)
| Username | Password | Role |
|---|---|---|
| `admin` | `Admin@123!` | Admin |
| `viewer` | `Viewer@123!` | Viewer |

---

## D. AUTH + AUTHORIZATION DESIGN

### Authentication Flow
```
Browser                     Express Server
  │                               │
  ├─ POST /api/auth/login ────────►│ Rate-limited (10 req / 15 min per IP)
  │   { username, password }      │ 1. Validate & sanitize input
  │                               │ 2. Lookup user by username (case-insensitive)
  │                               │ 3. bcrypt.compare(password, hash)
  │                               │ 4. session.regenerate() → prevent fixation
  │                               │ 5. Set session: { userId, username, role }
  │                               │ 6. Audit log: LOGIN or LOGIN_FAIL
  │◄─ { user: {id,username,role} }─┤
  │   Cookie: sid=...; HttpOnly   │
  │                               │
  ├─ GET /api/contacts ───────────►│ requireAuth middleware checks session
  │◄─ { data: [...] } ────────────┤
  │                               │
  ├─ POST /api/auth/logout ───────►│ session.destroy() + clearCookie
  │◄─ { message: 'Logged out' } ──┤
```

### Role-Based Access Control Matrix

| Route | Viewer | Admin |
|---|---|---|
| GET  /api/auth/me | ✓ | ✓ |
| POST /api/auth/login | ✓ | ✓ |
| POST /api/auth/logout | ✓ | ✓ |
| GET  /api/contacts | ✓ | ✓ |
| GET  /api/contacts/:id | ✓ | ✓ |
| POST /api/contacts | ✗ (403) | ✓ |
| PUT  /api/contacts/:id | ✗ (403) | ✓ |
| DELETE /api/contacts/:id | ✗ (403) | ✓ |
| GET /api/contacts/admin/audit | ✗ (403) | ✓ |

### Middleware Stack (per request)
```
Request → helmet() → cors() → json() → session() → route handler
                                                  └─ requireAuth()
                                                  └─ requireAdmin() [admin routes]
                                                  └─ express-validator [mutation routes]
```

### Session Security Settings
- `httpOnly: true` — cookie inaccessible to JavaScript
- `secure: true` in production — HTTPS only
- `sameSite: 'lax'` — CSRF protection for navigation
- `maxAge: 8h` — automatic session expiry
- `session.regenerate()` on login — prevents session fixation

### CSRF Posture
Because the SPA sends credentials via a session cookie with `sameSite: lax` and all mutations go to `/api/*` (not same-origin HTML forms), standard CSRF attacks are mitigated. If you need stricter protection (e.g. for embedded iframes), add `csurf` middleware and include the token in API headers.

### Input Validation & Sanitization
All inputs go through `express-validator`:
- `.trim()` — strip whitespace
- `.escape()` — HTML-encode special chars (prevents stored XSS)
- `.normalizeEmail()` — canonicalize email
- `.isURL({ require_protocol: true })` — enforce https:// on website
- `.isLength({ max: N })` — prevent oversized payloads
- Parameterized queries via `better-sqlite3` prepared statements — prevents SQL injection

### Audit Log Events
| Action | When |
|---|---|
| `LOGIN` | Successful login |
| `LOGIN_FAIL` | Bad username or password |
| `LOGOUT` | User signs out |
| `CREATE` | Admin creates a contact |
| `UPDATE` | Admin edits a contact |
| `DELETE` | Admin soft-deletes a contact |

---

## E. UI DESIGN TOKENS + COMPONENTS + ACCESSIBILITY

### Color Palette
```css
--color-primary:       #961B1E;   /* Brand crimson — buttons, links, accents */
--color-primary-dark:  #6e1315;   /* Hover states */
--color-primary-ghost: rgba(150,27,30,0.08); /* Subtle backgrounds */
--color-secondary:     #5F6060;   /* Labels, muted text, table headers */
--color-bg:            #FFFFFF;   /* Page background */
--color-surface:       #FAFAFA;   /* Card / modal footer backgrounds */
--color-border:        #E2E2E2;   /* Dividers, form borders */
```

### Typography System
```
Headings: Gotham (licensed) → 'Century Gothic' → 'Futura' → 'Trebuchet MS' → sans-serif
Body:     'PT Sans' (Google Fonts, free) → 'Trebuchet MS' → Arial → sans-serif

Scale (major third, 1.25x):
  xs:   0.640rem / 10.24px  — labels, badges, tiny metadata
  sm:   0.800rem / 12.80px  — form hints, table cells, captions
  base: 1.000rem / 16px     — body text, inputs
  md:   1.250rem / 20px     — modal headings, section titles
  lg:   1.563rem / 25px     — page headings (h2)
  xl:   1.953rem / 31px     — hero headings (h1)
  2xl:  2.441rem / 39px     — reserved for marketing/splash

Font weights: 400 (normal), 700 (bold) — used for heading labels
Letter-spacing: 0.04–0.06em on uppercase heading labels
```

### Spacing Scale (4px base grid)
```
sp-1: 4px   sp-2: 8px   sp-3: 12px  sp-4: 16px
sp-5: 20px  sp-6: 24px  sp-8: 32px  sp-10: 40px  sp-12: 48px  sp-16: 64px
```

### Key Components
| Component | Description |
|---|---|
| `NavBar` | Sticky top bar in brand crimson; avatar + role badge; sign-out |
| `LoginPage` | Full-page gradient with clipped brand panel above form |
| `DirectoryPage` | Toolbar (search + view toggle) + card/table views + pagination |
| `ContactCard` | Hover-reveal admin actions; avatar initials; email/mobile links |
| `ContactFormModal` | 2-column responsive grid; inline validation; required indicators |
| `ContactViewModal` | Crimson header with avatar; icon-labeled detail rows |
| `ConfirmDialog` | Focus-trapped; Cancel focused by default (safe action first) |
| `Toast` | Slide-in from bottom-right; auto-dismiss at 4s |
| `Button variants` | `btn-primary`, `btn-secondary`, `btn-ghost`, `btn-danger` |

### Accessibility Notes
- All interactive elements have `:focus-visible` outlines (3px solid #961B1E)
- ARIA roles: `role="dialog"`, `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby`
- Alert messages use `role="alert"` for screen reader announcement
- Table uses `aria-sort` on sortable column headers
- Search input uses `aria-label`; live region `aria-live="polite"` for result count
- Avatar initials are `aria-hidden="true"`; buttons use `aria-label`
- Modals trap focus (Escape closes); first focusable element receives focus on open
- Color contrast: #961B1E on white = 5.9:1 (exceeds WCAG AA 4.5:1); white on #961B1E = 5.9:1
- Touch targets minimum 44×44px (all buttons, inputs)
- Mobile: table collapses columns 4+ on screens < 768px

### Loading Gotham (if licensed)
```css
/* Place woff2 files in frontend/public/fonts/ then add to index.css: */
@font-face {
  font-family: 'Gotham';
  src: url('/fonts/Gotham-Book.woff2') format('woff2');
  font-weight: 400; font-style: normal; font-display: swap;
}
@font-face {
  font-family: 'Gotham';
  src: url('/fonts/Gotham-Medium.woff2') format('woff2');
  font-weight: 500; font-style: normal; font-display: swap;
}
@font-face {
  font-family: 'Gotham';
  src: url('/fonts/Gotham-Bold.woff2') format('woff2');
  font-weight: 700; font-style: normal; font-display: swap;
}
/* The --font-heading variable already references 'Gotham' first,
   so no other changes are required. */
```

---

## F. PROJECT FOLDER STRUCTURE

```
company-directory/
│
├── backend/
│   ├── server.js               # Express app entry point
│   ├── package.json
│   ├── .env.example            # Copy to .env and fill secrets
│   ├── data/                   # SQLite DB file (gitignored)
│   │   └── directory.db
│   ├── db/
│   │   ├── index.js            # DB connection singleton
│   │   ├── migrate.js          # Idempotent schema migrations
│   │   └── seed.js             # Dev seed data + demo users
│   ├── middleware/
│   │   └── auth.js             # requireAuth, requireAdmin, attachUser
│   ├── routes/
│   │   ├── auth.js             # POST /login, POST /logout, GET /me
│   │   └── contacts.js         # Full CRUD + audit log endpoint
│   └── utils/
│       └── audit.js            # Centralized audit logging function
│
├── frontend/
│   ├── index.html              # Vite HTML entry (font imports here)
│   ├── vite.config.js          # Dev proxy → backend :3001
│   ├── package.json
│   └── src/
│       ├── main.jsx            # React root, BrowserRouter
│       ├── App.jsx             # Route definitions, ProtectedRoute
│       ├── index.css           # Design tokens + global styles
│       ├── components/
│       │   ├── NavBar.jsx
│       │   ├── ContactFormModal.jsx   # Create/Edit with validation
│       │   ├── ContactViewModal.jsx   # Read-only detail view
│       │   └── ConfirmDialog.jsx      # Delete confirmation
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   └── DirectoryPage.jsx      # Search, sort, paginate, CRUD
│       └── utils/
│           ├── api.js                 # Typed fetch wrapper → /api/*
│           ├── AuthContext.jsx        # Auth state + login/logout
│           └── ToastContext.jsx       # Global toast notifications
│
└── BLUEPRINT.md                # This document
```

---

## G. HOW TO RUN (DEVELOPMENT)

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+

### Step 1 — Backend setup
```bash
cd backend
cp .env.example .env
# Edit .env: set SESSION_SECRET to a 64+ char random string
# Generate one: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

npm install
node db/seed.js    # Creates DB, runs migrations, seeds demo data
npm run dev        # Starts API on http://localhost:3001
```

### Step 2 — Frontend setup (new terminal)
```bash
cd frontend
npm install
npm run dev        # Starts UI on http://localhost:5173
```

### Step 3 — Open in browser
```
http://localhost:5173

Admin login:  admin  / Admin@123!
Viewer login: viewer / Viewer@123!
```

---

## H. PRODUCTION DEPLOY OUTLINE

### Build
```bash
# Build frontend
cd frontend && npm run build
# Output: frontend/dist/

# The backend serves frontend/dist/ when NODE_ENV=production
```

### Environment variables (production .env)
```
NODE_ENV=production
PORT=3001
SESSION_SECRET=<64+ char cryptographically random string>
ALLOWED_ORIGIN=https://directory.yourcompany.com
DB_PATH=/var/data/directory.db   # Persistent volume path
```

### Option A — Railway / Render (PaaS)
1. Push repo to GitHub
2. Create new Web Service on Railway/Render
3. Set root directory to `backend/`
4. Set build command: `npm install && node db/seed.js`
   *(or run seed manually once, then remove from build command)*
5. Set start command: `node server.js`
6. Add environment variables from above
7. Mount a persistent disk at `/var/data/` for the SQLite file
8. Set up a custom domain + enable HTTPS

### Option B — VPS (Ubuntu)
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo, install, build frontend
git clone <repo> /opt/company-directory
cd /opt/company-directory/frontend && npm install && npm run build
cd /opt/company-directory/backend  && npm install

# Create systemd service
sudo nano /etc/systemd/system/company-directory.service
# [Unit]
# Description=Company Directory
# After=network.target
#
# [Service]
# WorkingDirectory=/opt/company-directory/backend
# ExecStart=/usr/bin/node server.js
# Restart=always
# EnvironmentFile=/opt/company-directory/backend/.env
#
# [Install]
# WantedBy=multi-user.target

sudo systemctl enable --now company-directory

# Nginx reverse proxy (handles HTTPS via Certbot)
sudo apt install nginx certbot python3-certbot-nginx
# Configure /etc/nginx/sites-available/directory to proxy_pass http://localhost:3001
sudo certbot --nginx -d directory.yourcompany.com
```

### Security hardening checklist for production
- [ ] `SESSION_SECRET` is 64+ random bytes, never committed to git
- [ ] `secure: true` on cookie (requires HTTPS)
- [ ] Nginx or Caddy terminates TLS, forwards to Express
- [ ] `DB_PATH` points to a persistent volume (not container ephemeral storage)
- [ ] Rate limiter window/max tuned for your user count
- [ ] `ALLOWED_ORIGIN` locked to production domain
- [ ] Seed script removed from build command after first run
- [ ] Admin default password changed immediately after first login
- [ ] Backup strategy for SQLite file (daily cron copy to S3/object storage)

---

## H. TEST CHECKLIST

### Security Tests
- [ ] Login with correct credentials → session cookie set, `HttpOnly` flag visible in DevTools
- [ ] Login with wrong password → 401 returned, audit log shows LOGIN_FAIL
- [ ] 11th login attempt in 15 min → 429 Too Many Requests returned
- [ ] Access `/api/contacts` without session cookie → 401 returned
- [ ] Viewer session: POST/PUT/DELETE to contacts → 403 returned
- [ ] Session cookie missing `HttpOnly`? → Fail (must be set)
- [ ] Try XSS payload in name field: `<script>alert(1)</script>` → stored as escaped HTML
- [ ] Try SQL injection in search: `'; DROP TABLE contacts; --` → no error, no damage
- [ ] Logout → session cleared → subsequent `/api/contacts` request → 401
- [ ] Access another contact's direct URL after logout → redirected to login

### CRUD Tests (Admin)
- [ ] Create contact with all fields → appears in directory
- [ ] Create contact with only required fields (name, title, email) → succeeds
- [ ] Create contact with duplicate email → 409 Conflict error shown
- [ ] Create contact with invalid website URL → inline validation error shown
- [ ] Edit contact → changes reflected immediately without page reload
- [ ] Edit contact → audit log entry created with correct userId and timestamp
- [ ] Delete contact → confirm dialog shown before deletion
- [ ] Delete contact → soft-deleted (not visible in directory, `is_active=0` in DB)
- [ ] Cancel delete → contact remains

### UX Tests
- [ ] Search for name, title, email, department → correct results returned
- [ ] Clear search → full list restored
- [ ] Sort by name ascending/descending → correct order
- [ ] Sort by title, department, email → all work
- [ ] Pagination: page 1 → page 2 → page 1 works correctly
- [ ] Card view → Table view toggle → layout switches
- [ ] Click contact card → view modal opens with all filled fields
- [ ] View modal: email link → mailto opens; phone link → tel: opens
- [ ] Responsive: on mobile (375px) → navbar hamburger shows; table collapses columns
- [ ] Form: submit with empty required fields → inline errors appear without page reload
- [ ] Toast: add/edit/delete → toast notification appears and auto-dismisses
- [ ] Escape key closes any open modal
- [ ] Tab through form → all inputs focusable in logical order
- [ ] Keyboard-only navigation through contact cards works

### Cross-Browser
- [ ] Chrome/Edge latest
- [ ] Firefox latest
- [ ] Safari 16+ (iOS + macOS)

---

*Blueprint version 1.0 — Company Directory Internal App*
