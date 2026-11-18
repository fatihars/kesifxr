import {metin} from "../metinler.ts";
import * as THREE from 'three';
import * as xb from 'xrblocks';

import {
  getAnatolianKilimTexture,
  getIznikTileTexture,
  getTravertineTextures,
  getWalnutWoodTextures,
} from '../utils/anatolianMaterials.ts';
import {MUSEUM_FLOOR_Y} from './MuseumBuilding.ts';

export type StationKind = 'art' | 'puzzle';

export interface NearbyStationInfo {
  type: StationKind;
  label: string;
  position: THREE.Vector3;
}

function createSignPlateTexture(
  icon: string,
  title: string,
  subtitle: string,
  accentHex: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 176;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(8, 8, 624, 160, 26);
    ctx.fill();

    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 7;
    ctx.stroke();

    ctx.fillStyle = accentHex;
    ctx.font = 'bold 54px "Google Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, 68, 88);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px "Google Sans", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, 122, 66);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 22px "Google Sans", Arial, sans-serif';
    ctx.fillText(subtitle, 122, 116);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createDefaultStudentArtTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 512, 384);
    grad.addColorStop(0, '#fffdf7');
    grad.addColorStop(1, '#fef3c7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 384);

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 472, 344);

    // Simple inviting geometric star motif
    ctx.save();
    ctx.translate(256, 168);
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = i % 2 === 0 ? '#0ea5e9' : '#f59e0b';
      ctx.fillRect(-38, -38, 76, 76);
    }
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px "Google Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(metin("CreativeStations", "genc_sanatcilar"), 256, 312);
    ctx.fillStyle = '#b45309';
    ctx.font = '600 18px "Google Sans", Arial, sans-serif';
    ctx.fillText(metin("CreativeStations", "cizim_masasi"), 256, 342);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class CreativeStations extends xb.Script {
  readonly artStationPos = new THREE.Vector3(-3.2, MUSEUM_FLOOR_Y, -3.5);
  readonly puzzleStationPos = new THREE.Vector3(8.1, MUSEUM_FLOOR_Y, -3.8);

  private interactiveMeshes: THREE.Object3D[] = [];
  private puzzleTilesGroup = new THREE.Group();
  private studentArtMat!: THREE.MeshStandardMaterial;
  private customArtTex?: THREE.CanvasTexture;
  private galleryLabelPlaqueMat?: THREE.MeshBasicMaterial;
  private galleryLabelTex?: THREE.CanvasTexture;
  private disposables: Array<{dispose: () => void}> = [];
  private time = 0;
  private isDisposed = false;

  private track<T extends {dispose: () => void}>(item: T): T {
    this.disposables.push(item);
    return item;
  }

  init(): void {
    this.buildArtStudioStation();
    this.buildPuzzleStation();
  }

  private buildArtStudioStation(): void {
    const group = new THREE.Group();
    group.position.copy(this.artStationPos);
    group.rotation.y = 0.42;

    const walnutTex = getWalnutWoodTextures(1.5, 1);
    const travTex = getTravertineTextures(1, 2);
    const iznikTex = getIznikTileTexture('turquoise', 2, 1);
    const kilimCrimson = getAnatolianKilimTexture('crimson');

    const woodMat = this.track(
      new THREE.MeshStandardMaterial({
        map: walnutTex.map,
        bumpMap: walnutTex.bumpMap,
        bumpScale: 0.01,
        roughness: 0.65,
      })
    );
    const goldMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.82,
        roughness: 0.24,
      })
    );
    const stoneMat = this.track(
      new THREE.MeshStandardMaterial({
        map: travTex.map,
        bumpMap: travTex.bumpMap,
        bumpScale: 0.014,
        roughness: 0.72,
      })
    );
    const iznikMat = this.track(
      new THREE.MeshStandardMaterial({map: iznikTex, roughness: 0.34})
    );

    // Anatolian Kilim Circular Studio Carpet
    const rug = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(1.38, 1.44, 0.05, 28)),
      this.track(
        new THREE.MeshStandardMaterial({map: kilimCrimson, roughness: 0.88})
      )
    );
    rug.position.y = 0.025;
    rug.receiveShadow = true;

    // Craft table with walnut slab & brass trim legs
    const tableTop = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(1.38, 0.08, 0.84)),
      woodMat
    );
    tableTop.position.set(-0.35, 0.82, 0);
    tableTop.castShadow = true;
    tableTop.userData.stationType = 'art';

    const legGeo = this.track(new THREE.CylinderGeometry(0.042, 0.036, 0.82, 10));
    [
      [-0.92, -0.32],
      [0.22, -0.32],
      [-0.92, 0.32],
      [0.22, 0.32],
    ].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, woodMat);
      leg.position.set(lx, 0.41, lz);
      const foot = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.045, 0.05, 0.07, 10)),
        goldMat
      );
      foot.position.set(lx, 0.06, lz);
      group.add(leg, foot);
    });

    // Easel & canvas with 3-legged wooden A-frame structure
    const easel = new THREE.Group();
    easel.position.set(-0.35, 0.86, -0.1);
    easel.rotation.x = -0.18;

    const strutGeo = this.track(new THREE.BoxGeometry(0.055, 0.96, 0.045));
    const leftLeg = new THREE.Mesh(strutGeo, woodMat);
    leftLeg.position.set(-0.28, 0.46, -0.04);
    leftLeg.rotation.z = -0.14;
    const rightLeg = new THREE.Mesh(strutGeo, woodMat);
    rightLeg.position.set(0.28, 0.46, -0.04);
    rightLeg.rotation.z = 0.14;
    const rearStrut = new THREE.Mesh(strutGeo, woodMat);
    rearStrut.position.set(0, 0.44, -0.2);
    rearStrut.rotation.x = 0.36;
    easel.add(leftLeg, rightLeg, rearStrut);

    const defaultArtTex = this.track(createDefaultStudentArtTexture());
    this.studentArtMat = this.track(
      new THREE.MeshStandardMaterial({
        map: defaultArtTex,
        roughness: 0.36,
      })
    );

    const frameBack = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(1.06, 0.82, 0.06)),
      goldMat
    );
    frameBack.position.y = 0.48;
    frameBack.castShadow = true;
    frameBack.userData.stationType = 'art';

    const canvasFace = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(0.94, 0.7)),
      this.studentArtMat
    );
    canvasFace.position.set(0, 0.48, 0.036);
    canvasFace.userData.stationType = 'art';
    easel.add(frameBack, canvasFace);

    // Ceramic Paint Pots, Wooden Mixing Palette & Brushes on Desk
    const potGeo = this.track(new THREE.CylinderGeometry(0.055, 0.055, 0.09, 12));
    [0xdc2626, 0xfbbf24, 0x0284c7, 0x16a34a].forEach((c, idx) => {
      const pot = new THREE.Mesh(
        potGeo,
        this.track(new THREE.MeshStandardMaterial({color: c, roughness: 0.32}))
      );
      pot.position.set(-0.78 + idx * 0.16, 0.9, 0.24);
      pot.userData.stationType = 'art';
      group.add(pot);
    });
    const paletteDisc = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.14, 0.14, 0.018, 16)),
      woodMat
    );
    paletteDisc.position.set(0.06, 0.87, 0.2);
    const brushShaft = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.01, 0.008, 0.24, 8)),
      goldMat
    );
    brushShaft.rotation.z = Math.PI / 2;
    brushShaft.rotation.y = 0.42;
    brushShaft.position.set(0.05, 0.89, 0.24);
    group.add(paletteDisc, brushShaft);

    // Adjacent Standing "Genç Sanatçı Eseri" Gallery Showcase on Travertine Pedestal
    const standPillar = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.12, 0.15, 1.05, 8)),
      stoneMat
    );
    standPillar.position.set(0.78, 0.525, -0.12);
    standPillar.castShadow = true;

    const standCollar = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 8)),
      iznikMat
    );
    standCollar.position.set(0.78, 1.02, -0.12);

    const showcaseFrame = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(1.12, 0.88, 0.08)),
      goldMat
    );
    showcaseFrame.position.set(0.78, 1.48, -0.12);
    showcaseFrame.castShadow = true;
    showcaseFrame.userData.stationType = 'art';

    const showcaseCanvas = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(0.98, 0.74)),
      this.studentArtMat
    );
    showcaseCanvas.position.set(0.78, 1.48, -0.075);
    showcaseCanvas.userData.stationType = 'art';

    this.galleryLabelTex = this.track(
      createSignPlateTexture(
        '🎨',
        metin("CreativeStations", "eser_olustur"),
        metin("CreativeStations", "ciz_boya_muzeye_sergile"),
        '#f472b6'
      )
    );
    this.galleryLabelPlaqueMat = this.track(
      new THREE.MeshBasicMaterial({map: this.galleryLabelTex})
    );
    const signMesh = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(1.5, 0.42)),
      this.galleryLabelPlaqueMat
    );
    signMesh.position.set(0.15, 2.28, 0);
    signMesh.userData.stationType = 'art';

    group.add(
      rug,
      tableTop,
      easel,
      standPillar,
      standCollar,
      showcaseFrame,
      showcaseCanvas,
      signMesh
    );
    this.add(group);
    this.interactiveMeshes.push(
      tableTop,
      frameBack,
      canvasFace,
      showcaseFrame,
      showcaseCanvas,
      signMesh
    );
  }

  private buildPuzzleStation(): void {
    const group = new THREE.Group();
    group.position.copy(this.puzzleStationPos);
    group.rotation.y = -0.45;

    const kilimTurquoise = getAnatolianKilimTexture('turquoise');
    const walnutTex = getWalnutWoodTextures(1.5, 1);
    const travTex = getTravertineTextures(1, 2);
    const iznikTex = getIznikTileTexture('cobalt', 2, 1);

    const rug = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(1.3, 1.36, 0.05, 28)),
      this.track(
        new THREE.MeshStandardMaterial({map: kilimTurquoise, roughness: 0.88})
      )
    );
    rug.position.y = 0.025;
    rug.receiveShadow = true;

    const woodMat = this.track(
      new THREE.MeshStandardMaterial({
        map: walnutTex.map,
        bumpMap: walnutTex.bumpMap,
        bumpScale: 0.01,
        roughness: 0.6,
      })
    );
    const stoneMat = this.track(
      new THREE.MeshStandardMaterial({
        map: travTex.map,
        bumpMap: travTex.bumpMap,
        bumpScale: 0.014,
        roughness: 0.72,
      })
    );
    const iznikMat = this.track(
      new THREE.MeshStandardMaterial({map: iznikTex, roughness: 0.34})
    );
    const goldMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.82,
        roughness: 0.24,
      })
    );

    const pedestal = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.45, 0.56, 0.82, 8)),
      stoneMat
    );
    pedestal.position.y = 0.41;
    pedestal.castShadow = true;
    pedestal.userData.stationType = 'puzzle';

    const collar = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.5, 0.5, 0.14, 8)),
      iznikMat
    );
    collar.position.y = 0.72;

    const tableTop = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(1.38, 0.1, 1.15)),
      woodMat
    );
    tableTop.position.y = 0.86;
    tableTop.castShadow = true;
    tableTop.userData.stationType = 'puzzle';

    const rim = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(1.46, 0.05, 1.23)),
      goldMat
    );
    rim.position.y = 0.82;

    // Floating rotating 3D puzzle tiles above table
    this.puzzleTilesGroup.position.set(0, 1.34, 0);
    const tileColors = [0x38bdf8, 0xfbbf24, 0xf43f5e, 0x34d399];
    const tileGeo = this.track(new THREE.BoxGeometry(0.32, 0.32, 0.08));

    [
      [-0.22, 0.22],
      [0.22, 0.22],
      [-0.22, -0.22],
      [0.22, -0.22],
    ].forEach(([tx, ty], idx) => {
      const tile = new THREE.Mesh(
        tileGeo,
        this.track(
          new THREE.MeshStandardMaterial({
            color: tileColors[idx],
            roughness: 0.28,
            metalness: 0.22,
          })
        )
      );
      tile.position.set(tx, ty, (idx % 2 === 0 ? 1 : -1) * 0.04);
      tile.castShadow = true;
      tile.userData.stationType = 'puzzle';
      this.puzzleTilesGroup.add(tile);
      this.interactiveMeshes.push(tile);
    });

    const signTex = this.track(
      createSignPlateTexture(
        '🧩',
        metin("CreativeStations", "eser_puzzle_alani"),
        metin("CreativeStations", "parcalari_birlestir_kesfet"),
        '#38bdf8'
      )
    );
    const signMesh = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(1.5, 0.42)),
      this.track(new THREE.MeshBasicMaterial({map: signTex}))
    );
    signMesh.position.set(0, 2.26, 0);
    signMesh.userData.stationType = 'puzzle';

    group.add(
      rug,
      pedestal,
      collar,
      tableTop,
      rim,
      this.puzzleTilesGroup,
      signMesh
    );
    this.add(group);
    this.interactiveMeshes.push(pedestal, tableTop, signMesh);
  }

  setCustomArtworkDataUrl(dataUrl: string, title: string): void {
    const img = new Image();
    img.onload = () => {
      if (this.isDisposed) return;
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 384;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height - 38);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, canvas.height - 38, canvas.width, 38);
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 20px "Google Sans", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(metin("CreativeStations", "genc_sanatci_1", title.slice(0, 34)), 256, canvas.height - 19);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      this.customArtTex?.dispose();
      this.customArtTex = tex;
      this.studentArtMat.map = tex;
      this.studentArtMat.needsUpdate = true;
    };
    img.src = dataUrl;
  }

  getInteractiveMeshes(): THREE.Object3D[] {
    return this.interactiveMeshes;
  }

  findNearestStation(playerPos: THREE.Vector3): NearbyStationInfo | null {
    if (Math.abs(playerPos.y - MUSEUM_FLOOR_Y) > 1.6) return null;

    const artDist = Math.hypot(
      playerPos.x - this.artStationPos.x,
      playerPos.z - this.artStationPos.z
    );
    if (artDist < 2.8) {
      return {
        type: 'art',
        label: metin("CreativeStations", "eser_olusturma_atolyesi"),
        position: this.artStationPos,
      };
    }

    const puzDist = Math.hypot(
      playerPos.x - this.puzzleStationPos.x,
      playerPos.z - this.puzzleStationPos.z
    );
    if (puzDist < 2.8) {
      return {
        type: 'puzzle',
        label: metin("CreativeStations", "eser_puzzle_masasi"),
        position: this.puzzleStationPos,
      };
    }

    return null;
  }

  update(): void {
    const dt = Math.min(xb.getDeltaTime(), 0.05);
    this.time += dt;
    this.puzzleTilesGroup.rotation.y = Math.sin(this.time * 0.85) * 0.32;
    this.puzzleTilesGroup.position.y = 1.34 + Math.sin(this.time * 2.1) * 0.05;
  }

  dispose(): void {
    this.isDisposed = true;
    this.customArtTex?.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
