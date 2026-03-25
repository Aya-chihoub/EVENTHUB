# EventHub — Work Summary: From Initial State to Completion

## Initial State of the Project

When the project was picked up, the repository contained:
- A `README.md` documenting the intended architecture and API reference
- A `react_frontend/` folder with a partially built React SPA (pages, auth context, services, hooks)
- A `node_backend/` folder with only 5 route files (no models, no server entry, no middleware, no config)
- A `django_backend/` folder with only empty directory scaffolding (no Python files at all)
- No deployment configuration
- No `.git` history or GitHub remote

## What Was Done

### 1. Django REST Backend (Lab 7) — Built from scratch

- Created `manage.py`, `requirements.txt`, and `.env.example`
- Built the full project configuration: `settings.py` (DRF, JWT, CORS, django-filter, pagination), `urls.py`, `wsgi.py`, `asgi.py`
- **Event app:** model with 10 fields (title, description, location, start_date, end_date, max_participants, status, created_at, updated_at) plus computed properties (`participant_count`, `is_full`); `EventListSerializer` and `EventDetailSerializer` with date validation; `EventViewSet` with a custom `/participants/` action; `EventFilter` (status, start_date_after, start_date_before); Django admin configuration
- **Participant app:** model with unique email constraint; serializer; `ParticipantViewSet`; admin configuration
- **Registration app:** model with `unique_together` on (event, participant) enforcing many-to-many; serializer with 3 business rules (duplicate prevention, cancelled/completed event guard, capacity check); `RegistrationViewSet`; admin configuration with raw_id_fields
- **Authentication app:** register, login, and logout views using `djangorestframework-simplejwt`; `UserSerializer` with computed `role` field; token refresh endpoint
- **Permissions:** `IsEditorOrReadOnly` permission class checking `is_staff`, `is_superuser`, or `editor` group membership
- Generated and applied all database migrations
- Created initial admin and viewer users for testing
- Verified all endpoints via automated API tests (login, CRUD, business rules, role enforcement)

### 2. Node.js/Express Backend (Lab 8) — Completed the scaffold

The existing route files (auth, events, participants, registrations, associations) were well-written but the app couldn't start due to 8 missing files:

- Created `package.json` with all dependencies (express, sequelize, sqlite3, bcryptjs, jsonwebtoken, express-validator, cors, dotenv)
- Created `src/index.js` — Express server entry point with CORS, JSON parsing, route mounting, Sequelize sync
- Created `src/config/database.js` — Sequelize instance with SQLite storage
- Created 3 Sequelize model files (`Event.js`, `Participant.js`, `Registration.js`) matching the fields used in the existing routes
- Created `src/middleware/auth.js` — `authenticateToken` (JWT verification) and `requireEditor` (role gate)
- Created `src/middleware/errorHandler.js` — global error handler for Sequelize and generic errors
- Created `.env.example`
- Installed all dependencies and verified the full API works (health check, register, login, event CRUD, participant CRUD, registration with business rules)

### 3. React Frontend (Lab 9) — Enhanced with missing features

The existing frontend had 5 pages (Login, Dashboard, Events, Event Detail, Participants) with create/delete but was missing edit and unregister features:

- **EventDetailPage:** Added Edit button that opens an inline form to update all event fields; added Unregister button per participant in the registered participants table; added status badge color-coding for cancelled events
- **ParticipantsPage:** Added inline Edit functionality per table row (fields turn into inputs with Save/Cancel buttons)
- **App.jsx:** Removed unused `useAuth` import
- **api.js:** Fixed token refresh URL to use the configured `BASE_URL` instead of a hardcoded path (critical for production deployment)
- Verified the production build passes with zero errors (95 modules, 231 KB gzipped)

### 4. Deployment (Lab 10) — Full production setup

- **Django on Render:** Added `whitenoise` for static file serving; added `WhiteNoiseMiddleware` to settings; created `build.sh` (pip install, collectstatic, migrate, auto-create superuser); made CORS origins configurable via environment variable; created `render.yaml` blueprint
- **Node.js on Render:** Already production-ready with the scaffold; configured via `render.yaml`
- **React on Vercel:** Created `vercel.json` with SPA rewrite rules; created `.env.example` documenting `VITE_API_URL`
- Updated `.gitignore` to properly exclude database files, staticfiles, and environment files
- Committed all code and pushed to GitHub (https://github.com/Aya-chihoub/EVENTHUB)
- Deployed Django backend to Render (https://eventhub-django-04km.onrender.com)
- Deployed Node.js backend to Render (https://eventhub-node.onrender.com)
- Deployed React frontend to Vercel (https://eventhub-aya-chihoubs-projects.vercel.app)
- Configured CORS between Vercel frontend and Render backend
- Created admin (editor) and viewer accounts on the production database
