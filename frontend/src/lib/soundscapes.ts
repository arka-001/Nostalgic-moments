/**
 * Zero-dependency Procedural Ambient Soundscapes & Retro Audio Textures
 * Generated in real-time via Web Audio API.
 */

export type AmbientSoundType =
  | "off"
  | "bus_engine"
  | "salon_hum"
  | "tea_stall"
  | "rain_drive"
  | "railway_station"
  | "vinyl_crackle";

class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentType: AmbientSoundType = "off";
  private activeNodes: (AudioNode | number)[] = [];
  private vinylGain: GainNode | null = null;
  private isVinylActive: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  private stopAll() {
    this.activeNodes.forEach((item) => {
      if (typeof item === "number") {
        window.clearInterval(item);
      } else {
        try {
          if ("stop" in item && typeof (item as AudioScheduledSourceNode).stop === "function") {
            (item as AudioScheduledSourceNode).stop();
          }
          item.disconnect();
        } catch {
          // ignore disconnect errors
        }
      }
    });
    this.activeNodes = [];
  }

  /**
   * Set ambient environment soundscape type and volume
   */
  public setSoundscape(type: AmbientSoundType, volume: number = 0.3) {
    this.initContext();
    if (!this.ctx) return;

    if (this.currentType === type && this.masterGain) {
      this.setVolume(volume);
      return;
    }

    this.stopAll();
    this.currentType = type;

    if (type === "off" || volume <= 0) return;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
    this.activeNodes.push(this.masterGain);

    switch (type) {
      case "rain_drive":
        this.generateRainAndDrive(this.masterGain);
        break;
      case "bus_engine":
        this.generateBusEngine(this.masterGain);
        break;
      case "tea_stall":
        this.generateTeaStall(this.masterGain);
        break;
      case "salon_hum":
        this.generateSalon(this.masterGain);
        break;
      case "railway_station":
        this.generateRailway(this.masterGain);
        break;
      case "vinyl_crackle":
        this.generateVinylCrackle(this.masterGain);
        break;
    }
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      const vol = Math.max(0, Math.min(1, volume));
      this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1);
    }
  }

  /**
   * Toggle Vinyl Crackle & Tape Hiss overlay
   */
  public setVinylEffect(active: boolean, volume: number = 0.15) {
    this.initContext();
    if (!this.ctx) return;

    this.isVinylActive = active;

    if (!active) {
      if (this.vinylGain) {
        this.vinylGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      }
      return;
    }

    if (!this.vinylGain) {
      this.vinylGain = this.ctx.createGain();
      this.vinylGain.gain.setValueAtTime(volume, this.ctx.currentTime);
      this.vinylGain.connect(this.ctx.destination);
      this.generateVinylCrackle(this.vinylGain);
    } else {
      this.vinylGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.1);
    }
  }

  // --- Procedural Generators ---

  private createPinkNoise(): AudioNode {
    if (!this.ctx) throw new Error("No context");
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    whiteNoise.start(0);
    this.activeNodes.push(whiteNoise);
    return whiteNoise;
  }

  private generateRainAndDrive(destination: GainNode) {
    if (!this.ctx) return;

    // Rain sound (filtered pink noise)
    const pink = this.createPinkNoise();
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(850, this.ctx.currentTime);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    pink.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(destination);

    // Car road hum (low sine oscillator)
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(55, this.ctx.currentTime);

    const humGain = this.ctx.createGain();
    humGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    osc.connect(humGain);
    humGain.connect(destination);
    osc.start();

    this.activeNodes.push(filter, rainGain, osc, humGain);
  }

  private generateBusEngine(destination: GainNode) {
    if (!this.ctx) return;

    // Heavy low engine oscillation
    const osc1 = this.ctx.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(42, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(140, this.ctx.currentTime);

    const busGain = this.ctx.createGain();
    busGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    // Window wind noise
    const wind = this.createPinkNoise();
    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = "bandpass";
    windFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    windFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.15, this.ctx.currentTime);

    osc1.connect(filter);
    filter.connect(busGain);
    busGain.connect(destination);

    wind.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(destination);

    osc1.start();
    this.activeNodes.push(osc1, filter, busGain, windFilter, windGain);
  }

  private generateTeaStall(destination: GainNode) {
    if (!this.ctx) return;

    // Roadside ambient murmur
    const pink = this.createPinkNoise();
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(600, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    const stallGain = this.ctx.createGain();
    stallGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

    pink.connect(filter);
    filter.connect(stallGain);
    stallGain.connect(destination);

    this.activeNodes.push(filter, stallGain);
  }

  private generateSalon(destination: GainNode) {
    if (!this.ctx) return;

    // Ceiling fan hum with subtle LFO
    const fan = this.ctx.createOscillator();
    fan.type = "sine";
    fan.frequency.setValueAtTime(90, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(3, this.ctx.currentTime); // 3 Hz fan blade rotation

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    const fanGain = this.ctx.createGain();
    fanGain.gain.setValueAtTime(0.14, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(fanGain.gain);

    fan.connect(fanGain);
    fanGain.connect(destination);

    fan.start();
    lfo.start();
    this.activeNodes.push(fan, lfo, lfoGain, fanGain);
  }

  private generateRailway(destination: GainNode) {
    if (!this.ctx) return;

    // Deep rhythmic rail track rumble
    const trackOsc = this.ctx.createOscillator();
    trackOsc.type = "triangle";
    trackOsc.frequency.setValueAtTime(48, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(120, this.ctx.currentTime);

    const railGain = this.ctx.createGain();
    railGain.gain.setValueAtTime(0.22, this.ctx.currentTime);

    trackOsc.connect(filter);
    filter.connect(railGain);
    railGain.connect(destination);

    trackOsc.start();
    this.activeNodes.push(trackOsc, filter, railGain);
  }

  private generateVinylCrackle(destination: GainNode) {
    if (!this.ctx) return;

    const pink = this.createPinkNoise();
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(2000, this.ctx.currentTime);

    const hissGain = this.ctx.createGain();
    hissGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    pink.connect(filter);
    filter.connect(hissGain);
    hissGain.connect(destination);

    // Random pops & clicks
    const interval = window.setInterval(() => {
      if (!this.ctx || Math.random() > 0.45) return;
      try {
        const osc = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();
        osc.frequency.setValueAtTime(1000 + Math.random() * 4000, this.ctx.currentTime);
        clickGain.gain.setValueAtTime(0.06 + Math.random() * 0.08, this.ctx.currentTime);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);
        osc.connect(clickGain);
        clickGain.connect(destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
      } catch {
        // ignore
      }
    }, 180);

    this.activeNodes.push(filter, hissGain, interval);
  }

  public getCategorySoundscapeType(slug: string): AmbientSoundType {
    switch (slug) {
      case "running-bus":
        return "bus_engine";
      case "sathi-salon":
        return "salon_hum";
      case "tea-stall":
        return "tea_stall";
      case "running-car":
        return "rain_drive";
      case "railway-station":
        return "railway_station";
      default:
        return "rain_drive";
    }
  }
}

export const soundscapeEngine = typeof window !== "undefined" ? new SoundscapeEngine() : null;
