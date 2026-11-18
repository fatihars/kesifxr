import {metin} from "../metinler.ts";
import * as THREE from 'three';
import * as xb from 'xrblocks';

import type {SurfaceKind} from '../types.ts';
import {
  createAnatolianColumn,
  createPointedArchGeometry,
  createRibbedDome,
  createSeljukStarGeometry,
  getAnatolianKilimTexture,
  getIznikTileTexture,
  getMarbleInlayTexture,
  getTravertineTextures,
  getWalnutWoodTextures,
} from '../utils/anatolianMaterials.ts';
import {DEVICE_QUALITY} from '../utils/deviceQuality.ts';

export interface WallRect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  floor?: 1 | 2;
}

export interface HidingSpot {
  id: string;
  name: string;
  floor: 1 | 2;
  pos: THREE.Vector3;
}

export const MUSEUM_FLOOR_Y = 0.45;
export const MUSEUM_FLOOR_2_Y = 5.05;
export const MUSEUM_ENTRANCE_Z = 0;

const STAIR_START_Z = -14.2;
const STAIR_END_Z = -6.0;
const STAIR_MIN_ABS_X = 4.25;
const STAIR_MAX_ABS_X = 6.55;

const LOGO_URL = import.meta.env.BASE_URL + 'assets/aistudio/mirasium_cocuk_logo_2_04df5ea2.png';

function createSignboardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 420;
  const ctx = canvas.getContext('2d');

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const drawSign = (logoImg?: HTMLImageElement) => {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Rich midnight navy to sapphire gradient panel
    const grad = ctx.createLinearGradient(0, 0, 1600, 420);
    grad.addColorStop(0, '#09152f');
    grad.addColorStop(0.5, '#173679');
    grad.addColorStop(1, '#09152f');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(14, 14, 1572, 392, 44);
    ctx.fill();

    // Outer gold frame + inner turquoise trim
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 14;
    ctx.stroke();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(34, 34, 1532, 352, 30);
    ctx.stroke();

    // Decorative left medallion badge for the uploaded SVG logo
    const badgeX = 245;
    const badgeY = 210;
    const badgeR = 148;

    ctx.save();
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeR + 8, 0, Math.PI * 2);
    ctx.fillStyle = '#d97706';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = '#fdf8ef';
    ctx.fill();
    ctx.clip();

    if (logoImg && logoImg.naturalWidth > 0 && logoImg.naturalHeight > 0) {
      const maxBox = badgeR * 1.66;
      const scale = Math.min(
        maxBox / logoImg.naturalWidth,
        maxBox / logoImg.naturalHeight
      );
      const targetW = logoImg.naturalWidth * scale;
      const targetH = logoImg.naturalHeight * scale;
      ctx.drawImage(
        logoImg,
        badgeX - targetW / 2,
        badgeY - targetH / 2,
        targetW,
        targetH
      );
    }
    ctx.restore();

    const textCenterX = 970;
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 104px "Google Sans", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 14;
    ctx.fillText(metin("MuseumBuilding", "mirasium_cocuk_muzesi"), textCenterX, 152, 1070);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#7dd3fc';
    ctx.font = 'bold 40px "Google Sans", Arial, sans-serif';
    ctx.fillText(metin("MuseumBuilding", "sergi_2_kat"), textCenterX, 266);

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(470, 212);
    ctx.lineTo(1470, 212);
    ctx.stroke();

    tex.needsUpdate = true;
  };

  drawSign();

  const img = new Image();
  img.onload = () => drawSign(img);
  img.src = LOGO_URL;

  return tex;
}

function createAshlarStoneTexture(repeatX = 6, repeatY = 3): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#7d6b53';
    ctx.fillRect(0, 0, 512, 512);

    const blockShades = ['#bba585', '#b09978', '#c3ae8f', '#a79070'];
    const rowH = 64;
    const colW = 128;

    for (let row = 0; row < 8; row++) {
      const y = row * rowH;
      const offset = row % 2 === 0 ? 0 : colW / 2;
      for (let x = -colW; x < 512; x += colW) {
        const idx = Math.abs(row * 3 + Math.floor(x / colW) * 5) % blockShades.length;
        ctx.fillStyle = blockShades[idx];
        ctx.fillRect(x + offset + 3, y + 3, colW - 6, rowH - 6);

        // Subtle highlight edge at top/left and shadow edge at bottom/right
        ctx.fillStyle = 'rgba(255, 248, 232, 0.14)';
        ctx.fillRect(x + offset + 3, y + 3, colW - 6, 4);
        ctx.fillStyle = 'rgba(40, 28, 14, 0.14)';
        ctx.fillRect(x + offset + 3, y + rowH - 7, colW - 6, 4);
      }
    }

    // Fine natural travertine pores
    for (let i = 0; i < 900; i++) {
      const px = (i * 73) % 512;
      const py = (i * 137) % 512;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(68, 52, 34, 0.08)' : 'rgba(255, 244, 224, 0.08)';
      ctx.fillRect(px, py, 3, 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  return tex;
}

function createWainscotingTexture(repeatX = 12): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#472c1b';
    ctx.fillRect(0, 0, 256, 256);

    // Molded walnut dado panel
    ctx.strokeStyle = '#2d1a0e';
    ctx.lineWidth = 6;
    ctx.strokeRect(18, 28, 220, 198);
    ctx.fillStyle = '#5a3822';
    ctx.fillRect(24, 34, 208, 186);

    ctx.strokeStyle = '#734b30';
    ctx.lineWidth = 3;
    ctx.strokeRect(36, 46, 184, 162);

    // Top warm brass dado cap line
    ctx.fillStyle = '#b47818';
    ctx.fillRect(0, 0, 256, 14);
    ctx.fillStyle = '#2d1a0e';
    ctx.fillRect(0, 240, 256, 16);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(repeatX, 1);
  return tex;
}

function createInteriorFloorTexture(repeatX = 9, repeatY = 8): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#705b42';
    ctx.fillRect(0, 0, 512, 512);

    for (let y = 0; y < 512; y += 128) {
      for (let x = 0; x < 512; x += 128) {
        const isDark = (x + y) % 256 === 0;
        ctx.fillStyle = isDark ? '#9e825e' : '#c0a782';
        ctx.fillRect(x + 4, y + 4, 120, 120);

        // Subtle diagonal marble veining
        ctx.strokeStyle = isDark
          ? 'rgba(235, 218, 190, 0.16)'
          : 'rgba(110, 84, 52, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 12, y + 18);
        ctx.quadraticCurveTo(x + 64, y + 58, x + 114, y + 104);
        ctx.stroke();

        // Warm Emperador bronze/teal corner diamond inlay
        ctx.fillStyle = isDark
          ? 'rgba(180, 118, 22, 0.35)'
          : 'rgba(12, 74, 110, 0.22)';
        ctx.beginPath();
        ctx.moveTo(x + 64, y + 46);
        ctx.lineTo(x + 82, y + 64);
        ctx.lineTo(x + 64, y + 82);
        ctx.lineTo(x + 46, y + 64);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#6c573f';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 2, y + 2, 124, 124);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  return tex;
}

function createStairRunnerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(0, 0, 256, 128);

    // Golden-ochre woven runner side borders
    ctx.fillStyle = '#d97706';
    ctx.fillRect(10, 0, 14, 128);
    ctx.fillRect(232, 0, 14, 128);

    ctx.fillStyle = '#991b1b';
    ctx.fillRect(32, 0, 192, 128);

    // Subtle geometric center diamond motif
    ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.beginPath();
    ctx.moveTo(128, 20);
    ctx.lineTo(156, 64);
    ctx.lineTo(128, 108);
    ctx.lineTo(100, 64);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createIznikTilePanelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, 492, 236);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, 464, 208);

    // 8-pointed Ottoman star motifs
    const centers = [128, 256, 384];
    for (const cx of centers) {
      const cy = 128;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-38, -38, 76, 76);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-38, -38, 76, 76);
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class MuseumBuilding extends xb.Script {
  private leftDoor = new THREE.Group();
  private rightDoor = new THREE.Group();
  private chandelierGroup = new THREE.Group();
  private globeMesh?: THREE.Mesh;
  private globeRingMesh?: THREE.Mesh;
  private globeSpinBoost = 0;
  private buildingInteractiveMeshes: THREE.Object3D[] = [];
  private hidingSpots: HidingSpot[] = [];
  private extraWallRects: WallRect[] = [];
  private indoorWallRects: WallRect[] = [];
  private doorOpenAmount = 0;
  private doorsTargetOpen = false;
  private time = 0;
  private disposables: Array<{dispose: () => void}> = [];

  private readonly outerWallRects: WallRect[] = [
    // Front left wall (leaving x = -2.4..+2.4 open doorway!)
    {minX: -13.6, maxX: -2.4, minZ: -0.6, maxZ: 0.6},
    // Front right wall
    {minX: 2.4, maxX: 13.6, minZ: -0.6, maxZ: 0.6},
    // Left outer wall
    {minX: -13.6, maxX: -12.6, minZ: -24.2, maxZ: 0.6},
    // Right outer wall
    {minX: 12.6, maxX: 13.6, minZ: -24.2, maxZ: 0.6},
    // Back outer wall
    {minX: -13.6, maxX: 13.6, minZ: -24.2, maxZ: -23.0},
  ];

  // Floor 2 atrium balustrade railings (stair top exits at x = +-4.25..+-6.55 are completely clear)
  private readonly floor2AtriumRects: WallRect[] = [
    // Front balcony railing between the two stair tops (stops at +-4.02 for clear exit)
    {minX: -4.02, maxX: 4.02, minZ: -6.12, maxZ: -5.88},
    // Back balcony railing
    {minX: -6.6, maxX: 6.6, minZ: -17.12, maxZ: -16.88},
    // Left balcony inner railing
    {minX: -6.62, maxX: -6.38, minZ: -17.0, maxZ: -6.0},
    // Right balcony inner railing
    {minX: 6.38, maxX: 6.62, minZ: -17.0, maxZ: -6.0},
  ];

  // Thin stair side guardrails (keeps 4.65..6.15 center climb channel 100% open!)
  private readonly stairRailRects: WallRect[] = [
    // Left staircase inner & outer rails
    {minX: -4.22, maxX: -4.12, minZ: -13.9, maxZ: -6.15},
    {minX: -6.68, maxX: -6.58, minZ: -13.9, maxZ: -6.15},
    // Right staircase inner & outer rails
    {minX: 4.12, maxX: 4.22, minZ: -13.9, maxZ: -6.15},
    {minX: 6.58, maxX: 6.68, minZ: -13.9, maxZ: -6.15},
  ];

  init(): void {
    this.buildBaseAndSteps();
    this.buildWallsAndWindows();
    this.buildSecondFloorMezzanine();
    this.buildTwinStaircases();
    this.buildInteriorColumnsAndDecor();
    this.buildHidingAlcoves();
    this.buildPorticoAndSign();
    this.buildDoors();
    this.buildRoofAndDome();
    this.buildInteriorLighting();
  }

  private buildHidingAlcoves(): void {
    const woodMat = this.track(
      new THREE.MeshStandardMaterial({color: 0x451a03, roughness: 0.68})
    );
    const velvetMat = this.track(
      new THREE.MeshStandardMaterial({color: 0x881337, roughness: 0.85})
    );
    const goldMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.78,
        roughness: 0.28,
      })
    );
    const urnMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x0e7490,
        roughness: 0.28,
        metalness: 0.16,
      })
    );

    const configs: Array<{
      id: string;
      name: string;
      floor: 1 | 2;
      pos: THREE.Vector3;
      rotY: number;
    }> = [
      {
        id: 'alcove-f1-lf',
        name: metin("MuseumBuilding", "1_kat_sol_paravan"),
        floor: 1,
        pos: new THREE.Vector3(-9.4, MUSEUM_FLOOR_Y, -9.0),
        rotY: Math.PI * 0.25,
      },
      {
        id: 'alcove-f1-rf',
        name: metin("MuseumBuilding", "1_kat_sag_paravan"),
        floor: 1,
        pos: new THREE.Vector3(9.4, MUSEUM_FLOOR_Y, -9.0),
        rotY: -Math.PI * 0.25,
      },
      {
        id: 'alcove-f1-lb',
        name: metin("MuseumBuilding", "1_kat_sol_arka_kose"),
        floor: 1,
        pos: new THREE.Vector3(-9.4, MUSEUM_FLOOR_Y, -17.5),
        rotY: Math.PI * 0.72,
      },
      {
        id: 'alcove-f1-rb',
        name: metin("MuseumBuilding", "1_kat_sag_arka_kose"),
        floor: 1,
        pos: new THREE.Vector3(9.4, MUSEUM_FLOOR_Y, -17.5),
        rotY: -Math.PI * 0.72,
      },
      {
        id: 'alcove-f1-bc',
        name: metin("MuseumBuilding", "1_kat_merkez_paravan"),
        floor: 1,
        pos: new THREE.Vector3(0, MUSEUM_FLOOR_Y, -19.2),
        rotY: 0,
      },
      {
        id: 'alcove-f2-l',
        name: metin("MuseumBuilding", "2_kat_sol_galeri_paravani"),
        floor: 2,
        pos: new THREE.Vector3(-9.6, MUSEUM_FLOOR_2_Y, -11.5),
        rotY: Math.PI / 2,
      },
      {
        id: 'alcove-f2-r',
        name: metin("MuseumBuilding", "2_kat_sag_galeri_paravani"),
        floor: 2,
        pos: new THREE.Vector3(9.6, MUSEUM_FLOOR_2_Y, -11.5),
        rotY: -Math.PI / 2,
      },
      {
        id: 'alcove-f2-bc',
        name: metin("MuseumBuilding", "2_kat_arka_balkon_kosesi"),
        floor: 2,
        pos: new THREE.Vector3(0, MUSEUM_FLOOR_2_Y, -20.2),
        rotY: 0,
      },
    ];

    const panelGeo = this.track(new THREE.BoxGeometry(0.68, 1.72, 0.07));
    const insetGeo = this.track(new THREE.BoxGeometry(0.54, 1.48, 0.085));
    const urnGeo = this.track(new THREE.CylinderGeometry(0.24, 0.18, 0.85, 14));

    configs.forEach((cfg) => {
      const grp = new THREE.Group();
      grp.position.copy(cfg.pos);
      grp.rotation.y = cfg.rotY;

      // Folding 3-wing ornate museum paravan forming a cozy hiding nook behind it
      const centerWing = new THREE.Mesh(panelGeo, woodMat);
      centerWing.position.set(0, 0.86, 0.42);
      const centerVelvet = new THREE.Mesh(insetGeo, velvetMat);
      centerVelvet.position.copy(centerWing.position);

      const leftWing = new THREE.Mesh(panelGeo, woodMat);
      leftWing.position.set(-0.56, 0.86, 0.24);
      leftWing.rotation.y = 0.52;
      const leftVelvet = new THREE.Mesh(insetGeo, velvetMat);
      leftVelvet.position.copy(leftWing.position);
      leftVelvet.rotation.y = 0.52;

      const rightWing = new THREE.Mesh(panelGeo, woodMat);
      rightWing.position.set(0.56, 0.86, 0.24);
      rightWing.rotation.y = -0.52;
      const rightVelvet = new THREE.Mesh(insetGeo, velvetMat);
      rightVelvet.position.copy(rightWing.position);
      rightVelvet.rotation.y = -0.52;

      const urn = new THREE.Mesh(urnGeo, urnMat);
      urn.position.set(-0.82, 0.425, -0.05);
      const urnRim = new THREE.Mesh(
        this.track(new THREE.TorusGeometry(0.24, 0.03, 8, 16)),
        goldMat
      );
      urnRim.rotation.x = Math.PI / 2;
      urnRim.position.set(-0.82, 0.85, -0.05);

      grp.add(
        centerWing,
        centerVelvet,
        leftWing,
        leftVelvet,
        rightWing,
        rightVelvet,
        urn,
        urnRim
      );
      this.add(grp);

      this.hidingSpots.push({
        id: cfg.id,
        name: cfg.name,
        floor: cfg.floor,
        pos: cfg.pos.clone(),
      });
    });

    // Additional museum-wide hiding spots (columns, benches, stairs, central globe, balcony corners)
    const freeSpots: Array<{
      id: string;
      name: string;
      floor: 1 | 2;
      pos: THREE.Vector3;
    }> = [
      {
        id: 'col-f1-fl',
        name: metin("MuseumBuilding", "1_kat_sol_on_sutun_arkasi"),
        floor: 1,
        pos: new THREE.Vector3(-6.4, MUSEUM_FLOOR_Y, -6.2),
      },
      {
        id: 'col-f1-fr',
        name: metin("MuseumBuilding", "1_kat_sag_on_sutun_arkasi"),
        floor: 1,
        pos: new THREE.Vector3(6.4, MUSEUM_FLOOR_Y, -6.2),
      },
      {
        id: 'col-f1-bl',
        name: metin("MuseumBuilding", "1_kat_sol_arka_sutun_arkasi"),
        floor: 1,
        pos: new THREE.Vector3(-6.4, MUSEUM_FLOOR_Y, -17.0),
      },
      {
        id: 'col-f1-br',
        name: metin("MuseumBuilding", "1_kat_sag_arka_sutun_arkasi"),
        floor: 1,
        pos: new THREE.Vector3(6.4, MUSEUM_FLOOR_Y, -17.0),
      },
      {
        id: 'globe-f1',
        name: metin("MuseumBuilding", "1_kat_dunya_kuresi_yani"),
        floor: 1,
        pos: new THREE.Vector3(-1.0, MUSEUM_FLOOR_Y, -11.8),
      },
      {
        id: 'bench-f1-l',
        name: metin("MuseumBuilding", "1_kat_sol_dinlenme_banki_yani"),
        floor: 1,
        pos: new THREE.Vector3(-5.2, MUSEUM_FLOOR_Y, -11.5),
      },
      {
        id: 'bench-f1-r',
        name: metin("MuseumBuilding", "1_kat_sag_dinlenme_banki_yani"),
        floor: 1,
        pos: new THREE.Vector3(5.2, MUSEUM_FLOOR_Y, -11.5),
      },
      {
        id: 'stair-f1-l',
        name: metin("MuseumBuilding", "1_kat_sol_merdiven_nisi"),
        floor: 1,
        pos: new THREE.Vector3(-7.3, MUSEUM_FLOOR_Y, -14.8),
      },
      {
        id: 'stair-f1-r',
        name: metin("MuseumBuilding", "1_kat_sag_merdiven_nisi"),
        floor: 1,
        pos: new THREE.Vector3(7.3, MUSEUM_FLOOR_Y, -14.8),
      },
      {
        id: 'f2-bl',
        name: metin("MuseumBuilding", "2_kat_sol_arka_galeri_kosesi"),
        floor: 2,
        pos: new THREE.Vector3(-9.5, MUSEUM_FLOOR_2_Y, -19.5),
      },
      {
        id: 'f2-br',
        name: metin("MuseumBuilding", "2_kat_sag_arka_galeri_kosesi"),
        floor: 2,
        pos: new THREE.Vector3(9.5, MUSEUM_FLOOR_2_Y, -19.5),
      },
      {
        id: 'f2-front-l',
        name: metin("MuseumBuilding", "2_kat_sol_on_balkon_kosesi"),
        floor: 2,
        pos: new THREE.Vector3(-8.2, MUSEUM_FLOOR_2_Y, -3.1),
      },
      {
        id: 'f2-front-r',
        name: metin("MuseumBuilding", "2_kat_sag_on_balkon_kosesi"),
        floor: 2,
        pos: new THREE.Vector3(8.2, MUSEUM_FLOOR_2_Y, -3.1),
      },
    ];
    for (const fs of freeSpots) {
      this.hidingSpots.push(fs);
    }
  }

  getHidingSpots(): HidingSpot[] {
    return this.hidingSpots;
  }

  setExtraWallRects(rects: WallRect[]): void {
    this.extraWallRects = rects;
  }

  setIndoorWallRects(rects: WallRect[]): void {
    this.indoorWallRects = [
      // Central Atrium Globe Pedestal (Floor 1)
      {
        minX: -0.55,
        maxX: 0.55,
        minZ: -12.35,
        maxZ: -11.25,
        floor: 1,
      },
      ...rects,
    ];
  }

  private track<T extends {dispose: () => void}>(item: T): T {
    this.disposables.push(item);
    return item;
  }

  private buildBaseAndSteps(): void {
    const trav = getTravertineTextures(3, 1);
    const marbleTex = getMarbleInlayTexture(6, 6);
    const marbleMat = this.track(
      new THREE.MeshStandardMaterial({
        map: trav.map,
        bumpMap: trav.bumpMap,
        bumpScale: 0.015,
        color: 0xe7dcc8,
        roughness: 0.55,
        metalness: 0.05,
      })
    );
    const plinthMat = this.track(
      new THREE.MeshStandardMaterial({
        map: trav.map,
        bumpMap: trav.bumpMap,
        bumpScale: 0.02,
        color: 0x475569,
        roughness: 0.72,
        metalness: 0.1,
      })
    );

    const floorTex = this.track(createInteriorFloorTexture(9, 8));
    const floorMat = this.track(
      new THREE.MeshStandardMaterial({
        map: floorTex,
        roughness: 0.28,
        metalness: 0.06,
      })
    );
    const interiorFloor = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(27.0, MUSEUM_FLOOR_Y, 24.0)),
      floorMat
    );
    interiorFloor.position.set(0, MUSEUM_FLOOR_Y / 2, -12.0);
    interiorFloor.receiveShadow = true;
    interiorFloor.name = 'walkable-ground';
    this.add(interiorFloor);

    // Entrance steps with Marmara marble riser trim
    const stepTopMat = this.track(
      new THREE.MeshStandardMaterial({
        map: marbleTex,
        roughness: 0.35,
        metalness: 0.06,
      })
    );
    for (let i = 0; i < 4; i++) {
      const stepHeight = (MUSEUM_FLOOR_Y / 4) * (i + 1);
      const stepDepth = 0.78;
      const stepWidth = 9.8 - i * 0.35;
      const step = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth)),
        [marbleMat, marbleMat, stepTopMat, marbleMat, marbleMat, marbleMat]
      );
      step.position.set(0, stepHeight / 2, 2.85 - i * 0.72);
      step.receiveShadow = true;
      step.castShadow = true;
      step.name = 'walkable-ground';
      this.add(step);
    }

    // Anatolian woven kilim rotunda carpet + İznik turquoise inlay ring
    const kilimTex = getAnatolianKilimTexture('crimson');
    const carpetGeo = this.track(new THREE.RingGeometry(1.15, 4.05, 48));
    const carpetMat = this.track(
      new THREE.MeshStandardMaterial({
        map: kilimTex,
        roughness: 0.88,
      })
    );
    const carpet = new THREE.Mesh(carpetGeo, carpetMat);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(0, MUSEUM_FLOOR_Y + 0.012, -11.8);
    carpet.receiveShadow = true;
    this.add(carpet);

    // Outer golden & turquoise border rings around rotunda carpet
    const goldMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.82,
        roughness: 0.22,
      })
    );
    const goldRing = new THREE.Mesh(
      this.track(new THREE.RingGeometry(4.0, 4.18, 48)),
      goldMat
    );
    goldRing.rotation.x = -Math.PI / 2;
    goldRing.position.set(0, MUSEUM_FLOOR_Y + 0.015, -11.8);
    this.add(goldRing);

    const iznikRing = new THREE.Mesh(
      this.track(new THREE.RingGeometry(1.22, 1.48, 32)),
      this.track(
        new THREE.MeshStandardMaterial({
          map: getIznikTileTexture('turquoise', 4, 1),
          roughness: 0.25,
          metalness: 0.15,
        })
      )
    );
    iznikRing.rotation.x = -Math.PI / 2;
    iznikRing.position.set(0, MUSEUM_FLOOR_Y + 0.016, -11.8);
    this.add(iznikRing);

    // Central golden compass medallion
    const centerDisc = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(1.22, 1.44, 0.22, 8)),
      goldMat
    );
    centerDisc.position.set(0, MUSEUM_FLOOR_Y + 0.11, -11.8);
    centerDisc.receiveShadow = true;
    this.add(centerDisc);

    // Sculptural octagonal pedestal & dual armillary brass rings around turquoise centerpiece orb
    const globeStand = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.3, 0.42, 0.68, 8)),
      marbleMat
    );
    globeStand.position.set(0, MUSEUM_FLOOR_Y + 0.56, -11.8);
    const globeBaseCollar = new THREE.Mesh(
      this.track(new THREE.TorusGeometry(0.34, 0.04, 8, 24)),
      goldMat
    );
    globeBaseCollar.rotation.x = Math.PI / 2;
    globeBaseCollar.position.set(0, MUSEUM_FLOOR_Y + 0.88, -11.8);

    this.globeMesh = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(0.42, 24, 18)),
      this.track(
        new THREE.MeshStandardMaterial({
          map: getIznikTileTexture('turquoise', 2, 1),
          color: 0x38bdf8,
          metalness: 0.48,
          roughness: 0.18,
          emissive: 0x0369a1,
          emissiveIntensity: 0.28,
        })
      )
    );
    this.globeMesh.position.set(0, MUSEUM_FLOOR_Y + 1.24, -11.8);
    this.globeMesh.userData.easterEggId = 'atrium-globe';

    this.globeRingMesh = new THREE.Mesh(
      this.track(new THREE.TorusGeometry(0.56, 0.036, 10, 36)),
      goldMat
    );
    this.globeRingMesh.position.copy(this.globeMesh.position);
    this.globeRingMesh.rotation.set(0.45, 0.2, 0.3);

    const outerRing = new THREE.Mesh(
      this.track(new THREE.TorusGeometry(0.64, 0.025, 8, 36)),
      goldMat
    );
    outerRing.rotation.set(-0.55, 0.1, -0.35);
    this.globeRingMesh.add(outerRing);

    const topStar = new THREE.Mesh(
      this.track(createSeljukStarGeometry(0.14, 0.075, 0.04)),
      goldMat
    );
    topStar.position.set(0, 0.66, 0);
    this.globeRingMesh.add(topStar);

    this.buildingInteractiveMeshes.push(this.globeMesh);
    this.add(globeStand, globeBaseCollar, this.globeMesh, this.globeRingMesh);

    // Dark travertine exterior foundation plinth wrapping base of museum
    const plinthFrontL = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(10.85, 0.52, 0.84)),
      plinthMat
    );
    plinthFrontL.position.set(-8.0, 0.26, 0);
    const plinthFrontR = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(10.85, 0.52, 0.84)),
      plinthMat
    );
    plinthFrontR.position.set(8.0, 0.26, 0);
    const plinthLeft = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.84, 0.52, 24.1)),
      plinthMat
    );
    plinthLeft.position.set(-13.15, 0.26, -12.0);
    const plinthRight = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.84, 0.52, 24.1)),
      plinthMat
    );
    plinthRight.position.set(13.15, 0.26, -12.0);
    this.add(plinthFrontL, plinthFrontR, plinthLeft, plinthRight);
  }

  private buildWallsAndWindows(): void {
    const trav = getTravertineTextures(5, 3);
    const stoneMat = this.track(
      new THREE.MeshStandardMaterial({
        map: trav.map,
        bumpMap: trav.bumpMap,
        bumpScale: 0.025,
        color: 0xf1e7d5,
        roughness: 0.78,
        metalness: 0.02,
      })
    );
    const pilasterMat = this.track(
      new THREE.MeshStandardMaterial({
        map: trav.map,
        bumpMap: trav.bumpMap,
        bumpScale: 0.02,
        color: 0xd9c7a8,
        roughness: 0.7,
        metalness: 0.04,
      })
    );
    const wainscotTex = this.track(createWainscotingTexture(14));
    const wainscotMat = this.track(
      new THREE.MeshStandardMaterial({
        map: wainscotTex,
        bumpMap: getWalnutWoodTextures(14, 1).bumpMap,
        bumpScale: 0.015,
        roughness: 0.62,
        metalness: 0.06,
      })
    );
    const iznikFriezeMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getIznikTileTexture('turquoise', 14, 1),
        roughness: 0.24,
        metalness: 0.16,
      })
    );
    const iznikSideFriezeMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getIznikTileTexture('cobalt', 12, 1),
        roughness: 0.24,
        metalness: 0.16,
      })
    );
    const goldMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xd99b26,
        roughness: 0.26,
        metalness: 0.82,
      })
    );

    const wallHeight = 9.7;
    const baseY = MUSEUM_FLOOR_Y + wallHeight / 2;

    // Front left & right facade walls (leaving doorway x = -2.6..+2.6 open)
    const frontSideGeo = this.track(new THREE.BoxGeometry(10.8, wallHeight, 0.7));
    const frontLeft = new THREE.Mesh(frontSideGeo, stoneMat);
    frontLeft.position.set(-8.0, baseY, 0);
    frontLeft.castShadow = true;
    frontLeft.receiveShadow = true;

    const frontRight = new THREE.Mesh(frontSideGeo, stoneMat);
    frontRight.position.set(8.0, baseY, 0);
    frontRight.castShadow = true;
    frontRight.receiveShadow = true;

    // Header wall above doorway (doorway height = 3.8m above floor)
    const lintel = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(5.6, wallHeight - 3.8, 0.7)),
      stoneMat
    );
    lintel.position.set(0, MUSEUM_FLOOR_Y + 3.8 + (wallHeight - 3.8) / 2, 0);
    lintel.castShadow = true;

    // Upper İznik ceramic frieze & gold cornice bands wrapping all 4 exterior walls
    const upperFrieze = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(27.36, 0.56, 0.86)),
      iznikFriezeMat
    );
    upperFrieze.position.set(0, MUSEUM_FLOOR_Y + wallHeight - 0.36, 0);

    const leftUpperFrieze = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.86, 0.56, 24.3)),
      iznikSideFriezeMat
    );
    leftUpperFrieze.position.set(-13.15, MUSEUM_FLOOR_Y + wallHeight - 0.36, -12.0);
    const rightUpperFrieze = leftUpperFrieze.clone();
    rightUpperFrieze.position.x = 13.15;

    const midFrieze = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(27.4, 0.28, 0.84)),
      goldMat
    );
    midFrieze.position.set(0, MUSEUM_FLOOR_2_Y - 0.15, 0);

    // Side & back 2-story walls
    const sideWallGeo = this.track(new THREE.BoxGeometry(0.7, wallHeight, 24.0));
    const leftWall = new THREE.Mesh(sideWallGeo, stoneMat);
    leftWall.position.set(-13.15, baseY, -12.0);
    leftWall.receiveShadow = true;

    const rightWall = new THREE.Mesh(sideWallGeo, stoneMat);
    rightWall.position.set(13.15, baseY, -12.0);
    rightWall.receiveShadow = true;

    const backWall = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(27.0, wallHeight, 0.7)),
      stoneMat
    );
    backWall.position.set(0, baseY, -23.65);
    backWall.receiveShadow = true;

    // Corner cut-stone buttress pilasters giving rich Seljuk facade relief
    const cornerPilasterGeo = this.track(new THREE.BoxGeometry(1.1, wallHeight + 0.2, 1.1));
    [
      [-13.15, 0.0],
      [13.15, 0.0],
      [-13.15, -23.65],
      [13.15, -23.65],
    ].forEach(([px, pz]) => {
      const p = new THREE.Mesh(cornerPilasterGeo, pilasterMat);
      p.position.set(px, baseY, pz);
      this.add(p);
    });

    // Architectural Dark Walnut Dado Wainscoting along interior walls on Floor 1 & Floor 2
    [MUSEUM_FLOOR_Y, MUSEUM_FLOOR_2_Y].forEach((floorY) => {
      const dadoH = 1.25;
      const dadoY = floorY + dadoH / 2;

      const backDado = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(25.6, dadoH, 0.08)),
        wainscotMat
      );
      backDado.position.set(0, dadoY, -23.26);

      const leftDado = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(0.08, dadoH, 23.0)),
        wainscotMat
      );
      leftDado.position.set(-12.76, dadoY, -11.8);

      const rightDado = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(0.08, dadoH, 23.0)),
        wainscotMat
      );
      rightDado.position.set(12.76, dadoY, -11.8);

      const frontLDado = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(10.1, dadoH, 0.08)),
        wainscotMat
      );
      frontLDado.position.set(-7.7, dadoY, -0.39);

      const frontRDado = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(10.1, dadoH, 0.08)),
        wainscotMat
      );
      frontRDado.position.set(7.7, dadoY, -0.39);

      this.add(backDado, leftDado, rightDado, frontLDado, frontRDado);
    });

    // Exterior & interior 2-tier glowing stained-glass windows with pointed Kemer arch crowns
    const windowMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x7dd3fc,
        roughness: 0.14,
        metalness: 0.38,
        emissive: 0x0284c7,
        emissiveIntensity: 0.42,
      })
    );
    const windowGeo = this.track(new THREE.BoxGeometry(2.05, 2.75, 0.14));
    const winFrameGeo = this.track(new THREE.BoxGeometry(2.38, 3.05, 0.12));
    const frontArchGeo = this.track(
      createPointedArchGeometry(2.42, 0.85, 2.02, 0.15, 0.72, 0.16)
    );
    const mullionGeo = this.track(new THREE.BoxGeometry(0.08, 2.75, 0.16));
    [-10.2, -6.2, 6.2, 10.2].forEach((wx) => {
      [MUSEUM_FLOOR_Y + 2.4, MUSEUM_FLOOR_2_Y + 2.25].forEach((wy) => {
        const frame = new THREE.Mesh(winFrameGeo, pilasterMat);
        frame.position.set(wx, wy, 0.36);
        const glass = new THREE.Mesh(windowGeo, windowMat);
        glass.position.set(wx, wy, 0.4);
        const mullion = new THREE.Mesh(mullionGeo, goldMat);
        mullion.position.set(wx, wy, 0.42);
        const archCrown = new THREE.Mesh(frontArchGeo, goldMat);
        archCrown.position.set(wx, wy + 1.1, 0.41);
        this.add(frame, glass, mullion, archCrown);
      });
    });

    // Side clerestory upper-level glowing pointed-arch windows inside & out
    const sideWinFrameGeo = this.track(new THREE.BoxGeometry(0.18, 2.1, 2.6));
    const sideWinGlassGeo = this.track(new THREE.BoxGeometry(0.22, 1.85, 2.3));
    const sideArchGeo = this.track(
      createPointedArchGeometry(2.6, 0.72, 2.1, 0.1, 0.62, 0.2)
    );
    [-4.5, -11.5, -18.5].forEach((wz) => {
      [-12.78, 12.78].forEach((sx) => {
        const f = new THREE.Mesh(sideWinFrameGeo, pilasterMat);
        f.position.set(sx, MUSEUM_FLOOR_2_Y + 2.95, wz);
        const g = new THREE.Mesh(sideWinGlassGeo, windowMat);
        g.position.set(sx, MUSEUM_FLOOR_2_Y + 2.95, wz);
        const a = new THREE.Mesh(sideArchGeo, goldMat);
        a.rotation.y = Math.PI / 2;
        a.position.set(sx, MUSEUM_FLOOR_2_Y + 3.6, wz);
        this.add(f, g, a);
      });
    });

    this.add(
      frontLeft,
      frontRight,
      lintel,
      upperFrieze,
      leftUpperFrieze,
      rightUpperFrieze,
      midFrieze,
      leftWall,
      rightWall,
      backWall
    );
  }

  private buildSecondFloorMezzanine(): void {
    const floorTex = this.track(createInteriorFloorTexture(8, 3));
    const deckMat = this.track(
      new THREE.MeshStandardMaterial({
        map: floorTex,
        roughness: 0.34,
        metalness: 0.05,
      })
    );
    const soffitMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xc8b496,
        roughness: 0.78,
      })
    );
    const brassMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xc98a18,
        metalness: 0.78,
        roughness: 0.28,
      })
    );
    const glassRailMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x93c5fd,
        transparent: true,
        opacity: 0.3,
        roughness: 0.12,
        metalness: 0.2,
      })
    );

    const slabH = 0.32;
    const slabCenterY = MUSEUM_FLOOR_2_Y - slabH / 2;

    const addDeck = (cx: number, cz: number, w: number, d: number) => {
      const mesh = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(w, slabH, d)),
        [deckMat, deckMat, deckMat, soffitMat, deckMat, deckMat]
      );
      mesh.position.set(cx, slabCenterY, cz);
      mesh.receiveShadow = true;
      mesh.castShadow = false;
      mesh.name = 'walkable-ground';
      this.add(mesh);
    };

    // 4 Mezzanine Wings cleanly joining the twin staircase top landings at z = -6.0
    addDeck(0, -3.15, 26.0, 5.7); // Front Mezzanine (z: -6.0..-0.3)
    addDeck(0, -20.2, 26.0, 6.4); // Back Mezzanine (z: -23.4..-17.0)
    addDeck(-9.775, -11.5, 6.45, 11.0); // Left Mezzanine (x: -13.0..-6.55)
    addDeck(9.775, -11.5, 6.45, 11.0); // Right Mezzanine (x: 6.55..13.0)

    const addBalustrade = (
      x1: number,
      z1: number,
      x2: number,
      z2: number,
      baseY: number
    ) => {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.hypot(dx, dz);
      const angle = Math.atan2(dx, dz);

      const group = new THREE.Group();
      group.position.set((x1 + x2) / 2, baseY, (z1 + z2) / 2);
      group.rotation.y = angle;

      const topRail = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(0.11, 0.08, len)),
        brassMat
      );
      topRail.position.y = 0.96;

      const bottomTrim = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(0.14, 0.1, len)),
        brassMat
      );
      bottomTrim.position.y = 0.05;

      const glass = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(0.04, 0.84, len - 0.12)),
        glassRailMat
      );
      glass.position.y = 0.5;

      const postCount = Math.max(2, Math.round(len / 1.8) + 1);
      const postGeo = this.track(new THREE.CylinderGeometry(0.038, 0.044, 0.96, 10));
      for (let i = 0; i < postCount; i++) {
        const pz = -len / 2 + (len * i) / (postCount - 1);
        const post = new THREE.Mesh(postGeo, brassMat);
        post.position.set(0, 0.48, pz);
        group.add(post);
      }

      group.add(topRail, bottomTrim, glass);
      this.add(group);
    };

    // Front balustrade (stops at +-4.02 so staircase landings are completely open!)
    addBalustrade(-4.02, -6.0, 4.02, -6.0, MUSEUM_FLOOR_2_Y);
    addBalustrade(-6.5, -17.0, 6.5, -17.0, MUSEUM_FLOOR_2_Y);
    addBalustrade(-6.5, -6.0, -6.5, -17.0, MUSEUM_FLOOR_2_Y);
    addBalustrade(6.5, -6.0, 6.5, -17.0, MUSEUM_FLOOR_2_Y);
  }

  private buildTwinStaircases(): void {
    const marbleMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xc2ab87,
        roughness: 0.58,
        metalness: 0.04,
      })
    );
    const riserMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x9c8260,
        roughness: 0.72,
      })
    );
    const goldMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xc98a18,
        metalness: 0.8,
        roughness: 0.26,
      })
    );
    const runnerTex = this.track(createStairRunnerTexture());
    const carpetMat = this.track(
      new THREE.MeshStandardMaterial({
        map: runnerTex,
        roughness: 0.85,
      })
    );

    const stepCount = 18;
    const totalRise = MUSEUM_FLOOR_2_Y - MUSEUM_FLOOR_Y;
    const totalRun = STAIR_END_Z - STAIR_START_Z; // +8.2m gentle ramp
    const stepRise = totalRise / stepCount;
    const stepRun = totalRun / stepCount;
    const stairWidth = STAIR_MAX_ABS_X - STAIR_MIN_ABS_X; // 2.30m wide!

    [-5.4, 5.4].forEach((cx) => {
      const stairGroup = new THREE.Group();

      for (let i = 0; i < stepCount; i++) {
        const yTop = MUSEUM_FLOOR_Y + stepRise * (i + 1);
        const zCenter = STAIR_START_Z + stepRun * (i + 0.5);

        const blockH = yTop - MUSEUM_FLOOR_Y;
        const stepMesh = new THREE.Mesh(
          this.track(new THREE.BoxGeometry(stairWidth, blockH, stepRun + 0.04)),
          [riserMat, riserMat, marbleMat, riserMat, riserMat, riserMat]
        );
        stepMesh.position.set(cx, MUSEUM_FLOOR_Y + blockH / 2, zCenter);
        stepMesh.castShadow = false;
        stepMesh.receiveShadow = true;
        stepMesh.name = 'walkable-ground';
        stairGroup.add(stepMesh);

        // Rich Anatolian crimson & gold woven runner strip
        const runner = new THREE.Mesh(
          this.track(new THREE.BoxGeometry(stairWidth * 0.64, 0.024, stepRun + 0.02)),
          carpetMat
        );
        runner.position.set(cx, yTop + 0.012, zCenter);
        stairGroup.add(runner);

        const nosing = new THREE.Mesh(
          this.track(new THREE.BoxGeometry(stairWidth + 0.02, 0.028, 0.05)),
          goldMat
        );
        nosing.position.set(cx, yTop + 0.01, zCenter - stepRun / 2);
        stairGroup.add(nosing);
      }

      // Sloped brass handrails positioned cleanly along the outer edges (+-1.22m from stair center)
      const slopeLen = Math.hypot(totalRun, totalRise);
      const slopeAngle = Math.atan2(totalRise, totalRun);
      const midZ = (STAIR_START_Z + STAIR_END_Z) / 2;
      const midY = (MUSEUM_FLOOR_Y + MUSEUM_FLOOR_2_Y) / 2 + 0.92;

      [-1.22, 1.22].forEach((rx) => {
        const rail = new THREE.Mesh(
          this.track(new THREE.BoxGeometry(0.08, 0.08, slopeLen)),
          goldMat
        );
        rail.position.set(cx + rx, midY, midZ);
        rail.rotation.x = -slopeAngle;
        stairGroup.add(rail);

        [
          [STAIR_START_Z, MUSEUM_FLOOR_Y],
          [STAIR_END_Z, MUSEUM_FLOOR_2_Y],
        ].forEach(([pz, py]) => {
          const post = new THREE.Mesh(
            this.track(new THREE.BoxGeometry(0.14, 1.05, 0.14)),
            marbleMat
          );
          post.position.set(cx + rx, py + 0.52, pz);
          const orb = new THREE.Mesh(
            this.track(new THREE.SphereGeometry(0.09, 12, 10)),
            goldMat
          );
          orb.position.set(cx + rx, py + 1.1, pz);
          stairGroup.add(post, orb);
        });
      });

      this.add(stairGroup);
    });
  }

  private buildInteriorColumnsAndDecor(): void {
    const trav = getTravertineTextures(2, 4);
    const marbleMat = this.track(
      new THREE.MeshStandardMaterial({
        map: trav.map,
        bumpMap: trav.bumpMap,
        bumpScale: 0.015,
        color: 0xe3d2b6,
        roughness: 0.46,
        metalness: 0.08,
      })
    );
    const goldMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xd99b26,
        metalness: 0.84,
        roughness: 0.22,
      })
    );
    const turquoiseMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getIznikTileTexture('turquoise', 2, 1),
        roughness: 0.22,
        metalness: 0.18,
      })
    );

    // 6 Double-height Anatolian fluted marble columns with Muqarnas capitals framing atrium
    const colHeight = 9.5;
    [
      [-6.4, -6.2],
      [6.4, -6.2],
      [-6.4, -17.0],
      [6.4, -17.0],
      [-6.4, -11.6],
      [6.4, -11.6],
    ].forEach(([cx, cz]) => {
      const col = createAnatolianColumn(
        (item) => this.track(item),
        0.32,
        colHeight,
        marbleMat,
        turquoiseMat,
        goldMat
      );
      col.position.set(cx, MUSEUM_FLOOR_Y, cz);

      const midRing = new THREE.Mesh(
        this.track(new THREE.TorusGeometry(0.35, 0.05, 8, 20)),
        goldMat
      );
      midRing.rotation.x = Math.PI / 2;
      midRing.position.set(cx, MUSEUM_FLOOR_2_Y, cz);

      this.add(col, midRing);
    });

    // Ornate İznik ceramic wall panels framed in carved walnut on Floor 1 & Floor 2
    const tileTex = this.track(createIznikTilePanelTexture());
    const tileMat = this.track(
      new THREE.MeshStandardMaterial({
        map: tileTex,
        roughness: 0.26,
        metalness: 0.14,
      })
    );
    const tileGeo = this.track(new THREE.PlaneGeometry(3.4, 1.5));
    const tileFrameGeo = this.track(new THREE.BoxGeometry(3.58, 1.68, 0.08));

    [MUSEUM_FLOOR_Y + 3.7, MUSEUM_FLOOR_2_Y + 3.65].forEach((ty) => {
      [-6.0, 0, 6.0].forEach((tx) => {
        const frame = new THREE.Mesh(tileFrameGeo, goldMat);
        frame.position.set(tx, ty, -23.31);
        const backPanel = new THREE.Mesh(tileGeo, tileMat);
        backPanel.position.set(tx, ty, -23.26);
        this.add(frame, backPanel);
      });
    });

    // Potted indoor cypress/olive trees in glazed İznik turquoise ceramic urns
    const potGeo = this.track(new THREE.CylinderGeometry(0.38, 0.25, 0.64, 16));
    const trunkGeo = this.track(new THREE.CylinderGeometry(0.06, 0.085, 0.92, 8));
    const leafGeo = this.track(new THREE.ConeGeometry(0.42, 1.4, 12));
    const trunkMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getWalnutWoodTextures(1, 2).map,
        color: 0x78350f,
        roughness: 0.9,
      })
    );
    const leafMat = this.track(
      new THREE.MeshStandardMaterial({color: 0x15803d, roughness: 0.78})
    );

    [
      [-3.1, MUSEUM_FLOOR_Y, -1.3],
      [3.1, MUSEUM_FLOOR_Y, -1.3],
      [-3.4, MUSEUM_FLOOR_Y, -15.6],
      [3.4, MUSEUM_FLOOR_Y, -15.6],
      [-8.0, MUSEUM_FLOOR_2_Y, -1.3],
      [8.0, MUSEUM_FLOOR_2_Y, -1.3],
    ].forEach(([px, py, pz]) => {
      const plant = new THREE.Group();
      const pot = new THREE.Mesh(potGeo, turquoiseMat);
      pot.position.y = 0.32;
      const rim = new THREE.Mesh(
        this.track(new THREE.TorusGeometry(0.38, 0.04, 8, 16)),
        goldMat
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.64;
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 0.95;
      const foliage1 = new THREE.Mesh(leafGeo, leafMat);
      foliage1.position.y = 1.6;
      const foliage2 = new THREE.Mesh(leafGeo, leafMat);
      foliage2.scale.setScalar(0.75);
      foliage2.position.y = 2.15;
      plant.add(pot, rim, trunk, foliage1, foliage2);
      plant.position.set(px, py, pz);
      this.add(plant);
    });

    // Plush Anatolian kilim-upholstered museum benches with turned brass legs
    const seatMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getAnatolianKilimTexture('navy'),
        roughness: 0.78,
      })
    );
    const benchGeo = this.track(new THREE.BoxGeometry(2.15, 0.16, 0.7));
    const benchLegGeo = this.track(new THREE.CylinderGeometry(0.06, 0.08, 0.38, 10));
    [
      [0, MUSEUM_FLOOR_Y, -7.2],
      [0, MUSEUM_FLOOR_Y, -16.2],
      [0, MUSEUM_FLOOR_2_Y, -18.2],
    ].forEach(([bx, by, bz]) => {
      const bench = new THREE.Group();
      const seat = new THREE.Mesh(benchGeo, seatMat);
      seat.position.y = 0.44;
      const walnutTrim = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(2.22, 0.06, 0.76)),
        trunkMat
      );
      walnutTrim.position.y = 0.36;
      [
        [-0.86, -0.22],
        [-0.86, 0.22],
        [0.86, -0.22],
        [0.86, 0.22],
      ].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(benchLegGeo, goldMat);
        leg.position.set(lx, 0.18, lz);
        bench.add(leg);
      });
      bench.add(seat, walnutTrim);
      bench.position.set(bx, by, bz);
      this.add(bench);
    });

    // Grand Suspended Ottoman Kandil Brass & Crystal Tiered Chandelier in Central Atrium
    this.chandelierGroup.position.set(0, 9.6, -11.8);
    const chain = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 8)),
      goldMat
    );
    chain.position.y = 1.2;

    const bulbMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xfef3c7,
        emissive: 0xfbbf24,
        emissiveIntensity: 1.5,
        roughness: 0.15,
      })
    );
    const upperRing = new THREE.Mesh(
      this.track(new THREE.TorusGeometry(1.15, 0.06, 10, 32)),
      goldMat
    );
    upperRing.rotation.x = Math.PI / 2;
    upperRing.position.y = -0.3;

    const lowerRing = new THREE.Mesh(
      this.track(new THREE.TorusGeometry(1.85, 0.075, 10, 36)),
      goldMat
    );
    lowerRing.rotation.x = Math.PI / 2;
    lowerRing.position.y = -1.1;

    const orbGeo = this.track(new THREE.SphereGeometry(0.11, 12, 10));
    const chainRodGeo = this.track(new THREE.CylinderGeometry(0.014, 0.014, 0.85, 6));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const orbU = new THREE.Mesh(orbGeo, bulbMat);
      orbU.position.set(Math.cos(a) * 1.15, -0.18, Math.sin(a) * 1.15);
      this.chandelierGroup.add(orbU);
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const orbL = new THREE.Mesh(orbGeo, bulbMat);
      orbL.position.set(Math.cos(a) * 1.85, -0.96, Math.sin(a) * 1.85);
      this.chandelierGroup.add(orbL);
      if (i % 3 === 0) {
        const spoke = new THREE.Mesh(chainRodGeo, goldMat);
        spoke.position.set(Math.cos(a) * 1.5, -0.7, Math.sin(a) * 1.5);
        spoke.rotation.z = Math.cos(a) * 0.6;
        spoke.rotation.x = -Math.sin(a) * 0.6;
        this.chandelierGroup.add(spoke);
      }
    }
    const centerCrystal = new THREE.Mesh(
      this.track(new THREE.OctahedronGeometry(0.32, 0)),
      bulbMat
    );
    centerCrystal.position.y = -1.45;
    this.chandelierGroup.add(chain, upperRing, lowerRing, centerCrystal);
    this.add(this.chandelierGroup);
  }

  private buildPorticoAndSign(): void {
    const trav = getTravertineTextures(3, 2);
    const columnMat = this.track(
      new THREE.MeshStandardMaterial({
        map: trav.map,
        bumpMap: trav.bumpMap,
        bumpScale: 0.022,
        color: 0xe8d9be,
        roughness: 0.58,
        metalness: 0.06,
      })
    );
    const iznikMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getIznikTileTexture('cobalt', 3, 1),
        roughness: 0.24,
        metalness: 0.16,
      })
    );
    const goldMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xd99b26,
        roughness: 0.26,
        metalness: 0.82,
      })
    );

    [-4.3, -2.55, 2.55, 4.3].forEach((cx, idx) => {
      const colGroup = createAnatolianColumn(
        (item) => this.track(item),
        0.29,
        5.25,
        columnMat,
        iznikMat,
        goldMat
      );
      colGroup.position.set(cx, MUSEUM_FLOOR_Y, 2.2);
      colGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.userData.easterEggId = `portico-col-${idx}`;
          this.buildingInteractiveMeshes.push(child);
        }
      });
      this.add(colGroup);
    });

    // Monumental Seljuk Pointed Taç Kapı Arch framing the central doorway bay
    const portalArch = new THREE.Mesh(
      this.track(createPointedArchGeometry(5.1, 1.75, 4.2, 0.25, 1.5, 0.58)),
      columnMat
    );
    portalArch.position.set(0, MUSEUM_FLOOR_Y + 3.85, 2.2);
    portalArch.castShadow = true;
    this.add(portalArch);

    // Portico canopy roof with İznik turquoise frieze band & gold cornice
    const canopy = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(10.5, 0.52, 3.15)),
      columnMat
    );
    canopy.position.set(0, MUSEUM_FLOOR_Y + 5.65, 1.45);
    canopy.castShadow = true;
    const canopyFrieze = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(10.65, 0.24, 3.28)),
      iznikMat
    );
    canopyFrieze.position.set(0, MUSEUM_FLOOR_Y + 5.75, 1.45);
    this.add(canopy, canopyFrieze);

    // Decorative Seljuk stars flanking entrance parapet
    const starGeo = this.track(createSeljukStarGeometry(0.45, 0.22, 0.08));
    [-5.1, 5.1].forEach((sx) => {
      const star = new THREE.Mesh(starGeo, goldMat);
      star.position.set(sx, MUSEUM_FLOOR_Y + 6.3, 2.3);
      this.add(star);
    });

    // Redesigned "MİRASİUM MÜZESİ" signboard with embedded uploaded SVG logo
    const signTex = this.track(createSignboardTexture());
    const signBoardBacking = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(9.2, 2.45, 0.28)),
      goldMat
    );
    signBoardBacking.position.set(0, MUSEUM_FLOOR_Y + 7.15, 2.3);
    signBoardBacking.castShadow = true;

    const signFace = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(8.9, 2.25)),
      this.track(
        new THREE.MeshBasicMaterial({
          map: signTex,
        })
      )
    );
    signFace.position.set(0, MUSEUM_FLOOR_Y + 7.15, 2.46);
    this.add(signBoardBacking, signFace);

    // Interior golden arch over inside of doorway
    const innerArch = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(5.6, 0.34, 0.84)),
      goldMat
    );
    innerArch.position.set(0, MUSEUM_FLOOR_Y + 3.85, 0);
    this.add(innerArch);
  }

  private buildDoors(): void {
    const doorFrameMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.78,
        roughness: 0.25,
      })
    );
    const glassMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xbae6fd,
        transparent: true,
        opacity: 0.42,
        roughness: 0.1,
        metalness: 0.2,
      })
    );

    const panelGeo = this.track(new THREE.BoxGeometry(2.35, 3.65, 0.08));
    const frameBarGeo = this.track(new THREE.BoxGeometry(2.45, 0.16, 0.12));

    this.leftDoor.position.set(-2.5, MUSEUM_FLOOR_Y + 1.85, 0.08);
    const leftGlass = new THREE.Mesh(panelGeo, glassMat);
    leftGlass.position.x = 1.22;
    const leftTop = new THREE.Mesh(frameBarGeo, doorFrameMat);
    leftTop.position.set(1.22, 1.82, 0);
    const leftBottom = new THREE.Mesh(frameBarGeo, doorFrameMat);
    leftBottom.position.set(1.22, -1.8, 0);
    this.leftDoor.add(leftGlass, leftTop, leftBottom);

    this.rightDoor.position.set(2.5, MUSEUM_FLOOR_Y + 1.85, 0.08);
    const rightGlass = new THREE.Mesh(panelGeo, glassMat);
    rightGlass.position.x = -1.22;
    const rightTop = new THREE.Mesh(frameBarGeo, doorFrameMat);
    rightTop.position.set(-1.22, 1.82, 0);
    const rightBottom = new THREE.Mesh(frameBarGeo, doorFrameMat);
    rightBottom.position.set(-1.22, -1.8, 0);
    this.rightDoor.add(rightGlass, rightTop, rightBottom);

    this.add(this.leftDoor, this.rightDoor);
  }

  private buildRoofAndDome(): void {
    const trav = getTravertineTextures(6, 2);
    const roofMat = this.track(
      new THREE.MeshStandardMaterial({
        map: trav.map,
        bumpMap: trav.bumpMap,
        bumpScale: 0.02,
        color: 0xdccbb0,
        roughness: 0.74,
      })
    );
    const domeMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getIznikTileTexture('cobalt', 6, 3),
        color: 0x0284c7,
        roughness: 0.26,
        metalness: 0.34,
        side: THREE.DoubleSide,
      })
    );
    const goldMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        roughness: 0.22,
        metalness: 0.86,
      })
    );

    const roofY = MUSEUM_FLOOR_Y + 9.8;

    // 4 Roof slabs around the central dome skylight over (-11.8)
    const frontRoof = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(27.8, 0.45, 7.6)),
      roofMat
    );
    frontRoof.position.set(0, roofY, -3.6);
    const backRoof = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(27.8, 0.45, 7.8)),
      roofMat
    );
    backRoof.position.set(0, roofY, -20.2);
    const leftRoof = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(8.8, 0.45, 9.6)),
      roofMat
    );
    leftRoof.position.set(-9.5, roofY, -11.8);
    const rightRoof = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(8.8, 0.45, 9.6)),
      roofMat
    );
    rightRoof.position.set(9.5, roofY, -11.8);

    // Ornate roof stone parapet cresting
    const frontParapet = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(27.9, 0.65, 0.45)),
      roofMat
    );
    frontParapet.position.set(0, roofY + 0.52, 0.22);
    const backParapet = frontParapet.clone();
    backParapet.position.z = -23.85;
    this.add(frontParapet, backParapet);

    // 4 Corner Octagonal Turquoise Cupolas + Ottoman Alems
    [
      [-11.6, -1.6],
      [11.6, -1.6],
      [-11.6, -22.0],
      [11.6, -22.0],
    ].forEach(([cx, cz]) => {
      const miniDome = createRibbedDome(
        (item) => this.track(item),
        1.45,
        0.92,
        domeMat,
        goldMat,
        goldMat,
        {
          ribCount: 8,
          drumHeight: 0.7,
          drumMat: roofMat,
          alemScale: 0.65,
        }
      );
      miniDome.position.set(cx, roofY + 0.2, cz);
      this.add(miniDome);
    });

    // Grand Ribbed Ottoman Dome rising above the 2-story atrium with clerestory drum & crescent Alem
    const drumWindowMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.65,
        roughness: 0.2,
      })
    );
    const grandDome = createRibbedDome(
      (item) => this.track(item),
      5.5,
      0.86,
      domeMat,
      goldMat,
      goldMat,
      {
        ribCount: 16,
        drumHeight: 1.55,
        drumMat: roofMat,
        windowMat: drumWindowMat,
        drumWindows: 16,
        alemScale: 1.45,
      }
    );
    grandDome.position.set(0, roofY + 0.15, -11.8);

    this.add(
      frontRoof,
      backRoof,
      leftRoof,
      rightRoof,
      grandDome
    );
  }

  private buildInteriorLighting(): void {
    if (DEVICE_QUALITY.simplifiedLighting) {
      const centerLight = new THREE.PointLight(0xfff5dc, 1.35, 42, 1.5);
      centerLight.position.set(0, MUSEUM_FLOOR_2_Y + 3.2, -11.8);
      this.add(centerLight);
      return;
    }

    const centerLight = new THREE.PointLight(0xfff5dc, 1.0, 38, 1.75);
    centerLight.position.set(0, MUSEUM_FLOOR_2_Y + 3.4, -11.8);
    this.add(centerLight);

    const groundLight = new THREE.PointLight(0xfde68a, 0.72, 28, 1.85);
    groundLight.position.set(0, MUSEUM_FLOOR_Y + 3.6, -11.8);
    this.add(groundLight);

    const frontHallLight = new THREE.PointLight(0xfde68a, 0.65, 22, 1.85);
    frontHallLight.position.set(0, MUSEUM_FLOOR_2_Y + 3.2, -3.5);
    this.add(frontHallLight);

    const backHallLight = new THREE.PointLight(0xfde68a, 0.65, 24, 1.85);
    backHallLight.position.set(0, MUSEUM_FLOOR_2_Y + 3.2, -20.2);
    this.add(backHallLight);
  }

  updateDoorProximity(playerPos: THREE.Vector3): void {
    const dx = Math.abs(playerPos.x);
    const dz = Math.abs(playerPos.z - MUSEUM_ENTRANCE_Z);
    this.doorsTargetOpen = dx < 4.2 && dz < 4.8 && playerPos.y < 2.2;
  }

  isInStairFootprint(x: number, z: number): boolean {
    const absX = Math.abs(x);
    return (
      absX >= STAIR_MIN_ABS_X &&
      absX <= STAIR_MAX_ABS_X &&
      z >= STAIR_START_Z &&
      z <= STAIR_END_Z
    );
  }

  isInAtriumVoid(x: number, z: number): boolean {
    return Math.abs(x) < 6.5 && z < -6.0 && z > -17.0;
  }

  getFloorNumber(posY: number): 1 | 2 {
    return posY > 3.15 ? 2 : 1;
  }

  getGroundHeight(x: number, z: number, currentY = 0): number {
    // 1. Twin atrium staircases ramp smoothly from Floor 1 (z = -14.2) up to Floor 2 (z = -6.0)
    if (this.isInStairFootprint(x, z)) {
      const t = THREE.MathUtils.clamp(
        (z - STAIR_START_Z) / (STAIR_END_Z - STAIR_START_Z),
        0,
        1
      );
      return MUSEUM_FLOOR_Y + t * (MUSEUM_FLOOR_2_Y - MUSEUM_FLOOR_Y);
    }

    // 2. Floor 2 Mezzanine walkable areas when above stair midpoint
    if (currentY > 3.15 && Math.abs(x) <= 13.0 && z <= -0.3 && z >= -23.5) {
      if (!this.isInAtriumVoid(x, z)) {
        return MUSEUM_FLOOR_2_Y;
      }
    }

    // 3. Ground Floor 1 interior footprint
    if (Math.abs(x) <= 13.4 && z <= 0.35 && z >= -24.0) {
      return MUSEUM_FLOOR_Y;
    }

    // 4. Exterior entrance steps
    if (Math.abs(x) <= 4.9 && z > 0.35 && z <= 3.25) {
      const t = 1 - (z - 0.35) / (3.25 - 0.35);
      return THREE.MathUtils.clamp(t, 0, 1) * MUSEUM_FLOOR_Y;
    }

    return 0;
  }

  private pushOutRects(
    pos: THREE.Vector3,
    rects: WallRect[],
    radius: number
  ): void {
    for (const rect of rects) {
      const closestX = THREE.MathUtils.clamp(pos.x, rect.minX, rect.maxX);
      const closestZ = THREE.MathUtils.clamp(pos.z, rect.minZ, rect.maxZ);
      const dx = pos.x - closestX;
      const dz = pos.z - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.0001) {
          const push = radius - dist;
          pos.x += (dx / dist) * push;
          pos.z += (dz / dist) * push;
        } else {
          const penLeft = Math.abs(pos.x - rect.minX);
          const penRight = Math.abs(rect.maxX - pos.x);
          const penFront = Math.abs(rect.maxZ - pos.z);
          const penBack = Math.abs(pos.z - rect.minZ);
          const minPen = Math.min(penLeft, penRight, penFront, penBack);
          if (minPen === penFront) pos.z = rect.maxZ + radius;
          else if (minPen === penBack) pos.z = rect.minZ - radius;
          else if (minPen === penLeft) pos.x = rect.minX - radius;
          else pos.x = rect.maxX + radius;
        }
      }
    }
  }

  resolveCollision(pos: THREE.Vector3, radius = 0.42): void {
    pos.x = THREE.MathUtils.clamp(pos.x, -46.5, 44.5);
    pos.z = THREE.MathUtils.clamp(pos.z, -24.5, 45.5);

    for (let pass = 0; pass < 2; pass++) {
      // Outer perimeter walls apply at all heights
      this.pushOutRects(pos, this.outerWallRects, radius);

      // Extra outdoor wall rects (Hedge Labyrinth, Café, Park Props, Sema Stage, Mosque)
      if (this.extraWallRects.length > 0 && !this.isInsideMuseum(pos)) {
        this.pushOutRects(pos, this.extraWallRects, radius);
      }

      // Thin stair side guardrails apply inside the building so stairs are entered cleanly at z=-14.2 or z=-6.0
      if (pos.z < -0.5) {
        this.pushOutRects(pos, this.stairRailRects, radius);
      }

      // Floor 2 atrium balustrade railings apply only on upper level and outside the stair climb channel
      if (pos.y > 3.15 && !this.isInStairFootprint(pos.x, pos.z)) {
        this.pushOutRects(pos, this.floor2AtriumRects, radius);
      }

      // Indoor floor-scoped colliders (Exhibits, Creative stations, Director, Hide&Seek pillar)
      if (
        this.indoorWallRects.length > 0 &&
        this.isInsideMuseum(pos) &&
        !this.isInStairFootprint(pos.x, pos.z)
      ) {
        const floor = this.getFloorNumber(pos.y);
        const activeRects = this.indoorWallRects.filter(
          (r) => r.floor === undefined || r.floor === floor
        );
        this.pushOutRects(pos, activeRects, radius);
      }
    }
  }

  isInsideMuseum(pos: THREE.Vector3): boolean {
    return pos.z < -0.2 && Math.abs(pos.x) < 13.0;
  }

  getSurfaceKindAt(pos: THREE.Vector3): SurfaceKind {
    if (this.isInsideMuseum(pos)) {
      return 'marble';
    }
    // Exterior entrance stone steps
    if (Math.abs(pos.x) <= 5.0 && pos.z >= 0 && pos.z <= 3.5) {
      return 'stone';
    }
    // Wide courtyard stone plaza (x: -12..12, z: 3..12)
    if (Math.abs(pos.x) <= 12.0 && pos.z >= 3.0 && pos.z <= 12.0) {
      return 'stone';
    }
    // Sema Stage & Mosque Stone Plaza (-33..-17, z: 15..37)
    if (pos.x >= -33.0 && pos.x <= -17.0 && pos.z >= 15.0 && pos.z <= 37.0) {
      return 'stone';
    }
    // Café terrace & walkway (12..28.5, 2.5..9.5)
    if (pos.x >= 12.0 && pos.x <= 28.5 && pos.z >= 2.5 && pos.z <= 9.5) {
      return 'stone';
    }
    // Main promenade & Hopscotch stone walkway (x: -3.7..3.7, z: 2.5..35.0)
    if (Math.abs(pos.x) <= 3.7 && pos.z >= 2.5 && pos.z <= 35.0) {
      return 'stone';
    }
    // Ping-Pong plaza (-16..-9, 16..23) & Mangala gazebo (9..16, 16..23)
    if (Math.abs(pos.x) >= 9.0 && Math.abs(pos.x) <= 16.0 && pos.z >= 16.0 && pos.z <= 23.0) {
      return 'stone';
    }
    // Ring-toss platform (-26..-18, 3..11)
    if (pos.x >= -26.0 && pos.x <= -18.0 && pos.z >= 3.0 && pos.z <= 11.0) {
      return 'stone';
    }
    // Labyrinth courtyard entrance walkway (12..18, -9..-6)
    if (pos.x >= 12.0 && pos.x <= 18.0 && pos.z >= -9.0 && pos.z <= -6.0) {
      return 'stone';
    }
    // Beştaş plaza (-17..-10.5, 25.2..31.8) & Çelik Çomak plaza (10.5..17.2, 25.2..31.8)
    if (Math.abs(pos.x) >= 3.5 && Math.abs(pos.x) <= 17.2 && pos.z >= 25.2 && pos.z <= 31.8) {
      return 'stone';
    }
    // Topaç plaza (-26.5..-19.5, 13.4..20.2)
    if (pos.x >= -26.5 && pos.x <= -19.5 && pos.z >= 13.4 && pos.z <= 20.2) {
      return 'stone';
    }
    // Misket plaza (18.6..25.4, 11.1..17.9)
    if (pos.x >= 18.6 && pos.x <= 25.4 && pos.z >= 11.1 && pos.z <= 17.9) {
      return 'stone';
    }
    // Karagöz & Hacivat Gölge Oyunu plaza & walkways (17.0..32.0, 17.8..32.6)
    if (pos.x >= 17.0 && pos.x <= 32.0 && pos.z >= 17.8 && pos.z <= 32.6) {
      return 'stone';
    }
    return 'grass';
  }

  getInteractiveMeshes(): THREE.Object3D[] {
    return this.buildingInteractiveMeshes;
  }

  triggerGlobeSpin(): void {
    this.globeSpinBoost = 9.0;
  }

  update(): void {
    const dt = Math.min(xb.getDeltaTime(), 0.05);
    this.time += dt;

    const target = this.doorsTargetOpen ? 1 : 0;
    this.doorOpenAmount = THREE.MathUtils.damp(
      this.doorOpenAmount,
      target,
      6.5,
      dt
    );
    const swingAngle = this.doorOpenAmount * THREE.MathUtils.degToRad(95);
    this.leftDoor.rotation.y = -swingAngle;
    this.rightDoor.rotation.y = swingAngle;

    // Gentle grand chandelier rotation
    this.chandelierGroup.rotation.y = this.time * 0.14;

    if (this.globeMesh && this.globeRingMesh) {
      if (this.globeSpinBoost > 0.01) {
        this.globeSpinBoost = THREE.MathUtils.damp(this.globeSpinBoost, 0, 2.2, dt);
      }
      this.globeMesh.rotation.y += (0.5 + this.globeSpinBoost) * dt;
      this.globeRingMesh.rotation.y -= (0.7 + this.globeSpinBoost * 1.2) * dt;
    }
  }

  dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
