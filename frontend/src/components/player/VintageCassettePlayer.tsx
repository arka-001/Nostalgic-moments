"use client";

import { useEffect, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  X,
  Disc,
  Radio,
  Sliders,
  Sparkles,
  Heart,
} from "lucide-react";
import { Song, RepeatMode } from "@/types";

interface VintageCassettePlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  isFavorite?: boolean;
  onTogglePlay: () => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  onSeek: (seconds: number) => void;
  onSetVolume: (volume: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleFavorite?: () => void;
  onClose: () => void;
}

export default function VintageCassettePlayer({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isShuffle,
  repeatMode,
  isFavorite = false,
  onTogglePlay,
  onPrevTrack,
  onNextTrack,
  onSeek,
  onSetVolume,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  onToggleFavorite,
  onClose,
}: VintageCassettePlayerProps) {
  const [cassetteSide, setCassetteSide] = useState<"A" | "B">("A");
  const [reelAngle, setReelAngle] = useState(0);

  // Rotate reels continuously when audio is playing
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const updateRotation = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (isPlaying) {
        setReelAngle((prev) => (prev + delta * 90) % 360);
      }
      animId = requestAnimationFrame(updateRotation);
    };

    animId = requestAnimationFrame(updateRotation);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const fmtTime = (s: number) => {
    if (!Number.isFinite(s) || s < 0) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const leftSpoolThickness = 18 + (1 - progressPct / 100) * 22; // Thicker tape on left at start
  const rightSpoolThickness = 18 + (progressPct / 100) * 22; // Thicker tape on right as it plays

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300 select-none">
      {/* Container Deck Box */}
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-stone-900 via-neutral-900 to-stone-950 border border-amber-900/40 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] space-y-6">
        {/* Top Metallic Deck Trim */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            <span className="text-xs font-mono uppercase tracking-widest text-amber-300 font-bold">
              NOSTALGIC STEREO CASSETTE DECK
            </span>
            <span className="text-[10px] font-mono text-slate-500 ml-1">MODEL NT-900</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Side A / Side B Selector */}
            <button
              onClick={() => setCassetteSide((s) => (s === "A" ? "B" : "A"))}
              className="px-2.5 py-1 rounded-md bg-stone-800 hover:bg-stone-700 border border-stone-700 text-[11px] font-mono text-amber-300 font-bold transition"
            >
              SIDE {cassetteSide}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-slate-400 hover:text-slate-200 transition"
              title="Close Cassette Mode"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── THE CASSETTE TAPE BODY ── */}
        <div className="relative w-full aspect-[16/10] max-h-[340px] bg-gradient-to-b from-neutral-800 via-stone-800 to-neutral-900 rounded-2xl border-4 border-stone-700 shadow-inner overflow-hidden p-4 sm:p-6 flex flex-col justify-between">
          {/* Metallic Corner Screws */}
          <div className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-stone-500 border border-stone-700 flex items-center justify-center text-[7px] text-stone-900 font-mono">
            +
          </div>
          <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-stone-500 border border-stone-700 flex items-center justify-center text-[7px] text-stone-900 font-mono">
            +
          </div>
          <div className="absolute bottom-2 left-2 w-2.5 h-2.5 rounded-full bg-stone-500 border border-stone-700 flex items-center justify-center text-[7px] text-stone-900 font-mono">
            +
          </div>
          <div className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full bg-stone-500 border border-stone-700 flex items-center justify-center text-[7px] text-stone-900 font-mono">
            +
          </div>

          {/* Cassette Label Area */}
          <div className="relative z-10 w-full h-[38%] bg-gradient-to-r from-amber-100 via-amber-50 to-orange-100 rounded-xl p-3 shadow-md border border-amber-200/80 flex flex-col justify-between text-stone-900">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold tracking-wider text-amber-900/90 border-b border-amber-900/20 pb-1">
              <span className="flex items-center gap-1">
                <Disc className="w-3 h-3 text-red-600" /> SIDE {cassetteSide}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-amber-800">
                HIGH FIDELITY • STEREO
              </span>
            </div>

            {/* Handwritten style song metadata */}
            <div className="flex items-center justify-between min-w-0">
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-bold font-serif text-stone-950 truncate tracking-wide">
                  {currentSong?.title || "Nostalgic Moments Track"}
                </h3>
                <p className="text-xs font-mono text-stone-700 truncate">
                  {currentSong?.artist || "Vintage Classic"}
                </p>
              </div>

              {onToggleFavorite && (
                <button
                  onClick={onToggleFavorite}
                  className="p-1.5 rounded-full hover:bg-black/10 transition ml-2 shrink-0"
                  title="Favorite Track"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isFavorite ? "fill-rose-500 text-rose-500" : "text-stone-700 hover:text-rose-500"
                    }`}
                  />
                </button>
              )}
            </div>
          </div>

          {/* ── ROTATING CASSETTE SPOOLS & TAPE WINDOW ── */}
          <div className="relative w-full h-[45%] bg-black/60 rounded-xl border border-stone-700/80 overflow-hidden flex items-center justify-between px-6 sm:px-12 shadow-inner">
            {/* Center Connecting Tape Bar */}
            <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 h-1 bg-stone-900 border-t border-b border-stone-800" />

            {/* Left Spool */}
            <div className="relative flex items-center justify-center">
              {/* Outer Tape Coil */}
              <div
                className="absolute rounded-full bg-stone-900 border border-stone-700 shadow-md transition-all duration-300"
                style={{ width: `${leftSpoolThickness * 2}px`, height: `${leftSpoolThickness * 2}px` }}
              />
              {/* Spinning White Gear Reel */}
              <div
                className="relative z-10 w-12 h-12 rounded-full bg-amber-50 border-2 border-stone-400 shadow flex items-center justify-center"
                style={{ transform: `rotate(${reelAngle}deg)` }}
              >
                <div className="w-4 h-4 rounded-full bg-stone-900 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-amber-300" />
                </div>
                {/* 6 Gear Spokes */}
                {[0, 60, 120, 180, 240, 300].map((deg) => (
                  <div
                    key={deg}
                    className="absolute w-1 h-2.5 bg-stone-400 rounded-sm"
                    style={{ transform: `rotate(${deg}deg) translateY(-14px)` }}
                  />
                ))}
              </div>
            </div>

            {/* Center Tape Counter & VU Bar */}
            <div className="relative z-10 flex flex-col items-center gap-1 font-mono text-[10px] text-amber-300/80 bg-stone-950/80 px-3 py-1.5 rounded-lg border border-stone-800">
              <span className="tabular-nums font-bold text-amber-400 tracking-wider">
                {String(Math.floor(currentTime)).padStart(3, "0")}
              </span>
              {/* Simulated VU Audio Meter */}
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => {
                  const active = isPlaying && ((Math.floor(currentTime * 3) + i) % 5 <= 3);
                  return (
                    <span
                      key={i}
                      className={`w-1.5 h-2.5 rounded-xs transition-all ${
                        active
                          ? i >= 4
                            ? "bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.8)]"
                            : "bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]"
                          : "bg-stone-800"
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Right Spool */}
            <div className="relative flex items-center justify-center">
              {/* Outer Tape Coil */}
              <div
                className="absolute rounded-full bg-stone-900 border border-stone-700 shadow-md transition-all duration-300"
                style={{ width: `${rightSpoolThickness * 2}px`, height: `${rightSpoolThickness * 2}px` }}
              />
              {/* Spinning White Gear Reel */}
              <div
                className="relative z-10 w-12 h-12 rounded-full bg-amber-50 border-2 border-stone-400 shadow flex items-center justify-center"
                style={{ transform: `rotate(${reelAngle}deg)` }}
              >
                <div className="w-4 h-4 rounded-full bg-stone-900 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-amber-300" />
                </div>
                {/* 6 Gear Spokes */}
                {[0, 60, 120, 180, 240, 300].map((deg) => (
                  <div
                    key={deg}
                    className="absolute w-1 h-2.5 bg-stone-400 rounded-sm"
                    style={{ transform: `rotate(${deg}deg) translateY(-14px)` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Trapezoid Cutout with Tape Rollers */}
          <div className="w-3/4 mx-auto h-3 bg-stone-900 rounded-t-lg border-t border-stone-700 flex items-center justify-between px-8">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-600" />
            <span className="w-2 h-1 bg-amber-500/60 rounded-full" />
            <span className="w-1.5 h-1.5 rounded-full bg-stone-600" />
          </div>
        </div>

        {/* ── MECHANICAL DECK CONTROLS & TIMELINE ── */}
        <div className="space-y-4 pt-2">
          {/* Seek Progress Bar */}
          <div className="space-y-1">
            <div className="relative flex items-center group">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition"
              />
            </div>
            <div className="flex justify-between text-xs font-mono text-amber-400/80">
              <span>{fmtTime(currentTime)}</span>
              <span>{fmtTime(duration)}</span>
            </div>
          </div>

          {/* Deck Button Bar */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {/* Left Controls: Shuffle & Repeat */}
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleShuffle}
                className={`p-2.5 rounded-xl border transition ${
                  isShuffle
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-stone-800 border-stone-700 text-stone-400 hover:text-slate-200"
                }`}
                title="Shuffle"
              >
                <Shuffle className="w-4 h-4" />
              </button>
              <button
                onClick={onToggleRepeat}
                className={`p-2.5 rounded-xl border transition ${
                  repeatMode !== "off"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-stone-800 border-stone-700 text-stone-400 hover:text-slate-200"
                }`}
                title="Repeat"
              >
                {repeatMode === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
              </button>
            </div>

            {/* Center Main Transport Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={onPrevTrack}
                className="p-3 rounded-2xl bg-stone-800 hover:bg-stone-700 active:scale-95 border border-stone-700 text-slate-200 shadow-md transition"
                title="Rewind / Previous Track"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={onTogglePlay}
                className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 transition"
                title={isPlaying ? "Pause Tape" : "Play Tape"}
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </button>

              <button
                onClick={onNextTrack}
                className="p-3 rounded-2xl bg-stone-800 hover:bg-stone-700 active:scale-95 border border-stone-700 text-slate-200 shadow-md transition"
                title="Fast Forward / Next Track"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Right Controls: Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleMute}
                className="p-2.5 rounded-xl bg-stone-800 border border-stone-700 text-amber-300 hover:bg-stone-700 transition"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={isMuted ? 0 : volume}
                onChange={(e) => onSetVolume(parseFloat(e.target.value))}
                className="w-20 sm:w-24 h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
