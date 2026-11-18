import {metin} from "../metinler.ts";
import * as THREE from 'three';
import * as xb from 'xrblocks';

export type PetSpecies = 'cat' | 'dog';

export interface PetAnimalInfo {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string;
  position: THREE.Vector3;
  petCount: number;
  adopted: boolean;
}

interface PetSpec {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string;
  coatColor: number;
  accentColor: number;
  collarColor: number;
  waypoints: Array<[number, number]>;
}

interface PetInstance {
  spec: PetSpec;
  customName?: string;
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  tailPivot: THREE.Group;
  legPivots: THREE.Group[];
  nameMat: THREE.SpriteMaterial;
  nameTex: THREE.CanvasTexture;
  nameSprite: THREE.Sprite;
  heartSprite: THREE.Sprite;
  heartMat: THREE.SpriteMaterial;
  wpIndex: number;
  pauseTimer: number;
  walkPhase: number;
  happyTimer: number;
  heartTimer: number;
  petCount: number;
}

const PET_SPECS: PetSpec[] = [
  {
    id: 'cat-pamuk',
    name: metin("OutdoorPets", "pamuk"),
    species: 'cat',
    breed: metin("OutdoorPets", "van_kedisi"),
    coatColor: 0xf8fafc,
    accentColor: 0xfda4af,
    collarColor: 0xe11d48,
    waypoints: [
      [-5.2, 12.2],
      [-3.4, 10.6],
      [-6.0, 9.8],
    ],
  },
  {
    id: 'cat-tarcin',
    name: metin("OutdoorPets", "tarcin"),
    species: 'cat',
    breed: metin("OutdoorPets", "tekir_sarman"),
    coatColor: 0xf59e0b,
    accentColor: 0xfef3c7,
    collarColor: 0x0d9488,
    waypoints: [
      [6.0, 12.8],
      [6.8, 10.6],
      [5.8, 16.5],
    ],
  },
  {
    id: 'cat-duman',
    name: metin("OutdoorPets", "duman"),
    species: 'cat',
    breed: metin("OutdoorPets", "ankara_kedisi"),
    coatColor: 0x94a3b8,
    accentColor: 0xe2e8f0,
    collarColor: 0x3b82f6,
    waypoints: [
      [6.2, 6.2],
      [9.5, 5.8],
      [5.4, 8.6],
    ],
  },
  {
    id: 'cat-zeytin',
    name: metin("OutdoorPets", "zeytin"),
    species: 'cat',
    breed: metin("OutdoorPets", "muze_kedisi"),
    coatColor: 0x1e293b,
    accentColor: 0xf8fafc,
    collarColor: 0xf59e0b,
    waypoints: [
      [21.6, 13.6],
      [19.2, 12.0],
      [22.4, 10.4],
    ],
  },
  {
    id: 'dog-karabas',
    name: metin("OutdoorPets", "karabas"),
    species: 'dog',
    breed: metin("OutdoorPets", "anadolu_coban_kopegi"),
    coatColor: 0xd6b48c,
    accentColor: 0x292524,
    collarColor: 0xdc2626,
    waypoints: [
      [-9.5, 16.5],
      [-7.4, 19.2],
      [-10.8, 13.2],
    ],
  },
  {
    id: 'dog-poyraz',
    name: metin("OutdoorPets", "poyraz"),
    species: 'dog',
    breed: metin("OutdoorPets", "altin_tuylu_dost"),
    coatColor: 0xfbbf24,
    accentColor: 0xfef3c7,
    collarColor: 0x2563eb,
    waypoints: [
      [-8.8, 24.4],
      [-6.5, 27.0],
      [-10.6, 26.8],
    ],
  },
  {
    id: 'dog-cakil',
    name: metin("OutdoorPets", "cakil"),
    species: 'dog',
    breed: metin("OutdoorPets", "benekli_avlu_kopegi"),
    coatColor: 0xf1f5f9,
    accentColor: 0x78350f,
    collarColor: 0x16a34a,
    waypoints: [
      [-16.2, 14.0],
      [-18.8, 17.4],
      [-14.6, 17.8],
    ],
  },
];

function createHeartTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 160, 128);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(14, 18, 132, 82, 28);
    ctx.fill();
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = '#fb7185';
    ctx.font = 'bold 42px "Google Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💖', 80, 60);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createNameTagTexture(
  name: string,
  species: PetSpecies,
  adopted = false
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 76;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 300, 76);
    ctx.fillStyle = adopted
      ? 'rgba(180, 83, 9, 0.95)'
      : species === 'cat'
        ? 'rgba(190, 24, 93, 0.9)'
        : 'rgba(217, 119, 6, 0.92)';
    ctx.beginPath();
    ctx.roundRect(10, 8, 280, 58, 24);
    ctx.fill();
    ctx.strokeStyle = adopted ? '#fde047' : '#ffffff';
    ctx.lineWidth = adopted ? 4 : 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Google Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const prefix = adopted ? '⭐ ' : `${species === 'cat' ? '🐱' : '🐶'} `;
    const suffix = adopted ? ' ❤️' : '';
    ctx.fillText(`${prefix}${name}${suffix}`, 150, 38, 258);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class OutdoorPets extends xb.Script {
  private pets: PetInstance[] = [];
  private interactiveMeshes: THREE.Object3D[] = [];
  private disposables: Array<{dispose: () => void}> = [];
  private heartTex?: THREE.CanvasTexture;
  private adoptedPetId: string | null = null;

  private track<T extends {dispose: () => void}>(item: T): T {
    this.disposables.push(item);
    return item;
  }

  init(): void {
    this.heartTex = this.track(createHeartTexture());
    for (const spec of PET_SPECS) {
      this.spawnPet(spec);
    }
  }

  private spawnPet(spec: PetSpec): void {
    const isCat = spec.species === 'cat';
    const root = new THREE.Group();
    root.position.set(spec.waypoints[0][0], 0, spec.waypoints[0][1]);

    const bodyGroup = new THREE.Group();
    const headGroup = new THREE.Group();
    const tailPivot = new THREE.Group();

    const coatMat = this.track(
      new THREE.MeshStandardMaterial({color: spec.coatColor, roughness: 0.72})
    );
    const accentMat = this.track(
      new THREE.MeshStandardMaterial({color: spec.accentColor, roughness: 0.7})
    );
    const collarMat = this.track(
      new THREE.MeshStandardMaterial({color: spec.collarColor, roughness: 0.4})
    );
    const noseMat = this.track(
      new THREE.MeshStandardMaterial({
        color: isCat ? 0xfb7185 : 0x1e293b,
        roughness: 0.35,
      })
    );
    const eyeLeftMat = this.track(
      new THREE.MeshStandardMaterial({
        color:
          spec.id === 'cat-pamuk'
            ? 0x38bdf8
            : isCat
              ? 0x10b981
              : 0x3f2414,
        roughness: 0.18,
      })
    );
    const eyeRightMat = this.track(
      new THREE.MeshStandardMaterial({
        color:
          spec.id === 'cat-pamuk'
            ? 0xf59e0b
            : isCat
              ? 0x10b981
              : 0x3f2414,
        roughness: 0.18,
      })
    );
    const pupilMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x090d16,
        roughness: 0.12,
      })
    );
    const catchMat = this.track(
      new THREE.MeshBasicMaterial({color: 0xffffff})
    );
    const innerEarMat = this.track(
      new THREE.MeshStandardMaterial({
        color: isCat ? 0xfda4af : 0x57534e,
        roughness: 0.72,
      })
    );
    const goldMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xfde047,
        metalness: 0.78,
        roughness: 0.22,
      })
    );

    const scale = isCat ? 0.78 : 1.08;
    const bodyLen = isCat ? 0.44 : 0.56;
    const bodyRad = isCat ? 0.12 : 0.16;
    const legLen = isCat ? 0.18 : 0.24;

    // Soft ground shadow
    const shadow = new THREE.Mesh(
      this.track(new THREE.CircleGeometry(bodyRad * 1.9, 14)),
      this.track(
        new THREE.MeshBasicMaterial({
          color: 0x0f172a,
          transparent: true,
          opacity: 0.22,
          depthWrite: false,
        })
      )
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.025;
    root.add(shadow);

    // Torso
    const torso = new THREE.Mesh(
      this.track(new THREE.CapsuleGeometry(bodyRad, bodyLen * 0.52, 6, 12)),
      coatMat
    );
    torso.rotation.x = Math.PI / 2;
    torso.position.set(0, legLen + bodyRad * 0.75, 0);
    torso.castShadow = true;

    // Chest patch
    const chest = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(bodyRad * 0.88, 12, 10)),
      accentMat
    );
    chest.position.set(0, legLen + bodyRad * 0.68, -bodyLen * 0.32);

    // Collar + golden tag (+ Kangal shepherd brass studs on dogs)
    const collar = new THREE.Mesh(
      this.track(new THREE.TorusGeometry(bodyRad * 0.82, 0.024, 8, 16)),
      collarMat
    );
    collar.rotation.x = Math.PI / 2 + 0.3;
    collar.position.set(0, legLen + bodyRad * 1.05, -bodyLen * 0.36);

    const collarBell = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(0.026, 8, 8)),
      goldMat
    );
    collarBell.position.set(0, legLen + bodyRad * 0.84, -bodyLen * 0.46);

    if (!isCat) {
      const studGeo = this.track(new THREE.SphereGeometry(0.015, 6, 6));
      for (let s = 0; s < 6; s++) {
        const a = (s / 6) * Math.PI * 2;
        const stud = new THREE.Mesh(studGeo, goldMat);
        stud.position.set(
          Math.cos(a) * bodyRad * 0.86,
          legLen + bodyRad * 1.05 - Math.sin(a) * 0.04,
          -bodyLen * 0.36 + Math.sin(a) * bodyRad * 0.82
        );
        bodyGroup.add(stud);
      }
    }

    bodyGroup.add(torso, chest, collar, collarBell);

    // Head
    headGroup.position.set(0, legLen + bodyRad * 1.35, -bodyLen * 0.46);
    const skull = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(bodyRad * 0.92, 14, 12)),
      coatMat
    );
    skull.castShadow = true;

    const muzzle = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(bodyRad * (isCat ? 0.45 : 0.56), 10, 8)),
      accentMat
    );
    muzzle.scale.set(1.05, 0.8, isCat ? 0.85 : 1.25);
    muzzle.position.set(0, -bodyRad * 0.22, -bodyRad * (isCat ? 0.78 : 0.98));

    const nose = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(0.025, 8, 8)),
      noseMat
    );
    nose.position.set(0, -bodyRad * 0.14, -bodyRad * (isCat ? 1.15 : 1.56));

    // Expressive iris + pupil + catchlight (Van Cat Pamuk has blue & amber eyes!)
    const eyeGeo = this.track(new THREE.SphereGeometry(0.026, 10, 8));
    const pupilGeo = this.track(new THREE.SphereGeometry(0.014, 8, 6));
    const catchGeo = this.track(new THREE.SphereGeometry(0.0065, 6, 6));
    [-1, 1].forEach((side) => {
      const ex = side * bodyRad * 0.4;
      const ey = bodyRad * 0.14;
      const ez = -bodyRad * 0.78;
      const eye = new THREE.Mesh(eyeGeo, side < 0 ? eyeLeftMat : eyeRightMat);
      eye.scale.set(1, 1.05, 0.72);
      eye.position.set(ex, ey, ez);

      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.scale.set(isCat ? 0.58 : 0.95, 1.05, 0.6);
      pupil.position.set(ex, ey, ez - 0.015);

      const catchlight = new THREE.Mesh(catchGeo, catchMat);
      catchlight.position.set(ex + 0.006, ey + 0.007, ez - 0.019);

      headGroup.add(eye, pupil, catchlight);
    });

    // Ears: upright triangular cat ears with pink inner cones vs shepherd dog ears
    if (isCat) {
      const earGeo = this.track(new THREE.ConeGeometry(0.056, 0.115, 4));
      const innerEarGeo = this.track(new THREE.ConeGeometry(0.032, 0.075, 4));
      [-1, 1].forEach((side) => {
        const ear = new THREE.Mesh(earGeo, coatMat);
        ear.position.set(side * bodyRad * 0.52, bodyRad * 0.9, -0.01);
        ear.rotation.z = side * -0.25;
        ear.rotation.y = Math.PI / 4;

        const inner = new THREE.Mesh(innerEarGeo, innerEarMat);
        inner.position.set(side * bodyRad * 0.52, bodyRad * 0.87, -0.025);
        inner.rotation.z = side * -0.25;
        inner.rotation.y = Math.PI / 4;
        headGroup.add(ear, inner);
      });
    } else {
      const earGeo = this.track(new THREE.CapsuleGeometry(0.04, 0.11, 4, 8));
      [-1, 1].forEach((side) => {
        const ear = new THREE.Mesh(earGeo, accentMat);
        ear.position.set(side * bodyRad * 0.85, bodyRad * 0.2, 0.02);
        ear.rotation.z = side * 0.35;
        ear.rotation.x = 0.25;
        headGroup.add(ear);
      });
    }

    headGroup.add(skull, muzzle, nose);
    bodyGroup.add(headGroup);

    // 4 animated legs with delicate paw pads
    const legGeo = this.track(
      new THREE.CapsuleGeometry(bodyRad * 0.28, legLen * 0.58, 4, 8)
    );
    const pawGeo = this.track(
      new THREE.SphereGeometry(bodyRad * 0.32, 8, 6)
    );
    const legPivots: THREE.Group[] = [];
    const legCoords: Array<[number, number]> = [
      [-bodyRad * 0.58, -bodyLen * 0.3],
      [bodyRad * 0.58, -bodyLen * 0.3],
      [-bodyRad * 0.58, bodyLen * 0.32],
      [bodyRad * 0.58, bodyLen * 0.32],
    ];
    legCoords.forEach(([lx, lz]) => {
      const pivot = new THREE.Group();
      pivot.position.set(lx, legLen + 0.02, lz);
      const legMesh = new THREE.Mesh(legGeo, coatMat);
      legMesh.position.y = -legLen * 0.5;
      legMesh.castShadow = true;

      const paw = new THREE.Mesh(pawGeo, accentMat);
      paw.scale.set(1.0, 0.65, 1.2);
      paw.position.set(0, -legLen * 0.92, -0.015);
      pivot.add(legMesh, paw);
      bodyGroup.add(pivot);
      legPivots.push(pivot);
    });

    // Animated Two-Segment Graceful Tail
    tailPivot.position.set(0, legLen + bodyRad * 0.9, bodyLen * 0.42);
    const tailGeo = this.track(
      new THREE.CapsuleGeometry(
        isCat ? 0.026 : 0.036,
        isCat ? 0.24 : 0.2,
        4,
        8
      )
    );
    const tailMesh = new THREE.Mesh(tailGeo, isCat ? accentMat : coatMat);
    tailMesh.position.set(0, isCat ? 0.12 : 0.09, isCat ? 0.07 : 0.1);
    tailMesh.rotation.x = isCat ? 0.45 : 0.72;
    const tailTip = new THREE.Mesh(
      this.track(new THREE.CapsuleGeometry(isCat ? 0.024 : 0.03, 0.11, 4, 6)),
      isCat ? coatMat : accentMat
    );
    tailTip.position.set(0, isCat ? 0.26 : 0.19, isCat ? 0.14 : 0.17);
    tailTip.rotation.x = isCat ? -0.15 : 0.28;
    tailPivot.add(tailMesh, tailTip);
    bodyGroup.add(tailPivot);

    bodyGroup.scale.setScalar(scale);

    // Invisible generous hitbox for easy clicking
    const hitBox = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.75, 0.75, 0.95)),
      this.track(new THREE.MeshBasicMaterial({visible: false}))
    );
    hitBox.position.set(0, 0.42, 0);
    hitBox.userData.petId = spec.id;
    this.interactiveMeshes.push(hitBox);

    bodyGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.userData.petId = spec.id;
        this.interactiveMeshes.push(child);
      }
    });

    // Subtle name tag sprite above pet
    const nameTex = createNameTagTexture(spec.name, spec.species, false);
    const nameMat = this.track(
      new THREE.SpriteMaterial({map: nameTex, transparent: true, opacity: 0.94})
    );
    const nameSprite = new THREE.Sprite(nameMat);
    nameSprite.position.set(0, isCat ? 0.78 : 0.98, 0);
    nameSprite.scale.set(0.84, 0.22, 1);

    // Floating heart reaction sprite (hidden until petted)
    const heartMat = this.track(
      new THREE.SpriteMaterial({
        map: this.heartTex,
        transparent: true,
        opacity: 0,
        depthTest: false,
      })
    );
    const heartSprite = new THREE.Sprite(heartMat);
    heartSprite.position.set(0, isCat ? 1.05 : 1.25, 0);
    heartSprite.scale.set(0.6, 0.48, 1);
    heartSprite.visible = false;

    root.add(bodyGroup, hitBox, nameSprite, heartSprite);
    this.add(root);

    this.pets.push({
      spec,
      root,
      bodyGroup,
      headGroup,
      tailPivot,
      legPivots,
      nameMat,
      nameTex,
      nameSprite,
      heartSprite,
      heartMat,
      wpIndex: 1 % spec.waypoints.length,
      pauseTimer: Math.random() * 2.5,
      walkPhase: Math.random() * Math.PI * 2,
      happyTimer: 0,
      heartTimer: 0,
      petCount: 0,
    });
  }

  getInteractiveMeshes(): THREE.Object3D[] {
    return this.interactiveMeshes;
  }

  private toInfo(pet: PetInstance): PetAnimalInfo {
    return {
      id: pet.spec.id,
      name: pet.customName ?? pet.spec.name,
      species: pet.spec.species,
      breed: pet.spec.breed,
      position: pet.root.position.clone(),
      petCount: pet.petCount,
      adopted: this.adoptedPetId === pet.spec.id,
    };
  }

  getAdoptedPet(): PetAnimalInfo | null {
    if (!this.adoptedPetId) return null;
    const pet = this.pets.find((p) => p.spec.id === this.adoptedPetId);
    return pet ? this.toInfo(pet) : null;
  }

  adoptPet(
    petId: string,
    customName: string,
    playerPos?: THREE.Vector3
  ): PetAnimalInfo | null {
    if (this.adoptedPetId !== null && this.adoptedPetId !== petId) {
      return null;
    }
    const pet = this.pets.find((p) => p.spec.id === petId);
    if (!pet) return null;

    const cleanName = customName.trim().slice(0, 20) || pet.spec.name;
    this.adoptedPetId = pet.spec.id;
    pet.customName = cleanName;
    pet.happyTimer = 3.2;
    pet.heartTimer = 2.6;
    pet.heartSprite.visible = true;

    pet.nameTex.dispose();
    pet.nameTex = createNameTagTexture(cleanName, pet.spec.species, true);
    pet.nameMat.map = pet.nameTex;
    pet.nameMat.needsUpdate = true;

    if (playerPos) {
      const dx = playerPos.x - pet.root.position.x;
      const dz = playerPos.z - pet.root.position.z;
      if (dx * dx + dz * dz > 0.01) {
        pet.root.rotation.y = Math.atan2(-dx, -dz);
      }
    }

    return this.toInfo(pet);
  }

  findNearestPet(playerPos: THREE.Vector3, maxDist = 2.8): PetAnimalInfo | null {
    let best: PetInstance | null = null;
    let bestD = maxDist;
    for (const pet of this.pets) {
      if (Math.abs(pet.root.position.y - playerPos.y) > 1.8) continue;
      const d = Math.hypot(
        pet.root.position.x - playerPos.x,
        pet.root.position.z - playerPos.z
      );
      if (d < bestD) {
        bestD = d;
        best = pet;
      }
    }
    return best ? this.toInfo(best) : null;
  }

  petAnimal(
    petId: string,
    playerPos?: THREE.Vector3
  ): PetAnimalInfo | null {
    const pet = this.pets.find((p) => p.spec.id === petId);
    if (!pet) return null;

    pet.petCount++;
    pet.happyTimer = 2.8;
    pet.heartTimer = 2.4;
    pet.pauseTimer = 3.2;
    pet.heartSprite.visible = true;

    if (playerPos) {
      const dx = playerPos.x - pet.root.position.x;
      const dz = playerPos.z - pet.root.position.z;
      if (dx * dx + dz * dz > 0.01) {
        pet.root.rotation.y = Math.atan2(-dx, -dz);
      }
    }

    return this.toInfo(pet);
  }

  setSpritesVisible(visible: boolean): void {
    for (const pet of this.pets) {
      pet.nameSprite.visible = visible;
      if (!visible) pet.heartSprite.visible = false;
    }
  }

  updateWithPlayer(
    dt: number,
    playerPos: THREE.Vector3,
    playerYaw = 0,
    waitAt?: THREE.Vector3,
    waitYaw?: number,
    insideDeep = false
  ): void {
    const safeDt = Math.min(dt, 0.05);

    for (const pet of this.pets) {
      const isCat = pet.spec.species === 'cat';
      const isAdopted = this.adoptedPetId === pet.spec.id;
      if (insideDeep && !isAdopted) {
        pet.root.visible = false;
        continue;
      }
      pet.root.visible = true;

      if (pet.happyTimer > 0) {
        pet.happyTimer = Math.max(0, pet.happyTimer - safeDt);
      }
      if (pet.heartTimer > 0) {
        pet.heartTimer = Math.max(0, pet.heartTimer - safeDt);
        const progress = 1 - pet.heartTimer / 2.4;
        pet.heartSprite.visible = true;
        pet.heartSprite.position.y = (isCat ? 1.02 : 1.22) + progress * 0.45;
        pet.heartMat.opacity = pet.heartTimer > 0.5 ? 1 : pet.heartTimer / 0.5;
      } else {
        pet.heartSprite.visible = false;
      }

      if (isAdopted) {
        const followAngle = playerYaw + 2.35;
        const targetX = waitAt?.x ?? playerPos.x + Math.sin(followAngle) * 1.18;
        const targetZ = waitAt?.z ?? playerPos.z + Math.cos(followAngle) * 1.18;
        const targetY = waitAt?.y ?? playerPos.y;
        const dx = targetX - pet.root.position.x;
        const dz = targetZ - pet.root.position.z;
        const dist = Math.hypot(dx, dz);
        const dy = Math.abs(targetY - pet.root.position.y);

        if (dist > 9.5 || dy > 2.2) {
          pet.root.position.set(targetX, targetY, targetZ);
          continue;
        } else {
          pet.root.position.y = THREE.MathUtils.damp(
            pet.root.position.y,
            targetY,
            14,
            safeDt
          );
        }

        if (dist > 0.28) {
          const speed = dist > 3.2 ? 6.2 : 3.85;
          const step = Math.min(dist, speed * safeDt);
          pet.root.position.x += (dx / dist) * step;
          pet.root.position.z += (dz / dist) * step;

          const desiredYaw = Math.atan2(-dx, -dz);
          const diff = Math.atan2(
            Math.sin(desiredYaw - pet.root.rotation.y),
            Math.cos(desiredYaw - pet.root.rotation.y)
          );
          pet.root.rotation.y += diff * Math.min(1, safeDt * 10);

          pet.walkPhase += safeDt * (dist > 3.2 ? 16 : 12.5);
          const swing = Math.sin(pet.walkPhase) * 0.62;
          pet.legPivots[0].rotation.x = swing;
          pet.legPivots[1].rotation.x = -swing;
          pet.legPivots[2].rotation.x = -swing;
          pet.legPivots[3].rotation.x = swing;

          pet.bodyGroup.position.y = Math.abs(Math.sin(pet.walkPhase)) * 0.04;
          pet.tailPivot.rotation.z =
            Math.sin(pet.walkPhase * (isCat ? 0.8 : 2.2)) * (isCat ? 0.3 : 0.58);
          pet.headGroup.rotation.z = Math.sin(pet.walkPhase * 0.5) * 0.05;
        } else {
          // Wait attentively next to owner, or face the vintage camera during Photo Studio
          const toOwnerYaw =
            waitYaw !== undefined
              ? waitYaw
              : Math.atan2(
                  -(playerPos.x - pet.root.position.x),
                  -(playerPos.z - pet.root.position.z)
                );
          const diff = Math.atan2(
            Math.sin(toOwnerYaw - pet.root.rotation.y),
            Math.cos(toOwnerYaw - pet.root.rotation.y)
          );
          pet.root.rotation.y += diff * Math.min(1, safeDt * 6);
          pet.walkPhase += safeDt * (pet.happyTimer > 0 ? 11.5 : 4.2);

          pet.bodyGroup.position.y =
            pet.happyTimer > 0 ? Math.abs(Math.sin(pet.walkPhase)) * 0.14 : 0;
          pet.headGroup.rotation.z =
            Math.sin(pet.walkPhase * 0.7) * (pet.happyTimer > 0 ? 0.16 : 0.06);
          pet.tailPivot.rotation.z =
            Math.sin(pet.walkPhase * (isCat ? 1.2 : 3.6)) *
            (pet.happyTimer > 0 ? 0.72 : isCat ? 0.28 : 0.52);

          for (const leg of pet.legPivots) {
            leg.rotation.x = THREE.MathUtils.damp(leg.rotation.x, 0, 10, safeDt);
          }
        }
        continue;
      }

      if (pet.pauseTimer > 0) {
        pet.pauseTimer = Math.max(0, pet.pauseTimer - safeDt);
        pet.walkPhase += safeDt * (pet.happyTimer > 0 ? 11.5 : 3.2);

        const bounce =
          pet.happyTimer > 0 ? Math.abs(Math.sin(pet.walkPhase)) * 0.14 : 0;
        pet.bodyGroup.position.y = bounce;
        pet.headGroup.rotation.z =
          Math.sin(pet.walkPhase * 0.7) * (pet.happyTimer > 0 ? 0.16 : 0.05);
        pet.tailPivot.rotation.z =
          Math.sin(pet.walkPhase * (isCat ? 1.1 : 3.6)) *
          (pet.happyTimer > 0 ? 0.72 : isCat ? 0.25 : 0.48);

        for (const leg of pet.legPivots) {
          leg.rotation.x = THREE.MathUtils.damp(leg.rotation.x, 0, 10, safeDt);
        }
        continue;
      }

      const target = pet.spec.waypoints[pet.wpIndex];
      const dx = target[0] - pet.root.position.x;
      const dz = target[1] - pet.root.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 0.25) {
        pet.wpIndex = (pet.wpIndex + 1) % pet.spec.waypoints.length;
        pet.pauseTimer = 2.0 + Math.random() * 2.8;
        continue;
      }

      const speed = isCat ? 1.05 : 1.35;
      const step = Math.min(dist, speed * safeDt);
      pet.root.position.x += (dx / dist) * step;
      pet.root.position.z += (dz / dist) * step;

      const desiredYaw = Math.atan2(-dx, -dz);
      const diff = Math.atan2(
        Math.sin(desiredYaw - pet.root.rotation.y),
        Math.cos(desiredYaw - pet.root.rotation.y)
      );
      pet.root.rotation.y += diff * Math.min(1, safeDt * 7);

      pet.walkPhase += safeDt * (isCat ? 9.5 : 11.5);
      const swing = Math.sin(pet.walkPhase) * 0.55;
      pet.legPivots[0].rotation.x = swing;
      pet.legPivots[1].rotation.x = -swing;
      pet.legPivots[2].rotation.x = -swing;
      pet.legPivots[3].rotation.x = swing;

      pet.bodyGroup.position.y = Math.abs(Math.sin(pet.walkPhase)) * 0.03;
      pet.tailPivot.rotation.z =
        Math.sin(pet.walkPhase * (isCat ? 0.6 : 1.8)) * (isCat ? 0.24 : 0.5);
      pet.headGroup.rotation.z = Math.sin(pet.walkPhase * 0.5) * 0.04;
    }
  }

  dispose(): void {
    for (const pet of this.pets) {
      pet.nameTex.dispose();
    }
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
