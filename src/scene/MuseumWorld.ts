import {metin} from "../metinler.ts";
import * as THREE from 'three';
import * as xb from 'xrblocks';

import {kidAudio} from '../services/kidAudio.ts';
import {
  fetchRandomArtifacts,
  MIN_ARTIFACTS_PER_ENTRY,
} from '../services/mirasiumService.ts';
import {
  type ArtifactItem,
  type BadgeId,
  type CafeMenuItem,
  type InventoryCategory,
  type InventoryItem,
  MUSEUM_BADGES,
  type OutdoorActivityKind,
  type QuestMission,
  type TimeOfDayMode,
  type WeatherMode,
  type WorldNpcGender,
  type WorldNpcProfile,
} from '../types.ts';
import {CreativeModals} from '../ui/CreativeModals.ts';
import {GameAndInventoryModals} from '../ui/GameAndInventoryModals.ts';
import {MuseumHud} from '../ui/MuseumHud.ts';
import {SocialAndCafeModals} from '../ui/SocialAndCafeModals.ts';
import {
  applyRendererQuality,
  DEVICE_QUALITY,
} from '../utils/deviceQuality.ts';
import {
  AnatolianCafe,
  CAFE_MENU_ITEMS,
  CAFE_ORIGIN,
  STREET_VENDOR_ITEMS,
} from './AnatolianCafe.ts';
import {ArtifactStand} from './ArtifactStand.ts';
import {CreativeStations, type StationKind} from './CreativeStations.ts';
import {EnvironmentFX} from './EnvironmentFX.ts';
import {
  type CharacterRoleOutfit,
  type CharacterStyleId,
  ExplorerCharacter,
  type PhotoPoseMode,
} from './ExplorerCharacter.ts';
import {
  IstanbulPhotoBooth,
  PHOTO_BOOTH_ORIGIN,
  PHOTO_BOOTH_VISIT_SPOT,
} from './IstanbulPhotoBooth.ts';
import {
  PhotoBoothModal,
  type PhotoCompanionMode,
  type PhotoFilterMode,
  type PhotoFriendOption,
} from '../ui/PhotoBoothModal.ts';
import {HideAndSeekManager} from './HideAndSeekManager.ts';
import {ConcertPlayer} from '../services/concertPlayer.ts';
import {CELIK_START, CelikComakField} from './CelikComakField.ts';
import {CONCERT_LISTENING_SPOT, CONCERT_ORIGIN, ConcertStage} from './ConcertStage.ts';
import {DIG_VISIT_SPOT, HeritageGarden, HODJA_ORIGIN, MARKET_STALLS, OBSERVATORY_GATE, OBSERVATORY_ORIGIN, OBSERVATORY_VISIT_SPOT, inObservatory} from './HeritageGarden.ts';
import {InteractiveGardenProps} from './InteractiveGardenProps.ts';
import {
  KARAGOZ_ORIGIN,
  KaragozStageArea,
} from './KaragozShadowTheater.ts';
import {
  MASAL_ORIGIN,
  MasalGazeboArea,
} from './MasalGazeboArea.ts';
import {
  MUSEUM_FLOOR_2_Y,
  MUSEUM_FLOOR_Y,
  MuseumBuilding,
  type WallRect,
} from './MuseumBuilding.ts';
import {MuseumDirector} from './MuseumDirector.ts';
import {OutdoorPets} from './OutdoorPets.ts';
import {DIG_MOUND_COORDS, DIG_SITE_ORIGIN, OutdoorWorld, PARK_TREE_COORDS} from './OutdoorWorld.ts';
import {
  MOSQUE_ENTRANCE,
  MOSQUE_LESSON_SPOT,
  MOSQUE_PET_WAIT,
  MOSQUE_ORIGIN,
  isInsideMosque,
  SEMA_STAGE_ORIGIN,
  SemaAndMosqueArea,
  type SemaSeatInfo,
} from './SemaAndMosqueArea.ts';
import {TILE_WORKSHOP_ORIGIN, TileWorkshop} from './TileWorkshop.ts';
import {
  createAnatolianColumn,
  createOttomanAlem,
  getAnatolianKilimTexture,
  getIznikTileTexture,
  getTerracottaRoofTextures,
  getTravertineTextures,
  getWalnutWoodTextures,
} from '../utils/anatolianMaterials.ts';
import {
  type RecruitedTugTeammate,
  TUG_ARENA_ORIGIN,
  TugOfWarArena,
} from './TugOfWarArena.ts';

interface NpcVisitor {
  id: string;
  name: string;
  gender: WorldNpcGender;
  variant: number;
  character: ExplorerCharacter;
  waypoints: THREE.Vector3[];
  waypointIndex: number;
  waitTimer: number;
  speed: number;
  bubbleSprite: THREE.Sprite;
  bubbleMat: THREE.SpriteMaterial;
  bubbleTex: THREE.CanvasTexture | null;
  speakTimer: number;
  silenceTimer: number;
  clapperEligible?: boolean;
  isClappingAtSaz?: boolean;
  sazClapCooldown?: number;
}

const WALK_SPEED = 4.8;
const RUN_SPEED = 7.4;
const TIME_CYCLE_ORDER: TimeOfDayMode[] = ['auto', 'day', 'sunset', 'night'];
const SAZ_GAZEBO_POS = new THREE.Vector3(9.8, 0, 11.8);

export class MuseumWorld extends xb.Script {
  private outdoor = new OutdoorWorld();
  private building = new MuseumBuilding();
  private envFx = new EnvironmentFX(this.outdoor);
  private gardenProps = new InteractiveGardenProps();
  private stations = new CreativeStations();
  private hideAndSeek = new HideAndSeekManager();
  private cafe = new AnatolianCafe();
  private tugArena = new TugOfWarArena();
  private pets = new OutdoorPets();
  private semaAndMosque = new SemaAndMosqueArea();
  private tileWorkshop = new TileWorkshop();
  private heritageGarden = new HeritageGarden();
  private concertStage = new ConcertStage();
  private concertPlayer = new ConcertPlayer();
  private celikField = new CelikComakField();
  private masalArea = new MasalGazeboArea();
  private karagozArea = new KaragozStageArea();
  private photoBooth = new IstanbulPhotoBooth();
  private director = new MuseumDirector();
  private readonly player: ExplorerCharacter;
  private npcs: NpcVisitor[] = [];
  private worldNpcProfiles = new Map<string, WorldNpcProfile>();
  private worldNpcCharacters = new Map<string, ExplorerCharacter>();
  private activityNpcs: Array<{
    id: string;
    kind: OutdoorActivityKind;
    char: ExplorerCharacter;
    pos: THREE.Vector3;
    label: string;
    bubbleSprite: THREE.Sprite;
    bubbleMat: THREE.SpriteMaterial;
    bubbleTex: THREE.CanvasTexture;
  }> = [];
  private sazPavilionGroup = new THREE.Group();
  private sazNoteSprites: Array<{
    sprite: THREE.Sprite;
    basePos: THREE.Vector3;
    phase: number;
  }> = [];
  private sazDisposables: Array<{dispose: () => void}> = [];
  private sazNpcChar!: ExplorerCharacter;
  private vendorNpcs: Array<{
    kind: 'siraci' | 'bozaci';
    id: string;
    char: ExplorerCharacter;
    waypoints: THREE.Vector3[];
    wpIdx: number;
    waitTimer: number;
    speed: number;
    bubbleSprite: THREE.Sprite;
    bubbleMat: THREE.SpriteMaterial;
    bubbleTex: THREE.CanvasTexture;
    quotes: string[];
    quoteIdx: number;
    shoutTimer: number;
  }> = [];
  private stands: ArtifactStand[] = [];

  private artifacts: ArtifactItem[] = [];
  private discoveredIds = new Set<number>();
  private unlockedBadges = new Set<BadgeId>();
  private inventory = new Map<string, InventoryItem>();
  private appleCount = 0;
  private appleBoostTimer = 0;
  private activeQuest: QuestMission | null = null;
  private currentArtifactIndex = 0;
  private isLoading = false;
  private wasInsideMuseum = false;
  private currentFloor: 1 | 2 = 1;

  // Environment & Lantern state
  private timeModeIndex = 0;
  private manualLanternOverride: boolean | null = null;
  private lastEnvNight = false;
  private lastEnvRain = false;
  private lastClockKey = '';

  // Hint Beam tracking
  private hintDestination: THREE.Vector3 | null = null;

  // Player & 3rd-person camera state
  private playerPos = new THREE.Vector3(0, 0, 11.5);
  private prevPlayerPos = new THREE.Vector3(0, 0, 11.5);
  private stepAccum = 0;
  private playerYaw = 0; // 0 = facing -Z (toward the museum)
  private camYaw = 0;
  private camPitch = 0.24;
  private camDistance = 5.0;
  private firstPerson = false;
  private firstPersonPitch = 0;
  private camLookCurrent = new THREE.Vector3(0, 1.3, 11.5);
  private camPosCurrent = new THREE.Vector3(0, 2.5, 16.5);

  // Input state
  private keys = new Set<string>();
  private joystickVec = new THREE.Vector2(0, 0);
  private walkTarget: THREE.Vector3 | null = null;
  private pendingInspectAfterWalk: ArtifactItem | null = null;
  private pendingDirectorChat = false;
  private pendingStationAfterWalk: StationKind | null = null;
  private pendingActivityAfterWalk: OutdoorActivityKind | null = null;
  private pendingHideSeekAfterWalk = false;
  private pendingCafeAfterWalk = false;
  private pendingTugAfterWalk = false;
  private pendingNpcAfterWalk: string | null = null;
  private pendingPetAfterWalk: string | null = null;
  private pendingSeatAfterWalk: string | null = null;
  private pendingMasalTheaterAfterWalk = false;
  private pendingKaragozAfterWalk = false;
  private pendingPhotoBoothAfterWalk = false;
  private masalBarDismissedInZone = false;
  private seatedSemaSeat: SemaSeatInfo | null = null;
  private photoStudioActive = false;
  private photoStudioCompanion: PhotoCompanionMode = 'solo';
  private photoStudioPose: PhotoPoseMode = 'wave';
  private photoStudioFilter: PhotoFilterMode = 'sepia';
  private photoBoothFriendId: string | null = null;
  private photoSavedPlayerPos = new THREE.Vector3();
  private photoSavedPlayerYaw = 0;
  private photoSavedCamYaw = 0;
  private photoSavedCamPitch = 0.24;
  private photoSavedFriendPos: THREE.Vector3 | null = null;
  private photoSavedFriendYaw = 0;
  private photoSavedFov = 90;
  private isOrbitDragging = false;
  private dragMoved = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private lastHoverRayAt = 0;

  private raycaster = new THREE.Raycaster();
  private pointerNdc = new THREE.Vector2();
  private hoveredStand: ArtifactStand | null = null;
  private hoveredInteractive = false;
  private promptKey = '';
  private lastPillText: string | null = null;
  private lastExtraWallCount = -1;

  private hud!: MuseumHud;
  private creativeModals!: CreativeModals;
  private gameModals!: GameAndInventoryModals;
  private socialModals!: SocialAndCafeModals;
  private photoBoothModal!: PhotoBoothModal;

  private readonly _moveDir = new THREE.Vector3();
  private readonly _forward = new THREE.Vector3();
  private readonly _right = new THREE.Vector3();
  private readonly _camTargetPos = new THREE.Vector3();
  private readonly _camLookTarget = new THREE.Vector3();
  private readonly _npcOutdoorPositions: THREE.Vector3[] = [];
  private readonly _frustum = new THREE.Frustum();
  private readonly _projScreenMatrix = new THREE.Matrix4();
  private readonly _standCenter = new THREE.Vector3();
  private readonly _standSphere = new THREE.Sphere();
  private mobileRenderScale = DEVICE_QUALITY.pixelRatio;
  private frameMean = 1 / 45;
  private qualityTimer = 0;
  private lightTimer = 0;
  private readonly localLights: Array<{light: THREE.PointLight | THREE.SpotLight; distance: number}> = [];
  private readonly lightPosition = new THREE.Vector3();
  private onQualityResize = (): void => {
    applyRendererQuality(xb.core.renderer);
    if (DEVICE_QUALITY.isMobile || this.mobileRenderScale < DEVICE_QUALITY.pixelRatio) {
      xb.core.renderer?.setPixelRatio(this.mobileRenderScale);
    }
  };

  private syncExtraWallRects(): void {
    const mazeRects = this.outdoor.getMazeWallRects();
    const propRects = this.outdoor.getPropWallRects();
    const cafeRects = this.cafe.getWallRects();
    const semaRects = this.semaAndMosque.getWallRects();
    const masalRects = this.masalArea.getWallRects();
    const karagozRects = this.karagozArea.getWallRects();
    const totalCount =
      mazeRects.length +
      propRects.length +
      cafeRects.length +
      semaRects.length +
      masalRects.length +
      karagozRects.length +
      this.photoBooth.walls.length +
      this.heritageGarden.walls.length;
    if (totalCount === this.lastExtraWallCount) return;
    this.lastExtraWallCount = totalCount;

    this.building.setExtraWallRects([
      ...mazeRects,
      ...propRects,
      ...cafeRects,
      ...semaRects,
      ...masalRects,
      ...karagozRects,
      ...this.photoBooth.walls,
      ...this.heritageGarden.walls,
      this.concertStage.wall,
      this.tileWorkshop.wall,
      {
        minX: SAZ_GAZEBO_POS.x - 1.55,
        maxX: SAZ_GAZEBO_POS.x + 1.55,
        minZ: SAZ_GAZEBO_POS.z - 1.55,
        maxZ: SAZ_GAZEBO_POS.z + 1.55,
      },
    ]);
  }

  constructor(private readonly initialStyle: CharacterStyleId = 'kadin') {
    super();
    this.player = new ExplorerCharacter(initialStyle);
  }

  init(): void {
    this.add(this.outdoor);
    this.add(this.building);
    this.add(this.envFx);
    this.add(this.gardenProps);
    this.add(this.stations);
    this.add(this.hideAndSeek);
    this.add(this.cafe);
    this.add(this.tugArena);
    this.add(this.pets);
    this.add(this.semaAndMosque);
    this.add(this.masalArea);
    this.add(this.karagozArea);
    this.add(this.tileWorkshop);
    this.add(this.heritageGarden);
    this.add(this.concertStage);
    this.add(this.celikField);
    this.add(this.photoBooth);
    this.celikField.onWin = (meters) => {
      this.unlockBadge('game_master');
      this.addInventoryItem('game-celikcomak', metin("MuseumWorld", "celik_comak_kupasi"), '🪵', 'game', metin("MuseumWorld", "sahada_uc_turda_1_m_toplam_mesafe", meters.toFixed(1)));
      kidAudio.playQuestVictory();
    };
    this.syncExtraWallRects();
    this.syncIndoorWallRects();

    // Museum Director welcoming visitors right inside the main lobby entrance
    this.director.position.set(1.85, MUSEUM_FLOOR_Y, -3.1);
    this.director.setBaseYaw(2.6);
    this.add(this.director);

    this.player.position.copy(this.playerPos);
    this.add(this.player);

    this.registerCafeMasterProfile();
    this.registerSemaEnsembleProfile();
    this.buildSazParkGazebo();
    this.spawnStreetVendors();
    this.spawnNpcVisitors();
    this.spawnActivityNpcs();

    this.hideAndSeek.setCallbacks({
      onCountdownTick: (sec) => {
        kidAudio.playCountdownTick();
        if (this.hideAndSeek.getMode() === 'hiding') {
          this.hud.showToast(
            metin("MuseumWorld", "1_saniye_muze_icinde_istedigin_bir_yere", sec)
          );
        } else {
          this.hud.showToast(metin("MuseumWorld", "ebe_sayiyor_1_arkadaslarin_saklaniyor", sec));
        }
      },
      onSeekStarted: () => {
        kidAudio.playMagicReveal();
        this.hud.showToast(
          metin("MuseumWorld", "sayma_bitti_1_ve_2_kati_gez")
        );
      },
      onKidFound: (kidName, foundCount, total) => {
        kidAudio.playTagFound();
        this.hud.showToast(
          metin("MuseumWorld", "1_sobelendi_2_3_bulundu", kidName, foundCount, total)
        );
      },
      onSearchPhaseStarted: () => {
        kidAudio.playCountdownTick();
        this.hud.showToast(
          metin("MuseumWorld", "ebeler_aramaya_basladi_comelerek_gizlen_veya_firsatini")
        );
      },
      onGameFinished: (result) => {
        this.player.setCrouching(false);
        this.promptKey = '';
        this.hud.setProximityPrompt(null);
        if (result.won) {
          kidAudio.playQuestVictory();
          this.triggerFullCelebration();
          this.unlockBadge('game_master');
          this.addInventoryItem(
            'hideseek-cup',
            metin("MuseumWorld", "saklambac_sampiyonluk_kupasi"),
            '🙈',
            'game',
            metin("MuseumWorld", "mirasium_muzesi_ici_saklambac_oyununda_arkadaslarina_karsi")
          );
          this.hud.showPhaseBanner(
            metin("MuseumWorld", "saklambac_zaferi"),
            result.message,
            'win'
          );
        } else {
          kidAudio.playGameLose();
          this.hud.showPhaseBanner(
            metin("MuseumWorld", "saklambac_bitti"),
            result.message,
            'lose'
          );
        }
        this.hud.showToast(result.message);
      },
      onPhaseBanner: (title, subtitle, tone) =>
        this.hud.showPhaseBanner(title, subtitle, tone),
      onToast: (msg) => this.hud.showToast(msg),
    });

    this.tugArena.setCallbacks(
      (state) => {
        if (this.socialModals?.isTugOverlayOpen()) {
          this.socialModals.updateTugState(state);
        }
      },
      (won, detail) => {
        if (won) {
          kidAudio.playQuestVictory();
          this.triggerFullCelebration(
            TUG_ARENA_ORIGIN.clone().add(new THREE.Vector3(0, 1.8, 0))
          );
          this.unlockBadge('game_master');
          this.addInventoryItem(
            'game-tugofwar',
            metin("MuseumWorld", "halat_cekmece_sampiyonluk_kupasi"),
            '🪢',
            'game',
            detail
          );
          this.hud.showPhaseBanner(metin("MuseumWorld", "halat_cekme_zaferi"), detail, 'win');
          this.hud.showToast(`🏆 ${detail}`);
        } else {
          kidAudio.playGameLose();
          this.hud.showPhaseBanner(metin("MuseumWorld", "rakip_kazandi"), detail, 'lose');
          this.hud.showToast(`😅 ${detail}`);
        }
      }
    );

    const xrSupported =
      typeof navigator !== 'undefined' && 'xr' in navigator;

    this.hud = new MuseumHud({
      onSelectArtifactAndVisit: (artifact) =>
        this.walkPlayerToArtifact(artifact),
      onInspectArtifact: (artifact) => this.openArtifactStory(artifact),
      onCollectStar: (artifact) => this.collectArtifactStar(artifact, true),
      onSpeakText: (text, onState) => kidAudio.speakTurkish(text, onState),
      onPlayDirectorAudio: (onState) => kidAudio.playDirectorAudio(onState),
      onStopSpeech: () => kidAudio.stopSpeech(),
      onToggleAmbientMute: () => kidAudio.toggleAmbientMute(),
      onNewQuest: () => {
        kidAudio.playSelect();
        this.assignNextQuest();
      },
      onRequestHintBeam: () => this.triggerHintBeam(),
      onRefreshBatch: () => {
        kidAudio.playSelect();
        void this.loadNewExhibition();
      },
      onToggleInsideOutside: () => this.toggleInsideOutside(),
      onToggleFloor: () => this.toggleFloor(),
      onSelectCharacter: (style) => {
        kidAudio.playSelect();
        this.player.setStyle(style);
        this.syncLanternState();
        if (this.player.isMazeCrownEquipped()) {
          this.hud.showToast(
            style === 'erkek'
              ? metin("MuseumWorld", "basindaki_altin_kral_taci_parliyor")
              : metin("MuseumWorld", "basindaki_altin_kralice_taci_parliyor")
          );
        }
      },
      onSelectCharacterVariant: (variant) => {
        kidAudio.playSelect();
        this.player.setVariant(variant);
      },
      onStartAdventure: () => {
        kidAudio.playSelect();
        this.hud.showToast(
          metin("MuseumWorld", "mirasium_cocuk_muzesi_ne_hos_geldin_bahceyi")
        );
      },
      onCycleTimeMode: () => this.cycleTimeOfDay(),
      onToggleWeather: () => this.toggleWeather(),
      onToggleLantern: () => this.toggleLanternManual(),
      onOpenArtStation: () => this.openOrWalkToStation('art'),
      onOpenPuzzleStation: () => this.openOrWalkToStation('puzzle'),
      onOpenInventory: () => {
        kidAudio.playSelect();
        this.gameModals.openInventoryModal(
          Array.from(this.inventory.values()),
          this.unlockedBadges,
          this.appleCount
        );
      },
      onJoystickMove: (x, y) => {
        this.joystickVec.set(x, y);
        if (Math.abs(x) > 0.08 || Math.abs(y) > 0.08) {
          this.clearAutoWalk();
        }
      },
      onJump: () => { if (!isInsideMosque(this.playerPos)) this.player.jump(); },
      onPrevArtifact: () => this.stepArtifact(-1),
      onNextArtifact: () => this.stepArtifact(1),
      onToggleView: () => this.toggleCameraView(),
      concertPlayer: this.concertPlayer,
      explorerActions: {
        activity: (kind) => {
          this.clearAutoWalk();
          if (kind === 'tugofwar') this.openOrWalkToTugOfWar();
          else this.startActivity(kind);
        },
        hideSeek: () => this.openOrWalkToHideSeek(),
        theater: () => this.visitGardenLocation(KARAGOZ_ORIGIN.clone().add(new THREE.Vector3(-4.65, 0, 0)), -Math.PI / 2),
        cafe: () => this.openOrWalkToCafe(),
        visitPhotoBooth: () => {
          this.visitGardenLocation(PHOTO_BOOTH_VISIT_SPOT, -Math.PI / 2);
          this.enterPhotoStudio();
        },
        visitTileWorkshop: () => this.visitGardenLocation(TILE_WORKSHOP_ORIGIN.clone().add(new THREE.Vector3(0, 0, 2.6)), 0),
        visitMosque: () => this.visitGardenLocation(MOSQUE_ENTRANCE, Math.PI / 2),
        visitObservatory: () => this.visitGardenLocation(OBSERVATORY_GATE, 0),
        visitExcavation: () => this.visitGardenLocation(DIG_VISIT_SPOT, 0),
        visitConcert: () => {
          this.visitGardenLocation(CONCERT_LISTENING_SPOT, 0);
          this.updateConcertAudio(0);
        },
        visitHodja: () => this.visitGardenLocation(HODJA_ORIGIN.clone().add(new THREE.Vector3(-2.1, 0, 2.5)), -0.48),
        visitMarket: (index) => {
          const stall = MARKET_STALLS[index];
          const side = Math.sign(stall.x);
          this.visitGardenLocation(new THREE.Vector3(stall.x - side * 1.85, 0, stall.z), -side * Math.PI / 2);
        },
        patternWon: () => {
          kidAudio.playQuestVictory();
          this.unlockBadge('young_artist');
          this.addInventoryItem(
            'cini-pattern-medal',
            metin("MuseumWorld", "cini_deseni_madalyasi"),
            '✦',
            'creative',
            metin("MuseumWorld", "on_cini_desenini_simetriyle_tamamladin")
          );
        },
      },
      onEnterXR: xrSupported
        ? () => {
            void xb.core.webXRSessionManager?.startSession?.();
          }
        : undefined,
    });

    this.creativeModals = new CreativeModals(this.hud.getRootElement(), {
      onPublishArtwork: (dataUrl, title) => {
        this.stations.setCustomArtworkDataUrl(dataUrl, title);
        kidAudio.playMagicReveal();
        this.triggerFullCelebration(
          this.stations.artStationPos.clone().add(new THREE.Vector3(0, 1.8, 0))
        );
        this.unlockBadge('young_artist');
        this.addInventoryItem(
          'custom-artwork',
          metin("MuseumWorld", "sanat_eserim_1", title),
          '🖼️',
          'creative',
          metin("MuseumWorld", "eser_olusturma_atolyesi_nde_kendi_ellerinle_tasarladigin")
        );
        this.hud.showToast(
          metin("MuseumWorld", "harika_1_eserin_muzedeki_genc_sanatci_panosu", title)
        );
      },
      onPuzzleSolved: (artifact, moves) => {
        kidAudio.playQuestVictory();
        this.triggerFullCelebration(
          this.stations.puzzleStationPos
            .clone()
            .add(new THREE.Vector3(0, 1.8, 0))
        );
        this.unlockBadge('young_artist');
        this.addInventoryItem(
          'puzzle-trophy',
          metin("MuseumWorld", "tarihi_eser_puzzle_kupasi"),
          '🧩',
          'creative',
          metin("MuseumWorld", "1_bulmacasini_2_hamlede_cozerek_kazandigin_kupa", artifact.title, moves)
        );
        this.hud.showToast(
          metin("MuseumWorld", "tebrikler_1_puzzle_ini_2_hamlede_cozdun", artifact.title, moves)
        );
      },
      onPlaySelect: () => kidAudio.playSelect(),
    });

    this.gameModals = new GameAndInventoryModals(this.hud.getRootElement(), {
      onUseApple: () => this.consumeAppleFromBag(),
      onUseFood: (itemId) => this.consumeFoodFromBag(itemId),
      onGameWon: (kind, title, detail) => {
        kidAudio.playQuestVictory();
        this.triggerFullCelebration();
        this.unlockBadge('game_master');
        const iconMap: Record<OutdoorActivityKind, string> = {
          pingpong: '🏓',
          mangala: '🏺',
          ringtoss: '🎯',
          bestas: '🪨',
          celikcomak: '🪵',
          topac: '🪀',
          misket: '🔮',
          tugofwar: '🪢',
        };
        this.addInventoryItem(`game-${kind}`, title, iconMap[kind], 'game', detail);
        this.hud.showToast(metin("MuseumWorld", "1_kazandin_ve_cantana_eklendi", title));
      },
      onGameLost: (_kind, message) => {
        this.hud.showToast(message);
      },
      onStartHideSeekSeek: () => {
        this.ensureInsideNearHideSeekStation();
        this.hideAndSeek.startSeekMode(this.building.getHidingSpots());
        kidAudio.playCountdownTick();
      },
      onStartHideSeekHide: () => {
        this.ensureInsideNearHideSeekStation();
        this.hideAndSeek.startHideMode(this.building.getHidingSpots());
        kidAudio.playCountdownTick();
      },
      onStopHideSeek: () => {
        this.hideAndSeek.stopGame();
        this.player.setCrouching(false);
        this.hud.showToast(metin("MuseumWorld", "saklambac_oyunu_sona_erdi"));
      },
      onPlaySelect: () => kidAudio.playSelect(),
    });

    this.socialModals = new SocialAndCafeModals(this.hud.getRootElement(), {
      onPlaySelect: () => kidAudio.playSelect(),
      onOrderCafeItem: (item, consumeNow) =>
        this.handleCafeOrder(item, consumeNow),
      onHighFiveNpc: (profile) => this.handleNpcHighFive(profile),
      onInviteNpcHideSeek: (profile) => {
        const char = this.worldNpcCharacters.get(profile.id);
        const variant =
          this.npcs.find((n) => n.id === profile.id)?.variant ?? 0;
        const res = this.hideAndSeek.inviteVisitor(
          profile.id,
          profile.name,
          profile.gender,
          variant
        );
        if (res.added) {
          kidAudio.playHighFive();
          char?.setWaveTimer(2.0);
          char?.jump();
          this.unlockBadge('social_butterfly');
          this.hud.showToast(
            metin("MuseumWorld", "1_saklambac_ekibine_katildi_2_cocuk", profile.name, res.totalCount)
          );
        }
        return res;
      },
      onRecruitNpcTugOfWar: (profile) => {
        const char = this.worldNpcCharacters.get(profile.id);
        const variant =
          this.npcs.find((n) => n.id === profile.id)?.variant ?? 0;
        const res = this.tugArena.recruitTeammate({
          id: profile.id,
          name: profile.name,
          style: profile.gender,
          variant,
        });
        if (res.added) {
          kidAudio.playHighFive();
          char?.setWaveTimer(2.0);
          char?.jump();
          this.unlockBadge('social_butterfly');
          this.hud.showToast(
            metin("MuseumWorld", "1_halat_cekme_sol_takimina_katildi_2", profile.name, res.totalLeft)
          );
        }
        return res;
      },
      onGiftFoodToNpc: (profile, foodItemId) =>
        this.handleGiftFoodToNpc(profile, foodItemId),
      onLaunchNpcActivity: (kind) => this.openOrWalkToActivity(kind),
      onOpenCafeFromNpc: () => this.socialModals.openCafeModal(),
      onVendorBuy: (vendorKind, consumeNow) =>
        this.handleVendorBuy(vendorKind, consumeNow),
      onToggleSazMusic: () => kidAudio.toggleSazPause(),
      onToggleSemaMusic: () => kidAudio.toggleSemaPause(),
      onStartTugMatch: () => this.launchTugMatchNow(),
      onPullTugRope: () => {
        if (this.tugArena.triggerPlayerPull()) {
          this.player.triggerPullBurst();
          kidAudio.playRopeStrain();
        } else {
          kidAudio.playSelect();
        }
      },
      onStopTugMatch: () => {
        this.tugArena.stopMatch();
        this.player.setPulling(0);
      },
      onAdoptPet: (petId, customName) =>
        this.handleAdoptPet(petId, customName),
      onToggleMasalPlay: () => {
        const playing = kidAudio.toggleMasalPlayPause();
        this.hud.showToast(
          playing
            ? metin("MuseumWorld", "keloglan_masali_caliyor")
            : metin("MuseumWorld", "keloglan_masali_duraklatildi")
        );
        return playing;
      },
      onSeekMasalDelta: (deltaSec) => {
        kidAudio.playSelect();
        kidAudio.seekMasalBy(deltaSec);
      },
      onSeekMasalTo: (timeSec) => {
        kidAudio.seekMasalTo(timeSec);
      },
      onRestartMasal: () => {
        kidAudio.playSelect();
        kidAudio.restartMasal();
        this.hud.showToast(metin("MuseumWorld", "keloglan_masali_bastan_baslatildi"));
      },
      onJumpMasalScene: (delta) => {
        kidAudio.playSelect();
        const curtain = this.masalArea.getShadowCurtain();
        const tale = curtain.getCurrentTale();
        const count = curtain.getSceneCount();
        const currentIdx = curtain.getSceneIndexForTime(
          kidAudio.getMasalPlaybackState().currentTime
        );
        const nextIdx = Math.max(0, Math.min(count - 1, currentIdx + delta));
        const targetScene = tale.scenes[nextIdx];
        if (targetScene) {
          kidAudio.seekMasalTo(targetScene.startTime);
          curtain.selectTaleAndScene(0, nextIdx);
        }
      },
      onToggleMasalSit: () => {
        if (this.seatedSemaSeat?.id.startsWith('masal-')) {
          this.standUpFromSemaSeat(true);
        } else {
          this.openOrWalkToMasal('seat');
        }
      },
      onHideMasalBar: () => {
        this.masalBarDismissedInZone = true;
      },
    });

    this.photoBoothModal = new PhotoBoothModal(this.hud.getRootElement(), {
      onSelectCompanion: (mode, friendId) => {
        this.applyPhotoCompanion(mode, friendId);
      },
      onSelectPose: (pose) => {
        this.photoStudioPose = pose;
        this.player.setPhotoPose(pose);
        const friend = this.photoBoothFriendId
          ? this.worldNpcCharacters.get(this.photoBoothFriendId)
          : undefined;
        if (
          friend &&
          (this.photoStudioCompanion === 'friend' ||
            this.photoStudioCompanion === 'both')
        ) {
          friend.setPhotoPose(pose === 'sit' ? 'sit' : pose === 'joy' ? 'joy' : 'wave');
        }
      },
      onSelectFilter: (filter) => {
        this.photoStudioFilter = filter;
      },
      onCountdownTick: () => kidAudio.playCountdownTick(),
      onRequestCapture: () => this.captureIstanbulPhoto(),
      onExitStudio: () => this.exitPhotoStudio(),
    });

    this.hud.setCharacterStyle(this.initialStyle);
    this.attachInputListeners();
    this.snapCameraImmediate();
    applyRendererQuality(xb.core.renderer, this);
    this.traverse((object) => {
      if (
        (object instanceof THREE.PointLight || object instanceof THREE.SpotLight) &&
        !object.userData.pooledLamp
      ) {
        this.localLights.push({light: object, distance: Infinity});
      }
    });
    if (DEVICE_QUALITY.isMobile) {
      const camera = xb.core.camera;
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.far = Math.min(camera.far, 115);
        camera.updateProjectionMatrix();
      }
    }
    this.updatePerformanceBudget(0);
    this.envFx.setPlayerPosition(this.playerPos);
    window.addEventListener('resize', this.onQualityResize);
    kidAudio.setMuseumInside(false);
    void this.loadNewExhibition();
  }

  private addInventoryItem(
    id: string,
    name: string,
    icon: string,
    category: InventoryCategory,
    description: string,
    delta = 1,
    usableLabel?: string
  ): void {
    const existing = this.inventory.get(id);
    if (existing) {
      existing.count += delta;
      existing.description = description;
    } else {
      this.inventory.set(id, {
        id,
        name,
        icon,
        category,
        count: delta,
        description,
        usableLabel,
      });
    }
    let total = 0;
    for (const item of this.inventory.values()) {
      total += item.count;
    }
    this.hud.setBagCount(total);
  }

  private consumeAppleFromBag(): boolean {
    if (this.appleCount <= 0) return false;
    this.appleCount--;
    this.hud.setAppleCount(this.appleCount);
    const entry = this.inventory.get('apple');
    if (entry) {
      entry.count = Math.max(0, entry.count - 1);
    }
    let total = 0;
    for (const item of this.inventory.values()) total += item.count;
    this.hud.setBagCount(total);

    this.appleBoostTimer = 14.0;
    kidAudio.playApplePick();
    this.hud.showToast(metin("MuseumWorld", "taze_elmayi_yedin_14_saniye_boyunca_super"));
    return true;
  }

  private consumeFoodFromBag(itemId: string): boolean {
    const entry = this.inventory.get(itemId);
    if (!entry || entry.count <= 0) return false;
    entry.count = Math.max(0, entry.count - 1);
    let total = 0;
    for (const item of this.inventory.values()) total += item.count;
    this.hud.setBagCount(total);

    const cafeDef = [...CAFE_MENU_ITEMS, ...STREET_VENDOR_ITEMS].find(
      (c) => c.id === itemId
    );
    const boost = cafeDef?.boostSeconds ?? 14;
    this.appleBoostTimer = Math.max(this.appleBoostTimer, boost);
    kidAudio.playSipDrink();
    this.hud.showToast(
      metin("MuseumWorld", "1_2_tukettin_3_sn_enerji_kazandin", entry.icon, entry.name, boost)
    );
    return true;
  }

  private handleVendorBuy(
    vendorKind: 'siraci' | 'bozaci',
    consumeNow: boolean
  ): void {
    const itemId = vendorKind === 'siraci' ? 'siraci-sira' : 'bozaci-boza';
    const item = STREET_VENDOR_ITEMS.find((i) => i.id === itemId);
    if (!item) return;

    kidAudio.playCafeBell();
    this.unlockBadge('cafe_gourmet');
    const vendor = this.vendorNpcs.find((v) => v.kind === vendorKind);
    if (vendor) {
      vendor.char.setWaveTimer(2.2);
      vendor.char.jump();
    }
    if (consumeNow) {
      this.appleBoostTimer = Math.max(this.appleBoostTimer, item.boostSeconds);
      kidAudio.playSipDrink();
      this.hud.showToast(
        metin("MuseumWorld", "1_2_afiyetle_ictin_3_sn_super", item.icon, item.name, item.boostSeconds)
      );
    } else {
      this.addInventoryItem(
        item.id,
        item.name,
        item.icon,
        'food',
        `${item.region} — ${item.description}`,
        1,
        metin("MuseumWorld", "ic_hiz")
      );
      this.hud.showToast(
        metin("MuseumWorld", "1_2_cantana_eklendi", item.icon, item.name)
      );
    }
  }

  private handleCafeOrder(item: CafeMenuItem, consumeNow: boolean): void {
    kidAudio.playCafeBell();
    this.cafe.triggerServeWave();
    this.unlockBadge('cafe_gourmet');
    if (consumeNow) {
      this.appleBoostTimer = Math.max(this.appleBoostTimer, item.boostSeconds);
      kidAudio.playSipDrink();
      this.hud.showToast(
        metin("MuseumWorld", "1_2_afiyetle_tukettin_3_sn_super", item.icon, item.name, item.boostSeconds)
      );
    } else {
      this.addInventoryItem(
        item.id,
        item.name,
        item.icon,
        'food',
        `${item.region} — ${item.description}`,
        1,
        item.category === 'drink' ? metin("MuseumWorld", "ic_hiz") : metin("MuseumWorld", "ye_hiz")
      );
      this.hud.showToast(
        metin("MuseumWorld", "1_2_cantana_eklendi_dilersen_arkadaslarina_ikram", item.icon, item.name)
      );
    }
  }

  private handleNpcHighFive(profile: WorldNpcProfile): void {
    kidAudio.playHighFive();
    this.player.setWaveTimer(1.8);
    const char = this.worldNpcCharacters.get(profile.id);
    if (char) {
      char.setWaveTimer(2.2);
      char.jump();
    }
    const npcObj = this.npcs.find((n) => n.id === profile.id);
    if (npcObj) {
      this.setNpcCustomBubble(npcObj, metin("MuseumWorld", "harika_beslik_cok_yasa"), 3.2);
    }
    this.unlockBadge('social_butterfly');
    this.hud.showToast(metin("MuseumWorld", "1_ile_beslik_caktin", profile.name));
  }

  private handleGiftFoodToNpc(
    profile: WorldNpcProfile,
    foodItemId: string
  ): boolean {
    const entry = this.inventory.get(foodItemId);
    if (!entry || entry.count <= 0) return false;
    entry.count = Math.max(0, entry.count - 1);
    let total = 0;
    for (const item of this.inventory.values()) total += item.count;
    this.hud.setBagCount(total);

    profile.treatedCount++;
    kidAudio.playHighFive();
    const char = this.worldNpcCharacters.get(profile.id);
    if (char) {
      char.setWaveTimer(2.5);
      char.jump();
    }
    const npcObj = this.npcs.find((n) => n.id === profile.id);
    if (npcObj) {
      this.setNpcCustomBubble(
        npcObj,
        metin("MuseumWorld", "1_2_icin_cok_tesekkurler", entry.icon, entry.name),
        4.2
      );
    }
    this.unlockBadge('social_butterfly');
    this.hud.showToast(
      metin("MuseumWorld", "1_adli_arkadasina_2_3_ikram_ettin", profile.name, entry.icon, entry.name)
    );
    return true;
  }

  private registerCafeMasterProfile(): void {
    const masterChar = this.cafe.getMasterCharacter();
    const id = 'npc-cafe-master';
    this.worldNpcProfiles.set(id, {
      id,
      name: metin("MuseumWorld", "kafe_ustasi_hasan"),
      gender: 'erkek',
      roleTitle: metin("MuseumWorld", "anadolu_kafe_ustasi"),
      locationLabel: metin("MuseumWorld", "mirasium_anadolu_kafe"),
      isCafeMaster: true,
      joinedHideSeek: false,
      joinedTugOfWar: false,
      treatedCount: 0,
    });
    this.worldNpcCharacters.set(id, masterChar);
  }

  private registerSemaEnsembleProfile(): void {
    const id = 'sema-ensemble';
    this.worldNpcProfiles.set(id, {
      id,
      name: metin("MuseumWorld", "neyzen_semazen_toplulugu"),
      gender: 'erkek',
      roleTitle: metin("MuseumWorld", "tasavvuf_musikisi_sema_heyeti"),
      locationLabel: metin("MuseumWorld", "sema_cami_meydani"),
      vendorKind: 'sema',
      joinedHideSeek: false,
      joinedTugOfWar: false,
      treatedCount: 0,
    });
  }

  private syncIndoorWallRects(): void {
    const rects: WallRect[] = [
      // Museum Director welcoming lobby pedestal
      {
        minX: 1.85 - 0.42,
        maxX: 1.85 + 0.42,
        minZ: -3.1 - 0.42,
        maxZ: -3.1 + 0.42,
        floor: 1,
      },
      // Art Studio Station (-3.2, -3.5)
      {
        minX: -3.2 - 0.78,
        maxX: -3.2 + 0.78,
        minZ: -3.5 - 0.58,
        maxZ: -3.5 + 0.58,
        floor: 1,
      },
      // Puzzle Station (8.1, -3.8)
      {
        minX: 8.1 - 0.65,
        maxX: 8.1 + 0.65,
        minZ: -3.8 - 0.56,
        maxZ: -3.8 + 0.56,
        floor: 1,
      },
      // Hide & Seek Ebe Station (-8.0, -3.8)
      {
        minX: -8.0 - 0.46,
        maxX: -8.0 + 0.46,
        minZ: -3.8 - 0.46,
        maxZ: -3.8 + 0.46,
        floor: 1,
      },
    ];

    for (const stand of this.stands) {
      rects.push({
        minX: stand.position.x - 0.44,
        maxX: stand.position.x + 0.44,
        minZ: stand.position.z - 0.44,
        maxZ: stand.position.z + 0.44,
        floor: stand.artifact.floor,
      });
    }

    this.building.setIndoorWallRects(rects);
  }

  private buildSazParkGazebo(): void {
    const g = this.sazPavilionGroup;
    g.position.copy(SAZ_GAZEBO_POS);
    g.rotation.y = -0.35;

    const track = <T extends {dispose: () => void}>(item: T): T => {
      this.sazDisposables.push(item);
      return item;
    };

    const walnut = getWalnutWoodTextures(1, 1);
    const roofClay = getTerracottaRoofTextures(4, 2);
    const woodMat = track(
      new THREE.MeshStandardMaterial({
        map: walnut.map,
        bumpMap: walnut.bumpMap,
        bumpScale: 0.018,
        color: 0xa1623b,
        roughness: 0.68,
      })
    );
    const cedarMat = track(
      new THREE.MeshStandardMaterial({
        map: getTravertineTextures(1, 1).map,
        color: 0xe6d8be,
        roughness: 0.62,
      })
    );
    const iznikRimMat = track(
      new THREE.MeshStandardMaterial({
        map: getIznikTileTexture('turquoise', 4, 1),
        roughness: 0.22,
      })
    );
    const roofMat = track(
      new THREE.MeshStandardMaterial({
        map: roofClay.map,
        bumpMap: roofClay.bumpMap,
        bumpScale: 0.024,
        roughness: 0.65,
      })
    );
    const velvetMat = track(
      new THREE.MeshStandardMaterial({color: 0x991b1b, roughness: 0.72})
    );
    const goldMat = track(
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        metalness: 0.85,
        roughness: 0.22,
      })
    );

    const deck = new THREE.Mesh(
      track(new THREE.CylinderGeometry(1.78, 1.92, 0.16, 8)),
      cedarMat
    );
    deck.position.y = 0.08;
    deck.receiveShadow = true;
    deck.castShadow = true;
    const deckTileRim = new THREE.Mesh(
      track(new THREE.CylinderGeometry(1.82, 1.84, 0.06, 8)),
      iznikRimMat
    );
    deckTileRim.position.y = 0.13;
    g.add(deck, deckTileRim);

    // Traditional Anatolian kilim rug texture
    const kilimMesh = new THREE.Mesh(
      track(new THREE.CircleGeometry(1.42, 28)),
      track(new THREE.MeshStandardMaterial({map: getAnatolianKilimTexture('crimson'), roughness: 0.9}))
    );
    kilimMesh.rotation.x = -Math.PI / 2;
    kilimMesh.position.y = 0.165;
    kilimMesh.receiveShadow = true;
    g.add(kilimMesh);

    // 4 carved Anatolian pillars with Muqarnas capitals
    [
      [-1.15, -1.05],
      [1.15, -1.05],
      [-1.2, 0.95],
      [1.2, 0.95],
    ].forEach(([px, pz]) => {
      const col = createAnatolianColumn(track, 0.095, 2.58, woodMat, iznikRimMat, goldMat);
      col.position.set(px, 0.16, pz);
      g.add(col);
    });

    // Cushioned wooden sedir bench behind Mihriban with bolster pillows
    const benchBase = new THREE.Mesh(
      track(new THREE.BoxGeometry(1.48, 0.28, 0.54)),
      woodMat
    );
    benchBase.position.set(0, 0.3, -0.78);
    const cushion = new THREE.Mesh(
      track(new THREE.BoxGeometry(1.4, 0.1, 0.46)),
      velvetMat
    );
    cushion.position.set(0, 0.48, -0.78);
    const bolsterGeo = track(new THREE.CylinderGeometry(0.08, 0.08, 0.34, 10));
    [-0.58, 0.58].forEach((bx) => {
      const b = new THREE.Mesh(bolsterGeo, goldMat);
      b.rotation.x = Math.PI / 2;
      b.position.set(bx, 0.57, -0.78);
      g.add(b);
    });
    g.add(benchBase, cushion);

    // Octagonal pitched Alaturka roof + decorative fascia + Ottoman Alem
    const roof = new THREE.Mesh(
      track(new THREE.ConeGeometry(2.45, 1.2, 8)),
      roofMat
    );
    roof.position.y = 3.28;
    roof.castShadow = true;
    const roofTrim = new THREE.Mesh(
      track(new THREE.CylinderGeometry(1.78, 1.9, 0.15, 8)),
      woodMat
    );
    roofTrim.position.y = 2.7;
    const roofTileBand = new THREE.Mesh(
      track(new THREE.CylinderGeometry(1.81, 1.81, 0.07, 8)),
      iznikRimMat
    );
    roofTileBand.position.y = 2.7;
    const alem = createOttomanAlem(track, 0.5, goldMat);
    alem.position.y = 3.84;
    g.add(roof, roofTrim, roofTileBand, alem);

    const lanternBulb = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.11, 12, 10)),
      track(
        new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xf59e0b,
          emissiveIntensity: 1.1,
        })
      )
    );
    lanternBulb.position.set(0, 2.48, 0.35);
    g.add(lanternBulb);
    if (!DEVICE_QUALITY.simplifiedLighting) {
      const lanternLight = new THREE.PointLight(0xfbbf24, 0.9, 9.0);
      lanternLight.position.set(0, 2.42, 0.35);
      g.add(lanternLight);
    }

    // Gazebo signboard
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 640;
    signCanvas.height = 140;
    const sctx = signCanvas.getContext('2d');
    if (sctx) {
      sctx.fillStyle = '#451a03';
      sctx.beginPath();
      sctx.roundRect(8, 8, 624, 124, 24);
      sctx.fill();
      sctx.strokeStyle = '#fbbf24';
      sctx.lineWidth = 6;
      sctx.stroke();
      sctx.fillStyle = '#fef3c7';
      sctx.font = 'bold 34px "Google Sans", Arial, sans-serif';
      sctx.textAlign = 'center';
      sctx.textBaseline = 'middle';
      sctx.fillText(metin("MuseumWorld", "saz_kosku"), 320, 74);
      sctx.fillStyle = '#fde68a';
      sctx.font = 'bold 22px "Google Sans", Arial, sans-serif';
    }
    const signTex = track(new THREE.CanvasTexture(signCanvas));
    signTex.colorSpace = THREE.SRGBColorSpace;
    const signBoard = new THREE.Mesh(
      track(new THREE.BoxGeometry(1.95, 0.44, 0.08)),
      track(new THREE.MeshStandardMaterial({map: signTex, roughness: 0.5}))
    );
    signBoard.position.set(0, 2.75, 1.32);
    g.add(signBoard);

    // Floating musical note sprites
    const noteSymbols = ['♪', '♫', '♬'];
    for (let i = 0; i < 3; i++) {
      const nCanvas = document.createElement('canvas');
      nCanvas.width = 128;
      nCanvas.height = 128;
      const nctx = nCanvas.getContext('2d');
      if (nctx) {
        nctx.fillStyle = i % 2 === 0 ? '#fbbf24' : '#f472b6';
        nctx.font = 'bold 84px "Google Sans", Arial, sans-serif';
        nctx.textAlign = 'center';
        nctx.textBaseline = 'middle';
        nctx.fillText(noteSymbols[i], 64, 64);
      }
      const nTex = track(new THREE.CanvasTexture(nCanvas));
      nTex.colorSpace = THREE.SRGBColorSpace;
      const nMat = track(
        new THREE.SpriteMaterial({
          map: nTex,
          transparent: true,
          depthWrite: false,
        })
      );
      const sprite = new THREE.Sprite(nMat);
      const basePos = new THREE.Vector3((i - 1) * 0.55, 2.05 + (i % 2) * 0.2, 0.2);
      sprite.position.copy(basePos);
      sprite.scale.set(0.36, 0.36, 1);
      g.add(sprite);
      this.sazNoteSprites.push({sprite, basePos, phase: i * 1.9});
    }

    const sazNpcId = 'npc-saz-mihriban';
    g.traverse((obj) => {
      obj.userData.worldNpcId = sazNpcId;
    });
    this.add(g);

    // Place female Saz player Mihriban on top of the gazebo rug in world coords
    this.sazNpcChar = new ExplorerCharacter('kadin', 2, 'sazplayer');
    this.sazNpcChar.position.set(
      SAZ_GAZEBO_POS.x + 0.05,
      0.16,
      SAZ_GAZEBO_POS.z - 0.14
    );
    this.sazNpcChar.rotation.y = -0.35;
    this.sazNpcChar.traverse((obj) => {
      obj.userData.worldNpcId = sazNpcId;
    });
    this.add(this.sazNpcChar);

    this.worldNpcProfiles.set(sazNpcId, {
      id: sazNpcId,
      name: metin("MuseumWorld", "saz_sanatcisi_mihriban"),
      gender: 'kadin',
      roleTitle: metin("MuseumWorld", "anadolu_saz_sanatcisi"),
      locationLabel: metin("MuseumWorld", "park_saz_kosku"),
      vendorKind: 'saz',
      joinedHideSeek: false,
      joinedTugOfWar: false,
      treatedCount: 0,
    });
    this.worldNpcCharacters.set(sazNpcId, this.sazNpcChar);
  }

  private spawnStreetVendors(): void {
    const specs: Array<{
      kind: 'siraci' | 'bozaci';
      id: string;
      name: string;
      variant: number;
      roleTitle: string;
      locationLabel: string;
      speed: number;
      waypoints: Array<[number, number, number]>;
      quotes: string[];
      bubbleBg: string;
      bubbleStroke: string;
      bubbleText: string;
    }> = [
      {
        kind: 'siraci',
        id: 'npc-vendor-siraci',
        name: metin("MuseumWorld", "usta_riza_siraci"),
        variant: 0,
        roleTitle: metin("MuseumWorld", "geleneksel_gunduz_siracisi"),
        locationLabel: metin("MuseumWorld", "gunduz_muze_bahcesi"),
        speed: 1.02,
        waypoints: [
          [-3.6, 0, 9.2],
          [-9.2, 0, 12.8],
          [-3.2, 0, 19.2],
          [5.2, 0, 18.8],
          [7.8, 0, 10.2],
          [2.4, 0, 7.6],
        ],
        quotes: [
          metin("MuseumWorld", "buz_gibi_siraaa"),
          metin("MuseumWorld", "siraaa_buz_gibi_uzum_sirasi"),
          metin("MuseumWorld", "buz_gibi_siyah_uzum_sirasi_geldi"),
          metin("MuseumWorld", "ferahlatan_taze_siraaa_buyurun"),
        ],
        bubbleBg: 'rgba(107, 33, 168, 0.96)',
        bubbleStroke: '#e9d5ff',
        bubbleText: '#ffffff',
      },
      {
        kind: 'bozaci',
        id: 'npc-vendor-bozaci',
        name: metin("MuseumWorld", "bekir_usta_bozaci"),
        variant: 2,
        roleTitle: metin("MuseumWorld", "geleneksel_gece_bozaci"),
        locationLabel: metin("MuseumWorld", "gece_muze_bahcesi"),
        speed: 0.94,
        waypoints: [
          [4.5, 0, 8.6],
          [8.6, 0, 15.8],
          [2.2, 0, 21.5],
          [-6.8, 0, 19.5],
          [-9.0, 0, 10.5],
          [-2.5, 0, 7.2],
        ],
        quotes: [
          metin("MuseumWorld", "booo_zaaa"),
          metin("MuseumWorld", "booo_zaaaa_ciiii"),
          metin("MuseumWorld", "tarcinli_leblebili_sicak_bozaaa"),
          metin("MuseumWorld", "gece_aksamlarinin_nesesi_booo_zaaa"),
        ],
        bubbleBg: 'rgba(30, 27, 75, 0.96)',
        bubbleStroke: '#fbbf24',
        bubbleText: '#fef08a',
      },
    ];

    const isNight = this.envFx.isNightTime();
    for (const s of specs) {
      const char = new ExplorerCharacter('erkek', s.variant, s.kind);
      const waypoints = s.waypoints.map(([x, y, z]) => new THREE.Vector3(x, y, z));
      char.position.copy(waypoints[0]);
      char.visible = s.kind === 'siraci' ? !isNight : isNight;
      char.traverse((obj) => {
        obj.userData.worldNpcId = s.id;
      });
      this.add(char);

      const bubbleTex = createSpeechBubbleTexture(
        s.quotes[0],
        s.bubbleBg,
        s.bubbleStroke,
        s.bubbleText
      );
      const bubbleMat = new THREE.SpriteMaterial({
        map: bubbleTex,
        transparent: true,
        depthWrite: false,
      });
      const bubbleSprite = new THREE.Sprite(bubbleMat);
      bubbleSprite.scale.set(2.48, 0.76, 1);
      bubbleSprite.position.set(0, 2.26, 0);
      char.add(bubbleSprite);

      this.worldNpcProfiles.set(s.id, {
        id: s.id,
        name: s.name,
        gender: 'erkek',
        roleTitle: s.roleTitle,
        locationLabel: s.locationLabel,
        vendorKind: s.kind,
        joinedHideSeek: false,
        joinedTugOfWar: false,
        treatedCount: 0,
      });
      this.worldNpcCharacters.set(s.id, char);

      this.vendorNpcs.push({
        kind: s.kind,
        id: s.id,
        char,
        waypoints,
        wpIdx: 1,
        waitTimer: 0.6,
        speed: s.speed,
        bubbleSprite,
        bubbleMat,
        bubbleTex,
        quotes: s.quotes,
        quoteIdx: 0,
        shoutTimer: 4.2,
      });
    }
  }

  private ensureInsideNearHideSeekStation(): void {
    if (!this.building.isInsideMuseum(this.playerPos) || this.currentFloor === 2) {
      this.playerPos.set(-6.5, MUSEUM_FLOOR_Y, -3.5);
      this.playerYaw = Math.PI / 2;
      this.camYaw = Math.PI / 2;
      this.snapCameraImmediate();
    }
  }

  private clearAutoWalk(): void {
    this.walkTarget = null;
    this.pendingInspectAfterWalk = null;
    this.pendingDirectorChat = false;
    this.pendingStationAfterWalk = null;
    this.pendingActivityAfterWalk = null;
    this.pendingHideSeekAfterWalk = false;
    this.pendingCafeAfterWalk = false;
    this.pendingTugAfterWalk = false;
    this.pendingNpcAfterWalk = null;
    this.pendingPetAfterWalk = null;
    this.pendingSeatAfterWalk = null;
    this.pendingMasalTheaterAfterWalk = false;
    this.pendingKaragozAfterWalk = false;
    this.pendingPhotoBoothAfterWalk = false;
  }

  private visitGardenLocation(position: THREE.Vector3, yaw: number): void {
    this.standUpFromSemaSeat();
    this.clearAutoWalk();
    this.playerPos.copy(position);
    this.player.position.copy(position);
    this.playerYaw = this.camYaw = yaw;
    this.player.rotation.y = yaw;
    this.snapCameraImmediate();
  }

  private tellHodjaStory(): void {
    void kidAudio.playHodjaRecording().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      this.hud.showToast(metin("MuseumWorld", "fikra_kaydi_oynatilamadi_dugmeye_tekrar_basabilirsin"));
    });
  }

  private buyMarketSnack(index: number): void {
    const stall = MARKET_STALLS[index];
    this.addInventoryItem(`garden-snack-${index}`, stall.name, stall.icon, 'food',
      metin("MuseumWorld", "bahcedeki_1_tezgahindan_alindi", stall.seller.toLocaleLowerCase('tr-TR')), 1, metin("MuseumWorld", "ye"));
    kidAudio.playSelect();
    this.hud.showToast(metin("MuseumWorld", "1_2_cantana_eklendi_2", stall.icon, stall.name));
  }

  private openDigSquare(index: number): void {
    const artifact = this.gardenProps.getDigArtifact(index);
    if (!artifact || artifact.dug || this.playerPos.distanceTo(artifact.pos) > 3) return;
    this.hud.openExcavation(artifact, () => {
      if (!this.gardenProps.digMound(index)) return false;
      this.outdoor.markDigMoundDug(index);
      kidAudio.playDigSound();
      this.unlockBadge('secret_hunter');
      this.addInventoryItem(`dig-${index}`, artifact.title, artifact.icon, 'treasure',
        metin("MuseumWorld", "kazi_defterine_kaydedilen_buluntu_kopyasi_1", artifact.fact));
      this.promptKey = '';
      return true;
    });
  }

  private openDigJournal(): void {
    const records = DIG_MOUND_COORDS.flatMap((_, index) => {
      const artifact = this.gardenProps.getDigArtifact(index);
      return artifact?.dug ? [artifact] : [];
    });
    this.hud.openExcavationJournal(records);
  }

  private cycleTimeOfDay(): TimeOfDayMode {
    kidAudio.playSelect();
    this.timeModeIndex = (this.timeModeIndex + 1) % TIME_CYCLE_ORDER.length;
    const mode = TIME_CYCLE_ORDER[this.timeModeIndex];
    this.envFx.setTimeMode(mode);
    // Reset manual lantern override on mode change so night auto-lights the lantern
    this.manualLanternOverride = null;

    if (mode === 'day') {
      this.hud.showToast(metin("MuseumWorld", "gunduz_modu_gunesli_muze_bahcesinin_tadini_cikar"));
    } else if (mode === 'sunset') {
      this.hud.showToast(metin("MuseumWorld", "aksamustu_gokyuzu_altin_turuncu_renklere_burundu"));
    } else if (mode === 'night') {
      this.hud.showToast(
        metin("MuseumWorld", "gece_fener_modu_el_fenerin_otomatik_yandi")
      );
    } else {
      this.hud.showToast(metin("MuseumWorld", "otomatik_dongu_gunduz_gun_batimi_ve_gece"));
    }
    return mode;
  }

  private toggleWeather(): WeatherMode {
    kidAudio.playSelect();
    const next: WeatherMode =
      this.envFx.getWeatherMode() === 'clear' ? 'rain' : 'clear';
    this.envFx.setWeatherMode(next);
    if (next === 'rain') {
      this.hud.showToast(
        metin("MuseumWorld", "bahcede_yagmur_basladi_muze_icine_girip_cam")
      );
    } else {
      this.hud.showToast(metin("MuseumWorld", "yagmur_dindi_gokyuzu_yeniden_acildi"));
    }
    return next;
  }

  private toggleLanternManual(): boolean {
    kidAudio.playSelect();
    const next = !this.player.isLanternActive();
    this.manualLanternOverride = next;
    this.player.setLanternActive(next);
    if (next && this.envFx.isNightTime()) {
      this.unlockBadge('night_lantern');
    }
    this.hud.showToast(
      next ? metin("MuseumWorld", "el_fenerin_acildi") : metin("MuseumWorld", "el_fenerin_kapatildi")
    );
    return next;
  }

  private syncLanternState(): void {
    const isNight = this.envFx.isNightTime();
    const shouldLight =
      this.manualLanternOverride !== null ? this.manualLanternOverride : isNight;
    if (shouldLight !== this.player.isLanternActive()) {
      this.player.setLanternActive(shouldLight);
      this.hud.setLanternActive(shouldLight);
    }
    if (isNight && shouldLight) {
      this.unlockBadge('night_lantern');
    }

    const isRaining = this.envFx.isRaining();
    if (isNight !== this.lastEnvNight || isRaining !== this.lastEnvRain) {
      this.lastEnvNight = isNight;
      this.lastEnvRain = isRaining;
      kidAudio.setEnvironmentConditions(isNight, isRaining);
    }
  }

  private triggerFullCelebration(worldPos?: THREE.Vector3): void {
    const origin =
      worldPos ?? this.playerPos.clone().add(new THREE.Vector3(0, 1.9, 0));
    this.outdoor.triggerCelebration(origin);
    this.creativeModals.triggerScreenConfetti(2000);
    kidAudio.playConfettiBurst();
  }

  private unlockBadge(id: BadgeId): void {
    if (this.unlockedBadges.has(id)) return;
    this.unlockedBadges.add(id);
    this.hud.setBadgeUnlocked(id, true);
    kidAudio.playBadgeUnlocked();
    this.creativeModals.triggerScreenConfetti(2000);
    const def = MUSEUM_BADGES.find((b) => b.id === id);
    if (def) {
      this.hud.showToast(metin("MuseumWorld", "yeni_rozet_kazandin_1_2", def.icon, def.title));
    }
  }

  private updateQuestTargetSparkles(): void {
    const targetId = this.activeQuest?.targetArtifactId;
    for (const stand of this.stands) {
      stand.setQuestTarget(targetId !== undefined && stand.artifact.id === targetId);
    }
  }

  private computeHintDestination(): {pos: THREE.Vector3; toast: string} | null {
    const targetStand =
      this.stands.find((s) => s.artifact.id === this.activeQuest?.targetArtifactId) ??
      this.stands.find((s) => !this.discoveredIds.has(s.artifact.id)) ??
      this.stands[0];
    if (!targetStand) return null;

    if (!this.building.isInsideMuseum(this.playerPos)) {
      return {
        pos: new THREE.Vector3(0, MUSEUM_FLOOR_Y, -1.2),
        toast: metin("MuseumWorld", "isik_huzmesi_muze_girisini_gosteriyor"),
      };
    }

    const targetFloor = targetStand.artifact.floor;
    if (this.currentFloor !== targetFloor) {
      const stairX = this.playerPos.x < 0 ? -5.4 : 5.4;
      return {
        pos: new THREE.Vector3(stairX, MUSEUM_FLOOR_Y + 2.2, -10.0),
        toast: metin("MuseumWorld", "isik_huzmesi_1_kata_giden_merdiveni_gosteriyor", targetFloor),
      };
    }

    return {
      pos: targetStand.position.clone(),
      toast: metin("MuseumWorld", "isik_huzmesi_1_eserinin_yerini_gosteriyor", targetStand.artifact.title),
    };
  }

  private triggerHintBeam(): void {
    kidAudio.playMagicReveal();
    const info = this.computeHintDestination();
    if (!info) return;
    this.hintDestination = info.pos;
    this.envFx.showGuideBeam(this.playerPos, info.pos);
    this.hud.showToast(info.toast);
  }

  private openOrWalkToStation(kind: StationKind): void {
    kidAudio.playSelect();
    this.hud.closeStoryModal();
    this.hud.setDrawerOpen(false);
    const pos =
      kind === 'art'
        ? this.stations.artStationPos
        : this.stations.puzzleStationPos;

    if (
      this.building.isInsideMuseum(this.playerPos) &&
      this.currentFloor === 1 &&
      Math.hypot(this.playerPos.x - pos.x, this.playerPos.z - pos.z) < 3.4
    ) {
      this.openCreativeStationModal(kind);
      return;
    }

    if (!this.building.isInsideMuseum(this.playerPos) || this.currentFloor === 2) {
      this.playerPos.set(0, MUSEUM_FLOOR_Y, -1.2);
      this.playerYaw = 0;
      this.camYaw = 0;
      this.snapCameraImmediate();
    }

    this.walkTarget = new THREE.Vector3(
      pos.x > 0 ? pos.x - 1.6 : pos.x + 1.6,
      MUSEUM_FLOOR_Y,
      pos.z + 1.3
    );
    this.pendingInspectAfterWalk = null;
    this.pendingDirectorChat = false;
    this.pendingStationAfterWalk = kind;
    this.hud.showToast(
      kind === 'art'
        ? metin("MuseumWorld", "eser_olusturma_atolyesi_ne_gidiyorsun")
        : metin("MuseumWorld", "eser_puzzle_masasi_na_gidiyorsun")
    );
  }

  private openCreativeStationModal(kind: StationKind): void {
    if (kind === 'art') {
      this.creativeModals.openArtStudioModal();
    } else {
      this.creativeModals.openPuzzleModal();
    }
  }

  private spawnActivityNpcs(): void {
    const specs: Array<{
      kind: OutdoorActivityKind;
      style: CharacterStyleId;
      variant: number;
      role: CharacterRoleOutfit;
      pos: [number, number];
      yaw: number;
      label: string;
      quote: string;
    }> = [
      {
        kind: 'pingpong',
        style: 'erkek',
        variant: 0,
        role: 'sport',
        pos: [-14.6, 19.5],
        yaw: Math.PI / 2,
        label: metin("MuseumWorld", "sporcu_can_masa_tenisi"),
        quote: metin("MuseumWorld", "gel_masa_tenisi_duellosu_yapalim"),
      },
      {
        kind: 'mangala',
        style: 'erkek',
        variant: 2,
        role: 'culture',
        pos: [14.4, 19.5],
        yaw: -Math.PI / 2,
        label: metin("MuseumWorld", "kultur_ustasi_mangala"),
        quote: metin("MuseumWorld", "anadolu_zeka_oyunu_mangala_oynayalim_mi"),
      },
      {
        kind: 'ringtoss',
        style: 'kadin',
        variant: 1,
        role: 'carnival',
        pos: [-20.2, 7.0],
        yaw: -Math.PI / 2,
        label: metin("MuseumWorld", "panayir_lideri_elif_halka_atma"),
        quote: metin("MuseumWorld", "hedefi_vur_halka_atma_odulunu_kap"),
      },
      {
        kind: 'bestas',
        style: 'kadin',
        variant: 0,
        role: 'anatolian',
        pos: [-15.6, 28.5],
        yaw: Math.PI / 2,
        label: metin("MuseumWorld", "anadolu_oyunlari_ablasi_ayse_bestas"),
        quote: metin("MuseumWorld", "birler_ikiler_bestas_oynamaya_var_misin"),
      },
      {
        kind: 'celikcomak',
        style: 'erkek',
        variant: 1,
        role: 'anatolian',
        pos: [15.6, 28.5],
        yaw: -Math.PI / 2,
        label: metin("MuseumWorld", "celik_comak_ustasi_emre_celik_comak"),
        quote: metin("MuseumWorld", "celigi_havalandir_en_uzaga_kim_vuracak"),
      },
      {
        kind: 'topac',
        style: 'erkek',
        variant: 3,
        role: 'culture',
        pos: [-24.8, 16.8],
        yaw: Math.PI / 2,
        label: metin("MuseumWorld", "topac_ustasi_kerem_topac_cevirme"),
        quote: metin("MuseumWorld", "kaytani_sar_topacini_dondur"),
      },
      {
        kind: 'misket',
        style: 'kadin',
        variant: 2,
        role: 'carnival',
        pos: [23.8, 14.5],
        yaw: -Math.PI / 2,
        label: metin("MuseumWorld", "cincik_sampiyonu_deniz_misket"),
        quote: metin("MuseumWorld", "bas_misketini_firlat_cinciklari_topla"),
      },
    ];

    for (const s of specs) {
      const npcId = `npc-act-${s.kind}`;
      const char = new ExplorerCharacter(s.style, s.variant, s.role);
      const pos = new THREE.Vector3(s.pos[0], 0, s.pos[1]);
      char.position.copy(pos);
      char.rotation.y = s.yaw;
      char.traverse((obj) => {
        obj.userData.worldNpcId = npcId;
        obj.userData.activityNpcKind = s.kind;
      });
      this.add(char);

      const cleanName = s.label.replace(/^[^\s]+\s+/, '').split(' (')[0];
      this.worldNpcProfiles.set(npcId, {
        id: npcId,
        name: cleanName,
        gender: s.style,
        roleTitle: metin("MuseumWorld", "etkinlik_lideri"),
        locationLabel: s.label,
        isActivityLeader: true,
        activityKind: s.kind,
        joinedHideSeek: false,
        joinedTugOfWar: false,
        treatedCount: 0,
      });
      this.worldNpcCharacters.set(npcId, char);

      const bubbleTex = createSpeechBubbleTexture(s.quote);
      const bubbleMat = new THREE.SpriteMaterial({
        map: bubbleTex,
        transparent: true,
        depthWrite: false,
      });
      const bubbleSprite = new THREE.Sprite(bubbleMat);
      bubbleSprite.scale.set(2.35, 0.72, 1);
      bubbleSprite.position.set(0, 2.22, 0);
      char.add(bubbleSprite);

      this.activityNpcs.push({
        id: npcId,
        kind: s.kind,
        char,
        pos,
        label: s.label,
        bubbleSprite,
        bubbleMat,
        bubbleTex,
      });
    }
  }

  private openOrWalkToCafe(): void {
    kidAudio.playSelect();
    if (this.cafe.isNearCafe(this.playerPos, 5.0)) {
      this.socialModals.openCafeModal();
      return;
    }
    if (this.building.isInsideMuseum(this.playerPos)) {
      this.playerPos.set(0, 0, 7.5);
      this.snapCameraImmediate();
    }
    this.clearAutoWalk();
    this.walkTarget = new THREE.Vector3(CAFE_ORIGIN.x - 1.6, 0, CAFE_ORIGIN.z);
    this.pendingCafeAfterWalk = true;
    this.hud.showToast(metin("MuseumWorld", "mirasium_anadolu_kafe_ye_gidiyorsun"));
  }

  private openOrWalkToMasal(mode: 'theater' | 'seat'): void {
    kidAudio.playSelect();
    this.masalBarDismissedInZone = false;
    if (mode === 'seat') {
      const seat = this.masalArea.getPlayerSeat();
      const dist = Math.hypot(
        this.playerPos.x - seat.position.x,
        this.playerPos.z - seat.position.z
      );
      if (this.playerPos.y < 1.2 && dist < 4.6) {
        this.sitOnSemaSeat(seat);
        kidAudio.resumeMasalInZone();
      } else {
        if (this.seatedSemaSeat) this.standUpFromSemaSeat(false);
        if (this.building.isInsideMuseum(this.playerPos)) {
          this.playerPos.set(0, 0, 7.2);
          this.snapCameraImmediate();
        }
        this.clearAutoWalk();
        this.walkTarget = seat.standPos.clone();
        this.pendingSeatAfterWalk = seat.id;
        this.hud.showToast(metin("MuseumWorld", "nine_nin_masal_minderine_gidiyorsun"));
      }
      return;
    }

    const distToMasal = Math.hypot(
      this.playerPos.x - MASAL_ORIGIN.x,
      this.playerPos.z - MASAL_ORIGIN.z
    );
    if (this.playerPos.y < 1.2 && distToMasal < 6.0) {
      kidAudio.playStoryChime();
      kidAudio.resumeMasalInZone();
      this.hud.showToast(
        metin("MuseumWorld", "keloglan_masali_caliyor_alttaki_cubuktan_kontrol_edebilirsin")
      );
      return;
    }

    if (this.seatedSemaSeat) this.standUpFromSemaSeat(false);
    if (this.building.isInsideMuseum(this.playerPos)) {
      this.playerPos.set(0, 0, 7.2);
      this.snapCameraImmediate();
    }
    this.clearAutoWalk();
    this.walkTarget = new THREE.Vector3(
      MASAL_ORIGIN.x + 2.8,
      0,
      MASAL_ORIGIN.z
    );
    this.pendingMasalTheaterAfterWalk = true;
    this.hud.showToast(metin("MuseumWorld", "nine_nin_masal_kosku_golge_perdesi_ne"));
  }

  private toggleKaragozOrWalk(): void {
    const dist = Math.hypot(
      this.playerPos.x - KARAGOZ_ORIGIN.x,
      this.playerPos.z - KARAGOZ_ORIGIN.z
    );
    if (this.playerPos.y < 1.2 && dist < 9.5) {
      const playing = this.karagozArea.togglePlayPause();
      this.unlockBadge('social_butterfly');
      if (playing) {
        kidAudio.playKaragozTefAndNareke();
        this.hud.showToast(metin("MuseumWorld", "karagoz_ve_hacivat_golge_oyunu_oynatiliyor"));
      } else {
        kidAudio.playSelect();
        this.hud.showToast(metin("MuseumWorld", "karagoz_ve_hacivat_golge_oyunu_duraklatildi"));
      }
      this.promptKey = '';
      return;
    }

    if (this.seatedSemaSeat) this.standUpFromSemaSeat(false);
    if (this.building.isInsideMuseum(this.playerPos)) {
      this.playerPos.set(0, 0, 7.2);
      this.snapCameraImmediate();
    }
    this.clearAutoWalk();
    this.walkTarget = new THREE.Vector3(
      KARAGOZ_ORIGIN.x - 1.2,
      0,
      KARAGOZ_ORIGIN.z
    );
    this.pendingKaragozAfterWalk = true;
    this.hud.showToast(metin("MuseumWorld", "karagoz_ve_hacivat_golge_oyunu_sahnesi_ne"));
  }

  private sitOnNearestKaragozSeat(): void {
    const seat =
      this.karagozArea.findNearestSeat(this.playerPos, 15) ??
      this.karagozArea.getSeatById('karagoz-seat-0');
    if (!seat) return;
    const dist = Math.hypot(
      this.playerPos.x - seat.position.x,
      this.playerPos.z - seat.position.z
    );
    if (this.playerPos.y < 1.2 && dist < 4.5) {
      this.sitOnSemaSeat(seat);
    } else {
      if (this.seatedSemaSeat) this.standUpFromSemaSeat(false);
      if (this.building.isInsideMuseum(this.playerPos)) {
        this.playerPos.set(0, 0, 7.2);
        this.snapCameraImmediate();
      }
      this.clearAutoWalk();
      this.walkTarget = seat.standPos.clone();
      this.pendingSeatAfterWalk = seat.id;
      this.hud.showToast(metin("MuseumWorld", "1_na_gidiyorsun", seat.label));
    }
  }

  private getFallbackTugCandidates(): RecruitedTugTeammate[] {
    return this.npcs.map((n) => ({
      id: n.id,
      name: n.name,
      style: n.gender,
      variant: n.variant,
    }));
  }

  private launchTugMatchNow(): void {
    this.socialModals.closeModals();
    this.gameModals.closeAll();
    this.creativeModals.closeAll();
    this.hud.closeStoryModal();

    this.tugArena.startMatch(this.getFallbackTugCandidates());
    const slot = this.tugArena.getPlayerSlotWorldPos();
    this.playerPos.copy(slot);
    this.playerYaw = -Math.PI / 2;
    this.player.position.copy(this.playerPos);
    this.player.rotation.y = this.playerYaw;
    this.player.setMoving(false);
    this.player.setPulling(-1);

    this.camYaw = 0.08;
    this.camPitch = 0.28;
    this.camDistance = 6.2;

    this.socialModals.openTugOverlay(this.tugArena.getHudState());
    kidAudio.playCountdownTick();
    this.hud.showPhaseBanner(
      metin("MuseumWorld", "halat_cekme_basladi"),
      metin("MuseumWorld", "takim_arkadaslarin_yanina_kosuyor_bosluk_veya_cek"),
      'info'
    );
  }

  private openOrWalkToTugOfWar(): void {
    kidAudio.playSelect();
    const d = Math.hypot(
      this.playerPos.x - TUG_ARENA_ORIGIN.x,
      this.playerPos.z - TUG_ARENA_ORIGIN.z
    );
    if (this.playerPos.y < 1.2 && d < 6.8) {
      this.launchTugMatchNow();
      return;
    }
    if (this.building.isInsideMuseum(this.playerPos)) {
      this.playerPos.set(0, 0, 7.5);
      this.snapCameraImmediate();
    }
    this.clearAutoWalk();
    this.walkTarget = new THREE.Vector3(
      TUG_ARENA_ORIGIN.x - 1.45,
      0,
      TUG_ARENA_ORIGIN.z
    );
    this.pendingTugAfterWalk = true;
    this.hud.showToast(metin("MuseumWorld", "halat_cekme_sahasi_na_gidiyorsun"));
  }

  private openOrWalkToNpc(npcId: string): void {
    const profile = this.worldNpcProfiles.get(npcId);
    if (!profile) return;

    if (npcId === 'sema-ensemble') {
      kidAudio.playSelect();
      const stageFront = new THREE.Vector3(
        SEMA_STAGE_ORIGIN.x + 0.8,
        0,
        SEMA_STAGE_ORIGIN.z - 3.6
      );
      const dist = Math.hypot(
        this.playerPos.x - SEMA_STAGE_ORIGIN.x,
        this.playerPos.z - (SEMA_STAGE_ORIGIN.z - 1.5)
      );
      if (this.playerPos.y < 1.2 && dist < 8.5) {
        this.openNpcModalForProfile(profile);
        return;
      }
      if (this.seatedSemaSeat) this.standUpFromSemaSeat(false);
      if (this.building.isInsideMuseum(this.playerPos)) {
        this.playerPos.set(0, 0, 7.2);
        this.snapCameraImmediate();
      }
      this.clearAutoWalk();
      this.walkTarget = stageFront;
      this.pendingNpcAfterWalk = npcId;
      this.hud.showToast(metin("MuseumWorld", "semazenler_ney_musiki_sahnesi_ne_gidiyorsun"));
      return;
    }

    const char = this.worldNpcCharacters.get(npcId);
    if (!char) return;
    kidAudio.playSelect();

    const dist = Math.hypot(
      this.playerPos.x - char.position.x,
      this.playerPos.z - char.position.z
    );
    const sameFloor = Math.abs(this.playerPos.y - char.position.y) < 1.8;
    if (sameFloor && dist < 4.8) {
      this.openNpcModalForProfile(profile);
      return;
    }

    const npcInside = this.building.isInsideMuseum(char.position);
    const npcFloor2 = char.position.y > 2.8;
    if (npcInside !== this.building.isInsideMuseum(this.playerPos)) {
      if (npcInside) {
        this.playerPos.set(
          0,
          npcFloor2 ? MUSEUM_FLOOR_2_Y : MUSEUM_FLOOR_Y,
          npcFloor2 ? -4.5 : -1.5
        );
      } else {
        this.playerPos.set(0, 0, 7.2);
      }
      this.snapCameraImmediate();
    } else if (npcInside && !sameFloor) {
      this.playerPos.set(
        -5.35,
        npcFloor2 ? MUSEUM_FLOOR_2_Y : MUSEUM_FLOOR_Y,
        -4.4
      );
      this.snapCameraImmediate();
    }

    this.clearAutoWalk();
    this.walkTarget = new THREE.Vector3(
      char.position.x + (char.position.x < 0 ? 1.3 : -1.3),
      char.position.y,
      char.position.z + 1.1
    );
    this.pendingNpcAfterWalk = npcId;
    this.hud.showToast(metin("MuseumWorld", "1_yanina_gidiyorsun", profile.name));
  }

  private openNpcModalForProfile(profile: WorldNpcProfile): void {
    const bagFood = Array.from(this.inventory.values()).filter(
      (it) => it.category === 'food' && it.count > 0
    );
    this.socialModals.openNpcModal(profile, bagFood);
  }

  private openOrWalkToActivity(kind: OutdoorActivityKind): void {
    if (kind === 'celikcomak') {
      this.startActivity(kind);
      return;
    }
    if (kind === 'tugofwar') {
      this.openOrWalkToTugOfWar();
      return;
    }
    kidAudio.playSelect();
    const npc = this.activityNpcs.find((n) => n.kind === kind);
    if (!npc) return;

    const dist = Math.hypot(
      this.playerPos.x - npc.pos.x,
      this.playerPos.z - npc.pos.z
    );
    if (this.playerPos.y < 1.2 && dist < 4.5) {
      this.gameModals.openActivityModal(kind);
      return;
    }

    if (this.building.isInsideMuseum(this.playerPos)) {
      this.playerPos.set(0, 0, 7.5);
      this.snapCameraImmediate();
    }

    this.clearAutoWalk();
    this.walkTarget = new THREE.Vector3(
      npc.pos.x + (npc.pos.x < 0 ? 1.5 : -1.5),
      0,
      npc.pos.z + 1.4
    );
    this.pendingActivityAfterWalk = kind;
    this.hud.showToast(metin("MuseumWorld", "1_yanina_gidiyorsun_2", npc.label));
  }

  private startActivity(kind: OutdoorActivityKind): void {
    if (kind !== 'celikcomak') {
      if (this.celikField.active) this.celikField.stop();
      this.gameModals.openActivityModal(kind);
      return;
    }
    this.visitGardenLocation(CELIK_START, Math.PI);
    this.celikField.start();
    this.promptKey = '';
  }

  private openOrWalkToHideSeek(): void {
    kidAudio.playSelect();
    const st = this.hideAndSeek.getStationPos();
    if (this.hideAndSeek.isNearStation(this.playerPos, 3.2)) {
      this.gameModals.openHideSeekModal(
        this.hideAndSeek.getMode(),
        this.hideAndSeek.getKidCount()
      );
      return;
    }

    if (!this.building.isInsideMuseum(this.playerPos) || this.currentFloor === 2) {
      this.playerPos.set(-6.4, MUSEUM_FLOOR_Y, -2.8);
      this.snapCameraImmediate();
    }

    this.clearAutoWalk();
    this.walkTarget = new THREE.Vector3(st.x + 1.4, MUSEUM_FLOOR_Y, st.z + 1.2);
    this.pendingHideSeekAfterWalk = true;
    this.hud.showToast(metin("MuseumWorld", "1_kat_saklambac_ebe_tasi_na_gidiyorsun"));
  }

  private spawnNpcVisitors(): void {
    const femaleNames = [
      metin("MuseumWorld", "ayse"),
      metin("MuseumWorld", "fatma"),
      metin("MuseumWorld", "hande"),
      metin("MuseumWorld", "zehra"),
      metin("MuseumWorld", "merve"),
      metin("MuseumWorld", "sude"),
      metin("MuseumWorld", "irem"),
      metin("MuseumWorld", "yagmur"),
      metin("MuseumWorld", "buse"),
      metin("MuseumWorld", "ceren"),
      metin("MuseumWorld", "selma"),
      metin("MuseumWorld", "ece"),
      metin("MuseumWorld", "nehir"),
      metin("MuseumWorld", "damla"),
      metin("MuseumWorld", "melis"),
      metin("MuseumWorld", "asli"),
      metin("MuseumWorld", "derya"),
      metin("MuseumWorld", "pinar"),
      metin("MuseumWorld", "gulsen"),
      metin("MuseumWorld", "seda"),
    ];
    const maleNames = [
      metin("MuseumWorld", "ahmet"),
      metin("MuseumWorld", "mehmet"),
      metin("MuseumWorld", "mustafa"),
      metin("MuseumWorld", "ali"),
      metin("MuseumWorld", "ibrahim"),
      metin("MuseumWorld", "burak"),
      metin("MuseumWorld", "oguz"),
      metin("MuseumWorld", "eren"),
      metin("MuseumWorld", "tarik"),
      metin("MuseumWorld", "furkan"),
      metin("MuseumWorld", "kaan"),
      metin("MuseumWorld", "berk"),
      metin("MuseumWorld", "enes"),
      metin("MuseumWorld", "yusuf"),
      metin("MuseumWorld", "murat"),
      metin("MuseumWorld", "serkan"),
      metin("MuseumWorld", "umut"),
      metin("MuseumWorld", "hakan"),
      metin("MuseumWorld", "omer"),
      metin("MuseumWorld", "baris"),
    ];

    const routeTemplates: Array<{
      zoneLabel: string;
      pts: Array<[number, number, number]>;
    }> = [
      // Outdoor Courtyard (4)
      {
        zoneLabel: metin("MuseumWorld", "muze_on_avlusu"),
        pts: [
          [-3.8, 0, 6.2],
          [-4.2, 0, 12.2],
          [3.6, 0, 12.4],
          [3.5, 0, 6.5],
        ],
      },
      {
        zoneLabel: metin("MuseumWorld", "bahce_yuruyus_yolu"),
        pts: [
          [2.8, 0, 16.0],
          [-2.8, 0, 16.0],
          [-2.8, 0, 8.2],
          [2.8, 0, 8.4],
        ],
      },
      {
        zoneLabel: metin("MuseumWorld", "bati_fiskiye_meydani"),
        pts: [
          [-7.8, 0, 5.0],
          [-10.2, 0, 8.6],
          [-5.6, 0, 11.0],
          [-4.4, 0, 6.0],
        ],
      },
      {
        zoneLabel: metin("MuseumWorld", "dogu_cesme_meydani"),
        pts: [
          [6.8, 0, 5.4],
          [10.2, 0, 8.6],
          [6.4, 0, 11.2],
          [4.2, 0, 6.2],
        ],
      },
      // Café Terrace & Games Promenade (4)
      {
        zoneLabel: metin("MuseumWorld", "anadolu_kafe_terasi"),
        pts: [
          [20.2, 0, 5.8],
          [22.4, 0, 4.2],
          [22.4, 0, 7.6],
          [19.2, 0, 8.5],
        ],
      },
      {
        zoneLabel: metin("MuseumWorld", "kafe_cinar_parki"),
        pts: [
          [16.8, 0, 5.8],
          [20.5, 0, 8.4],
          [17.5, 0, 12.5],
          [12.5, 0, 9.8],
        ],
      },
      {
        zoneLabel: metin("MuseumWorld", "guney_oyun_alani"),
        pts: [
          [-6.5, 0, 21.5],
          [6.5, 0, 21.5],
          [6.8, 0, 30.0],
          [-6.8, 0, 30.0],
        ],
      },
      {
        zoneLabel: metin("MuseumWorld", "halat_sahasi_kenari"),
        pts: [
          [-5.8, 0, 33.8],
          [5.8, 0, 33.8],
          [3.5, 0, 23.8],
          [-3.5, 0, 23.8],
        ],
      },
      // Indoor Floor 1 (6)
      {
        zoneLabel: metin("MuseumWorld", "1_kat_bati_galerisi"),
        pts: [
          [-8.5, MUSEUM_FLOOR_Y, -4.4],
          [-8.8, MUSEUM_FLOOR_Y, -14.8],
          [-3.8, MUSEUM_FLOOR_Y, -18.8],
          [2.8, MUSEUM_FLOOR_Y, -17.5],
        ],
      },
      {
        zoneLabel: metin("MuseumWorld", "1_kat_dogu_galerisi"),
        pts: [
          [8.4, MUSEUM_FLOOR_Y, -18.0],
          [8.8, MUSEUM_FLOOR_Y, -8.8],
          [3.4, MUSEUM_FLOOR_Y, -4.8],
          [3.2, MUSEUM_FLOOR_Y, -15.2],
        ],
      },
      {
        zoneLabel: metin("MuseumWorld", "1_kat_merkez_atrium"),
        pts: [
          [-3.4, MUSEUM_FLOOR_Y, -8.2],
          [-3.5, MUSEUM_FLOOR_Y, -15.4],
          [3.4, MUSEUM_FLOOR_Y, -15.4],
          [3.4, MUSEUM_FLOOR_Y, -8.2],
        ],
      },
      {
        zoneLabel: metin("MuseumWorld", "1_kat_arka_salon"),
        pts: [
          [-9.5, MUSEUM_FLOOR_Y, -19.8],
          [0.5, MUSEUM_FLOOR_Y, -20.0],
          [9.4, MUSEUM_FLOOR_Y, -19.8],
          [0.0, MUSEUM_FLOOR_Y, -17.4],
        ],
      },
      {
        zoneLabel: metin("MuseumWorld", "1_kat_atolye_kosesi"),
        pts: [
          [-9.2, MUSEUM_FLOOR_Y, -8.0],
          [-3.8, MUSEUM_FLOOR_Y, -6.0],
          [3.8, MUSEUM_FLOOR_Y, -6.0],
          [9.2, MUSEUM_FLOOR_Y, -8.0],
        ],
      },
      {
        zoneLabel: metin("MuseumWorld", "1_kat_giris_salonu"),
        pts: [
          [-4.2, MUSEUM_FLOOR_Y, -3.5],
          [4.2, MUSEUM_FLOOR_Y, -3.5],
          [4.2, MUSEUM_FLOOR_Y, -10.5],
          [-4.2, MUSEUM_FLOOR_Y, -10.5],
        ],
      },
      // Indoor Floor 2 (4 safe routes strictly on the mezzanine floor decks)
      {
        zoneLabel: metin("MuseumWorld", "2_kat_asma_galeri"),
        pts: [
          [-9.2, MUSEUM_FLOOR_2_Y, -3.5],
          [-9.2, MUSEUM_FLOOR_2_Y, -19.0],
          [9.2, MUSEUM_FLOOR_2_Y, -19.0],
          [9.2, MUSEUM_FLOOR_2_Y, -3.5],
        ],
      },
      {
        zoneLabel: metin("MuseumWorld", "2_kat_kuzey_balkonu"),
        pts: [
          [8.6, MUSEUM_FLOOR_2_Y, -18.2],
          [-8.6, MUSEUM_FLOOR_2_Y, -18.2],
          [-8.6, MUSEUM_FLOOR_2_Y, -19.8],
          [8.6, MUSEUM_FLOOR_2_Y, -19.8],
        ],
      },
      {
        zoneLabel: metin("MuseumWorld", "2_kat_on_balkon"),
        pts: [
          [-8.4, MUSEUM_FLOOR_2_Y, -2.6],
          [8.4, MUSEUM_FLOOR_2_Y, -2.6],
          [8.4, MUSEUM_FLOOR_2_Y, -4.1],
          [-8.4, MUSEUM_FLOOR_2_Y, -4.1],
        ],
      },
      {
        zoneLabel: metin("MuseumWorld", "2_kat_dogu_bati_turu"),
        pts: [
          [9.6, MUSEUM_FLOOR_2_Y, -19.2],
          [-9.6, MUSEUM_FLOOR_2_Y, -19.2],
          [-9.6, MUSEUM_FLOOR_2_Y, -3.2],
          [9.6, MUSEUM_FLOOR_2_Y, -3.2],
        ],
      },
    ];

    const quotes = this.buildSpeechQuotes();

    const visitorCount = DEVICE_QUALITY.isMobile ? routeTemplates.length : 40;
    for (let idx = 0; idx < visitorCount; idx++) {
      const gender: WorldNpcGender = idx % 2 === 0 ? 'kadin' : 'erkek';
      const pairIdx = Math.floor(idx / 2);
      const name =
        gender === 'kadin' ? femaleNames[pairIdx] : maleNames[pairIdx];
      const variant = pairIdx % 4;
      const route = routeTemplates[idx % routeTemplates.length];

      // Slight radial stagger so NPCs on the same route don't stack on top of each other
      const phaseShift = Math.floor(idx / routeTemplates.length);
      const jitterScale = route.pts[0][1] > 2 ? 0.35 : 1.0;
      const jitterX = (((idx * 17) % 5) * 0.25 - 0.5) * jitterScale;
      const jitterZ = (((idx * 29) % 5) * 0.25 - 0.5) * jitterScale;
      const waypoints = route.pts.map(
        ([px, py, pz]) => new THREE.Vector3(px + jitterX, py, pz + jitterZ)
      );
      const clapperEligible =
        route.pts[0][1] === 0 &&
        (idx === 1 || idx === 3 || idx === 7 || idx === 19 || idx === 25);
      if (clapperEligible) {
        const ang = (idx * 1.15) % (Math.PI * 2);
        waypoints.splice(
          1,
          0,
          new THREE.Vector3(
            SAZ_GAZEBO_POS.x + Math.cos(ang) * 2.55,
            0,
            SAZ_GAZEBO_POS.z + Math.sin(ang) * 2.55
          )
        );
      }
      const startWp = phaseShift % waypoints.length;

      const npcId = `npc-visitor-${idx}`;
      const char = new ExplorerCharacter(gender, variant, undefined, true);
      char.scale.setScalar(0.92);
      char.position.copy(waypoints[startWp]);
      char.traverse((obj) => {
        obj.userData.worldNpcId = npcId;
      });
      this.add(char);

      const profile: WorldNpcProfile = {
        id: npcId,
        name,
        gender,
        roleTitle: metin("MuseumWorld", "muze_ziyaretcisi"),
        locationLabel: route.zoneLabel,
        joinedHideSeek: false,
        joinedTugOfWar: false,
        treatedCount: 0,
      };
      this.worldNpcProfiles.set(npcId, profile);
      this.worldNpcCharacters.set(npcId, char);

      const initialQuote = `${name}: ${quotes[idx % quotes.length]}`;
      const bubbleTex = createSpeechBubbleTexture(initialQuote);
      const bubbleMat = new THREE.SpriteMaterial({
        map: bubbleTex,
        transparent: true,
        depthWrite: false,
      });
      const bubbleSprite = new THREE.Sprite(bubbleMat);
      bubbleSprite.scale.set(2.35, 0.72, 1);
      bubbleSprite.position.set(0, 2.08, 0);
      const startVisible = idx % 4 === 0;
      bubbleSprite.visible = startVisible;
      char.add(bubbleSprite);

      this.npcs.push({
        id: npcId,
        name,
        gender,
        variant,
        character: char,
        waypoints,
        waypointIndex: (startWp + 1) % waypoints.length,
        waitTimer: (idx * 0.37) % 2.4,
        speed: 1.35 + (idx % 5) * 0.12,
        bubbleSprite,
        bubbleMat,
        bubbleTex,
        speakTimer: startVisible ? 3.2 + (idx % 3) * 1.1 : 0,
        silenceTimer: startVisible ? 0 : 1.4 + (idx % 6) * 1.1,
        clapperEligible,
        isClappingAtSaz: false,
        sazClapCooldown: 1 + (idx % 3),
      });
    }
  }

  private buildSpeechQuotes(): string[] {
    if (this.artifacts.length === 0) {
      return [
        metin("MuseumWorld", "mirasium_cocuk_muzesi_harika_gorunuyor"),
        metin("MuseumWorld", "bahcedeki_elmalari_ve_gizli_hazineleri_gordun_mu"),
        metin("MuseumWorld", "1_kattaki_cizim_ve_puzzle_masalari_cok"),
        metin("MuseumWorld", "2_kata_merdivenlerden_cikip_eserlere_bakacagim"),
        metin("MuseumWorld", "hazine_avi_yildizlarini_toplamaya_hazirim"),
      ];
    }

    const quotes: string[] = [
      metin("MuseumWorld", "giristeki_turk_bayragimiz_muzeye_cok_yakismis"),
      metin("MuseumWorld", "1_kattaki_eser_olusturma_atolyesi_harika"),
      metin("MuseumWorld", "bahcede_topla_oynayip_elma_toplayabiliriz"),
      metin("MuseumWorld", "2_kattaki_galeri_balkonu_da_eserlerle_dolu"),
    ];

    const sampleCount = Math.min(18, this.artifacts.length);
    const step = Math.max(1, Math.floor(this.artifacts.length / sampleCount));
    for (let i = 0; i < this.artifacts.length; i += step) {
      const art = this.artifacts[i];
      const shortTitle =
        art.title.length > 32 ? `${art.title.slice(0, 30)}…` : art.title;
      if (i % 3 === 0) {
        quotes.push(metin("MuseumWorld", "1_eserindeki_detaylara_bayildim", shortTitle));
      } else if (i % 3 === 1) {
        quotes.push(metin("MuseumWorld", "1_kattaki_2_eserini_gordun_mu", art.floor, shortTitle));
      } else {
        quotes.push(metin("MuseumWorld", "1_eserleri_tarihle_bulusturuyor", art.collectionShortName));
      }
    }
    return quotes;
  }

  private setNpcCustomBubble(npc: NpcVisitor, text: string, duration = 3.0): void {
    const nextTex = createSpeechBubbleTexture(text);
    npc.bubbleMat.map = nextTex;
    npc.bubbleMat.needsUpdate = true;
    npc.bubbleTex?.dispose();
    npc.bubbleTex = nextTex;
    npc.bubbleSprite.visible = true;
    npc.speakTimer = duration;
  }

  private assignRandomQuote(npc: NpcVisitor): void {
    const quotes = this.buildSpeechQuotes();
    const quote = `${npc.name}: ${quotes[Math.floor(Math.random() * quotes.length)]}`;
    this.setNpcCustomBubble(npc, quote, 4.2 + Math.random() * 1.8);
  }

  private attachInputListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerCancel);
    window.addEventListener('blur', this.resetInput);
    window.addEventListener('wheel', this.handleWheel, {passive: true});
  }

  private detachInputListeners(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerCancel);
    window.removeEventListener('blur', this.resetInput);
    window.removeEventListener('wheel', this.handleWheel);
  }

  private resetInput = (): void => {
    this.keys.clear();
    this.joystickVec.set(0, 0);
    this.isOrbitDragging = false;
  };

  private handlePointerCancel = (): void => {
    this.isOrbitDragging = false;
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.target instanceof Element && e.target.closest('dialog[open]')) return;
    if (e.code === 'Space' && e.target instanceof Element && e.target.closest('button, a, summary, select')) return;
    const targetTag = (e.target as HTMLElement | null)?.tagName;
    if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') {
      if (e.code === 'Escape') {
        this.creativeModals.closeAll();
        this.gameModals.closeAll();
        this.socialModals.closeModals();
      }
      return;
    }

    const code = e.code;
    if (this.celikField.active && e.repeat && code === 'KeyE') return;
    this.keys.add(code);

    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(
        code
      )
    ) {
      e.preventDefault();
    }

    if (
      [
        'KeyW',
        'KeyA',
        'KeyS',
        'KeyD',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
      ].includes(code)
    ) {
      this.clearAutoWalk();
    }

    if (code === 'Space') {
      if (this.photoStudioActive || this.photoBoothModal?.isOpen()) return;
      if (isInsideMosque(this.playerPos)) return;
      if (this.seatedSemaSeat) {
        this.standUpFromSemaSeat(true);
      } else if (
        !this.creativeModals.isOpen() &&
        !this.gameModals.isOpen() &&
        !this.socialModals.isBlockingModalOpen() &&
        !this.socialModals.isTugOverlayOpen() &&
        !this.tugArena.isMatchRunning()
      ) {
        this.player.jump();
      }
    } else if (code === 'KeyC') {
      if (this.photoStudioActive) return;
      if (this.hideAndSeek.getMode() === 'hiding') {
        const next = !this.player.isCrouching();
        this.player.setCrouching(next);
        this.hud.showToast(
          next ? metin("MuseumWorld", "comelerek_gizlendin") : metin("MuseumWorld", "ayaga_kalktin")
        );
      }
    } else if (code === 'KeyE') {
      if (this.photoStudioActive) return;
      if (this.socialModals.isBlockingModalOpen()) {
        this.socialModals.closeModals();
      } else if (this.gameModals.isOpen()) {
        this.gameModals.closeAll();
      } else if (this.creativeModals.isOpen()) {
        this.creativeModals.closeAll();
      } else if (this.hud.isModalOpen()) {
        this.hud.closeStoryModal();
      } else {
        this.hud.triggerActivePrompt();
      }
    } else if (code === 'Escape') {
      if (this.photoBoothModal?.isOpen()) {
        this.photoBoothModal.exitStudio();
        return;
      }
      if (this.socialModals.isBlockingModalOpen()) this.socialModals.closeModals();
      if (this.gameModals.isOpen()) this.gameModals.closeAll();
      if (this.creativeModals.isOpen()) this.creativeModals.closeAll();
      if (this.hud.isModalOpen()) this.hud.closeStoryModal();
      this.hud.minimizeKaragozLicense();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private isCanvasEvent(target: EventTarget | null): boolean {
    const renderer = xb.core.renderer;
    return Boolean(renderer && target === renderer.domElement);
  }

  private handlePointerDown = (e: PointerEvent): void => {
    if (
      this.photoStudioActive ||
      this.hud.isModalOpen() ||
      !this.isCanvasEvent(e.target)
    ) {
      return;
    }
    this.isOrbitDragging = true;
    this.dragMoved = false;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
  };

  private handlePointerMove = (e: PointerEvent): void => {
    if (this.isOrbitDragging) {
      const dx = e.clientX - this.lastPointerX;
      const dy = e.clientY - this.lastPointerY;
      if (Math.hypot(dx, dy) > 4) {
        this.dragMoved = true;
      }
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      this.camYaw -= dx * 0.0055;
      if (this.firstPerson) {
        this.firstPersonPitch = THREE.MathUtils.clamp(this.firstPersonPitch - dy * 0.005, -1.15, 1.15);
      } else this.camPitch = THREE.MathUtils.clamp(
        this.camPitch + dy * 0.004,
        0.04,
        0.72
      );
      return;
    }

    if (e.pointerType === 'mouse' && this.isCanvasEvent(e.target)) {
      this.updateHoverRaycast(e.clientX, e.clientY);
    } else if (this.hoveredStand || this.hoveredInteractive) {
      this.hoveredStand?.setHovered(false);
      this.hoveredStand = null;
      this.hoveredInteractive = false;
      document.body.style.cursor = 'default';
    }
  };

  private handlePointerUp = (e: PointerEvent): void => {
    if (!this.isOrbitDragging) return;
    this.isOrbitDragging = false;
    if (!this.dragMoved && this.isCanvasEvent(e.target)) {
      this.handleSceneClick(e.clientX, e.clientY);
    }
  };

  private handleWheel = (e: WheelEvent): void => {
    if (this.photoStudioActive || !this.isCanvasEvent(e.target)) return;
    this.camDistance = THREE.MathUtils.clamp(
      this.camDistance + e.deltaY * 0.003,
      2.6,
      9.0
    );
  };

  private collectAllInteractiveTargets(forHover = false): THREE.Object3D[] {
    const inside = this.building.isInsideMuseum(this.playerPos);
    const insideDeep = inside && this.playerPos.z < -2.2;
    const standDistSq = forHover ? 484 : 1024;
    const npcDistSq = forHover ? 484 : 900;

    const targets: THREE.Object3D[] = [
      ...this.hideAndSeek.getInteractiveMeshes(),
      ...this.building.getInteractiveMeshes(),
    ];

    if (inside || this.playerPos.z < 6.5) {
      targets.push(
        ...this.director.getInteractiveMeshes(),
        ...this.stations.getInteractiveMeshes()
      );
      for (const s of this.stands) {
        if (s.visible && s.position.distanceToSquared(this.playerPos) <= standDistSq) {
          targets.push(...s.getInteractiveMeshes());
        }
      }
    }

    if (!insideDeep) {
      targets.push(
        ...this.gardenProps.getInteractiveMeshes(),
        ...this.pets.getInteractiveMeshes(),
        ...this.outdoor.getInteractiveMeshes()
      );
      if (this.cafe.visible) targets.push(...this.cafe.getInteractiveMeshes());
      if (this.tugArena.visible) targets.push(...this.tugArena.getInteractiveMeshes());
      if (this.semaAndMosque.visible) targets.push(...this.semaAndMosque.getInteractiveMeshes());
      if (this.masalArea.visible) targets.push(...this.masalArea.getInteractiveMeshes());
      if (this.karagozArea.visible) targets.push(...this.karagozArea.getInteractiveMeshes());
      if (this.tileWorkshop.visible) targets.push(...this.tileWorkshop.targets);
      if (this.heritageGarden.visible) targets.push(...this.heritageGarden.targets);
      if (this.concertStage.visible) targets.push(...this.concertStage.targets);
      if (this.celikField.visible) targets.push(...this.celikField.targets);
      if (this.photoBooth.visible) targets.push(...this.photoBooth.targets);
      if (this.sazPavilionGroup.visible) {
        targets.push(this.sazPavilionGroup, this.sazNpcChar);
      }
      for (const v of this.vendorNpcs) {
        if (v.char.visible && v.char.position.distanceToSquared(this.playerPos) <= npcDistSq) {
          targets.push(v.char);
        }
      }
      for (const a of this.activityNpcs) {
        if (a.char.visible && a.char.position.distanceToSquared(this.playerPos) <= npcDistSq) {
          targets.push(a.char);
        }
      }
    }

    for (const n of this.npcs) {
      if (n.character.visible && n.character.position.distanceToSquared(this.playerPos) <= npcDistSq) {
        targets.push(n.character);
      }
    }

    return targets;
  }

  private isObjectVisible(obj: THREE.Object3D): boolean {
    let curr: THREE.Object3D | null = obj;
    while (curr) {
      if (!curr.visible) return false;
      curr = curr.parent;
    }
    return true;
  }

  private updateHoverRaycast(clientX: number, clientY: number): void {
    if (
      this.hud.isModalOpen() ||
      this.creativeModals.isOpen() ||
      this.gameModals.isOpen() ||
      this.socialModals.isBlockingModalOpen() ||
      this.socialModals.isTugOverlayOpen()
    ) {
      if (this.hoveredStand || this.hoveredInteractive) {
        this.hoveredStand?.setHovered(false);
        this.hoveredStand = null;
        this.hoveredInteractive = false;
        document.body.style.cursor = 'default';
      }
      return;
    }
    const camera = xb.core.camera;
    const now = performance.now();
    if (!camera || now - this.lastHoverRayAt < 50) return;
    this.lastHoverRayAt = now;

    this.pointerNdc.x = (clientX / window.innerWidth) * 2 - 1;
    this.pointerNdc.y = -(clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.pointerNdc, camera);

    const hits = this.raycaster.intersectObjects(
      this.collectAllInteractiveTargets(true),
      true
    );
    const visibleHit = hits.find((h) => this.isObjectVisible(h.object));
    let foundStand: ArtifactStand | null = null;
    let foundOther = false;
    if (visibleHit) {
      const hitData = visibleHit.object.userData;
      if (hitData.artifactId !== undefined) {
        const artId = hitData.artifactId as number;
        foundStand = this.stands.find((s) => s.artifact.id === artId) ?? null;
      } else if (
        hitData.isDirector || hitData.tileWorkshop || hitData.siyerLesson ||
        hitData.heritageAction || hitData.concert || typeof hitData.marketVendor === 'number' ||
        hitData.propType ||
        hitData.stationType ||
        hitData.easterEggId ||
        hitData.activityType ||
        hitData.worldNpcId ||
        hitData.petId ||
        hitData.semaSeatId ||
        hitData.masalAction ||
        hitData.karagozAction ||
        hitData.cafeInteractive ||
        hitData.photoBooth ||
        hitData.hideSeekStation ||
        hitData.hideSeekKidId !== undefined
      ) {
        foundOther = true;
      }
    }

    if (this.hoveredStand !== foundStand || this.hoveredInteractive !== foundOther) {
      this.hoveredStand?.setHovered(false);
      this.hoveredStand = foundStand;
      this.hoveredStand?.setHovered(true);
      this.hoveredInteractive = foundOther;
      document.body.style.cursor =
        foundStand || foundOther ? 'pointer' : 'default';
    }
  }

  private handleEasterEggClick(
    eggId: string,
    hitObj: THREE.Object3D
  ): boolean {
    if (eggId.startsWith('tree-')) {
      const treeIdx = Number(hitObj.userData.treeIndex ?? eggId.slice(5));
      this.outdoor.shakeTree(treeIdx);
      this.gardenProps.spawnTreeBird(treeIdx);
      const coord = PARK_TREE_COORDS[treeIdx];
      if (coord) {
        this.gardenProps.scatterLeavesAt(
          new THREE.Vector3(coord[0], 0, coord[1]),
          3.5,
          4.8
        );
      }
      kidAudio.playEasterEgg();
      this.unlockBadge('secret_hunter');
      this.hud.showToast(
        metin("MuseumWorld", "agaci_salladin_yapraklar_ucustu_ve_dallardan_minik")
      );
      return true;
    }

    if (eggId.startsWith('bench-')) {
      const bIdx = Number(hitObj.userData.benchIndex ?? eggId.slice(6));
      this.outdoor.bounceBench(bIdx);
      kidAudio.playEasterEgg();
      this.unlockBadge('secret_hunter');
      this.hud.showToast(metin("MuseumWorld", "park_banki_neseyle_zipladi_kisa_bir_dinlenme"));
      return true;
    }

    if (eggId.startsWith('portico-col-')) {
      kidAudio.playEasterEgg();
      this.unlockBadge('secret_hunter');
      this.hud.showToast(
        metin("MuseumWorld", "mimari_sir_bu_korint_tarzi_sutunlar_antik")
      );
      return true;
    }

    if (eggId === 'atrium-globe') {
      this.building.triggerGlobeSpin();
      kidAudio.playMagicReveal();
      this.unlockBadge('secret_hunter');
      this.hud.showToast(
        metin("MuseumWorld", "dunya_kuresi_hizla_dondu_mirasium_tum_dunyadan")
      );
      return true;
    }

    if (eggId === 'turkish-flag') {
      kidAudio.playEasterEgg();
      this.unlockBadge('secret_hunter');
      this.hud.showToast(
        metin("MuseumWorld", "sanli_turk_bayragimiz_mirasium_muzesi_nin_girisinde")
      );
      return true;
    }

    if (eggId === 'anatolian-mosque') {
      kidAudio.playEasterEgg();
      this.unlockBadge('secret_hunter');
      this.hud.showToast(
        metin("MuseumWorld", "cift_minareli_tarihi_camimiz_ve_isikli_mahyasi")
      );
      return true;
    }

    return false;
  }

  private handlePetInteract(petId: string): void {
    const info = this.pets.petAnimal(petId, this.playerPos);
    if (!info) return;
    if (info.species === 'cat') {
      kidAudio.playCatPurr();
    } else {
      kidAudio.playDogBark();
    }
    this.player.setWaveTimer(1.4);
    this.unlockBadge('garden_explorer');
    this.hud.showToast(
      info.species === 'cat'
        ? metin("MuseumWorld", "1_2_mutlulukla_mirladi_ve_patisini_uzatti", info.name, info.breed)
        : metin("MuseumWorld", "1_2_neseyle_havlayip_kuyruk_salladi", info.name, info.breed)
    );
  }

  private openPetAdoptFlow(petId: string): void {
    const nearPet = this.pets.findNearestPet(this.playerPos, 3.6);
    if (!nearPet || nearPet.id !== petId) return;

    const currentAdopted = this.pets.getAdoptedPet();
    if (currentAdopted && currentAdopted.id !== nearPet.id) {
      kidAudio.playSelect();
      this.hud.showToast(
        metin("MuseumWorld", "sadece_1_evcil_hayvan_sahiplenebilirsin_su_anki", currentAdopted.name)
      );
      return;
    }

    kidAudio.playSelect();
    this.socialModals.openPetAdoptModal(
      nearPet,
      currentAdopted?.id === nearPet.id
    );
  }

  private handleAdoptPet(petId: string, customName: string): void {
    const existing = this.pets.getAdoptedPet();
    const isRename = existing?.id === petId;
    const adopted = this.pets.adoptPet(petId, customName, this.playerPos);
    if (!adopted) {
      this.hud.showToast(
        metin("MuseumWorld", "zaten_bir_evcil_dostun_var_1_en", existing?.name ?? '')
      );
      return;
    }

    if (adopted.species === 'cat') {
      kidAudio.playCatPurr();
    } else {
      kidAudio.playDogBark();
    }
    this.player.setWaveTimer(1.6);
    this.triggerFullCelebration(
      adopted.position.clone().add(new THREE.Vector3(0, 0.9, 0))
    );
    this.unlockBadge('garden_explorer');
    this.promptKey = '';

    this.hud.showToast(
      isRename
        ? metin("MuseumWorld", "evcil_dostunun_yeni_ismi_1_olarak_kaydedildi", adopted.name)
        : metin("MuseumWorld", "tebrikler_1_2_artik_senin_evcil_dostun", adopted.species === 'cat' ? '🐱' : '🐶', adopted.name)
    );
  }

  private showPetProximityPrompt(nearPet: NonNullable<ReturnType<OutdoorPets['findNearestPet']>>): void {
    const adoptedPet = this.pets.getAdoptedPet();
    const isThisAdopted = adoptedPet?.id === nearPet.id;
    const key = `pet-${nearPet.id}-${adoptedPet?.id ?? 'none'}-${nearPet.name}`;
    if (this.promptKey !== key) {
      this.promptKey = key;
      const secondaryLabel = isThisAdopted
        ? metin("MuseumWorld", "isim_degistir")
        : adoptedPet
          ? metin("MuseumWorld", "sahiplen_1_hak_dolu")
          : metin("MuseumWorld", "sahiplen_isim_ver");
      this.hud.setProximityPrompt({
        title: `${isThisAdopted ? '⭐' : nearPet.species === 'cat' ? '🐱' : '🐶'} ${nearPet.name} (${nearPet.breed})`,
        actionLabel: `${nearPet.species === 'cat' ? metin("MuseumWorld", "kediyi_sev_e") : metin("MuseumWorld", "kopegi_sev_e")}`,
        onTrigger: () => this.handlePetInteract(nearPet.id),
        secondaryLabel,
        onSecondaryTrigger: () => this.openPetAdoptFlow(nearPet.id),
      });
    }
  }

  private sitOnSemaSeat(seat: SemaSeatInfo): void {
    this.clearAutoWalk();
    this.seatedSemaSeat = seat;
    this.playerPos.copy(seat.position);
    this.playerYaw = seat.yaw;
    this.player.position.copy(this.playerPos);
    this.player.rotation.y = this.playerYaw;
    this.player.setMoving(false);
    this.player.setSitting(true);
    kidAudio.playSelect();
    this.unlockBadge('social_butterfly');
    if (seat.id.startsWith('masal-')) {
      kidAudio.playStoryChime();
      this.hud.showToast(
        metin("MuseumWorld", "nine_nin_masal_minderine_oturdun_ocak_basinda")
      );
    } else if (seat.id.startsWith('karagoz-')) {
      this.camYaw = seat.yaw;
      this.karagozArea.unlockVideoAudio();
      kidAudio.playKaragozTefAndNareke();
      this.hud.showToast(
        metin("MuseumWorld", "1_na_oturdun_cocuklarla_birlikte_karagoz_ve", seat.label)
      );
    } else {
      this.hud.showToast(
        metin("MuseumWorld", "1_na_oturdun_semazenleri_ve_ney_dinletisini", seat.label)
      );
    }
  }

  private standUpFromSemaSeat(showToast = false): void {
    if (!this.seatedSemaSeat) return;
    this.playerPos.copy(this.seatedSemaSeat.standPos);
    this.player.setSitting(false);
    this.player.position.copy(this.playerPos);
    this.seatedSemaSeat = null;
    this.promptKey = '';
    if (showToast) {
      kidAudio.playSelect();
      this.hud.showToast(metin("MuseumWorld", "koltuktan_kalktin"));
    }
  }

  private handleSceneClick(clientX: number, clientY: number): void {
    const camera = xb.core.camera;
    if (!camera) return;

    this.pointerNdc.x = (clientX / window.innerWidth) * 2 - 1;
    this.pointerNdc.y = -(clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.pointerNdc, camera);

    const hits = this.raycaster.intersectObjects(
      this.collectAllInteractiveTargets(),
      true
    );
    const visibleHit = hits.find((h) => this.isObjectVisible(h.object));
    if (visibleHit) {
      const hitObj = visibleHit.object;
      const hitData = hitObj.userData;

      if (hitData.concert) {
        if (this.playerPos.distanceToSquared(CONCERT_ORIGIN) < 112) this.hud.openConcert();
        return;
      }

      if (hitData.photoBooth) {
        this.openOrWalkToPhotoBooth();
        return;
      }

      if (typeof hitData.marketVendor === 'number') {
        const stall = MARKET_STALLS[hitData.marketVendor];
        if (stall && Math.hypot(this.playerPos.x - stall.x, this.playerPos.z - stall.z) < 4) {
          this.buyMarketSnack(hitData.marketVendor);
        }
        return;
      }
      if (hitData.heritageAction === 'hodja') {
        if (this.playerPos.distanceTo(HODJA_ORIGIN) < 4.5) this.tellHodjaStory();
        return;
      }
      if (hitData.heritageAction === 'dig-journal') {
        if (this.playerPos.distanceToSquared(DIG_SITE_ORIGIN) < 32) this.openDigJournal();
        return;
      }
      if (['comet', 'observe', 'biography'].includes(hitData.heritageAction) && inObservatory(this.playerPos)) {
        this.hud.openObservatory(hitData.heritageAction);
        return;
      }

      if (hitData.tileWorkshop) {
        if (this.playerPos.distanceTo(TILE_WORKSHOP_ORIGIN) > 4.5) {
          this.visitGardenLocation(TILE_WORKSHOP_ORIGIN.clone().add(new THREE.Vector3(0, 0, 2.6)), 0);
        }
        this.hud.openTileWorkshop();
        return;
      }
      if (hitData.siyerLesson && isInsideMosque(this.playerPos)) {
        this.hud.openSiyerLesson();
        return;
      }

      // 1. Director
      if (hitData.isDirector) {
        kidAudio.playSelect();
        const dist = this.playerPos.distanceTo(this.director.position);
        if (
          dist < 4.5 &&
          Math.abs(this.playerPos.y - this.director.position.y) < 1.8
        ) {
          this.hud.openDirectorModal();
        } else {
          if (!this.building.isInsideMuseum(this.playerPos)) {
            this.playerPos.set(0, MUSEUM_FLOOR_Y, -0.8);
            this.playerYaw = 0;
            this.camYaw = 0;
            this.snapCameraImmediate();
          } else if (this.currentFloor === 2) {
            this.playerPos.set(0, MUSEUM_FLOOR_Y, -1.2);
            this.snapCameraImmediate();
          }
          this.clearAutoWalk();
          this.walkTarget = new THREE.Vector3(0.95, MUSEUM_FLOOR_Y, -2.05);
          this.pendingDirectorChat = true;
          this.hud.showToast(metin("MuseumWorld", "muze_muduru_nun_yanina_gidiyorsun"));
        }
        return;
      }

      // 2. Creative Stations
      if (hitData.stationType === 'art' || hitData.stationType === 'puzzle') {
        this.openOrWalkToStation(hitData.stationType as StationKind);
        return;
      }

      // 2b. Hide-and-Seek Station & Kids
      if (typeof hitData.hideSeekKidId === 'number') {
        if (this.hideAndSeek.getMode() === 'seeking') {
          this.hideAndSeek.tryTagKidById(hitData.hideSeekKidId, this.playerPos);
        } else {
          this.openOrWalkToHideSeek();
        }
        return;
      }

      if (hitData.hideSeekStation) {
        if (
          this.hideAndSeek.getMode() === 'hiding' &&
          this.hideAndSeek.getHidePhase() === 'searching' &&
          this.hideAndSeek.isNearStation(this.playerPos, 2.8)
        ) {
          this.hideAndSeek.tryPlayerSobeAtStation(this.playerPos);
        } else {
          this.openOrWalkToHideSeek();
        }
        return;
      }

      // 2c. Cute Pettable Cats & Dogs
      if (typeof hitData.petId === 'string') {
        const dist = Math.hypot(
          this.playerPos.x - visibleHit.point.x,
          this.playerPos.z - visibleHit.point.z
        );
        if (this.playerPos.y < 1.2 && dist < 3.6) {
          this.handlePetInteract(hitData.petId);
        } else {
          if (this.seatedSemaSeat) this.standUpFromSemaSeat(false);
          if (this.building.isInsideMuseum(this.playerPos)) {
            this.playerPos.set(0, 0, 7.2);
            this.snapCameraImmediate();
          }
          this.clearAutoWalk();
          this.walkTarget = new THREE.Vector3(
            visibleHit.point.x,
            0,
            visibleHit.point.z
          );
          this.pendingPetAfterWalk = hitData.petId;
          this.hud.showToast(metin("MuseumWorld", "sevimli_dostumuzun_yanina_gidiyorsun"));
        }
        return;
      }

      // 2c1. Nine'nin Masal Köşkü & Gölge Perdesi (Seat & Shadow Theater)
      if (hitData.masalAction === 'seat') {
        this.openOrWalkToMasal('seat');
        return;
      }
      if (hitData.masalAction === 'theater') {
        this.openOrWalkToMasal('theater');
        return;
      }

      // 2c1b. Karagöz & Hacivat Gölge Oyunu Sahnesi (Screen, Tef/Nareke, Hayali, Audience & Attribution Plaque)
      if (hitData.karagozAction === 'license-info') {
        kidAudio.playSelect();
        this.hud.openLicenseModal();
        return;
      }
      if (hitData.karagozAction === 'toggle-play') {
        this.toggleKaragozOrWalk();
        return;
      }

      // 2c2. Sema / Masal / Karagöz Stage Open Spectator Seats
      if (typeof hitData.semaSeatId === 'string') {
        const seat =
          this.semaAndMosque.getSeatById(hitData.semaSeatId) ??
          this.masalArea.getSeatById(hitData.semaSeatId) ??
          this.karagozArea.getSeatById(hitData.semaSeatId);
        if (seat) {
          const dist = Math.hypot(
            this.playerPos.x - seat.position.x,
            this.playerPos.z - seat.position.z
          );
          if (this.playerPos.y < 1.2 && dist < 4.0) {
            this.sitOnSemaSeat(seat);
          } else {
            if (this.seatedSemaSeat) this.standUpFromSemaSeat(false);
            if (this.building.isInsideMuseum(this.playerPos)) {
              this.playerPos.set(0, 0, 7.2);
              this.snapCameraImmediate();
            }
            this.clearAutoWalk();
            this.walkTarget = seat.standPos.clone();
            this.pendingSeatAfterWalk = seat.id;
            this.hud.showToast(metin("MuseumWorld", "1_na_gidiyorsun_2", seat.label));
          }
        }
        return;
      }

      // 2d. Universal NPC Interaction (40 crowd NPCs, Café Master, Activity NPCs, Sema Stage)
      if (typeof hitData.worldNpcId === 'string') {
        this.openOrWalkToNpc(hitData.worldNpcId);
        return;
      }

      // 2d. Anatolian Café Building & Tables
      if (hitData.cafeInteractive) {
        this.openOrWalkToCafe();
        return;
      }

      // 2e. Outdoor Activity Props & Courts (including 3D Tug-of-War!)
      if (
        typeof hitData.activityType === 'string' &&
        [
          'pingpong',
          'mangala',
          'ringtoss',
          'bestas',
          'celikcomak',
          'topac',
          'misket',
          'tugofwar',
        ].includes(hitData.activityType)
      ) {
        this.openOrWalkToActivity(hitData.activityType as OutdoorActivityKind);
        return;
      }

      // 3. Interactive Garden Props & Hidden Secrets
      if (hitData.propType === 'apple' && typeof hitData.appleId === 'string') {
        const res = this.gardenProps.pickAppleById(hitData.appleId);
        if (res) {
          this.appleCount++;
          this.hud.setAppleCount(this.appleCount);
          this.addInventoryItem(
            'apple',
            metin("MuseumWorld", "taze_muze_bahcesi_elmasi"),
            '🍎',
            'nature',
            metin("MuseumWorld", "bahcedeki_meyve_agaclarindan_toplandi_yediginde_14_saniye"),
            1,
            metin("MuseumWorld", "ye_hiz_2")
          );
          kidAudio.playApplePick();
          this.unlockBadge('garden_explorer');
          this.hud.showToast(
            metin("MuseumWorld", "elma_topladin_ve_cantana_eklendi_sepet_1", this.appleCount)
          );
        }
        return;
      }

      if (hitData.propType === 'fiskiye' || hitData.propType === 'cesme') {
        const isFiskiye = hitData.propType === 'fiskiye';
        const center = isFiskiye
          ? new THREE.Vector3(-7.5, 0, 8.2)
          : new THREE.Vector3(7.5, 0, 8.2);
        this.gardenProps.triggerFountainSplash(center, isFiskiye);
        kidAudio.playWaterSplash();
        this.unlockBadge('garden_explorer');
        this.hud.showToast(
          isFiskiye
            ? metin("MuseumWorld", "mermer_fiskiyenin_serin_sulariyla_eglendin")
            : metin("MuseumWorld", "osmanli_mahalle_cesmesi_nden_buz_gibi_su")
        );
        return;
      }

      if (
        hitData.propType === 'dig-mound' &&
        typeof hitData.digIndex === 'number'
      ) {
        this.openDigSquare(hitData.digIndex);
        return;
      }

      if (hitData.propType === 'maze-crown') {
        this.claimMazeCrownPrize();
        return;
      }

      if (hitData.propType === 'ball') {
        if (this.gardenProps.kickBallFrom(this.playerPos, 6.8)) {
          kidAudio.playBallBounce();
          this.unlockBadge('garden_explorer');
          this.hud.showToast(metin("MuseumWorld", "topa_harika_vurdun_arkadaslarin_pas_bekliyor"));
        }
        return;
      }

      if (
        hitData.propType === 'balloon' &&
        typeof hitData.balloonIndex === 'number'
      ) {
        this.gardenProps.bounceBalloon(hitData.balloonIndex);
        kidAudio.playSelect();
        this.unlockBadge('garden_explorer');
        this.hud.showToast(metin("MuseumWorld", "balonu_havaya_ziplattin"));
        return;
      }

      if (hitData.propType === 'secret' && typeof hitData.secretId === 'string') {
        const secret = this.gardenProps.claimSecret(hitData.secretId);
        if (secret) {
          kidAudio.playMagicReveal();
          this.triggerFullCelebration(
            secret.position.clone().add(new THREE.Vector3(0, 1.0, 0))
          );
          this.unlockBadge('secret_hunter');
          this.addInventoryItem(
            secret.id,
            secret.title,
            secret.icon,
            'treasure',
            secret.fact
          );
          this.hud.showToast(`${secret.icon} ${secret.title}: ${secret.fact}`);
        }
        return;
      }

      // 4. Easter Eggs
      if (typeof hitData.easterEggId === 'string') {
        if (this.handleEasterEggClick(hitData.easterEggId, hitObj)) {
          return;
        }
      }

      // 5. Artifacts
      const artId = hitData.artifactId as number | undefined;
      const stand = this.stands.find((s) => s.artifact.id === artId);
      if (stand) {
        const dist = this.playerPos.distanceTo(stand.position);
        if (dist < 4.5 && Math.abs(this.playerPos.y - stand.position.y) < 1.5) {
          this.openArtifactStory(stand.artifact);
        } else {
          this.walkPlayerToArtifact(stand.artifact);
        }
        return;
      }
    }

    const walkableObjects: THREE.Object3D[] = [];
    this.outdoor.traverse((obj) => {
      if (obj.name === 'walkable-ground') walkableObjects.push(obj);
    });
    this.building.traverse((obj) => {
      if (obj.name === 'walkable-ground') walkableObjects.push(obj);
    });
    this.cafe.traverse((obj) => {
      if (obj.name === 'walkable-ground') walkableObjects.push(obj);
    });
    this.tugArena.traverse((obj) => {
      if (obj.name === 'walkable-ground') walkableObjects.push(obj);
    });
    this.semaAndMosque.traverse((obj) => {
      if (obj.name === 'walkable-ground') walkableObjects.push(obj);
    });
    this.masalArea.traverse((obj) => {
      if (obj.name === 'walkable-ground') walkableObjects.push(obj);
    });
    this.karagozArea.traverse((obj) => {
      if (obj.name === 'walkable-ground') walkableObjects.push(obj);
    });

    const groundHits = this.raycaster.intersectObjects(walkableObjects, false);
    if (groundHits.length > 0) {
      if (this.seatedSemaSeat) this.standUpFromSemaSeat(false);
      const pt = groundHits[0].point.clone();
      pt.x = THREE.MathUtils.clamp(pt.x, -45, 43);
      pt.z = THREE.MathUtils.clamp(pt.z, -23, 44);
      // Scatter any nearby park leaves on click outdoors
      if (!this.building.isInsideMuseum(pt)) {
        const moved = this.gardenProps.scatterLeavesAt(pt, 1.8, 3.2);
        if (moved > 0) this.unlockBadge('garden_explorer');
      }
      this.clearAutoWalk();
      this.walkTarget = pt;
    }
  }

  private toggleInsideOutside(): void {
    kidAudio.playSelect();
    this.clearAutoWalk();
    if (this.building.isInsideMuseum(this.playerPos)) {
      if (this.currentFloor === 2) {
        this.playerPos.set(0, MUSEUM_FLOOR_Y, -1.6);
        this.snapCameraImmediate();
      }
      this.walkTarget = new THREE.Vector3(0, 0, 7.2);
      this.hud.showToast(metin("MuseumWorld", "bahceye_dogru_yuruyorsun"));
    } else {
      if (this.playerPos.z > 6.5) {
        this.playerPos.set(0, 0, 5.2);
        this.playerYaw = 0;
        this.camYaw = 0;
        this.snapCameraImmediate();
      }
      this.walkTarget = new THREE.Vector3(0, MUSEUM_FLOOR_Y, -5.0);
      this.hud.showToast(metin("MuseumWorld", "mirasium_muzesi_ne_giriyorsun"));
    }
  }

  private toggleFloor(): void {
    kidAudio.playSelect();
    this.clearAutoWalk();

    if (!this.building.isInsideMuseum(this.playerPos)) {
      this.playerPos.set(-5.35, MUSEUM_FLOOR_2_Y, -4.4);
      this.playerYaw = Math.PI;
      this.camYaw = Math.PI;
      this.snapCameraImmediate();
      this.hud.showToast(metin("MuseumWorld", "2_kat_galeriye_isinlandin"));
      return;
    }

    if (this.currentFloor === 1) {
      this.playerPos.set(-5.35, MUSEUM_FLOOR_2_Y, -4.4);
      this.playerYaw = 0;
      this.camYaw = 0;
      this.snapCameraImmediate();
      this.hud.showToast(metin("MuseumWorld", "2_kat_galeriye_ciktin"));
    } else {
      this.playerPos.set(0, MUSEUM_FLOOR_Y, -14.2);
      this.playerYaw = 0;
      this.camYaw = 0;
      this.snapCameraImmediate();
      this.hud.showToast(metin("MuseumWorld", "1_kat_zemin_galeriye_indin"));
    }
  }

  private walkPlayerToArtifact(artifact: ArtifactItem): void {
    const stand = this.stands.find((s) => s.artifact.id === artifact.id);
    if (!stand) return;

    kidAudio.playSelect();
    const spot = stand.getViewSpot();
    const targetFloor = artifact.floor;

    if (!this.building.isInsideMuseum(this.playerPos)) {
      if (targetFloor === 2) {
        this.playerPos.set(0, MUSEUM_FLOOR_2_Y, -3.5);
      } else {
        this.playerPos.set(0, MUSEUM_FLOOR_Y, -1.2);
      }
      this.playerYaw = 0;
      this.camYaw = 0;
      this.snapCameraImmediate();
    } else if (this.currentFloor !== targetFloor) {
      if (targetFloor === 2) {
        this.playerPos.set(spot.x < 0 ? -5.35 : 5.35, MUSEUM_FLOOR_2_Y, -4.6);
      } else {
        this.playerPos.set(0, MUSEUM_FLOOR_Y, -14.2);
      }
      this.snapCameraImmediate();
    }

    this.clearAutoWalk();
    this.walkTarget = spot;
    this.pendingInspectAfterWalk = artifact;
    this.hud.showToast(
      `#${artifact.index} (${targetFloor}. Kat) "${artifact.title}" yanına gidiliyor…`
    );
  }

  async loadNewExhibition(): Promise<void> {
    if (this.isLoading) return;
    this.isLoading = true;
    this.hud.setLoading(true);
    this.hud.closeStoryModal();
    this.creativeModals.closeAll();

    try {
      const {artifacts, collections} = await fetchRandomArtifacts(
        MIN_ARTIFACTS_PER_ENTRY
      );
      this.artifacts = artifacts;
      this.discoveredIds.clear();
      this.currentArtifactIndex = 0;

      this.rebuildExhibitionStands();
      this.creativeModals.setArtifacts(artifacts);
      this.socialModals.setArtifacts(artifacts);
      this.npcs.forEach((npc) => {
        if (npc.bubbleSprite.visible) {
          this.assignRandomQuote(npc);
        }
      });
      this.hud.setData(artifacts, collections, this.discoveredIds);
      this.assignNextQuest();
      this.hud.showToast(
        metin("MuseumWorld", "1_canli_eser_2_katli_mirasium_muzesi", artifacts.length)
      );
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : metin("MuseumWorld", "baglanti_hatasi");
      this.hud.showToast(metin("MuseumWorld", "eserler_yuklenemedi_1_tekrar_deneyin", msg));
    } finally {
      this.isLoading = false;
      this.hud.setLoading(false);
    }
  }

  private clearStands(): void {
    for (const s of this.stands) {
      s.removeFromParent();
      s.dispose();
    }
    this.stands = [];
    this.hoveredStand = null;
  }

  private rebuildExhibitionStands(): void {
    this.clearStands();
    const total = this.artifacts.length;
    if (total === 0) return;

    const f1Left = 7;
    const f1Back = 8;
    const f1Right = 7;
    const f1Rotunda = 4;
    const f1Total = f1Left + f1Back + f1Right + f1Rotunda; // 26

    const f2Count = Math.max(0, total - f1Total);
    const f2Left = Math.min(6, f2Count);
    const f2Back = Math.min(8, Math.max(0, f2Count - f2Left));
    const f2Right = Math.min(6, Math.max(0, f2Count - f2Left - f2Back));
    const f2Front = Math.max(0, f2Count - f2Left - f2Back - f2Right);

    this.artifacts.forEach((artifact, idx) => {
      let x = 0;
      let y = MUSEUM_FLOOR_Y;
      let z = -12;
      let rotY = 0;
      let floor: 1 | 2 = 1;

      if (idx < f1Left) {
        const t = f1Left > 1 ? idx / (f1Left - 1) : 0.5;
        x = -11.6;
        z = THREE.MathUtils.lerp(-2.8, -20.8, t);
        rotY = Math.PI / 2;
      } else if (idx < f1Left + f1Back) {
        const localIdx = idx - f1Left;
        const t = f1Back > 1 ? localIdx / (f1Back - 1) : 0.5;
        x = THREE.MathUtils.lerp(-9.4, 9.4, t);
        z = -22.2;
        rotY = 0;
      } else if (idx < f1Left + f1Back + f1Right) {
        const localIdx = idx - f1Left - f1Back;
        const t = f1Right > 1 ? localIdx / (f1Right - 1) : 0.5;
        x = 11.6;
        z = THREE.MathUtils.lerp(-20.8, -2.8, t);
        rotY = -Math.PI / 2;
      } else if (idx < f1Total) {
        const localIdx = idx - (f1Left + f1Back + f1Right);
        const angle = ((localIdx + 0.5) / f1Rotunda) * Math.PI * 2;
        const ringRadius = 2.55;
        x = Math.sin(angle) * ringRadius;
        z = -11.8 + Math.cos(angle) * ringRadius;
        rotY = angle;
      } else {
        floor = 2;
        y = MUSEUM_FLOOR_2_Y;
        const f2Idx = idx - f1Total;

        if (f2Idx < f2Left) {
          const t = f2Left > 1 ? f2Idx / (f2Left - 1) : 0.5;
          x = -11.6;
          z = THREE.MathUtils.lerp(-3.4, -20.2, t);
          rotY = Math.PI / 2;
        } else if (f2Idx < f2Left + f2Back) {
          const localIdx = f2Idx - f2Left;
          const t = f2Back > 1 ? localIdx / (f2Back - 1) : 0.5;
          x = THREE.MathUtils.lerp(-9.4, 9.4, t);
          z = -22.2;
          rotY = 0;
        } else if (f2Idx < f2Left + f2Back + f2Right) {
          const localIdx = f2Idx - f2Left - f2Back;
          const t = f2Right > 1 ? localIdx / (f2Right - 1) : 0.5;
          x = 11.6;
          z = THREE.MathUtils.lerp(-20.2, -3.4, t);
          rotY = -Math.PI / 2;
        } else {
          const localIdx = f2Idx - f2Left - f2Back - f2Right;
          const frontSlots = [-9.8, -3.2, 3.2, 9.8, -6.5, 6.5];
          x =
            localIdx < frontSlots.length
              ? frontSlots[localIdx]
              : THREE.MathUtils.lerp(
                  -10.0,
                  10.0,
                  localIdx / Math.max(1, f2Front - 1)
                );
          z = -1.45;
          rotY = Math.PI;
        }
      }

      artifact.floor = floor;
      const stand = new ArtifactStand(artifact);
      stand.position.set(x, y, z);
      stand.rotation.y = rotY;
      this.add(stand);
      this.stands.push(stand);
    });
    this.syncIndoorWallRects();
  }

  private openArtifactStory(artifact: ArtifactItem): void {
    kidAudio.playSelect();
    const idx = this.artifacts.findIndex((a) => a.id === artifact.id);
    if (idx >= 0) this.currentArtifactIndex = idx;

    this.stands.forEach((s) =>
      s.setHighlighted(s.artifact.id === artifact.id)
    );
    this.hud.openStoryModal(artifact);

    if (
      this.activeQuest &&
      !this.activeQuest.solved &&
      this.activeQuest.targetArtifactId === artifact.id
    ) {
      this.activeQuest.solved = true;
      this.collectArtifactStar(artifact, false);
      kidAudio.playQuestVictory();
      const stand = this.stands.find((s) => s.artifact.id === artifact.id);
      this.triggerFullCelebration(
        stand ? stand.position.clone().add(new THREE.Vector3(0, 2.2, 0)) : undefined
      );
      this.hud.showToast(
        metin("MuseumWorld", "tebrikler_hazine_avi_eserini_buldun_1", artifact.title)
      );
      this.assignNextQuest();
    }
  }

  private stepArtifact(offset: number): void {
    if (this.artifacts.length === 0) return;
    const nextIdx =
      (this.currentArtifactIndex + offset + this.artifacts.length) %
      this.artifacts.length;
    const next = this.artifacts[nextIdx];
    this.openArtifactStory(next);
  }

  private collectArtifactStar(
    artifact: ArtifactItem,
    playFanfare: boolean
  ): void {
    const isNew = !this.discoveredIds.has(artifact.id);
    this.discoveredIds.add(artifact.id);

    const stand = this.stands.find((s) => s.artifact.id === artifact.id);
    stand?.setDiscovered(true);

    if (isNew) {
      const burstPos = stand
        ? stand.position.clone().add(new THREE.Vector3(0, 2.2, 0))
        : this.playerPos.clone().add(new THREE.Vector3(0, 1.9, 0));
      this.triggerFullCelebration(burstPos);
    }

    if (playFanfare) {
      kidAudio.playStarCollected();
    }
    this.hud.setDiscoveredIds(this.discoveredIds);

    if (this.discoveredIds.size >= 1) this.unlockBadge('first_art');
    if (this.discoveredIds.size >= 5) this.unlockBadge('five_arts');

    if (this.discoveredIds.size === this.artifacts.length) {
      kidAudio.playQuestVictory();
      this.hud.showToast(
        metin("MuseumWorld", "harika_kasif_1_eserin_tamamini_kesfettin", this.artifacts.length)
      );
    }
  }

  private assignNextQuest(): void {
    if (this.artifacts.length === 0) return;
    const pool = this.artifacts.filter((a) => !this.discoveredIds.has(a.id));
    const candidates = pool.length > 0 ? pool : this.artifacts;
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    this.activeQuest = {
      targetArtifactId: chosen.id,
      clue: chosen.questClue,
      solved: false,
    };
    this.hud.setQuest(this.activeQuest);
    this.updateQuestTargetSparkles();
  }

  private updatePlayerMovement(dt: number): void {
    this.prevPlayerPos.copy(this.playerPos);
    if (this.appleBoostTimer > 0) {
      this.appleBoostTimer = Math.max(0, this.appleBoostTimer - dt);
    }

    if (
      this.photoStudioActive ||
      this.photoBoothModal?.isOpen() ||
      this.hud.isModalOpen() ||
      this.gameModals.isOpen() ||
      this.creativeModals.isOpen() ||
      this.socialModals.isBlockingModalOpen()
    ) {
      this.player.setMoving(false);
      this.player.position.copy(this.playerPos);
      this.player.rotation.y = this.playerYaw;
      return;
    }

    if (this.tugArena.isMatchRunning()) {
      this.clearAutoWalk();
      const slot = this.tugArena.getPlayerSlotWorldPos();
      this.playerPos.x = THREE.MathUtils.damp(this.playerPos.x, slot.x, 16, dt);
      this.playerPos.z = THREE.MathUtils.damp(this.playerPos.z, slot.z, 16, dt);
      this.playerPos.y = THREE.MathUtils.damp(this.playerPos.y, 0, 18, dt);
      this.playerYaw = lerpAngle(this.playerYaw, -Math.PI / 2, 14 * dt);
      this.player.setMoving(false);
      this.player.setPulling(-1);
      this.player.position.copy(this.playerPos);
      this.player.rotation.y = this.playerYaw;
      return;
    }
    this.player.setPulling(0);

    let moveX = this.joystickVec.x;
    let moveZ = this.joystickVec.y;

    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) moveX -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) moveX += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) moveZ -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) moveZ += 1;

    const hasManualInput = Math.hypot(moveX, moveZ) > 0.08;
    if (this.seatedSemaSeat) {
      if (hasManualInput || this.walkTarget) {
        this.standUpFromSemaSeat(false);
      } else {
        this.playerPos.copy(this.seatedSemaSeat.position);
        this.playerYaw = lerpAngle(this.playerYaw, this.seatedSemaSeat.yaw, 12 * dt);
        this.player.setMoving(false);
        this.player.setSitting(true);
        this.player.position.copy(this.playerPos);
        this.player.rotation.y = this.playerYaw;
        return;
      }
    } else {
      this.player.setSitting(false);
    }

    const baseSpeed =
      this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')
        ? RUN_SPEED
        : WALK_SPEED;
    const speed = this.appleBoostTimer > 0 ? baseSpeed * 1.45 : baseSpeed;

    let movingNow = false;
    let deltaStepX = 0;
    let deltaStepZ = 0;

    if (hasManualInput) {
      this._forward.set(-Math.sin(this.camYaw), 0, -Math.cos(this.camYaw));
      this._right.set(Math.cos(this.camYaw), 0, -Math.sin(this.camYaw));
      this._moveDir
        .set(0, 0, 0)
        .addScaledVector(this._forward, -moveZ)
        .addScaledVector(this._right, moveX);

      if (this._moveDir.lengthSq() > 0.001) {
        this._moveDir.normalize();
        deltaStepX = this._moveDir.x * speed * dt;
        deltaStepZ = this._moveDir.z * speed * dt;
        const targetYaw = Math.atan2(-this._moveDir.x, -this._moveDir.z);
        this.playerYaw = lerpAngle(this.playerYaw, targetYaw, 10 * dt);
        movingNow = true;
      }
    } else if (this.walkTarget) {
      const dx = this.walkTarget.x - this.playerPos.x;
      const dz = this.walkTarget.z - this.playerPos.z;
      const dist = Math.hypot(dx, dz);
      const arrivalDist = this.pendingPetAfterWalk ? 1.55 : 0.38;
      if (dist < arrivalDist) {
        this.walkTarget = null;
        if (this.pendingDirectorChat) {
          this.pendingDirectorChat = false;
          this.hud.openDirectorModal();
        } else if (this.pendingCafeAfterWalk) {
          this.pendingCafeAfterWalk = false;
          this.socialModals.openCafeModal();
        } else if (this.pendingTugAfterWalk) {
          this.pendingTugAfterWalk = false;
          this.launchTugMatchNow();
        } else if (this.pendingPetAfterWalk) {
          const petId = this.pendingPetAfterWalk;
          this.pendingPetAfterWalk = null;
          this.handlePetInteract(petId);
        } else if (this.pendingSeatAfterWalk) {
          const seatId = this.pendingSeatAfterWalk;
          this.pendingSeatAfterWalk = null;
          const seat =
            this.semaAndMosque.getSeatById(seatId) ??
            this.masalArea.getSeatById(seatId) ??
            this.karagozArea.getSeatById(seatId);
          if (seat) this.sitOnSemaSeat(seat);
        } else if (this.pendingMasalTheaterAfterWalk) {
          this.pendingMasalTheaterAfterWalk = false;
          this.masalBarDismissedInZone = false;
          kidAudio.playStoryChime();
          kidAudio.resumeMasalInZone();
          this.hud.showToast(
            metin("MuseumWorld", "nine_nin_masal_kosku_ne_geldin_keloglan")
          );
        } else if (this.pendingKaragozAfterWalk) {
          this.pendingKaragozAfterWalk = false;
          this.karagozArea.unlockVideoAudio();
          kidAudio.playKaragozTefAndNareke();
          this.unlockBadge('social_butterfly');
          this.hud.showToast(
            metin("MuseumWorld", "karagoz_ve_hacivat_golge_oyunu_sahnesi_ne_2")
          );
        } else if (this.pendingPhotoBoothAfterWalk) {
          this.pendingPhotoBoothAfterWalk = false;
          this.enterPhotoStudio();
        } else if (this.pendingNpcAfterWalk) {
          const npcId = this.pendingNpcAfterWalk;
          this.pendingNpcAfterWalk = null;
          const profile = this.worldNpcProfiles.get(npcId);
          if (profile) this.openNpcModalForProfile(profile);
        } else if (this.pendingStationAfterWalk) {
          const kind = this.pendingStationAfterWalk;
          this.pendingStationAfterWalk = null;
          this.openCreativeStationModal(kind);
        } else if (this.pendingActivityAfterWalk) {
          const act = this.pendingActivityAfterWalk;
          this.pendingActivityAfterWalk = null;
          this.startActivity(act);
        } else if (this.pendingHideSeekAfterWalk) {
          this.pendingHideSeekAfterWalk = false;
          this.gameModals.openHideSeekModal(
            this.hideAndSeek.getMode(),
            this.hideAndSeek.getKidCount()
          );
        } else if (this.pendingInspectAfterWalk) {
          const targetArt = this.pendingInspectAfterWalk;
          this.pendingInspectAfterWalk = null;
          this.openArtifactStory(targetArt);
        }
      } else {
        const dirX = dx / dist;
        const dirZ = dz / dist;
        const walkSpd = this.appleBoostTimer > 0 ? WALK_SPEED * 1.45 : WALK_SPEED;
        const clampedStep = Math.min(dist, walkSpd * dt);
        deltaStepX = dirX * clampedStep;
        deltaStepZ = dirZ * clampedStep;
        const targetYaw = Math.atan2(-dirX, -dirZ);
        this.playerYaw = lerpAngle(this.playerYaw, targetYaw, 10 * dt);
        movingNow = true;
      }
    }

    this.player.setMoving(movingNow);

    // Sub-stepped horizontal collision so fast movement never tunnels through walls or props
    const stepLen = Math.hypot(deltaStepX, deltaStepZ);
    if (stepLen > 0.0001) {
      const substeps = Math.max(1, Math.ceil(stepLen / 0.14));
      for (let s = 0; s < substeps; s++) {
        this.playerPos.x += deltaStepX / substeps;
        this.playerPos.z += deltaStepZ / substeps;
        this.building.resolveCollision(this.playerPos, 0.42);
      }
    } else {
      this.building.resolveCollision(this.playerPos, 0.42);
    }
    const groundY = this.building.getGroundHeight(
      this.playerPos.x,
      this.playerPos.z,
      this.playerPos.y
    );
    const heightDamp = this.building.isInStairFootprint(
      this.playerPos.x,
      this.playerPos.z
    )
      ? 26
      : 14;
    this.playerPos.y = THREE.MathUtils.damp(
      this.playerPos.y,
      groundY,
      heightDamp,
      dt
    );

    // Surface-aware footstep SFX based on actual walked horizontal distance
    if (movingNow && Math.abs(this.playerPos.y - groundY) < 0.16) {
      const stepDist = Math.hypot(
        this.playerPos.x - this.prevPlayerPos.x,
        this.playerPos.z - this.prevPlayerPos.z
      );
      this.stepAccum += stepDist;
      if (this.stepAccum >= 0.78) {
        this.stepAccum = 0;
        const surface = this.building.getSurfaceKindAt(this.playerPos);
        kidAudio.playFootstep(surface);
      }
    }

    this.player.position.copy(this.playerPos);
    this.player.rotation.y = this.playerYaw;
    this.building.updateDoorProximity(this.playerPos);

    const isInside = this.building.isInsideMuseum(this.playerPos);
    const floor = this.building.getFloorNumber(this.playerPos.y);
    if (isInside !== this.wasInsideMuseum || floor !== this.currentFloor) {
      const enteredNow = isInside && !this.wasInsideMuseum;
      const changedInside = isInside !== this.wasInsideMuseum;
      this.wasInsideMuseum = isInside;
      this.currentFloor = floor;
      this.hud.setLocationState(isInside, floor);
      if (changedInside) {
        kidAudio.setMuseumInside(isInside);
      }
      if (enteredNow) {
        kidAudio.playStarCollected();
        if (this.envFx.isRaining()) {
          this.hud.showToast(
            metin("MuseumWorld", "muze_icine_girdin_cam_kapidan_disaridaki_yagmuru")
          );
        } else {
          this.hud.showToast(
            metin("MuseumWorld", "mirasium_muzesi_ne_hos_geldin_muze_muduru")
          );
        }
      }
    }
  }

  private updateNpcVisitors(dt: number, insideDeep = false): void {
    this._npcOutdoorPositions.length = 0;
    const maxNpcDist = DEVICE_QUALITY.isMobile ? 28 : 38;
    const hideSeekIdle = this.hideAndSeek.getMode() === 'idle';
    const farOutdoors = !insideDeep && this.playerPos.z > 12;

    for (let i = 0; i < this.npcs.length; i++) {
      const npc = this.npcs[i];
      const isOutdoorNpc = npc.waypoints[0].y < 0.2;
      if (isOutdoorNpc) {
        this._npcOutdoorPositions.push(npc.character.position);
      }

      const isPhotoGuest =
        this.photoStudioActive &&
        this.photoBoothFriendId === npc.id &&
        (this.photoStudioCompanion === 'friend' ||
          this.photoStudioCompanion === 'both');
      if (isPhotoGuest) {
        npc.character.visible = true;
        npc.character.setLowDetailUpdate(false);
        npc.bubbleSprite.visible = false;
        continue;
      }

      const distToPlayer = Math.hypot(
        npc.character.position.x - this.playerPos.x,
        npc.character.position.z - this.playerPos.z
      );
      if (
        hideSeekIdle &&
        ((insideDeep && isOutdoorNpc) ||
          (farOutdoors && !isOutdoorNpc) ||
          distToPlayer > maxNpcDist)
      ) {
        npc.character.visible = false;
        npc.bubbleSprite.visible = false;
        continue;
      }
      npc.character.visible = true;
      npc.character.setLowDetailUpdate(distToPlayer > 16);

      if (npc.speakTimer > 0) {
        npc.speakTimer -= dt;
        npc.bubbleSprite.position.y =
          2.08 + Math.sin(performance.now() * 0.004 + npc.waypointIndex) * 0.03;
        npc.bubbleSprite.visible = distToPlayer < 14.5;
        if (npc.speakTimer <= 0) {
          npc.bubbleSprite.visible = false;
          npc.silenceTimer = 4.0 + Math.random() * 6.0;
        }
      } else {
        npc.bubbleSprite.visible = false;
        npc.silenceTimer -= dt;
        if (npc.silenceTimer <= 0 && distToPlayer < 14.5 && Math.abs(npc.character.position.y - this.playerPos.y) < 2) {
          this.assignRandomQuote(npc);
          npc.speakTimer = 4.2 + Math.random() * 1.8;
          npc.bubbleSprite.visible = distToPlayer < 14.5;
        }
      }

      if (npc.waitTimer > 0) {
        npc.waitTimer -= dt;
        npc.character.setMoving(false);
        if (npc.isClappingAtSaz) {
          const faceYaw = Math.atan2(
            -(SAZ_GAZEBO_POS.x - npc.character.position.x),
            -(SAZ_GAZEBO_POS.z - npc.character.position.z)
          );
          npc.character.rotation.y = lerpAngle(
            npc.character.rotation.y,
            faceYaw,
            6 * dt
          );
          npc.character.setClapping(true);
          if (npc.sazClapCooldown !== undefined) {
            npc.sazClapCooldown -= dt;
            if (npc.sazClapCooldown <= 0) {
              npc.sazClapCooldown = 2.6 + Math.random() * 2.2;
              const playerNearSaz =
                Math.hypot(
                  this.playerPos.x - SAZ_GAZEBO_POS.x,
                  this.playerPos.z - SAZ_GAZEBO_POS.z
                ) < 9.5 && !kidAudio.isSazPaused();
              if (playerNearSaz) {
                kidAudio.playClapSound();
              }
            }
          }
        } else {
          npc.character.setClapping(false);
        }
        continue;
      }
      npc.isClappingAtSaz = false;
      npc.character.setClapping(false);
      const target = npc.waypoints[npc.waypointIndex];
      const dx = target.x - npc.character.position.x;
      const dz = target.z - npc.character.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.25) {
        const atSazGazebo =
          Boolean(npc.clapperEligible) &&
          Math.hypot(
            npc.character.position.x - SAZ_GAZEBO_POS.x,
            npc.character.position.z - SAZ_GAZEBO_POS.z
          ) < 3.4;
        npc.waypointIndex = (npc.waypointIndex + 1) % npc.waypoints.length;
        if (atSazGazebo) {
          npc.isClappingAtSaz = true;
          npc.waitTimer = 5.5 + Math.random() * 2.5;
          const praises = [
            metin("MuseumWorld", "harika_caliyorsun_mihriban"),
            metin("MuseumWorld", "anadolu_turkuleri_ruhumuza_isliyor"),
            metin("MuseumWorld", "sazin_sesi_bahceyi_senlendirdi"),
            metin("MuseumWorld", "alkislar_mihriban_a_muhtesem_dinleti"),
          ];
          this.setNpcCustomBubble(
            npc,
            `${npc.name}: ${praises[i % praises.length]}`,
            npc.waitTimer
          );
        } else {
          npc.waitTimer = 1.6 + Math.random() * 2.4;
        }
        npc.character.setMoving(false);
      } else {
        const speed = npc.speed;
        npc.character.position.x += (dx / dist) * speed * dt;
        npc.character.position.z += (dz / dist) * speed * dt;
        const targetYaw = Math.atan2(-(dx / dist), -(dz / dist));
        npc.character.rotation.y = lerpAngle(
          npc.character.rotation.y,
          targetYaw,
          6 * dt
        );
        npc.character.setMoving(true);
      }
    }
  }

  private updateNearbyInteractive(): void {
    if (this.celikField.active && this.playerPos.distanceToSquared(CELIK_START) <= 32) {
      const prompt = this.celikField.prompt;
      const key = `celik-${prompt.key}-${prompt.title}`;
      if (this.promptKey !== key) {
        this.promptKey = key;
        this.hud.setProximityPrompt({
          title: prompt.title,
          actionLabel: `${prompt.action} (E)`,
          onTrigger: () => {
            kidAudio.playSelect();
            this.celikField.action();
          },
          secondaryLabel: prompt.key === 'flight' ? undefined : metin("MuseumWorld", "sahadan_cik"),
          onSecondaryTrigger: () => this.celikField.stop(),
        });
      }
      return;
    }
    if (this.playerPos.y < 1.5 && this.playerPos.distanceToSquared(CONCERT_ORIGIN) < 100) {
      if (this.promptKey !== 'concert') {
        this.promptKey = 'concert';
        this.hud.setProximityPrompt({
          title: metin("MuseumWorld", "mirasium_konser_sahnesi"),
          actionLabel: metin("MuseumWorld", "istek_sarki_ilet_e"),
          onTrigger: () => this.hud.openConcert(),
        });
      }
      return;
    }
    if (isInsideMosque(this.playerPos)) {
      const byLesson = this.playerPos.distanceToSquared(MOSQUE_LESSON_SPOT) < 4;
      const key = byLesson ? 'siyer-lesson' : 'siyer-room';
      if (this.promptKey !== key) {
        this.promptKey = key;
        this.hud.setProximityPrompt({
          title: metin("MuseumWorld", "siyer_i_nebi_ders_bolumu"),
          actionLabel: byLesson ? metin("MuseumWorld", "dersi_ac_e") : metin("MuseumWorld", "ders_bolumune_git_e"),
          onTrigger: () => {
            if (byLesson) this.hud.openSiyerLesson();
            else this.visitGardenLocation(MOSQUE_LESSON_SPOT, Math.PI / 2);
          },
        });
      }
      return;
    }
    if (inObservatory(this.playerPos)) {
      if (this.promptKey !== 'observatory') {
        this.promptKey = 'observatory';
        this.hud.setProximityPrompt({
          title: metin("MuseumWorld", "takiyuddin_in_rasathanesi"),
          actionLabel: metin("MuseumWorld", "gozlem_yap_e"),
          onTrigger: () => this.hud.openObservatory('observe'),
          secondaryLabel: metin("MuseumWorld", "kitabeyi_oku"),
          onSecondaryTrigger: () => this.hud.openObservatory('biography'),
        });
      }
      return;
    }
    if (this.playerPos.distanceToSquared(OBSERVATORY_GATE) < 9) {
      if (this.promptKey !== 'observatory-gate') {
        this.promptKey = 'observatory-gate';
        this.hud.setProximityPrompt({
          title: metin("MuseumWorld", "daru_r_rasadu_l_cedid"),
          actionLabel: metin("MuseumWorld", "rasathaneye_gir_e"),
          onTrigger: () => this.visitGardenLocation(OBSERVATORY_VISIT_SPOT, 0),
        });
      }
      return;
    }
    if (this.playerPos.y < 1.2 && this.playerPos.distanceToSquared(DIG_SITE_ORIGIN) < 30) {
      const nearDig = this.gardenProps.findNearestDigMound(this.playerPos, 2.8);
      const key = nearDig ? 'dig-square-' + nearDig.index : 'dig-journal';
      if (this.promptKey !== key) {
        this.promptKey = key;
        this.hud.setProximityPrompt({
          title: metin("MuseumWorld", "arkeoloji_kazi_alani"),
          actionLabel: nearDig ? metin("MuseumWorld", "kaziya_basla_e") : metin("MuseumWorld", "kazi_defterini_ac_e"),
          onTrigger: () => nearDig ? this.openDigSquare(nearDig.index) : this.openDigJournal(),
          secondaryLabel: nearDig ? metin("MuseumWorld", "kazi_defteri") : undefined,
          onSecondaryTrigger: nearDig ? () => this.openDigJournal() : undefined,
        });
      }
      return;
    }
    if (this.playerPos.distanceToSquared(HODJA_ORIGIN) < 17) {
      if (this.promptKey !== 'hodja') {
        this.promptKey = 'hodja';
        this.hud.setProximityPrompt({
          title: metin("MuseumWorld", "nasreddin_hoca_dere_kiyisi"),
          actionLabel: metin("MuseumWorld", "fikrayi_dinle_e"),
          onTrigger: () => this.tellHodjaStory(),
        });
      }
      return;
    }
    const marketIndex = MARKET_STALLS.findIndex((stall) =>
      this.playerPos.y < 1.2 && Math.hypot(this.playerPos.x - stall.x, this.playerPos.z - stall.z) < 2.6);
    if (marketIndex >= 0) {
      const key = `market-${marketIndex}`;
      if (this.promptKey !== key) {
        this.promptKey = key;
        const stall = MARKET_STALLS[marketIndex];
        this.hud.setProximityPrompt({
          title: stall.seller,
          actionLabel: metin("MuseumWorld", "1_2_al_e", stall.icon, stall.name),
          onTrigger: () => this.buyMarketSnack(marketIndex),
        });
      }
      return;
    }
    if (this.photoStudioActive) {
      if (this.promptKey) {
        this.promptKey = '';
        this.hud.setProximityPrompt(null);
      }
      return;
    }
    if (
      this.playerPos.y < 1.2 &&
      Math.hypot(
        this.playerPos.x - PHOTO_BOOTH_ORIGIN.x,
        this.playerPos.z - PHOTO_BOOTH_ORIGIN.z
      ) < 4.5
    ) {
      if (this.promptKey !== 'photo-booth') {
        this.promptKey = 'photo-booth';
        this.hud.setProximityPrompt({
          title: '📸 İstanbul Hatırası',
          actionLabel: 'Fotoğraf Çekil (E)',
          onTrigger: () => this.enterPhotoStudio(),
        });
      }
      return;
    }
    if (this.playerPos.distanceTo(TILE_WORKSHOP_ORIGIN) < 3.5) {
      if (this.promptKey !== 'tile-workshop') {
        this.promptKey = 'tile-workshop';
        this.hud.setProximityPrompt({
          title: metin("MuseumWorld", "cini_atolyesi"),
          actionLabel: metin("MuseumWorld", "deseni_tamamla_e"),
          onTrigger: () => this.hud.openTileWorkshop(),
        });
      }
      return;
    }
    // 0. Active Hide-and-Seek interactions (highest priority inside museum)
    const hsMode = this.hideAndSeek.getMode();
    if (hsMode === 'seeking') {
      const targetKid = this.hideAndSeek.getNearestUntaggedKid(this.playerPos);
      if (targetKid) {
        const key = `hs-tag-${targetKid.id}`;
        if (this.promptKey !== key) {
          this.promptKey = key;
          this.hud.setProximityPrompt({
            title: metin("MuseumWorld", "1_saklandi", targetKid.name),
            actionLabel: metin("MuseumWorld", "sobele_e"),
            onTrigger: () => {
              this.hideAndSeek.tryTagKidById(targetKid.id, this.playerPos);
            },
          });
        }
        return;
      }
    } else if (hsMode === 'hiding') {
      if (
        this.hideAndSeek.getHidePhase() === 'searching' &&
        this.hideAndSeek.isNearStation(this.playerPos, 2.5)
      ) {
        if (this.promptKey !== 'hs-sobe-station') {
          this.promptKey = 'hs-sobe-station';
          this.hud.setProximityPrompt({
            title: metin("MuseumWorld", "saklambac_ebe_tasi"),
            actionLabel: metin("MuseumWorld", "sobele_ve_kazan_e"),
            onTrigger: () => {
              this.hideAndSeek.tryPlayerSobeAtStation(this.playerPos);
            },
          });
        }
        return;
      }

      if (this.building.isInsideMuseum(this.playerPos)) {
        const hideSpot = this.hideAndSeek.getNearestHideSpot(
          this.playerPos,
          this.building.getHidingSpots()
        );
        const crouching = this.player.isCrouching();
        const spotId = hideSpot ? hideSpot.id : 'free-floor';
        const key = `hs-spot-${spotId}-${crouching ? '1' : '0'}`;
        if (this.promptKey !== key) {
          this.promptKey = key;
          this.hud.setProximityPrompt({
            title: hideSpot
              ? crouching
                ? metin("MuseumWorld", "1_yaninda_gizlendin", hideSpot.name)
                : `🫥 ${hideSpot.name}`
              : crouching
                ? metin("MuseumWorld", "muze_icinde_comelerek_gizlendin")
                : metin("MuseumWorld", "muze_ici_serbest_saklanma_e_c"),
            actionLabel: crouching ? metin("MuseumWorld", "ayaga_kalk_e") : metin("MuseumWorld", "comelerek_saklan_e"),
            onTrigger: () => {
              this.player.setCrouching(!this.player.isCrouching());
              kidAudio.playSelect();
            },
          });
        }
        return;
      }
    }

    if (this.hideAndSeek.isNearStation(this.playerPos, 2.7)) {
      if (this.promptKey !== 'hs-station') {
        this.promptKey = 'hs-station';
        this.hud.setProximityPrompt({
          title: metin("MuseumWorld", "muze_ici_saklambac_alani"),
          actionLabel: metin("MuseumWorld", "saklambac_oyna_e"),
          onTrigger: () => {
            kidAudio.playSelect();
            this.gameModals.openHideSeekModal(
              this.hideAndSeek.getMode(),
              this.hideAndSeek.getKidCount()
            );
          },
        });
      }
      return;
    }

    // 1. Director
    const directorDist = this.playerPos.distanceTo(this.director.position);
    if (
      directorDist < 3.2 &&
      Math.abs(this.playerPos.y - this.director.position.y) < 1.8
    ) {
      if (this.promptKey !== 'director') {
        this.promptKey = 'director';
        this.hud.setProximityPrompt({
          title: metin("MuseumWorld", "muze_muduru_hos_geldiniz"),
          actionLabel: metin("MuseumWorld", "sohbet_et_e"),
          onTrigger: () => {
            kidAudio.playSelect();
            this.hud.openDirectorModal();
          },
        });
      }
      return;
    }

    // 1a. Mirasium Anadolu Kafe
    if (this.cafe.isNearCafe(this.playerPos, 4.8)) {
      if (this.promptKey !== 'anatolian-cafe') {
        this.promptKey = 'anatolian-cafe';
        this.hud.setProximityPrompt({
          title: metin("MuseumWorld", "mirasium_anadolu_kafe_2"),
          actionLabel: metin("MuseumWorld", "kafe_menusu_e"),
          onTrigger: () => {
            kidAudio.playCafeBell();
            this.socialModals.openCafeModal();
          },
        });
      }
      return;
    }

    // 1b. Outdoor Tug-of-War Arena
    if (
      this.playerPos.y < 1.2 &&
      Math.hypot(
        this.playerPos.x - TUG_ARENA_ORIGIN.x,
        this.playerPos.z - TUG_ARENA_ORIGIN.z
      ) < 6.4
    ) {
      if (this.promptKey !== 'act-tugofwar') {
        this.promptKey = 'act-tugofwar';
        this.hud.setProximityPrompt({
          title: metin("MuseumWorld", "halat_cekme_sahasi"),
          actionLabel: metin("MuseumWorld", "halat_macini_baslat_e"),
          onTrigger: () => this.launchTugMatchNow(),
        });
      }
      return;
    }

    // 1b2. Seated Sema / Masal Spectator Stand-up, Pettable Animals, Chairs & Saz/Vendors
    if (this.seatedSemaSeat) {
      if (this.seatedSemaSeat.id.startsWith('masal-')) {
        if (this.socialModals.isMasalBarOpen()) {
          if (this.promptKey) {
            this.promptKey = '';
            this.hud.setProximityPrompt(null);
          }
          return;
        }
        if (this.promptKey !== 'masal-seated') {
          this.promptKey = 'masal-seated';
          this.hud.setProximityPrompt({
            title: metin("MuseumWorld", "nine_nin_masal_minderi_golge_perdesi"),
            actionLabel: metin("MuseumWorld", "minderden_kalk_e"),
            onTrigger: () => this.standUpFromSemaSeat(true),
            secondaryLabel: metin("MuseumWorld", "oynaticiyi_goster"),
            onSecondaryTrigger: () => {
              this.masalBarDismissedInZone = false;
            },
          });
        }
      } else if (this.seatedSemaSeat.id.startsWith('karagoz-')) {
        const playing = this.karagozArea.isVideoPlaying();
        const key = `karagoz-seated-${playing ? 'play' : 'pause'}`;
        if (this.promptKey !== key) {
          this.promptKey = key;
          this.hud.setProximityPrompt({
            title: metin("MuseumWorld", "karagoz_hacivat_golge_oyunu"),
            actionLabel: metin("MuseumWorld", "koltuktan_kalk_e"),
            onTrigger: () => this.standUpFromSemaSeat(true),
            secondaryLabel: playing ? metin("MuseumWorld", "duraklat") : metin("MuseumWorld", "devam_et"),
            onSecondaryTrigger: () => this.toggleKaragozOrWalk(),
          });
        }
      } else if (this.promptKey !== 'sema-seated') {
        this.promptKey = 'sema-seated';
        this.hud.setProximityPrompt({
          title: metin("MuseumWorld", "1_sema_izleniyor", this.seatedSemaSeat.label),
          actionLabel: metin("MuseumWorld", "koltuktan_kalk_e"),
          onTrigger: () => this.standUpFromSemaSeat(true),
        });
      }
      return;
    }

    const nearPet = this.pets.findNearestPet(this.playerPos, 2.75);
    if (nearPet && !nearPet.adopted) {
      this.showPetProximityPrompt(nearPet);
      return;
    }

    if (this.playerPos.y < 1.2) {

      const nearSeat =
        this.semaAndMosque.findNearestSeat(this.playerPos, 2.15) ??
        this.karagozArea.findNearestSeat(this.playerPos, 2.15) ??
        this.masalArea.findNearestSeat(this.playerPos, 2.15);
      if (nearSeat) {
        const key = `seat-${nearSeat.id}`;
        if (this.promptKey !== key) {
          this.promptKey = key;
          const isKaragozSeat = nearSeat.id.startsWith('karagoz-');
          this.hud.setProximityPrompt({
            title: isKaragozSeat
              ? metin("MuseumWorld", "1_karagoz_sahnesi", nearSeat.label)
              : `💺 ${nearSeat.label}`,
            actionLabel: metin("MuseumWorld", "koltuga_otur_e"),
            onTrigger: () => this.sitOnSemaSeat(nearSeat),
          });
        }
        return;
      }

      const semaStageDist = Math.hypot(
        this.playerPos.x - SEMA_STAGE_ORIGIN.x,
        this.playerPos.z - (SEMA_STAGE_ORIGIN.z - 2.0)
      );
      if (semaStageDist < 5.6) {
        if (this.promptKey !== 'sema-ensemble') {
          this.promptKey = 'sema-ensemble';
          this.hud.setProximityPrompt({
            title: metin("MuseumWorld", "semazenler_ney_musiki_sahnesi"),
            actionLabel: metin("MuseumWorld", "sahne_bilgisi_ses_e"),
            onTrigger: () => this.openOrWalkToNpc('sema-ensemble'),
          });
        }
        return;
      }

      const mosqueDist = Math.hypot(
        this.playerPos.x - (MOSQUE_ORIGIN.x + 5.5),
        this.playerPos.z - MOSQUE_ORIGIN.z
      );
      if (mosqueDist < 4.5) {
        if (this.promptKey !== 'anatolian-mosque') {
          this.promptKey = 'anatolian-mosque';
          this.hud.setProximityPrompt({
            title: metin("MuseumWorld", "cami"),
            actionLabel: metin("MuseumWorld", "iceri_gir_e"),
            onTrigger: () => {
              this.visitGardenLocation(MOSQUE_ORIGIN.clone().add(new THREE.Vector3(2.25, 0, 0)), Math.PI / 2);
            },
          });
        }
        return;
      }

      const masalDist = Math.hypot(
        this.playerPos.x - MASAL_ORIGIN.x,
        this.playerPos.z - MASAL_ORIGIN.z
      );
      if (masalDist < 4.9) {
        if (this.socialModals.isMasalBarOpen()) {
          if (this.promptKey) {
            this.promptKey = '';
            this.hud.setProximityPrompt(null);
          }
          return;
        }
        if (this.promptKey !== 'masal-gazebo') {
          this.promptKey = 'masal-gazebo';
          this.hud.setProximityPrompt({
            title: metin("MuseumWorld", "nine_nin_masal_kosku_golge_perdesi"),
            actionLabel: metin("MuseumWorld", "mindere_otur_e"),
            onTrigger: () => this.openOrWalkToMasal('seat'),
            secondaryLabel: metin("MuseumWorld", "oynaticiyi_goster"),
            onSecondaryTrigger: () => {
              this.masalBarDismissedInZone = false;
              kidAudio.resumeMasalInZone();
            },
          });
        }
        return;
      }

      const karagozDist = Math.hypot(
        this.playerPos.x - KARAGOZ_ORIGIN.x,
        this.playerPos.z - KARAGOZ_ORIGIN.z
      );
      if (karagozDist < 6.4) {
        const playing = this.karagozArea.isVideoPlaying();
        const key = `karagoz-theater-${playing ? 'play' : 'pause'}`;
        if (this.promptKey !== key) {
          this.promptKey = key;
          this.hud.setProximityPrompt({
            title: metin("MuseumWorld", "karagoz_ve_hacivat_golge_oyunu"),
            actionLabel: playing ? metin("MuseumWorld", "oyunu_duraklat_e") : metin("MuseumWorld", "oyunu_baslat_e"),
            onTrigger: () => this.toggleKaragozOrWalk(),
            secondaryLabel: metin("MuseumWorld", "seyirci_sirasina_otur"),
            onSecondaryTrigger: () => this.sitOnNearestKaragozSeat(),
          });
        }
        return;
      }

      const sazDist = Math.hypot(
        this.playerPos.x - SAZ_GAZEBO_POS.x,
        this.playerPos.z - SAZ_GAZEBO_POS.z
      );
      if (sazDist < 3.4) {
        if (this.promptKey !== 'npc-saz-mihriban') {
          this.promptKey = 'npc-saz-mihriban';
          this.hud.setProximityPrompt({
            title: metin("MuseumWorld", "saz_sanatcisi_mihriban_2"),
            actionLabel: metin("MuseumWorld", "dinle_sohbet_e"),
            onTrigger: () => this.openOrWalkToNpc('npc-saz-mihriban'),
          });
        }
        return;
      }

      for (const v of this.vendorNpcs) {
        if (!v.char.visible) continue;
        const vd = Math.hypot(
          this.playerPos.x - v.char.position.x,
          this.playerPos.z - v.char.position.z
        );
        if (vd < 3.1) {
          const key = `vendor-${v.kind}`;
          if (this.promptKey !== key) {
            this.promptKey = key;
            this.hud.setProximityPrompt({
              title:
                v.kind === 'siraci'
                  ? metin("MuseumWorld", "siraci_usta_riza")
                  : metin("MuseumWorld", "bozaci_bekir_usta"),
              actionLabel:
                v.kind === 'siraci' ? metin("MuseumWorld", "sira_al_e") : metin("MuseumWorld", "boza_al_e"),
              onTrigger: () => this.openOrWalkToNpc(v.id),
            });
          }
          return;
        }
      }
    }

    // 1c. Outdoor Activity NPCs
    if (this.playerPos.y < 1.2) {
      for (const act of this.activityNpcs) {
        const d = Math.hypot(
          this.playerPos.x - act.pos.x,
          this.playerPos.z - act.pos.z
        );
        if (d < 3.5) {
          const key = `act-${act.kind}`;
          if (this.promptKey !== key) {
            this.promptKey = key;
            this.hud.setProximityPrompt({
              title: act.label,
              actionLabel: metin("MuseumWorld", "oyunu_baslat_e_2"),
              onTrigger: () => {
                kidAudio.playSelect();
                this.startActivity(act.kind);
              },
            });
          }
          return;
        }
      }
    }

    // 1c. Hedge Labyrinth Center Golden Crown
    if (this.gardenProps.findNearestMazeCrown(this.playerPos)) {
      if (this.promptKey !== 'maze-crown') {
        this.promptKey = 'maze-crown';
        const crownLabel =
          this.player.getActiveStyle() === 'erkek'
            ? metin("MuseumWorld", "altin_kral_taci_seni_bekliyor")
            : metin("MuseumWorld", "altin_kralice_taci_seni_bekliyor");
        this.hud.setProximityPrompt({
          title: crownLabel,
          actionLabel: metin("MuseumWorld", "taci_basina_tak_e"),
          onTrigger: () => {
            this.claimMazeCrownPrize();
            this.promptKey = '';
            this.hud.setProximityPrompt(null);
          },
        });
      }
      return;
    }

    // 2. Creative Stations
    const nearStation = this.stations.findNearestStation(this.playerPos);
    if (nearStation) {
      const key = `station-${nearStation.type}`;
      if (this.promptKey !== key) {
        this.promptKey = key;
        this.hud.setProximityPrompt({
          title: nearStation.label,
          actionLabel:
            nearStation.type === 'art' ? metin("MuseumWorld", "cizim_yap_e") : metin("MuseumWorld", "puzzle_oyna_e"),
          onTrigger: () => {
            kidAudio.playSelect();
            this.openCreativeStationModal(nearStation.type);
          },
        });
      }
      return;
    }

    // 3. Hidden Secrets
    const nearSecret = this.gardenProps.findNearestSecret(this.playerPos);
    if (nearSecret) {
      const key = `secret-${nearSecret.id}`;
      if (this.promptKey !== key) {
        this.promptKey = key;
        this.hud.setProximityPrompt({
          title: metin("MuseumWorld", "1_gizli_surpriz_bulundu", nearSecret.icon),
          actionLabel: metin("MuseumWorld", "sirri_ac_e"),
          onTrigger: () => {
            const claimed = this.gardenProps.claimSecret(nearSecret.id);
            if (claimed) {
              kidAudio.playMagicReveal();
              this.triggerFullCelebration(
                claimed.position.clone().add(new THREE.Vector3(0, 1.0, 0))
              );
              this.unlockBadge('secret_hunter');
              this.addInventoryItem(
                claimed.id,
                claimed.title,
                claimed.icon,
                'treasure',
                claimed.fact
              );
              this.hud.showToast(
                `${claimed.icon} ${claimed.title}: ${claimed.fact}`
              );
              this.promptKey = '';
              this.hud.setProximityPrompt(null);
            }
          },
        });
      }
      return;
    }

    // 4. Nearest Hanging Apple
    const nearApple = this.gardenProps.findNearestApple(this.playerPos);
    if (nearApple) {
      const key = `apple-${nearApple.mesh.userData.appleId}`;
      if (this.promptKey !== key) {
        this.promptKey = key;
        this.hud.setProximityPrompt({
          title: metin("MuseumWorld", "agacta_taze_elma"),
          actionLabel: metin("MuseumWorld", "elma_topla_e"),
          onTrigger: () => {
            const picked = this.gardenProps.pickNearestApple(this.playerPos);
            if (picked) {
              this.appleCount++;
              this.hud.setAppleCount(this.appleCount);
              this.addInventoryItem(
                'apple',
                metin("MuseumWorld", "taze_muze_bahcesi_elmasi"),
                '🍎',
                'nature',
                metin("MuseumWorld", "bahcedeki_meyve_agaclarindan_toplandi_yediginde_14_saniye"),
                1,
                metin("MuseumWorld", "ye_hiz_2")
              );
              kidAudio.playApplePick();
              this.unlockBadge('garden_explorer');
              this.hud.showToast(
                metin("MuseumWorld", "elma_topladin_ve_cantana_eklendi_sepet_1", this.appleCount)
              );
              this.promptKey = '';
              this.hud.setProximityPrompt(null);
            }
          },
        });
      }
      return;
    }

    // 5. Nearest Left Fıskiye or Right Çeşme
    const nearFountain = this.gardenProps.findNearestFountain(this.playerPos);
    if (nearFountain) {
      const key = `fountain-${nearFountain.kind}`;
      if (this.promptKey !== key) {
        this.promptKey = key;
        const isFiskiye = nearFountain.kind === 'fiskiye';
        this.hud.setProximityPrompt({
          title: isFiskiye
            ? metin("MuseumWorld", "mermer_bahce_fiskiyesi")
            : metin("MuseumWorld", "tarihi_mahalle_cesmesi"),
          actionLabel: isFiskiye
            ? metin("MuseumWorld", "fiskiyeyi_sicrat_e")
            : metin("MuseumWorld", "cesmeden_su_ic_e"),
          onTrigger: () => {
            this.gardenProps.triggerFountainSplash(nearFountain.pos, isFiskiye);
            kidAudio.playWaterSplash();
            this.unlockBadge('garden_explorer');
            this.hud.showToast(
              isFiskiye
                ? metin("MuseumWorld", "mermer_fiskiyenin_serin_sulariyla_eglendin")
                : metin("MuseumWorld", "osmanli_mahalle_cesmesi_nden_buz_gibi_su")
            );
          },
        });
      }
      return;
    }

    // 6. Rain Window Watching (Indoors near front glass doors while raining)
    if (
      this.building.isInsideMuseum(this.playerPos) &&
      this.currentFloor === 1 &&
      this.envFx.isRaining() &&
      Math.abs(this.playerPos.x) < 3.6 &&
      this.playerPos.z > -3.5 &&
      this.playerPos.z < -0.2
    ) {
      if (this.promptKey !== 'rain-window') {
        this.promptKey = 'rain-window';
        this.hud.setProximityPrompt({
          title: metin("MuseumWorld", "disarida_yagmur_yagiyor"),
          actionLabel: metin("MuseumWorld", "camdan_yagmuru_izle_e"),
          onTrigger: () => {
            kidAudio.playSelect();
            this.playerYaw = Math.PI;
            this.camYaw = Math.PI;
            this.camPitch = 0.14;
            this.hud.showToast(
              metin("MuseumWorld", "sicacik_muze_girisinden_bahcedeki_huzurlu_yagmuru_izliyorsun")
            );
          },
        });
      }
      return;
    }

    // 7. Nearest Artifact Stand
    let closest: ArtifactStand | null = null;
    let bestDist = 3.1;
    for (const stand of this.stands) {
      if (Math.abs(stand.position.y - this.playerPos.y) > 1.8) continue;
      const dist = this.playerPos.distanceTo(stand.position);
      if (dist < bestDist) {
        bestDist = dist;
        closest = stand;
      }
    }

    if (closest) {
      const art = closest.artifact;
      const key = `art-${art.id}`;
      if (this.promptKey !== key) {
        this.promptKey = key;
        this.hud.setProximityPrompt({
          title: `#${String(art.index).padStart(2, '0')} (${art.floor}. Kat) ${art.title}`,
          actionLabel: metin("MuseumWorld", "incele_e"),
          onTrigger: () => this.openArtifactStory(art),
        });
      }
      return;
    }

    // 8. Nearest Ambient Visitor NPC for universal chat / invite / gift interaction
    let nearestNpc: NpcVisitor | null = null;
    let bestNpcDist = 2.35;
    for (const npc of this.npcs) {
      if (Math.abs(npc.character.position.y - this.playerPos.y) > 1.8) continue;
      const d = this.playerPos.distanceTo(npc.character.position);
      if (d < bestNpcDist) {
        bestNpcDist = d;
        nearestNpc = npc;
      }
    }
    if (nearestNpc) {
      const profile = this.worldNpcProfiles.get(nearestNpc.id);
      if (profile) {
        const key = `npc-${profile.id}`;
        if (this.promptKey !== key) {
          this.promptKey = key;
          this.hud.setProximityPrompt({
            title: `${profile.gender === 'kadin' ? '👩' : '👨'} ${profile.name} (${profile.locationLabel})`,
            actionLabel: metin("MuseumWorld", "sohbet_davet_e"),
            onTrigger: () => {
              kidAudio.playSelect();
              this.openNpcModalForProfile(profile);
            },
          });
        }
        return;
      }
    }

    // 9. Adopted Companion Pet fallback (available anywhere without blocking museum stands/NPCs)
    if (nearPet && nearPet.adopted) {
      this.showPetProximityPrompt(nearPet);
      return;
    }

    if (this.promptKey !== '') {
      this.promptKey = '';
      this.hud.setProximityPrompt(null);
    }
  }

  private snapCameraImmediate(): void {
    this.updateThirdPersonCamera(5);
  }

  private updateThirdPersonCamera(dt: number): void {
    if (xb.core.renderer?.xr?.isPresenting) return;
    const camera = xb.core.camera;
    if (!camera) return;
    if (this.firstPerson) {
      this.updateFirstPersonCamera(camera);
      return;
    }

    this._camLookTarget.set(
      this.playerPos.x,
      this.playerPos.y + 1.35,
      this.playerPos.z
    );

    const inside = this.building.isInsideMuseum(this.playerPos);
    const effectiveDist = inside
      ? Math.min(this.camDistance, 4.15)
      : this.camDistance;

    const horiz = Math.cos(this.camPitch) * effectiveDist;
    const vert = Math.sin(this.camPitch) * effectiveDist;
    this._camTargetPos.set(
      this._camLookTarget.x + Math.sin(this.camYaw) * horiz,
      this._camLookTarget.y + vert,
      this._camLookTarget.z + Math.cos(this.camYaw) * horiz
    );

    if (inside) {
      this._camTargetPos.x = THREE.MathUtils.clamp(
        this._camTargetPos.x,
        -12.1,
        12.1
      );
      this._camTargetPos.z = THREE.MathUtils.clamp(
        this._camTargetPos.z,
        -22.5,
        -0.6
      );

      const inAtrium = this.building.isInAtriumVoid(
        this._camTargetPos.x,
        this._camTargetPos.z
      );
      const minY =
        this.currentFloor === 2 ? MUSEUM_FLOOR_2_Y + 1.2 : MUSEUM_FLOOR_Y + 1.3;
      const maxY =
        this.currentFloor === 1 && !inAtrium
          ? MUSEUM_FLOOR_2_Y - 0.55
          : MUSEUM_FLOOR_2_Y + 4.1;

      this._camTargetPos.y = THREE.MathUtils.clamp(
        this._camTargetPos.y,
        minY,
        maxY
      );
    }
    if (isInsideMosque(this.playerPos)) {
      this._camTargetPos.x = THREE.MathUtils.clamp(this._camTargetPos.x, MOSQUE_ORIGIN.x - 4.85, MOSQUE_ORIGIN.x + 4.0);
      this._camTargetPos.z = THREE.MathUtils.clamp(this._camTargetPos.z, MOSQUE_ORIGIN.z - 4.45, MOSQUE_ORIGIN.z + 4.45);
    }
    if (inObservatory(this.playerPos)) {
      this._camTargetPos.x = THREE.MathUtils.clamp(this._camTargetPos.x, OBSERVATORY_ORIGIN.x - 5.22, OBSERVATORY_ORIGIN.x + 5.22);
      this._camTargetPos.z = THREE.MathUtils.clamp(this._camTargetPos.z, OBSERVATORY_ORIGIN.z - 4.54, OBSERVATORY_ORIGIN.z + 4.78);
      this._camTargetPos.y = Math.min(this._camTargetPos.y, 2.48);
      this._camLookTarget.x -= Math.sin(this.camYaw) * 1.65;
      this._camLookTarget.z -= Math.cos(this.camYaw) * 1.65;
      this._camLookTarget.y += 0.35;
    }

    this.camLookCurrent.x = THREE.MathUtils.damp(
      this.camLookCurrent.x,
      this._camLookTarget.x,
      8,
      dt
    );
    this.camLookCurrent.y = THREE.MathUtils.damp(
      this.camLookCurrent.y,
      this._camLookTarget.y,
      8,
      dt
    );
    this.camLookCurrent.z = THREE.MathUtils.damp(
      this.camLookCurrent.z,
      this._camLookTarget.z,
      8,
      dt
    );

    this.camPosCurrent.x = THREE.MathUtils.damp(
      this.camPosCurrent.x,
      this._camTargetPos.x,
      8,
      dt
    );
    this.camPosCurrent.y = THREE.MathUtils.damp(
      this.camPosCurrent.y,
      this._camTargetPos.y,
      8,
      dt
    );
    this.camPosCurrent.z = THREE.MathUtils.damp(
      this.camPosCurrent.z,
      this._camTargetPos.z,
      8,
      dt
    );

    camera.position.copy(this.camPosCurrent);
    camera.lookAt(this.camLookCurrent);
  }

  private toggleCameraView(): boolean {
    this.firstPerson = !this.firstPerson;
    const camera = xb.core.camera;
    if (camera) {
      // Third person draws the avatar as well as the world.
      this.player.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) object.layers.set(this.firstPerson ? 3 : 0);
      });
      if (this.seatedSemaSeat) this.camYaw = this.seatedSemaSeat.yaw;
      this.snapCameraImmediate();
    }
    return this.firstPerson;
  }

  private updateFirstPersonCamera(camera: THREE.Camera): void {
    const yaw = this.camYaw;
    const pitch = this.firstPersonPitch;
    const eyeHeight = this.seatedSemaSeat ? 1.03 : 1.25;
    this._camTargetPos.copy(this.playerPos);
    this._camTargetPos.y += eyeHeight + this.player.getJumpHeight();
    this._camLookTarget.set(
      -Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      -Math.cos(yaw) * Math.cos(pitch)
    ).add(this._camTargetPos);
    camera.position.copy(this._camTargetPos);
    camera.lookAt(this._camLookTarget);
  }

  private syncActivityStatusPill(): void {
    const hsText = this.hideAndSeek.getStatusPillText();
    const boostText =
      this.appleBoostTimer > 0
        ? metin("MuseumWorld", "super_hiz_1_s", Math.ceil(this.appleBoostTimer))
        : null;
    const nextText = hsText ?? boostText;
    if (nextText !== this.lastPillText) {
      this.lastPillText = nextText;
      this.hud.setActivityStatus(nextText);
    }
  }

  private updateConcertAudio(dt: number): void {
    const distance = this.playerPos.distanceTo(CONCERT_ORIGIN);
    const muted = kidAudio.isAmbientMuted() || isInsideMosque(this.playerPos) ||
      this.building.isInsideMuseum(this.playerPos);
    const volume = muted ? 0 : 0.64 * THREE.MathUtils.clamp((13 - distance) / 7, 0, 1);
    this.concertPlayer.updateAudibility(volume);
    this.concertStage.updatePerformance(distance < 24, this.concertPlayer.playing, dt);
  }

  private updatePerformanceBudget(dt: number): void {
    if (xb.core.renderer?.xr?.isPresenting) return;
    this.lightTimer -= dt;
    if (this.lightTimer <= 0) {
      this.lightTimer = 0.45;
      const maxLights = DEVICE_QUALITY.isMobile ? 5 : 8;
      const maxDistSq = DEVICE_QUALITY.isMobile ? 256 : 900;
      for (const entry of this.localLights) {
        entry.light.getWorldPosition(this.lightPosition);
        entry.distance = entry.light.intensity > 0.01
          ? this.lightPosition.distanceToSquared(this.playerPos)
          : Infinity;
      }
      this.localLights.sort((a, b) => a.distance - b.distance);
      for (const [index, entry] of this.localLights.entries()) {
        entry.light.visible = index < maxLights && entry.distance < maxDistSq;
      }
    }
    if (this.photoStudioActive || dt <= 0 || document.hidden) return;
    this.frameMean += (dt - this.frameMean) * 0.045;
    this.qualityTimer += dt;
    if (this.qualityTimer < 2.5) return;
    this.qualityTimer = 0;
    const minScale = DEVICE_QUALITY.isMobile ? 0.9 : 1.0;
    const nextScale = this.frameMean > 1 / 28
      ? Math.max(minScale, this.mobileRenderScale - 0.1)
      : this.frameMean < 1 / 48
        ? Math.min(DEVICE_QUALITY.pixelRatio, this.mobileRenderScale + 0.05)
        : this.mobileRenderScale;
    if (nextScale === this.mobileRenderScale) return;
    this.mobileRenderScale = nextScale;
    xb.core.renderer?.setPixelRatio(nextScale);
  }

  private updateAreaVisibility(insideDeep: boolean): void {
    const xr = Boolean(xb.core.renderer?.xr?.isPresenting);
    const radiusPad = DEVICE_QUALITY.isMobile ? 0 : 8;
    const showOutdoors = xr || !insideDeep;
    const near = (point: THREE.Vector3, radius: number) =>
      xr ||
      (showOutdoors &&
        this.playerPos.distanceToSquared(point) < (radius + radiusPad) ** 2);

    this.cafe.visible = near(CAFE_ORIGIN, 34);
    this.karagozArea.visible = near(KARAGOZ_ORIGIN, 36);
    this.masalArea.visible = near(MASAL_ORIGIN, 36);
    this.semaAndMosque.visible =
      near(SEMA_STAGE_ORIGIN, 38) || near(MOSQUE_ORIGIN, 38);
    this.concertStage.visible = near(CONCERT_ORIGIN, 36);
    this.tileWorkshop.visible = near(TILE_WORKSHOP_ORIGIN, 32);
    this.tugArena.visible = near(TUG_ARENA_ORIGIN, 34);
    this.celikField.visible = near(CELIK_START, 34);
    this.photoBooth.visible = near(PHOTO_BOOTH_ORIGIN, 36);
    this.sazPavilionGroup.visible = near(SAZ_GAZEBO_POS, 34);
    this.heritageGarden.visible = showOutdoors;
    if (showOutdoors) {
      for (const area of this.heritageGarden.children) {
        area.visible = near(area.position, 36);
      }
    }
    for (const act of this.activityNpcs) {
      act.char.visible = showOutdoors;
    }
  }

  update(): void {
    const dt = Math.min(xb.getDeltaTime(), 0.05);
    this.syncExtraWallRects();
    this.updatePlayerMovement(dt);

    const inside = this.building.isInsideMuseum(this.playerPos);
    const insideDeep = inside && this.playerPos.z < -2.2;
    this.outdoor.setIndoorMode(insideDeep);
    this.updateAreaVisibility(insideDeep);
    this.updatePerformanceBudget(Math.min(xb.getDeltaTime(), 0.1));
    if (this.celikField.active && this.playerPos.distanceToSquared(CELIK_START) > 32) this.celikField.stop();
    this.celikField.updateFlight(dt);
    this.updateConcertAudio(dt);
    if (this.tileWorkshop.visible) this.tileWorkshop.updateNear(this.playerPos, dt);
    if (this.heritageGarden.visible) this.heritageGarden.updateNear(this.playerPos, dt);
    if (this.photoBooth.visible) this.photoBooth.updateNear(this.playerPos, dt, this.envFx.isNightTime());
    if (inside || this.playerPos.z < 5) this.director.updateWithPlayer(this.playerPos);
    this.updateNpcVisitors(dt, insideDeep);

    const isNightNow = this.envFx.isNightTime();
    this.updateVendorsAndSaz(dt, isNightNow, insideDeep);

    // Spatial audio update: museum music fades cleanly outside with distance; fountain & Saz nearby
    const inKaragozZone = !inside &&
      ((Math.abs(this.playerPos.x - KARAGOZ_ORIGIN.x) < 6.1 &&
        Math.abs(this.playerPos.z - KARAGOZ_ORIGIN.z) < 5.1) ||
        Boolean(this.seatedSemaSeat?.id.startsWith('karagoz-')));
    const insideMosque = isInsideMosque(this.playerPos);
    kidAudio.setQuietInterior(insideMosque);
    if (this.playerPos.distanceToSquared(HODJA_ORIGIN) > 100) kidAudio.stopHodjaRecording();
    const distFromEntrance = inside
      ? 0
      : Math.hypot(this.playerPos.x, Math.max(0, this.playerPos.z));
    const minFountainDist = Math.min(
      Math.hypot(this.playerPos.x - -7.5, this.playerPos.z - 8.2),
      Math.hypot(this.playerPos.x - 7.5, this.playerPos.z - 8.2)
    );
    const distToSaz = Math.hypot(
      this.playerPos.x - SAZ_GAZEBO_POS.x,
      this.playerPos.z - SAZ_GAZEBO_POS.z
    );
    const distToSema = Math.hypot(
      this.playerPos.x - SEMA_STAGE_ORIGIN.x,
      this.playerPos.z - SEMA_STAGE_ORIGIN.z
    );
    const distToMasal = Math.hypot(
      this.playerPos.x - MASAL_ORIGIN.x,
      this.playerPos.z - MASAL_ORIGIN.z
    );
    kidAudio.updateSpatialPosition(
      distFromEntrance,
      inside,
      minFountainDist,
      distToSaz,
      distToSema,
      distToMasal,
      inKaragozZone
    );
    let petWaitPos: THREE.Vector3 | undefined = insideMosque ? MOSQUE_PET_WAIT : undefined;
    let petWaitYaw: number | undefined;
    if (this.photoStudioActive) {
      const anchors = this.photoBooth.getStageAnchors();
      if (this.photoStudioCompanion === 'pet') {
        petWaitPos = anchors.petSoloPos;
        petWaitYaw = anchors.facingYaw;
      } else if (this.photoStudioCompanion === 'both') {
        petWaitPos = anchors.petGroupPos;
        petWaitYaw = anchors.facingYaw;
      } else {
        petWaitPos = PHOTO_BOOTH_VISIT_SPOT;
      }
    }
    this.pets.updateWithPlayer(
      dt,
      this.playerPos,
      this.playerYaw,
      petWaitPos,
      petWaitYaw,
      insideDeep
    );
    if (this.semaAndMosque.visible) this.semaAndMosque.updateWithPlayer(
      dt,
      this.playerPos,
      isNightNow ? 1 : 0,
      kidAudio.isSemaAudible()
    );

    const masalState = kidAudio.getMasalPlaybackState();
    if (!masalState.inZone) {
      this.masalBarDismissedInZone = false;
      this.socialModals.closeMasalBar();
    }

    const curtain = this.masalArea.getShadowCurtain();
    const syncCurtainToAudio =
      masalState.playing || (masalState.inZone && masalState.currentTime > 0.2);
    if (this.masalArea.visible) this.masalArea.updateWithPlayer(
      dt,
      this.playerPos,
      isNightNow ? 1 : 0,
      masalState.playing,
      masalState.currentTime,
      syncCurtainToAudio
    );
    this.karagozArea.updateWithPlayer(
      dt,
      this.playerPos,
      isNightNow ? 1 : 0,
      inside,
      insideMosque || kidAudio.isAmbientMuted()
    );
    this.hud.setKaragozLicenseVisible(inKaragozZone);

    if (
      masalState.inZone &&
      !this.masalBarDismissedInZone &&
      !this.socialModals.isBlockingModalOpen() &&
      !this.socialModals.isTugOverlayOpen() &&
      !this.gameModals.isOpen() &&
      !this.creativeModals.isOpen() &&
      !this.hud.isModalOpen()
    ) {
      const scene = curtain.getCurrentScene();
      this.socialModals.updateMasalBar({
        playing: masalState.playing,
        currentTime: masalState.currentTime,
        duration: masalState.duration,
        sceneSubtitle: scene.subtitle,
        sceneIndex: curtain.getCurrentSceneIndex(),
        sceneCount: curtain.getSceneCount(),
        isSeated: Boolean(this.seatedSemaSeat?.id.startsWith('masal-')),
      });
    } else if (this.socialModals.isMasalBarOpen()) {
      this.socialModals.closeMasalBar();
    }

    const clock = this.envFx.getClockState();
    const clockKey = `${clock.formatted}|${clock.periodLabel}|${clock.isNight ? 1 : 0}`;
    if (clockKey !== this.lastClockKey) {
      this.lastClockKey = clockKey;
      this.hud.setClockState(clock);
    }

    // Musical Hopscotch check outdoors (10-square stone throw + mini-hop)
    const hop = this.gardenProps.checkHopscotchStep(this.playerPos, dt);
    if (hop) {
      this.player.miniHop(2.5);
      kidAudio.playHopscotchNote(hop.step);
      kidAudio.playStoneToss();
      this.outdoor.highlightHopscotchTile(hop.step);
      this.outdoor.setHopscotchTarget(this.gardenProps.getHopscotchNextStep(), true);
      if (hop.completed) {
        kidAudio.playQuestVictory();
        this.triggerFullCelebration();
        this.unlockBadge('garden_explorer');
        this.addInventoryItem(
          'hopscotch-ribbon',
          metin("MuseumWorld", "seksek_sampiyonu_kurdelesi"),
          '🎀',
          'game',
          metin("MuseumWorld", "muze_bahcesindeki_10_adimli_muzikli_seksek_parkurunu")
        );
        this.hud.showToast(
          metin("MuseumWorld", "harika_10_adimli_muzikli_seksek_parkurunu_tamamladin")
        );
      } else {
        this.hud.showToast(
          metin("MuseumWorld", "seksek_1_2_tas_bir_sonraki_kareye", hop.tileNum, hop.total)
        );
      }
    }

    // Hide-and-Seek Manager update
    this.hideAndSeek.updateWithActors(
      dt,
      this.playerPos,
      this.player.isCrouching()
    );
    if (this.cafe.visible) this.cafe.updateWithPlayer(dt, this.playerPos);
    this.tugArena.updateWithActors(dt);
    if (this.hideAndSeek.getMode() !== 'hiding' && this.player.isCrouching()) {
      this.player.setCrouching(false);
    }
    this.syncActivityStatusPill();

    // Gentle turn for Activity NPCs when player comes close
    for (const act of this.activityNpcs) {
      const dist = Math.hypot(
        this.playerPos.x - act.pos.x,
        this.playerPos.z - act.pos.z
      );
      if (dist < 6.0 && this.playerPos.y < 1.5) {
        const yaw = Math.atan2(
          -(this.playerPos.x - act.pos.x),
          -(this.playerPos.z - act.pos.z)
        );
        act.char.rotation.y = lerpAngle(act.char.rotation.y, yaw, 5 * dt);
      }
    }

    // Interactive Garden Physics & NPC ball kick reactions
    const playerMoved = this.playerPos.distanceToSquared(this.prevPlayerPos) > 0.0001;
    this.gardenProps.updateWithActors(
      this.playerPos,
      playerMoved,
      this._npcOutdoorPositions,
      (npcIdx) => {
        kidAudio.playBallBounce();
        const npc = this.npcs[npcIdx];
        if (npc) {
          this.setNpcCustomBubble(
            npc,
            npcIdx % 2 === 0
              ? metin("MuseumWorld", "pas_geliyor_harika_vurus")
              : metin("MuseumWorld", "topu_yakaladim_sira_sende"),
            2.8
          );
        }
      },
      insideDeep
    );

    // Sync Day/Night, Rain & Handheld Lantern
    this.syncLanternState();

    // Update Hint Light Beam dynamically if active
    if (this.hintDestination) {
      const updated = this.computeHintDestination();
      if (updated) {
        this.hintDestination = updated.pos;
        this.envFx.updateGuidePositions(this.playerPos, updated.pos);
      }
    }

    this.updateNearbyInteractive();
    if (this.photoStudioActive) {
      this.updatePhotoStudioFrame(dt);
    } else {
      this.updateThirdPersonCamera(dt);
    }
    this.updateArtifactStandLOD(dt);
  }

  private openOrWalkToPhotoBooth(): void {
    const dist = Math.hypot(
      this.playerPos.x - PHOTO_BOOTH_ORIGIN.x,
      this.playerPos.z - PHOTO_BOOTH_ORIGIN.z
    );
    if (this.playerPos.y < 1.2 && dist < 5.5) {
      this.enterPhotoStudio();
      return;
    }
    if (this.seatedSemaSeat) this.standUpFromSemaSeat(false);
    if (this.building.isInsideMuseum(this.playerPos)) {
      this.playerPos.set(0, 0, 7.2);
      this.snapCameraImmediate();
    }
    this.clearAutoWalk();
    this.walkTarget = PHOTO_BOOTH_VISIT_SPOT.clone();
    this.pendingPhotoBoothAfterWalk = true;
    this.hud.showToast('📸 İstanbul Hatırası köşesine yürüyorsun...');
  }

  private enterPhotoStudio(): void {
    if (this.photoStudioActive) return;
    if (this.seatedSemaSeat) this.standUpFromSemaSeat(false);
    this.clearAutoWalk();
    this.photoStudioActive = true;
    this.photoSavedPlayerPos.copy(this.playerPos);
    this.photoSavedPlayerYaw = this.playerYaw;
    this.photoSavedCamYaw = this.camYaw;
    this.photoSavedCamPitch = this.camPitch;
    this.photoSavedFriendPos = null;

    // Hide tripod camera & photographer NPC plus floating sprites while framing the studio shot
    this.photoBooth.setCameraPropVisible(false);
    this.pets.setSpritesVisible(false);
    for (const n of this.npcs) n.bubbleSprite.visible = false;
    for (const a of this.activityNpcs) a.bubbleSprite.visible = false;
    for (const v of this.vendorNpcs) v.bubbleSprite.visible = false;

    const cam = xb.core.camera;
    if (cam instanceof THREE.PerspectiveCamera && !xb.core.renderer?.xr?.isPresenting) {
      this.photoSavedFov = cam.fov;
      cam.fov = 58;
      cam.updateProjectionMatrix();
    }

    // Ensure avatar is visible during photography even if the player was in first-person mode
    this.player.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) object.layers.set(0);
    });

    const friendOptions: PhotoFriendOption[] = this.npcs
      .filter((n) => n.waypoints[0].y < 0.2)
      .slice(0, 12)
      .map((n) => ({id: n.id, label: n.name}));

    const adoptedPet = this.pets.getAdoptedPet();
    this.photoStudioCompanion = 'solo';
    this.photoStudioPose = 'wave';
    this.photoBoothFriendId = friendOptions[0]?.id ?? null;

    kidAudio.playSelect();
    this.photoBoothModal.openStudio(friendOptions, adoptedPet ? adoptedPet.name : null);
    this.updatePhotoStudioFrame(5);
  }

  private releasePhotoStudioFriend(): void {
    if (!this.photoBoothFriendId || !this.photoSavedFriendPos) return;
    const prevFriend = this.worldNpcCharacters.get(this.photoBoothFriendId);
    if (prevFriend) {
      prevFriend.setPhotoPose('none');
      prevFriend.position.copy(this.photoSavedFriendPos);
      prevFriend.rotation.y = this.photoSavedFriendYaw;
    }
    this.photoSavedFriendPos = null;
  }

  private applyPhotoCompanion(mode: PhotoCompanionMode, friendId: string | null): void {
    const previousFriendId = this.photoBoothFriendId;
    if (previousFriendId && previousFriendId !== friendId) {
      this.releasePhotoStudioFriend();
    }
    this.photoStudioCompanion = mode;
    this.photoBoothFriendId = friendId;

    const usesFriend = mode === 'friend' || mode === 'both';
    if (!usesFriend) {
      this.releasePhotoStudioFriend();
    } else if (friendId) {
      const friend = this.worldNpcCharacters.get(friendId);
      if (friend && !this.photoSavedFriendPos) {
        this.photoSavedFriendPos = friend.position.clone();
        this.photoSavedFriendYaw = friend.rotation.y;
      }
      if (friend) {
        friend.setMoving(false);
        friend.setClapping(false);
        friend.setPhotoPose(
          this.photoStudioPose === 'sit'
            ? 'sit'
            : this.photoStudioPose === 'joy'
              ? 'joy'
              : 'wave'
        );
      }
    }

    if (this.photoStudioActive) {
      this.player.setPhotoPose(this.photoStudioPose);
      this.updatePhotoStudioFrame(5);
    }
  }

  private updatePhotoStudioFrame(dt: number): void {
    const anchors = this.photoBooth.getStageAnchors();
    const usesFriend =
      (this.photoStudioCompanion === 'friend' ||
        this.photoStudioCompanion === 'both') &&
      Boolean(this.photoBoothFriendId);
    const usesPet =
      this.photoStudioCompanion === 'pet' || this.photoStudioCompanion === 'both';

    const targetPlayerPos = usesFriend
      ? anchors.playerPairPos
      : usesPet
        ? anchors.playerPairPos
        : anchors.playerSoloPos;

    this.playerPos.copy(targetPlayerPos);
    this.playerYaw = anchors.facingYaw;
    this.player.position.copy(targetPlayerPos);
    this.player.rotation.y = anchors.facingYaw;
    this.player.setMoving(false);
    this.player.setPhotoPose(this.photoStudioPose);

    if (usesFriend && this.photoBoothFriendId) {
      const friend = this.worldNpcCharacters.get(this.photoBoothFriendId);
      if (friend) {
        friend.visible = true;
        friend.position.copy(anchors.friendPos);
        friend.rotation.y = anchors.facingYaw;
        friend.setMoving(false);
        friend.setLowDetailUpdate(false);
      }
    }

    const camera = xb.core.camera;
    if (camera && !xb.core.renderer?.xr?.isPresenting) {
      const dampRate = dt >= 4 ? 100 : 10;
      this.camPosCurrent.x = THREE.MathUtils.damp(this.camPosCurrent.x, anchors.camPos.x, dampRate, dt);
      this.camPosCurrent.y = THREE.MathUtils.damp(this.camPosCurrent.y, anchors.camPos.y, dampRate, dt);
      this.camPosCurrent.z = THREE.MathUtils.damp(this.camPosCurrent.z, anchors.camPos.z, dampRate, dt);
      this.camLookCurrent.x = THREE.MathUtils.damp(this.camLookCurrent.x, anchors.camLookAt.x, dampRate, dt);
      this.camLookCurrent.y = THREE.MathUtils.damp(this.camLookCurrent.y, anchors.camLookAt.y, dampRate, dt);
      this.camLookCurrent.z = THREE.MathUtils.damp(this.camLookCurrent.z, anchors.camLookAt.z, dampRate, dt);
      camera.position.copy(this.camPosCurrent);
      camera.lookAt(this.camLookCurrent);
    }
  }

  private captureIstanbulPhoto(): {
    canvas: HTMLCanvasElement;
    caption: string;
    filter: PhotoFilterMode;
  } | null {
    const renderer = xb.core.renderer;
    const domElement = renderer?.domElement;
    const camera = xb.core.camera;
    const scene = xb.core.scene;
    if (!renderer || !domElement || !camera || !scene) return null;

    // Snap camera strictly to anchor, keep camera tripod & floating sprites hidden for a clean shot
    this.updatePhotoStudioFrame(5);
    this.photoBooth.setCameraPropVisible(false);
    this.pets.setSpritesVisible(false);
    for (const n of this.npcs) n.bubbleSprite.visible = false;
    for (const a of this.activityNpcs) a.bubbleSprite.visible = false;
    for (const v of this.vendorNpcs) v.bubbleSprite.visible = false;

    scene.updateMatrixWorld(true);
    renderer.render(scene, camera);

    const snap = document.createElement('canvas');
    snap.width = domElement.width;
    snap.height = domElement.height;
    const snapCtx = snap.getContext('2d');
    if (snapCtx) {
      snapCtx.drawImage(domElement, 0, 0);
    }

    this.photoBooth.triggerFlash();
    kidAudio.playCameraShutter();
    this.unlockBadge('secret_hunter');

    const pet = this.pets.getAdoptedPet();
    const friend = this.photoBoothFriendId
      ? this.worldNpcProfiles.get(this.photoBoothFriendId)
      : undefined;
    let caption = 'Tek Kişilik Hatıra';
    if (this.photoStudioCompanion === 'friend' && friend) {
      caption = `${friend.name} ile Hatıra`;
    } else if (this.photoStudioCompanion === 'pet' && pet) {
      caption = `${pet.name} ile Dostluk Hatırası`;
    } else if (this.photoStudioCompanion === 'both' && friend && pet) {
      caption = `${friend.name} ve ${pet.name} ile Birlikte`;
    }

    this.addInventoryItem(
      'istanbul-hatirasi-photo',
      'İstanbul Hatırası Kartpostalı',
      '📸',
      'creative',
      `İstanbul Hatırası fonu önünde eski usul körüklü makineyle çekilen hatıra fotoğrafı (${caption}).`
    );

    return {
      canvas: snap,
      caption,
      filter: this.photoStudioFilter,
    };
  }

  private exitPhotoStudio(): void {
    if (!this.photoStudioActive) return;
    this.photoStudioActive = false;
    this.player.setPhotoPose('none');
    this.releasePhotoStudioFriend();
    this.photoBooth.setCameraPropVisible(true);
    this.pets.setSpritesVisible(true);

    const cam = xb.core.camera;
    if (cam instanceof THREE.PerspectiveCamera && !xb.core.renderer?.xr?.isPresenting) {
      cam.fov = this.photoSavedFov;
      cam.updateProjectionMatrix();
    }

    this.playerPos.copy(this.photoSavedPlayerPos);
    this.playerYaw = this.photoSavedPlayerYaw;
    this.camYaw = this.photoSavedCamYaw;
    this.camPitch = this.photoSavedCamPitch;
    this.player.position.copy(this.playerPos);
    this.player.rotation.y = this.playerYaw;
    this.player.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        object.layers.set(this.firstPerson ? 3 : 0);
      }
    });
    this.snapCameraImmediate();
  }

  private updateArtifactStandLOD(dt: number): void {
    if (this.stands.length === 0) return;
    const camera = xb.core.camera as THREE.PerspectiveCamera | undefined;
    if (!camera) return;

    camera.updateMatrixWorld();
    this._projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    this._frustum.setFromProjectionMatrix(this._projScreenMatrix);

    let activeLoads = 0;
    const candidates: Array<{
      stand: ArtifactStand;
      dist: number;
      tier: 'low' | 'high';
    }> = [];

    for (const stand of this.stands) {
      if (stand.isLoadingTexture()) {
        activeLoads++;
      }

      stand.getWorldCenter(this._standCenter);
      const dist = camera.position.distanceTo(this._standCenter);
      this._standSphere.set(this._standCenter, stand.getBoundingRadius());
      const inFrustum = this._frustum.intersectsSphere(this._standSphere);

      if (!inFrustum || dist > DEVICE_QUALITY.lodUnloadDist) {
        stand.markOutOfView(
          dt,
          DEVICE_QUALITY.frustumGraceSec,
          dist > DEVICE_QUALITY.lodUnloadDist
        );
        continue;
      }

      stand.markInView();

      if (dist <= DEVICE_QUALITY.lodHighDist) {
        candidates.push({stand, dist, tier: 'high'});
      } else if (dist <= DEVICE_QUALITY.lodMidDist) {
        candidates.push({stand, dist, tier: 'low'});
      }
    }

    if (
      candidates.length === 0 ||
      activeLoads >= DEVICE_QUALITY.maxConcurrentTextureLoads
    ) {
      return;
    }

    candidates.sort((a, b) => a.dist - b.dist);
    let started = 0;
    for (const cand of candidates) {
      if (
        activeLoads >= DEVICE_QUALITY.maxConcurrentTextureLoads ||
        started >= DEVICE_QUALITY.maxLoadStartsPerFrame
      ) {
        break;
      }
      if (cand.stand.requestLodTier(cand.tier)) {
        activeLoads++;
        started++;
      }
    }
  }

  private claimMazeCrownPrize(): void {
    if (!this.gardenProps.claimMazeCrown()) return;
    this.outdoor.setMazeCrownClaimed(true);
    this.player.setMazeCrownEquipped(true);
    const isKing = this.player.getActiveStyle() === 'erkek';
    const crownTitle = isKing ? metin("MuseumWorld", "altin_kral_taci") : metin("MuseumWorld", "altin_kralice_taci");

    kidAudio.playQuestVictory();
    this.triggerFullCelebration(
      this.gardenProps
        .getMazeCrownPosition()
        .clone()
        .add(new THREE.Vector3(0, 1.0, 0))
    );
    this.unlockBadge('maze_champion');
    this.addInventoryItem(
      'maze-crown',
      crownTitle,
      '👑',
      'treasure',
      metin("MuseumWorld", "dev_bahce_simsir_labirentinin_merkezinden_kazanilip_basina", crownTitle)
    );
    this.hud.showToast(
      metin("MuseumWorld", "inanilmaz_labirenti_fethedip_basina_1_taktin", crownTitle)
    );
  }

  private updateVendorsAndSaz(dt: number, isNight: boolean, insideDeep = false): void {
    if (insideDeep && !xb.core.renderer?.xr?.isPresenting) {
      this.sazNpcChar.visible = false;
      for (const note of this.sazNoteSprites) {
        note.sprite.visible = false;
      }
      for (const v of this.vendorNpcs) {
        v.char.visible = false;
        v.char.setMoving(false);
      }
      return;
    }

    this.sazNpcChar.visible = this.sazPavilionGroup.visible;
    const t = performance.now() * 0.001;
    const sazActive = this.sazPavilionGroup.visible && !kidAudio.isSazPaused();
    for (const note of this.sazNoteSprites) {
      note.sprite.visible = sazActive;
      if (sazActive) {
        note.sprite.position.y =
          note.basePos.y + Math.sin(t * 2.4 + note.phase) * 0.14;
        note.sprite.position.x =
          note.basePos.x + Math.cos(t * 1.6 + note.phase) * 0.08;
      }
    }

    for (const v of this.vendorNpcs) {
      const shouldShow = v.kind === 'siraci' ? !isNight : isNight;
      v.char.visible = shouldShow;
      if (!shouldShow) {
        v.char.setMoving(false);
        continue;
      }

      v.bubbleSprite.position.y = 2.26 + Math.sin(t * 3.1 + v.wpIdx) * 0.04;
      v.shoutTimer -= dt;
      if (v.shoutTimer <= 0) {
        v.shoutTimer = 4.6;
        v.quoteIdx = (v.quoteIdx + 1) % v.quotes.length;
        const bg =
          v.kind === 'siraci'
            ? 'rgba(107, 33, 168, 0.96)'
            : 'rgba(30, 27, 75, 0.96)';
        const stroke = v.kind === 'siraci' ? '#e9d5ff' : '#fbbf24';
        const textColor = v.kind === 'siraci' ? '#ffffff' : '#fef08a';
        const nextTex = createSpeechBubbleTexture(
          v.quotes[v.quoteIdx],
          bg,
          stroke,
          textColor
        );
        v.bubbleMat.map = nextTex;
        v.bubbleMat.needsUpdate = true;
        v.bubbleTex.dispose();
        v.bubbleTex = nextTex;
      }

      if (v.waitTimer > 0) {
        v.waitTimer -= dt;
        v.char.setMoving(false);
        continue;
      }
      const wp = v.waypoints[v.wpIdx];
      const dx = wp.x - v.char.position.x;
      const dz = wp.z - v.char.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.25) {
        v.wpIdx = (v.wpIdx + 1) % v.waypoints.length;
        v.waitTimer = 1.8 + Math.random() * 1.4;
        v.char.setMoving(false);
      } else {
        v.char.position.x += (dx / dist) * v.speed * dt;
        v.char.position.z += (dz / dist) * v.speed * dt;
        const yaw = Math.atan2(-(dx / dist), -(dz / dist));
        v.char.rotation.y = lerpAngle(v.char.rotation.y, yaw, 6 * dt);
        v.char.setMoving(true);
      }
    }
  }

  dispose(): void {
    window.removeEventListener('resize', this.onQualityResize);
    this.detachInputListeners();
    this.clearStands();
    for (const npc of this.npcs) {
      npc.bubbleTex?.dispose();
      npc.bubbleMat.dispose();
      npc.character.dispose();
    }
    this.npcs = [];
    for (const act of this.activityNpcs) {
      act.bubbleTex.dispose();
      act.bubbleMat.dispose();
      act.char.dispose();
    }
    this.activityNpcs = [];
    for (const v of this.vendorNpcs) {
      v.bubbleTex.dispose();
      v.bubbleMat.dispose();
      v.char.dispose();
    }
    this.vendorNpcs = [];
    for (const d of this.sazDisposables) {
      d.dispose();
    }
    this.sazDisposables = [];
    this.sazNpcChar?.dispose();
    this.worldNpcProfiles.clear();
    this.worldNpcCharacters.clear();
    this.pets.dispose();
    this.semaAndMosque.dispose();
    this.masalArea.dispose();
    this.karagozArea.dispose();
    this.tileWorkshop.dispose();
    this.heritageGarden.dispose();
    this.photoBooth.dispose();
    this.concertStage.dispose();
    this.celikField.dispose();
    this.concertPlayer.dispose();
    this.hideAndSeek.dispose();
    this.cafe.dispose();
    this.tugArena.dispose();
    this.director.dispose();
    this.photoBoothModal?.dispose();
    this.socialModals.dispose();
    this.gameModals.dispose();
    this.creativeModals.dispose();
    this.hud.dispose();
    kidAudio.dispose();
    document.body.style.cursor = 'default';
  }
}

function createSpeechBubbleTexture(
  text: string,
  fillStyle = 'rgba(255, 251, 240, 0.96)',
  strokeStyle = '#d97706',
  textColor = '#0f172a'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 196;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.roundRect(14, 10, 612, 146, 30);
    ctx.fill();

    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(300, 152);
    ctx.lineTo(340, 152);
    ctx.lineTo(320, 188);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(301, 156);
    ctx.lineTo(320, 188);
    ctx.lineTo(339, 156);
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.font = 'bold 27px "Google Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const words = text.split(/\s+/u);
    const lines: string[] = [];
    let current = '';
    const maxWidth = 556;
    for (const w of words) {
      const candidate = current ? `${current} ${w}` : w;
      if (current && ctx.measureText(candidate).width > maxWidth) {
        lines.push(current);
        current = w;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);

    const visibleLines = lines.slice(0, 3);
    const lineHeight = 36;
    const centerY = 82;
    const firstY = centerY - ((visibleLines.length - 1) * lineHeight) / 2;
    visibleLines.forEach((line, idx) => {
      ctx.fillText(line, 320, firstY + idx * lineHeight);
    });
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function lerpAngle(current: number, target: number, alpha: number): number {
  let diff = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * Math.min(1, alpha);
}
