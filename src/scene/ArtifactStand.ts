import * as THREE from 'three';
import * as xb from 'xrblocks';

import type {ArtifactItem} from '../types.ts';
import {
  createSeljukStarGeometry,
  getIznikTileTexture,
  getTravertineTextures,
} from '../utils/anatolianMaterials.ts';
import {DEVICE_QUALITY} from '../utils/deviceQuality.ts';

export type StandLodTier = 'placeholder' | 'low' | 'high';

const sharedLoader = new THREE.TextureLoader();
sharedLoader.setCrossOrigin('anonymous');

function createPlaqueTexture(
  index: number,
  title: string,
  collectionShort: string,
  accentHex: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = DEVICE_QUALITY.isMobile ? 512 : 640;
  canvas.height = DEVICE_QUALITY.isMobile ? 128 : 160;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    if (DEVICE_QUALITY.isMobile) {
      ctx.scale(512 / 640, 128 / 160);
    }
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(6, 6, 628, 148, 22);
    ctx.fill();

    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = accentHex;
    ctx.beginPath();
    ctx.roundRect(22, 24, 96, 112, 16);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 44px "Google Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`#${String(index).padStart(2, '0')}`, 70, 82);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 30px "Google Sans", Arial, sans-serif';
    ctx.textAlign = 'left';
    const shortTitle =
      title.length > 27 ? `${title.slice(0, 25).trim()}…` : title;
    ctx.fillText(shortTitle, 136, 58);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 23px "Google Sans", Arial, sans-serif';
    ctx.fillText(collectionShort, 136, 108);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = DEVICE_QUALITY.maxAnisotropy;
  return tex;
}

function createBlurredPlaceholderTexture(
  index: number,
  accentHex: string
): THREE.CanvasTexture {
  // Very low-res (64x64) blurred painterly placeholder kept in memory when off-screen or far
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 64, 64);
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(0.55, '#334155');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    // Soft blurred color wash evocative of a painting silhouette
    ctx.globalAlpha = 0.45;
    const rad = ctx.createRadialGradient(
      24 + (index % 3) * 8,
      24 + (index % 2) * 8,
      4,
      32,
      32,
      34
    );
    rad.addColorStop(0, accentHex);
    rad.addColorStop(0.65, '#94a3b8');
    rad.addColorStop(1, 'transparent');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, 64, 64);

    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 3;
    ctx.strokeRect(3, 3, 58, 58);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

interface SharedStandResources {
  ringGeo: THREE.RingGeometry;
  plinthBaseGeo: THREE.BoxGeometry;
  postGeo: THREE.CylinderGeometry;
  iznikBandGeo: THREE.CylinderGeometry;
  collarGeo: THREE.BoxGeometry;
  lampNeckGeo: THREE.CylinderGeometry;
  lampHoodGeo: THREE.CylinderGeometry;
  starGeo: THREE.BufferGeometry;
  sparkleGeo: THREE.OctahedronGeometry;
  questHaloGeo: THREE.TorusGeometry;
  plinthMat: THREE.MeshStandardMaterial;
  iznikTurquoiseMat: THREE.MeshStandardMaterial;
  iznikCobaltMat: THREE.MeshStandardMaterial;
  brassMat: THREE.MeshStandardMaterial;
  matBoardMat: THREE.MeshStandardMaterial;
  starUndiscoveredMat: THREE.MeshStandardMaterial;
  starDiscoveredMat: THREE.MeshStandardMaterial;
  starQuestMat: THREE.MeshStandardMaterial;
  questHaloMat: THREE.MeshBasicMaterial;
  sparkleMats: THREE.MeshBasicMaterial[];
  outerMats: Map<number, THREE.MeshStandardMaterial>;
}

let sharedStandRes: SharedStandResources | null = null;

function getSharedStandResources(): SharedStandResources {
  if (sharedStandRes) return sharedStandRes;
  const travTex = getTravertineTextures(1, 2);
  const sparkleColors = [0xfde047, 0x38bdf8, 0xfbbf24, 0xf472b6, 0xfde047, 0x34d399];

  sharedStandRes = {
    ringGeo: new THREE.RingGeometry(0.68, 0.86, 28),
    plinthBaseGeo: new THREE.BoxGeometry(0.88, 0.14, 0.52),
    postGeo: new THREE.CylinderGeometry(0.135, 0.165, 1.05, 8),
    iznikBandGeo: new THREE.CylinderGeometry(0.155, 0.155, 0.14, 8),
    collarGeo: new THREE.BoxGeometry(0.4, 0.07, 0.3),
    lampNeckGeo: new THREE.CylinderGeometry(0.015, 0.015, 0.24, 8),
    lampHoodGeo: new THREE.CylinderGeometry(0.032, 0.032, 0.34, 10),
    starGeo: createSeljukStarGeometry(0.115, 0.065, 0.04),
    sparkleGeo: new THREE.OctahedronGeometry(0.072, 0),
    questHaloGeo: new THREE.TorusGeometry(0.32, 0.025, 8, 24),
    plinthMat: new THREE.MeshStandardMaterial({
      map: travTex.map,
      bumpMap: travTex.bumpMap,
      bumpScale: 0.014,
      roughness: 0.62,
    }),
    iznikTurquoiseMat: new THREE.MeshStandardMaterial({
      map: getIznikTileTexture('turquoise', 2, 1),
      roughness: 0.32,
    }),
    iznikCobaltMat: new THREE.MeshStandardMaterial({
      map: getIznikTileTexture('cobalt', 2, 1),
      roughness: 0.32,
    }),
    brassMat: new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.82,
      roughness: 0.24,
    }),
    matBoardMat: new THREE.MeshStandardMaterial({
      color: 0xfaf5e8,
      roughness: 0.88,
    }),
    starUndiscoveredMat: new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.78,
      roughness: 0.24,
    }),
    starDiscoveredMat: new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xb45309,
      emissiveIntensity: 0.9,
      metalness: 0.78,
      roughness: 0.24,
    }),
    starQuestMat: new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.25,
      metalness: 0.78,
      roughness: 0.24,
    }),
    questHaloMat: new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.85,
    }),
    sparkleMats: sparkleColors.map(
      (color) =>
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.92,
        })
    ),
    outerMats: new Map(),
  };
  return sharedStandRes;
}

function getSharedOuterMaterial(colorHex: number): THREE.MeshStandardMaterial {
  const res = getSharedStandResources();
  let mat = res.outerMats.get(colorHex);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.44,
      metalness: 0.2,
    });
    res.outerMats.set(colorHex, mat);
  }
  return mat;
}

export class ArtifactStand extends xb.Script {
  readonly artifact: ArtifactItem;
  private framePivot = new THREE.Group();
  private artMesh!: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  private starMesh!: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  private ringMesh!: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;

  private disposables: Array<{dispose: () => void}> = [];
  private placeholderTex!: THREE.CanvasTexture;
  private loadedTex?: THREE.Texture;
  private currentLodTier: StandLodTier = 'placeholder';
  private loadingLodTier: StandLodTier | null = null;
  private loadToken = 0;
  private outOfViewSeconds = 0;
  private boundingRadius = 1.25;

  private isHovered = false;
  private isHighlighted = false;
  private isDiscovered = false;
  private isQuestTarget = false;
  private disposed = false;
  private starAngle = 0;
  private sparkleTime = 0;
  private lastRingColorHex = 0x38bdf8;

  private sparkleGroup = new THREE.Group();
  private sparkleMeshes: THREE.Mesh<THREE.OctahedronGeometry, THREE.MeshBasicMaterial>[] = [];
  private questHaloMesh!: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;

  constructor(artifact: ArtifactItem) {
    super();
    this.artifact = artifact;
    this.name = `artifact-stand-${artifact.id}`;
    this.buildStand();
  }

  private track<T extends {dispose: () => void}>(item: T): T {
    this.disposables.push(item);
    return item;
  }

  private buildStand(): void {
    const shared = getSharedStandResources();
    const aspect = this.artifact.aspectRatio;
    const artH = aspect < 0.85 ? 1.18 : 1.02;
    const artW = THREE.MathUtils.clamp(artH * aspect, 0.78, 1.48);

    const matW = artW + 0.14;
    const matH = artH + 0.14;
    const goldW = matW + 0.08;
    const goldH = matH + 0.08;
    const outerW = goldW + 0.14;
    const outerH = goldH + 0.14;

    // 1. Floor spotlight ring (y = 0.02 above museum floor)
    const ringMat = this.track(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    this.ringMesh = new THREE.Mesh(shared.ringGeo, ringMat);
    this.ringMesh.rotation.x = -Math.PI / 2;
    this.ringMesh.position.set(0, 0.02, 0.55);
    this.add(this.ringMesh);

    // 2. Travertine Pedestal Column with İznik Tile Collar resting flush on floor (y = 0)
    const iznikMat =
      this.artifact.index % 2 === 0 ? shared.iznikTurquoiseMat : shared.iznikCobaltMat;

    const plinthBase = new THREE.Mesh(shared.plinthBaseGeo, shared.plinthMat);
    plinthBase.position.y = 0.07;
    plinthBase.castShadow = false;
    plinthBase.receiveShadow = false;

    const post = new THREE.Mesh(shared.postGeo, shared.plinthMat);
    post.position.y = 0.65;
    post.castShadow = false;

    const iznikBand = new THREE.Mesh(shared.iznikBandGeo, iznikMat);
    iznikBand.position.y = 1.02;

    const collar = new THREE.Mesh(shared.collarGeo, shared.brassMat);
    collar.position.y = 1.13;
    this.add(plinthBase, post, iznikBand, collar);

    // 3. Framed Artwork Assembly mounted at eye/3rd-person friendly height
    const frameCenterY = 1.15 + outerH / 2;
    this.framePivot.position.set(0, frameCenterY, 0.04);
    this.boundingRadius = Math.max(outerW, outerH) * 0.72 + 0.35;

    const outerMat = getSharedOuterMaterial(this.artifact.collectionColor);
    const outerMesh = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(outerW, outerH, 0.095)),
      outerMat
    );
    outerMesh.castShadow = false;
    outerMesh.userData.artifactId = this.artifact.id;

    const goldMesh = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(goldW, goldH, 0.11)),
      shared.brassMat
    );
    goldMesh.userData.artifactId = this.artifact.id;

    const matMesh = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(matW, matH, 0.12)),
      shared.matBoardMat
    );
    matMesh.userData.artifactId = this.artifact.id;

    this.placeholderTex = this.track(
      createBlurredPlaceholderTexture(
        this.artifact.index,
        this.artifact.collectionHexColor
      )
    );
    this.artMesh = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(artW, artH)),
      this.track(
        new THREE.MeshStandardMaterial({
          map: this.placeholderTex,
          roughness: 0.38,
        })
      )
    );
    this.artMesh.position.z = 0.065;
    this.artMesh.userData.artifactId = this.artifact.id;

    // Gallery Brass Picture-Light Arm curving over top center of frame
    const lampNeck = new THREE.Mesh(shared.lampNeckGeo, shared.brassMat);
    lampNeck.rotation.x = Math.PI / 2 - 0.25;
    lampNeck.position.set(0, outerH / 2 + 0.04, 0.14);
    const lampHood = new THREE.Mesh(shared.lampHoodGeo, shared.brassMat);
    lampHood.rotation.z = Math.PI / 2;
    lampHood.position.set(0, outerH / 2 + 0.07, 0.25);

    // Front plaque below artwork
    const plaqueTex = this.track(
      createPlaqueTexture(
        this.artifact.index,
        this.artifact.title,
        this.artifact.collectionShortName,
        this.artifact.collectionHexColor
      )
    );
    const plaque = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(Math.max(1.18, outerW * 0.9), 0.3)),
      this.track(new THREE.MeshBasicMaterial({map: plaqueTex, transparent: true}))
    );
    plaque.position.set(0, -outerH / 2 - 0.19, 0.08);
    plaque.userData.artifactId = this.artifact.id;

    // Top discovery Seljuk star emblem
    this.starMesh = new THREE.Mesh(shared.starGeo, shared.starUndiscoveredMat);
    this.starMesh.position.set(0, outerH / 2 + 0.2, 0.04);

    this.framePivot.add(
      outerMesh,
      goldMesh,
      matMesh,
      this.artMesh,
      lampNeck,
      lampHood,
      plaque,
      this.starMesh
    );

    // Quest target continuous orbiting sparkle stars + halo beacon
    for (let i = 0; i < 6; i++) {
      const sMesh = new THREE.Mesh(shared.sparkleGeo, shared.sparkleMats[i]);
      this.sparkleMeshes.push(sMesh);
      this.sparkleGroup.add(sMesh);
    }

    this.questHaloMesh = new THREE.Mesh(shared.questHaloGeo, shared.questHaloMat);
    this.questHaloMesh.rotation.x = Math.PI / 2;
    this.questHaloMesh.position.set(0, outerH / 2 + 0.16, 0.04);
    this.sparkleGroup.position.set(0, outerH / 2 + 0.2, 0.04);
    this.sparkleGroup.visible = false;
    this.questHaloMesh.visible = false;

    this.framePivot.add(this.sparkleGroup, this.questHaloMesh);
    this.add(this.framePivot);
  }

  init(): void {
    // Textures load lazily via MuseumWorld LOD/frustum culling to conserve GPU memory.
  }

  getWorldCenter(out = new THREE.Vector3()): THREE.Vector3 {
    return this.framePivot.getWorldPosition(out);
  }

  getBoundingRadius(): number {
    return this.boundingRadius;
  }

  getCurrentLodTier(): StandLodTier {
    return this.currentLodTier;
  }

  isLoadingTexture(): boolean {
    return this.loadingLodTier !== null;
  }

  markInView(): void {
    this.outOfViewSeconds = 0;
  }

  markOutOfView(
    dt: number,
    graceSec: number,
    forceImmediateUnload: boolean
  ): void {
    if (this.currentLodTier === 'placeholder' && this.loadingLodTier === null) {
      return;
    }
    this.outOfViewSeconds += dt;
    if (forceImmediateUnload || this.outOfViewSeconds >= graceSec) {
      this.unloadTexture();
    }
  }

  unloadTexture(): void {
    this.loadToken++;
    this.loadingLodTier = null;
    if (this.loadedTex) {
      this.artMesh.material.map = this.placeholderTex;
      this.artMesh.material.needsUpdate = true;
      this.loadedTex.dispose();
      this.loadedTex = undefined;
    }
    this.currentLodTier = 'placeholder';
  }

  requestLodTier(targetTier: 'low' | 'high'): boolean {
    if (this.disposed) return false;

    const hasSeparateLow =
      Boolean(this.artifact.lowResUrl) &&
      this.artifact.lowResUrl !== this.artifact.thumbUrl;
    const effectiveTier: StandLodTier =
      targetTier === 'low' && hasSeparateLow ? 'low' : 'high';
    const url =
      effectiveTier === 'low' && this.artifact.lowResUrl
        ? this.artifact.lowResUrl
        : this.artifact.thumbUrl;

    if (!url) return false;
    if (this.currentLodTier === effectiveTier) return false;
    // Do not downgrade an already loaded high-res texture while still within unload range
    if (this.currentLodTier === 'high' && effectiveTier === 'low') return false;
    if (this.loadingLodTier === effectiveTier) return false;
    if (this.loadingLodTier === 'high' && effectiveTier === 'low') return false;

    const token = ++this.loadToken;
    this.loadingLodTier = effectiveTier;

    sharedLoader.load(
      url,
      (tex) => {
        if (this.disposed || token !== this.loadToken) {
          tex.dispose();
          return;
        }
        this.loadingLodTier = null;
        tex.colorSpace = THREE.SRGBColorSpace;
        const renderer = xb.core.renderer as THREE.WebGLRenderer | undefined;
        if (renderer?.capabilities) {
          tex.anisotropy = Math.min(
            DEVICE_QUALITY.maxAnisotropy,
            renderer.capabilities.getMaxAnisotropy()
          );
        }
        const prevTex = this.loadedTex;
        this.loadedTex = tex;
        this.currentLodTier = effectiveTier;
        this.artMesh.material.map = tex;
        this.artMesh.material.needsUpdate = true;
        prevTex?.dispose();
      },
      undefined,
      () => {
        if (token === this.loadToken) {
          this.loadingLodTier = null;
        }
      }
    );

    return true;
  }

  getInteractiveMeshes(): THREE.Object3D[] {
    return [this.framePivot];
  }

  getViewSpot(out = new THREE.Vector3()): THREE.Vector3 {
    const forward = new THREE.Vector3(0, 0, 2.05);
    forward.applyQuaternion(this.quaternion);
    return out.copy(this.position).add(forward);
  }

  setHovered(hovered: boolean): void {
    this.isHovered = hovered;
  }

  setHighlighted(highlighted: boolean): void {
    this.isHighlighted = highlighted;
  }

  setDiscovered(discovered: boolean): void {
    this.isDiscovered = discovered;
    const shared = getSharedStandResources();
    if (discovered) {
      this.starMesh.material = shared.starDiscoveredMat;
    } else if (this.isQuestTarget) {
      this.starMesh.material = shared.starQuestMat;
    } else {
      this.starMesh.material = shared.starUndiscoveredMat;
    }
  }

  setQuestTarget(isTarget: boolean): void {
    this.isQuestTarget = isTarget;
    this.sparkleGroup.visible = isTarget;
    this.questHaloMesh.visible = isTarget;
    const shared = getSharedStandResources();
    if (this.isDiscovered) {
      this.starMesh.material = shared.starDiscoveredMat;
    } else if (isTarget) {
      this.starMesh.material = shared.starQuestMat;
    } else {
      this.starMesh.material = shared.starUndiscoveredMat;
    }
  }

  update(): void {
    if (!this.visible) return;

    const targetScale = this.isHighlighted ? 1.08 : this.isHovered ? 1.05 : 1.0;
    const targetOpacity = this.isHighlighted
      ? 0.88
      : this.isQuestTarget
        ? 0.72
        : this.isHovered
          ? 0.55
          : this.isDiscovered
            ? 0.35
            : 0.14;
    const targetRingColor =
      this.isHighlighted || this.isQuestTarget
        ? 0xfbbf24
        : this.isDiscovered
          ? 0x34d399
          : 0x38bdf8;

    if (this.lastRingColorHex !== targetRingColor) {
      this.lastRingColorHex = targetRingColor;
      this.ringMesh.material.color.setHex(targetRingColor);
    }

    const scaleDiff = Math.abs(this.framePivot.scale.x - targetScale);
    const opacityDiff = Math.abs(this.ringMesh.material.opacity - targetOpacity);
    const needsStarSpin = this.isDiscovered || this.isHighlighted || this.isQuestTarget;

    if (
      !needsStarSpin &&
      !this.isQuestTarget &&
      scaleDiff < 0.001 &&
      opacityDiff < 0.002
    ) {
      if (this.framePivot.scale.x !== targetScale) {
        this.framePivot.scale.setScalar(targetScale);
      }
      if (this.ringMesh.material.opacity !== targetOpacity) {
        this.ringMesh.material.opacity = targetOpacity;
      }
      return;
    }

    const dt = Math.min(xb.getDeltaTime(), 0.05);
    if (scaleDiff >= 0.001) {
      const nextScale = THREE.MathUtils.damp(
        this.framePivot.scale.x,
        targetScale,
        8,
        dt
      );
      this.framePivot.scale.setScalar(nextScale);
    }
    if (opacityDiff >= 0.002) {
      this.ringMesh.material.opacity = THREE.MathUtils.damp(
        this.ringMesh.material.opacity,
        targetOpacity,
        8,
        dt
      );
    }

    if (needsStarSpin) {
      this.starAngle += dt * (this.isQuestTarget || this.isHighlighted ? 3.2 : 1.3);
      this.starMesh.rotation.y = this.starAngle;
    }

    if (this.isQuestTarget) {
      this.sparkleTime += dt;
      const pulse = 1 + Math.sin(this.sparkleTime * 4.5) * 0.16;
      this.questHaloMesh.scale.setScalar(pulse);
      this.questHaloMesh.rotation.z = this.sparkleTime * 1.8;

      for (let idx = 0; idx < this.sparkleMeshes.length; idx++) {
        const s = this.sparkleMeshes[idx];
        const angle = this.sparkleTime * 2.5 + (idx / this.sparkleMeshes.length) * Math.PI * 2;
        const radius = 0.38 + Math.sin(this.sparkleTime * 3 + idx) * 0.07;
        const bob = Math.sin(this.sparkleTime * 4.2 + idx * 1.4) * 0.18 + 0.06;
        s.position.set(Math.cos(angle) * radius, bob, Math.sin(angle) * radius);
        s.rotation.y = this.sparkleTime * 4 + idx;
        s.rotation.x = this.sparkleTime * 3;
        const twinkle = 0.65 + Math.sin(this.sparkleTime * 7 + idx * 1.9) * 0.45;
        s.scale.setScalar(Math.max(0.25, twinkle));
      }
    }
  }

  dispose(): void {
    this.disposed = true;
    this.loadToken++;
    this.loadingLodTier = null;
    this.loadedTex?.dispose();
    this.loadedTex = undefined;
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
