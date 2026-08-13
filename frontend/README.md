# 🎧 Nostalgic Moments — Next.js Frontend

An immersive, atmospheric web application built with **Next.js 14 (App Router)**, **React 18**, **TailwindCSS**, and **HTML5 Audio API**. Transport yourself into authentic Indian environments—from running buses and classic salon chairs to roadside tea stalls and midnight highway drives.

---

## ⚡ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React 18)
- **Styling**: [TailwindCSS](https://tailwindcss.com/) with custom glassmorphism utilities & ambient glow animations
- **Icons**: [Lucide React](https://lucide.dev/)
- **Audio Engine**: Custom HTML5 Audio Player Hook (`useAudioPlayer`)
- **State & Storage**: Browser `localStorage`, React state management

---

## ✨ Features

### 🌟 Atmospheric Experience Player (`/experience/[slug]`)
- **100% Uninterrupted Background Artwork**: Fullscreen visual scenes without clunky overlays.
- **Cinematic Motion & Mouse Parallax**: Smooth continuous slow pan/zoom (Ken Burns effect) + subtle 3D mouse parallax tracking.
- **Floating Glass Player Pill**: 80% see-through frosted glass player anchored at bottom-center.
- **Hover Volume Popover**: Move mouse pointer over volume icon to auto-open volume slider without clicking.
- **Advanced Shuffle Engine**: Fisher-Yates random sequence generator that guarantees every song plays once before repeating, with back-history navigation.
- **Keyboard Shortcuts**:
  - `Space` — Play / Pause
  - `←` / `→` — Seek ±5 seconds
  - `↑` / `↓` — Volume Up / Down
  - `KeyM` — Mute / Unmute
  - `KeyS` — Toggle Shuffle
  - `KeyR` — Toggle Repeat Mode (Off / All / One)

### 🎨 Apple/Spotify Web-Style Landing Page (`/`)
- High-contrast luxury typography & ambient backdrop lighting.
- Showcase cards for 5 nostalgic environments:
  1. 🚍 **Running Bus** (*"Songs for a journey through old memories"*)
  2. 💈 **Sathi Salon** (*"Old songs, old chairs, old memories"*)
  3. 🫖 **Tea Stall** (*"Music, tea and endless conversations"*)
  4. 🚗 **Running Car** (*"Night drives and timeless melodies"*)
  5. 🚂 **Railway Station** (*"Echoes of trains and long-forgotten tunes"*)

### 🔐 Full Administrative Control Panel (`/admin`)
- **Admin Login (`/admin/login`)**: JWT bearer token authentication & session security.
- **Dashboard (`/admin/dashboard`)**: Live stats on active scenes, total tracks, and environment counts.
- **Environment Manager (`/admin/categories`)**: Create, edit, and toggle active status. Includes **Admin Player Glass Transparency Control** (0% to 50% opacity).
- **Song & MP3 Manager (`/admin/songs`)**:
  - Drag-and-click MP3 uploads directly to Supabase Storage CDN.
  - **Auto Audio Duration Extraction**: Automatically reads exact track length in seconds from MP3 file metadata—no manual typing required!
  - **Auto Song Title Extraction**: Cleans filename into title automatically.
  - **Playlist Manager**: Reorder songs up/down or remove songs per environment.

---

## 🚀 Getting Started

### 1. Installation

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Create `.env.local` in the `frontend` root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### 4. Build for Production

```bash
npm run build
npm run start
```

---

## 📁 Project Structure

```text
frontend/
├── src/
│   ├── app/
│   │   ├── admin/               # Admin Portal Pages
│   │   │   ├── categories/      # Environment CRUD & Glass Transparency Control
│   │   │   ├── dashboard/       # Stats & Overview Dashboard
│   │   │   ├── login/           # Admin Login Page
│   │   │   ├── songs/           # MP3 Uploads & Playlist Manager
│   │   │   └── layout.tsx       # Admin Sidebar & Auth Guard Layout
│   │   ├── experience/          # Atmospheric Scene Player Pages
│   │   │   └── [slug]/          # Dynamic Environment Player Component
│   │   ├── globals.css          # TailwindCSS & custom ambient animations
│   │   ├── layout.tsx           # Root HTML layout
│   │   └── page.tsx             # Landing Page (RSC Entry)
│   ├── components/
│   │   └── home/
│   │       └── LandingClient.tsx # Client-side Landing Page Component
│   ├── hooks/
│   │   └── useAudioPlayer.ts    # Custom HTML5 Audio Player & Shuffle Engine
│   ├── lib/
│   │   └── api.ts               # Backend API fetch utilities
│   └── types/
│       └── index.ts             # TypeScript interfaces (Song, Category, ThemeConfig)
├── public/                      # Static assets
└── package.json                 # Dependencies & scripts
```
