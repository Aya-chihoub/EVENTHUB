# EventHub — Système de Gestion d'Événements et de Participants

> Projet de programmation web avancée (Labs 7–10)  
> Stack : Django REST Framework · Node.js/Express · React/Vite

---

## Table des matières

1. [Présentation du projet](#présentation-du-projet)
2. [Architecture générale](#architecture-générale)
3. [Prérequis](#prérequis)
4. [Installation et démarrage](#installation-et-démarrage)
   - [Backend Django](#backend-django)
   - [Backend Node.js](#backend-nodejs)
   - [Frontend React](#frontend-react)
5. [Structure du projet](#structure-du-projet)
6. [Modèles de données](#modèles-de-données)
7. [API Reference — Django](#api-reference--django)
8. [API Reference — Node.js](#api-reference--nodejs)
9. [Authentification et rôles](#authentification-et-rôles)
10. [Frontend — Pages et fonctionnalités](#frontend--pages-et-fonctionnalités)
11. [Variables d'environnement](#variables-denvironnement)
12. [Comparaison Django vs Node.js](#comparaison-django-vs-nodejs)
13. [Déploiement](#déploiement)
14. [Problèmes connus et solutions](#problèmes-connus-et-solutions)

---

## Présentation du projet

**EventHub** est une application web full-stack de gestion d'événements et de participants. Elle permet de :

- Créer et gérer des événements (titre, description, lieu, dates, capacité, statut)
- Gérer un annuaire de participants (nom, email, téléphone, bio)
- Inscrire des participants à des événements avec contrôle de capacité
- Contrôler l'accès via deux rôles : **éditeur** (CRUD complet) et **lecteur** (lecture seule)
- Filtrer les événements par statut et par plage de dates

Le projet expose **deux backends indépendants** implémentant la même API REST : l'un en Django (Python) et l'autre en Node.js/Express (JavaScript), à des fins de comparaison technique.

---

## Architecture générale

```
eventhub_project/
├── django_backend/     # API REST Python/Django
├── node_backend/       # API REST Node.js/Express
└── react_frontend/     # Interface utilisateur React/Vite
```

```
React Frontend (port 5173)
        │  HTTP/JSON + JWT
        ▼
Django Backend (port 8000)   ◄──► SQLite (db.sqlite3)
        ou
Node.js Backend (port 4000)  ◄──► SQLite (database.sqlite)
```

---

## Prérequis

| Outil | Version minimale |
|-------|-----------------|
| Python | 3.10+ |
| Node.js | 18+ |
| npm | 9+ |
| Git | 2.x |

---

## Installation et démarrage

### Backend Django

```bash
# 1. Se placer dans le répertoire
cd eventhub/django_backend

# 2. Installer les dépendances Python
pip install -r requirements.txt

# 3. Configurer l'environnement
copy .env.example .env      # Windows
# cp .env.example .env      # Linux/Mac

# 4. Créer les tables de la base de données
python manage.py makemigrations events participants registrations
python manage.py migrate

# 5. Créer un superutilisateur (éditeur)
python manage.py createsuperuser

# 6. (Optionnel) Créer un utilisateur lecteur
python manage.py shell
# >>> from django.contrib.auth.models import User
# >>> User.objects.create_user(username='viewer1', password='viewer1234')
# >>> exit()

# 7. Démarrer le serveur
python manage.py runserver
# → http://127.0.0.1:8000/
```

### Backend Node.js

```bash
# 1. Se placer dans le répertoire
cd eventhub/node_backend

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
copy .env.example .env      # Windows
# cp .env.example .env      # Linux/Mac

# 4. Démarrer le serveur
npm run dev
# → http://localhost:4000/
```

### Frontend React

```bash
# 1. Se placer dans le répertoire
cd eventhub/react_frontend

# 2. Installer les dépendances
npm install

# 3. Démarrer le serveur de développement
npm run dev
# → http://localhost:5173/
```

> **Note :** Le frontend est configuré pour proxifier vers le backend Django (`127.0.0.1:8000`) par défaut. Pour basculer vers Node.js, modifier `target` dans `vite.config.js`.

---

## Structure du projet

### Django Backend

```
django_backend/
├── manage.py
├── requirements.txt
├── .env.example
├── db.sqlite3                  # Base de données (générée automatiquement)
├── eventhub/
│   ├── settings.py             # Configuration Django
│   ├── urls.py                 # Routes principales
│   └── wsgi.py
├── events/
│   ├── models.py               # Modèle Event
│   ├── serializers.py          # EventSerializer, EventListSerializer
│   ├── views.py                # EventViewSet
│   ├── filters.py              # EventFilter (statut, dates)
│   ├── permissions.py          # IsAdminOrReadOnly
│   └── urls.py
├── participants/
│   ├── models.py               # Modèle Participant
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── registrations/
│   ├── models.py               # Modèle Registration
│   ├── serializers.py
│   ├── views.py                # Règles métier : doublons, capacité, statut
│   └── urls.py
└── authentication/
    ├── views.py                # Login, Logout, Register
    └── serializers.py
```

### Node.js Backend

```
node_backend/
├── package.json
├── .env.example
└── src/
    ├── index.js                # Point d'entrée Express
    ├── config/
    │   └── database.js         # Configuration Sequelize/SQLite
    ├── models/
    │   ├── Event.js
    │   └── Participant.js
    ├── routes/
    │   ├── auth.js
    │   ├── events.js
    │   └── participants.js
    └── middleware/
        ├── auth.js             # authenticateToken, requireEditor
        └── errorHandler.js
```

### React Frontend

```
react_frontend/
├── index.html
├── vite.config.js              # Proxy → 127.0.0.1:8000
└── src/
    ├── main.jsx
    ├── App.jsx                 # Routes React Router
    ├── context/
    │   └── AuthContext.jsx     # Gestion login/logout/rôles
    ├── services/
    │   ├── api.js              # Axios + intercepteur JWT
    │   ├── events.js           # eventsService
    │   └── (participants, registrations)
    ├── hooks/
    │   └── useFetch.js
    ├── components/
    │   └── common/
    │       ├── Layout.jsx      # Navbar avec rôle affiché
    │       └── ProtectedRoute.jsx
    └── pages/
        ├── LoginPage.jsx
        ├── DashboardPage.jsx   # Statistiques + événements récents
        ├── EventsPage.jsx      # Liste + filtres + création
        ├── EventDetailPage.jsx # Détail + inscriptions
        └── ParticipantsPage.jsx
```

---

## Modèles de données

### Event

| Champ | Type | Description |
|-------|------|-------------|
| `id` | AutoField | Clé primaire |
| `title` | CharField(200) | Titre de l'événement |
| `description` | TextField | Description (optionnelle) |
| `location` | CharField(300) | Lieu (optionnel) |
| `start_date` | DateTimeField | Date/heure de début |
| `end_date` | DateTimeField | Date/heure de fin |
| `max_participants` | PositiveIntegerField | Capacité max (optionnelle) |
| `status` | CharField | `draft` / `published` / `cancelled` / `completed` |
| `created_at` | DateTimeField | Création (auto) |
| `updated_at` | DateTimeField | Modification (auto) |

### Participant

| Champ | Type | Description |
|-------|------|-------------|
| `id` | AutoField | Clé primaire |
| `first_name` | CharField(100) | Prénom |
| `last_name` | CharField(100) | Nom |
| `email` | EmailField | Email (unique) |
| `phone` | CharField(20) | Téléphone (optionnel) |
| `bio` | TextField | Biographie (optionnelle) |

### Registration

| Champ | Type | Description |
|-------|------|-------------|
| `id` | AutoField | Clé primaire |
| `event` | ForeignKey(Event) | Événement |
| `participant` | ForeignKey(Participant) | Participant |
| `status` | CharField | `pending` / `confirmed` / `cancelled` |
| `registered_at` | DateTimeField | Date d'inscription (auto) |

**Contraintes métier :**
- Un participant ne peut pas être inscrit deux fois au même événement
- Impossible de s'inscrire à un événement annulé
- Impossible de s'inscrire si l'événement est complet (`max_participants` atteint)

---

## API Reference — Django

**Base URL :** `http://127.0.0.1:8000/api/`

Toutes les routes nécessitent un header `Authorization: Bearer <access_token>` sauf `/auth/login/` et `/auth/register/`.

### Authentification

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/auth/login/` | Connexion → retourne `access` + `refresh` tokens |
| `POST` | `/auth/logout/` | Déconnexion |
| `POST` | `/auth/register/` | Création de compte |
| `POST` | `/auth/token/refresh/` | Rafraîchissement du token |

**Exemple login :**
```json
POST /api/auth/login/
{
  "username": "massizelle",
  "password": "monpassword"
}
// Réponse :
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "user": { "id": 1, "username": "massizelle", "role": "editor" }
}
```

### Événements

| Méthode | Endpoint | Permission | Description |
|---------|----------|-----------|-------------|
| `GET` | `/events/` | Tous | Liste des événements (paginée) |
| `POST` | `/events/` | Éditeur | Créer un événement |
| `GET` | `/events/{id}/` | Tous | Détail d'un événement |
| `PUT` | `/events/{id}/` | Éditeur | Modifier un événement |
| `DELETE` | `/events/{id}/` | Éditeur | Supprimer un événement |
| `GET` | `/events/{id}/participants/` | Tous | Participants inscrits |

**Paramètres de filtre (GET /events/) :**

| Paramètre | Type | Exemple |
|-----------|------|---------|
| `status` | string | `?status=published` |
| `start_date_after` | date | `?start_date_after=2026-01-01` |
| `start_date_before` | date | `?start_date_before=2026-12-31` |

### Participants

| Méthode | Endpoint | Permission | Description |
|---------|----------|-----------|-------------|
| `GET` | `/participants/` | Tous | Liste des participants |
| `POST` | `/participants/` | Éditeur | Créer un participant |
| `GET` | `/participants/{id}/` | Tous | Détail d'un participant |
| `PUT` | `/participants/{id}/` | Éditeur | Modifier un participant |
| `DELETE` | `/participants/{id}/` | Éditeur | Supprimer un participant |

### Inscriptions

| Méthode | Endpoint | Permission | Description |
|---------|----------|-----------|-------------|
| `GET` | `/registrations/` | Tous | Liste des inscriptions |
| `POST` | `/registrations/` | Éditeur | Créer une inscription |
| `DELETE` | `/registrations/{id}/` | Éditeur | Annuler une inscription |

**Exemple création inscription :**
```json
POST /api/registrations/
{
  "event": 1,
  "participant": 3
}
```

---

## API Reference — Node.js

**Base URL :** `http://localhost:4000/api/`

Les routes sont identiques à celles de Django. Le token JWT est également passé dans le header `Authorization: Bearer <token>`.

---

## Authentification et rôles

Le système utilise **JWT (JSON Web Tokens)** via `djangorestframework-simplejwt`.

### Durée des tokens

| Token | Durée |
|-------|-------|
| Access token | 1 heure |
| Refresh token | 7 jours |

### Rôles

| Rôle | Conditions | Droits |
|------|-----------|--------|
| **Éditeur** | `is_staff=True` OU dans le groupe `editor` | CRUD complet |
| **Lecteur** | Authentifié uniquement | Lecture seule (GET) |

### Promouvoir un utilisateur en éditeur

```bash
python manage.py shell
```
```python
from django.contrib.auth.models import User, Group
user = User.objects.get(username='nom_utilisateur')
group, _ = Group.objects.get_or_create(name='editor')
user.groups.add(group)
```

---

## Frontend — Pages et fonctionnalités

### Page de connexion (`/login`)
- Formulaire email/mot de passe
- Stockage du JWT en mémoire via Context API
- Redirection automatique selon le rôle

### Tableau de bord (`/dashboard`)
- 4 cartes statistiques : total événements, publiés, total participants, inscriptions
- Tableau des événements récents avec statut coloré

### Événements (`/events`)
- Liste paginée avec filtres (statut + plage de dates)
- Bouton "Nouvel événement" visible uniquement pour les éditeurs
- Formulaire de création inline

### Détail d'un événement (`/events/:id`)
- Informations complètes de l'événement
- Liste des participants inscrits
- Formulaire d'inscription (éditeurs uniquement)

### Participants (`/participants`)
- Liste de tous les participants
- Création et suppression (éditeurs uniquement)

---

## Variables d'environnement

### Django (`django_backend/.env`)

```env
SECRET_KEY=votre-clé-secrète-django
DEBUG=True
ALLOWED_HOSTS=*
```

### Node.js (`node_backend/.env`)

```env
PORT=4000
JWT_SECRET=votre-clé-secrète-jwt
NODE_ENV=development
```

---

## Comparaison Django vs Node.js

| Critère | Django REST Framework | Node.js / Express |
|---------|----------------------|-------------------|
| **Langage** | Python | JavaScript |
| **ORM** | Django ORM (intégré) | Sequelize |
| **Migrations** | `makemigrations` / `migrate` | `sync({ force })` ou migrations manuelles |
| **Auth JWT** | `djangorestframework-simplejwt` | `jsonwebtoken` |
| **Validation** | Serializers automatiques | `express-validator` manuel |
| **Permissions** | Système de permissions intégré | Middleware personnalisé |
| **Admin** | Interface admin incluse (`/admin`) | Aucun (à développer) |
| **Filtrage** | `django-filter` | Logique manuelle dans les routes |
| **Courbe d'apprentissage** | Plus élevée (conventions Django) | Plus accessible |
| **Performance** | Correct pour CRUD | Excellent (event loop async) |
| **Boilerplate** | Faible (batteries incluses) | Plus verbeux |

**Conclusion :** Django est plus adapté pour des projets structurés avec beaucoup de règles métier grâce à ses outils intégrés. Node.js offre plus de flexibilité et de performance pour des APIs légères ou temps réel.

---

## Déploiement

### Backend Django → Render (gratuit)

1. Créer un compte sur [render.com](https://render.com)
2. Nouveau service Web → connecter le dépôt GitHub
3. **Build command :** `pip install -r requirements.txt && python manage.py migrate`
4. **Start command :** `gunicorn eventhub.wsgi`
5. Ajouter les variables d'environnement (`SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS`)

### Backend Node.js → Render (gratuit)

1. Nouveau service Web → même dépôt
2. **Root directory :** `eventhub/node_backend`
3. **Build command :** `npm install`
4. **Start command :** `npm start`

### Frontend React → Vercel (gratuit)

1. Créer un compte sur [vercel.com](https://vercel.com)
2. Importer le projet → sélectionner `eventhub/react_frontend`
3. Modifier `vite.config.js` pour pointer vers l'URL de production du backend
4. Déployer

---

## Problèmes connus et solutions

### `OperationalError: no such table`
**Cause :** Les migrations n'ont pas été appliquées.  
**Solution :**
```bash
python manage.py makemigrations events participants registrations
python manage.py migrate
```

### `ModuleNotFoundError: No module named 'django'`
**Cause :** `pip install` a échoué (souvent à cause de `psycopg2`).  
**Solution :** Retirer `psycopg2-binary` de `requirements.txt` et réinstaller.

### `ImportError: SpectacularSwaggerUIView`
**Cause :** Version de `drf-spectacular` incompatible.  
**Solution :** Retirer les imports Swagger de `urls.py`.

### Proxy Vite `ECONNREFUSED`
**Cause :** Vite résout `localhost` en IPv6 (`::1`) mais Django écoute sur IPv4.  
**Solution :** Dans `vite.config.js`, changer le proxy target en `http://127.0.0.1:8000`.

### `psycopg2-binary` build failure (Windows)
**Cause :** Conflit entre les headers MinGW (GNU Octave) et MSVC.  
**Solution :** Utiliser SQLite en développement (retirer `psycopg2-binary` de `requirements.txt`).

---

## Équipe

Projet réalisé dans le cadre du cours de **Programmation Web Avancée**.

---

*Dernière mise à jour : Mars 2026*