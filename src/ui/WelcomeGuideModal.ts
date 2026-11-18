import {htmlKaçır, htmlMetin, metin} from "../metinler.ts";
import type {CharacterStyleId} from '../scene/ExplorerCharacter.ts';

const OFFICIAL_LOGO_URL = import.meta.env.BASE_URL + 'assets/aistudio/mirasium_cocuk_logo_2_04df5ea2.png';

export type WelcomeTabId = 'welcome' | 'guide' | 'controls';

export interface WelcomeGuideCallbacks {
  onSelectStyle: (style: CharacterStyleId) => void;
  onSelectVariant: (variant: number) => void;
  onStartAdventure: () => void;
  onTabChange?: () => void;
}

interface OutfitPreset {
  variant: number;
  label: string;
  primary: string;
  secondary: string;
  accent: string;
}

const FEMALE_OUTFIT_PRESETS: OutfitPreset[] = [
  {
    variant: 0,
    label: metin("WelcomeGuideModal", "gokyuzu_gul"),
    primary: '#0284c7',
    secondary: '#f43f5e',
    accent: '#f59e0b',
  },
  {
    variant: 1,
    label: metin("WelcomeGuideModal", "lavanta_altin"),
    primary: '#9333ea',
    secondary: '#fbbf24',
    accent: '#ec4899',
  },
  {
    variant: 2,
    label: metin("WelcomeGuideModal", "mercan_turkuaz"),
    primary: '#e11d48',
    secondary: '#38bdf8',
    accent: '#f59e0b',
  },
  {
    variant: 3,
    label: metin("WelcomeGuideModal", "zumrut_seftali"),
    primary: '#0d9488',
    secondary: '#fb7185',
    accent: '#fbbf24',
  },
];

const MALE_OUTFIT_PRESETS: OutfitPreset[] = [
  {
    variant: 0,
    label: metin("WelcomeGuideModal", "orman_civit"),
    primary: '#059669',
    secondary: '#4f46e5',
    accent: '#f59e0b',
  },
  {
    variant: 1,
    label: metin("WelcomeGuideModal", "safir_turkuaz"),
    primary: '#2563eb',
    secondary: '#0f766e',
    accent: '#d97706',
  },
  {
    variant: 2,
    label: metin("WelcomeGuideModal", "kehribar_deniz"),
    primary: '#b45309',
    secondary: '#1e40af',
    accent: '#0284c7',
  },
  {
    variant: 3,
    label: metin("WelcomeGuideModal", "gece_zumrut"),
    primary: '#4338ca',
    secondary: '#059669',
    accent: '#e11d48',
  },
];

const GUIDE_ZONES = [
  {
    icon: '🏛️',
    title: metin("WelcomeGuideModal", "2_katli_muze_50_canli_eser"),
    desc: metin("WelcomeGuideModal", "her_giriste_mirasium_arsivinden_anlik_secilen_50"),
    tag: metin("WelcomeGuideModal", "ic_mekan_1_ve_2_kat"),
  },
  {
    icon: '🎭',
    title: metin("WelcomeGuideModal", "karagoz_hacivat_golge_oyunu"),
    desc: metin("WelcomeGuideModal", "bahcedeki_geleneksel_hayali_sahnesinde_kandil_isigiyla_canlanan"),
    tag: metin("WelcomeGuideModal", "dis_mekan_golge_sahnesi"),
  },
  {
    icon: '📖',
    title: metin("WelcomeGuideModal", "anadolu_masal_kamelyasi"),
    desc: metin("WelcomeGuideModal", "ocak_basinda_anlatici_nine_esliginde_keloglan_masalini"),
    tag: metin("WelcomeGuideModal", "dis_mekan_sag_avlu"),
  },
  {
    icon: '🕌',
    title: metin("WelcomeGuideModal", "semazenler_ney_cami_avlusu"),
    desc: metin("WelcomeGuideModal", "cift_minareli_cami_yaninda_iki_ney_melodisinin"),
    tag: metin("WelcomeGuideModal", "dis_mekan_sol_avlu"),
  },
  {
    icon: '🌿',
    title: metin("WelcomeGuideModal", "labirent_geleneksel_oyunlar"),
    desc: metin("WelcomeGuideModal", "cit_labirenti_cozup_altin_tac_kazan_halat"),
    tag: metin("WelcomeGuideModal", "12_mini_oyun"),
  },
  {
    icon: '🎨',
    title: metin("WelcomeGuideModal", "atolyeler_kafe_evcil_dostlar"),
    desc: metin("WelcomeGuideModal", "resim_cizip_muzede_sergile_tarihi_eser_puzzle"),
    tag: metin("WelcomeGuideModal", "sanat_sosyal_alan"),
  },
];

const CONTROL_ITEMS = [
  {
    icon: '⌨️',
    title: metin("WelcomeGuideModal", "bilgisayar_kontrolleri"),
    lines: [
      metin("WelcomeGuideModal", "w_a_s_d_veya_ok_tuslari"),
      metin("WelcomeGuideModal", "bosluk_space_ile_zipla_saklambacta_c_ile"),
      metin("WelcomeGuideModal", "fareyi_surukleyerek_kamerayi_cevir_tekerlekle_yakinlas_uzaklas"),
      metin("WelcomeGuideModal", "ekrandaki_nesnelere_kisilere_tikla_veya_yaklasinca_e"),
    ],
  },
  {
    icon: '📱',
    title: metin("WelcomeGuideModal", "mobil_tablet_kontrolleri"),
    lines: [
      metin("WelcomeGuideModal", "sol_alttaki_sanal_joystick_ile_yon_ver"),
      metin("WelcomeGuideModal", "ekranda_parmagini_kaydirarak_etrafina_bak_ve_kamerayi"),
      metin("WelcomeGuideModal", "eserlere_sahnelere_veya_oyunlara_yaklasinca_altta_cikan"),
    ],
  },
  {
    icon: '🧭',
    title: metin("WelcomeGuideModal", "kesif_araclari_kisayollar"),
    lines: [
      metin("WelcomeGuideModal", "ust_cubuktaki_araclar_ac_ile_1_2"),
      metin("WelcomeGuideModal", "hazine_avi_bandindaki_ipucu_dugmesi_hedef_esere"),
      metin("WelcomeGuideModal", "istedigin_zaman_ust_menudeki_kilavuz_butonuna_basip"),
    ],
  },
];

export class WelcomeGuideModal {
  private callbacks: WelcomeGuideCallbacks;
  private backdropEl!: HTMLDivElement;
  private tabButtons = new Map<WelcomeTabId, HTMLButtonElement>();
  private tabPanels = new Map<WelcomeTabId, HTMLDivElement>();
  private girlCardBtn!: HTMLButtonElement;
  private boyCardBtn!: HTMLButtonElement;
  private swatchesWrapEl!: HTMLDivElement;
  private selectedSummaryEl!: HTMLSpanElement;

  private activeTab: WelcomeTabId = 'welcome';
  private selectedStyle: CharacterStyleId = 'kadin';
  private selectedVariant = 0;

  constructor(hostRoot: HTMLElement, callbacks: WelcomeGuideCallbacks) {
    this.callbacks = callbacks;
    this.buildDom(hostRoot);
    this.syncCharacterUI();
  }

  private buildDom(hostRoot: HTMLElement): void {
    this.backdropEl = document.createElement('div');
    this.backdropEl.className = "hud-modal-backdrop hud-welcome-backdrop";
    this.backdropEl.onclick = (e) => {
      if (e.target === this.backdropEl) {
        this.startAdventure();
      }
    };

    const card = document.createElement('div');
    card.className = "hud-modal-card hud-welcome-card";
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-label', metin("WelcomeGuideModal", "mirasium_cocuk_muzesi_karsilama_ve_kilavuz"));

    // Hero Header with official logo & cocuk.mirasium.org
    const hero = document.createElement('div');
    hero.className = 'hud-welcome-hero';

    const logoFrame = document.createElement('div');
    logoFrame.className = 'hud-welcome-logo-frame';
    const logoImg = document.createElement('img');
    logoImg.src = OFFICIAL_LOGO_URL;
    logoImg.alt = metin("WelcomeGuideModal", "mirasium_cocuk_muzesi_resmi_logosu");
    logoImg.className = 'hud-welcome-logo-img';
    logoFrame.appendChild(logoImg);

    const heroCopy = document.createElement('div');
    heroCopy.className = 'hud-welcome-hero-copy';

    const siteRow = document.createElement('div');
    siteRow.className = 'hud-welcome-site-row';

    const siteBadge = document.createElement('a');
    siteBadge.className = 'hud-welcome-domain-pill';
    siteBadge.href = 'https://cocuk.mirasium.org';
    siteBadge.target = '_blank';
    siteBadge.rel = metin("WelcomeGuideModal", "noopener_noreferrer");
    siteBadge.textContent = metin("WelcomeGuideModal", "cocuk_mirasium_org");

    const expBadge = document.createElement('span');
    expBadge.className = "hud-pill hud-pill-gold";
    expBadge.textContent = metin("WelcomeGuideModal", "3b_webxr_kesif_deneyimi");

    const closeBtn = document.createElement('button');
    closeBtn.className = "hud-close-btn hud-welcome-close-btn";
    closeBtn.textContent = metin("WelcomeGuideModal", "kapat_simgeli");
    closeBtn.onclick = () => this.startAdventure();

    siteRow.append(siteBadge, expBadge, closeBtn);

    const title = document.createElement('h1');
    title.className = 'hud-welcome-title';
    title.textContent = metin("WelcomeGuideModal", "mirasium_cocuk_muzesi_ne_hos_geldin");

    const subtitle = document.createElement('p');
    subtitle.className = 'hud-welcome-subtitle';
    subtitle.textContent =
      metin("WelcomeGuideModal", "anadolu_nun_kulturel_mirasi_50_canli_muze");

    heroCopy.append(siteRow, title, subtitle);
    hero.append(logoFrame, heroCopy);

    // Navigation Tabs
    const tabsBar = document.createElement('div');
    tabsBar.className = 'hud-welcome-tabs';

    const tabDefs: Array<{id: WelcomeTabId; label: string}> = [
      {id: 'welcome', label: metin("WelcomeGuideModal", "karakterini_sec_basla")},
      {id: 'guide', label: metin("WelcomeGuideModal", "muzede_neler_var_kilavuz")},
      {id: 'controls', label: metin("WelcomeGuideModal", "nasil_oynanir")},
    ];

    for (const def of tabDefs) {
      const btn = document.createElement('button');
      btn.className = 'hud-welcome-tab-btn';
      btn.textContent = def.label;
      btn.onclick = () => {
        this.callbacks.onTabChange?.();
        this.setActiveTab(def.id);
      };
      this.tabButtons.set(def.id, btn);
      tabsBar.appendChild(btn);
    }

    // Scrollable Content Area
    const bodyEl = document.createElement('div');
    bodyEl.className = 'hud-welcome-body';

    // Tab 1: Welcome & Character Selection (Kız / Erkek + Outfit Preset)
    const welcomeTab = document.createElement('div');
    welcomeTab.className = 'hud-welcome-tabpanel';

    const charSection = document.createElement('div');
    charSection.className = 'hud-welcome-section';

    const charHeading = document.createElement('h2');
    charHeading.className = 'hud-welcome-section-title';
    charHeading.textContent = metin("WelcomeGuideModal", "1_kasif_karakterini_sec_kiz_veya_erkek");

    const charDesc = document.createElement('p');
    charDesc.className = 'hud-welcome-section-sub';
    charDesc.textContent =
      metin("WelcomeGuideModal", "muzeye_girmeden_once_karakterini_kiz_veya_erkek");

    const genderGrid = document.createElement('div');
    genderGrid.className = 'hud-welcome-gender-grid';

    this.girlCardBtn = document.createElement('button');
    this.girlCardBtn.className = 'hud-welcome-char-card';
    this.girlCardBtn.innerHTML = `
      <span class="hud-welcome-char-avatar" aria-hidden="true">👧</span>
      <span class="hud-welcome-char-info">
        <span class="hud-welcome-char-name">${htmlMetin("WelcomeGuideModal", "kiz_kasif")}</span>
        <span class="hud-welcome-char-meta">${htmlMetin("WelcomeGuideModal", "sac_bandi_elbise_kasif_cantasi_ve_kralice")}</span>
      </span>
      <span class="hud-welcome-char-check">${htmlMetin("WelcomeGuideModal", "secili")}</span>
    `;
    this.girlCardBtn.onclick = () => {
      this.selectedStyle = 'kadin';
      this.callbacks.onSelectStyle('kadin');
      this.syncCharacterUI();
    };

    this.boyCardBtn = document.createElement('button');
    this.boyCardBtn.className = 'hud-welcome-char-card';
    this.boyCardBtn.innerHTML = `
      <span class="hud-welcome-char-avatar" aria-hidden="true">👦</span>
      <span class="hud-welcome-char-info">
        <span class="hud-welcome-char-name">${htmlMetin("WelcomeGuideModal", "erkek_kasif")}</span>
        <span class="hud-welcome-char-meta">${htmlMetin("WelcomeGuideModal", "kasif_sapkasi_cepli_yelek_sirt_cantasi_ve")}</span>
      </span>
      <span class="hud-welcome-char-check">${htmlMetin("WelcomeGuideModal", "secili")}</span>
    `;
    this.boyCardBtn.onclick = () => {
      this.selectedStyle = 'erkek';
      this.callbacks.onSelectStyle('erkek');
      this.syncCharacterUI();
    };

    genderGrid.append(this.girlCardBtn, this.boyCardBtn);

    const outfitHeading = document.createElement('div');
    outfitHeading.className = 'hud-welcome-outfit-label';
    outfitHeading.textContent = metin("WelcomeGuideModal", "2_kiyafet_renk_stilini_belirle");

    this.swatchesWrapEl = document.createElement('div');
    this.swatchesWrapEl.className = 'hud-welcome-swatch-grid';

    charSection.append(
      charHeading,
      charDesc,
      genderGrid,
      outfitHeading,
      this.swatchesWrapEl
    );

    // Quick Overview Highlights + Shortcut to Full Guide
    const highlightsWrap = document.createElement('div');
    highlightsWrap.className = 'hud-welcome-highlights';
    highlightsWrap.innerHTML = `
      <div class="hud-welcome-highlight-chip">🏛️ <strong>${htmlMetin("WelcomeGuideModal", "50_canli_eser")}</strong><span>${htmlMetin("WelcomeGuideModal", "her_giriste_yenilenen_2_katli_galeri")}</span></div>
      <div class="hud-welcome-highlight-chip">🎭 <strong>${htmlMetin("WelcomeGuideModal", "karagoz_amp_masal")}</strong><span>${htmlMetin("WelcomeGuideModal", "canli_golge_perdeleri_ve_dinletiler")}</span></div>
      <div class="hud-welcome-highlight-chip">🪈 <strong>${htmlMetin("WelcomeGuideModal", "semazen_amp_oyunlar")}</strong><span>${htmlMetin("WelcomeGuideModal", "ney_muzigi_ve_12_geleneksel_oyun")}</span></div>
      <div class="hud-welcome-highlight-chip">🐾 <strong>${htmlMetin("WelcomeGuideModal", "dost_sahiplen")}</strong><span>${htmlMetin("WelcomeGuideModal", "kedi_kopek_sev_isim_ver_gezdir")}</span></div>
    `;

    const openGuideShortcutBtn = document.createElement('button');
    openGuideShortcutBtn.className = "hud-btn hud-btn-dark hud-welcome-guide-link-btn";
    openGuideShortcutBtn.textContent =
      metin("WelcomeGuideModal", "muzenin_icindeki_tum_alanlari_kilavuzu_incele");
    openGuideShortcutBtn.onclick = () => {
      this.callbacks.onTabChange?.();
      this.setActiveTab('guide');
    };

    welcomeTab.append(charSection, highlightsWrap, openGuideShortcutBtn);

    // Tab 2: Detailed Guide (İçinde Neler Var?)
    const guideTab = document.createElement('div');
    guideTab.className = "hud-welcome-tabpanel hidden";

    const guideIntro = document.createElement('div');
    guideIntro.className = 'hud-welcome-guide-intro';
    guideIntro.innerHTML = `
      <div>
        <strong>${htmlMetin("WelcomeGuideModal", "mirasium_cocuk_rehberi")}</strong> ${htmlMetin("WelcomeGuideModal", "bahceden_baslayarak_muze_binasina_geleneksel_golge_sahnelerine")}
        <a href="https://cocuk.mirasium.org" target="_blank" rel="noopener noreferrer" class="hud-license-link">${htmlMetin("WelcomeGuideModal", "cocuk_mirasium_org_2")}</a>
      </div>
    `;

    const guideGrid = document.createElement('div');
    guideGrid.className = 'hud-welcome-guide-grid';
    for (const zone of GUIDE_ZONES) {
      const item = document.createElement('div');
      item.className = 'hud-welcome-guide-card';
      item.innerHTML = `
        <div class="hud-welcome-guide-card-head">
          <span class="hud-welcome-guide-icon">${zone.icon}</span>
          <div>
            <div class="hud-welcome-guide-title">${htmlKaçır(zone.title)}</div>
            <div class="hud-welcome-guide-tag">${htmlKaçır(zone.tag)}</div>
          </div>
        </div>
        <p class="hud-welcome-guide-desc">${htmlKaçır(zone.desc)}</p>
      `;
      guideGrid.appendChild(item);
    }

    guideTab.append(guideIntro, guideGrid);

    // Tab 3: Controls & Tips
    const controlsTab = document.createElement('div');
    controlsTab.className = "hud-welcome-tabpanel hidden";

    const controlsGrid = document.createElement('div');
    controlsGrid.className = 'hud-welcome-controls-grid';
    for (const block of CONTROL_ITEMS) {
      const box = document.createElement('div');
      box.className = 'hud-welcome-control-card';
      const head = document.createElement('div');
      head.className = 'hud-welcome-control-head';
      head.textContent = `${block.icon} ${block.title}`;
      const list = document.createElement('ul');
      list.className = 'hud-welcome-control-list';
      for (const line of block.lines) {
        const li = document.createElement('li');
        li.textContent = line;
        list.appendChild(li);
      }
      box.append(head, list);
      controlsGrid.appendChild(box);
    }
    controlsTab.appendChild(controlsGrid);

    this.tabPanels.set('welcome', welcomeTab);
    this.tabPanels.set('guide', guideTab);
    this.tabPanels.set('controls', controlsTab);
    bodyEl.append(welcomeTab, guideTab, controlsTab);

    // Footer with cocuk.mirasium.org + Selected Character Summary + Start CTA
    const footer = document.createElement('div');
    footer.className = 'hud-welcome-footer';

    const footerLeft = document.createElement('div');
    footerLeft.className = 'hud-welcome-footer-left';

    const footerSite = document.createElement('a');
    footerSite.className = 'hud-welcome-footer-url';
    footerSite.href = 'https://cocuk.mirasium.org';
    footerSite.target = '_blank';
    footerSite.rel = metin("WelcomeGuideModal", "noopener_noreferrer");
    footerSite.textContent = metin("WelcomeGuideModal", "cocuk_mirasium_org_2");

    this.selectedSummaryEl = document.createElement('span');
    this.selectedSummaryEl.className = 'hud-welcome-selected-summary';

    footerLeft.append(footerSite, this.selectedSummaryEl);

    const startBtn = document.createElement('button');
    startBtn.className = "hud-btn hud-btn-amber hud-welcome-start-btn";
    startBtn.textContent = metin("WelcomeGuideModal", "maceraya_basla");
    startBtn.onclick = () => this.startAdventure();

    footer.append(footerLeft, startBtn);

    card.append(hero, tabsBar, bodyEl, footer);
    this.backdropEl.appendChild(card);
    hostRoot.appendChild(this.backdropEl);
  }

  private renderOutfitSwatches(): void {
    const presets =
      this.selectedStyle === 'kadin'
        ? FEMALE_OUTFIT_PRESETS
        : MALE_OUTFIT_PRESETS;

    this.swatchesWrapEl.innerHTML = '';
    for (const preset of presets) {
      const btn = document.createElement('button');
      btn.className = `hud-welcome-swatch-btn ${
        this.selectedVariant === preset.variant ? 'selected' : ''
      }`;
      btn.innerHTML = `
        <span class="hud-welcome-swatch-dots">
          <i style="background:${preset.primary}"></i>
          <i style="background:${preset.secondary}"></i>
          <i style="background:${preset.accent}"></i>
        </span>
        <span class="hud-welcome-swatch-name">${preset.label}</span>
      `;
      btn.onclick = () => {
        this.selectedVariant = preset.variant;
        this.callbacks.onSelectVariant(preset.variant);
        this.syncCharacterUI();
      };
      this.swatchesWrapEl.appendChild(btn);
    }
  }

  private syncCharacterUI(): void {
    this.girlCardBtn.classList.toggle('selected', this.selectedStyle === 'kadin');
    this.boyCardBtn.classList.toggle('selected', this.selectedStyle === 'erkek');
    this.renderOutfitSwatches();

    const presets =
      this.selectedStyle === 'kadin'
        ? FEMALE_OUTFIT_PRESETS
        : MALE_OUTFIT_PRESETS;
    const preset = presets[this.selectedVariant % presets.length];
    const genderLabel =
      this.selectedStyle === 'kadin' ? metin("WelcomeGuideModal", "kiz_kasif_2") : metin("WelcomeGuideModal", "erkek_kasif_2");
    this.selectedSummaryEl.textContent = metin("WelcomeGuideModal", "secili_karakter_1_2", genderLabel, preset.label);
  }

  setActiveTab(tab: WelcomeTabId): void {
    this.activeTab = tab;
    for (const [id, btn] of this.tabButtons.entries()) {
      btn.classList.toggle('active', id === tab);
    }
    for (const [id, panel] of this.tabPanels.entries()) {
      panel.classList.toggle('hidden', id !== tab);
    }
  }

  syncExternalStyle(style: CharacterStyleId): void {
    this.selectedStyle = style;
    this.syncCharacterUI();
  }

  open(tab: WelcomeTabId = 'welcome'): void {
    this.setActiveTab(tab);
    this.syncCharacterUI();
    this.backdropEl.classList.remove('hidden');
  }

  close(): void {
    this.backdropEl.classList.add('hidden');
  }

  isOpen(): boolean {
    return !this.backdropEl.classList.contains('hidden');
  }

  private startAdventure(): void {
    this.close();
    this.callbacks.onStartAdventure();
  }
}
