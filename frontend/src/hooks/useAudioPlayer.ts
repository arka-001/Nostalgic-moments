"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Song, RepeatMode } from "@/types";

/** Helper: Fisher-Yates array shuffle */
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function useAudioPlayer(initialSongs: Song[] = []) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [queue, setQueue] = useState<Song[]>(initialSongs);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentSong, setCurrentSong] = useState<Song | null>(initialSongs[0] || null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Shuffle order state
  const [shuffleOrder, setShuffleOrder] = useState<number[]>([]);
  const [shufflePointer, setShufflePointer] = useState<number>(0);

  // Ref to always hold latest track ended handler (prevents stale closure)
  const handleTrackEndedRef = useRef<() => void>(() => {});

  // Initialize HTML5 Audio object
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      if (handleTrackEndedRef.current) {
        handleTrackEndedRef.current();
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  // Generate shuffle sequence with currently active track at index 0
  const buildShuffleSequence = useCallback((songs: Song[], startIdx: number): number[] => {
    if (songs.length === 0) return [];
    const otherIndices = songs
      .map((_, i) => i)
      .filter((i) => i !== startIdx);
    const shuffledOthers = shuffleArray(otherIndices);
    return [startIdx, ...shuffledOthers];
  }, []);

  // Sync queue if initialSongs changes
  useEffect(() => {
    if (initialSongs.length > 0 && queue.length === 0) {
      setQueue(initialSongs);
      setCurrentIndex(0);
      setCurrentSong(initialSongs[0]);
    }
  }, [initialSongs]);

  // Load and play track when currentSong changes
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;

    const audio = audioRef.current;
    if (currentSong.audio_url) {
      audio.src = currentSong.audio_url;
      audio.load();
      if (isPlaying) {
        audio.play().catch((err) => console.warn("Audio autoplay blocked:", err));
      }
    }
  }, [currentSong]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentSong) return;
    const audio = audioRef.current;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch((err) => console.warn("Play error:", err));
    }
  }, [isPlaying, currentSong]);

  const playSong = useCallback((song: Song, newQueue?: Song[]) => {
    const activeQueue = newQueue || queue;
    if (newQueue) {
      setQueue(newQueue);
    }
    const idx = activeQueue.findIndex((s) => s.id === song.id);
    const validIdx = idx >= 0 ? idx : 0;

    setCurrentIndex(validIdx);
    setCurrentSong(song);
    setIsPlaying(true);

    if (isShuffle) {
      const order = buildShuffleSequence(activeQueue, validIdx);
      setShuffleOrder(order);
      setShufflePointer(0);
    }
  }, [queue, isShuffle, buildShuffleSequence]);

  const seek = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    const target = Math.max(0, Math.min(seconds, duration));
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  }, [duration]);

  const setVolume = useCallback((val: number) => {
    if (!audioRef.current) return;
    const newVol = Math.max(0, Math.min(val, 1));
    audioRef.current.volume = newVol;
    setVolumeState(newVol);
    if (newVol > 0 && isMuted) {
      audioRef.current.muted = false;
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    const nextMute = !isMuted;
    audioRef.current.muted = nextMute;
    setIsMuted(nextMute);
  }, [isMuted]);

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;

    if (isShuffle) {
      let activeOrder = shuffleOrder;
      if (activeOrder.length !== queue.length) {
        activeOrder = buildShuffleSequence(queue, currentIndex);
        setShuffleOrder(activeOrder);
      }

      const nextPtr = shufflePointer + 1;
      if (nextPtr < activeOrder.length) {
        const targetIdx = activeOrder[nextPtr];
        setShufflePointer(nextPtr);
        setCurrentIndex(targetIdx);
        setCurrentSong(queue[targetIdx]);
        setIsPlaying(true);
      } else {
        // Finished full shuffle pass
        if (repeatMode === "off") {
          setIsPlaying(false);
        } else {
          // Reshuffle for next loop
          const newOrder = buildShuffleSequence(queue, activeOrder[activeOrder.length - 1]);
          setShuffleOrder(newOrder);
          setShufflePointer(1 < newOrder.length ? 1 : 0);
          const targetIdx = newOrder[1 < newOrder.length ? 1 : 0];
          setCurrentIndex(targetIdx);
          setCurrentSong(queue[targetIdx]);
          setIsPlaying(true);
        }
      }
      return;
    }

    // Normal sequential next
    const nextIdx = (currentIndex + 1) % queue.length;
    if (repeatMode === "off" && currentIndex === queue.length - 1) {
      setIsPlaying(false);
      return;
    }
    setCurrentIndex(nextIdx);
    setCurrentSong(queue[nextIdx]);
    setIsPlaying(true);
  }, [queue, currentIndex, isShuffle, shuffleOrder, shufflePointer, repeatMode, buildShuffleSequence]);

  const prevTrack = useCallback(() => {
    if (queue.length === 0) return;

    if (audioRef.current && audioRef.current.currentTime > 3) {
      seek(0);
      return;
    }

    if (isShuffle && shuffleOrder.length > 0) {
      const prevPtr = Math.max(0, shufflePointer - 1);
      setShufflePointer(prevPtr);
      const targetIdx = shuffleOrder[prevPtr];
      setCurrentIndex(targetIdx);
      setCurrentSong(queue[targetIdx]);
      setIsPlaying(true);
      return;
    }

    const prevIdx = (currentIndex - 1 + queue.length) % queue.length;
    setCurrentIndex(prevIdx);
    setCurrentSong(queue[prevIdx]);
    setIsPlaying(true);
  }, [queue, currentIndex, isShuffle, shuffleOrder, shufflePointer, seek]);

  const handleTrackEnded = useCallback(() => {
    if (repeatMode === "one" && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
      return;
    }

    nextTrack();
  }, [repeatMode, nextTrack]);

  // Keep ref synchronized with latest handleTrackEnded handler
  useEffect(() => {
    handleTrackEndedRef.current = handleTrackEnded;
  }, [handleTrackEnded]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => {
      const nextShuffle = !prev;
      if (nextShuffle && queue.length > 0) {
        const order = buildShuffleSequence(queue, currentIndex);
        setShuffleOrder(order);
        setShufflePointer(0);
      }
      return nextShuffle;
    });
  }, [queue, currentIndex, buildShuffleSequence]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === "off") return "all";
      if (prev === "all") return "one";
      return "off";
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seek(currentTime - 5);
          break;
        case "ArrowRight":
          e.preventDefault();
          seek(currentTime + 5);
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume(volume + 0.1);
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume(volume - 0.1);
          break;
        case "KeyM":
          toggleMute();
          break;
        case "KeyS":
          toggleShuffle();
          break;
        case "KeyR":
          toggleRepeat();
          break;
        case "KeyF":
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, seek, currentTime, setVolume, volume, toggleMute, toggleShuffle, toggleRepeat, toggleFullscreen]);

  return {
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
    togglePlay,
    playSong,
    seek,
    setVolume,
    toggleMute,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleRepeat,
    toggleFullscreen,
  };
}
