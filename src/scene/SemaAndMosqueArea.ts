import {metin} from "../metinler.ts";
import * as THREE from 'three';
import * as xb from 'xrblocks';

import {
  type CharacterStyleId,
  ExplorerCharacter,
} from './ExplorerCharacter.ts';
import type {WallRect} from './MuseumBuilding.ts';
import {
  createAnatolianColumn,
  createOttomanAlem,
  createPointedArchGeometry,
  createRibbedDome,
  createSeljukStarGeometry,
  getAnatolianKilimTexture,
  getCobblePlazaTextures,
  getIznikTileTexture,
  getLeadDomeTexture,
  getMarbleInlayTexture,
  getTerracottaRoofTextures,
  getTravertineTextures,
  getWalnutWoodTextures,
} from '../utils/anatolianMaterials.ts';

export const SEMA_STAGE_ORIGIN = new THREE.Vector3(-25.0, 0, 34.0);
export const MOSQUE_ORIGIN = new THREE.Vector3(-37.0, 0, 21.5);
export const MOSQUE_ENTRANCE = MOSQUE_ORIGIN.clone().add(new THREE.Vector3(7.6, 0, 0));
export const MOSQUE_PET_WAIT = MOSQUE_ENTRANCE.clone().add(new THREE.Vector3(0, 0, 1.6));
export const MOSQUE_LESSON_SPOT = MOSQUE_ORIGIN.clone().add(new THREE.Vector3(0.1, 0, -2.35));

export function isInsideMosque(position: THREE.Vector3): boolean {
  return position.x > MOSQUE_ORIGIN.x - 5.05 &&
    position.x < MOSQUE_ORIGIN.x + 4.25 &&
    Math.abs(position.z - MOSQUE_ORIGIN.z) < 4.65;
}

const STAGE_HEIGHT = 0.44;
const MAHYA_TEXT = metin("SemaAndMosqueArea", "ecdadin_mirasi_gelecegin_teminati");

function createLessonSign(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#efe3ca';
  ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = '#3f6157';
  ctx.lineWidth = 7;
  ctx.strokeRect(10, 10, 492, 140);
  ctx.fillStyle = '#254c43';
  ctx.font = 'bold 42px Georgia';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(metin("SemaAndMosqueArea", "siyer_i_nebi_dersi"), 256, 81, 462);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export interface SemaSeatInfo {
  id: string;
  label: string;
  position: THREE.Vector3; // World position where player sits
  standPos: THREE.Vector3; // Clean aisle position when standing up
  yaw: number;
}

interface AudienceSpectator {
  char: ExplorerCharacter;
  clapTimer: number;
  bubbleSprite?: THREE.Sprite;
  bubbleMat?: THREE.SpriteMaterial;
  bubbleTex?: THREE.CanvasTexture;
  bubbleTimer: number;
}

interface MusicNoteParticle {
  sprite: THREE.Sprite;
  baseX: number;
  baseY: number;
  baseZ: number;
  phase: number;
  speed: number;
}

const AUDIENCE_SPEECHES = [
  metin("SemaAndMosqueArea", "semazenlerin_donusu_cok_huzur_verici"),
  metin("SemaAndMosqueArea", "ney_sesi_insanin_ruhunu_dinlendiriyor"),
  metin("SemaAndMosqueArea", "cocuk_korosu_ve_gitar_ne_guzel_eslik"),
  metin("SemaAndMosqueArea", "iki_minare_arasindaki_mahya_yazisi_isil_isil"),
  metin("SemaAndMosqueArea", "ecdadin_mirasi_gelecegin_teminatidir"),
  metin("SemaAndMosqueArea", "muhtesem_bir_tasavvuf_ve_musiki_dinletisi"),
];

function createMahyaTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Subtle dark translucent backing frame so golden bulbs read clearly even in bright daylight
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.beginPath();
    ctx.roundRect(26, 28, canvas.width - 52, canvas.height - 56, 36);
    ctx.fill();

    // Glowing golden outer frame
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.92)';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Decorative bulb dots along top & bottom cables
    for (let x = 70; x <= canvas.width - 70; x += 56) {
      const sag = Math.sin(((x - 70) / (canvas.width - 140)) * Math.PI) * 14;
      [44 + sag * 0.4, canvas.height - 44 - sag * 0.4].forEach((y) => {
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Main Mahya Calligraphy Text with warm amber illumination glow
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 22;
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 84px "Google Sans", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 84px "Google Sans", Georgia, serif';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createStageBannerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 176;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1024, 176);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 1004, 156);

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 46px "Google Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(metin("SemaAndMosqueArea", "sema_sahnesi"), 512, 68);

    ctx.fillStyle = '#bae6fd';
    ctx.font = '600 26px "Google Sans", Arial, sans-serif';
    ctx.fillText(
      metin("SemaAndMosqueArea", "on_sirada_oturabilirsin"),
      512,
      124
    );
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createMusicNoteTexture(glyph: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.beginPath();
    ctx.arc(48, 48, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 42px "Google Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyph, 48, 50);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createAudienceBubbleTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 112;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 480, 112);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 460, 82, 24);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 22px "Google Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 240, 51, 430);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class SemaAndMosqueArea extends xb.Script {
  private disposables: Array<{dispose: () => void}> = [];
  private interactiveMeshes: THREE.Object3D[] = [];
  private wallRects: WallRect[] = [];

  private performers: ExplorerCharacter[] = [];
  private spectators: AudienceSpectator[] = [];
  private openSeats: SemaSeatInfo[] = [];
  private musicNotes: MusicNoteParticle[] = [];

  private stageLights: THREE.PointLight[] = [];
  private mosqueWindowMats: THREE.MeshStandardMaterial[] = [];
  private mosquePeople: ExplorerCharacter[] = [];
  private mahyaMat?: THREE.MeshBasicMaterial;
  private time = 0;

  private track<T extends {dispose: () => void}>(item: T): T {
    this.disposables.push(item);
    return item;
  }

  init(): void {
    this.buildSemaStageAndEnsemble();
    this.buildSpectatorChairsAndAudience();
    this.buildAnatolianMosque();
  }

  private buildSemaStageAndEnsemble(): void {
    const stageGroup = new THREE.Group();
    stageGroup.position.copy(SEMA_STAGE_ORIGIN);

    const trav = getTravertineTextures(3, 2);
    const cobble = getCobblePlazaTextures(6, 6);
    const walnutTex = getWalnutWoodTextures(3, 2);
    const terracotta = getTerracottaRoofTextures(5, 2);

    const plazaMat = this.track(
      new THREE.MeshStandardMaterial({
        map: cobble.map,
        bumpMap: cobble.bumpMap,
        bumpScale: 0.02,
        roughness: 0.82,
      })
    );
    const marbleMat = this.track(
      new THREE.MeshStandardMaterial({
        map: trav.map,
        bumpMap: trav.bumpMap,
        bumpScale: 0.018,
        color: 0xf0e6d6,
        roughness: 0.48,
      })
    );
    const walnutMat = this.track(
      new THREE.MeshStandardMaterial({
        map: walnutTex.map,
        bumpMap: walnutTex.bumpMap,
        bumpScale: 0.015,
        color: 0x7c3f1c,
        roughness: 0.56,
      })
    );
    const carpetMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getIznikTileTexture('emerald', 3, 3),
        roughness: 0.42,
        metalness: 0.1,
      })
    );
    const iznikFriezeMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getIznikTileTexture('turquoise', 8, 1),
        roughness: 0.24,
        metalness: 0.16,
      })
    );
    const goldMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.84,
        roughness: 0.22,
      })
    );

    // Wide Anatolian cobblestone plaza apron around Sema stage & chairs
    const plazaFloor = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(15.6, 0.04, 15.2)),
      plazaMat
    );
    plazaFloor.position.set(0, 0.02, -3.5);
    plazaFloor.receiveShadow = true;
    plazaFloor.name = 'walkable-ground';
    stageGroup.add(plazaFloor);

    // Raised stone & walnut Semahane stage (10.6m x 5.8m, height 0.44m)
    const stageBase = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(10.6, STAGE_HEIGHT, 5.8)),
      marbleMat
    );
    stageBase.position.set(0, STAGE_HEIGHT / 2, 0);
    stageBase.receiveShadow = true;
    stageBase.castShadow = true;

    const woodenDeck = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(10.3, 0.04, 5.5)),
      walnutMat
    );
    woodenDeck.position.set(0, STAGE_HEIGHT + 0.02, 0);
    woodenDeck.receiveShadow = true;

    // Circular İznik-emerald Sema disc + brass ring on Stage Right
    const semaCircle = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(2.35, 2.35, 0.025, 32)),
      carpetMat
    );
    semaCircle.position.set(-2.35, STAGE_HEIGHT + 0.052, 0.1);
    const semaRing = new THREE.Mesh(
      this.track(new THREE.RingGeometry(2.2, 2.34, 32)),
      goldMat
    );
    semaRing.rotation.x = -Math.PI / 2;
    semaRing.position.set(-2.35, STAGE_HEIGHT + 0.068, 0.1);

    // Front central steps
    for (let s = 0; s < 2; s++) {
      const step = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(3.4, 0.22, 0.42)),
        marbleMat
      );
      step.position.set(0, 0.11 + (1 - s) * 0.11, -3.12 - s * 0.36);
      step.receiveShadow = true;
      stageGroup.add(step);
    }

    // Ornate corner fluted Anatolian columns, diagonal knee braces, İznik fascia & Alaturka hip roof
    const braceMat = walnutMat;
    const roofTileMat = this.track(
      new THREE.MeshStandardMaterial({
        map: terracotta.map,
        bumpMap: terracotta.bumpMap,
        bumpScale: 0.025,
        roughness: 0.7,
        metalness: 0.06,
      })
    );
    const domeAccentMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getIznikTileTexture('emerald', 4, 2),
        color: 0x0f766e,
        roughness: 0.32,
        metalness: 0.24,
      })
    );

    const beamY = STAGE_HEIGHT + 4.16;
    [
      [-5.0, -2.65],
      [5.0, -2.65],
      [-5.0, 2.65],
      [5.0, 2.65],
    ].forEach(([cx, cz]) => {
      const col = createAnatolianColumn(
        (item) => this.track(item),
        0.16,
        4.1,
        walnutMat,
        iznikFriezeMat,
        goldMat
      );
      col.position.set(cx, STAGE_HEIGHT, cz);

      // Carved diagonal knee-brace connecting column to roof beam
      const braceX = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(0.11, 0.85, 0.11)),
        braceMat
      );
      braceX.position.set(cx + (cx < 0 ? 0.34 : -0.34), STAGE_HEIGHT + 3.74, cz);
      braceX.rotation.z = cx < 0 ? -0.68 : 0.68;

      stageGroup.add(col, braceX);
    });

    // Four sturdy perimeter architrave beams + pointed Kemer decorative crest under front beam
    const frontBeam = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(10.5, 0.26, 0.28)),
      walnutMat
    );
    frontBeam.position.set(0, beamY, -2.65);
    frontBeam.castShadow = true;

    const backBeam = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(10.5, 0.26, 0.28)),
      walnutMat
    );
    backBeam.position.set(0, beamY, 2.65);

    const leftBeam = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.28, 0.26, 5.6)),
      walnutMat
    );
    leftBeam.position.set(-5.0, beamY, 0);

    const rightBeam = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.28, 0.26, 5.6)),
      walnutMat
    );
    rightBeam.position.set(5.0, beamY, 0);

    // Coffered timber ceiling deck, İznik frieze overhang & gold cornice
    const ceilingDeck = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(11.1, 0.16, 6.2)),
      walnutMat
    );
    ceilingDeck.position.set(0, STAGE_HEIGHT + 4.36, 0);
    ceilingDeck.castShadow = true;

    const eaveTrim = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(11.45, 0.18, 6.55)),
      iznikFriezeMat
    );
    eaveTrim.position.set(0, STAGE_HEIGHT + 4.46, 0);

    // Pitched 4-sided Ottoman/Seljuk Alaturka terracotta hip roof
    const hipRoofGeo = this.track(
      new THREE.CylinderGeometry(0.18, Math.SQRT2 / 2, 1.48, 4)
    );
    hipRoofGeo.rotateY(Math.PI / 4);
    const hipRoof = new THREE.Mesh(hipRoofGeo, roofTileMat);
    hipRoof.scale.set(11.65, 1, 6.75);
    hipRoof.position.set(0, STAGE_HEIGHT + 5.24, 0);
    hipRoof.castShadow = true;

    const ridgeCollar = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(3.1, 0.16, 1.9)),
      goldMat
    );
    ridgeCollar.position.set(0, STAGE_HEIGHT + 5.92, 0);

    // Central roof ridge cupola lantern (fener) + ribbed dome & brass Ottoman Alem finial
    const stageCupola = createRibbedDome(
      (item) => this.track(item),
      1.05,
      0.78,
      domeAccentMat,
      goldMat,
      goldMat,
      {
        ribCount: 8,
        drumHeight: 0.44,
        drumMat: walnutMat,
        alemScale: 0.72,
      }
    );
    stageCupola.position.set(0, STAGE_HEIGHT + 5.98, 0);

    // Rich Anatolian kilim tapestry backdrop on rear stage wall
    const backWall = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(10.0, 2.7, 0.18)),
      this.track(
        new THREE.MeshStandardMaterial({
          map: getAnatolianKilimTexture('navy'),
          roughness: 0.82,
        })
      )
    );
    backWall.position.set(0, STAGE_HEIGHT + 1.35, 2.68);
    backWall.castShadow = true;

    const backWallCrest = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(10.1, 0.16, 0.24)),
      goldMat
    );
    backWallCrest.position.set(0, STAGE_HEIGHT + 2.75, 2.68);

    // Banner suspended directly from the front roof beam via brass rods
    const bannerY = STAGE_HEIGHT + 3.36;
    const bannerTex = this.track(createStageBannerTexture());
    const bannerMesh = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(7.2, 1.24)),
      this.track(
        new THREE.MeshBasicMaterial({map: bannerTex, side: THREE.DoubleSide})
      )
    );
    bannerMesh.position.set(0, bannerY, -2.66);
    bannerMesh.rotation.y = Math.PI; // readable when looking at stage (+Z)

    const bannerFrame = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(7.44, 1.36, 0.12)),
      walnutMat
    );
    bannerFrame.position.set(0, bannerY, -2.58);

    [-2.8, 2.8].forEach((rx) => {
      const rod = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.03, 0.03, 0.24, 8)),
        goldMat
      );
      rod.position.set(rx, STAGE_HEIGHT + 4.02, -2.58);
      stageGroup.add(rod);
    });

    // Warm overhead stage Ottoman Kandil pendant lanterns hung cleanly from the ceiling
    const lanternMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.95,
        roughness: 0.25,
      })
    );
    [-2.4, 2.2].forEach((lx) => {
      const cord = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 8)),
        goldMat
      );
      cord.position.set(lx, STAGE_HEIGHT + 4.1, -0.4);
      const cap = new THREE.Mesh(
        this.track(new THREE.ConeGeometry(0.22, 0.14, 6)),
        goldMat
      );
      cap.position.set(lx, STAGE_HEIGHT + 3.92, -0.4);
      const lamp = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.14, 0.11, 0.26, 6)),
        lanternMat
      );
      lamp.position.set(lx, STAGE_HEIGHT + 3.74, -0.4);
      stageGroup.add(cord, cap, lamp);

      const pt = new THREE.PointLight(0xfde68a, 1.85, 14, 1.6);
      pt.position.set(lx, STAGE_HEIGHT + 3.68, -0.4);
      stageGroup.add(pt);
      this.stageLights.push(pt);
    });

    stageGroup.add(
      stageBase,
      woodenDeck,
      semaCircle,
      semaRing,
      frontBeam,
      backBeam,
      leftBeam,
      rightBeam,
      ceilingDeck,
      eaveTrim,
      hipRoof,
      ridgeCollar,
      stageCupola,
      backWall,
      backWallCrest,
      bannerFrame,
      bannerMesh
    );

    // 1. SIX WHIRLING SEMAZEN on Stage Right (viewer left: local x = -4.0 .. -0.7)
    const semazenSlots: Array<[number, number]> = [
      [-3.75, -1.05],
      [-2.35, -1.35],
      [-0.95, -1.05],
      [-3.55, 0.85],
      [-2.15, 1.25],
      [-0.85, 0.85],
    ];
    semazenSlots.forEach(([sx, sz], idx) => {
      const semazen = new ExplorerCharacter('erkek', idx, 'semazen', true);
      semazen.position.set(sx, STAGE_HEIGHT + 0.05, sz);
      semazen.rotation.y = Math.PI + idx * 0.7;
      semazen.setSpinningSemazen(true);
      semazen.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          obj.userData.worldNpcId = 'sema-ensemble';
          this.interactiveMeshes.push(obj);
        }
      });
      stageGroup.add(semazen);
      this.performers.push(semazen);
    });

    // 2. MUSİKİ ENSEMBLE on Stage Left (viewer right: local x = +1.0 .. +4.3)
    // A) Neyzen playing bamboo Ney (synced with /assets/aistudio/neysesi_edf76f6e.mp3)
    const neyzen = new ExplorerCharacter('erkek', 0, 'neyzen', true);
    neyzen.position.set(1.35, STAGE_HEIGHT + 0.05, -0.55);
    neyzen.rotation.y = 0; // Local -Z front faces audience (-Z)
    this.tagStagePerformer(neyzen, 'sema-ensemble');
    stageGroup.add(neyzen);
    this.performers.push(neyzen);

    // B) Female Vocalist (Kadın Ses Sanatçısı) with mic stand
    const singer = new ExplorerCharacter('kadin', 2, 'singer', true);
    singer.position.set(2.65, STAGE_HEIGHT + 0.05, -0.75);
    singer.rotation.y = 0; // Face audience (-Z)
    this.tagStagePerformer(singer, 'sema-ensemble');
    stageGroup.add(singer);
    this.performers.push(singer);

    // C) 3 Child Choir Singers beside the soloist
    const chorusSpecs: Array<{
      style: CharacterStyleId;
      variant: number;
      x: number;
      z: number;
    }> = [
      {style: 'kadin', variant: 0, x: 1.75, z: 0.95},
      {style: 'erkek', variant: 1, x: 2.65, z: 1.1},
      {style: 'kadin', variant: 3, x: 3.55, z: 0.95},
    ];
    chorusSpecs.forEach((cs) => {
      const kid = new ExplorerCharacter(cs.style, cs.variant, 'chorus', true);
      kid.position.set(cs.x, STAGE_HEIGHT + 0.05, cs.z);
      kid.rotation.y = 0; // Face audience (-Z)
      this.tagStagePerformer(kid, 'sema-ensemble');
      stageGroup.add(kid);
      this.performers.push(kid);
    });

    // D) Acoustic Guitarist
    const guitarist = new ExplorerCharacter('erkek', 3, 'guitarist', true);
    guitarist.position.set(4.0, STAGE_HEIGHT + 0.05, -0.45);
    guitarist.rotation.y = 0; // Face audience (-Z)
    this.tagStagePerformer(guitarist, 'sema-ensemble');
    stageGroup.add(guitarist);
    this.performers.push(guitarist);

    // Floating musical notes over the music ensemble
    const noteGlyphs = ['🎵', '🎶', '✨', '🎼'];
    const noteTextures = noteGlyphs.map((g) =>
      this.track(createMusicNoteTexture(g))
    );
    for (let i = 0; i < 6; i++) {
      const mat = this.track(
        new THREE.SpriteMaterial({
          map: noteTextures[i % noteTextures.length],
          transparent: true,
          opacity: 0.85,
        })
      );
      const sp = new THREE.Sprite(mat);
      const bx = 1.2 + (i % 4) * 0.9;
      const bz = -0.3 + Math.floor(i / 4) * 0.8;
      const by = STAGE_HEIGHT + 1.85;
      sp.position.set(bx, by, bz);
      sp.scale.set(0.36, 0.36, 1);
      stageGroup.add(sp);
      this.musicNotes.push({
        sprite: sp,
        baseX: bx,
        baseY: by,
        baseZ: bz,
        phase: i * 1.1,
        speed: 0.9 + (i % 3) * 0.25,
      });
    }

    this.add(stageGroup);

    // Stage solid perimeter collider
    this.wallRects.push({
      minX: SEMA_STAGE_ORIGIN.x - 5.35,
      maxX: SEMA_STAGE_ORIGIN.x + 5.35,
      minZ: SEMA_STAGE_ORIGIN.z - 3.35,
      maxZ: SEMA_STAGE_ORIGIN.z + 2.95,
    });
  }

  private tagStagePerformer(char: ExplorerCharacter, id: string): void {
    char.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.userData.worldNpcId = id;
        this.interactiveMeshes.push(obj);
      }
    });
  }

  private buildSpectatorChairsAndAudience(): void {
    const woodMat = this.track(
      new THREE.MeshStandardMaterial({color: 0x78350f, roughness: 0.58})
    );
    const velvetMat = this.track(
      new THREE.MeshStandardMaterial({color: 0x0f766e, roughness: 0.72})
    );
    const openVelvetMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xd97706,
        emissive: 0xb45309,
        emissiveIntensity: 0.25,
        roughness: 0.48,
      })
    );

    const rowZ = [29.3, 27.5, 25.7];
    const colX = [-28.5, -26.2, -23.8, -21.5];

    // 4 Open seats for the Player (marked clearly so player can click or press E to sit!)
    const openIndices = new Set(['0-1', '0-2', '1-2', '2-1']);
    const seatNames = [
      metin("SemaAndMosqueArea", "on_sira_sol_koltuk"),
      metin("SemaAndMosqueArea", "on_sira_sag_koltuk"),
      metin("SemaAndMosqueArea", "orta_sira_koltuk"),
      metin("SemaAndMosqueArea", "arka_sira_koltuk"),
    ];
    let openCounter = 0;

    const legGeo = this.track(new THREE.BoxGeometry(0.08, 0.42, 0.08));
    const seatGeo = this.track(new THREE.BoxGeometry(0.68, 0.1, 0.62));
    const backGeo = this.track(new THREE.BoxGeometry(0.68, 0.58, 0.1));
    const armGeo = this.track(new THREE.BoxGeometry(0.08, 0.24, 0.54));

    rowZ.forEach((wz, rIdx) => {
      colX.forEach((wx, cIdx) => {
        const key = `${rIdx}-${cIdx}`;
        const isOpen = openIndices.has(key);

        const chair = new THREE.Group();
        chair.position.set(wx, 0, wz);
        // ExplorerCharacter local front is -Z, so rotation.y = PI faces +Z (the Sema stage!)
        chair.rotation.y = Math.PI;

        const seatMesh = new THREE.Mesh(
          seatGeo,
          isOpen ? openVelvetMat : velvetMat
        );
        seatMesh.position.set(0, 0.44, 0);
        seatMesh.castShadow = true;
        seatMesh.receiveShadow = true;

        const backMesh = new THREE.Mesh(
          backGeo,
          isOpen ? openVelvetMat : velvetMat
        );
        backMesh.position.set(0, 0.72, 0.27);
        backMesh.castShadow = true;

        const lArm = new THREE.Mesh(armGeo, woodMat);
        lArm.position.set(-0.32, 0.56, 0.02);
        const rArm = new THREE.Mesh(armGeo, woodMat);
        rArm.position.set(0.32, 0.56, 0.02);

        [
          [-0.28, -0.24],
          [0.28, -0.24],
          [-0.28, 0.24],
          [0.28, 0.24],
        ].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(legGeo, woodMat);
          leg.position.set(lx, 0.21, lz);
          leg.castShadow = true;
          chair.add(leg);
        });

        chair.add(seatMesh, backMesh, lArm, rArm);

        if (isOpen) {
          const seatId = `sema-seat-${openCounter}`;
          const seatLabel = seatNames[openCounter % seatNames.length];
          openCounter++;

          [seatMesh, backMesh, lArm, rArm].forEach((m) => {
            m.userData.semaSeatId = seatId;
            this.interactiveMeshes.push(m);
          });


          this.openSeats.push({
            id: seatId,
            label: seatLabel,
            position: new THREE.Vector3(wx, 0, wz - 0.04),
            standPos: new THREE.Vector3(wx, 0, wz - 0.78),
            yaw: Math.PI,
          });
        } else {
          // Seated Spectator NPC watching & clapping!
          const gender: CharacterStyleId =
            (rIdx + cIdx) % 2 === 0 ? 'kadin' : 'erkek';
          const spectator = new ExplorerCharacter(
            gender,
            (rIdx * 4 + cIdx) % 4,
            (rIdx + cIdx) % 3 === 0 ? 'anatolian' : 'culture',
            true
          );
          spectator.position.set(wx, 0, wz - 0.04);
          spectator.rotation.y = Math.PI;
          spectator.setSitting(true);
          this.add(spectator);

          const bubbleMat = this.track(
            new THREE.SpriteMaterial({transparent: true, opacity: 0})
          );
          const bubbleSprite = new THREE.Sprite(bubbleMat);
          bubbleSprite.position.set(wx, 1.92, wz);
          bubbleSprite.scale.set(2.35, 0.55, 1);
          bubbleSprite.visible = false;
          this.add(bubbleSprite);

          this.spectators.push({
            char: spectator,
            clapTimer: Math.random() * 6,
            bubbleSprite,
            bubbleMat,
            bubbleTimer: 1.5 + Math.random() * 5,
          });
        }

        this.add(chair);
        // Compact collider per chair so player walks nicely through aisles
        this.wallRects.push({
          minX: wx - 0.36,
          maxX: wx + 0.36,
          minZ: wz - 0.34,
          maxZ: wz + 0.34,
        });
      });
    });
  }

  private buildAnatolianMosque(): void {
    const mosque = new THREE.Group();
    mosque.position.copy(MOSQUE_ORIGIN);
    // +Z local front faces +X (toward Sema Plaza & courtyard!)
    mosque.rotation.y = Math.PI / 2;

    const trav = getTravertineTextures(4, 3);
    const walnutTex = getWalnutWoodTextures(2, 2);
    const stoneMat = this.track(
      new THREE.MeshStandardMaterial({
        map: trav.map,
        bumpMap: trav.bumpMap,
        bumpScale: 0.025,
        color: 0xf0e6d6,
        roughness: 0.72,
      })
    );
    const trimStoneMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getMarbleInlayTexture(3, 3),
        color: 0xdccab0,
        roughness: 0.56,
      })
    );
    const leadDomeMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getLeadDomeTexture(8, 3),
        roughness: 0.36,
        metalness: 0.62,
      })
    );
    const goldMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.86,
        roughness: 0.2,
      })
    );
    const woodDoorMat = this.track(
      new THREE.MeshStandardMaterial({
        map: walnutTex.map,
        bumpMap: walnutTex.bumpMap,
        bumpScale: 0.015,
        color: 0x5c3419,
        roughness: 0.56,
      })
    );
    const iznikCobaltMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getIznikTileTexture('cobalt', 2, 3),
        roughness: 0.24,
        metalness: 0.16,
      })
    );
    const iznikTurquoiseMat = this.track(
      new THREE.MeshStandardMaterial({
        map: getIznikTileTexture('turquoise', 2, 1),
        roughness: 0.24,
        metalness: 0.16,
      })
    );
    const glassMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0xfbbf24,
        emissiveIntensity: 0.28,
        roughness: 0.22,
      })
    );
    this.mosqueWindowMats.push(glassMat);

    // Cut-stone stepped plinth
    const plinth = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(11.4, 0.04, 11.4)),
      trimStoneMat
    );
    plinth.position.set(0, 0.02, 0);
    plinth.receiveShadow = true;

    const box = (w: number, h: number, d: number, x: number, y: number, z: number, material = stoneMat) => {
      const mesh = new THREE.Mesh(this.track(new THREE.BoxGeometry(w, h, d)), material);
      mesh.position.set(x, y, z);
      mesh.receiveShadow = true;
      mosque.add(mesh);
      return mesh;
    };
    const wall = (w: number, d: number, x: number, z: number) => {
      box(w, 6.7, d, x, 3.35, z).castShadow = true;
      this.wallRects.push({
        minX: MOSQUE_ORIGIN.x + z - d / 2, maxX: MOSQUE_ORIGIN.x + z + d / 2,
        minZ: MOSQUE_ORIGIN.z - x - w / 2, maxZ: MOSQUE_ORIGIN.z - x + w / 2,
      });
    };
    wall(0.35, 10, -4.83, -0.4);
    wall(0.35, 10, 4.83, -0.4);
    wall(10, 0.35, 0, -5.22);
    wall(3.85, 0.35, -3.075, 4.43);
    wall(3.85, 0.35, 3.075, 4.43);
    box(2.3, 3.05, 0.35, 0, 5.175, 4.43);
    box(10, 0.25, 10, 0, 6.7, -0.4);

    // Exterior upper İznik cornice & Ablaq gold band
    box(10.22, 0.38, 10.22, 0, 6.45, -0.4, iznikTurquoiseMat);

    // Prayer Hall Woven Carpet with crisp prayer rows
    const carpet = this.track(
      new THREE.MeshStandardMaterial({
        map: getAnatolianKilimTexture('turquoise'),
        roughness: 0.92,
      })
    );
    box(8.3, 0.03, 8.4, 0, 0.055, -0.55, carpet);
    for (const z of [-4.45, -3.05, -1.65, -0.25, 1.15, 2.55, 3.65]) {
      box(7.85, 0.008, 0.04, 0, 0.072, z, goldMat);
    }

    // Qibla wall pointed Kemer arches & İznik ceramic Mihrab niche
    const archMat = iznikCobaltMat;
    const qiblaArchGeo = this.track(createPointedArchGeometry(1.9, 1.15, 1.55, 0.2, 1.0, 0.12));
    for (const x of [-2.85, 0, 2.85]) {
      const arch = new THREE.Mesh(qiblaArchGeo, x === 0 ? goldMat : archMat);
      arch.position.set(x, 2.38, -5.0);
      mosque.add(arch);
      for (const side of [-1, 1]) box(0.13, 2.38, 0.1, x + side * 0.84, 1.21, -5.0, archMat);
    }
    box(9.6, 0.15, 0.1, 0, 3.72, -5.0, iznikTurquoiseMat);

    // Cobalt İznik ceramic Mihrab backing & Seljuk star calligraphy medallions
    box(1.53, 2.35, 0.06, 0, 1.24, -4.99, iznikCobaltMat);
    const rosetteGeo = this.track(createSeljukStarGeometry(0.42, 0.22, 0.04));
    for (const rx of [-2.85, 2.85]) {
      const rosette = new THREE.Mesh(rosetteGeo, goldMat);
      rosette.position.set(rx, 4.45, -5.0);
      mosque.add(rosette);
    }

    for (const side of [-1, 1]) {
      for (const z of [-3, 0, 3]) {
        box(0.055, 1.35, 0.72, 4.63 * side, 2.62, z, trimStoneMat);
        box(0.06, 1.15, 0.56, 4.59 * side, 2.62, z, glassMat);
        box(0.065, 1.2, 0.034, 4.55 * side, 2.62, z, woodDoorMat);
        box(0.065, 0.034, 0.6, 4.55 * side, 2.62, z, woodDoorMat);
      }
    }

    // Carved Walnut Minber pulpit with side railing & conical finial canopy
    for (let i = 0; i < 5; i++) {
      const height = (i + 1) * 0.22;
      box(0.86, height, 0.34, -2.7, height / 2 + 0.05, -2.95 - i * 0.32, woodDoorMat);
    }
    const minberCanopyPosts = [-3.05, -2.35];
    minberCanopyPosts.forEach((px) => {
      box(0.07, 1.35, 0.07, px, 1.75, -4.45, woodDoorMat);
    });
    const minberCone = new THREE.Mesh(
      this.track(new THREE.ConeGeometry(0.54, 0.85, 6)),
      goldMat
    );
    minberCone.position.set(-2.7, 2.8, -4.35);
    mosque.add(minberCone);

    // Suspended Circular Ottoman Avize Chandelier
    const chandelier = new THREE.Mesh(this.track(new THREE.TorusGeometry(1.65, 0.05, 8, 32)), goldMat);
    chandelier.rotation.x = -Math.PI / 2;
    chandelier.position.set(-1, 4.28, -0.72);
    mosque.add(chandelier);
    const innerAvize = new THREE.Mesh(this.track(new THREE.TorusGeometry(0.75, 0.035, 6, 24)), goldMat);
    innerAvize.rotation.x = -Math.PI / 2;
    innerAvize.position.set(-1, 4.1, -0.72);
    mosque.add(innerAvize);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = -1 + 1.65 * Math.cos(angle);
      const z = -0.72 + 1.65 * Math.sin(angle);
      box(0.14, 0.18, 0.14, x, 4.38, z, glassMat);
      if (i % 2 === 0) box(0.025, 2.24, 0.025, x, 5.41, z, goldMat);
    }

    // Reading alcove at the side of the hall (keeps lesson reader/book/sign intact!)
    const lessonRug = this.track(
      new THREE.MeshStandardMaterial({
        map: getAnatolianKilimTexture('crimson'),
        roughness: 0.94,
      })
    );
    box(2.95, 0.016, 4.55, 2.64, 0.081, -1.45, lessonRug);
    for (const z of [-3.63, 0.73]) box(2.83, 0.008, 0.06, 2.64, 0.093, z, goldMat);
    for (const x of [1.23, 4.05]) box(0.06, 0.008, 4.42, x, 0.093, -1.45, goldMat);
    for (const z of [-3.7, -2.85, 0.38, 1.18]) box(0.09, 1.47, 0.13, 1.07, 0.78, z, woodDoorMat);
    for (const z of [-3.275, 0.78]) {
      box(0.07, 0.075, 0.84, 1.07, 0.72, z, woodDoorMat);
      box(0.07, 0.075, 0.84, 1.07, 1.49, z, woodDoorMat);
      for (let i = -2; i <= 2; i++) box(0.065, 0.75, 0.044, 1.07, 1.11, z + i * 0.13, woodDoorMat);
    }
    box(1.4, 0.85, 0.31, 3.6, 0.48, -4.7, woodDoorMat);
    for (const y of [0.28, 0.57, 0.88]) box(1.45, 0.055, 0.38, 3.6, y, -4.57, trimStoneMat);
    for (let i = 0; i < 7; i++) box(0.12, 0.22, 0.23, 3.08 + i * 0.17, 0.71, -4.53, i % 2 ? iznikCobaltMat : carpet);

    const reader = box(0.88, 0.52, 0.43, 2.53, 0.31, -2.68, woodDoorMat);
    const book = box(0.44, 0.044, 0.30, 2.53, 0.605, -2.68, trimStoneMat);
    book.rotation.x = -0.13;
    book.userData.siyerLesson = true;
    reader.userData.siyerLesson = true;
    this.interactiveMeshes.push(reader, book);
    const lecternSign = this.track(createLessonSign());
    const signMat = this.track(new THREE.MeshBasicMaterial({map: lecternSign, side: THREE.DoubleSide}));
    const sign = new THREE.Mesh(this.track(new THREE.PlaneGeometry(1.95, 0.62)), signMat);
    sign.position.set(2.60, 1.83, -3.80);
    sign.userData.siyerLesson = true;
    mosque.add(sign);
    this.interactiveMeshes.push(sign);
    const imam = new ExplorerCharacter('erkek', 1, 'imam', true);
    imam.position.set(2.53, 0.06, -3.25);
    imam.rotation.y = Math.PI;
    imam.setFloorSitting();
    mosque.add(imam);
    this.mosquePeople.push(imam);
    const learners: Array<[CharacterStyleId, number, number, number]> = [
      ['kadin', 0, 1.82, -1.67], ['erkek', 2, 2.82, -1.65],
      ['erkek', 0, 1.98, -0.64], ['kadin', 3, 3.13, -0.66],
    ];
    for (const [style, variant, x, z] of learners) {
      const learner = new ExplorerCharacter(style, variant, 'anatolian', true);
      learner.scale.setScalar(0.71);
      learner.position.set(x, 0.075, z);
      learner.setFloorSitting();
      mosque.add(learner);
      this.mosquePeople.push(learner);
      box(0.25, 0.036, 0.2, x, 0.115, z - 0.38, trimStoneMat);
    }
    const hallLight = new THREE.PointLight(0xffe4bd, 30, 10, 2);
    hallLight.position.set(0, 4.6, -0.6);
    mosque.add(hallLight);

    // Grand Ribbed Ottoman Lead Dome + Clerestory Drum + Crescent Alem
    const mainDomeGroup = createRibbedDome(
      (item) => this.track(item),
      4.38,
      0.92,
      leadDomeMat,
      trimStoneMat,
      goldMat,
      {
        ribCount: 16,
        drumHeight: 1.45,
        drumMat: stoneMat,
        windowMat: glassMat,
        drumWindows: 12,
        alemScale: 1.4,
      }
    );
    mainDomeGroup.position.set(0, 6.72, -0.4);
    mosque.add(mainDomeGroup);

    // 4 Corner Ribbed Lead Cupolas with miniature Alems
    [
      [-3.8, -4.2],
      [3.8, -4.2],
      [-3.8, 3.4],
      [3.8, 3.4],
    ].forEach(([cx, cz]) => {
      const smallDome = createRibbedDome(
        (item) => this.track(item),
        1.15,
        0.92,
        leadDomeMat,
        trimStoneMat,
        goldMat,
        {ribCount: 8, alemScale: 0.55}
      );
      smallDome.position.set(cx, 6.72, cz);
      mosque.add(smallDome);
    });

    // Front Entrance Revak (3-pointed Kemer arches + fluted Anatolian columns + lead cupolas)
    const porticoRoof = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(7.2, 0.45, 2.2)),
      trimStoneMat
    );
    porticoRoof.position.set(0, 4.35, 5.2);
    [-2.8, -1.0, 1.0, 2.8].forEach((px) => {
      const col = createAnatolianColumn(
        (item) => this.track(item),
        0.18,
        4.15,
        stoneMat,
        iznikTurquoiseMat,
        goldMat
      );
      col.position.set(px, 0.04, 6.0);
      mosque.add(col);
    });
    const revakArchGeo = this.track(createPointedArchGeometry(1.9, 1.05, 1.55, 0.15, 0.9, 0.24));
    [-1.9, 0, 1.9].forEach((dx) => {
      const arch = new THREE.Mesh(revakArchGeo, dx === 0 ? iznikCobaltMat : trimStoneMat);
      arch.position.set(dx, 3.12, 6.0);
      mosque.add(arch);

      const smallPorticoDome = createRibbedDome(
        (item) => this.track(item),
        0.86,
        0.88,
        leadDomeMat,
        trimStoneMat,
        goldMat,
        {ribCount: 6, alemScale: 0.45}
      );
      smallPorticoDome.position.set(dx, 4.55, 5.2);
      mosque.add(smallPorticoDome);
    });

    for (const x of [-1.18, 1.18]) box(0.14, 3.66, 0.26, x, 1.83, 4.64, woodDoorMat);
    box(2.5, 0.18, 0.28, 0, 3.59, 4.64, goldMat);

    const doorSteps = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(4.4, 0.04, 0.9)),
      trimStoneMat
    );
    doorSteps.position.set(0, 0.02, 6.15);

    // Side Arched Windows on exterior walls
    const winGeo = this.track(new THREE.BoxGeometry(0.95, 1.85, 0.12));
    const winArchGeo = this.track(createPointedArchGeometry(1.15, 0.55, 0.88, 0.08, 0.46, 0.14));
    [-2.6, 0, 2.6].forEach((wz) => {
      [-5.02, 5.02].forEach((wx) => {
        const w = new THREE.Mesh(winGeo, glassMat);
        w.rotation.y = Math.PI / 2;
        w.position.set(wx, 3.3, wz - 0.4);
        const a = new THREE.Mesh(winArchGeo, trimStoneMat);
        a.rotation.y = Math.PI / 2;
        a.position.set(wx, 4.05, wz - 0.4);
        mosque.add(w, a);
      });
    });

    mosque.add(
      plinth,
      porticoRoof,
      doorSteps
    );

    // TWO TALL MINARETS (Minare 1 & Minare 2) flanking front facade (+Z = +5.6)
    const minaretXOffsets = [-5.6, 5.6];
    const minaretZ = 5.6;

    minaretXOffsets.forEach((mx) => {
      const mGrp = new THREE.Group();
      mGrp.position.set(mx, 0, minaretZ);

      // Cut-stone Kürsü + chamfered Turkish triangle transition
      const base = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(1.65, 3.2, 1.65)),
        stoneMat
      );
      base.position.y = 1.6;
      base.castShadow = true;

      const baseRing = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(1.78, 0.22, 1.78)),
        iznikTurquoiseMat
      );
      baseRing.position.y = 3.16;

      const transitionCone = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.68, 0.98, 1.1, 8)),
        trimStoneMat
      );
      transitionCone.position.y = 3.75;

      // Tall Fluted Stone Shaft (Gövde)
      const shaft = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.58, 0.68, 9.2, 16)),
        stoneMat
      );
      shaft.position.y = 8.9;
      shaft.castShadow = true;

      // 1st Şerefe Balcony (y = 10.0) & 2nd Şerefe Balcony (y = 13.6) with İznik parapet collar
      [10.0, 13.6].forEach((sy) => {
        const balcony = new THREE.Mesh(
          this.track(new THREE.CylinderGeometry(1.0, 0.62, 0.5, 16)),
          trimStoneMat
        );
        balcony.position.y = sy;
        const rail = new THREE.Mesh(
          this.track(new THREE.CylinderGeometry(0.98, 0.98, 0.36, 16, 1, true)),
          goldMat
        );
        rail.position.y = sy + 0.38;
        mGrp.add(balcony, rail);
      });

      // Upper Petek Shaft
      const petek = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.5, 0.56, 2.2, 16)),
        stoneMat
      );
      petek.position.y = 14.9;

      // Conical Lead Spire (Külah) + Brass Ottoman Alem finial
      const kulah = new THREE.Mesh(
        this.track(new THREE.ConeGeometry(0.56, 2.8, 16)),
        leadDomeMat
      );
      kulah.position.y = 17.4;

      const minaretAlem = createOttomanAlem((item) => this.track(item), 1.05, goldMat);
      minaretAlem.position.y = 18.75;

      mGrp.add(base, baseRing, transitionCone, shaft, petek, kulah, minaretAlem);
      mosque.add(mGrp);
    });

    // ILLUMINATED MAHYA BANNER STRUNG BETWEEN THE TWO MINARETS!
    // Spans x = -5.4 .. +5.4 at z = +5.6, y = 13.85 (between upper şerefe balconies)
    const cableMat = this.track(
      new THREE.MeshBasicMaterial({color: 0x0f172a})
    );
    const bulbMat = this.track(
      new THREE.MeshBasicMaterial({color: 0xfef08a})
    );
    const bulbGeo = this.track(new THREE.SphereGeometry(0.065, 8, 8));

    [14.55, 13.05].forEach((cableY) => {
      const curvePts: THREE.Vector3[] = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        const x = THREE.MathUtils.lerp(-5.45, 5.45, t);
        const sag = Math.sin(t * Math.PI) * 0.26;
        curvePts.push(new THREE.Vector3(x, cableY - sag, minaretZ));
      }
      const curve = new THREE.CatmullRomCurve3(curvePts);
      const cableGeo = this.track(new THREE.TubeGeometry(curve, 20, 0.025, 6, false));
      mosque.add(new THREE.Mesh(cableGeo, cableMat));

      for (let b = 1; b < 16; b++) {
        const p = curve.getPoint(b / 16);
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.copy(p);
        mosque.add(bulb);
      }
    });

    const mahyaTex = this.track(createMahyaTexture(MAHYA_TEXT));
    this.mahyaMat = this.track(
      new THREE.MeshBasicMaterial({
        map: mahyaTex,
        transparent: true,
        side: THREE.DoubleSide,
      })
    );
    const mahyaBanner = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(9.6, 1.4)),
      this.mahyaMat
    );
    mahyaBanner.position.set(0, 13.78, minaretZ);
    mahyaBanner.userData.easterEggId = 'anatolian-mosque';
    this.interactiveMeshes.push(mahyaBanner);
    mosque.add(mahyaBanner);

    this.add(mosque);

    // Both minaret bases (accounting for Ry(+PI/2)).
    this.wallRects.push(
      // Minaret 1 base at local (-5.6, +5.6) -> world (-31.4, 27.1)
      {
        minX: MOSQUE_ORIGIN.x + 4.5,
        maxX: MOSQUE_ORIGIN.x + 6.7,
        minZ: MOSQUE_ORIGIN.z + 4.5,
        maxZ: MOSQUE_ORIGIN.z + 6.7,
      },
      // Minaret 2 base at local (+5.6, +5.6) -> world (-31.4, 15.9)
      {
        minX: MOSQUE_ORIGIN.x + 4.5,
        maxX: MOSQUE_ORIGIN.x + 6.7,
        minZ: MOSQUE_ORIGIN.z - 6.7,
        maxZ: MOSQUE_ORIGIN.z - 4.5,
      }
    );
  }

  getWallRects(): WallRect[] {
    return this.wallRects;
  }

  getInteractiveMeshes(): THREE.Object3D[] {
    return this.interactiveMeshes;
  }

  getStageOrigin(): THREE.Vector3 {
    return SEMA_STAGE_ORIGIN;
  }

  getSeatById(seatId: string): SemaSeatInfo | null {
    return this.openSeats.find((s) => s.id === seatId) ?? null;
  }

  findNearestSeat(playerPos: THREE.Vector3, maxDist = 2.4): SemaSeatInfo | null {
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

  private setAudienceBubble(spec: AudienceSpectator, text: string): void {
    if (!spec.bubbleSprite || !spec.bubbleMat) return;
    spec.bubbleTex?.dispose();
    const tex = createAudienceBubbleTexture(text);
    spec.bubbleTex = tex;
    spec.bubbleMat.map = tex;
    spec.bubbleMat.opacity = 1;
    spec.bubbleMat.needsUpdate = true;
    spec.bubbleSprite.visible = true;
  }

  updateWithPlayer(
    dt: number,
    playerPos: THREE.Vector3,
    nightFactor: number,
    semaMusicAudible: boolean
  ): void {
    const safeDt = Math.min(dt, 0.05);
    this.time += safeDt;
    if (isInsideMosque(playerPos)) {
      for (const person of this.mosquePeople) person.update();
    }

    for (const perf of this.performers) {
      perf.update();
    }

    // Floating musical notes gently rise above Ney & choir when music plays
    for (const n of this.musicNotes) {
      n.phase += safeDt * n.speed;
      const cycle = n.phase % 1.0;
      n.sprite.visible = semaMusicAudible;
      n.sprite.position.set(
        n.baseX + Math.sin(this.time * 2 + n.phase * 4) * 0.22,
        n.baseY + cycle * 1.15,
        n.baseZ + Math.cos(this.time * 1.6 + n.phase * 3) * 0.16
      );
      (n.sprite.material as THREE.SpriteMaterial).opacity =
        cycle < 0.2 ? cycle / 0.2 : 1 - (cycle - 0.2) / 0.8;
    }

    // Audience spectators clap periodically & share appreciative bubbles when nearby
    const distToStage = Math.hypot(
      playerPos.x - SEMA_STAGE_ORIGIN.x,
      playerPos.z - (SEMA_STAGE_ORIGIN.z - 5.5)
    );
    const showAudienceBubbles = distToStage < 15.0;

    for (let i = 0; i < this.spectators.length; i++) {
      const spec = this.spectators[i];
      spec.clapTimer -= safeDt;
      if (spec.clapTimer <= 0) {
        // Alternate between calm watching and warm applause
        const shouldClap = Math.random() < 0.42;
        spec.char.setClapping(shouldClap);
        spec.clapTimer = shouldClap ? 2.8 + Math.random() * 2.0 : 4.5 + Math.random() * 5.0;
      }

      if (spec.bubbleSprite && spec.bubbleMat) {
        if (!showAudienceBubbles) {
          spec.bubbleSprite.visible = false;
        } else {
          spec.bubbleTimer -= safeDt;
          if (spec.bubbleTimer <= 0) {
            const msg =
              AUDIENCE_SPEECHES[
                (i + Math.floor(this.time)) % AUDIENCE_SPEECHES.length
              ];
            this.setAudienceBubble(spec, msg);
            spec.bubbleTimer = 8.0 + Math.random() * 6.0;
          }
        }
      }

      spec.char.update();
    }

    // Night illumination glow for Mosque windows, Minaret şerefeler & Stage lights
    const winIntensity = 0.22 + nightFactor * 1.25;
    for (const m of this.mosqueWindowMats) {
      m.emissiveIntensity = winIntensity;
    }
    const stagePower = 1.3 + nightFactor * 2.0;
    for (const l of this.stageLights) {
      l.intensity = stagePower;
    }
  }

  dispose(): void {
    this.mosquePeople.forEach((person) => person.dispose());
    for (const perf of this.performers) {
      perf.dispose();
    }
    for (const spec of this.spectators) {
      spec.char.dispose();
      spec.bubbleTex?.dispose();
    }
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
