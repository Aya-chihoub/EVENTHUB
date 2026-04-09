# EventHub — Event and Participant Management System

> Advanced web programming project (Labs 7–10)  
> Stack: Django REST Framework · Node.js/Express · React/Vite

---

## Table of contents

1. [Project overview](#project-overview)
2. [Overall architecture](#overall-architecture)
3. [Prerequisites](#prerequisites)
4. [Installation and startup](#installation-and-startup)
   - [Django backend](#django-backend)
   - [Node.js backend](#nodejs-backend)
   - [React frontend](#react-frontend)
5. [Project structure](#project-structure)
6. [Data models](#data-models)
7. [API Reference — Django](#api-reference--django)
8. [API Reference — Node.js](#api-reference--nodejs)
9. [Authentication and roles](#authentication-and-roles)
10. [Frontend — Pages and features](#frontend--pages-and-features)
11. [Environment variables](#environment-variables)
12. [Django vs Node.js comparison](#django-vs-nodejs-comparison)
13. [Deployment](#deployment)

---

## Project overview

**EventHub** is a full-stack web app for managing events and participants. It supports:

- Creating and managing events (title, description, location, dates, capacity, status)
- Maintaining a participant directory (name, email, phone, bio)
- Registering participants for events with capacity checks
- Access control via two roles: **editor** (full CRUD) and **viewer** (read-only)
- Filtering events by status and date range

The project exposes **two independent backends** implementing the same REST API: one in Django (Python) and one in Node.js/Express (JavaScript), for technical comparison.

---

## Overall architecture

```
EVENTHUB/
├── django_backend/     # Python/Django REST API
├── node_backend/       # Node.js/Express REST API
└── react_frontend/     # React/Vite UI
```

```
React Frontend (port 5173)
        │  HTTP/JSON + JWT
        ▼
Django Backend (port 8000)   ◄──► SQLite (db.sqlite3)
        or
Node.js Backend (port 4000)  ◄──► SQLite (database.sqlite)
```

---

## Prerequisites

| Tool | Minimum version |
|------|-----------------|
| Python | 3.10+ |
| Node.js | 18+ |
| npm | 9+ |
| Git | 2.x |

---

## Installation and startup

### Django backend

```bash
# 1. Go to the directory
cd django_backend

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Configure environment
copy .env.example .env      # Windows
# cp .env.example .env      # Linux/Mac

# 4. Create database tables
python manage.py makemigrations events participants registrations
python manage.py migrate

# 5. Create a superuser (editor)
python manage.py createsuperuser

# 6. (Optional) Create a viewer user
python manage.py shell
# >>> from django.contrib.auth.models import User
# >>> User.objects.create_user(username='viewer1', password='viewer1234')
# >>> exit()

# 7. Start the server
python manage.py runserver
# → http://127.0.0.1:8000/
```

### Node.js backend

```bash
# 1. Go to the directory
cd node_backend

# 2. Install dependencies
npm install

# 3. Configure environment
copy .env.example .env      # Windows
# cp .env.example .env      # Linux/Mac

# 4. Start the server
npm run dev
# → http://localhost:4000/
```

### React frontend

```bash
# 1. Go to the directory
cd react_frontend

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
# → http://localhost:5173/
```

> **Note:** In development, Vite proxies `/api` to the backend defined in `vite.config.js` (by default the **Node** API on port **4000**). To use **Django** locally, set the proxy `target` to `http://127.0.0.1:8000`. For production, set `VITE_API_URL` to your deployed API base URL (including `/api`).

---

## Project structure

### Django backend

```
django_backend/
├── manage.py
├── requirements.txt
├── .env.example
├── db.sqlite3                  # Database (generated)
├── eventhub/
│   ├── settings.py             # Django settings
│   ├── urls.py                 # Root routes
│   └── wsgi.py
├── events/
│   ├── models.py               # Event model
│   ├── serializers.py          # EventSerializer, EventListSerializer
│   ├── views.py                # EventViewSet
│   ├── filters.py              # EventFilter (status, dates)
│   ├── permissions.py          # IsAdminOrReadOnly
│   └── urls.py
├── participants/
│   ├── models.py               # Participant model
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── registrations/
│   ├── models.py               # Registration model
│   ├── serializers.py
│   ├── views.py                # Business rules: duplicates, capacity, status
│   └── urls.py
└── authentication/
    ├── views.py                # Login, logout, register
    └── serializers.py
```

### Node.js backend

```
node_backend/
├── package.json
├── .env.example
└── src/
    ├── index.js                # Express entry point
    ├── config/
    │   └── database.js         # Sequelize/SQLite
    ├── models/
    ├── routes/
    │   ├── auth.js
    │   ├── events.js
    │   ├── participants.js
    │   └── registrations.js
    └── middleware/
        ├── auth.js             # authenticateToken, requireEditor
        └── errorHandler.js
```

### React frontend

```
react_frontend/
├── index.html
├── vite.config.js              # Dev proxy → backend (see file)
└── src/
    ├── main.jsx
    ├── App.jsx                 # React Router routes
    ├── context/
    │   └── AuthContext.jsx     # Login/logout/roles
    ├── services/
    │   ├── api.js              # Axios + JWT interceptor
    │   ├── events.js
    │   └── …
    ├── hooks/
    │   └── useFetch.js
    ├── components/
    │   └── common/
    │       ├── Layout.jsx      # Navbar with role
    │       └── ProtectedRoute.jsx
    └── pages/
        ├── LoginPage.jsx
        ├── DashboardPage.jsx   # Stats + recent events
        ├── EventsPage.jsx      # List, filters, create
        ├── EventDetailPage.jsx
        └── ParticipantsPage.jsx
```

---

## Data models

### Event

| Field | Type | Description |
|-------|------|-------------|
| `id` | AutoField | Primary key |
| `title` | CharField(200) | Event title |
| `description` | TextField | Description (optional) |
| `location` | CharField(300) | Location (optional) |
| `start_date` | DateTimeField | Start date/time |
| `end_date` | DateTimeField | End date/time |
| `max_participants` | PositiveIntegerField | Max capacity (optional) |
| `status` | CharField | `draft` / `published` / `cancelled` / `completed` |
| `created_at` | DateTimeField | Created (auto) |
| `updated_at` | DateTimeField | Updated (auto) |

### Participant

| Field | Type | Description |
|-------|------|-------------|
| `id` | AutoField | Primary key |
| `first_name` | CharField(100) | First name |
| `last_name` | CharField(100) | Last name |
| `email` | EmailField | Email (unique) |
| `phone` | CharField(20) | Phone (optional) |
| `bio` | TextField | Bio (optional) |

### Registration

| Field | Type | Description |
|-------|------|-------------|
| `id` | AutoField | Primary key |
| `event` | ForeignKey(Event) | Event |
| `participant` | ForeignKey(Participant) | Participant |
| `status` | CharField | `pending` / `confirmed` / `cancelled` |
| `registered_at` | DateTimeField | Registration time (auto) |

**Business rules:**

- A participant cannot register twice for the same event
- Cannot register for a cancelled event
- Cannot register when the event is full (`max_participants` reached)

---

## API Reference — Django

**Base URL:** `http://127.0.0.1:8000/api/`

All routes require an `Authorization: Bearer <access_token>` header except `/auth/login/` and `/auth/register/`.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login/` | Login → returns `access` + `refresh` tokens |
| `POST` | `/auth/logout/` | Logout |
| `POST` | `/auth/register/` | Register |
| `POST` | `/auth/token/refresh/` | Refresh token |

**Login example:**

```json
POST /api/auth/login/
{
  "username": "admin",
  "password": "yourpassword"
}
// Response:
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "user": { "id": 1, "username": "admin", "role": "editor" }
}
```

### Events

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| `GET` | `/events/` | All | Paginated event list |
| `POST` | `/events/` | Editor | Create event |
| `GET` | `/events/{id}/` | All | Event detail |
| `PUT` | `/events/{id}/` | Editor | Update event |
| `DELETE` | `/events/{id}/` | Editor | Delete event |
| `GET` | `/events/{id}/participants/` | All | Registered participants |

**Filter query params (`GET /events/`):**

| Parameter | Type | Example |
|-----------|------|---------|
| `status` | string | `?status=published` |
| `start_date_after` | date | `?start_date_after=2026-01-01` |
| `start_date_before` | date | `?start_date_before=2026-12-31` |

### Participants

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| `GET` | `/participants/` | All | Participant list |
| `POST` | `/participants/` | Editor | Create participant |
| `GET` | `/participants/{id}/` | All | Participant detail |
| `PUT` | `/participants/{id}/` | Editor | Update participant |
| `DELETE` | `/participants/{id}/` | Editor | Delete participant |

### Registrations

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| `GET` | `/registrations/` | All | Registration list |
| `POST` | `/registrations/` | Editor | Create registration |
| `DELETE` | `/registrations/{id}/` | Editor | Cancel registration |

**Create registration example:**

```json
POST /api/registrations/
{
  "event": 1,
  "participant": 3
}
```

---

## API Reference — Node.js

**Base URL:** `http://localhost:4000/api/`

Routes mirror Django. Send the JWT in the `Authorization: Bearer <token>` header.

---

## Authentication and roles

The stack uses **JWT** via `djangorestframework-simplejwt` on Django; Node uses `jsonwebtoken` with the same response shape (`access`, `refresh`, `user`).

### Token lifetime

| Token | Lifetime |
|-------|----------|
| Access token | 1 hour |
| Refresh token | 7 days |

### Roles

| Role | Conditions | Permissions |
|------|------------|-------------|
| **Editor** | `is_staff=True` or in `editor` group | Full CRUD |
| **Viewer** | Authenticated | Read-only (GET) |

### Promote a user to editor (Django)

```bash
python manage.py shell
```

```python
from django.contrib.auth.models import User, Group
user = User.objects.get(username='username')
group, _ = Group.objects.get_or_create(name='editor')
user.groups.add(group)
```

---

## Frontend — Pages and features

### Login (`/login`)

- Username/password form
- JWT stored in `localStorage` via `AuthContext`
- Redirect after sign-in

### Dashboard (`/dashboard`)

- Four stat cards: total events, published, total participants, registrations
- Recent events table with status styling

### Events (`/events`)

- Paginated list with filters (status + date range)
- “New event” for editors only
- Inline create form

### Event detail (`/events/:id`)

- Full event info
- Registered participants
- Registration form (editors)

### Participants (`/participants`)

- Participant list
- Create/delete (editors)

---

## Environment variables

### Django (`django_backend/.env`)

```env
SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=*
```

### Node.js (`node_backend/.env`)

```env
PORT=4000
JWT_SECRET=your-jwt-secret
NODE_ENV=development
```

### React (production build)

Set `VITE_API_URL` to your deployed API base URL, e.g. `https://your-api.onrender.com/api` (Vite embeds this at build time).

---

## Django vs Node.js comparison

| Aspect | Django REST Framework | Node.js / Express |
|--------|------------------------|-------------------|
| **Language** | Python | JavaScript |
| **ORM** | Django ORM (built-in) | Sequelize |
| **Migrations** | `makemigrations` / `migrate` | `sequelize.sync()` or manual migrations |
| **JWT auth** | `djangorestframework-simplejwt` | `jsonwebtoken` |
| **Validation** | Serializers | `express-validator` / manual |
| **Permissions** | Built-in permission classes | Custom middleware |
| **Admin** | `/admin` included | None (build your own) |
| **Filtering** | `django-filter` | Manual in routes |
| **Learning curve** | Steeper (Django conventions) | Often lighter entry |
| **Performance** | Fine for typical CRUD | Strong for I/O-heavy APIs |
| **Boilerplate** | Lower (“batteries included”) | More explicit code |

**Summary:** Django fits structured projects with rich business rules. Node offers flexibility and is a strong fit for lightweight or real-time APIs.

---

## Deployment

### Django backend → Render (free tier)

1. Create an account on [render.com](https://render.com)
2. New Web Service → connect the GitHub repo
3. Set **Root directory** to `django_backend` (if deploying from monorepo)
4. **Build command:** e.g. use `build.sh` or `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
5. **Start command:** `gunicorn eventhub.wsgi:application --bind 0.0.0.0:$PORT`
6. Set env vars: `SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, etc.

### Node.js backend → Render (free tier)

1. New Web Service → same repo
2. **Root directory:** `node_backend`
3. **Build command:** `npm install`
4. **Start command:** `npm start` or `node src/index.js`
5. Set `JWT_SECRET`, `NODE_ENV=production`; Render provides `PORT`

### React frontend → Vercel (free tier)

1. Create an account on [vercel.com](https://vercel.com)
2. Import the project → root `react_frontend`
3. Set **`VITE_API_URL`** to your production API (e.g. `https://your-service.onrender.com/api`)
4. Deploy (redeploy after changing env vars)

---

## Team
Aya Chihoub, Nour El Imene Khelassi, Massizelle Boubadjou.
Course project for **Advanced Web Programming**.

---

*Last updated: April 2026*
