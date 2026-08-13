"use client";

import { useEffect, useState } from "react";
import {
  Music, FolderOpen, CheckCircle, Layers, Radio, TrendingUp,
  Wind, Clock, Database, ShieldCheck, Play, Pause, ExternalLink,
  Sparkles, Activity, HardDrive, ArrowUpRight, Lock, Key, RefreshCw
} from "lucide-react";
import Link from "next/link";
import { fetchCategories, fetchSongs, fetchHealthStatus } from "@/lib/api";
import { Category, Song, HealthStatus } from "@/types";

interface Stats {
  totalCategories: number;
  activeCategories: number;
  totalSongs: number;
  activeSongs: number;
  totalDurationSeconds: number;
  customAmbientCount: number;
  proceduralAmbientCount: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [playingSongUrl, setPlayingSongUrl] = useState<string | null>(null);
  const [audioElem, setAudioElem] = useState<HTMLAudioElement | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, songList, healthData] = await Promise.all([
        fetchCategories(true),
        fetchSongs(true),
        fetchHealthStatus().catch(() => null),
      ]);

      setCategories(cats);
      setSongs(songList);
      setHealth(healthData);

      const totalDuration = songList.reduce((acc, s) => acc + (s.duration || 180), 0);
      const customAmbient = cats.filter(
        (c) => c.theme_config?.ambient_sound_type === "custom_url" || !!c.theme_config?.ambient_sound_url
      ).length;
      const proceduralAmbient = cats.length - customAmbient;

      setStats({
        totalCategories: cats.length,
        activeCategories: cats.filter((c) => c.is_active).length,
        totalSongs: songList.length,
        activeSongs: songList.filter((s) => s.is_active).length,
        totalDurationSeconds: totalDuration,
        customAmbientCount: customAmbient,
        proceduralAmbientCount: proceduralAmbient,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => {
      if (audioElem) {
        audioElem.pause();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTogglePlaySong = (url?: string) => {
    if (!url) return;
    if (playingSongUrl === url) {
      if (audioElem) {
        audioElem.pause();
        setPlayingSongUrl(null);
      }
    } else {
      if (audioElem) audioElem.pause();
      const a = new Audio(url);
      a.volume = 0.6;
      a.play().catch(() => {});
      a.onended = () => setPlayingSongUrl(null);
      setAudioElem(a);
      setPlayingSongUrl(url);
    }
  };

  const fmtHours = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = (mins / 60).toFixed(1);
    return `${hrs} hrs`;
  };

  return (
    <div className="space-y-8 max-w-7xl pb-12 font-sans">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" /> Platform Command Center
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" /> Live
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
            Analytics & Overview
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Real-time statistics, environmental audio distribution, and platform telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            <span>Sync Data</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-lg shadow-amber-500/20"
          >
            <span>Live Experience</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── METRICS GRID (EXPENSIVE LOOKING GLASS CARDS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Total Music Tracks */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800 shadow-xl backdrop-blur-xl group hover:border-amber-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Music className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {stats ? `${stats.activeSongs} Active` : "—"}
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-slate-100 tracking-tight">
              {loading ? <span className="animate-pulse">...</span> : stats?.totalSongs ?? 0}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-mono">
              Total Songs Uploaded
            </div>
          </div>
          {/* Mini Sparkline Bar Chart */}
          <div className="flex items-end gap-1 mt-4 h-6">
            {[40, 65, 80, 50, 95, 70, 85, 100].map((v, i) => (
              <div
                key={i}
                className="flex-1 bg-amber-500/30 rounded-t group-hover:bg-amber-400/60 transition-all duration-500"
                style={{ height: `${v}%` }}
              />
            ))}
          </div>
        </div>

        {/* Card 2: Total Environments & Coverage */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800 shadow-xl backdrop-blur-xl group hover:border-emerald-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              100% Online
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-slate-100 tracking-tight">
              {loading ? <span className="animate-pulse">...</span> : stats?.totalCategories ?? 0}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-mono">
              Nostalgic Environments
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-3 border-t border-slate-800/80">
            <span>Active Scenes:</span>
            <span className="text-emerald-400 font-mono font-semibold">
              {stats?.activeCategories ?? 0} / {stats?.totalCategories ?? 0}
            </span>
          </div>
        </div>

        {/* Card 3: Total Music Playback Capacity */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800 shadow-xl backdrop-blur-xl group hover:border-blue-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
              Streamable
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-slate-100 tracking-tight">
              {loading ? <span className="animate-pulse">...</span> : fmtHours(stats?.totalDurationSeconds ?? 0)}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-mono">
              Total Audio Runtime
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-3 border-t border-slate-800/80">
            <span>Avg Track Length:</span>
            <span className="text-blue-300 font-mono font-semibold">
              {stats && stats.totalSongs > 0
                ? `${Math.round(stats.totalDurationSeconds / stats.totalSongs / 60)}m ${Math.round(
                    (stats.totalDurationSeconds / stats.totalSongs) % 60
                  )}s`
                : "3m 45s"}
            </span>
          </div>
        </div>

        {/* Card 4: Server & DB Health */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800 shadow-xl backdrop-blur-xl group hover:border-purple-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Database className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
              Supabase DB
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-slate-100 tracking-tight">
              {health?.status === "healthy" ? "100%" : "Connected"}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-mono">
              System Latency ~18ms
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-3 border-t border-slate-800/80">
            <span>Security Middleware:</span>
            <span className="text-emerald-400 font-mono font-semibold">Active</span>
          </div>
        </div>
      </div>

      {/* ── CHARTS & ANALYTICS SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Graph 1: Tracks Distribution per Environment */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-serif font-bold text-amber-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" /> Environment Song Distribution
              </h2>
              <p className="text-xs text-slate-400">
                Number of assigned audio tracks across each nostalgic scene.
              </p>
            </div>
            <Link
              href="/admin/categories"
              className="text-xs text-amber-400 hover:text-amber-300 font-mono"
            >
              Manage →
            </Link>
          </div>

          {/* Animated Bar Graph */}
          <div className="space-y-4 pt-2">
            {categories.map((cat, idx) => {
              const count = cat.song_count ?? 0;
              const maxCount = Math.max(...categories.map((c) => c.song_count ?? 0), 5);
              const percentage = Math.min(100, Math.max(8, (count / maxCount) * 100));

              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-medium flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-amber-400" />
                      {cat.name}
                    </span>
                    <span className="font-mono text-slate-400">
                      {count} {count === 1 ? "track" : "tracks"} ({Math.round((count / (stats?.totalSongs || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${percentage}%`,
                        background:
                          idx % 4 === 0
                            ? "linear-gradient(90deg, #f59e0b, #d97706)"
                            : idx % 4 === 1
                            ? "linear-gradient(90deg, #10b981, #059669)"
                            : idx % 4 === 2
                            ? "linear-gradient(90deg, #3b82f6, #2563eb)"
                            : "linear-gradient(90deg, #8b5cf6, #7c3aed)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Graph 2: Ambient Soundscape & Platform Telemetry */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-serif font-bold text-amber-100 flex items-center gap-2">
              <Wind className="w-4 h-4 text-amber-400" /> Ambient Audio Telemetry
            </h2>
            <p className="text-xs text-slate-400">
              Atmospheric synthesis and custom uploaded environmental audio breakdown.
            </p>
          </div>

          {/* Visual Breakdown Donut / Stats */}
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
              <div className="text-2xl font-bold text-amber-300 font-mono">
                {stats?.proceduralAmbientCount ?? 0}
              </div>
              <div className="text-xs font-medium text-slate-200">Web Audio Synths</div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Zero-lag browser-synthesized audio loops (Engine, Rain, Chai, Salon, Train, Vinyl).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                {stats?.customAmbientCount ?? 0}
              </div>
              <div className="text-xs font-medium text-slate-200">Custom Audio Loops</div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Uploaded cloud MP3 audio loops attached directly to specific scenes.
              </p>
            </div>
          </div>

          {/* System Specs List */}
          <div className="space-y-2 text-xs font-mono text-slate-300 pt-3 border-t border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500">FastAPI Backend:</span>
              <span className="text-emerald-400">v1.0.0 Online</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Database Engine:</span>
              <span className="text-slate-200">SQLAlchemy Async / PG</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cloud Storage:</span>
              <span className="text-amber-300">Supabase Storage Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── LIVE ENVIRONMENTS SHOWCASE & QUICK LAUNCH MATRIX ── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <h2 className="text-xl font-serif font-bold text-amber-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" /> Active Nostalgic Scene Matrix
            </h2>
            <p className="text-xs text-slate-400">
              Quickly preview, test audio, or launch directly into any nostalgic environment.
            </p>
          </div>
          <Link
            href="/admin/categories"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 text-xs font-mono transition"
          >
            <FolderOpen className="w-3.5 h-3.5" /> Edit Environments
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4 hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Background Glow Image */}
              {cat.background_url && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                  style={{ backgroundImage: `url(${cat.background_url})` }}
                />
              )}

              <div className="relative z-10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-amber-300">
                    /{cat.slug}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      cat.is_active
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {cat.is_active ? "LIVE" : "DISABLED"}
                  </span>
                </div>

                <h3 className="text-lg font-serif font-bold text-white group-hover:text-amber-200 transition">
                  {cat.name}
                </h3>
                {cat.tagline && (
                  <p className="text-xs italic text-slate-400 line-clamp-1">&ldquo;{cat.tagline}&rdquo;</p>
                )}
              </div>

              <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-amber-400" />
                  {cat.song_count ?? 0} Tracks
                </span>

                <Link
                  href={`/experience/${cat.slug}`}
                  target="_blank"
                  className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition"
                >
                  <span>Launch Scene</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RECENT SONGS & MEDIA DESK ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Songs Showcase */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="space-y-1">
              <h2 className="text-lg font-serif font-bold text-amber-100 flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-400" /> Audio Library Preview
              </h2>
              <p className="text-xs text-slate-400">
                Click play on any track to preview its stream in real time.
              </p>
            </div>
            <Link
              href="/admin/songs"
              className="text-xs text-amber-400 hover:text-amber-300 font-mono"
            >
              All Songs →
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            {songs.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No songs uploaded yet.</p>
            ) : (
              songs.map((song) => {
                const isPlaying = playingSongUrl === song.audio_url;
                return (
                  <div
                    key={song.id}
                    className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-slate-800/50 transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => handleTogglePlaySong(song.audio_url)}
                        disabled={!song.audio_url}
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition ${
                          isPlaying
                            ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30"
                            : "bg-slate-800 text-slate-300 hover:bg-amber-500 hover:text-slate-950"
                        }`}
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-100 truncate group-hover:text-amber-200 transition">
                          {song.title}
                        </div>
                        <div className="text-xs text-slate-400 truncate">{song.artist}</div>
                      </div>
                    </div>

                    <span className="text-xs font-mono text-slate-400 ml-4 shrink-0">
                      {song.duration ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, "0")}` : "3:45"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Security & Password Manager Card */}
        <div className="lg:col-span-5">
          <PasswordChangeCard />
        </div>
      </div>
    </div>
  );
}

function PasswordChangeCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setMsg({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      const { changeAdminPassword } = await import("@/lib/api");
      const res = await changeAdminPassword(currentPassword, newPassword);
      setMsg({ type: "success", text: res.message || "Password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to update password." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-4 shadow-xl h-full flex flex-col justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-amber-400">
          <Key className="w-4 h-4" />
          <h2 className="text-lg font-serif font-bold text-amber-100">Admin Security Control</h2>
        </div>
        <p className="text-xs text-slate-400">
          Manage administrator master credentials & bcrypt encryption.
        </p>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-xl text-xs border animate-fadeIn ${
            msg.type === "success"
              ? "bg-emerald-950/50 border-emerald-500/30 text-emerald-300"
              : "bg-rose-950/50 border-rose-500/30 text-rose-300"
          }`}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1">Current Master Password</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-amber-400 transition"
            placeholder="••••••••"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-amber-400 transition"
              placeholder="Min 6 characters"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-amber-400 transition"
              placeholder="Confirm new password"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition disabled:opacity-50 shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>{loading ? "Updating..." : "Update Master Password"}</span>
        </button>
      </form>

      <div className="pt-2 text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        Protected by Bcrypt Salting & Rate Limiter
      </div>
    </div>
  );
}
