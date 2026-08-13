# 🎵 Nostalgic Moments

> **Step into a memory. Press play.**

**Nostalgic Moments** is an immersive music platform built around memories, places, and atmosphere.

Instead of simply listening to a playlist, users can enter nostalgic environments such as an old salon, a running bus, a tea stall, or a car ride and experience music in an environment designed around that moment.

---

## 🌐 About

Nostalgic Moments combines:

* 🎵 Music & environmental audio
* 🎞️ Nostalgic Indian atmospheres & environments
* 🚌 Everyday memories & rich visual themes
* 📻 Retro atmosphere & player controls
* 🎧 Curated playlists
* ✨ Interactive experiences

The goal is simple:

> **Turn listening to music into experiencing a memory.**

---

## 🎧 Experiences

Experiences are organized around different environments and moments:

* 🚌 **Running Bus**
* 💈 **Old Salon**
* 🫖 **Tea Stall**
* 🚗 **Car Ride**
* 📻 **Vintage Radio**
* 🚂 **Train Journey**

New experiences and songs can be added and managed seamlessly through the platform's administration system.

---

## 🏗️ Architecture Overview

```text
 ┌─────────────────────────────────────────────────────────────┐
 │                     Next.js Frontend                        │
 │  - App Router (TypeScript, Tailwind CSS, Lucide Icons)      │
 │  - HTML5 Audio Environmental Player with Volume & Presets   │
 └──────────────┬──────────────────────────────┬───────────────┘
                │ REST API                     │ Storage URLs
                ▼                              ▼
 ┌─────────────────────────────┐  ┌────────────────────────────┐
 │       FastAPI Backend       │  │      Object / Cloud        │
 │  - SQLAlchemy 2.x (Async)   │  │  - /music                  │
 │  - Alembic Migrations       │  │  - /covers                 │
 │  - JWT Admin Auth & CRUD    │  │  - /backgrounds            │
 └──────────────┬──────────────┘  └────────────────────────────┘
                │
                ▼
 ┌─────────────────────────────┐
 │     Relational Database     │
 │  - AdminUsers, Categories,  │
 │    Songs, CategorySongs M:N │
 └─────────────────────────────┘
```

- **Frontend**: Next.js 14+ (App Router, TypeScript, Tailwind CSS, Lucide Icons)
- **Backend**: FastAPI, Python 3.11+, SQLAlchemy 2.x Async Engine, Alembic, Pydantic v2, JWT Security
- **Database**: PostgreSQL (with SQLite async fallback for local development)
- **Storage**: Supabase / Object Storage / Local Storage

---

## 🛠️ Quick Start & Local Setup

### 1. Backend Setup

```bash
cd backend

# 1. Create and activate virtual environment
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
# source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment variables
cp .env.example .env

# 4. Run Alembic Database Migrations & Database Init
python run.py
```

FastAPI Interactive Docs will be accessible at: `http://localhost:8000/api/docs`

---

### 2. Frontend Setup

```bash
cd frontend

# 1. Install Node dependencies
npm install

# 2. Configure environment variables
cp .env.example .env.local

# 3. Start Next.js Development Server
npm run dev
```

Next.js Frontend will be accessible at: `http://localhost:3000`

---

## 🔑 Environment Configuration

### Backend (`backend/.env`)

```env
DATABASE_URL=sqlite+aiosqlite:///./nostalgia.db
SECRET_KEY=your-jwt-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
INITIAL_ADMIN_EMAIL=admin@nostalgia.com
INITIAL_ADMIN_PASSWORD=AdminSecurePass2026!
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> **Note**: Real production credentials and `.env` files must never be committed to source control.

---

## 🗄️ Database Models

1. **`admin_users`**: Admin credentials (`email`, `password_hash`, `role`, `is_active`)
2. **`categories`**: Nostalgic environments (`name`, `slug`, `tagline`, `background_url`, `theme_config`)
3. **`songs`**: Music records (`title`, `artist`, `duration`, `audio_url`, `cover_url`)
4. **`category_songs`**: Junction table for Many-to-Many relationship between Categories and Songs with playlist `sort_order`.

---

## ⚡ API Endpoints

- `GET /api/health` — System status & database connectivity check
- `POST /api/auth/login` — Administrator authentication & JWT token generation
- `GET /api/auth/me` — Authenticated admin profile
- `GET /api/categories` — List all active nostalgic categories / experiences
- `GET /api/categories/{slug}` — Retrieve specific category with playlist
- `POST /api/categories` — Create category (Admin only)
- `PUT /api/categories/{id}` — Update category (Admin only)
- `DELETE /api/categories/{id}` — Delete category (Admin only)
- `GET /api/songs` — List all songs
- `POST /api/songs` — Add song & assign to category (Admin only)
- `PUT /api/songs/{id}` — Update song details (Admin only)
- `DELETE /api/songs/{id}` — Delete song (Admin only)
- `POST /api/uploads/audio` — Upload audio media asset (Admin only)
- `POST /api/uploads/image` — Upload image asset (Admin only)

---

## 🎵 Music & Media Rights

Nostalgic Moments does not grant rights to third-party music, artwork, images, videos, or other media. All production media must be owned by the platform owner, properly licensed, or used under applicable permissions.

---

## 📜 License

Copyright and licensing terms for the software are defined in the repository's `LICENSE` file.

---

## 👨‍💻 Author

**Arka Maitra**
