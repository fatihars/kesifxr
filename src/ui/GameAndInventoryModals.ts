import {htmlKaçır, htmlMetin, metin} from "../metinler.ts";
import type {HideSeekMode} from '../scene/HideAndSeekManager.ts';
import {kidAudio} from '../services/kidAudio.ts';
import {
  type BadgeId,
  type InventoryCategory,
  type InventoryItem,
  MUSEUM_BADGES,
  type OutdoorActivityKind,
} from '../types.ts';

export interface GameAndInventoryCallbacks {
  onUseApple: () => boolean;
  onUseFood?: (itemId: string) => boolean;
  onGameWon: (kind: OutdoorActivityKind, title: string, detail: string) => void;
  onGameLost?: (kind: OutdoorActivityKind, message: string) => void;
  onStartHideSeekSeek: () => void;
  onStartHideSeekHide: () => void;
  onStopHideSeek: () => void;
  onPlaySelect: () => void;
}

type InventoryTab =
  | 'all'
  | 'nature'
  | 'food'
  | 'treasure'
  | 'creative_game'
  | 'badges';

interface BestasStone {
  x: number;
  y: number;
  picked: boolean;
  color: string;
}

interface TopacTarget {
  x: number;
  y: number;
  vx: number;
  vy: number;
  knocked: boolean;
  color: string;
}

interface MarbleBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  shine: string;
  outOfRing: boolean;
}

export class GameAndInventoryModals {
  private callbacks: GameAndInventoryCallbacks;

  // Inventory Modal
  private invBackdrop!: HTMLDivElement;
  private invTabsEl!: HTMLDivElement;
  private invGridEl!: HTMLDivElement;
  private invSummaryEl!: HTMLSpanElement;
  private invTab: InventoryTab = 'all';
  private cachedItems: InventoryItem[] = [];
  private cachedBadges = new Set<BadgeId>();
  private cachedApples = 0;

  // Ping-Pong Modal
  private ppBackdrop!: HTMLDivElement;
  private ppCanvas!: HTMLCanvasElement;
  private ppCtx!: CanvasRenderingContext2D;
  private ppScoreEl!: HTMLSpanElement;
  private ppStatusEl!: HTMLDivElement;
  private ppRaf = 0;
  private ppRunning = false;
  private ppWinner: 'player' | 'npc' | null = null;
  private ppPlayerX = 220;
  private ppNpcX = 220;
  private ppBallX = 260;
  private ppBallY = 180;
  private ppBallVx = 175;
  private ppBallVy = 210;
  private ppPlayerScore = 0;
  private ppNpcScore = 0;
  private ppKeys = new Set<string>();
  private ppLastTs = 0;
  private ppServeDelay = 0;
  private ppRally = 0;

  // Mangala Modal
  private mgBackdrop!: HTMLDivElement;
  private mgBoardEl!: HTMLDivElement;
  private mgStatusEl!: HTMLDivElement;
  private mgScoreEl!: HTMLSpanElement;
  private mgPits: number[] = [];
  private mgTurn: 'player' | 'ai' | 'over' = 'player';
  private mgAiTimer: number | null = null;
  private mgWinNotified = false;

  // Ring-Toss Modal
  private rtBackdrop!: HTMLDivElement;
  private rtCanvas!: HTMLCanvasElement;
  private rtCtx!: CanvasRenderingContext2D;
  private rtScoreEl!: HTMLSpanElement;
  private rtThrowsEl!: HTMLSpanElement;
  private rtStatusEl!: HTMLDivElement;
  private rtThrowBtn!: HTMLButtonElement;
  private rtRaf = 0;
  private rtRunning = false;
  private rtScore = 0;
  private rtThrowsLeft = 5;
  private rtAimPhase = 0;
  private rtPowerPhase = 0;
  private rtFlyingRing: {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    t: number;
  } | null = null;
  private rtWinNotified = false;
  private rtLastTs = 0;

  // Hide-and-Seek Modal
  private hsBackdrop!: HTMLDivElement;
  private hsStatusPill!: HTMLSpanElement;
  private hsSeekBtn!: HTMLButtonElement;
  private hsStopBtn!: HTMLButtonElement;

  // 5. Beştaş Modal
  private bsBackdrop!: HTMLDivElement;
  private bsCanvas!: HTMLCanvasElement;
  private bsCtx!: CanvasRenderingContext2D;
  private bsStageEl!: HTMLSpanElement;
  private bsHeartsEl!: HTMLSpanElement;
  private bsStatusEl!: HTMLDivElement;
  private bsTossBtn!: HTMLButtonElement;
  private bsRaf = 0;
  private bsRunning = false;
  private bsLastTs = 0;
  private bsStage = 1; // 1..4 (Birler, İkiler, Üçler, Dörtler)
  private bsLives = 3;
  private bsSubGoal = 1; // Stones needed on current toss
  private bsPickedInToss = 0;
  private bsPhase: 'idle' | 'collecting' | 'catching' | 'won' | 'lost' = 'idle';
  private bsEbeT = 0;
  private bsEbeDuration = 1.65;
  private bsStones: BestasStone[] = [];
  private bsWinNotified = false;

  // 7. Topaç Çevirme Modal
  private tpBackdrop!: HTMLDivElement;
  private tpCanvas!: HTMLCanvasElement;
  private tpCtx!: CanvasRenderingContext2D;
  private tpRpmEl!: HTMLSpanElement;
  private tpTargetEl!: HTMLSpanElement;
  private tpStatusEl!: HTMLDivElement;
  private tpLaunchBtn!: HTMLButtonElement;
  private tpRaf = 0;
  private tpRunning = false;
  private tpLastTs = 0;
  private tpState: 'aim' | 'spinning' | 'won' | 'lost' = 'aim';
  private tpPowerPhase = 0;
  private tpTopX = 240;
  private tpTopY = 165;
  private tpTopVx = 0;
  private tpTopVy = 0;
  private tpSpinAngle = 0;
  private tpRpm = 0; // 0..100
  private tpSteerTarget: {x: number; y: number} | null = null;
  private tpTargets: TopacTarget[] = [];
  private tpWinNotified = false;

  // 8. Misket / Cıncık Modal
  private mkBackdrop!: HTMLDivElement;
  private mkCanvas!: HTMLCanvasElement;
  private mkCtx!: CanvasRenderingContext2D;
  private mkScoreEl!: HTMLSpanElement;
  private mkShotsEl!: HTMLSpanElement;
  private mkStatusEl!: HTMLDivElement;
  private mkShootBtn!: HTMLButtonElement;
  private mkRaf = 0;
  private mkRunning = false;
  private mkLastTs = 0;
  private mkAimAngle = -Math.PI / 2;
  private mkPowerPhase = 0;
  private mkShooting = false;
  private mkShotsLeft = 5;
  private mkOutCount = 0;
  private mkMarbles: MarbleBody[] = [];
  private mkWinNotified = false;

  constructor(hostRoot: HTMLElement, callbacks: GameAndInventoryCallbacks) {
    this.callbacks = callbacks;
    this.buildInventoryModal(hostRoot);
    this.buildPingPongModal(hostRoot);
    this.buildMangalaModal(hostRoot);
    this.buildRingTossModal(hostRoot);
    this.buildHideSeekModal(hostRoot);
    this.buildBestasModal(hostRoot);
    this.buildTopacModal(hostRoot);
    this.buildMisketModal(hostRoot);
    window.addEventListener('keydown', this.handleWindowKeyDown);
    window.addEventListener('keyup', this.handleWindowKeyUp);
    window.addEventListener('blur', this.clearGameKeys);
  }

  /**
   * Builds a toggleable/collapsible cultural introduction & rules panel
   * included in EVERY interactive game modal.
   */
  private createCollapsibleIntro(
    icon: string,
    title: string,
    cultureStory: string,
    howToPlay: string
  ): HTMLDivElement {
    const wrap = document.createElement('div');
    wrap.className = 'hud-game-intro';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'hud-game-intro-toggle';
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.textContent = metin("GameAndInventoryModals", "1_2_oyunu_tani_ve_kurallari_oku", icon, title);

    const panel = document.createElement('div');
    panel.className = "hud-game-intro-panel hidden";
    panel.innerHTML = `
      <div class="hud-game-intro-section">
        <strong>${htmlMetin("GameAndInventoryModals", "kulturel_kokeni")}</strong> ${cultureStory}
      </div>
      <div class="hud-game-intro-section">
        <strong>${htmlMetin("GameAndInventoryModals", "nasil_oynanir")}</strong> ${howToPlay}
      </div>
    `;

    toggleBtn.onclick = () => {
      this.callbacks.onPlaySelect();
      const willOpen = panel.classList.contains('hidden');
      panel.classList.toggle('hidden', !willOpen);
      toggleBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      toggleBtn.textContent = willOpen
        ? metin("GameAndInventoryModals", "1_2_tanitimi_gizle", icon, title)
        : metin("GameAndInventoryModals", "1_2_oyunu_tani_ve_kurallari_oku", icon, title);
    };

    wrap.append(toggleBtn, panel);
    return wrap;
  }

  private clearGameKeys = (): void => this.ppKeys.clear();

  private handleWindowKeyDown = (e: KeyboardEvent): void => {
    const movementKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS'];
    if ((this.ppRunning || this.tpRunning || this.mkRunning) && movementKeys.includes(e.code)) {
      e.preventDefault();
      this.ppKeys.add(e.code);
    }
    if (e.code !== 'Space' || e.repeat) return;
    if (e.target instanceof Element && e.target.closest('button, a, summary, input, textarea, select')) return;

    if (this.rtRunning && !this.rtBackdrop.classList.contains('hidden')) {
      e.preventDefault();
      this.throwRing();
    } else if (
      this.bsRunning &&
      !this.bsBackdrop.classList.contains('hidden')
    ) {
      e.preventDefault();
      if (this.bsPhase === 'catching') {
        this.catchBestasEbe();
      } else {
        this.tossBestasEbe();
      }
    } else if (
      this.tpRunning &&
      !this.tpBackdrop.classList.contains('hidden') &&
      this.tpState === 'aim'
    ) {
      e.preventDefault();
      this.launchTopac();
    } else if (
      this.mkRunning &&
      !this.mkBackdrop.classList.contains('hidden')
    ) {
      e.preventDefault();
      this.shootMisket();
    }
  };

  private handleWindowKeyUp = (e: KeyboardEvent): void => {
    this.ppKeys.delete(e.code);
  };

  // ======================== 1. INVENTORY MODAL ========================
  private buildInventoryModal(host: HTMLElement): void {
    this.invBackdrop = document.createElement('div');
    this.invBackdrop.className = "hud-modal-backdrop hidden";
    this.invBackdrop.onclick = (e) => {
      if (e.target === this.invBackdrop) this.closeAll();
    };

    const card = document.createElement('div');
    card.className = "hud-modal-card hud-inv-modal-card";

    const top = document.createElement('div');
    top.className = 'hud-modal-top';
    const badges = document.createElement('div');
    badges.className = 'hud-group';
    const titlePill = document.createElement('span');
    titlePill.className = "hud-pill hud-pill-gold";
    titlePill.textContent = metin("GameAndInventoryModals", "kesif_cantam_rozetler");
    this.invSummaryEl = document.createElement('span');
    this.invSummaryEl.className = "hud-pill hud-pill-sky";
    this.invSummaryEl.textContent = metin("GameAndInventoryModals", "0_esya");
    badges.append(titlePill, this.invSummaryEl);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'hud-close-btn';
    closeBtn.textContent = metin("GameAndInventoryModals", "kapat_simgeli");
    closeBtn.onclick = () => this.closeAll();
    top.append(badges, closeBtn);

    this.invTabsEl = document.createElement('div');
    this.invTabsEl.className = 'hud-tabs';

    this.invGridEl = document.createElement('div');
    this.invGridEl.className = 'hud-inv-grid';

    card.append(top, this.invTabsEl, this.invGridEl);
    this.invBackdrop.appendChild(card);
    host.appendChild(this.invBackdrop);
  }

  openInventoryModal(
    items: InventoryItem[],
    unlockedBadges: Set<BadgeId>,
    appleCount: number
  ): void {
    this.closeAll();
    this.cachedItems = items.map((it) => ({...it}));
    this.cachedBadges = new Set(unlockedBadges);
    this.cachedApples = appleCount;
    this.renderInventory();
    this.invBackdrop.classList.remove('hidden');
  }

  private renderInventory(): void {
    const totalCount = this.cachedItems.reduce((acc, i) => acc + i.count, 0);
    this.invSummaryEl.textContent = metin("GameAndInventoryModals", "1_esya_2_3_rozet", totalCount, this.cachedBadges.size, MUSEUM_BADGES.length);

    this.invTabsEl.innerHTML = '';
    const tabs: Array<{id: InventoryTab; label: string}> = [
      {id: 'all', label: metin("GameAndInventoryModals", "tumu")},
      {id: 'nature', label: metin("GameAndInventoryModals", "dogadan")},
      {id: 'food', label: metin("GameAndInventoryModals", "lezzetler")},
      {id: 'treasure', label: metin("GameAndInventoryModals", "hazineler")},
      {id: 'creative_game', label: metin("GameAndInventoryModals", "oyun_sanat")},
      {id: 'badges', label: metin("GameAndInventoryModals", "rozetler_1", this.cachedBadges.size)},
    ];

    for (const t of tabs) {
      const btn = document.createElement('button');
      btn.className = `hud-tab ${this.invTab === t.id ? 'active' : ''}`;
      btn.textContent = t.label;
      btn.onclick = () => {
        this.callbacks.onPlaySelect();
        this.invTab = t.id;
        this.renderInventory();
      };
      this.invTabsEl.appendChild(btn);
    }

    this.invGridEl.innerHTML = '';

    if (this.invTab === 'badges') {
      for (const badge of MUSEUM_BADGES) {
        const unlocked = this.cachedBadges.has(badge.id);
        const card = document.createElement('div');
        card.className = `hud-badge-card ${unlocked ? 'unlocked' : 'locked'}`;
        card.innerHTML = `
          <div class="hud-badge-card-icon">${badge.icon}</div>
          <div class="hud-badge-card-body">
            <div class="hud-badge-card-title">${htmlKaçır(badge.title)} ${unlocked ? '✅' : '🔒'}</div>
            <div class="hud-badge-card-desc">${htmlKaçır(badge.description)}</div>
          </div>
        `;
        this.invGridEl.appendChild(card);
      }
      return;
    }

    const filtered = this.cachedItems.filter((item) => {
      if (item.count <= 0) return false;
      if (this.invTab === 'all') return true;
      if (this.invTab === 'creative_game') {
        return item.category === 'game' || item.category === 'creative';
      }
      return item.category === (this.invTab as InventoryCategory);
    });

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'hud-inv-empty';
      empty.innerHTML = `
        <div class="hud-inv-empty-icon">🧭</div>
        <div>${htmlMetin("GameAndInventoryModals", "cantan_bu_bolumde_henuz_bos")}</div>
        <div class="hud-inv-empty-sub">${htmlMetin("GameAndInventoryModals", "bahceden_elma_topla_kazi_yap_anadolu_oyunlarini")}</div>
      `;
      this.invGridEl.appendChild(empty);
      return;
    }

    for (const item of filtered) {
      const card = document.createElement('div');
      card.className = 'hud-inv-card';

      const iconBox = document.createElement('div');
      iconBox.className = 'hud-inv-icon';
      iconBox.textContent = item.icon;

      const body = document.createElement('div');
      body.className = 'hud-inv-body';

      const header = document.createElement('div');
      header.className = 'hud-inv-header';
      const nameEl = document.createElement('span');
      nameEl.className = 'hud-inv-name';
      nameEl.textContent = item.name;
      const countEl = document.createElement('span');
      countEl.className = 'hud-inv-count';
      countEl.textContent = `×${item.count}`;
      header.append(nameEl, countEl);

      const desc = document.createElement('div');
      desc.className = 'hud-inv-desc';
      desc.textContent = item.description;

      body.append(header, desc);

      if (item.id === 'apple' && this.cachedApples > 0) {
        const useBtn = document.createElement('button');
        useBtn.className = "hud-mini-btn hud-mini-primary hud-inv-use-btn";
        useBtn.textContent = item.usableLabel ?? metin("GameAndInventoryModals", "ye_hiz");
        useBtn.onclick = () => {
          if (this.callbacks.onUseApple()) {
            this.cachedApples = Math.max(0, this.cachedApples - 1);
            item.count = Math.max(0, item.count - 1);
            this.renderInventory();
          }
        };
        body.appendChild(useBtn);
      } else if (item.category === 'food' && item.count > 0) {
        const useBtn = document.createElement('button');
        useBtn.className = "hud-mini-btn hud-mini-primary hud-inv-use-btn";
        useBtn.textContent = item.usableLabel ?? metin("GameAndInventoryModals", "ye_ic_enerji");
        useBtn.onclick = () => {
          if (this.callbacks.onUseFood?.(item.id)) {
            item.count = Math.max(0, item.count - 1);
            this.renderInventory();
          }
        };
        body.appendChild(useBtn);
      }

      card.append(iconBox, body);
      this.invGridEl.appendChild(card);
    }
  }

  // ======================== 2. PING-PONG MODAL ========================
  private buildPingPongModal(host: HTMLElement): void {
    this.ppBackdrop = document.createElement('div');
    this.ppBackdrop.className = "hud-modal-backdrop hidden";
    this.ppBackdrop.onclick = (e) => {
      if (e.target === this.ppBackdrop) this.closeAll();
    };

    const card = document.createElement('div');
    card.className = "hud-modal-card hud-game-modal-card";

    const top = document.createElement('div');
    top.className = 'hud-modal-top';
    const info = document.createElement('div');
    info.className = 'hud-group';
    const titlePill = document.createElement('span');
    titlePill.className = "hud-pill hud-pill-gold";
    titlePill.textContent = metin("GameAndInventoryModals", "masa_tenisi_duellosu");
    this.ppScoreEl = document.createElement('span');
    this.ppScoreEl.className = "hud-pill hud-pill-sky";
    this.ppScoreEl.textContent = metin("GameAndInventoryModals", "sen_0_0_sporcu_npc");
    info.append(titlePill, this.ppScoreEl);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'hud-close-btn';
    closeBtn.textContent = metin("GameAndInventoryModals", "kapat_simgeli");
    closeBtn.onclick = () => this.closeAll();
    top.append(info, closeBtn);

    const intro = this.createCollapsibleIntro(
      '🏓',
      metin("GameAndInventoryModals", "masa_tenisi"),
      metin("GameAndInventoryModals", "okul_bahcelerinin_ve_genclik_kuluplerinin_en_hizli"),
      metin("GameAndInventoryModals", "raketini_fare_parmak_veya_a_d_tuslariyla")
    );

    this.ppStatusEl = document.createElement('div');
    this.ppStatusEl.className = 'hud-game-status';
    this.ppStatusEl.textContent =
      metin("GameAndInventoryModals", "raketini_fare_parmakla_veya_tuslariyla_hareket_ettir");

    this.ppCanvas = document.createElement('canvas');
    this.ppCanvas.width = 520;
    this.ppCanvas.height = 360;
    this.ppCanvas.className = 'hud-pingpong-canvas';
    this.ppCtx = this.ppCanvas.getContext('2d')!;

    const movePaddleToClientX = (clientX: number) => {
      const rect = this.ppCanvas.getBoundingClientRect();
      if (rect.width <= 0) return;
      const norm = (clientX - rect.left) / rect.width;
      this.ppPlayerX = Math.max(46, Math.min(474, norm * 520));
    };
    this.ppCanvas.addEventListener('pointermove', (e) => {
      movePaddleToClientX(e.clientX);
    });
    this.ppCanvas.addEventListener('pointerdown', (e) => {
      this.ppCanvas.setPointerCapture(e.pointerId);
      movePaddleToClientX(e.clientX);
    });

    const actions = document.createElement('div');
    actions.className = 'hud-modal-actions';
    const restartBtn = document.createElement('button');
    restartBtn.className = "hud-btn hud-btn-primary";
    restartBtn.textContent = metin("GameAndInventoryModals", "yeniden_baslat");
    restartBtn.onclick = () => {
      this.callbacks.onPlaySelect();
      this.resetPingPong();
      this.startPingPongLoop();
    };
    actions.appendChild(restartBtn);

    card.append(top, intro, this.ppStatusEl, this.ppCanvas, actions);
    this.ppBackdrop.appendChild(card);
    host.appendChild(this.ppBackdrop);
  }

  private resetPingPong(): void {
    this.ppPlayerScore = 0;
    this.ppNpcScore = 0;
    this.ppWinner = null;
    this.ppPlayerX = 260;
    this.ppNpcX = 260;
    this.resetPingPongBall(1);
    this.ppScoreEl.textContent = metin("GameAndInventoryModals", "sen_0_0_sporcu_npc");
    this.ppStatusEl.textContent =
      metin("GameAndInventoryModals", "raketini_fare_parmakla_veya_tuslariyla_hareket_ettir");
  }

  private resetPingPongBall(dirY: number): void {
    this.ppServeDelay = 0.95;
    this.ppRally = 0;
    this.ppBallX = 260;
    this.ppBallY = 180;
    const angle = (Math.random() - 0.5) * 0.9;
    const speed = 250;
    this.ppBallVx = Math.sin(angle) * speed;
    this.ppBallVy = Math.cos(angle) * speed * dirY;
  }

  private startPingPongLoop(): void {
    this.stopPingPongLoop();
    this.ppRunning = true;
    this.ppLastTs = performance.now();
    const tick = (now: number) => {
      if (!this.ppRunning) return;
      const dt = Math.min((now - this.ppLastTs) / 1000, 0.04);
      this.ppLastTs = now;
      this.stepPingPong(dt);
      this.drawPingPong();
      if (this.ppWinner) this.stopPingPongLoop();
      else this.ppRaf = requestAnimationFrame(tick);
    };
    this.ppRaf = requestAnimationFrame(tick);
  }

  private stopPingPongLoop(): void {
    this.ppRunning = false;
    this.clearGameKeys();
    if (this.ppRaf) {
      cancelAnimationFrame(this.ppRaf);
      this.ppRaf = 0;
    }
  }

  private stepPingPong(dt: number): void {
    if (this.ppWinner) return;

    if (this.ppKeys.has('ArrowLeft') || this.ppKeys.has('KeyA')) {
      this.ppPlayerX -= 360 * dt;
    }
    if (this.ppKeys.has('ArrowRight') || this.ppKeys.has('KeyD')) {
      this.ppPlayerX += 360 * dt;
    }
    this.ppPlayerX = Math.max(48, Math.min(472, this.ppPlayerX));

    if (this.ppServeDelay > 0) {
      this.ppServeDelay -= dt;
      if (this.ppServeDelay <= 0) this.ppStatusEl.textContent = metin("GameAndInventoryModals", "raketin_kenariyla_vurarak_topa_yon_ver");
      return;
    }

    const npcTarget = this.ppBallVy < 0 ? this.ppBallX : 260;
    const npcDiff = npcTarget - this.ppNpcX;
    const npcMaxSpeed = Math.min(230, 148 + 15 * this.ppPlayerScore + 5 * this.ppRally);
    const npcStep = Math.sign(npcDiff) * Math.min(Math.abs(npcDiff), npcMaxSpeed * dt);
    this.ppNpcX = Math.max(48, Math.min(472, this.ppNpcX + npcStep));

    const previousY = this.ppBallY;
    this.ppBallX += this.ppBallVx * dt;
    this.ppBallY += this.ppBallVy * dt;

    if (this.ppBallX <= 12) {
      this.ppBallX = 12;
      this.ppBallVx = Math.abs(this.ppBallVx);
    } else if (this.ppBallX >= 508) {
      this.ppBallX = 508;
      this.ppBallVx = -Math.abs(this.ppBallVx);
    }

    if (
      this.ppBallVy > 0 &&
      previousY < 322 &&
      this.ppBallY >= 322 &&
      Math.abs(this.ppBallX - this.ppPlayerX) <= 50
    ) {
      const hitOffset = (this.ppBallX - this.ppPlayerX) / 50;
      const speed = Math.min(
        420,
        Math.hypot(this.ppBallVx, this.ppBallVy) * 1.045
      );
      const bounceAngle = hitOffset * 0.85;
      this.ppBallVx = Math.sin(bounceAngle) * speed;
      this.ppBallVy = -Math.cos(bounceAngle) * speed;
      this.ppBallY = 321;
      this.ppRally++;
      this.ppStatusEl.textContent = metin("GameAndInventoryModals", "ralli_1_donus", this.ppRally);
      this.callbacks.onPlaySelect();
    }

    if (
      this.ppBallVy < 0 &&
      previousY > 38 &&
      this.ppBallY <= 38 &&
      Math.abs(this.ppBallX - this.ppNpcX) <= 50
    ) {
      const hitOffset = (this.ppBallX - this.ppNpcX) / 50;
      const speed = Math.min(
        420,
        Math.hypot(this.ppBallVx, this.ppBallVy) * 1.035
      );
      const bounceAngle = hitOffset * 0.8;
      this.ppBallVx = Math.sin(bounceAngle) * speed;
      this.ppBallVy = Math.cos(bounceAngle) * speed;
      this.ppBallY = 39;
    }

    if (this.ppBallY < 0) {
      this.ppPlayerScore++;
      this.ppScoreEl.textContent = metin("GameAndInventoryModals", "sen_1_2_sporcu_npc", this.ppPlayerScore, this.ppNpcScore);
      if (this.ppPlayerScore >= 5) {
        this.ppWinner = 'player';
        this.ppStatusEl.textContent =
          metin("GameAndInventoryModals", "tebrikler_masa_tenisi_duellosunu_kazandin_ve_kupa");
        this.callbacks.onGameWon(
          'pingpong',
          metin("GameAndInventoryModals", "masa_tenisi_kupasi"),
          metin("GameAndInventoryModals", "sporcu_npc_ye_karsi_5_sayilik_masa")
        );
      } else {
        this.ppStatusEl.textContent = metin("GameAndInventoryModals", "sayi_senin_yeni_servis_geliyor");
        this.resetPingPongBall(1);
      }
    } else if (this.ppBallY > 360) {
      this.ppNpcScore++;
      this.ppScoreEl.textContent = metin("GameAndInventoryModals", "sen_1_2_sporcu_npc", this.ppPlayerScore, this.ppNpcScore);
      if (this.ppNpcScore >= 5) {
        this.ppWinner = 'npc';
        this.ppStatusEl.textContent =
          metin("GameAndInventoryModals", "cok_yaklastin_yeniden_baslat_diyerek_rovansi_alabilirsin");
      } else {
        this.ppStatusEl.textContent = metin("GameAndInventoryModals", "rakip_sayi_aldi_yeni_servis_geliyor");
        this.resetPingPongBall(-1);
      }
    }
  }

  private drawPingPong(): void {
    const ctx = this.ppCtx;
    ctx.fillStyle = '#195c62';
    ctx.fillRect(0, 0, 520, 360);

    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, 504, 344);

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(260, 8);
    ctx.lineTo(260, 352);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(226,232,240,0.85)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(8, 180);
    ctx.lineTo(512, 180);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.roundRect(this.ppNpcX - 44, 20, 88, 14, 7);
    ctx.fill();

    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.roundRect(this.ppPlayerX - 44, 326, 88, 14, 7);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.ppBallX, this.ppBallY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // ======================== 3. MANGALA MODAL ========================
  private buildMangalaModal(host: HTMLElement): void {
    this.mgBackdrop = document.createElement('div');
    this.mgBackdrop.className = "hud-modal-backdrop hidden";
    this.mgBackdrop.onclick = (e) => {
      if (e.target === this.mgBackdrop) this.closeAll();
    };

    const card = document.createElement('div');
    card.className = "hud-modal-card hud-game-modal-card";

    const top = document.createElement('div');
    top.className = 'hud-modal-top';
    const info = document.createElement('div');
    info.className = 'hud-group';
    const titlePill = document.createElement('span');
    titlePill.className = "hud-pill hud-pill-gold";
    titlePill.textContent = metin("GameAndInventoryModals", "turk_zeka_oyunu_mangala");
    this.mgScoreEl = document.createElement('span');
    this.mgScoreEl.className = "hud-pill hud-pill-sky";
    this.mgScoreEl.textContent = metin("GameAndInventoryModals", "baslangic_mangala_skoru");
    info.append(titlePill, this.mgScoreEl);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'hud-close-btn';
    closeBtn.textContent = metin("GameAndInventoryModals", "kapat_simgeli");
    closeBtn.onclick = () => this.closeAll();
    top.append(info, closeBtn);

    const intro = this.createCollapsibleIntro(
      '🏺',
      metin("GameAndInventoryModals", "mangala_turk_zeka_ve_strateji_oyunu"),
      metin("GameAndInventoryModals", "orta_asya_bozkirlarindan_selcuklu_ve_osmanli_saraylarina"),
      metin("GameAndInventoryModals", "alt_siradan_tas_olan_bir_kuyu_sec")
    );

    this.mgStatusEl = document.createElement('div');
    this.mgStatusEl.className = 'hud-game-status';

    this.mgBoardEl = document.createElement('div');
    this.mgBoardEl.className = 'hud-mangala-board';

    const actions = document.createElement('div');
    actions.className = 'hud-modal-actions';
    const restartBtn = document.createElement('button');
    restartBtn.className = "hud-btn hud-btn-primary";
    restartBtn.textContent = metin("GameAndInventoryModals", "yeni_oyun");
    restartBtn.onclick = () => {
      this.callbacks.onPlaySelect();
      this.resetMangala();
    };
    actions.appendChild(restartBtn);

    card.append(top, intro, this.mgStatusEl, this.mgBoardEl, actions);
    this.mgBackdrop.appendChild(card);
    host.appendChild(this.mgBackdrop);
  }

  private resetMangala(): void {
    if (this.mgAiTimer !== null) {
      window.clearTimeout(this.mgAiTimer);
      this.mgAiTimer = null;
    }
    this.mgPits = [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0];
    this.mgTurn = 'player';
    this.mgWinNotified = false;
    this.mgStatusEl.textContent =
      metin("GameAndInventoryModals", "sira_sende_alt_siradaki_kuyularindan_birine_tikla");
    this.renderMangala();
  }

  private renderMangala(): void {
    const pScore = this.mgPits[6] ?? 0;
    const aiScore = this.mgPits[13] ?? 0;
    this.mgScoreEl.textContent = metin("GameAndInventoryModals", "hazine_sen_1_usta_2", pScore, aiScore);
    this.mgBoardEl.innerHTML = '';

    const aiHazine = document.createElement('div');
    aiHazine.className = "hud-mangala-hazine ai";
    aiHazine.innerHTML = `<div class="hud-mangala-hlabel">${htmlMetin("GameAndInventoryModals", "usta")}</div><div class="hud-mangala-count">${aiScore}</div>`;

    const centerRows = document.createElement('div');
    centerRows.className = 'hud-mangala-rows';

    const topRow = document.createElement('div');
    topRow.className = 'hud-mangala-row';
    for (let idx = 12; idx >= 7; idx--) {
      const pit = document.createElement('button');
      pit.className = "hud-mangala-pit ai";
      pit.disabled = true;
      pit.innerHTML = `<span class="hud-mangala-stones">${this.mgPits[idx]}</span><span class="hud-mangala-dots">${'●'.repeat(Math.min(6, this.mgPits[idx]))}</span>`;
      topRow.appendChild(pit);
    }

    const botRow = document.createElement('div');
    botRow.className = 'hud-mangala-row';
    for (let idx = 0; idx <= 5; idx++) {
      const count = this.mgPits[idx];
      const pit = document.createElement('button');
      pit.className = `hud-mangala-pit player ${this.mgTurn === 'player' && count > 0 ? 'playable' : ''}`;
      pit.disabled = this.mgTurn !== 'player' || count === 0;
      const steps = count === 1 ? 1 : count - 1;
      const reachesTreasure = count > 0 && (idx + steps) % 13 === 6;
      pit.setAttribute('aria-label', metin("GameAndInventoryModals", "1_kuyu_2_tas_3", idx + 1, count, reachesTreasure ? metin("GameAndInventoryModals", "ek_hamle") : ''));
      pit.innerHTML = `<span class="hud-mangala-stones">${count}</span><span class="hud-mangala-dots">${'●'.repeat(Math.min(6, count))}</span>`;
      if (reachesTreasure && !pit.disabled) {
        const hint = document.createElement('span');
        hint.className = 'hud-mangala-extra';
        hint.textContent = metin("GameAndInventoryModals", "ek_hamle_2");
        pit.append(hint);
      }
      pit.onclick = () => this.playMangalaMove(idx, 'player');
      botRow.appendChild(pit);
    }

    centerRows.append(topRow, botRow);

    const pHazine = document.createElement('div');
    pHazine.className = "hud-mangala-hazine player";
    pHazine.innerHTML = `<div class="hud-mangala-hlabel">${htmlMetin("GameAndInventoryModals", "sen")}</div><div class="hud-mangala-count">${pScore}</div>`;

    this.mgBoardEl.append(aiHazine, centerRows, pHazine);
  }

  private playMangalaMove(pitIndex: number, side: 'player' | 'ai'): void {
    const stones = this.mgPits[pitIndex];
    if (stones <= 0 || this.mgTurn !== side) return;
    this.callbacks.onPlaySelect();

    const oppHazine = side === 'player' ? 13 : 6;
    const ownHazine = side === 'player' ? 6 : 13;
    const ownMin = side === 'player' ? 0 : 7;
    const ownMax = side === 'player' ? 5 : 12;
    const oppMin = side === 'player' ? 7 : 0;
    const oppMax = side === 'player' ? 12 : 5;

    let cursor = pitIndex;
    if (stones === 1) {
      this.mgPits[pitIndex] = 0;
      cursor = (cursor + 1) % 14;
      if (cursor === oppHazine) cursor = (cursor + 1) % 14;
      this.mgPits[cursor]++;
    } else {
      this.mgPits[pitIndex] = 1;
      let rem = stones - 1;
      while (rem > 0) {
        cursor = (cursor + 1) % 14;
        if (cursor === oppHazine) continue;
        this.mgPits[cursor]++;
        rem--;
      }
    }

    let extraTurn = false;
    let note = '';

    if (cursor === ownHazine) {
      extraTurn = true;
      note =
        side === 'player'
          ? metin("GameAndInventoryModals", "son_tas_hazinene_dustu_bir_tur_daha")
          : metin("GameAndInventoryModals", "usta_hazinesine_denk_getirdi_tekrar_oynuyor");
    } else if (
      cursor >= oppMin &&
      cursor <= oppMax &&
      this.mgPits[cursor] % 2 === 0
    ) {
      const gained = this.mgPits[cursor];
      this.mgPits[cursor] = 0;
      this.mgPits[ownHazine] += gained;
      note =
        side === 'player'
          ? metin("GameAndInventoryModals", "rakip_kuyuyu_ciftledin_ve_1_tas_topladin", gained)
          : metin("GameAndInventoryModals", "usta_cift_kuraliyla_1_tas_aldi", gained);
    } else if (
      cursor >= ownMin &&
      cursor <= ownMax &&
      this.mgPits[cursor] === 1
    ) {
      const opposite = 12 - cursor;
      if (this.mgPits[opposite] > 0) {
        const gained = this.mgPits[opposite] + 1;
        this.mgPits[opposite] = 0;
        this.mgPits[cursor] = 0;
        this.mgPits[ownHazine] += gained;
        note =
          side === 'player'
            ? metin("GameAndInventoryModals", "kendi_bos_kuyuna_dustun_karsi_kuyudaki_taslarla", gained)
            : metin("GameAndInventoryModals", "usta_karsi_kuyudan_1_tas_kapti", gained);
      }
    }

    const pEmpty = this.mgPits.slice(0, 6).every((n) => n === 0);
    const aiEmpty = this.mgPits.slice(7, 13).every((n) => n === 0);
    if (pEmpty || aiEmpty) {
      if (pEmpty) {
        for (let i = 7; i <= 12; i++) {
          this.mgPits[6] += this.mgPits[i];
          this.mgPits[i] = 0;
        }
      } else {
        for (let i = 0; i <= 5; i++) {
          this.mgPits[13] += this.mgPits[i];
          this.mgPits[i] = 0;
        }
      }
      this.mgTurn = 'over';
      const playerWon = this.mgPits[6] > this.mgPits[13];
      const tied = this.mgPits[6] === this.mgPits[13];
      this.mgStatusEl.textContent = playerWon
        ? metin("GameAndInventoryModals", "tebrikler_1_2_skorla_mangala_ustasi_oldun", this.mgPits[6], this.mgPits[13])
        : tied
          ? metin("GameAndInventoryModals", "berabere_1_2", this.mgPits[6], this.mgPits[13])
          : metin("GameAndInventoryModals", "usta_kazandi_1_2", this.mgPits[6], this.mgPits[13]);
      this.renderMangala();
      if (playerWon && !this.mgWinNotified) {
        this.mgWinNotified = true;
        this.callbacks.onGameWon(
          'mangala',
          metin("GameAndInventoryModals", "mangala_ustasi_madalyasi"),
          metin("GameAndInventoryModals", "geleneksel_turk_zeka_oyunu_mangala_da_kultur", this.mgPits[6], this.mgPits[13])
        );
      }
      return;
    }

    if (extraTurn) {
      this.mgTurn = side;
    } else {
      this.mgTurn = side === 'player' ? 'ai' : 'player';
    }

    if (this.mgTurn === 'player') {
      this.mgStatusEl.textContent =
        note || metin("GameAndInventoryModals", "sira_sende_alt_siradan_bir_kuyu_sec");
    } else {
      this.mgStatusEl.textContent = note || metin("GameAndInventoryModals", "kultur_ustasi_hamlesini_dusunuyor");
      if (this.mgAiTimer !== null) window.clearTimeout(this.mgAiTimer);
      this.mgAiTimer = window.setTimeout(() => {
        this.mgAiTimer = null;
        this.performAiMangalaTurn();
      }, 650);
    }

    this.renderMangala();
  }

  private performAiMangalaTurn(): void {
    if (this.mgTurn !== 'ai') return;
    const choices: number[] = [];
    for (let i = 7; i <= 12; i++) {
      if (this.mgPits[i] > 0) choices.push(i);
    }
    if (choices.length === 0) return;

    const exact = choices.find((idx) => {
      const s = this.mgPits[idx];
      return s === 1 ? idx + 1 === 13 : idx + (s - 1) === 13;
    });
    const chosen =
      exact ?? choices[Math.floor(Math.random() * choices.length)];
    this.playMangalaMove(chosen, 'ai');
  }

  // ======================== 4. RING-TOSS MODAL ========================
  private buildRingTossModal(host: HTMLElement): void {
    this.rtBackdrop = document.createElement('div');
    this.rtBackdrop.className = "hud-modal-backdrop hidden";
    this.rtBackdrop.onclick = (e) => {
      if (e.target === this.rtBackdrop) this.closeAll();
    };

    const card = document.createElement('div');
    card.className = "hud-modal-card hud-game-modal-card";

    const top = document.createElement('div');
    top.className = 'hud-modal-top';
    const info = document.createElement('div');
    info.className = 'hud-group';
    const titlePill = document.createElement('span');
    titlePill.className = "hud-pill hud-pill-gold";
    titlePill.textContent = metin("GameAndInventoryModals", "panayir_halka_atma");
    this.rtScoreEl = document.createElement('span');
    this.rtScoreEl.className = "hud-pill hud-pill-sky";
    this.rtThrowsEl = document.createElement('span');
    this.rtThrowsEl.className = "hud-pill hud-pill-dark";
    info.append(titlePill, this.rtScoreEl, this.rtThrowsEl);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'hud-close-btn';
    closeBtn.textContent = metin("GameAndInventoryModals", "kapat_simgeli");
    closeBtn.onclick = () => this.closeAll();
    top.append(info, closeBtn);

    const intro = this.createCollapsibleIntro(
      '🎯',
      metin("GameAndInventoryModals", "panayir_halka_atma_2"),
      metin("GameAndInventoryModals", "anadolu_daki_senliklerin_bayram_yerlerinin_ve_halk"),
      metin("GameAndInventoryModals", "mavi_nisan_cemberi_tahtadaki_direklerin_uzerine_geldiginde")
    );

    this.rtStatusEl = document.createElement('div');
    this.rtStatusEl.className = 'hud-game-status';

    this.rtCanvas = document.createElement('canvas');
    this.rtCanvas.width = 520;
    this.rtCanvas.height = 320;
    this.rtCanvas.className = 'hud-ringtoss-canvas';
    this.rtCtx = this.rtCanvas.getContext('2d')!;
    this.rtCanvas.onclick = () => this.throwRing();

    const actions = document.createElement('div');
    actions.className = 'hud-modal-actions';

    this.rtThrowBtn = document.createElement('button');
    this.rtThrowBtn.className = "hud-btn hud-btn-amber";
    this.rtThrowBtn.textContent = metin("GameAndInventoryModals", "halka_at_bosluk");
    this.rtThrowBtn.onclick = () => this.throwRing();

    const restartBtn = document.createElement('button');
    restartBtn.className = "hud-btn hud-btn-primary";
    restartBtn.textContent = metin("GameAndInventoryModals", "yeniden_oyna");
    restartBtn.onclick = () => {
      this.callbacks.onPlaySelect();
      this.resetRingToss();
    };

    actions.append(this.rtThrowBtn, restartBtn);
    card.append(top, intro, this.rtStatusEl, this.rtCanvas, actions);
    this.rtBackdrop.appendChild(card);
    host.appendChild(this.rtBackdrop);
  }

  private resetRingToss(): void {
    this.rtScore = 0;
    this.rtThrowsLeft = 5;
    this.rtFlyingRing = null;
    this.rtWinNotified = false;
    this.rtThrowBtn.disabled = false;
    this.rtScoreEl.textContent = metin("GameAndInventoryModals", "baslangic_halka_skoru");
    this.rtThrowsEl.textContent = metin("GameAndInventoryModals", "kalan_halka_5");
    this.rtStatusEl.textContent =
      metin("GameAndInventoryModals", "nisan_ibresi_hedeflerin_uzerine_geldiginde_halka_at");
  }

  private throwRing(): void {
    if (!this.rtRunning || this.rtFlyingRing || this.rtThrowsLeft <= 0) return;
    this.callbacks.onPlaySelect();
    this.rtThrowsLeft--;
    this.rtThrowsEl.textContent = metin("GameAndInventoryModals", "kalan_halka_1", this.rtThrowsLeft);

    const aimX = 260 + Math.sin(this.rtAimPhase) * 195;
    const powerNorm = 0.5 + 0.5 * Math.sin(this.rtPowerPhase);
    const targetY = 175 - powerNorm * 75;
    this.rtFlyingRing = {
      x: 260,
      y: 292,
      targetX: aimX,
      targetY,
      t: 0,
    };
  }

  private startRingTossLoop(): void {
    this.stopRingTossLoop();
    this.rtRunning = true;
    this.rtLastTs = performance.now();
    const tick = (now: number) => {
      if (!this.rtRunning) return;
      const dt = Math.min((now - this.rtLastTs) / 1000, 0.04);
      this.rtLastTs = now;
      this.stepRingToss(dt);
      this.drawRingToss();
      this.rtRaf = requestAnimationFrame(tick);
    };
    this.rtRaf = requestAnimationFrame(tick);
  }

  private stopRingTossLoop(): void {
    this.rtRunning = false;
    if (this.rtRaf) {
      cancelAnimationFrame(this.rtRaf);
      this.rtRaf = 0;
    }
  }

  private stepRingToss(dt: number): void {
    if (!this.rtFlyingRing) {
      this.rtAimPhase += dt * 2.55;
      this.rtPowerPhase += dt * 3.2;
      return;
    }

    this.rtFlyingRing.t += dt * 2.1;
    if (this.rtFlyingRing.t >= 1) {
      const fx = this.rtFlyingRing.targetX;
      const fy = this.rtFlyingRing.targetY;
      this.rtFlyingRing = null;

      const pegs = [
        {x: 110, y: 132, pts: 20},
        {x: 260, y: 118, pts: 30},
        {x: 410, y: 132, pts: 20},
      ];
      let earned = 0;
      for (const peg of pegs) {
        const d = Math.hypot(fx - peg.x, fy - peg.y);
        if (d < 34) {
          earned = peg.pts;
          break;
        } else if (d < 56) {
          earned = 10;
          break;
        }
      }

      this.rtScore += earned;
      this.rtScoreEl.textContent = `Puan: ${this.rtScore} / 60`;
      if (earned > 0) {
        this.rtStatusEl.textContent = metin("GameAndInventoryModals", "tam_isabet_1_puan_kazandin", earned);
      } else {
        this.rtStatusEl.textContent =
          metin("GameAndInventoryModals", "az_farkla_kacti_bir_sonraki_halkaya_odaklan");
      }

      if (this.rtScore >= 60 && !this.rtWinNotified) {
        this.rtWinNotified = true;
        this.rtThrowBtn.disabled = true;
        this.rtStatusEl.textContent =
          metin("GameAndInventoryModals", "tebrikler_60_puana_ulastin_ve_halka_atma");
        this.callbacks.onGameWon(
          'ringtoss',
          metin("GameAndInventoryModals", "halka_atma_sampiyonluk_rozeti"),
          metin("GameAndInventoryModals", "bahce_panayirinda_1_puan_toplayarak_halka_atma", this.rtScore)
        );
      } else if (this.rtThrowsLeft <= 0) {
        this.rtThrowBtn.disabled = true;
        if (!this.rtWinNotified) {
          this.rtStatusEl.textContent = metin("GameAndInventoryModals", "oyun_bitti_toplam_puan_1_60_puan", this.rtScore);
        }
      }
    }
  }

  private drawRingToss(): void {
    const ctx = this.rtCtx;
    const grad = ctx.createLinearGradient(0, 0, 0, 320);
    grad.addColorStop(0, '#4c1d95');
    grad.addColorStop(1, '#831843');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 520, 320);

    ctx.fillStyle = '#be185d';
    ctx.beginPath();
    ctx.roundRect(45, 72, 430, 120, 18);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.stroke();

    const pegs = [
      {x: 110, y: 132, pts: '20'},
      {x: 260, y: 118, pts: '30'},
      {x: 410, y: 132, pts: '20'},
    ];
    for (const peg of pegs) {
      ctx.fillStyle = 'rgba(253, 224, 71, 0.22)';
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, 34, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px "Google Sans", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${peg.pts} P`, peg.x, peg.y + 48);
    }

    const aimX = 260 + Math.sin(this.rtAimPhase) * 195;
    const powerNorm = 0.5 + 0.5 * Math.sin(this.rtPowerPhase);
    const aimY = 175 - powerNorm * 75;

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(aimX, aimY, 20, 0, Math.PI * 2);
    ctx.stroke();

    if (this.rtFlyingRing) {
      const t = Math.min(1, this.rtFlyingRing.t);
      const rx =
        this.rtFlyingRing.x +
        (this.rtFlyingRing.targetX - this.rtFlyingRing.x) * t;
      const arc = Math.sin(t * Math.PI) * 58;
      const ry =
        this.rtFlyingRing.y +
        (this.rtFlyingRing.targetY - this.rtFlyingRing.y) * t -
        arc;
      const radius = 28 - t * 8;
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(rx, ry, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.rtThrowsLeft > 0) {
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(260, 278, 22, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // ======================== 5. HIDE & SEEK MODAL ========================
  private buildHideSeekModal(host: HTMLElement): void {
    this.hsBackdrop = document.createElement('div');
    this.hsBackdrop.className = "hud-modal-backdrop hidden";
    this.hsBackdrop.onclick = (e) => {
      if (e.target === this.hsBackdrop) this.closeAll();
    };

    const card = document.createElement('div');
    card.className = "hud-modal-card hud-game-modal-card";

    const top = document.createElement('div');
    top.className = 'hud-modal-top';
    const info = document.createElement('div');
    info.className = 'hud-group';
    const titlePill = document.createElement('span');
    titlePill.className = "hud-pill hud-pill-gold";
    titlePill.textContent = metin("GameAndInventoryModals", "muze_ici_saklambac_merkezi");
    this.hsStatusPill = document.createElement('span');
    this.hsStatusPill.className = "hud-pill hud-pill-sky";
    info.append(titlePill, this.hsStatusPill);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'hud-close-btn';
    closeBtn.textContent = metin("GameAndInventoryModals", "kapat_simgeli");
    closeBtn.onclick = () => this.closeAll();
    top.append(info, closeBtn);

    const culturalIntro = this.createCollapsibleIntro(
      '🙈',
      metin("GameAndInventoryModals", "geleneksel_saklambac_ebe_tasi"),
      metin("GameAndInventoryModals", "turk_mahalle_kulturunun_vazgecilmezi_ebe_gozlerini_ebe"),
      metin("GameAndInventoryModals", "muze_icinde_artik_sadece_paravan_arkasi_degil")
    );

    const intro = document.createElement('div');
    intro.className = 'hud-hideseek-grid';
    intro.innerHTML = `
      <div class="hud-hideseek-mode-card">
        <div class="hud-hideseek-icon">🔍</div>
        <h3>${htmlMetin("GameAndInventoryModals", "ebe_ol_arkadaslarini_bul")}</h3>
        <p>${htmlMetin("GameAndInventoryModals", "mert_zeynep_aras_ve_defne_1_ve")} <strong>${htmlMetin("GameAndInventoryModals", "sobele")}</strong></p>
      </div>
      <div class="hud-hideseek-mode-card">
        <div class="hud-hideseek-icon">🫣</div>
        <h3>${htmlMetin("GameAndInventoryModals", "saklan_muze_genelinde_gizlen")}</h3>
        <p>${htmlMetin("GameAndInventoryModals", "10_saniyede_1_veya_2_katta_diledigin")} <strong>${htmlMetin("GameAndInventoryModals", "e_ile_comel")}</strong> ${htmlMetin("GameAndInventoryModals", "ebeler_seni_25_saniye_bulamazsa_veya_ebe")}</p>
      </div>
    `;

    const actions = document.createElement('div');
    actions.className = 'hud-modal-actions';

    this.hsSeekBtn = document.createElement('button');
    this.hsSeekBtn.className = "hud-btn hud-btn-primary";
    this.hsSeekBtn.textContent = metin("GameAndInventoryModals", "ebe_ol_4_arkadasi_bul");
    this.hsSeekBtn.onclick = () => {
      this.callbacks.onPlaySelect();
      this.closeAll();
      this.callbacks.onStartHideSeekSeek();
    };

    const hideBtn = document.createElement('button');
    hideBtn.className = "hud-btn hud-btn-amber";
    hideBtn.textContent = metin("GameAndInventoryModals", "saklan_muzede_serbest");
    hideBtn.onclick = () => {
      this.callbacks.onPlaySelect();
      this.closeAll();
      this.callbacks.onStartHideSeekHide();
    };

    this.hsStopBtn = document.createElement('button');
    this.hsStopBtn.className = "hud-btn hud-btn-dark";
    this.hsStopBtn.textContent = metin("GameAndInventoryModals", "oyunu_bitir");
    this.hsStopBtn.onclick = () => {
      this.callbacks.onPlaySelect();
      this.closeAll();
      this.callbacks.onStopHideSeek();
    };

    actions.append(this.hsSeekBtn, hideBtn, this.hsStopBtn);
    card.append(top, culturalIntro, intro, actions);
    this.hsBackdrop.appendChild(card);
    host.appendChild(this.hsBackdrop);
  }

  openHideSeekModal(currentMode: HideSeekMode, kidCount = 4): void {
    this.closeAll();
    const labels: Record<HideSeekMode, string> = {
      idle: metin("GameAndInventoryModals", "oyun_hazir_1_cocuk_bekliyor", kidCount),
      countdown: metin("GameAndInventoryModals", "ebe_sayiyor"),
      seeking: metin("GameAndInventoryModals", "arama_suruyor"),
      hiding: metin("GameAndInventoryModals", "saklanma_suruyor"),
    };
    this.hsSeekBtn.textContent = metin("GameAndInventoryModals", "ebe_ol_1_arkadasi_bul", kidCount);
    this.hsStatusPill.textContent = labels[currentMode];
    this.hsStopBtn.classList.toggle('hidden', currentMode === 'idle');
    this.hsBackdrop.classList.remove('hidden');
  }

  // ======================== 6. BEŞTAŞ MODAL ========================
  private buildBestasModal(host: HTMLElement): void {
    this.bsBackdrop = document.createElement('div');
    this.bsBackdrop.className = "hud-modal-backdrop hidden";
    this.bsBackdrop.onclick = (e) => {
      if (e.target === this.bsBackdrop) this.closeAll();
    };

    const card = document.createElement('div');
    card.className = "hud-modal-card hud-game-modal-card";

    const top = document.createElement('div');
    top.className = 'hud-modal-top';
    const info = document.createElement('div');
    info.className = 'hud-group';
    const titlePill = document.createElement('span');
    titlePill.className = "hud-pill hud-pill-gold";
    titlePill.textContent = metin("GameAndInventoryModals", "anadolu_bestas_oyunu");
    this.bsStageEl = document.createElement('span');
    this.bsStageEl.className = "hud-pill hud-pill-sky";
    this.bsHeartsEl = document.createElement('span');
    this.bsHeartsEl.className = "hud-pill hud-bestas-hearts";
    info.append(titlePill, this.bsStageEl, this.bsHeartsEl);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'hud-close-btn';
    closeBtn.textContent = metin("GameAndInventoryModals", "kapat_simgeli");
    closeBtn.onclick = () => this.closeAll();
    top.append(info, closeBtn);

    const intro = this.createCollapsibleIntro(
      '🪨',
      metin("GameAndInventoryModals", "bestas_birler_ikiler_ucler_dortler"),
      metin("GameAndInventoryModals", "anadolu_nun_neredeyse_her_koy_ve_mahallesinde"),
      metin("GameAndInventoryModals", "altin_ebe_tasi_ni_havaya_at_bosluk")
    );

    this.bsStatusEl = document.createElement('div');
    this.bsStatusEl.className = 'hud-game-status';

    this.bsCanvas = document.createElement('canvas');
    this.bsCanvas.width = 480;
    this.bsCanvas.height = 310;
    this.bsCanvas.className = 'hud-anatolian-canvas';
    this.bsCtx = this.bsCanvas.getContext('2d')!;

    this.bsCanvas.addEventListener('pointerdown', (e) => {
      this.handleBestasCanvasClick(e);
    });

    const actions = document.createElement('div');
    actions.className = 'hud-modal-actions';

    this.bsTossBtn = document.createElement('button');
    this.bsTossBtn.className = "hud-btn hud-btn-amber";
    this.bsTossBtn.textContent = metin("GameAndInventoryModals", "ebe_tasi_at_bosluk");
    this.bsTossBtn.onclick = () => {
      if (this.bsPhase === 'catching') {
        this.catchBestasEbe();
      } else {
        this.tossBestasEbe();
      }
    };

    const restartBtn = document.createElement('button');
    restartBtn.className = "hud-btn hud-btn-primary";
    restartBtn.textContent = metin("GameAndInventoryModals", "bastan_basla");
    restartBtn.onclick = () => {
      this.callbacks.onPlaySelect();
      this.resetBestas(1, true);
    };

    actions.append(this.bsTossBtn, restartBtn);
    card.append(top, intro, this.bsStatusEl, this.bsCanvas, actions);
    this.bsBackdrop.appendChild(card);
    host.appendChild(this.bsBackdrop);
  }

  private updateBestasHeartsDisplay(): void {
    const filled = '❤️'.repeat(Math.max(0, this.bsLives));
    const empty = '🖤'.repeat(Math.max(0, 3 - this.bsLives));
    this.bsHeartsEl.textContent = `${filled}${empty}`;
  }

  private resetBestas(stage = 1, resetLives = false): void {
    if (resetLives) {
      this.bsLives = 3;
      this.bsWinNotified = false;
    }
    this.bsStage = stage;
    this.bsPhase = 'idle';
    this.bsEbeT = 0;
    this.bsPickedInToss = 0;
    this.updateBestasHeartsDisplay();

    const palette = ['#cbd5e1', '#94a3b8', '#e2e8f0', '#a8a29e'];
    const spots = [
      {x: 118, y: 108},
      {x: 196, y: 186},
      {x: 292, y: 114},
      {x: 360, y: 188},
    ];
    this.bsStones = spots.map((pos, idx) => ({
      x: pos.x + (Math.random() - 0.5) * 44,
      y: pos.y + (Math.random() - 0.5) * 34,
      picked: false,
      color: palette[idx % palette.length],
    }));

    this.bsSubGoal = stage === 4 ? 4 : stage === 3 ? 3 : stage === 2 ? 2 : 1;
    const stageNames = ['', '1. Birler', metin("GameAndInventoryModals", "2_ikiler"), metin("GameAndInventoryModals", "3_ucler"), metin("GameAndInventoryModals", "4_dortler")];
    this.bsStageEl.textContent = metin("GameAndInventoryModals", "asama_1_2_4", stageNames[stage], stage);
    this.bsTossBtn.disabled = false;
    this.bsTossBtn.textContent = metin("GameAndInventoryModals", "ebe_tasi_at_bosluk");
    this.bsStatusEl.textContent = metin("GameAndInventoryModals", "ebe_tasi_ni_firlat_1_tasi_topla", this.bsSubGoal);
  }

  private tossBestasEbe(): void {
    if (!this.bsRunning || this.bsPhase !== 'idle' || this.bsWinNotified) return;
    const unpicked = this.bsStones.filter((s) => !s.picked).length;
    if (unpicked === 0) return;

    this.bsSubGoal =
      this.bsStage === 1
        ? 1
        : this.bsStage === 2
          ? Math.min(2, unpicked)
          : this.bsStage === 3
            ? unpicked === 4
              ? 3
              : 1
            : 4;
    this.bsPickedInToss = 0;
    this.bsPhase = 'collecting';
    this.bsEbeT = 0;
    // Shorter airborne time for higher stages / real challenge!
    this.bsEbeDuration =
      this.bsStage === 4 ? 1.85 : this.bsStage === 3 ? 1.7 : 1.55;
    this.bsTossBtn.disabled = true;
    this.bsTossBtn.textContent = metin("GameAndInventoryModals", "taslari_topla");
    kidAudio.playStoneToss();
    this.bsStatusEl.textContent = metin("GameAndInventoryModals", "ebe_havada_cabuk_1_tasa_tikla_0", this.bsSubGoal, this.bsSubGoal);
  }

  private getBestasEbePos(): {x: number; y: number; p: number} {
    const p =
      this.bsPhase === 'collecting' || this.bsPhase === 'catching'
        ? Math.min(1, this.bsEbeT / this.bsEbeDuration)
        : 0;
    const heightArc = Math.sin(p * Math.PI);
    return {x: 240, y: 268 - heightArc * 215, p};
  }

  private catchBestasEbe(): void {
    if (this.bsPhase !== 'catching') return;
    this.bsPhase = 'idle';
    this.bsTossBtn.disabled = false;
    this.bsTossBtn.textContent = metin("GameAndInventoryModals", "ebe_tasi_at_bosluk");
    kidAudio.playStoneToss();

    const remaining = this.bsStones.filter((s) => !s.picked).length;
    if (remaining === 0) {
      if (this.bsStage < 4) {
        const nextStage = this.bsStage + 1;
        kidAudio.playStarCollected();
        this.resetBestas(nextStage, false);
        this.bsStatusEl.textContent = metin("GameAndInventoryModals", "asama_1_tamamlandi_simdi_2_asama_basliyor", nextStage - 1, nextStage);
      } else if (!this.bsWinNotified) {
        this.bsWinNotified = true;
        this.bsPhase = 'won';
        this.bsTossBtn.disabled = true;
        this.bsStageEl.textContent = metin("GameAndInventoryModals", "4_4_tamamlandi");
        this.bsStatusEl.textContent =
          metin("GameAndInventoryModals", "muthis_refleks_4_asamayi_da_ebe_yi");
        this.callbacks.onGameWon(
          'bestas',
          metin("GameAndInventoryModals", "bestas_ustasi_kupasi"),
          metin("GameAndInventoryModals", "anadolu_nun_geleneksel_bestas_oyununda_4_asamayi")
        );
      }
    } else {
      const nextBatch =
        this.bsStage === 3 ? 1 : Math.min(this.bsStage, remaining);
      this.bsStatusEl.textContent = metin("GameAndInventoryModals", "super_yakaladin_kalan_1_tas_icin_tekrar", nextBatch);
    }
  }

  private handleBestasDropFail(reason: string): void {
    this.bsLives--;
    this.updateBestasHeartsDisplay();
    if (this.bsLives <= 0) {
      this.bsPhase = 'lost';
      this.bsTossBtn.disabled = true;
      this.bsTossBtn.textContent = metin("GameAndInventoryModals", "can_kalmadi");
      this.bsStageEl.textContent = metin("GameAndInventoryModals", "oyun_bitti");
      this.bsStatusEl.textContent = metin("GameAndInventoryModals", "1_tum_canlarin_bitti_bastan_basla_ile", reason);
      kidAudio.playGameLose();
      this.callbacks.onGameLost?.(
        'bestas',
        metin("GameAndInventoryModals", "bestas_ta_ebe_tasini_dusurdun_ve_3")
      );
    } else {
      kidAudio.playGameLose();
      this.resetBestas(this.bsStage, false);
      this.bsStatusEl.textContent = metin("GameAndInventoryModals", "1_kalan_can_2_3_3_asamayi", reason, this.bsLives, this.bsStage);
    }
  }

  private handleBestasCanvasClick(e: PointerEvent): void {
    if (!this.bsRunning || this.bsPhase === 'won' || this.bsPhase === 'lost') {
      return;
    }
    const rect = this.bsCanvas.getBoundingClientRect();
    if (rect.width <= 0) return;
    const px = ((e.clientX - rect.left) / rect.width) * 480;
    const py = ((e.clientY - rect.top) / rect.height) * 310;

    if (this.bsPhase === 'idle') {
      if (Math.hypot(px - 240, py - 266) <= 46) {
        this.tossBestasEbe();
      }
      return;
    }

    if (this.bsPhase === 'catching') {
      const ebe = this.getBestasEbePos();
      if (Math.hypot(px - ebe.x, py - ebe.y) <= 58) {
        this.catchBestasEbe();
      }
      return;
    }

    // bsPhase === 'collecting'
    let hitAnyStone = false;
    for (const stone of this.bsStones) {
      if (stone.picked) continue;
      if (Math.hypot(px - stone.x, py - stone.y) <= 30) {
        hitAnyStone = true;
        stone.picked = true;
        this.bsPickedInToss++;
        kidAudio.playStoneToss();
        this.bsStatusEl.textContent = metin("GameAndInventoryModals", "tas_alindi_1_2", this.bsPickedInToss, this.bsSubGoal);

        if (this.bsPickedInToss >= this.bsSubGoal) {
          this.bsPhase = 'catching';
          this.bsTossBtn.disabled = false;
          this.bsTossBtn.textContent = metin("GameAndInventoryModals", "ebe_tasini_yakala_bosluk");
          this.bsStatusEl.textContent =
            metin("GameAndInventoryModals", "simdi_havadaki_ebe_tasi_na_tikla_veya");
        }
        break;
      }
    }

    // Wrong tap penalty makes Beştaş genuinely punishing if clicking carelessly
    if (!hitAnyStone) {
      this.bsEbeT += 0.12;
    }
  }

  private startBestasLoop(): void {
    this.stopBestasLoop();
    this.bsRunning = true;
    this.bsLastTs = performance.now();
    const tick = (now: number) => {
      if (!this.bsRunning) return;
      const dt = Math.min((now - this.bsLastTs) / 1000, 0.04);
      this.bsLastTs = now;
      if (this.bsPhase === 'collecting' || this.bsPhase === 'catching') {
        this.bsEbeT += dt;
        if (this.bsEbeT >= this.bsEbeDuration) {
          const msg =
            this.bsPhase === 'catching'
              ? metin("GameAndInventoryModals", "ebe_tasi_ni_havada_yakalayamadin_yere_dustu")
              : metin("GameAndInventoryModals", "sure_doldu_taslari_toplayamadan_ebe_yere_dustu");
          this.handleBestasDropFail(msg);
        }
      }
      this.drawBestas();
      this.bsRaf = requestAnimationFrame(tick);
    };
    this.bsRaf = requestAnimationFrame(tick);
  }

  private stopBestasLoop(): void {
    this.bsRunning = false;
    if (this.bsRaf) {
      cancelAnimationFrame(this.bsRaf);
      this.bsRaf = 0;
    }
  }

  private drawBestas(): void {
    const ctx = this.bsCtx;
    const grad = ctx.createLinearGradient(0, 0, 0, 310);
    grad.addColorStop(0, '#78350f');
    grad.addColorStop(1, '#451a03');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 480, 310);

    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.roundRect(42, 42, 396, 198, 18);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(253, 224, 71, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(56, 56, 368, 170);

    for (const s of this.bsStones) {
      if (s.picked) continue;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(s.x + 3, s.y + 6, 18, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      if (this.bsPhase === 'collecting') {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 24, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, 18, 13, 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.ellipse(s.x - 5, s.y - 4, 6, 3.5, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    const ebe = this.getBestasEbePos();
    const heightArc = Math.sin(ebe.p * Math.PI);
    const ebeScale = 1 + heightArc * 0.45;

    ctx.fillStyle = `rgba(0,0,0,${0.4 - heightArc * 0.25})`;
    ctx.beginPath();
    ctx.ellipse(240, 274, 20 * (1 - heightArc * 0.3), 9, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.bsPhase === 'collecting' || this.bsPhase === 'catching') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(60, 14, 360, 12);
      ctx.fillStyle =
        this.bsPhase === 'catching'
          ? '#22c55e'
          : ebe.p > 0.72
            ? '#ef4444'
            : '#38bdf8';
      ctx.fillRect(62, 16, 356 * (1 - ebe.p), 8);
    }

    if (this.bsPhase === 'catching') {
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(ebe.x, ebe.y, 34, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = this.bsPhase === 'catching' ? '#fde047' : '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(ebe.x, ebe.y, 19 * ebeScale, 14 * ebeScale, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (this.bsPhase === 'idle' && !this.bsWinNotified) {
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 13px "Google Sans", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(metin("GameAndInventoryModals", "ebe_tasi_firlatmak_icin_tikla"), 240, 298);
    } else if (this.bsPhase === 'catching') {
      ctx.fillStyle = '#86efac';
      ctx.font = 'bold 14px "Google Sans", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(metin("GameAndInventoryModals", "yakalamak_icin_ebe_ye_tikla"), ebe.x, Math.max(42, ebe.y - 34));
    }
  }

  // ======================== 8. TOPAÇ ÇEVİRME MODAL ========================
  private buildTopacModal(host: HTMLElement): void {
    this.tpBackdrop = document.createElement('div');
    this.tpBackdrop.className = "hud-modal-backdrop hidden";
    this.tpBackdrop.onclick = (e) => {
      if (e.target === this.tpBackdrop) this.closeAll();
    };

    const card = document.createElement('div');
    card.className = "hud-modal-card hud-game-modal-card";

    const top = document.createElement('div');
    top.className = 'hud-modal-top';
    const info = document.createElement('div');
    info.className = 'hud-group';
    const titlePill = document.createElement('span');
    titlePill.className = "hud-pill hud-pill-gold";
    titlePill.textContent = metin("GameAndInventoryModals", "anadolu_topac_cevirme");
    this.tpRpmEl = document.createElement('span');
    this.tpRpmEl.className = "hud-pill hud-pill-sky";
    this.tpTargetEl = document.createElement('span');
    this.tpTargetEl.className = "hud-pill hud-pill-dark";
    info.append(titlePill, this.tpRpmEl, this.tpTargetEl);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'hud-close-btn';
    closeBtn.textContent = metin("GameAndInventoryModals", "kapat_simgeli");
    closeBtn.onclick = () => this.closeAll();
    top.append(info, closeBtn);

    const intro = this.createCollapsibleIntro(
      '🪀',
      metin("GameAndInventoryModals", "topac_cevirme_kaytan_kuka"),
      metin("GameAndInventoryModals", "simsir_veya_gurgen_agacindan_tornada_cekilen_ve"),
      metin("GameAndInventoryModals", "1_guc_cubugu_yesile_yaklastiginda_kaytani_cek")
    );

    this.tpStatusEl = document.createElement('div');
    this.tpStatusEl.className = 'hud-game-status';

    this.tpCanvas = document.createElement('canvas');
    this.tpCanvas.width = 480;
    this.tpCanvas.height = 310;
    this.tpCanvas.className = 'hud-anatolian-canvas';
    this.tpCtx = this.tpCanvas.getContext('2d')!;

    const steerFromPointer = (e: PointerEvent) => {
      if (this.tpState !== 'spinning') return;
      const rect = this.tpCanvas.getBoundingClientRect();
      if (rect.width <= 0) return;
      this.tpSteerTarget = {
        x: ((e.clientX - rect.left) / rect.width) * 480,
        y: ((e.clientY - rect.top) / rect.height) * 310,
      };
    };
    this.tpCanvas.addEventListener('pointermove', steerFromPointer);
    this.tpCanvas.addEventListener('pointerdown', (e) => {
      if (this.tpState === 'aim') {
        this.launchTopac();
      } else {
        steerFromPointer(e);
      }
    });

    const actions = document.createElement('div');
    actions.className = 'hud-modal-actions';

    this.tpLaunchBtn = document.createElement('button');
    this.tpLaunchBtn.className = "hud-btn hud-btn-amber";
    this.tpLaunchBtn.textContent = metin("GameAndInventoryModals", "kaytani_cek_firlat_bosluk");
    this.tpLaunchBtn.onclick = () => this.launchTopac();

    const restartBtn = document.createElement('button');
    restartBtn.className = "hud-btn hud-btn-primary";
    restartBtn.textContent = metin("GameAndInventoryModals", "yeniden_basla");
    restartBtn.onclick = () => {
      this.callbacks.onPlaySelect();
      this.resetTopac();
    };

    actions.append(this.tpLaunchBtn, restartBtn);
    card.append(top, intro, this.tpStatusEl, this.tpCanvas, actions);
    this.tpBackdrop.appendChild(card);
    host.appendChild(this.tpBackdrop);
  }

  private resetTopac(): void {
    this.tpState = 'aim';
    this.tpPowerPhase = 0;
    this.tpTopX = 240;
    this.tpTopY = 162;
    this.tpTopVx = 0;
    this.tpTopVy = 0;
    this.tpRpm = 0;
    this.tpSteerTarget = null;
    this.tpWinNotified = false;
    this.tpLaunchBtn.disabled = false;

    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'];
    this.tpTargets = Array.from({length: 5}, (_, idx) => {
      const ang = (idx / 5) * Math.PI * 2 - Math.PI / 2;
      return {
        x: 240 + Math.cos(ang) * 92,
        y: 162 + Math.sin(ang) * 84,
        vx: 0,
        vy: 0,
        knocked: false,
        color: colors[idx],
      };
    });

    this.tpRpmEl.textContent = metin("GameAndInventoryModals", "devir_hazir");
    this.tpTargetEl.textContent = metin("GameAndInventoryModals", "baslangic_topac_skoru");
    this.tpStatusEl.textContent =
      metin("GameAndInventoryModals", "kaytan_guc_ibresi_yesil_ortadayken_kaytani_cek");
  }

  private launchTopac(): void {
    if (!this.tpRunning || this.tpState !== 'aim') return;
    const power = 1 - Math.abs(Math.sin(this.tpPowerPhase)); // 0..1 (1 at peak center)
    const startRpm = Math.round(74 + power * 26);
    this.tpRpm = startRpm;
    this.tpState = 'spinning';
    this.tpLaunchBtn.disabled = true;
    kidAudio.playWoodStrike();
    this.tpStatusEl.textContent = metin("GameAndInventoryModals", "topac_1_hizla_donuyor_fare_parmak_veya", startRpm);
  }

  private startTopacLoop(): void {
    this.stopTopacLoop();
    this.tpRunning = true;
    this.tpLastTs = performance.now();
    const tick = (now: number) => {
      if (!this.tpRunning) return;
      const dt = Math.min((now - this.tpLastTs) / 1000, 0.04);
      this.tpLastTs = now;
      this.stepTopac(dt);
      this.drawTopac();
      this.tpRaf = requestAnimationFrame(tick);
    };
    this.tpRaf = requestAnimationFrame(tick);
  }

  private stopTopacLoop(): void {
    this.tpRunning = false;
    if (this.tpRaf) {
      cancelAnimationFrame(this.tpRaf);
      this.tpRaf = 0;
    }
  }

  private stepTopac(dt: number): void {
    if (this.tpState === 'aim') {
      this.tpPowerPhase += dt * 3.1;
      return;
    }
    if (this.tpState !== 'spinning') return;

    // Spin & decay
    this.tpRpm = Math.max(0, this.tpRpm - dt * 5.2);
    this.tpSpinAngle += dt * (4 + this.tpRpm * 0.25);
    this.tpRpmEl.textContent = `Devir: %${Math.ceil(this.tpRpm)}`;

    // Steering via keyboard or pointer
    let ax = 0;
    let ay = 0;
    if (this.ppKeys.has('ArrowLeft') || this.ppKeys.has('KeyA')) ax -= 1;
    if (this.ppKeys.has('ArrowRight') || this.ppKeys.has('KeyD')) ax += 1;
    if (this.ppKeys.has('ArrowUp') || this.ppKeys.has('KeyW')) ay -= 1;
    if (this.ppKeys.has('ArrowDown') || this.ppKeys.has('KeyS')) ay += 1;

    if (ax !== 0 || ay !== 0) {
      this.tpSteerTarget = null;
      const mag = Math.hypot(ax, ay);
      this.tpTopVx += (ax / mag) * 620 * dt;
      this.tpTopVy += (ay / mag) * 620 * dt;
    } else if (this.tpSteerTarget) {
      const dx = this.tpSteerTarget.x - this.tpTopX;
      const dy = this.tpSteerTarget.y - this.tpTopY;
      const d = Math.hypot(dx, dy);
      if (d > 6) {
        this.tpTopVx += (dx / d) * 600 * dt;
        this.tpTopVy += (dy / d) * 600 * dt;
      }
    }

    this.tpTopVx *= Math.pow(0.08, dt);
    this.tpTopVy *= Math.pow(0.08, dt);
    this.tpTopX += this.tpTopVx * dt;
    this.tpTopY += this.tpTopVy * dt;

    // Keep inside arena chalk ring
    const dxCenter = this.tpTopX - 240;
    const dyCenter = this.tpTopY - 162;
    const distCenter = Math.hypot(dxCenter, dyCenter);
    if (distCenter > 116) {
      this.tpTopX = 240 + (dxCenter / distCenter) * 116;
      this.tpTopY = 162 + (dyCenter / distCenter) * 116;
      this.tpTopVx *= -0.4;
      this.tpTopVy *= -0.4;
    }

    let knockedCount = 0;
    for (const t of this.tpTargets) {
      if (t.knocked) {
        t.x += t.vx * dt;
        t.y += t.vy * dt;
        knockedCount++;
        continue;
      }
      const d = Math.hypot(this.tpTopX - t.x, this.tpTopY - t.y);
      if (d < 30) {
        t.knocked = true;
        const ang = Math.atan2(t.y - this.tpTopY, t.x - this.tpTopX);
        t.vx = Math.cos(ang) * 150;
        t.vy = Math.sin(ang) * 150;
        knockedCount++;
        kidAudio.playWoodStrike();
      }
    }

    this.tpTargetEl.textContent = `Kuka: ${knockedCount} / 5`;

    if (knockedCount >= 5 && !this.tpWinNotified) {
      this.tpWinNotified = true;
      this.tpState = 'won';
      this.tpStatusEl.textContent =
        metin("GameAndInventoryModals", "tebrikler_5_kukayi_da_devirerek_topac_ustasi");
      this.callbacks.onGameWon(
        'topac',
        metin("GameAndInventoryModals", "topac_ustasi_madalyasi"),
        metin("GameAndInventoryModals", "kaytani_ustaca_cekip_topacinla_arenadaki_tum_kukalari")
      );
      return;
    }

    if (this.tpRpm <= 0) {
      this.tpState = 'lost';
      this.tpStatusEl.textContent = metin("GameAndInventoryModals", "topacin_devri_bitti_1_5_kuka_yeniden", knockedCount);
    }
  }

  private drawTopac(): void {
    const ctx = this.tpCtx;
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 480, 310);

    // Chalk circle ring
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(240, 162, 130, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Kaytan power bar during aim
    if (this.tpState === 'aim') {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(70, 12, 340, 20, 10);
      ctx.fill();

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.roundRect(210, 14, 60, 16, 6);
      ctx.fill();

      const cursorX = 240 + Math.sin(this.tpPowerPhase) * 155;
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cursorX - 4, 10, 8, 24);
    }

    // 5 Wooden Kuka blocks
    for (const t of this.tpTargets) {
      ctx.save();
      ctx.translate(t.x, t.y);
      if (t.knocked) {
        ctx.globalAlpha = 0.45;
        ctx.rotate(1.1);
      }
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.roundRect(-9, -15, 18, 30, 5);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // Spinning Topaç
    ctx.save();
    ctx.translate(this.tpTopX, this.tpTopY);
    ctx.rotate(this.tpSpinAngle);

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.arc(3, 5, 21, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Spiral spin stripes
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 17, Math.sin(a) * 17);
      ctx.stroke();
    }
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ======================== 9. MİSKET / CINCIK MODAL ========================
  private buildMisketModal(host: HTMLElement): void {
    this.mkBackdrop = document.createElement('div');
    this.mkBackdrop.className = "hud-modal-backdrop hidden";
    this.mkBackdrop.onclick = (e) => {
      if (e.target === this.mkBackdrop) this.closeAll();
    };

    const card = document.createElement('div');
    card.className = "hud-modal-card hud-game-modal-card";

    const top = document.createElement('div');
    top.className = 'hud-modal-top';
    const info = document.createElement('div');
    info.className = 'hud-group';
    const titlePill = document.createElement('span');
    titlePill.className = "hud-pill hud-pill-gold";
    titlePill.textContent = metin("GameAndInventoryModals", "misket_cincik_oyunu");
    this.mkScoreEl = document.createElement('span');
    this.mkScoreEl.className = "hud-pill hud-pill-sky";
    this.mkShotsEl = document.createElement('span');
    this.mkShotsEl.className = "hud-pill hud-pill-dark";
    info.append(titlePill, this.mkScoreEl, this.mkShotsEl);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'hud-close-btn';
    closeBtn.textContent = metin("GameAndInventoryModals", "kapat_simgeli");
    closeBtn.onclick = () => this.closeAll();
    top.append(info, closeBtn);

    const intro = this.createCollapsibleIntro(
      '🔮',
      metin("GameAndInventoryModals", "misket_cincik_bas_ucgen"),
      metin("GameAndInventoryModals", "anadolu_sokaklarinda_illere_gore_misket_bilye_veya"),
      metin("GameAndInventoryModals", "fare_parmak_veya_tuslariyla_nisan_al_sagdaki")
    );

    this.mkStatusEl = document.createElement('div');
    this.mkStatusEl.className = 'hud-game-status';

    this.mkCanvas = document.createElement('canvas');
    this.mkCanvas.width = 480;
    this.mkCanvas.height = 310;
    this.mkCanvas.className = 'hud-anatolian-canvas';
    this.mkCtx = this.mkCanvas.getContext('2d')!;

    this.mkCanvas.addEventListener('pointermove', (e) => {
      if (this.mkShooting) return;
      const rect = this.mkCanvas.getBoundingClientRect();
      if (rect.width <= 0) return;
      const px = ((e.clientX - rect.left) / rect.width) * 480;
      const py = ((e.clientY - rect.top) / rect.height) * 310;
      const ang = Math.atan2(py - 268, px - 240);
      this.mkAimAngle = Math.max(-Math.PI + 0.3, Math.min(-0.3, ang));
    });
    this.mkCanvas.addEventListener('pointerdown', (e) => {
      if (!this.mkShooting) {
        const rect = this.mkCanvas.getBoundingClientRect();
        if (rect.width > 0) {
          const px = ((e.clientX - rect.left) / rect.width) * 480;
          const py = ((e.clientY - rect.top) / rect.height) * 310;
          const ang = Math.atan2(py - 268, px - 240);
          this.mkAimAngle = Math.max(-Math.PI + 0.3, Math.min(-0.3, ang));
        }
        this.shootMisket();
      }
    });

    const actions = document.createElement('div');
    actions.className = 'hud-modal-actions';

    this.mkShootBtn = document.createElement('button');
    this.mkShootBtn.className = "hud-btn hud-btn-amber";
    this.mkShootBtn.textContent = metin("GameAndInventoryModals", "bas_misket_at_bosluk");
    this.mkShootBtn.onclick = () => this.shootMisket();

    const restartBtn = document.createElement('button');
    restartBtn.className = "hud-btn hud-btn-primary";
    restartBtn.textContent = metin("GameAndInventoryModals", "yeniden_diz");
    restartBtn.onclick = () => {
      this.callbacks.onPlaySelect();
      this.resetMisket();
    };

    actions.append(this.mkShootBtn, restartBtn);
    card.append(top, intro, this.mkStatusEl, this.mkCanvas, actions);
    this.mkBackdrop.appendChild(card);
    host.appendChild(this.mkBackdrop);
  }

  private resetMisket(): void {
    this.mkAimAngle = -Math.PI / 2;
    this.mkPowerPhase = 0;
    this.mkShooting = false;
    this.mkShotsLeft = 5;
    this.mkOutCount = 0;
    this.mkWinNotified = false;
    this.mkShootBtn.disabled = false;

    const palette = [
      {c: '#ef4444', s: '#fecaca'},
      {c: '#3b82f6', s: '#bfdbfe'},
      {c: '#10b981', s: '#a7f3d0'},
      {c: '#f59e0b', s: '#fde68a'},
      {c: '#ec4899', s: '#fbcfe8'},
      {c: '#8b5cf6', s: '#ddd6fe'},
      {c: '#06b6d4', s: '#a5f3fc'},
    ];
    // Cluster 7 marbles around target ring center (240, 118)
    const offsets = [
      {x: 0, y: 0},
      {x: -24, y: -14},
      {x: 24, y: -14},
      {x: 0, y: -28},
      {x: -26, y: 16},
      {x: 26, y: 16},
      {x: 0, y: 28},
    ];
    this.mkMarbles = offsets.map((off, idx) => ({
      x: 240 + off.x,
      y: 118 + off.y,
      vx: 0,
      vy: 0,
      r: 12,
      color: palette[idx].c,
      shine: palette[idx].s,
      outOfRing: false,
    }));
    // Index 7 is Player Baş Misket (Ene)
    this.mkMarbles.push({
      x: 240,
      y: 268,
      vx: 0,
      vy: 0,
      r: 14,
      color: '#fbbf24',
      shine: '#ffffff',
      outOfRing: false,
    });

    this.mkScoreEl.textContent = metin("GameAndInventoryModals", "cikarilan_0_5");
    this.mkShotsEl.textContent = metin("GameAndInventoryModals", "kalan_atis_5");
    this.mkStatusEl.textContent =
      metin("GameAndInventoryModals", "nisan_al_ve_guc_ibresi_yuksekken_bas");
  }

  private shootMisket(): void {
    if (
      !this.mkRunning ||
      this.mkShooting ||
      this.mkShotsLeft <= 0 ||
      this.mkWinNotified
    ) {
      return;
    }
    this.mkShotsLeft--;
    this.mkShotsEl.textContent = metin("GameAndInventoryModals", "kalan_atis_1", this.mkShotsLeft);
    this.mkShooting = true;
    this.mkShootBtn.disabled = true;

    const power = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(this.mkPowerPhase));
    const speed = 360 + power * 360;
    const ene = this.mkMarbles[7];
    ene.x = 240;
    ene.y = 268;
    ene.vx = Math.cos(this.mkAimAngle) * speed;
    ene.vy = Math.sin(this.mkAimAngle) * speed;
    kidAudio.playStoneToss();
  }

  private startMisketLoop(): void {
    this.stopMisketLoop();
    this.mkRunning = true;
    this.mkLastTs = performance.now();
    const tick = (now: number) => {
      if (!this.mkRunning) return;
      const dt = Math.min((now - this.mkLastTs) / 1000, 0.04);
      this.mkLastTs = now;
      this.stepMisket(dt);
      this.drawMisket();
      this.mkRaf = requestAnimationFrame(tick);
    };
    this.mkRaf = requestAnimationFrame(tick);
  }

  private stopMisketLoop(): void {
    this.mkRunning = false;
    if (this.mkRaf) {
      cancelAnimationFrame(this.mkRaf);
      this.mkRaf = 0;
    }
  }

  private stepMisket(dt: number): void {
    if (!this.mkShooting) {
      this.mkPowerPhase += dt * 3.1;
      if (this.ppKeys.has('ArrowLeft') || this.ppKeys.has('KeyA')) {
        this.mkAimAngle = Math.max(-Math.PI + 0.3, this.mkAimAngle - dt * 1.4);
      }
      if (this.ppKeys.has('ArrowRight') || this.ppKeys.has('KeyD')) {
        this.mkAimAngle = Math.min(-0.3, this.mkAimAngle + dt * 1.4);
      }
      return;
    }

    // Move marbles + wall bounce
    let anyMoving = false;
    for (const m of this.mkMarbles) {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.vx *= Math.pow(0.14, dt);
      m.vy *= Math.pow(0.14, dt);
      if (Math.hypot(m.vx, m.vy) < 8) {
        m.vx = 0;
        m.vy = 0;
      } else {
        anyMoving = true;
      }

      if (m.x < m.r + 12) {
        m.x = m.r + 12;
        m.vx = Math.abs(m.vx) * 0.7;
      } else if (m.x > 468 - m.r) {
        m.x = 468 - m.r;
        m.vx = -Math.abs(m.vx) * 0.7;
      }
      if (m.y < m.r + 12) {
        m.y = m.r + 12;
        m.vy = Math.abs(m.vy) * 0.7;
      } else if (m.y > 298 - m.r) {
        m.y = 298 - m.r;
        m.vy = -Math.abs(m.vy) * 0.7;
      }
    }

    // Elastic marble-marble collisions
    for (let i = 0; i < this.mkMarbles.length; i++) {
      for (let j = i + 1; j < this.mkMarbles.length; j++) {
        const a = this.mkMarbles[i];
        const b = this.mkMarbles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.r + b.r;
        if (dist > 0 && dist < minDist) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = (minDist - dist) * 0.5;
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;

          const dvx = a.vx - b.vx;
          const dvy = a.vy - b.vy;
          const vn = dvx * nx + dvy * ny;
          if (vn > 0) {
            a.vx -= vn * nx * 0.92;
            a.vy -= vn * ny * 0.92;
            b.vx += vn * nx * 0.92;
            b.vy += vn * ny * 0.92;
            if (vn > 45) kidAudio.playStoneToss();
          }
        }
      }
    }

    // Check which target marbles (0..6) exited the chalk ring (center 240,118, R=72)
    let outCount = 0;
    for (let i = 0; i < 7; i++) {
      const m = this.mkMarbles[i];
      if (!m.outOfRing && Math.hypot(m.x - 240, m.y - 118) > 74) {
        m.outOfRing = true;
        kidAudio.playStarCollected();
      }
      if (m.outOfRing) outCount++;
    }
    if (outCount !== this.mkOutCount) {
      this.mkOutCount = outCount;
      this.mkScoreEl.textContent = metin("GameAndInventoryModals", "cikarilan_1_5", this.mkOutCount);
    }

    if (!anyMoving) {
      this.mkShooting = false;
      // Return Ene to starting line
      this.mkMarbles[7].x = 240;
      this.mkMarbles[7].y = 268;

      if (this.mkOutCount >= 5 && !this.mkWinNotified) {
        this.mkWinNotified = true;
        this.mkShootBtn.disabled = true;
        this.mkStatusEl.textContent =
          metin("GameAndInventoryModals", "tebrikler_en_az_5_cincigi_cemberden_cikararak");
        this.callbacks.onGameWon(
          'misket',
          metin("GameAndInventoryModals", "cincik_sampiyonu_madalyasi"),
          metin("GameAndInventoryModals", "bas_misketinle_1_renkli_cam_misketi_cember", this.mkOutCount)
        );
      } else if (this.mkShotsLeft <= 0) {
        this.mkShootBtn.disabled = true;
        this.mkStatusEl.textContent = metin("GameAndInventoryModals", "atislarin_bitti_1_misket_cikardin_5_icin", this.mkOutCount);
      } else {
        this.mkShootBtn.disabled = false;
        this.mkStatusEl.textContent = metin("GameAndInventoryModals", "guzel_simdiye_kadar_1_misket_cikti_kalan", this.mkOutCount, this.mkShotsLeft);
      }
    }
  }

  private drawMisket(): void {
    const ctx = this.mkCtx;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, 480, 310);

    // Chalk circle / target area
    ctx.fillStyle = 'rgba(120, 53, 15, 0.5)';
    ctx.beginPath();
    ctx.arc(240, 118, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Aim trajectory & power gauge when ready
    if (!this.mkShooting && this.mkShotsLeft > 0 && !this.mkWinNotified) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(240, 268);
      ctx.lineTo(
        240 + Math.cos(this.mkAimAngle) * 140,
        268 + Math.sin(this.mkAimAngle) * 140
      );
      ctx.stroke();
      ctx.setLineDash([]);

      // Right-side power meter
      const pNorm = 0.5 + 0.5 * Math.sin(this.mkPowerPhase);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(442, 70, 18, 170, 9);
      ctx.fill();
      ctx.fillStyle = pNorm > 0.72 ? '#22c55e' : '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(445, 74 + (1 - pNorm) * 162, 12, pNorm * 162, 6);
      ctx.fill();
    }

    // Draw all 8 glass marbles
    for (let i = 0; i < this.mkMarbles.length; i++) {
      const m = this.mkMarbles[i];
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.arc(m.x + 2, m.y + 3, m.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();

      if (m.outOfRing && i < 7) {
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Glass highlight
      ctx.fillStyle = m.shine;
      ctx.beginPath();
      ctx.arc(m.x - m.r * 0.32, m.y - m.r * 0.32, m.r * 0.34, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ======================== SHARED LIFECYCLE ========================
  openActivityModal(kind: OutdoorActivityKind): void {
    if (kind === 'celikcomak' || kind === 'tugofwar') return;
    this.closeAll();
    if (kind === 'pingpong') {
      this.resetPingPong();
      this.ppBackdrop.classList.remove('hidden');
      this.startPingPongLoop();
    } else if (kind === 'mangala') {
      this.resetMangala();
      this.mgBackdrop.classList.remove('hidden');
    } else if (kind === 'ringtoss') {
      this.resetRingToss();
      this.rtBackdrop.classList.remove('hidden');
      this.startRingTossLoop();
    } else if (kind === 'bestas') {
      this.resetBestas(1, true);
      this.bsBackdrop.classList.remove('hidden');
      this.startBestasLoop();
    } else if (kind === 'topac') {
      this.resetTopac();
      this.tpBackdrop.classList.remove('hidden');
      this.startTopacLoop();
    } else {
      this.resetMisket();
      this.mkBackdrop.classList.remove('hidden');
      this.startMisketLoop();
    }
  }

  closeAll(): void {
    this.invBackdrop.classList.add('hidden');
    this.ppBackdrop.classList.add('hidden');
    this.mgBackdrop.classList.add('hidden');
    this.rtBackdrop.classList.add('hidden');
    this.hsBackdrop.classList.add('hidden');
    this.bsBackdrop.classList.add('hidden');
    this.tpBackdrop.classList.add('hidden');
    this.mkBackdrop.classList.add('hidden');

    this.stopPingPongLoop();
    this.stopRingTossLoop();
    this.stopBestasLoop();
    this.stopTopacLoop();
    this.stopMisketLoop();

    if (this.mgAiTimer !== null) {
      window.clearTimeout(this.mgAiTimer);
      this.mgAiTimer = null;
    }
  }

  isOpen(): boolean {
    return (
      !this.invBackdrop.classList.contains('hidden') ||
      !this.ppBackdrop.classList.contains('hidden') ||
      !this.mgBackdrop.classList.contains('hidden') ||
      !this.rtBackdrop.classList.contains('hidden') ||
      !this.hsBackdrop.classList.contains('hidden') ||
      !this.bsBackdrop.classList.contains('hidden') ||
      !this.tpBackdrop.classList.contains('hidden') ||
      !this.mkBackdrop.classList.contains('hidden')
    );
  }

  dispose(): void {
    this.closeAll();
    window.removeEventListener('keydown', this.handleWindowKeyDown);
    window.removeEventListener('keyup', this.handleWindowKeyUp);
    window.removeEventListener('blur', this.clearGameKeys);
    this.invBackdrop.remove();
    this.ppBackdrop.remove();
    this.mgBackdrop.remove();
    this.rtBackdrop.remove();
    this.hsBackdrop.remove();
    this.bsBackdrop.remove();
    this.tpBackdrop.remove();
    this.mkBackdrop.remove();
  }
}
