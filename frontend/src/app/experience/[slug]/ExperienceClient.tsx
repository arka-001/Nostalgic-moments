"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CategoryDetail } from "@/types";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { ambientEngine, AmbientType } from "@/lib/ambientSoundscapes";
import {
  ArrowLeft, Radio, Music, Play, Pause, SkipBack, SkipForward,
  Volume2, Volume1, VolumeX, Shuffle, Repeat, Repeat1, ListMusic, ChevronDown,
  Sparkles, Sliders, Wind, CloudRain, Coffee, Scissors, Train, Disc
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
  const [showAmbientControls, setShowAmbientControls] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [retroFilter, setRetroFilter] = useState(false);

  // Get environment-specific ambient preset (Admin customizable via CMS)
  const getCategoryAmbientConfig = () => {
    const adminType = category.theme_config?.ambient_sound_type;
    const adminName = category.theme_config?.ambient_sound_name;
    const adminDesc = category.theme_config?.ambient_sound_description;
    const adminUrl = category.theme_config?.ambient_sound_url;
    const adminVol = category.theme_config?.ambient_default_volume;

    const slug = category.slug.toLowerCase();
    let soundType: AmbientType = "vinyl";
    let defaultName = "Vintage Vinyl Warmth";
    let defaultDesc = "Warm analog vinyl needle & dust texture";
    let Icon = Disc;

    if (adminType && adminType !== "auto") {
      soundType = adminType;
      if (soundType === "bus") {
        defaultName = "Bus Engine & Road Breeze";
        defaultDesc = "Low-frequency engine hum & open-window air";
        Icon = Wind;
      } else if (soundType === "car_rain") {
        defaultName = "Rain on Windshield";
        defaultDesc = "Gentle rain on glass & quiet highway drone";
        Icon = CloudRain;
      } else if (soundType === "chai") {
        defaultName = "Chai Stall Atmosphere";
        defaultDesc = "Roadside chatter & warm kettle ambience";
        Icon = Coffee;
      } else if (soundType === "salon") {
        defaultName = "Salon Acoustics & Cassette";
        defaultDesc = "Vintage salon room tone & tape hiss";
        Icon = Scissors;
      } else if (soundType === "train") {
        defaultName = "Railway Platform & Tracks";
        defaultDesc = "Platform echoes & rhythmic track clicks";
        Icon = Train;
      } else if (soundType === "custom_url") {
        defaultName = "Custom Atmosphere Loop";
        defaultDesc = "Streaming custom ambient audio track";
        Icon = Music;
      } else if (soundType === "off") {
        defaultName = "Ambient Muted";
        defaultDesc = "Ambient sound disabled for this environment";
        Icon = VolumeX;
      }
    } else {
      if (slug.includes("bus")) {
        soundType = "bus";
        defaultName = "Bus Engine & Road Breeze";
        defaultDesc = "Low-frequency engine hum & open-window air";
        Icon = Wind;
      } else if (slug.includes("car")) {
        soundType = "car_rain";
        defaultName = "Rain on Windshield";
        defaultDesc = "Gentle rain on glass & quiet highway drone";
        Icon = CloudRain;
      } else if (slug.includes("tea") || slug.includes("chai")) {
        soundType = "chai";
        defaultName = "Chai Stall Atmosphere";
        defaultDesc = "Roadside chatter & warm kettle ambience";
        Icon = Coffee;
      } else if (slug.includes("salon")) {
        soundType = "salon";
        defaultName = "Salon Acoustics & Cassette";
        defaultDesc = "Vintage salon room tone & tape hiss";
        Icon = Scissors;
      } else if (slug.includes("train") || slug.includes("railway")) {
        soundType = "train";
        defaultName = "Railway Platform & Tracks";
        defaultDesc = "Platform echoes & rhythmic track clicks";
        Icon = Train;
      }
    }

    return {
      type: soundType,
      name: adminName && adminName.trim() ? adminName.trim() : defaultName,
      description: adminDesc && adminDesc.trim() ? adminDesc.trim() : defaultDesc,
      customUrl: adminUrl,
      defaultVolume: typeof adminVol === "number" ? adminVol / 100 : 0.25,
      icon: Icon,
      isOffByDefault: soundType === "off",
    };
  };

  const envAmbient = getCategoryAmbientConfig();
  const [ambientEnabled, setAmbientEnabled] = useState<boolean>(!envAmbient.isOffByDefault);
  const [ambientVolume, setAmbientVolume] = useState<number>(envAmbient.defaultVolume);

  // Initialize and clean up ambient audio specifically for this category
  useEffect(() => {
    if (ambientEngine) {
      if (ambientEnabled && envAmbient.type !== "off") {
        ambientEngine.play(envAmbient.type, envAmbient.customUrl);
        ambientEngine.setVolume(ambientVolume);
      } else {
        ambientEngine.stop();
      }
    }
    return () => {
      if (ambientEngine) {
        ambientEngine.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category.slug, ambientEnabled, envAmbient.type, envAmbient.customUrl]);

  const handleToggleAmbient = () => {
    const nextState = !ambientEnabled;
    setAmbientEnabled(nextState);
    if (ambientEngine) {
      if (nextState && envAmbient.type !== "off") {
        ambientEngine.play(envAmbient.type, envAmbient.customUrl);
        ambientEngine.setVolume(ambientVolume);
      } else {
        ambientEngine.stop();
      }
    }
  };


  const handleAmbientVolumeChange = (vol: number) => {
    setAmbientVolume(vol);
    if (ambientEngine && ambientEnabled) {
      ambientEngine.setVolume(vol);
    }
  };

  const hasSongs = category.songs.length > 0;


  const rawOpacity = category.theme_config?.player_transparency ?? 10;
  const playerOpacity = Math.min(90, Math.max(8, rawOpacity)) / 100;
  const playerBg = `rgba(0, 0, 0, ${playerOpacity})`;
  const playlistBg = `rgba(0, 0, 0, ${Math.max(0.15, playerOpacity)})`;

  const playlistRef = useRef<HTMLDivElement>(null);
  const volumeWrapRef = useRef<HTMLDivElement>(null);
  const ambientWrapRef = useRef<HTMLDivElement>(null);
  const activeTrackRef = useRef<HTMLDivElement>(null);
  const volumeCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      } else if (e.code === "Escape") {
        setShowPlaylist(false);
        setShowVolume(false);
        setShowAmbientControls(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPlaylist, showVolume, showAmbientControls, hasSongs, effectiveVolume]);

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

        {/* Center/Right Ambient Sound & Retro Atmosphere Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Retro Film Mode Switch */}
          <button
            onClick={() => setRetroFilter((v) => !v)}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono backdrop-blur-xl transition ${
              retroFilter
                ? "bg-amber-500/30 border-amber-400 text-amber-200 shadow-md shadow-amber-500/20"
                : "bg-black/25 border-white/20 text-slate-300 hover:text-white"
            }`}
            title="Toggle Retro Film Grain & Sepia Atmosphere"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Retro FX</span>
          </button>

          {/* Ambient Sound Popover Button */}
          <div ref={ambientWrapRef} className="relative">
            <button
              onClick={() => setShowAmbientControls((v) => !v)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono backdrop-blur-xl transition shadow-md ${
                ambientEnabled
                  ? "bg-amber-500/20 border-amber-400/50 text-amber-300"
                  : "bg-black/25 border-white/20 text-slate-300 hover:text-white"
              }`}
              title={`Configure ${envAmbient.name}`}
            >
              <envAmbient.icon className={`w-3.5 h-3.5 text-amber-400 ${ambientEnabled ? "animate-pulse" : ""}`} />
              <span className="hidden sm:inline">
                {ambientEnabled ? `${envAmbient.name}` : "Ambient: Off"}
              </span>
              <span className="sm:hidden">{ambientEnabled ? "Ambient On" : "Ambient Off"}</span>
            </button>

            {/* Environment-Specific Ambient Soundscape Drawer */}
            {showAmbientControls && (
              <div className="absolute right-0 top-10 mt-2 w-72 p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-300 font-mono flex items-center gap-1.5">
                    <envAmbient.icon className="w-3.5 h-3.5" /> {envAmbient.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {ambientEnabled ? `${Math.round(ambientVolume * 100)}% Vol` : "Muted"}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 font-sans mb-3 leading-relaxed">
                  {envAmbient.description}
                </p>

                {/* On / Off Toggle Switch */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 mb-3">
                  <span className="text-xs text-slate-200 font-medium">Ambient Audio</span>
                  <button
                    onClick={handleToggleAmbient}
                    className={`px-3 py-1 rounded-full text-xs font-mono font-semibold transition ${
                      ambientEnabled
                        ? "bg-amber-500 text-black shadow-sm"
                        : "bg-white/10 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {ambientEnabled ? "ENABLED" : "MUTED"}
                  </button>
                </div>

                {/* Ambient Volume Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-amber-400" /> Volume
                    </span>
                    <span>{Math.round(ambientVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={ambientEnabled ? ambientVolume : 0}
                    disabled={!ambientEnabled}
                    onChange={(e) => handleAmbientVolumeChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 accent-amber-400 bg-white/20 rounded-lg cursor-pointer disabled:opacity-30"
                  />
                </div>
              </div>
            )}
          </div>


          <div className="text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/25 border border-amber-400/30 text-amber-300 text-xs font-mono backdrop-blur-xl shadow-md">
              <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>{hasSongs ? (isPlaying ? "Live Scene" : "Paused") : "Scene Active"}</span>
            </div>
            <h1 className="text-base sm:text-2xl font-serif font-bold text-white mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] tracking-wide">
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
              Enjoy the ambient visuals of {category.name}. Add MP3 tracks to this environment via the Admin Portal to start streaming.
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
                className="text-slate-300 hover:text-white transition p-1 rounded-full hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
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
                      className={`flex items-center gap-3.5 px-4 py-2.5 rounded-2xl cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${isCurrent
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
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[94%] max-w-lg">
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
            <button
              onClick={toggleShuffle}
              disabled={!hasSongs}
              aria-label="Toggle shuffle"
              aria-pressed={isShuffle}
              className={`hidden sm:inline-flex p-1.5 rounded-full transition disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${isShuffle ? "text-amber-300 bg-amber-500/20" : "text-slate-200 hover:text-white hover:bg-white/10"
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
              className={`hidden sm:inline-flex p-1.5 rounded-full transition disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${repeatMode !== "off" ? "text-amber-300 bg-amber-500/20" : "text-slate-200 hover:text-white hover:bg-white/10"
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

            <button
              onClick={() => setShowPlaylist((v) => !v)}
              aria-label="Toggle playlist"
              aria-pressed={showPlaylist}
              className={`p-1.5 rounded-full transition border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${showPlaylist
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
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse, .animate-in { animation: none !important; }
        }
      `}</style>
    </div>
  );
}