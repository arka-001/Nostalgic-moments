# 🎵 Nostalgic Moments — Backend API

An asynchronous, high-performance **FastAPI** backend powering the **Nostalgic Moments** immersive music experience platform. Fully integrated with **Supabase PostgreSQL** and **Supabase Storage** CDN for streaming audio and media.

---

## ⚡ Tech Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/)
- **Database**: [Supabase PostgreSQL](https://supabase.com/) via [SQLAlchemy 2.0 Async](https://docs.sqlalchemy.org/) + [asyncpg](https://github.com/MagicStack/asyncpg)
- **Migrations**: [Alembic](https://alembic.sqlalchemy.org/)
- **Storage**: [Supabase Storage](https://supabase.com/storage) S3 bucket CDN (with local fallback)
- **Security & Auth**: PyJWT, bcrypt password hashing, HTTP-Only cookies, custom Sliding Window Rate Limiter & HTTP Security Headers.

---

## ✨ Features

- 🔐 **JWT Authentication & Auth Guard**: Secure admin authentication via JWT bearer tokens and `HttpOnly` cookies.
- 🛡️ **Rate Limiting Middleware**: In-memory sliding-window protection on login (max 5 attempts/min), uploads (max 15/min), and admin endpoints.
- 🔒 **Security Headers**: Automatic enforcement of `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection`, and referrer policies.
- 🎵 **Supabase Storage Integration**: Direct upload and public CDN streaming for MP3 audio files (`/music`) and images (`/covers`, `/backgrounds`, `/thumbnails`).
- 📁 **Environment & Song Management**: Full CRUD REST APIs for categories/environments and song catalogs.
- 🔀 **Playlist Reordering API**: `PUT /api/admin/categories/{id}/songs/reorder` for custom drag-and-drop playlist sequences.
- 🩺 **Health Check**: Live DB ping and status monitoring endpoint.

---

## 🚀 Getting Started

### 1. Easy 1-Command Launch (Recommended)

Run the included `run.py` launcher script. It automatically detects the virtual environment, resolves Python paths, and launches Uvicorn with hot-reload enabled:

```bash
python run.py
```

---

### 2. Manual Setup

#### Step 1: Create Virtual Environment
```bash
# Windows PowerShell
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

#### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

#### Step 3: Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase database URL and secret key:

```env
PROJECT_NAME="Nostalgic Music Platform API"
VERSION="1.0.0"
API_V1_STR="/api"

# Supabase PostgreSQL Async Connection URL
DATABASE_URL="postgresql+asyncpg://postgres.livehdsicgkahneemfuo:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

# JWT Authentication
JWT_SECRET="your_super_secret_jwt_key_here_change_in_production"
JWT_ALGORITHM="HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Initial Admin Credentials
INITIAL_ADMIN_EMAIL="admin@nostalgia.com"
INITIAL_ADMIN_PASSWORD="AdminSecurePass2026!"

# Supabase Storage Configuration
SUPABASE_URL="https://livehdsicgkahneemfuo.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
```

#### Step 4: Run Database Migrations
```bash
alembic upgrade head
```

#### Step 5: Start Development Server
```bash
uvicorn app.main:app --reload --port 8000
```

---

## 📋 API Documentation

Once the server is running, explore the interactive documentation:

- **Swagger OpenAPI UI**: [http://127.0.0.1:8000/api/docs](http://127.0.0.1:8000/api/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/api/redoc](http://127.0.0.1:8000/api/redoc)
- **Health Check Endpoint**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

## 📁 Project Structure

```text
backend/
├── alembic/              # DB Migration scripts
├── app/
│   ├── api/              # FastAPI route controllers
│   │   ├── auth.py       # Login / Logout / Me endpoints
│   │   ├── categories.py # Environments CRUD APIs
│   │   ├── health.py     # System health endpoint
│   │   ├── songs.py      # Songs CRUD APIs
│   │   └── uploads.py    # Supabase media upload router
│   ├── core/             # Core security & configuration
│   │   ├── config.py     # Pydantic settings & env parser
│   │   ├── rate_limiter.py # Sliding window rate limiter
│   │   ├── security.py   # Password hashing & JWT helpers
│   │   └── security_headers.py # HTTP security headers
│   ├── db/               # SQLAlchemy models & sessions
│   │   ├── base.py       # Declarative base
│   │   ├── init_db.py    # Initial seed data
│   │   └── session.py    # Resilient async engine setup
│   ├── models/           # DB schema models
│   └── schemas/          # Pydantic request/response schemas
├── uploads/              # Local media storage fallback
├── .env                  # Environment secrets (git-ignored)
├── requirements.txt      # Python dependencies
└── run.py                # Easy launcher script
```
