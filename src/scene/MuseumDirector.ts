import {metin} from "../metinler.ts";
import * as THREE from 'three';
import * as xb from 'xrblocks';

function createDirectorLabelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 660;
  canvas.height = 148;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 640, 114, 28);
    ctx.fill();

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Pointer triangle at bottom center
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    ctx.moveTo(312, 122);
    ctx.lineTo(348, 122);
    ctx.lineTo(330, 144);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 31px "Google Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(metin("MuseumDirector", "muze_muduru"), 330, 48);

    ctx.fillStyle = '#bae6fd';
    ctx.font = '600 24px "Google Sans", Arial, sans-serif';
    ctx.fillText(metin("MuseumDirector", "sohbet_et"), 330, 90);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class MuseumDirector extends xb.Script {
  private bodyGroup = new THREE.Group();
  private headGroup = new THREE.Group();
  private rightArm = new THREE.Group();
  private leftArm = new THREE.Group();
  private badgeSprite!: THREE.Sprite;
  private hitbox!: THREE.Mesh;
  private baseYaw = 0;
  private time = 0;
  private isDisposed = false;
  private disposables: Array<{dispose: () => void}> = [];

  constructor() {
    super();
    this.buildDirector();
  }

  private track<T extends {dispose: () => void}>(item: T): T {
    this.disposables.push(item);
    return item;
  }

  private buildDirector(): void {
    // Rich tailored navy-charcoal suit fabrics & accessories (pure stylized 3D, zero photo face)
    const suitMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x1b263b,
        roughness: 0.62,
        metalness: 0.08,
      })
    );
    const lapelMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.5,
        metalness: 0.12,
      })
    );
    const vestMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x24344d,
        roughness: 0.58,
        metalness: 0.06,
      })
    );
    const shirtMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.45,
      })
    );
    const tieMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x6b2147,
        roughness: 0.42,
        metalness: 0.16,
      })
    );
    const shoeMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x0b0f17,
        roughness: 0.24,
        metalness: 0.25,
      })
    );
    const beltMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x18181b,
        roughness: 0.35,
        metalness: 0.15,
      })
    );
    const goldMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.85,
        roughness: 0.22,
      })
    );
    const skinMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xebc0a2,
        roughness: 0.64,
      })
    );
    const cheekMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xe69f8a,
        roughness: 0.72,
      })
    );
    const hairMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x2f221b,
        roughness: 0.8,
      })
    );
    const beardMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x3b2b22,
        roughness: 0.82,
      })
    );
    const scleraMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.25,
      })
    );
    const irisMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x4b6b7a,
        roughness: 0.2,
      })
    );
    const pupilMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.1,
      })
    );
    const lipMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xc2786a,
        roughness: 0.55,
      })
    );

    // Subtle ground shadow disc
    const shadow = new THREE.Mesh(
      this.track(new THREE.CircleGeometry(0.42, 24)),
      this.track(
        new THREE.MeshBasicMaterial({
          color: 0x0f172a,
          transparent: true,
          opacity: 0.3,
          depthWrite: false,
        })
      )
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    this.add(shadow);

    // Tailored trousers + sculpted Oxford dress shoes with soles
    const thighGeo = this.track(new THREE.CapsuleGeometry(0.088, 0.32, 6, 12));
    const shinGeo = this.track(new THREE.CylinderGeometry(0.076, 0.064, 0.36, 14));
    const shoeToeGeo = this.track(new THREE.SphereGeometry(0.072, 12, 10));
    const shoeHeelGeo = this.track(new THREE.BoxGeometry(0.115, 0.065, 0.16));

    [-0.11, 0.11].forEach((lx) => {
      const thigh = new THREE.Mesh(thighGeo, suitMat);
      thigh.position.set(lx, 0.58, 0);
      thigh.castShadow = true;

      const shin = new THREE.Mesh(shinGeo, suitMat);
      shin.position.set(lx, 0.26, 0);
      shin.castShadow = true;

      const shoeToe = new THREE.Mesh(shoeToeGeo, shoeMat);
      shoeToe.scale.set(0.84, 0.62, 1.45);
      shoeToe.position.set(lx, 0.042, -0.07);
      shoeToe.castShadow = true;

      const shoeHeel = new THREE.Mesh(shoeHeelGeo, shoeMat);
      shoeHeel.position.set(lx, 0.036, 0.015);
      shoeHeel.castShadow = true;

      this.bodyGroup.add(thigh, shin, shoeToe, shoeHeel);
    });

    // Lower jacket skirt / tailored hips
    const jacketSkirt = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.205, 0.23, 0.24, 18)),
      suitMat
    );
    jacketSkirt.scale.set(1.08, 1, 0.78);
    jacketSkirt.position.y = 0.79;
    jacketSkirt.castShadow = true;

    // Fitted upper torso suit jacket + subtle V-vest
    const jacketTorso = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.228, 0.195, 0.44, 20)),
      suitMat
    );
    jacketTorso.scale.set(1.12, 1, 0.76);
    jacketTorso.position.y = 1.07;
    jacketTorso.castShadow = true;

    const shoulders = new THREE.Mesh(
      this.track(new THREE.CapsuleGeometry(0.092, 0.34, 8, 12)),
      suitMat
    );
    shoulders.rotation.z = Math.PI / 2;
    shoulders.scale.set(0.92, 1.0, 0.88);
    shoulders.position.y = 1.24;
    shoulders.castShadow = true;

    // Waistcoat / Vest peek
    const vestPanel = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.16, 0.22, 0.05)),
      vestMat
    );
    vestPanel.position.set(0, 0.99, -0.142);

    // Belt + Gold Buckle peeking slightly
    const belt = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.206, 0.206, 0.045, 18)),
      beltMat
    );
    belt.scale.set(1.08, 1, 0.78);
    belt.position.y = 0.875;

    const beltBuckle = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.052, 0.042, 0.016)),
      goldMat
    );
    beltBuckle.position.set(0, 0.875, -0.164);

    // Draped golden pocket-watch chain across the waistcoat
    const watchChain = new THREE.Mesh(
      this.track(new THREE.TorusGeometry(0.068, 0.005, 6, 16, Math.PI)),
      goldMat
    );
    watchChain.rotation.z = Math.PI + 0.14;
    watchChain.position.set(0.025, 0.995, -0.168);

    // Crisp White Dress Shirt Collar + V-placket
    const shirtFront = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.135, 0.3, 0.055)),
      shirtMat
    );
    shirtFront.position.set(0, 1.15, -0.145);

    const collarGeo = this.track(new THREE.BoxGeometry(0.068, 0.055, 0.032));
    const lCollar = new THREE.Mesh(collarGeo, shirtMat);
    lCollar.position.set(-0.048, 1.3, -0.135);
    lCollar.rotation.set(0.25, 0.25, -0.35);

    const rCollar = new THREE.Mesh(collarGeo, shirtMat);
    rCollar.position.set(0.048, 1.3, -0.135);
    rCollar.rotation.set(0.25, -0.25, 0.35);

    // Plum-Burgundy Textured Silk Tie (Windsor knot + crisp blade)
    const tieKnot = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.044, 0.046, 0.032)),
      tieMat
    );
    tieKnot.position.set(0, 1.265, -0.17);
    tieKnot.rotation.x = 0.15;

    const tieBlade = new THREE.Mesh(
      this.track(new THREE.ConeGeometry(0.036, 0.27, 4)),
      tieMat
    );
    tieBlade.rotation.z = Math.PI;
    tieBlade.rotation.y = Math.PI / 4;
    tieBlade.scale.set(0.9, 1, 0.32);
    tieBlade.position.set(0, 1.11, -0.172);

    // Tailored Notched Lapels
    const lapelGeo = this.track(new THREE.BoxGeometry(0.068, 0.31, 0.034));
    const lLapel = new THREE.Mesh(lapelGeo, lapelMat);
    lLapel.position.set(-0.088, 1.12, -0.154);
    lLapel.rotation.z = -0.22;

    const rLapel = new THREE.Mesh(lapelGeo, lapelMat);
    rLapel.position.set(0.088, 1.12, -0.154);
    rLapel.rotation.z = 0.22;

    // Gold Mirasium Director Lapel Pin + Gold Buttons
    const lapelPin = new THREE.Mesh(
      this.track(new THREE.OctahedronGeometry(0.018, 0)),
      goldMat
    );
    lapelPin.position.set(0.115, 1.17, -0.172);

    const btnGeo = this.track(new THREE.CylinderGeometry(0.014, 0.014, 0.014, 12));
    const btn1 = new THREE.Mesh(btnGeo, lapelMat);
    btn1.rotation.x = Math.PI / 2;
    btn1.position.set(0, 0.94, -0.165);
    const btn2 = new THREE.Mesh(btnGeo, lapelMat);
    btn2.rotation.x = Math.PI / 2;
    btn2.position.set(0, 0.85, -0.168);

    // Crisp White Folded Pocket Square
    const pocketSquare = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.062, 0.022, 0.018)),
      shirtMat
    );
    pocketSquare.position.set(0.145, 1.075, -0.16);
    pocketSquare.rotation.z = -0.06;

    this.bodyGroup.add(
      jacketSkirt,
      jacketTorso,
      shoulders,
      vestPanel,
      belt,
      beltBuckle,
      watchChain,
      shirtFront,
      lCollar,
      rCollar,
      tieKnot,
      tieBlade,
      lLapel,
      rLapel,
      lapelPin,
      btn1,
      btn2,
      pocketSquare
    );

    // Tailored Sleeves, White Shirt Cuffs, Gold Cufflinks, & Articulated Hands
    const armGeo = this.track(new THREE.CapsuleGeometry(0.06, 0.29, 8, 12));
    const cuffGeo = this.track(new THREE.CylinderGeometry(0.052, 0.052, 0.036, 12));
    const cuffLinkGeo = this.track(new THREE.SphereGeometry(0.01, 8, 6));
    const handGeo = this.track(new THREE.SphereGeometry(0.052, 12, 10));
    const thumbGeo = this.track(new THREE.CapsuleGeometry(0.014, 0.03, 4, 6));

    this.leftArm.position.set(-0.275, 1.22, 0);
    const la = new THREE.Mesh(armGeo, suitMat);
    la.position.y = -0.16;
    la.castShadow = true;
    const lc = new THREE.Mesh(cuffGeo, shirtMat);
    lc.position.y = -0.32;
    const lLink = new THREE.Mesh(cuffLinkGeo, goldMat);
    lLink.position.set(-0.048, -0.32, 0);
    const lh = new THREE.Mesh(handGeo, skinMat);
    lh.scale.set(0.85, 1.12, 0.72);
    lh.position.y = -0.37;
    const lt = new THREE.Mesh(thumbGeo, skinMat);
    lt.position.set(0.022, -0.355, -0.035);
    lt.rotation.z = -0.5;
    this.leftArm.add(la, lc, lLink, lh, lt);
    this.leftArm.rotation.z = 0.08;

    this.rightArm.position.set(0.275, 1.22, 0);
    const ra = new THREE.Mesh(armGeo, suitMat);
    ra.position.y = -0.16;
    ra.castShadow = true;
    const rc = new THREE.Mesh(cuffGeo, shirtMat);
    rc.position.y = -0.32;
    const rLink = new THREE.Mesh(cuffLinkGeo, goldMat);
    rLink.position.set(0.048, -0.32, 0);
    const rh = new THREE.Mesh(handGeo, skinMat);
    rh.scale.set(0.85, 1.12, 0.72);
    rh.position.y = -0.37;
    const rt = new THREE.Mesh(thumbGeo, skinMat);
    rt.position.set(-0.022, -0.355, -0.035);
    rt.rotation.z = 0.5;
    this.rightArm.add(ra, rc, rLink, rh, rt);
    this.rightArm.rotation.x = -0.58;
    this.rightArm.rotation.z = -0.22;

    this.bodyGroup.add(this.leftArm, this.rightArm);

    // Proportioned Neck + Clean Sculpted 3D Head & Friendly Face
    const neck = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.068, 0.078, 0.14, 14)),
      skinMat
    );
    neck.position.y = 1.33;
    this.bodyGroup.add(neck);

    this.headGroup.position.set(0, 1.54, 0);

    const headSphere = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(0.182, 24, 20)),
      skinMat
    );
    headSphere.scale.set(0.9, 1.07, 0.94);
    headSphere.castShadow = true;

    // Ears
    const earGeo = this.track(new THREE.SphereGeometry(0.038, 10, 8));
    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(earGeo, skinMat);
      ear.scale.set(0.45, 1.15, 0.72);
      ear.position.set(side * 0.164, -0.008, 0.005);
      this.headGroup.add(ear);
    });

    // Expressive Stylized Eyes (Sclera + Slate-Blue Iris + Pupil + Catchlight) + Eyebrows
    const scleraGeo = this.track(new THREE.SphereGeometry(0.027, 14, 12));
    const irisGeo = this.track(new THREE.SphereGeometry(0.017, 12, 10));
    const pupilGeo = this.track(new THREE.SphereGeometry(0.011, 10, 8));
    const catchGeo = this.track(new THREE.SphereGeometry(0.0045, 6, 6));
    const browGeo = this.track(new THREE.CapsuleGeometry(0.008, 0.036, 4, 6));

    [-1, 1].forEach((side) => {
      const ex = side * 0.056;
      const ey = 0.022;
      const ez = -0.156;

      const sclera = new THREE.Mesh(scleraGeo, scleraMat);
      sclera.scale.set(1.0, 0.82, 0.45);
      sclera.position.set(ex, ey, ez);

      const iris = new THREE.Mesh(irisGeo, irisMat);
      iris.scale.set(1.0, 1.0, 0.45);
      iris.position.set(ex, ey, ez - 0.008);

      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.scale.set(1.0, 1.0, 0.45);
      pupil.position.set(ex, ey, ez - 0.012);

      const catchlight = new THREE.Mesh(catchGeo, scleraMat);
      catchlight.position.set(ex + 0.007, ey + 0.007, ez - 0.014);

      const brow = new THREE.Mesh(browGeo, hairMat);
      brow.rotation.z = Math.PI / 2 - side * 0.08;
      brow.position.set(ex, ey + 0.038, ez - 0.003);

      const cheek = new THREE.Mesh(
        this.track(new THREE.SphereGeometry(0.024, 10, 8)),
        cheekMat
      );
      cheek.scale.set(1.2, 0.7, 0.45);
      cheek.position.set(side * 0.092, -0.022, -0.136);

      this.headGroup.add(sclera, iris, pupil, catchlight, brow, cheek);
    });

    // Slim antique-gold round curator spectacles
    const specRimGeo = this.track(new THREE.TorusGeometry(0.035, 0.0042, 6, 18));
    [-1, 1].forEach((side) => {
      const rim = new THREE.Mesh(specRimGeo, goldMat);
      rim.position.set(side * 0.056, 0.022, -0.175);
      this.headGroup.add(rim);
    });
    const specBridge = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.0038, 0.0038, 0.042, 6)),
      goldMat
    );
    specBridge.rotation.z = Math.PI / 2;
    specBridge.position.set(0, 0.024, -0.176);
    this.headGroup.add(specBridge);

    // Sculpted Nose
    const noseBridge = new THREE.Mesh(
      this.track(new THREE.CapsuleGeometry(0.015, 0.038, 6, 8)),
      skinMat
    );
    noseBridge.position.set(0, -0.004, -0.172);
    noseBridge.rotation.x = 0.16;

    const noseTip = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(0.02, 10, 8)),
      skinMat
    );
    noseTip.position.set(0, -0.022, -0.181);

    // Friendly Warm Smile
    const smile = new THREE.Mesh(
      this.track(new THREE.TorusGeometry(0.032, 0.0075, 8, 16, Math.PI * 0.85)),
      lipMat
    );
    smile.rotation.z = Math.PI + Math.PI * 0.075;
    smile.position.set(0, -0.055, -0.164);

    // Neatly Groomed Dark Hair (Top swept quiff + tapered sides & back crown)
    const hairBack = new THREE.Mesh(
      this.track(
        new THREE.SphereGeometry(0.187, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.54)
      ),
      hairMat
    );
    hairBack.scale.set(0.91, 1.03, 0.95);
    hairBack.position.set(0, 0.028, 0.022);
    hairBack.rotation.x = 0.44;

    const hairQuiff = new THREE.Mesh(
      this.track(new THREE.CapsuleGeometry(0.056, 0.085, 8, 12)),
      hairMat
    );
    hairQuiff.rotation.z = Math.PI / 2 - 0.12;
    hairQuiff.scale.set(0.9, 1.0, 1.15);
    hairQuiff.position.set(-0.012, 0.166, -0.048);

    const hairCrown = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(0.12, 16, 12)),
      hairMat
    );
    hairCrown.scale.set(1.18, 0.46, 1.08);
    hairCrown.position.set(0, 0.158, 0.0);

    // Well-Trimmed 3D Beard & Mustache framing the friendly smile
    const jawBeard = new THREE.Mesh(
      this.track(
        new THREE.TorusGeometry(0.118, 0.038, 10, 20, Math.PI * 1.1)
      ),
      beardMat
    );
    jawBeard.rotation.x = Math.PI / 2 + 0.35;
    jawBeard.rotation.z = -Math.PI * 0.05;
    jawBeard.position.set(0, -0.088, -0.06);

    const chinBeard = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(0.095, 16, 12)),
      beardMat
    );
    chinBeard.scale.set(0.95, 0.72, 0.72);
    chinBeard.position.set(0, -0.128, -0.108);

    const mustacheLeft = new THREE.Mesh(
      this.track(new THREE.CapsuleGeometry(0.011, 0.026, 4, 6)),
      beardMat
    );
    mustacheLeft.rotation.z = Math.PI / 2 - 0.18;
    mustacheLeft.position.set(-0.022, -0.044, -0.166);

    const mustacheRight = new THREE.Mesh(
      this.track(new THREE.CapsuleGeometry(0.011, 0.026, 4, 6)),
      beardMat
    );
    mustacheRight.rotation.z = Math.PI / 2 + 0.18;
    mustacheRight.position.set(0.022, -0.044, -0.166);

    this.headGroup.add(
      headSphere,
      noseBridge,
      noseTip,
      smile,
      hairBack,
      hairQuiff,
      hairCrown,
      jawBeard,
      chinBeard,
      mustacheLeft,
      mustacheRight
    );
    this.bodyGroup.add(this.headGroup);
    this.add(this.bodyGroup);

    // Floating overhead welcome sprite
    const labelTex = this.track(createDirectorLabelTexture());
    const labelMat = this.track(
      new THREE.SpriteMaterial({
        map: labelTex,
        transparent: true,
        depthWrite: false,
      })
    );
    this.badgeSprite = new THREE.Sprite(labelMat);
    this.badgeSprite.scale.set(2.1, 0.48, 1);
    this.badgeSprite.position.set(0, 2.25, 0);
    this.add(this.badgeSprite);

    // Raycast hitbox for clicking the Director
    this.hitbox = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.46, 0.46, 2.0, 12)),
      this.track(
        new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          depthWrite: false,
        })
      )
    );
    this.hitbox.position.y = 1.0;
    this.hitbox.userData.isDirector = true;
    this.add(this.hitbox);
  }

  setBaseYaw(yaw: number): void {
    this.baseYaw = yaw;
    this.rotation.y = yaw;
  }

  getInteractiveMeshes(): THREE.Object3D[] {
    return [this.hitbox];
  }

  updateWithPlayer(playerPos: THREE.Vector3): void {
    const dt = Math.min(xb.getDeltaTime(), 0.05);
    this.time += dt;

    // Gentle friendly breathing & welcoming right-hand wave
    this.bodyGroup.position.y = Math.sin(this.time * 2.1) * 0.012;
    this.rightArm.rotation.x = -0.62 + Math.sin(this.time * 2.6) * 0.14;
    this.rightArm.rotation.z = -0.22 + Math.cos(this.time * 2.6) * 0.06;
    this.badgeSprite.position.y = 2.24 + Math.sin(this.time * 2.2) * 0.04;

    // Gently turn head toward player when inside lobby nearby
    const dist = this.position.distanceTo(playerPos);
    if (dist < 6.5 && Math.abs(playerPos.y - this.position.y) < 1.8) {
      const dx = playerPos.x - this.position.x;
      const dz = playerPos.z - this.position.z;
      const worldYaw = Math.atan2(-dx, -dz);
      let rel = ((worldYaw - this.baseYaw + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (rel < -Math.PI) rel += Math.PI * 2;
      const clampedHeadYaw = THREE.MathUtils.clamp(rel, -0.65, 0.65);
      this.headGroup.rotation.y = THREE.MathUtils.damp(
        this.headGroup.rotation.y,
        clampedHeadYaw,
        5,
        dt
      );
    } else {
      this.headGroup.rotation.y = THREE.MathUtils.damp(
        this.headGroup.rotation.y,
        0,
        4,
        dt
      );
    }
  }

  dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
