import {metin} from "../metinler.ts";
import * as THREE from 'three';
import * as xb from 'xrblocks';

import {type CharacterStyleId, ExplorerCharacter} from './ExplorerCharacter.ts';
import {
  createAnatolianColumn,
  getMeadowGrassTexture,
  getTravertineTextures,
  getWalnutWoodTextures,
} from '../utils/anatolianMaterials.ts';

export const TUG_ARENA_ORIGIN = new THREE.Vector3(0, 0, 38.2);

export interface RecruitedTugTeammate {
  id: string;
  name: string;
  style: CharacterStyleId;
  variant: number;
}

export interface TugMatchHudState {
  running: boolean;
  finished: boolean;
  won: boolean;
  balance: number; // -100 (left/player wins) to +100 (right/opponent wins)
  stamina: number; // 0..100
  surging: boolean;
  leftNames: string[];
  rightNames: string[];
  statusText: string;
}

interface TugActor {
  char: ExplorerCharacter;
  side: 'left' | 'right';
  startPos: THREE.Vector3;
  ropeSlotX: number;
  ropeSlotZ: number;
  inPosition: boolean;
  bubbleSprite?: THREE.Sprite;
  bubbleMat?: THREE.SpriteMaterial;
  bubbleTex?: THREE.CanvasTexture;
}

export class TugOfWarArena extends xb.Script {
  private disposables: Array<{dispose: () => void}> = [];
  private interactiveMeshes: THREE.Object3D[] = [];

  private ropeGroup = new THREE.Group();
  private ribbonMesh!: THREE.Mesh;
  private actors: TugActor[] = [];
  private recruitedTeammates: RecruitedTugTeammate[] = [];
  private activeLeftTeammates: RecruitedTugTeammate[] = [];

  // Match simulation state
  private matchActive = false;
  private matchFinished = false;
  private matchWon = false;
  private ropeOffset = 0; // meters (-3.2 left win .. +3.2 right win)
  private ropeVelocity = 0;
  private stamina = 100;
  private fatigueTimer = 0;
  private pullImpulse = 0;
  private aiSurgeTimer = 2.4;
  private aiSurgeActive = 0;
  private statusText = metin("TugOfWarArena", "halatin_basina_gec_bosluk_ile_hizli_ve");
  private time = 0;

  private onMatchFinishedCb?: (won: boolean, detail: string) => void;
  private onMatchProgressCb?: (state: TugMatchHudState) => void;

  private track<T extends {dispose: () => void}>(item: T): T {
    this.disposables.push(item);
    return item;
  }

  constructor() {
    super();
    this.buildArenaCourt();
    this.spawnIdleCaptains();
  }

  init(): void {}

  setCallbacks(
    onProgress: (state: TugMatchHudState) => void,
    onFinished: (won: boolean, detail: string) => void
  ): void {
    this.onMatchProgressCb = onProgress;
    this.onMatchFinishedCb = onFinished;
  }

  private buildArenaCourt(): void {
    const group = new THREE.Group();
    group.position.copy(TUG_ARENA_ORIGIN);

    const grassTex = getMeadowGrassTexture(5, 2);
    const travTex = getTravertineTextures(4, 1);
    const walnutTex = getWalnutWoodTextures(2, 1);

    // Textured Anatolian meadow grass pitch & bordered travertine/clay strip
    const pitchMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x76a832,
        map: grassTex,
        roughness: 0.92,
      })
    );
    const clayMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xdcc08c,
        map: travTex.map,
        bumpMap: travTex.bumpMap,
        bumpScale: 0.025,
        roughness: 0.88,
      })
    );
    const stoneCurbMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xe6dcc8,
        map: travTex.map,
        roughness: 0.78,
      })
    );
    const chalkMat = this.track(
      new THREE.MeshStandardMaterial({color: 0xf8fafc, roughness: 0.6})
    );
    const blueZoneMat = this.track(
      new THREE.MeshStandardMaterial({color: 0x0284c7, roughness: 0.58})
    );
    const redZoneMat = this.track(
      new THREE.MeshStandardMaterial({color: 0xdc2626, roughness: 0.58})
    );
    const woodMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x7a4728,
        map: walnutTex.map,
        bumpMap: walnutTex.bumpMap,
        bumpScale: 0.02,
        roughness: 0.68,
      })
    );
    const brassMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.8,
        roughness: 0.25,
      })
    );
    const ropeMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xd99b43,
        map: walnutTex.map,
        bumpMap: walnutTex.bumpMap,
        bumpScale: 0.04,
        roughness: 0.88,
      })
    );

    const pitch = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(17.5, 0.04, 6.2)),
      pitchMat
    );
    pitch.position.y = 0.02;
    pitch.receiveShadow = true;
    pitch.name = 'walkable-ground';
    pitch.userData.activityType = 'tugofwar';

    const clayLane = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(13.2, 0.048, 2.2)),
      clayMat
    );
    clayLane.position.y = 0.024;
    clayLane.receiveShadow = true;
    clayLane.userData.activityType = 'tugofwar';

    // Cut-stone curbs edging the clay tug track
    const curbGeo = this.track(new THREE.BoxGeometry(13.5, 0.09, 0.14));
    for (const side of [-1, 1]) {
      const curb = new THREE.Mesh(curbGeo, stoneCurbMat);
      curb.position.set(0, 0.045, side * 1.15);
      curb.receiveShadow = true;
      group.add(curb);
    }

    // Win lines at x = -3.2 (Left Player team) & x = +3.2 (Right Opponent team) + Center line
    const lineGeo = this.track(new THREE.BoxGeometry(0.14, 0.056, 2.5));
    const centerLine = new THREE.Mesh(lineGeo, chalkMat);
    centerLine.position.set(0, 0.03, 0);
    const leftWinLine = new THREE.Mesh(lineGeo, blueZoneMat);
    leftWinLine.position.set(-3.2, 0.03, 0);
    const rightWinLine = new THREE.Mesh(lineGeo, redZoneMat);
    rightWinLine.position.set(3.2, 0.03, 0);

    // Fluted Anatolian wooden corner columns + brass finials + team pennants
    const pennantShape = new THREE.Shape();
    pennantShape.moveTo(0, 0);
    pennantShape.lineTo(0.85, 0.18);
    pennantShape.lineTo(0, 0.36);
    pennantShape.closePath();
    const pennantGeo = this.track(
      new THREE.ExtrudeGeometry(pennantShape, {depth: 0.02, bevelEnabled: false})
    );
    const finialGeo = this.track(new THREE.SphereGeometry(0.11, 10, 8));

    [
      [-7.2, -2.5],
      [-7.2, 2.5],
      [7.2, -2.5],
      [7.2, 2.5],
    ].forEach(([px, pz]) => {
      const col = createAnatolianColumn(
        this.track.bind(this),
        0.12,
        1.75,
        woodMat,
        stoneCurbMat,
        brassMat
      );
      col.position.set(px, 0, pz);
      col.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          obj.userData.activityType = 'tugofwar';
          this.interactiveMeshes.push(obj);
        }
      });

      const finial = new THREE.Mesh(finialGeo, brassMat);
      finial.position.set(px, 1.84, pz);

      const pennant = new THREE.Mesh(
        pennantGeo,
        px < 0 ? blueZoneMat : redZoneMat
      );
      pennant.position.set(px, 1.38, pz);
      if (px > 0) pennant.rotation.y = Math.PI;

      group.add(col, finial, pennant);
    });

    // Signboard at North edge of arena framed in carved walnut
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 176;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(8, 8, 624, 160, 24);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 34px "Google Sans", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(metin("TugOfWarArena", "halat_cekme"), 320, 58);

      ctx.fillStyle = '#bae6fd';
      ctx.font = 'bold 23px "Google Sans", Arial, sans-serif';
      ctx.fillText(metin("TugOfWarArena", "takimini_kur"), 320, 118);
    }
    const signTex = this.track(new THREE.CanvasTexture(canvas));
    signTex.colorSpace = THREE.SRGBColorSpace;
    const signMesh = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(3.2, 0.88)),
      this.track(new THREE.MeshBasicMaterial({map: signTex, side: THREE.DoubleSide}))
    );
    signMesh.position.set(0, 1.88, -2.85);
    signMesh.userData.activityType = 'tugofwar';

    const signFrame = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(3.38, 1.04, 0.08)),
      woodMat
    );
    signFrame.position.set(0, 1.88, -2.9);

    const signPost = createAnatolianColumn(
      this.track.bind(this),
      0.095,
      1.65,
      woodMat,
      stoneCurbMat,
      brassMat
    );
    signPost.position.set(0, 0, -2.9);

    // Braided 3D Tug-of-War Rope + Red Center Cloth Ribbon
    this.ropeGroup.position.set(0, 0.92, 0);
    const ropeMesh = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.056, 0.056, 11.4, 14)),
      ropeMat
    );
    ropeMesh.rotation.z = Math.PI / 2;
    ropeMesh.castShadow = true;
    ropeMesh.userData.activityType = 'tugofwar';

    // Braided rings along the rope
    const knotGeo = this.track(new THREE.TorusGeometry(0.066, 0.022, 6, 12));
    for (let x = -5.2; x <= 5.2; x += 0.65) {
      const k = new THREE.Mesh(knotGeo, woodMat);
      k.rotation.y = Math.PI / 2;
      k.position.x = x;
      this.ropeGroup.add(k);
    }

    this.ribbonMesh = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.15, 0.44, 0.075)),
      this.track(new THREE.MeshStandardMaterial({color: 0xef4444, roughness: 0.4}))
    );
    this.ribbonMesh.position.set(0, -0.18, 0);
    this.ribbonMesh.userData.activityType = 'tugofwar';
    this.ropeGroup.add(ropeMesh, this.ribbonMesh);

    group.add(
      pitch,
      clayLane,
      centerLine,
      leftWinLine,
      rightWinLine,
      signPost,
      signFrame,
      signMesh,
      this.ropeGroup
    );
    this.interactiveMeshes.push(clayLane, ropeMesh, this.ribbonMesh, signMesh);
    this.add(group);
  }

  private spawnActorsForSpecs(leftAllies: RecruitedTugTeammate[]): void {
    this.clearActors();
    this.activeLeftTeammates = leftAllies;

    const rightSpecs: Array<{
      name: string;
      style: CharacterStyleId;
      variant: number;
    }> = [
      {name: metin("TugOfWarArena", "rakip_kaptan_kaya"), style: 'erkek', variant: 3},
      {name: metin("TugOfWarArena", "selin"), style: 'kadin', variant: 2},
      {name: metin("TugOfWarArena", "bora"), style: 'erkek', variant: 0},
      {name: metin("TugOfWarArena", "melisa"), style: 'kadin', variant: 1},
    ];

    // Left front slot (-1.45, 0, 0) is reserved for the live Player character!
    leftAllies.forEach((spec, idx) => {
      const slotX = -2.55 - idx * 1.05;
      const slotZ = idx % 2 === 0 ? -0.22 : 0.22;
      const startPos = new THREE.Vector3(
        TUG_ARENA_ORIGIN.x - 8.2 - idx * 1.15,
        0,
        TUG_ARENA_ORIGIN.z + (idx % 2 === 0 ? -2.2 : 2.2)
      );
      const idlePos = new THREE.Vector3(
        TUG_ARENA_ORIGIN.x - 3.6 - idx * 1.0,
        0,
        TUG_ARENA_ORIGIN.z - 2.35
      );
      this.createTugActor(
        spec.style,
        spec.variant,
        'left',
        idlePos,
        startPos,
        slotX,
        slotZ,
        idx === 0 ? metin("TugOfWarArena", "halatin_basina_gec_bosluk_ile_cek") : undefined
      );
    });

    rightSpecs.forEach((spec, idx) => {
      const slotX = 1.55 + idx * 1.05;
      const slotZ = idx % 2 === 0 ? 0.22 : -0.22;
      const startPos = new THREE.Vector3(
        TUG_ARENA_ORIGIN.x + 8.2 + idx * 1.15,
        0,
        TUG_ARENA_ORIGIN.z + (idx % 2 === 0 ? 2.2 : -2.2)
      );
      const idlePos = new THREE.Vector3(
        TUG_ARENA_ORIGIN.x + 3.6 + idx * 1.0,
        0,
        TUG_ARENA_ORIGIN.z - 2.35
      );
      this.createTugActor(
        spec.style,
        spec.variant,
        'right',
        idlePos,
        startPos,
        slotX,
        slotZ,
        idx === 0 ? metin("TugOfWarArena", "bakalim_hangi_takim_daha_guclu") : undefined
      );
    });
  }

  private spawnIdleCaptains(): void {
    const idleLeft: RecruitedTugTeammate[] =
      this.recruitedTeammates.length > 0
        ? this.recruitedTeammates.slice(0, 3)
        : [{id: 'tug-cap', name: metin("TugOfWarArena", "kaptan_yigit"), style: 'erkek', variant: 1}];
    this.spawnActorsForSpecs(idleLeft);
  }

  private createTugActor(
    style: CharacterStyleId,
    variant: number,
    side: 'left' | 'right',
    idlePos: THREE.Vector3,
    runStartPos: THREE.Vector3,
    ropeSlotX: number,
    ropeSlotZ: number,
    quote?: string
  ): void {
    const char = new ExplorerCharacter(style, variant, 'sport', true);
    char.scale.setScalar(0.92);
    char.position.copy(idlePos);
    char.rotation.y = side === 'left' ? -Math.PI / 2 : Math.PI / 2;
    char.traverse((obj) => {
      obj.userData.activityType = 'tugofwar';
    });

    let bubbleSprite: THREE.Sprite | undefined;
    let bubbleMat: THREE.SpriteMaterial | undefined;
    let bubbleTex: THREE.CanvasTexture | undefined;

    if (quote) {
      bubbleTex = createTugBubbleTexture(quote);
      bubbleMat = new THREE.SpriteMaterial({
        map: bubbleTex,
        transparent: true,
        depthWrite: false,
      });
      bubbleSprite = new THREE.Sprite(bubbleMat);
      bubbleSprite.scale.set(2.3, 0.7, 1);
      bubbleSprite.position.set(0, 2.2, 0);
      char.add(bubbleSprite);
    }

    this.add(char);
    this.interactiveMeshes.push(char);
    this.actors.push({
      char,
      side,
      startPos: runStartPos,
      ropeSlotX,
      ropeSlotZ,
      inPosition: false,
      bubbleSprite,
      bubbleMat,
      bubbleTex,
    });
  }

  recruitTeammate(teammate: RecruitedTugTeammate): {
    added: boolean;
    totalLeft: number;
  } {
    if (this.recruitedTeammates.some((t) => t.id === teammate.id)) {
      return {added: false, totalLeft: 1 + this.recruitedTeammates.length};
    }
    this.recruitedTeammates.push(teammate);
    if (!this.matchActive) {
      this.spawnIdleCaptains();
    }
    return {added: true, totalLeft: 1 + this.recruitedTeammates.length};
  }

  getRecruitedCount(): number {
    return this.recruitedTeammates.length;
  }

  getInteractiveMeshes(): THREE.Object3D[] {
    return this.interactiveMeshes;
  }

  getCaptainPosition(): THREE.Vector3 {
    return new THREE.Vector3(TUG_ARENA_ORIGIN.x - 3.6, 0, TUG_ARENA_ORIGIN.z - 2.35);
  }

  getPlayerSlotWorldPos(): THREE.Vector3 {
    return new THREE.Vector3(
      TUG_ARENA_ORIGIN.x - 1.45 + this.ropeOffset,
      0,
      TUG_ARENA_ORIGIN.z
    );
  }

  getRopeOffset(): number {
    return this.ropeOffset;
  }

  isMatchRunning(): boolean {
    return this.matchActive;
  }

  startMatch(fallbackCandidates: RecruitedTugTeammate[] = []): void {
    // Use invited friends if any; otherwise pick 3 random visitor NPCs from the map!
    let matchAllies: RecruitedTugTeammate[];
    let teamDesc: string;

    if (this.recruitedTeammates.length > 0) {
      matchAllies = [...this.recruitedTeammates.slice(0, 3)];
      if (matchAllies.length < 2) {
        matchAllies.push({
          id: 'tug-cap',
          name: metin("TugOfWarArena", "kaptan_yigit"),
          style: 'erkek',
          variant: 1,
        });
      }
      teamDesc = metin("TugOfWarArena", "davet_ettigin_1_senin_tarafina_kosuyor", matchAllies.map((t) => t.name).join(', '));
    } else {
      const shuffled = [...fallbackCandidates].sort(() => Math.random() - 0.5);
      matchAllies =
        shuffled.length >= 3
          ? shuffled.slice(0, 3)
          : [
              {id: 'tug-rnd-1', name: metin("TugOfWarArena", "kaptan_yigit"), style: 'erkek', variant: 1},
              {id: 'tug-rnd-2', name: metin("TugOfWarArena", "zehra"), style: 'kadin', variant: 0},
              {id: 'tug-rnd-3', name: metin("TugOfWarArena", "eren"), style: 'erkek', variant: 2},
            ];
      teamDesc = metin("TugOfWarArena", "rastgele_secilen_1_sol_takimina_kosuyor", matchAllies.map((t) => t.name).join(', '));
    }

    this.spawnActorsForSpecs(matchAllies);
    this.matchActive = true;
    this.matchFinished = false;
    this.matchWon = false;
    this.ropeOffset = 0;
    this.ropeVelocity = 0;
    this.stamina = 100;
    this.fatigueTimer = 0;
    this.pullImpulse = 0;
    this.aiSurgeTimer = 2.2;
    this.aiSurgeActive = 0;
    this.statusText = metin("TugOfWarArena", "1_bosluk_ile_halati_cek", teamDesc);

    // Place NPCs at outer left/right entry points so the user watches them run in to grab the rope!
    for (const actor of this.actors) {
      actor.char.position.copy(actor.startPos);
      actor.inPosition = false;
      actor.char.setPulling(0);
      if (actor.bubbleSprite) {
        actor.bubbleSprite.visible = false;
      }
    }
    this.emitHudState();
  }

  stopMatch(): void {
    this.matchActive = false;
    this.fatigueTimer = 0;
    this.ropeOffset = 0;
    this.ropeVelocity = 0;
    this.ropeGroup.position.x = 0;
    this.spawnIdleCaptains();
  }

  triggerPlayerPull(): boolean {
    if (!this.matchActive || this.matchFinished) return false;
    if (this.fatigueTimer > 0) {
      this.statusText = metin("TugOfWarArena", "cok_yoruldun_enerjin_dolarken_1_saniye_bekle");
      this.emitHudState();
      return false;
    }
    if (this.stamina < 11) {
      this.fatigueTimer = 1.15;
      this.statusText = metin("TugOfWarArena", "nefes_nefese_kaldin_enerji_toplanana_kadar_rakip");
      this.emitHudState();
      return false;
    }
    this.stamina = Math.max(0, this.stamina - 12.0);
    const allyBonus = 1 + Math.min(3, this.activeLeftTeammates.length) * 0.12;
    this.pullImpulse += 1.38 * allyBonus;
    return true;
  }

  getHudState(): TugMatchHudState {
    const leftNames = [
      metin("TugOfWarArena", "sen"),
      ...this.activeLeftTeammates.map((t) => t.name),
    ];
    const rightNames = [metin("TugOfWarArena", "rakip_kaptan_kaya"), metin("TugOfWarArena", "selin"), metin("TugOfWarArena", "bora"), metin("TugOfWarArena", "melisa")];
    return {
      running: this.matchActive,
      finished: this.matchFinished,
      won: this.matchWon,
      balance: Math.round((this.ropeOffset / 3.2) * 100),
      stamina: Math.round(this.stamina),
      surging: this.aiSurgeActive > 0,
      leftNames,
      rightNames,
      statusText: this.statusText,
    };
  }

  private emitHudState(): void {
    this.onMatchProgressCb?.(this.getHudState());
  }

  updateWithActors(dt: number): void {
    this.time += dt;

    if (this.fatigueTimer > 0) {
      this.fatigueTimer = Math.max(0, this.fatigueTimer - dt);
    }

    // Gentle stamina recovery
    if (this.matchActive && !this.matchFinished) {
      this.stamina = Math.min(100, this.stamina + 18.5 * dt);
    }

    // Move NPCs into rope positions & animate pulling!
    for (const actor of this.actors) {
      if (!this.matchActive) {
        actor.char.setMoving(false);
        actor.char.setPulling(0);
        if (actor.bubbleSprite) {
          actor.bubbleSprite.position.y = 2.2 + Math.sin(this.time * 3.0) * 0.04;
        }
        continue;
      }

      const targetX = TUG_ARENA_ORIGIN.x + actor.ropeSlotX + this.ropeOffset;
      const targetZ = TUG_ARENA_ORIGIN.z + actor.ropeSlotZ;

      if (!actor.inPosition) {
        const dx = targetX - actor.char.position.x;
        const dz = targetZ - actor.char.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.25) {
          actor.inPosition = true;
          actor.char.position.set(targetX, 0, targetZ);
          actor.char.setMoving(false);
          actor.char.setPulling(actor.side === 'left' ? -1 : 1);
          actor.char.rotation.y =
            actor.side === 'left' ? -Math.PI / 2 : Math.PI / 2;
        } else {
          const runSpeed = 6.2;
          actor.char.position.x += (dx / dist) * runSpeed * dt;
          actor.char.position.z += (dz / dist) * runSpeed * dt;
          actor.char.rotation.y = Math.atan2(-(dx / dist), -(dz / dist));
          actor.char.setMoving(true);
          actor.char.setPulling(0);
        }
      } else {
        actor.char.position.x = targetX;
        actor.char.position.z = targetZ;
        actor.char.rotation.y =
          actor.side === 'left' ? -Math.PI / 2 : Math.PI / 2;
        actor.char.setMoving(false);
        actor.char.setPulling(actor.side === 'left' ? -1 : 1);
      }
    }

    if (!this.matchActive || this.matchFinished) {
      return;
    }

    // Wait until allies & opponents arrive at the rope
    const readyCount = this.actors.filter((a) => a.inPosition).length;
    if (readyCount < Math.min(4, this.actors.length)) {
      this.emitHudState();
      return;
    }

    // Periodic opponent surge + desperation counter-pull so player can lose!
    this.aiSurgeTimer -= dt;
    if (this.aiSurgeTimer <= 0) {
      this.aiSurgeActive = 1.85;
      this.aiSurgeTimer = 3.4 + Math.random() * 1.9;
      this.statusText = metin("TugOfWarArena", "rakip_takim_hep_birlikte_asiliyor_bosluk_ile");
    }
    if (this.aiSurgeActive > 0) {
      this.aiSurgeActive = Math.max(0, this.aiSurgeActive - dt);
    }

    // Forces: negative X = Player/Left team pulls; positive X = Right Opponent team pulls
    const leftTeamPassive =
      1.15 + Math.min(3, this.activeLeftTeammates.length) * 0.48;
    const clutchResistance = this.ropeOffset < -1.5 ? 0.85 : 0;
    const rightTeamForce =
      3.15 +
      clutchResistance +
      (this.aiSurgeActive > 0 ? 1.8 : 0) +
      Math.sin(this.time * 4.8) * 0.55;
    const netAccel =
      rightTeamForce - leftTeamPassive - this.pullImpulse * 2.1;

    this.pullImpulse = Math.max(0, this.pullImpulse - 5.2 * dt);
    this.ropeVelocity = THREE.MathUtils.clamp(
      this.ropeVelocity * Math.max(0, 1 - 2.5 * dt) + netAccel * dt,
      -2.3,
      2.3
    );
    this.ropeOffset = THREE.MathUtils.clamp(
      this.ropeOffset + this.ropeVelocity * dt,
      -3.3,
      3.3
    );

    this.ropeGroup.position.x = this.ropeOffset;
    this.ropeGroup.position.y = 0.92 + Math.sin(this.time * 16) * 0.018;
    this.ribbonMesh.rotation.z = -this.ropeVelocity * 0.25;

    if (this.ropeOffset <= -3.15) {
      this.matchFinished = true;
      this.matchWon = true;
      this.matchActive = false;
      this.statusText =
        metin("TugOfWarArena", "zafer_halati_cizgiden_gecirip_takiminla_halat_cekme");
      for (const a of this.actors) {
        a.char.setPulling(0);
        if (a.side === 'left') a.char.jump();
      }
      this.emitHudState();
      this.onMatchFinishedCb?.(
        true,
        metin("TugOfWarArena", "sol_takiminla_1_oyuncu_guclu_rakip_takimi", 1 + this.activeLeftTeammates.length)
      );
    } else if (this.ropeOffset >= 3.15) {
      this.matchFinished = true;
      this.matchWon = false;
      this.matchActive = false;
      this.statusText =
        metin("TugOfWarArena", "rakip_takim_halati_cekti_ve_kazandi_muzeyi");
      for (const a of this.actors) {
        a.char.setPulling(0);
        if (a.side === 'right') a.char.jump();
      }
      this.emitHudState();
      this.onMatchFinishedCb?.(
        false,
        metin("TugOfWarArena", "rakip_takim_cok_guclu_asildi_ve_bu")
      );
    } else {
      this.emitHudState();
    }
  }

  private clearActors(): void {
    for (const a of this.actors) {
      a.bubbleTex?.dispose();
      a.bubbleMat?.dispose();
      a.char.removeFromParent();
      a.char.dispose();
    }
    this.actors = [];
  }

  dispose(): void {
    this.clearActors();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}

function createTugBubbleTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 580;
  canvas.height = 178;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(255, 251, 240, 0.96)';
    ctx.beginPath();
    ctx.roundRect(12, 10, 556, 128, 26);
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(272, 134);
    ctx.lineTo(308, 134);
    ctx.lineTo(290, 168);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0f172a';
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
