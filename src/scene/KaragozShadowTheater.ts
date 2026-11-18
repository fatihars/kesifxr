import {metin} from "../metinler.ts";
import * as THREE from 'three';
import * as xb from 'xrblocks';

import {
  createAnatolianColumn,
  createOttomanAlem,
  createPointedArchGeometry,
  getAnatolianKilimTexture,
  getCobblePlazaTextures,
  getIznikTileTexture,
  getTerracottaRoofTextures,
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

export const KARAGOZ_ORIGIN = new THREE.Vector3(26.5, 0, 27.5);
const STAGE_HEIGHT = 0.44;
const KARAGOZ_VIDEO_URL = import.meta.env.BASE_URL + 'assets/aistudio/hacivatkaragoz_af33d6a5.mp4';
const KARAGOZ_MAX_AUDIO_DIST = 18.5;
const KARAGOZ_MAX_VOLUME = 0.88;

const AUDIENCE_REACTIONS = [
  metin("KaragozShadowTheater", "karagoz_yine_hacivat_i_yanlis_anladi"),
  metin("KaragozShadowTheater", "kirmizida_dur_sarida_hazirlan_yesilde_gec"),
  metin("KaragozShadowTheater", "nareke_ve_tef_caldi_oyun_basladi"),
  metin("KaragozShadowTheater", "yasasin_geleneksel_karagoz_golge_oyunu"),
  metin("KaragozShadowTheater", "kandil_isiginda_tasvirler_isil_isil"),
  metin("KaragozShadowTheater", "hay_hak_cocuklar_cok_egleniyor"),
];

interface AudienceChild {
  char: ExplorerCharacter;
  clapTimer: number;
  bubbleSprite?: THREE.Sprite;
  bubbleMat?: THREE.SpriteMaterial;
  bubbleTex?: THREE.CanvasTexture;
  bubbleTimer: number;
  bubblePhase: 'hidden' | 'showing';
}

function createPuppetTasvirTexture(
  kind: 'karagoz' | 'hacivat'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 256, 512);
    ctx.save();
    ctx.translate(128, 290);
    // Hacivat faces left (-X on backstage side), Karagöz faces right (+X toward Hacivat)
    if (kind === 'hacivat') ctx.scale(-1, 1);

    const robeColor = kind === 'karagoz' ? '#dc2626' : '#059669';
    const vestColor = kind === 'karagoz' ? '#f59e0b' : '#2563eb';
    const skinColor = '#fcd34d';

    // Boots & legs
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 4;
    ctx.fillStyle = '#451a03';
    [-16, 14].forEach((lx) => {
      ctx.beginPath();
      ctx.roundRect(lx - 10, 74, 22, 68, 8);
      ctx.fill();
      ctx.stroke();
    });
    ctx.fillStyle = kind === 'karagoz' ? '#b91c1c' : '#047857';
    [-20, 14].forEach((lx) => {
      ctx.beginPath();
      ctx.ellipse(lx + 10, 152, 22, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Şalvar & kaftan torso
    ctx.fillStyle = vestColor;
    ctx.beginPath();
    ctx.roundRect(-34, 22, 68, 60, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = robeColor;
    ctx.beginPath();
    ctx.roundRect(-38, -54, 76, 84, 18);
    ctx.fill();
    ctx.stroke();

    // Raised gesturing arm & hand
    ctx.fillStyle = robeColor;
    ctx.beginPath();
    ctx.roundRect(24, -46, 50, 20, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(78, -36, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Expressive profile head
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(4, -92, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eye (traditional almond cutout)
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.ellipse(18, -96, 8, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(20, -96, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Beard & hat
    ctx.fillStyle = '#111827';
    if (kind === 'karagoz') {
      // Round black beard & flamboyant red/gold kavuk turban
      ctx.beginPath();
      ctx.ellipse(14, -64, 22, 18, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.ellipse(-2, -124, 34, 20, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.roundRect(-34, -120, 68, 12, 5);
      ctx.fill();
    } else {
      // Pointed upturned beard & tall ornate green/gold börk cap
      ctx.beginPath();
      ctx.moveTo(4, -76);
      ctx.quadraticCurveTo(38, -68, 42, -92);
      ctx.quadraticCurveTo(28, -54, 0, -60);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#047857';
      ctx.beginPath();
      ctx.moveTo(-28, -112);
      ctx.lineTo(14, -112);
      ctx.lineTo(24, -152);
      ctx.lineTo(-14, -148);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createKaragozBannerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 176;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(0, 0, 1024, 176);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 1004, 156);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 44px "Google Sans", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(metin("KaragozShadowTheater", "karagoz_ve_hacivat"), 512, 66);

    ctx.fillStyle = '#fed7aa';
    ctx.font = '600 25px "Google Sans", Arial, sans-serif';
    ctx.fillText(
      metin("KaragozShadowTheater", "golge_oyunu"),
      512,
      124
    );
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBubbleTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 108;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 480, 108);
    ctx.fillStyle = 'rgba(69, 10, 10, 0.92)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 460, 80, 24);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 21px "Google Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 240, 50, 428);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createLicenseStripTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 56;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#291206';
    ctx.fillRect(0, 0, 1280, 56);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(3, 3, 1274, 50);

    ctx.fillStyle = '#fde68a';
    ctx.font = '600 20px "Google Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      metin("KaragozShadowTheater", "kaynak_hacivat_ve_karagoz_bolum_4_aksaray"),
      640,
      28
    );
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createLicensePlaqueTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#1c1008';
    ctx.fillRect(0, 0, 512, 320);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 492, 300);
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 472, 280);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 24px "Google Sans", Georgia, serif';
    ctx.fillText(metin("KaragozShadowTheater", "kaynak_lisans_bilgisi"), 256, 60);

    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 23px "Google Sans", Arial, sans-serif';
    ctx.fillText(metin("KaragozShadowTheater", "hacivat_ve_karagoz_bolum_4"), 256, 118);

    ctx.fillStyle = '#fed7aa';
    ctx.font = '600 20px "Google Sans", Arial, sans-serif';
    ctx.fillText(metin("KaragozShadowTheater", "kanal_aksaray_belediyesi_web_tv"), 256, 158);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '500 17px "Google Sans", Arial, sans-serif';
    ctx.fillText(metin("KaragozShadowTheater", "creative_commons_atif_cc_by_lisansi"), 256, 206);
    ctx.fillText(metin("KaragozShadowTheater", "ile_kullanilmistir"), 256, 230);

    ctx.fillStyle = '#7dd3fc';
    ctx.font = 'bold 17px "Google Sans", Arial, sans-serif';
    ctx.fillText(metin("KaragozShadowTheater", "orijinal_baglanti_detay_icin_tikla"), 256, 272);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class KaragozStageArea extends xb.Script {
  private disposables: Array<{dispose: () => void}> = [];
  private interactiveMeshes: THREE.Object3D[] = [];
  private wallRects: WallRect[] = [];

  private videoEl: HTMLVideoElement | null = null;
  private videoTexture: THREE.VideoTexture | null = null;
  private videoManuallyPaused = false;
  private videoInRange = false;
  private hasUserGesture = false;
  private gestureListenersBound = false;
  private lastVideoPlayAttempt = -10;

  private hayaliChar!: ExplorerCharacter;
  private hayaliGroup = new THREE.Group();
  private puppetKaragoz = new THREE.Group();
  private puppetHacivat = new THREE.Group();
  private rodLeft = new THREE.Mesh();
  private rodRight = new THREE.Mesh();
  private kandilFlame!: THREE.Mesh;
  private kandilSpotLight!: THREE.SpotLight;
  private kandilPointLight!: THREE.PointLight;

  private audienceKids: AudienceChild[] = [];
  private openSeats: SemaSeatInfo[] = [];
  private stageLanterns: THREE.PointLight[] = [];
  private elapsed = 0;

  private track<T extends {dispose: () => void}>(item: T): T {
    this.disposables.push(item);
    return item;
  }

  private bindGestureUnlock(): void {
    if (this.gestureListenersBound || typeof window === 'undefined') return;
    this.gestureListenersBound = true;
    const unlock = () => {
      this.hasUserGesture = true;
      if (this.videoInRange) this.unlockVideoAudio();
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('touchstart', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    };
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('touchstart', unlock, true);
    window.addEventListener('keydown', unlock, true);
  }

  init(): void {
    this.bindGestureUnlock();
    if (xb.core.renderer?.shadowMap) {
      if (DEVICE_QUALITY.shadowsEnabled) {
        xb.core.renderer.shadowMap.enabled = true;
        xb.core.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      } else {
        xb.core.renderer.shadowMap.enabled = false;
      }
    }

    const root = new THREE.Group();
    root.position.copy(KARAGOZ_ORIGIN);

    const cobbleTex = getCobblePlazaTextures(4, 3.5);
    const travTex = getTravertineTextures(3, 1);
    const walnutTex = getWalnutWoodTextures(2, 2.5);
    const roofTex = getTerracottaRoofTextures(4, 2);
    const iznikTex = getIznikTileTexture('turquoise', 4, 1);
    const kilimTurquoise = getAnatolianKilimTexture('turquoise');

    const plazaMat = this.track(
      new THREE.MeshStandardMaterial({
        map: cobbleTex.map,
        bumpMap: cobbleTex.bumpMap,
        bumpScale: 0.015,
        roughness: 0.85,
      })
    );
    const stoneMat = this.track(
      new THREE.MeshStandardMaterial({
        map: travTex.map,
        bumpMap: travTex.bumpMap,
        bumpScale: 0.016,
        roughness: 0.72,
      })
    );
    const walnutMat = this.track(
      new THREE.MeshStandardMaterial({
        map: walnutTex.map,
        bumpMap: walnutTex.bumpMap,
        bumpScale: 0.012,
        roughness: 0.56,
      })
    );
    const iznikMat = this.track(
      new THREE.MeshStandardMaterial({map: iznikTex, roughness: 0.34})
    );
    const velvetMat = this.track(
      new THREE.MeshStandardMaterial({color: 0x991b1b, roughness: 0.78})
    );
    const goldMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.8,
        roughness: 0.24,
      })
    );
    const roofTileMat = this.track(
      new THREE.MeshStandardMaterial({
        map: roofTex.map,
        bumpMap: roofTex.bumpMap,
        bumpScale: 0.02,
        roughness: 0.62,
      })
    );
    const cushionMat = this.track(
      new THREE.MeshStandardMaterial({map: kilimTurquoise, roughness: 0.82})
    );
    const openCushionMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xd97706,
        emissive: 0xb45309,
        emissiveIntensity: 0.28,
        roughness: 0.45,
      })
    );

    // 1. Wide cobblestone plaza floor under stage & audience seating (11.6m x 9.8m)
    const plaza = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(11.6, 0.04, 9.8)),
      plazaMat
    );
    plaza.position.set(-0.8, 0.02, 0);
    plaza.receiveShadow = true;
    plaza.name = 'walkable-ground';
    root.add(plaza);

    // 2. Raised Traditional Ottoman Karagöz Theatre Stage on East side (local x = +2.3)
    const sx = 2.3;
    const stageBase = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(3.8, STAGE_HEIGHT, 6.4)),
      stoneMat
    );
    stageBase.position.set(sx, STAGE_HEIGHT / 2, 0);
    stageBase.castShadow = true;
    stageBase.receiveShadow = true;

    const stageDeck = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(3.62, 0.05, 6.2)),
      walnutMat
    );
    stageDeck.position.set(sx, STAGE_HEIGHT + 0.025, 0);
    stageDeck.receiveShadow = true;

    // Front approach steps facing audience (-X)
    for (let s = 0; s < 2; s++) {
      const step = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(0.42, 0.22, 2.6)),
        stoneMat
      );
      step.position.set(sx - 2.08 - s * 0.36, 0.11 + (1 - s) * 0.11, 0);
      step.receiveShadow = true;
      root.add(step);
    }

    // 4 Fluted Walnut & Brass Anatolian Pillars + Kemer Proscenium Arch + Terracotta Pitched Roof + Alem
    [
      [sx - 1.6, -2.9],
      [sx - 1.6, 2.9],
      [sx + 1.6, -2.9],
      [sx + 1.6, 2.9],
    ].forEach(([cx, cz]) => {
      const col = createAnatolianColumn(
        (item) => this.track(item),
        0.14,
        3.62,
        walnutMat,
        goldMat,
        goldMat
      );
      col.position.set(cx, STAGE_HEIGHT + 0.04, cz);
      root.add(col);
    });

    const beamY = STAGE_HEIGHT + 3.68;
    const frontBeam = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.24, 0.24, 6.2)),
      walnutMat
    );
    frontBeam.position.set(sx - 1.6, beamY, 0);

    const kemerProscenium = new THREE.Mesh(
      this.track(createPointedArchGeometry(5.6, 0.92, 4.4, 0.08, 0.76, 0.12)),
      walnutMat
    );
    kemerProscenium.rotation.y = -Math.PI / 2;
    kemerProscenium.position.set(sx - 1.6, STAGE_HEIGHT + 2.72, 0);
    root.add(kemerProscenium);

    const backBeam = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.24, 0.24, 6.2)),
      walnutMat
    );
    backBeam.position.set(sx + 1.6, beamY, 0);

    const sideBeamL = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(3.4, 0.24, 0.24)),
      walnutMat
    );
    sideBeamL.position.set(sx, beamY, -2.9);

    const sideBeamR = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(3.4, 0.24, 0.24)),
      walnutMat
    );
    sideBeamR.position.set(sx, beamY, 2.9);

    const ceilingDeck = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(4.05, 0.14, 6.65)),
      walnutMat
    );
    ceilingDeck.position.set(sx, STAGE_HEIGHT + 3.85, 0);

    const eaveIznik = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(4.3, 0.14, 6.9)),
      iznikMat
    );
    eaveIznik.position.set(sx, STAGE_HEIGHT + 3.92, 0);

    const eaveGold = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(4.35, 0.06, 6.95)),
      goldMat
    );
    eaveGold.position.set(sx, STAGE_HEIGHT + 3.99, 0);

    // Rotate base 4-sided pyramid geometry before scaling so the hipped roof is 100% straight
    const pitchedRoofGeo = this.track(
      new THREE.CylinderGeometry(0.15, Math.SQRT2 / 2, 1.25, 4)
    );
    pitchedRoofGeo.rotateY(Math.PI / 4);
    const pitchedRoof = new THREE.Mesh(pitchedRoofGeo, roofTileMat);
    pitchedRoof.scale.set(4.5, 1, 7.1);
    pitchedRoof.position.set(sx, STAGE_HEIGHT + 4.62, 0);
    pitchedRoof.castShadow = true;

    const finialAlem = createOttomanAlem((item) => this.track(item), 0.65, goldMat);
    finialAlem.position.set(sx, STAGE_HEIGHT + 5.2, 0);

    // Overhead Stage Signboard suspended cleanly beneath the front beam (facing -X)
    const bannerTex = this.track(createKaragozBannerTexture());
    const bannerPlane = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(5.1, 0.88)),
      this.track(
        new THREE.MeshBasicMaterial({map: bannerTex, side: THREE.DoubleSide})
      )
    );
    bannerPlane.rotation.y = -Math.PI / 2;
    bannerPlane.position.set(sx - 1.68, STAGE_HEIGHT + 3.06, 0);

    const bannerBacking = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.1, 0.98, 5.26)),
      walnutMat
    );
    bannerBacking.position.set(sx - 1.6, STAGE_HEIGHT + 3.06, 0);

    // 3. Traditional "Ayna" Shadow Screen playing User Video on Front + Translucent Shadow Receiver on Back
    const screenX = sx - 0.72;
    this.videoEl = document.createElement('video');
    this.videoEl.src = KARAGOZ_VIDEO_URL;
    this.videoEl.loop = true;
    this.videoEl.playsInline = true;
    this.videoEl.preload = 'metadata';
    this.videoEl.muted = true; // Autoplay muted; spatial audio unmutes upon gesture inside range
    this.videoEl.crossOrigin = 'anonymous';

    this.videoTexture = this.track(new THREE.VideoTexture(this.videoEl));
    this.videoTexture.colorSpace = THREE.SRGBColorSpace;
    this.videoTexture.minFilter = THREE.LinearFilter;
    this.videoTexture.magFilter = THREE.LinearFilter;

    // Outer wooden screen border frame (top, bottom, left, right rails so center is open for translucent rear screen)
    const frameTop = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.16, 0.14, 4.46)),
      walnutMat
    );
    frameTop.position.set(screenX, STAGE_HEIGHT + 2.6, 0);
    const frameBot = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.16, 0.14, 4.46)),
      walnutMat
    );
    frameBot.position.set(screenX, STAGE_HEIGHT + 0.42, 0);
    const frameLeft = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.16, 2.38, 0.14)),
      walnutMat
    );
    frameLeft.position.set(screenX, STAGE_HEIGHT + 1.48, -2.16);
    const frameRight = frameLeft.clone();
    frameRight.position.z = 2.16;

    // Front face: User's Karagöz & Hacivat Video Texture facing -X audience
    const screenFrontMesh = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(4.2, 2.14)),
      this.track(
        new THREE.MeshBasicMaterial({
          map: this.videoTexture,
          toneMapped: false,
        })
      )
    );
    screenFrontMesh.rotation.y = -Math.PI / 2;
    screenFrontMesh.position.set(screenX - 0.085, STAGE_HEIGHT + 1.48, 0);
    screenFrontMesh.userData.karagozAction = 'toggle-play';
    this.interactiveMeshes.push(screenFrontMesh);

    // Back face of the Ayna screen: backlit cream parchment receiving REAL Kandil shadows of Karagöz & Hacivat!
    const screenRearParchment = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(4.2, 2.14)),
      this.track(
        new THREE.MeshStandardMaterial({
          color: 0xfff8dc,
          emissive: 0xfde68a,
          emissiveIntensity: 0.1,
          roughness: 0.88,
        })
      )
    );
    screenRearParchment.rotation.y = Math.PI / 2; // Facing +X toward backstage Kandil & Hayali
    screenRearParchment.position.set(screenX + 0.085, STAGE_HEIGHT + 1.48, 0);
    screenRearParchment.receiveShadow = true;
    screenRearParchment.userData.karagozAction = 'toggle-play';
    this.interactiveMeshes.push(screenRearParchment);

    // Left & right crimson velvet curtains + lower stage apron
    [-2.48, 2.48].forEach((cz) => {
      const curtain = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.28, 0.36, 2.55, 12)),
        velvetMat
      );
      curtain.position.set(screenX - 0.14, STAGE_HEIGHT + 1.55, cz);
      curtain.castShadow = true;
      const tassel = new THREE.Mesh(
        this.track(new THREE.SphereGeometry(0.12, 10, 8)),
        goldMat
      );
      tassel.position.set(screenX - 0.18, STAGE_HEIGHT + 1.35, cz * 0.88);
      root.add(curtain, tassel);
    });

    const stageApron = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.18, 0.44, 5.6)),
      velvetMat
    );
    stageApron.position.set(screenX - 0.12, STAGE_HEIGHT + 0.22, 0);

    // 4. Traditional Tef (tambourine) & Nareke prop table at stage front corner
    const propTableTop = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.38, 0.38, 0.06, 12)),
      walnutMat
    );
    propTableTop.position.set(sx - 1.28, STAGE_HEIGHT + 0.56, -2.35);
    const propTableLeg = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.06, 0.08, 0.54, 8)),
      walnutMat
    );
    propTableLeg.position.set(sx - 1.28, STAGE_HEIGHT + 0.28, -2.35);

    const tefRing = new THREE.Mesh(
      this.track(new THREE.TorusGeometry(0.22, 0.035, 8, 20)),
      walnutMat
    );
    tefRing.rotation.x = Math.PI / 2;
    tefRing.position.set(sx - 1.28, STAGE_HEIGHT + 0.63, -2.35);
    const tefSkin = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 20)),
      this.track(
        new THREE.MeshStandardMaterial({color: 0xfef3c7, roughness: 0.72})
      )
    );
    tefSkin.position.set(sx - 1.28, STAGE_HEIGHT + 0.62, -2.35);

    const narekePipe = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.025, 0.03, 0.32, 8)),
      goldMat
    );
    narekePipe.rotation.z = Math.PI / 2;
    narekePipe.position.set(sx - 1.26, STAGE_HEIGHT + 0.62, -2.06);

    [tefRing, tefSkin, narekePipe].forEach((m) => {
      m.userData.karagozAction = 'toggle-play';
      this.interactiveMeshes.push(m);
    });

    // Subtle integrated CC BY credit strip embedded along the lower wooden screen bezel
    const licenseStripTex = this.track(createLicenseStripTexture());
    const licenseStripMesh = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(3.96, 0.13)),
      this.track(
        new THREE.MeshBasicMaterial({
          map: licenseStripTex,
          side: THREE.DoubleSide,
        })
      )
    );
    licenseStripMesh.rotation.y = -Math.PI / 2;
    licenseStripMesh.position.set(screenX - 0.088, STAGE_HEIGHT + 0.42, 0);
    licenseStripMesh.userData.karagozAction = 'license-info';
    this.interactiveMeshes.push(licenseStripMesh);

    // Tasteful small museum brass attribution lectern on front-right stage edge (z = +2.35)
    const plaqueStandPost = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.032, 0.042, 0.46, 10)),
      walnutMat
    );
    plaqueStandPost.position.set(sx - 1.48, STAGE_HEIGHT + 0.23, 2.35);

    const plaqueBoardGroup = new THREE.Group();
    plaqueBoardGroup.position.set(sx - 1.5, STAGE_HEIGHT + 0.5, 2.35);
    plaqueBoardGroup.rotation.y = -Math.PI / 2;
    plaqueBoardGroup.rotation.x = -0.32;

    const plaqueBacking = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.68, 0.44, 0.04)),
      walnutMat
    );
    const plaqueGoldTrim = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.71, 0.47, 0.025)),
      goldMat
    );
    plaqueGoldTrim.position.z = -0.008;
    const plaqueTex = this.track(createLicensePlaqueTexture());
    const plaqueFace = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(0.64, 0.4)),
      this.track(
        new THREE.MeshBasicMaterial({map: plaqueTex, side: THREE.DoubleSide})
      )
    );
    plaqueFace.position.z = 0.024;
    [plaqueBacking, plaqueFace].forEach((m) => {
      m.userData.karagozAction = 'license-info';
      this.interactiveMeshes.push(m);
    });
    plaqueBoardGroup.add(plaqueGoldTrim, plaqueBacking, plaqueFace);

    // 5. Backstage Authentic Assembly:
    //    (a) 3D Deve Derisi Karagöz & Hacivat Tasvir Puppets casting crisp shadows onto rear screen
    //    (b) Hanging Ottoman Kandil / Şem'a Oil Lamp shining warm shadow-casting spotlight onto puppets -> screen
    //    (c) Properly Modeled Hayali Puppeteer (ExplorerCharacter + Fes + Değnek rods)
    const puppetX = screenX + 0.36;
    const buildTasvir = (
      kind: 'karagoz' | 'hacivat',
      zOffset: number
    ): THREE.Group => {
      const grp = new THREE.Group();
      const tex = this.track(createPuppetTasvirTexture(kind));
      const geo = this.track(new THREE.PlaneGeometry(0.68, 1.32));
      const mat = this.track(
        new THREE.MeshStandardMaterial({
          map: tex,
          alphaTest: 0.42,
          side: THREE.DoubleSide,
          roughness: 0.55,
        })
      );
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.y = Math.PI / 2; // Facing backstage/screen perpendicular to Kandil ray
      mesh.castShadow = true;
      // Alpha-tested customDepthMaterial so Kandil Spotlight projects true Karagöz & Hacivat silhouette onto curtain!
      mesh.customDepthMaterial = this.track(
        new THREE.MeshDepthMaterial({
          depthPacking: THREE.RGBADepthPacking,
          map: tex,
          alphaTest: 0.42,
        })
      );
      mesh.userData.karagozAction = 'toggle-play';
      this.interactiveMeshes.push(mesh);

      // Wooden control stick (değnek) attached behind puppet
      const stick = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 6)),
        walnutMat
      );
      stick.rotation.z = Math.PI / 2;
      stick.position.set(0.22, -0.1, 0);
      grp.add(mesh, stick);
      grp.position.set(puppetX, STAGE_HEIGHT + 1.34, zOffset);
      return grp;
    };

    this.puppetHacivat = buildTasvir('hacivat', -0.48);
    this.puppetKaragoz = buildTasvir('karagoz', 0.48);

    // Traditional Hanging Ottoman Kandil (Şem'a) behind the puppets
    const kandilX = screenX + 1.12;
    const kandilGroup = new THREE.Group();
    kandilGroup.position.set(kandilX, STAGE_HEIGHT + 1.48, 0);

    const chain = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.014, 0.014, 1.85, 6)),
      goldMat
    );
    chain.position.y = 0.92;
    const brassDish = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.24, 0.14, 0.08, 16)),
      goldMat
    );
    brassDish.position.y = -0.06;
    const oilBowl = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(0.14, 14, 10)),
      this.track(
        new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xf59e0b,
          emissiveIntensity: 1.2,
          transparent: true,
          opacity: 0.9,
          roughness: 0.2,
        })
      )
    );
    oilBowl.scale.set(1, 0.72, 1);
    oilBowl.position.y = 0.02;

    this.kandilFlame = new THREE.Mesh(
      this.track(new THREE.ConeGeometry(0.065, 0.22, 10)),
      this.track(
        new THREE.MeshBasicMaterial({
          color: 0xfef08a,
          transparent: true,
          opacity: 0.92,
        })
      )
    );
    this.kandilFlame.position.y = 0.16;

    // Shadow-casting SpotLight aimed straight through puppets onto rear Ayna parchment
    this.kandilSpotLight = new THREE.SpotLight(
      0xfbbf24,
      14.0,
      4.2,
      Math.PI * 0.36,
      0.52,
      1.0
    );
    this.kandilSpotLight.position.set(0.14, 0.12, 0);
    if (DEVICE_QUALITY.shadowsEnabled) {
      this.kandilSpotLight.castShadow = true;
      this.kandilSpotLight.shadow.mapSize.set(512, 512);
      this.kandilSpotLight.shadow.camera.near = 0.2;
      this.kandilSpotLight.shadow.camera.far = 3.2;
      this.kandilSpotLight.shadow.bias = -0.0005;
    } else {
      this.kandilSpotLight.castShadow = false;
    }
    this.kandilSpotLight.target.position.set(-(kandilX - (screenX + 0.085)), 0, 0);

    this.kandilPointLight = new THREE.PointLight(0xf59e0b, 2.2, 6.5, 1.5);
    this.kandilPointLight.position.set(-0.08, 0.14, 0);

    const beamCone = new THREE.Mesh(
      this.track(new THREE.ConeGeometry(0.95, 1.15, 18, 1, true)),
      this.track(
        new THREE.MeshBasicMaterial({
          color: 0xfbbf24,
          transparent: true,
          opacity: 0.14,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      )
    );
    beamCone.rotation.z = -Math.PI / 2;
    beamCone.position.set(-0.55, 0.08, 0);

    kandilGroup.add(
      chain,
      brassDish,
      oilBowl,
      this.kandilFlame,
      beamCone,
      this.kandilSpotLight,
      this.kandilSpotLight.target,
      this.kandilPointLight
    );

    // Properly Modeled Hayali Usta Puppeteer using ExplorerCharacter + Ottoman Fes + Rods
    this.hayaliChar = new ExplorerCharacter('erkek', 1, 'anatolian', true);
    this.hayaliChar.rotation.y = Math.PI / 2; // Facing -X toward the screen & puppets

    // Traditional crimson Ottoman Fes + black silk tassel on Hayali's head
    const hayaliFes = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.115, 0.135, 0.14, 14)),
      velvetMat
    );
    hayaliFes.position.set(0, 1.54, 0);
    const hayaliTassel = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.018, 0.025, 0.13, 8)),
      this.track(new THREE.MeshStandardMaterial({color: 0x111827, roughness: 0.7}))
    );
    hayaliTassel.position.set(0.12, 1.51, -0.02);
    hayaliTassel.rotation.z = -0.22;
    this.hayaliChar.add(hayaliFes, hayaliTassel);

    this.hayaliChar.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.userData.karagozAction = 'toggle-play';
        this.interactiveMeshes.push(obj);
      }
    });

    // Two long puppet control rods (değnek) held by Hayali reaching toward the puppets
    const rodGeo = this.track(new THREE.CylinderGeometry(0.012, 0.014, 1.18, 6));
    this.rodLeft = new THREE.Mesh(rodGeo, goldMat);
    this.rodLeft.rotation.z = 1.42;
    this.rodLeft.position.set(-0.56, 1.05, -0.34);
    this.rodRight = new THREE.Mesh(rodGeo, goldMat);
    this.rodRight.rotation.z = 1.42;
    this.rodRight.position.set(-0.56, 1.05, 0.34);

    this.hayaliGroup.add(this.hayaliChar, this.rodLeft, this.rodRight);
    this.hayaliGroup.position.set(sx + 1.1, STAGE_HEIGHT + 0.05, 0);

    // Front warm stage lantern (skip extra point light on mobile simplified lighting)
    const frontLight = DEVICE_QUALITY.simplifiedLighting
      ? null
      : new THREE.PointLight(0xfde68a, 1.65, 12, 1.6);
    if (frontLight) {
      frontLight.position.set(sx - 2.35, STAGE_HEIGHT + 3.2, 0);
      this.stageLanterns.push(frontLight);
    }

    root.add(
      stageBase,
      stageDeck,
      frontBeam,
      backBeam,
      sideBeamL,
      sideBeamR,
      ceilingDeck,
      eaveIznik,
      eaveGold,
      pitchedRoof,
      finialAlem,
      bannerBacking,
      bannerPlane,
      frameTop,
      frameBot,
      frameLeft,
      frameRight,
      screenFrontMesh,
      screenRearParchment,
      stageApron,
      propTableTop,
      propTableLeg,
      tefRing,
      tefSkin,
      narekePipe,
      licenseStripMesh,
      plaqueStandPost,
      plaqueBoardGroup,
      this.puppetHacivat,
      this.puppetKaragoz,
      kandilGroup,
      this.hayaliGroup
    );
    if (frontLight) {
      root.add(frontLight);
    }

    // 6. Audience Seating Rows (2 wooden cushioned benches) + 8 Child Spectators + 2 Player Seats
    const rowXs = [-1.6, -3.45];
    const audienceRows: Array<{
      x: number;
      z: number;
      isPlayerSeat: boolean;
      seatId?: string;
      seatLabel?: string;
      gender?: CharacterStyleId;
      variant?: number;
    }> = [
      {x: rowXs[0], z: -2.4, isPlayerSeat: false, gender: 'kadin', variant: 0},
      {x: rowXs[0], z: -1.15, isPlayerSeat: false, gender: 'erkek', variant: 1},
      {
        x: rowXs[0],
        z: 0.0,
        isPlayerSeat: true,
        seatId: 'karagoz-seat-0',
        seatLabel: metin("KaragozShadowTheater", "karagoz_on_sira_minderi"),
      },
      {x: rowXs[0], z: 1.15, isPlayerSeat: false, gender: 'kadin', variant: 2},
      {x: rowXs[0], z: 2.4, isPlayerSeat: false, gender: 'erkek', variant: 0},

      {x: rowXs[1], z: -2.4, isPlayerSeat: false, gender: 'erkek', variant: 2},
      {x: rowXs[1], z: -1.15, isPlayerSeat: false, gender: 'kadin', variant: 3},
      {
        x: rowXs[1],
        z: 0.0,
        isPlayerSeat: true,
        seatId: 'karagoz-seat-1',
        seatLabel: metin("KaragozShadowTheater", "karagoz_arka_sira_koltugu"),
      },
      {x: rowXs[1], z: 1.15, isPlayerSeat: false, gender: 'erkek', variant: 3},
      {x: rowXs[1], z: 2.4, isPlayerSeat: false, gender: 'kadin', variant: 1},
    ];

    rowXs.forEach((rx) => {
      const benchSeat = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(0.84, 0.1, 5.9)),
        walnutMat
      );
      benchSeat.position.set(rx, 0.42, 0);
      benchSeat.castShadow = true;
      benchSeat.receiveShadow = true;
      root.add(benchSeat);

      [-2.6, 0, 2.6].forEach((lz) => {
        const leg = new THREE.Mesh(
          this.track(new THREE.BoxGeometry(0.56, 0.4, 0.14)),
          walnutMat
        );
        leg.position.set(rx, 0.2, lz);
        leg.castShadow = true;
        root.add(leg);
      });
    });

    const seatFaceYaw = -Math.PI / 2;
    const seatedHipTarget = 0.61;
    const seatedHipHeight = 0.30;
    let kidCount = 0;

    for (const slot of audienceRows) {
      const cushion = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(0.76, 0.1, 0.90)),
        slot.isPlayerSeat ? openCushionMat : cushionMat
      );
      cushion.position.set(slot.x, 0.51, slot.z);
      cushion.castShadow = true;
      root.add(cushion);

      if (slot.isPlayerSeat && slot.seatId && slot.seatLabel) {
        cushion.userData.karagozAction = 'seat';
        cushion.userData.semaSeatId = slot.seatId;
        this.interactiveMeshes.push(cushion);


        this.openSeats.push({
          id: slot.seatId,
          label: slot.seatLabel,
          position: new THREE.Vector3(
            KARAGOZ_ORIGIN.x + slot.x - 0.13,
            seatedHipTarget - seatedHipHeight,
            KARAGOZ_ORIGIN.z + slot.z
          ),
          standPos: new THREE.Vector3(
            KARAGOZ_ORIGIN.x + slot.x - 0.82,
            0,
            KARAGOZ_ORIGIN.z + slot.z
          ),
          yaw: seatFaceYaw,
        });
      } else {
        const kid = new ExplorerCharacter(
          slot.gender ?? 'erkek',
          slot.variant ?? 0,
          kidCount % 2 === 0 ? 'anatolian' : 'culture',
          true
        );
        kid.scale.setScalar(0.8);
        kid.position.set(slot.x - 0.13, seatedHipTarget - seatedHipHeight * kid.scale.y, slot.z);
        kid.rotation.y = seatFaceYaw;
        kid.setSitting(true);
        kid.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            obj.userData.karagozAction = 'toggle-play';
            this.interactiveMeshes.push(obj);
          }
        });
        root.add(kid);

        const bubbleMat = this.track(
          new THREE.SpriteMaterial({transparent: true, opacity: 0})
        );
        const bubbleSprite = new THREE.Sprite(bubbleMat);
        bubbleSprite.position.set(slot.x, 1.66, slot.z);
        bubbleSprite.scale.set(2.25, 0.5, 1);
        bubbleSprite.visible = false;
        root.add(bubbleSprite);

        this.audienceKids.push({
          char: kid,
          clapTimer: 1.5 + (kidCount % 4) * 1.4,
          bubbleSprite,
          bubbleMat,
          bubbleTimer: 1.4 + kidCount * 1.6,
          bubblePhase: 'hidden',
        });
        kidCount++;
      }
    }

    this.add(root);

    // 7. Solid WallRects for Stage & both Audience Benches so player cannot clip through
    this.wallRects.push(
      {
        minX: KARAGOZ_ORIGIN.x + sx - 2.0,
        maxX: KARAGOZ_ORIGIN.x + sx + 2.0,
        minZ: KARAGOZ_ORIGIN.z - 3.3,
        maxZ: KARAGOZ_ORIGIN.z + 3.3,
      },
      {
        minX: KARAGOZ_ORIGIN.x + rowXs[0] - 0.42,
        maxX: KARAGOZ_ORIGIN.x + rowXs[0] + 0.42,
        minZ: KARAGOZ_ORIGIN.z - 2.95,
        maxZ: KARAGOZ_ORIGIN.z + 2.95,
      },
      {
        minX: KARAGOZ_ORIGIN.x + rowXs[1] - 0.42,
        maxX: KARAGOZ_ORIGIN.x + rowXs[1] + 0.42,
        minZ: KARAGOZ_ORIGIN.z - 2.95,
        maxZ: KARAGOZ_ORIGIN.z + 2.95,
      }
    );
  }

  getWallRects(): WallRect[] {
    return this.wallRects;
  }

  getInteractiveMeshes(): THREE.Object3D[] {
    return this.interactiveMeshes;
  }

  getSeatById(seatId: string): SemaSeatInfo | null {
    return this.openSeats.find((s) => s.id === seatId) ?? null;
  }

  findNearestSeat(playerPos: THREE.Vector3, maxDist = 2.3): SemaSeatInfo | null {
    if (playerPos.y > 1.0) return null;
    let best: SemaSeatInfo | null = null;
    let bestD = maxDist;
    for (const s of this.openSeats) {
      const d = Math.hypot(s.position.x - playerPos.x, s.position.z - playerPos.z);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    return best;
  }

  isVideoPlaying(): boolean {
    return Boolean(this.videoEl && !this.videoEl.paused);
  }

  togglePlayPause(): boolean {
    this.hasUserGesture = true;
    if (!this.videoEl) return false;
    if (this.videoEl.paused) {
      this.videoManuallyPaused = false;
      this.videoEl.muted = false;
      void this.videoEl.play().catch(() => {
        if (!this.videoEl) return;
        this.videoEl.muted = true;
        void this.videoEl.play().catch(() => {
          /* fallback */
        });
      });
      return true;
    }
    this.videoManuallyPaused = true;
    this.videoEl.pause();
    return false;
  }

  restartVideo(): void {
    this.hasUserGesture = true;
    if (!this.videoEl) return;
    this.videoManuallyPaused = false;
    this.videoEl.currentTime = 0;
    this.videoEl.muted = false;
    void this.videoEl.play().catch(() => {
      if (!this.videoEl) return;
      this.videoEl.muted = true;
      void this.videoEl.play().catch(() => {
        /* fallback */
      });
    });
  }

  unlockVideoAudio(): void {
    this.hasUserGesture = true;
    if (this.videoEl && this.videoInRange && !this.videoManuallyPaused && this.videoEl.paused) {
      this.tryPlayStageVideo();
    }
  }

  private tryPlayStageVideo(): void {
    if (!this.videoEl) return;
    this.lastVideoPlayAttempt = this.elapsed;
    this.videoEl.muted = true;
    void this.videoEl.play().catch(() => {
      // Autoplay or buffering might reject temporarily; throttled retry handles it.
    });
  }

  private setKidBubble(kid: AudienceChild, text: string): void {
    if (!kid.bubbleSprite || !kid.bubbleMat) return;
    kid.bubbleTex?.dispose();
    const tex = createBubbleTexture(text);
    kid.bubbleTex = tex;
    kid.bubbleMat.map = tex;
    kid.bubbleMat.opacity = 1;
    kid.bubbleMat.needsUpdate = true;
    kid.bubbleSprite.visible = true;
  }

  updateWithPlayer(
    dt: number,
    playerPos: THREE.Vector3,
    nightFactor: number,
    isInsideMuseum = false,
    ambientMuted = false
  ): void {
    const safeDt = Math.min(dt, 0.05);
    this.elapsed += safeDt;

    const distToStage = Math.hypot(
      playerPos.x - KARAGOZ_ORIGIN.x,
      playerPos.z - KARAGOZ_ORIGIN.z
    );

    // 1. Spatial Audio Volume + Autoplay for Hacivat & Karagöz Video
    if (this.videoEl) {
      const inRange = !isInsideMuseum && distToStage < (this.videoInRange ? 18 : 14);
      if (inRange !== this.videoInRange) {
        this.videoInRange = inRange;
        if (inRange && !this.videoManuallyPaused) {
          this.tryPlayStageVideo();
        } else if (!inRange) {
          this.videoEl.pause();
        }
      } else if (
        inRange &&
        !this.videoManuallyPaused &&
        this.videoEl.paused &&
        this.elapsed - this.lastVideoPlayAttempt >= 1.0
      ) {
        this.tryPlayStageVideo();
      }
      let targetVol = 0;
      if (!isInsideMuseum && !ambientMuted && distToStage < KARAGOZ_MAX_AUDIO_DIST) {
        const clamped = Math.max(0, distToStage - 4.2);
        const ratio = Math.max(0, 1 - clamped / (KARAGOZ_MAX_AUDIO_DIST - 4.2));
        targetVol = KARAGOZ_MAX_VOLUME * Math.pow(ratio, 1.4);
      }
      if (this.hasUserGesture && targetVol > 0.01) {
        this.videoEl.muted = false;
        this.videoEl.volume = targetVol;
      } else {
        this.videoEl.muted = true;
        this.videoEl.volume = 0;
      }
    }

    this.kandilSpotLight.castShadow =
      DEVICE_QUALITY.shadowsEnabled && !isInsideMuseum && distToStage < 18;

    if (!this.visible) return;

    // 2. Backstage Hayali Puppeteer + 3D Puppets + Flickering Kandil Light Casting Silhouettes
    this.hayaliChar.update();
    const isActing = this.isVideoPlaying();
    const actSpeed = isActing ? 2.4 : 0.7;

    this.hayaliGroup.position.z = Math.sin(this.elapsed * 0.9) * 0.28;
    this.hayaliGroup.rotation.y = Math.sin(this.elapsed * 1.1) * 0.1;

    this.puppetHacivat.position.y =
      STAGE_HEIGHT + 1.34 + Math.sin(this.elapsed * actSpeed * 1.1) * 0.08;
    this.puppetHacivat.rotation.x = Math.sin(this.elapsed * actSpeed * 1.4) * 0.09;
    this.puppetKaragoz.position.y =
      STAGE_HEIGHT + 1.34 + Math.cos(this.elapsed * actSpeed * 1.25) * 0.09;
    this.puppetKaragoz.rotation.x = Math.cos(this.elapsed * actSpeed * 1.3) * 0.1;

    this.rodLeft.rotation.y = Math.sin(this.elapsed * actSpeed * 1.1) * 0.12;
    this.rodRight.rotation.y = Math.cos(this.elapsed * actSpeed * 1.25) * 0.12;

    const flicker =
      Math.sin(this.elapsed * 7.2) * 0.08 + Math.cos(this.elapsed * 11.4) * 0.05;
    this.kandilFlame.scale.set(1 + flicker, 1 + flicker * 1.6, 1 + flicker);
    this.kandilSpotLight.intensity = 13.5 + nightFactor * 4.5 + flicker * 6.0;
    this.kandilPointLight.intensity = 2.0 + nightFactor * 1.1 + flicker * 1.5;

    const lampBoost = 1.4 + nightFactor * 1.0;
    for (const l of this.stageLanterns) {
      l.intensity = lampBoost;
    }

    // 3. Seated Child Audience Reactions (clapping + bubbles that come & go cleanly)
    const showBubbles = distToStage < 14.0;
    for (let i = 0; i < this.audienceKids.length; i++) {
      const kid = this.audienceKids[i];
      kid.char.update();
      kid.clapTimer -= safeDt;
      if (kid.clapTimer <= 0) {
        const shouldClap = Math.random() < 0.55;
        kid.char.setClapping(shouldClap);
        kid.clapTimer = shouldClap ? 2.4 + Math.random() * 1.8 : 3.2 + Math.random() * 3.5;
      }

      if (kid.bubbleSprite && kid.bubbleMat) {
        if (!showBubbles) {
          kid.bubbleSprite.visible = false;
          kid.bubblePhase = 'hidden';
        } else {
          kid.bubbleTimer -= safeDt;
          if (kid.bubblePhase === 'hidden') {
            kid.bubbleSprite.visible = false;
            if (kid.bubbleTimer <= 0) {
              const msg =
                AUDIENCE_REACTIONS[
                  (i + Math.floor(this.elapsed * 0.35)) %
                    AUDIENCE_REACTIONS.length
                ];
              this.setKidBubble(kid, msg);
              kid.bubblePhase = 'showing';
              kid.bubbleTimer = 3.2 + (i % 3) * 0.45;
            }
          } else {
            kid.bubbleSprite.visible = true;
            kid.bubbleMat.opacity = Math.min(1, kid.bubbleTimer / 0.45);
            if (kid.bubbleTimer <= 0) {
              kid.bubbleSprite.visible = false;
              kid.bubbleMat.opacity = 0;
              kid.bubblePhase = 'hidden';
              kid.bubbleTimer = 6.4 + Math.random() * 5.4;
            }
          }
        }
      }
    }
  }

  dispose(): void {
    if (this.videoEl) {
      this.videoEl.pause();
      this.videoEl.removeAttribute('src');
      this.videoEl.load();
      this.videoEl = null;
    }
    this.hayaliChar?.dispose();
    for (const kid of this.audienceKids) {
      kid.char.dispose();
      kid.bubbleTex?.dispose();
    }
    this.audienceKids = [];
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}
