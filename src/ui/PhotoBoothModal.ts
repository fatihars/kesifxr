import type {PhotoPoseMode} from '../scene/ExplorerCharacter.ts';

export type PhotoCompanionMode = 'solo' | 'friend' | 'pet' | 'both';
export type PhotoFilterMode = 'sepia' | 'bw' | 'color';

export interface PhotoFriendOption {
  id: string;
  label: string;
}

export interface PhotoBoothCapturePayload {
  canvas: HTMLCanvasElement;
  caption: string;
  filter: PhotoFilterMode;
}

export interface PhotoBoothCallbacks {
  onSelectCompanion: (mode: PhotoCompanionMode, friendId: string | null) => void;
  onSelectPose: (pose: PhotoPoseMode) => void;
  onSelectFilter: (filter: PhotoFilterMode) => void;
  onRequestCapture: () => PhotoBoothCapturePayload | null;
  onExitStudio: () => void;
  onCountdownTick?: () => void;
}

const POSE_OPTIONS: Array<{id: PhotoPoseMode; label: string}> = [
  {id: 'wave', label: 'El Salla 👋'},
  {id: 'hero', label: 'Kahraman 🦸'},
  {id: 'joy', label: 'Sevinç ✨'},
  {id: 'sit', label: 'Otur 🪑'},
  {id: 'salute', label: 'Selam 🫡'},
];

const FILTER_OPTIONS: Array<{id: PhotoFilterMode; label: string}> = [
  {id: 'sepia', label: 'Sepya'},
  {id: 'bw', label: 'Siyah-Beyaz'},
  {id: 'color', label: 'Renkli'},
];

export class PhotoBoothModal {
  private callbacks: PhotoBoothCallbacks;
  private dockEl!: HTMLDivElement;
  private previewBackdrop!: HTMLDivElement;
  private previewImg!: HTMLImageElement;
  private previewDownloadLink!: HTMLAnchorElement;
  private previewSubtitle!: HTMLSpanElement;
  private countdownEl!: HTMLDivElement;
  private flashEl!: HTMLDivElement;

  private compSoloBtn!: HTMLButtonElement;
  private compFriendBtn!: HTMLButtonElement;
  private compPetBtn!: HTMLButtonElement;
  private compBothBtn!: HTMLButtonElement;
  private friendSelect!: HTMLSelectElement;
  private poseBtns = new Map<PhotoPoseMode, HTMLButtonElement>();
  private filterBtns = new Map<PhotoFilterMode, HTMLButtonElement>();
  private shutterBtn!: HTMLButtonElement;

  private companionMode: PhotoCompanionMode = 'solo';
  private poseMode: PhotoPoseMode = 'wave';
  private filterMode: PhotoFilterMode = 'sepia';
  private selectedFriendId: string | null = null;
  private adoptedPetName: string | null = null;
  private hasFriends = false;

  private studioActive = false;
  private previewOpen = false;
  private countingDown = false;
  private countdownTimer?: number;
  private flashTimer?: number;
  private currentDataUrl = '';

  constructor(hostRoot: HTMLElement, callbacks: PhotoBoothCallbacks) {
    this.callbacks = callbacks;
    this.buildDom(hostRoot);
  }

  private buildDom(hostRoot: HTMLElement): void {
    // 1. Studio Dock (non-blocking bottom panel while posing on stage)
    this.dockEl = document.createElement('div');
    this.dockEl.className = 'hud-photobooth-dock hidden';

    const head = document.createElement('div');
    head.className = 'hud-photobooth-head';
    head.innerHTML = `
      <div>
        <div class="hud-photobooth-title">📸 İstanbul Hatırası — Körüklü Fotoğraf Stüdyosu</div>
        <div class="hud-photobooth-sub">Pozunu seç, arkadaşını veya evcil dostunu davet et ve hatıra fotoğrafını indir!</div>
      </div>
    `;
    const exitTopBtn = document.createElement('button');
    exitTopBtn.className = 'hud-close-btn';
    exitTopBtn.type = 'button';
    exitTopBtn.textContent = 'Stüdyodan Çık';
    exitTopBtn.onclick = () => this.exitStudio();
    head.appendChild(exitTopBtn);

    const rows = document.createElement('div');
    rows.className = 'hud-photobooth-rows';

    // Row 1: Companions
    const compRow = document.createElement('div');
    compRow.className = 'hud-photobooth-row';
    const compLabel = document.createElement('span');
    compLabel.className = 'hud-photobooth-label';
    compLabel.textContent = 'Kimlerle:';
    compRow.appendChild(compLabel);

    const makeChip = (text: string, onClick: () => void) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hud-photo-chip';
      btn.textContent = text;
      btn.onclick = onClick;
      return btn;
    };

    this.compSoloBtn = makeChip('Tek Başıma', () => this.setCompanionMode('solo'));
    this.compFriendBtn = makeChip('Arkadaşımla', () => this.setCompanionMode('friend'));
    this.compPetBtn = makeChip('Evcil Hayvanımla', () => this.setCompanionMode('pet'));
    this.compBothBtn = makeChip('Hepsi Birden', () => this.setCompanionMode('both'));

    this.friendSelect = document.createElement('select');
    this.friendSelect.className = 'hud-photo-select hidden';
    this.friendSelect.setAttribute('aria-label', 'Fotoğraf arkadaşı seç');
    this.friendSelect.onchange = () => {
      this.selectedFriendId = this.friendSelect.value || null;
      this.callbacks.onSelectCompanion(this.companionMode, this.selectedFriendId);
    };

    compRow.append(
      this.compSoloBtn,
      this.compFriendBtn,
      this.compPetBtn,
      this.compBothBtn,
      this.friendSelect
    );

    // Row 2: Poses
    const poseRow = document.createElement('div');
    poseRow.className = 'hud-photobooth-row';
    const poseLabel = document.createElement('span');
    poseLabel.className = 'hud-photobooth-label';
    poseLabel.textContent = 'Pozun:';
    poseRow.appendChild(poseLabel);

    for (const p of POSE_OPTIONS) {
      const btn = makeChip(p.label, () => this.setPoseMode(p.id));
      this.poseBtns.set(p.id, btn);
      poseRow.appendChild(btn);
    }

    // Row 3: Filters
    const filterRow = document.createElement('div');
    filterRow.className = 'hud-photobooth-row';
    const filterLabel = document.createElement('span');
    filterLabel.className = 'hud-photobooth-label';
    filterLabel.textContent = 'Görünüm:';
    filterRow.appendChild(filterLabel);

    for (const f of FILTER_OPTIONS) {
      const btn = makeChip(f.label, () => this.setFilterMode(f.id));
      this.filterBtns.set(f.id, btn);
      filterRow.appendChild(btn);
    }

    rows.append(compRow, poseRow, filterRow);

    // Actions row
    const actions = document.createElement('div');
    actions.className = 'hud-photobooth-actions';
    this.shutterBtn = document.createElement('button');
    this.shutterBtn.type = 'button';
    this.shutterBtn.className = 'hud-photo-shutter-btn';
    this.shutterBtn.textContent = '📸 Fotoğraf Çek (3-2-1)';
    this.shutterBtn.onclick = () => this.startCountdownAndCapture();
    actions.appendChild(this.shutterBtn);

    this.dockEl.append(head, rows, actions);
    hostRoot.appendChild(this.dockEl);

    // 2. Countdown & Flash Overlays
    this.countdownEl = document.createElement('div');
    this.countdownEl.className = 'hud-photo-countdown hidden';
    this.flashEl = document.createElement('div');
    this.flashEl.className = 'hud-photo-flash';
    hostRoot.append(this.countdownEl, this.flashEl);

    // 3. Preview & Download Modal
    this.previewBackdrop = document.createElement('div');
    this.previewBackdrop.className = 'hud-modal-backdrop hidden';

    const card = document.createElement('div');
    card.className = 'hud-modal-card hud-photo-preview-card';

    const top = document.createElement('div');
    top.className = 'hud-modal-top';
    const pills = document.createElement('div');
    pills.className = 'hud-modal-pills';
    const pillTitle = document.createElement('span');
    pillTitle.className = 'hud-pill hud-pill-gold';
    pillTitle.textContent = '📸 İstanbul Hatırası Hazır!';
    this.previewSubtitle = document.createElement('span');
    this.previewSubtitle.className = 'hud-pill hud-pill-sky';
    this.previewSubtitle.textContent = 'Sepya Kartpostal';
    pills.append(pillTitle, this.previewSubtitle);

    const closePreviewBtn = document.createElement('button');
    closePreviewBtn.type = 'button';
    closePreviewBtn.className = 'hud-close-btn';
    closePreviewBtn.textContent = 'Kapat ✕';
    closePreviewBtn.onclick = () => this.closePreviewToStudio();
    top.append(pills, closePreviewBtn);

    const body = document.createElement('div');
    body.className = 'hud-modal-body';
    this.previewImg = document.createElement('img');
    this.previewImg.className = 'hud-photo-preview-img';
    this.previewImg.alt = 'İstanbul Hatırası fotoğraf önizlemesi';
    body.appendChild(this.previewImg);

    const modalActions = document.createElement('div');
    modalActions.className = 'hud-modal-actions';

    this.previewDownloadLink = document.createElement('a');
    this.previewDownloadLink.className = 'hud-photo-download-link';
    this.previewDownloadLink.download = 'istanbul-hatirasi-mirasium.png';
    this.previewDownloadLink.textContent = '📥 Fotoğrafı İndir (PNG)';

    const retakeBtn = document.createElement('button');
    retakeBtn.type = 'button';
    retakeBtn.className = 'hud-btn hud-btn-speak';
    retakeBtn.textContent = '🔄 Yeniden Poz Ver';
    retakeBtn.onclick = () => this.closePreviewToStudio();

    const exitAllBtn = document.createElement('button');
    exitAllBtn.type = 'button';
    exitAllBtn.className = 'hud-close-btn';
    exitAllBtn.textContent = 'Stüdyodan Çık';
    exitAllBtn.onclick = () => this.exitStudio();

    modalActions.append(this.previewDownloadLink, retakeBtn, exitAllBtn);
    card.append(top, body, modalActions);
    this.previewBackdrop.appendChild(card);
    hostRoot.appendChild(this.previewBackdrop);
  }

  openStudio(friends: PhotoFriendOption[], adoptedPetName: string | null): void {
    this.studioActive = true;
    this.previewOpen = false;
    this.countingDown = false;
    this.adoptedPetName = adoptedPetName;
    this.hasFriends = friends.length > 0;

    this.friendSelect.innerHTML = '';
    for (const f of friends) {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = f.label;
      this.friendSelect.appendChild(opt);
    }
    if (friends.length > 0) {
      const stillValid = friends.some((f) => f.id === this.selectedFriendId);
      if (!stillValid) this.selectedFriendId = friends[0].id;
      this.friendSelect.value = this.selectedFriendId!;
    } else {
      this.selectedFriendId = null;
    }

    this.compFriendBtn.disabled = !this.hasFriends;
    this.compPetBtn.disabled = !this.adoptedPetName;
    this.compPetBtn.textContent = this.adoptedPetName
      ? `Evcil Dost (${this.adoptedPetName})`
      : 'Evcil Hayvan (Önce Sahiplen)';
    this.compBothBtn.disabled = !this.hasFriends || !this.adoptedPetName;

    // Fallback if previous selection is no longer valid
    if (this.companionMode === 'pet' && !this.adoptedPetName) {
      this.companionMode = 'solo';
    } else if (this.companionMode === 'friend' && !this.hasFriends) {
      this.companionMode = 'solo';
    } else if (
      this.companionMode === 'both' &&
      (!this.hasFriends || !this.adoptedPetName)
    ) {
      this.companionMode = this.adoptedPetName ? 'pet' : this.hasFriends ? 'friend' : 'solo';
    }

    this.poseMode = 'wave';
    this.syncButtons();

    this.previewBackdrop.classList.add('hidden');
    this.countdownEl.classList.add('hidden');
    this.dockEl.classList.remove('hidden');

    this.callbacks.onSelectCompanion(this.companionMode, this.selectedFriendId);
    this.callbacks.onSelectPose(this.poseMode);
    this.callbacks.onSelectFilter(this.filterMode);
  }

  private setCompanionMode(mode: PhotoCompanionMode): void {
    if (this.countingDown) return;
    if (mode === 'pet' && !this.adoptedPetName) return;
    if (mode === 'friend' && !this.hasFriends) return;
    if (mode === 'both' && (!this.adoptedPetName || !this.hasFriends)) return;
    this.companionMode = mode;
    this.syncButtons();
    this.callbacks.onSelectCompanion(mode, this.selectedFriendId);
  }

  private setPoseMode(pose: PhotoPoseMode): void {
    if (this.countingDown) return;
    this.poseMode = pose;
    this.syncButtons();
    this.callbacks.onSelectPose(pose);
  }

  private setFilterMode(filter: PhotoFilterMode): void {
    if (this.countingDown) return;
    this.filterMode = filter;
    this.syncButtons();
    this.callbacks.onSelectFilter(filter);
  }

  private syncButtons(): void {
    this.compSoloBtn.classList.toggle('active', this.companionMode === 'solo');
    this.compFriendBtn.classList.toggle('active', this.companionMode === 'friend');
    this.compPetBtn.classList.toggle('active', this.companionMode === 'pet');
    this.compBothBtn.classList.toggle('active', this.companionMode === 'both');

    const showFriendSelect =
      this.hasFriends && (this.companionMode === 'friend' || this.companionMode === 'both');
    this.friendSelect.classList.toggle('hidden', !showFriendSelect);

    for (const [id, btn] of this.poseBtns) {
      btn.classList.toggle('active', id === this.poseMode);
    }
    for (const [id, btn] of this.filterBtns) {
      btn.classList.toggle('active', id === this.filterMode);
    }
  }

  private startCountdownAndCapture(): void {
    if (!this.studioActive || this.countingDown) return;
    this.countingDown = true;
    this.shutterBtn.disabled = true;

    let step = 3;
    const showStep = () => {
      if (!this.studioActive) return;
      this.countdownEl.textContent = String(step);
      this.countdownEl.classList.remove('hidden');
      this.callbacks.onCountdownTick?.();
      step -= 1;
      if (step >= 1) {
        this.countdownTimer = window.setTimeout(showStep, 820);
      } else {
        this.countdownTimer = window.setTimeout(() => {
          this.countdownEl.classList.add('hidden');
          this.executeCapture();
        }, 820);
      }
    };
    showStep();
  }

  private executeCapture(): void {
    this.countingDown = false;
    this.shutterBtn.disabled = false;
    if (!this.studioActive) return;

    const payload = this.callbacks.onRequestCapture();
    this.flashEl.classList.add('active');
    window.clearTimeout(this.flashTimer);
    this.flashTimer = window.setTimeout(() => {
      this.flashEl.classList.remove('active');
    }, 90);

    if (!payload) return;

    const postcardDataUrl = this.composePostcard(payload);
    this.currentDataUrl = postcardDataUrl;
    this.previewImg.src = postcardDataUrl;
    const filterName =
      payload.filter === 'sepia'
        ? 'Sepya Kartpostal'
        : payload.filter === 'bw'
          ? 'Siyah-Beyaz Nostalji'
          : 'Renkli Kartpostal';
    this.previewSubtitle.textContent = filterName;
    const stamp = new Date().toISOString().slice(0, 10);
    this.previewDownloadLink.href = postcardDataUrl;
    this.previewDownloadLink.download = `istanbul-hatirasi-${stamp}.png`;

    this.previewOpen = true;
    this.dockEl.classList.add('hidden');
    this.previewBackdrop.classList.remove('hidden');
  }

  private composePostcard(payload: PhotoBoothCapturePayload): string {
    const outW = 1200;
    const outH = 900;
    const out = document.createElement('canvas');
    out.width = outW;
    out.height = outH;
    const ctx = out.getContext('2d')!;

    // 1. Cream vintage postcard paper background
    ctx.fillStyle = '#faf3e0';
    ctx.fillRect(0, 0, outW, outH);

    // Outer & inner decorative borders
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 6;
    ctx.strokeRect(22, 22, outW - 44, outH - 44);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.strokeRect(34, 34, outW - 68, outH - 68);

    // 2. Photo viewport crop & draw
    const padX = 56;
    const padTop = 52;
    const photoW = outW - padX * 2;
    const photoH = 684;

    const src = payload.canvas;
    const srcAspect = src.width / Math.max(1, src.height);
    const dstAspect = photoW / photoH;
    let sx = 0;
    let sy = 0;
    let sw = src.width;
    let sh = src.height;
    if (srcAspect > dstAspect) {
      sw = src.height * dstAspect;
      sx = (src.width - sw) / 2;
    } else {
      sh = src.width / dstAspect;
      sy = (src.height - sh) / 2;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(padX, padTop, photoW, photoH);
    ctx.clip();

    if ('filter' in ctx) {
      if (payload.filter === 'sepia') {
        ctx.filter = 'sepia(88%) contrast(1.08) brightness(1.02)';
      } else if (payload.filter === 'bw') {
        ctx.filter = 'grayscale(100%) contrast(1.16) brightness(1.03)';
      } else {
        ctx.filter = 'saturate(1.08) contrast(1.04)';
      }
    }
    ctx.drawImage(src, sx, sy, sw, sh, padX, padTop, photoW, photoH);
    ctx.filter = 'none';

    // Subtle vintage sepia/vignette edge overlay
    const vig = ctx.createRadialGradient(
      outW / 2,
      padTop + photoH / 2,
      photoH * 0.34,
      outW / 2,
      padTop + photoH / 2,
      photoW * 0.65
    );
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(
      1,
      payload.filter === 'sepia'
        ? 'rgba(56, 30, 12, 0.38)'
        : 'rgba(15, 23, 42, 0.28)'
    );
    ctx.fillStyle = vig;
    ctx.fillRect(padX, padTop, photoW, photoH);
    ctx.restore();

    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 3;
    ctx.strokeRect(padX, padTop, photoW, photoH);

    // 3. Bottom nostalgic calligraphy & date strip
    const footTop = padTop + photoH + 18;
    ctx.fillStyle = '#451a03';
    ctx.font = 'bold 42px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('İSTANBUL HATIRASI', outW / 2, footTop + 34);

    ctx.fillStyle = '#78350f';
    ctx.font = 'italic 22px Georgia, serif';
    const dateStr = new Date().toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    ctx.fillText(
      `Mirasium Anadolu Keşif Parkı  •  ${payload.caption}  •  ${dateStr}`,
      outW / 2,
      footTop + 82
    );

    return out.toDataURL('image/png');
  }

  private closePreviewToStudio(): void {
    this.previewBackdrop.classList.add('hidden');
    this.previewOpen = false;
    if (this.studioActive) {
      this.dockEl.classList.remove('hidden');
    }
  }

  exitStudio(): void {
    window.clearTimeout(this.countdownTimer);
    window.clearTimeout(this.flashTimer);
    this.countingDown = false;
    this.studioActive = false;
    this.previewOpen = false;
    this.shutterBtn.disabled = false;
    this.dockEl.classList.add('hidden');
    this.countdownEl.classList.add('hidden');
    this.flashEl.classList.remove('active');
    this.previewBackdrop.classList.add('hidden');
    this.callbacks.onExitStudio();
  }

  isOpen(): boolean {
    return this.studioActive || this.previewOpen;
  }

  isPreviewOpen(): boolean {
    return this.previewOpen;
  }

  dispose(): void {
    window.clearTimeout(this.countdownTimer);
    window.clearTimeout(this.flashTimer);
    this.dockEl.remove();
    this.countdownEl.remove();
    this.flashEl.remove();
    this.previewBackdrop.remove();
    this.currentDataUrl = '';
  }
}
