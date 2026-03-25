# EventHub — Technical Report

**Event and Participant Management System**
Web Programming 2026 — Integrated Full-Stack Application (Labs 7–10)

---

## Table of Contents

1. Introduction
2. Data Modeling
3. Django REST Backend (Lab 7)
4. Node.js/Express Backend (Lab 8)
5. Django vs Node.js — Comparative Analysis
6. React Frontend (Lab 9)
7. Frontend–Backend Integration
8. Deployment (Lab 10)
9. Testing and Validation
10. Conclusion

---

## 1. Introduction

EventHub is a full-stack web application for managing events and participants. It allows authenticated users to create and manage events, maintain a participant directory, and register participants to events with business rules enforcing capacity limits and preventing duplicate registrations.

The project implements two independent REST backends — one in Django (Python) and one in Node.js/Express (JavaScript) — serving the same API contract. A React single-page application (SPA) consumes the Django API and provides a modern, role-based user interface.

**Technology stack:**

| Layer | Technology |
|-------|-----------|
| Primary backend | Django 4.2 + Django REST Framework 3.17 |
| Comparative backend | Node.js + Express 4.21 + Sequelize 6.37 |
| Frontend | React 18.2 + Vite 5.0 + React Router 6.20 |
| Authentication | JWT (djangorestframework-simplejwt / jsonwebtoken) |
| Database | SQLite (both backends) |
| Deployment | Render (backends) + Vercel (frontend) |

---

## 2. Data Modeling

The application uses three core entities connected through a relational schema.

### 2.1 Event

| Field | Type | Constraints |
|-------|------|------------|
| id | AutoField | Primary key |
| title | CharField(200) | Required |
| description | TextField | Optional, default empty |
| location | CharField(300) | Optional, default empty |
| start_date | DateTimeField | Required |
| end_date | DateTimeField | Required, must be after start_date |
| max_participants | PositiveIntegerField | Nullable (no limit if null) |
| status | CharField(20) | Choices: draft, published, cancelled, completed |
| created_at | DateTimeField | Auto-set on creation |
| updated_at | DateTimeField | Auto-set on modification |

Two computed properties are exposed via the API:
- `participant_count`: counts active (non-cancelled) registrations
- `is_full`: compares participant_count against max_participants

### 2.2 Participant

| Field | Type | Constraints |
|-------|------|------------|
| id | AutoField | Primary key |
| first_name | CharField(100) | Required |
| last_name | CharField(100) | Required |
| email | EmailField | Required, unique |
| phone | CharField(20) | Optional |
| bio | TextField | Optional |

### 2.3 Registration (Many-to-Many Join Table)

| Field | Type | Constraints |
|-------|------|------------|
| id | AutoField | Primary key |
| event | ForeignKey(Event) | CASCADE on delete |
| participant | ForeignKey(Participant) | CASCADE on delete |
| status | CharField(20) | Choices: pending, confirmed, cancelled |
| registered_at | DateTimeField | Auto-set on creation |

**Constraint:** `unique_together = ('event', 'participant')` — a participant cannot register for the same event twice.

### 2.4 Entity Relationships

```
Event ──1:N──> Registration <──N:1── Participant
  │                                       │
  └──────── M:N (through Registration) ───┘
```

The Registration model serves as an explicit join table for the many-to-many relationship, carrying its own status and timestamp fields. This design allows tracking registration state (pending, confirmed, cancelled) independently of the event or participant lifecycle.

---

## 3. Django REST Backend (Lab 7)

### 3.1 Project Structure

```
django_backend/
├── manage.py
├── requirements.txt
├── build.sh
├── eventhub/           # Project configuration
│   ├── settings.py     # DRF, JWT, CORS, django-filter
│   ├── urls.py         # Route mounting under /api/
│   └── wsgi.py
├── events/             # Event app
│   ├── models.py       # Event model + computed properties
│   ├── serializers.py  # EventListSerializer, EventDetailSerializer
│   ├── views.py        # EventViewSet + /participants/ action
│   ├── filters.py      # EventFilter (status, date range)
│   ├── permissions.py  # IsEditorOrReadOnly
│   ├── admin.py        # Django admin configuration
│   └── urls.py         # Router-based URL patterns
├── participants/       # Participant app
│   ├── models.py
│   ├── serializers.py
│   ├── views.py        # ParticipantViewSet
│   └── admin.py
├── registrations/      # Registration app
│   ├── models.py       # unique_together constraint
│   ├── serializers.py  # Business validation rules
│   ├── views.py        # RegistrationViewSet
│   └── admin.py
└── authentication/     # Auth app
    ├── serializers.py  # Register, Login, User serializers
    ├── views.py        # JWT login/logout/register
    └── urls.py         # + simplejwt token/refresh/
```

### 3.2 REST API Endpoints

All endpoints are prefixed with `/api/`. Write operations require the Editor role; read operations are available to all authenticated users.

**Authentication:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register/ | Create account (returns JWT) |
| POST | /api/auth/login/ | Login (returns access + refresh tokens) |
| POST | /api/auth/logout/ | Invalidate refresh token |
| POST | /api/auth/token/refresh/ | Refresh access token |

**Events (CRUD + filtering):**

| Method | Endpoint | Permission | Description |
|--------|----------|-----------|-------------|
| GET | /api/events/ | All | List events (paginated, filterable) |
| POST | /api/events/ | Editor | Create event |
| GET | /api/events/{id}/ | All | Event detail |
| PUT | /api/events/{id}/ | Editor | Update event |
| DELETE | /api/events/{id}/ | Editor | Delete event |
| GET | /api/events/{id}/participants/ | All | List registered participants |

Filter parameters: `?status=published`, `?start_date_after=2026-01-01`, `?start_date_before=2026-12-31`

**Participants and Registrations** follow the same CRUD pattern with appropriate permission enforcement.

### 3.3 Serializers and Validation

The `EventDetailSerializer` enforces that `end_date` must be after `start_date`. The `RegistrationSerializer` implements three business rules:

1. **Duplicate prevention:** Checks if a Registration with the same (event, participant) pair already exists
2. **Status guard:** Blocks registration for events with status `cancelled` or `completed`
3. **Capacity check:** If `max_participants` is set and active registrations meet the limit, the registration is rejected

These validations run at the serializer level, providing clear error messages before database operations.

### 3.4 Permission System

The `IsEditorOrReadOnly` permission class allows:
- **Safe methods** (GET, HEAD, OPTIONS): All authenticated users
- **Write methods** (POST, PUT, DELETE): Only editors

A user is considered an editor if any of these conditions are true:
- `is_staff = True`
- `is_superuser = True`
- Member of the `editor` group

The `UserSerializer` exposes a computed `role` field ("editor" or "viewer") based on these conditions, which the frontend uses to conditionally render UI elements.

### 3.5 Django Admin

All three models are registered with the Django admin interface with customized `list_display`, `list_filter`, `search_fields`, and `readonly_fields`. The Registration admin uses `raw_id_fields` for event and participant foreign keys to improve usability with large datasets.

---

## 4. Node.js/Express Backend (Lab 8)

### 4.1 Project Structure

```
node_backend/
├── package.json
├── src/
│   ├── index.js              # Express entry point
│   ├── config/
│   │   └── database.js       # Sequelize + SQLite
│   ├── models/
│   │   ├── Event.js           # Sequelize model
│   │   ├── Participant.js
│   │   ├── Registration.js
│   │   └── associations.js    # Relationship declarations
│   ├── routes/
│   │   ├── auth.js            # Register + Login (bcrypt + JWT)
│   │   ├── events.js          # Full CRUD + filtering
│   │   ├── participants.js    # Full CRUD
│   │   └── registrations.js   # CRUD + business rules
│   └── middleware/
│       ├── auth.js            # authenticateToken, requireEditor
│       └── errorHandler.js    # Global error handler
```

### 4.2 Implementation Details

**Database:** Sequelize ORM with SQLite storage. Models are defined with `underscored: true` for snake_case column names matching the Django schema. Relationships are declared in `associations.js` using `belongsToMany` (through Registration), `hasMany`, and `belongsTo`.

**Authentication:** Users are defined inline in the auth route with bcrypt password hashing and JWT token generation. The `authenticateToken` middleware extracts and verifies the Bearer token, while `requireEditor` chains authentication with a role check.

**Validation:** Request bodies are validated using `express-validator` with dedicated validation arrays per entity. A shared `validate` middleware converts validation errors to structured 400 responses.

**Business rules** in the registration route mirror the Django implementation: entity existence checks, event status guard, duplicate detection (application-level + database unique constraint as safety net), and automatic waitlisting when capacity is reached.

---

## 5. Django vs Node.js — Comparative Analysis

### 5.1 Project Structure

**Django** follows a "batteries-included" convention with apps as self-contained modules. Each app has a prescribed file layout (models, views, serializers, urls, admin). The framework enforces structure through conventions.

**Express** provides minimal structure by default. The developer must organize files manually. Our project uses a layered structure (routes, models, middleware, config), but this is a choice, not a framework requirement.

### 5.2 Architectural Philosophy

**Django** is opinionated: it provides an ORM, admin interface, authentication system, serialization framework, and permission system out of the box. Django REST Framework (DRF) extends this with ViewSets that auto-generate CRUD endpoints from a model and serializer.

**Express** is unopinionated: it provides only HTTP request handling. Every other feature (ORM, validation, authentication) requires third-party packages (Sequelize, express-validator, jsonwebtoken, bcryptjs).

### 5.3 Development Complexity

| Aspect | Django | Node.js/Express |
|--------|--------|----------------|
| Lines of code (our project) | ~350 across 18 files | ~450 across 12 files |
| Boilerplate | Low (ViewSets generate CRUD) | Higher (each route is manual) |
| Validation | Automatic via Serializers | Manual via express-validator |
| Permissions | Built-in permission classes | Custom middleware |
| Admin interface | Included (`/admin/`) | None (would need to build) |
| Migrations | `makemigrations` + `migrate` | `sequelize.sync()` (auto-schema) |

Django requires fewer lines of code for the same functionality due to its abstractions. However, Express routes are more explicit and easier to understand for developers unfamiliar with Django's conventions.

### 5.4 Scalability

**Django** is synchronous by default (WSGI). It handles concurrent requests via multi-process deployment (gunicorn workers). For I/O-bound workloads, ASGI and async views can be used.

**Express** runs on Node.js's single-threaded event loop, handling concurrent I/O operations natively. This makes it particularly efficient for APIs with many simultaneous connections or real-time features (WebSockets).

For a CRUD application like EventHub, both frameworks perform adequately. Express would have an advantage in scenarios requiring real-time updates or high concurrency.

### 5.5 Ecosystem

**Django** has a mature Python ecosystem: `django-filter` for query filtering, `djangorestframework-simplejwt` for JWT, `whitenoise` for static files. Packages integrate tightly with the framework.

**Express** benefits from npm's vast package ecosystem, but integration quality varies. Packages like Sequelize are powerful but require more configuration than Django's built-in ORM.

### 5.6 Conclusion

Django is better suited for structured projects with complex business rules, thanks to its integrated tooling (admin, permissions, serializers). Node.js/Express offers more flexibility and is better for lightweight APIs or applications requiring real-time capabilities. For EventHub, Django was the more productive choice for the primary backend.

---

## 6. React Frontend (Lab 9)

### 6.1 Component Architecture

The frontend is built with React 18 using functional components and hooks. Vite serves as the build tool.

**Components (10 total):**

| Component | Type | Role |
|-----------|------|------|
| `App` | Router | Defines routes and layout structure |
| `Layout` | Shell | Navigation bar, role badge, logout |
| `ProtectedRoute` | Guard | Redirects unauthenticated users to /login |
| `AuthContext` | Context | Manages JWT tokens, user state, login/logout |
| `LoginPage` | Page | Login form with error handling |
| `DashboardPage` | Page | Statistics cards + recent events table |
| `EventsPage` | Page | Event list with filters + create form |
| `EventDetailPage` | Page | Event detail + edit + participant management |
| `ParticipantsPage` | Page | Participant table + create/edit/delete |
| `useFetch` | Hook | Reusable data fetching with loading/error states |

### 6.2 Pages and Features

**Login Page (`/login`):** Username/password form. On success, stores JWT tokens in localStorage and redirects to the dashboard. Displays API error messages on failure.

**Dashboard (`/dashboard`):** Fetches events, participants, and registrations in parallel. Displays 4 stat cards (total events, published events, total participants, total registrations) and a table of the 5 most recent events with status badges.

**Events List (`/events`):** Displays events as clickable cards with title, date, location, participant count, and status badge. Editors see a "+ New Event" button that toggles an inline creation form. Three filters are available: status (dropdown), date from (date input), and date to (date input).

**Event Detail (`/events/:id`):** Shows full event information (dates, location, capacity, description). Editors can:
- **Edit** the event via an inline form (all fields editable)
- **Delete** the event (with confirmation)
- **Register** a participant from a dropdown of unregistered participants
- **Unregister** a participant via a button in the participants table

**Participants (`/participants`):** Table of all participants. Editors can:
- **Add** a participant via an inline form
- **Edit** a participant via inline table editing (fields become inputs)
- **Delete** a participant (with confirmation)

### 6.3 Authentication Flow

1. User submits credentials → `POST /api/auth/login/`
2. Backend returns `access` token, `refresh` token, and `user` object (with role)
3. Frontend stores all three in `localStorage`
4. Every API request includes `Authorization: Bearer <access_token>` via Axios interceptor
5. On 401 response, interceptor attempts `POST /api/auth/token/refresh/` with the refresh token
6. If refresh succeeds, retries original request with new access token
7. If refresh fails, clears storage and redirects to `/login`

### 6.4 Role-Based UI

The `AuthContext` exposes an `isEditor` boolean computed from `user.role === 'editor' || user.is_staff`. Components conditionally render write-operation buttons (create, edit, delete, register, unregister) based on this flag. The backend independently enforces permissions, so even if UI elements were manipulated, write operations would be rejected for viewers.

---

## 7. Frontend–Backend Integration

### 7.1 API Service Layer

The frontend communicates with the backend through an Axios instance configured with:
- `baseURL`: `VITE_API_URL` environment variable or `/api` (for Vite proxy in development)
- Request interceptor: Attaches JWT Bearer token
- Response interceptor: Handles 401 with token refresh

Service modules (`eventsService`, `participantsService`, `registrationsService`) expose typed methods (getAll, getById, create, update, delete) that map to REST endpoints.

### 7.2 Development Proxy

In development, Vite proxies `/api` requests to `http://127.0.0.1:8000` (the Django dev server). This avoids CORS issues during development and allows the frontend to use relative URLs.

### 7.3 Production Configuration

In production, the frontend is deployed on a different domain (Vercel) than the backend (Render). The `VITE_API_URL` environment variable is set to the absolute backend URL (`https://eventhub-django-04km.onrender.com/api`), and the Django backend includes the Vercel domain in `CORS_ALLOWED_ORIGINS`.

---

## 8. Deployment (Lab 10)

### 8.1 Django Backend on Render

**Build process** (`build.sh`):
1. Install Python dependencies from `requirements.txt`
2. Collect static files via `python manage.py collectstatic`
3. Apply database migrations
4. Create/promote superuser from environment variables

**Runtime:** Gunicorn WSGI server binding to `0.0.0.0:$PORT`

**Static files:** Served by WhiteNoise middleware with compressed manifest storage.

**Environment variables:** `SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS=.onrender.com`, `CORS_ALLOWED_ORIGINS`, `DJANGO_SUPERUSER_USERNAME/EMAIL/PASSWORD`

**URL:** https://eventhub-django-04km.onrender.com

### 8.2 Node.js Backend on Render

**Build:** `npm install`
**Runtime:** `node src/index.js`
**Environment:** `JWT_SECRET`, `NODE_ENV=production`

**URL:** https://eventhub-node.onrender.com

### 8.3 React Frontend on Vercel

**Build:** `npm run build` (Vite production build)
**Output:** `dist/` directory with optimized static assets
**SPA routing:** `vercel.json` rewrites all paths to `index.html`
**Environment:** `VITE_API_URL=https://eventhub-django-04km.onrender.com/api`

**URL:** https://eventhub-aya-chihoubs-projects.vercel.app

### 8.4 Infrastructure Diagram

```
User Browser
     │
     ▼
Vercel (React SPA)
https://eventhub-aya-chihoubs-projects.vercel.app
     │ HTTP/JSON + JWT
     ▼
Render (Django API)                    Render (Node.js API)
https://eventhub-django-04km           https://eventhub-node
     │                                      │
     ▼                                      ▼
SQLite (db.sqlite3)                  SQLite (database.sqlite)
```

---

## 9. Testing and Validation

### 9.1 API Testing

All API endpoints were tested via automated PowerShell scripts and manual Postman requests:

- **Authentication:** Login returns JWT tokens and user role; register creates new accounts; logout invalidates refresh tokens
- **CRUD operations:** Create, read, update, and delete verified for events, participants, and registrations
- **Business rules:** Duplicate registration returns 400; registration on cancelled events returns 409; viewer write attempts return 403
- **Filtering:** Status and date range filters return correct subsets

### 9.2 Frontend Testing

The complete user flow was verified in the browser:

1. Login as editor → dashboard displays statistics
2. Create event → appears in events list
3. Create participant → appears in participants table
4. Register participant to event → appears in event detail
5. Edit event → changes persist
6. Edit participant → inline update works
7. Unregister participant → removed from event
8. Filter events by status → correct results
9. Login as viewer → write buttons hidden, read operations work
10. Production deployment → all flows verified on live URLs

---

## 10. Conclusion

EventHub demonstrates the integration of multiple web technologies into a coherent full-stack application. The Django backend provides a robust API with built-in admin, permission system, and data validation. The Node.js backend offers a comparative perspective, highlighting the trade-offs between convention-over-configuration (Django) and flexibility (Express). The React frontend delivers a responsive, role-aware SPA that communicates with the backend via JWT-authenticated REST calls. The deployment on Render and Vercel makes the application publicly accessible with proper environment configuration and CORS handling.

**Deployed URLs:**

| Component | URL |
|-----------|-----|
| Frontend | https://eventhub-aya-chihoubs-projects.vercel.app |
| Django API | https://eventhub-django-04km.onrender.com/api/ |
| Node.js API | https://eventhub-node.onrender.com/api/ |
| GitHub Repository | https://github.com/Aya-chihoub/EVENTHUB |
