"use client";

import { useState } from "react";
import { Song, RepeatMode } from "@/types";
import { formatTime } from "@/lib/utils";
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
  ListMusic,
  Maximize2,
  Minimize2,
  Keyboard,
  Radio,
  Disc,
  Volume1,
  Sparkles,
} from "lucide-react";

interface EnvironmentalPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  queue: Song[];
  currentIndex: number;
  isFullscreen: boolean;
  playerSkin?: string;
  categoryName?: string;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onSetVolume: (vol: number) => void;
  onToggleMute: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleFullscreen: () => void;
  onSelectQueueSong: (song: Song) => void;
}

export default function EnvironmentalPlayer({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isShuffle,
  repeatMode,
  queue,
  currentIndex,
  isFullscreen,
  playerSkin = "retro_bus_radio",
  categoryName = "Nostalgic Experience",
  onTogglePlay,
  onSeek,
  onSetVolume,
  onToggleMute,
  onNextTrack,
  onPrevTrack,
  onToggleShuffle,
  onToggleRepeat,
  onToggleFullscreen,
  onSelectQueueSong,
}: EnvironmentalPlayerProps) {
  const [showQueue, setShowQueue] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  if (!currentSong) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 font-serif">
        <Radio className="w-8 h-8 text-amber-500/50 mx-auto mb-2 animate-pulse" />
        No audio track loaded in this environment playlist.
      </div>
    );
  }

  // Determine skin styles
  const isBusRadio = playerSkin === "retro_bus_radio";
  const isCassette = playerSkin === "retro_cassette_deck";
  const isTransistor = playerSkin === "transistor_radio";
  const isDashboard = playerSkin === "vintage_dashboard";

  return (
    <div
      className={`relative transition-all duration-500 z-30 ${
        isFullscreen
          ? "fixed inset-0 bg-slate-950/95 flex items-center justify-center p-6 backdrop-blur-2xl"
          : "w-full max-w-4xl mx-auto"
      }`}
    >
      {/* Player Wrapper Container */}
      <div
        className={`w-full rounded-3xl p-6 sm:p-8 backdrop-blur-xl border shadow-2xl relative overflow-hidden transition-all duration-300 ${
          isBusRadio
            ? "bg-gradient-to-br from-stone-900/90 via-amber-950/40 to-stone-950/90 border-amber-500/30 shadow-amber-950/50"
            : isCassette
            ? "bg-gradient-to-br from-emerald-950/80 via-slate-900/90 to-emerald-950/80 border-emerald-500/30 shadow-emerald-950/50"
            : isTransistor
            ? "bg-gradient-to-br from-orange-950/80 via-stone-900/90 to-orange-950/80 border-orange-500/30 shadow-orange-950/50"
            : isDashboard
            ? "bg-gradient-to-br from-blue-950/80 via-slate-900/90 to-blue-950/80 border-blue-500/30 shadow-blue-950/50"
            : "bg-gradient-to-br from-purple-950/80 via-slate-900/90 to-purple-950/80 border-purple-500/30 shadow-purple-950/50"
        }`}
      >
        {/* Environmental Accent Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
            <div>
              <span className="text-xs uppercase tracking-widest text-amber-400 font-mono">
                {categoryName} • Audio Deck
              </span>
              <h3 className="text-sm font-semibold text-slate-200">
                {isBusRadio
                  ? "Vintage Roadways Bus Radio"
                  : isCassette
                  ? "Sathi Salon Cassette Deck"
                  : isTransistor
                  ? "Roadside Chai Transistor"
                  : isDashboard
                  ? "Midnight Drive Stereo"
                  : "Platform Announcer System"}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShortcuts((v) => !v)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition text-xs flex items-center gap-1.5 border border-white/10"
              title="Keyboard Shortcuts"
            >
              <Keyboard className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Keys</span>
            </button>
            <button
              onClick={() => setShowQueue((v) => !v)}
              className={`p-2 rounded-xl text-slate-300 transition text-xs flex items-center gap-1.5 border ${
                showQueue
                  ? "bg-amber-500 text-black border-amber-400"
                  : "bg-white/5 hover:bg-white/10 border-white/10"
              }`}
              title="Queue Playlist"
            >
              <ListMusic className="w-4 h-4" />
              <span className="hidden sm:inline">
                Queue ({currentIndex + 1}/{queue.length})
              </span>
            </button>
            <button
              onClick={onToggleFullscreen}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition border border-white/10"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-amber-400" />
              ) : (
                <Maximize2 className="w-4 h-4 text-amber-400" />
              )}
            </button>
          </div>
        </div>

        {/* Main Center Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Artwork & Animated Cassette / Reel */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="relative group w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900 flex items-center justify-center">
              {currentSong.cover_url ? (
                <img
                  src={currentSong.cover_url}
                  alt={currentSong.title}
                  className={`w-full h-full object-cover transition duration-700 ${
                    isPlaying ? "scale-105" : "scale-100 opacity-90"
                  }`}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-950 to-slate-950 p-4 text-center">
                  <Disc
                    className={`w-20 h-20 text-amber-500/80 mb-2 ${
                      isPlaying ? "animate-spin" : ""
                    }`}
                    style={{ animationDuration: "8s" }}
                  />
                  <span className="text-xs text-amber-300 font-serif">Nostalgic Classics</span>
                </div>
              )}

              {/* Animated Reel Overlay */}
              <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                <Disc
                  className={`w-24 h-24 text-amber-400/30 ${
                    isPlaying ? "animate-spin" : ""
                  }`}
                  style={{ animationDuration: "12s" }}
                />
              </div>
            </div>

            {/* Audio Visualizer Waves when playing */}
            <div className="flex items-center gap-1.5 mt-4 h-6">
              {[40, 70, 30, 90, 50, 80, 60, 100, 45, 85, 35, 75].map((height, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-300 ${
                    isPlaying ? "bg-amber-400 animate-pulse" : "bg-white/20 h-2"
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(10, (height * (i % 3 + 1)) % 100)}%` : "8px",
                    animationDelay: `${i * 80}ms`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Controls & Track Information */}
          <div className="md:col-span-7 space-y-6">
            {/* Song Meta Header */}
            <div className="space-y-1 text-center md:text-left">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Track #{currentIndex + 1}
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100 tracking-tight line-clamp-1">
                {currentSong.title}
              </h2>
              <p className="text-slate-300 font-sans text-base">
                {currentSong.artist}
                {currentSong.album && (
                  <span className="text-slate-400 text-sm"> • {currentSong.album}</span>
                )}
              </p>
            </div>

            {/* Seek Slider & Timers */}
            <div className="space-y-2">
              <div className="relative flex items-center group">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition"
                />
              </div>
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-2">
              {/* Shuffle Button */}
              <button
                onClick={onToggleShuffle}
                className={`p-2.5 rounded-full border transition ${
                  isShuffle
                    ? "bg-amber-500 text-black border-amber-400"
                    : "bg-white/5 hover:bg-white/10 text-slate-400 border-white/10"
                }`}
                title="Shuffle Queue"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              {/* Prev Track */}
              <button
                onClick={onPrevTrack}
                className="p-3 rounded-full bg-white/5 hover:bg-white/15 text-slate-200 transition border border-white/10"
                title="Previous Track"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              {/* Main Play/Pause Button */}
              <button
                onClick={onTogglePlay}
                className="p-5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 transition transform hover:scale-105 shadow-xl shadow-amber-500/20"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 fill-current" />
                ) : (
                  <Play className="w-7 h-7 fill-current ml-0.5" />
                )}
              </button>

              {/* Next Track */}
              <button
                onClick={onNextTrack}
                className="p-3 rounded-full bg-white/5 hover:bg-white/15 text-slate-200 transition border border-white/10"
                title="Next Track"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              {/* Repeat Button */}
              <button
                onClick={onToggleRepeat}
                className={`p-2.5 rounded-full border transition ${
                  repeatMode !== "off"
                    ? "bg-amber-500 text-black border-amber-400"
                    : "bg-white/5 hover:bg-white/10 text-slate-400 border-white/10"
                }`}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === "one" ? (
                  <Repeat1 className="w-4 h-4" />
                ) : (
                  <Repeat className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onToggleMute}
                className="text-slate-400 hover:text-amber-400 transition"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-rose-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => onSetVolume(parseFloat(e.target.value))}
                className="w-32 sm:w-40 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <span className="text-xs font-mono text-slate-400 w-8">
                {isMuted ? "0%" : `${Math.round(volume * 100)}%`}
              </span>
            </div>
          </div>
        </div>

        {/* Playlist Queue Drawer Modal */}
        {showQueue && (
          <div className="mt-8 border-t border-white/10 pt-6 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-amber-200 flex items-center gap-2 font-serif">
                <ListMusic className="w-4 h-4 text-amber-400" /> Environment Playlist ({queue.length} tracks)
              </h4>
              <button
                onClick={() => setShowQueue(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Close Queue
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
              {queue.map((song, idx) => {
                const isSelected = song.id === currentSong.id;
                return (
                  <div
                    key={song.id}
                    onClick={() => onSelectQueueSong(song)}
                    className={`flex items-center justify-between p-3 rounded-xl transition cursor-pointer border ${
                      isSelected
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-200"
                        : "bg-white/5 hover:bg-white/10 border-transparent text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-400 w-5">
                        {idx + 1}.
                      </span>
                      <div>
                        <div className="text-sm font-medium line-clamp-1">{song.title}</div>
                        <div className="text-xs text-slate-400">{song.artist}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-xs font-mono text-amber-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 animate-spin" /> Playing
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Hint Overlay */}
        {showShortcuts && (
          <div className="mt-8 border-t border-white/10 pt-6 text-xs text-slate-300 space-y-3">
            <div className="flex justify-between items-center text-amber-300 font-semibold font-serif">
              <span>Keyboard Shortcuts</span>
              <button onClick={() => setShowShortcuts(false)} className="text-slate-400">
                Dismiss
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
              <div className="bg-slate-900/60 p-2 rounded border border-white/5">
                <kbd className="text-amber-400">Space</kbd> Play / Pause
              </div>
              <div className="bg-slate-900/60 p-2 rounded border border-white/5">
                <kbd className="text-amber-400">← / →</kbd> Seek ±5s
              </div>
              <div className="bg-slate-900/60 p-2 rounded border border-white/5">
                <kbd className="text-amber-400">↑ / ↓</kbd> Volume ±10%
              </div>
              <div className="bg-slate-900/60 p-2 rounded border border-white/5">
                <kbd className="text-amber-400">M</kbd> Mute
              </div>
              <div className="bg-slate-900/60 p-2 rounded border border-white/5">
                <kbd className="text-amber-400">S</kbd> Shuffle
              </div>
              <div className="bg-slate-900/60 p-2 rounded border border-white/5">
                <kbd className="text-amber-400">R</kbd> Repeat
              </div>
              <div className="bg-slate-900/60 p-2 rounded border border-white/5">
                <kbd className="text-amber-400">F</kbd> Fullscreen
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
