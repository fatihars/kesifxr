import {htmlKaçır, htmlMetin, metin} from "../metinler.ts";
import type {CharacterStyleId} from '../scene/ExplorerCharacter.ts';
import {
  type ArtifactItem,
  type BadgeId,
  type ClockState,
  type CollectionMeta,
  MUSEUM_BADGES,
  type QuestMission,
  type TimeOfDayMode,
  type WeatherMode,
} from '../types.ts';
import {SiyerLessonModal} from './SiyerLessonModal.ts';
import {ObservatoryModal, type ObservatoryPage} from './ObservatoryModal.ts';
import {ExcavationModal} from './ExcavationModal.ts';
import {ConcertModal} from './ConcertModal.ts';
import type {ConcertPlayer} from '../services/concertPlayer.ts';
import type {DigArtifactInfo} from '../scene/InteractiveGardenProps.ts';
import {ExplorerMenu} from './ExplorerMenu.ts';
import {artifactObservation} from './artifactObservation.ts';
import {WelcomeGuideModal, type WelcomeTabId} from './WelcomeGuideModal.ts';

export interface ProximityPromptState {
  title: string;
  actionLabel: string;
  onTrigger: () => void;
  secondaryLabel?: string;
  onSecondaryTrigger?: () => void;
}

export interface HudCallbacks {
  onSelectArtifactAndVisit: (artifact: ArtifactItem) => void;
  onInspectArtifact: (artifact: ArtifactItem) => void;
  onCollectStar: (artifact: ArtifactItem) => void;
  onSpeakText: (text: string, onStateChange?: (speaking: boolean) => void) => void;
  onPlayDirectorAudio: (onStateChange?: (playing: boolean) => void) => void;
  onStopSpeech: () => void;
  onToggleAmbientMute?: () => boolean;
  onNewQuest: () => void;
  onRequestHintBeam: () => void;
  onRefreshBatch: () => void;
  onToggleInsideOutside: () => void;
  onToggleFloor: () => void;
  onSelectCharacter: (style: CharacterStyleId) => void;
  onSelectCharacterVariant?: (variant: number) => void;
  onStartAdventure?: () => void;
  onCycleTimeMode: () => TimeOfDayMode;
  onToggleWeather: () => WeatherMode;
  onToggleLantern: () => boolean;
  onOpenArtStation: () => void;
  onOpenPuzzleStation: () => void;
  onOpenInventory: () => void;
  onJoystickMove: (x: number, y: number) => void;
  onJump: () => void;
  onPrevArtifact: () => void;
  onNextArtifact: () => void;
  onToggleView: () => boolean;
  onEnterXR?: () => void;
  explorerActions: Omit<ConstructorParameters<typeof ExplorerMenu>[1], 'gallery' | 'art' | 'puzzle'>;
  concertPlayer: ConcertPlayer;
}

const LOGO_URL = import.meta.env.BASE_URL + 'assets/aistudio/mirasium_cocuk_logo_2_04df5ea2.png';
const DIRECTOR_PHOTO_URL = import.meta.env.BASE_URL + 'assets/aistudio/m_d_rfoto_db9d1edd.jpg';

const TIME_LABELS: Record<TimeOfDayMode, string> = {
  day: metin("MuseumHud", "gunduz"),
  sunset: metin("MuseumHud", "aksam"),
  night: metin("MuseumHud", "gece"),
  auto: metin("MuseumHud", "dongu"),
};

export class MuseumHud {
  private root: HTMLDivElement;
  private explorerMenu!: ExplorerMenu;
  private siyerLesson!: SiyerLessonModal;
  private observatory!: ObservatoryModal;
  private excavation!: ExcavationModal;
  private concert!: ConcertModal;
  private callbacks: HudCallbacks;

  private starCountEl!: HTMLSpanElement;
  private appleCountEl!: HTMLSpanElement;
  private badgesRowEl!: HTMLDivElement;
  private badgeEls = new Map<BadgeId, HTMLButtonElement>();
  private locationBadgeEl!: HTMLSpanElement;
  private clockPillEl!: HTMLButtonElement;
  private insideToggleBtn!: HTMLButtonElement;
  private floorToggleBtn!: HTMLButtonElement;
  private listBtn!: HTMLButtonElement;
  private questClueEl!: HTMLSpanElement;
  private catalogueDrawerEl!: HTMLElement;
  private catalogueCountEl!: HTMLSpanElement;
  private catalogueTabsEl!: HTMLDivElement;
  private catalogueGridEl!: HTMLDivElement;
  private refreshBtn!: HTMLButtonElement;
  private timeBtn!: HTMLButtonElement;
  private weatherBtn!: HTMLButtonElement;
  private lanternBtn!: HTMLButtonElement;
  private xrBtn?: HTMLButtonElement;

  private charKadinBtn!: HTMLButtonElement;
  private charErkekBtn!: HTMLButtonElement;

  private promptBannerEl!: HTMLDivElement;
  private promptTitleEl!: HTMLSpanElement;
  private promptActionBtn!: HTMLButtonElement;
  private promptSecondaryBtn!: HTMLButtonElement;
  private activePrompt: ProximityPromptState | null = null;

  private storyModalEl!: HTMLDivElement;
  private storyImgEl!: HTMLImageElement;
  private storyCollectionEl!: HTMLSpanElement;
  private storyCounterEl!: HTMLSpanElement;
  private storyFloorEl!: HTMLSpanElement;
  private storyTitleEl!: HTMLHeadingElement;
  private storyBodyEl!: HTMLDivElement;
  private storyTextWrapEl!: HTMLDivElement;
  private storyTextEl!: HTMLDivElement;
  private storyMetaGridEl!: HTMLDivElement;
  private storyArchiveLinkEl!: HTMLAnchorElement;
  private storySpeakBtn!: HTMLButtonElement;
  private storyStarBtn!: HTMLButtonElement;

  private topBarEl!: HTMLElement;
  private toolbarToggleBtn!: HTMLButtonElement;
  private toolbarExpanded = false;
  private questBarEl!: HTMLDivElement;
  private questCollapsed = false;
  private bagBtn!: HTMLButtonElement;
  private activityPillEl!: HTMLSpanElement;
  private ambientBtn!: HTMLButtonElement;
  private directorModalEl!: HTMLDivElement;
  private directorSpeakBtn!: HTMLButtonElement;
  private welcomeGuideModal!: WelcomeGuideModal;
  private guideBtn!: HTMLButtonElement;
  private karagozLicensePopupEl!: HTMLDivElement;
  private karagozLicenseMiniBtn!: HTMLButtonElement;
  private karagozLicenseVisible = false;

  private toastEl!: HTMLDivElement;
  private toastTimer?: number;

  private phaseBannerEl!: HTMLDivElement;
  private phaseBannerTitleEl!: HTMLDivElement;
  private phaseBannerSubEl!: HTMLDivElement;
  private phaseBannerTimer?: number;

  private artifacts: ArtifactItem[] = [];
  private collections: CollectionMeta[] = [];
  private discoveredIds = new Set<number>();
  private activeFilterId = 'all';
  private drawerOpen = false;
  private currentModalArtifact: ArtifactItem | null = null;

  constructor(callbacks: HudCallbacks) {
    this.callbacks = callbacks;
    this.root = document.createElement('div');
    this.root.id = 'museum-hud';
    this.buildDom();
    document.body.appendChild(this.root);
  }

  getRootElement(): HTMLDivElement {
    return this.root;
  }

  openTileWorkshop(): void {
    this.explorerMenu.openWorkshop();
  }

  openSiyerLesson(): void {
    this.siyerLesson.open();
  }

  openObservatory(page: ObservatoryPage): void {
    this.observatory.open(page);
  }

  openExcavation(artifact: DigArtifactInfo, onRecord: () => boolean): void {
    this.excavation.open(artifact, onRecord);
  }

  openExcavationJournal(records: DigArtifactInfo[]): void {
    this.excavation.openJournal(records);
  }

  openConcert(): void {
    this.concert.open();
  }

  private buildDom(): void {
    this.siyerLesson = new SiyerLessonModal(this.root);
    this.observatory = new ObservatoryModal(this.root);
    this.excavation = new ExcavationModal(this.root);
    this.concert = new ConcertModal(this.root, this.callbacks.concertPlayer);
    const topDock = document.createElement('div');
    topDock.className = 'hud-top-dock';

    this.topBarEl = document.createElement('header');
    this.topBarEl.className = "hud-topbar collapsed";

    const brandRow = document.createElement('div');
    brandRow.className = 'hud-brand-row';

    const brandEl = document.createElement('div');
    brandEl.className = 'hud-brand';
    brandEl.innerHTML = `
      <span class="hud-brand-logo-wrap">
        <img src="${LOGO_URL}" alt="${htmlMetin("MuseumHud", "mirasium_cocuk_logo")}" class="hud-brand-logo" />
      </span>
      <div class="hud-brand-copy">
        <div class="hud-brand-title">${htmlMetin("MuseumHud", "mirasium_cocuk_muzesi")}</div>
      </div>
    `;

    const statusPills = document.createElement('div');
    statusPills.className = 'hud-status-pills';

    this.starCountEl = document.createElement('span');
    this.starCountEl.className = "hud-pill hud-pill-gold";
    this.starCountEl.textContent = metin("MuseumHud", "baslangic_yildiz");

    // Visual Achievement Badge Strip right beside the star counter
    this.badgesRowEl = document.createElement('div');
    this.badgesRowEl.className = 'hud-badges-row';
    this.badgesRowEl.setAttribute('aria-label', metin("MuseumHud", "kazanilan_rozetler"));
    for (const def of MUSEUM_BADGES) {
      const badgeBtn = document.createElement('button');
      badgeBtn.className = "hud-badge-pill locked";
      badgeBtn.textContent = def.icon;
      badgeBtn.title = `${def.title} — ${def.description}`;
      badgeBtn.setAttribute('aria-label', def.title);
      badgeBtn.onclick = () => {
        const unlocked = badgeBtn.classList.contains('unlocked');
        this.showToast(
          unlocked
            ? metin("MuseumHud", "1_rozet_acik_2_3", def.icon, def.title, def.description)
            : metin("MuseumHud", "kilitli_rozet_1_2_3", def.icon, def.title, def.description)
        );
      };
      this.badgeEls.set(def.id, badgeBtn);
      this.badgesRowEl.appendChild(badgeBtn);
    }

    this.appleCountEl = document.createElement('span');
    this.appleCountEl.className = "hud-pill hud-pill-rose";
    this.appleCountEl.textContent = metin("MuseumHud", "baslangic_elma");
    this.appleCountEl.title = metin("MuseumHud", "bahceden_toplanan_elmalar");

    this.bagBtn = document.createElement('button');
    this.bagBtn.className = "hud-pill hud-pill-bag";
    this.bagBtn.textContent = metin("MuseumHud", "canta_0");
    this.bagBtn.title = metin("MuseumHud", "toplanan_esyalar_elmalar_hazineler_ve_rozetler");
    this.bagBtn.onclick = () => this.callbacks.onOpenInventory();

    this.locationBadgeEl = document.createElement('span');
    this.locationBadgeEl.className = "hud-pill hud-pill-sky";
    this.locationBadgeEl.textContent = metin("MuseumHud", "bahce");

    this.clockPillEl = document.createElement('button');
    this.clockPillEl.className = "hud-pill hud-pill-clock";
    this.clockPillEl.textContent = metin("MuseumHud", "09_50_sabah");
    this.clockPillEl.title = metin("MuseumHud", "canli_muze_saati_tiklayarak_gunduz_aksam_gece");
    this.clockPillEl.onclick = () => {
      const next = this.callbacks.onCycleTimeMode();
      this.timeBtn.textContent = TIME_LABELS[next];
    };

    this.activityPillEl = document.createElement('span');
    this.activityPillEl.className = "hud-pill hud-pill-boost hidden";

    statusPills.append(
      this.starCountEl,
      this.bagBtn,
      this.locationBadgeEl,
      this.clockPillEl,
      this.activityPillEl
    );

    this.guideBtn = document.createElement('button');
    this.guideBtn.className = 'hud-guide-open-btn';
    this.guideBtn.textContent = metin("MuseumHud", "kilavuz");
    this.guideBtn.title = metin("MuseumHud", "karsilama_ekrani_muze_rehberi_ve_karakter_secimini");
    this.guideBtn.onclick = () => this.openWelcomeGuide('guide');

    this.toolbarToggleBtn = document.createElement('button');
    this.toolbarToggleBtn.className = 'hud-collapse-btn';
    this.toolbarToggleBtn.textContent = metin("MuseumHud", "araclar");
    this.toolbarToggleBtn.setAttribute('aria-expanded', 'false');
    this.toolbarToggleBtn.setAttribute('aria-controls', 'museum-tools');
    this.toolbarToggleBtn.title = metin("MuseumHud", "ust_arac_menusunu_ac_veya_gizle");
    this.toolbarToggleBtn.onclick = () => {
      this.toolbarExpanded = !this.toolbarExpanded;
      this.topBarEl.classList.toggle('collapsed', !this.toolbarExpanded);
      this.toolbarToggleBtn.setAttribute('aria-expanded', String(this.toolbarExpanded));
    };

    const brandActions = document.createElement('div');
    brandActions.className = 'hud-brand-actions';
    this.explorerMenu = new ExplorerMenu(this.root, {
      ...this.callbacks.explorerActions,
      gallery: () => this.setDrawerOpen(true),
      art: this.callbacks.onOpenArtStation,
      puzzle: this.callbacks.onOpenPuzzleStation,
    });
    const explore = document.createElement('button');
    explore.className = 'hud-explorer-btn';
    explore.textContent = metin("MuseumHud", "kesfet");
    explore.setAttribute('aria-haspopup', 'dialog');
    explore.onclick = () => this.explorerMenu.open();
    brandActions.append(explore, this.guideBtn, this.toolbarToggleBtn);

    brandRow.append(brandEl, statusPills, brandActions);

    const actionGroup = document.createElement('div');
    actionGroup.className = 'hud-actions-row';
    actionGroup.id = 'museum-tools';

    // Gender-based character selector
    const charWrap = document.createElement('div');
    charWrap.className = 'hud-seg';
    charWrap.setAttribute('aria-label', metin("MuseumHud", "karakter_cinsiyet_secimi"));
    this.charKadinBtn = document.createElement('button');
    this.charKadinBtn.className = "hud-seg-btn active";
    this.charKadinBtn.textContent = metin("MuseumHud", "kiz");
    this.charKadinBtn.onclick = () => {
      this.setCharacterStyle('kadin');
      this.callbacks.onSelectCharacter('kadin');
    };
    this.charErkekBtn = document.createElement('button');
    this.charErkekBtn.className = 'hud-seg-btn';
    this.charErkekBtn.textContent = metin("MuseumHud", "erkek");
    this.charErkekBtn.onclick = () => {
      this.setCharacterStyle('erkek');
      this.callbacks.onSelectCharacter('erkek');
    };
    charWrap.append(this.charKadinBtn, this.charErkekBtn);

    this.insideToggleBtn = document.createElement('button');
    this.insideToggleBtn.className = "hud-btn hud-btn-primary";
    this.insideToggleBtn.textContent = metin("MuseumHud", "muzeye_gir");
    this.insideToggleBtn.onclick = () => this.callbacks.onToggleInsideOutside();

    this.floorToggleBtn = document.createElement('button');
    this.floorToggleBtn.className = "hud-btn hud-btn-indigo";
    this.floorToggleBtn.textContent = metin("MuseumHud", "2_kat");
    this.floorToggleBtn.onclick = () => this.callbacks.onToggleFloor();

    this.listBtn = document.createElement('button');
    this.listBtn.className = "hud-btn hud-btn-amber";
    this.listBtn.textContent = metin("MuseumHud", "eserler_50");
    this.listBtn.onclick = () => this.toggleDrawer();

    this.refreshBtn = document.createElement('button');
    this.refreshBtn.className = "hud-btn hud-btn-teal";
    this.refreshBtn.textContent = metin("MuseumHud", "yeni_50");
    this.refreshBtn.onclick = () => this.callbacks.onRefreshBatch();

    // Environment & Creative Quick Controls
    this.timeBtn = document.createElement('button');
    this.timeBtn.className = "hud-btn hud-btn-dark";
    this.timeBtn.textContent = TIME_LABELS.auto;
    this.timeBtn.title = metin("MuseumHud", "gunduz_aksam_gece_dongu_degistir");
    this.timeBtn.onclick = () => {
      const next = this.callbacks.onCycleTimeMode();
      this.timeBtn.textContent = TIME_LABELS[next];
    };

    this.weatherBtn = document.createElement('button');
    this.weatherBtn.className = "hud-btn hud-btn-dark";
    this.weatherBtn.textContent = metin("MuseumHud", "acik");
    this.weatherBtn.title = metin("MuseumHud", "yagmur_acik_hava_degistir");
    this.weatherBtn.onclick = () => {
      const next = this.callbacks.onToggleWeather();
      this.weatherBtn.textContent = next === 'rain' ? metin("MuseumHud", "yagmur") : metin("MuseumHud", "acik");
    };

    this.lanternBtn = document.createElement('button');
    this.lanternBtn.className = "hud-btn hud-btn-dark";
    this.lanternBtn.textContent = metin("MuseumHud", "fener");
    this.lanternBtn.title = metin("MuseumHud", "el_fenerini_ac_veya_kapat");
    this.lanternBtn.onclick = () => {
      const active = this.callbacks.onToggleLantern();
      this.setLanternActive(active);
    };

    const artStationBtn = document.createElement('button');
    artStationBtn.className = "hud-btn hud-btn-pink";
    artStationBtn.textContent = metin("MuseumHud", "cizim");
    artStationBtn.onclick = () => this.callbacks.onOpenArtStation();

    const puzzleBtn = document.createElement('button');
    puzzleBtn.className = "hud-btn hud-btn-sky";
    puzzleBtn.textContent = metin("MuseumHud", "puzzle");
    puzzleBtn.onclick = () => this.callbacks.onOpenPuzzleStation();

    const directorTopBtn = document.createElement('button');
    directorTopBtn.className = "hud-btn hud-btn-dark";
    directorTopBtn.textContent = metin("MuseumHud", "mudur");
    directorTopBtn.onclick = () => this.openDirectorModal();

    this.ambientBtn = document.createElement('button');
    this.ambientBtn.className = "hud-btn hud-btn-dark";
    this.ambientBtn.textContent = metin("MuseumHud", "muzik");
    this.ambientBtn.title = metin("MuseumHud", "muze_ambiyans_ve_doga_seslerini_ac_kapat");
    this.ambientBtn.onclick = () => {
      const muted = this.callbacks.onToggleAmbientMute?.() ?? false;
      this.ambientBtn.textContent = muted ? metin("MuseumHud", "sessiz") : metin("MuseumHud", "muzik");
    };

    const cameraBtn = document.createElement('button');
    cameraBtn.className = "hud-btn hud-btn-dark";
    cameraBtn.textContent = metin("MuseumHud", "kamera_3_sahis");
    cameraBtn.onclick = (event) => {
      cameraBtn.textContent = this.callbacks.onToggleView()
        ? metin("MuseumHud", "kamera_1_sahis")
        : metin("MuseumHud", "kamera_3_sahis");
      if (event.detail > 0) cameraBtn.blur();
    };

    actionGroup.append(
      charWrap,
      this.insideToggleBtn,
      this.floorToggleBtn,
      this.listBtn,
      this.refreshBtn,
      this.timeBtn,
      this.weatherBtn,
      this.lanternBtn,
      cameraBtn,
      artStationBtn,
      puzzleBtn,
      directorTopBtn,
      this.ambientBtn
    );

    if (this.callbacks.onEnterXR) {
      this.xrBtn = document.createElement('button');
      this.xrBtn.className = "hud-btn hud-btn-dark";
      this.xrBtn.textContent = metin("MuseumHud", "xr");
      this.xrBtn.onclick = () => this.callbacks.onEnterXR?.();
      actionGroup.appendChild(this.xrBtn);
    }

    const achievements = document.createElement('div');
    achievements.className = 'hud-tool-achievements';
    const badgeLabel = document.createElement('span');
    badgeLabel.textContent = metin("MuseumHud", "rozetler");
    achievements.append(badgeLabel, this.badgesRowEl, this.appleCountEl);
    actionGroup.append(achievements);
    this.topBarEl.append(brandRow, actionGroup);

    // Treasure Hunt Banner (collapsible on both desktop and mobile)
    this.questBarEl = document.createElement('div');
    this.questBarEl.className = "hud-questbar hidden";

    const questTitle = document.createElement('span');
    questTitle.className = 'hud-quest-tag';
    questTitle.textContent = metin("MuseumHud", "hazine_avi");

    this.questClueEl = document.createElement('span');
    this.questClueEl.className = 'hud-quest-text';
    this.questClueEl.textContent = metin("MuseumHud", "mirasium_eserleri_canli_yukleniyor");

    const questButtons = document.createElement('div');
    questButtons.className = 'hud-quest-actions';

    const hintBeamBtn = document.createElement('button');
    hintBeamBtn.className = "hud-mini-btn hud-mini-hint";
    hintBeamBtn.textContent = metin("MuseumHud", "yolu_goster");
    hintBeamBtn.title = metin("MuseumHud", "hedef_esere_giden_isikli_yolu_goster");
    hintBeamBtn.onclick = () => this.callbacks.onRequestHintBeam();

    const speakClueBtn = document.createElement('button');
    speakClueBtn.className = 'hud-mini-btn';
    speakClueBtn.textContent = metin("MuseumHud", "dinle");
    speakClueBtn.onclick = () => {
      if (this.questClueEl.textContent) {
        this.callbacks.onSpeakText(this.questClueEl.textContent);
      }
    };

    const nextQuestBtn = document.createElement('button');
    nextQuestBtn.className = 'hud-mini-btn';
    nextQuestBtn.textContent = metin("MuseumHud", "yeni_gorev");
    nextQuestBtn.onclick = () => this.callbacks.onNewQuest();

    const questCollapseBtn = document.createElement('button');
    questCollapseBtn.className = "hud-mini-btn hud-quest-collapse-btn";
    questCollapseBtn.textContent = metin("MuseumHud", "kucult");
    questCollapseBtn.title = metin("MuseumHud", "hazine_avi_bandini_kucult_veya_ac");
    questCollapseBtn.onclick = () => {
      this.questCollapsed = !this.questCollapsed;
      this.questBarEl.classList.toggle('collapsed', this.questCollapsed);
      questCollapseBtn.textContent = this.questCollapsed
        ? metin("MuseumHud", "gorevi_ac")
        : metin("MuseumHud", "kucult");
    };

    questButtons.append(
      hintBeamBtn,
      speakClueBtn,
      nextQuestBtn,
      questCollapseBtn
    );
    this.questBarEl.append(questTitle, this.questClueEl, questButtons);

    this.toastEl = document.createElement('div');
    this.toastEl.className = "hud-toast hidden";

    this.phaseBannerEl = document.createElement('div');
    this.phaseBannerEl.className = "hud-phase-banner hidden";
    this.phaseBannerTitleEl = document.createElement('div');
    this.phaseBannerTitleEl.className = 'hud-phase-banner-title';
    this.phaseBannerSubEl = document.createElement('div');
    this.phaseBannerSubEl.className = 'hud-phase-banner-sub';
    this.phaseBannerEl.append(this.phaseBannerTitleEl, this.phaseBannerSubEl);

    topDock.append(this.topBarEl, this.questBarEl, this.toastEl, this.phaseBannerEl);

    // Proximity Prompt Banner
    this.promptBannerEl = document.createElement('div');
    this.promptBannerEl.className = "hud-prompt hidden";
    this.promptTitleEl = document.createElement('span');
    this.promptActionBtn = document.createElement('button');
    this.promptActionBtn.className = "hud-btn hud-btn-amber";
    this.promptActionBtn.textContent = metin("MuseumHud", "incele_e");
    this.promptActionBtn.onclick = () => {
      this.activePrompt?.onTrigger();
    };
    this.promptSecondaryBtn = document.createElement('button');
    this.promptSecondaryBtn.className = "hud-btn hud-btn-teal hidden";
    this.promptSecondaryBtn.onclick = () => {
      this.activePrompt?.onSecondaryTrigger?.();
    };
    this.promptBannerEl.append(
      this.promptTitleEl,
      this.promptActionBtn,
      this.promptSecondaryBtn
    );

    const joystickWrap = this.buildJoystick();
    const bottomRightDock = document.createElement('div');
    bottomRightDock.className = 'hud-bottom-right-dock';

    this.karagozLicensePopupEl = document.createElement('div');
    this.karagozLicensePopupEl.className = "hud-karagoz-license-popup hidden";

    const popupHead = document.createElement('div');
    popupHead.className = 'hud-karagoz-license-popup-head';
    const popupTitle = document.createElement('span');
    popupTitle.className = 'hud-karagoz-license-popup-title';
    popupTitle.textContent = metin("MuseumHud", "video_kaynak_cc_by_lisansi");
    const shrinkBtn = document.createElement('button');
    shrinkBtn.className = 'hud-karagoz-license-shrink-btn';
    shrinkBtn.textContent = metin("MuseumHud", "kucult");
    shrinkBtn.onclick = () => this.minimizeKaragozLicense();
    popupHead.append(popupTitle, shrinkBtn);

    const popupBody = document.createElement('div');
    popupBody.className = 'hud-license-box';
    popupBody.innerHTML = `
      <div class="hud-license-row">
        <span class="hud-license-label">${htmlMetin("MuseumHud", "kullanilan_orijinal_video")}</span>
        <span>${htmlMetin("MuseumHud", "hacivat_ve_karagoz_bolum_4")}</span>
      </div>
      <div class="hud-license-row">
        <span class="hud-license-label">${htmlMetin("MuseumHud", "kanal")}</span>
        <span>${htmlMetin("MuseumHud", "aksaray_belediyesi_web_tv")}</span>
      </div>
      <div class="hud-license-row">
        <span class="hud-license-label">${htmlMetin("MuseumHud", "orijinal_video_baglantisi")}</span>
        <a
          class="hud-license-link"
          href="https://www.youtube.com/watch?v=QzBwk23e0PA"
          target="_blank"
          rel="noopener noreferrer"
        >https://www.youtube.com/watch?v=QzBwk23e0PA ↗</a>
      </div>
      <div class="hud-license-badge">
        ${htmlMetin("MuseumHud", "bu_eser_creative_commons_atif_cc_by")}
      </div>
    `;

    this.karagozLicensePopupEl.append(popupHead, popupBody);

    this.karagozLicenseMiniBtn = document.createElement('button');
    this.karagozLicenseMiniBtn.className = "hud-karagoz-license-mini hidden";
    this.karagozLicenseMiniBtn.title = metin("MuseumHud", "video_kaynak_ve_cc_by_lisans_bilgisini");
    this.karagozLicenseMiniBtn.innerHTML = `
      <span>${htmlMetin("MuseumHud", "video_lisansi_cc_by")}</span>
      <span class="hud-karagoz-license-mini-expand">${htmlMetin("MuseumHud", "buyut")}</span>
    `;
    this.karagozLicenseMiniBtn.onclick = () => this.expandKaragozLicense();

    const controlsHint = document.createElement('div');
    controlsHint.className = 'hud-controls-hint';
    controlsHint.innerHTML = `
      <span><strong>${htmlMetin("MuseumHud", "yuru")}</strong> ${htmlMetin("MuseumHud", "yurume_tuslari")}</span>
      <span><strong>${htmlMetin("MuseumHud", "kamera")}</strong> ${htmlMetin("MuseumHud", "surukle_yakinlas_tekerlek")}</span>
      <span><strong>${htmlMetin("MuseumHud", "etkilesim")}</strong> ${htmlMetin("MuseumHud", "tikla_veya_e_elma_top_cesme_sir")}</span>
      <span><strong>${htmlMetin("MuseumHud", "atolye_amp_puzzle")}</strong> ${htmlMetin("MuseumHud", "1_kat_masalar_ust_menu")}</span>
    `;
    bottomRightDock.append(this.karagozLicenseMiniBtn, controlsHint);

    // Collapsible 50+ Artifacts Drawer
    this.catalogueDrawerEl = document.createElement('aside');
    this.catalogueDrawerEl.className = "hud-drawer hidden";

    const drawerHeader = document.createElement('div');
    drawerHeader.className = 'hud-drawer-header';

    const drawerTitleWrap = document.createElement('div');
    this.catalogueCountEl = document.createElement('span');
    this.catalogueCountEl.className = 'hud-drawer-title';
    this.catalogueCountEl.textContent = metin("MuseumHud", "sergilenen_eserler_50");
    drawerTitleWrap.appendChild(this.catalogueCountEl);

    const closeDrawerBtn = document.createElement('button');
    closeDrawerBtn.className = 'hud-close-btn';
    closeDrawerBtn.textContent = metin("MuseumHud", "kapat_simgeli");
    closeDrawerBtn.onclick = () => this.setDrawerOpen(false);
    drawerHeader.append(drawerTitleWrap, closeDrawerBtn);

    this.catalogueTabsEl = document.createElement('div');
    this.catalogueTabsEl.className = 'hud-tabs';

    this.catalogueGridEl = document.createElement('div');
    this.catalogueGridEl.className = 'hud-catalogue-grid';

    this.catalogueDrawerEl.append(
      drawerHeader,
      this.catalogueTabsEl,
      this.catalogueGridEl
    );

    // Scrollable Full-Metadata Story Modal
    this.storyModalEl = document.createElement('div');
    this.storyModalEl.className = "hud-modal-backdrop hidden";
    this.storyModalEl.onclick = (e) => {
      if (e.target === this.storyModalEl) this.closeStoryModal();
    };

    const modalCard = document.createElement('div');
    modalCard.className = 'hud-modal-card';

    const modalTop = document.createElement('div');
    modalTop.className = 'hud-modal-top';
    const metaBadges = document.createElement('div');
    metaBadges.className = 'hud-group';
    this.storyCollectionEl = document.createElement('span');
    this.storyCollectionEl.className = "hud-pill hud-pill-sky";
    this.storyFloorEl = document.createElement('span');
    this.storyFloorEl.className = "hud-pill hud-pill-gold";
    this.storyCounterEl = document.createElement('span');
    this.storyCounterEl.className = "hud-pill hud-pill-dark";
    metaBadges.append(
      this.storyCollectionEl,
      this.storyFloorEl,
      this.storyCounterEl
    );

    const closeModalBtn = document.createElement('button');
    closeModalBtn.className = 'hud-close-btn';
    closeModalBtn.textContent = metin("MuseumHud", "kapat_simgeli");
    closeModalBtn.onclick = () => this.closeStoryModal();
    modalTop.append(metaBadges, closeModalBtn);

    this.storyBodyEl = document.createElement('div');
    this.storyBodyEl.className = 'hud-modal-body';

    const imgWrap = document.createElement('div');
    imgWrap.className = 'hud-modal-img-wrap';
    this.storyImgEl = document.createElement('img');
    this.storyImgEl.alt = metin("MuseumHud", "eser_gorseli");
    this.storyImgEl.setAttribute('referrerpolicy', 'no-referrer');
    imgWrap.appendChild(this.storyImgEl);

    this.storyTextWrapEl = document.createElement('div');
    this.storyTextWrapEl.className = 'hud-modal-text-wrap';
    this.storyTitleEl = document.createElement('h2');
    this.storyTitleEl.className = 'hud-modal-title';

    this.storyTextEl = document.createElement('div');
    this.storyTextEl.className = 'hud-modal-story';

    const metaSectionTitle = document.createElement('h3');
    metaSectionTitle.className = 'hud-meta-heading';
    metaSectionTitle.textContent = metin("MuseumHud", "eser_kunyesi");

    this.storyMetaGridEl = document.createElement('div');
    this.storyMetaGridEl.className = 'hud-meta-grid';

    this.storyArchiveLinkEl = document.createElement('a');
    this.storyArchiveLinkEl.className = 'hud-archive-link';
    this.storyArchiveLinkEl.target = '_blank';
    this.storyArchiveLinkEl.rel = metin("MuseumHud", "noopener_noreferrer");
    this.storyArchiveLinkEl.textContent = metin("MuseumHud", "mirasium_arsivinde_goruntule");

    this.storyTextWrapEl.append(
      this.storyTitleEl,
      this.storyTextEl,
      metaSectionTitle,
      this.storyMetaGridEl,
      this.storyArchiveLinkEl
    );
    this.storyBodyEl.append(imgWrap, this.storyTextWrapEl);

    const modalActions = document.createElement('div');
    modalActions.className = 'hud-modal-actions';

    const prevBtn = document.createElement('button');
    prevBtn.className = "hud-btn hud-btn-dark";
    prevBtn.textContent = metin("MuseumHud", "onceki_eser");
    prevBtn.onclick = () => this.callbacks.onPrevArtifact();

    this.storySpeakBtn = document.createElement('button');
    this.storySpeakBtn.className = "hud-btn hud-btn-primary";
    this.storySpeakBtn.textContent = metin("MuseumHud", "sesli_dinle");
    this.storySpeakBtn.onclick = () => {
      if (!this.currentModalArtifact) return;
      const art = this.currentModalArtifact;
      const metaSpeech = art.metadata
        .filter((m) => !m.href)
        .slice(0, 5)
        .map((m) => `${m.label}: ${m.value}.`)
        .join(' ');
      this.callbacks.onSpeakText(
        `${art.title}. ${metaSpeech} ${art.fullDescription || art.kidStory}`,
        (speaking) => {
          this.storySpeakBtn.textContent = speaking
            ? metin("MuseumHud", "durdur")
            : metin("MuseumHud", "sesli_dinle");
        }
      );
    };

    this.storyStarBtn = document.createElement('button');
    this.storyStarBtn.className = "hud-btn hud-btn-amber";
    this.storyStarBtn.textContent = metin("MuseumHud", "yildiz_topla");
    this.storyStarBtn.onclick = () => {
      if (this.currentModalArtifact) {
        this.callbacks.onCollectStar(this.currentModalArtifact);
      }
    };

    const nextBtn = document.createElement('button');
    nextBtn.className = "hud-btn hud-btn-dark";
    nextBtn.textContent = metin("MuseumHud", "sonraki_eser");
    nextBtn.onclick = () => this.callbacks.onNextArtifact();

    modalActions.append(prevBtn, this.storySpeakBtn, this.storyStarBtn, nextBtn);
    modalCard.append(modalTop, this.storyBodyEl, modalActions);
    this.storyModalEl.appendChild(modalCard);

    // Museum Director Welcome & Mirasium Çocuk Project Modal
    this.directorModalEl = document.createElement('div');
    this.directorModalEl.className = "hud-modal-backdrop hidden";
    this.directorModalEl.onclick = (e) => {
      if (e.target === this.directorModalEl) this.closeDirectorModal();
    };

    const dirCard = document.createElement('div');
    dirCard.className = "hud-modal-card hud-director-card";

    const dirTop = document.createElement('div');
    dirTop.className = 'hud-modal-top';
    const dirBadges = document.createElement('div');
    dirBadges.className = 'hud-group';
    dirBadges.innerHTML = `
      <span class="hud-pill hud-pill-gold">${htmlMetin("MuseumHud", "muze_muduru_karsilama")}</span>
      <span class="hud-pill hud-pill-sky">${htmlMetin("MuseumHud", "mirasium_cocuk_projesi")}</span>
    `;
    const closeDirBtn = document.createElement('button');
    closeDirBtn.className = 'hud-close-btn';
    closeDirBtn.textContent = metin("MuseumHud", "kapat_simgeli");
    closeDirBtn.onclick = () => this.closeDirectorModal();
    dirTop.append(dirBadges, closeDirBtn);

    const dirBody = document.createElement('div');
    dirBody.className = 'hud-director-body';
    dirBody.innerHTML = `
      <div class="hud-director-profile">
        <div class="hud-director-photo-ring">
          <img src="${DIRECTOR_PHOTO_URL}" alt="${htmlMetin("MuseumHud", "mirasium_cocuk_muzesi_muduru")}" />
        </div>
        <div class="hud-director-role">${htmlMetin("MuseumHud", "mirasium_cocuk_muzesi_muduru_2")}</div>
        <div class="hud-director-greeting">${htmlMetin("MuseumHud", "merhaba_genc_kasif_mirasium_cocuk_muzesi_ne")}</div>
      </div>
      <div class="hud-modal-text-wrap">
        <h2 class="hud-modal-title">${htmlMetin("MuseumHud", "merhaba_genc_kasif_mirasium_cocuk_muzesi_ne_2")}</h2>
        <div class="hud-modal-story">
          <p>${htmlMetin("MuseumHud", "ben_bu_buyulu_muzenin_muduruyum_bugun_seninle")}</p>
          <p><strong>${htmlMetin("MuseumHud", "burasi_siradan_bir_muze_degil")}</strong><br />${htmlMetin("MuseumHud", "mirasium_anadolu_nun_ve_osmanli_nin_gizemli")}</p>
          <p><strong>${htmlMetin("MuseumHud", "bu_macerada_seni_neler_bekliyor")}</strong></p>
          <p><strong>${htmlMetin("MuseumHud", "kesfet_2")}</strong> ${htmlMetin("MuseumHud", "ikinci_kata_cikan_gorkemli_merdivenlerimizi_tirmanarak_muzemizin")}</p>
          <p><strong>${htmlMetin("MuseumHud", "dinle_ve_ogren")}</strong> ${htmlMetin("MuseumHud", "ilgini_ceken_eserlerin_uzerine_tiklayarak_onlarin_sirlarini")}</p>
          <p><strong>${htmlMetin("MuseumHud", "yildizlari_topla")}</strong> ${htmlMetin("MuseumHud", "ve_en_eglencelisi_hazine_avi_gorevlerindeki_ipuclarini")}</p>
          <p><strong>${htmlMetin("MuseumHud", "hazirsan_gecmisin_kapilarini_aralayalim_maceramiz_basliyor")}</strong></p>
        </div>
      </div>
    `;

    const dirActions = document.createElement('div');
    dirActions.className = 'hud-modal-actions';

    this.directorSpeakBtn = document.createElement('button');
    this.directorSpeakBtn.className = "hud-btn hud-btn-primary";
    this.directorSpeakBtn.textContent = metin("MuseumHud", "mudurden_dinle");
    this.directorSpeakBtn.onclick = () => {
      this.callbacks.onPlayDirectorAudio((playing) => {
        this.directorSpeakBtn.textContent = playing
          ? metin("MuseumHud", "durdur")
          : metin("MuseumHud", "mudurden_dinle");
      });
    };

    const startExploreBtn = document.createElement('button');
    startExploreBtn.className = "hud-btn hud-btn-amber";
    startExploreBtn.textContent = metin("MuseumHud", "muzeyi_kesfetmeye_basla");
    startExploreBtn.onclick = () => this.closeDirectorModal();

    dirActions.append(this.directorSpeakBtn, startExploreBtn);
    dirCard.append(dirTop, dirBody, dirActions);
    this.directorModalEl.appendChild(dirCard);

    this.root.append(
      topDock,
      this.promptBannerEl,
      joystickWrap,
      bottomRightDock,
      this.karagozLicensePopupEl,
      this.catalogueDrawerEl,
      this.storyModalEl,
      this.directorModalEl
    );

    this.welcomeGuideModal = new WelcomeGuideModal(this.root, {
      onSelectStyle: (style) => {
        this.setCharacterStyle(style);
        this.callbacks.onSelectCharacter(style);
      },
      onSelectVariant: (variant) => {
        this.callbacks.onSelectCharacterVariant?.(variant);
      },
      onStartAdventure: () => {
        this.callbacks.onStartAdventure?.();
      },
    });
  }

  private buildJoystick(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'hud-joystick-wrap';

    const pad = document.createElement('div');
    pad.className = 'hud-joystick-pad';
    const knob = document.createElement('div');
    knob.className = 'hud-joystick-knob';
    pad.appendChild(knob);

    let dragging = false;
    const maxDist = 34;

    const updateStick = (clientX: number, clientY: number) => {
      const rect = pad.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.callbacks.onJoystickMove(dx / maxDist, dy / maxDist);
    };

    const resetStick = () => {
      dragging = false;
      knob.style.transform = 'translate(0px, 0px)';
      this.callbacks.onJoystickMove(0, 0);
    };

    pad.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      dragging = true;
      pad.setPointerCapture(e.pointerId);
      updateStick(e.clientX, e.clientY);
    });
    pad.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      e.stopPropagation();
      updateStick(e.clientX, e.clientY);
    });
    pad.addEventListener('pointerup', (e) => {
      e.stopPropagation();
      resetStick();
    });
    pad.addEventListener('pointercancel', resetStick);

    const jumpBtn = document.createElement('button');
    jumpBtn.className = 'hud-jump-btn';
    jumpBtn.textContent = metin("MuseumHud", "zipla");
    jumpBtn.onclick = (e) => {
      e.stopPropagation();
      this.callbacks.onJump();
    };

    container.append(pad, jumpBtn);
    return container;
  }

  setLoading(loading: boolean): void {
    this.refreshBtn.disabled = loading;
    this.refreshBtn.textContent = loading ? metin("MuseumHud", "yukleniyor") : metin("MuseumHud", "yeni_50");
  }

  setData(
    artifacts: ArtifactItem[],
    collections: CollectionMeta[],
    discoveredIds: Set<number>
  ): void {
    this.artifacts = artifacts;
    this.collections = collections;
    this.discoveredIds = discoveredIds;
    this.activeFilterId = 'all';
    this.listBtn.textContent = metin("MuseumHud", "eserler_1", artifacts.length);
    this.catalogueCountEl.textContent = metin("MuseumHud", "sergilenen_eserler_1", artifacts.length);
    this.updateStarCount();
    this.renderCollectionTabs();
    this.renderCatalogueGrid();
  }

  setDiscoveredIds(discoveredIds: Set<number>): void {
    this.discoveredIds = discoveredIds;
    this.updateStarCount();
    this.renderCatalogueGrid();
    if (this.currentModalArtifact) {
      const found = this.discoveredIds.has(this.currentModalArtifact.id);
      this.storyStarBtn.textContent = found
        ? metin("MuseumHud", "yildiz_alindi")
        : metin("MuseumHud", "yildiz_topla");
    }
  }

  private updateStarCount(): void {
    const total = this.artifacts.length || 50;
    this.starCountEl.textContent = `⭐ ${this.discoveredIds.size} / ${total}`;
  }

  setQuest(quest: QuestMission | null): void {
    if (!quest) {
      this.questClueEl.textContent = metin("MuseumHud", "yeni_gorev_hazirlaniyor");
      return;
    }
    this.questClueEl.textContent = quest.clue;
  }

  setLocationState(inside: boolean, floor: 1 | 2): void {
    this.questBarEl.classList.toggle('hidden', !inside);
    if (!inside) {
      this.locationBadgeEl.textContent = metin("MuseumHud", "bahce");
      this.insideToggleBtn.textContent = metin("MuseumHud", "muzeye_gir");
      this.floorToggleBtn.textContent = metin("MuseumHud", "2_kat");
    } else if (floor === 2) {
      this.locationBadgeEl.textContent = metin("MuseumHud", "2_kat_2");
      this.insideToggleBtn.textContent = metin("MuseumHud", "bahce");
      this.floorToggleBtn.textContent = metin("MuseumHud", "1_kat");
    } else {
      this.locationBadgeEl.textContent = metin("MuseumHud", "1_kat_2");
      this.insideToggleBtn.textContent = metin("MuseumHud", "bahce");
      this.floorToggleBtn.textContent = metin("MuseumHud", "2_kat");
    }
  }

  setAppleCount(count: number): void {
    this.appleCountEl.textContent = `🍎 ${count}`;
  }

  setBagCount(count: number): void {
    this.bagBtn.textContent = metin("MuseumHud", "canta_1", count);
  }

  setActivityStatus(text: string | null): void {
    if (!text) {
      this.activityPillEl.classList.add('hidden');
      this.activityPillEl.textContent = '';
    } else {
      this.activityPillEl.textContent = text;
      this.activityPillEl.classList.remove('hidden');
    }
  }

  setClockState(clock: ClockState): void {
    this.clockPillEl.textContent = `${clock.icon} ${clock.formatted} • ${clock.periodLabel}`;
    this.clockPillEl.classList.toggle('night', clock.isNight);
  }

  setBadgeUnlocked(id: BadgeId, unlocked: boolean): void {
    const el = this.badgeEls.get(id);
    if (!el) return;
    el.classList.toggle('unlocked', unlocked);
    el.classList.toggle('locked', !unlocked);
  }

  setLanternActive(active: boolean): void {
    this.lanternBtn.textContent = active ? metin("MuseumHud", "fener_acik") : metin("MuseumHud", "fener");
    this.lanternBtn.classList.toggle('hud-btn-lantern-on', active);
  }

  setProximityPrompt(prompt: ProximityPromptState | null): void {
    this.activePrompt = prompt;
    if (!prompt) {
      this.promptBannerEl.classList.add('hidden');
      return;
    }
    this.promptTitleEl.textContent = prompt.title;
    this.promptActionBtn.textContent = prompt.actionLabel;
    if (prompt.secondaryLabel && prompt.onSecondaryTrigger) {
      this.promptSecondaryBtn.textContent = prompt.secondaryLabel;
      this.promptSecondaryBtn.classList.remove('hidden');
    } else {
      this.promptSecondaryBtn.classList.add('hidden');
    }
    this.promptBannerEl.classList.remove('hidden');
  }

  triggerActivePrompt(): boolean {
    if (!this.activePrompt) return false;
    this.activePrompt.onTrigger();
    return true;
  }

  toggleDrawer(): void {
    this.setDrawerOpen(!this.drawerOpen);
  }

  setDrawerOpen(open: boolean): void {
    this.drawerOpen = open;
    this.catalogueDrawerEl.classList.toggle('hidden', !open);
  }

  private renderCollectionTabs(): void {
    this.catalogueTabsEl.innerHTML = '';

    const allTab = document.createElement('button');
    allTab.className = `hud-tab ${this.activeFilterId === 'all' ? 'active' : ''}`;
    allTab.textContent = metin("MuseumHud", "tumu_1", this.artifacts.length);
    allTab.onclick = () => {
      this.activeFilterId = 'all';
      this.renderCollectionTabs();
      this.renderCatalogueGrid();
    };
    this.catalogueTabsEl.appendChild(allTab);

    for (const col of this.collections) {
      const count = this.artifacts.filter((a) => a.collectionId === col.id).length;
      const tab = document.createElement('button');
      tab.className = `hud-tab ${this.activeFilterId === col.id ? 'active' : ''}`;
      tab.textContent = `${col.shortName} (${count})`;
      tab.onclick = () => {
        this.activeFilterId = col.id;
        this.renderCollectionTabs();
        this.renderCatalogueGrid();
      };
      this.catalogueTabsEl.appendChild(tab);
    }
  }

  private renderCatalogueGrid(): void {
    this.catalogueGridEl.innerHTML = '';
    const filtered =
      this.activeFilterId === 'all'
        ? this.artifacts
        : this.artifacts.filter((a) => a.collectionId === this.activeFilterId);

    for (const item of filtered) {
      const discovered = this.discoveredIds.has(item.id);
      const card = document.createElement('div');
      card.className = `hud-art-card ${discovered ? 'discovered' : ''}`;

      const thumb = document.createElement('img');
      thumb.src = item.thumbUrl;
      thumb.alt = item.title;
      thumb.loading = 'lazy';
      thumb.setAttribute('referrerpolicy', 'no-referrer');

      const info = document.createElement('div');
      info.className = 'hud-art-card-info';

      const meta = document.createElement('div');
      meta.className = 'hud-art-card-meta';
      meta.innerHTML = `<span class="hud-art-num">#${String(item.index).padStart(2, '0')}</span><span class="hud-art-floor">${htmlMetin("MuseumHud", "eser_kati", item.floor)}</span><span class="hud-art-col" style="color:${item.collectionHexColor}">${htmlKaçır(item.collectionShortName)}</span>${discovered ? '<span class="hud-art-star">⭐</span>' : ''}`;

      const title = document.createElement('div');
      title.className = 'hud-art-card-title';
      title.textContent = item.title;

      const btns = document.createElement('div');
      btns.className = 'hud-art-card-actions';

      const goBtn = document.createElement('button');
      goBtn.className = "hud-mini-btn hud-mini-primary";
      goBtn.textContent = metin("MuseumHud", "yanina_git");
      goBtn.onclick = () => {
        this.setDrawerOpen(false);
        this.callbacks.onSelectArtifactAndVisit(item);
      };

      const readBtn = document.createElement('button');
      readBtn.className = 'hud-mini-btn';
      readBtn.textContent = metin("MuseumHud", "oku");
      readBtn.onclick = () => {
        this.callbacks.onInspectArtifact(item);
      };

      btns.append(goBtn, readBtn);
      info.append(meta, title, btns);
      card.append(thumb, info);
      this.catalogueGridEl.appendChild(card);
    }
  }

  openStoryModal(artifact: ArtifactItem): void {
    this.currentModalArtifact = artifact;
    this.callbacks.onStopSpeech();
    this.storySpeakBtn.textContent = metin("MuseumHud", "sesli_dinle");

    this.storyImgEl.alt = artifact.title;
    this.storyImgEl.src = artifact.imageUrl;
    this.storyCollectionEl.textContent = artifact.collectionName;
    this.storyFloorEl.textContent = metin("MuseumHud", "1_kat_sergi_alani", artifact.floor);
    this.storyCounterEl.textContent = metin("MuseumHud", "eser_1_2", artifact.index, this.artifacts.length);
    this.storyTitleEl.textContent = artifact.title;

    // Render complete unclipped description paragraphs + discovery reflection
    this.storyTextEl.innerHTML = '';
    const fullText = artifact.fullDescription || artifact.kidStory;
    const paragraphs = fullText
      .split(/\n{2,}|\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (paragraphs.length === 0) {
      const p = document.createElement('p');
      p.textContent = artifact.kidStory;
      this.storyTextEl.appendChild(p);
    } else {
      for (const para of paragraphs) {
        const p = document.createElement('p');
        p.textContent = para;
        this.storyTextEl.appendChild(p);
      }
    }

    const questionBox = document.createElement('div');
    questionBox.className = 'hud-discovery-box';
    questionBox.textContent = artifactObservation(artifact);
    this.storyTextEl.prepend(questionBox);

    // Render ALL structured metadata entries cleanly
    this.storyMetaGridEl.innerHTML = '';
    const allMeta = [
      {key: 'collection', label: metin("MuseumHud", "koleksiyon"), value: artifact.collectionName},
      {key: 'floor', label: metin("MuseumHud", "muze_konumu"), value: metin("MuseumHud", "1_kat_galeri_2", artifact.floor, artifact.index)},
      ...artifact.metadata,
      {key: 'creation', label: metin("MuseumHud", "arsiv_kayit_tarihi"), value: artifact.creationDate},
    ];

    for (const entry of allMeta) {
      const itemEl = document.createElement('div');
      itemEl.className = 'hud-meta-item';

      const labelEl = document.createElement('div');
      labelEl.className = 'hud-meta-label';
      labelEl.textContent = entry.label;

      const valueEl = document.createElement('div');
      valueEl.className = 'hud-meta-value';

      if (entry.href) {
        const link = document.createElement('a');
        link.href = entry.href;
        link.target = '_blank';
        link.rel = metin("MuseumHud", "noopener_noreferrer");
        link.textContent = `${entry.value} ↗`;
        valueEl.appendChild(link);
      } else {
        valueEl.textContent = entry.value;
      }

      itemEl.append(labelEl, valueEl);
      this.storyMetaGridEl.appendChild(itemEl);
    }

    this.storyArchiveLinkEl.href = artifact.itemUrl;

    const found = this.discoveredIds.has(artifact.id);
    this.storyStarBtn.textContent = found
      ? metin("MuseumHud", "yildiz_alindi")
      : metin("MuseumHud", "yildiz_topla");

    this.storyModalEl.classList.remove('hidden');
    this.storyTextWrapEl.scrollTop = 0;
    this.storyBodyEl.scrollTop = 0;
  }

  openDirectorModal(): void {
    this.closeStoryModal();
    this.directorSpeakBtn.textContent = metin("MuseumHud", "mudurden_dinle");
    this.directorModalEl.classList.remove('hidden');
  }

  closeDirectorModal(): void {
    this.callbacks.onStopSpeech();
    this.directorSpeakBtn.textContent = metin("MuseumHud", "mudurden_dinle");
    this.directorModalEl.classList.add('hidden');
  }

  setKaragozLicenseVisible(visible: boolean): void {
    if (this.karagozLicenseVisible === visible) return;
    this.karagozLicenseVisible = visible;
    this.minimizeKaragozLicense();
    this.karagozLicenseMiniBtn.classList.toggle('hidden', !visible);
  }

  private expandKaragozLicense(): void {
    if (!this.karagozLicenseVisible) return;
    this.karagozLicenseMiniBtn.classList.add('hidden');
    this.karagozLicensePopupEl.classList.remove('hidden');
  }

  minimizeKaragozLicense(): void {
    this.karagozLicensePopupEl.classList.add('hidden');
    this.karagozLicenseMiniBtn.classList.toggle('hidden', !this.karagozLicenseVisible);
  }

  openLicenseModal(): void {
    this.expandKaragozLicense();
  }

  setCharacterStyle(style: CharacterStyleId): void {
    this.charKadinBtn.classList.toggle('active', style === 'kadin');
    this.charErkekBtn.classList.toggle('active', style === 'erkek');
    this.welcomeGuideModal?.syncExternalStyle(style);
  }

  openWelcomeGuide(tab: WelcomeTabId = 'welcome'): void {
    this.closeStoryModal();
    this.welcomeGuideModal.open(tab);
  }

  closeStoryModal(): void {
    this.currentModalArtifact = null;
    this.callbacks.onStopSpeech();
    this.storyModalEl.classList.add('hidden');
    this.directorModalEl.classList.add('hidden');
    this.welcomeGuideModal.close();
    if (!this.karagozLicensePopupEl.classList.contains('hidden')) {
      this.minimizeKaragozLicense();
    }
  }

  isModalOpen(): boolean {
    return (
      this.explorerMenu.dialog.open ||
      this.siyerLesson.dialog.open ||
      this.observatory.dialog.open ||
      this.excavation.dialog.open ||
      this.concert.dialog.open ||
      !this.storyModalEl.classList.contains('hidden') ||
      !this.directorModalEl.classList.contains('hidden') ||
      this.welcomeGuideModal.isOpen()
    );
  }

  showToast(message: string): void {
    this.toastEl.textContent = message;
    this.toastEl.classList.remove('hidden');
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toastEl.classList.add('hidden');
    }, 3800);
  }

  showPhaseBanner(
    title: string,
    subtitle: string,
    tone: 'info' | 'warn' | 'win' | 'lose' = 'info'
  ): void {
    this.phaseBannerTitleEl.textContent = title;
    this.phaseBannerSubEl.textContent = subtitle;
    this.phaseBannerEl.className = `hud-phase-banner tone-${tone}`;
    if (this.phaseBannerTimer) window.clearTimeout(this.phaseBannerTimer);
    this.phaseBannerTimer = window.setTimeout(() => {
      this.phaseBannerEl.classList.add('hidden');
    }, 4600);
  }

  dispose(): void {
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    if (this.phaseBannerTimer) window.clearTimeout(this.phaseBannerTimer);
    this.siyerLesson.dispose();
    this.concert.dispose();
    this.root.remove();
  }
}
