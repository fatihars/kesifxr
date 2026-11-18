import {metin} from "../metinler.ts";
import * as THREE from 'three';
import * as xb from 'xrblocks';

import {MUSEUM_FLOOR_2_Y, MUSEUM_FLOOR_Y} from './MuseumBuilding.ts';
import {
  DIG_MOUND_COORDS,
  HOPSCOTCH_TILES,
  PARK_TREE_COORDS,
} from './OutdoorWorld.ts';

export interface HiddenSecretInfo {
  id: string;
  title: string;
  fact: string;
  icon: string;
  position: THREE.Vector3;
  found: boolean;
}

export interface DigArtifactInfo {
  index: number;
  title: string;
  icon: string;
  fact: string;
  dug: boolean;
  pos: THREE.Vector3;
}

export interface FountainHit {
  pos: THREE.Vector3;
  kind: 'fiskiye' | 'cesme';
}

interface AppleNode {
  mesh: THREE.Group;
  homePos: THREE.Vector3;
  treeIndex: number;
  state: 'hanging' | 'falling' | 'collected';
  velY: number;
  respawnTimer: number;
}

interface LeafState {
  pos: THREE.Vector3;
  home: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  spin: THREE.Vector3;
  scale: number;
}

interface WaterDrop {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
}

interface BalloonNode {
  group: THREE.Group;
  homePos: THREE.Vector3;
  bounceVel: number;
  bounceY: number;
  phase: number;
}

interface FlyingBird {
  group: THREE.Group;
  leftWing: THREE.Mesh;
  rightWing: THREE.Mesh;
  center: THREE.Vector3;
  life: number;
  maxLife: number;
  angle: number;
}

interface ButterflyOrbit {
  centerX: number;
  centerZ: number;
  baseY: number;
  radius: number;
  speed: number;
  phase: number;
}

const LEAF_COUNT = 150;
const LEAF_COLORS = [0x84cc16, 0x22c55e, 0xf59e0b, 0xea580c, 0xfbbf24];
const BALLOON_COLORS = [0xf43f5e, 0x38bdf8, 0xfbbf24, 0xa855f7];
const BUTTERFLY_COUNT = 18;
const BUTTERFLY_COLORS = [0xfde047, 0x38bdf8, 0xfb7185, 0xfbbf24, 0x2dd4bf, 0xf8fafc];
const WATER_DROP_COUNT = 42;

export class InteractiveGardenProps extends xb.Script {
  private apples: AppleNode[] = [];
  private appleMeshes: THREE.Object3D[] = [];

  private leafMesh!: THREE.InstancedMesh;
  private leaves: LeafState[] = [];
  private leafDummy = new THREE.Object3D();

  private waterMesh!: THREE.InstancedMesh;
  private waterDrops: WaterDrop[] = [];
  private waterDummy = new THREE.Object3D();

  private ballGroup = new THREE.Group();
  private ballPos = new THREE.Vector3(-2.1, 0.34, 13.8);
  private ballVel = new THREE.Vector3(0, 0, 0);
  private ballCooldown = 0;

  private balloons: BalloonNode[] = [];
  private birds: FlyingBird[] = [];

  private butterflyLeftWings!: THREE.InstancedMesh;
  private butterflyRightWings!: THREE.InstancedMesh;
  private butterflies: ButterflyOrbit[] = [];
  private butterflyDummy = new THREE.Object3D();

  private secrets: HiddenSecretInfo[] = [];
  private secretGroups: THREE.Group[] = [];
  private interactiveMeshes: THREE.Object3D[] = [];

  private digArtifacts: DigArtifactInfo[] = [];
  private hopscotchNext = 0;
  private hopscotchCooldown = 0;
  private mazeCrownPos = new THREE.Vector3(24.5, 0.75, -7.5);
  private mazeCrownClaimed = false;

  private disposables: Array<{dispose: () => void}> = [];
  private time = 0;

  private track<T extends {dispose: () => void}>(item: T): T {
    this.disposables.push(item);
    return item;
  }

  init(): void {
    this.createApples();
    this.createSwirlingLeaves();
    this.createButterflies();
    this.createWaterSplashes();
    this.createPlaygroundBall();
    this.createBalloons();
    this.createHiddenSecrets();
    this.createDigArtifacts();
  }

  private createDigArtifacts(): void {
    const specs = [
      {
        title: metin("InteractiveGardenProps", "hitit_gunes_kursu"),
        icon: '☀️',
        fact: metin("InteractiveGardenProps", "anadolu_nun_4000_yillik_tunc_mirasi_gunesin"),
      },
      {
        title: metin("InteractiveGardenProps", "urartu_cift_kulplu_amfora"),
        icon: '🏺',
        fact: metin("InteractiveGardenProps", "van_golu_cevresinde_yasayan_urartu_ustalarinin_pismis"),
      },
      {
        title: metin("InteractiveGardenProps", "lidya_altin_sikkesi"),
        icon: '🪙',
        fact: metin("InteractiveGardenProps", "tarihte_ilk_kez_anadolu_da_lidyalilar_tarafindan"),
      },
      {
        title: metin("InteractiveGardenProps", "iznik_cini_yildizi"),
        icon: '💠',
        fact: metin("InteractiveGardenProps", "turkuaz_ve_kobalt_mavisi_sirlarla_parlayan_geleneksel"),
      },
      {
        title: metin("InteractiveGardenProps", "antik_yag_kandili"),
        icon: '🪔',
        fact: metin("InteractiveGardenProps", "eski_caglarda_muzeleri_ve_evleri_zeytinyagi_isigiyla"),
      },
      {
        title: metin("InteractiveGardenProps", "selcuklu_pirinc_anahtari"),
        icon: '🗝️',
        fact: metin("InteractiveGardenProps", "anadolu_selcuklu_kervansaraylarinin_ahsap_kapilarini_acan_geometrik"),
      },
    ];
    this.digArtifacts = DIG_MOUND_COORDS.map(([x, z], index) => ({
      index,
      title: specs[index % specs.length].title,
      icon: specs[index % specs.length].icon,
      fact: specs[index % specs.length].fact,
      dug: false,
      pos: new THREE.Vector3(x, 0.15, z),
    }));
  }

  private createApples(): void {
    const appleGeo = this.track(new THREE.SphereGeometry(0.14, 14, 12));
    const redMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        roughness: 0.32,
        metalness: 0.06,
      })
    );
    const goldMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.3,
        metalness: 0.12,
      })
    );
    const stemMat = this.track(
      new THREE.MeshStandardMaterial({color: 0x78350f, roughness: 0.9})
    );
    const leafMat = this.track(
      new THREE.MeshStandardMaterial({color: 0x22c55e, roughness: 0.7})
    );
    const stemGeo = this.track(new THREE.CylinderGeometry(0.018, 0.022, 0.09, 6));
    const tinyLeafGeo = this.track(new THREE.BoxGeometry(0.08, 0.02, 0.05));

    // Place apples on the first 8 accessible courtyard & walkway trees
    const appleTrees = PARK_TREE_COORDS.slice(0, 8);
    appleTrees.forEach(([tx, tz, scale], treeIndex) => {
      for (let j = 0; j < 2; j++) {
        const angle = j * 2.2 + treeIndex * 0.9;
        const r = 0.88 * scale;
        const ax = tx + Math.cos(angle) * r;
        const az = tz + Math.sin(angle) * r;
        const ay = (1.95 + (j % 2) * 0.45) * scale;

        const g = new THREE.Group();
        const appleId = `apple-${treeIndex}-${j}`;
        const fruit = new THREE.Mesh(appleGeo, j % 2 === 0 ? redMat : goldMat);
        fruit.castShadow = true;
        fruit.userData.propType = 'apple';
        fruit.userData.appleId = appleId;

        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.15;
        const leaf = new THREE.Mesh(tinyLeafGeo, leafMat);
        leaf.position.set(0.04, 0.17, 0);
        leaf.rotation.z = 0.35;

        g.add(fruit, stem, leaf);
        g.position.set(ax, ay, az);
        g.userData.appleId = appleId;
        this.add(g);
        this.appleMeshes.push(fruit);
        this.interactiveMeshes.push(fruit);

        this.apples.push({
          mesh: g,
          homePos: new THREE.Vector3(ax, ay, az),
          treeIndex,
          state: 'hanging',
          velY: 0,
          respawnTimer: 0,
        });
      }
    });
  }

  private createSwirlingLeaves(): void {
    const geo = this.track(new THREE.PlaneGeometry(0.18, 0.12));
    const mat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.78,
        side: THREE.DoubleSide,
      })
    );
    this.leafMesh = new THREE.InstancedMesh(geo, mat, LEAF_COUNT);
    this.leafMesh.frustumCulled = false;

    const color = new THREE.Color();
    for (let i = 0; i < LEAF_COUNT; i++) {
      const tree = PARK_TREE_COORDS[i % 8];
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.8 + Math.random() * 3.1;
      const hx = THREE.MathUtils.clamp(tree[0] + Math.cos(angle) * dist, -20, 20);
      const hz = THREE.MathUtils.clamp(tree[1] + Math.sin(angle) * dist, 1.5, 25.0);
      const hy = 0.055 + Math.random() * 0.03;

      const state: LeafState = {
        pos: new THREE.Vector3(hx, hy, hz),
        home: new THREE.Vector3(hx, hy, hz),
        vel: new THREE.Vector3(0, 0, 0),
        rot: new THREE.Euler(-Math.PI / 2 + 0.15, Math.random() * Math.PI * 2, 0),
        spin: new THREE.Vector3(0, 0, 0),
        scale: 0.75 + Math.random() * 0.65,
      };
      this.leaves.push(state);
      color.setHex(LEAF_COLORS[i % LEAF_COLORS.length]);
      this.leafMesh.setColorAt(i, color);
    }
    if (this.leafMesh.instanceColor) {
      this.leafMesh.instanceColor.needsUpdate = true;
    }
    this.add(this.leafMesh);
  }

  private createButterflies(): void {
    const leftGeo = this.track(new THREE.PlaneGeometry(0.11, 0.14));
    leftGeo.rotateX(-Math.PI / 2);
    leftGeo.translate(-0.055, 0, 0);

    const rightGeo = this.track(new THREE.PlaneGeometry(0.11, 0.14));
    rightGeo.rotateX(-Math.PI / 2);
    rightGeo.translate(0.055, 0, 0);

    const wingMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.18,
        roughness: 0.4,
        side: THREE.DoubleSide,
      })
    );

    this.butterflyLeftWings = new THREE.InstancedMesh(leftGeo, wingMat, BUTTERFLY_COUNT);
    this.butterflyRightWings = new THREE.InstancedMesh(rightGeo, wingMat, BUTTERFLY_COUNT);
    this.butterflyLeftWings.frustumCulled = false;
    this.butterflyRightWings.frustumCulled = false;

    const centers: Array<[number, number]> = [
      [-10.5, 7.5],
      [10.5, 7.5],
      [-7.5, 11.5],
      [7.5, 11.5],
      [-14.5, 13.0],
      [14.5, 13.0],
      [-23.5, 6.2],
      [-23.5, 13.0],
      [0, 18.0],
    ];
    const color = new THREE.Color();
    for (let i = 0; i < BUTTERFLY_COUNT; i++) {
      const c = centers[i % centers.length];
      this.butterflies.push({
        centerX: c[0] + (Math.random() - 0.5) * 3.0,
        centerZ: c[1] + (Math.random() - 0.5) * 3.0,
        baseY: 1.05 + Math.random() * 1.15,
        radius: 0.9 + Math.random() * 1.5,
        speed: 0.9 + Math.random() * 0.9,
        phase: (i / BUTTERFLY_COUNT) * Math.PI * 2 + Math.random(),
      });
      color.setHex(BUTTERFLY_COLORS[i % BUTTERFLY_COLORS.length]);
      this.butterflyLeftWings.setColorAt(i, color);
      this.butterflyRightWings.setColorAt(i, color);
    }
    if (this.butterflyLeftWings.instanceColor) {
      this.butterflyLeftWings.instanceColor.needsUpdate = true;
    }
    if (this.butterflyRightWings.instanceColor) {
      this.butterflyRightWings.instanceColor.needsUpdate = true;
    }
    this.add(this.butterflyLeftWings, this.butterflyRightWings);
  }

  private createWaterSplashes(): void {
    const dropGeo = this.track(new THREE.SphereGeometry(0.055, 8, 6));
    const dropMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x7dd3fc,
        emissive: 0x0284c7,
        emissiveIntensity: 0.35,
        roughness: 0.15,
        transparent: true,
        opacity: 0.88,
      })
    );
    this.waterMesh = new THREE.InstancedMesh(dropGeo, dropMat, WATER_DROP_COUNT);
    this.waterMesh.frustumCulled = false;

    for (let i = 0; i < WATER_DROP_COUNT; i++) {
      this.waterDrops.push({
        pos: new THREE.Vector3(0, -10, 0),
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
      });
    }
    this.add(this.waterMesh);
  }

  private createPlaygroundBall(): void {
    const radius = 0.34;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const stripes = ['#ef4444', '#fbbf24', '#38bdf8', '#22c55e', '#a855f7', '#ffffff'];
      const w = canvas.width / stripes.length;
      stripes.forEach((c, idx) => {
        ctx.fillStyle = c;
        ctx.fillRect(idx * w, 0, w + 1, canvas.height);
      });
    }
    const tex = this.track(new THREE.CanvasTexture(canvas));
    tex.colorSpace = THREE.SRGBColorSpace;

    const ballGeo = this.track(new THREE.SphereGeometry(radius, 22, 16));
    const ballMat = this.track(
      new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.35,
        metalness: 0.08,
      })
    );
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.castShadow = true;
    ballMesh.userData.propType = 'ball';

    this.ballGroup.position.copy(this.ballPos);
    this.ballGroup.add(ballMesh);
    this.interactiveMeshes.push(ballMesh);
    this.add(this.ballGroup);
  }

  private createBalloons(): void {
    const coords: Array<[number, number]> = [
      [-6.2, 11.2],
      [6.2, 11.2],
      [-5.6, 15.8],
      [5.6, 15.8],
    ];
    const sphereGeo = this.track(new THREE.SphereGeometry(0.32, 18, 14));
    const stringGeo = this.track(new THREE.CylinderGeometry(0.008, 0.008, 1.85, 6));
    const stringMat = this.track(
      new THREE.MeshBasicMaterial({color: 0xe2e8f0})
    );
    const anchorGeo = this.track(new THREE.CylinderGeometry(0.14, 0.18, 0.12, 12));
    const anchorMat = this.track(
      new THREE.MeshStandardMaterial({color: 0xf59e0b, metalness: 0.7, roughness: 0.3})
    );

    coords.forEach(([bx, bz], idx) => {
      const g = new THREE.Group();
      const home = new THREE.Vector3(bx, 1.9, bz);
      g.position.copy(home);

      const bMat = this.track(
        new THREE.MeshStandardMaterial({
          color: BALLOON_COLORS[idx % BALLOON_COLORS.length],
          roughness: 0.22,
          metalness: 0.12,
        })
      );
      const balloon = new THREE.Mesh(sphereGeo, bMat);
      balloon.scale.set(0.95, 1.15, 0.95);
      balloon.castShadow = true;
      balloon.userData.propType = 'balloon';
      balloon.userData.balloonIndex = idx;

      const str = new THREE.Mesh(stringGeo, stringMat);
      str.position.y = -1.0;

      const anchor = new THREE.Mesh(anchorGeo, anchorMat);
      anchor.position.set(bx, 0.06, bz);
      this.add(anchor);

      g.add(balloon, str);
      this.add(g);
      this.interactiveMeshes.push(balloon);
      this.balloons.push({
        group: g,
        homePos: home,
        bounceVel: 0,
        bounceY: 0,
        phase: idx * 1.4,
      });
    });
  }

  private createHiddenSecrets(): void {
    const secretConfigs: Array<{
      id: string;
      title: string;
      fact: string;
      icon: string;
      pos: THREE.Vector3;
      color: number;
    }> = [
      {
        id: 'secret-vase',
        title: metin("InteractiveGardenProps", "sirli_iznik_cini_vazosu"),
        fact: metin("InteractiveGardenProps", "gizli_kose_surprizi_iznik_ustalari_16_yuzyilda"),
        icon: '🏺',
        pos: new THREE.Vector3(-4.8, MUSEUM_FLOOR_Y + 0.55, -15.6),
        color: 0x06b6d4,
      },
      {
        id: 'secret-astrolabe',
        title: metin("InteractiveGardenProps", "muneccim_gok_kuresi"),
        fact: metin("InteractiveGardenProps", "2_kat_sirri_eskiden_gokbilimciler_yildizlarin_yerini"),
        icon: '🔭',
        pos: new THREE.Vector3(11.4, MUSEUM_FLOOR_2_Y + 0.65, -21.8),
        color: 0xfbbf24,
      },
      {
        id: 'secret-key',
        title: metin("InteractiveGardenProps", "bahcenin_altin_hazine_anahtari"),
        fact: metin("InteractiveGardenProps", "bahce_sirri_osmanli_konaklarinda_suslu_demir_ve"),
        icon: '🗝️',
        pos: new THREE.Vector3(-12.6, 0.52, 4.9),
        color: 0xf59e0b,
      },
      {
        id: 'secret-seal',
        title: metin("InteractiveGardenProps", "padisah_ferman_muhru"),
        fact: metin("InteractiveGardenProps", "balkon_sirri_tarihi_belgelerin_altinda_yer_alan"),
        icon: '📜',
        pos: new THREE.Vector3(0, MUSEUM_FLOOR_2_Y + 0.62, -5.05),
        color: 0xe11d48,
      },
      {
        id: 'secret-gem',
        title: metin("InteractiveGardenProps", "nadir_anadolu_amber_tasi"),
        fact: metin("InteractiveGardenProps", "doga_sirri_milyonlarca_yillik_cam_recinelerinin_taslasmasiyla"),
        icon: '💎',
        pos: new THREE.Vector3(13.6, 0.52, 12.6),
        color: 0xa855f7,
      },
    ];

    const gemGeo = this.track(new THREE.OctahedronGeometry(0.24, 1));
    const ringGeo = this.track(new THREE.TorusGeometry(0.34, 0.025, 8, 22));

    secretConfigs.forEach((cfg) => {
      const g = new THREE.Group();
      g.position.copy(cfg.pos);

      const mat = this.track(
        new THREE.MeshStandardMaterial({
          color: cfg.color,
          emissive: cfg.color,
          emissiveIntensity: 0.75,
          roughness: 0.18,
          metalness: 0.65,
        })
      );
      const gem = new THREE.Mesh(gemGeo, mat);
      gem.castShadow = true;
      gem.userData.propType = 'secret';
      gem.userData.secretId = cfg.id;

      const halo = new THREE.Mesh(
        ringGeo,
        this.track(
          new THREE.MeshBasicMaterial({
            color: 0xfde047,
            transparent: true,
            opacity: 0.65,
          })
        )
      );
      halo.rotation.x = Math.PI / 2;
      halo.userData.propType = 'secret';
      halo.userData.secretId = cfg.id;

      g.add(gem, halo);
      this.add(g);
      this.secretGroups.push(g);
      this.interactiveMeshes.push(gem, halo);

      this.secrets.push({
        id: cfg.id,
        title: cfg.title,
        fact: cfg.fact,
        icon: cfg.icon,
        position: cfg.pos.clone(),
        found: false,
      });
    });
  }

  getInteractiveMeshes(): THREE.Object3D[] {
    return this.interactiveMeshes;
  }

  getSecrets(): HiddenSecretInfo[] {
    return this.secrets;
  }

  findNearestSecret(playerPos: THREE.Vector3, maxDist = 2.4): HiddenSecretInfo | null {
    let best: HiddenSecretInfo | null = null;
    let bestD = maxDist;
    for (const s of this.secrets) {
      if (s.found) continue;
      if (Math.abs(s.position.y - playerPos.y) > 1.8) continue;
      const d = Math.hypot(s.position.x - playerPos.x, s.position.z - playerPos.z);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    return best;
  }

  claimSecret(secretId: string): HiddenSecretInfo | null {
    const idx = this.secrets.findIndex((s) => s.id === secretId);
    if (idx < 0) return null;
    const secret = this.secrets[idx];
    if (secret.found) return null;

    secret.found = true;
    const grp = this.secretGroups[idx];
    if (grp) {
      grp.visible = false;
      grp.traverse((child) => {
        child.userData.propType = undefined;
        child.userData.secretId = undefined;
      });
    }
    return secret;
  }

  findNearestFountain(playerPos: THREE.Vector3): FountainHit | null {
    if (playerPos.y >= 1.2) return null;
    const fiskiye = new THREE.Vector3(-7.5, 0, 8.2);
    if (Math.hypot(playerPos.x - fiskiye.x, playerPos.z - fiskiye.z) < 3.4) {
      return {pos: fiskiye, kind: 'fiskiye'};
    }
    const cesme = new THREE.Vector3(7.5, 0, 8.2);
    if (Math.hypot(playerPos.x - cesme.x, playerPos.z - cesme.z) < 3.1) {
      return {pos: cesme, kind: 'cesme'};
    }
    return null;
  }

  triggerFountainSplash(center: THREE.Vector3, isFiskiye = true): void {
    const startY = isFiskiye ? 2.4 : 0.85;
    for (let i = 0; i < WATER_DROP_COUNT; i++) {
      const d = this.waterDrops[i];
      d.pos.set(center.x, startY, center.z);
      const a = Math.random() * Math.PI * 2;
      const sp = (isFiskiye ? 0.9 : 0.55) + Math.random() * (isFiskiye ? 1.8 : 1.1);
      d.vel.set(
        Math.cos(a) * sp,
        (isFiskiye ? 2.2 : 1.6) + Math.random() * 1.6,
        Math.sin(a) * sp
      );
      d.life = 0.001;
      d.maxLife = 0.85 + Math.random() * 0.4;
    }
  }

  getHopscotchNextStep(): number {
    return this.hopscotchNext;
  }

  checkHopscotchStep(
    playerPos: THREE.Vector3,
    dt: number
  ): {step: number; tileNum: number; total: number; completed: boolean} | null {
    if (this.hopscotchCooldown > 0) {
      this.hopscotchCooldown = Math.max(0, this.hopscotchCooldown - dt);
    }
    if (playerPos.y > 0.8 || this.hopscotchCooldown > 0) return null;

    const target = HOPSCOTCH_TILES[this.hopscotchNext];
    if (!target) return null;
    const hitRadius = target.width ? 0.92 : 0.68;
    const d = Math.hypot(playerPos.x - target.x, playerPos.z - target.z);
    if (d < hitRadius) {
      const hitStep = this.hopscotchNext;
      const total = HOPSCOTCH_TILES.length;
      this.hopscotchCooldown = 0.24;
      if (this.hopscotchNext >= total - 1) {
        this.hopscotchNext = 0;
        return {step: hitStep, tileNum: target.num, total, completed: true};
      }
      this.hopscotchNext++;
      return {step: hitStep, tileNum: target.num, total, completed: false};
    }
    return null;
  }

  findNearestDigMound(
    playerPos: THREE.Vector3,
    maxDist = 2.3
  ): DigArtifactInfo | null {
    if (playerPos.y > 1.0) return null;
    let best: DigArtifactInfo | null = null;
    let bestD = maxDist;
    for (const art of this.digArtifacts) {
      if (art.dug) continue;
      const d = Math.hypot(art.pos.x - playerPos.x, art.pos.z - playerPos.z);
      if (d < bestD) {
        bestD = d;
        best = art;
      }
    }
    return best;
  }

  digMound(index: number): DigArtifactInfo | null {
    const art = this.digArtifacts[index];
    if (!art || art.dug) return null;
    art.dug = true;
    return art;
  }

  getDigArtifact(index: number): DigArtifactInfo | undefined {
    return this.digArtifacts[index];
  }

  findNearestMazeCrown(playerPos: THREE.Vector3, maxDist = 2.5): boolean {
    if (this.mazeCrownClaimed || playerPos.y > 1.2) return false;
    return (
      Math.hypot(
        this.mazeCrownPos.x - playerPos.x,
        this.mazeCrownPos.z - playerPos.z
      ) < maxDist
    );
  }

  claimMazeCrown(): boolean {
    if (this.mazeCrownClaimed) return false;
    this.mazeCrownClaimed = true;
    return true;
  }

  getMazeCrownPosition(): THREE.Vector3 {
    return this.mazeCrownPos;
  }

  findNearestApple(playerPos: THREE.Vector3, maxDist = 2.8): AppleNode | null {
    let best: AppleNode | null = null;
    let bestD = maxDist;
    for (const a of this.apples) {
      if (a.state !== 'hanging') continue;
      if (playerPos.y > 1.5) continue;
      const d = Math.hypot(a.mesh.position.x - playerPos.x, a.mesh.position.z - playerPos.z);
      if (d < bestD) {
        bestD = d;
        best = a;
      }
    }
    return best;
  }

  pickAppleById(appleId: string): {picked: boolean; treeIndex: number; worldPos: THREE.Vector3} | null {
    const apple = this.apples.find((a) => a.mesh.userData.appleId === appleId);
    if (!apple || apple.state !== 'hanging') return null;
    apple.state = 'falling';
    apple.velY = 0.6;
    this.scatterLeavesAt(apple.mesh.position, 2.8, 3.5);
    return {
      picked: true,
      treeIndex: apple.treeIndex,
      worldPos: apple.mesh.position.clone(),
    };
  }

  pickNearestApple(playerPos: THREE.Vector3): {treeIndex: number; worldPos: THREE.Vector3} | null {
    const apple = this.findNearestApple(playerPos, 3.0);
    if (!apple) return null;
    apple.state = 'falling';
    apple.velY = 0.6;
    this.scatterLeavesAt(apple.mesh.position, 2.8, 3.5);
    return {
      treeIndex: apple.treeIndex,
      worldPos: apple.mesh.position.clone(),
    };
  }

  scatterLeavesAt(origin: THREE.Vector3, radius = 2.4, strength = 4.2): number {
    let count = 0;
    for (const leaf of this.leaves) {
      const dx = leaf.pos.x - origin.x;
      const dz = leaf.pos.z - origin.z;
      const d = Math.hypot(dx, dz);
      if (d < radius) {
        count++;
        const nx = d > 0.05 ? dx / d : Math.cos(Math.random() * Math.PI * 2);
        const nz = d > 0.05 ? dz / d : Math.sin(Math.random() * Math.PI * 2);
        leaf.vel.x += nx * (strength * 0.55) + (Math.random() - 0.5) * 2.2;
        leaf.vel.z += nz * (strength * 0.55) + (Math.random() - 0.5) * 2.2;
        leaf.vel.y = Math.max(leaf.vel.y, 1.8 + Math.random() * strength * 0.65);
        leaf.spin.set(
          (Math.random() - 0.5) * 9,
          (Math.random() - 0.5) * 9,
          (Math.random() - 0.5) * 9
        );
      }
    }
    return count;
  }

  kickBallFrom(kickerPos: THREE.Vector3, power = 6.2): boolean {
    if (this.ballCooldown > 0) return false;
    const dx = this.ballPos.x - kickerPos.x;
    const dz = this.ballPos.z - kickerPos.z;
    let dist = Math.hypot(dx, dz);
    let dirX = 0;
    let dirZ = -1;
    if (dist > 0.05) {
      dirX = dx / dist;
      dirZ = dz / dist;
    } else {
      const a = Math.random() * Math.PI * 2;
      dirX = Math.cos(a);
      dirZ = Math.sin(a);
    }
    this.ballVel.set(dirX * power, 2.8 + Math.random() * 1.4, dirZ * power);
    this.ballCooldown = 0.28;
    return true;
  }

  bounceBalloon(index: number): void {
    const b = this.balloons[index];
    if (!b) return;
    b.bounceVel = 4.6;
  }

  spawnTreeBird(treeIndex: number): void {
    const coords = PARK_TREE_COORDS[treeIndex];
    if (!coords) return;

    const group = new THREE.Group();
    const bodyMat = this.track(
      new THREE.MeshStandardMaterial({color: 0x38bdf8, roughness: 0.45})
    );
    const wingMat = this.track(
      new THREE.MeshStandardMaterial({color: 0xfde047, roughness: 0.4})
    );

    const body = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(0.11, 10, 8)),
      bodyMat
    );
    body.scale.set(0.85, 0.85, 1.45);
    const wingGeo = this.track(new THREE.BoxGeometry(0.24, 0.025, 0.11));
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(-0.14, 0.02, 0);
    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(0.14, 0.02, 0);

    group.add(body, leftWing, rightWing);
    const center = new THREE.Vector3(coords[0], 3.1 * coords[2], coords[1]);
    group.position.copy(center);
    this.add(group);

    this.birds.push({
      group,
      leftWing,
      rightWing,
      center,
      life: 0,
      maxLife: 4.5,
      angle: Math.random() * Math.PI * 2,
    });
  }

  updateWithActors(
    playerPos: THREE.Vector3,
    playerMoving: boolean,
    npcPositions: THREE.Vector3[],
    onNpcBallKick?: (npcIdx: number) => void,
    insideDeep = false
  ): void {
    const dt = Math.min(xb.getDeltaTime(), 0.05);
    this.time += dt;
    if (this.ballCooldown > 0) this.ballCooldown -= dt;

    if (insideDeep) {
      // Only update hidden secrets when deep inside the museum (skips instanced outdoor CPU matrices)
      this.secretGroups.forEach((grp, idx) => {
        const found = this.secrets[idx]?.found;
        grp.rotation.y += dt * (found ? 0.6 : 1.9);
        const basePosY = this.secrets[idx].position.y;
        grp.position.y = basePosY + Math.sin(this.time * 2.5 + idx) * 0.08;
      });
      return;
    }

    // 1. Leaf scatter when player walks nearby
    if (playerMoving && playerPos.y < 0.8) {
      this.scatterLeavesAt(playerPos, 1.35, 3.0);
    }

    // 2. Playground Ball physics + player & NPC kicks
    if (playerPos.y < 1.1) {
      const playerDist = Math.hypot(
        this.ballPos.x - playerPos.x,
        this.ballPos.z - playerPos.z
      );
      if (playerDist < 0.92 && this.ballPos.y < 1.1 && this.ballCooldown <= 0) {
        this.kickBallFrom(playerPos, playerMoving ? 6.4 : 4.2);
      }
    }

    npcPositions.forEach((npcPos, idx) => {
      if (npcPos.y > 0.8 || this.ballCooldown > 0) return;
      const d = Math.hypot(this.ballPos.x - npcPos.x, this.ballPos.z - npcPos.z);
      if (d < 0.95 && this.ballPos.y < 1.0) {
        if (this.kickBallFrom(npcPos, 5.4)) {
          onNpcBallKick?.(idx);
        }
      }
    });

    this.ballVel.y -= 12.5 * dt;
    this.ballPos.addScaledVector(this.ballVel, dt);
    if (this.ballPos.y <= 0.34) {
      this.ballPos.y = 0.34;
      if (this.ballVel.y < -0.9) {
        this.ballVel.y = -this.ballVel.y * 0.68;
      } else {
        this.ballVel.y = 0;
      }
      this.ballVel.x *= Math.max(0, 1 - 1.9 * dt);
      this.ballVel.z *= Math.max(0, 1 - 1.9 * dt);
    }
    // Keep ball cleanly inside the outdoor garden bounds (in front of museum entrance)
    if (this.ballPos.x < -13.5 || this.ballPos.x > 13.5) {
      this.ballPos.x = THREE.MathUtils.clamp(this.ballPos.x, -13.5, 13.5);
      this.ballVel.x *= -0.75;
    }
    if (this.ballPos.z < 3.6 || this.ballPos.z > 21.0) {
      this.ballPos.z = THREE.MathUtils.clamp(this.ballPos.z, 3.6, 21.0);
      this.ballVel.z *= -0.75;
    }
    this.ballGroup.position.copy(this.ballPos);
    this.ballGroup.rotation.x += this.ballVel.z * dt * 2.1;
    this.ballGroup.rotation.z -= this.ballVel.x * dt * 2.1;

    // 3. Balloons gentle float & bounce
    this.balloons.forEach((b) => {
      if (b.bounceVel !== 0 || b.bounceY > 0) {
        b.bounceY += b.bounceVel * dt;
        b.bounceVel -= 9.5 * dt;
        if (b.bounceY <= 0) {
          b.bounceY = 0;
          b.bounceVel = 0;
        }
      }
      const swayX = Math.sin(this.time * 1.4 + b.phase) * 0.14;
      const swayY = Math.cos(this.time * 1.9 + b.phase) * 0.12 + b.bounceY;
      b.group.position.set(
        b.homePos.x + swayX,
        b.homePos.y + swayY,
        b.homePos.z
      );
    });

    // 4. Apples falling & respawning
    for (const apple of this.apples) {
      if (apple.state === 'falling') {
        apple.velY -= 11.0 * dt;
        apple.mesh.position.y += apple.velY * dt;
        if (apple.mesh.position.y <= 0.18) {
          apple.state = 'collected';
          apple.mesh.visible = false;
          apple.respawnTimer = 14;
        }
      } else if (apple.state === 'collected') {
        apple.respawnTimer -= dt;
        if (apple.respawnTimer <= 0) {
          apple.state = 'hanging';
          apple.mesh.position.copy(apple.homePos);
          apple.mesh.visible = true;
        }
      } else {
        apple.mesh.rotation.z = Math.sin(this.time * 1.8 + apple.treeIndex) * 0.08;
      }
    }

    // 5. Leaves swirling simulation
    for (let i = 0; i < this.leaves.length; i++) {
      const l = this.leaves[i];
      if (l.pos.y > l.home.y + 0.01 || l.vel.lengthSq() > 0.002) {
        l.vel.y -= 3.6 * dt;
        l.vel.x += Math.sin(this.time * 4 + i) * 0.45 * dt;
        l.pos.addScaledVector(l.vel, dt);
        l.rot.x += l.spin.x * dt;
        l.rot.y += l.spin.y * dt;
        l.rot.z += l.spin.z * dt;
        if (l.pos.y <= l.home.y) {
          l.pos.y = l.home.y;
          l.vel.set(0, 0, 0);
          l.spin.set(0, 0, 0);
          l.rot.x = -Math.PI / 2 + 0.15;
          l.rot.z = 0;
        }
      }
      this.leafDummy.position.copy(l.pos);
      this.leafDummy.rotation.copy(l.rot);
      this.leafDummy.scale.setScalar(l.scale);
      this.leafDummy.updateMatrix();
      this.leafMesh.setMatrixAt(i, this.leafDummy.matrix);
    }
    this.leafMesh.instanceMatrix.needsUpdate = true;

    // 6. Water fountain splash particles
    let waterDirty = false;
    for (let i = 0; i < this.waterDrops.length; i++) {
      const d = this.waterDrops[i];
      if (d.life <= 0) {
        this.waterDummy.scale.setScalar(0);
        this.waterDummy.position.set(0, -10, 0);
      } else {
        waterDirty = true;
        d.life += dt;
        if (d.life >= d.maxLife) {
          d.life = 0;
          this.waterDummy.scale.setScalar(0);
          this.waterDummy.position.set(0, -10, 0);
        } else {
          d.vel.y -= 9.8 * dt;
          d.pos.addScaledVector(d.vel, dt);
          const s = 1 - d.life / d.maxLife;
          this.waterDummy.position.copy(d.pos);
          this.waterDummy.scale.setScalar(Math.max(0.2, s));
        }
      }
      this.waterDummy.updateMatrix();
      this.waterMesh.setMatrixAt(i, this.waterDummy.matrix);
    }
    if (waterDirty) {
      this.waterMesh.instanceMatrix.needsUpdate = true;
    }

    // 7. Hidden secrets gentle bob & glow spin
    this.secretGroups.forEach((grp, idx) => {
      const found = this.secrets[idx]?.found;
      grp.rotation.y += dt * (found ? 0.6 : 1.9);
      const basePosY = this.secrets[idx].position.y;
      grp.position.y = basePosY + Math.sin(this.time * 2.5 + idx) * 0.08;
    });

    // 8. Flying Easter Egg Birds
    for (let i = this.birds.length - 1; i >= 0; i--) {
      const b = this.birds[i];
      b.life += dt;
      if (b.life >= b.maxLife) {
        b.group.removeFromParent();
        this.birds.splice(i, 1);
        continue;
      }
      b.angle += dt * 2.6;
      const radius = 1.6 + b.life * 1.4;
      const nx = b.center.x + Math.cos(b.angle) * radius;
      const nz = b.center.z + Math.sin(b.angle) * radius;
      const ny = b.center.y + b.life * 1.9 + Math.sin(b.life * 6) * 0.25;
      b.group.position.set(nx, ny, nz);
      b.group.rotation.y = -b.angle;
      const flap = Math.sin(b.life * 22) * 0.7;
      b.leftWing.rotation.z = flap;
      b.rightWing.rotation.z = -flap;
    }

    // 9. Courtyard fluttering butterflies (1 instanced flap update)
    for (let i = 0; i < this.butterflies.length; i++) {
      const bf = this.butterflies[i];
      const theta = this.time * bf.speed + bf.phase;
      const bx = bf.centerX + Math.cos(theta) * bf.radius;
      const bz = bf.centerZ + Math.sin(theta * 1.35) * (bf.radius * 0.75);
      const by = bf.baseY + Math.sin(this.time * 3.2 + bf.phase) * 0.24;
      const flapAngle = Math.sin(this.time * 16 + bf.phase * 3) * 0.72 + 0.12;
      const heading = Math.atan2(
        Math.cos(theta * 1.35) * bf.radius * 0.75 * 1.35,
        -Math.sin(theta) * bf.radius
      );

      this.butterflyDummy.position.set(bx, by, bz);
      this.butterflyDummy.rotation.set(0, -heading + Math.PI / 2, flapAngle);
      this.butterflyDummy.scale.setScalar(1);
      this.butterflyDummy.updateMatrix();
      this.butterflyLeftWings.setMatrixAt(i, this.butterflyDummy.matrix);

      this.butterflyDummy.rotation.set(0, -heading + Math.PI / 2, -flapAngle);
      this.butterflyDummy.updateMatrix();
      this.butterflyRightWings.setMatrixAt(i, this.butterflyDummy.matrix);
    }
    this.butterflyLeftWings.instanceMatrix.needsUpdate = true;
    this.butterflyRightWings.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
