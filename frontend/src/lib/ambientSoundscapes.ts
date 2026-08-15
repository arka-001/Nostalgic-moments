/**
 * Multi-Layer Ambient Soundscape Audio Engine for Nostalgic Moments
 * Supports simultaneous multi-layer playback (Rain, Thunder, Bus Engine, Tea Stall,
 * Salon Scissors, Birds, Train Tracks, Car Engine, Road Noise) with individual volume faders,
 * mute/unmute, looping, and cinematic sleep timer fade-outs.
 */

export interface AmbientLayerConfig {
  id: string;
  name: string;
  category: string;
  defaultVolume: number;
  url?: string;
  iconName: string;
}

export const AVAILABLE_AMBIENT_LAYERS: AmbientLayerConfig[] = [
  {
    id: "rain",
    name: "Window Rain",
    category: "Weather",
    defaultVolume: 0.35,
    iconName: "CloudRain",
    url: "https://assets.mixkit.co/active_storage/sfx/1254/1254-preview.mp3",
  },
  {
    id: "thunder",
    name: "Distant Thunder",
    category: "Weather",
    defaultVolume: 0.25,
    iconName: "CloudLightning",
    url: "https://assets.mixkit.co/active_storage/sfx/1271/1271-preview.mp3",
  },
  {
    id: "bus_engine",
    name: "Vintage Bus Engine",
    category: "Travel",
    defaultVolume: 0.30,
    iconName: "Bus",
    url: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
  },
  {
    id: "tea_stall",
    name: "Boiling Kettle & Chai",
    category: "Urban",
    defaultVolume: 0.25,
    iconName: "Coffee",
    url: "https://assets.mixkit.co/active_storage/sfx/2418/2418-preview.mp3",
  },
  {
    id: "salon_scissors",
    name: "Salon Scissors & Hiss",
    category: "Urban",
    defaultVolume: 0.20,
    iconName: "Scissors",
    url: "https://assets.mixkit.co/active_storage/sfx/1655/1655-preview.mp3",
  },
  {
    id: "birds",
    name: "Morning Birds",
    category: "Nature",
    defaultVolume: 0.25,
    iconName: "Trees",
    url: "https://assets.mixkit.co/active_storage/sfx/2436/2436-preview.mp3",
  },
  {
    id: "train_tracks",
    name: "Rhythmic Train Tracks",
    category: "Travel",
    defaultVolume: 0.30,
    iconName: "Train",
    url: "https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3",
  },
  {
    id: "car_engine",
    name: "Midnight Car Ride",
    category: "Travel",
    defaultVolume: 0.25,
    iconName: "Car",
    url: "https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3",
  },
  {
    id: "road_noise",
    name: "Highway Road Ambience",
    category: "Travel",
    defaultVolume: 0.20,
    iconName: "Wind",
    url: "https://assets.mixkit.co/active_storage/sfx/1252/1252-preview.mp3",
  },
];

export interface LayerState {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
}

export type MultiLayerStateMap = Record<string, LayerState>;

class MultiLayerAmbientEngine {
  private audioInstances: Map<string, HTMLAudioElement> = new Map();
  private stateMap: MultiLayerStateMap = {};
  private masterVolume: number = 1.0;
  private listeners: Set<(state: MultiLayerStateMap) => void> = new Set();
  private fadeInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Initialize default states
    AVAILABLE_AMBIENT_LAYERS.forEach((layer) => {
      this.stateMap[layer.id] = {
        isPlaying: false,
        volume: layer.defaultVolume,
        isMuted: false,
      };
    });
  }

  private notify() {
    this.listeners.forEach((fn) => fn({ ...this.stateMap }));
  }

  public subscribe(callback: (state: MultiLayerStateMap) => void) {
    this.listeners.add(callback);
    callback({ ...this.stateMap });
    return () => {
      this.listeners.delete(callback);
    };
  }

  private getAudioInstance(layerId: string): HTMLAudioElement | null {
    if (typeof window === "undefined") return null;
    let audio = this.audioInstances.get(layerId);
    if (!audio) {
      const config = AVAILABLE_AMBIENT_LAYERS.find((l) => l.id === layerId);
      if (!config || !config.url) return null;
      audio = new Audio(config.url);
      audio.loop = true;
      audio.preload = "auto";
      this.audioInstances.set(layerId, audio);
    }
    return audio;
  }

  public toggleLayer(layerId: string) {
    const current = this.stateMap[layerId];
    if (!current) return;
    if (current.isPlaying) {
      this.stopLayer(layerId);
    } else {
      this.playLayer(layerId);
    }
  }

  public playLayer(layerId: string) {
    const state = this.stateMap[layerId];
    if (!state) return;
    const audio = this.getAudioInstance(layerId);
    if (!audio) return;

    state.isPlaying = true;
    const effectiveVol = state.isMuted ? 0 : state.volume * this.masterVolume;
    audio.volume = Math.max(0, Math.min(1, effectiveVol));
    audio.play().catch((e) => console.warn(`Ambient audio ${layerId} autoplay restricted:`, e));
    this.notify();
  }

  public stopLayer(layerId: string) {
    const state = this.stateMap[layerId];
    if (!state) return;
    const audio = this.audioInstances.get(layerId);
    if (audio) {
      try {
        audio.pause();
      } catch (_) {}
    }
    state.isPlaying = false;
    this.notify();
  }

  public setLayerVolume(layerId: string, volume: number) {
    const state = this.stateMap[layerId];
    if (!state) return;
    state.volume = Math.max(0, Math.min(1, volume));
    if (state.isMuted && volume > 0) {
      state.isMuted = false;
    }
    const audio = this.audioInstances.get(layerId);
    if (audio) {
      const effectiveVol = state.isMuted ? 0 : state.volume * this.masterVolume;
      audio.volume = Math.max(0, Math.min(1, effectiveVol));
    }
    this.notify();
  }

  public toggleLayerMute(layerId: string) {
    const state = this.stateMap[layerId];
    if (!state) return;
    state.isMuted = !state.isMuted;
    const audio = this.audioInstances.get(layerId);
    if (audio) {
      const effectiveVol = state.isMuted ? 0 : state.volume * this.masterVolume;
      audio.volume = Math.max(0, Math.min(1, effectiveVol));
    }
    this.notify();
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    AVAILABLE_AMBIENT_LAYERS.forEach((layer) => {
      const state = this.stateMap[layer.id];
      const audio = this.audioInstances.get(layer.id);
      if (state && audio) {
        const effectiveVol = state.isMuted ? 0 : state.volume * this.masterVolume;
        audio.volume = Math.max(0, Math.min(1, effectiveVol));
      }
    });
  }

  public stopAll() {
    if (this.fadeInterval) clearInterval(this.fadeInterval);
    this.audioInstances.forEach((audio) => {
      try {
        audio.pause();
      } catch (_) {}
    });
    AVAILABLE_AMBIENT_LAYERS.forEach((layer) => {
      if (this.stateMap[layer.id]) {
        this.stateMap[layer.id].isPlaying = false;
      }
    });
    this.notify();
  }

  /**
   * Smoothly fade all active ambient tracks to zero over specified seconds (Sleep Timer)
   */
  public fadeOutAll(durationSec: number = 15, onComplete?: () => void) {
    if (this.fadeInterval) clearInterval(this.fadeInterval);
    const steps = 30;
    const intervalMs = (durationSec * 1000) / steps;
    const startMaster = this.masterVolume;
    let stepCount = 0;

    this.fadeInterval = setInterval(() => {
      stepCount++;
      const factor = Math.max(0, 1 - stepCount / steps);
      this.setMasterVolume(startMaster * factor);

      if (stepCount >= steps) {
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        this.stopAll();
        this.setMasterVolume(1.0); // Reset for next session
        if (onComplete) onComplete();
      }
    }, intervalMs);
  }

  public getState(): MultiLayerStateMap {
    return { ...this.stateMap };
  }
}

export const multiAmbientEngine = typeof window !== "undefined" ? new MultiLayerAmbientEngine() : null;

// Legacy adapter for category-level initial soundscapes
export type AmbientType = "auto" | "bus" | "chai" | "salon" | "car_rain" | "train" | "vinyl" | "custom_url" | "off";

export const ambientEngine = {
  play: (type: AmbientType, customUrl?: string) => {
    if (!multiAmbientEngine) return;
    if (type === "off") {
      multiAmbientEngine.stopAll();
      return;
    }
    // Map legacy environment types to layer
    let targetLayer = "road_noise";
    if (type === "bus") targetLayer = "bus_engine";
    if (type === "chai") targetLayer = "tea_stall";
    if (type === "salon") targetLayer = "salon_scissors";
    if (type === "car_rain") targetLayer = "rain";
    if (type === "train") targetLayer = "train_tracks";

    multiAmbientEngine.playLayer(targetLayer);
  },
  setVolume: (vol: number) => {
    if (multiAmbientEngine) multiAmbientEngine.setMasterVolume(vol);
  },
  stop: () => {
    if (multiAmbientEngine) multiAmbientEngine.stopAll();
  },
  getStatus: () => ({
    isRunning: true,
    currentType: "auto" as AmbientType,
    currentVolume: 0.3,
  }),
};
