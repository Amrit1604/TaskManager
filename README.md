# TaskFlow — Team Task Manager

A production-ready full-stack team task management app built as a placement assignment.

**Live Demo:** `https://your-railway-url.railway.app` *(update after deployment)*

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express (MVC pattern) |
| Database | MySQL 8 |
| Auth | JWT in httpOnly cookies (intentionally NOT localStorage) |
| Deployment | Railway |

## Key Features

- **Role-Based Access Control** — enforced at the API middleware level. A Member hitting an Admin-only route receives HTTP 403, not just a hidden button.
- **JWT in httpOnly cookies** — cannot be read by JavaScript, preventing XSS token theft. This is an intentional security decision over localStorage.
- **Audit Log** — every task status change is recorded in the DB with who changed it and when.
- **Kanban Board** — drag-and-drop between To Do / In Progress / Done columns with optimistic UI updates.
- **Soft Deletes** — projects and tasks are never hard-deleted; `deleted_at IS NULL` filters in every query.
- **Rate Limiting** — `/auth` routes limited to 15 requests per 15 minutes per IP.
- **Email Notifications** — task assignment emails via Nodemailer (disabled gracefully if SMTP not configured).

---

## Local Setup

### Prerequisites
- Node.js 18+
- MySQL 8 running locally
- Git

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd TASKMANAGER

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Set Up the Database

```sql
-- Log into MySQL and run:
mysql -u root -p < backend/db/schema.sql
```

Or paste the contents of `backend/db/schema.sql` into MySQL Workbench / TablePlus.

### 3. Configure Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your MySQL credentials and JWT secret

# Frontend (optional — Vite proxy handles API calls in dev)
cp frontend/.env.example frontend/.env
```

**Required backend `.env` values:**
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=taskmanager
JWT_SECRET=a_very_long_random_string_at_least_32_chars
FRONTEND_URL=http://localhost:5173
COOKIE_SECURE=false
```

**Optional — Email notifications:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM="TaskFlow <your@gmail.com>"
```

### 4. Run the App

Open two terminals:

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **Health check:** http://localhost:5000/health

---

## API Reference

### Auth Routes (`/api/auth`) — Rate limited: 15 req/15min

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/auth/signup` | — | Create account |
| POST | `/auth/login` | — | Login, sets httpOnly cookie |
| POST | `/auth/logout` | — | Clears cookie |
| GET | `/auth/me` | ✓ | Get current user |

### Project Routes (`/api/projects`)

| Method | Route | Role | Description |
|--------|-------|------|-------------|
| GET | `/projects` | Any | List projects (filtered by role) |
| POST | `/projects` | Admin | Create project |
| GET | `/projects/:id` | Any | Get project + members |
| PUT | `/projects/:id` | Admin | Update project |
| DELETE | `/projects/:id` | Admin | Soft delete |
| POST | `/projects/:id/members` | Admin | Add member |
| DELETE | `/projects/:id/members/:uid` | Admin | Remove member |
| GET | `/projects/:id/audit` | Admin | Status change history |

### Task Routes

| Method | Route | Role | Description |
|--------|-------|------|-------------|
| GET | `/projects/:id/tasks` | Any | List tasks (with ?status=&priority=) |
| POST | `/projects/:id/tasks` | Admin | Create task |
| PUT | `/tasks/:id` | Admin/Assignee | Admin: full update; Member: status only |
| DELETE | `/tasks/:id` | Admin | Soft delete |
| GET | `/tasks/:id/audit` | Admin | Task audit trail |

---

## Project Structure

```
TASKMANAGER/
├── backend/
│   ├── db/schema.sql           # MySQL schema
│   ├── src/
│   │   ├── config/             # DB pool, env validation
│   │   ├── controllers/        # Route handlers
│   │   ├── middleware/         # auth, authorize, validate, errorHandler
│   │   ├── models/             # SQL query helpers
│   │   ├── routes/             # Express routers
│   │   ├── services/           # Business logic, email
│   │   └── validators/         # express-validator rule sets
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios instance + resource modules
│   │   ├── components/         # Sidebar, Modal, Badges, TaskModal, etc.
│   │   ├── context/            # AuthContext
│   │   ├── pages/              # Dashboard, Projects, Kanban, AuditLog
│   │   └── utils/              # helpers (dates, overdue check)
│   └── index.html
└── README.md
```

---

## Deploying to Render

We have configured the app to deploy as a single **Web Service** on Render, which builds both the frontend and backend.

**Note about the Database:** Render provides managed PostgreSQL natively, not MySQL. Since this project uses MySQL, you must use an external MySQL provider (like [Aiven](https://aiven.io/mysql) or [TiDB](https://en.pingcap.com/tidb-cloud/)) and provide the connection details to Render.

### Steps to Deploy

1. Create a Render account at [render.com](https://render.com)
2. Connect your GitHub repository to Render.
3. Click **New +** -> **Blueprint**.
4. Select your repository. Render will automatically read the `render.yaml` file in the root directory.
5. Provide a Name for the service when prompted.
6. **Environment Variables**: Render will ask you for the database credentials. Enter the credentials from your external MySQL provider:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
7. Click **Apply**.
8. Once the database is connected, make sure to run the `backend/db/schema.sql` file against your remote database to create the tables.

The `render.yaml` will automatically build the React frontend and serve it securely via the Express backend.

---

## Security Decisions (for the demo)

| Decision | Why |
|----------|-----|
| JWT in httpOnly cookie | JS cannot read it → XSS can't steal tokens |
| Not localStorage | Would be vulnerable to XSS injection |
| `sameSite: strict` | Prevents CSRF attacks |
| Role enforcement at middleware | `authorize('admin')` on every route, not just UI hiding |
| `express-rate-limit` | Prevents brute-force on `/auth` |
| `helmet` | Sets security-related HTTP headers |
| Soft deletes only | Data is never lost; `deleted_at IS NULL` in all queries |

---

## Demo Walkthrough (3-minute path)

1. `/signup` → Create an **Admin** account → redirects to Dashboard
2. `/projects` → Create a project → "Add Member" → add a second user
3. Project detail → "New Task" → set title, priority High, due date = yesterday, assign to member
4. Log out → Log in as the **Member** → see only assigned tasks, overdue highlighted in red
5. Member clicks "Update" → changes status to "In Progress"
6. Log back in as Admin → `/audit` → see the status change in the audit log
7. `/kanban` → select project → drag task from In Progress to Done

*Everything in this list works without any console errors in a demo environment.*
