import {metin} from "../metinler.ts";
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import * as xb from 'xrblocks';

import {
  createAnatolianColumn,
  createOttomanAlem,
  createPointedArchGeometry,
  createSeljukStarGeometry,
  getAnatolianKilimTexture,
  getCobblePlazaTextures,
  getIznikTileTexture,
  getMarbleInlayTexture,
  getMeadowGrassTexture,
  getTerracottaRoofTextures,
  getTravertineTextures,
  getWalnutWoodTextures,
} from '../utils/anatolianMaterials.ts';
import {DEVICE_QUALITY} from '../utils/deviceQuality.ts';
import type {WallRect} from './MuseumBuilding.ts';

interface ConfettiParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  spin: THREE.Vector3;
  life: number;
  maxLife: number;
  scale: number;
}

const CONFETTI_COUNT = 92;
const CONFETTI_COLORS = [
  0xfbbf24,
  0x38bdf8,
  0xf472b6,
  0x34d399,
  0xa78bfa,
  0xfb923c,
];

const FLAG_URL = import.meta.env.BASE_URL + 'Flag_of_Turkey.svg';
const FLAG_WIDTH = 2.7;
const FLAG_HEIGHT = 1.8;
const ATATURK_IMAGE_URL = import.meta.env.BASE_URL + 'assets/aistudio/image_105cfb10.png';
const ATATURK_SIG_URL = import.meta.env.BASE_URL + 'assets/aistudio/ss_4c05a788.png';

export const PARK_TREE_COORDS: Array<[number, number, number]> = [
  [-11.5, 14.5, 1.15],
  [11.5, 14.5, 1.1],
  [-14.5, 8.5, 1.25],
  [14.5, 8.5, 1.2],
  [-16.5, 2.0, 1.05],
  [16.5, 2.0, 1.15],
  [-11.0, 24.2, 1.0],
  [7.6, 23.0, 1.08],
  [-28.9, -7.0, 1.3],
  [33.5, -7.0, 1.25],
  [-30.0, -16.0, 1.2],
  [33.5, -17.0, 1.3],
];

export const HOPSCOTCH_TILES: Array<{
  num: number;
  x: number;
  z: number;
  color: string;
  width?: number;
  label?: string;
}> = [
  {num: 1, x: 0, z: 24.5, color: '#ef4444'},
  {num: 2, x: 0, z: 25.45, color: '#f97316'},
  {num: 3, x: 0, z: 26.4, color: '#f59e0b'},
  {num: 4, x: -0.56, z: 27.35, color: '#10b981'},
  {num: 5, x: 0.56, z: 27.35, color: '#06b6d4'},
  {num: 6, x: 0, z: 28.3, color: '#3b82f6'},
  {num: 7, x: -0.56, z: 29.25, color: '#8b5cf6'},
  {num: 8, x: 0.56, z: 29.25, color: '#ec4899'},
  {num: 9, x: 0, z: 30.2, color: '#14b8a6'},
  {num: 10, x: 0, z: 31.32, color: '#eab308', width: 1.68, label: '10 ★'},
];

export const DIG_SITE_ORIGIN = new THREE.Vector3(-13.5, 0, 38);
export const DIG_MOUND_COORDS: Array<[number, number]> = [0.8, -0.8].flatMap((z) =>
  [-1.4, 0, 1.4].map((x): [number, number] => [DIG_SITE_ORIGIN.x + x, DIG_SITE_ORIGIN.z + z]));

export const BENCH_COORDS: Array<[number, number, number]> = [
  [-4.6, 13.5, Math.PI / 2],
  [4.6, 13.5, -Math.PI / 2],
  [-4.6, 17.5, Math.PI / 2],
  [4.6, 17.5, -Math.PI / 2],
];

export const STREET_LAMP_COORDS: Array<[number, number]> = [
  // Central promenade & hopscotch walkway
  [-4.1, 5.2],
  [4.1, 5.2],
  [-4.1, 11.5],
  [4.1, 11.5],
  [-4.1, 18.5],
  [4.1, 18.5],
  [-4.1, 25.0],
  [4.1, 25.0],
  [-4.1, 31.8],
  [4.1, 31.8],
  // Front museum courtyard
  [-11.2, 4.2],
  [11.2, 4.2],
  [-11.2, 10.6],
  [11.2, 10.6],
  // Ping-pong & Mangala plazas
  [-9.2, 22.8],
  [-16.0, 16.5],
  [9.2, 22.8],
  [16.0, 16.5],
  // Beştaş, Çelik Çomak, Dig Site & Tug-of-War northern plazas
  [-9.8, 32.0],
  [9.8, 32.0],
  [-5.2, 35.8],
  [5.2, 35.8],
  // West ring-toss, observatory path & concert approach
  [-17.8, 5.4],
  [-21.0, 10.2],
  [-21.0, -1.5],
  [-25.5, -6.2],
  [-33.2, -5.8],
  // West Topaç, Mosque, Sema & Masal Gazebo
  [-25.8, 13.5],
  [-26.2, 24.5],
  [-31.0, 17.5],
  [-31.2, 8.8],
  [-19.8, 30.8],
  // East Labyrinth, Café, Misket, Karagöz & Nasreddin Hoca
  [12.0, -2.5],
  [19.8, 4.0],
  [24.2, 11.0],
  [19.8, 22.2],
  [29.8, 16.5],
];

export class OutdoorWorld extends xb.Script {
  private envTexture?: THREE.Texture;
  private fountainWaters: THREE.Mesh[] = [];
  private confettiMesh?: THREE.InstancedMesh;
  private confettiParticles: ConfettiParticle[] = [];
  private confettiDummy = new THREE.Object3D();
  private flagGeometry?: THREE.PlaneGeometry;
  private flagBasePositions?: Float32Array;
  private flagPivot?: THREE.Group;
  private disposables: Array<{dispose: () => void}> = [];
  private time = 0;
  private isDisposed = false;

  // Dynamic atmosphere & prop references
  hemiLight!: THREE.HemisphereLight;
  sunLight!: THREE.DirectionalLight;
  fillLight?: THREE.DirectionalLight;
  skyMat!: THREE.ShaderMaterial;
  grassMat!: THREE.MeshStandardMaterial;
  private lampBulbMat?: THREE.MeshStandardMaterial;
  private lampHaloMat?: THREE.MeshBasicMaterial;
  private lampHaloMeshes: THREE.Mesh[] = [];
  private readonly lampPool: THREE.PointLight[] = [];
  private readonly nearestLampIdx = [-1, -1, -1, -1];
  private readonly nearestLampDistSq = [Infinity, Infinity, Infinity, Infinity];
  private indoorMode = false;
  private flagNormalTick = false;
  private treeGroups: THREE.Group[] = [];
  private treeShakeTimers: number[] = [];
  private benchGroups: THREE.Group[] = [];
  private benchBounceTimers: number[] = [];
  private interactiveMeshes: THREE.Object3D[] = [];

  // Left Fıskiye water jet particles
  private fiskiyeJetMesh?: THREE.InstancedMesh;
  private fiskiyeDummy = new THREE.Object3D();
  private readonly FISKIYE_ARC_COUNT = 8;
  private readonly FISKIYE_DROP_PER_ARC = 10;
  // Right Çeşme spout stream
  private cesmeSpoutStream?: THREE.Mesh;

  // Hedge Labyrinth walls + center golden crown
  private mazeWallRects: WallRect[] = [];
  private mazeCrownGroup?: THREE.Group;
  private mazeCrownClaimed = false;

  // Ping-pong animated rally ball, Hopscotch 10-square stone/halo, Topaç tops & dig mounds
  private pingPongBall?: THREE.Mesh;
  private hopscotchMeshes: THREE.Mesh[] = [];
  private hopscotchStone?: THREE.Mesh;
  private hopscotchTargetHalo?: THREE.Mesh;
  private hopscotchStonePos = new THREE.Vector3(0, 0.1, 24.5);
  private hopscotchStoneFrom = new THREE.Vector3(0, 0.1, 24.5);
  private hopscotchStoneTo = new THREE.Vector3(0, 0.1, 24.5);
  private hopscotchStoneT = 1;
  private topacSpinGroups: THREE.Group[] = [];
  private digMoundGroups: THREE.Group[] = [];
  private digRelicGlows: THREE.Group[] = [];

  init(): void {
    this.setupAtmosphere();
    this.createGroundAndPaths();
    this.createAnatolianHorizon();
    this.createParkTrees();
    this.createFlowerbeds();
    this.createLeftFiskiye();
    this.createRightCesme();
    this.createBenchesAndLamps();
    this.createTurkishFlag();
    this.createAtaturkBillboard();
    this.createHedgeLabyrinth();
    this.createOutdoorActivityZones();
    this.createConfettiPool();
  }

  private track<T extends {dispose: () => void}>(item: T): T {
    this.disposables.push(item);
    return item;
  }

  private setupAtmosphere(): void {
    const scene = xb.core.scene;
    if (scene) {
      scene.background = new THREE.Color(0xb8dcf5);
      scene.fog = new THREE.FogExp2(0xc4e2f8, 0.01);
      scene.environmentIntensity = 0.32;
    }

    this.hemiLight = new THREE.HemisphereLight(
      0xe0f2fe,
      0x4d7c0f,
      DEVICE_QUALITY.simplifiedLighting ? 1.05 : 0.72
    );
    this.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff1d6, 1.32);
    this.sunLight.position.set(18, 28, 22);
    if (DEVICE_QUALITY.shadowsEnabled) {
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.set(2048, 2048);
      this.sunLight.shadow.camera.near = 2;
      this.sunLight.shadow.camera.far = 90;
      const d = 32;
      this.sunLight.shadow.camera.left = -d;
      this.sunLight.shadow.camera.right = d;
      this.sunLight.shadow.camera.top = d;
      this.sunLight.shadow.camera.bottom = -d;
      this.sunLight.shadow.bias = -0.0004;
      this.sunLight.shadow.normalBias = 0.025;
    } else {
      this.sunLight.castShadow = false;
    }
    this.add(this.sunLight);

    if (!DEVICE_QUALITY.simplifiedLighting) {
      this.fillLight = new THREE.DirectionalLight(0x93c5fd, 0.28);
      this.fillLight.position.set(-16, 12, -18);
      this.add(this.fillLight);
    }

    // Sky dome gradient
    const skyGeo = this.track(new THREE.SphereGeometry(95, 32, 20));
    this.skyMat = this.track(
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          topColor: {value: new THREE.Color(0x2563eb)},
          horizonColor: {value: new THREE.Color(0xcce6fa)},
        },
        vertexShader: `
          varying vec3 vWorldPosition;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vWorldPosition = wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 horizonColor;
          varying vec3 vWorldPosition;
          void main() {
            float h = clamp(normalize(vWorldPosition).y, 0.0, 1.0);
            gl_FragColor = vec4(mix(horizonColor, topColor, pow(h, 0.65)), 1.0);
          }
        `,
      })
    );
    const skyDome = new THREE.Mesh(skyGeo, this.skyMat);
    this.add(skyDome);

    const renderer = xb.core.renderer as THREE.WebGLRenderer | undefined;
    if (renderer) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = DEVICE_QUALITY.simplifiedLighting ? 0.96 : 0.88;
    }
    if (
      DEVICE_QUALITY.useEnvironmentPmrem &&
      renderer &&
      scene &&
      typeof THREE.PMREMGenerator === 'function' &&
      !scene.environment
    ) {
      try {
        const pmrem = new THREE.PMREMGenerator(renderer);
        this.envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = this.envTexture;
        pmrem.dispose();
      } catch {
        // Ignore if WebGLRenderer PMREM is unavailable.
      }
    }
  }

  private createGroundAndPaths(): void {
    // Lush textured Anatolian park meadow
    const grassGeo = this.track(new THREE.CircleGeometry(90, 64));
    const grassTex = getMeadowGrassTexture(24, 24);
    this.grassMat = this.track(
      new THREE.MeshStandardMaterial({
        map: grassTex,
        color: 0xffffff,
        roughness: 0.92,
        metalness: 0.0,
      })
    );
    const grass = new THREE.Mesh(grassGeo, this.grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.receiveShadow = true;
    grass.name = 'walkable-ground';
    this.add(grass);

    // Rich cobblestone & sandstone walkway paving with bump depth
    const cobble = getCobblePlazaTextures(1, 1);
    const pathMat = this.track(
      new THREE.MeshStandardMaterial({
        map: cobble.map,
        bumpMap: cobble.bumpMap,
        bumpScale: 0.025,
        roughness: 0.85,
      })
    );
    const slabs: Array<{left: number; right: number; top: number; bottom: number}> = [];
    const addStoneSlab = (x: number, z: number, width: number, depth: number) => {
      slabs.push({left: x - width / 2, right: x + width / 2, top: z - depth / 2, bottom: z + depth / 2});
    };
    addStoneSlab(0, 18.55, 7.2, 32.1);
    addStoneSlab(0, 7.05, 24.6, 9.9);

    // Left Ping-Pong plaza (-12.5, 19.5) + connector
    addStoneSlab(-12.5, 19.5, 6.6, 6.6);
    addStoneSlab(-6.5, 19.5, 6.2, 2.6);
    // Right Mangala Gazebo plaza (12.5, 19.5) + connector
    addStoneSlab(12.5, 19.5, 6.6, 6.6);
    addStoneSlab(6.5, 19.5, 6.2, 2.6);
    // Ring toss and the north walkway to the observatory.
    addStoneSlab(-22.5, 7.0, 7.6, 7.6);
    addStoneSlab(-15.5, 7.0, 7.2, 2.6);
    addStoneSlab(-22.8, 0.0, 2.6, 10.6);
    addStoneSlab(-22.25, -7.15, 2.55, 5.84);
    addStoneSlab(-29.7, -4.68, 12.2, 2.35);
    addStoneSlab(-37.9, -6.7, 4.6, 4.8);
    // Right Labyrinth entrance walkway (15.0, -7.5) + connector from front courtyard
    addStoneSlab(15.0, -7.5, 6.2, 2.8);
    addStoneSlab(13.8, -0.5, 2.6, 12.6);

    // 4 New Anatolian Cultural Game Plazas + stone connectors
    // Beştaş (-13.8, 28.5)
    addStoneSlab(-13.8, 28.5, 6.4, 6.4);
    addStoneSlab(-7.25, 28.5, 7.8, 2.6);
    // Çelik Çomak (13.8, 28.5)
    addStoneSlab(13.8, 28.5, 6.4, 6.4);
    addStoneSlab(7.25, 28.5, 7.8, 2.6);
    // Topaç Çevirme (-23.0, 16.8)
    addStoneSlab(-23.0, 16.8, 6.4, 6.4);
    addStoneSlab(-17.8, 17.8, 5.2, 2.4);
    addStoneSlab(-22.8, 12.0, 2.4, 4.4);
    // Misket / Cıncık (22.0, 14.5)
    addStoneSlab(22.0, 14.5, 6.4, 6.4);
    addStoneSlab(17.2, 16.8, 5.6, 2.5);
    // Café walkway connector from courtyard (12..21, z=5.8) & Misket connector (x=22.8, z=10.2)
    addStoneSlab(16.6, 5.8, 9.2, 2.6);
    addStoneSlab(22.6, 10.3, 2.4, 3.6);
    // Tug-of-war northern apron connector (0, 34.8)
    addStoneSlab(0, 34.4, 7.2, 2.6);
    addStoneSlab(-13.5, 34, 2.55, 5.7);
    addStoneSlab(DIG_SITE_ORIGIN.x, DIG_SITE_ORIGIN.z, 10.2, 6.8);
    // Sema & Musiki Stage + Mosque Courtyard West-Southwest Connectors
    addStoneSlab(-17.8, 28.5, 4.6, 2.8);
    addStoneSlab(-23.0, 22.8, 2.8, 6.2);
    addStoneSlab(-29.8, 21.5, 4.2, 5.4);
    // Nine'nin Masal Kamelyası & Gölge Perdesi walkways (right side of Mosque at -36.5, 7.0)
    addStoneSlab(-29.5, 7.0, 6.8, 2.8);
    addStoneSlab(-33.0, 14.0, 2.6, 8.2);
    // Karagöz & Hacivat Gölge Oyunu Sahnesi connectors (at 26.5, 27.5)
    addStoneSlab(18.8, 28.0, 4.2, 2.6);
    addStoneSlab(22.4, 20.4, 2.6, 5.4);


    // Links across the old gaps and up to the entrances of each destination.
    addStoneSlab(12.35, 4.35, 3.8, 3.1);
    addStoneSlab(-22.8, 10, 2.45, 2.8);
    addStoneSlab(-22.8, 27.0, 2.6, 6.5);
    addStoneSlab(-26.45, 21.85, 4.5, 2.5);
    addStoneSlab(-30.2, 15.6, 5.9, 2.25);
    addStoneSlab(-32.9, 10.0, 2.6, 5.5);
    addStoneSlab(-33, 20.7, 4.7, 2.65);
    addStoneSlab(-34.0, 7.0, 3.6, 2.6);
    addStoneSlab(21.5, 24.75, 2.65, 5.9);
    addStoneSlab(24.4, 26.8, 4.3, 2.8);
    addStoneSlab(30.45, 15.1, 11.15, 2.1);
    addStoneSlab(13.45, 16.72, 4.7, 2.65);
    addStoneSlab(-6.3, 18.0, 5.8, 3.8);
    addStoneSlab(6.8, 15.6, 6.8, 4.4);

    // Tessellate the union once. Shared world-space UVs keep the same joints
    // and stone size through courtyards, corners and narrow connections.
    const xs = [...new Set(slabs.flatMap(slab => [slab.left, slab.right]))].sort((a, b) => a - b);
    const zs = [...new Set(slabs.flatMap(slab => [slab.top, slab.bottom]))].sort((a, b) => a - b);
    const positions: number[] = [];
    const uv: number[] = [];
    const indices: number[] = [];
    const appendStrip = (left: number, right: number, top: number, bottom: number) => {
      const base = positions.length / 3;
      for (const [x, z] of [[left, top], [left, bottom], [right, bottom], [right, top]]) {
        positions.push(x, 0.035, z);
        uv.push(x / 3.1, z / 3.1);
      }
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };
    for (let row = 0; row < zs.length - 1; row++) {
      const z = (zs[row] + zs[row + 1]) / 2;
      const band = slabs.filter(slab => z > slab.top && z < slab.bottom);
      let left: number | undefined;
      for (let col = 0; col < xs.length; col++) {
        const x = (xs[col] + xs[col + 1]) / 2;
        const covered = col < xs.length - 1 && band.some(slab => x > slab.left && x < slab.right);
        if (covered) left ??= xs[col];
        else if (left !== undefined) {
          appendStrip(left, xs[col], zs[row], zs[row + 1]);
          left = undefined;
        }
      }
    }
    const paving = this.track(new THREE.BufferGeometry());
    paving.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    paving.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    paving.setIndex(indices);
    paving.computeVertexNormals();
    const paths = new THREE.Mesh(paving, pathMat);
    paths.name = 'walkable-ground';
    paths.receiveShadow = true;
    this.add(paths);

    // Flush decorative Seljuk Star courtyard medallions along the central axis
    const medallionMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getIznikTileTexture('cobalt', 1, 1),
        roughness: 0.35,
      })
    );
    const medallionRimMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getMarbleInlayTexture(1, 1),
        roughness: 0.4,
      })
    );
    const medRingGeo = this.track(new THREE.RingGeometry(1.55, 1.88, 16));
    medRingGeo.rotateX(-Math.PI / 2);
    const medInnerGeo = this.track(new THREE.CircleGeometry(1.52, 8));
    medInnerGeo.rotateX(-Math.PI / 2);
    [
      [0, 8.2],
      [0, 19.5],
    ].forEach(([mx, mz]) => {
      const inner = new THREE.Mesh(medInnerGeo, medallionMat);
      inner.position.set(mx, 0.039, mz);
      inner.receiveShadow = true;
      const outer = new THREE.Mesh(medRingGeo, medallionRimMat);
      outer.position.set(mx, 0.038, mz);
      outer.receiveShadow = true;
      this.add(inner, outer);
    });
  }

  private createAnatolianHorizon(): void {
    // 1. Panoramic Anatolian mountain & rolling hillside ring around the park (r = 56..88m)
    const radialSegs = 64;
    const innerR = 54;
    const outerR = 88;
    const ridgePos: number[] = [];
    const ridgeColors: number[] = [];
    const ridgeIndices: number[] = [];

    const valleyColor = new THREE.Color(0x4b7422);
    const midHillColor = new THREE.Color(0x526b48);
    const peakColor = new THREE.Color(0x7c8798);
    const tmpCol = new THREE.Color();

    // 3 rings: ground skirt (y=0), mid ridge, high outer peak silhouette
    for (let ring = 0; ring < 3; ring++) {
      const r = ring === 0 ? innerR : ring === 1 ? 68 : outerR;
      for (let i = 0; i <= radialSegs; i++) {
        const theta = (i / radialSegs) * Math.PI * 2;
        const n1 = Math.sin(theta * 3 + 0.4) * 0.5 + 0.5;
        const n2 = Math.sin(theta * 7 - 1.1) * 0.5 + 0.5;
        const n3 = Math.cos(theta * 13 + 0.7) * 0.5 + 0.5;
        const ridgeH =
          ring === 0
            ? 0
            : ring === 1
              ? 2.2 + n1 * 4.5 + n2 * 1.8
              : 6.5 + n1 * 8.2 + n2 * 3.8 + n3 * 1.6;
        ridgePos.push(Math.cos(theta) * r, ridgeH - 0.1, Math.sin(theta) * r);

        if (ring === 0) {
          tmpCol.copy(valleyColor);
        } else if (ring === 1) {
          tmpCol.copy(valleyColor).lerp(midHillColor, 0.7);
        } else {
          tmpCol.copy(midHillColor).lerp(peakColor, n1 * 0.85);
        }
        ridgeColors.push(tmpCol.r, tmpCol.g, tmpCol.b);
      }
    }

    const stride = radialSegs + 1;
    for (let ring = 0; ring < 2; ring++) {
      for (let i = 0; i < radialSegs; i++) {
        const a = ring * stride + i;
        const b = a + 1;
        const c = (ring + 1) * stride + i;
        const d = c + 1;
        ridgeIndices.push(a, c, b, b, c, d);
      }
    }

    const ridgeGeo = this.track(new THREE.BufferGeometry());
    ridgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(ridgePos, 3));
    ridgeGeo.setAttribute('color', new THREE.Float32BufferAttribute(ridgeColors, 3));
    ridgeGeo.setIndex(ridgeIndices);
    ridgeGeo.computeVertexNormals();

    const ridgeMat = this.track(
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.94,
        metalness: 0.0,
      })
    );
    const mountains = new THREE.Mesh(ridgeGeo, ridgeMat);
    this.add(mountains);

    // 2. Perimeter Grove of Anatolian Selvi (Cypress) & Pine Trees via InstancedMesh
    const cypressCount = 72;
    const pineCount = 48;
    const dummy = new THREE.Object3D();

    const barkMat = this.track(
      new THREE.MeshStandardMaterial({color: 0x5b3a24, roughness: 0.92})
    );
    const cypressMat = this.track(
      new THREE.MeshStandardMaterial({color: 0x1e5631, roughness: 0.88})
    );
    const pineMat = this.track(
      new THREE.MeshStandardMaterial({color: 0x2d6a3e, roughness: 0.86})
    );

    const trunkGeo = this.track(new THREE.CylinderGeometry(0.14, 0.22, 1.4, 7));
    const cypressConeGeo = this.track(new THREE.ConeGeometry(0.95, 6.2, 8));
    const cypressTrunks = new THREE.InstancedMesh(trunkGeo, barkMat, cypressCount + pineCount);
    const cypressCrowns = new THREE.InstancedMesh(cypressConeGeo, cypressMat, cypressCount);
    const pineCrownGeo = this.track(new THREE.ConeGeometry(1.9, 3.8, 8));
    const pineCrowns = new THREE.InstancedMesh(pineCrownGeo, pineMat, pineCount * 2);

    let tIdx = 0;
    for (let i = 0; i < cypressCount; i++) {
      const a = (i / cypressCount) * Math.PI * 2 + (i % 2) * 0.04;
      const dist = 48.5 + (i % 5) * 1.4;
      const x = Math.cos(a) * dist;
      const z = Math.sin(a) * dist;
      const sc = 0.85 + ((i * 37) % 10) * 0.055;

      dummy.position.set(x, 0.7 * sc, z);
      dummy.rotation.set(0, a, 0);
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      cypressTrunks.setMatrixAt(tIdx++, dummy.matrix);

      dummy.position.set(x, 3.9 * sc, z);
      dummy.scale.set(sc, sc * (1.05 + (i % 3) * 0.1), sc);
      dummy.updateMatrix();
      cypressCrowns.setMatrixAt(i, dummy.matrix);
    }

    for (let i = 0; i < pineCount; i++) {
      const a = (i / pineCount) * Math.PI * 2 + 0.03;
      const dist = 51.0 + (i % 4) * 1.8;
      const x = Math.cos(a) * dist;
      const z = Math.sin(a) * dist;
      const sc = 0.9 + ((i * 23) % 8) * 0.06;

      dummy.position.set(x, 0.7 * sc, z);
      dummy.rotation.set(0, a, 0);
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      cypressTrunks.setMatrixAt(tIdx++, dummy.matrix);

      dummy.position.set(x, 2.7 * sc, z);
      dummy.scale.set(sc, sc, sc);
      dummy.updateMatrix();
      pineCrowns.setMatrixAt(i * 2, dummy.matrix);

      dummy.position.set(x, 4.3 * sc, z);
      dummy.scale.set(sc * 0.72, sc * 0.85, sc * 0.72);
      dummy.updateMatrix();
      pineCrowns.setMatrixAt(i * 2 + 1, dummy.matrix);
    }

    cypressTrunks.instanceMatrix.needsUpdate = true;
    cypressCrowns.instanceMatrix.needsUpdate = true;
    pineCrowns.instanceMatrix.needsUpdate = true;
    this.add(cypressTrunks, cypressCrowns, pineCrowns);
  }

  private createParkTrees(): void {
    const trunkGeo = this.track(new THREE.CylinderGeometry(0.16, 0.3, 1.95, 10));
    const rootFlareGeo = this.track(new THREE.CylinderGeometry(0.28, 0.42, 0.38, 9));
    const branchGeo = this.track(new THREE.CylinderGeometry(0.065, 0.11, 0.95, 7));
    const wood = getWalnutWoodTextures(1, 2);
    const trunkMat = this.track(
      new THREE.MeshStandardMaterial({
        map: wood.map,
        bumpMap: wood.bumpMap,
        bumpScale: 0.03,
        color: 0xa1724c,
        roughness: 0.9,
      })
    );
    const crownGeoA = this.track(new THREE.DodecahedronGeometry(1.12, 1));
    const crownGeoB = this.track(new THREE.DodecahedronGeometry(0.84, 1));
    const crownGeoC = this.track(new THREE.DodecahedronGeometry(0.66, 1));
    const leafMats = [
      this.track(new THREE.MeshStandardMaterial({color: 0x22993d, roughness: 0.82})),
      this.track(new THREE.MeshStandardMaterial({color: 0x2cb54e, roughness: 0.82})),
      this.track(new THREE.MeshStandardMaterial({color: 0x187c38, roughness: 0.84})),
    ];

    PARK_TREE_COORDS.forEach(([x, z, scale], idx) => {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 0.96;
      trunk.castShadow = true;
      trunk.userData.easterEggId = `tree-${idx}`;
      trunk.userData.treeIndex = idx;

      const rootFlare = new THREE.Mesh(rootFlareGeo, trunkMat);
      rootFlare.position.y = 0.18;

      const b1 = new THREE.Mesh(branchGeo, trunkMat);
      b1.position.set(0.32, 1.88, 0.15);
      b1.rotation.z = -0.58;
      const b2 = new THREE.Mesh(branchGeo, trunkMat);
      b2.position.set(-0.3, 1.82, -0.16);
      b2.rotation.z = 0.62;

      const leafMat = leafMats[idx % leafMats.length];
      const crown1 = new THREE.Mesh(crownGeoA, leafMat);
      crown1.position.set(0, 2.52, 0);
      crown1.castShadow = true;
      crown1.userData.easterEggId = `tree-${idx}`;
      crown1.userData.treeIndex = idx;

      const crown2 = new THREE.Mesh(crownGeoB, leafMat);
      crown2.position.set(0.55, 2.9, 0.28);
      crown2.castShadow = true;

      const crown3 = new THREE.Mesh(crownGeoB, leafMat);
      crown3.position.set(-0.5, 2.8, -0.24);
      crown3.castShadow = true;

      const crown4 = new THREE.Mesh(crownGeoC, leafMat);
      crown4.position.set(0.08, 3.32, -0.18);

      tree.add(trunk, rootFlare, b1, b2, crown1, crown2, crown3, crown4);
      tree.position.set(x, 0, z);
      tree.scale.setScalar(scale);
      this.treeGroups.push(tree);
      this.treeShakeTimers.push(0);
      this.interactiveMeshes.push(trunk, crown1);
      this.add(tree);
    });
  }

  private createFlowerbeds(): void {
    // Anatolian Lale (Tulip) clusters flanking promenade, courtyard, fountains & paths
    const spots: Array<[number, number]> = [
      [-4.2, 7.6], [-4.2, 9.6], [-4.2, 15.5], [-4.2, 21.5],
      [4.2, 7.6], [4.2, 9.6], [4.2, 15.5], [4.2, 21.5],
      [-9.8, 5.2], [-10.2, 9.8], [9.8, 5.2], [10.2, 9.8],
      [-7.2, 3.2], [7.2, 3.2], [-15.2, 3.6], [15.2, 3.6],
      [-17.2, 12.2], [17.2, 12.2], [-19.5, 21.5], [19.5, 21.5],
    ];
    const perSpot = 8;
    const total = spots.length * perSpot;

    const stemGeo = this.track(new THREE.CylinderGeometry(0.014, 0.018, 0.34, 5));
    const leafGeo = this.track(new THREE.ConeGeometry(0.09, 0.22, 5));
    const bloomGeo = this.track(new THREE.SphereGeometry(0.068, 7, 6));
    bloomGeo.scale(1, 1.35, 1);

    const stemMat = this.track(new THREE.MeshStandardMaterial({color: 0x15803d, roughness: 0.78}));
    const bloomMat = this.track(new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.45}));

    const stems = new THREE.InstancedMesh(stemGeo, stemMat, total);
    const leaves = new THREE.InstancedMesh(leafGeo, stemMat, total);
    const blooms = new THREE.InstancedMesh(bloomGeo, bloomMat, total);

    const palette = [0xe11d48, 0xf59e0b, 0xf43f5e, 0xa855f7, 0xfbbf24, 0xef4444];
    const dummy = new THREE.Object3D();
    const c = new THREE.Color();
    let idx = 0;

    spots.forEach(([sx, sz], sIdx) => {
      for (let k = 0; k < perSpot; k++) {
        const angle = (k / perSpot) * Math.PI * 2 + sIdx * 0.7;
        const r = 0.14 + (k % 3) * 0.16;
        const fx = sx + Math.cos(angle) * r;
        const fz = sz + Math.sin(angle) * r;
        const hScale = 0.8 + ((k + sIdx) % 4) * 0.12;

        dummy.position.set(fx, 0.17 * hScale, fz);
        dummy.rotation.set(0, angle, 0);
        dummy.scale.setScalar(hScale);
        dummy.updateMatrix();
        stems.setMatrixAt(idx, dummy.matrix);

        dummy.position.set(fx, 0.11 * hScale, fz);
        dummy.rotation.set(0, angle, 0.2);
        dummy.updateMatrix();
        leaves.setMatrixAt(idx, dummy.matrix);

        dummy.position.set(fx, 0.35 * hScale, fz);
        dummy.rotation.set(0, angle, 0);
        dummy.scale.setScalar(hScale);
        dummy.updateMatrix();
        blooms.setMatrixAt(idx, dummy.matrix);

        c.setHex(palette[(sIdx + k) % palette.length]);
        blooms.setColorAt(idx, c);
        idx++;
      }
    });

    stems.instanceMatrix.needsUpdate = true;
    leaves.instanceMatrix.needsUpdate = true;
    blooms.instanceMatrix.needsUpdate = true;
    if (blooms.instanceColor) blooms.instanceColor.needsUpdate = true;
    this.add(stems, leaves, blooms);
  }

  private createTurkishFlag(): void {
    const trav = getTravertineTextures(1, 1);
    const pedestalMat = this.track(
      new THREE.MeshStandardMaterial({
        map: trav.map,
        bumpMap: trav.bumpMap,
        bumpScale: 0.02,
        color: 0xf1ece1,
        roughness: 0.52,
        metalness: 0.06,
      })
    );
    const iznikBandMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getIznikTileTexture('turquoise', 2, 1),
        roughness: 0.22,
      })
    );
    const poleMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.88,
        roughness: 0.2,
      })
    );
    const goldMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.86,
        roughness: 0.22,
      })
    );

    const flagGroup = new THREE.Group();
    flagGroup.position.set(-5.15, 0, 4.65);

    const baseTier1 = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.76, 0.84, 0.24, 8)),
      pedestalMat
    );
    baseTier1.position.y = 0.12;
    baseTier1.castShadow = true;
    baseTier1.receiveShadow = true;
    baseTier1.userData.easterEggId = 'turkish-flag';
    this.interactiveMeshes.push(baseTier1);

    const baseIznik = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.58, 0.64, 0.18, 8)),
      iznikBandMat
    );
    baseIznik.position.y = 0.31;

    const baseTier2 = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.42, 0.5, 0.22, 8)),
      pedestalMat
    );
    baseTier2.position.y = 0.48;
    baseTier2.castShadow = true;
    flagGroup.add(baseIznik);

    const poleHeight = 6.9;
    const pole = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.055, 0.082, poleHeight, 16)),
      poleMat
    );
    pole.position.y = 0.5 + poleHeight / 2;
    pole.castShadow = true;

    const collar = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.11, 0.11, 0.12, 16)),
      goldMat
    );
    collar.position.y = 0.52;

    const finialSphere = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(0.12, 16, 12)),
      goldMat
    );
    finialSphere.position.y = 0.5 + poleHeight + 0.08;

    const finialCone = new THREE.Mesh(
      this.track(new THREE.ConeGeometry(0.075, 0.22, 12)),
      goldMat
    );
    finialCone.position.y = 0.5 + poleHeight + 0.24;

    // Turkish flag cloth texture rendered cleanly from official proportions + SVG
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#e30a17';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Crescent
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(400, 400, 200, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e30a17';
      ctx.beginPath();
      ctx.arc(450, 400, 160, 0, Math.PI * 2);
      ctx.fill();

      // 5-pointed star pointing left toward the crescent
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const ang = Math.PI + (k * Math.PI) / 5;
        const rad = k % 2 === 0 ? 100 : 38.1966;
        const sx = 716.67 + rad * Math.cos(ang);
        const sy = 400 + rad * Math.sin(ang);
        if (k === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
    }
    const flagTex = this.track(new THREE.CanvasTexture(canvas));
    flagTex.colorSpace = THREE.SRGBColorSpace;

    const img = new Image();
    img.onload = () => {
      if (this.isDisposed || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      flagTex.needsUpdate = true;
    };
    img.src = FLAG_URL;

    const flagGeo = this.track(
      new THREE.PlaneGeometry(FLAG_WIDTH, FLAG_HEIGHT, 32, 18)
    );
    // Shift so x = 0 sits right at the pole edge
    flagGeo.translate(FLAG_WIDTH / 2, 0, 0);
    const posAttr = flagGeo.attributes.position as THREE.BufferAttribute;
    this.flagBasePositions = new Float32Array(posAttr.array as Float32Array);
    this.flagGeometry = flagGeo;

    const flagMat = this.track(
      new THREE.MeshStandardMaterial({
        map: flagTex,
        side: THREE.DoubleSide,
        roughness: 0.76,
        metalness: 0.02,
      })
    );

    const flagMesh = new THREE.Mesh(flagGeo, flagMat);
    flagMesh.castShadow = true;

    this.flagPivot = new THREE.Group();
    this.flagPivot.position.set(0.04, 0.5 + poleHeight - FLAG_HEIGHT / 2 - 0.14, 0);
    // Angle slightly forward-right so it reads prominently from the plaza & promenade
    this.flagPivot.rotation.y = -0.36;
    this.flagPivot.add(flagMesh);

    flagGroup.add(
      baseTier1,
      baseTier2,
      pole,
      collar,
      finialSphere,
      finialCone,
      this.flagPivot
    );
    this.add(flagGroup);
  }

  private createAtaturkBillboard(): void {
    const trav = getTravertineTextures(1, 1);
    const plinthMat = this.track(
      new THREE.MeshStandardMaterial({
        map: trav.map,
        bumpMap: trav.bumpMap,
        bumpScale: 0.02,
        color: 0xebe3d3,
        roughness: 0.55,
        metalness: 0.06,
      })
    );
    const frameMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.38,
        metalness: 0.65,
      })
    );
    const goldMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.86,
        roughness: 0.22,
      })
    );
    const iznikPanelMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getIznikTileTexture('cobalt', 2, 1),
        roughness: 0.24,
      })
    );

    const group = new THREE.Group();
    // Placed symmetrically opposite the Turkish Flag right before the museum entrance
    group.position.set(5.35, 0, 4.65);
    group.rotation.y = -0.34;

    // Stepped stone monument platform with İznik riser border
    const step1 = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(3.35, 0.22, 1.25)),
      plinthMat
    );
    step1.position.y = 0.11;
    step1.castShadow = true;
    step1.receiveShadow = true;

    const step2 = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(2.94, 0.24, 0.92)),
      plinthMat
    );
    step2.position.y = 0.34;
    step2.castShadow = true;
    step2.receiveShadow = true;

    const iznikRiser = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(2.98, 0.08, 0.96)),
      iznikPanelMat
    );
    iznikRiser.position.y = 0.45;
    group.add(iznikRiser);

    // Twin fluted columns flanking monument + brass Seljuk star finials
    [-1.3, 1.3].forEach((px) => {
      const col = createAnatolianColumn(
        (item) => this.track(item),
        0.095,
        3.62,
        plinthMat,
        goldMat,
        goldMat
      );
      col.position.set(px, 0.46, 0);

      const star = new THREE.Mesh(
        this.track(createSeljukStarGeometry(0.15, 0.075, 0.05)),
        goldMat
      );
      star.position.set(px, 0.46 + 3.78, 0);

      group.add(col, star);
    });

    // Main framed billboard casing
    const boardW = 2.38;
    const boardH = 3.22;
    const boardCenterY = 2.36;

    const backPlate = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(boardW + 0.14, boardH + 0.14, 0.12)),
      frameMat
    );
    backPlate.position.set(0, boardCenterY, 0);
    backPlate.castShadow = true;

    const goldRim = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(boardW + 0.08, boardH + 0.08, 0.14)),
      goldMat
    );
    goldRim.position.set(0, boardCenterY, 0);

    // High-resolution Canvas rendering photo + quote + Atatürk signature
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1460;
    const ctx = canvas.getContext('2d');
    const boardTex = this.track(new THREE.CanvasTexture(canvas));
    boardTex.colorSpace = THREE.SRGBColorSpace;

    let photoImg: HTMLImageElement | undefined;
    let sigImg: HTMLImageElement | undefined;

    const redrawBoard = () => {
      if (this.isDisposed || !ctx) return;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Warm cream museum parchment backdrop
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#fffdf7');
      bgGrad.addColorStop(1, '#f8eedc');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Inner ornamental double gold border
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 10;
      ctx.strokeRect(24, 24, W - 48, H - 48);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.strokeRect(40, 40, W - 80, H - 80);

      // Photo frame area (upper portion)
      const frameX = 76;
      const frameY = 70;
      const frameW = W - 152; // 928
      const frameH = 826;

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(frameX - 6, frameY - 6, frameW + 12, frameH + 12, 18);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(frameX, frameY, frameW, frameH, 14);
      ctx.clip();

      if (photoImg && photoImg.width > 0) {
        // Cover-fit preserving natural portrait proportions cleanly
        const imgAspect = photoImg.width / photoImg.height;
        const boxAspect = frameW / frameH;
        let dw = frameW;
        let dh = frameH;
        let dx = frameX;
        let dy = frameY;
        if (imgAspect > boxAspect) {
          dh = frameH;
          dw = frameH * imgAspect;
          dx = frameX - (dw - frameW) / 2;
        } else {
          dw = frameW;
          dh = frameW / imgAspect;
          dy = frameY - (dh - frameH) * 0.16;
        }
        ctx.drawImage(photoImg, dx, dy, dw, dh);
      } else {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(frameX, frameY, frameW, frameH);
      }
      ctx.restore();

      // Subtle gold border around portrait photo
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.roundRect(frameX, frameY, frameW, frameH, 14);
      ctx.stroke();

      // Quote section below the photo
      const quote =
        metin("OutdoorWorld", "kucuk_hanimlar_kucuk_beyler_sizler_hepiniz_gelecegin");
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 40px Georgia, "Times New Roman", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const words = quote.split(/\s+/u);
      const lines: string[] = [];
      let line = '';
      const maxTextW = W - 164;
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (line && ctx.measureText(candidate).width > maxTextW) {
          lines.push(line);
          line = word;
        } else {
          line = candidate;
        }
      }
      if (line) lines.push(line);

      const lineHeight = 52;
      const quoteTopY = 964;
      lines.forEach((ln, idx) => {
        ctx.fillText(ln, W / 2, quoteTopY + idx * lineHeight);
      });

      // Decorative thin divider line above signature
      const quoteBottomY = quoteTopY + (lines.length - 0.5) * lineHeight;
      const dividerY = quoteBottomY + 24;
      ctx.strokeStyle = 'rgba(180, 83, 9, 0.52)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 200, dividerY);
      ctx.lineTo(W / 2 + 200, dividerY);
      ctx.stroke();

      // Atatürk signature (ss_4c05a788.png is vertical, rotate +90deg CW so "K. Atatürk" reads left-to-right upright)
      if (sigImg && sigImg.width > 0) {
        const availH = Math.max(120, H - 58 - (dividerY + 18));
        const sigCenterX = W / 2;
        const sigCenterY = dividerY + 18 + availH / 2;
        const aspectRatio = sigImg.width / Math.max(1, sigImg.height);
        const targetHorizontalWidth = Math.min(430, (availH * 0.88) / aspectRatio);
        const targetVerticalThickness = aspectRatio * targetHorizontalWidth;

        ctx.save();
        ctx.translate(sigCenterX, sigCenterY);
        ctx.rotate(Math.PI / 2);
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(
          sigImg,
          -targetVerticalThickness / 2,
          -targetHorizontalWidth / 2,
          targetVerticalThickness,
          targetHorizontalWidth
        );
        ctx.restore();
      }

      boardTex.needsUpdate = true;
    };

    redrawBoard();

    const pImg = new Image();
    pImg.onload = () => {
      photoImg = pImg;
      redrawBoard();
    };
    pImg.src = ATATURK_IMAGE_URL;

    const sImg = new Image();
    sImg.onload = () => {
      sigImg = sImg;
      redrawBoard();
    };
    sImg.src = ATATURK_SIG_URL;

    const boardMat = this.track(
      new THREE.MeshStandardMaterial({
        map: boardTex,
        roughness: 0.45,
        metalness: 0.04,
      })
    );
    const boardFaceGeo = this.track(new THREE.PlaneGeometry(boardW, boardH));
    const frontFace = new THREE.Mesh(boardFaceGeo, boardMat);
    frontFace.position.set(0, boardCenterY, 0.076);

    const backFace = new THREE.Mesh(boardFaceGeo, boardMat);
    backFace.rotation.y = Math.PI;
    backFace.position.set(0, boardCenterY, -0.076);

    // Subtle warm crown molding bar on top of the frame
    const crownBar = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(2.68, 0.14, 0.24)),
      goldMat
    );
    crownBar.position.set(0, boardCenterY + boardH / 2 + 0.11, 0);

    group.add(step1, step2, backPlate, goldRim, frontFace, backFace, crownBar);
    this.add(group);
  }

  private createLeftFiskiye(): void {
    // Grand multi-tiered Anatolian Şadırvan-Fıskiye on the left (-7.5, 0, 8.2)
    const marbleMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getMarbleInlayTexture(2, 2),
        roughness: 0.3,
        metalness: 0.08,
      })
    );
    const trimMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getTravertineTextures(1, 1).map,
        roughness: 0.52,
      })
    );
    const iznikBasinMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getIznikTileTexture('turquoise', 4, 1),
        roughness: 0.18,
      })
    );
    const brassMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.88,
        roughness: 0.2,
      })
    );
    const waterMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.08,
        metalness: 0.32,
        emissive: 0x0284c7,
        emissiveIntensity: 0.28,
      })
    );

    const group = new THREE.Group();
    group.position.set(-7.5, 0, 8.2);

    // Stepped octagonal base plinth + İznik glazed rim
    const plinth = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(2.42, 2.58, 0.14, 8)),
      trimMat
    );
    plinth.position.y = 0.07;
    plinth.receiveShadow = true;

    // Octagonal marble pool wall with İznik glazed collar strip
    const poolWall = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(2.15, 2.22, 0.44, 8)),
      marbleMat
    );
    poolWall.position.y = 0.32;
    poolWall.castShadow = true;
    poolWall.receiveShadow = true;
    poolWall.userData.propType = 'fiskiye';

    const poolTileBand = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(2.18, 2.2, 0.18, 8)),
      iznikBasinMat
    );
    poolTileBand.position.y = 0.32;
    group.add(poolTileBand);

    // Coping rim
    const coping = new THREE.Mesh(
      this.track(new THREE.TorusGeometry(2.08, 0.13, 8, 8)),
      marbleMat
    );
    coping.rotation.x = Math.PI / 2;
    coping.rotation.z = Math.PI / 8;
    coping.position.y = 0.54;
    coping.castShadow = true;

    // Shimmering turquoise pool surface
    const water = new THREE.Mesh(
      this.track(new THREE.CircleGeometry(1.94, 24)),
      waterMat
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.49;
    water.userData.propType = 'fiskiye';
    this.fountainWaters.push(water);

    // Sculpted pedestal & 2 scalloped bowls
    const pedestal = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.24, 0.38, 0.95, 16)),
      marbleMat
    );
    pedestal.position.y = 0.85;
    pedestal.castShadow = true;

    const lowerBowl = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(1.06, 0.34, 0.26, 20)),
      marbleMat
    );
    lowerBowl.position.y = 1.32;
    lowerBowl.castShadow = true;
    const lowerBowlWater = new THREE.Mesh(
      this.track(new THREE.CircleGeometry(0.95, 20)),
      waterMat
    );
    lowerBowlWater.rotation.x = -Math.PI / 2;
    lowerBowlWater.position.y = 1.455;

    const upperShaft = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.14, 0.2, 0.62, 14)),
      marbleMat
    );
    upperShaft.position.y = 1.72;

    const upperBowl = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.56, 0.18, 0.2, 18)),
      marbleMat
    );
    upperBowl.position.y = 2.02;
    upperBowl.castShadow = true;

    // Brass crown spray nozzle at top
    const nozzle = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.06, 0.11, 0.28, 12)),
      brassMat
    );
    nozzle.position.y = 2.22;
    const nozzleOrb = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(0.11, 14, 12)),
      brassMat
    );
    nozzleOrb.position.y = 2.38;

    group.add(
      plinth,
      poolWall,
      coping,
      water,
      pedestal,
      lowerBowl,
      lowerBowlWater,
      upperShaft,
      upperBowl,
      nozzle,
      nozzleOrb
    );
    this.interactiveMeshes.push(poolWall, water);
    this.add(group);

    // Animated parabolic water jets (8 arcs x 10 droplets = 80 instances)
    const totalDrops = this.FISKIYE_ARC_COUNT * this.FISKIYE_DROP_PER_ARC;
    const jetGeo = this.track(new THREE.SphereGeometry(0.042, 7, 6));
    const jetMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xe0f2fe,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.45,
        roughness: 0.12,
        transparent: true,
        opacity: 0.85,
      })
    );
    this.fiskiyeJetMesh = new THREE.InstancedMesh(jetGeo, jetMat, totalDrops);
    this.fiskiyeJetMesh.frustumCulled = false;
    this.add(this.fiskiyeJetMesh);
  }

  private createRightCesme(): void {
    // Traditional Ottoman/Turkish stone Mahalle Çeşmesi on the right (7.5, 0, 8.2)
    const trav = getTravertineTextures(2, 2);
    const limestoneMat = this.track(
      new THREE.MeshStandardMaterial({
        map: trav.map,
        bumpMap: trav.bumpMap,
        bumpScale: 0.025,
        color: 0xf3ebda,
        roughness: 0.72,
        metalness: 0.04,
      })
    );
    const cutStoneMat = this.track(
      new THREE.MeshStandardMaterial({
        map: trav.map,
        color: 0xd5c4a6,
        roughness: 0.78,
      })
    );
    const aynaMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getIznikTileTexture('cobalt', 1, 1),
        roughness: 0.22,
        metalness: 0.08,
      })
    );
    const roofSlateMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x3f4e5d,
        roughness: 0.46,
        metalness: 0.42,
      })
    );
    const brassMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.88,
        roughness: 0.2,
      })
    );
    const waterMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.08,
        metalness: 0.3,
        emissive: 0x0284c7,
        emissiveIntensity: 0.28,
      })
    );

    const group = new THREE.Group();
    group.position.set(7.5, 0, 8.2);
    // Slightly angled toward promenade visitors walking in
    group.rotation.y = -0.35;

    // 2-step wide stone foundation
    const step1 = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(2.5, 0.14, 1.9)),
      cutStoneMat
    );
    step1.position.set(0, 0.07, 0.28);
    step1.receiveShadow = true;

    const step2 = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(2.22, 0.14, 1.58)),
      cutStoneMat
    );
    step2.position.set(0, 0.21, 0.2);
    step2.receiveShadow = true;

    // Main dressed stone body
    const body = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(1.98, 2.38, 0.94)),
      limestoneMat
    );
    body.position.set(0, 1.46, -0.08);
    body.castShadow = true;
    body.receiveShadow = true;
    body.userData.propType = 'cesme';

    // Flanking fluted Anatolian colonnettes framing the recessed niche
    [-0.82, 0.82].forEach((px) => {
      const col = createAnatolianColumn(
        (item) => this.track(item),
        0.09,
        1.85,
        cutStoneMat,
        brassMat,
        brassMat
      );
      col.position.set(px, 0.28, 0.4);
      group.add(col);
    });

    // Recessed İznik glazed Ayna Taşı (mirror stone) inside arch
    const aynaStone = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(1.26, 1.48, 0.08)),
      aynaMat
    );
    aynaStone.position.set(0, 1.18, 0.37);
    aynaStone.userData.propType = 'cesme';

    // Pointed Kemer arch hood & ornamental Seljuk rosette medallion
    const archLintels = new THREE.Mesh(
      this.track(createPointedArchGeometry(1.66, 0.85, 1.18, 0.15, 0.72, 0.18)),
      cutStoneMat
    );
    archLintels.position.set(0, 1.38, 0.42);
    const rosette = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 12)),
      brassMat
    );
    rosette.rotation.x = Math.PI / 2;
    rosette.position.set(0, 1.62, 0.42);

    // Kitabe (Inscription Plaque): "ÇEŞME"
    const kitabeCanvas = document.createElement('canvas');
    kitabeCanvas.width = 512;
    kitabeCanvas.height = 128;
    const kCtx = kitabeCanvas.getContext('2d');
    if (kCtx) {
      kCtx.fillStyle = '#1e293b';
      kCtx.fillRect(0, 0, 512, 128);
      kCtx.strokeStyle = '#d97706';
      kCtx.lineWidth = 8;
      kCtx.strokeRect(8, 8, 496, 112);
      kCtx.fillStyle = '#fde68a';
      kCtx.font = 'bold 34px Georgia, serif';
      kCtx.textAlign = 'center';
      kCtx.textBaseline = 'middle';
      kCtx.fillText(metin("OutdoorWorld", "mirasium_cesmesi"), 256, 52);
      kCtx.fillStyle = '#bae6fd';
      kCtx.font = '600 20px Georgia, serif';
    }
    const kitabeTex = this.track(new THREE.CanvasTexture(kitabeCanvas));
    kitabeTex.colorSpace = THREE.SRGBColorSpace;
    const kitabe = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(1.42, 0.36)),
      this.track(new THREE.MeshBasicMaterial({map: kitabeTex}))
    );
    kitabe.position.set(0, 2.34, 0.41);

    // Cornice + Hipped pyramidal Ottoman lead roof + Brass Alem finial
    const cornice = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(2.24, 0.16, 1.24)),
      cutStoneMat
    );
    cornice.position.set(0, 2.68, -0.04);
    cornice.castShadow = true;

    const roof = new THREE.Mesh(
      this.track(new THREE.ConeGeometry(1.58, 0.88, 4)),
      roofSlateMat
    );
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1.05, 1, 0.65);
    roof.position.set(0, 3.18, -0.04);
    roof.castShadow = true;

    const alemRod = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.03, 0.045, 0.42, 10)),
      brassMat
    );
    alemRod.position.set(0, 3.74, -0.04);
    const alemSphere = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(0.09, 12, 10)),
      brassMat
    );
    alemSphere.position.set(0, 3.85, -0.04);

    // Carved stone Kurna (trough basin) in front of the faucet
    const kurnaBase = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(1.04, 0.44, 0.58)),
      cutStoneMat
    );
    kurnaBase.position.set(0, 0.46, 0.68);
    kurnaBase.castShadow = true;
    kurnaBase.userData.propType = 'cesme';

    const kurnaWater = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(0.84, 0.4)),
      waterMat
    );
    kurnaWater.rotation.x = -Math.PI / 2;
    kurnaWater.position.set(0, 0.685, 0.68);
    kurnaWater.userData.propType = 'cesme';

    // Curved protruding brass Musluk (faucet) + animated falling water stream
    const spoutArm = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.032, 0.042, 0.24, 10)),
      brassMat
    );
    spoutArm.rotation.x = Math.PI / 2;
    spoutArm.position.set(0, 1.14, 0.52);

    const spoutTip = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.025, 0.032, 0.1, 10)),
      brassMat
    );
    spoutTip.position.set(0, 1.1, 0.63);

    const spoutHandle = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.11, 0.03, 0.03)),
      brassMat
    );
    spoutHandle.position.set(0, 1.2, 0.56);

    this.cesmeSpoutStream = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.018, 0.028, 0.42, 8)),
      this.track(
        new THREE.MeshStandardMaterial({
          color: 0xbae6fd,
          emissive: 0x38bdf8,
          emissiveIntensity: 0.45,
          transparent: true,
          opacity: 0.78,
        })
      )
    );
    this.cesmeSpoutStream.position.set(0, 0.88, 0.63);

    group.add(
      step1,
      step2,
      body,
      aynaStone,
      archLintels,
      rosette,
      kitabe,
      cornice,
      roof,
      alemRod,
      alemSphere,
      kurnaBase,
      kurnaWater,
      spoutArm,
      spoutTip,
      spoutHandle,
      this.cesmeSpoutStream
    );
    this.interactiveMeshes.push(body, aynaStone, kurnaBase, kurnaWater);
    this.add(group);
  }

  private createHedgeLabyrinth(): void {
    // 7x7 Walkable Boxwood Hedge Labyrinth on right courtyard: x: 17.5..31.5, z: -14.5..-0.5
    const ROWS = 7;
    const COLS = 7;
    const CELL = 2.0;
    const START_X = 18.5; // col 0 center (west wall at 17.5)
    const START_Z = -13.5; // row 0 center (north wall at -14.5)
    const WALL_H = 1.85;
    const WALL_T = 0.42;

    const hedgeMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getMeadowGrassTexture(2, 2),
        color: 0x3b8f38,
        roughness: 0.88,
      })
    );
    const hedgeTopMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x2ca043,
        roughness: 0.84,
      })
    );
    const goldMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        metalness: 0.88,
        roughness: 0.2,
      })
    );
    const stoneMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getTravertineTextures(2, 2).map,
        bumpMap: getTravertineTextures(2, 2).bumpMap,
        bumpScale: 0.02,
        color: 0xded3be,
        roughness: 0.7,
      })
    );

    // Cobbled stone floor inside the labyrinth so footsteps feel authentic
    const cobbleMaze = getCobblePlazaTextures(6, 6);
    const mazeFloor = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(COLS * CELL, 0.03, ROWS * CELL)),
      this.track(
        new THREE.MeshStandardMaterial({
          map: cobbleMaze.map,
          bumpMap: cobbleMaze.bumpMap,
          bumpScale: 0.015,
          roughness: 0.84,
        })
      )
    );
    mazeFloor.position.set(24.5, 0.015, -7.5);
    mazeFloor.receiveShadow = true;
    mazeFloor.name = 'walkable-ground';
    this.add(mazeFloor);

    // Define open passages as undirected cell pairs "r1,c1-r2,c2"
    const open = new Set<string>();
    const connect = (r1: number, c1: number, r2: number, c2: number) => {
      open.add(`${r1},${c1}-${r2},${c2}`);
      open.add(`${r2},${c2}-${r1},${c1}`);
    };

    // Main winding path from west entrance (3,0) to center crown (3,3) + alcoves
    const path: Array<[number, number]> = [
      [3, 0],
      [2, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 3],
      [1, 4],
      [0, 4],
      [0, 5],
      [0, 6],
      [1, 6],
      [2, 6],
      [2, 5],
      [3, 5],
      [4, 5],
      [5, 5],
      [5, 4],
      [4, 4],
      [4, 3],
      [3, 3],
    ];
    for (let i = 0; i < path.length - 1; i++) {
      connect(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]);
    }
    // Scenic branches & dead-end flower alcoves
    connect(3, 0, 4, 0);
    connect(4, 0, 5, 0);
    connect(5, 0, 6, 0);
    connect(6, 0, 6, 1);
    connect(6, 1, 5, 1);
    connect(5, 1, 4, 1);

    connect(4, 1, 4, 2);
    connect(4, 2, 5, 2);
    connect(5, 2, 6, 2);
    connect(6, 2, 6, 3);
    connect(6, 3, 5, 3);

    connect(6, 3, 6, 4);
    connect(6, 4, 6, 5);
    connect(6, 5, 6, 6);
    connect(6, 6, 5, 6);
    connect(5, 6, 4, 6);
    connect(4, 6, 3, 6);

    connect(1, 1, 2, 1);
    connect(2, 1, 3, 1);
    connect(3, 1, 3, 2);
    connect(3, 2, 2, 2);
    connect(1, 2, 2, 2);
    connect(0, 0, 1, 0);
    connect(2, 3, 2, 4);
    connect(1, 4, 1, 5);
    connect(2, 4, 3, 4);

    const addWallSegment = (cx: number, cz: number, w: number, d: number) => {
      const box = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(w, WALL_H, d)),
        hedgeMat
      );
      box.position.set(cx, WALL_H / 2, cz);
      box.castShadow = true;
      box.receiveShadow = true;

      const cap = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(w + 0.04, 0.14, d + 0.04)),
        hedgeTopMat
      );
      cap.position.set(cx, WALL_H + 0.04, cz);
      this.add(box, cap);

      this.mazeWallRects.push({
        minX: cx - w / 2,
        maxX: cx + w / 2,
        minZ: cz - d / 2,
        maxZ: cz + d / 2,
      });
    };

    // Horizontal walls (north boundary r=-1, internal r=0..5, south boundary r=6)
    for (let r = -1; r < ROWS; r++) {
      const wz = START_Z - CELL / 2 + (r + 1) * CELL;
      for (let c = 0; c < COLS; c++) {
        const isClosed =
          r < 0 || r >= ROWS - 1 || !open.has(`${r},${c}-${r + 1},${c}`);
        if (isClosed) {
          addWallSegment(START_X + c * CELL, wz, CELL + WALL_T, WALL_T);
        }
      }
    }

    // Vertical walls (west boundary c=-1 open at row 3, internal c=0..5, east boundary c=6)
    for (let c = -1; c < COLS; c++) {
      const wx = START_X - CELL / 2 + (c + 1) * CELL;
      for (let r = 0; r < ROWS; r++) {
        if (c === -1 && r === 3) continue; // West entrance open!
        const isClosed =
          c < 0 || c >= COLS - 1 || !open.has(`${r},${c}-${r},${c + 1}`);
        if (isClosed) {
          addWallSegment(wx, START_Z + r * CELL, WALL_T, CELL + WALL_T);
        }
      }
    }

    // Monumental Seljuk Stone Gatehouse Archway at (17.5, 0, -7.5)
    const archGroup = new THREE.Group();
    archGroup.position.set(17.5, 0, -7.5);
    const iznikArchMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getIznikTileTexture('emerald', 2, 1),
        roughness: 0.22,
      })
    );
    [-1.08, 1.08].forEach((pz) => {
      const col = createAnatolianColumn(
        (item) => this.track(item),
        0.13,
        2.5,
        stoneMat,
        iznikArchMat,
        goldMat
      );
      col.position.set(0, 0, pz);
      const alem = createOttomanAlem((item) => this.track(item), 0.35, goldMat);
      alem.position.set(0, 2.52, pz);
      archGroup.add(col, alem);
    });

    // Pointed stone arch span rotated along Z axis
    const gateArch = new THREE.Mesh(
      this.track(createPointedArchGeometry(2.38, 1.15, 1.78, 0.1, 0.92, 0.34)),
      stoneMat
    );
    gateArch.rotation.y = Math.PI / 2;
    gateArch.position.set(0, 2.15, 0);
    archGroup.add(gateArch);

    const archSignCanvas = document.createElement('canvas');
    archSignCanvas.width = 512;
    archSignCanvas.height = 128;
    const sCtx = archSignCanvas.getContext('2d');
    if (sCtx) {
      sCtx.fillStyle = '#065f46';
      sCtx.fillRect(0, 0, 512, 128);
      sCtx.strokeStyle = '#fbbf24';
      sCtx.lineWidth = 8;
      sCtx.strokeRect(8, 8, 496, 112);
      sCtx.fillStyle = '#fde047';
      sCtx.font = 'bold 34px "Google Sans", Arial, sans-serif';
      sCtx.textAlign = 'center';
      sCtx.textBaseline = 'middle';
      sCtx.fillText(metin("OutdoorWorld", "labirent"), 256, 64);
    }
    const archTex = this.track(new THREE.CanvasTexture(archSignCanvas));
    archTex.colorSpace = THREE.SRGBColorSpace;
    const archBanner = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.42, 0.56, 2.34)),
      this.track(new THREE.MeshBasicMaterial({map: archTex}))
    );
    archBanner.position.set(0, 3.05, 0);
    archGroup.add(archBanner);
    this.add(archGroup);

    // Center Chamber Octagonal Marble Pedestal & Bejeweled Golden Crown at (24.5, 0, -7.5)
    const centerPlinth = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.75, 0.85, 0.12, 8)),
      iznikArchMat
    );
    centerPlinth.position.set(24.5, 0.06, -7.5);
    const centerPedestal = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.42, 0.54, 0.72, 8)),
      stoneMat
    );
    centerPedestal.position.set(24.5, 0.42, -7.5);
    centerPedestal.castShadow = true;
    this.add(centerPlinth, centerPedestal);

    this.mazeCrownGroup = new THREE.Group();
    this.mazeCrownGroup.position.set(24.5, 1.12, -7.5);

    const crownBand = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.26, 0.22, 0.2, 8)),
      goldMat
    );
    crownBand.userData.propType = 'maze-crown';

    const gemMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x22d3ee,
        emissiveIntensity: 0.75,
        roughness: 0.12,
      })
    );
    const centerGem = new THREE.Mesh(
      this.track(createSeljukStarGeometry(0.18, 0.09, 0.08)),
      gemMat
    );
    centerGem.position.y = 0.25;
    centerGem.userData.propType = 'maze-crown';

    const halo = new THREE.Mesh(
      this.track(new THREE.TorusGeometry(0.38, 0.025, 8, 24)),
      this.track(
        new THREE.MeshBasicMaterial({
          color: 0xfde047,
          transparent: true,
          opacity: 0.75,
        })
      )
    );
    halo.rotation.x = Math.PI / 2;
    halo.userData.propType = 'maze-crown';

    this.mazeCrownGroup.add(crownBand, centerGem, halo);
    this.interactiveMeshes.push(crownBand, centerGem, halo);
    this.add(this.mazeCrownGroup);
  }

  private createOutdoorActivityZones(): void {
    const walnutTex = getWalnutWoodTextures(1, 1);
    const woodMat = this.track(
      new THREE.MeshStandardMaterial({
        map: walnutTex.map,
        bumpMap: walnutTex.bumpMap,
        bumpScale: 0.02,
        color: 0xd49d70,
        roughness: 0.68,
      })
    );
    const goldMat = this.track(
      new THREE.MeshStandardMaterial({color: 0xf59e0b, metalness: 0.85, roughness: 0.22})
    );
    const roofClay = getTerracottaRoofTextures(3, 2);
    const roofTileMat = this.track(
      new THREE.MeshStandardMaterial({
        map: roofClay.map,
        bumpMap: roofClay.bumpMap,
        bumpScale: 0.025,
        roughness: 0.66,
      })
    );

    // 1. MASA TENİSİ (Ping-Pong) at (-12.5, 0, 19.5)
    const ppGroup = new THREE.Group();
    ppGroup.position.set(-12.5, 0, 19.5);
    const ppTop = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(2.65, 0.08, 1.48)),
      this.track(new THREE.MeshStandardMaterial({color: 0x1e40af, roughness: 0.3}))
    );
    ppTop.position.y = 0.78;
    ppTop.castShadow = true;
    ppTop.userData.activityType = 'pingpong';

    const ppTrim = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(2.71, 0.06, 1.54)),
      this.track(new THREE.MeshStandardMaterial({color: 0xf8fafc, roughness: 0.45}))
    );
    ppTrim.position.y = 0.775;

    const ppLine = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(2.66, 0.085, 0.04)),
      this.track(new THREE.MeshStandardMaterial({color: 0xf8fafc, roughness: 0.5}))
    );
    ppLine.position.y = 0.782;

    const ppNet = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.03, 0.16, 1.56)),
      this.track(
        new THREE.MeshStandardMaterial({
          color: 0xe2e8f0,
          transparent: true,
          opacity: 0.84,
        })
      )
    );
    ppNet.position.y = 0.89;
    ppNet.userData.activityType = 'pingpong';

    const ppPostGeo = this.track(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 8));
    [-0.8, 0.8].forEach((pz) => {
      const netPost = new THREE.Mesh(ppPostGeo, goldMat);
      netPost.position.set(0, 0.89, pz);
      ppGroup.add(netPost);
    });

    const ppLegGeo = this.track(new THREE.CylinderGeometry(0.04, 0.045, 0.76, 8));
    [
      [-1.1, -0.58],
      [-1.1, 0.58],
      [1.1, -0.58],
      [1.1, 0.58],
    ].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(ppLegGeo, woodMat);
      leg.position.set(lx, 0.38, lz);
      ppGroup.add(leg);
    });

    // Two paddles sitting neatly on table ends
    const paddleBladeGeo = this.track(new THREE.CylinderGeometry(0.11, 0.11, 0.022, 16));
    const paddleHandleGeo = this.track(new THREE.CylinderGeometry(0.018, 0.022, 0.14, 8));
    [
      [-1.12, 0xe11d48],
      [1.12, 0x0f172a],
    ].forEach(([px, col]) => {
      const pad = new THREE.Mesh(
        paddleBladeGeo,
        this.track(new THREE.MeshStandardMaterial({color: col, roughness: 0.45}))
      );
      pad.position.set(px, 0.832, 0.35);
      pad.userData.activityType = 'pingpong';
      const ph = new THREE.Mesh(paddleHandleGeo, woodMat);
      ph.rotation.z = Math.PI / 2;
      ph.position.set(px + (px < 0 ? -0.14 : 0.14), 0.832, 0.35);
      ppGroup.add(pad, ph);
    });

    this.pingPongBall = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(0.055, 10, 8)),
      this.track(
        new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.45,
        })
      )
    );
    this.pingPongBall.position.set(0, 1.0, 0);
    ppGroup.add(ppTrim, ppTop, ppLine, ppNet, this.pingPongBall);
    this.interactiveMeshes.push(ppTop, ppNet);
    this.add(ppGroup);

    // 2. MANGALA GAZEBO at (12.5, 0, 19.5)
    const mgGroup = new THREE.Group();
    mgGroup.position.set(12.5, 0, 19.5);
    [
      [-1.6, -1.6],
      [1.6, -1.6],
      [-1.6, 1.6],
      [1.6, 1.6],
    ].forEach(([px, pz]) => {
      const col = createAnatolianColumn((item) => this.track(item), 0.1, 2.75, woodMat, goldMat, goldMat);
      col.position.set(px, 0, pz);
      mgGroup.add(col);
    });

    const pergolaRoof = new THREE.Mesh(
      this.track(new THREE.ConeGeometry(2.65, 1.02, 4)),
      roofTileMat
    );
    pergolaRoof.rotation.y = Math.PI / 4;
    pergolaRoof.position.y = 3.24;
    pergolaRoof.castShadow = true;

    const pergolaAlem = createOttomanAlem((item) => this.track(item), 0.45, goldMat);
    pergolaAlem.position.y = 3.74;

    const lowTable = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.95, 0.88, 0.56, 8)),
      woodMat
    );
    lowTable.position.y = 0.28;
    lowTable.castShadow = true;
    lowTable.userData.activityType = 'mangala';

    const mangalaBoard = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(1.22, 0.08, 0.48)),
      this.track(new THREE.MeshStandardMaterial({map: walnutTex.map, color: 0x9b5a34, roughness: 0.42}))
    );
    mangalaBoard.position.y = 0.6;
    mangalaBoard.userData.activityType = 'mangala';

    const pitMat = this.track(new THREE.MeshStandardMaterial({color: 0x3b2214, roughness: 0.7}));
    const pitGeo = this.track(new THREE.CylinderGeometry(0.056, 0.052, 0.026, 10));
    const beadGeo = this.track(new THREE.SphereGeometry(0.022, 7, 6));
    const beadColors = [0x38bdf8, 0xfbbf24, 0x34d399, 0xf43f5e];
    for (let i = 0; i < 6; i++) {
      const px = -0.38 + i * 0.15;
      [-0.12, 0.12].forEach((pz, rowIdx) => {
        const pit = new THREE.Mesh(pitGeo, pitMat);
        pit.position.set(px, 0.645, pz);
        pit.userData.activityType = 'mangala';
        mgGroup.add(pit);

        const bead = new THREE.Mesh(
          beadGeo,
          this.track(
            new THREE.MeshStandardMaterial({
              color: beadColors[(i + rowIdx) % beadColors.length],
              roughness: 0.15,
              metalness: 0.35,
            })
          )
        );
        bead.position.set(px, 0.662, pz);
        mgGroup.add(bead);
      });
    }
    mgGroup.add(pergolaRoof, pergolaAlem, lowTable, mangalaBoard);
    this.interactiveMeshes.push(lowTable, mangalaBoard);
    this.add(mgGroup);

    // 3. HALKA ATMA (Ring-Toss) at (-22.5, 0, 7.0)
    const rtGroup = new THREE.Group();
    rtGroup.position.set(-22.5, 0, 7.0);
    const rtPlinth = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(2.6, 0.08, 1.56)),
      woodMat
    );
    rtPlinth.position.set(0, 0.04, -0.6);
    const rtBoard = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(2.42, 0.14, 1.4)),
      this.track(new THREE.MeshStandardMaterial({map: getIznikTileTexture('cobalt', 2, 1), roughness: 0.25}))
    );
    rtBoard.position.set(0, 0.12, -0.6);
    rtBoard.userData.activityType = 'ringtoss';
    const pegGeo = this.track(new THREE.CylinderGeometry(0.05, 0.068, 0.72, 12));
    const pegBaseGeo = this.track(new THREE.CylinderGeometry(0.14, 0.16, 0.06, 12));
    const ringGeo = this.track(new THREE.TorusGeometry(0.15, 0.034, 8, 20));
    [-0.75, 0, 0.75].forEach((px, idx) => {
      const pegBase = new THREE.Mesh(pegBaseGeo, woodMat);
      pegBase.position.set(px, 0.21, -0.6);
      const peg = new THREE.Mesh(pegGeo, goldMat);
      peg.position.set(px, 0.56, -0.6);
      peg.userData.activityType = 'ringtoss';
      const pegCap = new THREE.Mesh(this.track(new THREE.SphereGeometry(0.065, 10, 8)), goldMat);
      pegCap.position.set(px, 0.94, -0.6);
      const ring = new THREE.Mesh(
        ringGeo,
        this.track(
          new THREE.MeshStandardMaterial({
            color: idx === 1 ? 0x38bdf8 : idx === 0 ? 0xfbbf24 : 0xf43f5e,
            roughness: 0.3,
          })
        )
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(px, 0.28, -0.6);
      ring.userData.activityType = 'ringtoss';
      rtGroup.add(pegBase, peg, pegCap, ring);
      this.interactiveMeshes.push(peg, ring);
    });
    rtGroup.add(rtPlinth, rtBoard);
    this.interactiveMeshes.push(rtBoard);
    this.add(rtGroup);

    // 4. SEKSEK (Realistic 10-Square Turkish Hopscotch Court + Tossed Pebble + Target Halo)
    const courtFrame = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(2.38, 0.02, 8.65)),
      this.track(
        new THREE.MeshStandardMaterial({
          color: 0x334155,
          roughness: 0.88,
        })
      )
    );
    courtFrame.position.set(0, 0.036, 27.95);
    courtFrame.receiveShadow = true;
    this.add(courtFrame);

    // Chalk court header placard "🪨 SEKSEK PARKURU"
    const sekCanvas = document.createElement('canvas');
    sekCanvas.width = 512;
    sekCanvas.height = 112;
    const sekCtx = sekCanvas.getContext('2d');
    if (sekCtx) {
      sekCtx.fillStyle = '#0f172a';
      sekCtx.fillRect(0, 0, 512, 112);
      sekCtx.strokeStyle = '#fde047';
      sekCtx.lineWidth = 6;
      sekCtx.strokeRect(6, 6, 500, 100);
      sekCtx.fillStyle = '#fde047';
      sekCtx.font = 'bold 34px "Google Sans", Arial, sans-serif';
      sekCtx.textAlign = 'center';
      sekCtx.textBaseline = 'middle';
      sekCtx.fillText(metin("OutdoorWorld", "muzikli_seksek"), 256, 56);
    }
    const sekTex = this.track(new THREE.CanvasTexture(sekCanvas));
    sekTex.colorSpace = THREE.SRGBColorSpace;
    const sekSign = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(2.05, 0.45)),
      this.track(new THREE.MeshBasicMaterial({map: sekTex, side: THREE.DoubleSide}))
    );
    sekSign.rotation.x = -Math.PI / 2;
    sekSign.position.set(0, 0.052, 23.45);
    this.add(sekSign);

    HOPSCOTCH_TILES.forEach((tile) => {
      const w = tile.width ?? 0.86;
      const d = tile.num === 10 ? 1.12 : 0.84;
      const c = document.createElement('canvas');
      c.width = tile.num === 10 ? 256 : 128;
      c.height = 128;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.fillStyle = tile.color;
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 8;
        ctx.strokeRect(8, 8, c.width - 16, c.height - 16);
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.setLineDash([8, 6]);
        ctx.lineWidth = 3;
        ctx.strokeRect(18, 18, c.width - 36, c.height - 36);
        ctx.setLineDash([]);
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${tile.num === 10 ? 54 : 62}px "Google Sans", Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tile.label ?? String(tile.num), c.width / 2, 66);
      }
      const tex = this.track(new THREE.CanvasTexture(c));
      tex.colorSpace = THREE.SRGBColorSpace;
      const tileMesh = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(w, 0.042, d)),
        this.track(new THREE.MeshStandardMaterial({map: tex, roughness: 0.44}))
      );
      tileMesh.position.set(tile.x, 0.05, tile.z);
      tileMesh.receiveShadow = true;
      this.hopscotchMeshes.push(tileMesh);
      this.add(tileMesh);
    });

    // Animated golden target halo & tossed Seksek pebble
    this.hopscotchTargetHalo = new THREE.Mesh(
      this.track(new THREE.TorusGeometry(0.46, 0.04, 8, 24)),
      this.track(
        new THREE.MeshStandardMaterial({
          color: 0xfde047,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.85,
          roughness: 0.2,
        })
      )
    );
    this.hopscotchTargetHalo.rotation.x = Math.PI / 2;
    this.hopscotchTargetHalo.position.set(
      HOPSCOTCH_TILES[0].x,
      0.09,
      HOPSCOTCH_TILES[0].z
    );
    this.add(this.hopscotchTargetHalo);

    this.hopscotchStone = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.14, 0.15, 0.055, 14)),
      this.track(
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.35,
          roughness: 0.35,
        })
      )
    );
    this.hopscotchStone.castShadow = true;
    this.hopscotchStonePos.set(HOPSCOTCH_TILES[0].x, 0.1, HOPSCOTCH_TILES[0].z);
    this.hopscotchStone.position.copy(this.hopscotchStonePos);
    this.add(this.hopscotchStone);

    // 4b. BEŞTAŞ ALANI at (-13.8, 0, 28.5)
    const bestasGroup = new THREE.Group();
    bestasGroup.position.set(-13.8, 0, 28.5);
    const kilimMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getAnatolianKilimTexture('crimson'),
        roughness: 0.86,
      })
    );
    const kilimBorderMat = this.track(
      new THREE.MeshStandardMaterial({color: 0xb45309, roughness: 0.72})
    );
    const copperMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.86,
        roughness: 0.24,
      })
    );
    const kilim = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(2.5, 0.04, 2.2)),
      kilimMat
    );
    kilim.position.y = 0.04;
    kilim.userData.activityType = 'bestas';
    const kilimTrim = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(2.68, 0.032, 2.38)),
      kilimBorderMat
    );
    kilimTrim.position.y = 0.032;
    kilimTrim.userData.activityType = 'bestas';

    const tray = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.74, 0.78, 0.36, 16)),
      woodMat
    );
    tray.position.y = 0.21;
    tray.castShadow = true;
    tray.userData.activityType = 'bestas';

    // Hammered copper sini tray resting atop walnut stand
    const copperSini = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.82, 0.74, 0.06, 20)),
      copperMat
    );
    copperSini.position.y = 0.4;
    copperSini.userData.activityType = 'bestas';
    bestasGroup.add(copperSini);

    const stoneGeo = this.track(new THREE.DodecahedronGeometry(0.11, 1));
    const stoneColors = [0xf8fafc, 0x94a3b8, 0xfbbf24, 0x38bdf8, 0xf43f5e];
    [
      [-0.25, -0.15],
      [0.24, -0.18],
      [0.0, 0.04],
      [-0.22, 0.24],
      [0.26, 0.22],
    ].forEach(([sx, sz], idx) => {
      const st = new THREE.Mesh(
        stoneGeo,
        this.track(
          new THREE.MeshStandardMaterial({
            color: stoneColors[idx],
            roughness: 0.35,
          })
        )
      );
      st.scale.set(1.15, 0.68, 1.0);
      st.position.set(sx, 0.45, sz);
      st.castShadow = true;
      st.userData.activityType = 'bestas';
      bestasGroup.add(st);
      this.interactiveMeshes.push(st);
    });
    bestasGroup.add(kilimTrim, kilim, tray);
    this.interactiveMeshes.push(kilim, tray);
    this.add(bestasGroup);

    // 4d. TOPAÇ ÇEVİRME ALANI at (-23.0, 0, 16.8)
    const topacGroup = new THREE.Group();
    topacGroup.position.set(-23.0, 0, 16.8);
    const arenaDisc = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(1.5, 1.56, 0.08, 28)),
      this.track(new THREE.MeshStandardMaterial({map: getIznikTileTexture('turquoise', 2, 2), roughness: 0.25}))
    );
    arenaDisc.position.y = 0.04;
    arenaDisc.receiveShadow = true;
    arenaDisc.userData.activityType = 'topac';

    const arenaRim = new THREE.Mesh(
      this.track(new THREE.TorusGeometry(1.48, 0.07, 8, 28)),
      goldMat
    );
    arenaRim.rotation.x = Math.PI / 2;
    arenaRim.position.y = 0.095;
    arenaRim.userData.activityType = 'topac';
    topacGroup.add(arenaDisc, arenaRim);
    this.interactiveMeshes.push(arenaDisc, arenaRim);

    const topColors = [0xe11d48, 0x2563eb, 0xf59e0b];
    const topPoints = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.035, 0.1),
      new THREE.Vector2(0.18, 0.26),
      new THREE.Vector2(0.24, 0.38),
      new THREE.Vector2(0.14, 0.44),
      new THREE.Vector2(0.06, 0.45),
      new THREE.Vector2(0.04, 0.52),
      new THREE.Vector2(0.0, 0.54),
    ];
    const topLatheGeo = this.track(new THREE.LatheGeometry(topPoints, 16));
    const topStripeGeo = this.track(new THREE.TorusGeometry(0.22, 0.018, 6, 18));
    [
      [-0.45, -0.25],
      [0.52, -0.15],
      [0.05, 0.48],
    ].forEach(([tx, tz], idx) => {
      const spin = new THREE.Group();
      spin.position.set(tx, 0.09, tz);

      const body = new THREE.Mesh(
        topLatheGeo,
        this.track(
          new THREE.MeshStandardMaterial({
            color: topColors[idx],
            roughness: 0.28,
          })
        )
      );
      body.castShadow = true;
      body.userData.activityType = 'topac';

      const stripe = new THREE.Mesh(topStripeGeo, goldMat);
      stripe.rotation.x = Math.PI / 2;
      stripe.position.y = 0.37;
      stripe.userData.activityType = 'topac';

      spin.add(body, stripe);
      this.topacSpinGroups.push(spin);
      this.interactiveMeshes.push(body, stripe);
      topacGroup.add(spin);
    });
    this.add(topacGroup);

    // 4e. MİSKET / CINCIK ALANI at (22.0, 0, 14.5)
    const misketGroup = new THREE.Group();
    misketGroup.position.set(22.0, 0, 14.5);
    const triRing = new THREE.Mesh(
      this.track(new THREE.RingGeometry(1.12, 1.28, 3)),
      goldMat
    );
    triRing.rotation.x = -Math.PI / 2;
    triRing.position.y = 0.052;
    triRing.userData.activityType = 'misket';

    const misketBase = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(1.38, 1.44, 0.05, 24)),
      this.track(
        new THREE.MeshStandardMaterial({
          map: getMarbleInlayTexture(2, 2),
          color: 0xe2d7c5,
          roughness: 0.42,
        })
      )
    );
    misketBase.position.y = 0.025;
    misketBase.userData.activityType = 'misket';
    misketGroup.add(misketBase, triRing);
    this.interactiveMeshes.push(misketBase, triRing);

    const marbleGeo = this.track(new THREE.SphereGeometry(0.14, 16, 12));
    const marbleColors = [
      0x0284c7, 0xe11d48, 0xf59e0b, 0x16a34a, 0x9333ea, 0xea580c, 0x0d9488,
    ];
    [
      [0, 0],
      [-0.36, -0.26],
      [0.36, -0.26],
      [-0.36, 0.28],
      [0.36, 0.28],
      [0, -0.52],
      [0, 0.54],
    ].forEach(([mx, mz], idx) => {
      const m = new THREE.Mesh(
        marbleGeo,
        this.track(
          new THREE.MeshStandardMaterial({
            color: marbleColors[idx % marbleColors.length],
            roughness: 0.08,
            metalness: 0.42,
          })
        )
      );
      m.position.set(mx, 0.19, mz);
      m.castShadow = true;
      m.userData.activityType = 'misket';
      misketGroup.add(m);
      this.interactiveMeshes.push(m);
    });
    this.add(misketGroup);

    // 5. Arkeoloji Kazı Alanı
    const digGroup = new THREE.Group();
    digGroup.position.copy(DIG_SITE_ORIGIN);
    const frameW = 5.4;
    const frameD = 3.8;
    const borderMat = woodMat;
    const sandMat = this.track(
      new THREE.MeshStandardMaterial({color: 0xe7c98e, roughness: 0.94})
    );
    const sandFloor = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(frameW - 0.24, 0.14, frameD - 0.24)),
      sandMat
    );
    sandFloor.position.y = 0.07;
    sandFloor.receiveShadow = true;

    const sideLR = this.track(new THREE.BoxGeometry(0.22, 0.28, frameD));
    const sideFB = this.track(new THREE.BoxGeometry(frameW, 0.28, 0.22));
    const bL = new THREE.Mesh(sideLR, borderMat);
    bL.position.set(-frameW / 2, 0.14, 0);
    const bR = new THREE.Mesh(sideLR, borderMat);
    bR.position.set(frameW / 2, 0.14, 0);
    const bF = new THREE.Mesh(sideFB, borderMat);
    bF.position.set(0, 0.14, frameD / 2);
    const bB = new THREE.Mesh(sideFB, borderMat);
    bB.position.set(0, 0.14, -frameD / 2);
    digGroup.add(sandFloor, bL, bR, bF, bB);

    // Corner pergola awning posts & sun canopy overhead (stays well clear at y = 2.85)
    const digPostGeo = this.track(new THREE.CylinderGeometry(0.06, 0.075, 2.85, 8));
    [
      [-frameW / 2 + 0.05, -frameD / 2 + 0.05],
      [frameW / 2 - 0.05, -frameD / 2 + 0.05],
      [-frameW / 2 + 0.05, frameD / 2 - 0.05],
      [frameW / 2 - 0.05, frameD / 2 - 0.05],
    ].forEach(([px, pz]) => {
      const p = new THREE.Mesh(digPostGeo, woodMat);
      p.position.set(px, 1.425, pz);
      digGroup.add(p);
    });
    const canopyMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xf4ecd8,
        roughness: 0.85,
        side: THREE.DoubleSide,
      })
    );
    const canopy = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(frameW + 0.3, frameD + 0.3)),
      canopyMat
    );
    canopy.rotation.x = -Math.PI / 2;
    canopy.position.y = 2.85;
    digGroup.add(canopy);

    // Corner wooden sifter & trowel props
    const sifterFrame = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.68, 0.1, 0.52)),
      woodMat
    );
    sifterFrame.position.set(frameW / 2 - 0.45, 0.34, frameD / 2 - 0.32);
    sifterFrame.rotation.y = 0.28;
    digGroup.add(sifterFrame);

    const cordMat = this.track(new THREE.MeshStandardMaterial({color: 0x8f6847, roughness: 0.96}));
    const cord = this.track(new THREE.BoxGeometry(0.022, 0.018, frameD - 0.28));
    for (const x of [-0.7, 0.7]) {
      const divider = new THREE.Mesh(cord, cordMat);
      divider.position.set(x, 0.155, 0);
      digGroup.add(divider);
    }
    const cross = new THREE.Mesh(this.track(new THREE.BoxGeometry(frameW - 0.28, 0.018, 0.022)), cordMat);
    cross.position.y = 0.155;
    digGroup.add(cross);
    this.add(digGroup);

    const moundGeo = this.track(
      new THREE.SphereGeometry(0.45, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5)
    );
    const moundMat = this.track(
      new THREE.MeshStandardMaterial({color: 0xd9b372, roughness: 0.9})
    );

    // Distinct materials & Lathe amphora profile for 6 unique excavated relics
    const bronzeMat = this.track(
      new THREE.MeshStandardMaterial({color: 0xb45309, metalness: 0.72, roughness: 0.3})
    );
    const terracottaMat = this.track(
      new THREE.MeshStandardMaterial({color: 0xc2410c, roughness: 0.65})
    );
    const iznikMat = this.track(
      new THREE.MeshStandardMaterial({color: 0x06b6d4, roughness: 0.22, metalness: 0.25})
    );
    const amphoraPoints = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.11, 0.02),
      new THREE.Vector2(0.18, 0.16),
      new THREE.Vector2(0.16, 0.28),
      new THREE.Vector2(0.07, 0.36),
      new THREE.Vector2(0.11, 0.43),
      new THREE.Vector2(0.08, 0.44),
    ];
    const amphoraGeo = this.track(new THREE.LatheGeometry(amphoraPoints, 16));

    const buildDistinctRelic = (idx: number): THREE.Group => {
      const rg = new THREE.Group();
      const kind = idx % 6;
      if (kind === 0) {
        // 0: Hitit Güneş Kursu (Sun Disc with Ring + Rays)
        const disc = new THREE.Mesh(
          this.track(new THREE.TorusGeometry(0.19, 0.032, 8, 20)),
          bronzeMat
        );
        const center = new THREE.Mesh(
          this.track(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 12)),
          goldMat
        );
        center.rotation.x = Math.PI / 2;
        rg.add(disc, center);
        for (let r = 0; r < 6; r++) {
          const ray = new THREE.Mesh(
            this.track(new THREE.ConeGeometry(0.03, 0.1, 6)),
            goldMat
          );
          const a = (r / 6) * Math.PI * 2;
          ray.position.set(Math.cos(a) * 0.24, Math.sin(a) * 0.24, 0);
          ray.rotation.z = a - Math.PI / 2;
          rg.add(ray);
        }
        rg.position.y = 0.28;
      } else if (kind === 1) {
        // 1: Urartu Çift Kulplu Amfora (Lathe Amphora + Handles)
        const body = new THREE.Mesh(amphoraGeo, terracottaMat);
        const hGeo = this.track(new THREE.TorusGeometry(0.08, 0.018, 6, 12, Math.PI));
        const hL = new THREE.Mesh(hGeo, terracottaMat);
        hL.rotation.z = Math.PI / 2;
        hL.position.set(-0.14, 0.28, 0);
        const hR = new THREE.Mesh(hGeo, terracottaMat);
        hR.rotation.z = -Math.PI / 2;
        hR.position.set(0.14, 0.28, 0);
        rg.add(body, hL, hR);
        rg.position.y = 0.04;
      } else if (kind === 2) {
        // 2: Lidya Altın Sikkesi (Stamped Gold Medallion)
        const coin = new THREE.Mesh(
          this.track(new THREE.CylinderGeometry(0.21, 0.21, 0.05, 22)),
          goldMat
        );
        coin.rotation.x = Math.PI / 2;
        const crest = new THREE.Mesh(
          this.track(new THREE.CylinderGeometry(0.12, 0.12, 0.07, 6)),
          bronzeMat
        );
        crest.rotation.x = Math.PI / 2;
        rg.add(coin, crest);
        rg.position.y = 0.28;
      } else if (kind === 3) {
        // 3: İznik Çini Yıldızı (8-Pointed Seljuk/Ottoman Tile Star)
        const sq1 = new THREE.Mesh(
          this.track(new THREE.BoxGeometry(0.28, 0.28, 0.05)),
          iznikMat
        );
        const sq2 = new THREE.Mesh(
          this.track(new THREE.BoxGeometry(0.28, 0.28, 0.05)),
          goldMat
        );
        sq2.rotation.z = Math.PI / 4;
        const pearl = new THREE.Mesh(
          this.track(new THREE.SphereGeometry(0.07, 10, 8)),
          goldMat
        );
        rg.add(sq1, sq2, pearl);
        rg.position.y = 0.28;
      } else if (kind === 4) {
        // 4: Antik Yağ Kandili (Spouted Oil Lamp + Golden Flame)
        const bowl = new THREE.Mesh(
          this.track(new THREE.SphereGeometry(0.16, 12, 8)),
          terracottaMat
        );
        bowl.scale.set(1.3, 0.55, 0.9);
        const spout = new THREE.Mesh(
          this.track(new THREE.ConeGeometry(0.06, 0.18, 8)),
          terracottaMat
        );
        spout.rotation.z = -Math.PI / 2;
        spout.position.set(0.22, 0.02, 0);
        const flame = new THREE.Mesh(
          this.track(new THREE.ConeGeometry(0.045, 0.14, 8)),
          this.track(
            new THREE.MeshStandardMaterial({
              color: 0xfde047,
              emissive: 0xf59e0b,
              emissiveIntensity: 1.2,
            })
          )
        );
        flame.position.set(0.27, 0.11, 0);
        rg.add(bowl, spout, flame);
        rg.position.y = 0.16;
      } else {
        // 5: Selçuklu Pirinç Anahtarı (Ornate Brass Key)
        const shaft = new THREE.Mesh(
          this.track(new THREE.CylinderGeometry(0.028, 0.028, 0.44, 8)),
          goldMat
        );
        shaft.rotation.z = Math.PI / 2;
        const bow = new THREE.Mesh(
          this.track(new THREE.TorusGeometry(0.1, 0.024, 8, 16)),
          goldMat
        );
        bow.position.set(-0.24, 0, 0);
        const tooth1 = new THREE.Mesh(
          this.track(new THREE.BoxGeometry(0.04, 0.11, 0.03)),
          bronzeMat
        );
        tooth1.position.set(0.16, -0.06, 0);
        const tooth2 = new THREE.Mesh(
          this.track(new THREE.BoxGeometry(0.04, 0.08, 0.03)),
          bronzeMat
        );
        tooth2.position.set(0.09, -0.045, 0);
        rg.add(shaft, bow, tooth1, tooth2);
        rg.position.y = 0.24;
      }
      return rg;
    };

    DIG_MOUND_COORDS.forEach(([mx, mz], idx) => {
      const mg = new THREE.Group();
      mg.position.set(mx, 0.12, mz);
      const mound = new THREE.Mesh(moundGeo, moundMat);
      mound.scale.set(1, 0.72, 1);
      mound.userData.propType = 'dig-mound';
      mound.userData.digIndex = idx;

      const relicGroup = buildDistinctRelic(idx);
      relicGroup.visible = false;
      relicGroup.traverse((c) => {
        c.userData.propType = 'dig-mound';
        c.userData.digIndex = idx;
      });

      mg.add(mound, relicGroup);
      this.digMoundGroups.push(mg);
      this.digRelicGlows.push(relicGroup);
      this.interactiveMeshes.push(mound);
      this.add(mg);
    });
  }

  getMazeWallRects(): WallRect[] {
    return this.mazeWallRects;
  }

  getPropWallRects(): WallRect[] {
    const rects: WallRect[] = [
      // Left Marble Fıskiye (-7.5, 8.2)
      {minX: -9.55, maxX: -5.45, minZ: 6.15, maxZ: 10.25},
      // Right Ottoman Çeşme (7.5, 8.2)
      {minX: 6.3, maxX: 8.7, minZ: 7.2, maxZ: 9.2},
      // Turkish Flag Pedestal (-5.15, 4.65)
      {minX: -5.85, maxX: -4.45, minZ: 3.95, maxZ: 5.35},
      // Atatürk Monument Billboard (5.35, 4.65)
      {minX: 3.85, maxX: 6.85, minZ: 3.75, maxZ: 5.55},
      // Ping-Pong Table (-12.5, 19.5)
      {minX: -13.9, maxX: -11.1, minZ: 18.7, maxZ: 20.3},
      // Mangala Gazebo Center Table (12.5, 19.5)
      {minX: 11.55, maxX: 13.45, minZ: 18.55, maxZ: 20.45},
      // Ring-Toss Pegs Board (-22.5, 6.4)
      {minX: -23.7, maxX: -21.3, minZ: 5.7, maxZ: 7.1},
      // Beştaş Wooden Tray (-13.8, 28.5)
      {minX: -14.55, maxX: -13.05, minZ: 27.75, maxZ: 29.25},
      // Topaç Spinner Disc (-23.0, 16.8)
      {minX: -24.45, maxX: -21.55, minZ: 15.35, maxZ: 18.25},
      // Moved dig frame. Its south edge stays open for visitors.
      {minX: DIG_SITE_ORIGIN.x - 2.8, maxX: DIG_SITE_ORIGIN.x + 2.8, minZ: DIG_SITE_ORIGIN.z - 2.01, maxZ: DIG_SITE_ORIGIN.z - 1.79},
      ...[-2.7, 2.7].map((x) => ({
        minX: DIG_SITE_ORIGIN.x + x - 0.11, maxX: DIG_SITE_ORIGIN.x + x + 0.11,
        minZ: DIG_SITE_ORIGIN.z - 1.9, maxZ: DIG_SITE_ORIGIN.z + 1.9,
      })),
    ];

    // Mangala Gazebo 4 corner posts
    [
      [-1.6, -1.6],
      [1.6, -1.6],
      [-1.6, 1.6],
      [1.6, 1.6],
    ].forEach(([px, pz]) => {
      rects.push({
        minX: 12.5 + px - 0.14,
        maxX: 12.5 + px + 0.14,
        minZ: 19.5 + pz - 0.14,
        maxZ: 19.5 + pz + 0.14,
      });
    });

    // 4 Courtyard Park Benches
    BENCH_COORDS.forEach(([bx, bz]) => {
      rects.push({
        minX: bx - 0.4,
        maxX: bx + 0.4,
        minZ: bz - 0.9,
        maxZ: bz + 0.9,
      });
    });

    // 12 Park Tree Trunks
    PARK_TREE_COORDS.forEach(([tx, tz, scale]) => {
      const r = 0.34 * scale;
      rects.push({
        minX: tx - r,
        maxX: tx + r,
        minZ: tz - r,
        maxZ: tz + r,
      });
    });

    // Street Lantern Poles across all park walkways & plazas
    STREET_LAMP_COORDS.forEach(([lx, lz]) => {
      rects.push({
        minX: lx - 0.16,
        maxX: lx + 0.16,
        minZ: lz - 0.16,
        maxZ: lz + 0.16,
      });
    });

    return rects;
  }

  setMazeCrownClaimed(claimed: boolean): void {
    this.mazeCrownClaimed = claimed;
    if (this.mazeCrownGroup) {
      this.mazeCrownGroup.visible = !claimed;
      if (claimed) {
        this.mazeCrownGroup.traverse((child) => {
          child.userData.propType = undefined;
        });
      }
    }
  }

  markDigMoundDug(index: number): void {
    const grp = this.digMoundGroups[index];
    const glow = this.digRelicGlows[index];
    if (grp) {
      grp.children[0].scale.set(1.15, 0.22, 1.15);
      grp.children[0].userData.propType = undefined;
    }
    if (glow) {
      glow.visible = true;
    }
  }

  highlightHopscotchTile(index: number): void {
    const m = this.hopscotchMeshes[index];
    if (m) {
      m.position.y = 0.12;
      window.setTimeout(() => {
        if (!this.isDisposed) m.position.y = 0.05;
      }, 280);
    }
  }

  setHopscotchTarget(index: number, animateThrow = false): void {
    const tile = HOPSCOTCH_TILES[index];
    if (!tile) return;
    if (this.hopscotchTargetHalo) {
      this.hopscotchTargetHalo.position.set(tile.x, 0.095, tile.z);
      this.hopscotchTargetHalo.scale.setScalar(tile.num === 10 ? 1.4 : 1.0);
    }
    this.hopscotchStoneFrom.copy(this.hopscotchStonePos);
    this.hopscotchStoneTo.set(tile.x + 0.22, 0.1, tile.z - 0.16);
    if (animateThrow) {
      this.hopscotchStoneT = 0;
    } else {
      this.hopscotchStonePos.copy(this.hopscotchStoneTo);
      this.hopscotchStone?.position.copy(this.hopscotchStonePos);
      this.hopscotchStoneT = 1;
    }
  }

  private createBenchesAndLamps(): void {
    const walnut = getWalnutWoodTextures(1, 1);
    const woodMat = this.track(
      new THREE.MeshStandardMaterial({
        map: walnut.map,
        bumpMap: walnut.bumpMap,
        bumpScale: 0.015,
        color: 0xd69e72,
        roughness: 0.65,
      })
    );
    const ironMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x1a2433,
        metalness: 0.78,
        roughness: 0.3,
      })
    );
    const brassTrimMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.86,
        roughness: 0.22,
      })
    );
    this.lampBulbMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xfef3c7,
        emissive: 0xfbbf24,
        emissiveIntensity: 0.6,
      })
    );
    const bulbMat = this.lampBulbMat;
    this.lampHaloMat = this.track(
      new THREE.MeshBasicMaterial({
        color: 0xfde68a,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const haloMat = this.lampHaloMat;

    const benchSeatGeo = this.track(new THREE.BoxGeometry(1.74, 0.08, 0.54));
    const benchBackGeo = this.track(new THREE.BoxGeometry(1.74, 0.42, 0.075));
    const armGeo = this.track(new THREE.BoxGeometry(0.08, 0.24, 0.56));
    const legGeo = this.track(new THREE.BoxGeometry(0.1, 0.42, 0.48));

    BENCH_COORDS.forEach(([bx, bz, rotY], idx) => {
      const bench = new THREE.Group();
      const seat = new THREE.Mesh(benchSeatGeo, woodMat);
      seat.position.y = 0.44;
      seat.castShadow = true;
      seat.userData.easterEggId = `bench-${idx}`;
      seat.userData.benchIndex = idx;
      const back = new THREE.Mesh(benchBackGeo, woodMat);
      back.position.set(0, 0.72, -0.24);
      back.rotation.x = -0.1;
      back.castShadow = true;
      back.userData.easterEggId = `bench-${idx}`;
      back.userData.benchIndex = idx;
      const l1 = new THREE.Mesh(legGeo, ironMat);
      l1.position.set(-0.7, 0.21, 0);
      const l2 = new THREE.Mesh(legGeo, ironMat);
      l2.position.set(0.7, 0.21, 0);
      const arm1 = new THREE.Mesh(armGeo, ironMat);
      arm1.position.set(-0.82, 0.55, 0);
      const arm2 = new THREE.Mesh(armGeo, ironMat);
      arm2.position.set(0.82, 0.55, 0);
      bench.add(seat, back, l1, l2, arm1, arm2);
      bench.position.set(bx, 0, bz);
      bench.rotation.y = rotY;
      this.benchGroups.push(bench);
      this.benchBounceTimers.push(0);
      this.interactiveMeshes.push(seat, back);
      this.add(bench);
    });

    // Ornate Ottoman Cast-Iron Street Lamps
    const plinthGeo = this.track(new THREE.CylinderGeometry(0.13, 0.17, 0.34, 6));
    const poleGeo = this.track(new THREE.CylinderGeometry(0.05, 0.085, 2.95, 8));
    const collarGeo = this.track(new THREE.TorusGeometry(0.08, 0.024, 6, 12));
    const headBaseGeo = this.track(new THREE.CylinderGeometry(0.18, 0.1, 0.14, 6));
    const lanternGeo = this.track(new THREE.CylinderGeometry(0.22, 0.15, 0.34, 6));
    const capGeo = this.track(new THREE.ConeGeometry(0.28, 0.2, 6));
    const spireGeo = this.track(new THREE.ConeGeometry(0.035, 0.14, 6));
    const haloGeo = this.track(new THREE.SphereGeometry(0.48, 10, 8));

    STREET_LAMP_COORDS.forEach(([lx, lz]) => {
      const lamp = new THREE.Group();
      const plinth = new THREE.Mesh(plinthGeo, ironMat);
      plinth.position.y = 0.17;
      const pole = new THREE.Mesh(poleGeo, ironMat);
      pole.position.y = 1.65;
      pole.castShadow = true;
      const collar = new THREE.Mesh(collarGeo, brassTrimMat);
      collar.rotation.x = Math.PI / 2;
      collar.position.y = 3.05;
      const headBase = new THREE.Mesh(headBaseGeo, ironMat);
      headBase.position.y = 3.16;
      const bulb = new THREE.Mesh(lanternGeo, bulbMat);
      bulb.position.y = 3.38;
      const cap = new THREE.Mesh(capGeo, ironMat);
      cap.position.y = 3.63;
      const spire = new THREE.Mesh(spireGeo, brassTrimMat);
      spire.position.y = 3.78;
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.y = 3.38;
      halo.visible = false;
      this.lampHaloMeshes.push(halo);
      lamp.add(plinth, pole, collar, headBase, bulb, cap, spire, halo);
      lamp.position.set(lx, 0, lz);
      this.add(lamp);
    });

    // 4 pooled PointLights follow the closest 4 street lamps to the player at night.
    // Keeping a fixed small pool avoids 38-light shader bloat and WebGL recompilation stutters.
    for (let i = 0; i < 4; i++) {
      const pt = new THREE.PointLight(0xfde68a, 0, 16, 1.5);
      pt.position.set(0, 3.3, 5.2);
      pt.userData.pooledLamp = true;
      this.add(pt);
      this.lampPool.push(pt);
    }
  }

  private createConfettiPool(): void {
    const geometry = this.track(new THREE.OctahedronGeometry(0.06, 0));
    const material = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.25,
        metalness: 0.4,
        emissive: 0x222222,
      })
    );
    this.confettiMesh = new THREE.InstancedMesh(
      geometry,
      material,
      CONFETTI_COUNT
    );
    this.confettiMesh.frustumCulled = false;

    const color = new THREE.Color();
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      color.setHex(CONFETTI_COLORS[i % CONFETTI_COLORS.length]);
      this.confettiMesh.setColorAt(i, color);
      this.confettiParticles.push({
        position: new THREE.Vector3(0, -10, 0),
        velocity: new THREE.Vector3(),
        rotation: new THREE.Euler(),
        spin: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        scale: 0,
      });
      this.confettiDummy.position.set(0, -10, 0);
      this.confettiDummy.scale.setScalar(0);
      this.confettiDummy.updateMatrix();
      this.confettiMesh.setMatrixAt(i, this.confettiDummy.matrix);
    }
    this.confettiMesh.instanceMatrix.needsUpdate = true;
    if (this.confettiMesh.instanceColor) {
      this.confettiMesh.instanceColor.needsUpdate = true;
    }
    this.add(this.confettiMesh);
  }

  triggerCelebration(origin: THREE.Vector3): void {
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const p = this.confettiParticles[i];
      p.position.copy(origin);
      const theta = Math.random() * Math.PI * 2;
      const speed = 1.4 + Math.random() * 2.6;
      p.velocity.set(
        Math.cos(theta) * speed,
        2.4 + Math.random() * 2.4,
        Math.sin(theta) * speed
      );
      p.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      p.spin.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      p.life = 0.001;
      p.maxLife = 1.85 + Math.random() * 0.5;
      p.scale = 0.75 + Math.random() * 0.75;
    }
  }

  setIndoorMode(inside: boolean): void {
    this.indoorMode = inside;
    this.sunLight.castShadow = DEVICE_QUALITY.shadowsEnabled && !inside;
  }

  setNightLampGlow(lampGlow: number, playerPos?: THREE.Vector3): void {
    const glow = THREE.MathUtils.clamp(lampGlow, 0, 1);
    if (this.lampBulbMat) {
      this.lampBulbMat.emissiveIntensity = THREE.MathUtils.lerp(0.5, 3.6, glow);
    }
    if (this.lampHaloMat) {
      this.lampHaloMat.opacity = THREE.MathUtils.lerp(0, 0.28, glow);
    }
    const showHalos = glow > 0.04;
    for (const halo of this.lampHaloMeshes) {
      halo.visible = showHalos;
    }

    const lightIntensity = THREE.MathUtils.lerp(0.0, 3.8, glow);
    const insideDeep = Boolean(
      playerPos && Math.abs(playerPos.x) < 13.0 && playerPos.z < -2.2
    );
    if (lightIntensity <= 0.02 || insideDeep) {
      for (const pt of this.lampPool) {
        pt.intensity = 0;
      }
      return;
    }

    const px = playerPos ? playerPos.x : 0;
    const pz = playerPos ? playerPos.z : 12;
    const poolCount = this.lampPool.length;
    for (let k = 0; k < poolCount; k++) {
      this.nearestLampIdx[k] = -1;
      this.nearestLampDistSq[k] = Infinity;
    }

    for (let i = 0; i < STREET_LAMP_COORDS.length; i++) {
      const [lx, lz] = STREET_LAMP_COORDS[i];
      const dx = lx - px;
      const dz = lz - pz;
      const dSq = dx * dx + dz * dz;
      for (let k = 0; k < poolCount; k++) {
        if (dSq < this.nearestLampDistSq[k]) {
          for (let m = poolCount - 1; m > k; m--) {
            this.nearestLampDistSq[m] = this.nearestLampDistSq[m - 1];
            this.nearestLampIdx[m] = this.nearestLampIdx[m - 1];
          }
          this.nearestLampDistSq[k] = dSq;
          this.nearestLampIdx[k] = i;
          break;
        }
      }
    }

    for (let k = 0; k < poolCount; k++) {
      const pt = this.lampPool[k];
      const idx = this.nearestLampIdx[k];
      const dSq = this.nearestLampDistSq[k];
      if (idx < 0 || dSq > 34 * 34) {
        pt.intensity = 0;
      } else {
        const [lx, lz] = STREET_LAMP_COORDS[idx];
        pt.position.set(lx, 3.3, lz);
        const fade = dSq > 26 * 26 ? 1 - (Math.sqrt(dSq) - 26) / 8 : 1;
        pt.intensity = lightIntensity * Math.max(0, fade);
      }
    }
  }

  shakeTree(index: number): void {
    if (index >= 0 && index < this.treeShakeTimers.length) {
      this.treeShakeTimers[index] = 0.75;
    }
  }

  bounceBench(index: number): void {
    if (index >= 0 && index < this.benchBounceTimers.length) {
      this.benchBounceTimers[index] = 0.6;
    }
  }

  getInteractiveMeshes(): THREE.Object3D[] {
    return this.interactiveMeshes;
  }

  update(): void {
    const dt = Math.min(xb.getDeltaTime(), 0.05);
    this.time += dt;

    if (!this.indoorMode) {
      for (const water of this.fountainWaters) {
        water.position.y = 0.49 + Math.sin(this.time * 2.4) * 0.012;
      }

      // Animate Left Fıskiye parabolic water jet arcs
      if (this.fiskiyeJetMesh) {
        const arcs = this.FISKIYE_ARC_COUNT;
        const perArc = this.FISKIYE_DROP_PER_ARC;
        let idx = 0;
        for (let a = 0; a < arcs; a++) {
          const theta = (a / arcs) * Math.PI * 2 + Math.sin(this.time * 0.5) * 0.12;
          for (let k = 0; k < perArc; k++) {
            const phase = (this.time * 0.85 + k / perArc + a * 0.07) % 1;
            const r = 0.08 + phase * 1.38;
            const y = 2.42 + 1.18 * phase - 3.12 * phase * phase;
            this.fiskiyeDummy.position.set(
              -7.5 + Math.cos(theta) * r,
              Math.max(0.49, y),
              8.2 + Math.sin(theta) * r
            );
            const s = 0.65 + (1 - Math.abs(phase - 0.5) * 2) * 0.55;
            this.fiskiyeDummy.scale.setScalar(s);
            this.fiskiyeDummy.updateMatrix();
            this.fiskiyeJetMesh.setMatrixAt(idx++, this.fiskiyeDummy.matrix);
          }
        }
        this.fiskiyeJetMesh.instanceMatrix.needsUpdate = true;
      }

      // Animate Right Çeşme falling spout water shimmer
      if (this.cesmeSpoutStream) {
        const pulse = 0.85 + Math.sin(this.time * 14) * 0.15;
        this.cesmeSpoutStream.scale.set(pulse, 1, pulse);
      }

      // Animate Maze Center Golden Crown
      if (this.mazeCrownGroup) {
        this.mazeCrownGroup.rotation.y += dt * (this.mazeCrownClaimed ? 0.5 : 1.7);
        this.mazeCrownGroup.position.y = 1.08 + Math.sin(this.time * 2.4) * 0.08;
      }

      // Animate Ping-Pong rally ball bouncing over net
      if (this.pingPongBall) {
        const rally = Math.sin(this.time * 4.2);
        const bounce = Math.abs(Math.sin(this.time * 8.4));
        this.pingPongBall.position.set(rally * 0.92, 0.84 + bounce * 0.36, 0);
      }

      // Animate Hopscotch target halo & tossed Seksek pebble arc
      if (this.hopscotchTargetHalo) {
        this.hopscotchTargetHalo.rotation.z += dt * 1.4;
        const pulse = 1 + Math.sin(this.time * 4.5) * 0.08;
        this.hopscotchTargetHalo.scale.x = pulse;
        this.hopscotchTargetHalo.scale.y = pulse;
      }
      if (this.hopscotchStone && this.hopscotchStoneT < 1) {
        this.hopscotchStoneT = Math.min(1, this.hopscotchStoneT + dt * 2.4);
        this.hopscotchStonePos.lerpVectors(
          this.hopscotchStoneFrom,
          this.hopscotchStoneTo,
          this.hopscotchStoneT
        );
        this.hopscotchStonePos.y =
          0.1 + Math.sin(this.hopscotchStoneT * Math.PI) * 0.65;
        this.hopscotchStone.position.copy(this.hopscotchStonePos);
        this.hopscotchStone.rotation.y += dt * 9;
      }

      // Animate spinning Topaç wooden tops
      for (let i = 0; i < this.topacSpinGroups.length; i++) {
        const g = this.topacSpinGroups[i];
        g.rotation.y += dt * (11 + i * 2.5);
        g.rotation.z = Math.sin(this.time * 4 + i * 1.8) * 0.08;
      }

      // Rotate excavated archaeological relics gently above their mounds
      for (let i = 0; i < this.digRelicGlows.length; i++) {
        const relic = this.digRelicGlows[i];
        if (relic.visible) {
          relic.rotation.y += dt * 1.5;
        }
      }

      for (let i = 0; i < this.treeGroups.length; i++) {
        if (this.treeShakeTimers[i] > 0) {
          this.treeShakeTimers[i] = Math.max(0, this.treeShakeTimers[i] - dt);
          const s = Math.sin(this.treeShakeTimers[i] * 34) * 0.06 * this.treeShakeTimers[i];
          this.treeGroups[i].rotation.z = s;
        } else {
          this.treeGroups[i].rotation.z = 0;
        }
      }

      for (let i = 0; i < this.benchGroups.length; i++) {
        if (this.benchBounceTimers[i] > 0) {
          this.benchBounceTimers[i] = Math.max(0, this.benchBounceTimers[i] - dt);
          const phase = this.benchBounceTimers[i] / 0.6;
          const bounceY = Math.abs(Math.sin(phase * Math.PI * 2)) * 0.14 * phase;
          this.benchGroups[i].position.y = bounceY;
        } else {
          this.benchGroups[i].position.y = 0;
        }
      }

      // Animate waving Turkish flag cloth
      if (this.flagGeometry && this.flagBasePositions) {
        const posAttr = this.flagGeometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        const base = this.flagBasePositions;
        const t = this.time;

        for (let i = 0; i < posAttr.count; i++) {
          const idx = i * 3;
          const bx = base[idx];
          const by = base[idx + 1];
          const u = THREE.MathUtils.clamp(bx / FLAG_WIDTH, 0, 1); // 0 at pole -> 1 at fly tip
          const amp = Math.pow(u, 1.15);

          const wave1 = Math.sin(u * 6.2 - t * 4.4 + by * 1.1) * 0.19;
          const wave2 = Math.sin(u * 12.0 - t * 6.8 - by * 1.8) * 0.055;
          const flapY = Math.cos(u * 4.8 - t * 3.6) * 0.065 * amp;
          const droop = -0.09 * u * u;

          arr[idx] = bx - amp * 0.08 * (1 - Math.cos(u * 3.2 - t * 2.8));
          arr[idx + 1] = by + flapY + droop;
          arr[idx + 2] = (wave1 + wave2) * amp;
        }
        posAttr.needsUpdate = true;
        this.flagNormalTick = !this.flagNormalTick;
        if (this.flagNormalTick) {
          this.flagGeometry.computeVertexNormals();
        }
      }
    }

    if (this.confettiMesh) {
      let dirty = false;
      for (let i = 0; i < CONFETTI_COUNT; i++) {
        const p = this.confettiParticles[i];
        if (p.life <= 0) continue;
        dirty = true;
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.life = 0;
          this.confettiDummy.scale.setScalar(0);
          this.confettiDummy.position.set(0, -10, 0);
        } else {
          p.velocity.y -= 3.8 * dt;
          p.position.addScaledVector(p.velocity, dt);
          p.rotation.x += p.spin.x * dt;
          p.rotation.y += p.spin.y * dt;
          p.rotation.z += p.spin.z * dt;
          const fade = 1 - p.life / p.maxLife;
          this.confettiDummy.position.copy(p.position);
          this.confettiDummy.rotation.copy(p.rotation);
          this.confettiDummy.scale.setScalar(p.scale * fade);
        }
        this.confettiDummy.updateMatrix();
        this.confettiMesh.setMatrixAt(i, this.confettiDummy.matrix);
      }
      if (dirty) {
        this.confettiMesh.instanceMatrix.needsUpdate = true;
      }
    }
  }

  dispose(): void {
    this.isDisposed = true;
    for (const d of this.disposables) {
      d.dispose();
    }
    this.envTexture?.dispose();
  }
}
