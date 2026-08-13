"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CategoryDetail } from "@/types";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { soundscapeEngine, AmbientSoundType } from "@/lib/soundscapes";
import {
  ArrowLeft, Radio, Music, Play, Pause, SkipBack, SkipForward,
  Volume2, Volume1, VolumeX, Shuffle, Repeat, Repeat1, ListMusic, ChevronDown,
  Sparkles, Wind, Disc, Tv, Sliders, Keyboard, Check
} from "lucide-react";

interface ExperienceClientProps {
  category: CategoryDetail;
}

export default function ExperienceClient({ category }: ExperienceClientProps) {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    togglePlay,
    playSong,
    seek,
    setVolume,
    toggleMute,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleRepeat,
  } = useAudioPlayer(category.songs);

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [showAtmosphere, setShowAtmosphere] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);

  // Retro Atmospheric Effects State
  const [ambientActive, setAmbientActive] = useState(true);
  const [ambientVolume, setAmbientVolume] = useState(0.3);
  const [vinylActive, setVinylActive] = useState(false);
  const [retroCrtActive, setRetroCrtActive] = useState(false);

  const hasSongs = category.songs.length > 0;

  // Admin-configurable transparency
  const rawOpacity = category.theme_config?.player_transparency ?? 10;
  const playerOpacity = Math.min(90, Math.max(8, rawOpacity)) / 100;
  const playerBg = `rgba(0, 0, 0, ${playerOpacity})`;
  const playlistBg = `rgba(0, 0, 0, ${Math.max(0.15, playerOpacity)})`;

  const playlistRef = useRef<HTMLDivElement>(null);
  const volumeWrapRef = useRef<HTMLDivElement>(null);
  const atmosphereRef = useRef<HTMLDivElement>(null);
  const activeTrackRef = useRef<HTMLDivElement>(null);
  const volumeCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Sync Ambient Soundscapes ──────────────────────────────────────────
  useEffect(() => {
    if (!soundscapeEngine) return;
    if (ambientActive && (isPlaying || !hasSongs)) {
      const type = soundscapeEngine.getCategorySoundscapeType(category.slug);
      soundscapeEngine.setSoundscape(type, ambientVolume);
    } else {
      soundscapeEngine.setSoundscape("off", 0);
    }
  }, [ambientActive, ambientVolume, category.slug, isPlaying, hasSongs]);

  // ── Sync Vinyl & Tape Hiss Texture ────────────────────────────────────
  useEffect(() => {
    if (!soundscapeEngine) return;
    soundscapeEngine.setVinylEffect(vinylActive, 0.18);
  }, [vinylActive]);

  const fmtTime = (s: number) => {
    if (!Number.isFinite(s) || s < 0) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const effectiveVolume = isMuted ? 0 : volume;

  const openVolume = () => {
    if (volumeCloseTimer.current) clearTimeout(volumeCloseTimer.current);
    setShowVolume(true);
  };
  const scheduleCloseVolume = (delay = 200) => {
    if (volumeCloseTimer.current) clearTimeout(volumeCloseTimer.current);
    volumeCloseTimer.current = setTimeout(() => setShowVolume(false), delay);
  };
  useEffect(() => () => {
    if (volumeCloseTimer.current) clearTimeout(volumeCloseTimer.current);
  }, []);

  // Close popovers on outside click / Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (showPlaylist && playlistRef.current && !playlistRef.current.contains(e.target as Node)) {
        setShowPlaylist(false);
      }
      if (showVolume && volumeWrapRef.current && !volumeWrapRef.current.contains(e.target as Node)) {
        setShowVolume(false);
      }
      if (showAtmosphere && atmosphereRef.current && !atmosphereRef.current.contains(e.target as Node)) {
        setShowAtmosphere(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.code === "Space") {
        e.preventDefault();
        if (hasSongs) togglePlay();
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        setVolume(Math.min(1, effectiveVolume + 0.05));
        openVolume();
        scheduleCloseVolume(1200);
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        setVolume(Math.max(0, effectiveVolume - 0.05));
        openVolume();
        scheduleCloseVolume(1200);
      } else if (e.code === "KeyM") {
        toggleMute();
      } else if (e.code === "KeyV") {
        setVinylActive((v) => !v);
      } else if (e.code === "KeyC") {
        setRetroCrtActive((v) => !v);
      } else if (e.code === "Escape") {
        setShowPlaylist(false);
        setShowVolume(false);
        setShowAtmosphere(false);
        setShowShortcuts(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showPlaylist, showVolume, showAtmosphere, hasSongs, effectiveVolume, togglePlay, setVolume, toggleMute]);

  useEffect(() => {
    if (showPlaylist && activeTrackRef.current) {
      activeTrackRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [showPlaylist]);

  const handleVolumeWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setVolume(Math.min(1, Math.max(0, effectiveVolume + delta)));
    openVolume();
    scheduleCloseVolume(1000);
  };

  const VolumeIcon = isMuted || effectiveVolume === 0 ? VolumeX : effectiveVolume < 0.5 ? Volume1 : Volume2;
  const RepeatIcon = repeatMode === "one" ? Repeat1 : Repeat;

  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const x = (clientX - windowWidth / 2) / 50;
    const y = (clientY - windowHeight / 2) / 50;
    setMouseOffset({ x, y });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`relative min-h-screen w-full overflow-hidden font-sans select-none bg-slate-950 text-white ${
        retroCrtActive ? "crt-mode" : ""
      }`}
    >
      {/* ── RETRO CRT SCANLINES OVERLAY (TOGGLEABLE) ── */}
      {retroCrtActive && (
        <div className="fixed inset-0 z-50 pointer-events-none crt-overlay opacity-40 mix-blend-overlay" />
      )}

      {/* ── FULL-SCREEN ANIMATED BACKGROUND IMAGE (CINEMATIC SLOW PAN + MOUSE PARALLAX) ── */}
      <div
        className="absolute inset-0 z-0 transition-transform duration-700 ease-out pointer-events-none"
        style={{
          transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0px)`,
        }}
      >
        {category.background_url ? (
          category.background_type === "video" ? (
            <video
              src={category.background_url}
              autoPlay loop muted playsInline
              onLoadedData={() => setBgLoaded(true)}
              className={`w-full h-full object-cover animate-ambient-pan transition-opacity duration-1000 ${bgLoaded ? "opacity-100" : "opacity-0"}`}
            />
          ) : (
            <img
              src={category.background_url}
              alt={category.name}
              onLoad={() => setBgLoaded(true)}
              className={`w-full h-full object-cover animate-ambient-pan transition-opacity duration-1000 ${bgLoaded ? "opacity-100" : "opacity-0"}`}
            />
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-950 via-slate-900 to-stone-950 animate-ambient-pan" />
        )}

        {category.background_url && !bgLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 animate-pulse" />
        )}

        {/* Ambient Animated Dust / Light Particles Overlay */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:40px_40px] animate-pulse pointer-events-none" />

        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      </div>

      {/* ── TOP HEADER BAR ───────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-20 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link
          href="/"
          aria-label="Exit environment and return home"
          className="group inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full bg-black/20 hover:bg-black/40 border border-white/20 text-white text-xs font-medium backdrop-blur-xl transition duration-300 hover:scale-105 active:scale-95 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-1 transition" />
          <span className="hidden xs:inline">Exit Environment</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowShortcuts((v) => !v)}
            title="Keyboard Shortcuts"
            className="p-2 rounded-full bg-black/25 hover:bg-black/40 border border-white/20 text-amber-300 text-xs backdrop-blur-xl transition hover:scale-105"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          <div className="text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/25 border border-amber-400/30 text-amber-300 text-xs font-mono backdrop-blur-xl shadow-md">
              <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>{hasSongs ? (isPlaying ? "Live Scene" : "Paused") : "Scene Active"}</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-serif font-bold text-white mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] tracking-wide">
              {category.name}
            </h1>
          </div>
        </div>
      </header>

      {/* Empty Playlist Notice */}
      {!hasSongs && (
        <div className="fixed inset-0 z-10 flex items-center justify-center p-6 pointer-events-none">
          <div className="bg-black/40 border border-white/15 backdrop-blur-2xl rounded-3xl p-8 max-w-md text-center space-y-3 shadow-2xl pointer-events-auto">
            <Music className="w-8 h-8 text-amber-400 mx-auto" />
            <h2 className="text-lg font-serif font-bold text-amber-100">No tracks in this environment</h2>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Enjoy the ambient visuals and atmosphere of {category.name}. Add MP3 tracks to this environment via the Admin Portal to start streaming.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/20 transition mt-2"
            >
              Back to Environments
            </Link>
          </div>
        </div>
      )}

      {/* ── ATMOSPHERE & RETRO EFFECTS POPUP ──────────────────────────── */}
      {showAtmosphere && (
        <div className="fixed inset-x-0 bottom-24 z-40 flex justify-center px-4">
          <div
            ref={atmosphereRef}
            className="w-full max-w-sm backdrop-blur-2xl border border-white/20 rounded-3xl overflow-hidden shadow-[0_16px_48px_0_rgba(0,0,0,0.4)] animate-in fade-in slide-in-from-bottom-4 duration-300 p-5 space-y-4"
            style={{ backgroundColor: playlistBg }}
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono uppercase tracking-widest text-amber-200">
                  Atmospheric Soundscape
                </span>
              </div>
              <button
                onClick={() => setShowAtmosphere(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Environmental Audio Toggle & Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-200 font-medium flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-amber-400" />
                  {category.name} Ambience
                </span>
                <button
                  onClick={() => setAmbientActive((v) => !v)}
                  className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] border transition ${
                    ambientActive
                      ? "bg-amber-500/20 text-amber-300 border-amber-400/40"
                      : "bg-white/5 text-slate-400 border-white/10"
                  }`}
                >
                  {ambientActive ? "ON" : "OFF"}
                </button>
              </div>

              {ambientActive && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={ambientVolume}
                    onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 accent-amber-400 bg-white/20 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-amber-300 w-8 text-right">
                    {Math.round(ambientVolume * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Vinyl Crackle & Tape Hiss */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-200 font-medium flex items-center gap-1.5">
                  <Disc className="w-3.5 h-3.5 text-amber-400" />
                  Vinyl Crackle & Tape Hiss
                </span>
                <p className="text-[10px] text-slate-400">Warm analog acoustic texture</p>
              </div>
              <button
                onClick={() => setVinylActive((v) => !v)}
                className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] border transition ${
                  vinylActive
                    ? "bg-amber-500/20 text-amber-300 border-amber-400/40"
                    : "bg-white/5 text-slate-400 border-white/10"
                }`}
              >
                {vinylActive ? "ON" : "OFF"}
              </button>
            </div>

            {/* Retro CRT Scanlines Mode */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-200 font-medium flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-amber-400" />
                  Retro CRT & Film Filter
                </span>
                <p className="text-[10px] text-slate-400">Vintage scanlines & analog glow</p>
              </div>
              <button
                onClick={() => setRetroCrtActive((v) => !v)}
                className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] border transition ${
                  retroCrtActive
                    ? "bg-amber-500/20 text-amber-300 border-amber-400/40"
                    : "bg-white/5 text-slate-400 border-white/10"
                }`}
              >
                {retroCrtActive ? "ON" : "OFF"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── KEYBOARD SHORTCUTS MODAL ──────────────────────────────────── */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-white/20 rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-serif font-bold text-amber-200 flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-amber-400" /> Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-white/5 p-2 rounded-xl border border-white/5"><kbd className="text-amber-400">Space</kbd> Play / Pause</div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/5"><kbd className="text-amber-400">↑ / ↓</kbd> Volume ±5%</div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/5"><kbd className="text-amber-400">M</kbd> Mute Audio</div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/5"><kbd className="text-amber-400">V</kbd> Vinyl Crackle</div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/5"><kbd className="text-amber-400">C</kbd> CRT Scanlines</div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/5"><kbd className="text-amber-400">Esc</kbd> Close Panels</div>
            </div>
          </div>
        </div>
      )}

      {/* ── PLAYLIST POPUP ───────────────────────────────────────────── */}
      {showPlaylist && (
        <div className="fixed inset-x-0 bottom-24 z-40 flex justify-center px-4">
          <div
            ref={playlistRef}
            className="w-full max-w-md backdrop-blur-2xl border border-white/20 rounded-3xl overflow-hidden shadow-[0_16px_48px_0_rgba(0,0,0,0.4)] animate-in fade-in slide-in-from-bottom-4 duration-300"
            style={{ backgroundColor: playlistBg }}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/15 bg-white/5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-mono uppercase tracking-widest text-amber-200">
                  Playlist · {category.songs.length} Tracks
                </span>
              </div>
              <button
                onClick={() => setShowPlaylist(false)}
                aria-label="Close playlist"
                className="text-slate-300 hover:text-white transition p-1 rounded-full hover:bg-white/10"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {hasSongs ? (
              <div className="overflow-y-auto max-h-72 divide-y divide-white/10 p-1">
                {category.songs.map((song, i) => {
                  const isCurrent = currentSong?.id === song.id;
                  return (
                    <div
                      key={song.id}
                      ref={isCurrent ? activeTrackRef : undefined}
                      role="button"
                      tabIndex={0}
                      aria-current={isCurrent}
                      onClick={() => {
                        playSong(song, category.songs);
                        setShowPlaylist(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          playSong(song, category.songs);
                          setShowPlaylist(false);
                        }
                      }}
                      className={`flex items-center gap-3.5 px-4 py-2.5 rounded-2xl cursor-pointer transition ${isCurrent
                        ? "bg-amber-500/25 text-amber-200 border border-amber-400/40"
                        : "hover:bg-white/15 text-slate-100"
                        }`}
                    >
                      <span className="w-5 shrink-0 flex items-center justify-center">
                        {isCurrent && isPlaying ? (
                          <span className="flex items-end gap-0.5 h-3" aria-hidden="true">
                            <span className="w-0.5 bg-amber-400 rounded-full animate-[eq_0.8s_ease-in-out_infinite]" style={{ height: "40%", animationDelay: "0ms" }} />
                            <span className="w-0.5 bg-amber-400 rounded-full animate-[eq_0.8s_ease-in-out_infinite]" style={{ height: "100%", animationDelay: "150ms" }} />
                            <span className="w-0.5 bg-amber-400 rounded-full animate-[eq_0.8s_ease-in-out_infinite]" style={{ height: "60%", animationDelay: "300ms" }} />
                          </span>
                        ) : (
                          <span className={`text-xs font-mono ${isCurrent ? "text-amber-400 font-bold" : "text-slate-400"}`}>
                            {i + 1}
                          </span>
                        )}
                      </span>
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-black/40 shrink-0 border border-white/20 flex items-center justify-center shadow-md">
                        {song.cover_url ? (
                          <img src={song.cover_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <Music className="w-4 h-4 text-amber-300/80" />
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className={`text-sm font-medium truncate ${isCurrent ? "text-amber-300 font-semibold" : "text-white"}`}>
                          {song.title}
                        </p>
                        <p className="text-xs text-slate-300/80 truncate">{song.artist}</p>
                      </div>
                      {song.duration && (
                        <span className="text-xs font-mono text-slate-300/80 shrink-0">
                          {fmtTime(song.duration)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-6 py-10 text-center">
                <Music className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-300">No tracks in this scene yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FLOATING GLASS PLAYER PILL ────────────────────────────────── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[94%] max-w-xl">
        <div
          className="relative backdrop-blur-2xl border border-white/20 rounded-full px-3.5 sm:px-4 py-2.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex items-center justify-between gap-2 sm:gap-3 transition-all duration-300"
          style={{ backgroundColor: playerBg }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none rounded-full" />

          {/* Left: Thumbnail & Visualizer */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-black/40 border border-white/20 shrink-0 flex items-center justify-center shadow-md relative group">
              {currentSong?.cover_url ? (
                <img
                  src={currentSong.cover_url}
                  alt=""
                  className={`w-full h-full object-cover transition duration-500 ${isPlaying ? "scale-110" : ""}`}
                />
              ) : (
                <Disc className={`w-5 h-5 text-amber-300 ${isPlaying ? "animate-spin" : ""}`} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs sm:text-sm font-semibold text-white truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                  {currentSong?.title ?? (hasSongs ? "Select a track" : "No tracks available")}
                </p>
                {hasSongs && (
                  <span className="text-[10px] font-mono text-slate-300 shrink-0 tabular-nums">
                    {fmtTime(currentTime)} / {fmtTime(duration)}
                  </span>
                )}
              </div>

              <div
                role="slider"
                aria-label="Seek"
                aria-valuemin={0}
                aria-valuemax={duration || 0}
                aria-valuenow={currentTime}
                tabIndex={hasSongs ? 0 : -1}
                className="h-1 bg-white/20 hover:bg-white/30 rounded-full cursor-pointer relative mt-1 transition"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = (e.clientX - rect.left) / rect.width;
                  seek(ratio * duration);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") seek(Math.min(duration, currentTime + 5));
                  if (e.key === "ArrowLeft") seek(Math.max(0, currentTime - 5));
                }}
              >
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {/* Atmosphere Popover Button */}
            <button
              onClick={() => {
                setShowAtmosphere((v) => !v);
                setShowPlaylist(false);
              }}
              title="Atmospheric Soundscapes & Retro FX"
              className={`p-1.5 rounded-full transition border ${
                showAtmosphere || ambientActive || vinylActive || retroCrtActive
                  ? "bg-amber-500/25 border-amber-400/50 text-amber-300"
                  : "bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <Wind className="w-4 h-4" />
            </button>

            <button
              onClick={toggleShuffle}
              disabled={!hasSongs}
              aria-label="Toggle shuffle"
              className={`hidden sm:inline-flex p-1.5 rounded-full transition disabled:opacity-30 ${
                isShuffle ? "text-amber-300 bg-amber-500/20" : "text-slate-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={prevTrack}
              disabled={!hasSongs}
              aria-label="Previous track"
              className="p-1.5 rounded-full text-slate-200 hover:text-white hover:bg-white/10 active:scale-90 transition disabled:opacity-30"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              disabled={!hasSongs}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 flex items-center justify-center shadow-[0_0_16px_rgba(245,158,11,0.6)] hover:scale-105 active:scale-95 transition transform disabled:opacity-40"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              onClick={nextTrack}
              disabled={!hasSongs}
              aria-label="Next track"
              className="p-1.5 rounded-full text-slate-200 hover:text-white hover:bg-white/10 active:scale-90 transition disabled:opacity-30"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={toggleRepeat}
              disabled={!hasSongs}
              aria-label="Toggle repeat mode"
              className={`hidden sm:inline-flex p-1.5 rounded-full transition disabled:opacity-30 ${
                repeatMode !== "off" ? "text-amber-300 bg-amber-500/20" : "text-slate-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <RepeatIcon className="w-4 h-4" />
            </button>

            {/* Volume Control */}
            <div
              ref={volumeWrapRef}
              className="relative"
              onMouseEnter={openVolume}
              onMouseLeave={() => scheduleCloseVolume()}
              onWheel={handleVolumeWheel}
            >
              <button
                onClick={() => setShowVolume((v) => !v)}
                onFocus={openVolume}
                aria-label="Volume"
                className="p-1.5 rounded-full text-slate-200 hover:text-white hover:bg-white/10 transition"
              >
                <VolumeIcon className={`w-4 h-4 ${isMuted || effectiveVolume === 0 ? "text-rose-400" : "text-amber-300"}`} />
              </button>

              {showVolume && (
                <div
                  className="absolute -top-[3.75rem] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pt-3 pb-2 px-3 rounded-2xl border border-white/20 backdrop-blur-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150 z-50"
                  style={{ backgroundColor: `rgba(0, 0, 0, ${Math.max(0.35, playerOpacity + 0.2)})` }}
                  onMouseEnter={openVolume}
                  onMouseLeave={() => scheduleCloseVolume()}
                >
                  <div className="absolute -bottom-4 inset-x-0 h-4" />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMute}
                      className="text-amber-300 hover:text-amber-200 transition rounded-full"
                    >
                      <VolumeIcon className="w-4 h-4" />
                    </button>
                    <input
                      type="range" min={0} max={1} step={0.02}
                      value={effectiveVolume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      aria-label="Volume level"
                      className="w-24 h-1.5 accent-amber-400 bg-white/20 rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-amber-300 w-7 text-right tabular-nums">
                      {Math.round(effectiveVolume * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Playlist Button */}
            <button
              onClick={() => {
                setShowPlaylist((v) => !v);
                setShowAtmosphere(false);
              }}
              aria-label="Toggle playlist"
              className={`p-1.5 rounded-full transition border ${
                showPlaylist
                  ? "bg-amber-500/25 border-amber-400/50 text-amber-300"
                  : "bg-white/10 border-white/20 text-white hover:bg-white/20"
              }`}
            >
              <ListMusic className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes eq {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
        .crt-overlay {
          background: linear-gradient(
            rgba(18, 16, 16, 0) 50%, 
            rgba(0, 0, 0, 0.25) 50%
          ), linear-gradient(
            90deg,
            rgba(255, 0, 0, 0.06),
            rgba(0, 255, 0, 0.02),
            rgba(0, 0, 255, 0.06)
          );
          background-size: 100% 3px, 6px 100%;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse, .animate-in { animation: none !important; }
        }
      `}</style>
    </div>
  );
}