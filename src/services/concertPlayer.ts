import {metin} from "../metinler.ts";
export const CONCERT_TRACKS = [
  {title: metin("concertPlayer", "mirasium"), file: 'mirasium'},
  {title: metin("concertPlayer", "takiyuddin"), file: 'takiyuddin'},
  {title: metin("concertPlayer", "amasyali_strabon"), file: 'strabon'},
  {title: metin("concertPlayer", "bergamali_galen"), file: 'galen'},
  {title: metin("concertPlayer", "turquerie"), file: 'turquerie'},
];

export class ConcertPlayer {
  private readonly audio = new Audio();
  private readonly listeners = new Set<() => void>();
  private readonly requests: number[] = [];
  private normalIndex = 0;
  private currentIndex = 0;
  private wantsPlayback = true;
  private waitingForGesture = false;
  private audible = false;
  private active = false;
  private playbackAttempt = 0;
  status = '';

  constructor() {
    this.audio.preload = 'none';
    this.audio.onplaying = () => { this.active = true; this.emit(); };
    this.audio.onpause = () => { this.active = false; this.emit(); };
    this.audio.onended = () => this.advance();
    this.audio.onerror = () => {
      this.status = metin("concertPlayer", "kayit_yuklenemedi_sonraki_parcaya_gecebilir_veya_yeniden");
      this.wantsPlayback = false;
      this.active = false;
      this.emit();
    };
    window.addEventListener('pointerdown', this.retryAfterGesture, true);
    window.addEventListener('keydown', this.retryAfterGesture, true);
  }

  get current(): number { return this.currentIndex; }
  get queued(): readonly number[] { return this.requests; }
  get playing(): boolean { return this.active && !this.audio.paused && !this.audio.ended; }
  get intendsToPlay(): boolean { return this.wantsPlayback && !this.waitingForGesture; }
  get next(): number { return this.requests[0] ?? (this.normalIndex + 1) % CONCERT_TRACKS.length; }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  updateAudibility(volume: number): void {
    this.audio.volume = volume;
    const inRange = volume > 0;
    if (inRange === this.audible) return;
    this.audible = inRange;
    if (!inRange) {
      this.playbackAttempt++;
      this.audio.pause();
    } else if (this.wantsPlayback) {
      void this.play();
    }
  }

  togglePlayback(): void {
    if (this.intendsToPlay) {
      this.wantsPlayback = false;
      this.playbackAttempt++;
      this.audio.pause();
      this.emit();
    } else {
      void this.play();
    }
  }

  request(index: number): void {
    if (!CONCERT_TRACKS[index] || index === this.currentIndex || this.requests.includes(index)) return;
    this.requests.push(index);
    this.status = metin("concertPlayer", "1_istek_sirasina_eklendi", CONCERT_TRACKS[index].title);
    this.emit();
  }

  advance(): void {
    const requested = this.requests.shift();
    const normalNext = (this.normalIndex + 1) % CONCERT_TRACKS.length;
    if (requested === undefined || requested === normalNext) this.normalIndex = normalNext;
    this.currentIndex = requested ?? this.normalIndex;
    this.status = '';
    this.loadTrack();
    if (this.wantsPlayback) void this.play();
    this.emit();
  }

  private loadTrack(): void {
    this.active = false;
    this.audio.src = `${import.meta.env.BASE_URL}assets/concert/${CONCERT_TRACKS[this.currentIndex].file}.mp3`;
  }

  private async play(): Promise<void> {
    this.wantsPlayback = true;
    this.waitingForGesture = false;
    this.status = '';
    this.emit();
    if (!this.audible) return;
    if (!this.audio.getAttribute('src') || this.audio.error) this.loadTrack();
    const attempt = ++this.playbackAttempt;
    try {
      await this.audio.play();
    } catch (error) {
      if (attempt !== this.playbackAttempt || (error instanceof DOMException && error.name === 'AbortError')) return;
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        this.waitingForGesture = true;
        this.status = metin("concertPlayer", "ilk_etkilesimde_konser_sesi_acilacak");
      } else {
        this.wantsPlayback = false;
        this.status = metin("concertPlayer", "konser_sesi_oynatilamadi");
      }
      this.emit();
    }
  }

  private retryAfterGesture = (): void => {
    if (this.waitingForGesture && this.audible) void this.play();
  };

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }

  dispose(): void {
    window.removeEventListener('pointerdown', this.retryAfterGesture, true);
    window.removeEventListener('keydown', this.retryAfterGesture, true);
    this.audio.onplaying = this.audio.onpause = this.audio.onended = this.audio.onerror = null;
    this.playbackAttempt++;
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.audio.load();
    this.listeners.clear();
  }
}
