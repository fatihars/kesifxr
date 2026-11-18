import {metin} from "../metinler.ts";
import * as THREE from 'three';
import * as xb from 'xrblocks';
import {ExplorerCharacter, type CharacterRoleOutfit} from './ExplorerCharacter.ts';
import type {WallRect} from './MuseumBuilding.ts';
import {
  createAnatolianColumn,
  createOttomanAlem,
  createPointedArchGeometry,
  getAnatolianKilimTexture,
  getCobblePlazaTextures,
  getIznikTileTexture,
  getTerracottaRoofTextures,
  getWalnutWoodTextures,
} from '../utils/anatolianMaterials.ts';
import {DEVICE_QUALITY} from '../utils/deviceQuality.ts';

export const CONCERT_ORIGIN = new THREE.Vector3(-38.5, 0, -15.4);
export const CONCERT_LISTENING_SPOT = CONCERT_ORIGIN.clone().add(new THREE.Vector3(0, 0, 6.8));

export class ConcertStage extends xb.Script {
  readonly targets: THREE.Object3D[] = [];
  readonly wall: WallRect = {
    minX: CONCERT_ORIGIN.x - 5.15, maxX: CONCERT_ORIGIN.x + 5.15,
    minZ: CONCERT_ORIGIN.z - 2.13, maxZ: CONCERT_ORIGIN.z + 2,
  };
  private readonly resources = new Set<{dispose(): void}>();
  private performers: ExplorerCharacter[] = [];
  private drummer?: ExplorerCharacter;
  private readonly lanterns: THREE.MeshStandardMaterial[] = [];
  private readonly audience: Array<{body: THREE.Group; phone: THREE.Group; phase: number; interval: number}> = [];
  private readonly stageLights: THREE.SpotLight[] = [];
  private readonly beams: THREE.Mesh<THREE.ConeGeometry, THREE.MeshBasicMaterial>[] = [];
  private elapsed = 0;

  private keep<T extends {dispose(): void}>(resource: T): T {
    this.resources.add(resource);
    return resource;
  }

  init(): void {
    this.position.copy(CONCERT_ORIGIN);
    const cobbleTex = getCobblePlazaTextures(4, 3);
    const walnutTex = getWalnutWoodTextures(3, 1.5);
    const roofTex = getTerracottaRoofTextures(3, 2);
    const iznikTex = getIznikTileTexture('cobalt', 5, 1);
    const kilimCrimsonTex = getAnatolianKilimTexture('crimson');
    const kilimNavyTex = getAnatolianKilimTexture('navy');

    const material = (color: number) => this.keep(new THREE.MeshStandardMaterial({color, roughness: 0.75}));
    const wood = this.keep(
      new THREE.MeshStandardMaterial({
        map: walnutTex.map,
        bumpMap: walnutTex.bumpMap,
        bumpScale: 0.012,
        roughness: 0.65,
      })
    );
    const trim = material(0x253941);
    const brass = this.keep(new THREE.MeshStandardMaterial({color: 0xc29050, metalness: 0.78, roughness: 0.25}));
    const curtain = this.keep(new THREE.MeshStandardMaterial({map: kilimCrimsonTex, roughness: 0.85}));
    const velvet = material(0x702e3b);
    const stone = this.keep(
      new THREE.MeshStandardMaterial({
        map: cobbleTex.map,
        bumpMap: cobbleTex.bumpMap,
        bumpScale: 0.015,
        roughness: 0.86,
      })
    );
    const iznik = this.keep(new THREE.MeshStandardMaterial({map: iznikTex, roughness: 0.34}));
    const terracotta = this.keep(
      new THREE.MeshStandardMaterial({
        map: roofTex.map,
        bumpMap: roofTex.bumpMap,
        bumpScale: 0.02,
        roughness: 0.62,
      })
    );
    const cloth = this.keep(new THREE.MeshStandardMaterial({map: kilimNavyTex, roughness: 0.84}));
    const white = material(0xe6dcc8);
    const box = (mat: THREE.Material, w: number, h: number, d: number, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(this.keep(new THREE.BoxGeometry(w, h, d)), mat);
      mesh.position.set(x, y, z);
      mesh.receiveShadow = true;
      this.add(mesh);
      return mesh;
    };
    const cylinder = (mat: THREE.Material, radius: number, height: number, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(this.keep(new THREE.CylinderGeometry(radius, radius, height, 18)), mat);
      mesh.position.set(x, y, z);
      this.add(mesh);
      return mesh;
    };

    box(stone, 13.8, 0.045, 10.3, 0, 0.022, 2.6);
    box(wood, 10.5, 0.55, 4.55, 0, 0.275, 0);
    box(iznik, 10.56, 0.28, 0.08, 0, 0.32, 2.31);
    box(trim, 10.8, 0.16, 4.65, 0, 0.56, 0);
    box(brass, 10.6, 0.08, 0.10, 0, 0.48, 2.33);
    box(wood, 2.35, 0.23, 0.33, 0, 0.117, 2.5);
    box(wood, 2.0, 0.40, 0.26, 0, 0.20, 2.29);
    for (const x of [-4.98, 4.98]) {
      for (const z of [-1.97, 2.05]) {
        const col = createAnatolianColumn((r) => this.keep(r), 0.16, 4.56, trim, brass, brass);
        col.position.set(x, 0.24, z);
        this.add(col);
      }
      box(trim, 0.29, 0.22, 4.1, x, 4.75, 0.03);
      const roofAlem = createOttomanAlem((r) => this.keep(r), 0.52, brass);
      roofAlem.position.set(x, 4.86, 2.05);
      this.add(roofAlem);
    }
    for (const side of [-1, 1]) {
      const roof = box(terracotta, 5.56, 0.17, 4.82, side * 2.68, 5.22, 0);
      roof.rotation.z = -side * 0.17;
    }
    box(brass, 10.52, 0.12, 0.27, 0, 4.72, 2.08);
    // Ottoman Kemer Proscenium Arch Valance across front upper beam
    const kemerArch = new THREE.Mesh(
      this.keep(createPointedArchGeometry(9.8, 1.05, 8.6, 0.08, 0.85, 0.16)),
      trim
    );
    kemerArch.position.set(0, 3.68, 2.04);
    this.add(kemerArch);

    box(curtain, 10.14, 3.86, 0.17, 0, 2.54, -1.99);
    for (let i = 0; i < 22; i++) {
      const fold = cylinder(velvet, 0.146, 3.84, (i - 10.5) * 0.46, 2.55, -1.86);
      fold.scale.z = 0.64;
    }
    for (const x of [-4.53, 4.53]) {
      box(velvet, 0.75, 2.98, 0.19, x, 2.24, 1.89);
      box(brass, 0.77, 0.10, 0.21, x, 2.1, 1.91);
      box(trim, 0.68, 0.81, 0.48, x, 1.04, 1.25);
    }

    const festoonPts: THREE.Vector3[] = [];
    for (let i = 0; i < 13; i++) {
      const x = (i - 6) * 0.77;
      const y = 4.56 - 0.38 * (1 - Math.abs(i - 6) / 6);
      festoonPts.push(new THREE.Vector3(x, y + 0.07, 2.19));
      const bulb = this.keep(new THREE.MeshStandardMaterial({color: 0xf0ca86, emissive: 0xffbd68, emissiveIntensity: 0.45}));
      this.lanterns.push(bulb);
      const globe = new THREE.Mesh(this.keep(new THREE.SphereGeometry(0.068, 9, 7)), bulb);
      globe.position.set(x, y, 2.19);
      this.add(globe);
    }
    const festoonCurve = new THREE.CatmullRomCurve3(festoonPts);
    const festoonCable = new THREE.Mesh(
      this.keep(new THREE.TubeGeometry(festoonCurve, 24, 0.015, 6, false)),
      trim
    );
    this.add(festoonCable);

    this.sign(metin("ConcertStage", "mirasium_konser_sahnesi"), 5.7, 0.73, 0, 3.62, 2.28);
    const placard = this.sign(metin("ConcertStage", "istek_sarki"), 1.35, 0.48, -3.56, 1.12, 3.45);
    placard.userData.concert = true;
    this.targets.push(placard);
    box(wood, 0.12, 1.0, 0.15, -3.56, 0.5, 3.35);
    const ribbon = material(0xbc5947);
    for (const x of [-5.75, 5.75]) {
      for (const z of [2.55, 4.25, 5.95, 7.65]) cylinder(brass, 0.05, 0.82, x, 0.41, z);
      box(ribbon, 0.045, 0.08, 5.1, x, 0.70, 5.1);
    }
    for (const x of [-3.72, 3.72]) {
      box(ribbon, 4.06, 0.08, 0.045, x, 0.70, 7.65);
    }
    for (const x of [-1.69, 1.69]) cylinder(brass, 0.05, 0.82, x, 0.41, 7.65);
    this.buildAudience();

    const beamGeo = this.keep(new THREE.ConeGeometry(0.86, 1, 13, 1, true));
    beamGeo.translate(0, -0.5, 0);
    for (const [x, color] of [[-3.95, 0xffa66c], [3.95, 0x58e4ff]]) {
      const spot = new THREE.SpotLight(color, 58, 9, 0.24, 0.65, 1.7);
      spot.position.set(x, 4.56, 1.75);
      spot.target.position.set(x * 0.3, 0.7, 0.85);
      this.stageLights.push(spot);
      this.add(spot, spot.target);
      const beam = new THREE.Mesh(beamGeo, this.keep(new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.065, depthWrite: false,
        side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      })));
      beam.position.copy(spot.position);
      this.beams.push(beam);
      this.add(beam);
    }
    for (const x of [-5.71, 5.71]) {
      box(wood, 0.12, 2.8, 0.12, x, 1.4, 4.12);
      box(cloth, 0.67, 1.2, 0.05, x - Math.sign(x) * 0.35, 2.05, 4.15);
      box(brass, 0.69, 0.05, 0.08, x - Math.sign(x) * 0.35, 1.42, 4.15);
    }
    const fixtures: Array<[number, number]> = [[-3.3, 0xffba77], [3.35, 0x8be1d9]];
    for (const [x, color] of fixtures) {
      const light = new THREE.PointLight(color, 20, 8, 2);
      light.position.set(x, 3.3, 1.2);
      this.add(light);
    }

    const addPerformer = (outfit: CharacterRoleOutfit, variant: number, x: number, z: number) => {
      const performer = new ExplorerCharacter(outfit === 'singer' ? 'kadin' : 'erkek', variant, outfit, true);
      performer.position.set(x, 0.65, z);
      performer.rotation.y = Math.PI;
      this.performers.push(performer);
      this.add(performer);
      return performer;
    };
    addPerformer('singer', 1, 0.68, 0.75);
    addPerformer('guitarist', 0, -2.47, 0.27);
    addPerformer('neyzen', 1, 2.47, 0.27);
    const drumX = -0.76;
    this.drummer = addPerformer('concertDrummer', 2, drumX, -0.98);

    const kick = cylinder(velvet, 0.44, 0.43, drumX, 1.08, -0.32);
    kick.rotation.x = Math.PI / 2;
    cylinder(brass, 0.45, 0.05, drumX, 1.08, -0.11).rotation.x = Math.PI / 2;
    cylinder(white, 0.39, 0.022, drumX, 1.08, -0.091).rotation.x = Math.PI / 2;
    for (const x of [drumX - 0.53, drumX + 0.53]) {
      cylinder(velvet, 0.20, 0.22, x, 1.37, -0.45);
      cylinder(white, 0.188, 0.03, x, 1.49, -0.45);
    }
    for (const x of [drumX - 0.87, drumX + 0.87]) {
      cylinder(trim, 0.022, 1.14, x, 1.23, -0.67);
      cylinder(brass, 0.26, 0.04, x, 1.80, -0.67);
    }
  }

  private buildAudience(): void {
    const skin = [0xc58d64, 0xe8b68b, 0x99664b].map((color) => this.keep(new THREE.MeshLambertMaterial({color})));
    const clothes = [0xc0775f, 0x477d77, 0x7c608d, 0xcca554, 0x315471].map((color) =>
      this.keep(new THREE.MeshLambertMaterial({color})));
    const hair = this.keep(new THREE.MeshLambertMaterial({color: 0x302521}));
    const screen = this.keep(new THREE.MeshBasicMaterial({color: 0xc6f6ff}));
    const phoneCase = this.keep(new THREE.MeshLambertMaterial({color: 0x26323a}));
    const torso = this.keep(new THREE.CylinderGeometry(0.16, 0.19, 0.49, 8));
    const head = this.keep(new THREE.SphereGeometry(0.18, 11, 8));
    const limb = this.keep(new THREE.CylinderGeometry(0.049, 0.056, 0.38, 7));
    const phone = this.keep(new THREE.BoxGeometry(0.11, 0.18, 0.036));
    const phoneScreen = this.keep(new THREE.PlaneGeometry(0.083, 0.144));
    const flash = this.keep(new THREE.SphereGeometry(0.035, 8, 6));
    const count = DEVICE_QUALITY.isMobile ? 10 : 16;
    for (let i = 0; i < count; i++) {
      const body = new THREE.Group();
      const liftArm = new THREE.Group();
      const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z = 0, parent = body) => {
        const part = new THREE.Mesh(geo, mat);
        part.position.set(x, y, z);
        parent.add(part);
        return part;
      };
      const jacket = clothes[i % clothes.length];
      const complexion = skin[i % skin.length];
      add(torso, jacket, 0, 0.68);
      add(head, complexion, 0, 1.10);
      add(head, hair, 0, 1.207, 0.025).scale.set(1.02, 0.51, 1.03);
      for (const x of [-0.095, 0.095]) add(limb, hair, x, 0.20);
      add(limb, jacket, -0.195, 0.66).rotation.z = -0.23;
      liftArm.position.set(0.18, 0.85, -0.03);
      add(limb, jacket, 0.073, 0.15, 0, liftArm).rotation.z = -0.38;
      add(head, complexion, 0.147, 0.32, 0, liftArm).scale.setScalar(0.3);
      add(phone, phoneCase, 0.16, 0.39, 0, liftArm);
      add(phoneScreen, screen, 0.16, 0.39, 0.02, liftArm);
      add(flash, screen, 0.16, 0.44, -0.025, liftArm);
      body.add(liftArm);
      const side = i % 2 === 0 ? -1 : 1;
      const slot = Math.floor(i / 2);
      body.position.set(side * (1.2 + (slot % 4) * 1.04) + Math.sin(i * 2) * 0.19, 0,
        3.45 + Math.floor(slot / 4) * 1.92 + (slot % 2) * 0.83);
      body.scale.setScalar(0.85 + (i % 5) * 0.055);
      body.rotation.y = side * 0.16;
      this.audience.push({body, phone: liftArm, phase: (i * 0.676) % 2.8, interval: 1.8 + (i % 7) * 0.17});
      this.add(body);
    }
  }

  private sign(text: string, w: number, h: number, x: number, y: number, z: number): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = Math.round(768 * h / w);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#20343e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#dfb671';
    ctx.lineWidth = 5;
    ctx.strokeRect(7, 7, canvas.width - 14, canvas.height - 14);
    ctx.fillStyle = '#f6e5bd';
    ctx.font = `bold ${Math.min(56, canvas.height * 0.48)}px Georgia`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 384, canvas.height / 2, 700);
    const map = this.keep(new THREE.CanvasTexture(canvas));
    map.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(this.keep(new THREE.PlaneGeometry(w, h)), this.keep(new THREE.MeshBasicMaterial({map})));
    sign.position.set(x, y, z);
    this.add(sign);
    return sign;
  }

  updatePerformance(near: boolean, playing: boolean, dt: number): void {
    if (!near) return;
    if (playing) this.elapsed += dt * 8;
    for (const [i, light] of this.lanterns.entries()) {
      light.emissiveIntensity = playing ? 1.05 + Math.sin(this.elapsed + i * 0.5) * 0.34 : 0.45;
    }
    for (const guest of this.audience) {
      const time = (this.elapsed / 8 + guest.phase) % guest.interval;
      const u = time / 0.68;
      guest.body.position.y = playing && u < 1 ? 4 * 0.392 * u * (1 - u) : 0;
      guest.phone.rotation.z = playing ? Math.sin(this.elapsed * 0.32 + guest.phase * 4) * 0.15 : 0;
    }
    for (const [i, light] of this.stageLights.entries()) {
      light.target.position.x = (i ? 1 : -1) * 1.45 + Math.sin(this.elapsed * 0.29 + i * 2) * 1.7;
      const beam = this.beams[i];
      const direction = light.position.clone().sub(light.target.position);
      beam.scale.y = direction.length();
      beam.quaternion.setFromUnitVectors(THREE.Object3D.DEFAULT_UP, direction.normalize());
      beam.material.opacity = playing ? 0.10 : 0.04;
    }
    this.drummer?.setCraftPhase(playing ? this.elapsed : null);
    for (const performer of this.performers) {
      performer.setStagePerforming(playing);
      performer.update();
    }
  }

  dispose(): void {
    this.performers.forEach((performer) => performer.dispose());
    this.resources.forEach((resource) => resource.dispose());
  }
}
