"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CategoryDetail } from "@/types";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import {
  multiAmbientEngine,
  AVAILABLE_AMBIENT_LAYERS,
  MultiLayerStateMap,
} from "@/lib/ambientSoundscapes";
import { trackPlaybackEvent, sendHeartbeat } from "@/lib/api";
import VintageCassettePlayer from "@/components/player/VintageCassettePlayer";

import {
  ArrowLeft,
  Radio,
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Volume1,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  ListMusic,
  ChevronDown,
  Sparkles,
  Sliders,
  Wind,
  CloudRain,
  CloudLightning,
  Coffee,
  Scissors,
  Train,
  Disc,
  Heart,
  Moon,
  Clock,
  Layers,
  Trees,
  Car,
  X,
  Check,
  Search,
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
    pauseAudio,
    fadeOutAndPause,
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
  const [queueSearch, setQueueSearch] = useState("");
  const [showVolume, setShowVolume] = useState(false);
  const [showAmbientControls, setShowAmbientControls] = useState(false);
  const [showSleepTimerModal, setShowSleepTimerModal] = useState(false);
  const [showCassettePlayer, setShowCassettePlayer] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [retroFilter, setRetroFilter] = useState(false);
  const bgImgRef = useRef<HTMLImageElement>(null);
  const sleepTimerWrapRef = useRef<HTMLDivElement>(null);
  const [customTimerMinutes, setCustomTimerMinutes] = useState("");

  // Keep references to player functions to prevent stale closures in timer intervals
  const pauseAudioRef = useRef(pauseAudio);
  pauseAudioRef.current = pauseAudio;
  const fadeOutAndPauseRef = useRef(fadeOutAndPause);
  fadeOutAndPauseRef.current = fadeOutAndPause;

  // ── MULTI-LAYER AMBIENT MIXER STATE ──
  const [ambientStateMap, setAmbientStateMap] = useState<MultiLayerStateMap>({});
  const [ambientMasterVolume, setAmbientMasterVolume] = useState<number>(1.0);

  useEffect(() => {
    const engine = multiAmbientEngine;
    if (engine) {
      setAmbientMasterVolume(engine.getMasterVolume());
      const unsub = engine.subscribe((state) => {
        setAmbientStateMap(state);
        setAmbientMasterVolume(engine.getMasterVolume());
      });
      return unsub;
    }
  }, []);

  // ── FAVORITES SYSTEM (localStorage) ──
  const [favoriteSongIds, setFavoriteSongIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nostalgic_favorites");
      if (saved) {
        setFavoriteSongIds(JSON.parse(saved));
      }
    } catch (_) {}
  }, []);

  const toggleFavorite = (songId?: string) => {
    const targetId = songId || currentSong?.id;
    if (!targetId) return;

    setFavoriteSongIds((prev) => {
      const updated = prev.includes(targetId)
        ? prev.filter((id) => id !== targetId)
        : [...prev, targetId];
      try {
        localStorage.setItem("nostalgic_favorites", JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  const isCurrentFavorite = currentSong?.id ? favoriteSongIds.includes(currentSong.id) : false;

  // ── ROBUST SLEEP TIMER & FADE-OUT ENGINE ──
  const [sleepTimerOption, setSleepTimerOption] = useState<number | "track" | null>(null);
  const [sleepTimerRemainingSec, setSleepTimerRemainingSec] = useState<number | null>(null);
  const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetEndTimeRef = useRef<number | null>(null);
  const isFadingOutRef = useRef(false);

  const setSleepTimer = (option: number | "track" | null) => {
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    isFadingOutRef.current = false;

    if (option === null) {
      targetEndTimeRef.current = null;
      setSleepTimerOption(null);
      setSleepTimerRemainingSec(null);
      return;
    }

    let totalSec = 0;
    if (option === "track") {
      const rem = Math.max(5, Math.ceil((duration || 180) - (currentTime || 0)));
      totalSec = rem;
    } else {
      totalSec = Math.max(1, Math.round(option * 60));
    }

    setSleepTimerOption(option);
    setSleepTimerRemainingSec(totalSec);
    const targetEnd = Date.now() + totalSec * 1000;
    targetEndTimeRef.current = targetEnd;

    sleepTimerRef.current = setInterval(() => {
      if (!targetEndTimeRef.current) return;
      const now = Date.now();
      const secRemaining = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));
      setSleepTimerRemainingSec(secRemaining);

      // Smooth fade-out in final 15 seconds (or half duration if shorter)
      const fadeThreshold = Math.min(15, Math.max(3, Math.floor(totalSec / 2)));
      if (secRemaining <= fadeThreshold && !isFadingOutRef.current && secRemaining > 0) {
        isFadingOutRef.current = true;
        if (multiAmbientEngine) multiAmbientEngine.fadeOutAll(fadeThreshold);
        fadeOutAndPauseRef.current(fadeThreshold);
      }

      if (secRemaining <= 0) {
        if (sleepTimerRef.current) {
          clearInterval(sleepTimerRef.current);
          sleepTimerRef.current = null;
        }
        targetEndTimeRef.current = null;
        setSleepTimerOption(null);
        setSleepTimerRemainingSec(null);
        pauseAudioRef.current();
        if (multiAmbientEngine) multiAmbientEngine.stopAll();
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    };
  }, []);

  // Auto-detect cached background image completion
  useEffect(() => {
    if (bgImgRef.current && (bgImgRef.current.complete || bgImgRef.current.naturalWidth > 0)) {
      setBgLoaded(true);
    }
  }, [category.background_url, category.thumbnail_url]);

  // Ensure ambient audio starts stopped on page load (user manually turns on if desired)
  useEffect(() => {
    if (multiAmbientEngine) {
      multiAmbientEngine.stopAll();
    }
    return () => {
      if (multiAmbientEngine) multiAmbientEngine.stopAll();
    };
  }, [category.slug]);

  // Theme Config Defaults
  const playerOpacity = (category.theme_config?.player_transparency ?? 20) / 100;
  const playerBg = `rgba(0, 0, 0, ${playerOpacity})`;

  const playlistRef = useRef<HTMLDivElement>(null);
  const volumeWrapRef = useRef<HTMLDivElement>(null);
  const ambientWrapRef = useRef<HTMLDivElement>(null);
  const activeTrackRef = useRef<HTMLDivElement>(null);
  const volumeCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fmtTime = (s: number) => {
    if (!Number.isFinite(s) || s < 0) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  // Draggable seek scrubber
  const [isDraggingSeek, setIsDraggingSeek] = useState(false);
  const [dragSeekTime, setDragSeekTime] = useState<number | null>(null);

  const handleSeekPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!category.songs.length || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = ratio * duration;
    setIsDraggingSeek(true);
    setDragSeekTime(targetTime);
    seek(targetTime);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handleSeekPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSeek || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = ratio * duration;
    setDragSeekTime(targetTime);
    seek(targetTime);
  };

  const handleSeekPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSeek) return;
    if (dragSeekTime !== null && duration) {
      seek(dragSeekTime);
    }
    setIsDraggingSeek(false);
    setDragSeekTime(null);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  const currentDisplayTime = isDraggingSeek && dragSeekTime !== null ? dragSeekTime : currentTime;
  const progress = duration > 0 ? (currentDisplayTime / duration) * 100 : 0;
  const effectiveVolume = isMuted ? 0 : volume;

  const openVolume = () => {
    if (volumeCloseTimer.current) clearTimeout(volumeCloseTimer.current);
    setShowVolume(true);
  };
  const scheduleCloseVolume = (delay = 200) => {
    if (volumeCloseTimer.current) clearTimeout(volumeCloseTimer.current);
    volumeCloseTimer.current = setTimeout(() => setShowVolume(false), delay);
  };

  // Close modals on outside click & shortcuts
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (showPlaylist && playlistRef.current && !playlistRef.current.contains(e.target as Node)) {
        setShowPlaylist(false);
      }
      if (showVolume && volumeWrapRef.current && !volumeWrapRef.current.contains(e.target as Node)) {
        setShowVolume(false);
      }
      if (showAmbientControls && ambientWrapRef.current && !ambientWrapRef.current.contains(e.target as Node)) {
        setShowAmbientControls(false);
      }
      if (showSleepTimerModal && sleepTimerWrapRef.current && !sleepTimerWrapRef.current.contains(e.target as Node)) {
        setShowSleepTimerModal(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        if (category.songs.length) togglePlay();
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
      } else if (e.code === "Escape") {
        setShowPlaylist(false);
        setShowVolume(false);
        setShowAmbientControls(false);
        setShowSleepTimerModal(false);
        setShowCassettePlayer(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showPlaylist, showVolume, showAmbientControls, effectiveVolume, togglePlay, setVolume, toggleMute, category.songs.length]);

  useEffect(() => {
    if (showPlaylist && activeTrackRef.current) {
      activeTrackRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [showPlaylist]);

  // Periodic Visitor Heartbeat (every 30s)
  useEffect(() => {
    sendHeartbeat({
      current_path: `/experience/${category.slug}`,
      current_environment: category.name,
      current_song_title: currentSong?.title,
      current_song_artist: currentSong?.artist,
      is_playing: isPlaying,
      duration_increment: 0,
    });

    const interval = setInterval(() => {
      sendHeartbeat({
        current_path: `/experience/${category.slug}`,
        current_environment: category.name,
        current_song_title: currentSong?.title,
        current_song_artist: currentSong?.artist,
        is_playing: isPlaying,
        duration_increment: isPlaying ? 30 : 0,
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [category.slug, category.name, currentSong?.title, currentSong?.artist, isPlaying]);

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

  const hasSongs = category.songs.length > 0;
  const activeAmbientLayersCount = Object.values(ambientStateMap).filter((s) => s.isPlaying).length;

  const getLayerIcon = (iconName: string) => {
    switch (iconName) {
      case "CloudRain":
        return <CloudRain className="w-4 h-4 text-cyan-400" />;
      case "CloudLightning":
        return <CloudLightning className="w-4 h-4 text-purple-400" />;
      case "Bus":
        return <Wind className="w-4 h-4 text-amber-400" />;
      case "Coffee":
        return <Coffee className="w-4 h-4 text-orange-400" />;
      case "Scissors":
        return <Scissors className="w-4 h-4 text-emerald-400" />;
      case "Trees":
        return <Trees className="w-4 h-4 text-green-400" />;
      case "Train":
        return <Train className="w-4 h-4 text-blue-400" />;
      case "Car":
        return <Car className="w-4 h-4 text-indigo-400" />;
      default:
        return <Wind className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`relative min-h-screen w-full overflow-hidden font-sans select-none bg-slate-950 text-white transition-all ${
        retroFilter ? "sepia-[0.35] contrast-105" : ""
      }`}
    >
      {/* ── FULL-SCREEN ANIMATED BACKGROUND IMAGE ── */}
      <div
        className="absolute inset-0 z-0 transition-transform duration-700 ease-out pointer-events-none"
        style={{
          transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0px)`,
        }}
      >
        {category.background_url || category.thumbnail_url ? (
          category.background_type === "video" && category.background_url ? (
            <video
              src={category.background_url}
              autoPlay
              loop
              muted
              playsInline
              onLoadedData={() => setBgLoaded(true)}
              className="w-full h-full object-cover animate-ambient-pan transition-opacity duration-700 opacity-100"
            />
          ) : (
            <img
              ref={bgImgRef}
              src={category.background_url || category.thumbnail_url}
              alt={category.name}
              loading="eager"
              decoding="async"
              onLoad={() => setBgLoaded(true)}
              onError={() => setBgLoaded(true)}
              className="w-full h-full object-cover animate-ambient-pan transition-opacity duration-700 opacity-100"
            />
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-950 via-slate-900 to-stone-950 animate-ambient-pan" />
        )}

        {/* Ambient Animated Dust / Light Particles Overlay */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:40px_40px] animate-pulse pointer-events-none" />

        {/* Optional Retro Film Grain Scanlines */}
        {retroFilter && (
          <div className="absolute inset-0 pointer-events-none opacity-25 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.5)_3px,rgba(0,0,0,0.5)_4px)]" />
        )}

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

        {/* Action Controls in Header */}
        <div className="flex items-center gap-2">
          {/* Cassette Mode Button */}
          <button
            onClick={() => setShowCassettePlayer(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 hover:bg-black/50 border border-white/20 text-amber-300 hover:text-amber-200 text-xs font-mono backdrop-blur-xl transition hover:scale-105 shadow-md"
            title="Open Vintage Cassette Deck View"
          >
            <Disc className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: isPlaying ? "3s" : "0s" }} />
            <span className="hidden sm:inline">Cassette Deck</span>
          </button>

          {/* Sleep Timer Button */}
          <button
            onClick={() => setShowSleepTimerModal((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono backdrop-blur-xl transition hover:scale-105 shadow-md ${
              sleepTimerOption !== null
                ? "bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-purple-500/10 animate-pulse"
                : "bg-black/30 hover:bg-black/50 border-white/20 text-slate-300"
            }`}
            title="Sleep Timer"
          >
            <Moon className="w-3.5 h-3.5 text-purple-400" />
            <span>
              {sleepTimerRemainingSec !== null
                ? sleepTimerRemainingSec >= 3600
                  ? `${Math.floor(sleepTimerRemainingSec / 3600)}:${String(Math.floor((sleepTimerRemainingSec % 3600) / 60)).padStart(2, "0")}:${String(sleepTimerRemainingSec % 60).padStart(2, "0")}`
                  : `${Math.floor(sleepTimerRemainingSec / 60)}:${String(sleepTimerRemainingSec % 60).padStart(2, "0")}`
                : "Sleep"}
            </span>
          </button>

          {/* Ambient Mixer Button */}
          <button
            onClick={() => setShowAmbientControls((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono backdrop-blur-xl transition hover:scale-105 shadow-md ${
              activeAmbientLayersCount > 0
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                : "bg-black/30 hover:bg-black/50 border-white/20 text-slate-300"
            }`}
            title="Multi-Layer Ambient Soundscape Mixer"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Ambience</span>
            {activeAmbientLayersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                {activeAmbientLayersCount}
              </span>
            )}
          </button>

          {/* Playlist Button */}
          <button
            onClick={() => setShowPlaylist((v) => !v)}
            aria-label="Toggle playlist drawer"
            aria-expanded={showPlaylist}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/30 hover:bg-black/50 border border-white/20 text-white text-xs font-medium backdrop-blur-xl transition duration-300 hover:scale-105 active:scale-95 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
          >
            <ListMusic className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Scene Queue</span>
            <span className="font-mono text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
              {category.songs.length}
            </span>
          </button>
        </div>
      </header>

      {/* ── SLEEP TIMER MODAL ────────────────────────────────────────── */}
      {showSleepTimerModal && (
        <div
          ref={sleepTimerWrapRef}
          className="fixed top-20 right-4 sm:right-6 z-40 w-80 rounded-3xl bg-slate-950/95 border border-purple-500/30 backdrop-blur-2xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2 text-purple-300 font-serif font-bold text-sm">
              <Moon className="w-4 h-4 text-purple-400" />
              <span>Sleep Timer</span>
            </div>
            <button
              onClick={() => setShowSleepTimerModal(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Gradually fades out music and ambient sounds before gently stopping playback.
          </p>

          {/* Active countdown status banner */}
          {sleepTimerOption !== null && sleepTimerRemainingSec !== null && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200">
              <div className="flex items-center gap-2 text-xs font-mono">
                <Clock className="w-3.5 h-3.5 text-purple-400 animate-spin" style={{ animationDuration: "8s" }} />
                <span>Stopping in:</span>
              </div>
              <span className="font-mono text-sm font-bold text-purple-300">
                {sleepTimerRemainingSec >= 3600
                  ? `${Math.floor(sleepTimerRemainingSec / 3600)}:${String(Math.floor((sleepTimerRemainingSec % 3600) / 60)).padStart(2, "0")}:${String(sleepTimerRemainingSec % 60).padStart(2, "0")}`
                  : `${Math.floor(sleepTimerRemainingSec / 60)}:${String(sleepTimerRemainingSec % 60).padStart(2, "0")}`}
              </span>
            </div>
          )}

          {/* Preset Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  setSleepTimer(mins);
                  setShowSleepTimerModal(false);
                }}
                className={`py-2 rounded-xl text-xs font-mono font-semibold transition border ${
                  sleepTimerOption === mins
                    ? "bg-purple-500/25 border-purple-500 text-purple-200 shadow-md shadow-purple-500/20"
                    : "bg-slate-900/90 border-slate-800 text-slate-300 hover:border-purple-500/40 hover:text-white"
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>

          {/* End of Current Track option */}
          {currentSong && duration > 0 && (
            <button
              onClick={() => {
                setSleepTimer("track");
                setShowSleepTimerModal(false);
              }}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-mono font-medium flex items-center justify-between border transition ${
                sleepTimerOption === "track"
                  ? "bg-purple-500/25 border-purple-500 text-purple-200 shadow-md shadow-purple-500/20"
                  : "bg-slate-900/90 border-slate-800 text-slate-300 hover:border-purple-500/40 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-purple-400" />
                End of Current Track
              </span>
              <span className="text-[11px] text-purple-300/80">
                ~{Math.max(1, Math.ceil((duration - currentTime) / 60))}m left
              </span>
            </button>
          )}

          {/* Custom Minute Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const mins = parseInt(customTimerMinutes, 10);
              if (!isNaN(mins) && mins > 0 && mins <= 360) {
                setSleepTimer(mins);
                setCustomTimerMinutes("");
                setShowSleepTimerModal(false);
              }
            }}
            className="flex items-center gap-2 pt-1"
          >
            <input
              type="number"
              min="1"
              max="360"
              placeholder="Custom mins"
              value={customTimerMinutes}
              onChange={(e) => setCustomTimerMinutes(e.target.value)}
              className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 font-mono focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={!customTimerMinutes || parseInt(customTimerMinutes, 10) <= 0}
              className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-mono font-medium disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Set
            </button>
          </form>

          {sleepTimerOption !== null && (
            <button
              onClick={() => {
                setSleepTimer(null);
                setShowSleepTimerModal(false);
              }}
              className="w-full py-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/30 text-xs font-mono text-rose-300 transition"
            >
              Turn Off Timer
            </button>
          )}
        </div>
      )}

      {/* ── MULTI-LAYER AMBIENT MIXER DRAWER / MODAL ─────────────────── */}
      {showAmbientControls && (
        <div
          ref={ambientWrapRef}
          className="fixed top-20 right-4 sm:right-6 z-40 w-[92%] sm:w-96 max-h-[75vh] rounded-3xl bg-slate-950/95 border border-amber-500/30 backdrop-blur-2xl shadow-2xl p-5 space-y-4 flex flex-col animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-serif font-bold text-amber-100">
                Multi-Layer Ambient Soundscape
              </h3>
            </div>
            <button
              onClick={() => setShowAmbientControls(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Layer and blend individual background textures simultaneously with the music.
          </p>

          {/* Master Ambience Volume Slider */}
          <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="font-serif font-semibold text-amber-200 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                Master Ambience Volume
              </span>
              <span className="font-mono text-amber-300 text-[11px] font-bold">
                {Math.round(ambientMasterVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={ambientMasterVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setAmbientMasterVolume(val);
                multiAmbientEngine?.setMasterVolume(val);
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          <div className="overflow-y-auto space-y-3 pr-1 flex-1 custom-scrollbar">
            {AVAILABLE_AMBIENT_LAYERS.map((layer) => {
              const state = ambientStateMap[layer.id] || { isPlaying: false, volume: layer.defaultVolume, isMuted: false };

              return (
                <div
                  key={layer.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    state.isPlaying
                      ? "bg-amber-950/30 border-amber-500/30 shadow-sm"
                      : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                        {getLayerIcon(layer.iconName)}
                      </div>
                      <span className="text-xs font-semibold text-slate-200">
                        {layer.name}
                      </span>
                    </div>

                    <button
                      onClick={() => multiAmbientEngine?.toggleLayer(layer.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold transition ${
                        state.isPlaying
                          ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                          : "bg-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {state.isPlaying ? "Active" : "Off"}
                    </button>
                  </div>

                  {state.isPlaying && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => multiAmbientEngine?.toggleLayerMute(layer.id)}
                        className="text-slate-400 hover:text-amber-400 transition"
                      >
                        {state.isMuted || state.volume === 0 ? (
                          <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.02}
                        value={state.isMuted ? 0 : state.volume}
                        onChange={(e) =>
                          multiAmbientEngine?.setLayerVolume(layer.id, parseFloat(e.target.value))
                        }
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                      />
                      <span className="text-[10px] font-mono text-amber-300 w-8 text-right tabular-nums">
                        {Math.round((state.isMuted ? 0 : state.volume) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono">
              {activeAmbientLayersCount} Layers Playing
            </span>
            <button
              onClick={() => multiAmbientEngine?.stopAll()}
              className="text-rose-400 hover:text-rose-300 font-mono"
            >
              Stop All Sounds
            </button>
          </div>
        </div>
      )}

      {/* ── FLOATING GLASS PLAYER PILL & QUEUE POPOVER ──────────────── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[94%] max-w-lg">
        {/* ── COMPACT SCENE QUEUE POPUP CARD (ANCHORED ABOVE PLAYER) ── */}
        {showPlaylist && (
          <div
            ref={playlistRef}
            className="absolute bottom-full mb-3 inset-x-0 rounded-3xl bg-slate-950/95 border border-white/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-2xl p-4 flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-200 z-50"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-serif font-bold text-amber-100">
                  Scene Queue
                </h3>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                  {category.songs.length} tracks
                </span>
              </div>
              <button
                onClick={() => setShowPlaylist(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Real-time Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                placeholder="Search track or artist..."
                className="w-full pl-9 pr-8 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans transition"
              />
              {queueSearch && (
                <button
                  onClick={() => setQueueSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Scrollable Song List */}
            <div className="overflow-y-auto space-y-1.5 pr-1 custom-scrollbar max-h-56">
              {category.songs
                .filter((s) => {
                  if (!queueSearch.trim()) return true;
                  const q = queueSearch.toLowerCase();
                  return (
                    s.title.toLowerCase().includes(q) ||
                    (s.artist && s.artist.toLowerCase().includes(q))
                  );
                })
                .map((song, idx) => {
                  const isCurrent = currentSong?.id === song.id;
                  const isFav = favoriteSongIds.includes(song.id);

                  return (
                    <div
                      key={song.id}
                      onClick={() => playSong(song)}
                      className={`flex items-center justify-between p-2 rounded-2xl cursor-pointer transition ${
                        isCurrent
                          ? "bg-amber-500/20 border border-amber-500/40 shadow-sm"
                          : "hover:bg-slate-900/80 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="w-4 text-center font-mono text-[11px] text-slate-400 shrink-0">
                          {isCurrent && isPlaying ? (
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                          ) : (
                            idx + 1
                          )}
                        </span>

                        {/* Song Cover Thumbnail */}
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-black/50 shrink-0 border border-white/20 flex items-center justify-center shadow-md">
                          {song.cover_url ? (
                            <img
                              src={song.cover_url}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <Music className="w-3.5 h-3.5 text-amber-300/80" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className={`text-xs font-semibold truncate ${isCurrent ? "text-amber-300 font-bold" : "text-slate-100"}`}>
                            {song.title}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">{song.artist}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 ml-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(song.id);
                          }}
                          className="p-1 rounded-full text-slate-400 hover:text-rose-400 hover:bg-white/10 transition"
                          title="Favorite"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-rose-500 text-rose-500" : ""}`} />
                        </button>
                        <span className="text-[10px] font-mono text-slate-400">{fmtTime(song.duration || 0)}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Subtle Floating Equalizer Waves Bar on top of the pill */}
        {isPlaying && (
          <div className="flex items-center justify-center gap-1 mb-2">
            {[35, 60, 90, 45, 80, 100, 70, 40, 85, 55, 95, 30, 65, 85, 50].map((h, idx) => (
              <span
                key={idx}
                className="w-1 bg-amber-400/80 rounded-full animate-pulse transition-all duration-300"
                style={{
                  height: `${Math.max(6, (h * ((idx % 4) + 1)) % 22)}px`,
                  animationDelay: `${idx * 70}ms`,
                }}
              />
            ))}
          </div>
        )}

        <div
          className="relative backdrop-blur-2xl border border-white/20 rounded-full px-3.5 sm:px-4 py-2.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex items-center justify-between gap-2 sm:gap-3 transition-all duration-300"
          style={{ backgroundColor: playerBg }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none rounded-full" />

          {/* Left: Thumbnail, Title & Progress */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-black/40 border border-white/20 shrink-0 flex items-center justify-center shadow-md">
              {currentSong?.cover_url ? (
                <img src={currentSong.cover_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Music className="w-4 h-4 text-amber-300" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs sm:text-sm font-semibold text-white truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                  {currentSong?.title ?? (hasSongs ? "Select a track" : "No tracks available")}
                </p>
                {hasSongs && (
                  <span className="text-[10px] font-mono text-slate-300 shrink-0 tabular-nums">
                    {fmtTime(currentDisplayTime)} / {fmtTime(duration)}
                  </span>
                )}
              </div>

              <div
                role="slider"
                aria-label="Seek"
                aria-valuemin={0}
                aria-valuemax={duration || 0}
                aria-valuenow={currentDisplayTime}
                tabIndex={hasSongs ? 0 : -1}
                className="py-1.5 cursor-pointer relative group touch-none select-none"
                onPointerDown={handleSeekPointerDown}
                onPointerMove={handleSeekPointerMove}
                onPointerUp={handleSeekPointerUp}
                onPointerCancel={handleSeekPointerUp}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") seek(Math.min(duration, currentTime + 5));
                  if (e.key === "ArrowLeft") seek(Math.max(0, currentTime - 5));
                }}
              >
                {/* Track Background */}
                <div className="h-1.5 group-hover:h-2 bg-white/20 group-hover:bg-white/30 rounded-full transition-all relative overflow-visible">
                  {/* Progress Fill */}
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)] relative"
                    style={{ width: `${progress}%` }}
                  >
                    {/* Scrub Handle / Thumb Indicator */}
                    <div
                      className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-amber-300 border-2 border-slate-950 rounded-full shadow-lg transition-transform ${
                        isDraggingSeek ? "scale-125 ring-2 ring-amber-400" : "scale-0 group-hover:scale-100"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {/* Scene Queue / Playlist Button */}
            <button
              onClick={() => setShowPlaylist((v) => !v)}
              aria-label="Toggle playlist queue"
              className={`p-1.5 rounded-full transition ${
                showPlaylist
                  ? "text-amber-300 bg-amber-500/20"
                  : "text-slate-200 hover:text-white hover:bg-white/10"
              }`}
              title="Scene Queue"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            {/* Favorite Button */}
            <button
              onClick={() => toggleFavorite()}
              disabled={!currentSong}
              aria-label="Toggle Favorite"
              className="p-1.5 rounded-full text-slate-200 hover:text-white hover:bg-white/10 transition"
              title={isCurrentFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Heart
                className={`w-4 h-4 ${
                  isCurrentFavorite ? "fill-rose-500 text-rose-500" : "text-slate-300 hover:text-rose-400"
                }`}
              />
            </button>

            <button
              onClick={toggleShuffle}
              disabled={!hasSongs}
              aria-label="Toggle shuffle"
              aria-pressed={isShuffle}
              className={`hidden sm:inline-flex p-1.5 rounded-full transition disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
                isShuffle ? "text-amber-300 bg-amber-500/20" : "text-slate-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={prevTrack}
              disabled={!hasSongs}
              aria-label="Previous track"
              className="p-1.5 rounded-full text-slate-200 hover:text-white hover:bg-white/10 active:scale-90 transition disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              disabled={!hasSongs}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 flex items-center justify-center shadow-[0_0_16px_rgba(245,158,11,0.6)] hover:scale-105 active:scale-95 transition transform disabled:opacity-40 disabled:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              onClick={nextTrack}
              disabled={!hasSongs}
              aria-label="Next track"
              className="p-1.5 rounded-full text-slate-200 hover:text-white hover:bg-white/10 active:scale-90 transition disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={toggleRepeat}
              disabled={!hasSongs}
              aria-label="Toggle repeat mode"
              aria-pressed={repeatMode !== "off"}
              className={`hidden sm:inline-flex p-1.5 rounded-full transition disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
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
                aria-expanded={showVolume}
                aria-haspopup="true"
                className="p-1.5 rounded-full text-slate-200 hover:text-white hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
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
                      aria-label={isMuted ? "Unmute" : "Mute"}
                      className="text-amber-300 hover:text-amber-200 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 rounded-full"
                    >
                      <VolumeIcon className="w-4 h-4" />
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.02}
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
          </div>
        </div>
      </div>

      {/* ── VINTAGE CASSETTE PLAYER MODAL VIEW ── */}
      {showCassettePlayer && (
        <VintageCassettePlayer
          currentSong={currentSong}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          isShuffle={isShuffle}
          repeatMode={repeatMode}
          isFavorite={isCurrentFavorite}
          onTogglePlay={togglePlay}
          onPrevTrack={prevTrack}
          onNextTrack={nextTrack}
          onSeek={seek}
          onSetVolume={setVolume}
          onToggleMute={toggleMute}
          onToggleShuffle={toggleShuffle}
          onToggleRepeat={toggleRepeat}
          onToggleFavorite={() => toggleFavorite()}
          onClose={() => setShowCassettePlayer(false)}
        />
      )}
    </div>
  );
}