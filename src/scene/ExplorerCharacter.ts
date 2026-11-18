import * as THREE from 'three';
import * as xb from 'xrblocks';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

export type CharacterStyleId = 'kadin' | 'erkek';
export type PhotoPoseMode = 'none' | 'wave' | 'hero' | 'joy' | 'sit' | 'salute';
export type CharacterRoleOutfit =
  | 'sport'
  | 'culture'
  | 'carnival'
  | 'hideseek'
  | 'anatolian'
  | 'imam'
  | 'archaeologist'
  | 'concertDrummer'
  | 'siraci'
  | 'bozaci'
  | 'sazplayer'
  | 'semazen'
  | 'neyzen'
  | 'singer'
  | 'chorus'
  | 'guitarist';

const FEMALE_PALETTES = [
  {dress: 0x287c96, accent: 0xf3ac7b, pack: 0xa86042, hair: 0x492b25},
  {dress: 0x7764a6, accent: 0xf0c689, pack: 0x85495d, hair: 0x392323},
  {dress: 0xbc5568, accent: 0xf3b480, pack: 0xb98351, hair: 0x754a34},
  {dress: 0x467e69, accent: 0xf1bd83, pack: 0xa56a4e, hair: 0x272321},
];

const MALE_PALETTES = [
  {vest: 0x3c836f, pack: 0x8e6548, cap: 0xe0a65c},
  {vest: 0x43779d, pack: 0x657a53, cap: 0xcb7a50},
  {vest: 0xb16a44, pack: 0x49637d, cap: 0x498294},
  {vest: 0x64699b, pack: 0x518274, cap: 0xb75f64},
];

const HIDESEEK_TEAM_COLORS = [0x06b6d4, 0x84cc16, 0xec4899, 0xf97316, 0xa855f7];

interface SharedCharGeos {
  shadow: THREE.CircleGeometry;
  fNeck: THREE.CylinderGeometry;
  fShoulders: THREE.SphereGeometry;
  fBodice: THREE.CylinderGeometry;
  fBlouseFront: THREE.CylinderGeometry;
  fBelt: THREE.CylinderGeometry;
  fSkirt: THREE.CylinderGeometry;
  fPack: THREE.BoxGeometry;
  fPackFlap: THREE.BoxGeometry;
  fTrim: THREE.BoxGeometry;
  fHead: THREE.SphereGeometry;
  fHairCrown: THREE.SphereGeometry;
  fBangL: THREE.SphereGeometry;
  fBangR: THREE.SphereGeometry;
  fSideLock: THREE.CapsuleGeometry;
  fBackMane: THREE.CylinderGeometry;
  fHairEnd: THREE.SphereGeometry;
  fHeadband: THREE.TorusGeometry;
  fHeadbandBow: THREE.OctahedronGeometry;
  fSclera: THREE.SphereGeometry;
  fPupil: THREE.SphereGeometry;
  fCatch: THREE.SphereGeometry;
  fLash: THREE.BoxGeometry;
  fCheek: THREE.SphereGeometry;
  fSmile: THREE.TorusGeometry;
  fNose: THREE.SphereGeometry;
  fEar: THREE.SphereGeometry;
  fArm: THREE.CapsuleGeometry;
  fHand: THREE.SphereGeometry;
  fLeg: THREE.CapsuleGeometry;
  fBootShaft: THREE.CylinderGeometry;
  fBootFoot: THREE.CapsuleGeometry;
  mTorsoLite: THREE.BoxGeometry;
  mTorsoRich: RoundedBoxGeometry;
  mShirtFront: THREE.BoxGeometry;
  mBelt: THREE.BoxGeometry;
  mPocket: THREE.BoxGeometry;
  mPackLite: THREE.BoxGeometry;
  mPackRich: RoundedBoxGeometry;
  mPackRoll: THREE.CylinderGeometry;
  mHead: THREE.SphereGeometry;
  mShortHair: THREE.SphereGeometry;
  mEye: THREE.SphereGeometry;
  mSclera: THREE.SphereGeometry;
  mSmile: THREE.TorusGeometry;
  mBrow: THREE.BoxGeometry;
  mCapCrown: THREE.CylinderGeometry;
  mCapVisor: THREE.BoxGeometry;
  mStarBadge: THREE.OctahedronGeometry;
  mNose: THREE.SphereGeometry;
  mEar: THREE.SphereGeometry;
  mArm: THREE.CapsuleGeometry;
  mHand: THREE.SphereGeometry;
  mLeg: THREE.CapsuleGeometry;
  mShoe: THREE.BoxGeometry;
}

let sharedCharGeos: SharedCharGeos | null = null;
function getSharedCharGeos(): SharedCharGeos {
  if (sharedCharGeos) return sharedCharGeos;
  sharedCharGeos = {
    shadow: new THREE.CircleGeometry(0.38, 18),
    fNeck: new THREE.CylinderGeometry(0.056, 0.068, 0.12, 10),
    fShoulders: new THREE.SphereGeometry(0.155, 14, 10),
    fBodice: new THREE.CylinderGeometry(0.155, 0.135, 0.3, 14),
    fBlouseFront: new THREE.CylinderGeometry(0.072, 0.036, 0.25, 8),
    fBelt: new THREE.CylinderGeometry(0.145, 0.152, 0.05, 14),
    fSkirt: new THREE.CylinderGeometry(0.145, 0.275, 0.34, 18),
    fPack: new THREE.BoxGeometry(0.22, 0.26, 0.11),
    fPackFlap: new THREE.BoxGeometry(0.23, 0.08, 0.125),
    fTrim: new THREE.BoxGeometry(0.022, 0.24, 0.026),
    fHead: new THREE.SphereGeometry(0.195, 18, 14),
    fHairCrown: new THREE.SphereGeometry(0.208, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.62),
    fBangL: new THREE.SphereGeometry(0.11, 12, 8),
    fBangR: new THREE.SphereGeometry(0.105, 12, 8),
    fSideLock: new THREE.CapsuleGeometry(0.048, 0.22, 5, 8),
    fBackMane: new THREE.CylinderGeometry(0.165, 0.205, 0.38, 14),
    fHairEnd: new THREE.SphereGeometry(0.195, 14, 8),
    fHeadband: new THREE.TorusGeometry(0.202, 0.024, 8, 22, Math.PI * 1.05),
    fHeadbandBow: new THREE.OctahedronGeometry(0.038, 0),
    fSclera: new THREE.SphereGeometry(0.03, 10, 8),
    fPupil: new THREE.SphereGeometry(0.02, 8, 6),
    fCatch: new THREE.SphereGeometry(0.008, 6, 5),
    fLash: new THREE.BoxGeometry(0.056, 0.012, 0.014),
    fCheek: new THREE.SphereGeometry(0.026, 7, 6),
    fSmile: new THREE.TorusGeometry(0.032, 0.008, 6, 12, Math.PI),
    fNose: new THREE.SphereGeometry(0.018, 7, 6),
    fEar: new THREE.SphereGeometry(0.032, 7, 6),
    fArm: new THREE.CapsuleGeometry(0.048, 0.24, 5, 8),
    fHand: new THREE.SphereGeometry(0.048, 8, 6),
    fLeg: new THREE.CapsuleGeometry(0.056, 0.24, 5, 8),
    fBootShaft: new THREE.CylinderGeometry(0.06, 0.064, 0.1, 10),
    fBootFoot: new THREE.CapsuleGeometry(0.056, 0.09, 5, 8),
    mTorsoLite: new THREE.BoxGeometry(0.44, 0.48, 0.28),
    mTorsoRich: new RoundedBoxGeometry(0.44, 0.48, 0.28, 1, 0.065),
    mShirtFront: new THREE.BoxGeometry(0.16, 0.44, 0.295),
    mBelt: new THREE.BoxGeometry(0.455, 0.06, 0.295),
    mPocket: new THREE.BoxGeometry(0.11, 0.11, 0.04),
    mPackLite: new THREE.BoxGeometry(0.30, 0.34, 0.16),
    mPackRich: new RoundedBoxGeometry(0.30, 0.34, 0.16, 1, 0.035),
    mPackRoll: new THREE.CylinderGeometry(0.06, 0.06, 0.34, 10),
    mHead: new THREE.SphereGeometry(0.23, 16, 14),
    mShortHair: new THREE.SphereGeometry(0.24, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52),
    mEye: new THREE.SphereGeometry(0.018, 8, 6),
    mSclera: new THREE.SphereGeometry(0.033, 8, 6),
    mSmile: new THREE.TorusGeometry(0.035, 0.006, 5, 10, Math.PI),
    mBrow: new THREE.BoxGeometry(0.065, 0.018, 0.02),
    mCapCrown: new THREE.CylinderGeometry(0.2, 0.245, 0.13, 14),
    mCapVisor: new THREE.BoxGeometry(0.30, 0.025, 0.15),
    mStarBadge: new THREE.OctahedronGeometry(0.048, 0),
    mNose: new THREE.SphereGeometry(0.022, 7, 6),
    mEar: new THREE.SphereGeometry(0.036, 7, 6),
    mArm: new THREE.CapsuleGeometry(0.072, 0.25, 5, 8),
    mHand: new THREE.SphereGeometry(0.062, 8, 6),
    mLeg: new THREE.CapsuleGeometry(0.082, 0.25, 5, 8),
    mShoe: new THREE.BoxGeometry(0.155, 0.1, 0.24),
  };
  return sharedCharGeos;
}

export class ExplorerCharacter extends xb.Script {
  private bodyRoot = new THREE.Group();
  private femaleRoot = new THREE.Group();
  private maleRoot = new THREE.Group();

  // Animated pivots for female
  private fHead = new THREE.Group();
  private fBackHair = new THREE.Group();
  private fLeftArm = new THREE.Group();
  private fRightArm = new THREE.Group();
  private fLeftLeg = new THREE.Group();
  private fRightLeg = new THREE.Group();

  // Animated pivots for male
  private mHead = new THREE.Group();
  private mLeftArm = new THREE.Group();
  private mRightArm = new THREE.Group();
  private mLeftLeg = new THREE.Group();
  private mRightLeg = new THREE.Group();

  private shadowMesh!: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
  private disposables: Array<{dispose: () => void}> = [];

  private activeStyle: CharacterStyleId = 'kadin';
  private roleOutfit?: CharacterRoleOutfit;
  private variantIndex = 0;
  private lightweight = false;
  private walkPhase = 0;
  private isMoving = false;
  private crouching = false;
  private crouchAmount = 0;
  private jumpOffset = 0;
  private jumpVelocity = 0;
  private waveTimer = 0;
  private pullDir: -1 | 0 | 1 = 0;
  private pullBurstTimer = 0;
  private isPlayingSaz = false;
  private isSpinningSemazen = false;
  private isClapping = false;
  private isSitting = false;
  private floorSitting = false;
  private craftPhase: number | null = null;
  private isStageMusician = false;
  private photoPose: PhotoPoseMode = 'none';
  private animThrottleAccum = 0;
  private lowDetailUpdate = false;

  private lanternGroup = new THREE.Group();
  private lanternLight?: THREE.PointLight;
  private lanternBulbMat?: THREE.MeshStandardMaterial;
  private lanternActive = false;

  // Maze Crown (King for erkek, Queen tiara for kadin) & role gear suppression
  private mCapParts: THREE.Object3D[] = [];
  private mPackParts: THREE.Object3D[] = [];
  private fPackParts: THREE.Object3D[] = [];
  private hideDefaultCap = false;
  private hideDefaultPack = false;
  private fHeadbandBow?: THREE.Object3D;
  private maleCrownGroup = new THREE.Group();
  private femaleCrownGroup = new THREE.Group();
  private mazeCrownEquipped = false;

  // Palette material references for live outfit color customization
  private fDressMat?: THREE.MeshStandardMaterial;
  private fAccentMat?: THREE.MeshStandardMaterial;
  private fPackMat?: THREE.MeshStandardMaterial;
  private fHairMat?: THREE.MeshStandardMaterial;
  private mVestMat?: THREE.MeshStandardMaterial;
  private mPackMat?: THREE.MeshStandardMaterial;
  private mCapMat?: THREE.MeshStandardMaterial;

  constructor(
    styleId: CharacterStyleId = 'kadin',
    variantIndex = 0,
    roleOutfit?: CharacterRoleOutfit,
    lightweight = false
  ) {
    super();
    this.activeStyle = styleId;
    this.variantIndex = Math.max(0, variantIndex);
    this.roleOutfit = roleOutfit;
    this.lightweight = lightweight;
    this.buildShadow();
    if (!lightweight || styleId === 'kadin') this.buildFemaleCharacter();
    if (!lightweight || styleId === 'erkek') this.buildMaleCharacter();
    this.buildHandheldLantern();
    if (roleOutfit) {
      this.isPlayingSaz = roleOutfit === 'sazplayer';
      this.isSpinningSemazen = roleOutfit === 'semazen';
      this.isStageMusician =
        roleOutfit === 'neyzen' ||
        roleOutfit === 'singer' ||
        roleOutfit === 'chorus' ||
        roleOutfit === 'guitarist';
      this.hideDefaultCap =
        roleOutfit === 'archaeologist' ||
        roleOutfit === 'imam' ||
        roleOutfit === 'semazen' ||
        roleOutfit === 'neyzen' ||
        roleOutfit === 'singer' ||
        roleOutfit === 'chorus' ||
        roleOutfit === 'guitarist' ||
        roleOutfit === 'culture' ||
        roleOutfit === 'siraci' ||
        roleOutfit === 'bozaci';
      this.hideDefaultPack =
        roleOutfit === 'archaeologist' ||
        roleOutfit === 'imam' ||
        roleOutfit === 'semazen' ||
        roleOutfit === 'neyzen' ||
        roleOutfit === 'singer' ||
        roleOutfit === 'chorus' ||
        roleOutfit === 'guitarist' ||
        roleOutfit === 'sazplayer' ||
        roleOutfit === 'siraci' ||
        roleOutfit === 'bozaci';
      this.buildRoleAccessories(roleOutfit);
    }
    if (this.lightweight) {
      this.bodyRoot.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          obj.castShadow = false;
          obj.receiveShadow = false;
        }
      });
    }
    this.bodyRoot.add(this.femaleRoot, this.maleRoot);
    this.add(this.bodyRoot);
    this.setStyle(styleId);
  }

  private track<T extends {dispose: () => void}>(item: T): T {
    this.disposables.push(item);
    return item;
  }

  private buildShadow(): void {
    const shadowGeo = getSharedCharGeos().shadow;
    const shadowMat = this.track(
      new THREE.MeshBasicMaterial({
        color: 0x0f172a,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      })
    );
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = 0.02;
    this.add(this.shadowMesh);
  }

  private buildFemaleCharacter(): void {
    const pal = FEMALE_PALETTES[this.variantIndex % FEMALE_PALETTES.length];
    const skinMat = this.track(
      new THREE.MeshStandardMaterial({color: 0xf5c5a7, roughness: 0.62})
    );
    const dressMat = this.track(
      new THREE.MeshStandardMaterial({color: pal.dress, roughness: 0.52})
    );
    this.fDressMat = dressMat;
    const blouseMat = this.track(
      new THREE.MeshStandardMaterial({color: 0xf8fafc, roughness: 0.58})
    );
    const goldMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.68,
        roughness: 0.28,
      })
    );
    const leggingsMat = this.track(
      new THREE.MeshStandardMaterial({color: 0x1e293b, roughness: 0.78})
    );
    const accentMat = this.track(
      new THREE.MeshStandardMaterial({color: pal.accent, roughness: 0.44})
    );
    this.fAccentMat = accentMat;
    const hairMat = this.track(
      new THREE.MeshStandardMaterial({color: pal.hair, roughness: 0.68})
    );
    this.fHairMat = hairMat;
    const packMat = this.track(
      new THREE.MeshStandardMaterial({color: pal.pack, roughness: 0.5})
    );
    this.fPackMat = packMat;
    const scleraMat = this.track(
      new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.3})
    );
    const pupilMat = this.track(
      new THREE.MeshStandardMaterial({color: 0x111827, roughness: 0.15})
    );
    const blushMat = this.track(
      new THREE.MeshStandardMaterial({color: 0xfb7185, roughness: 0.8})
    );

    const geos = getSharedCharGeos();

    // Slim neck connecting head & shoulders
    const neck = new THREE.Mesh(geos.fNeck, skinMat);
    neck.position.y = 1.02;

    // Rounded shoulders & tailored upper jacket bodice
    const shoulders = new THREE.Mesh(geos.fShoulders, dressMat);
    shoulders.scale.set(1.18, 0.55, 0.85);
    shoulders.position.y = 0.94;
    shoulders.castShadow = true;

    const bodice = new THREE.Mesh(geos.fBodice, dressMat);
    bodice.scale.set(1.06, 1, 0.82);
    bodice.position.y = 0.81;
    bodice.castShadow = true;

    // Crisp white blouse lapel V-panel in front
    const blouseFront = new THREE.Mesh(geos.fBlouseFront, blouseMat);
    blouseFront.scale.set(1, 1, 0.5);
    blouseFront.position.set(0, 0.84, -0.105);

    // Waist belt + small golden clasp
    const belt = new THREE.Mesh(geos.fBelt, goldMat);
    belt.scale.set(1.05, 1, 0.84);
    belt.position.y = 0.67;

    // Gracefully flared A-line pleated skirt
    const skirt = new THREE.Mesh(geos.fSkirt, dressMat);
    skirt.scale.set(1.05, 1, 0.92);
    skirt.position.y = 0.51;
    skirt.castShadow = true;

    // Compact rounded explorer satchel flush against back
    const pack = new THREE.Mesh(geos.fPack, packMat);
    pack.position.set(0, 0.81, 0.165);
    pack.castShadow = true;
    const packFlap = new THREE.Mesh(geos.fPackFlap, accentMat);
    packFlap.position.set(0, 0.9, 0.168);
    this.fPackParts.push(pack, packFlap);

    // Sculpted gold Anatolian cepken lapel trim along bodice V-opening
    const trimGeo = geos.fTrim;
    const lLapelTrim = new THREE.Mesh(trimGeo, goldMat);
    lLapelTrim.position.set(-0.062, 0.84, -0.118);
    lLapelTrim.rotation.z = -0.22;
    const rLapelTrim = new THREE.Mesh(trimGeo, goldMat);
    rLapelTrim.position.set(0.062, 0.84, -0.118);
    rLapelTrim.rotation.z = 0.22;

    this.femaleRoot.add(
      neck,
      shoulders,
      bodice,
      blouseFront,
      lLapelTrim,
      rLapelTrim,
      belt,
      skirt,
      pack,
      packFlap
    );

    // Expressive Head + Sleek Parted Hairstyle + Hairband
    this.fHead.position.set(0, 1.22, 0);
    const head = new THREE.Mesh(geos.fHead, skinMat);
    head.scale.set(0.96, 1.03, 0.96);
    head.castShadow = true;

    // Sculpted hair dome hugging the crown & back of the head
    const hairCrown = new THREE.Mesh(geos.fHairCrown, hairMat);
    hairCrown.position.set(0, 0.015, 0.02);
    hairCrown.rotation.x = 0.32;
    hairCrown.castShadow = true;

    // Sleek side-parted swept front bangs framing forehead cleanly
    const bangL = new THREE.Mesh(geos.fBangL, hairMat);
    bangL.scale.set(1.25, 0.62, 0.72);
    bangL.position.set(-0.08, 0.135, -0.115);
    bangL.rotation.set(0.35, 0.25, 0.32);

    const bangR = new THREE.Mesh(geos.fBangR, hairMat);
    bangR.scale.set(1.2, 0.6, 0.72);
    bangR.position.set(0.085, 0.132, -0.115);
    bangR.rotation.set(0.35, -0.25, -0.34);

    // Side framing locks curving gently past the ears/cheeks
    const sideLockGeo = geos.fSideLock;
    const leftSideLock = new THREE.Mesh(sideLockGeo, hairMat);
    leftSideLock.position.set(-0.165, -0.06, -0.025);
    leftSideLock.rotation.z = 0.12;
    const rightSideLock = new THREE.Mesh(sideLockGeo, hairMat);
    rightSideLock.position.set(0.165, -0.06, -0.025);
    rightSideLock.rotation.z = -0.12;

    // Flowing silky back hair cape attached smoothly at crown base
    this.fBackHair.position.set(0, -0.02, 0.115);
    const backMane = new THREE.Mesh(geos.fBackMane, hairMat);
    backMane.scale.set(1.05, 1, 0.56);
    backMane.position.set(0, -0.16, 0.02);
    backMane.rotation.x = 0.12;
    backMane.castShadow = true;

    const hairEnd = new THREE.Mesh(geos.fHairEnd, hairMat);
    hairEnd.scale.set(1.05, 0.45, 0.56);
    hairEnd.position.set(0, -0.34, 0.04);
    this.fBackHair.add(backMane, hairEnd);

    // Chic arched fabric headband + tiny gold star ornament
    const headband = new THREE.Mesh(geos.fHeadband, accentMat);
    headband.position.set(0, 0.03, -0.035);
    headband.rotation.set(0.18, 0, -0.07);

    const headbandBow = new THREE.Mesh(geos.fHeadbandBow, goldMat);
    headbandBow.position.set(-0.145, 0.17, -0.085);
    this.fHeadbandBow = headbandBow;

    // Bright expressive eyes (sclera + pupil + catchlight)
    const scleraGeo = geos.fSclera;
    const pupilGeo = geos.fPupil;
    const catchGeo = geos.fCatch;
    const lashGeo = geos.fLash;

    [-1, 1].forEach((side) => {
      const ex = side * 0.068;
      const sclera = new THREE.Mesh(scleraGeo, scleraMat);
      sclera.scale.set(1, 1.12, 0.6);
      sclera.position.set(ex, 0.008, -0.176);

      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.scale.set(1, 1.1, 0.6);
      pupil.position.set(ex, 0.008, -0.186);

      const catchlight = new THREE.Mesh(catchGeo, scleraMat);
      catchlight.position.set(ex - 0.008, 0.018, -0.194);

      const brow = new THREE.Mesh(lashGeo, hairMat);
      brow.position.set(ex, 0.056, -0.175);
      brow.rotation.z = side * -0.1;

      this.fHead.add(sclera, pupil, catchlight, brow);
    });

    // Subtle rosy cheeks & friendly smile
    const cheekGeo = geos.fCheek;
    const lCheek = new THREE.Mesh(cheekGeo, blushMat);
    lCheek.scale.set(1.2, 0.65, 0.4);
    lCheek.position.set(-0.105, -0.036, -0.158);
    const rCheek = new THREE.Mesh(cheekGeo, blushMat);
    rCheek.scale.set(1.2, 0.65, 0.4);
    rCheek.position.set(0.105, -0.036, -0.158);

    const smile = new THREE.Mesh(geos.fSmile, accentMat);
    smile.rotation.z = Math.PI;
    smile.position.set(0, -0.064, -0.176);

    // Tiny sculpted nose & delicate ears
    const fNose = new THREE.Mesh(geos.fNose, skinMat);
    fNose.scale.set(0.95, 0.85, 1.15);
    fNose.position.set(0, -0.022, -0.194);

    const fEarGeo = geos.fEar;
    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(fEarGeo, skinMat);
      ear.scale.set(0.45, 1.1, 0.72);
      ear.position.set(side * 0.184, -0.01, -0.005);
      this.fHead.add(ear);
    });

    this.fHead.add(
      head,
      fNose,
      hairCrown,
      bangL,
      bangR,
      leftSideLock,
      rightSideLock,
      this.fBackHair,
      headband,
      headbandBow,
      lCheek,
      rCheek,
      smile
    );
    this.buildFemaleQueenCrown(goldMat);
    this.fHead.add(this.femaleCrownGroup);
    this.femaleRoot.add(this.fHead);

    // Slender tailored sleeves & hands
    const armGeo = geos.fArm;
    const handGeo = geos.fHand;

    this.fLeftArm.position.set(-0.205, 0.91, 0);
    const flA = new THREE.Mesh(armGeo, dressMat);
    flA.position.y = -0.14;
    flA.castShadow = true;
    const flH = new THREE.Mesh(handGeo, skinMat);
    flH.position.y = -0.3;
    this.fLeftArm.add(flA, flH);

    this.fRightArm.position.set(0.205, 0.91, 0);
    const frA = new THREE.Mesh(armGeo, dressMat);
    frA.position.y = -0.14;
    frA.castShadow = true;
    const frH = new THREE.Mesh(handGeo, skinMat);
    frH.position.y = -0.3;
    this.fRightArm.add(frA, frH);

    // Graceful legs & sleek rounded ankle boots
    const legGeo = geos.fLeg;
    const bootShaftGeo = geos.fBootShaft;
    const bootFootGeo = geos.fBootFoot;

    this.fLeftLeg.position.set(-0.09, 0.44, 0);
    const flL = new THREE.Mesh(legGeo, leggingsMat);
    flL.position.y = -0.17;
    flL.castShadow = true;
    const flBShaft = new THREE.Mesh(bootShaftGeo, accentMat);
    flBShaft.position.set(0, -0.33, 0);
    const flBFoot = new THREE.Mesh(bootFootGeo, accentMat);
    flBFoot.rotation.x = Math.PI / 2;
    flBFoot.position.set(0, -0.39, -0.04);
    flBFoot.castShadow = true;
    this.fLeftLeg.add(flL, flBShaft, flBFoot);

    this.fRightLeg.position.set(0.09, 0.44, 0);
    const frL = new THREE.Mesh(legGeo, leggingsMat);
    frL.position.y = -0.17;
    frL.castShadow = true;
    const frBShaft = new THREE.Mesh(bootShaftGeo, accentMat);
    frBShaft.position.set(0, -0.33, 0);
    const frBFoot = new THREE.Mesh(bootFootGeo, accentMat);
    frBFoot.rotation.x = Math.PI / 2;
    frBFoot.position.set(0, -0.39, -0.04);
    frBFoot.castShadow = true;
    this.fRightLeg.add(frL, frBShaft, frBFoot);

    this.femaleRoot.add(
      this.fLeftArm,
      this.fRightArm,
      this.fLeftLeg,
      this.fRightLeg
    );
  }

  private buildMaleCharacter(): void {
    const pal = MALE_PALETTES[this.variantIndex % MALE_PALETTES.length];
    const skinMat = this.track(
      new THREE.MeshStandardMaterial({color: 0xf0bc98, roughness: 0.68})
    );
    const shirtMat = this.track(
      new THREE.MeshStandardMaterial({color: 0xf8fafc, roughness: 0.65})
    );
    const vestMat = this.track(
      new THREE.MeshStandardMaterial({color: pal.vest, roughness: 0.6})
    );
    this.mVestMat = vestMat;
    const pantsMat = this.track(
      new THREE.MeshStandardMaterial({color: 0x1e3a8a, roughness: 0.78})
    );
    const shoeMat = this.track(
      new THREE.MeshStandardMaterial({color: 0x78350f, roughness: 0.55})
    );
    const hairMat = this.track(
      new THREE.MeshStandardMaterial({color: 0x1c1917, roughness: 0.85})
    );
    const capMat = this.track(
      new THREE.MeshStandardMaterial({color: pal.cap, roughness: 0.5})
    );
    this.mCapMat = capMat;
    const packMat = this.track(
      new THREE.MeshStandardMaterial({color: pal.pack, roughness: 0.58})
    );
    this.mPackMat = packMat;
    const goldMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xfde047,
        metalness: 0.7,
        roughness: 0.25,
      })
    );
    const eyeMat = this.track(
      new THREE.MeshStandardMaterial({color: 0x0f172a, roughness: 0.2})
    );

    const geos = getSharedCharGeos();

    // Broader boxy explorer jacket/vest torso
    const torso = new THREE.Mesh(
      this.lightweight ? geos.mTorsoLite : geos.mTorsoRich,
      vestMat
    );
    torso.position.y = 0.76;
    torso.castShadow = true;

    // Inner crisp shirt V-front
    const shirtFront = new THREE.Mesh(geos.mShirtFront, shirtMat);
    shirtFront.position.set(0, 0.77, -0.01);

    // Belt + brass buckle
    const belt = new THREE.Mesh(geos.mBelt, shoeMat);
    belt.position.y = 0.54;

    // Cargo chest pockets
    const pocketGeo = geos.mPocket;
    const lPocket = new THREE.Mesh(pocketGeo, goldMat);
    lPocket.position.set(-0.14, 0.72, -0.145);
    const rPocket = new THREE.Mesh(pocketGeo, goldMat);
    rPocket.position.set(0.14, 0.72, -0.145);

    // Rugged adventure backpack
    const pack = new THREE.Mesh(
      this.lightweight ? geos.mPackLite : geos.mPackRich,
      packMat
    );
    pack.position.set(0, 0.76, 0.22);
    pack.castShadow = true;

    const packRoll = new THREE.Mesh(geos.mPackRoll, goldMat);
    packRoll.rotation.z = Math.PI / 2;
    packRoll.position.set(0, 0.98, 0.22);
    this.mPackParts.push(pack, packRoll, lPocket, rPocket);

    this.maleRoot.add(
      torso,
      shirtFront,
      belt,
      lPocket,
      rPocket,
      pack,
      packRoll
    );

    // Head with short hair + peaked cap
    this.mHead.position.set(0, 1.22, 0);
    const head = new THREE.Mesh(geos.mHead, skinMat);
    head.castShadow = true;

    // Short cropped hair cap + front quiff
    const shortHair = new THREE.Mesh(geos.mShortHair, hairMat);
    shortHair.rotation.x = 0.2;

    // Eyes + strong eyebrows
    const eyeGeo = geos.mEye;
    const lEye = new THREE.Mesh(eyeGeo, eyeMat);
    lEye.position.set(-0.075, 0.015, -0.231);
    const rEye = new THREE.Mesh(eyeGeo, eyeMat);
    rEye.position.set(0.075, 0.015, -0.231);
    const scleraGeo = geos.mSclera;
    for (const side of [-1, 1]) {
      const sclera = new THREE.Mesh(scleraGeo, shirtMat);
      sclera.position.set(side * 0.075, 0.015, -0.213);
      sclera.scale.set(1, 1.09, 0.58);
      this.mHead.add(sclera);
    }
    const smile = new THREE.Mesh(geos.mSmile, shoeMat);
    smile.rotation.z = Math.PI;
    smile.position.set(0, -0.064, -0.222);
    this.mHead.add(smile);

    const browGeo = geos.mBrow;
    const lBrow = new THREE.Mesh(browGeo, hairMat);
    lBrow.position.set(-0.08, 0.065, -0.21);
    lBrow.rotation.z = 0.08;
    const rBrow = new THREE.Mesh(browGeo, hairMat);
    rBrow.position.set(0.08, 0.065, -0.21);
    rBrow.rotation.z = -0.08;

    // Explorer Baseball/Ranger Cap with prominent front visor
    const capCrown = new THREE.Mesh(geos.mCapCrown, capMat);
    capCrown.position.set(0, 0.19, 0);
    capCrown.castShadow = true;

    const capVisor = new THREE.Mesh(geos.mCapVisor, capMat);
    capVisor.position.set(0, 0.145, -0.20);
    capVisor.rotation.x = 0.14;

    const starBadge = new THREE.Mesh(geos.mStarBadge, goldMat);
    starBadge.position.set(0, 0.2, -0.22);

    this.mCapParts.push(capCrown, capVisor, starBadge);
    this.buildMaleKingCrown();

    // Sculpted nose & ears on male head
    const mNose = new THREE.Mesh(geos.mNose, skinMat);
    mNose.scale.set(0.95, 0.9, 1.15);
    mNose.position.set(0, -0.022, -0.232);

    const mEarGeo = geos.mEar;
    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(mEarGeo, skinMat);
      ear.scale.set(0.45, 1.12, 0.75);
      ear.position.set(side * 0.222, -0.008, 0.0);
      this.mHead.add(ear);
    });

    this.mHead.add(
      head,
      mNose,
      shortHair,
      lEye,
      rEye,
      lBrow,
      rBrow,
      capCrown,
      capVisor,
      starBadge,
      this.maleCrownGroup
    );
    this.maleRoot.add(this.mHead);

    // Stronger shirt-sleeved arms
    const armGeo = geos.mArm;
    const handGeo = geos.mHand;

    this.mLeftArm.position.set(-0.29, 0.92, 0);
    const mlA = new THREE.Mesh(armGeo, shirtMat);
    mlA.position.y = -0.15;
    mlA.castShadow = true;
    const mlH = new THREE.Mesh(handGeo, skinMat);
    mlH.position.y = -0.32;
    this.mLeftArm.add(mlA, mlH);

    this.mRightArm.position.set(0.29, 0.92, 0);
    const mrA = new THREE.Mesh(armGeo, shirtMat);
    mrA.position.y = -0.15;
    mrA.castShadow = true;
    const mrH = new THREE.Mesh(handGeo, skinMat);
    mrH.position.y = -0.32;
    this.mRightArm.add(mrA, mrH);

    // Sturdy trousers & adventure boots
    const legGeo = geos.mLeg;
    const shoeGeo = geos.mShoe;

    this.mLeftLeg.position.set(-0.12, 0.46, 0);
    const mlL = new THREE.Mesh(legGeo, pantsMat);
    mlL.position.y = -0.18;
    mlL.castShadow = true;
    const mlS = new THREE.Mesh(shoeGeo, shoeMat);
    mlS.position.set(0, -0.39, -0.04);
    mlS.castShadow = true;
    this.mLeftLeg.add(mlL, mlS);

    this.mRightLeg.position.set(0.12, 0.46, 0);
    const mrL = new THREE.Mesh(legGeo, pantsMat);
    mrL.position.y = -0.18;
    mrL.castShadow = true;
    const mrS = new THREE.Mesh(shoeGeo, shoeMat);
    mrS.position.set(0, -0.39, -0.04);
    mrS.castShadow = true;
    this.mRightLeg.add(mrL, mrS);

    this.maleRoot.add(
      this.mLeftArm,
      this.mRightArm,
      this.mLeftLeg,
      this.mRightLeg
    );
  }

  private buildMaleKingCrown(): void {
    const crownGold = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xb45309,
        emissiveIntensity: 0.22,
        metalness: 0.85,
        roughness: 0.2,
      })
    );
    const velvetMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x991b1b,
        roughness: 0.78,
      })
    );
    const rubyMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xe11d48,
        emissive: 0xbe123c,
        emissiveIntensity: 0.45,
        roughness: 0.15,
      })
    );
    const emeraldMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.4,
        roughness: 0.15,
      })
    );

    // Velvet royal cushion dome
    const velvetDome = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(0.185, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55)),
      velvetMat
    );
    velvetDome.position.y = 0.15;

    // Wide golden circlet band
    const band = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.228, 0.205, 0.095, 16, 1, true)),
      crownGold
    );
    band.position.y = 0.185;
    band.material.side = THREE.DoubleSide;

    const rim = new THREE.Mesh(
      this.track(new THREE.TorusGeometry(0.208, 0.018, 8, 24)),
      crownGold
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.145;

    this.maleCrownGroup.add(velvetDome, band, rim);

    // 6 serrated royal points + jewel studs around crown
    const spikeGeo = this.track(new THREE.ConeGeometry(0.044, 0.11, 6));
    const gemGeo = this.track(new THREE.OctahedronGeometry(0.026, 0));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const sx = Math.sin(a) * 0.21;
      const sz = Math.cos(a) * 0.21;

      const spike = new THREE.Mesh(spikeGeo, crownGold);
      spike.position.set(sx, 0.265, sz);
      this.maleCrownGroup.add(spike);

      const gem = new THREE.Mesh(gemGeo, i % 2 === 0 ? rubyMat : emeraldMat);
      gem.position.set(Math.sin(a) * 0.225, 0.19, Math.cos(a) * 0.225);
      this.maleCrownGroup.add(gem);
    }

    // Crossed royal gold arches & finial orb on top
    const archGeo = this.track(new THREE.TorusGeometry(0.19, 0.016, 6, 18, Math.PI));
    const arch1 = new THREE.Mesh(archGeo, crownGold);
    arch1.position.y = 0.23;
    const arch2 = new THREE.Mesh(archGeo, crownGold);
    arch2.position.y = 0.23;
    arch2.rotation.y = Math.PI / 2;

    const orb = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(0.038, 12, 10)),
      crownGold
    );
    orb.position.y = 0.43;
    const topGem = new THREE.Mesh(gemGeo, rubyMat);
    topGem.position.y = 0.48;

    this.maleCrownGroup.add(arch1, arch2, orb, topGem);
    this.maleCrownGroup.visible = false;
  }

  private buildFemaleQueenCrown(goldMat: THREE.MeshStandardMaterial): void {
    const crownGold = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xfde047,
        emissive: 0xd97706,
        emissiveIntensity: 0.25,
        metalness: 0.86,
        roughness: 0.18,
      })
    );
    const diamondMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.55,
        roughness: 0.1,
      })
    );
    const roseGemMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xe11d48,
        emissiveIntensity: 0.45,
        roughness: 0.14,
      })
    );

    // Sculpted arched Queen Tiara circlet resting gracefully atop hair crown
    const tiaraRing = new THREE.Mesh(
      this.track(new THREE.TorusGeometry(0.185, 0.017, 8, 28)),
      crownGold
    );
    tiaraRing.rotation.x = Math.PI / 2 - 0.14;
    tiaraRing.position.set(0, 0.168, -0.01);
    this.femaleCrownGroup.add(tiaraRing);

    // 5 graduated filigree spires facing front (-Z)
    const spireConfigs = [
      {angle: 0, h: 0.145, r: 0.036, mat: diamondMat},
      {angle: -0.45, h: 0.105, r: 0.028, mat: roseGemMat},
      {angle: 0.45, h: 0.105, r: 0.028, mat: roseGemMat},
      {angle: -0.92, h: 0.075, r: 0.022, mat: goldMat},
      {angle: 0.92, h: 0.075, r: 0.022, mat: goldMat},
    ];

    spireConfigs.forEach((cfg) => {
      const rx = Math.sin(cfg.angle) * 0.18;
      const rz = -Math.cos(cfg.angle) * 0.18;

      const spire = new THREE.Mesh(
        this.track(new THREE.ConeGeometry(cfg.r, cfg.h, 6)),
        crownGold
      );
      spire.position.set(rx, 0.18 + cfg.h * 0.45, rz - 0.01);
      spire.rotation.x = -0.15;
      spire.rotation.z = -cfg.angle * 0.25;

      const tipGem = new THREE.Mesh(
        this.track(new THREE.OctahedronGeometry(cfg.r * 0.72, 0)),
        cfg.mat
      );
      tipGem.position.set(rx, 0.185 + cfg.h * 0.95, rz - 0.02);

      this.femaleCrownGroup.add(spire, tipGem);
    });

    // Center front tiara jewel brooch
    const brooch = new THREE.Mesh(
      this.track(new THREE.OctahedronGeometry(0.034, 0)),
      diamondMat
    );
    brooch.position.set(0, 0.185, -0.195);
    this.femaleCrownGroup.add(brooch);

    this.femaleCrownGroup.visible = false;
  }

  private buildHandheldLantern(): void {
    const brassMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.85,
        roughness: 0.25,
      })
    );
    this.lanternBulbMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xfef3c7,
        emissive: 0xf59e0b,
        emissiveIntensity: 2.2,
        roughness: 0.15,
      })
    );

    const handle = new THREE.Mesh(
      this.track(new THREE.TorusGeometry(0.036, 0.008, 8, 16)),
      brassMat
    );
    handle.position.y = 0.02;

    const cap = new THREE.Mesh(
      this.track(new THREE.ConeGeometry(0.068, 0.055, 8)),
      brassMat
    );
    cap.position.y = -0.025;

    const glass = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.05, 0.044, 0.11, 8)),
      this.lanternBulbMat
    );
    glass.position.y = -0.095;

    const base = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.06, 0.066, 0.026, 8)),
      brassMat
    );
    base.position.y = -0.16;

    this.lanternLight = new THREE.PointLight(0xffedd5, 0, 14, 1.5);
    this.lanternLight.position.set(0, -0.095, -0.06);

    this.lanternGroup.add(handle, cap, glass, base, this.lanternLight);
    this.lanternGroup.visible = false;
  }

  private buildRoleAccessories(role: CharacterRoleOutfit): void {
    const isFemale = this.activeStyle === 'kadin';
    const root = isFemale ? this.femaleRoot : this.maleRoot;
    const head = isFemale ? this.fHead : this.mHead;
    const rArm = isFemale ? this.fRightArm : this.mRightArm;
    const lArm = isFemale ? this.fLeftArm : this.mLeftArm;

    const goldMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        metalness: 0.72,
        roughness: 0.25,
      })
    );

    if (role === 'imam') {
      const cotton = this.track(new THREE.MeshStandardMaterial({color: 0xf1e9d5, roughness: 0.87}));
      const cloth = this.track(new THREE.MeshStandardMaterial({color: 0x27443c, roughness: 0.86}));
      const robe = new THREE.Mesh(this.track(new THREE.CylinderGeometry(0.18, 0.29, 0.58, 14)), cloth);
      robe.position.y = 0.57;
      robe.scale.z = 0.78;
      const cap = new THREE.Mesh(this.track(new THREE.CylinderGeometry(0.15, 0.18, 0.11, 18)), cotton);
      cap.position.y = 0.205;
      const capRim = new THREE.Mesh(this.track(new THREE.TorusGeometry(0.164, 0.024, 6, 18)), cotton);
      capRim.rotation.x = Math.PI / 2;
      capRim.position.y = 0.17;
      head.add(cap, capRim);
      root.add(robe);
    } else if (role === 'archaeologist') {
      const sand = this.track(new THREE.MeshStandardMaterial({color: 0xc9ac74, roughness: 0.94}));
      const canvas = this.track(new THREE.MeshStandardMaterial({color: 0x7e7352, roughness: 0.94}));
      const brim = new THREE.Mesh(this.track(new THREE.CylinderGeometry(0.29, 0.30, 0.034, 18)), sand);
      brim.position.y = 0.19;
      const crown = new THREE.Mesh(this.track(new THREE.CylinderGeometry(0.155, 0.186, 0.14, 16)), sand);
      crown.position.y = 0.265;
      const band = new THREE.Mesh(this.track(new THREE.CylinderGeometry(0.18, 0.186, 0.036, 16)), canvas);
      band.position.y = 0.223;
      head.add(brim, crown, band);
      const satchel = new THREE.Mesh(this.track(new THREE.BoxGeometry(0.16, 0.2, 0.11)), canvas);
      satchel.position.set(0.21, 0.58, -0.04);
      root.add(satchel);
    } else if (role === 'concertDrummer') {
      const maple = this.track(new THREE.MeshStandardMaterial({color: 0xe0b773, roughness: 0.75}));
      const stick = this.track(new THREE.CylinderGeometry(0.012, 0.014, 0.33, 7));
      for (const arm of [lArm, rArm]) {
        const drumstick = new THREE.Mesh(stick, maple);
        drumstick.rotation.x = Math.PI / 2;
        drumstick.position.set(0, -0.31, -0.15);
        arm.add(drumstick);
      }
    } else if (role === 'sport') {
      // Athletic red-white headband, sweatband & ping-pong paddle
      const bandMat = this.track(
        new THREE.MeshStandardMaterial({color: 0xef4444, roughness: 0.5})
      );
      const whiteMat = this.track(
        new THREE.MeshStandardMaterial({color: 0xf8fafc, roughness: 0.45})
      );
      const headband = new THREE.Mesh(
        this.track(new THREE.TorusGeometry(0.228, 0.03, 8, 24)),
        bandMat
      );
      headband.rotation.x = Math.PI / 2 - 0.12;
      headband.position.set(0, 0.09, 0);
      head.add(headband);

      const stripe = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.185, 0.185, 0.06, 16)),
        whiteMat
      );
      stripe.scale.set(1.22, 1, 0.85);
      stripe.position.set(0, 0.65, 0);
      root.add(stripe);

      const sweatband = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.078, 0.078, 0.06, 12)),
        bandMat
      );
      sweatband.position.y = -0.25;
      lArm.add(sweatband);

      // Ping-pong paddle in right hand
      const handle = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.02, 0.024, 0.14, 8)),
        this.track(new THREE.MeshStandardMaterial({color: 0xb45309, roughness: 0.65}))
      );
      handle.rotation.x = Math.PI / 2;
      handle.position.set(0, -0.32, -0.1);
      const blade = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.11, 0.11, 0.024, 16)),
        bandMat
      );
      blade.rotation.z = Math.PI / 2;
      blade.position.set(0, -0.31, -0.24);
      rArm.add(handle, blade);
    } else if (role === 'culture') {
      // Anatolian patterned sash, traditional Ottoman scholar cap & round spectacles
      const crimsonMat = this.track(
        new THREE.MeshStandardMaterial({color: 0x991b1b, roughness: 0.62})
      );
      const sash = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.195, 0.21, 0.11, 16)),
        crimsonMat
      );
      sash.scale.set(1.18, 1, 0.86);
      sash.position.set(0, 0.56, 0);
      const sashRim = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.2, 0.2, 0.028, 16)),
        goldMat
      );
      sashRim.scale.set(1.19, 1, 0.87);
      sashRim.position.set(0, 0.61, 0);
      root.add(sash, sashRim);

      // Traditional felt cap + tassel
      const fez = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.14, 0.175, 0.16, 18)),
        crimsonMat
      );
      fez.position.set(0, 0.25, 0.01);
      const tassel = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.018, 0.032, 0.14, 8)),
        goldMat
      );
      tassel.position.set(0.14, 0.22, 0.02);
      tassel.rotation.z = -0.35;
      head.add(fez, tassel);

      // Round brass spectacles
      const specGeo = this.track(new THREE.TorusGeometry(0.042, 0.008, 6, 16));
      const lSpec = new THREE.Mesh(specGeo, goldMat);
      lSpec.position.set(-0.072, 0.015, -0.215);
      const rSpec = new THREE.Mesh(specGeo, goldMat);
      rSpec.position.set(0.072, 0.015, -0.215);
      head.add(lSpec, rSpec);
    } else if (role === 'carnival') {
      // Bright festival cape & pointed star hat
      const capeMat = this.track(
        new THREE.MeshStandardMaterial({
          color: 0x9333ea,
          roughness: 0.5,
          side: THREE.DoubleSide,
        })
      );
      const cape = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.18, 0.36, 0.62, 12, 1, true, -0.9, 1.8)),
        capeMat
      );
      cape.position.set(0, 0.68, 0.16);
      cape.rotation.x = 0.16;
      root.add(cape);

      const hat = new THREE.Mesh(
        this.track(new THREE.ConeGeometry(0.18, 0.34, 16)),
        capeMat
      );
      hat.position.set(0, 0.34, 0);
      const star = new THREE.Mesh(
        this.track(new THREE.OctahedronGeometry(0.05, 0)),
        goldMat
      );
      star.position.set(0, 0.52, 0);
      head.add(hat, star);
    } else if (role === 'hideseek') {
      // Bright neon game team vest sash + playful star cap so Hide & Seek kids stand out clearly
      const teamColor =
        HIDESEEK_TEAM_COLORS[this.variantIndex % HIDESEEK_TEAM_COLORS.length];
      const neonMat = this.track(
        new THREE.MeshStandardMaterial({
          color: teamColor,
          emissive: teamColor,
          emissiveIntensity: 0.35,
          roughness: 0.35,
        })
      );

      // Glowing game sash across chest
      const chestRing = new THREE.Mesh(
        this.track(new THREE.TorusGeometry(0.21, 0.036, 8, 22)),
        neonMat
      );
      chestRing.position.set(0, 0.78, 0);
      chestRing.rotation.set(0.6, 0.3, 0.75);
      chestRing.scale.set(1.15, 0.9, 0.85);
      root.add(chestRing);

      // Neon floating team ring/cap ornament on top of head
      const crownPin = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.025, 0.025, 0.11, 8)),
        goldMat
      );
      crownPin.position.set(0, 0.27, 0);
      const beacon = new THREE.Mesh(
        this.track(new THREE.OctahedronGeometry(0.068, 0)),
        neonMat
      );
      beacon.position.set(0, 0.36, 0);
      head.add(crownPin, beacon);
    } else if (role === 'anatolian') {
      // Traditional Anatolian turquoise sash, coin trim & festive folk headband
      const turqMat = this.track(
        new THREE.MeshStandardMaterial({color: 0x0f766e, roughness: 0.55})
      );
      const sash = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.188, 0.2, 0.11, 16)),
        turqMat
      );
      sash.scale.set(1.16, 1, 0.86);
      sash.position.set(0, 0.57, 0);

      const coinRim = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.195, 0.195, 0.026, 16)),
        goldMat
      );
      coinRim.scale.set(1.17, 1, 0.87);
      coinRim.position.set(0, 0.62, 0);
      root.add(sash, coinRim);

      const folkBand = new THREE.Mesh(
        this.track(new THREE.TorusGeometry(isFemale ? 0.205 : 0.235, 0.026, 8, 22)),
        turqMat
      );
      folkBand.rotation.x = Math.PI / 2 - 0.1;
      folkBand.position.set(0, 0.11, 0);

      const frontCoin = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.036, 0.036, 0.015, 10)),
        goldMat
      );
      frontCoin.rotation.x = Math.PI / 2;
      frontCoin.position.set(0, 0.13, isFemale ? -0.2 : -0.23);
      head.add(folkBand, frontCoin);
    } else if (role === 'siraci') {
      // Traditional Ottoman/Anatolian Şıracı: crimson-gold embroidered vest, sash, felt cap & copper backpack güğüm!
      const crimsonMat = this.track(
        new THREE.MeshStandardMaterial({color: 0xbe123c, roughness: 0.56})
      );
      const copperMat = this.track(
        new THREE.MeshStandardMaterial({
          color: 0xd97706,
          metalness: 0.84,
          roughness: 0.22,
        })
      );
      const grapeMat = this.track(
        new THREE.MeshStandardMaterial({color: 0x7e22ce, roughness: 0.35})
      );

      // Embroidered Crimson Vest overlay
      const vest = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(0.46, 0.38, 0.3)),
        crimsonMat
      );
      vest.position.set(0, 0.8, 0);
      const sash = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.21, 0.22, 0.12, 16)),
        goldMat
      );
      sash.scale.set(1.16, 1, 0.86);
      sash.position.set(0, 0.56, 0);
      root.add(vest, sash);

      // Felt Cap + Gold Tassel
      const cap = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.15, 0.19, 0.15, 16)),
        crimsonMat
      );
      cap.position.set(0, 0.25, 0);
      const tassel = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.018, 0.03, 0.13, 8)),
        goldMat
      );
      tassel.position.set(0.15, 0.22, 0.02);
      tassel.rotation.z = -0.35;
      head.add(cap, tassel);

      // Iconic Copper Backpack Şıra Güğümü (dispenser tank on back)
      const gugumBody = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.16, 0.14, 0.54, 16)),
        copperMat
      );
      gugumBody.position.set(0, 0.88, 0.27);
      gugumBody.castShadow = true;

      const gugumDome = new THREE.Mesh(
        this.track(new THREE.ConeGeometry(0.17, 0.18, 16)),
        goldMat
      );
      gugumDome.position.set(0, 1.24, 0.27);

      const spout = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.022, 0.028, 0.42, 8)),
        copperMat
      );
      spout.rotation.x = -0.82;
      spout.position.set(0.14, 1.06, 0.02);
      root.add(gugumBody, gugumDome, spout);

      // Brass cup filled with purple Şıra in left hand
      const cup = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.055, 0.04, 0.12, 12)),
        goldMat
      );
      cup.position.set(0, -0.33, -0.05);
      const siraTop = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.048, 0.048, 0.02, 10)),
        grapeMat
      );
      siraTop.position.set(0, -0.275, -0.05);
      lArm.add(cup, siraTop);
    } else if (role === 'bozaci') {
      // Traditional Nighttime Bozacı: winter overcoat, astrakhan kalpak, scarf, copper güğüm & glowing lantern
      const coatMat = this.track(
        new THREE.MeshStandardMaterial({color: 0x312e81, roughness: 0.72})
      );
      const furMat = this.track(
        new THREE.MeshStandardMaterial({color: 0x292524, roughness: 0.92})
      );
      const scarfMat = this.track(
        new THREE.MeshStandardMaterial({color: 0xfef3c7, roughness: 0.7})
      );
      const copperMat = this.track(
        new THREE.MeshStandardMaterial({
          color: 0xb45309,
          metalness: 0.82,
          roughness: 0.24,
        })
      );

      const coat = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.22, 0.27, 0.56, 16)),
        coatMat
      );
      coat.scale.set(1.1, 1, 0.85);
      coat.position.set(0, 0.72, 0);
      const scarf = new THREE.Mesh(
        this.track(new THREE.TorusGeometry(0.16, 0.042, 8, 18)),
        scarfMat
      );
      scarf.rotation.x = Math.PI / 2;
      scarf.position.set(0, 0.99, 0);
      root.add(coat, scarf);

      // Tall Traditional Kalpak Hat
      const kalpak = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.21, 0.24, 0.22, 16)),
        furMat
      );
      kalpak.position.set(0, 0.24, 0);
      const kalpakTop = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 14)),
        coatMat
      );
      kalpakTop.position.set(0, 0.35, 0);
      head.add(kalpak, kalpakTop);

      // Copper Boza Güğümü carried on back + warm hand lantern in right hand
      const bozaGugum = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.15, 0.17, 0.46, 16)),
        copperMat
      );
      bozaGugum.position.set(0, 0.84, 0.26);
      const bozaLid = new THREE.Mesh(
        this.track(new THREE.SphereGeometry(0.14, 14, 10)),
        goldMat
      );
      bozaLid.scale.set(1, 0.5, 1);
      bozaLid.position.set(0, 1.09, 0.26);
      root.add(bozaGugum, bozaLid);

      // Warm glowing lantern in right hand
      const glowBulbMat = this.track(
        new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xf59e0b,
          emissiveIntensity: 2.2,
          roughness: 0.2,
        })
      );
      const handLantern = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.06, 0.05, 0.14, 8)),
        glowBulbMat
      );
      handLantern.position.set(0, -0.37, -0.06);
      const handCap = new THREE.Mesh(
        this.track(new THREE.ConeGeometry(0.08, 0.06, 8)),
        goldMat
      );
      handCap.position.set(0, -0.28, -0.06);
      const bozaLight = new THREE.PointLight(0xfbbf24, 1.8, 9, 1.6);
      bozaLight.position.set(0, -0.36, -0.08);
      rArm.add(handLantern, handCap, bozaLight);
    } else if (role === 'sazplayer') {
      // Female Anatolian Folk Musician: plum-gold cepken vest, floral yazma headscarf, and detailed 3D Bağlama/Saz!
      const plumMat = this.track(
        new THREE.MeshStandardMaterial({color: 0x701a75, roughness: 0.55})
      );
      const yazmaMat = this.track(
        new THREE.MeshStandardMaterial({color: 0xe11d48, roughness: 0.6})
      );
      const tekneMat = this.track(
        new THREE.MeshStandardMaterial({color: 0x78350f, roughness: 0.45})
      );
      const faceWoodMat = this.track(
        new THREE.MeshStandardMaterial({color: 0xfde68a, roughness: 0.55})
      );
      const neckWoodMat = this.track(
        new THREE.MeshStandardMaterial({color: 0x451a03, roughness: 0.5})
      );

      // Ornate Cepken Vest Trim & Golden Sash
      const cepken = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.17, 0.155, 0.28, 18)),
        plumMat
      );
      cepken.scale.set(1.09, 1, 0.85);
      cepken.position.set(0, 0.82, 0);
      const beltTrim = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.155, 0.165, 0.07, 18)),
        goldMat
      );
      beltTrim.scale.set(1.08, 1, 0.86);
      beltTrim.position.set(0, 0.67, 0);
      root.add(cepken, beltTrim);

      // Traditional Anatolian Yazma Headscarf trim + coin forehead row
      const yazmaWrap = new THREE.Mesh(
        this.track(new THREE.TorusGeometry(0.205, 0.028, 8, 26)),
        yazmaMat
      );
      yazmaWrap.rotation.x = Math.PI / 2 - 0.16;
      yazmaWrap.position.set(0, 0.08, 0);
      head.add(yazmaWrap);

      for (let c = -2; c <= 2; c++) {
        const coin = new THREE.Mesh(
          this.track(new THREE.CylinderGeometry(0.022, 0.022, 0.008, 10)),
          goldMat
        );
        coin.rotation.x = Math.PI / 2;
        coin.position.set(c * 0.044, 0.1, -0.195);
        head.add(coin);
      }

      // 3D Anatolian Bağlama / Saz held cleanly across front (-Z) so hands touch neck & strings
      const sazGroup = new THREE.Group();
      sazGroup.position.set(-0.04, 0.84, -0.18);
      sazGroup.rotation.z = -0.22;
      sazGroup.rotation.y = 0.04;

      // Resonator bowl (Tekne)
      const bowl = new THREE.Mesh(
        this.track(new THREE.SphereGeometry(0.155, 16, 14)),
        tekneMat
      );
      bowl.scale.set(1.06, 1.26, 0.65);
      bowl.position.set(0.11, -0.04, -0.02);

      // Soundboard (Göğüs)
      const facePlate = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.14, 0.14, 0.018, 18)),
        faceWoodMat
      );
      facePlate.scale.set(1.06, 1, 1.26);
      facePlate.rotation.x = Math.PI / 2;
      facePlate.position.set(0.11, -0.04, -0.075);

      // Long Neck (Sap)
      const neck = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.022, 0.028, 0.72, 10)),
        neckWoodMat
      );
      neck.rotation.z = Math.PI / 2;
      neck.position.set(-0.27, -0.04, -0.068);

      // Tuning Pegs (Burgular)
      for (let p = 0; p < 3; p++) {
        const peg = new THREE.Mesh(
          this.track(new THREE.CylinderGeometry(0.009, 0.009, 0.07, 6)),
          goldMat
        );
        peg.position.set(-0.55 - p * 0.03, 0.0, -0.068);
        sazGroup.add(peg);
      }

      // Rosette & Bridge
      const bridge = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(0.018, 0.08, 0.018)),
        goldMat
      );
      bridge.position.set(0.19, -0.04, -0.09);

      sazGroup.add(bowl, facePlate, neck, bridge);
      root.add(sazGroup);
    } else if (role === 'semazen') {
      // Whirling Dervish (Semazen): flowing white tennure robe, destegül jacket, tall sikke hat
      const tennureMat = this.track(
        new THREE.MeshStandardMaterial({color: 0xf8fafc, roughness: 0.72})
      );
      const sashMat = this.track(
        new THREE.MeshStandardMaterial({color: 0x0f172a, roughness: 0.6})
      );
      const sikkeMat = this.track(
        new THREE.MeshStandardMaterial({color: 0xd6b07c, roughness: 0.78})
      );

      // Remove sporty backpack / hide cap so traditional Semazen silhouette stands out
      if (this.activeStyle === 'erkek') {
        for (const capPart of this.mCapParts) {
          capPart.visible = false;
        }
      }

      const robe = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.18, 0.6, 0.78, 22)),
        tennureMat
      );
      robe.position.set(0, 0.41, 0);
      robe.castShadow = true;

      const jacket = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.242, 0.232, 0.36, 16)),
        tennureMat
      );
      jacket.scale.set(1.06, 1, 0.85);
      jacket.position.set(0, 0.82, 0);

      const sash = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.224, 0.234, 0.09, 18)),
        sashMat
      );
      sash.scale.set(1.06, 1, 0.86);
      sash.position.set(0, 0.64, 0);

      // Tall conical camel-felt Sikke hat
      const sikke = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.135, 0.205, 0.42, 16)),
        sikkeMat
      );
      sikke.position.set(0, 0.32, 0);
      const sikkeTop = new THREE.Mesh(
        this.track(new THREE.SphereGeometry(0.135, 14, 10)),
        sikkeMat
      );
      sikkeTop.scale.set(1, 0.45, 1);
      sikkeTop.position.set(0, 0.53, 0);

      const destar = new THREE.Mesh(
        this.track(new THREE.TorusGeometry(0.205, 0.032, 8, 20)),
        tennureMat
      );
      destar.rotation.x = Math.PI / 2;
      destar.position.set(0, 0.14, 0);

      head.add(sikke, sikkeTop, destar);
      root.add(robe, jacket, sash);
    } else if (role === 'neyzen') {
      // Sufi Ney Player: deep indigo cübbe, felt kavuk & bamboo Ney flute
      const robeMat = this.track(
        new THREE.MeshStandardMaterial({color: 0x1e3a5f, roughness: 0.65})
      );
      const feltMat = this.track(
        new THREE.MeshStandardMaterial({color: 0xc29b61, roughness: 0.78})
      );
      const neyMat = this.track(
        new THREE.MeshStandardMaterial({color: 0xd9a05b, roughness: 0.48})
      );

      if (this.activeStyle === 'erkek') {
        for (const capPart of this.mCapParts) {
          capPart.visible = false;
        }
      }

      const cubbe = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.23, 0.31, 0.88, 18)),
        robeMat
      );
      cubbe.scale.set(1.05, 1, 0.82);
      cubbe.position.set(0, 0.56, 0);
      cubbe.castShadow = true;

      const kavuk = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.15, 0.21, 0.28, 16)),
        feltMat
      );
      kavuk.position.set(0, 0.24, 0);
      const kavukRim = new THREE.Mesh(
        this.track(new THREE.TorusGeometry(0.21, 0.034, 8, 20)),
        goldMat
      );
      kavukRim.rotation.x = Math.PI / 2;
      kavukRim.position.set(0, 0.13, 0);
      head.add(kavuk, kavukRim);

      // Bamboo Ney held obliquely down from lips in front (-Z)
      const ney = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.014, 0.017, 0.62, 10)),
        neyMat
      );
      ney.position.set(0.02, 1.0, -0.24);
      ney.rotation.set(0.32, 0.06, 0.42);
      const baspare = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.022, 0.015, 0.04, 10)),
        goldMat
      );
      baspare.position.set(-0.1, 1.24, -0.17);
      baspare.rotation.copy(ney.rotation);

      root.add(cubbe, ney, baspare);
    } else if (role === 'singer') {
      // Female Soloist in elegant emerald/gold Anatolian stage gown + mic stand
      const gownMat = this.track(
        new THREE.MeshStandardMaterial({color: 0x0f766e, roughness: 0.45})
      );
      const shawlMat = this.track(
        new THREE.MeshStandardMaterial({color: 0xfde047, roughness: 0.4, metalness: 0.25})
      );
      const standMat = this.track(
        new THREE.MeshStandardMaterial({color: 0x1e293b, metalness: 0.78, roughness: 0.28})
      );

      const gown = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.16, 0.34, 0.56, 18)),
        gownMat
      );
      gown.position.set(0, 0.38, 0);
      const sash = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.165, 0.175, 0.07, 16)),
        shawlMat
      );
      sash.position.set(0, 0.64, 0);
      const tiara = new THREE.Mesh(
        this.track(new THREE.TorusGeometry(0.18, 0.018, 8, 18, Math.PI)),
        goldMat
      );
      tiara.position.set(0, 0.12, -0.06);
      head.add(tiara);

      // Standing Stage Microphone in front (-Z)
      const micBase = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.14, 0.16, 0.04, 14)),
        standMat
      );
      micBase.position.set(0, 0.02, -0.42);
      const micPole = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.016, 0.02, 1.12, 10)),
        standMat
      );
      micPole.position.set(0, 0.58, -0.42);
      const micHead = new THREE.Mesh(
        this.track(new THREE.SphereGeometry(0.042, 12, 10)),
        goldMat
      );
      micHead.position.set(0, 1.15, -0.36);

      root.add(gown, sash, micBase, micPole, micHead);
    } else if (role === 'chorus') {
      // Child Chorus Performer (scaled 0.78) with turquoise/gold choir vest
      this.bodyRoot.scale.setScalar(0.78);
      const choirMat = this.track(
        new THREE.MeshStandardMaterial({color: 0x0369a1, roughness: 0.55})
      );
      const sash = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.175, 0.185, 0.12, 14)),
        choirMat
      );
      sash.position.set(0, 0.68, 0);
      const badge = new THREE.Mesh(
        this.track(new THREE.OctahedronGeometry(0.04, 0)),
        goldMat
      );
      badge.position.set(0.08, 0.84, -0.17);
      root.add(sash, badge);
    } else if (role === 'guitarist') {
      // Acoustic Guitarist playing alongside the Ney ensemble
      const vestMat = this.track(
        new THREE.MeshStandardMaterial({color: 0x7c2d12, roughness: 0.6})
      );
      const guitarWood = this.track(
        new THREE.MeshStandardMaterial({color: 0xd97706, roughness: 0.42})
      );
      const darkWood = this.track(
        new THREE.MeshStandardMaterial({color: 0x451a03, roughness: 0.55})
      );

      if (this.activeStyle === 'erkek') {
        for (const capPart of this.mCapParts) {
          capPart.visible = false;
        }
      }

      const scarf = new THREE.Mesh(
        this.track(new THREE.TorusGeometry(0.18, 0.042, 8, 16)),
        vestMat
      );
      scarf.rotation.x = Math.PI / 2;
      scarf.position.set(0, 0.99, 0);

      // Acoustic Guitar held across front (-Z)
      const guitarGroup = new THREE.Group();
      guitarGroup.position.set(-0.02, 0.78, -0.2);
      guitarGroup.rotation.z = -0.24;

      const lowerBout = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 18)),
        guitarWood
      );
      lowerBout.rotation.x = Math.PI / 2;
      lowerBout.position.set(0.12, -0.02, 0);

      const upperBout = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16)),
        guitarWood
      );
      upperBout.rotation.x = Math.PI / 2;
      upperBout.position.set(-0.02, 0.02, 0);

      const soundHole = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.048, 0.048, 0.015, 16)),
        darkWood
      );
      soundHole.rotation.x = Math.PI / 2;
      soundHole.position.set(0.08, 0, -0.04);

      const gNeck = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(0.56, 0.055, 0.03)),
        darkWood
      );
      gNeck.position.set(-0.28, 0.02, -0.02);

      guitarGroup.add(lowerBout, upperBout, soundHole, gNeck);
      root.add(scarf, guitarGroup);
    }
  }

  setStyle(styleId: CharacterStyleId): void {
    this.activeStyle = styleId;
    this.femaleRoot.visible = styleId === 'kadin';
    this.maleRoot.visible = styleId === 'erkek';
    const targetArm = styleId === 'kadin' ? this.fRightArm : this.mRightArm;
    this.lanternGroup.position.set(0, -0.32, -0.05);
    targetArm.add(this.lanternGroup);
    this.syncCrownVisibility();
  }

  getActiveStyle(): CharacterStyleId {
    return this.activeStyle;
  }

  setVariant(variantIndex: number): void {
    this.variantIndex = Math.max(0, variantIndex);
    const fPal = FEMALE_PALETTES[this.variantIndex % FEMALE_PALETTES.length];
    this.fDressMat?.color.setHex(fPal.dress);
    this.fAccentMat?.color.setHex(fPal.accent);
    this.fPackMat?.color.setHex(fPal.pack);
    this.fHairMat?.color.setHex(fPal.hair);

    const mPal = MALE_PALETTES[this.variantIndex % MALE_PALETTES.length];
    this.mVestMat?.color.setHex(mPal.vest);
    this.mPackMat?.color.setHex(mPal.pack);
    this.mCapMat?.color.setHex(mPal.cap);
  }

  getVariant(): number {
    return this.variantIndex;
  }

  setMazeCrownEquipped(equipped: boolean): void {
    this.mazeCrownEquipped = equipped;
    this.syncCrownVisibility();
  }

  isMazeCrownEquipped(): boolean {
    return this.mazeCrownEquipped;
  }

  private syncCrownVisibility(): void {
    const showKing = this.mazeCrownEquipped && this.activeStyle === 'erkek';
    const showQueen = this.mazeCrownEquipped && this.activeStyle === 'kadin';
    this.maleCrownGroup.visible = showKing;
    this.femaleCrownGroup.visible = showQueen;

    for (const part of this.mCapParts) {
      part.visible = !showKing && !this.hideDefaultCap;
    }
    for (const part of this.mPackParts) {
      part.visible = !this.hideDefaultPack;
    }
    for (const part of this.fPackParts) {
      part.visible = !this.hideDefaultPack;
    }
    if (this.fHeadbandBow) {
      const suppressBow =
        this.roleOutfit === 'singer' || this.roleOutfit === 'sazplayer';
      this.fHeadbandBow.visible = !showQueen && !suppressBow;
    }
  }

  setLanternActive(active: boolean): void {
    this.lanternActive = active;
    this.lanternGroup.visible = active;
    if (this.lanternLight) {
      this.lanternLight.intensity = active ? 2.8 : 0;
    }
  }

  isLanternActive(): boolean {
    return this.lanternActive;
  }

  setMoving(moving: boolean): void {
    this.isMoving = moving;
  }

  setCrouching(crouch: boolean): void {
    this.crouching = crouch;
  }

  isCrouching(): boolean {
    return this.crouching;
  }

  setWaveTimer(seconds: number): void {
    this.waveTimer = Math.max(this.waveTimer, seconds);
  }

  setPulling(dir: -1 | 0 | 1): void {
    this.pullDir = dir;
  }

  triggerPullBurst(): void {
    this.pullBurstTimer = 0.26;
  }

  setClapping(clapping: boolean): void {
    this.isClapping = clapping;
  }

  getJumpHeight(): number {
    return this.jumpOffset;
  }

  setFloorSitting(): void {
    this.floorSitting = true;
    this.setSitting(true);
  }

  setCraftPhase(phase: number | null): void {
    this.craftPhase = phase;
  }

  setStagePerforming(playing: boolean): void {
    this.isStageMusician = playing;
  }

  setSitting(sitting: boolean): void {
    this.isSitting = sitting;
  }

  isCurrentlySitting(): boolean {
    return this.isSitting;
  }

  setSpinningSemazen(spinning: boolean): void {
    this.isSpinningSemazen = spinning;
  }

  setPhotoPose(pose: PhotoPoseMode): void {
    this.photoPose = pose;
  }

  setLowDetailUpdate(low: boolean): void {
    this.lowDetailUpdate = low;
  }

  jump(): void {
    if (this.jumpOffset <= 0.01 && this.jumpVelocity <= 0) {
      this.jumpVelocity = 4.6;
    }
  }

  miniHop(velocity = 2.4): void {
    if (this.jumpOffset <= 0.06 && this.jumpVelocity <= 0.5) {
      this.jumpVelocity = velocity;
    }
  }

  update(): void {
    if (!this.visible) return;
    const rawDt = Math.min(xb.getDeltaTime(), 0.05);
    let dt = rawDt;
    if (this.lowDetailUpdate) {
      this.animThrottleAccum += rawDt;
      if (this.animThrottleAccum < 0.05) return;
      dt = Math.min(this.animThrottleAccum, 0.09);
      this.animThrottleAccum = 0;
    }
    if (this.waveTimer > 0) {
      this.waveTimer = Math.max(0, this.waveTimer - dt);
    }

    this.crouchAmount = THREE.MathUtils.damp(
      this.crouchAmount,
      this.crouching ? 1 : 0,
      10,
      dt
    );
    const baseScale = this.roleOutfit === 'chorus' ? 0.78 : 1;
    const scaleY = baseScale * (1 - this.crouchAmount * 0.28);
    this.bodyRoot.scale.set(
      baseScale * (1 + this.crouchAmount * 0.06),
      scaleY,
      baseScale * (1 + this.crouchAmount * 0.06)
    );

    if (this.jumpVelocity !== 0 || this.jumpOffset > 0) {
      this.jumpOffset += this.jumpVelocity * dt;
      this.jumpVelocity -= 13.5 * dt;
      if (this.jumpOffset <= 0) {
        this.jumpOffset = 0;
        this.jumpVelocity = 0;
      }
    }

    const isFemale = this.activeStyle === 'kadin';
    const lLeg = isFemale ? this.fLeftLeg : this.mLeftLeg;
    const rLeg = isFemale ? this.fRightLeg : this.mRightLeg;
    const lArm = isFemale ? this.fLeftArm : this.mLeftArm;
    const rArm = isFemale ? this.fRightArm : this.mRightArm;
    const head = isFemale ? this.fHead : this.mHead;

    if (this.pullBurstTimer > 0) {
      this.pullBurstTimer = Math.max(0, this.pullBurstTimer - dt);
    }

    if (this.photoPose !== 'none') {
      this.walkPhase += dt * 4.5;
      this.bodyRoot.rotation.y = THREE.MathUtils.damp(this.bodyRoot.rotation.y, 0, 12, dt);
      if (this.photoPose === 'sit') {
        this.bodyRoot.rotation.x = -0.05;
        this.bodyRoot.position.y = -0.16;
        lLeg.rotation.x = 1.42;
        rLeg.rotation.x = 1.42;
        lArm.rotation.set(0.75, 0, 0.22);
        rArm.rotation.set(0.75, 0, -0.22);
        head.rotation.z = 0.08;
      } else if (this.photoPose === 'hero') {
        this.bodyRoot.rotation.x = -0.06;
        this.bodyRoot.position.y = this.jumpOffset;
        lLeg.rotation.x = -0.18;
        rLeg.rotation.x = 0.18;
        lArm.rotation.set(0.28, 0, 0.58);
        rArm.rotation.set(2.55, 0, -0.22);
        head.rotation.z = -0.06;
      } else if (this.photoPose === 'joy') {
        this.bodyRoot.rotation.x = -0.04;
        this.bodyRoot.position.y = this.jumpOffset + Math.abs(Math.sin(this.walkPhase * 1.4)) * 0.24;
        lLeg.rotation.x = -0.28;
        rLeg.rotation.x = 0.28;
        lArm.rotation.set(2.38, 0, 0.42);
        rArm.rotation.set(2.38, 0, -0.42);
        head.rotation.z = Math.sin(this.walkPhase) * 0.08;
      } else if (this.photoPose === 'salute') {
        this.bodyRoot.rotation.x = 0;
        this.bodyRoot.position.y = this.jumpOffset;
        lLeg.rotation.x = 0;
        rLeg.rotation.x = 0;
        lArm.rotation.set(0.1, 0, 0.15);
        rArm.rotation.set(1.85, 0, 0.52);
        head.rotation.z = 0.04;
      } else {
        // wave
        this.bodyRoot.rotation.x = 0;
        this.bodyRoot.position.y = this.jumpOffset + Math.sin(this.walkPhase) * 0.02;
        lLeg.rotation.x = 0;
        rLeg.rotation.x = 0;
        lArm.rotation.set(0.2, 0, 0.18);
        rArm.rotation.set(2.35, 0, -0.35 + Math.sin(this.walkPhase * 2.1) * 0.26);
        head.rotation.z = 0.1;
      }
      this.shadowMesh.scale.setScalar(Math.max(0.55, 1 - Math.max(0, this.bodyRoot.position.y) * 0.45));
      return;
    }

    if (this.isSpinningSemazen) {
      this.walkPhase += dt * 2.25;
      this.bodyRoot.rotation.y += dt * 2.25;
      this.bodyRoot.rotation.x = THREE.MathUtils.damp(
        this.bodyRoot.rotation.x,
        0,
        8,
        dt
      );
      this.bodyRoot.position.y = Math.sin(this.walkPhase * 1.4) * 0.015;
      lLeg.rotation.x = 0;
      rLeg.rotation.x = 0;
      // Mevlevi Semazen pose: right arm raised outward (+X, +Y), left arm lowered outward (-X, -Y)
      rArm.rotation.x = THREE.MathUtils.damp(rArm.rotation.x, 0.22, 8, dt);
      rArm.rotation.z = THREE.MathUtils.damp(
        rArm.rotation.z,
        1.85 + Math.sin(this.walkPhase) * 0.04,
        8,
        dt
      );
      lArm.rotation.x = THREE.MathUtils.damp(lArm.rotation.x, 0.18, 8, dt);
      lArm.rotation.z = THREE.MathUtils.damp(
        lArm.rotation.z,
        -1.18 - Math.sin(this.walkPhase) * 0.04,
        8,
        dt
      );
      head.rotation.z = THREE.MathUtils.damp(head.rotation.z, -0.18, 8, dt);
    } else if (this.pullDir !== 0 && !this.isMoving) {
      this.bodyRoot.rotation.y = THREE.MathUtils.damp(
        this.bodyRoot.rotation.y,
        0,
        10,
        dt
      );
      this.walkPhase += dt * (this.pullBurstTimer > 0 ? 18.0 : 11.0);
      const heave = Math.sin(this.walkPhase) * 0.14;
      const burstLean = this.pullBurstTimer > 0 ? 0.16 : 0;
      this.bodyRoot.rotation.x = THREE.MathUtils.damp(
        this.bodyRoot.rotation.x,
        0.24 + burstLean + heave * 0.35,
        12,
        dt
      );
      lLeg.rotation.x = -0.38;
      rLeg.rotation.x = 0.3;
      lArm.rotation.x = 1.25 + heave;
      rArm.rotation.x = 1.15 - heave;
      rArm.rotation.z = THREE.MathUtils.damp(rArm.rotation.z, 0, 10, dt);
      this.bodyRoot.position.y = this.jumpOffset - 0.05;
    } else if (this.isPlayingSaz && !this.isMoving) {
      this.bodyRoot.rotation.y = THREE.MathUtils.damp(
        this.bodyRoot.rotation.y,
        0,
        10,
        dt
      );
      this.walkPhase += dt * 4.6;
      this.bodyRoot.rotation.x = THREE.MathUtils.damp(
        this.bodyRoot.rotation.x,
        0.04,
        8,
        dt
      );
      lLeg.rotation.x = THREE.MathUtils.damp(lLeg.rotation.x, 0, 10, dt);
      rLeg.rotation.x = THREE.MathUtils.damp(rLeg.rotation.x, 0, 10, dt);
      // POSITIVE rx brings arms forward (-Z); negative rz moves hands toward left neck & tekne strings
      lArm.rotation.x = THREE.MathUtils.damp(
        lArm.rotation.x,
        1.36 + Math.sin(this.walkPhase * 0.7) * 0.06,
        12,
        dt
      );
      lArm.rotation.z = THREE.MathUtils.damp(lArm.rotation.z, -0.52, 12, dt);
      rArm.rotation.x = THREE.MathUtils.damp(
        rArm.rotation.x,
        1.16 + Math.sin(this.walkPhase * 2.2) * 0.16,
        16,
        dt
      );
      rArm.rotation.z = THREE.MathUtils.damp(
        rArm.rotation.z,
        -0.48 + Math.cos(this.walkPhase * 2.2) * 0.1,
        16,
        dt
      );
      head.rotation.z = Math.sin(this.walkPhase * 0.6) * 0.06;
      this.bodyRoot.position.y =
        this.jumpOffset + Math.sin(this.walkPhase * 0.8) * 0.02;
    } else if (this.isStageMusician && !this.isMoving) {
      this.bodyRoot.rotation.y = THREE.MathUtils.damp(
        this.bodyRoot.rotation.y,
        0,
        10,
        dt
      );
      this.walkPhase += dt * 4.2;
      this.bodyRoot.rotation.x = THREE.MathUtils.damp(
        this.bodyRoot.rotation.x,
        0.03,
        8,
        dt
      );
      lLeg.rotation.x = 0;
      rLeg.rotation.x = 0;
      if (this.roleOutfit === 'neyzen') {
        lArm.rotation.x = THREE.MathUtils.damp(lArm.rotation.x, 1.35, 10, dt);
        lArm.rotation.z = THREE.MathUtils.damp(lArm.rotation.z, 0.72, 10, dt);
        rArm.rotation.x = THREE.MathUtils.damp(rArm.rotation.x, 1.32, 10, dt);
        rArm.rotation.z = THREE.MathUtils.damp(rArm.rotation.z, -0.78, 10, dt);
        head.rotation.z = Math.sin(this.walkPhase * 0.45) * 0.07;
      } else if (this.roleOutfit === 'guitarist') {
        lArm.rotation.x = THREE.MathUtils.damp(
          lArm.rotation.x,
          1.32 + Math.sin(this.walkPhase * 0.6) * 0.05,
          12,
          dt
        );
        lArm.rotation.z = THREE.MathUtils.damp(lArm.rotation.z, -0.52, 12, dt);
        rArm.rotation.x = THREE.MathUtils.damp(
          rArm.rotation.x,
          1.15 + Math.sin(this.walkPhase * 2.4) * 0.18,
          16,
          dt
        );
        rArm.rotation.z = THREE.MathUtils.damp(rArm.rotation.z, -0.58, 14, dt);
        head.rotation.z = Math.sin(this.walkPhase * 0.8) * 0.06;
      } else {
        // Singer & Child Chorus gentle singing sway + expressive hand gesture
        lArm.rotation.x = THREE.MathUtils.damp(
          lArm.rotation.x,
          0.35 + Math.sin(this.walkPhase) * 0.16,
          8,
          dt
        );
        lArm.rotation.z = THREE.MathUtils.damp(lArm.rotation.z, 0.12, 8, dt);
        rArm.rotation.x = THREE.MathUtils.damp(
          rArm.rotation.x,
          0.52 + Math.cos(this.walkPhase) * 0.2,
          8,
          dt
        );
        rArm.rotation.z = THREE.MathUtils.damp(rArm.rotation.z, -0.14, 8, dt);
        head.rotation.z = Math.sin(this.walkPhase * 0.7) * 0.07;
      }
      this.bodyRoot.position.y = Math.sin(this.walkPhase) * 0.018;
    } else if (this.isSitting) {
      this.bodyRoot.rotation.y = THREE.MathUtils.damp(
        this.bodyRoot.rotation.y,
        0,
        10,
        dt
      );
      this.walkPhase += dt * 3.0;
      this.bodyRoot.rotation.x = THREE.MathUtils.damp(
        this.bodyRoot.rotation.x,
        -0.04,
        10,
        dt
      );
      this.bodyRoot.position.y = THREE.MathUtils.damp(
        this.bodyRoot.position.y,
        this.floorSitting ? -0.35 : -0.14,
        12,
        dt
      );
      if (this.floorSitting) {
        lLeg.rotation.y = 0.56;
        rLeg.rotation.y = -0.56;
      }
      // Legs bent forward in front (-Z)
      lLeg.rotation.x = THREE.MathUtils.damp(lLeg.rotation.x, 1.42, 12, dt);
      rLeg.rotation.x = THREE.MathUtils.damp(rLeg.rotation.x, 1.42, 12, dt);
      if (this.isClapping) {
        const clap = Math.abs(Math.sin(this.walkPhase * 3.8)) * 0.24;
        lArm.rotation.x = THREE.MathUtils.damp(lArm.rotation.x, 1.08, 14, dt);
        rArm.rotation.x = THREE.MathUtils.damp(rArm.rotation.x, 1.08, 14, dt);
        lArm.rotation.z = 0.56 + clap;
        rArm.rotation.z = -0.56 - clap;
      } else {
        lArm.rotation.x = THREE.MathUtils.damp(lArm.rotation.x, 0.65, 10, dt);
        rArm.rotation.x = THREE.MathUtils.damp(rArm.rotation.x, 0.65, 10, dt);
        lArm.rotation.z = THREE.MathUtils.damp(lArm.rotation.z, 0.14, 10, dt);
        rArm.rotation.z = THREE.MathUtils.damp(rArm.rotation.z, -0.14, 10, dt);
      }
      head.rotation.z = Math.sin(this.walkPhase * 0.6) * 0.05;
    } else {
      this.bodyRoot.rotation.y = THREE.MathUtils.damp(
        this.bodyRoot.rotation.y,
        0,
        10,
        dt
      );
      this.bodyRoot.rotation.x = THREE.MathUtils.damp(
        this.bodyRoot.rotation.x,
        0,
        10,
        dt
      );
      if (this.isMoving) {
        this.walkPhase += dt * 10.5;
        const swing = Math.sin(this.walkPhase) * 0.65;
        lLeg.rotation.x = swing;
        rLeg.rotation.x = -swing;
        lArm.rotation.x = -swing * 0.85;
        lArm.rotation.z = THREE.MathUtils.damp(lArm.rotation.z, 0, 10, dt);
        if (this.waveTimer > 0) {
          rArm.rotation.x = 2.35;
          rArm.rotation.z = -0.35 + Math.sin(this.walkPhase * 2.2) * 0.32;
        } else {
          rArm.rotation.x = this.lanternActive ? 0.88 : swing * 0.85;
          rArm.rotation.z = THREE.MathUtils.damp(rArm.rotation.z, 0, 10, dt);
        }
        this.bodyRoot.position.y =
          this.jumpOffset + Math.abs(Math.sin(this.walkPhase)) * 0.055;
        head.rotation.z = Math.sin(this.walkPhase) * 0.04;
        if (isFemale) {
          this.fBackHair.rotation.z = Math.sin(this.walkPhase) * 0.08;
          this.fBackHair.rotation.x =
            0.08 + Math.abs(Math.cos(this.walkPhase)) * 0.08;
        }
      } else {
        this.walkPhase += dt * 2.4;
        lLeg.rotation.x = THREE.MathUtils.damp(lLeg.rotation.x, 0, 10, dt);
        rLeg.rotation.x = THREE.MathUtils.damp(rLeg.rotation.x, 0, 10, dt);
        if (this.isClapping) {
          const clap = Math.abs(Math.sin(this.walkPhase * 4.5)) * 0.25;
          lArm.rotation.x = THREE.MathUtils.damp(lArm.rotation.x, 1.08, 14, dt);
          rArm.rotation.x = THREE.MathUtils.damp(rArm.rotation.x, 1.08, 14, dt);
          lArm.rotation.z = 0.54 + clap;
          rArm.rotation.z = -0.54 - clap;
          head.rotation.z = Math.sin(this.walkPhase * 1.4) * 0.06;
        } else if (this.waveTimer > 0) {
          lArm.rotation.x = THREE.MathUtils.damp(lArm.rotation.x, 0, 10, dt);
          lArm.rotation.z = THREE.MathUtils.damp(lArm.rotation.z, 0, 10, dt);
          rArm.rotation.x = THREE.MathUtils.damp(rArm.rotation.x, 2.35, 12, dt);
          rArm.rotation.z = -0.35 + Math.sin(this.walkPhase * 7.5) * 0.36;
          head.rotation.z = THREE.MathUtils.damp(head.rotation.z, 0, 8, dt);
        } else {
          lArm.rotation.x = THREE.MathUtils.damp(lArm.rotation.x, 0, 10, dt);
          lArm.rotation.z = THREE.MathUtils.damp(lArm.rotation.z, 0, 10, dt);
          rArm.rotation.x = THREE.MathUtils.damp(
            rArm.rotation.x,
            this.lanternActive ? 0.88 : 0,
            10,
            dt
          );
          rArm.rotation.z = THREE.MathUtils.damp(rArm.rotation.z, 0, 10, dt);
          head.rotation.z = THREE.MathUtils.damp(head.rotation.z, 0, 8, dt);
        }
        if (this.lanternActive && this.lanternLight) {
          const flicker = 2.6 + Math.sin(this.walkPhase * 5.2) * 0.25;
          this.lanternLight.intensity = flicker;
        }
        this.bodyRoot.position.y =
          this.jumpOffset + Math.sin(this.walkPhase) * 0.015;
        if (isFemale) {
          this.fBackHair.rotation.z = THREE.MathUtils.damp(
            this.fBackHair.rotation.z,
            0,
            8,
            dt
          );
          this.fBackHair.rotation.x = THREE.MathUtils.damp(
            this.fBackHair.rotation.x,
            0.02,
            8,
            dt
          );
        }
      }
    }

    if (this.craftPhase !== null) {
      rArm.rotation.x = 1.12 + Math.sin(this.craftPhase) * 0.22;
      rArm.rotation.z = -0.12 + Math.cos(this.craftPhase * 0.52) * 0.13;
      head.rotation.x = 0.17;
      if (this.roleOutfit === 'concertDrummer') {
        lArm.rotation.x = 1.1 - Math.sin(this.craftPhase) * 0.28;
        lArm.rotation.z = 0.14;
      }
    }

    const shadowScale = Math.max(0.55, 1 - this.jumpOffset * 0.45);
    this.shadowMesh.scale.setScalar(shadowScale);
  }

  dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
