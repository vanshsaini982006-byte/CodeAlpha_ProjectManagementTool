# TaskFlow

A full-stack, real-time project management tool — boards, tasks, comments, and notifications, built with the MERN stack and Socket.io.

## Overview

TaskFlow lets a team create projects, invite members with roles (Owner / Admin / Member), organize work on a Trello-style Kanban board, assign and track tasks with priorities and due dates, discuss work inline through task comments, and stay in sync through live, real-time updates — no page refresh required.

## Features

- **Authentication** — register, login, logout, JWT-based sessions, persistent login, protected routes
- **User profiles** — name, username, avatar, bio
- **Projects** — create, edit, delete, invite/remove members, per-project roles (Owner / Admin / Member)
- **Project dashboard** — task totals, completed / pending / in-progress / overdue counts, team list, recent activity
- **Kanban board** — Backlog → To Do → In Progress → Review → Completed, drag-and-drop task cards
- **Tasks** — create, edit, delete, assign, set priority/due date/labels, full task detail view
- **Comments** — add, edit, delete, all in real time
- **Notifications** — in-app notification center for assignments, comments, project invites, and status changes, with unread badge and mark-as-read
- **Real-time everywhere** — Socket.io broadcasts task, comment, member, and notification events to everyone viewing a project
- **Responsive, modern UI** — dark themed SaaS interface, works down to mobile

## Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, React Router, Axios, Socket.io-client, React Hook Form

**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, Socket.io, dotenv, CORS

## Folder Structure

```
taskflow/
├── backend/
│   ├── config/          # MongoDB connection
│   ├── controllers/     # Route handler logic
│   ├── middleware/      # Auth + project-access guards, error handler
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routers
│   ├── seed/            # Demo data seed script
│   ├── services/        # Notification creation/broadcast helper
│   ├── socket/          # Socket.io server + room helpers
│   ├── .env.example
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI (Avatar, Modal, TaskCard, etc.)
│   │   ├── context/     # Auth, Socket, Toast providers
│   │   ├── layouts/     # AppLayout (sidebar/nav), AuthLayout
│   │   ├── pages/       # Route-level pages
│   │   ├── services/    # Axios client + API modules
│   │   ├── utils/       # Formatting helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── .env.example
└── README.md
```

## Prerequisites

- Node.js 18+
- A MongoDB database — either a local `mongod` instance or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster

## Installation & Setup

### 1. Clone and install

```bash
git clone <your-repo-url> taskflow
cd taskflow

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

**backend/.env** (copy from `backend/.env.example`):

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

- `MONGO_URI` — e.g. `mongodb://localhost:27017/taskflow` or your Atlas connection string
- `JWT_SECRET` — any long random string
- `CLIENT_URL` — the frontend origin, used for CORS and Socket.io

**frontend/.env** (copy from `frontend/.env.example`):

```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

> Never commit real `.env` files — both are already listed in `.gitignore`.

### 3. MongoDB setup

**Option A — Local MongoDB:** install MongoDB Community Server and run `mongod`. Use `MONGO_URI=mongodb://localhost:27017/taskflow`.

**Option B — MongoDB Atlas (recommended):**
1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Add a database user and allow your IP (or `0.0.0.0/0` for development)
3. Copy the connection string into `MONGO_URI`

### 4. Run locally

In two terminals:

```bash
# Terminal 1 — backend (http://localhost:5000)
cd backend
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm run dev
```

Visit `http://localhost:5173` and register a new account, or seed demo data (below) and log in directly.

### 5. (Optional) Seed demo data

```bash
cd backend
npm run seed
```

**Demo credentials created by the seed script:**

| Email                | Password      | Role   |
|-----------------------|---------------|--------|
| Vansh@taskflow.demo     | password123   | Owner  |
| rohan@taskflow.demo   | password123   | Admin  |
| priya@taskflow.demo   | password123   | Member |

This creates one demo project ("TaskFlow Launch") with five tasks across every board column and a few comments, so the board and dashboard aren't empty on first login.

## API Overview

All routes except `/api/auth/register` and `/api/auth/login` require an `Authorization: Bearer <token>` header.

**Auth**
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

**Users**
```
GET    /api/users/profile
PUT    /api/users/profile
GET    /api/users/:id
GET    /api/users?search=term
```

**Projects**
```
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/members
DELETE /api/projects/:id/members/:userId
```

**Tasks**
```
GET    /api/projects/:projectId/tasks
POST   /api/projects/:projectId/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id
PUT    /api/tasks/:id/status
PUT    /api/tasks/:id/assign
```

**Comments**
```
GET    /api/tasks/:taskId/comments
POST   /api/tasks/:taskId/comments
PUT    /api/comments/:id
DELETE /api/comments/:id
```

**Notifications**
```
GET    /api/notifications
PUT    /api/notifications/:id/read
PUT    /api/notifications/read-all
```

## Socket.io Real-Time Events

The client connects with its JWT in the socket handshake (`auth.token`) and joins a personal room (`user:<id>`) automatically, plus any project room it explicitly joins (`project:<id>`) while viewing that project's board or a task inside it.

**Client → server**
```
project:join   (projectId)
project:leave  (projectId)
```

**Server → client** (broadcast to the relevant project or user room)
```
taskCreated, taskUpdated, taskDeleted, taskMoved, taskAssigned
commentAdded, commentUpdated, commentDeleted
notificationCreated
memberAdded, memberRemoved
projectUpdated, projectDeleted
```

## Screenshots

_Add screenshots of the dashboard, Kanban board, and task detail view here before sharing/submitting._

## Deployment

**Backend (e.g. Render / Railway):**
1. Push the repo to GitHub
2. Create a new web service pointed at `backend/`, with build command `npm install` and start command `npm start`
3. Set the environment variables from `backend/.env.example` in the host's dashboard (use your Atlas `MONGO_URI` and a strong `JWT_SECRET`)
4. Set `CLIENT_URL` to your deployed frontend's URL

**Frontend (e.g. Vercel / Netlify):**
1. Point the host at `frontend/`, build command `npm run build`, output directory `dist`
2. Set `VITE_API_URL` and `VITE_SOCKET_URL` to your deployed backend's URL (with `/api` on the former)

**MongoDB:** use an Atlas cluster for production; local `mongod` is for development only.

## Error Handling

- The backend returns structured `{ success: false, message }` JSON on every error, with correct HTTP status codes (400/401/403/404/500), and never crashes on a bad request or a temporarily unreachable database.
- The frontend surfaces API, network, and validation errors through inline form messages and toast notifications, and shows dedicated loading, empty, and error states instead of blank screens.
