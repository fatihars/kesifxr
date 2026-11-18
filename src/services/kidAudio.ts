import type {SurfaceKind} from '../types.ts';

const AMBIENT_MUSIC_URL = import.meta.env.BASE_URL + 'assets/aistudio/muzeambiyans_a9e15581.mp3';
const DIRECTOR_AUDIO_URL = import.meta.env.BASE_URL + 'assets/aistudio/m_d_rmetni_c699eb03.wav';
const SAZ_SONG_URL = import.meta.env.BASE_URL + 'assets/aistudio/kad_nsaz_19889d68.mp3';
const NEY_SONGS = [
  import.meta.env.BASE_URL + 'assets/aistudio/neysesi_edf76f6e.mp3',
  import.meta.env.BASE_URL + 'assets/aistudio/neysesi2_e4cbf148.mp3',
];
const MASAL_AUDIO_URL = import.meta.env.BASE_URL + 'assets/aistudio/masal1_706f5c13.mp3';
const MASAL_AUDIO_FALLBACK_URL = 'https://cocuk.mirasium.org/assets/aistudio/masal1_706f5c13.wav';

const AMBIENT_NORMAL_VOLUME = 0.22;
const AMBIENT_DUCKED_VOLUME = 0.06;
const AMBIENT_OUTDOOR_MAX = 0.055;
const SAZ_MAX_VOLUME = 0.78;
const SAZ_MAX_DISTANCE = 25.0;
const SEMA_MAX_VOLUME = 0.78;
const SEMA_MAX_DISTANCE = 27.0;
const MASAL_MAX_VOLUME = 0.94;
const MASAL_ENTER_RADIUS = 6.6;
const MASAL_UI_RADIUS = 10.5;
const MASAL_MAX_DISTANCE = 19.0;

class KidAudioManager {
  private ctx: AudioContext | null = null;
  private effectsOut?: GainNode;
  private quietInterior = false;
  private isSpeaking = false;

  private ambientAudio: HTMLAudioElement | null = null;
  private sazAudio: HTMLAudioElement | null = null;
  private sazManuallyPaused = false;
  private sazExcludedHere = false;
  private distToSazPlayer = 40;

  private semaAudio: HTMLAudioElement | null = null;
  private semaTrackIndex = 0;
  private semaManuallyPaused = false;
  private distToSemaStage = 45;

  private masalAudio: HTMLAudioElement | null = null;
  private masalManuallyPaused = false;
  private masalInZone = false;
  private distToMasalArea = 45;

  private isInsideMuseum = false;
  private isNight = false;
  private isRaining = false;
  private ambientMuted = false;
  private resumeOnGestureBound = false;
  private distFromEntrance = 11.5;
  private distToFountain = 20;

  private outdoorTimer: number | null = null;
  private rainNoiseNode: AudioBufferSourceNode | null = null;
  private rainGainNode: GainNode | null = null;
  private rainFilterNode: BiquadFilterNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private directorAudio: HTMLAudioElement | null = null;
  private hodjaAudio?: HTMLAudioElement;
  private directorPlaying = false;
  private directorStateCb?: (speaking: boolean) => void;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as {webkitAudioContext?: typeof AudioContext})
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.effectsOut = this.ctx.createGain();
        this.effectsOut.gain.value = this.quietInterior ? 0 : 1;
        this.effectsOut.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private ensureNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) {
      return this.noiseBuffer;
    }
    const len = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      // Soft pink-ish noise
      data[i] = (lastOut + 0.08 * white) / 1.08;
      lastOut = data[i];
      data[i] *= 2.4;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  private ensureAmbientAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.ambientAudio) {
      const audio = new Audio(AMBIENT_MUSIC_URL);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0;
      this.ambientAudio = audio;
    }
    return this.ambientAudio;
  }

  private ensureSazAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.sazAudio) {
      const audio = new Audio(SAZ_SONG_URL);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0;
      this.sazAudio = audio;
    }
    return this.sazAudio;
  }

  private ensureSemaAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.semaAudio) {
      const audio = new Audio(NEY_SONGS[this.semaTrackIndex]);
      audio.loop = false;
      audio.preload = 'auto';
      audio.volume = 0;
      audio.onended = () => {
        this.advanceSemaTrack();
      };
      this.semaAudio = audio;
    }
    return this.semaAudio;
  }

  private advanceSemaTrack(): void {
    if (!this.semaAudio) return;
    this.semaTrackIndex = (this.semaTrackIndex + 1) % NEY_SONGS.length;
    this.semaAudio.src = NEY_SONGS[this.semaTrackIndex];
    this.semaAudio.load();
    const targetVol = this.computeTargetSemaVolume();
    if (!this.ambientMuted && !this.semaManuallyPaused && targetVol > 0) {
      this.semaAudio.volume = targetVol;
      void this.semaAudio.play().catch(() => {
        this.bindGestureResume();
      });
    }
  }

  private bindGestureResume(): void {
    if (typeof window === 'undefined' || this.resumeOnGestureBound) return;
    this.resumeOnGestureBound = true;
    const tryResume = () => {
      this.resumeOnGestureBound = false;
      window.removeEventListener('pointerdown', tryResume);
      window.removeEventListener('touchstart', tryResume);
      window.removeEventListener('keydown', tryResume);
      this.ensureContext();
      if (!this.ambientMuted) {
        void this.startAmbientIfNeeded();
        void this.startSazIfNeeded();
        void this.startSemaIfNeeded();
        void this.startMasalIfNeeded();
      }
      this.updateRainAudio();
    };
    window.addEventListener('pointerdown', tryResume, {once: true});
    window.addEventListener('touchstart', tryResume, {once: true, passive: true});
    window.addEventListener('keydown', tryResume, {once: true});
  }

  private ensureMasalAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.masalAudio) {
      const audio = new Audio(MASAL_AUDIO_URL);
      audio.loop = false;
      audio.preload = 'auto';
      audio.volume = MASAL_MAX_VOLUME;
      let triedFallback = false;
      audio.onerror = () => {
        if (triedFallback) return;
        triedFallback = true;
        audio.src = MASAL_AUDIO_FALLBACK_URL;
        audio.load();
        if (!this.ambientMuted && !this.masalManuallyPaused && this.masalInZone) {
          void audio.play().catch(() => this.bindGestureResume());
        }
      };
      audio.onended = () => {
        this.masalManuallyPaused = true;
        this.updateAmbientVolume();
      };
      this.masalAudio = audio;
    }
    return this.masalAudio;
  }

  private computeTargetMasalVolume(): number {
    if (this.quietInterior) return 0;
    if (
      this.ambientMuted ||
      this.masalManuallyPaused ||
      !this.masalInZone ||
      this.isInsideMuseum
    ) {
      return 0;
    }
    if (this.distToMasalArea >= MASAL_MAX_DISTANCE) return 0;
    const clamped = Math.max(0, this.distToMasalArea - 2.4);
    const ratio = Math.max(0, 1 - clamped / (MASAL_MAX_DISTANCE - 2.4));
    const voiceActive = this.isSpeaking || this.directorPlaying;
    const vol = MASAL_MAX_VOLUME * Math.pow(ratio, 1.45);
    const adjusted = voiceActive ? vol * 0.3 : vol;
    return adjusted < 0.008 ? 0 : adjusted;
  }

  private async startMasalIfNeeded(): Promise<void> {
    if (
      this.ambientMuted ||
      this.masalManuallyPaused ||
      !this.masalInZone ||
      this.isInsideMuseum
    ) {
      return;
    }
    const targetVol = this.computeTargetMasalVolume();
    if (targetVol <= 0) return;

    const audio = this.ensureMasalAudio();
    if (!audio) return;
    audio.volume = targetVol;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        this.bindGestureResume();
      }
    }
  }

  private updateMasalZonePlayback(): void {
    const targetVol = this.computeTargetMasalVolume();
    const shouldPlay = targetVol > 0;
    if (!this.masalAudio) {
      if (shouldPlay) void this.startMasalIfNeeded();
      return;
    }
    this.masalAudio.volume = targetVol;
    if (!shouldPlay && !this.masalAudio.paused) {
      this.masalAudio.pause();
    } else if (shouldPlay && this.masalAudio.paused) {
      void this.startMasalIfNeeded();
    }
  }

  toggleMasalPlayPause(): boolean {
    const audio = this.ensureMasalAudio();
    if (!audio) return false;
    if (audio.paused) {
      if (
        Number.isFinite(audio.duration) &&
        audio.currentTime >= audio.duration - 0.3
      ) {
        audio.currentTime = 0;
      }
      this.masalManuallyPaused = false;
      this.masalInZone = true;
      void this.startMasalIfNeeded();
      this.updateAmbientVolume();
      return true;
    }
    this.masalManuallyPaused = true;
    audio.pause();
    this.updateAmbientVolume();
    return false;
  }

  resumeMasalInZone(): void {
    this.masalManuallyPaused = false;
    this.masalInZone = true;
    void this.startMasalIfNeeded();
    this.updateAmbientVolume();
  }

  seekMasalBy(deltaSec: number): void {
    const audio = this.ensureMasalAudio();
    if (!audio) return;
    const maxDur = Number.isFinite(audio.duration) ? audio.duration : 441;
    audio.currentTime = Math.max(
      0,
      Math.min(maxDur, audio.currentTime + deltaSec)
    );
  }

  seekMasalTo(timeSec: number): void {
    const audio = this.ensureMasalAudio();
    if (!audio) return;
    const maxDur = Number.isFinite(audio.duration) ? audio.duration : 441;
    audio.currentTime = Math.max(0, Math.min(maxDur, timeSec));
  }

  restartMasal(): void {
    const audio = this.ensureMasalAudio();
    if (!audio) return;
    audio.currentTime = 0;
    this.masalManuallyPaused = false;
    this.masalInZone = true;
    void this.startMasalIfNeeded();
    this.updateAmbientVolume();
  }

  getMasalPlaybackState(): {
    playing: boolean;
    currentTime: number;
    duration: number;
    inZone: boolean;
    pausedByUser: boolean;
  } {
    const audio = this.masalAudio;
    const duration =
      audio && Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : 441;
    return {
      playing: Boolean(audio && !audio.paused && this.computeTargetMasalVolume() > 0),
      currentTime: audio ? audio.currentTime : 0,
      duration,
      inZone:
        this.masalInZone &&
        !this.isInsideMuseum &&
        this.distToMasalArea <= MASAL_UI_RADIUS,
      pausedByUser: this.masalManuallyPaused,
    };
  }

  isMasalAudible(): boolean {
    return Boolean(
      this.masalAudio &&
        !this.masalAudio.paused &&
        this.computeTargetMasalVolume() > 0.04
    );
  }

  private computeTargetSazVolume(): number {
    if (this.quietInterior || this.sazExcludedHere) return 0;
    if (this.ambientMuted || this.sazManuallyPaused || this.isInsideMuseum) {
      return 0;
    }
    if (this.distToSazPlayer >= SAZ_MAX_DISTANCE) return 0;
    const clamped = Math.max(0, this.distToSazPlayer - 2.3);
    const ratio = Math.max(0, 1 - clamped / (SAZ_MAX_DISTANCE - 2.3));
    const voiceActive =
      this.isSpeaking || this.directorPlaying || this.isMasalAudible();
    const vol = SAZ_MAX_VOLUME * Math.pow(ratio, 1.55);
    const adjusted = voiceActive ? vol * 0.28 : vol;
    return adjusted < 0.008 ? 0 : adjusted;
  }

  private async startSazIfNeeded(): Promise<void> {
    if (this.ambientMuted || this.sazManuallyPaused) return;
    const targetVol = this.computeTargetSazVolume();
    if (targetVol <= 0) return;

    const audio = this.ensureSazAudio();
    if (!audio) return;
    audio.volume = targetVol;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        this.bindGestureResume();
      }
    }
  }

  private updateSazVolume(): void {
    const targetVol = this.computeTargetSazVolume();
    if (!this.sazAudio) {
      if (targetVol > 0) void this.startSazIfNeeded();
      return;
    }
    this.sazAudio.volume = targetVol;
    if (targetVol <= 0 && !this.sazAudio.paused) {
      this.sazAudio.pause();
    } else if (
      targetVol > 0 &&
      this.sazAudio.paused &&
      !this.ambientMuted &&
      !this.sazManuallyPaused
    ) {
      void this.startSazIfNeeded();
    }
  }

  toggleSazPause(): boolean {
    this.sazManuallyPaused = !this.sazManuallyPaused;
    this.updateSazVolume();
    return this.sazManuallyPaused;
  }

  isSazPaused(): boolean {
    return this.sazManuallyPaused;
  }

  private computeTargetSemaVolume(): number {
    if (this.quietInterior) return 0;
    if (this.ambientMuted || this.semaManuallyPaused || this.isInsideMuseum) {
      return 0;
    }
    if (this.distToSemaStage >= SEMA_MAX_DISTANCE) return 0;
    const clamped = Math.max(0, this.distToSemaStage - 3.2);
    const ratio = Math.max(0, 1 - clamped / (SEMA_MAX_DISTANCE - 3.2));
    const voiceActive =
      this.isSpeaking || this.directorPlaying || this.isMasalAudible();
    const vol = SEMA_MAX_VOLUME * Math.pow(ratio, 1.45);
    const adjusted = voiceActive ? vol * 0.22 : vol;
    return adjusted < 0.008 ? 0 : adjusted;
  }

  private async startSemaIfNeeded(): Promise<void> {
    if (this.ambientMuted || this.semaManuallyPaused) return;
    const targetVol = this.computeTargetSemaVolume();
    if (targetVol <= 0) return;

    const audio = this.ensureSemaAudio();
    if (!audio) return;
    audio.volume = targetVol;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        this.bindGestureResume();
      }
    }
  }

  private updateSemaVolume(): void {
    const targetVol = this.computeTargetSemaVolume();
    if (!this.semaAudio) {
      if (targetVol > 0) void this.startSemaIfNeeded();
      return;
    }
    this.semaAudio.volume = targetVol;
    if (targetVol <= 0 && !this.semaAudio.paused) {
      this.semaAudio.pause();
    } else if (
      targetVol > 0 &&
      this.semaAudio.paused &&
      !this.ambientMuted &&
      !this.semaManuallyPaused
    ) {
      void this.startSemaIfNeeded();
    }
  }

  toggleSemaPause(): boolean {
    this.semaManuallyPaused = !this.semaManuallyPaused;
    this.updateSemaVolume();
    return this.semaManuallyPaused;
  }

  isSemaPaused(): boolean {
    return this.semaManuallyPaused;
  }

  isSemaAudible(): boolean {
    return this.computeTargetSemaVolume() > 0.02;
  }

  private computeTargetAmbientVolume(): number {
    if (this.quietInterior) return 0;
    if (this.ambientMuted) return 0;
    const voiceActive = this.isSpeaking || this.directorPlaying;
    if (this.isInsideMuseum) {
      return voiceActive ? AMBIENT_DUCKED_VOLUME : AMBIENT_NORMAL_VOLUME;
    }
    // Distance-based soft bleed from museum entrance doors (fades out completely around 18m)
    if (this.distFromEntrance > 18) return 0;
    const liveMusicVol = Math.max(
      this.computeTargetSazVolume(),
      this.computeTargetSemaVolume()
    );
    const liveAtten = Math.max(0.2, 1 - liveMusicVol * 1.1);
    const bleed =
      AMBIENT_OUTDOOR_MAX * Math.exp(-this.distFromEntrance * 0.22) * liveAtten;
    const capped = voiceActive ? bleed * 0.45 : bleed;
    return capped < 0.002 ? 0 : capped;
  }

  private async startAmbientIfNeeded(): Promise<void> {
    if (this.ambientMuted) return;
    const targetVol = this.computeTargetAmbientVolume();
    if (targetVol <= 0) return;

    const audio = this.ensureAmbientAudio();
    if (!audio) return;
    audio.volume = targetVol;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        this.bindGestureResume();
      }
    }
  }

  private updateAmbientVolume(): void {
    if (this.ambientAudio) {
      const targetVol = this.computeTargetAmbientVolume();
      this.ambientAudio.volume = targetVol;
      if (targetVol <= 0 && !this.ambientAudio.paused) {
        this.ambientAudio.pause();
      } else if (targetVol > 0 && this.ambientAudio.paused && !this.ambientMuted) {
        void this.startAmbientIfNeeded();
      }
    }
    this.updateSazVolume();
    this.updateSemaVolume();
    this.updateMasalZonePlayback();
  }

  setQuietInterior(quiet: boolean): void {
    if (this.quietInterior === quiet) return;
    this.quietInterior = quiet;
    if (this.effectsOut && this.ctx) this.effectsOut.gain.setValueAtTime(quiet ? 0 : 1, this.ctx.currentTime);
    if (quiet) {
      this.stopSpeech();
      this.stopHodjaRecording();
    }
    this.updateAmbientVolume();
    this.updateRainAudio();
  }

  playHodjaRecording(): Promise<void> {
    if (!this.hodjaAudio) {
      this.hodjaAudio = new Audio(import.meta.env.BASE_URL + 'nasrettin.wav');
      this.hodjaAudio.preload = 'none';
    }
    this.stopSpeech();
    this.hodjaAudio.currentTime = 0;
    return this.hodjaAudio.play();
  }

  stopHodjaRecording(): void {
    this.hodjaAudio?.pause();
  }

  updateSpatialPosition(
    distFromEntrance: number,
    isInside: boolean,
    distToFountain = 20,
    distToSaz = 40,
    distToSema = 45,
    distToMasal = 45,
    sazExcludedHere = false
  ): void {
    this.sazExcludedHere = sazExcludedHere;
    this.distFromEntrance = Math.max(0, distFromEntrance);
    this.distToFountain = Math.max(0, distToFountain);
    this.distToSazPlayer = Math.max(0, distToSaz);
    this.distToSemaStage = Math.max(0, distToSema);
    this.distToMasalArea = Math.max(0, distToMasal);

    if (isInside) {
      this.masalInZone = false;
    } else if (!this.masalInZone && this.distToMasalArea <= MASAL_ENTER_RADIUS) {
      this.masalInZone = true;
      // Start playing right away upon entering the storytelling area
      this.masalManuallyPaused = false;
    } else if (this.masalInZone && this.distToMasalArea >= MASAL_MAX_DISTANCE) {
      this.masalInZone = false;
    }

    if (isInside !== this.isInsideMuseum) {
      this.setMuseumInside(isInside);
    } else {
      this.updateAmbientVolume();
    }
  }

  setMuseumInside(inside: boolean): void {
    const changed = this.isInsideMuseum !== inside;
    this.isInsideMuseum = inside;
    this.updateAmbientVolume();
    if (!this.ambientMuted && this.computeTargetAmbientVolume() > 0) {
      void this.startAmbientIfNeeded();
    }
    if (changed || (!inside && this.outdoorTimer === null)) {
      this.scheduleOutdoorNatureLoop();
    }
    this.updateRainAudio();
  }

  setEnvironmentConditions(isNight: boolean, isRaining: boolean): void {
    const rainChanged = this.isRaining !== isRaining;
    this.isNight = isNight;
    this.isRaining = isRaining;
    if (rainChanged) {
      this.updateRainAudio();
    }
  }

  toggleAmbientMute(): boolean {
    this.ambientMuted = !this.ambientMuted;
    if (this.ambientMuted) {
      this.ambientAudio?.pause();
      this.sazAudio?.pause();
      this.semaAudio?.pause();
      this.masalAudio?.pause();
    } else {
      void this.startAmbientIfNeeded();
      void this.startSazIfNeeded();
      void this.startSemaIfNeeded();
      void this.startMasalIfNeeded();
    }
    this.updateRainAudio();
    return this.ambientMuted;
  }

  isAmbientMuted(): boolean {
    return this.ambientMuted;
  }

  private scheduleOutdoorNatureLoop(): void {
    if (typeof window === 'undefined') return;
    if (this.outdoorTimer !== null) {
      window.clearTimeout(this.outdoorTimer);
      this.outdoorTimer = null;
    }
    if (this.isInsideMuseum) return;

    const delay = 1500 + Math.random() * 1900;
    this.outdoorTimer = window.setTimeout(() => {
      this.outdoorTimer = null;
      if (!this.isInsideMuseum && !this.ambientMuted && !this.quietInterior) {
        if (this.isNight) {
          this.playNightCricket();
        } else if (!this.isRaining) {
          this.playBirdChirp();
        }
        if (this.distToFountain < 11.5) {
          this.playFountainAmbience(1 - this.distToFountain / 11.5);
        }
      }
      this.scheduleOutdoorNatureLoop();
    }, delay);
  }

  private updateRainAudio(): void {
    const shouldPlay = this.isRaining && !this.ambientMuted && !this.quietInterior;
    if (!shouldPlay) {
      if (this.rainGainNode && this.ctx) {
        this.rainGainNode.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
      }
      return;
    }

    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== 'running') {
      this.bindGestureResume();
      return;
    }

    if (!this.rainNoiseNode || !this.rainGainNode || !this.rainFilterNode) {
      const src = ctx.createBufferSource();
      src.buffer = this.ensureNoiseBuffer(ctx);
      src.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = this.isInsideMuseum ? 520 : 2400;

      const gain = ctx.createGain();
      gain.gain.value = 0.0001;

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.effectsOut ?? ctx.destination);
      src.start();

      this.rainNoiseNode = src;
      this.rainFilterNode = filter;
      this.rainGainNode = gain;
    }

    this.rainFilterNode.frequency.setTargetAtTime(
      this.isInsideMuseum ? 480 : 2500,
      ctx.currentTime,
      0.25
    );
    this.rainGainNode.gain.setTargetAtTime(
      this.isInsideMuseum ? 0.035 : 0.11,
      ctx.currentTime,
      0.25
    );
  }

  private playFountainAmbience(strength: number): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    const s = Math.max(0.15, Math.min(1, strength));

    const src = ctx.createBufferSource();
    src.buffer = this.ensureNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400 + Math.random() * 500;
    filter.Q.value = 1.8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.032 * s, now + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.effectsOut ?? ctx.destination);
    src.start(now, Math.random() * 0.9, 0.9);
  }

  private playBirdChirp(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime;
    const notes = 2 + Math.floor(Math.random() * 3);
    const baseFreq = 2000 + Math.random() * 1000;

    for (let i = 0; i < notes; i++) {
      const start = now + i * 0.125;
      const dur = 0.08 + Math.random() * 0.045;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const f1 = baseFreq + (Math.random() - 0.5) * 340;
      const f2 = f1 + 480 + Math.random() * 380;
      osc.frequency.setValueAtTime(f1, start);
      osc.frequency.exponentialRampToValueAtTime(f2, start + dur * 0.65);
      osc.frequency.exponentialRampToValueAtTime(f1 * 0.92, start + dur);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.046, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      osc.connect(gain);
      gain.connect(this.effectsOut ?? ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    }
  }

  private playNightCricket(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.072;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(3850, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.024, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
      osc.connect(gain);
      gain.connect(this.effectsOut ?? ctx.destination);
      osc.start(t);
      osc.stop(t + 0.055);
    }
  }

  private playTone(
    freq: number,
    durationSec: number,
    delaySec = 0,
    gainPeak = 0.08,
    type: OscillatorType = 'triangle'
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(this.effectsOut ?? ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  }

  playFootstep(surface: SurfaceKind): void {
    if (this.ambientMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime;
    const pitchJitter = 0.92 + Math.random() * 0.16;

    if (surface === 'grass') {
      // Soft rustling grass step
      const src = ctx.createBufferSource();
      src.buffer = this.ensureNoiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 820 * pitchJitter;
      filter.Q.value = 1.1;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.effectsOut ?? ctx.destination);
      src.start(now, Math.random() * 0.8, 0.1);
    } else if (surface === 'stone') {
      // Crisp stone path / stair tap
      this.playTone(175 * pitchJitter, 0.06, 0, 0.035, 'triangle');
      const src = ctx.createBufferSource();
      src.buffer = this.ensureNoiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1400 * pitchJitter;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.028, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.effectsOut ?? ctx.destination);
      src.start(now, Math.random() * 0.5, 0.06);
    } else {
      // Resonant indoor marble gallery click
      this.playTone(290 * pitchJitter, 0.075, 0, 0.036, 'sine');
      this.playTone(620 * pitchJitter, 0.045, 0.005, 0.018, 'triangle');
    }
  }

  playHover(): void {
    this.playTone(660, 0.07, 0, 0.025, 'sine');
  }

  playSelect(): void {
    this.playTone(523.25, 0.12, 0, 0.06, 'triangle');
    this.playTone(659.25, 0.16, 0.06, 0.06, 'triangle');
  }

  playStarCollected(): void {
    // Classic bright "ding!" + harmonic sparkle
    this.playTone(1046.5, 0.18, 0, 0.09, 'sine');
    this.playTone(1567.98, 0.34, 0.05, 0.08, 'sine');
    this.playTone(2093.0, 0.42, 0.11, 0.05, 'triangle');
  }

  playConfettiBurst(): void {
    // Pop + celebratory sparkles
    this.playTone(220, 0.09, 0, 0.09, 'sine');
    this.playTone(880, 0.14, 0.03, 0.06, 'triangle');
    this.playTone(1174.66, 0.18, 0.08, 0.07, 'sine');
    this.playTone(1567.98, 0.28, 0.14, 0.07, 'sine');
  }

  playQuestVictory(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.24, idx * 0.075, 0.08, 'triangle');
    });
  }

  playApplePick(): void {
    this.playTone(440, 0.09, 0, 0.07, 'sine');
    this.playTone(660, 0.12, 0.05, 0.07, 'triangle');
    this.playTone(990, 0.16, 0.1, 0.06, 'sine');
  }

  playWaterSplash(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.ensureNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.32);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.effectsOut ?? ctx.destination);
    src.start(now, 0, 0.36);

    this.playTone(720, 0.1, 0.04, 0.04, 'sine');
    this.playTone(960, 0.12, 0.1, 0.04, 'sine');
  }

  playBallBounce(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.13);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    osc.connect(gain);
    gain.connect(this.effectsOut ?? ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playMagicReveal(): void {
    [587.33, 739.99, 880, 1174.66, 1479.98].forEach((freq, i) => {
      this.playTone(freq, 0.26, i * 0.06, 0.065, 'sine');
    });
  }

  playEasterEgg(): void {
    this.playTone(523.25, 0.09, 0, 0.07, 'triangle');
    this.playTone(783.99, 0.11, 0.07, 0.07, 'triangle');
    this.playTone(1046.5, 0.18, 0.14, 0.07, 'sine');
  }

  playBadgeUnlocked(): void {
    [659.25, 830.61, 987.77, 1318.51].forEach((freq, i) => {
      this.playTone(freq, 0.25, i * 0.07, 0.075, 'triangle');
    });
  }

  playCarouselTurn(): void {
    this.playTone(392.0, 0.09, 0, 0.04, 'sine');
    this.playTone(440.0, 0.09, 0.05, 0.04, 'sine');
  }

  playStoryChime(): void {
    // Gentle warm Anatolian storytelling wind-chime (zero harsh sounds)
    [392.0, 493.88, 587.33, 783.99].forEach((freq, i) => {
      this.playTone(freq, 0.34, i * 0.085, 0.045, 'sine');
    });
  }

  playHopscotchNote(stepIndex: number): void {
    // Realistic 10-square Turkish Seksek: soft stone shoe hop + warm marimba/kalimba chord note
    const scale = [
      523.25, // 1: C5
      587.33, // 2: D5
      659.25, // 3: E5
      698.46, // 4: F5
      783.99, // 5: G5
      880.0,  // 6: A5
      987.77, // 7: B5
      1046.5, // 8: C6
      1174.66,// 9: D6
      1318.51,// 10: E6 (Gökyüzü)
    ];
    const idx = Math.max(0, Math.min(scale.length - 1, stepIndex));
    const freq = scale[idx];

    // Subtle stone shoe tap
    this.playTone(165, 0.05, 0, 0.04, 'triangle');
    // Warm kalimba primary + harmonic shimmer
    this.playTone(freq, 0.28, 0.015, 0.075, 'sine');
    this.playTone(freq * 2, 0.16, 0.02, 0.025, 'triangle');

    // Double chord on finale square 10
    if (idx === scale.length - 1) {
      this.playTone(1046.5, 0.34, 0.06, 0.06, 'sine');
      this.playTone(1567.98, 0.38, 0.11, 0.05, 'triangle');
    }
  }

  playStoneToss(): void {
    this.playTone(420, 0.08, 0, 0.04, 'sine');
    this.playTone(640, 0.09, 0.05, 0.035, 'triangle');
  }

  playWoodStrike(): void {
    this.playTone(210, 0.08, 0, 0.08, 'triangle');
    this.playTone(540, 0.06, 0.01, 0.045, 'square');
  }

  playDigSound(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.ensureNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 640;
    filter.Q.value = 1.2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.085, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.effectsOut ?? ctx.destination);
    src.start(now, 0.1, 0.24);
    this.playTone(320, 0.12, 0.04, 0.04, 'triangle');
  }

  playTagFound(): void {
    this.playTone(587.33, 0.12, 0, 0.08, 'sine');
    this.playTone(880.0, 0.16, 0.06, 0.08, 'sine');
    this.playTone(1174.66, 0.22, 0.12, 0.07, 'triangle');
  }

  playCountdownTick(): void {
    this.playTone(740, 0.075, 0, 0.045, 'sine');
  }

  playCameraShutter(): void {
    if (this.ambientMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Crisp dual-curtain mechanical shutter click + soft warm flash pop
    const src = ctx.createBufferSource();
    src.buffer = this.ensureNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2100;
    filter.Q.value = 1.4;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.14, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.effectsOut ?? ctx.destination);
    src.start(now, 0.05, 0.08);

    this.playTone(1120, 0.055, 0, 0.065, 'triangle');
    this.playTone(620, 0.07, 0.042, 0.05, 'triangle');
  }

  playCafeBell(): void {
    this.playTone(1046.5, 0.24, 0, 0.055, 'sine');
    this.playTone(1567.98, 0.28, 0.08, 0.045, 'triangle');
  }

  playSipDrink(): void {
    this.playTone(360, 0.09, 0, 0.045, 'sine');
    this.playTone(490, 0.12, 0.06, 0.04, 'sine');
    this.playTone(620, 0.14, 0.12, 0.035, 'triangle');
  }

  playRopeStrain(): void {
    this.playTone(138, 0.07, 0, 0.065, 'triangle');
    this.playTone(192, 0.06, 0.02, 0.04, 'sine');
  }

  playGameLose(): void {
    [440, 392, 329.63, 261.63].forEach((freq, i) => {
      this.playTone(freq, 0.22, i * 0.11, 0.065, 'triangle');
    });
  }

  playHighFive(): void {
    this.playTone(280, 0.06, 0, 0.075, 'triangle');
    this.playTone(784, 0.14, 0.03, 0.055, 'sine');
    this.playTone(1046.5, 0.18, 0.08, 0.045, 'sine');
  }

  playCatPurr(): void {
    if (this.ambientMuted) return;
    // Soft affectionate meow + warm purr
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(860, now + 0.09);
    osc.frequency.exponentialRampToValueAtTime(510, now + 0.28);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    osc.connect(gain);
    gain.connect(this.effectsOut ?? ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);

    this.playTone(110, 0.25, 0.22, 0.025, 'sine');
  }

  playDogBark(): void {
    if (this.ambientMuted) return;
    // Cheerful double puppy bark
    [0, 0.18].forEach((offset) => {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime + offset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.03);
      osc.frequency.exponentialRampToValueAtTime(165, now + 0.12);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 950;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.055, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.effectsOut ?? ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    });
  }

  playClapSound(): void {
    if (this.ambientMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [0, 0.14, 0.28].forEach((offset) => {
      const src = ctx.createBufferSource();
      src.buffer = this.ensureNoiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1350 + Math.random() * 250;
      filter.Q.value = 0.9;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.065, now + offset + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.09);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.effectsOut ?? ctx.destination);
      src.start(now + offset, Math.random() * 0.4, 0.11);
    });
  }

  playDirectorAudio(onStateChange?: (playing: boolean) => void): void {
    if (typeof window === 'undefined') return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;

    if (this.directorPlaying && this.directorAudio) {
      this.stopDirectorAudio();
      onStateChange?.(false);
      return;
    }

    if (!this.directorAudio) {
      const audio = new Audio(DIRECTOR_AUDIO_URL);
      audio.preload = 'auto';
      audio.onended = () => {
        this.directorPlaying = false;
        this.updateAmbientVolume();
        this.directorStateCb?.(false);
        this.directorStateCb = undefined;
      };
      audio.onerror = () => {
        this.directorPlaying = false;
        this.updateAmbientVolume();
        this.directorStateCb?.(false);
        this.directorStateCb = undefined;
      };
      this.directorAudio = audio;
    }

    this.directorStateCb = onStateChange;
    this.directorAudio.currentTime = 0;
    this.directorPlaying = true;
    this.updateAmbientVolume();
    onStateChange?.(true);

    void this.directorAudio.play().catch(() => {
      this.directorPlaying = false;
      this.updateAmbientVolume();
      onStateChange?.(false);
    });
  }

  stopDirectorAudio(): void {
    if (this.directorAudio && !this.directorAudio.paused) {
      this.directorAudio.pause();
      this.directorAudio.currentTime = 0;
    }
    this.directorPlaying = false;
    this.updateAmbientVolume();
    this.directorStateCb?.(false);
    this.directorStateCb = undefined;
  }

  speakTurkish(
    text: string,
    onStateChange?: (speaking: boolean) => void
  ): boolean {
    this.stopDirectorAudio();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return false;
    }
    const synth = window.speechSynthesis;
    if (this.isSpeaking) {
      synth.cancel();
      this.isSpeaking = false;
      this.updateAmbientVolume();
      onStateChange?.(false);
      return false;
    }

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    utterance.rate = 0.96;
    utterance.pitch = 1.08;

    const voices = synth.getVoices();
    const trVoice = voices.find((v) =>
      v.lang.toLowerCase().startsWith('tr')
    );
    if (trVoice) {
      utterance.voice = trVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.updateAmbientVolume();
      onStateChange?.(true);
    };
    utterance.onend = () => {
      this.isSpeaking = false;
      this.updateAmbientVolume();
      onStateChange?.(false);
    };
    utterance.onerror = () => {
      this.isSpeaking = false;
      this.updateAmbientVolume();
      onStateChange?.(false);
    };

    synth.speak(utterance);
    return true;
  }

  stopSpeech(onStateChange?: (speaking: boolean) => void): void {
    this.stopDirectorAudio();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.updateAmbientVolume();
    onStateChange?.(false);
  }

  /** Traditional Tef (tambourine) + Nareke (reed whistle) fanfare for Karagöz & Hacivat */
  playKaragozTefAndNareke(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Nareke playful reed whistle trill (triangle + bandpass sawtooth)
    const reedOsc = ctx.createOscillator();
    const reedLfo = ctx.createOscillator();
    const reedLfoGain = ctx.createGain();
    const reedGain = ctx.createGain();
    reedOsc.type = 'sawtooth';
    reedOsc.frequency.setValueAtTime(640, now);
    reedOsc.frequency.linearRampToValueAtTime(790, now + 0.14);
    reedOsc.frequency.linearRampToValueAtTime(710, now + 0.34);

    reedLfo.frequency.setValueAtTime(26, now);
    reedLfoGain.gain.setValueAtTime(34, now);
    reedLfo.connect(reedLfoGain).connect(reedOsc.frequency);

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1150, now);
    bp.Q.setValueAtTime(2.6, now);

    reedGain.gain.setValueAtTime(0.001, now);
    reedGain.gain.linearRampToValueAtTime(0.09, now + 0.04);
    reedGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    reedOsc.connect(bp).connect(reedGain).connect(this.effectsOut ?? ctx.destination);
    reedOsc.start(now);
    reedLfo.start(now);
    reedOsc.stop(now + 0.4);
    reedLfo.stop(now + 0.4);

    // 2. Tef frame-drum taps + brass zill jingles ("Düm - Tek - Tek")
    const drumOffsets = [0.06, 0.24, 0.38];
    drumOffsets.forEach((off, idx) => {
      const t = now + off;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const baseFreq = idx === 0 ? 155 : 235;
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(68, t + 0.12);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain).connect(this.effectsOut ?? ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);

      // Brass zil shimmer
      const zil = ctx.createOscillator();
      const zilGain = ctx.createGain();
      zil.type = 'sine';
      zil.frequency.setValueAtTime(4200 + idx * 450, t);
      zilGain.gain.setValueAtTime(0.035, t);
      zilGain.gain.exponentialRampToValueAtTime(0.0008, t + 0.09);
      zil.connect(zilGain).connect(this.effectsOut ?? ctx.destination);
      zil.start(t);
      zil.stop(t + 0.1);
    });
  }

  dispose(): void {
    this.stopSpeech();
    this.stopHodjaRecording();
    this.hodjaAudio?.removeAttribute('src');
    this.hodjaAudio = undefined;
    if (this.outdoorTimer !== null) {
      window.clearTimeout(this.outdoorTimer);
      this.outdoorTimer = null;
    }
    if (this.rainNoiseNode) {
      try {
        this.rainNoiseNode.stop();
      } catch {
        // Ignore already stopped
      }
      this.rainNoiseNode.disconnect();
      this.rainNoiseNode = null;
    }
    if (this.ambientAudio) {
      this.ambientAudio.pause();
      this.ambientAudio.src = '';
      this.ambientAudio = null;
    }
    if (this.directorAudio) {
      this.directorAudio.pause();
      this.directorAudio.src = '';
      this.directorAudio = null;
    }
    if (this.sazAudio) {
      this.sazAudio.pause();
      this.sazAudio.src = '';
      this.sazAudio = null;
    }
    if (this.semaAudio) {
      this.semaAudio.pause();
      this.semaAudio.src = '';
      this.semaAudio = null;
    }
    if (this.masalAudio) {
      this.masalAudio.pause();
      this.masalAudio.src = '';
      this.masalAudio = null;
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}

export const kidAudio = new KidAudioManager();
