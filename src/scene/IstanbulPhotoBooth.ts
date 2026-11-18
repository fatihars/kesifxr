import * as THREE from 'three';
import * as xb from 'xrblocks';
import {ExplorerCharacter} from './ExplorerCharacter.ts';
import type {WallRect} from './MuseumBuilding.ts';
import {
  getAnatolianKilimTexture,
  getWalnutWoodTextures,
} from '../utils/anatolianMaterials.ts';

export const PHOTO_BOOTH_ORIGIN = new THREE.Vector3(8.5, 0, 15.6);
export const PHOTO_BOOTH_VISIT_SPOT = new THREE.Vector3(4.3, 0, 15.6);

export interface PhotoStageAnchors {
  playerSoloPos: THREE.Vector3;
  playerPairPos: THREE.Vector3;
  friendPos: THREE.Vector3;
  petSoloPos: THREE.Vector3;
  petGroupPos: THREE.Vector3;
  facingYaw: number;
  camPos: THREE.Vector3;
  camLookAt: THREE.Vector3;
}

export class IstanbulPhotoBooth extends xb.Script {
  readonly targets: THREE.Object3D[] = [];
  readonly walls: WallRect[] = [];
  readonly wall: WallRect = {
    minX: PHOTO_BOOTH_ORIGIN.x + 0.72,
    maxX: PHOTO_BOOTH_ORIGIN.x + 1.32,
    minZ: PHOTO_BOOTH_ORIGIN.z - 1.9,
    maxZ: PHOTO_BOOTH_ORIGIN.z + 1.9,
  };

  private readonly disposables = new Set<{dispose(): void}>();
  private photographer!: ExplorerCharacter;
  private cameraAssembly = new THREE.Group();
  private flashBulbMat!: THREE.MeshStandardMaterial;
  private flashLight!: THREE.PointLight;
  private lanternLight?: THREE.PointLight;
  private lanternBulbMat?: THREE.MeshStandardMaterial;
  private flashTimer = 0;
  private elapsed = 0;

  private keep<T extends {dispose(): void}>(item: T): T {
    this.disposables.add(item);
    return item;
  }

  private tagTarget(obj: THREE.Object3D): void {
    obj.userData.photoBooth = true;
    this.targets.push(obj);
  }

  init(): void {
    this.position.copy(PHOTO_BOOTH_ORIGIN);
    // Face -X (world plaza) from local +Z
    this.rotation.y = -Math.PI / 2;

    const walnut = getWalnutWoodTextures(2, 2);
    const woodMat = this.keep(
      new THREE.MeshStandardMaterial({
        map: walnut.map,
        bumpMap: walnut.bumpMap,
        bumpScale: 0.015,
        color: 0x5d3b26,
        roughness: 0.62,
      })
    );
    const darkWoodMat = this.keep(
      new THREE.MeshStandardMaterial({color: 0x3b2316, roughness: 0.65})
    );
    const brassMat = this.keep(
      new THREE.MeshStandardMaterial({
        color: 0xe3b34c,
        roughness: 0.25,
        metalness: 0.85,
      })
    );
    const velvetMat = this.keep(
      new THREE.MeshStandardMaterial({color: 0x991b1b, roughness: 0.88})
    );
    const carpetMat = this.keep(
      new THREE.MeshStandardMaterial({
        map: getAnatolianKilimTexture('crimson'),
        color: 0xf4d3b0,
        roughness: 0.9,
      })
    );
    const creamStoneMat = this.keep(
      new THREE.MeshStandardMaterial({color: 0xf1e4ca, roughness: 0.72})
    );
    const leatherMat = this.keep(
      new THREE.MeshStandardMaterial({color: 0x1e1815, roughness: 0.72})
    );

    // 1. Raised Wooden Deck & Kilim Stage Carpet
    const deck = new THREE.Mesh(
      this.keep(new THREE.BoxGeometry(3.2, 0.08, 2.2)),
      woodMat
    );
    deck.position.set(0, 0.04, 0);
    deck.receiveShadow = true;
    this.add(deck);
    this.tagTarget(deck);

    const carpet = new THREE.Mesh(
      this.keep(new THREE.BoxGeometry(2.85, 0.016, 1.85)),
      carpetMat
    );
    carpet.position.set(0, 0.086, 0.04);
    carpet.receiveShadow = true;
    this.add(carpet);

    // Brass corner stanchions & crimson velvet ropes framing the front sides
    const postGeo = this.keep(new THREE.CylinderGeometry(0.032, 0.038, 0.78, 12));
    const baseGeo = this.keep(new THREE.CylinderGeometry(0.11, 0.12, 0.04, 14));
    const knobGeo = this.keep(new THREE.SphereGeometry(0.055, 10, 8));
    for (const sx of [-1.46, 1.46]) {
      for (const sz of [-0.72, 0.82]) {
        const base = new THREE.Mesh(baseGeo, brassMat);
        base.position.set(sx, 0.1, sz);
        const post = new THREE.Mesh(postGeo, brassMat);
        post.position.set(sx, 0.49, sz);
        const knob = new THREE.Mesh(knobGeo, brassMat);
        knob.position.set(sx, 0.9, sz);
        this.add(base, post, knob);
      }
      const rope = new THREE.Mesh(
        this.keep(new THREE.CylinderGeometry(0.018, 0.018, 1.54, 8)),
        velvetMat
      );
      rope.rotation.x = Math.PI / 2;
      rope.position.set(sx, 0.76, 0.05);
      this.add(rope);
    }

    // 2. Wooden Frame & Vintage "İSTANBUL HATIRASI" Curtain Backdrop
    const frameBase = new THREE.Mesh(
      this.keep(new THREE.BoxGeometry(3.26, 0.16, 0.24)),
      darkWoodMat
    );
    frameBase.position.set(0, 0.12, -0.96);
    this.add(frameBase);

    for (const sx of [-1.49, 1.49]) {
      const pillar = new THREE.Mesh(
        this.keep(new THREE.BoxGeometry(0.18, 2.94, 0.18)),
        woodMat
      );
      pillar.position.set(sx, 1.61, -0.96);
      const finial = new THREE.Mesh(
        this.keep(new THREE.SphereGeometry(0.11, 10, 8)),
        brassMat
      );
      finial.position.set(sx, 3.22, -0.96);
      this.add(pillar, finial);
    }

    const crownBeam = new THREE.Mesh(
      this.keep(new THREE.BoxGeometry(3.28, 0.18, 0.2)),
      woodMat
    );
    crownBeam.position.set(0, 3.06, -0.96);
    this.add(crownBeam);

    const backdropTex = this.keep(this.loadUserBackdropTexture());
    const backdropMesh = new THREE.Mesh(
      this.keep(new THREE.PlaneGeometry(2.8, 2.8)),
      this.keep(new THREE.MeshBasicMaterial({map: backdropTex}))
    );
    backdropMesh.position.set(0, 1.56, -0.89);
    this.add(backdropMesh);
    this.tagTarget(backdropMesh);

    const backBoard = new THREE.Mesh(
      this.keep(new THREE.BoxGeometry(2.9, 2.88, 0.06)),
      darkWoodMat
    );
    backBoard.position.set(0, 1.56, -0.94);
    this.add(backBoard);

    // Ornate top plaque above the frame beam
    const signTex = this.keep(this.createTopSignTexture());
    const topSign = new THREE.Mesh(
      this.keep(new THREE.PlaneGeometry(1.96, 0.34)),
      this.keep(new THREE.MeshBasicMaterial({map: signTex}))
    );
    topSign.position.set(0, 3.36, -0.88);
    this.add(topSign);
    this.tagTarget(topSign);

    const signBack = new THREE.Mesh(
      this.keep(new THREE.BoxGeometry(2.08, 0.42, 0.08)),
      woodMat
    );
    signBack.position.set(0, 3.36, -0.93);
    this.add(signBack);

    // Symmetric warm brass side-lanterns on the wooden frame pillars (keeps curtain unobstructed)
    this.lanternBulbMat = this.keep(
      new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.9,
        roughness: 0.3,
      })
    );
    for (const sx of [-1.49, 1.49]) {
      const bracket = new THREE.Mesh(
        this.keep(new THREE.BoxGeometry(0.06, 0.06, 0.22)),
        brassMat
      );
      bracket.position.set(sx, 2.46, -0.8);
      const lanternCap = new THREE.Mesh(
        this.keep(new THREE.CylinderGeometry(0.11, 0.08, 0.09, 12)),
        brassMat
      );
      lanternCap.position.set(sx, 2.4, -0.7);
      const lanternBulb = new THREE.Mesh(
        this.keep(new THREE.SphereGeometry(0.072, 10, 8)),
        this.lanternBulbMat
      );
      lanternBulb.position.set(sx, 2.32, -0.7);
      this.add(bracket, lanternCap, lanternBulb);
    }
    this.lanternLight = new THREE.PointLight(0xffdfb0, 14, 7.5, 1.8);
    this.lanternLight.position.set(0, 2.45, -0.32);
    this.add(this.lanternLight);

    // Decorative corner stone flower urns
    const urnMat = creamStoneMat;
    const leafMat = this.keep(new THREE.MeshStandardMaterial({color: 0x15803d, roughness: 0.8}));
    const flowerMat = this.keep(new THREE.MeshStandardMaterial({color: 0xf43f5e, roughness: 0.65}));
    for (const sx of [-1.42, 1.42]) {
      const urn = new THREE.Mesh(
        this.keep(new THREE.CylinderGeometry(0.18, 0.13, 0.38, 12)),
        urnMat
      );
      urn.position.set(sx, 0.27, -0.62);
      const bush = new THREE.Mesh(
        this.keep(new THREE.DodecahedronGeometry(0.24, 1)),
        leafMat
      );
      bush.position.set(sx, 0.56, -0.62);
      this.add(urn, bush);
      for (let f = 0; f < 4; f++) {
        const fl = new THREE.Mesh(
          this.keep(new THREE.SphereGeometry(0.055, 6, 5)),
          flowerMat
        );
        const ang = (f * Math.PI) / 2 + 0.4;
        fl.position.set(
          sx + Math.cos(ang) * 0.16,
          0.62 + (f % 2) * 0.08,
          -0.62 + Math.sin(ang) * 0.16
        );
        this.add(fl);
      }
    }

    // 3. Vintage Accordion-Bellows Camera on Authentic Twin-Rail Walnut & Brass Tripod
    this.cameraAssembly.position.set(0, 0, 2.48);
    this.cameraAssembly.rotation.y = Math.PI;
    this.add(this.cameraAssembly);

    this.buildVintageTripod(woodMat, darkWoodMat, brassMat);

    // Camera wooden base rail & rear film plate box
    const rail = new THREE.Mesh(
      this.keep(new THREE.BoxGeometry(0.32, 0.045, 0.48)),
      woodMat
    );
    rail.position.set(0, 1.19, 0.04);
    this.cameraAssembly.add(rail);

    const rearBox = new THREE.Mesh(
      this.keep(new THREE.BoxGeometry(0.34, 0.34, 0.12)),
      woodMat
    );
    rearBox.position.set(0, 1.38, -0.14);
    this.cameraAssembly.add(rearBox);
    this.tagTarget(rearBox);

    // Brass focus knob on right side
    const knob = new THREE.Mesh(
      this.keep(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 10)),
      brassMat
    );
    knob.rotation.z = Math.PI / 2;
    knob.position.set(0.19, 1.24, 0.06);
    this.cameraAssembly.add(knob);

    // Accordion pleated bellows
    for (let p = 0; p < 5; p++) {
      const t = p / 4;
      const w = THREE.MathUtils.lerp(0.28, 0.19, t);
      const h = THREE.MathUtils.lerp(0.28, 0.19, t);
      const pleat = new THREE.Mesh(
        this.keep(new THREE.BoxGeometry(w, h, 0.042)),
        leatherMat
      );
      pleat.position.set(0, 1.38, -0.05 + p * 0.048);
      this.cameraAssembly.add(pleat);
    }

    // Front wooden standard & brass lens barrel
    const frontBoard = new THREE.Mesh(
      this.keep(new THREE.BoxGeometry(0.22, 0.24, 0.05)),
      woodMat
    );
    frontBoard.position.set(0, 1.38, 0.19);
    this.cameraAssembly.add(frontBoard);

    const lensBarrel = new THREE.Mesh(
      this.keep(new THREE.CylinderGeometry(0.065, 0.072, 0.1, 16)),
      brassMat
    );
    lensBarrel.rotation.x = Math.PI / 2;
    lensBarrel.position.set(0, 1.38, 0.25);
    this.cameraAssembly.add(lensBarrel);
    this.tagTarget(lensBarrel);

    const lensGlass = new THREE.Mesh(
      this.keep(new THREE.CircleGeometry(0.052, 14)),
      this.keep(
        new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          roughness: 0.08,
          metalness: 0.9,
        })
      )
    );
    lensGlass.position.set(0, 1.38, 0.302);
    this.cameraAssembly.add(lensGlass);

    // Velvet photographer's focusing cloth draped on rear box
    const drape = new THREE.Mesh(
      this.keep(new THREE.BoxGeometry(0.36, 0.26, 0.22)),
      velvetMat
    );
    drape.position.set(0, 1.45, -0.2);
    drape.rotation.x = -0.18;
    this.cameraAssembly.add(drape);

    // Vintage magnesium flash dish + bulb above the camera
    const flashStem = new THREE.Mesh(
      this.keep(new THREE.CylinderGeometry(0.014, 0.014, 0.28, 8)),
      brassMat
    );
    flashStem.position.set(-0.22, 1.49, 0.05);
    const flashDish = new THREE.Mesh(
      this.keep(new THREE.CylinderGeometry(0.14, 0.05, 0.08, 14)),
      brassMat
    );
    flashDish.rotation.x = Math.PI / 2;
    flashDish.position.set(-0.22, 1.67, 0.07);
    this.flashBulbMat = this.keep(
      new THREE.MeshStandardMaterial({
        color: 0xfef9c3,
        emissive: 0xfef08a,
        emissiveIntensity: 0.35,
        roughness: 0.2,
      })
    );
    const flashBulb = new THREE.Mesh(
      this.keep(new THREE.SphereGeometry(0.055, 10, 8)),
      this.flashBulbMat
    );
    flashBulb.position.set(-0.22, 1.67, 0.11);
    this.cameraAssembly.add(flashStem, flashDish, flashBulb);

    // Keep flash PointLight mounted directly on the booth so it still fires cleanly during studio capture
    this.flashLight = new THREE.PointLight(0xfffbeb, 0, 14, 1.5);
    this.flashLight.position.set(0.22, 1.72, 2.22);
    this.add(this.flashLight);

    // 4. Photographer NPC standing beside the tripod
    this.photographer = new ExplorerCharacter('erkek', 2, 'culture', true);
    this.photographer.position.set(0.95, 0, 2.28);
    // Look from (+0.95, +2.28) toward stage center (0, 0)
    this.photographer.rotation.y = Math.atan2(0.95, 2.28);
    this.photographer.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) obj.userData.photoBooth = true;
    });
    this.add(this.photographer);
    this.targets.push(this.photographer);

    // Colliders: back wall behind mural + tripod footprint
    this.walls.push(this.wall);
    const tripodWorld = new THREE.Vector3(0, 0, 2.48);
    this.updateMatrixWorld(true);
    this.localToWorld(tripodWorld);
    this.walls.push({
      minX: tripodWorld.x - 0.46,
      maxX: tripodWorld.x + 0.46,
      minZ: tripodWorld.z - 0.46,
      maxZ: tripodWorld.z + 0.46,
    });
  }

  private buildVintageTripod(
    woodMat: THREE.Material,
    darkWoodMat: THREE.Material,
    brassMat: THREE.Material
  ): void {
    const up = new THREE.Vector3(0, 1, 0);
    const placeRod = (
      pA: THREE.Vector3,
      pB: THREE.Vector3,
      rTop: number,
      rBot: number,
      segments: number,
      mat: THREE.Material,
      tag = true
    ): THREE.Mesh => {
      const dir = new THREE.Vector3().subVectors(pB, pA);
      const len = dir.length();
      const mesh = new THREE.Mesh(
        this.keep(new THREE.CylinderGeometry(rTop, rBot, len, segments)),
        mat
      );
      mesh.position.copy(pA).add(pB).multiplyScalar(0.5);
      // Cylinder top (+Y) aligns with pB -> pA direction (pA is top, pB is bottom)
      mesh.quaternion.setFromUnitVectors(up, dir.multiplyScalar(-1 / Math.max(len, 1e-5)));
      mesh.castShadow = true;
      this.cameraAssembly.add(mesh);
      if (tag) this.tagTarget(mesh);
      return mesh;
    };

    // Brass spider crown at y = 0.96
    const crown = new THREE.Mesh(
      this.keep(new THREE.CylinderGeometry(0.115, 0.135, 0.08, 16)),
      brassMat
    );
    crown.position.set(0, 0.96, 0);
    this.cameraAssembly.add(crown);
    this.tagTarget(crown);

    const crownRing = new THREE.Mesh(
      this.keep(new THREE.TorusGeometry(0.125, 0.014, 8, 20)),
      brassMat
    );
    crownRing.rotation.x = Math.PI / 2;
    crownRing.position.set(0, 0.96, 0);
    this.cameraAssembly.add(crownRing);

    // Geared brass elevating center column (y = 0.68 .. 1.14)
    const centerCol = new THREE.Mesh(
      this.keep(new THREE.CylinderGeometry(0.032, 0.032, 0.46, 14)),
      brassMat
    );
    centerCol.position.set(0, 0.91, 0);
    this.cameraAssembly.add(centerCol);

    const colBottomCap = new THREE.Mesh(
      this.keep(new THREE.SphereGeometry(0.038, 10, 8)),
      brassMat
    );
    colBottomCap.position.set(0, 0.68, 0);
    this.cameraAssembly.add(colBottomCap);

    // Pan-tilt cradle head under the camera rail
    const panCradle = new THREE.Mesh(
      this.keep(new THREE.BoxGeometry(0.19, 0.042, 0.24)),
      brassMat
    );
    panCradle.position.set(0, 1.15, 0.02);
    this.cameraAssembly.add(panCradle);
    this.tagTarget(panCradle);

    // Rear pan/tilt locking handle pointing toward photographer (-Z inside cameraAssembly)
    const panHandle = new THREE.Mesh(
      this.keep(new THREE.CylinderGeometry(0.011, 0.011, 0.22, 8)),
      brassMat
    );
    panHandle.rotation.x = Math.PI / 2 + 0.22;
    panHandle.position.set(0, 1.11, -0.18);
    const panGrip = new THREE.Mesh(
      this.keep(new THREE.CylinderGeometry(0.02, 0.017, 0.09, 10)),
      darkWoodMat
    );
    panGrip.rotation.x = Math.PI / 2 + 0.22;
    panGrip.position.set(0, 1.09, -0.27);
    this.cameraAssembly.add(panHandle, panGrip);

    // Elevation crank knob on crown side
    const crankPin = new THREE.Mesh(
      this.keep(new THREE.CylinderGeometry(0.01, 0.01, 0.06, 8)),
      brassMat
    );
    crankPin.rotation.z = Math.PI / 2;
    crankPin.position.set(0.15, 0.96, 0);
    const crankKnob = new THREE.Mesh(
      this.keep(new THREE.SphereGeometry(0.024, 8, 8)),
      brassMat
    );
    crankKnob.position.set(0.18, 0.96, 0);
    this.cameraAssembly.add(crankPin, crankKnob);

    // 3-way center spreader hub at y = 0.45
    const spreaderHubPos = new THREE.Vector3(0, 0.45, 0);
    const spreaderHub = new THREE.Mesh(
      this.keep(new THREE.CylinderGeometry(0.042, 0.042, 0.04, 12)),
      brassMat
    );
    spreaderHub.position.copy(spreaderHubPos);
    const spreaderCap = new THREE.Mesh(
      this.keep(new THREE.SphereGeometry(0.032, 10, 8)),
      brassMat
    );
    spreaderCap.position.set(0, 0.475, 0);
    this.cameraAssembly.add(spreaderHub, spreaderCap);

    // Three twin-rail walnut legs: exact top socket on crown -> brass mid-clamp -> brass foot pad at stone paving y = 0.04
    const legAngles = [Math.PI, Math.PI / 3, -Math.PI / 3];
    for (const a of legAngles) {
      const rx = Math.sin(a);
      const rz = Math.cos(a);
      const tx = Math.cos(a);
      const tz = -Math.sin(a);

      const pTop = new THREE.Vector3(rx * 0.115, 0.955, rz * 0.115);
      const pFoot = new THREE.Vector3(rx * 0.45, 0.042, rz * 0.45);
      const pMid = new THREE.Vector3().lerpVectors(pTop, pFoot, 0.54);
      const pFerruleTop = new THREE.Vector3().lerpVectors(pTop, pFoot, 0.93);

      // Brass shoulder hinge lug
      const lug = new THREE.Mesh(
        this.keep(new THREE.BoxGeometry(0.072, 0.052, 0.05)),
        brassMat
      );
      lug.position.copy(pTop);
      lug.rotation.y = a;
      this.cameraAssembly.add(lug);

      // Twin upper wooden rails
      for (const side of [-1, 1]) {
        const topOff = new THREE.Vector3(
          pTop.x + tx * side * 0.026,
          pTop.y,
          pTop.z + tz * side * 0.026
        );
        const midOff = new THREE.Vector3(
          pMid.x + tx * side * 0.014,
          pMid.y,
          pMid.z + tz * side * 0.014
        );
        placeRod(topOff, midOff, 0.013, 0.012, 8, woodMat);
      }

      // Brass mid-clamp collar & tightening wing-bolt
      const pCollarA = new THREE.Vector3().lerpVectors(pTop, pFoot, 0.515);
      const pCollarB = new THREE.Vector3().lerpVectors(pTop, pFoot, 0.565);
      placeRod(pCollarA, pCollarB, 0.033, 0.031, 12, brassMat);

      // Lower tapered walnut leg
      placeRod(pMid, pFerruleTop, 0.022, 0.015, 10, darkWoodMat);

      // Brass ferrule tip + flat floor foot pad at y = 0.042
      placeRod(pFerruleTop, pFoot, 0.016, 0.009, 10, brassMat, false);
      const footPad = new THREE.Mesh(
        this.keep(new THREE.CylinderGeometry(0.028, 0.036, 0.016, 12)),
        brassMat
      );
      footPad.position.set(pFoot.x, 0.044, pFoot.z);
      this.cameraAssembly.add(footPad);

      // Brass spreader arm from center hub to leg mid-collar
      placeRod(spreaderHubPos, pMid, 0.009, 0.009, 8, brassMat, false);
    }
  }

  private loadUserBackdropTexture(): THREE.Texture {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(
      `${import.meta.env.BASE_URL}assets/aistudio/image_9a5c3411.png`
    );
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  private createTopSignTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 136;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#3b1f14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 7;
    ctx.strokeRect(9, 9, canvas.width - 18, canvas.height - 18);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 40px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📸 KÖRÜKLÜ HATIRA STÜDYOSU', canvas.width / 2, 54);

    ctx.fillStyle = '#fcd34d';
    ctx.font = 'bold 21px Georgia, serif';
    ctx.fillText('Poz Ver • Arkadaşını Çağır • Kartpostalını İndir', canvas.width / 2, 100);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  getStageAnchors(): PhotoStageAnchors {
    this.updateMatrixWorld(true);
    const toWorld = (x: number, y: number, z: number) =>
      this.localToWorld(new THREE.Vector3(x, y, z));

    const centerWorld = toWorld(0, 0.08, 0.05);
    const camPos = toWorld(0, 1.28, 2.18);
    const camLookAt = toWorld(0, 1.38, -0.89);
    const facingYaw = Math.atan2(
      -(camPos.x - centerWorld.x),
      -(camPos.z - centerWorld.z)
    );

    return {
      playerSoloPos: centerWorld,
      playerPairPos: toWorld(-0.42, 0.08, 0.05),
      friendPos: toWorld(0.42, 0.08, 0.05),
      petSoloPos: toWorld(0.68, 0.08, 0.25),
      petGroupPos: toWorld(-0.92, 0.08, 0.28),
      facingYaw,
      camPos,
      camLookAt,
    };
  }

  setCameraPropVisible(visible: boolean): void {
    this.cameraAssembly.visible = visible;
    this.photographer.visible = visible;
  }

  triggerFlash(): void {
    this.flashTimer = 0.38;
    this.flashLight.intensity = 18;
    this.flashBulbMat.emissiveIntensity = 4.5;
  }

  updateNear(playerPos: THREE.Vector3, dt: number, isNight = false): void {
    this.elapsed += dt;
    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - dt);
      const frac = this.flashTimer / 0.38;
      this.flashLight.intensity = 18 * frac * frac;
      this.flashBulbMat.emissiveIntensity = 0.35 + 4.15 * frac;
    }

    if (this.lanternLight && this.lanternBulbMat) {
      this.lanternLight.intensity = isNight ? 18 : 10;
      this.lanternBulbMat.emissiveIntensity = isNight ? 1.2 : 0.55;
    }

    if (playerPos.distanceToSquared(PHOTO_BOOTH_ORIGIN) < 260) {
      if (Math.sin(this.elapsed * 0.9) > 0.72) {
        this.photographer.setWaveTimer(0.25);
      }
      this.photographer.update();
    }
  }

  dispose(): void {
    this.photographer?.dispose();
    this.disposables.forEach((d) => d.dispose());
  }
}
