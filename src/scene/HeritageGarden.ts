import {metin} from "../metinler.ts";
import * as THREE from 'three';
import * as xb from 'xrblocks';
import {ExplorerCharacter} from './ExplorerCharacter.ts';
import type {WallRect} from './MuseumBuilding.ts';
import {DIG_SITE_ORIGIN} from './OutdoorWorld.ts';
import {
  createAnatolianColumn,
  createOttomanAlem,
  createPointedArchGeometry,
  createSeljukStarGeometry,
  getAnatolianKilimTexture,
  getCobblePlazaTextures,
  getIznikTileTexture,
  getLeadDomeTexture,
  getMarbleInlayTexture,
  getTravertineTextures,
  getWalnutWoodTextures,
} from '../utils/anatolianMaterials.ts';

export const COMET_IMAGE = import.meta.env.BASE_URL + '1577-istanbul-kuyrukluyildiz.webp';
export const OBSERVATORY_ORIGIN = new THREE.Vector3(-22, 0, -16.5);
export const OBSERVATORY_VISIT_SPOT = OBSERVATORY_ORIGIN.clone().add(new THREE.Vector3(0, 0, 3.04));
export const OBSERVATORY_GATE = OBSERVATORY_ORIGIN.clone().add(new THREE.Vector3(0, 0, 7.5));
export const DIG_VISIT_SPOT = DIG_SITE_ORIGIN.clone().add(new THREE.Vector3(0, 0, 2.95));
export const HODJA_ORIGIN = new THREE.Vector3(35.3, 0, 13.5);
export const MARKET_STALLS = [
  {name: metin("HeritageGarden", "pamuk_seker"), seller: metin("HeritageGarden", "pamuk_seker_saticisi"), icon: '🍭', color: 0xb04c75, x: -4.8, z: 24},
  {name: metin("HeritageGarden", "kestane"), seller: metin("HeritageGarden", "kestane_saticisi"), icon: '🌰', color: 0xa9583a, x: 4.7, z: 25},
  {name: metin("HeritageGarden", "misir"), seller: metin("HeritageGarden", "misir_saticisi"), icon: '🌽', color: 0xa96d25, x: 4.7, z: 31},
  {name: metin("HeritageGarden", "osmanli_mesir_macunu"), seller: metin("HeritageGarden", "mesir_macunu_saticisi"), icon: '🍬', color: 0x8d5142, x: -4.9, z: 31.5},
];

interface FishInstance {
  root: THREE.Group;
  tailPivot: THREE.Group;
  centerX: number;
  centerZ: number;
  radiusX: number;
  radiusZ: number;
  baseY: number;
  speed: number;
  phase: number;
  figureEight: boolean;
}

const MACUNCU_ORIGIN = new THREE.Vector3(-4.9, 0, 31.5);

export function inObservatory(p: THREE.Vector3): boolean {
  return Math.abs(p.x - OBSERVATORY_ORIGIN.x) < 5.35 &&
    Math.abs(p.z - OBSERVATORY_ORIGIN.z) < 4.85;
}

export class HeritageGarden extends xb.Script {
  readonly targets: THREE.Object3D[] = [];
  readonly walls: WallRect[] = [];
  private readonly resources = new Set<{dispose(): void}>();
  private readonly people: ExplorerCharacter[] = [];
  private readonly spoon = new THREE.Group();
  private readonly fishes: FishInstance[] = [];
  private macunStickPivot?: THREE.Group;
  private ripple?: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  private elapsed = 0;

  private keep<T extends {dispose(): void}>(resource: T): T {
    this.resources.add(resource);
    return resource;
  }

  private mat(color: number): THREE.MeshStandardMaterial {
    return this.keep(new THREE.MeshStandardMaterial({color, roughness: 0.83}));
  }

  private box(parent: THREE.Object3D, mat: THREE.Material, w: number, h: number, d: number, x: number, y: number, z: number): THREE.Mesh {
    const mesh = new THREE.Mesh(this.keep(new THREE.BoxGeometry(w, h, d)), mat);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  private sign(parent: THREE.Object3D, lines: string[], width: number, height: number, x: number, y: number, z: number): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = Math.round(768 * height / width);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#efdfbd';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#31595f';
    ctx.lineWidth = 10;
    ctx.strokeRect(13, 13, canvas.width - 26, canvas.height - 26);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#224047';
    const leading = (canvas.height - 20) / (lines.length + 0.55);
    lines.forEach((line, i) => {
      ctx.font = `${i === 0 ? 'bold ' : ''}${Math.min(58, Math.round(leading * 0.67))}px Georgia`;
      ctx.fillText(line, 384, 10 + leading * (i + 0.8), 696);
    });
    const texture = this.keep(new THREE.CanvasTexture(canvas));
    texture.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(
      this.keep(new THREE.PlaneGeometry(width, height)),
      this.keep(new THREE.MeshBasicMaterial({map: texture}))
    );
    sign.position.set(x, y, z);
    parent.add(sign);
    return sign;
  }

  init(): void {
    this.buildObservatory();
    this.buildStream();
    this.buildExcavationCamp();
    MARKET_STALLS.forEach((_, i) => this.buildVendor(i));
  }

  private buildObservatory(): void {
    const court = new THREE.Group();
    court.position.copy(OBSERVATORY_ORIGIN);
    this.add(court);
    const trav = getTravertineTextures(3, 2);
    const limestone = this.keep(
      new THREE.MeshStandardMaterial({
        map: trav.map,
        bumpMap: trav.bumpMap,
        bumpScale: 0.022,
        color: 0xdcc39b,
        roughness: 0.78,
      })
    );
    const paleStone = this.keep(
      new THREE.MeshStandardMaterial({
        map: getMarbleInlayTexture(4, 4),
        color: 0xf4e8d2,
        roughness: 0.56,
      })
    );
    const tile = this.keep(
      new THREE.MeshStandardMaterial({
        map: getIznikTileTexture('cobalt', 4, 1),
        roughness: 0.25,
        metalness: 0.16,
      })
    );
    const lead = this.keep(
      new THREE.MeshStandardMaterial({
        map: getLeadDomeTexture(4, 2),
        roughness: 0.36,
        metalness: 0.58,
      })
    );
    const walnut = this.keep(
      new THREE.MeshStandardMaterial({
        map: getWalnutWoodTextures(2, 2).map,
        color: 0x62402b,
        roughness: 0.62,
      })
    );
    const brass = this.keep(
      new THREE.MeshStandardMaterial({color: 0xe3b34c, roughness: 0.26, metalness: 0.84})
    );
    const wall = (w: number, d: number, x: number, z: number, height: number) => {
      this.box(court, limestone, w, height, d, x, height / 2, z);
      this.walls.push({
        minX: court.position.x + x - w / 2, maxX: court.position.x + x + w / 2,
        minZ: court.position.z + z - d / 2, maxZ: court.position.z + z + d / 2,
      });
    };
    this.box(court, paleStone, 12, 0.06, 10.4, 0, 0.03, 0.2);
    this.box(court, limestone, 3.8, 0.055, 3.2, 0, 0.026, 6.35);
    wall(11.65, 0.34, 0, -4.9, 4.4);
    for (const side of [-1, 1]) {
      wall(0.34, 3.7, side * 5.65, -3.05, 4.4);
      wall(0.34, 6.2, side * 5.65, 1.9, 1.18);
      wall(4, 0.35, side * 3.78, 5, 1.28);
      for (const z of [-3.9, -2.45, -0.95]) {
        this.box(court, paleStone, 0.26, 4.2, 0.25, side * 5.43, 2.15, z);
      }
      this.box(court, tile, 0.29, 0.2, 6.35, side * 5.45, 1.22, 1.9);
    }

    // Reading gallery opens onto a terrace with an unobstructed view of the sky.
    this.box(court, lead, 11.7, 0.25, 4.05, 0, 4.48, -2.98);
    this.box(court, tile, 11.5, 0.28, 0.22, 0, 4.28, -0.94);
    this.box(court, paleStone, 11.25, 0.18, 0.22, 0, 3.93, -0.94);
    for (const x of [-5.25, -2.68, 2.68, 5.25]) {
      const galCol = createAnatolianColumn(
        (item) => this.keep(item),
        0.16,
        3.92,
        paleStone,
        tile,
        brass
      );
      galCol.position.set(x, 0.04, -0.94);
      court.add(galCol);
    }
    for (const x of [-3.96, 0, 3.96]) {
      const openW = x === 0 ? 4.9 : 2.25;
      const arch = new THREE.Mesh(
        this.keep(
          createPointedArchGeometry(openW + 0.32, 1.0, openW, 0.14, 0.86, 0.22)
        ),
        paleStone
      );
      arch.position.set(x, 2.95, -0.94);
      court.add(arch);
    }

    // Stone observation towers and a pointed Seljuk entry arch identify the complex
    for (const side of [-1, 1]) {
      const x = side * 4.65;
      const z = 4.72;
      const drum = new THREE.Mesh(this.keep(new THREE.CylinderGeometry(1.03, 1.21, 5.15, 8)), limestone);
      drum.position.set(x, 2.57, z);
      drum.rotation.y = Math.PI / 8;
      court.add(drum);
      this.walls.push({minX: court.position.x + x - 1.13, maxX: court.position.x + x + 1.13,
        minZ: court.position.z + z - 1.13, maxZ: court.position.z + z + 1.13});
      const eave = new THREE.Mesh(this.keep(new THREE.CylinderGeometry(1.24, 1.15, 0.26, 8)), tile);
      eave.position.set(x, 5.09, z);
      court.add(eave);
      const cap = new THREE.Mesh(this.keep(new THREE.ConeGeometry(1.26, 1.65, 8)), lead);
      cap.position.set(x, 6.0, z);
      cap.rotation.y = Math.PI / 8;
      court.add(cap);
      const towerAlem = createOttomanAlem((item) => this.keep(item), 0.72, brass);
      towerAlem.position.set(x, 6.8, z);
      court.add(towerAlem);
      for (const y of [2.55, 3.95]) {
        this.box(court, tile, 0.22, 0.56, 0.06, x, y, z + 1.025);
        this.box(court, paleStone, 0.36, 0.09, 0.18, x, y - 0.32, z + 1.05);
      }
    }
    for (const x of [-1.76, 1.76]) {
      const gateCol = createAnatolianColumn(
        (item) => this.keep(item),
        0.18,
        3.25,
        paleStone,
        tile,
        brass
      );
      gateCol.position.set(x, 0.04, 5.0);
      court.add(gateCol);
    }
    const entryPortalArch = new THREE.Mesh(
      this.keep(createPointedArchGeometry(3.88, 1.2, 3.16, 0.16, 1.04, 0.38)),
      paleStone
    );
    entryPortalArch.position.set(0, 2.55, 5.0);
    court.add(entryPortalArch);
    this.sign(court, [metin("HeritageGarden", "daru_r_rasadu_l_cedid"), metin("HeritageGarden", "takiyuddin_in_rasathanesi")], 3.93, 0.81, 0, 4.01, 5.28);

    // The supplied miniature is preserved in full on the gallery wall.
    this.box(court, walnut, 4.26, 3.02, 0.15, -1.84, 2.14, -4.67);
    this.box(court, brass, 4.01, 2.78, 0.06, -1.84, 2.14, -4.56);
    const illustration = this.keep(new THREE.TextureLoader().load(COMET_IMAGE));
    illustration.colorSpace = THREE.SRGBColorSpace;
    const picture = new THREE.Mesh(this.keep(new THREE.PlaneGeometry(3.86, 3.86 * 524 / 768)),
      this.keep(new THREE.MeshBasicMaterial({map: illustration})));
    picture.position.set(-1.84, 2.14, -4.516);
    picture.userData.heritageAction = 'comet';
    court.add(picture);
    this.targets.push(picture);
    this.sign(court, [metin("HeritageGarden", "1577_istanbul_semalarinda_kuyruklu_yildiz")], 4.02, 0.31, -1.84, 0.56, -4.63);

    const tablet = this.sign(court, [
      metin("HeritageGarden", "takiyuddin_er_rasid"), metin("HeritageGarden", "istanbul_rasathanesi_nin_kurucusu"), metin("HeritageGarden", "astronomi_matematik_mekanik"), metin("HeritageGarden", "bilim_mirasina_saygiyla"),
    ], 2.72, 1.83, 2.83, 2.13, -4.65);
    tablet.userData.heritageAction = 'biography';
    this.targets.push(tablet);
    this.box(court, tile, 3.10, 0.012, 2.50, 2.84, 0.067, -3.35);
    for (const side of [-1, 1]) {
      this.box(court, brass, 0.035, 0.015, 2.34, 2.84 + side * 1.39, 0.074, -3.35);
      this.box(court, brass, 2.8, 0.015, 0.035, 2.84, 0.074, -3.35 + side * 1.17);
    }
    const galleryLight = new THREE.PointLight(0xffdfb6, 20, 9, 2);
    galleryLight.position.set(0, 3.85, -2.7);
    court.add(galleryLight);

    // The terrace has a large armillary and a quadrant, with clear space between them.
    const armillaryX = -3.37;
    const armillaryZ = 1.8;
    const compassStar = new THREE.Mesh(
      this.keep(createSeljukStarGeometry(1.18, 0.72, 0.03)),
      tile
    );
    compassStar.rotation.x = -Math.PI / 2;
    compassStar.position.set(armillaryX, 0.07, armillaryZ);
    court.add(compassStar);

    const platform = new THREE.Mesh(this.keep(new THREE.CylinderGeometry(0.82, 1.04, 0.2, 8)), limestone);
    platform.position.set(armillaryX, 0.15, armillaryZ);
    court.add(platform);
    this.box(court, walnut, 0.48, 0.89, 0.48, armillaryX, 0.63, armillaryZ);
    for (const [i, [x, y]] of [[0, 0], [1.57, 0], [0.6, 1.57], [0.64, 0.45], [0, 0.78], [1.05, -0.76]].entries()) {
      const ring = new THREE.Mesh(this.keep(new THREE.TorusGeometry(1.08 - i * 0.027, 0.031, 7, 40)), brass);
      ring.position.set(armillaryX, 1.91, armillaryZ);
      ring.rotation.set(x, y, 0);
      ring.userData.heritageAction = 'observe';
      court.add(ring);
      this.targets.push(ring);
    }
    this.sign(court, [metin("HeritageGarden", "zatu_l_halak"), metin("HeritageGarden", "halkali_gozlem_araci")], 1.74, 0.57, armillaryX, 0.56, 2.52);

    const quadrant = new THREE.Group();
    quadrant.position.set(3.14, 1.08, 1.12);
    court.add(quadrant);
    this.box(quadrant, walnut, 2.48, 0.19, 1.14, 0, -0.8, -0.03);
    this.box(quadrant, limestone, 0.31, 1.0, 0.42, 0, -0.42, -0.15);
    const arc = new THREE.Mesh(this.keep(new THREE.TorusGeometry(1.22, 0.085, 8, 31, Math.PI / 2)), brass);
    quadrant.add(arc);
    arc.userData.heritageAction = 'observe';
    this.targets.push(arc);
    for (let angle = 0; angle <= 90; angle += 5) {
      const a = angle * Math.PI / 180;
      const mark = this.box(quadrant, walnut, angle % 15 ? 0.085 : 0.16, 0.027, 0.022, Math.cos(a) * 1.22, Math.sin(a) * 1.22, 0.08);
      mark.rotation.z = a;
    }
    const rule = this.box(quadrant, brass, 1.49, 0.052, 0.075, 0.63, 0.36, 0.095);
    rule.rotation.z = 0.52;
    rule.userData.heritageAction = 'observe';
    this.targets.push(rule);
    const measure = this.sign(court, [metin("HeritageGarden", "rasat_terasi"), metin("HeritageGarden", "1577_kuyruklu_yildizi")], 1.82, 0.62, 3.14, 0.83, 1.7);
    measure.userData.heritageAction = 'observe';
    this.targets.push(measure);
  }

  private buildStream(): void {
    const root = new THREE.Group();
    root.position.copy(HODJA_ORIGIN);
    this.add(root);
    const cobble = getCobblePlazaTextures(2, 3);
    const grass = this.keep(
      new THREE.MeshStandardMaterial({
        map: cobble.map,
        bumpMap: cobble.bumpMap,
        bumpScale: 0.015,
        color: 0xaab488,
        roughness: 0.88,
      })
    );
    const water = this.keep(
      new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        roughness: 0.12,
        metalness: 0.22,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      })
    );
    const bedMat = this.keep(
      new THREE.MeshStandardMaterial({
        color: 0x0d3b4c,
        roughness: 0.92,
      })
    );
    const trav = getTravertineTextures(1, 1);
    const stone = this.keep(
      new THREE.MeshStandardMaterial({
        map: trav.map,
        bumpMap: trav.bumpMap,
        bumpScale: 0.02,
        color: 0xbcb099,
        roughness: 0.84,
      })
    );
    this.box(root, grass, 3.9, 0.074, 6.2, -1.2, 0.03, -0.5);

    const centerline = [[0.75, 7.2], [2, 4.8], [2.6, 2.4], [2.8, 0], [3.2, -2.4], [3.85, -4.8], [4.4, -7.2]];
    const vertices: number[] = [];
    const bedVertices: number[] = [];
    const indices: number[] = [];
    centerline.forEach(([x, z], i) => {
      const width = 1.25 + 1.4 * Math.exp(-z * z / 9);
      vertices.push(x - width, 0.145, z, x + width, 0.145, z);
      bedVertices.push(x - width, 0.015, z, x + width, 0.015, z);
      if (i > 0) {
        const a = i * 2 - 2;
        indices.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
        this.walls.push({minX: HODJA_ORIGIN.x + x - width * 0.7, maxX: HODJA_ORIGIN.x + x + width * 0.75,
          minZ: HODJA_ORIGIN.z + z, maxZ: HODJA_ORIGIN.z + centerline[i - 1][1]});
      }
      for (const side of [-1, 1]) {
        const rock = new THREE.Mesh(this.keep(new THREE.DodecahedronGeometry(0.42, 0)), stone);
        rock.position.set(x + side * (width + 0.12), 0.2, z);
        rock.scale.set(1.3, 0.55, 0.9);
        rock.rotation.y = i * 0.63;
        root.add(rock);
      }
    });
    const bedRibbon = this.keep(new THREE.BufferGeometry());
    bedRibbon.setAttribute('position', new THREE.Float32BufferAttribute(bedVertices, 3));
    bedRibbon.setIndex(indices);
    bedRibbon.computeVertexNormals();
    root.add(new THREE.Mesh(bedRibbon, bedMat));

    const ribbon = this.keep(new THREE.BufferGeometry());
    ribbon.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    ribbon.setIndex(indices);
    ribbon.computeVertexNormals();
    const waterMesh = new THREE.Mesh(ribbon, water);
    waterMesh.renderOrder = 2;
    root.add(waterMesh);

    // Colorful swimming fish inside the pond/stream basin
    this.buildStreamFish(root);

    // Decorative arched Anatolian stone bridge across south bend of stream (visual scenic landmark)
    const bridge = new THREE.Group();
    bridge.position.set(2.2, 0.08, 3.8);
    const bridgeDeck = new THREE.Mesh(
      this.keep(new THREE.CylinderGeometry(3.4, 3.4, 1.35, 18, 1, false, -0.5, 1.0)),
      stone
    );
    bridgeDeck.rotation.z = Math.PI / 2;
    bridgeDeck.rotation.y = Math.PI / 2;
    bridgeDeck.position.y = -2.45;
    bridge.add(bridgeDeck);
    for (const bz of [-0.6, 0.6]) {
      for (const bx of [-1.2, 0, 1.2]) {
        const post = new THREE.Mesh(this.keep(new THREE.BoxGeometry(0.14, 0.65, 0.14)), stone);
        post.position.set(bx, 0.75 - Math.abs(bx) * 0.16, bz);
        bridge.add(post);
      }
    }
    root.add(bridge);

    const hodja = new ExplorerCharacter('erkek', 0, 'anatolian', true);
    hodja.rotation.y = -Math.PI / 2;
    hodja.position.set(-0.35, 0, 0);
    root.add(hodja);
    this.people.push(hodja);
    const wrapMat = this.mat(0xfaf4e4);
    const wrap = new THREE.Mesh(this.keep(new THREE.TorusGeometry(0.218, 0.068, 8, 22)), wrapMat);
    wrap.rotation.x = Math.PI / 2;
    wrap.position.set(-0.35, 1.39, 0);
    root.add(wrap);
    this.spoon.position.set(0.02, 0.92, -0.16);
    const spoonWood = this.keep(
      new THREE.MeshStandardMaterial({
        map: getWalnutWoodTextures(1, 1).map,
        color: 0x8b5a36,
        roughness: 0.68,
      })
    );
    this.box(this.spoon, spoonWood, 1.17, 0.054, 0.055, 0.55, 0, 0);
    const bowl = new THREE.Mesh(this.keep(new THREE.SphereGeometry(0.19, 12, 8)), spoonWood);
    bowl.position.x = 1.2;
    bowl.scale.set(1.15, 0.23, 0.66);
    this.spoon.add(bowl);
    root.add(this.spoon);

    // Glazed Anatolian clay yogurt/water jugs beside Hodja
    const clayMat = this.mat(0xb86643);
    const jug = new THREE.Mesh(this.keep(new THREE.CylinderGeometry(0.15, 0.26, 0.42, 16)), clayMat);
    jug.position.set(-0.34, 0.23, 0.62);
    const jugNeck = new THREE.Mesh(this.keep(new THREE.CylinderGeometry(0.11, 0.15, 0.12, 14)), clayMat);
    jugNeck.position.set(-0.34, 0.48, 0.62);
    root.add(jug, jugNeck);

    this.ripple = new THREE.Mesh(this.keep(new THREE.RingGeometry(0.25, 0.29, 30)),
      this.keep(new THREE.MeshBasicMaterial({color: 0xc7f6ed, transparent: true, opacity: 0.55, depthWrite: false})));
    this.ripple.rotation.x = -Math.PI / 2;
    this.ripple.position.set(1.49, 0.155, -0.15);
    root.add(this.ripple);
    this.box(root, spoonWood, 0.10, 1.39, 0.10, -2.62, 0.7, 0.25);
    const sign = this.sign(root, [metin("HeritageGarden", "nasreddin_hoca"), metin("HeritageGarden", "ya_tutarsa")], 1.72, 0.68, -2.62, 1.37, 0.31);
    sign.userData.heritageAction = 'hodja';
    this.targets.push(sign);
  }

  private buildStreamFish(root: THREE.Group): void {
    const fishPalette = [
      {body: 0xf97316, fin: 0xfef08a, scale: 1.05}, // Turuncu Koi
      {body: 0xfacc15, fin: 0xfef9c3, scale: 0.95}, // Altın Sazan
      {body: 0x38bdf8, fin: 0xe0f2fe, scale: 0.85}, // Turkuaz Alabalık
      {body: 0xef4444, fin: 0xf8fafc, scale: 1.12}, // Kırmızı-Beyaz Koi
      {body: 0xfb923c, fin: 0xffedd5, scale: 0.9},  // Kehribar Koi
      {body: 0xeab308, fin: 0xfde047, scale: 0.78}, // Küçük Sazan
      {body: 0x2dd4bf, fin: 0xccfbf1, scale: 0.88}, // Zümrüt Deresi Balığı
      {body: 0xf43f5e, fin: 0xffe4e6, scale: 0.96}, // Mercan Koi
      {body: 0xf59e0b, fin: 0xfef3c7, scale: 0.82}, // Altın Dere Balığı
    ];

    const bodyGeo = this.keep(new THREE.SphereGeometry(0.095, 10, 8));
    const tailGeo = this.keep(new THREE.ConeGeometry(0.068, 0.13, 4));
    const finGeo = this.keep(new THREE.BoxGeometry(0.08, 0.012, 0.055));
    const dorsalGeo = this.keep(new THREE.ConeGeometry(0.036, 0.075, 4));
    const eyeGeo = this.keep(new THREE.SphereGeometry(0.016, 6, 5));
    const eyeMat = this.keep(new THREE.MeshBasicMaterial({color: 0x0f172a}));

    const swimZones = [
      {cx: 2.8, cz: 0.1, rx: 0.95, rz: 1.35, y: 0.072, speed: 0.75, f8: true},
      {cx: 2.6, cz: 1.4, rx: 0.85, rz: 0.95, y: 0.088, speed: 0.92, f8: false},
      {cx: 3.1, cz: -1.1, rx: 0.85, rz: 1.25, y: 0.068, speed: 0.84, f8: true},
      {cx: 2.4, cz: -0.2, rx: 1.05, rz: 1.5, y: 0.094, speed: 0.68, f8: false},
      {cx: 3.3, cz: 0.7, rx: 0.72, rz: 1.05, y: 0.078, speed: 1.05, f8: true},
      {cx: 2.9, cz: -2.2, rx: 0.65, rz: 1.0, y: 0.085, speed: 1.12, f8: false},
      {cx: 2.2, cz: 2.5, rx: 0.58, rz: 0.85, y: 0.076, speed: 0.98, f8: true},
      {cx: 3.5, cz: -3.4, rx: 0.52, rz: 0.95, y: 0.074, speed: 0.88, f8: false},
      {cx: 2.9, cz: 0.4, rx: 0.9, rz: 1.2, y: 0.064, speed: -0.78, f8: true},
    ];

    swimZones.forEach((z, idx) => {
      const pal = fishPalette[idx % fishPalette.length];
      const bodyMat = this.keep(
        new THREE.MeshStandardMaterial({color: pal.body, roughness: 0.35, metalness: 0.15})
      );
      const finMat = this.keep(
        new THREE.MeshStandardMaterial({color: pal.fin, roughness: 0.45})
      );

      const fishRoot = new THREE.Group();
      fishRoot.scale.setScalar(pal.scale);

      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.scale.set(0.58, 0.68, 1.55);
      fishRoot.add(body);

      const dorsal = new THREE.Mesh(dorsalGeo, finMat);
      dorsal.position.set(0, 0.068, -0.01);
      dorsal.rotation.x = -0.35;
      dorsal.scale.set(0.35, 1, 1.3);
      fishRoot.add(dorsal);

      for (const side of [-1, 1]) {
        const pec = new THREE.Mesh(finGeo, finMat);
        pec.position.set(side * 0.062, -0.015, 0.02);
        pec.rotation.y = side * 0.45;
        pec.rotation.z = side * -0.25;
        fishRoot.add(pec);

        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        eye.position.set(side * 0.042, 0.022, 0.095);
        fishRoot.add(eye);
      }

      const tailPivot = new THREE.Group();
      tailPivot.position.set(0, 0, -0.13);
      const tail = new THREE.Mesh(tailGeo, finMat);
      tail.rotation.x = Math.PI / 2;
      tail.position.z = -0.055;
      tail.scale.set(0.32, 1, 1.05);
      tailPivot.add(tail);
      fishRoot.add(tailPivot);

      fishRoot.position.set(z.cx, z.y, z.cz);
      root.add(fishRoot);

      this.fishes.push({
        root: fishRoot,
        tailPivot,
        centerX: z.cx,
        centerZ: z.cz,
        radiusX: z.rx,
        radiusZ: z.rz,
        baseY: z.y,
        speed: z.speed,
        phase: idx * 0.85,
        figureEight: z.f8,
      });
    });
  }

  private buildVendor(index: number): void {
    const info = MARKET_STALLS[index];
    const root = new THREE.Group();
    root.position.set(info.x, 0, info.z);
    root.rotation.y = info.x < 0 ? Math.PI / 2 : -Math.PI / 2;
    this.add(root);
    const color = this.mat(info.color);
    const cream = this.mat(0xf7ddb0);
    const brassMat = this.keep(
      new THREE.MeshStandardMaterial({color: 0xe3b34c, metalness: 0.8, roughness: 0.25})
    );
    const walnut = getWalnutWoodTextures(2, 1);
    const wood = this.keep(
      new THREE.MeshStandardMaterial({
        map: walnut.map,
        bumpMap: walnut.bumpMap,
        bumpScale: 0.015,
        color: 0x724c34,
        roughness: 0.68,
      })
    );
    this.box(root, wood, 1.58, 0.74, 0.78, 0, 0.4, 0.24);
    this.box(root, cream, 1.72, 0.13, 0.9, 0, 0.82, 0.24);
    // Spoked wooden Ottoman street cart wheels flanking each market cart
    const wheelRimGeo = this.keep(new THREE.TorusGeometry(0.32, 0.04, 8, 16));
    const spokeGeo = this.keep(new THREE.CylinderGeometry(0.018, 0.018, 0.62, 6));
    [-0.84, 0.84].forEach((wx) => {
      const wheel = new THREE.Group();
      wheel.position.set(wx, 0.36, 0.24);
      wheel.rotation.y = Math.PI / 2;
      const rim = new THREE.Mesh(wheelRimGeo, wood);
      wheel.add(rim);
      for (let s = 0; s < 4; s++) {
        const spoke = new THREE.Mesh(spokeGeo, brassMat);
        spoke.rotation.z = (s * Math.PI) / 4;
        wheel.add(spoke);
      }
      root.add(wheel);
    });

    for (const x of [-0.75, 0.75]) {
      this.box(root, wood, 0.08, 2.15, 0.08, x, 1.08, 0);
      const finial = new THREE.Mesh(this.keep(new THREE.SphereGeometry(0.065, 10, 8)), brassMat);
      finial.position.set(x, 2.26, 0.05);
      root.add(finial);
    }
    for (let stripe = 0; stripe < 7; stripe++) {
      const panel = this.box(root, stripe % 2 ? cream : color, 0.266, 0.12, 1.18, (stripe - 3) * 0.264, 2.15, 0.08);
      panel.rotation.x = 0.08;
    }
    const sign = this.sign(root, [info.name.toLocaleUpperCase('tr-TR')], 1.42, 0.34, 0, 0.46, 0.642);
    sign.userData.marketVendor = index;
    this.targets.push(sign);
    const seller = new ExplorerCharacter(index === 1 ? 'kadin' : 'erkek', index, 'anatolian', true);
    seller.position.z = -0.57;
    seller.rotation.y = Math.PI;
    root.add(seller);
    this.people.push(seller);
    seller.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) object.userData.marketVendor = index;
    });
    this.targets.push(seller);
    if (index === 3) {
      this.buildMacuncuTray(root, brassMat, cream, index);
    } else {
      const snackMat = this.mat([0xf58eb9, 0x784735, 0xf5bf44, 0x975127][index]);
      for (let i = 0; i < 5; i++) {
        const snack = new THREE.Mesh(
          this.keep(new THREE.SphereGeometry(index === 0 ? 0.105 : 0.075, 9, 6)),
          snackMat
        );
        snack.position.set((i - 2) * 0.24, index === 0 ? 1.17 : 0.97, 0.36);
        if (index === 2) snack.scale.y = 2.1;
        if (index === 0) this.box(root, cream, 0.017, 0.26, 0.017, snack.position.x, 1.0, 0.36);
        root.add(snack);
      }
    }
    this.walls.push({minX: info.x - 0.65, maxX: info.x + 0.65, minZ: info.z - 0.84, maxZ: info.z + 0.84});
  }

  private buildMacuncuTray(
    root: THREE.Group,
    brassMat: THREE.Material,
    cream: THREE.Material,
    vendorIndex: number
  ): void {
    // Traditional red Ottoman Fes + dark tassel on the macuncu vendor
    const fesMat = this.keep(
      new THREE.MeshStandardMaterial({color: 0xb91c1c, roughness: 0.62})
    );
    const tasselMat = this.keep(
      new THREE.MeshStandardMaterial({color: 0x1e293b, roughness: 0.7})
    );
    const fes = new THREE.Mesh(
      this.keep(new THREE.CylinderGeometry(0.115, 0.145, 0.15, 16)),
      fesMat
    );
    fes.position.set(0, 1.45, -0.57);
    const tassel = new THREE.Mesh(
      this.keep(new THREE.CylinderGeometry(0.014, 0.022, 0.14, 6)),
      tasselMat
    );
    tassel.position.set(0.115, 1.44, -0.57);
    tassel.rotation.z = -0.25;
    root.add(fes, tassel);

    // Raised brass pedestal & large circular tilted Macun Tepsisi tray
    const pedestal = new THREE.Mesh(
      this.keep(new THREE.CylinderGeometry(0.14, 0.19, 0.12, 16)),
      brassMat
    );
    pedestal.position.set(-0.04, 0.94, 0.26);
    root.add(pedestal);

    const trayGroup = new THREE.Group();
    trayGroup.position.set(-0.04, 1.02, 0.26);
    trayGroup.rotation.x = 0.16;
    root.add(trayGroup);

    const trayBase = new THREE.Mesh(
      this.keep(new THREE.CylinderGeometry(0.43, 0.4, 0.052, 28)),
      brassMat
    );
    trayBase.userData.marketVendor = vendorIndex;
    trayGroup.add(trayBase);
    this.targets.push(trayBase);

    const rim = new THREE.Mesh(
      this.keep(new THREE.TorusGeometry(0.425, 0.024, 8, 28)),
      brassMat
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.022;
    trayGroup.add(rim);

    // 6 glossy colorful radial macun wedges separated by thin brass ribs
    const wedgeColors = [0xef4444, 0xfacc15, 0x22c55e, 0xf97316, 0xa855f7, 0x06b6d4];
    const wedgeRadius = 0.37;
    const sweep = Math.PI / 3 - 0.05;
    for (let i = 0; i < 6; i++) {
      const startAng = i * (Math.PI / 3) + 0.025;
      const wedgeMat = this.keep(
        new THREE.MeshStandardMaterial({
          color: wedgeColors[i],
          roughness: 0.18,
          metalness: 0.06,
        })
      );
      const wedge = new THREE.Mesh(
        this.keep(new THREE.CylinderGeometry(wedgeRadius, wedgeRadius, 0.046, 8, 1, false, startAng, sweep)),
        wedgeMat
      );
      wedge.position.y = 0.026;
      wedge.userData.marketVendor = vendorIndex;
      trayGroup.add(wedge);

      const divider = new THREE.Mesh(
        this.keep(new THREE.BoxGeometry(0.014, 0.052, wedgeRadius)),
        brassMat
      );
      const divAng = i * (Math.PI / 3);
      divider.position.set(
        Math.sin(divAng) * (wedgeRadius * 0.5),
        0.028,
        Math.cos(divAng) * (wedgeRadius * 0.5)
      );
      divider.rotation.y = divAng;
      trayGroup.add(divider);
    }

    // Center brass lemon bowl & lid knob
    const centerBowl = new THREE.Mesh(
      this.keep(new THREE.CylinderGeometry(0.085, 0.065, 0.068, 14)),
      brassMat
    );
    centerBowl.position.y = 0.045;
    trayGroup.add(centerBowl);

    // Brass cup holding wooden macun sticks on the side of the cart
    const stickCup = new THREE.Mesh(
      this.keep(new THREE.CylinderGeometry(0.075, 0.06, 0.14, 12)),
      brassMat
    );
    stickCup.position.set(0.56, 0.95, 0.28);
    root.add(stickCup);

    const stickGeo = this.keep(new THREE.CylinderGeometry(0.008, 0.008, 0.28, 6));
    for (let s = 0; s < 6; s++) {
      const st = new THREE.Mesh(stickGeo, cream);
      st.position.set(
        0.56 + Math.cos(s * 1.1) * 0.028,
        1.07,
        0.28 + Math.sin(s * 1.1) * 0.028
      );
      st.rotation.set((s % 3 - 1) * 0.14, 0, ((s + 1) % 3 - 1) * 0.14);
      root.add(st);
    }

    // Animated twirling rainbow macun stick above the tray
    this.macunStickPivot = new THREE.Group();
    this.macunStickPivot.position.set(-0.04, 1.18, 0.24);
    const activeStick = new THREE.Mesh(stickGeo, cream);
    activeStick.rotation.x = 0.68;
    this.macunStickPivot.add(activeStick);
    const candyGeo = this.keep(new THREE.TorusGeometry(0.028, 0.013, 6, 14));
    [0xef4444, 0xfacc15, 0x22c55e].forEach((c, idx) => {
      const bandMat = this.keep(
        new THREE.MeshStandardMaterial({color: c, roughness: 0.18})
      );
      const band = new THREE.Mesh(candyGeo, bandMat);
      band.position.set(0, 0.08 - idx * 0.018, 0.075 - idx * 0.016);
      band.rotation.x = 0.68 + Math.PI / 2;
      this.macunStickPivot!.add(band);
    });
    root.add(this.macunStickPivot);
  }

  private buildExcavationCamp(): void {
    const camp = new THREE.Group();
    camp.position.copy(DIG_SITE_ORIGIN);
    this.add(camp);
    const walnut = getWalnutWoodTextures(2, 2);
    const wood = this.keep(
      new THREE.MeshStandardMaterial({
        map: walnut.map,
        bumpMap: walnut.bumpMap,
        bumpScale: 0.015,
        color: 0x704c34,
        roughness: 0.72,
      })
    );
    const canvas = this.keep(
      new THREE.MeshStandardMaterial({
        map: getAnatolianKilimTexture('turquoise'),
        color: 0xe7d9b5,
        roughness: 0.88,
      })
    );
    const clay = this.mat(0xaa6543);
    const brass = this.keep(
      new THREE.MeshStandardMaterial({color: 0xd99b26, metalness: 0.78, roughness: 0.28})
    );
    this.sign(camp, [metin("HeritageGarden", "arkeoloji_kazi_alani")], 2.68, 0.52, -3.69, 2.05, 1.6);
    for (const x of [-4.7, -2.86]) {
      for (const z of [-1.3, 0.94]) this.box(camp, wood, 0.09, 2.25, 0.09, x, 1.13, z);
    }
    // Pitched Anatolian canvas tent gable roof with brass pole tips
    [-0.56, 0.56].forEach((offsetX) => {
      const slope = this.box(camp, canvas, 1.24, 0.08, 2.68, -3.78 + offsetX, 2.42, -0.18);
      slope.rotation.z = offsetX < 0 ? 0.38 : -0.38;
    });
    this.box(camp, wood, 0.1, 0.1, 2.78, -3.78, 2.68, -0.18);
    const tentFinial = new THREE.Mesh(this.keep(new THREE.SphereGeometry(0.08, 10, 8)), brass);
    tentFinial.position.set(-3.78, 2.8, 1.15);
    camp.add(tentFinial);

    this.box(camp, wood, 1.38, 0.82, 0.61, -3.71, 0.44, -0.55);
    this.box(camp, canvas, 1.56, 0.075, 0.7, -3.71, 0.9, -0.55);
    // Ceramic bowl & amphora vase on field desk
    this.box(camp, clay, 0.27, 0.09, 0.27, -3.25, 0.984, -0.55);
    const jug = new THREE.Mesh(this.keep(new THREE.CylinderGeometry(0.08, 0.13, 0.28, 12)), clay);
    jug.position.set(-3.95, 1.07, -0.55);
    camp.add(jug);

    for (const x of [3.4, 4.1]) {
      this.box(camp, wood, 0.52, 0.38, 0.46, x, 0.21, -1.02);
      this.box(camp, canvas, 0.52, 0.06, 0.46, x, 0.42, -1.02);
    }
    for (const [index, x] of [-3.62, 3.44].entries()) {
      const archaeologist = new ExplorerCharacter(index ? 'erkek' : 'kadin', index + 1, 'archaeologist', true);
      archaeologist.position.set(x, 0, index ? 0.6 : 0.77);
      archaeologist.rotation.y = index ? 0.61 : Math.PI - 0.28;
      camp.add(archaeologist);
      archaeologist.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) object.userData.heritageAction = 'dig-journal';
      });
      this.people.push(archaeologist);
      this.targets.push(archaeologist);
      const guide = this.sign(camp, [index ? metin("HeritageGarden", "saha_kaydi") : metin("HeritageGarden", "buluntu_inceleme")],
        1.19, 0.27, x, 0.38, index ? 1.11 : 1.14);
      guide.userData.heritageAction = 'dig-journal';
      this.targets.push(guide);
    }
    for (const [row, z] of [1.58, -0.12].entries()) {
      for (const [column, x] of [-1.4, 0, 1.4].entries()) {
        const gridTag = this.sign(camp, [`${'ABC'[column]}${row + 1}`], 0.33, 0.22, x, 0.171, z);
        gridTag.rotation.x = -Math.PI / 2;
      }
    }
  }

  updateNear(player: THREE.Vector3, dt: number): void {
    this.elapsed += dt;

    if (player.distanceToSquared(HODJA_ORIGIN) <= 340) {
      const cycle = this.elapsed % 3.6;
      this.spoon.rotation.z = -0.24 - Math.sin(cycle / 3.6 * Math.PI) ** 6 * 0.46;
      if (this.ripple) {
        const ripple = Math.max(0, Math.min(1, (cycle - 1.55) / 1.55));
        this.ripple.scale.setScalar(0.65 + ripple * 3);
        this.ripple.material.opacity = cycle < 1.55 ? 0 : (1 - ripple) * 0.65;
      }
      const hodja = this.people[0];
      if (hodja) {
        hodja.setCraftPhase(cycle * Math.PI * 2 / 3.6);
        hodja.update();
      }
      for (const f of this.fishes) {
        const t = this.elapsed * f.speed + f.phase;
        const x = f.centerX + Math.sin(t) * f.radiusX;
        const z = f.centerZ + (f.figureEight ? Math.sin(t * 2) * 0.55 : Math.cos(t)) * f.radiusZ;
        const dx = Math.cos(t) * f.speed * f.radiusX;
        const dz = (f.figureEight ? Math.cos(t * 2) * 1.1 : -Math.sin(t)) * f.speed * f.radiusZ;
        f.root.position.set(x, f.baseY + Math.sin(this.elapsed * 2.1 + f.phase) * 0.008, z);
        f.root.rotation.y = Math.atan2(dx, dz);
        f.tailPivot.rotation.y = Math.sin(this.elapsed * 9.5 + f.phase) * 0.42;
      }
    }

    if (this.macunStickPivot && player.distanceToSquared(MACUNCU_ORIGIN) <= 420) {
      this.macunStickPivot.rotation.y = this.elapsed * 2.1;
      this.macunStickPivot.position.y = 1.18 + Math.sin(this.elapsed * 2.6) * 0.035;
    }
  }

  dispose(): void {
    this.people.forEach((person) => person.dispose());
    this.resources.forEach((resource) => resource.dispose());
  }
}
