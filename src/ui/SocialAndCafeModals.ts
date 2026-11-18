import {htmlKaçır, htmlMetin, metin} from "../metinler.ts";
import {CAFE_MENU_ITEMS} from '../scene/AnatolianCafe.ts';
import type {PetAnimalInfo} from '../scene/OutdoorPets.ts';
import type {TugMatchHudState} from '../scene/TugOfWarArena.ts';
import type {
  ArtifactItem,
  CafeItemCategory,
  CafeMenuItem,
  InventoryItem,
  OutdoorActivityKind,
  WorldNpcProfile,
} from '../types.ts';

export interface MasalBarHudState {
  playing: boolean;
  currentTime: number;
  duration: number;
  sceneSubtitle: string;
  sceneIndex: number;
  sceneCount: number;
  isSeated: boolean;
}

export interface SocialAndCafeCallbacks {
  onPlaySelect: () => void;
  onOrderCafeItem: (item: CafeMenuItem, consumeNow: boolean) => void;
  onHighFiveNpc: (profile: WorldNpcProfile) => void;
  onInviteNpcHideSeek: (profile: WorldNpcProfile) => {
    added: boolean;
    totalCount: number;
  };
  onRecruitNpcTugOfWar: (profile: WorldNpcProfile) => {
    added: boolean;
    totalLeft: number;
  };
  onGiftFoodToNpc: (profile: WorldNpcProfile, foodItemId: string) => boolean;
  onLaunchNpcActivity: (kind: OutdoorActivityKind) => void;
  onOpenCafeFromNpc: () => void;
  onVendorBuy?: (vendorKind: 'siraci' | 'bozaci', consumeNow: boolean) => void;
  onToggleSazMusic?: () => boolean;
  onToggleSemaMusic?: () => boolean;
  onStartTugMatch: () => void;
  onPullTugRope: () => void;
  onStopTugMatch: () => void;
  onVisitArtifact?: (artifact: ArtifactItem) => void;
  onAdoptPet?: (petId: string, customName: string) => void;
  onToggleMasalPlay?: () => boolean;
  onSeekMasalDelta?: (deltaSec: number) => void;
  onSeekMasalTo?: (timeSec: number) => void;
  onRestartMasal?: () => void;
  onJumpMasalScene?: (delta: -1 | 1) => void;
  onToggleMasalSit?: () => void;
  onHideMasalBar?: () => void;
}

const NPC_CHAT_LINES = [
  metin("SocialAndCafeModals", "bugun_mirasium_da_harika_eserler_gordum_2"),
  metin("SocialAndCafeModals", "bahcedeki_elmalar_taptaze_cesmenin_suyu_da_buz"),
  metin("SocialAndCafeModals", "anadolu_kafe_de_sicak_cay_ve_simit"),
  metin("SocialAndCafeModals", "muze_ici_saklambacta_en_guzel_yer_2"),
  metin("SocialAndCafeModals", "halat_cekme_sahasinda_guclu_bir_takim_kuruyoruz"),
  metin("SocialAndCafeModals", "atolye_masasinda_kendi_resmini_cizince_muze_panosunda"),
  metin("SocialAndCafeModals", "arkeoloji_kazi_alaninda_birbirinden_farkli_tarihi_eserler"),
  metin("SocialAndCafeModals", "sanli_turk_bayragimiz_muze_girisinde_ne_guzel"),
];

export class SocialAndCafeModals {
  private callbacks: SocialAndCafeCallbacks;

  // 1. Café Menu Modal
  private cafeBackdrop!: HTMLDivElement;
  private cafeTabsEl!: HTMLDivElement;
  private cafeGridEl!: HTMLDivElement;
  private cafeFilter: 'all' | CafeItemCategory = 'all';

  // 2. Universal NPC Interaction Modal
  private npcBackdrop!: HTMLDivElement;
  private npcHeaderTitle!: HTMLSpanElement;
  private npcRolePill!: HTMLSpanElement;
  private npcLocPill!: HTMLSpanElement;
  private npcSpeechBox!: HTMLDivElement;
  private npcActionRow!: HTMLDivElement;
  private npcGiftListEl!: HTMLDivElement;
  private activeNpcProfile: WorldNpcProfile | null = null;
  private artifactsRef: ArtifactItem[] = [];
  private bagFoodRef: InventoryItem[] = [];

  // 3. Live 3D Tug-of-War Overlay (keeps 3D running NPCs visible!)
  private tugOverlayEl!: HTMLDivElement;
  private tugStatusEl!: HTMLDivElement;
  private tugTeamsEl!: HTMLDivElement;
  private tugBalanceFillEl!: HTMLDivElement;
  private tugBalanceDotEl!: HTMLDivElement;
  private tugStaminaFillEl!: HTMLDivElement;
  private tugStaminaLabelEl!: HTMLSpanElement;
  private tugSurgeBadgeEl!: HTMLSpanElement;
  private tugStartBtn!: HTMLButtonElement;
  private tugPullBtn!: HTMLButtonElement;

  // 4. Pet Adoption & Custom Naming Modal
  private petAdoptBackdrop!: HTMLDivElement;
  private petAdoptTitlePill!: HTMLSpanElement;
  private petAdoptBreedPill!: HTMLSpanElement;
  private petAdoptDescEl!: HTMLDivElement;
  private petAdoptInput!: HTMLInputElement;
  private petAdoptConfirmBtn!: HTMLButtonElement;
  private activeAdoptPet: PetAnimalInfo | null = null;

  // 5. Compact Non-Blocking Bottom Masal Player Bar (never obscures 3D Gölge Perdesi!)
  private masalBarEl!: HTMLDivElement;
  private masalSceneBadgeEl!: HTMLSpanElement;
  private masalSitBtn!: HTMLButtonElement;
  private masalSeekInput!: HTMLInputElement;
  private masalTimeEl!: HTMLSpanElement;
  private masalPlayBtn!: HTMLButtonElement;
  private isSeekingMasal = false;

  constructor(hostRoot: HTMLElement, callbacks: SocialAndCafeCallbacks) {
    this.callbacks = callbacks;
    this.buildCafeModal(hostRoot);
    this.buildNpcModal(hostRoot);
    this.buildTugOverlay(hostRoot);
    this.buildPetAdoptModal(hostRoot);
    this.buildMasalBar(hostRoot);
    window.addEventListener('keydown', this.handleWindowKeyDown);
  }

  setArtifacts(artifacts: ArtifactItem[]): void {
    this.artifactsRef = artifacts;
  }

  private handleWindowKeyDown = (e: KeyboardEvent): void => {
    if (e.code === 'Space' && this.isTugOverlayOpen()) {
      e.preventDefault();
      this.callbacks.onPullTugRope();
    } else if (e.code === 'Escape') {
      if (!this.cafeBackdrop.classList.contains('hidden')) this.closeModals();
      if (!this.npcBackdrop.classList.contains('hidden')) this.closeModals();
      if (!this.petAdoptBackdrop.classList.contains('hidden')) {
        this.closeModals();
      }
      if (this.isTugOverlayOpen()) {
        this.callbacks.onStopTugMatch();
        this.closeTugOverlay();
      }
    }
  };

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
    toggleBtn.textContent = metin("SocialAndCafeModals", "1_2_oyunu_tani_ve_kurallari_oku", icon, title);

    const panel = document.createElement('div');
    panel.className = "hud-game-intro-panel hidden";
    panel.innerHTML = `
      <div class="hud-game-intro-section">
        <strong>${htmlMetin("SocialAndCafeModals", "kulturel_kokeni")}</strong> ${cultureStory}
      </div>
      <div class="hud-game-intro-section">
        <strong>${htmlMetin("SocialAndCafeModals", "nasil_oynanir")}</strong> ${howToPlay}
      </div>
    `;

    toggleBtn.onclick = () => {
      this.callbacks.onPlaySelect();
      const willOpen = panel.classList.contains('hidden');
      panel.classList.toggle('hidden', !willOpen);
      toggleBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      toggleBtn.textContent = willOpen
        ? metin("SocialAndCafeModals", "1_2_tanitimi_gizle", icon, title)
        : metin("SocialAndCafeModals", "1_2_oyunu_tani_ve_kurallari_oku", icon, title);
    };

    wrap.append(toggleBtn, panel);
    return wrap;
  }

  // ======================== 1. ANATOLIAN CAFÉ MODAL ========================
  private buildCafeModal(host: HTMLElement): void {
    this.cafeBackdrop = document.createElement('div');
    this.cafeBackdrop.className = "hud-modal-backdrop hidden";
    this.cafeBackdrop.onclick = (e) => {
      if (e.target === this.cafeBackdrop) this.closeModals();
    };

    const card = document.createElement('div');
    card.className = "hud-modal-card hud-game-modal-card";

    const top = document.createElement('div');
    top.className = 'hud-modal-top';
    const badges = document.createElement('div');
    badges.className = 'hud-group';
    const titlePill = document.createElement('span');
    titlePill.className = "hud-pill hud-pill-gold";
    titlePill.textContent = metin("SocialAndCafeModals", "mirasium_anadolu_kafe");
    const hostPill = document.createElement('span');
    hostPill.className = "hud-pill hud-pill-sky";
    hostPill.textContent = metin("SocialAndCafeModals", "usta_hasan_in_ikram_sofrasi");
    badges.append(titlePill, hostPill);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'hud-close-btn';
    closeBtn.textContent = metin("SocialAndCafeModals", "kapat_simgeli");
    closeBtn.onclick = () => this.closeModals();
    top.append(badges, closeBtn);

    const intro = this.createCollapsibleIntro(
      '☕',
      metin("SocialAndCafeModals", "anadolu_kafe_misafirperverlik"),
      metin("SocialAndCafeModals", "anadolu_kulturunde_semaver_cayi_yayik_ayrani_tas"),
      metin("SocialAndCafeModals", "istedigin_geleneksel_yiyecek_ve_icecekleri_cantana_alabilir")
    );

    this.cafeTabsEl = document.createElement('div');
    this.cafeTabsEl.className = 'hud-tabs';

    this.cafeGridEl = document.createElement('div');
    this.cafeGridEl.className = 'hud-cafe-grid';

    card.append(top, intro, this.cafeTabsEl, this.cafeGridEl);
    this.cafeBackdrop.appendChild(card);
    host.appendChild(this.cafeBackdrop);
  }

  openCafeModal(): void {
    this.closeModals();
    this.renderCafeMenu();
    this.cafeBackdrop.classList.remove('hidden');
  }

  private renderCafeMenu(): void {
    this.cafeTabsEl.innerHTML = '';
    const drinkCount = CAFE_MENU_ITEMS.filter((i) => i.category === 'drink').length;
    const foodCount = CAFE_MENU_ITEMS.filter((i) => i.category === 'food').length;
    const tabs: Array<{id: 'all' | CafeItemCategory; label: string}> = [
      {id: 'all', label: metin("SocialAndCafeModals", "tum_menu_1", CAFE_MENU_ITEMS.length)},
      {id: 'drink', label: metin("SocialAndCafeModals", "icecekler_1", drinkCount)},
      {id: 'food', label: metin("SocialAndCafeModals", "yiyecekler_1", foodCount)},
    ];
    for (const t of tabs) {
      const btn = document.createElement('button');
      btn.className = `hud-tab ${this.cafeFilter === t.id ? 'active' : ''}`;
      btn.textContent = t.label;
      btn.onclick = () => {
        this.callbacks.onPlaySelect();
        this.cafeFilter = t.id;
        this.renderCafeMenu();
      };
      this.cafeTabsEl.appendChild(btn);
    }

    this.cafeGridEl.innerHTML = '';
    const items =
      this.cafeFilter === 'all'
        ? CAFE_MENU_ITEMS
        : CAFE_MENU_ITEMS.filter((i) => i.category === this.cafeFilter);

    for (const item of items) {
      const card = document.createElement('div');
      card.className = 'hud-cafe-card';

      const head = document.createElement('div');
      head.className = 'hud-cafe-card-head';
      head.innerHTML = `
        <span class="hud-cafe-icon">${item.icon}</span>
        <div>
          <div class="hud-cafe-name">${htmlKaçır(item.name)}</div>
          <div class="hud-cafe-region">📍 ${htmlKaçır(item.region)}</div>
        </div>
      `;

      const desc = document.createElement('div');
      desc.className = 'hud-cafe-desc';
      desc.textContent = item.description;

      const btns = document.createElement('div');
      btns.className = 'hud-cafe-actions';

      const bagBtn = document.createElement('button');
      bagBtn.className = "hud-mini-btn hud-mini-primary";
      bagBtn.textContent = metin("SocialAndCafeModals", "cantaya_al");
      bagBtn.onclick = () => this.callbacks.onOrderCafeItem(item, false);

      const eatBtn = document.createElement('button');
      eatBtn.className = "hud-mini-btn hud-mini-hint";
      eatBtn.textContent = metin("SocialAndCafeModals", "hemen_tat_1_s", item.boostSeconds);
      eatBtn.onclick = () => {
        this.callbacks.onOrderCafeItem(item, true);
        this.closeModals();
      };

      btns.append(bagBtn, eatBtn);
      card.append(head, desc, btns);
      this.cafeGridEl.appendChild(card);
    }
  }

  // ======================== 2. UNIVERSAL NPC MODAL ========================
  private buildNpcModal(host: HTMLElement): void {
    this.npcBackdrop = document.createElement('div');
    this.npcBackdrop.className = "hud-modal-backdrop hidden";
    this.npcBackdrop.onclick = (e) => {
      if (e.target === this.npcBackdrop) this.closeModals();
    };

    const card = document.createElement('div');
    card.className = "hud-modal-card hud-npc-card";

    const top = document.createElement('div');
    top.className = 'hud-modal-top';
    const info = document.createElement('div');
    info.className = 'hud-group';
    this.npcHeaderTitle = document.createElement('span');
    this.npcHeaderTitle.className = "hud-pill hud-pill-gold";
    this.npcRolePill = document.createElement('span');
    this.npcRolePill.className = "hud-pill hud-pill-sky";
    this.npcLocPill = document.createElement('span');
    this.npcLocPill.className = "hud-pill hud-pill-dark";
    info.append(this.npcHeaderTitle, this.npcRolePill, this.npcLocPill);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'hud-close-btn';
    closeBtn.textContent = metin("SocialAndCafeModals", "kapat_simgeli");
    closeBtn.onclick = () => this.closeModals();
    top.append(info, closeBtn);

    this.npcSpeechBox = document.createElement('div');
    this.npcSpeechBox.className = 'hud-npc-speech';

    this.npcActionRow = document.createElement('div');
    this.npcActionRow.className = 'hud-npc-actions';

    const giftTitle = document.createElement('div');
    giftTitle.className = 'hud-npc-gift-title';
    giftTitle.textContent = metin("SocialAndCafeModals", "cantandan_anadolu_kafe_ikrami_paylas");

    this.npcGiftListEl = document.createElement('div');
    this.npcGiftListEl.className = 'hud-npc-gift-row';

    card.append(
      top,
      this.npcSpeechBox,
      this.npcActionRow,
      giftTitle,
      this.npcGiftListEl
    );
    this.npcBackdrop.appendChild(card);
    host.appendChild(this.npcBackdrop);
  }

  openNpcModal(
    profile: WorldNpcProfile,
    bagFoodItems: InventoryItem[]
  ): void {
    this.closeModals();
    this.activeNpcProfile = profile;
    this.bagFoodRef = bagFoodItems.map((it) => ({...it}));
    this.renderNpcContent();
    this.npcBackdrop.classList.remove('hidden');
  }

  private renderNpcContent(): void {
    const p = this.activeNpcProfile;
    if (!p) return;

    const genderEmoji = p.gender === 'kadin' ? '👩' : '👨';
    this.npcHeaderTitle.textContent = `${genderEmoji} ${p.name}`;
    this.npcRolePill.textContent = p.roleTitle;
    this.npcLocPill.textContent = `📍 ${p.locationLabel}`;

    const randomLine =
      NPC_CHAT_LINES[Math.floor(Math.random() * NPC_CHAT_LINES.length)];
    if (p.vendorKind === 'siraci') {
      this.npcSpeechBox.textContent =
        metin("SocialAndCafeModals", "buz_gibi_siraaa_siyah_uzumden_geleneksel_siramdan");
    } else if (p.vendorKind === 'bozaci') {
      this.npcSpeechBox.textContent =
        metin("SocialAndCafeModals", "booo_zaaa_tarcinli_leblebili_sicacik_geleneksel_boza");
    } else if (p.vendorKind === 'saz') {
      this.npcSpeechBox.textContent =
        metin("SocialAndCafeModals", "mirasium_parki_nda_anadolu_turkulerini_baglamamla_caliyorum");
    } else if (p.vendorKind === 'sema') {
      this.npcSpeechBox.textContent =
        metin("SocialAndCafeModals", "sema_ve_tasavvuf_musikisi_sahnemize_hos_geldin");
    } else {
      this.npcSpeechBox.textContent = `“Merhaba! Ben ${p.name}. ${randomLine}”`;
    }

    this.npcActionRow.innerHTML = '';

    // 1. Game/Cafe/Vendor shortcut if this NPC hosts a game, cafe, or vendor cart
    if (p.vendorKind === 'siraci') {
      const bagBtn = document.createElement('button');
      bagBtn.className = "hud-btn hud-btn-primary";
      bagBtn.textContent = metin("SocialAndCafeModals", "cantaya_al_2");
      bagBtn.onclick = () => {
        this.callbacks.onVendorBuy?.('siraci', false);
      };
      const drinkBtn = document.createElement('button');
      drinkBtn.className = "hud-btn hud-btn-amber";
      drinkBtn.textContent = metin("SocialAndCafeModals", "hemen_ic_20s");
      drinkBtn.onclick = () => {
        this.callbacks.onVendorBuy?.('siraci', true);
        this.closeModals();
      };
      this.npcActionRow.append(bagBtn, drinkBtn);
    } else if (p.vendorKind === 'bozaci') {
      const bagBtn = document.createElement('button');
      bagBtn.className = "hud-btn hud-btn-primary";
      bagBtn.textContent = metin("SocialAndCafeModals", "cantaya_al_3");
      bagBtn.onclick = () => {
        this.callbacks.onVendorBuy?.('bozaci', false);
      };
      const drinkBtn = document.createElement('button');
      drinkBtn.className = "hud-btn hud-btn-amber";
      drinkBtn.textContent = metin("SocialAndCafeModals", "hemen_ic_22s");
      drinkBtn.onclick = () => {
        this.callbacks.onVendorBuy?.('bozaci', true);
        this.closeModals();
      };
      this.npcActionRow.append(bagBtn, drinkBtn);
    } else if (p.vendorKind === 'saz') {
      const musicBtn = document.createElement('button');
      musicBtn.className = "hud-btn hud-btn-amber";
      musicBtn.textContent = metin("SocialAndCafeModals", "saz_dinletisi_ac_duraklat");
      musicBtn.onclick = () => {
        const paused = this.callbacks.onToggleSazMusic?.() ?? false;
        musicBtn.textContent = paused
          ? metin("SocialAndCafeModals", "saz_dinletisini_baslat")
          : metin("SocialAndCafeModals", "saz_dinletisini_duraklat");
      };
      this.npcActionRow.appendChild(musicBtn);
    } else if (p.vendorKind === 'sema') {
      const neyBtn = document.createElement('button');
      neyBtn.className = "hud-btn hud-btn-amber";
      neyBtn.textContent = metin("SocialAndCafeModals", "ney_dinletisi_ac_duraklat");
      neyBtn.onclick = () => {
        const paused = this.callbacks.onToggleSemaMusic?.() ?? false;
        neyBtn.textContent = paused
          ? metin("SocialAndCafeModals", "ney_dinletisini_baslat")
          : metin("SocialAndCafeModals", "ney_dinletisini_duraklat");
      };
      this.npcActionRow.appendChild(neyBtn);
    } else if (p.isCafeMaster) {
      const cafeBtn = document.createElement('button');
      cafeBtn.className = "hud-btn hud-btn-amber";
      cafeBtn.textContent = metin("SocialAndCafeModals", "kafe_menusunu_ac");
      cafeBtn.onclick = () => {
        this.closeModals();
        this.callbacks.onOpenCafeFromNpc();
      };
      this.npcActionRow.appendChild(cafeBtn);
    } else if (p.activityKind) {
      const gameBtn = document.createElement('button');
      gameBtn.className = "hud-btn hud-btn-amber";
      gameBtn.textContent = metin("SocialAndCafeModals", "bu_oyunu_baslat");
      gameBtn.onclick = () => {
        const kind = p.activityKind!;
        this.closeModals();
        this.callbacks.onLaunchNpcActivity(kind);
      };
      this.npcActionRow.appendChild(gameBtn);
    }

    // 2. High-five & Dance
    const hiBtn = document.createElement('button');
    hiBtn.className = "hud-btn hud-btn-primary";
    hiBtn.textContent = metin("SocialAndCafeModals", "cak_bir_beslik");
    hiBtn.onclick = () => {
      this.callbacks.onHighFiveNpc(p);
      this.npcSpeechBox.textContent = metin("SocialAndCafeModals", "cak_bakalim_harika_enerjin_var_1_selamliyor", p.name);
    };
    this.npcActionRow.appendChild(hiBtn);

    // 3. Artifact recommendation chat
    const artBtn = document.createElement('button');
    artBtn.className = "hud-btn hud-btn-sky";
    artBtn.textContent = metin("SocialAndCafeModals", "eser_onerisi_al");
    artBtn.onclick = () => {
      this.callbacks.onPlaySelect();
      if (this.artifactsRef.length > 0) {
        const pick =
          this.artifactsRef[Math.floor(Math.random() * this.artifactsRef.length)];
        this.npcSpeechBox.textContent = metin("SocialAndCafeModals", "1_katta_bulunan_2_3_eserini_mutlaka", pick.floor, pick.index, pick.title, pick.collectionName);
      } else {
        const line =
          NPC_CHAT_LINES[Math.floor(Math.random() * NPC_CHAT_LINES.length)];
        this.npcSpeechBox.textContent = `“${line}”`;
      }
    };
    this.npcActionRow.appendChild(artBtn);

    // 4. Invite to Hide-and-Seek
    if (!p.isActivityLeader && !p.isCafeMaster && !p.vendorKind) {
      const hsBtn = document.createElement('button');
      hsBtn.className = "hud-btn hud-btn-indigo";
      hsBtn.textContent = p.joinedHideSeek
        ? metin("SocialAndCafeModals", "saklambac_grubunda")
        : metin("SocialAndCafeModals", "saklambaca_davet_et");
      hsBtn.disabled = p.joinedHideSeek;
      hsBtn.onclick = () => {
        const res = this.callbacks.onInviteNpcHideSeek(p);
        if (res.added) {
          p.joinedHideSeek = true;
          this.npcSpeechBox.textContent = metin("SocialAndCafeModals", "harika_fikir_1_kattaki_saklambac_ebe_tasi", res.totalCount);
          this.renderNpcContent();
        }
      };
      this.npcActionRow.appendChild(hsBtn);

      // 5. Recruit to Tug-of-War Left Team
      const tugBtn = document.createElement('button');
      tugBtn.className = "hud-btn hud-btn-teal";
      tugBtn.textContent = p.joinedTugOfWar
        ? metin("SocialAndCafeModals", "halat_takiminda")
        : metin("SocialAndCafeModals", "halat_takimina_al");
      tugBtn.disabled = p.joinedTugOfWar;
      tugBtn.onclick = () => {
        const res = this.callbacks.onRecruitNpcTugOfWar(p);
        if (res.added) {
          p.joinedTugOfWar = true;
          this.npcSpeechBox.textContent = metin("SocialAndCafeModals", "tamamdir_halat_cekme_sahasinda_sol_takiminda_yerimi", res.totalLeft);
          this.renderNpcContent();
        }
      };
      this.npcActionRow.appendChild(tugBtn);
    }

    // 6. Café treats gift list
    this.npcGiftListEl.innerHTML = '';
    const available = this.bagFoodRef.filter((f) => f.count > 0);
    if (available.length === 0) {
      const hint = document.createElement('div');
      hint.className = 'hud-npc-gift-empty';
      hint.textContent =
        metin("SocialAndCafeModals", "cantanda_henuz_ikram_yok_bahce_dogusundaki_mirasium");
      this.npcGiftListEl.appendChild(hint);
    } else {
      for (const food of available) {
        const giftBtn = document.createElement('button');
        giftBtn.className = "hud-mini-btn hud-mini-primary";
        giftBtn.textContent = `🎁 ${food.icon} ${food.name} (×${food.count})`;
        giftBtn.onclick = () => {
          if (this.callbacks.onGiftFoodToNpc(p, food.id)) {
            food.count = Math.max(0, food.count - 1);
            p.treatedCount++;
            this.npcSpeechBox.textContent = metin("SocialAndCafeModals", "cok_tesekkur_ederim_1_2_enfes_gorunuyor", food.icon, food.name);
            this.renderNpcGiftButtonsOnly();
          }
        };
        this.npcGiftListEl.appendChild(giftBtn);
      }
    }
  }

  private renderNpcGiftButtonsOnly(): void {
    this.renderNpcContent();
  }

  // ======================== 3. SLIM NON-BLOCKING 3D TUG-OF-WAR STRIP ========================
  private buildTugOverlay(host: HTMLElement): void {
    this.tugOverlayEl = document.createElement('div');
    this.tugOverlayEl.className = "hud-tug-overlay hidden";

    const strip = document.createElement('div');
    strip.className = 'hud-tug-strip';

    const header = document.createElement('div');
    header.className = 'hud-tug-strip-top';
    const badges = document.createElement('div');
    badges.className = 'hud-group';
    const titlePill = document.createElement('span');
    titlePill.className = "hud-pill hud-pill-gold";
    titlePill.textContent = metin("SocialAndCafeModals", "halat_cekmece_bosluk");
    this.tugSurgeBadgeEl = document.createElement('span');
    this.tugSurgeBadgeEl.className = "hud-pill hud-pill-rose hidden";
    this.tugSurgeBadgeEl.textContent = metin("SocialAndCafeModals", "rakip_asiliyor");
    badges.append(titlePill, this.tugSurgeBadgeEl);

    const topRight = document.createElement('div');
    topRight.className = 'hud-group';

    this.tugStartBtn = document.createElement('button');
    this.tugStartBtn.className = "hud-mini-btn hud-mini-primary hidden";
    this.tugStartBtn.textContent = metin("SocialAndCafeModals", "rovans");
    this.tugStartBtn.onclick = () => this.callbacks.onStartTugMatch();

    const closeBtn = document.createElement('button');
    closeBtn.className = 'hud-close-btn';
    closeBtn.textContent = metin("SocialAndCafeModals", "ayril");
    closeBtn.onclick = () => {
      this.callbacks.onStopTugMatch();
      this.closeTugOverlay();
    };
    topRight.append(this.tugStartBtn, closeBtn);
    header.append(badges, topRight);

    this.tugTeamsEl = document.createElement('div');
    this.tugTeamsEl.className = 'hud-tug-teams';

    const meterWrap = document.createElement('div');
    meterWrap.className = 'hud-tug-meter-wrap';
    const meterTrack = document.createElement('div');
    meterTrack.className = 'hud-tug-track';
    this.tugBalanceFillEl = document.createElement('div');
    this.tugBalanceFillEl.className = 'hud-tug-center-mark';
    this.tugBalanceDotEl = document.createElement('div');
    this.tugBalanceDotEl.className = 'hud-tug-ribbon-dot';
    meterTrack.append(this.tugBalanceFillEl, this.tugBalanceDotEl);
    meterWrap.appendChild(meterTrack);

    const bottomRow = document.createElement('div');
    bottomRow.className = 'hud-tug-strip-bottom';

    const staminaRow = document.createElement('div');
    staminaRow.className = 'hud-tug-stamina-row';
    this.tugStaminaLabelEl = document.createElement('span');
    this.tugStaminaLabelEl.textContent = metin("SocialAndCafeModals", "baslangic_enerji");
    const staminaTrack = document.createElement('div');
    staminaTrack.className = 'hud-tug-stamina-track';
    this.tugStaminaFillEl = document.createElement('div');
    this.tugStaminaFillEl.className = 'hud-tug-stamina-fill';
    staminaTrack.appendChild(this.tugStaminaFillEl);
    staminaRow.append(this.tugStaminaLabelEl, staminaTrack);

    this.tugPullBtn = document.createElement('button');
    this.tugPullBtn.className = "hud-btn hud-btn-amber hud-tug-pull-btn";
    this.tugPullBtn.textContent = metin("SocialAndCafeModals", "cek_bosluk");
    this.tugPullBtn.onclick = () => this.callbacks.onPullTugRope();

    bottomRow.append(staminaRow, this.tugPullBtn);

    this.tugStatusEl = document.createElement('div');
    this.tugStatusEl.className = 'hud-tug-status-line';

    strip.append(header, this.tugTeamsEl, meterWrap, bottomRow, this.tugStatusEl);
    this.tugOverlayEl.appendChild(strip);
    host.appendChild(this.tugOverlayEl);
  }

  openTugOverlay(state: TugMatchHudState): void {
    this.closeModals();
    this.updateTugState(state);
    this.tugOverlayEl.classList.remove('hidden');
  }

  closeTugOverlay(): void {
    this.tugOverlayEl.classList.add('hidden');
  }

  isTugOverlayOpen(): boolean {
    return !this.tugOverlayEl.classList.contains('hidden');
  }

  updateTugState(state: TugMatchHudState): void {
    this.tugTeamsEl.innerHTML = `
      <span class="hud-tug-team left">${htmlMetin("SocialAndCafeModals", "sol_1_2", state.leftNames.length, state.leftNames.join(', '))}</span>
      <span class="hud-tug-team right">${htmlMetin("SocialAndCafeModals", "sag_1_2", state.rightNames.length, state.rightNames.join(', '))}</span>
    `;
    const pct = Math.max(0, Math.min(100, 50 + state.balance * 0.5));
    this.tugBalanceDotEl.style.left = `${pct}%`;
    this.tugStaminaFillEl.style.width = `${state.stamina}%`;
    this.tugStaminaLabelEl.textContent = `⚡ ${state.stamina}%`;
    this.tugSurgeBadgeEl.classList.toggle('hidden', !state.surging);
    this.tugStatusEl.textContent = state.statusText;
    this.tugPullBtn.disabled = !state.running || state.finished;
    this.tugStartBtn.classList.toggle('hidden', !state.finished);
  }

  // ======================== 4. PET ADOPTION MODAL ========================
  private buildPetAdoptModal(host: HTMLElement): void {
    this.petAdoptBackdrop = document.createElement('div');
    this.petAdoptBackdrop.className = "hud-modal-backdrop hidden";
    this.petAdoptBackdrop.onclick = (e) => {
      if (e.target === this.petAdoptBackdrop) this.closeModals();
    };

    const card = document.createElement('div');
    card.className = "hud-modal-card hud-npc-card";

    const top = document.createElement('div');
    top.className = 'hud-modal-top';
    const badges = document.createElement('div');
    badges.className = 'hud-group';
    this.petAdoptTitlePill = document.createElement('span');
    this.petAdoptTitlePill.className = "hud-pill hud-pill-gold";
    this.petAdoptBreedPill = document.createElement('span');
    this.petAdoptBreedPill.className = "hud-pill hud-pill-sky";
    badges.append(this.petAdoptTitlePill, this.petAdoptBreedPill);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'hud-close-btn';
    closeBtn.textContent = metin("SocialAndCafeModals", "vazgec");
    closeBtn.onclick = () => this.closeModals();
    top.append(badges, closeBtn);

    this.petAdoptDescEl = document.createElement('div');
    this.petAdoptDescEl.className = 'hud-npc-speech';

    const labelEl = document.createElement('label');
    labelEl.className = 'hud-tool-label';
    labelEl.textContent = metin("SocialAndCafeModals", "evcil_dostunun_ismini_yaz_en_fazla_20");

    this.petAdoptInput = document.createElement('input');
    this.petAdoptInput.type = 'text';
    this.petAdoptInput.maxLength = 20;
    this.petAdoptInput.className = 'hud-title-input';
    this.petAdoptInput.placeholder = metin("SocialAndCafeModals", "orn_kopuk_boncuk_bulut_sans");
    this.petAdoptInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.confirmPetAdopt();
      }
      e.stopPropagation();
    };

    const actions = document.createElement('div');
    actions.className = 'hud-modal-actions';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = "hud-btn hud-btn-dark";
    cancelBtn.textContent = metin("SocialAndCafeModals", "iptal");
    cancelBtn.onclick = () => this.closeModals();

    this.petAdoptConfirmBtn = document.createElement('button');
    this.petAdoptConfirmBtn.className = "hud-btn hud-btn-amber";
    this.petAdoptConfirmBtn.onclick = () => this.confirmPetAdopt();
    actions.append(cancelBtn, this.petAdoptConfirmBtn);

    card.append(top, this.petAdoptDescEl, labelEl, this.petAdoptInput, actions);
    this.petAdoptBackdrop.appendChild(card);
    host.appendChild(this.petAdoptBackdrop);
  }

  private confirmPetAdopt(): void {
    if (!this.activeAdoptPet) return;
    const petId = this.activeAdoptPet.id;
    const chosenName = this.petAdoptInput.value.trim() || this.activeAdoptPet.name;
    this.closeModals();
    this.callbacks.onAdoptPet?.(petId, chosenName);
  }

  openPetAdoptModal(pet: PetAnimalInfo, isRename: boolean): void {
    this.closeModals();
    this.activeAdoptPet = pet;
    const icon = pet.species === 'cat' ? '🐱' : '🐶';
    this.petAdoptTitlePill.textContent = isRename
      ? metin("SocialAndCafeModals", "1_evcil_dostunun_ismini_degistir", icon)
      : metin("SocialAndCafeModals", "1_evcil_hayvan_sahiplen", icon);
    this.petAdoptBreedPill.textContent = pet.breed;
    this.petAdoptDescEl.textContent = isRename
      ? metin("SocialAndCafeModals", "sadik_dostun_1_muze_ici_2_kat", pet.name)
      : metin("SocialAndCafeModals", "1_2_senin_en_sadik_kesif_arkadasin", pet.name, pet.breed);
    this.petAdoptConfirmBtn.textContent = isRename
      ? metin("SocialAndCafeModals", "yeni_ismi_kaydet")
      : metin("SocialAndCafeModals", "sahiplen_ve_ismini_koy");
    this.petAdoptInput.value = pet.name;
    this.petAdoptBackdrop.classList.remove('hidden');
    window.setTimeout(() => {
      this.petAdoptInput.focus();
      this.petAdoptInput.select();
    }, 30);
  }

  // ======================== 5. COMPACT NON-BLOCKING BOTTOM MASAL BAR ========================
  private formatMasalTime(sec: number): string {
    const safe = Math.max(0, Math.floor(sec));
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  private buildMasalBar(host: HTMLElement): void {
    this.masalBarEl = document.createElement('div');
    this.masalBarEl.className = "hud-masal-bar-overlay hidden";

    const strip = document.createElement('div');
    strip.className = 'hud-masal-bar-strip';

    // Top row: Tale pill + active scene subtitle + sit toggle + hide button
    const topRow = document.createElement('div');
    topRow.className = 'hud-masal-bar-top';

    const badges = document.createElement('div');
    badges.className = 'hud-group';
    const titlePill = document.createElement('span');
    titlePill.className = "hud-pill hud-pill-gold";
    titlePill.textContent = metin("SocialAndCafeModals", "keloglan_ve_pinarli_cesmesi");

    this.masalSceneBadgeEl = document.createElement('span');
    this.masalSceneBadgeEl.className = "hud-pill hud-pill-sky";
    this.masalSceneBadgeEl.textContent = metin("SocialAndCafeModals", "1_6_golge_perdesi");
    badges.append(titlePill, this.masalSceneBadgeEl);

    const topRight = document.createElement('div');
    topRight.className = 'hud-group';

    this.masalSitBtn = document.createElement('button');
    this.masalSitBtn.className = "hud-mini-btn hud-mini-primary";
    this.masalSitBtn.textContent = metin("SocialAndCafeModals", "mindere_otur");
    this.masalSitBtn.onclick = () => {
      this.callbacks.onPlaySelect();
      this.callbacks.onToggleMasalSit?.();
    };

    const hideBtn = document.createElement('button');
    hideBtn.className = 'hud-close-btn';
    hideBtn.textContent = metin("SocialAndCafeModals", "gizle_simgeli");
    hideBtn.onclick = () => {
      this.callbacks.onPlaySelect();
      this.closeMasalBar();
      this.callbacks.onHideMasalBar?.();
    };
    topRight.append(this.masalSitBtn, hideBtn);
    topRow.append(badges, topRight);

    // Scrubber row: Timeline slider + mm:ss / mm:ss
    const seekRow = document.createElement('div');
    seekRow.className = 'hud-masal-seek-row';

    this.masalSeekInput = document.createElement('input');
    this.masalSeekInput.type = 'range';
    this.masalSeekInput.className = 'hud-masal-range';
    this.masalSeekInput.min = '0';
    this.masalSeekInput.max = '441';
    this.masalSeekInput.step = '1';
    this.masalSeekInput.value = '0';
    this.masalSeekInput.setAttribute('aria-label', metin("SocialAndCafeModals", "masal_zaman_cubugu"));

    this.masalSeekInput.addEventListener('pointerdown', () => {
      this.isSeekingMasal = true;
    });
    this.masalSeekInput.addEventListener('touchstart', () => {
      this.isSeekingMasal = true;
    });
    this.masalSeekInput.addEventListener('pointerup', () => {
      this.isSeekingMasal = false;
    });
    this.masalSeekInput.addEventListener('touchend', () => {
      this.isSeekingMasal = false;
    });
    this.masalSeekInput.addEventListener('input', () => {
      const targetSec = Number(this.masalSeekInput.value);
      const maxSec = Number(this.masalSeekInput.max) || 441;
      this.masalTimeEl.textContent = `${this.formatMasalTime(targetSec)} / ${this.formatMasalTime(maxSec)}`;
      this.callbacks.onSeekMasalTo?.(targetSec);
    });
    this.masalSeekInput.addEventListener('change', () => {
      this.isSeekingMasal = false;
      this.callbacks.onSeekMasalTo?.(Number(this.masalSeekInput.value));
    });

    this.masalTimeEl = document.createElement('span');
    this.masalTimeEl.className = 'hud-masal-time';
    this.masalTimeEl.textContent = metin("SocialAndCafeModals", "baslangic_masal_suresi");

    seekRow.append(this.masalSeekInput, this.masalTimeEl);

    // Controls row: Restart, -15s, Play/Pause, +15s, Prev/Next scene
    const controlsRow = document.createElement('div');
    controlsRow.className = 'hud-masal-controls-row';

    const restartBtn = document.createElement('button');
    restartBtn.className = 'hud-mini-btn';
    restartBtn.textContent = metin("SocialAndCafeModals", "basa_sar");
    restartBtn.onclick = () => this.callbacks.onRestartMasal?.();

    const back15Btn = document.createElement('button');
    back15Btn.className = 'hud-mini-btn';
    back15Btn.textContent = metin("SocialAndCafeModals", "15sn");
    back15Btn.onclick = () => this.callbacks.onSeekMasalDelta?.(-15);

    this.masalPlayBtn = document.createElement('button');
    this.masalPlayBtn.className = "hud-btn hud-btn-amber hud-masal-play-btn";
    this.masalPlayBtn.textContent = metin("SocialAndCafeModals", "duraklat");
    this.masalPlayBtn.onclick = () => {
      this.callbacks.onPlaySelect();
      this.callbacks.onToggleMasalPlay?.();
    };

    const fwd15Btn = document.createElement('button');
    fwd15Btn.className = 'hud-mini-btn';
    fwd15Btn.textContent = metin("SocialAndCafeModals", "15sn_2");
    fwd15Btn.onclick = () => this.callbacks.onSeekMasalDelta?.(15);

    const prevSceneBtn = document.createElement('button');
    prevSceneBtn.className = 'hud-mini-btn';
    prevSceneBtn.textContent = metin("SocialAndCafeModals", "onceki_sahne");
    prevSceneBtn.onclick = () => this.callbacks.onJumpMasalScene?.(-1);

    const nextSceneBtn = document.createElement('button');
    nextSceneBtn.className = 'hud-mini-btn';
    nextSceneBtn.textContent = metin("SocialAndCafeModals", "sonraki_sahne");
    nextSceneBtn.onclick = () => this.callbacks.onJumpMasalScene?.(1);

    controlsRow.append(
      restartBtn,
      back15Btn,
      this.masalPlayBtn,
      fwd15Btn,
      prevSceneBtn,
      nextSceneBtn
    );

    strip.append(topRow, seekRow, controlsRow);
    this.masalBarEl.appendChild(strip);
    host.appendChild(this.masalBarEl);
  }

  updateMasalBar(state: MasalBarHudState): void {
    this.masalBarEl.classList.remove('hidden');
    const maxSec = Math.max(1, Math.round(state.duration || 441));
    const curSec = Math.min(maxSec, Math.max(0, state.currentTime || 0));

    this.masalSeekInput.max = String(maxSec);
    if (!this.isSeekingMasal) {
      this.masalSeekInput.value = String(Math.floor(curSec));
      this.masalTimeEl.textContent = `${this.formatMasalTime(curSec)} / ${this.formatMasalTime(maxSec)}`;
    }

    this.masalPlayBtn.textContent = state.playing ? metin("SocialAndCafeModals", "duraklat") : metin("SocialAndCafeModals", "oynat");
    this.masalSitBtn.textContent = state.isSeated
      ? metin("SocialAndCafeModals", "minderden_kalk")
      : metin("SocialAndCafeModals", "mindere_otur");
    this.masalSceneBadgeEl.textContent = `🎭 ${state.sceneIndex + 1}/${state.sceneCount} • ${state.sceneSubtitle}`;
  }

  closeMasalBar(): void {
    this.isSeekingMasal = false;
    this.masalBarEl.classList.add('hidden');
  }

  isMasalBarOpen(): boolean {
    return !this.masalBarEl.classList.contains('hidden');
  }

  closeModals(): void {
    this.cafeBackdrop.classList.add('hidden');
    this.npcBackdrop.classList.add('hidden');
    this.petAdoptBackdrop.classList.add('hidden');
    this.activeAdoptPet = null;
  }

  isBlockingModalOpen(): boolean {
    return (
      !this.cafeBackdrop.classList.contains('hidden') ||
      !this.npcBackdrop.classList.contains('hidden') ||
      !this.petAdoptBackdrop.classList.contains('hidden')
    );
  }

  dispose(): void {
    window.removeEventListener('keydown', this.handleWindowKeyDown);
    this.cafeBackdrop.remove();
    this.npcBackdrop.remove();
    this.petAdoptBackdrop.remove();
    this.masalBarEl.remove();
    this.tugOverlayEl.remove();
  }
}
