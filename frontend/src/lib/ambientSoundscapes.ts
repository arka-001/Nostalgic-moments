/**
 * Procedural Web Audio Ambient Soundscapes for Nostalgic Moments
 * Generates continuous, realistic analog background textures (Bus rumble, rain, chai stall, salon scissors, station)
 * with zero network overhead.
 */

export type AmbientType = "bus" | "chai" | "salon" | "car_rain" | "train" | "vinyl" | "off";

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private nodes: (AudioNode | number)[] = [];
  private isRunning: boolean = false;
  private currentType: AmbientType = "off";
  private currentVolume: number = 0.25;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  private createNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error("No context");
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown / Pink noise approximation for warm organic textures
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    return buffer;
  }

  public setVolume(volume: number) {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.currentVolume, this.ctx.currentTime, 0.05);
    }
  }

  public stop() {
    this.nodes.forEach((node) => {
      if (typeof node === "number") {
        window.clearInterval(node);
      } else {
        try {
          if ("stop" in node && typeof (node as AudioScheduledSourceNode).stop === "function") {
            (node as AudioScheduledSourceNode).stop();
          }
          node.disconnect();
        } catch (_) {}
      }
    });
    this.nodes = [];
    this.isRunning = false;
    this.currentType = "off";
  }

  public play(type: AmbientType) {
    if (type === "off") {
      this.stop();
      return;
    }

    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.stop();
    this.currentType = type;
    this.isRunning = true;

    const noiseBuffer = this.createNoiseBuffer();

    switch (type) {
      case "bus": {
        // Deep engine lowpass rumble + highway breeze
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(140, this.ctx.currentTime);

        const osc = this.ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(48, this.ctx.currentTime); // 48Hz engine idle

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0.15, this.ctx.currentTime);

        noiseSource.connect(filter);
        filter.connect(this.masterGain);
        osc.connect(oscGain);
        oscGain.connect(this.masterGain);

        noiseSource.start();
        osc.start();
        this.nodes.push(noiseSource, filter, osc, oscGain);
        break;
      }

      case "car_rain": {
        // Raindrops on windshield + smooth night breeze
        const rainSource = this.ctx.createBufferSource();
        rainSource.buffer = noiseBuffer;
        rainSource.loop = true;

        const rainFilter = this.ctx.createBiquadFilter();
        rainFilter.type = "bandpass";
        rainFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
        rainFilter.Q.setValueAtTime(0.6, this.ctx.currentTime);

        const rumbleFilter = this.ctx.createBiquadFilter();
        rumbleFilter.type = "lowpass";
        rumbleFilter.frequency.setValueAtTime(120, this.ctx.currentTime);

        rainSource.connect(rainFilter);
        rainFilter.connect(this.masterGain);

        const rumbleSource = this.ctx.createBufferSource();
        rumbleSource.buffer = noiseBuffer;
        rumbleSource.loop = true;
        rumbleSource.connect(rumbleFilter);
        rumbleFilter.connect(this.masterGain);

        rainSource.start();
        rumbleSource.start();
        this.nodes.push(rainSource, rainFilter, rumbleSource, rumbleFilter);
        break;
      }

      case "chai": {
        // Roadside ambient murmur & warm hum
        const chaiSource = this.ctx.createBufferSource();
        chaiSource.buffer = noiseBuffer;
        chaiSource.loop = true;

        const chaiFilter = this.ctx.createBiquadFilter();
        chaiFilter.type = "bandpass";
        chaiFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
        chaiFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

        chaiSource.connect(chaiFilter);
        chaiFilter.connect(this.masterGain);
        chaiSource.start();
        this.nodes.push(chaiSource, chaiFilter);
        break;
      }

      case "salon": {
        // Room tone + subtle cassette tape hiss
        const hissSource = this.ctx.createBufferSource();
        hissSource.buffer = noiseBuffer;
        hissSource.loop = true;

        const hissFilter = this.ctx.createBiquadFilter();
        hissFilter.type = "highpass";
        hissFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);

        const hissGain = this.ctx.createGain();
        hissGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

        hissSource.connect(hissFilter);
        hissFilter.connect(hissGain);
        hissGain.connect(this.masterGain);
        hissSource.start();
        this.nodes.push(hissSource, hissFilter, hissGain);
        break;
      }

      case "train": {
        // Train track rhythm click-clack + platform low rumble
        const trackSource = this.ctx.createBufferSource();
        trackSource.buffer = noiseBuffer;
        trackSource.loop = true;

        const trainFilter = this.ctx.createBiquadFilter();
        trainFilter.type = "lowpass";
        trainFilter.frequency.setValueAtTime(160, this.ctx.currentTime);

        trackSource.connect(trainFilter);
        trainFilter.connect(this.masterGain);
        trackSource.start();

        // Rhythmic track accent pulse
        const trackPulseGain = this.ctx.createGain();
        trackPulseGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(65, this.ctx.currentTime);
        osc.connect(trackPulseGain);
        trackPulseGain.connect(this.masterGain);
        osc.start();

        let count = 0;
        const intervalId = window.setInterval(() => {
          if (!this.ctx || !this.isRunning) return;
          const now = this.ctx.currentTime;
          count++;
          const val = count % 2 === 0 ? 0.2 : 0.12;
          trackPulseGain.gain.cancelScheduledValues(now);
          trackPulseGain.gain.setValueAtTime(val, now);
          trackPulseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        }, 420);

        this.nodes.push(trackSource, trainFilter, osc, trackPulseGain, intervalId);
        break;
      }

      case "vinyl": {
        // Classic vinyl crackle & dust pops
        const vinylSource = this.ctx.createBufferSource();
        vinylSource.buffer = noiseBuffer;
        vinylSource.loop = true;

        const vinylFilter = this.ctx.createBiquadFilter();
        vinylFilter.type = "bandpass";
        vinylFilter.frequency.setValueAtTime(3000, this.ctx.currentTime);
        vinylFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

        const vinylGain = this.ctx.createGain();
        vinylGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

        vinylSource.connect(vinylFilter);
        vinylFilter.connect(vinylGain);
        vinylGain.connect(this.masterGain);
        vinylSource.start();
        this.nodes.push(vinylSource, vinylFilter, vinylGain);
        break;
      }
    }
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      currentType: this.currentType,
      currentVolume: this.currentVolume,
    };
  }
}

export const ambientEngine = typeof window !== "undefined" ? new AmbientAudioEngine() : null;
