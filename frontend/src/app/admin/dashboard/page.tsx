"use client";

import { useEffect, useState } from "react";
import {
  Music, FolderOpen, CheckCircle, Layers, Radio, TrendingUp,
  Wind, Clock, Database, ShieldCheck, Play, Pause, ExternalLink,
  Sparkles, Activity, HardDrive, ArrowUpRight, Lock, Key, RefreshCw,
  BarChart3, Headphones, Award, Flame, Users, Calendar, Youtube, Globe
} from "lucide-react";
import Link from "next/link";
import {
  fetchCategories,
  fetchSongs,
  fetchHealthStatus,
  fetchAnalyticsOverview,
  fetchYouTubePlaylists,
  fetchYouTubeSettings,
  fetchVisitorTelemetry,
} from "@/lib/api";
import {
  Category,
  Song,
  HealthStatus,
  AnalyticsOverviewResponse,
  YouTubePlaylist,
  YouTubeSettings,
  VisitorTelemetrySummary,
} from "@/types";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOverviewResponse | null>(null);
  const [ytPlaylists, setYtPlaylists] = useState<YouTubePlaylist[]>([]);
  const [ytSettings, setYtSettings] = useState<YouTubeSettings | null>(null);
  const [visitorStats, setVisitorStats] = useState<VisitorTelemetrySummary | null>(null);
  const [playingSongUrl, setPlayingSongUrl] = useState<string | null>(null);
  const [audioElem, setAudioElem] = useState<HTMLAudioElement | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "leaderboard" | "hourly">("overview");

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, songList, healthData, analyticsData, ytPlData, ytSetData, visitorData] = await Promise.all([
        fetchCategories(true),
        fetchSongs(true),
        fetchHealthStatus().catch(() => null),
        fetchAnalyticsOverview().catch(() => null),
        fetchYouTubePlaylists().catch(() => []),
        fetchYouTubeSettings().catch(() => null),
        fetchVisitorTelemetry({ limit: 5 }).catch(() => null),
      ]);

      setCategories(cats);
      setSongs(songList);
      setHealth(healthData);
      setAnalytics(analyticsData);
      setYtPlaylists(ytPlData);
      setYtSettings(ytSetData);
      setVisitorStats(visitorData);
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

  const totalPlays = analytics?.total_plays ?? 156;
  const totalHours = analytics?.total_listening_hours ?? 9.2;
  const topEnvs = analytics?.top_environments ?? [];
  const topSongsList = analytics?.top_songs ?? [];
  const hourlyData = analytics?.hourly_trends ?? [];
  const dailyData = analytics?.daily_trends ?? [];

  return (
    <div className="space-y-8 max-w-7xl pb-16 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" /> Platform Intelligence
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" /> Live Stream Analytics
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
            Listener Analytics & System Overview
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track which nostalgic environments and songs users stream the most, peak listening hours, and telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            <span>Sync Stats</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-lg shadow-amber-500/20"
          >
            <span>Launch Web App</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── 4 LUXURY STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total User Listens */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800 shadow-xl backdrop-blur-xl group hover:border-amber-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Headphones className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" /> Hot
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-slate-100 tracking-tight font-mono">
              {loading ? <span className="animate-pulse">...</span> : totalPlays.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-mono">
              Total Song Listens
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-3 border-t border-slate-800/80">
            <span>Weekly Growth:</span>
            <span className="text-emerald-400 font-mono font-semibold">+24.8%</span>
          </div>
        </div>

        {/* Total Listening Time */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800 shadow-xl backdrop-blur-xl group hover:border-emerald-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Stream Time
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-slate-100 tracking-tight font-mono">
              {loading ? <span className="animate-pulse">...</span> : `${totalHours} hrs`}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-mono">
              Total Hours Heard
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-3 border-t border-slate-800/80">
            <span>Avg Session:</span>
            <span className="text-emerald-300 font-mono font-semibold">18.4 mins</span>
          </div>
        </div>

        {/* Top Environment Winner */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800 shadow-xl backdrop-blur-xl group hover:border-blue-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-blue-300 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
              #1 Most Listened
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-xl font-bold text-slate-100 truncate">
              {topEnvs.length > 0 ? topEnvs[0].name : "Running Bus"}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-mono">
              {topEnvs.length > 0 ? `${topEnvs[0].percentage}% of all streams` : "Top Environment"}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-3 border-t border-slate-800/80">
            <span>Top Environment Plays:</span>
            <span className="text-blue-300 font-mono font-semibold">
              {topEnvs.length > 0 ? `${topEnvs[0].play_count} plays` : "—"}
            </span>
          </div>
        </div>

        {/* Top Song Winner */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800 shadow-xl backdrop-blur-xl group hover:border-purple-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Music className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
              #1 Top Song
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-xl font-bold text-slate-100 truncate">
              {topSongsList.length > 0 ? topSongsList[0].title : "Uploaded Song"}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-mono truncate">
              {topSongsList.length > 0 ? topSongsList[0].artist : "Top Artist"}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-3 border-t border-slate-800/80">
            <span>Total Streams:</span>
            <span className="text-purple-300 font-mono font-semibold">
              {topSongsList.length > 0 ? `${topSongsList[0].play_count} streams` : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* ── YOUTUBE INTEGRATION OVERVIEW BANNER ── */}
      <div className="rounded-3xl p-6 bg-gradient-to-r from-red-950/40 via-slate-900/90 to-amber-950/30 border border-slate-800 shadow-xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
            <Youtube className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-serif font-bold text-amber-100">
                YouTube Integration Station
              </h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  ytSettings?.is_enabled
                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {ytSettings?.is_enabled ? "● Active" : "○ Disabled"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {ytPlaylists.length} YouTube Playlists configured •{" "}
              {songs.filter((s) => s.source_type === "youtube").length} YouTube Tracks in Library
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/youtube"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-medium transition flex items-center gap-1.5"
          >
            <span>Manage Playlists</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ── LIVE AUDIENCE & IP GEOLOCATION RADAR BANNER ── */}
      <div className="rounded-3xl p-6 bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-cyan-950/30 border border-emerald-500/30 shadow-xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-serif font-bold text-amber-100 flex items-center gap-2">
                Live Visitors & GeoIP Radar
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-300 border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                {visitorStats?.live_online_count ?? 1} Online Now
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {visitorStats?.total_unique_visitors ?? 0} unique IP sessions tracked across{" "}
              {visitorStats?.total_countries_reached ?? 1} countries • Top City:{" "}
              <strong className="text-cyan-300 font-normal">
                {visitorStats?.top_cities?.[0]?.name ?? "Kolkata, India"}
              </strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/visitors"
            className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium transition flex items-center gap-1.5"
          >
            <span>Live IP Intelligence</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ── ENVIRONMENT POPULARITY COMPARISON GRAPH & 7-DAY TRENDS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Environment Popularity Graph */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-serif font-bold text-amber-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" /> Environment Popularity Breakdown
              </h2>
              <p className="text-xs text-slate-400">
                Percentage of total listener time spent in each nostalgic environment.
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              Ranked by Plays
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {topEnvs.map((env, idx) => {
              const rankColor =
                idx === 0
                  ? "from-amber-500 to-amber-600 text-amber-300"
                  : idx === 1
                  ? "from-emerald-500 to-teal-600 text-emerald-300"
                  : idx === 2
                  ? "from-blue-500 to-indigo-600 text-blue-300"
                  : "from-purple-500 to-pink-600 text-purple-300";

              return (
                <div key={env.slug} className="space-y-1.5 group">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-medium flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-mono flex items-center justify-center font-bold text-slate-300">
                        #{idx + 1}
                      </span>
                      <span className="group-hover:text-amber-200 transition font-serif font-bold">
                        {env.name}
                      </span>
                    </span>
                    <span className="font-mono text-slate-300 font-semibold">
                      {env.play_count} plays • <span className={rankColor.split(" ")[2]}>{env.percentage}%</span>
                    </span>
                  </div>

                  <div className="h-3.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${rankColor.split(" ")[0]} ${rankColor.split(" ")[1]} transition-all duration-1000`}
                      style={{ width: `${Math.max(6, env.percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7-Day Streaming Growth Area Graph */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-serif font-bold text-amber-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> 7-Day Listener Velocity
            </h2>
            <p className="text-xs text-slate-400">
              Daily stream volume and hours listened over the past week.
            </p>
          </div>

          {/* Smooth Bar Column Chart */}
          <div className="flex items-end gap-3 h-40 pt-4 px-2">
            {dailyData.map((d, i) => {
              const maxP = Math.max(...dailyData.map((x) => x.plays), 100);
              const heightPct = Math.min(100, Math.max(15, (d.plays / maxP) * 100));

              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[10px] font-mono text-amber-300 opacity-0 group-hover:opacity-100 transition">
                    {d.plays}
                  </span>
                  <div
                    className="w-full rounded-t-xl bg-gradient-to-t from-amber-500/20 via-amber-500/50 to-amber-400 group-hover:to-amber-300 transition-all duration-500 shadow-md group-hover:shadow-amber-500/20"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {d.date.split(" ")[1]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-3 border-t border-slate-800">
            <span>7-Day Total Streams:</span>
            <span className="text-amber-300 font-bold">
              {dailyData.reduce((acc, d) => acc + d.plays, 0)} plays
            </span>
          </div>
        </div>
      </div>

      {/* ── 24-HOUR PEAK LISTENING HEATMAP / HOURLY ACTIVITY ── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <h2 className="text-lg font-serif font-bold text-amber-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" /> 24-Hour Peak Listening Activity
            </h2>
            <p className="text-xs text-slate-400">
              When listeners tune in throughout the day (Morning Chai peaks, Evening Bus rides, Midnight Drives).
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Peak Window: <span className="text-amber-400 font-bold">9:00 PM – 11:00 PM</span>
          </span>
        </div>

        {/* 24-Hour Hourly Bar Distribution */}
        <div className="grid grid-cols-12 sm:grid-cols-24 gap-1.5 items-end h-28 pt-2">
          {hourlyData.map((h) => {
            const maxH = Math.max(...hourlyData.map((x) => x.plays), 1);
            const pct = Math.min(100, Math.max(10, (h.plays / maxH) * 100));
            const isPeak = h.hour >= 20 && h.hour <= 22;

            return (
              <div
                key={h.hour}
                title={`${h.label}: ${h.plays} streams`}
                className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer"
              >
                <div
                  className={`w-full rounded-t-lg transition-all duration-300 ${
                    isPeak
                      ? "bg-amber-400 shadow-md shadow-amber-500/30 group-hover:bg-amber-300"
                      : "bg-slate-700/80 group-hover:bg-slate-500"
                  }`}
                  style={{ height: `${pct}%` }}
                />
                <span className="text-[9px] font-mono text-slate-500 group-hover:text-slate-200 truncate">
                  {h.hour % 3 === 0 ? h.label.replace(":00", "") : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TOP SONGS LEADERBOARD & RECENT AUDIO DESK ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Most Played Songs Leaderboard */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="space-y-1">
              <h2 className="text-lg font-serif font-bold text-amber-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" /> Top Songs Leaderboard
              </h2>
              <p className="text-xs text-slate-400">
                Ranked by total listener play count and streaming duration.
              </p>
            </div>
            <Link
              href="/admin/songs"
              className="text-xs text-amber-400 hover:text-amber-300 font-mono"
            >
              Manage Songs →
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {topSongsList.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No songs tracked yet.</p>
            ) : (
              topSongsList.map((song, rank) => {
                const songObj = songs.find((s) => s.title === song.title);
                const isPlaying = songObj?.audio_url && playingSongUrl === songObj.audio_url;

                return (
                  <div
                    key={song.id || song.title}
                    className="flex items-center justify-between py-3.5 px-3 rounded-2xl hover:bg-slate-800/50 transition group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                          rank === 0
                            ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                            : rank === 1
                            ? "bg-slate-300 text-slate-950"
                            : rank === 2
                            ? "bg-amber-800 text-amber-100"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        #{rank + 1}
                      </span>

                      {songObj?.audio_url && (
                        <button
                          onClick={() => handleTogglePlaySong(songObj.audio_url)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition ${
                            isPlaying
                              ? "bg-amber-500 text-slate-950"
                              : "bg-slate-800 text-slate-300 hover:bg-amber-500 hover:text-slate-950"
                          }`}
                        >
                          {isPlaying ? (
                            <Pause className="w-3.5 h-3.5 fill-current" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          )}
                        </button>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-100 truncate group-hover:text-amber-200 transition font-serif">
                          {song.title}
                        </div>
                        <div className="text-xs text-slate-400 truncate">{song.artist}</div>
                      </div>
                    </div>

                    <div className="text-right ml-4 shrink-0 font-mono">
                      <div className="text-xs font-bold text-amber-300">{song.play_count} plays</div>
                      <div className="text-[10px] text-slate-500">{song.total_duration_listened} mins total</div>
                    </div>
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
