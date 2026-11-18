import {metin} from "../metinler.ts";
import * as THREE from 'three';
import * as xb from 'xrblocks';

import {type CharacterStyleId, ExplorerCharacter} from './ExplorerCharacter.ts';
import {
  type HidingSpot,
  MUSEUM_FLOOR_2_Y,
  MUSEUM_FLOOR_Y,
} from './MuseumBuilding.ts';

export type HideSeekMode = 'idle' | 'countdown' | 'seeking' | 'hiding';
export type HidePhase = 'prep' | 'searching';

export interface HideSeekResult {
  mode: 'seek' | 'hide';
  won: boolean;
  message: string;
}

export interface HideSeekCallbacks {
  onCountdownTick?: (secondsLeft: number) => void;
  onSeekStarted?: () => void;
  onKidFound?: (kidName: string, foundCount: number, total: number) => void;
  onSearchPhaseStarted?: () => void;
  onGameFinished: (result: HideSeekResult) => void;
  onPhaseBanner?: (
    title: string,
    subtitle: string,
    tone: 'info' | 'warn' | 'win' | 'lose'
  ) => void;
  onToast?: (msg: string) => void;
}

interface HideSeekKid {
  id: number;
  name: string;
  char: ExplorerCharacter;
  homeOffset: THREE.Vector3;
  waypoints: THREE.Vector3[];
  wpIndex: number;
  speed: number;
  targetSpot: HidingSpot | null;
  found: boolean;
  isSeeker: boolean;
  seekerRing: THREE.Mesh;
  bubbleSprite: THREE.Sprite;
  bubbleMat: THREE.SpriteMaterial;
  bubbleTex: THREE.CanvasTexture | null;
  bubbleTimer: number;
}

const STATION_POS = new THREE.Vector3(-8.0, MUSEUM_FLOOR_Y, -3.8);

const KID_SPECS: Array<{
  name: string;
  style: CharacterStyleId;
  variant: number;
  homeOffset: [number, number];
}> = [
  {name: metin("HideAndSeekManager", "mert"), style: 'erkek', variant: 0, homeOffset: [-1.25, 0.95]},
  {name: metin("HideAndSeekManager", "zeynep"), style: 'kadin', variant: 1, homeOffset: [1.25, 0.95]},
  {name: metin("HideAndSeekManager", "aras"), style: 'erkek', variant: 2, homeOffset: [-1.1, -1.05]},
  {name: metin("HideAndSeekManager", "defne"), style: 'kadin', variant: 3, homeOffset: [1.1, -1.05]},
];

export class HideAndSeekManager extends xb.Script {
  private callbacks?: HideSeekCallbacks;
  private kids: HideSeekKid[] = [];
  private interactiveMeshes: THREE.Object3D[] = [];
  private disposables: Array<{dispose: () => void}> = [];

  private mode: HideSeekMode = 'idle';
  private hidePhase: HidePhase = 'prep';
  private countdownTimer = 0;
  private lastWholeCountdown = -1;
  private gameTimer = 0;
  private hidingSpots: HidingSpot[] = [];
  private invitedIds = new Set<string>();

  private pillarRing?: THREE.Mesh;
  private beaconGem?: THREE.Mesh;
  private seekerRingGeo?: THREE.TorusGeometry;
  private seekerRingMat?: THREE.MeshBasicMaterial;
  private time = 0;

  setCallbacks(callbacks: HideSeekCallbacks): void {
    this.callbacks = callbacks;
  }

  private track<T extends {dispose: () => void}>(item: T): T {
    this.disposables.push(item);
    return item;
  }

  init(): void {
    this.buildStation();
    this.spawnHideSeekKids();
  }

  private buildStation(): void {
    const group = new THREE.Group();
    group.position.copy(STATION_POS);

    const carpetMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x7c3aed,
        roughness: 0.78,
      })
    );
    const goldMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        metalness: 0.78,
        roughness: 0.24,
      })
    );
    const stoneMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xc8b598,
        roughness: 0.65,
      })
    );

    const rug = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(1.55, 1.62, 0.035, 32)),
      carpetMat
    );
    rug.position.y = 0.018;
    rug.receiveShadow = true;
    rug.userData.hideSeekStation = true;

    this.pillarRing = new THREE.Mesh(
      this.track(new THREE.TorusGeometry(1.52, 0.055, 10, 36)),
      goldMat
    );
    this.pillarRing.rotation.x = Math.PI / 2;
    this.pillarRing.position.y = 0.05;
    this.pillarRing.userData.hideSeekStation = true;

    // Central "Ebe Taşı" stone plinth
    const ebeBase = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.46, 0.56, 0.68, 12)),
      stoneMat
    );
    ebeBase.position.y = 0.34;
    ebeBase.castShadow = true;
    ebeBase.receiveShadow = true;
    ebeBase.userData.hideSeekStation = true;

    const ebeCap = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.5, 0.48, 0.1, 12)),
      goldMat
    );
    ebeCap.position.y = 0.72;
    ebeCap.userData.hideSeekStation = true;

    this.beaconGem = new THREE.Mesh(
      this.track(new THREE.OctahedronGeometry(0.24, 0)),
      this.track(
        new THREE.MeshStandardMaterial({
          color: 0xa855f7,
          emissive: 0x7c3aed,
          emissiveIntensity: 0.85,
          roughness: 0.2,
          metalness: 0.45,
        })
      )
    );
    this.beaconGem.position.y = 1.25;
    this.beaconGem.userData.hideSeekStation = true;

    // Floating signboard "SAKLAMBAÇ"
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 170;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.roundRect(8, 8, 496, 154, 24);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 7;
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 34px "Google Sans", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(metin("HideAndSeekManager", "saklambac_alani"), 256, 56);

      ctx.fillStyle = '#e0e7ff';
      ctx.font = 'bold 24px "Google Sans", Arial, sans-serif';
      ctx.fillText(metin("HideAndSeekManager", "ebe_tasi"), 256, 114);
    }
    const tex = this.track(new THREE.CanvasTexture(canvas));
    tex.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(1.72, 0.57)),
      this.track(
        new THREE.MeshBasicMaterial({map: tex, side: THREE.DoubleSide})
      )
    );
    sign.position.set(0, 1.98, 0);
    sign.rotation.y = 0.45;
    sign.userData.hideSeekStation = true;

    group.add(rug, this.pillarRing, ebeBase, ebeCap, this.beaconGem, sign);
    this.add(group);
    this.interactiveMeshes.push(rug, ebeBase, ebeCap, this.beaconGem, sign);
  }

  private spawnHideSeekKids(): void {
    this.seekerRingGeo = this.track(new THREE.TorusGeometry(0.32, 0.045, 8, 22));
    this.seekerRingMat = this.track(
      new THREE.MeshBasicMaterial({color: 0xef4444})
    );

    const idleQuotes = [
      metin("HideAndSeekManager", "saklambac_oynayalim_mi"),
      metin("HideAndSeekManager", "muzenin_her_kosesi_super_saklanma_yeri"),
      metin("HideAndSeekManager", "ebe_olmaya_hazir_misin"),
      metin("HideAndSeekManager", "1_ve_2_katta_serbestce_saklanalim"),
    ];

    KID_SPECS.forEach((spec, idx) => {
      this.createHideSeekActor(
        idx,
        spec.name,
        spec.style,
        idx,
        new THREE.Vector3(spec.homeOffset[0], 0, spec.homeOffset[1]),
        idleQuotes[idx % idleQuotes.length],
        idx % 2 === 0
      );
    });
  }

  private createHideSeekActor(
    id: number,
    name: string,
    style: CharacterStyleId,
    variant: number,
    homeOffset: THREE.Vector3,
    initialQuote: string,
    startVisible: boolean
  ): HideSeekKid {
    const char = new ExplorerCharacter(style, variant, 'hideseek');
    char.scale.setScalar(0.86);
    char.position.copy(STATION_POS).add(homeOffset);
    char.rotation.y = Math.atan2(
      STATION_POS.x - char.position.x,
      STATION_POS.z - char.position.z
    );

    char.traverse((obj) => {
      obj.userData.hideSeekKidId = id;
    });
    this.interactiveMeshes.push(char);
    this.add(char);

    const seekerRing = new THREE.Mesh(this.seekerRingGeo!, this.seekerRingMat!);
    seekerRing.rotation.x = Math.PI / 2;
    seekerRing.position.set(0, 1.72, 0);
    seekerRing.visible = false;
    char.add(seekerRing);

    const bubbleTex = createKidBubbleTexture(initialQuote, false);
    const bubbleMat = this.track(
      new THREE.SpriteMaterial({
        map: bubbleTex,
        transparent: true,
        depthWrite: false,
      })
    );
    const bubbleSprite = new THREE.Sprite(bubbleMat);
    bubbleSprite.scale.set(2.15, 0.66, 1);
    bubbleSprite.position.set(0, 2.08, 0);
    bubbleSprite.visible = startVisible;
    char.add(bubbleSprite);

    const kid: HideSeekKid = {
      id,
      name,
      char,
      homeOffset,
      waypoints: [],
      wpIndex: 0,
      speed: 5.5,
      targetSpot: null,
      found: false,
      isSeeker: false,
      seekerRing,
      bubbleSprite,
      bubbleMat,
      bubbleTex,
      bubbleTimer: startVisible ? 4.0 : 0,
    };
    this.kids.push(kid);
    return kid;
  }

  inviteVisitor(
    uniqueId: string,
    name: string,
    style: CharacterStyleId,
    variant: number
  ): {added: boolean; totalCount: number} {
    if (this.invitedIds.has(uniqueId) || this.kids.length >= 10) {
      return {added: false, totalCount: this.kids.length};
    }
    this.invitedIds.add(uniqueId);
    const nextId = this.kids.length;
    const angle = (nextId * 2.15) % (Math.PI * 2);
    const r = 1.65 + (nextId % 2) * 0.45;
    const offset = new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r);
    this.createHideSeekActor(
      nextId,
      name,
      style,
      variant,
      offset,
      metin("HideAndSeekManager", "ben_1_saklambaca_katildim", name),
      true
    );
    return {added: true, totalCount: this.kids.length};
  }

  getKidCount(): number {
    return this.kids.length;
  }

  private setKidBubble(
    kid: HideSeekKid,
    text: string,
    duration = 3.5,
    isEbeStyle = false
  ): void {
    const tex = createKidBubbleTexture(text, isEbeStyle);
    kid.bubbleMat.map = tex;
    kid.bubbleMat.needsUpdate = true;
    kid.bubbleTex?.dispose();
    kid.bubbleTex = tex;
    kid.bubbleSprite.visible = true;
    kid.bubbleTimer = duration;
  }

  private buildFloorAwarePath(
    from: THREE.Vector3,
    to: THREE.Vector3
  ): THREE.Vector3[] {
    const fromFloor = from.y > 2.8 ? 2 : 1;
    const toFloor = to.y > 2.8 ? 2 : 1;
    if (fromFloor === toFloor) {
      return [to.clone()];
    }

    const stairX = from.x + to.x < 0 ? -5.4 : 5.4;
    if (fromFloor === 1 && toFloor === 2) {
      return [
        new THREE.Vector3(stairX, MUSEUM_FLOOR_Y, -14.7),
        new THREE.Vector3(stairX, MUSEUM_FLOOR_2_Y, -5.5),
        to.clone(),
      ];
    }
    return [
      new THREE.Vector3(stairX, MUSEUM_FLOOR_2_Y, -5.5),
      new THREE.Vector3(stairX, MUSEUM_FLOOR_Y, -14.7),
      to.clone(),
    ];
  }

  startSeekMode(spots: HidingSpot[]): void {
    this.hidingSpots = spots;
    this.mode = 'countdown';
    this.countdownTimer = 5.0;
    this.lastWholeCountdown = 5;
    this.gameTimer = 52.0;

    // Prioritize deeper, tucked hiding spots (paravans, distant columns, 2nd floor corners)
    const isHardSpot = (s: HidingSpot) =>
      s.floor === 2 ||
      s.pos.z < -15 ||
      s.id.includes('paravan') ||
      s.id.includes('corner');
    const hardSpots = spots.filter(isHardSpot).sort(() => Math.random() - 0.5);
    const otherSpots = spots.filter((s) => !isHardSpot(s)).sort(() => Math.random() - 0.5);
    const orderedPool: HidingSpot[] = [...hardSpots, ...otherSpots];

    this.kids.forEach((kid, idx) => {
      kid.found = false;
      kid.isSeeker = false;
      kid.seekerRing.visible = false;
      kid.char.setCrouching(false);
      kid.char.visible = true;
      const spot =
        orderedPool.length > 0 ? orderedPool[idx % orderedPool.length] : null;
      kid.targetSpot = spot;
      if (spot) {
        const offsetAngle = (idx * Math.PI) / 3 + 0.35;
        const hideGoal = new THREE.Vector3(
          spot.pos.x + Math.cos(offsetAngle) * 0.35,
          spot.pos.y,
          spot.pos.z + Math.sin(offsetAngle) * 0.35
        );
        kid.waypoints = this.buildFloorAwarePath(kid.char.position, hideGoal);
      }
      kid.wpIndex = 0;
      kid.speed = 6.9;
      this.setKidBubble(kid, metin("HideAndSeekManager", "saklaniyorum_beni_kolay_bulamayacaksin"), 3.2);
    });

    this.callbacks?.onPhaseBanner?.(
      metin("HideAndSeekManager", "saklambac_basladi_5_sn_sayim"),
      metin("HideAndSeekManager", "1_arkadasin_1_ve_2_katin_en", this.kids.length),
      'info'
    );
    this.callbacks?.onCountdownTick?.(5);
  }

  startHideMode(spots: HidingSpot[]): void {
    this.hidingSpots = spots;
    this.mode = 'hiding';
    this.hidePhase = 'prep';
    this.countdownTimer = 10.0;
    this.lastWholeCountdown = 10;
    this.gameTimer = 28.0;

    this.kids.forEach((kid, idx) => {
      kid.found = false;
      kid.isSeeker = idx < Math.max(2, Math.floor(this.kids.length / 2));
      kid.seekerRing.visible = kid.isSeeker;
      kid.char.setCrouching(false);
      kid.targetSpot = null;
      const homeGoal = STATION_POS.clone().add(kid.homeOffset);
      kid.waypoints = this.buildFloorAwarePath(kid.char.position, homeGoal);
      kid.wpIndex = 0;
      kid.speed = 4.6;
      if (kid.isSeeker) {
        this.setKidBubble(
          kid,
          metin("HideAndSeekManager", "ebe_1_1_2_3_saklan", kid.name),
          9.5,
          true
        );
      } else {
        this.setKidBubble(kid, metin("HideAndSeekManager", "muzenin_kuytu_bir_kosesine_gizlen"), 4.2);
      }
    });

    this.callbacks?.onPhaseBanner?.(
      metin("HideAndSeekManager", "saklanma_basladi_10_sn"),
      metin("HideAndSeekManager", "muze_icinde_diledigin_yere_kos_ve_e"),
      'info'
    );
    this.callbacks?.onCountdownTick?.(10);
  }

  stopGame(): void {
    this.mode = 'idle';
    this.kids.forEach((kid) => {
      kid.found = false;
      kid.isSeeker = false;
      kid.seekerRing.visible = false;
      kid.char.setCrouching(false);
      kid.targetSpot = null;
      const goal = STATION_POS.clone().add(kid.homeOffset);
      kid.waypoints = this.buildFloorAwarePath(kid.char.position, goal);
      kid.wpIndex = 0;
      kid.speed = 4.0;
    });
  }

  getMode(): HideSeekMode {
    return this.mode;
  }

  getHidePhase(): HidePhase {
    return this.hidePhase;
  }

  getStationPos(): THREE.Vector3 {
    return STATION_POS;
  }

  isNearStation(playerPos: THREE.Vector3, maxDist = 2.6): boolean {
    if (Math.abs(playerPos.y - STATION_POS.y) > 1.5) return false;
    return (
      Math.hypot(playerPos.x - STATION_POS.x, playerPos.z - STATION_POS.z) <
      maxDist
    );
  }

  getInteractiveMeshes(): THREE.Object3D[] {
    return this.interactiveMeshes;
  }

  getNearestHideSpot(
    playerPos: THREE.Vector3,
    spots: HidingSpot[],
    maxDist = 2.1
  ): HidingSpot | null {
    let best: HidingSpot | null = null;
    let bestD = maxDist;
    for (const s of spots) {
      if (Math.abs(playerPos.y - s.pos.y) > 1.5) continue;
      const d = Math.hypot(playerPos.x - s.pos.x, playerPos.z - s.pos.z);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    return best;
  }

  getNearestUntaggedKid(
    playerPos: THREE.Vector3,
    maxDist = 2.6
  ): {id: number; name: string} | null {
    if (this.mode !== 'seeking') return null;
    let best: HideSeekKid | null = null;
    let bestD = maxDist;
    for (const kid of this.kids) {
      if (kid.found) continue;
      if (Math.abs(playerPos.y - kid.char.position.y) > 1.6) continue;
      const d = Math.hypot(
        playerPos.x - kid.char.position.x,
        playerPos.z - kid.char.position.z
      );
      if (d < bestD) {
        bestD = d;
        best = kid;
      }
    }
    return best ? {id: best.id, name: best.name} : null;
  }

  tryTagKidById(id: number, playerPos: THREE.Vector3): boolean {
    if (this.mode !== 'seeking') return false;
    const kid = this.kids.find((k) => k.id === id);
    if (!kid || kid.found) return false;
    const dist = Math.hypot(
      playerPos.x - kid.char.position.x,
      playerPos.z - kid.char.position.z
    );
    if (dist > 4.2 || Math.abs(playerPos.y - kid.char.position.y) > 1.8) {
      this.callbacks?.onToast?.(
        metin("HideAndSeekManager", "1_e_biraz_daha_yaklas_ve_sobele", kid.name)
      );
      return false;
    }

    kid.found = true;
    kid.char.setCrouching(false);
    const homeGoal = STATION_POS.clone().add(kid.homeOffset);
    kid.waypoints = this.buildFloorAwarePath(kid.char.position, homeGoal);
    kid.wpIndex = 0;
    kid.speed = 4.6;
    this.setKidBubble(kid, metin("HideAndSeekManager", "sobe_beni_buldun"), 3.6);

    const foundCount = this.kids.filter((k) => k.found).length;
    this.callbacks?.onKidFound?.(kid.name, foundCount, this.kids.length);

    if (foundCount >= this.kids.length) {
      this.mode = 'idle';
      this.callbacks?.onPhaseBanner?.(
        metin("HideAndSeekManager", "saklambac_kazanildi"),
        metin("HideAndSeekManager", "tum_1_arkadasini_sure_dolmadan_sobeleyip_sampiyon", this.kids.length),
        'win'
      );
      this.callbacks?.onGameFinished({
        mode: 'seek',
        won: true,
        message: metin("HideAndSeekManager", "harikasin_saklanan_1_arkadasinin_tamamini_sobeleyip_oyunu", this.kids.length),
      });
    }
    return true;
  }

  tryPlayerSobeAtStation(playerPos: THREE.Vector3): boolean {
    if (this.mode !== 'hiding' || this.hidePhase !== 'searching') return false;
    if (!this.isNearStation(playerPos, 2.5)) return false;
    this.stopGame();
    this.callbacks?.onPhaseBanner?.(
      metin("HideAndSeekManager", "sobe_kazandin"),
      metin("HideAndSeekManager", "ebelere_yakalanmadan_ebe_tasina_ulasip_zaferi_kaptin"),
      'win'
    );
    this.callbacks?.onGameFinished({
      mode: 'hide',
      won: true,
      message: metin("HideAndSeekManager", "ebe_tasi_na_ebelenmeden_ulasip_sobeledin_harika"),
    });
    return true;
  }

  getStatusPillText(): string | null {
    if (this.mode === 'countdown') {
      return metin("HideAndSeekManager", "ebe_sayiyor_1_s", Math.max(1, Math.ceil(this.countdownTimer)));
    }
    if (this.mode === 'seeking') {
      const found = this.kids.filter((k) => k.found).length;
      return metin("HideAndSeekManager", "bulunan_1_2_3_s", found, this.kids.length, Math.ceil(this.gameTimer));
    }
    if (this.mode === 'hiding') {
      if (this.hidePhase === 'prep') {
        return metin("HideAndSeekManager", "saklan_1_s", Math.max(1, Math.ceil(this.countdownTimer)));
      }
      return metin("HideAndSeekManager", "ebeler_ariyor_1_s", Math.ceil(this.gameTimer));
    }
    return null;
  }

  private stepKidAlongPath(kid: HideSeekKid, dt: number): boolean {
    if (kid.wpIndex >= kid.waypoints.length) {
      kid.char.setMoving(false);
      return true;
    }

    const target = kid.waypoints[kid.wpIndex];
    const dx = target.x - kid.char.position.x;
    const dz = target.z - kid.char.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 0.24) {
      kid.char.position.x = target.x;
      kid.char.position.z = target.z;
      kid.char.position.y = target.y;
      kid.wpIndex++;
      if (kid.wpIndex >= kid.waypoints.length) {
        kid.char.setMoving(false);
        return true;
      }
      return false;
    }

    const step = Math.min(dist, kid.speed * dt);
    kid.char.position.x += (dx / dist) * step;
    kid.char.position.z += (dz / dist) * step;

    // Smooth elevation across the museum grand staircases
    const absX = Math.abs(kid.char.position.x);
    if (
      absX >= 4.2 &&
      absX <= 6.6 &&
      kid.char.position.z >= -14.3 &&
      kid.char.position.z <= -5.9
    ) {
      const t = THREE.MathUtils.clamp(
        (kid.char.position.z - -14.2) / (-6.0 - -14.2),
        0,
        1
      );
      kid.char.position.y = THREE.MathUtils.lerp(
        MUSEUM_FLOOR_Y,
        MUSEUM_FLOOR_2_Y,
        t
      );
    } else {
      kid.char.position.y = THREE.MathUtils.damp(
        kid.char.position.y,
        target.y,
        10,
        dt
      );
    }

    const yaw = Math.atan2(-(dx / dist), -(dz / dist));
    kid.char.rotation.y = yaw;
    kid.char.setMoving(true);
    return false;
  }

  private assignNextSeekerPatrol(kid: HideSeekKid): void {
    if (this.hidingSpots.length === 0) return;
    const nextSpot =
      this.hidingSpots[Math.floor(Math.random() * this.hidingSpots.length)];
    kid.targetSpot = nextSpot;
    const goal = new THREE.Vector3(nextSpot.pos.x, nextSpot.pos.y, nextSpot.pos.z);
    kid.waypoints = this.buildFloorAwarePath(kid.char.position, goal);
    kid.wpIndex = 0;
    kid.speed = 3.6;
  }

  updateWithActors(
    dt: number,
    playerPos: THREE.Vector3,
    playerCrouching: boolean
  ): void {
    this.time += dt;

    if (this.beaconGem) {
      this.beaconGem.rotation.y += dt * 1.8;
      this.beaconGem.position.y = 1.25 + Math.sin(this.time * 2.5) * 0.08;
    }
    if (this.pillarRing) {
      this.pillarRing.rotation.z += dt * 0.6;
    }

    // Update kid bubbles & paths
    for (const kid of this.kids) {
      if (kid.seekerRing.visible) {
        kid.seekerRing.rotation.z += dt * 2.4;
      }

      if (kid.bubbleSprite.visible) {
        kid.bubbleTimer -= dt;
        if (kid.bubbleTimer <= 0 && (this.mode === 'idle' || this.mode === 'seeking')) {
          kid.bubbleSprite.visible = false;
        }
      }

      const arrived = this.stepKidAlongPath(kid, dt);

      if (
        (this.mode === 'countdown' || this.mode === 'seeking') &&
        !kid.found &&
        arrived &&
        kid.targetSpot
      ) {
        kid.char.setCrouching(true);
        // Stealth: once settled in hiding cover, stay quiet unless player walks very close!
        const distToPlayer = Math.hypot(
          kid.char.position.x - playerPos.x,
          kid.char.position.z - playerPos.z
        );
        if (
          this.mode === 'seeking' &&
          Math.abs(kid.char.position.y - playerPos.y) < 1.6 &&
          distToPlayer < 3.4
        ) {
          if (!kid.bubbleSprite.visible) {
            this.setKidBubble(kid, metin("HideAndSeekManager", "eyvah_yaklasiyor"), 1.8);
          }
        } else if (this.mode === 'seeking' && distToPlayer > 4.2) {
          kid.bubbleSprite.visible = false;
        }
      }

      if (
        this.mode === 'hiding' &&
        this.hidePhase === 'searching' &&
        kid.isSeeker &&
        arrived
      ) {
        this.assignNextSeekerPatrol(kid);
        const quips = [
          metin("HideAndSeekManager", "ebe_1_neredesin_kasif", kid.name),
          metin("HideAndSeekManager", "ebe_1_sutun_arkalarina_bakayim", kid.name),
          metin("HideAndSeekManager", "ebe_1_2_kata_da_bakalim", kid.name),
        ];
        this.setKidBubble(
          kid,
          quips[Math.floor(Math.random() * quips.length)],
          3.2,
          true
        );
      }
    }

    // Game State Machine
    if (this.mode === 'countdown') {
      this.countdownTimer -= dt;
      const whole = Math.max(0, Math.ceil(this.countdownTimer));
      if (whole !== this.lastWholeCountdown && whole > 0) {
        this.lastWholeCountdown = whole;
        this.callbacks?.onCountdownTick?.(whole);
      }
      if (this.countdownTimer <= 0) {
        this.mode = 'seeking';
        this.callbacks?.onPhaseBanner?.(
          metin("HideAndSeekManager", "arama_basladi_52_sn"),
          metin("HideAndSeekManager", "1_ve_2_katta_kuytu_yerlerde_gizlenen", this.kids.length),
          'warn'
        );
        this.callbacks?.onSeekStarted?.();
      }
    } else if (this.mode === 'seeking') {
      this.gameTimer -= dt;
      if (this.gameTimer <= 0) {
        const found = this.kids.filter((k) => k.found).length;
        const total = this.kids.length;
        this.stopGame();
        this.callbacks?.onPhaseBanner?.(
          metin("HideAndSeekManager", "sure_doldu_kaybettin"),
          metin("HideAndSeekManager", "1_2_arkadasini_bulabildin_bir_sonraki_turda", found, total),
          'lose'
        );
        this.callbacks?.onGameFinished({
          mode: 'seek',
          won: false,
          message: metin("HideAndSeekManager", "sure_doldu_1_2_arkadasi_buldun_tekrar", found, total),
        });
      }
    } else if (this.mode === 'hiding') {
      if (this.hidePhase === 'prep') {
        this.countdownTimer -= dt;
        const whole = Math.max(0, Math.ceil(this.countdownTimer));
        if (whole !== this.lastWholeCountdown && whole > 0) {
          this.lastWholeCountdown = whole;
          this.callbacks?.onCountdownTick?.(whole);
        }
        if (this.countdownTimer <= 0) {
          this.hidePhase = 'searching';
          for (const kid of this.kids) {
            if (kid.isSeeker) {
              this.assignNextSeekerPatrol(kid);
              this.setKidBubble(
                kid,
                metin("HideAndSeekManager", "ebe_1_onum_arkam_sagim_solum_sobe", kid.name),
                4.2,
                true
              );
            }
          }
          this.callbacks?.onPhaseBanner?.(
            metin("HideAndSeekManager", "ebeler_aramaya_cikti_28_sn"),
            metin("HideAndSeekManager", "kirmizi_halkali_ve_kirmizi_balonlu_ebelerden_gizlen"),
            'warn'
          );
          this.callbacks?.onSearchPhaseStarted?.();
        }
      } else {
        this.gameTimer -= dt;

        // Check if any seeker spots the player (free hiding anywhere inside the museum!)
        const nearCover =
          this.getNearestHideSpot(playerPos, this.hidingSpots, 2.0) !== null;
        const spotDist =
          playerCrouching && nearCover
            ? 0.95
            : playerCrouching
              ? 1.65
              : 4.0;

        for (const kid of this.kids) {
          if (!kid.isSeeker) continue;
          if (Math.abs(kid.char.position.y - playerPos.y) > 1.5) continue;
          const d = Math.hypot(
            kid.char.position.x - playerPos.x,
            kid.char.position.z - playerPos.z
          );
          if (d < spotDist) {
            this.stopGame();
            this.callbacks?.onPhaseBanner?.(
              metin("HideAndSeekManager", "sobelendin_1_buldu", kid.name),
              metin("HideAndSeekManager", "kirmizi_balonlu_ebe_seni_yakaladi_sutun_ve"),
              'lose'
            );
            this.callbacks?.onGameFinished({
              mode: 'hide',
              won: false,
              message: metin("HideAndSeekManager", "1_seni_gordu_ve_sobeledi_muze_icinde", kid.name),
            });
            return;
          }
        }

        if (this.gameTimer <= 0) {
          this.stopGame();
          this.callbacks?.onPhaseBanner?.(
            metin("HideAndSeekManager", "saklanma_basarili_kazandin"),
            metin("HideAndSeekManager", "ebeler_sure_boyunca_seni_bulamadi_saklambac_sampiyonu"),
            'win'
          );
          this.callbacks?.onGameFinished({
            mode: 'hide',
            won: true,
            message: metin("HideAndSeekManager", "sure_doldu_ve_arkadaslarin_seni_hic_bulamadi"),
          });
        }
      }
    }
  }

  dispose(): void {
    for (const kid of this.kids) {
      kid.bubbleTex?.dispose();
      kid.bubbleMat.dispose();
      kid.char.dispose();
    }
    this.kids = [];
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}

function createKidBubbleTexture(
  text: string,
  isEbeStyle = false
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 580;
  canvas.height = 178;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = isEbeStyle
      ? 'rgba(185, 28, 28, 0.96)'
      : 'rgba(255, 251, 240, 0.96)';
    ctx.beginPath();
    ctx.roundRect(12, 10, 556, 128, 26);
    ctx.fill();

    ctx.strokeStyle = isEbeStyle ? '#fde047' : '#7c3aed';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(272, 134);
    ctx.lineTo(308, 134);
    ctx.lineTo(290, 168);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isEbeStyle ? '#ffffff' : '#0f172a';
    ctx.font = 'bold 25px "Google Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const words = text.split(/\s+/u);
    const lines: string[] = [];
    let current = '';
    for (const w of words) {
      const cand = current ? `${current} ${w}` : w;
      if (current && ctx.measureText(cand).width > 506) {
        lines.push(current);
        current = w;
      } else {
        current = cand;
      }
    }
    if (current) lines.push(current);

    const visible = lines.slice(0, 2);
    const lh = 34;
    const startY = 74 - ((visible.length - 1) * lh) / 2;
    visible.forEach((ln, i) => ctx.fillText(ln, 290, startY + i * lh));
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
