# 🎵 Nostalgic Moments

> **Step into a memory. Press play.**

**Nostalgic Moments** is an immersive music platform built around memories, places, and atmosphere.

Instead of simply listening to a playlist, users can enter nostalgic environments such as an old salon, a running bus, a tea stall, or a car ride and experience music in an environment designed around that moment.

---

## 🌐 About

Nostalgic Moments combines:

* 🎵 Music
* 🎞️ Nostalgic environments
* 🚌 Everyday memories
* 📻 Retro atmosphere
* 🎧 Curated playlists
* ✨ Interactive experiences

The goal is simple:

> **Turn listening to music into experiencing a memory.**

---

## 🎧 Experiences

Experiences are organized around different environments and moments.

Examples include:

* 🚌 **Running Bus**
* 💈 **Old Salon**
* 🫖 **Tea Stall**
* 🚗 **Car Ride**
* 📻 **Vintage Radio**
* 🚂 **Train Journey**

New experiences can be added and managed through the platform's content management system.

---

## 🎵 Music Experience

Each environment has its own music experience.

Depending on the experience, users can access:

* Play / Pause
* Previous / Next
* Seek
* Volume
* Mute
* Shuffle
* Repeat
* Playlist / Queue
* Song information
* Fullscreen experience

The player is designed as part of the environment rather than functioning as a separate conventional music-player interface.

---

## 🏗️ Architecture

```text
                         USER
                           │
                           ▼
                    ┌─────────────┐
                    │   Next.js   │
                    │  Frontend   │
                    └──────┬──────┘
                           │
                         HTTPS
                           │
                           ▼
                    ┌─────────────┐
                    │   FastAPI   │
                    │   Backend   │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
             ┌────────────┐ ┌─────────────┐
             │ PostgreSQL │ │ Object      │
             │ Database   │ │ Storage     │
             └────────────┘ └─────────────┘
```

### Frontend

**Next.js + TypeScript**

Responsible for:

* User interface
* Experience pages
* Music player
* Animations
* SEO
* Metadata
* Responsive design

### Backend

**FastAPI + Python**

Responsible for:

* REST API
* Authentication
* Categories
* Songs
* Playlists
* Content management
* Application logic

### Database

**PostgreSQL**

Stores structured application data including:

* Experiences
* Songs
* Artists
* Playlists
* Users
* Relationships
* Application configuration

### Object Storage

Used for media assets such as:

* Audio files
* Cover artwork
* Background images
* Other experience assets

Large media files are not stored directly inside the relational database.

---

# 🔐 Content Management

Nostalgic Moments includes an administrative system for managing platform content.

Administrators can manage:

### Experiences

* Create experiences
* Edit experiences
* Enable / disable experiences
* Change descriptions
* Manage backgrounds
* Manage thumbnails
* Control display order

### Songs

* Add songs
* Edit song information
* Assign songs to experiences
* Change playlist order
* Enable / disable songs
* Manage artwork
* Manage media references

The frontend does not need to be modified when content is updated through the administration system.

---

# 🗄️ Data Model

The application uses a relational data model.

```text
User
 │
 └── Role


Experience
 │
 ├── Metadata
 ├── Background
 └── Songs
       │
       └── Song


Song
 │
 ├── Title
 ├── Artist
 ├── Artwork
 ├── Audio reference
 └── Metadata
```

A song can be associated with multiple experiences where appropriate.

---

# 🔍 SEO

Public experience pages are designed with search visibility in mind.

The Next.js frontend supports:

* Server-rendered content
* SEO metadata
* Open Graph metadata
* Semantic URLs
* Sitemap generation
* Robots configuration
* Social sharing metadata
* Optimized page structure

Example:

```text
/experience/running-bus
/experience/salon
/experience/tea-stall
```

rather than relying only on query-based URLs.

---

# 🛡️ Security

Production security is treated separately from the public frontend.

The backend is responsible for:

* Authentication
* Authorization
* Input validation
* Protected administrative endpoints
* Secure password handling
* API validation
* CORS configuration
* Environment-based secrets

Sensitive credentials and service keys must never be committed to the repository.

---

# ⚙️ Environment Configuration

Configuration is provided through environment variables.

Example frontend configuration:

```env
NEXT_PUBLIC_API_URL=
```

Example backend configuration:

```env
DATABASE_URL=
SECRET_KEY=
STORAGE_URL=
STORAGE_BUCKET=
```

Actual production credentials must never be included in source control.

---

# 🚀 Production Deployment

The application is designed to run as separate frontend and backend services.

```text
                         DOMAIN
                            │
                            ▼
                       Next.js
                            │
                            │ HTTPS API
                            ▼
                         FastAPI
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
             PostgreSQL          Object Storage
```

The exact infrastructure provider may vary between environments.

---

# 📁 Repository Structure

```text
nostalgic-moments/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── app/
│   ├── migrations/
│   ├── requirements.txt
│   └── ...
│
├── .gitignore
├── README.md
└── LICENSE
```

---

# 🧪 Development

## Requirements

* Node.js
* Python
* PostgreSQL
* Git

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend

python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the API:

```bash
uvicorn app.main:app --reload
```

---

# 🔌 API

The backend exposes REST APIs for the frontend and administration system.

Typical resources include:

```text
/api/experiences
/api/experiences/{slug}

/api/songs
/api/songs/{id}

/api/playlists

/api/admin/auth
/api/admin/experiences
/api/admin/songs
```

The exact API surface may evolve as the platform develops.

---

# 📊 Scalability

The initial architecture intentionally avoids unnecessary infrastructure complexity.

The platform does **not require Kafka, Redis, Kubernetes, or a microservice architecture** for its core functionality.

Additional infrastructure can be introduced when actual traffic and operational requirements justify it.

Potential future additions may include:

* CDN-based media delivery
* Application caching
* Background processing
* Analytics pipelines
* Search infrastructure
* Event processing

These should be introduced based on measured requirements rather than assumed scale.

---

# 🎵 Music & Media Rights

Nostalgic Moments does not grant rights to third-party music, artwork, images, videos, or other media.

All production media must be:

* Owned by the platform owner, or
* Properly licensed, or
* Used under an applicable legal permission or license.

Third-party copyrighted music must not be uploaded or distributed without the necessary rights.

The software license for this repository does **not** grant permission to use any third-party music or media included in a deployment.

---

# 📜 License

The source code of Nostalgic Moments is **not licensed for unrestricted redistribution or commercial reuse** unless explicitly permitted by the copyright holder.

Copyright and licensing terms for the software are defined in the repository's `LICENSE` file.

Music, artwork, photographs, videos, trademarks, and other third-party assets are governed by their respective rights and licenses and are not automatically covered by the software license.

---

# 👨‍💻 Author

**Arka Maitra**

---

## 🎵 Nostalgic Moments

**Step into a memory. Press play.**

