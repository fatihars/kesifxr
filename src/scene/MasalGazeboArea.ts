import {metin} from "../metinler.ts";
import * as THREE from 'three';
import * as xb from 'xrblocks';

import {
  createAnatolianColumn,
  createRibbedDome,
  createSeljukStarGeometry,
  getIznikTileTexture,
  getLeadDomeTexture,
  getMarbleInlayTexture,
  getTravertineTextures,
  getWalnutWoodTextures,
} from '../utils/anatolianMaterials.ts';
import {DEVICE_QUALITY} from '../utils/deviceQuality.ts';
import {
  type CharacterStyleId,
  ExplorerCharacter,
} from './ExplorerCharacter.ts';
import type {WallRect} from './MuseumBuilding.ts';
import type {SemaSeatInfo} from './SemaAndMosqueArea.ts';
import {ShadowCurtainCanvas} from './StoryShadowTheater.ts';

export const MASAL_ORIGIN = new THREE.Vector3(-36.5, 0, 7.0);

interface ChildListener {
  char: ExplorerCharacter;
  bubbleSprite?: THREE.Sprite;
  bubbleMat?: THREE.SpriteMaterial;
  bubbleTex?: THREE.CanvasTexture;
  bubbleTimer: number;
  bubblePhase: 'hidden' | 'showing';
  nodPhase: number;
}

const CHILD_REACTIONS = [
  metin("MasalGazeboArea", "ninecigim_keloglan_dereyi_nasil_buldu"),
  metin("MasalGazeboArea", "bilge_kaplumbaga_ile_karinca_cok_tatli"),
  metin("MasalGazeboArea", "golge_perdesindeki_leylek_kanat_cirpiyor"),
  metin("MasalGazeboArea", "ocak_basinda_masal_dinlemek_sicacik"),
  metin("MasalGazeboArea", "yildizli_gokyuzu_ve_kilimler_cok_guzel"),
];

function createKilimPatternTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Koyu lacivert zemin
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 512);

    // Bakır & kehribar dış bordürler
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 20;
    ctx.strokeRect(18, 18, 476, 476);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.strokeRect(38, 38, 436, 436);

    // Krem iç çerçeve
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 4;
    ctx.strokeRect(52, 52, 408, 408);

    // Geleneksel Anadolu elibelinde / baklava motifleri
    const motifRows = [128, 256, 384];
    const motifCols = [148, 256, 364];
    for (let r = 0; r < motifRows.length; r++) {
      for (let c = 0; c < motifCols.length; c++) {
        const cx = motifCols[c];
        const cy = motifRows[r];
        ctx.fillStyle = (r + c) % 2 === 0 ? '#b45309' : '#1e293b';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 42);
        ctx.lineTo(cx + 42, cy);
        ctx.lineTo(cx, cy + 42);
        ctx.lineTo(cx - 42, cy);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 18);
        ctx.lineTo(cx + 18, cy);
        ctx.lineTo(cx, cy + 18);
        ctx.lineTo(cx - 18, cy);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Kenar zikzak su motifleri
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    for (let y = 76; y <= 436; y += 36) {
      ctx.beginPath();
      ctx.moveTo(64, y);
      ctx.lineTo(80, y + 18);
      ctx.lineTo(64, y + 36);
      ctx.moveTo(448, y);
      ctx.lineTo(432, y + 18);
      ctx.lineTo(448, y + 36);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createStarryNightWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, 512);
    sky.addColorStop(0, '#070b1a');
    sky.addColorStop(0.55, '#0f172a');
    sky.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1024, 512);

    // Sakin hilal ay
    ctx.save();
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(165, 112, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0c1326';
    ctx.beginPath();
    ctx.arc(182, 102, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Yumuşak parlayan yıldızlar
    for (let i = 0; i < 64; i++) {
      const sx = ((i * 157 + 41) % 960) + 32;
      const sy = ((i * 89 + 23) % 340) + 24;
      const r = i % 7 === 0 ? 3.5 : i % 3 === 0 ? 2.2 : 1.4;
      ctx.fillStyle = i % 5 === 0 ? '#fde68a' : '#fef9c3';
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Uzak Anadolu dağ silueti
    ctx.fillStyle = '#090e1c';
    ctx.beginPath();
    ctx.moveTo(0, 512);
    ctx.lineTo(0, 415);
    ctx.lineTo(180, 345);
    ctx.lineTo(360, 405);
    ctx.lineTo(540, 325);
    ctx.lineTo(750, 398);
    ctx.lineTo(920, 352);
    ctx.lineTo(1024, 410);
    ctx.lineTo(1024, 512);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBannerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1024, 192);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 1004, 172);
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, 984, 152);

    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 44px "Google Sans", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(metin("MasalGazeboArea", "masal_kosku"), 512, 72);

    ctx.fillStyle = '#fbbf24';
    ctx.font = '600 26px "Google Sans", Arial, sans-serif';
    ctx.fillText(
      metin("MasalGazeboArea", "keloglan"),
      512,
      132
    );
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createListenerBubbleTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 104;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 480, 104);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 460, 76, 22);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 21px "Google Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 240, 48, 430);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class MasalGazeboArea extends xb.Script {
  private disposables: Array<{dispose: () => void}> = [];
  private interactiveMeshes: THREE.Object3D[] = [];
  private wallRects: WallRect[] = [];

  private shadowCurtain = new ShadowCurtainCanvas();
  private listeners: ChildListener[] = [];
  private playerSeat!: SemaSeatInfo;

  private nineHead = new THREE.Group();
  private nineLeftArm = new THREE.Group();
  private nineRightArm = new THREE.Group();
  private hearthLight!: THREE.PointLight;
  private hearthFlames: THREE.Mesh[] = [];
  private lanternLights: THREE.PointLight[] = [];
  private backlightMat!: THREE.MeshBasicMaterial;
  private elapsed = 0;

  private track<T extends {dispose: () => void}>(item: T): T {
    this.disposables.push(item);
    return item;
  }

  init(): void {
    this.disposables.push(this.shadowCurtain);

    const root = new THREE.Group();
    root.position.copy(MASAL_ORIGIN);

    // Materials in requested palette: kehribar, bakır, koyu lacivert, krem + authentic Anatolian textures
    const marbleTex = getMarbleInlayTexture(3, 3);
    const walnutTex = getWalnutWoodTextures(1, 2);
    const iznikTex = getIznikTileTexture('turquoise', 4, 1);
    const leadTex = getLeadDomeTexture(8, 2);
    const travTex = getTravertineTextures(2, 2);

    const creamStoneMat = this.track(
      new THREE.MeshStandardMaterial({map: marbleTex, roughness: 0.42})
    );
    const travertineMat = this.track(
      new THREE.MeshStandardMaterial({
        map: travTex.map,
        bumpMap: travTex.bumpMap,
        bumpScale: 0.015,
        roughness: 0.78,
      })
    );
    const cedarMat = this.track(
      new THREE.MeshStandardMaterial({
        map: walnutTex.map,
        bumpMap: walnutTex.bumpMap,
        bumpScale: 0.012,
        roughness: 0.62,
      })
    );
    const iznikMat = this.track(
      new THREE.MeshStandardMaterial({map: iznikTex, roughness: 0.34})
    );
    const copperMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xb45309,
        metalness: 0.72,
        roughness: 0.28,
      })
    );
    const amberMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.55,
        roughness: 0.3,
      })
    );
    const navyMat = this.track(
      new THREE.MeshStandardMaterial({color: 0x0f172a, roughness: 0.78})
    );
    const navyDomeMat = this.track(
      new THREE.MeshStandardMaterial({
        map: leadTex,
        color: 0x1e293b,
        metalness: 0.35,
        roughness: 0.45,
      })
    );
    const carpetMat = this.track(
      new THREE.MeshStandardMaterial({
        map: this.track(createKilimPatternTexture()),
        roughness: 0.88,
      })
    );
    const starrySkyMat = this.track(
      new THREE.MeshBasicMaterial({
        map: this.track(createStarryNightWallTexture()),
      })
    );

    // 1. Low octagonal Marmara marble gazebo platform + İznik turquoise riser band
    const dais = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(4.4, 4.55, 0.08, 8)),
      creamStoneMat
    );
    dais.position.set(0, 0.04, 0);
    dais.receiveShadow = true;
    dais.name = 'walkable-ground';
    root.add(dais);

    const daisIznikRim = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(4.46, 4.6, 0.05, 8)),
      iznikMat
    );
    daisIznikRim.position.set(0, 0.025, 0);
    root.add(daisIznikRim);

    const kilimRug = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(2.75, 2.75, 0.025, 24)),
      carpetMat
    );
    kilimRug.position.set(0.25, 0.09, 0);
    kilimRug.receiveShadow = true;
    kilimRug.name = 'walkable-ground';
    root.add(kilimRug);

    // 2. 6 Fluted Walnut & Brass Kamelya Columns + Ribbed Ottoman Sapphire Dome
    const ringRadius = 3.85;
    for (let i = 0; i < 6; i++) {
      // Angles chosen so front +X opening stays completely wide & welcoming
      const angle = ((i + 0.5) / 6) * Math.PI * 2;
      const px = Math.cos(angle) * ringRadius;
      const pz = Math.sin(angle) * ringRadius;

      const col = createAnatolianColumn(
        (item) => this.track(item),
        0.13,
        3.78,
        cedarMat,
        amberMat,
        copperMat
      );
      col.position.set(px, 0.08, pz);
      root.add(col);

      if (i % 2 === 0) {
        const lMat = this.track(
          new THREE.MeshStandardMaterial({
            color: 0xfef3c7,
            emissive: 0xf59e0b,
            emissiveIntensity: 0.75,
            roughness: 0.3,
          })
        );
        const lantern = new THREE.Mesh(
          this.track(new THREE.CylinderGeometry(0.11, 0.08, 0.24, 6)),
          lMat
        );
        lantern.position.set(px * 0.9, 3.38, pz * 0.9);
        const lanternCap = new THREE.Mesh(
          this.track(new THREE.ConeGeometry(0.14, 0.12, 6)),
          copperMat
        );
        lanternCap.position.set(px * 0.9, 3.55, pz * 0.9);
        root.add(lantern, lanternCap);

        if (!DEVICE_QUALITY.simplifiedLighting) {
          const pt = new THREE.PointLight(0xfbbf24, 0.9, 9, 1.6);
          pt.position.set(px * 0.85, 3.25, pz * 0.85);
          root.add(pt);
          this.lanternLights.push(pt);
        }
      }
    }

    const roofRim = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(4.35, 4.5, 0.24, 8)),
      copperMat
    );
    roofRim.position.set(0, 3.9, 0);
    roofRim.castShadow = true;

    const domeCupola = createRibbedDome(
      (item) => this.track(item),
      4.1,
      0.54,
      navyDomeMat,
      copperMat,
      amberMat,
      {ribCount: 16, alemScale: 0.72}
    );
    domeCupola.position.set(0, 4.02, 0);
    root.add(roofRim, domeCupola);

    // Front Kamelya Signboard facing +X courtyard
    const bannerTex = this.track(createBannerTexture());
    const banner = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(4.4, 0.84)),
      this.track(
        new THREE.MeshBasicMaterial({map: bannerTex, side: THREE.DoubleSide})
      )
    );
    banner.position.set(3.48, 3.48, 0);
    banner.rotation.y = Math.PI / 2;
    banner.userData.masalAction = 'theater';
    this.interactiveMeshes.push(banner);

    const bannerBacking = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.08, 0.94, 4.56)),
      copperMat
    );
    bannerBacking.position.set(3.42, 3.48, 0);
    root.add(bannerBacking, banner);

    // 3. Calm Starry Night Sky + Traditional Kilim Wall Alcove (at back local x = -3.05)
    const starryWall = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(5.6, 2.9)),
      starrySkyMat
    );
    starryWall.position.set(-3.08, 1.95, 0);
    starryWall.rotation.y = Math.PI / 2;

    const wallBacking = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.18, 3.2, 6.2)),
      navyMat
    );
    wallBacking.position.set(-3.2, 1.85, 0);
    wallBacking.castShadow = true;
    root.add(wallBacking, starryWall);

    // Flanking Kilim Wall Tapestries + 8-pointed Seljuk Star Medallions
    const kilimGeo = this.track(new THREE.BoxGeometry(0.08, 2.05, 1.18));
    const starGeo = this.track(createSeljukStarGeometry(0.24, 0.14, 0.04));
    [-2.35, 2.35].forEach((kz) => {
      const tapestry = new THREE.Mesh(kilimGeo, carpetMat);
      tapestry.position.set(-3.02, 1.65, kz);
      const copperRod = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.035, 0.035, 1.32, 8)),
        amberMat
      );
      copperRod.rotation.x = Math.PI / 2;
      copperRod.position.set(-2.98, 2.72, kz);
      const star = new THREE.Mesh(starGeo, amberMat);
      star.rotation.y = Math.PI / 2;
      star.position.set(-2.98, 3.04, kz);
      root.add(tapestry, copperRod, star);
    });

    // 4. Backlit GÖLGE PERDESİ (Translucent Cream Curtain with Pure Inline-SVG Silhouettes)
    const screenFrame = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.16, 2.02, 3.55)),
      cedarMat
    );
    screenFrame.position.set(-2.82, 1.82, 0.12);
    screenFrame.castShadow = true;

    this.backlightMat = this.track(
      new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.28,
      })
    );
    const backlightHalo = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(3.45, 1.9)),
      this.backlightMat
    );
    backlightHalo.position.set(-2.89, 1.82, 0.12);
    backlightHalo.rotation.y = Math.PI / 2;

    const screenPlane = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(3.26, 1.72)),
      this.track(
        new THREE.MeshBasicMaterial({
          map: this.shadowCurtain.texture,
          transparent: true,
          opacity: 0.96,
          side: THREE.DoubleSide,
        })
      )
    );
    screenPlane.position.set(-2.72, 1.82, 0.12);
    screenPlane.rotation.y = Math.PI / 2;
    screenPlane.userData.masalAction = 'theater';
    this.interactiveMeshes.push(screenPlane);

    const screenStandL = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.14, 0.88, 0.14)),
      copperMat
    );
    screenStandL.position.set(-2.82, 0.44, -1.52);
    const screenStandR = screenStandL.clone();
    screenStandR.position.z = 1.76;

    root.add(screenFrame, backlightHalo, screenPlane, screenStandL, screenStandR);

    // 5. Ocak (Traditional Travertine Ashlar & Copper Hearth + Hanging Tea Kettle)
    this.buildOcakHearth(root, travertineMat, copperMat, cedarMat, navyMat);

    // 6. Cute Stylized Nine Avatar sitting on central embroidered cushion at (-1.45, 0.08, 0.15)
    this.buildStylizedNine(root, creamStoneMat, copperMat, amberMat, navyMat);

    // 7. Circle of Minders + 5 Seated Child Listeners + 1 Open Player Cushion
    this.buildCushionCircle(root, copperMat, amberMat, navyMat, creamStoneMat);

    this.add(root);

    // Colliders only on rear Kilim/Screen wall & Ocak so player freely steps onto dais and sits!
    this.wallRects.push(
      {
        minX: MASAL_ORIGIN.x - 3.65,
        maxX: MASAL_ORIGIN.x - 2.38,
        minZ: MASAL_ORIGIN.z - 3.3,
        maxZ: MASAL_ORIGIN.z + 3.3,
      },
      {
        minX: MASAL_ORIGIN.x - 2.6,
        maxX: MASAL_ORIGIN.x - 1.45,
        minZ: MASAL_ORIGIN.z - 2.75,
        maxZ: MASAL_ORIGIN.z - 1.4,
      }
    );
  }

  private buildOcakHearth(
    root: THREE.Group,
    creamStoneMat: THREE.MeshStandardMaterial,
    copperMat: THREE.MeshStandardMaterial,
    cedarMat: THREE.MeshStandardMaterial,
    navyMat: THREE.MeshStandardMaterial
  ): void {
    const ocak = new THREE.Group();
    ocak.position.set(-2.05, 0.08, -2.05);
    ocak.rotation.y = Math.PI * 0.25; // Facing inward toward the circle

    const hearthPlinth = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(1.18, 0.24, 0.96)),
      creamStoneMat
    );
    hearthPlinth.position.set(0, 0.12, 0);
    hearthPlinth.receiveShadow = true;

    const backWall = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(1.1, 1.35, 0.24)),
      creamStoneMat
    );
    backWall.position.set(0, 0.85, -0.32);

    const cheekL = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.2, 1.15, 0.65)),
      creamStoneMat
    );
    cheekL.position.set(-0.46, 0.72, -0.05);
    const cheekR = cheekL.clone();
    cheekR.position.x = 0.46;

    // Bakır Davlumbaz (Copper Hood)
    const hood = new THREE.Mesh(
      this.track(new THREE.ConeGeometry(0.76, 1.05, 4)),
      copperMat
    );
    hood.rotation.y = Math.PI / 4;
    hood.position.set(0, 1.85, -0.1);

    const chimney = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.18, 0.22, 1.35, 10)),
      navyMat
    );
    chimney.position.set(0, 2.9, -0.18);

    // Logs & warm glowing embers
    const logGeo = this.track(new THREE.CylinderGeometry(0.06, 0.065, 0.56, 8));
    [-0.08, 0.08].forEach((lz, i) => {
      const log = new THREE.Mesh(logGeo, cedarMat);
      log.rotation.z = Math.PI / 2 + (i === 0 ? 0.14 : -0.12);
      log.rotation.y = i === 0 ? 0.25 : -0.3;
      log.position.set(0, 0.29, lz);
      ocak.add(log);
    });

    const ember = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(0.2, 12, 8)),
      this.track(
        new THREE.MeshBasicMaterial({color: 0xf97316, transparent: true, opacity: 0.75})
      )
    );
    ember.scale.set(1.2, 0.35, 0.9);
    ember.position.set(0, 0.26, 0.02);

    // 3 soft layered flame cones (animated gently via sine waves)
    const flameColors = [0xf59e0b, 0xfb923c, 0xfef08a];
    flameColors.forEach((col, idx) => {
      const fMesh = new THREE.Mesh(
        this.track(new THREE.ConeGeometry(0.14 - idx * 0.032, 0.42 - idx * 0.06, 10)),
        this.track(
          new THREE.MeshBasicMaterial({
            color: col,
            transparent: true,
            opacity: 0.82 - idx * 0.12,
          })
        )
      );
      fMesh.position.set((idx - 1) * 0.05, 0.44 + idx * 0.03, 0.02);
      ocak.add(fMesh);
      this.hearthFlames.push(fMesh);
    });

    this.hearthLight = new THREE.PointLight(0xff8c24, 1.9, 8.5, 1.5);
    this.hearthLight.position.set(0, 0.78, 0.26);
    ocak.add(this.hearthLight);

    [hearthPlinth, backWall, cheekL, cheekR, hood, chimney].forEach((m) => {
      m.userData.masalAction = 'theater';
      this.interactiveMeshes.push(m);
    });

    ocak.add(hearthPlinth, backWall, cheekL, cheekR, hood, chimney, ember);
    root.add(ocak);
  }

  private buildStylizedNine(
    root: THREE.Group,
    creamMat: THREE.MeshStandardMaterial,
    copperMat: THREE.MeshStandardMaterial,
    amberMat: THREE.MeshStandardMaterial,
    navyMat: THREE.MeshStandardMaterial
  ): void {
    // Stylized, cute (non-realistic) grandma sitting on a plush centerpiece minder
    const nineGroup = new THREE.Group();
    nineGroup.position.set(-1.35, 0.08, 0.18);
    nineGroup.rotation.y = Math.PI / 2; // Local +Z faces +X courtyard & listeners

    const skinMat = this.track(
      new THREE.MeshStandardMaterial({color: 0xfad7b8, roughness: 0.68})
    );
    const blushMat = this.track(
      new THREE.MeshStandardMaterial({color: 0xfb7185, roughness: 0.6})
    );
    const silverHairMat = this.track(
      new THREE.MeshStandardMaterial({color: 0xe2e8f0, roughness: 0.55})
    );
    const eyeMat = this.track(
      new THREE.MeshStandardMaterial({color: 0x0f172a, roughness: 0.3})
    );

    // Center embroidered minder under Nine
    const nineCushion = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.54, 0.58, 0.18, 20)),
      copperMat
    );
    nineCushion.position.y = 0.09;
    nineCushion.castShadow = true;
    const cushionTrim = new THREE.Mesh(
      this.track(new THREE.TorusGeometry(0.53, 0.03, 8, 24)),
      amberMat
    );
    cushionTrim.rotation.x = Math.PI / 2;
    cushionTrim.position.y = 0.16;

    // Cross-legged cozy skirt
    const skirt = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.28, 0.44, 0.34, 16)),
      navyMat
    );
    skirt.position.y = 0.34;
    skirt.castShadow = true;

    // Traditional quilted Bakır cardigan vest over Krem blouse
    const torso = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.22, 0.27, 0.42, 14)),
      creamMat
    );
    torso.position.y = 0.64;

    const vest = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.24, 0.285, 0.36, 14, 1, true)),
      copperMat
    );
    vest.position.y = 0.63;

    const shawl = new THREE.Mesh(
      this.track(new THREE.TorusGeometry(0.22, 0.055, 8, 18)),
      amberMat
    );
    shawl.rotation.x = Math.PI / 2;
    shawl.position.y = 0.81;

    // Head with gentle nodding animation
    this.nineHead.position.set(0, 0.99, 0.02);

    const skull = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(0.21, 18, 16)),
      skinMat
    );
    const bun = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(0.11, 12, 10)),
      silverHairMat
    );
    bun.position.set(0, 0.06, -0.2);

    // Cream embroidered yazma headscarf framing head
    const yazma = new THREE.Mesh(
      this.track(
        new THREE.SphereGeometry(0.225, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.66)
      ),
      creamMat
    );
    yazma.rotation.x = -0.38;
    yazma.position.set(0, 0.03, -0.02);

    const yazmaTrim = new THREE.Mesh(
      this.track(new THREE.TorusGeometry(0.215, 0.018, 6, 20)),
      amberMat
    );
    yazmaTrim.rotation.x = 1.18;
    yazmaTrim.position.set(0, 0.05, 0.02);

    // Cute round brass spectacles, bright eyes & rosy cheeks
    [-0.075, 0.075].forEach((ex) => {
      const eye = new THREE.Mesh(
        this.track(new THREE.SphereGeometry(0.024, 8, 8)),
        eyeMat
      );
      eye.position.set(ex, 0.02, 0.19);
      const rim = new THREE.Mesh(
        this.track(new THREE.TorusGeometry(0.045, 0.008, 6, 14)),
        amberMat
      );
      rim.position.set(ex, 0.02, 0.2);
      const cheek = new THREE.Mesh(
        this.track(new THREE.SphereGeometry(0.032, 8, 8)),
        blushMat
      );
      cheek.scale.set(1.2, 0.75, 0.5);
      cheek.position.set(ex * 1.45, -0.04, 0.178);
      this.nineHead.add(eye, rim, cheek);
    });
    const nose = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(0.03, 8, 8)),
      skinMat
    );
    nose.position.set(0, -0.01, 0.215);
    const glassesBridge = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.05, 0.012, 0.012)),
      amberMat
    );
    glassesBridge.position.set(0, 0.025, 0.205);
    this.nineHead.add(skull, bun, yazma, yazmaTrim, nose, glassesBridge);

    // Storytelling animated arms + tiny tale book in left hand
    const armGeo = this.track(new THREE.CylinderGeometry(0.055, 0.048, 0.34, 10));
    const handGeo = this.track(new THREE.SphereGeometry(0.052, 8, 8));

    this.nineLeftArm.position.set(-0.26, 0.74, 0.04);
    const lUpper = new THREE.Mesh(armGeo, copperMat);
    lUpper.position.set(0, -0.14, 0.06);
    lUpper.rotation.x = -0.6;
    const lHand = new THREE.Mesh(handGeo, skinMat);
    lHand.position.set(0, -0.24, 0.2);
    const storyBook = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.22, 0.045, 0.16)),
      amberMat
    );
    storyBook.position.set(0.04, -0.22, 0.25);
    storyBook.rotation.x = 0.22;
    this.nineLeftArm.add(lUpper, lHand, storyBook);

    this.nineRightArm.position.set(0.26, 0.74, 0.04);
    const rUpper = new THREE.Mesh(armGeo, copperMat);
    rUpper.position.set(0, -0.14, 0.06);
    rUpper.rotation.x = -0.75;
    const rHand = new THREE.Mesh(handGeo, skinMat);
    rHand.position.set(0, -0.22, 0.22);
    this.nineRightArm.add(rUpper, rHand);

    nineGroup.add(
      nineCushion,
      cushionTrim,
      skirt,
      torso,
      vest,
      shawl,
      this.nineHead,
      this.nineLeftArm,
      this.nineRightArm
    );

    nineGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.userData.masalAction = 'theater';
        this.interactiveMeshes.push(obj);
      }
    });

    root.add(nineGroup);
  }

  private buildCushionCircle(
    root: THREE.Group,
    copperMat: THREE.MeshStandardMaterial,
    amberMat: THREE.MeshStandardMaterial,
    navyMat: THREE.MeshStandardMaterial,
    creamMat: THREE.MeshStandardMaterial
  ): void {
    const cushionMats = [amberMat, copperMat, navyMat, copperMat, amberMat];
    const cushionGeo = this.track(new THREE.CylinderGeometry(0.42, 0.45, 0.16, 18));
    const cushionRimGeo = this.track(new THREE.TorusGeometry(0.41, 0.024, 8, 22));

    // Arc centered around Nine (-1.35, 0.18), facing inward toward Nine & Gölge Perdesi
    const centerLocal = new THREE.Vector2(-1.4, 0.15);
    const radius = 2.05;
    const arcAngles = [-1.08, -0.62, -0.18, 0.24, 0.66, 1.08]; // slot 2 is open front-center player seat!

    const childSpecs: Array<{style: CharacterStyleId; variant: number}> = [
      {style: 'kadin', variant: 0},
      {style: 'erkek', variant: 1},
      {style: 'kadin', variant: 2},
      {style: 'erkek', variant: 3},
      {style: 'kadin', variant: 1},
    ];
    let childIdx = 0;

    arcAngles.forEach((ang, slotIdx) => {
      const lx = centerLocal.x + Math.cos(ang) * radius;
      const lz = centerLocal.y + Math.sin(ang) * radius;
      const dx = -2.2 - lx;
      const dz = 0.14 - lz;
      const faceYaw = Math.atan2(-dx, -dz);

      const isPlayerSlot = slotIdx === 2;
      const minder = new THREE.Mesh(
        cushionGeo,
        isPlayerSlot ? amberMat : cushionMats[slotIdx % cushionMats.length]
      );
      minder.position.set(lx, 0.14, lz);
      minder.castShadow = true;
      minder.receiveShadow = true;

      const rim = new THREE.Mesh(
        cushionRimGeo,
        isPlayerSlot ? creamMat : amberMat
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.set(lx, 0.21, lz);
      root.add(minder, rim);

      if (isPlayerSlot) {
        const seatId = 'masal-seat-player';
        [minder, rim].forEach((m) => {
          m.userData.masalAction = 'seat';
          m.userData.semaSeatId = seatId;
          this.interactiveMeshes.push(m);
        });

        this.playerSeat = {
          id: seatId,
          label: metin("MasalGazeboArea", "nine_nin_masal_minderi"),
          position: new THREE.Vector3(
            MASAL_ORIGIN.x + lx,
            0,
            MASAL_ORIGIN.z + lz
          ),
          standPos: new THREE.Vector3(
            MASAL_ORIGIN.x + lx + 0.9,
            0,
            MASAL_ORIGIN.z + lz
          ),
          yaw: faceYaw,
        };
      } else {
        const spec = childSpecs[childIdx++];
        const kid = new ExplorerCharacter(
          spec.style,
          spec.variant,
          childIdx % 2 === 0 ? 'anatolian' : 'culture',
          true
        );
        kid.scale.setScalar(0.8);
        kid.position.set(lx, 0.02, lz);
        kid.rotation.y = faceYaw;
        kid.setSitting(true);
        kid.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            obj.userData.masalAction = 'theater';
            this.interactiveMeshes.push(obj);
          }
        });
        root.add(kid);

        const bubbleMat = this.track(
          new THREE.SpriteMaterial({transparent: true, opacity: 0})
        );
        const bubbleSprite = new THREE.Sprite(bubbleMat);
        bubbleSprite.position.set(lx, 1.55, lz);
        bubbleSprite.scale.set(2.2, 0.48, 1);
        bubbleSprite.visible = false;
        root.add(bubbleSprite);

        this.listeners.push({
          char: kid,
          bubbleSprite,
          bubbleMat,
          bubbleTimer: 1.2 + childIdx * 2.1,
          bubblePhase: 'hidden',
          nodPhase: childIdx * 1.3,
        });
      }
    });
  }

  private setChildBubble(listener: ChildListener, text: string): void {
    if (!listener.bubbleSprite || !listener.bubbleMat) return;
    listener.bubbleTex?.dispose();
    const tex = createListenerBubbleTexture(text);
    listener.bubbleTex = tex;
    listener.bubbleMat.map = tex;
    listener.bubbleMat.opacity = 1;
    listener.bubbleMat.needsUpdate = true;
    listener.bubbleSprite.visible = true;
  }

  getWallRects(): WallRect[] {
    return this.wallRects;
  }

  getInteractiveMeshes(): THREE.Object3D[] {
    return this.interactiveMeshes;
  }

  getShadowCurtain(): ShadowCurtainCanvas {
    return this.shadowCurtain;
  }

  getSeatById(seatId: string): SemaSeatInfo | null {
    return this.playerSeat?.id === seatId ? this.playerSeat : null;
  }

  getPlayerSeat(): SemaSeatInfo {
    return this.playerSeat;
  }

  findNearestSeat(playerPos: THREE.Vector3, maxDist = 2.4): SemaSeatInfo | null {
    if (playerPos.y > 1.0 || !this.playerSeat) return null;
    const d = Math.hypot(
      this.playerSeat.position.x - playerPos.x,
      this.playerSeat.position.z - playerPos.z
    );
    return d <= maxDist ? this.playerSeat : null;
  }

  updateWithPlayer(
    dt: number,
    playerPos: THREE.Vector3,
    nightFactor: number,
    isNarrating: boolean,
    masalAudioTime = 0,
    syncToAudio = false
  ): void {
    const safeDt = Math.min(dt, 0.05);
    this.elapsed += safeDt;

    // 1. Update live Gölge Perdesi silhouette canvas texture
    this.shadowCurtain.update(safeDt, this.elapsed, masalAudioTime, syncToAudio);

    // 2. Gentle, cozy hearth fire animation (smooth sine curves — zero strobe/flash)
    if (this.hearthLight) {
      this.hearthLight.intensity =
        1.75 +
        nightFactor * 0.65 +
        Math.sin(this.elapsed * 3.1) * 0.18 +
        Math.cos(this.elapsed * 4.7) * 0.1;
    }
    for (let i = 0; i < this.hearthFlames.length; i++) {
      const f = this.hearthFlames[i];
      const ph = this.elapsed * (3.2 + i * 0.6) + i * 1.1;
      f.scale.set(
        1 + Math.sin(ph) * 0.08,
        1 + Math.cos(ph * 1.2) * 0.14,
        1 + Math.sin(ph * 0.9) * 0.08
      );
      f.rotation.z = Math.sin(ph * 0.7) * 0.09;
    }

    // 3. Hanging lanterns & backlight warmth
    const lanternBoost = 0.85 + nightFactor * 1.15;
    for (const l of this.lanternLights) {
      l.intensity = lanternBoost;
    }
    if (this.backlightMat) {
      this.backlightMat.opacity = 0.24 + Math.sin(this.elapsed * 1.8) * 0.04;
    }

    // 4. Nine gentle storytelling head & hand gesture animations
    const tellSpeed = isNarrating ? 2.6 : 1.35;
    const tellAmp = isNarrating ? 1.0 : 0.45;
    this.nineHead.rotation.x = Math.sin(this.elapsed * tellSpeed) * 0.06 * tellAmp;
    this.nineHead.rotation.y =
      Math.sin(this.elapsed * tellSpeed * 0.55) * 0.11 * tellAmp;
    this.nineRightArm.rotation.x =
      -0.08 + Math.sin(this.elapsed * tellSpeed * 1.2) * 0.22 * tellAmp;
    this.nineRightArm.rotation.z =
      Math.cos(this.elapsed * tellSpeed * 0.8) * 0.1 * tellAmp;
    this.nineLeftArm.rotation.x =
      Math.sin(this.elapsed * tellSpeed * 0.7) * 0.06 * tellAmp;

    // 5. Seated children listening attentively & sharing cozy speech bubbles nearby
    const distToMasal = Math.hypot(
      playerPos.x - MASAL_ORIGIN.x,
      playerPos.z - MASAL_ORIGIN.z
    );
    const showBubbles = distToMasal < 11.5;

    for (let i = 0; i < this.listeners.length; i++) {
      const listener = this.listeners[i];
      listener.char.update();
      if (listener.bubbleSprite && listener.bubbleMat) {
        if (!showBubbles) {
          listener.bubbleSprite.visible = false;
          listener.bubblePhase = 'hidden';
        } else {
          listener.bubbleTimer -= safeDt;
          if (listener.bubblePhase === 'hidden') {
            listener.bubbleSprite.visible = false;
            if (listener.bubbleTimer <= 0) {
              const msg =
                CHILD_REACTIONS[
                  (i + Math.floor(this.elapsed * 0.35)) % CHILD_REACTIONS.length
                ];
              this.setChildBubble(listener, msg);
              listener.bubblePhase = 'showing';
              listener.bubbleTimer = 3.4 + (i % 3) * 0.45;
            }
          } else {
            listener.bubbleSprite.visible = true;
            listener.bubbleMat.opacity = Math.min(1, listener.bubbleTimer / 0.45);
            if (listener.bubbleTimer <= 0) {
              listener.bubbleSprite.visible = false;
              listener.bubbleMat.opacity = 0;
              listener.bubblePhase = 'hidden';
              listener.bubbleTimer = 6.2 + Math.random() * 5.2;
            }
          }
        }
      }
    }
  }

  dispose(): void {
    for (const l of this.listeners) {
      l.char.dispose();
      l.bubbleTex?.dispose();
    }
    this.listeners = [];
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}
