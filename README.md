# 🎵 Nostalgic Moments

> **Step into a memory. Press play.**

Nostalgic Moments is an immersive music experience designed to bring old memories back through **nostalgic places, classic songs, ambient visuals, and curated playlists**.

Instead of using a traditional music-player interface, Nostalgic Moments lets users enter different environments — such as an old salon, a running bus, a tea stall, or a car ride — and listen to music that matches the atmosphere.

---

## ✨ Concept

Music is often connected to memories.

A song can remind us of:

* An old bus journey
* A neighborhood salon
* Sitting at a tea stall
* Travelling in an old car
* Listening to songs on the radio
* Spending time with friends
* The atmosphere of the 90s and early 2000s

**Nostalgic Moments** tries to recreate those feelings through an interactive web experience.

```text
                 NOSTALGIC MOMENTS
                         │
             ┌───────────┴───────────┐
             │                       │
         Choose a                 Choose
         Moment                    Music
             │                       │
             └───────────┬───────────┘
                         │
                   Press Play 🎵
                         │
                 Relive the Moment
```

---

## 🎧 Experiences

The platform is designed around different nostalgic environments.

### 🚌 Running Bus

Experience the feeling of travelling in an old bus while listening to nostalgic songs.

### 💈 Old Salon

Step into a classic neighborhood salon with an old-school atmosphere and music.

### 🫖 Tea Stall

A nostalgic tea-stall environment inspired by everyday Indian street life.

### 🚗 Car Ride

A relaxed road-trip experience with music playing in the background.

### 📻 More Experiences

The platform is designed so that new experiences can be added from the admin panel without changing the frontend code.

---

# 🎵 Music Player

Each experience contains an immersive music player.

### Player Features

* ▶️ Play
* ⏸️ Pause
* ⏮️ Previous
* ⏭️ Next
* 🔊 Volume control
* 🔇 Mute
* 🎚️ Seek/progress bar
* 🔀 Shuffle
* 🔁 Repeat
* ❤️ Like/Favorite
* 🎵 Current song information
* 📋 Playlist / Queue
* ⛶ Fullscreen experience

The player is designed to blend into the environment instead of looking like a conventional music-player interface.

---

# 🛠️ Technology Stack

## Frontend

* **Next.js**
* **TypeScript**
* **Tailwind CSS**
* **Framer Motion**
* HTML5 Audio API

Next.js is used for:

* SEO
* Server-side rendering
* Static generation
* Dynamic routes
* Metadata
* Open Graph
* Responsive UI
* Immersive animations

---

## Backend

* **FastAPI**
* **Python**
* **SQLAlchemy**
* **Alembic**
* **Pydantic**
* REST API
* Authentication

FastAPI handles:

* Categories
* Songs
* Playlists
* Admin authentication
* Song management
* Category management
* Upload management
* Player data
* Application configuration

---

## Database

* **PostgreSQL**

The database stores structured information such as:

```text
Categories
Songs
Artists
Playlists
Users
Admin accounts
Song relationships
Experience configuration
```

The actual audio files are not stored directly inside PostgreSQL.

---

## File Storage

Audio and media files are stored using object/file storage.

Example:

```text
storage/
│
├── music/
│   ├── bus/
│   ├── salon/
│   ├── tea-stall/
│   └── car/
│
├── covers/
│
└── backgrounds/
```

The database stores the corresponding file URLs.

---

# 🏗️ Architecture

```text
                         USER
                           │
                           ▼
                  ┌─────────────────┐
                  │     Next.js     │
                  │    Frontend     │
                  │                 │
                  │  SEO + UI +     │
                  │  Music Player   │
                  └────────┬────────┘
                           │
                         REST API
                           │
                           ▼
                  ┌─────────────────┐
                  │     FastAPI     │
                  │     Backend     │
                  │                 │
                  │ Auth            │
                  │ Categories      │
                  │ Songs           │
                  │ Playlists       │
                  │ Admin APIs      │
                  └────────┬────────┘
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
        ┌───────────────┐     ┌───────────────┐
        │  PostgreSQL   │     │ File Storage  │
        │   Database    │     │               │
        │               │     │ MP3 / Images  │
        └───────────────┘     └───────────────┘
```

---

# 📂 Project Structure

```text
nostalgic-moments/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx
│   │   │   ├── experiences/
│   │   │   └── player/
│   │   │
│   │   ├── components/
│   │   │   ├── player/
│   │   │   ├── experience/
│   │   │   ├── navigation/
│   │   │   └── ui/
│   │   │
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── services/
│   │   └── types/
│   │
│   ├── public/
│   ├── package.json
│   └── README.md
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── main.py
│   │
│   ├── alembic/
│   ├── requirements.txt
│   └── README.md
│
├── .gitignore
├── LICENSE
└── README.md
```

---

# 🗄️ Database Structure

The main entities are:

```text
users
│
├── id
├── email
├── password_hash
└── role


categories
│
├── id
├── name
├── slug
├── description
├── background_url
├── thumbnail_url
├── is_active
└── sort_order


songs
│
├── id
├── title
├── artist
├── album
├── audio_url
├── cover_url
├── duration
└── is_active


category_songs
│
├── category_id
├── song_id
└── sort_order
```

A many-to-many relationship between categories and songs allows the same song to appear in multiple experiences without duplicating the actual song record.

Example:

```text
Song A
 ├── Running Bus
 └── Salon
```

---

# 🔐 Admin Panel

The platform includes an admin panel for managing content.

## Category Management

Administrators can:

* Create categories
* Edit categories
* Delete categories
* Enable/disable categories
* Change category order
* Change background
* Change thumbnail
* Edit description

Example:

```text
Running Bus
Salon
Tea Stall
Running Car
Railway Station
```

---

## 🎵 Song Management

Administrators can:

* Upload songs
* Edit song information
* Delete songs
* Change categories
* Upload cover artwork
* Enable/disable songs
* Change playlist order

Example:

```text
Song
  ↓
Category
  ↓
Running Bus
```

The category can be changed from the admin panel without modifying the frontend code.

---

# 🔌 API

Example API structure:

```text
GET    /api/categories
GET    /api/categories/{slug}

GET    /api/songs
GET    /api/songs/{id}

GET    /api/player/{category}

POST   /api/admin/login

POST   /api/admin/categories
PUT    /api/admin/categories/{id}
DELETE /api/admin/categories/{id}

POST   /api/admin/songs
PUT    /api/admin/songs/{id}
DELETE /api/admin/songs/{id}
```

---

# 🌐 Frontend Routes

```text
/
```

Landing page.

```text
/experiences
```

All available experiences.

```text
/experience/running-bus
```

Running Bus experience.

```text
/experience/salon
```

Salon experience.

```text
/experience/tea-stall
```

Tea Stall experience.

```text
/experience/running-car
```

Running Car experience.

```text
/admin
```

Admin dashboard.

---

# 🔍 SEO

SEO is an important part of the frontend architecture.

Next.js is used to provide:

* Server-side rendering
* Static generation
* Dynamic metadata
* Open Graph metadata
* Social sharing cards
* Sitemap
* Robots.txt
* Semantic HTML
* SEO-friendly URLs

Example:

```text
/experience/running-bus
```

instead of:

```text
/player?id=123
```

Each experience can have its own:

* Title
* Description
* Preview image
* Metadata
* Social sharing information

---

# 🚀 Development

## Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/nostalgic-moments.git

cd nostalgic-moments
```

---

# Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

# Backend Setup

Create a virtual environment:

```bash
cd backend

python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run FastAPI:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

---

# ⚙️ Environment Variables

## Frontend

Create:

```text
frontend/.env.local
```

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## Backend

Create:

```text
backend/.env
```

Example:

```env
DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST/DATABASE

SECRET_KEY=your-secret-key

STORAGE_BUCKET=music

STORAGE_URL=your-storage-url
```

Never commit `.env` files to GitHub.

---

# ☁️ Deployment

Recommended deployment architecture:

```text
                  DOMAIN
                     │
                     ▼
                  Vercel
                     │
                  Next.js
                     │
                     │ API
                     ▼
                  Render
                     │
                  FastAPI
                     │
             ┌───────┴────────┐
             ▼                ▼
        PostgreSQL         Storage
```

### Frontend

Deploy Next.js using:

**Vercel**

### Backend

Deploy FastAPI using:

**Render**

### Database & Storage

Use:

**Supabase**

This architecture keeps the frontend, backend, database, and media storage separated.

---

# 🚧 Project Status

> 🚧 **Currently in development**

### Completed

* [x] Project concept
* [x] Technology stack planning
* [x] Application architecture

### In Progress

* [ ] Landing page
* [ ] Experience selection
* [ ] Music player
* [ ] Responsive design
* [ ] FastAPI backend
* [ ] PostgreSQL database
* [ ] Admin authentication
* [ ] Category management
* [ ] Song management
* [ ] File storage
* [ ] SEO optimization

### Planned

* [ ] Playlist management
* [ ] Analytics
* [ ] Favorites
* [ ] More nostalgic environments
* [ ] Performance optimization
* [ ] Production deployment

---

# 🗺️ Roadmap

## Phase 1 — Foundation

* Next.js setup
* FastAPI setup
* PostgreSQL setup
* API architecture
* Authentication

## Phase 2 — Experience UI

* Landing page
* Experience cards
* Immersive backgrounds
* Animations
* Responsive design

## Phase 3 — Music Player

* Audio engine
* Play/pause
* Next/previous
* Volume
* Seek
* Shuffle
* Repeat
* Queue

## Phase 4 — Admin Panel

* Dashboard
* Category management
* Song management
* Upload system
* Playlist management

## Phase 5 — SEO & Performance

* Metadata
* Sitemap
* Open Graph
* Image optimization
* Audio optimization
* Caching where necessary

## Phase 6 — Production

* Custom domain
* HTTPS
* Deployment
* Monitoring
* Error handling
* Backup strategy

---

# 🔮 Future Experiences

Possible future environments include:

* 🚂 Old Train Journey
* 📻 Vintage Radio
* 🛺 Auto Rickshaw
* 🌧️ Rainy Window
* 🏪 Old Grocery Shop
* 🎬 Old Cinema Hall
* 🏫 School Memory
* 🌆 90s Kolkata Street
* ☕ Old Coffee House
* 🎉 Puja Memories

The platform is designed so that new experiences can be added without changing the core music-player architecture.

---

# ⚠️ Music & Copyright

Nostalgic Moments is a software project and does not automatically grant rights to copyrighted music.

Only upload or stream music for which you have the appropriate rights, licenses, or permission.

Do not upload copyrighted commercial recordings without the necessary authorization.

The same principle applies to:

* Music
* Album artwork
* Background images
* Videos
* Logos
* Other third-party media

---

# 🤝 Contributing

Contributions are welcome if this repository is opened for contributions in the future.

Before submitting a pull request:

1. Create a feature branch.
2. Make your changes.
3. Test the frontend and backend.
4. Keep API changes documented.
5. Submit a pull request with a clear description.

---

# 📜 License

This project is currently **source-available for viewing and portfolio purposes**.

Unless explicitly stated otherwise, the source code may not be copied, modified, redistributed, or used commercially without permission from the copyright holder.

See the repository's `LICENSE` file for the applicable terms.

---

# 👨‍💻 Author

**Arka Maitra**

Full-Stack Developer

### Interests

* Web Development
* Python
* FastAPI
* Next.js
* AI/ML
* Electronics
* Creative Interactive Experiences

---

# ⭐ Support

If you find the project interesting, consider giving the repository a ⭐ on GitHub.

---

# 🎵 Nostalgic Moments

> **Step into a memory. Press play.**
