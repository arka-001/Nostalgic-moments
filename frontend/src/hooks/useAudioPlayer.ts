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

// Global declaration for YouTube IFrame API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function useAudioPlayer(initialSongs: Song[] = []) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytPlayerReadyRef = useRef<boolean>(false);
  const ytPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const isCurrentSongYouTube = useCallback((song: Song | null): boolean => {
    if (!song) return false;
    return song.source_type === "youtube" || Boolean(song.youtube_video_id);
  }, []);

  // 1. Initialize HTML5 Audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (!isCurrentSongYouTube(currentSong)) {
        setCurrentTime(audio.currentTime);
      }
    };
    const handleLoadedMetadata = () => {
      if (!isCurrentSongYouTube(currentSong)) {
        setDuration(audio.duration || currentSong?.duration || 0);
      }
    };
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
  }, [currentSong, isCurrentSongYouTube]);

  // 2. Initialize YouTube IFrame Player API
  useEffect(() => {
    const containerId = "nostalgic-hidden-yt-player";
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = containerId;
      container.style.position = "fixed";
      container.style.width = "1px";
      container.style.height = "1px";
      container.style.top = "-1000px";
      container.style.left = "-1000px";
      container.style.opacity = "0.001";
      container.style.pointerEvents = "none";
      container.style.zIndex = "-1";
      document.body.appendChild(container);
    }

    const initYTPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      if (ytPlayerRef.current) return;

      ytPlayerRef.current = new window.YT.Player(containerId, {
        height: "100",
        width: "100",
        videoId: "",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (event: any) => {
            ytPlayerReadyRef.current = true;
            event.target.setVolume(Math.round(volume * 100));
            if (isMuted) {
              event.target.mute();
            }
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              const dur = event.target.getDuration();
              if (dur && dur > 0) setDuration(dur);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              if (handleTrackEndedRef.current) {
                handleTrackEndedRef.current();
              }
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initYTPlayer();
    } else {
      const existingScript = document.getElementById("youtube-iframe-api");
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.id = "youtube-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initYTPlayer();
      };
    }

    return () => {
      if (ytPollingRef.current) clearInterval(ytPollingRef.current);
    };
  }, [volume, isMuted]);

  // 3. YouTube Polling interval for currentTime and duration
  useEffect(() => {
    if (isCurrentSongYouTube(currentSong) && isPlaying) {
      ytPollingRef.current = setInterval(() => {
        if (ytPlayerRef.current && ytPlayerReadyRef.current) {
          try {
            const time = ytPlayerRef.current.getCurrentTime();
            if (typeof time === "number" && !isNaN(time)) {
              setCurrentTime(time);
            }
            const dur = ytPlayerRef.current.getDuration();
            if (typeof dur === "number" && dur > 0) {
              setDuration(dur);
            }
          } catch (_) {}
        }
      }, 300);
    } else {
      if (ytPollingRef.current) {
        clearInterval(ytPollingRef.current);
        ytPollingRef.current = null;
      }
    }

    return () => {
      if (ytPollingRef.current) {
        clearInterval(ytPollingRef.current);
        ytPollingRef.current = null;
      }
    };
  }, [currentSong, isPlaying, isCurrentSongYouTube]);

  // Generate shuffle sequence
  const buildShuffleSequence = useCallback((songs: Song[], startIdx: number): number[] => {
    if (songs.length === 0) return [];
    const otherIndices = songs.map((_, i) => i).filter((i) => i !== startIdx);
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
  }, [initialSongs, queue.length]);

  // 4. Load and play track when currentSong changes
  useEffect(() => {
    if (!currentSong) return;

    const isYT = isCurrentSongYouTube(currentSong);
    const videoId = currentSong.youtube_video_id;

    if (isYT && videoId) {
      // Pause HTML5 audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }

      setDuration(currentSong.duration || 0);
      setCurrentTime(0);

      const playYT = () => {
        if (ytPlayerRef.current && ytPlayerReadyRef.current) {
          try {
            ytPlayerRef.current.loadVideoById(videoId);
            ytPlayerRef.current.setVolume(Math.round(volume * 100));
            if (isMuted) ytPlayerRef.current.mute();
            else ytPlayerRef.current.unMute();

            if (isPlaying) {
              ytPlayerRef.current.playVideo();
            }
          } catch (e) {
            console.warn("YouTube play video error:", e);
          }
        } else {
          // Retry briefly if player is initializing
          setTimeout(playYT, 300);
        }
      };
      playYT();
    } else {
      // Pause YouTube player
      if (ytPlayerRef.current && ytPlayerReadyRef.current) {
        try {
          ytPlayerRef.current.stopVideo();
        } catch (_) {}
      }

      const audio = audioRef.current;
      if (audio && currentSong.audio_url) {
        audio.src = currentSong.audio_url;
        audio.volume = volume;
        audio.muted = isMuted;
        audio.load();
        setDuration(currentSong.duration || 0);
        setCurrentTime(0);

        if (isPlaying) {
          audio.play().catch((err) => console.warn("Audio autoplay blocked:", err));
        }
      }
    }
  }, [currentSong]); // eslint-disable-line react-hooks/exhaustive-deps

  // 5. Unified togglePlay
  const togglePlay = useCallback(() => {
    if (!currentSong) return;
    const isYT = isCurrentSongYouTube(currentSong);

    if (isYT) {
      if (ytPlayerRef.current && ytPlayerReadyRef.current) {
        try {
          if (isPlaying) {
            ytPlayerRef.current.pauseVideo();
            setIsPlaying(false);
          } else {
            ytPlayerRef.current.playVideo();
            setIsPlaying(true);
          }
        } catch (e) {
          console.warn("YouTube togglePlay error:", e);
        }
      }
    } else {
      const audio = audioRef.current;
      if (!audio) return;
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play().then(() => setIsPlaying(true)).catch((err) => console.warn("Play error:", err));
      }
    }
  }, [isPlaying, currentSong, isCurrentSongYouTube]);

  // 5b. Explicit pauseAudio
  const pauseAudio = useCallback(() => {
    setIsPlaying(false);
    if (isCurrentSongYouTube(currentSong)) {
      if (ytPlayerRef.current && ytPlayerReadyRef.current) {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch (e) {
          console.warn("YouTube pause error:", e);
        }
      }
    } else {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
      }
    }
  }, [currentSong, isCurrentSongYouTube]);

  // 5c. Smooth fade-out and pause (for sleep timer)
  const fadeOutAndPause = useCallback((durationSec: number = 10, onComplete?: () => void) => {
    const startVol = volume;
    const steps = 20;
    const intervalMs = Math.max(50, Math.floor((durationSec * 1000) / steps));
    let stepCount = 0;

    const fadeTimer = setInterval(() => {
      stepCount++;
      const factor = Math.max(0, 1 - stepCount / steps);
      const curVol = startVol * factor;

      if (audioRef.current) {
        audioRef.current.volume = curVol;
      }
      if (ytPlayerRef.current && ytPlayerReadyRef.current) {
        try {
          ytPlayerRef.current.setVolume(Math.round(curVol * 100));
        } catch (_) {}
      }

      if (stepCount >= steps) {
        clearInterval(fadeTimer);
        pauseAudio();
        // Restore volume back so next playback plays at normal volume
        setTimeout(() => {
          if (audioRef.current) audioRef.current.volume = startVol;
          if (ytPlayerRef.current && ytPlayerReadyRef.current) {
            try {
              ytPlayerRef.current.setVolume(Math.round(startVol * 100));
            } catch (_) {}
          }
          if (onComplete) onComplete();
        }, 300);
      }
    }, intervalMs);
  }, [volume, pauseAudio]);

  // 6. Unified playSong
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

  // 7. Unified seek
  const seek = useCallback((seconds: number) => {
    const target = Math.max(0, Math.min(seconds, duration || 1000));
    setCurrentTime(target);

    if (isCurrentSongYouTube(currentSong)) {
      if (ytPlayerRef.current && ytPlayerReadyRef.current) {
        try {
          ytPlayerRef.current.seekTo(target, true);
        } catch (_) {}
      }
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = target;
      }
    }
  }, [duration, currentSong, isCurrentSongYouTube]);

  // 8. Unified setVolume
  const setVolume = useCallback((val: number) => {
    const newVol = Math.max(0, Math.min(val, 1));
    setVolumeState(newVol);

    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
    if (ytPlayerRef.current && ytPlayerReadyRef.current) {
      try {
        ytPlayerRef.current.setVolume(Math.round(newVol * 100));
      } catch (_) {}
    }

    if (newVol > 0 && isMuted) {
      if (audioRef.current) audioRef.current.muted = false;
      if (ytPlayerRef.current && ytPlayerReadyRef.current) {
        try {
          ytPlayerRef.current.unMute();
        } catch (_) {}
      }
      setIsMuted(false);
    }
  }, [isMuted]);

  // 9. Unified toggleMute
  const toggleMute = useCallback(() => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);

    if (audioRef.current) {
      audioRef.current.muted = nextMute;
    }
    if (ytPlayerRef.current && ytPlayerReadyRef.current) {
      try {
        if (nextMute) ytPlayerRef.current.mute();
        else ytPlayerRef.current.unMute();
      } catch (_) {}
    }
  }, [isMuted]);

  // 10. Unified nextTrack
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

  // 11. Unified prevTrack
  const prevTrack = useCallback(() => {
    if (queue.length === 0) return;

    if (currentTime > 3) {
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
  }, [queue, currentIndex, isShuffle, shuffleOrder, shufflePointer, currentTime, seek]);

  // 12. Track Ended Handler
  const handleTrackEnded = useCallback(() => {
    if (repeatMode === "one") {
      seek(0);
      if (isCurrentSongYouTube(currentSong)) {
        if (ytPlayerRef.current && ytPlayerReadyRef.current) {
          try {
            ytPlayerRef.current.seekTo(0, true);
            ytPlayerRef.current.playVideo();
          } catch (_) {}
        }
      } else {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(console.error);
        }
      }
      return;
    }

    nextTrack();
  }, [repeatMode, nextTrack, seek, currentSong, isCurrentSongYouTube]);

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
    pauseAudio,
    pause: pauseAudio,
    fadeOutAndPause,
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
