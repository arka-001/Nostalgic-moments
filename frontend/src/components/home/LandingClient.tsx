"use client";

import Link from "next/link";
import { Category } from "@/types";
import {
  Radio, Sparkles, ArrowRight, Compass, Lock,
  Headphones, Waves, ShieldCheck,
} from "lucide-react";

interface LandingClientProps {
  categories: Category[];
}

/** Helper: Generate consistent theme style for any category */
function getCategoryTheme(slug: string) {
  switch (slug) {
    case "running-bus":
      return {
        bg: "from-amber-950/40 via-slate-900/90 to-slate-950 border-amber-500/30 hover:border-amber-400/60 shadow-amber-950/30",
        badgeBg: "bg-amber-500/15 border-amber-500/30 text-amber-300",
        glow: "group-hover:shadow-[0_20px_50px_rgba(245,158,11,0.2)]",
        badge: "Vintage Roadways Bus Radio",
      };
    case "sathi-salon":
      return {
        bg: "from-emerald-950/40 via-slate-900/90 to-slate-950 border-emerald-500/30 hover:border-emerald-400/60 shadow-emerald-950/30",
        badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
        glow: "group-hover:shadow-[0_20px_50px_rgba(16,185,129,0.2)]",
        badge: "Barber Shop Cassette Deck",
      };
    case "tea-stall":
      return {
        bg: "from-orange-950/40 via-slate-900/90 to-slate-950 border-orange-500/30 hover:border-orange-400/60 shadow-orange-950/30",
        badgeBg: "bg-orange-500/15 border-orange-500/30 text-orange-300",
        glow: "group-hover:shadow-[0_20px_50px_rgba(249,115,22,0.2)]",
        badge: "Roadside Transistor Radio",
      };
    case "running-car":
      return {
        bg: "from-blue-950/40 via-slate-900/90 to-slate-950 border-blue-500/30 hover:border-blue-400/60 shadow-blue-950/30",
        badgeBg: "bg-blue-500/15 border-blue-500/30 text-blue-300",
        glow: "group-hover:shadow-[0_20px_50px_rgba(59,130,246,0.2)]",
        badge: "Midnight Dashboard Deck",
      };
    case "railway-station":
      return {
        bg: "from-purple-950/40 via-slate-900/90 to-slate-950 border-purple-500/30 hover:border-purple-400/60 shadow-purple-950/30",
        badgeBg: "bg-purple-500/15 border-purple-500/30 text-purple-300",
        glow: "group-hover:shadow-[0_20px_50px_rgba(168,85,247,0.2)]",
        badge: "Station Announcer Player",
      };
    default:
      return {
        bg: "from-amber-950/40 via-slate-900/90 to-slate-950 border-amber-500/30 hover:border-amber-400/60 shadow-amber-950/30",
        badgeBg: "bg-amber-500/15 border-amber-500/30 text-amber-300",
        glow: "group-hover:shadow-[0_20px_50px_rgba(245,158,11,0.2)]",
        badge: "Atmospheric Player",
      };
  }
}

/** ── LUXURY ENVIRONMENT CARD COMPONENT ───────────────────────────────── */
function ExperienceCard({ cat }: { cat: Category }) {
  const themeStyles = getCategoryTheme(cat.slug);
  const trackCount = cat.song_count ?? 0;

  return (
    <div
      className={`group relative rounded-3xl p-7 border bg-gradient-to-br ${themeStyles.bg} ${themeStyles.glow} backdrop-blur-2xl flex flex-col justify-between space-y-6 overflow-hidden transition-all duration-500 hover:-translate-y-1.5 shadow-2xl`}
    >
      {/* Background image preview overlay */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none opacity-20 group-hover:opacity-35 transition-opacity duration-700">
        {cat.thumbnail_url || cat.background_url ? (
          <img
            src={cat.thumbnail_url || cat.background_url}
            alt={cat.name}
            className="w-full h-full object-cover filter brightness-95 group-hover:scale-105 transition-transform duration-1000"
          />
        ) : (
          <div className="w-full h-full bg-slate-900/60" />
        )}
      </div>

      {/* Top row: Badge & Track count */}
      <div className="relative z-10 flex items-center justify-between">
        <span className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full border ${themeStyles.badgeBg} shadow-sm`}>
          {themeStyles.badge}
        </span>
        <span className="text-xs font-mono px-3.5 py-1 rounded-full bg-black/40 border border-white/10 text-slate-300 backdrop-blur-md">
          {trackCount} {trackCount === 1 ? "Track" : "Tracks"}
        </span>
      </div>

      {/* Content: Title & Tagline */}
      <div className="relative z-10 space-y-2">
        <h3 className="text-2xl font-serif font-bold text-amber-100 group-hover:text-amber-300 transition duration-300 drop-shadow-sm">
          {cat.name}
        </h3>

        {cat.tagline && (
          <p className="text-sm text-amber-200/90 italic font-serif leading-snug">
            "{cat.tagline}"
          </p>
        )}

        {cat.description && (
          <p className="text-xs text-slate-400 line-clamp-2 pt-1 font-sans leading-relaxed">
            {cat.description}
          </p>
        )}
      </div>

      {/* Enter Experience Button */}
      <div className="relative z-10 pt-2">
        <Link
          href={`/experience/${cat.slug}`}
          className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-gradient-to-r hover:from-amber-400 hover:to-amber-300 hover:text-slate-950 text-white font-bold text-sm transition-all duration-300 border border-white/15 group-hover:border-amber-400/60 shadow-lg group-hover:shadow-[0_10px_25px_rgba(245,158,11,0.3)]"
        >
          <span>Enter Experience</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

/** ── MAIN LUXURY LANDING PAGE CLIENT ─────────────────────────────────── */
export default function LandingClient({ categories }: LandingClientProps) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans relative overflow-hidden selection:bg-amber-500 selection:text-slate-950">
      
      {/* ── AMBIENT LUXURY LIGHT ORBS ─────────────────────────────────── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-amber-500/10 blur-[180px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-1/3 -left-48 w-[600px] h-[600px] bg-emerald-500/10 blur-[180px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-10 right-0 w-[700px] h-[600px] bg-blue-500/10 blur-[180px] rounded-full pointer-events-none z-0" />

      {/* ── TOP NAVIGATION BAR ───────────────────────────────────────── */}
      <nav className="relative z-20 max-w-7xl mx-auto w-full p-6 sm:p-8 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/5">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-serif font-bold text-amber-100 tracking-tight block">
              Nostalgic Moments
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400/90 block -mt-0.5">
              Immersive Music Platform
            </span>
          </div>
        </div>

        <Link
          href="/admin/login"
          className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/40 text-slate-200 text-xs font-semibold tracking-wider uppercase transition-all duration-300 shadow-xl backdrop-blur-md"
        >
          <Lock className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition" />
          <span>Admin Portal</span>
        </Link>
      </nav>

      {/* ── HERO SECTION WITH LUXURY INTERFACE SHOWCASE ──────────────── */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-12 py-6 sm:py-12 space-y-16 flex-grow">
        <section className="text-center max-w-4xl mx-auto space-y-8 pt-4">
          
          {/* Live Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium uppercase tracking-widest backdrop-blur-md shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-400" /> Choose an Environment
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-extrabold text-amber-100 tracking-tight leading-[1.15]">
            Step Inside Nostalgic Worlds. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-amber-400">
              Stream Timeless Melodies.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-300 text-base sm:text-xl max-w-3xl mx-auto leading-relaxed font-sans font-normal opacity-90">
            Forget generic music players. Transport yourself into authentic Indian environments—from running buses and classic salon chairs to roadside tea stalls and midnight highway drives.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#environments"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm transition-all duration-300 shadow-[0_0_30px_rgba(245,158,11,0.35)] transform hover:scale-105"
            >
              <Compass className="w-5 h-5" />
              <span>Explore Environments</span>
            </a>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-sm transition duration-300 backdrop-blur-md hover:border-amber-400/40"
            >
              <span>Admin Portal</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </Link>
          </div>

          {/* Value Stats Pills */}
          <div className="pt-8 grid grid-cols-3 max-w-lg mx-auto gap-4 border-t border-slate-800/80 text-center">
            <div>
              <div className="text-2xl font-serif font-bold text-amber-300">{categories.length}</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">Atmospheric Scenes</div>
            </div>
            <div>
              <div className="text-2xl font-serif font-bold text-amber-300">100%</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">Authentic Vibe</div>
            </div>
            <div>
              <div className="text-2xl font-serif font-bold text-amber-300">HD</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">Audio Streaming</div>
            </div>
          </div>
        </section>

        {/* ── NOSTALGIC EXPERIENCES SHOWCASE GRID ──────────────────────── */}
        <section id="environments" className="space-y-8 pt-10 scroll-mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-800/80 pb-5 gap-3">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-widest">
                <Headphones className="w-4 h-4" /> Live Interactive Scenes
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-amber-100 mt-1">
                Nostalgic Experiences
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Select an environment to launch its visual world and custom player
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-xs font-mono px-4 py-2 rounded-full bg-slate-900/90 border border-slate-800 text-amber-300/90 shadow-md">
              <Waves className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              {categories.length} Environments Available
            </span>
          </div>

          {/* Cards Showcase Grid */}
          {categories.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-3xl backdrop-blur-xl">
              <Headphones className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-serif text-lg">No nostalgic environments are currently active.</p>
              <p className="text-slate-500 text-xs mt-1">Check back soon or add new environments from the Admin Portal.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {categories.map((cat) => (
                <ExperienceCard key={cat.slug} cat={cat} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full p-8 text-center text-xs text-slate-400 border-t border-slate-900 mt-20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-serif font-bold text-slate-200">Nostalgic Moments</span> — Stream timeless Indian melodies inside authentic atmospheric environments.
        </div>
        <div className="flex items-center gap-4 text-slate-500 font-mono">
          <Link href="/admin/login" className="hover:text-amber-400 transition">Admin Portal</Link>
          <span>•</span>
          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Secured</span>
        </div>
      </footer>
    </main>
  );
}

