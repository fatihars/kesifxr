import {metin} from "../metinler.ts";
import * as THREE from 'three';
import * as xb from 'xrblocks';
import type {WallRect} from './MuseumBuilding.ts';
import {
  createAnatolianColumn,
  createOttomanAlem,
  getCobblePlazaTextures,
  getIznikTileTexture,
  getTerracottaRoofTextures,
  getWalnutWoodTextures,
} from '../utils/anatolianMaterials.ts';
import {ExplorerCharacter} from './ExplorerCharacter.ts';

export const TILE_WORKSHOP_ORIGIN = new THREE.Vector3(-7.5, 0, 16.5);

export class TileWorkshop extends xb.Script {
  readonly targets: THREE.Object3D[] = [];
  readonly wall: WallRect = {
    minX: TILE_WORKSHOP_ORIGIN.x - 1.35,
    maxX: TILE_WORKSHOP_ORIGIN.x + 1.35,
    minZ: TILE_WORKSHOP_ORIGIN.z - 0.76,
    maxZ: TILE_WORKSHOP_ORIGIN.z + 0.4,
  };
  private readonly materials = new Set<THREE.Material>();
  private readonly geometry = new Set<THREE.BufferGeometry>();
  private signTexture?: THREE.CanvasTexture;
  private artisan?: ExplorerCharacter;
  private potterVase?: THREE.Mesh;
  private craftTime = 0;

  private trackGeo<T extends THREE.BufferGeometry>(g: T): T {
    this.geometry.add(g);
    return g;
  }

  private trackMat<T extends THREE.Material>(m: T): T {
    this.materials.add(m);
    return m;
  }

  private trackAny = <T extends {dispose: () => void}>(item: T): T => {
    if (item instanceof THREE.BufferGeometry) {
      this.geometry.add(item);
    } else if (item instanceof THREE.Material) {
      this.materials.add(item);
    }
    return item;
  };

  init(): void {
    this.position.copy(TILE_WORKSHOP_ORIGIN);
    const cobbleTex = getCobblePlazaTextures(2, 2);
    const walnutTex = getWalnutWoodTextures(2, 1);
    const roofTex = getTerracottaRoofTextures(3, 2);
    const iznikTex = getIznikTileTexture('turquoise', 3, 1);

    const clay = this.trackMat(
      new THREE.MeshStandardMaterial({
        map: roofTex.map,
        bumpMap: roofTex.bumpMap,
        bumpScale: 0.02,
        roughness: 0.65,
      })
    );
    const stone = this.trackMat(
      new THREE.MeshStandardMaterial({
        map: cobbleTex.map,
        bumpMap: cobbleTex.bumpMap,
        bumpScale: 0.015,
        roughness: 0.88,
      })
    );
    const walnut = this.trackMat(
      new THREE.MeshStandardMaterial({
        map: walnutTex.map,
        bumpMap: walnutTex.bumpMap,
        bumpScale: 0.012,
        roughness: 0.7,
      })
    );
    const teal = this.trackMat(new THREE.MeshStandardMaterial({map: iznikTex, roughness: 0.34}));
    const brass = this.trackMat(new THREE.MeshStandardMaterial({color: 0xd97706, metalness: 0.8, roughness: 0.26}));
    const brickMat = this.trackMat(new THREE.MeshStandardMaterial({color: 0x9a3412, roughness: 0.85}));

    const box = (w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) => {
      const geo = this.trackGeo(new THREE.BoxGeometry(w, h, d));
      this.trackMat(mat);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      this.add(mesh);
      return mesh;
    };

    box(5.8, 0.04, 4.9, stone, 0, 0.02);
    box(5.3, 0.05, 1.05, stone, 2.8, 0.025, 1.75);
    for (const x of [-2.48, 2.48]) {
      for (const z of [-1.85, 1.65]) {
        const col = createAnatolianColumn(
          this.trackAny,
          0.11,
          2.84,
          walnut,
          teal,
          brass
        );
        col.position.set(x, 0.04, z);
        this.add(col);
      }
      box(0.23, 0.22, 3.8, teal, x, 2.8, -0.1);
    }
    for (const side of [-1, 1]) {
      const roof = box(3.03, 0.15, 4.46, clay, side * 1.44, 3.2, -0.1);
      roof.rotation.z = -side * 0.26;
    }
    box(0.15, 0.12, 4.5, walnut, 0, 3.62, -0.1);
    const roofAlem = createOttomanAlem(this.trackAny, 0.46, brass);
    roofAlem.position.set(0, 3.68, 1.75);
    this.add(roofAlem);

    box(4.95, 0.2, 0.22, walnut, 0, 2.85, 1.65);
    box(2.66, 0.13, 1.14, walnut, 0, 0.88, -0.18);
    for (const x of [-1.1, 1.1]) box(0.19, 0.9, 0.88, teal, x, 0.44, -0.18);

    // Traditional Çini Fırını (Brick Ceramic Kiln) at back-left corner (x = -1.9, z = -1.35)
    const kilnBase = box(0.84, 0.82, 0.78, brickMat, -1.9, 0.43, -1.35);
    const kilnDome = new THREE.Mesh(
      this.trackGeo(new THREE.SphereGeometry(0.41, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55)),
      brickMat
    );
    kilnDome.position.set(-1.9, 0.82, -1.35);
    const kilnFlue = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.12, 0.15, 1.1, 10)),
      brickMat
    );
    kilnFlue.position.set(-1.9, 1.55, -1.35);
    const emberCore = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(0.36, 0.28, 0.06)),
      this.trackMat(new THREE.MeshBasicMaterial({color: 0xf97316}))
    );
    emberCore.position.set(-1.9, 0.42, -0.95);
    this.add(kilnDome, kilnFlue, emberCore);

    // Potter's Wheel & Glazed Iznik Amphora Vase at right corner (x = 1.85, z = -0.55)
    const wheelTable = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.38, 0.34, 0.58, 16)),
      walnut
    );
    wheelTable.position.set(1.85, 0.31, -0.55);
    const wheelDisc = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 18)),
      brass
    );
    wheelDisc.position.set(1.85, 0.62, -0.55);
    const vaseProfile = [
      new THREE.Vector2(0.01, 0.0),
      new THREE.Vector2(0.11, 0.0),
      new THREE.Vector2(0.18, 0.16),
      new THREE.Vector2(0.08, 0.34),
      new THREE.Vector2(0.12, 0.42),
    ];
    this.potterVase = new THREE.Mesh(
      this.trackGeo(new THREE.LatheGeometry(vaseProfile, 16)),
      teal
    );
    this.potterVase.position.set(1.85, 0.64, -0.55);
    this.potterVase.userData.tileWorkshop = true;
    this.targets.push(this.potterVase, kilnBase);
    this.add(wheelTable, wheelDisc, this.potterVase);

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#fbf0d6';
    context.fillRect(0, 0, 640, 256);
    context.strokeStyle = '#1d6267';
    context.lineWidth = 18;
    context.strokeRect(12, 12, 616, 232);
    context.fillStyle = '#194e58';
    context.font = 'bold 59px Georgia';
    context.textAlign = 'center';
    context.fillText(metin("TileWorkshop", "cini_atolyesi"), 320, 88);
    for (let i = 0; i < 9; i++) {
      const x = 98 + i * 55;
      context.fillStyle = i % 2 === 0 ? '#1e6375' : '#aa4534';
      context.beginPath();
      context.moveTo(x, 132);
      context.lineTo(x + 24, 175);
      context.lineTo(x, 218);
      context.lineTo(x - 24, 175);
      context.closePath();
      context.fill();
    }
    this.signTexture = new THREE.CanvasTexture(canvas);
    this.signTexture.colorSpace = THREE.SRGBColorSpace;
    const signMat = new THREE.MeshBasicMaterial({map: this.signTexture});
    const sign = box(2.82, 1.12, 0.075, signMat, 0, 2.42, 1.79);
    const tileMats = [
      this.trackMat(new THREE.MeshStandardMaterial({color: 0x234579, roughness: 0.28})),
      this.trackMat(new THREE.MeshStandardMaterial({color: 0x267d83, roughness: 0.28})),
      this.trackMat(new THREE.MeshStandardMaterial({color: 0xf4e4bb, roughness: 0.35})),
      this.trackMat(new THREE.MeshStandardMaterial({color: 0xb44e3b, roughness: 0.3})),
    ];
    const design = [0, 1, 2, 1, 0, 1, 3, 0, 3, 1, 2, 0, 1, 0, 2];
    design.forEach((color, index) => {
      const tile = box(0.27, 0.044, 0.27, tileMats[color], (index % 5 - 2) * 0.29, 0.96, Math.floor(index / 5) * 0.29 - 0.48);
      tile.userData.tileWorkshop = true;
      this.targets.push(tile);
    });
    sign.userData.tileWorkshop = true;
    this.targets.push(sign);

    this.artisan = new ExplorerCharacter('erkek', 2, 'anatolian', true);
    this.artisan.position.set(0, 0, -0.98);
    this.artisan.rotation.y = Math.PI;
    this.add(this.artisan);
  }

  updateNear(player: THREE.Vector3, dt: number): void {
    if (!this.artisan || player.distanceToSquared(TILE_WORKSHOP_ORIGIN) > 165) return;
    this.craftTime += dt * 2.8;
    this.artisan.setCraftPhase(this.craftTime);
    this.artisan.update();
    if (this.potterVase) {
      this.potterVase.rotation.y += dt * 2.1;
    }
  }

  dispose(): void {
    this.artisan?.dispose();
    this.signTexture?.dispose();
    this.materials.forEach((material) => material.dispose());
    this.geometry.forEach((geometry) => geometry.dispose());
  }
}
