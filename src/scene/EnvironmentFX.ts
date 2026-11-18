import {metin} from "../metinler.ts";
import * as THREE from 'three';
import * as xb from 'xrblocks';

import type {ClockState, TimeOfDayMode, WeatherMode} from '../types.ts';
import {DEVICE_QUALITY} from '../utils/deviceQuality.ts';
import type {OutdoorWorld} from './OutdoorWorld.ts';

const RAIN_COUNT = 680;
const SPLASH_COUNT = 38;
const STAR_COUNT = 340;
const BEAM_ARROW_COUNT = 10;

interface SplashDrop {
  x: number;
  z: number;
  life: number;
  maxLife: number;
}

export class EnvironmentFX extends xb.Script {
  private outdoor: OutdoorWorld;
  private timeMode: TimeOfDayMode = 'auto';
  private weatherMode: WeatherMode = 'clear';
  private autoCyclePhase = 0.16; // 0 = 06:00 sunrise, 0.25 = 12:00 noon, 0.50 = 18:00 sunset, 0.75 = 00:00 midnight

  private nightFactor = 0;
  private duskFactor = 0;
  private lampGlow = 0;
  private rainBlend = 0;
  private playerPosRef?: THREE.Vector3;

  private sunOrb!: THREE.Mesh;
  private moonOrb!: THREE.Mesh;
  private starPoints!: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;

  private rainMesh!: THREE.InstancedMesh;
  private rainPositions = new Float32Array(RAIN_COUNT * 3);
  private rainSpeeds = new Float32Array(RAIN_COUNT);
  private rainDummy = new THREE.Object3D();

  private splashMesh!: THREE.InstancedMesh;
  private splashes: SplashDrop[] = [];
  private splashDummy = new THREE.Object3D();

  // Light Beam Guide ("Işık Huzmesi")
  private guideGroup = new THREE.Group();
  private beamLineMesh!: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshBasicMaterial>;
  private beamArrows: THREE.Mesh<THREE.ConeGeometry, THREE.MeshBasicMaterial>[] = [];
  private beamTargetBeacon!: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshBasicMaterial>;
  private beamTimer = 0;
  private beamFrom = new THREE.Vector3();
  private beamTo = new THREE.Vector3();

  private readonly _c1 = new THREE.Color();
  private readonly _c2 = new THREE.Color();
  private readonly _c3 = new THREE.Color();
  private readonly _v1 = new THREE.Vector3();
  private readonly _v2 = new THREE.Vector3();
  private readonly _v3 = new THREE.Vector3();
  private readonly _v4 = new THREE.Vector3();
  private readonly _upVec = new THREE.Vector3(0, 1, 0);
  private readonly _dayTop = new THREE.Color(0x2563eb);
  private readonly _dayHor = new THREE.Color(0xcce6fa);
  private readonly _sunsetTop = new THREE.Color(0x312e81);
  private readonly _sunsetHor = new THREE.Color(0xf97316);
  private readonly _nightTop = new THREE.Color(0x0b1530);
  private readonly _nightHor = new THREE.Color(0x233554);
  private readonly _rainTop = new THREE.Color(0x334155);
  private readonly _rainHor = new THREE.Color(0x64748b);

  private disposables: Array<{dispose: () => void}> = [];

  constructor(outdoor: OutdoorWorld) {
    super();
    this.outdoor = outdoor;
  }

  private track<T extends {dispose: () => void}>(item: T): T {
    this.disposables.push(item);
    return item;
  }

  init(): void {
    this.createCelestials();
    this.createRainSystem();
    this.createGuideBeam();
  }

  private createCelestials(): void {
    this.sunOrb = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(3.2, 20, 16)),
      this.track(new THREE.MeshBasicMaterial({color: 0xfef08a}))
    );
    this.add(this.sunOrb);

    this.moonOrb = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(2.3, 18, 14)),
      this.track(new THREE.MeshBasicMaterial({color: 0xe2e8f0}))
    );
    this.add(this.moonOrb);

    // Night Starfield dome
    const positions = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.44;
      const r = 84;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) + 4;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = this.track(new THREE.BufferGeometry());
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = this.track(
      new THREE.PointsMaterial({
        color: 0xfef9c3,
        size: 0.65,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
    );
    this.starPoints = new THREE.Points(starGeo, starMat);
    this.add(this.starPoints);
  }

  private createRainSystem(): void {
    const dropGeo = this.track(new THREE.CylinderGeometry(0.012, 0.012, 0.68, 5));
    const dropMat = this.track(
      new THREE.MeshBasicMaterial({
        color: 0xbae6fd,
        transparent: true,
        opacity: 0.56,
        depthWrite: false,
      })
    );
    this.rainMesh = new THREE.InstancedMesh(dropGeo, dropMat, RAIN_COUNT);
    this.rainMesh.frustumCulled = false;

    for (let i = 0; i < RAIN_COUNT; i++) {
      this.resetRainDrop(i, true);
    }
    this.rainMesh.visible = false;
    this.add(this.rainMesh);

    const splashGeo = this.track(new THREE.RingGeometry(0.05, 0.14, 14));
    splashGeo.rotateX(-Math.PI / 2);
    const splashMat = this.track(
      new THREE.MeshBasicMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    this.splashMesh = new THREE.InstancedMesh(splashGeo, splashMat, SPLASH_COUNT);
    this.splashMesh.frustumCulled = false;
    for (let i = 0; i < SPLASH_COUNT; i++) {
      this.splashes.push({
        x: (Math.random() - 0.5) * 32,
        z: 3 + Math.random() * 20,
        life: Math.random(),
        maxLife: 0.35 + Math.random() * 0.25,
      });
    }
    this.splashMesh.visible = false;
    this.add(this.splashMesh);
  }

  private resetRainDrop(idx: number, randomY: boolean): void {
    // Spread across outdoor gardens, plaza, and sides of building
    let x = (Math.random() - 0.5) * 48;
    let z = -22 + Math.random() * 48;
    // Keep rain outside the museum roof footprint so indoor galleries stay dry
    if (Math.abs(x) < 13.8 && z < 1.2 && z > -24.2) {
      x = x < 0 ? -14.2 - Math.random() * 9 : 14.2 + Math.random() * 9;
    }
    this.rainPositions[idx * 3] = x;
    this.rainPositions[idx * 3 + 1] = randomY ? Math.random() * 20 : 18 + Math.random() * 5;
    this.rainPositions[idx * 3 + 2] = z;
    this.rainSpeeds[idx] = 17 + Math.random() * 6;
  }

  private createGuideBeam(): void {
    const lineGeo = this.track(new THREE.CylinderGeometry(0.065, 0.065, 1, 10));
    const lineMat = this.track(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.68,
      })
    );
    this.beamLineMesh = new THREE.Mesh(lineGeo, lineMat);

    const arrowGeo = this.track(new THREE.ConeGeometry(0.16, 0.34, 8));
    arrowGeo.rotateX(Math.PI / 2);
    for (let i = 0; i < BEAM_ARROW_COUNT; i++) {
      const aMat = this.track(
        new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0xfde047 : 0x38bdf8,
          transparent: true,
          opacity: 0.9,
        })
      );
      const arrow = new THREE.Mesh(arrowGeo, aMat);
      this.beamArrows.push(arrow);
      this.guideGroup.add(arrow);
    }

    const beaconGeo = this.track(new THREE.CylinderGeometry(0.42, 0.72, 4.2, 18, 1, true));
    const beaconMat = this.track(
      new THREE.MeshBasicMaterial({
        color: 0xfde047,
        transparent: true,
        opacity: 0.34,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    this.beamTargetBeacon = new THREE.Mesh(beaconGeo, beaconMat);

    this.guideGroup.add(this.beamLineMesh, this.beamTargetBeacon);
    this.guideGroup.visible = false;
    this.add(this.guideGroup);
  }

  setTimeMode(mode: TimeOfDayMode): void {
    this.timeMode = mode;
    if (mode === 'day') this.autoCyclePhase = 0.25;
    else if (mode === 'sunset') this.autoCyclePhase = 0.52;
    else if (mode === 'night') this.autoCyclePhase = 0.82;
  }

  getTimeMode(): TimeOfDayMode {
    return this.timeMode;
  }

  getClockState(): ClockState {
    const totalHours = (this.autoCyclePhase * 24 + 6) % 24;
    const hour = Math.floor(totalHours);
    const minute = Math.floor((totalHours - hour) * 60);
    const formatted = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const isNight = this.isNightTime();
    let periodLabel = metin("EnvironmentFX", "gunduz");
    let icon = '☀️';
    if (hour >= 5 && hour < 7) {
      periodLabel = metin("EnvironmentFX", "safak");
      icon = '🌄';
    } else if (hour >= 7 && hour < 12) {
      periodLabel = metin("EnvironmentFX", "sabah");
      icon = '☀️';
    } else if (hour >= 12 && hour < 17) {
      periodLabel = metin("EnvironmentFX", "oglen");
      icon = '☀️';
    } else if (hour >= 17 && hour < 20) {
      periodLabel = metin("EnvironmentFX", "aksam");
      icon = '🌅';
    } else {
      periodLabel = metin("EnvironmentFX", "gece");
      icon = '🌙';
    }
    return {
      hour,
      minute,
      formatted,
      periodLabel,
      icon,
      mode: this.timeMode,
      isNight,
    };
  }

  setWeatherMode(mode: WeatherMode): void {
    this.weatherMode = mode;
  }

  getWeatherMode(): WeatherMode {
    return this.weatherMode;
  }

  isNightTime(): boolean {
    return this.nightFactor > 0.45;
  }

  isRaining(): boolean {
    return this.weatherMode === 'rain';
  }

  showGuideBeam(fromPos: THREE.Vector3, toPos: THREE.Vector3): void {
    this.beamFrom.copy(fromPos);
    this.beamTo.copy(toPos);
    this.beamTimer = 7.0;
    this.guideGroup.visible = true;
  }

  updateGuidePositions(fromPos: THREE.Vector3, toPos: THREE.Vector3): void {
    if (this.beamTimer <= 0) return;
    this.beamFrom.copy(fromPos);
    this.beamTo.copy(toPos);
  }

  setPlayerPosition(pos: THREE.Vector3): void {
    this.playerPosRef = pos;
  }

  update(): void {
    const dt = Math.min(xb.getDeltaTime(), 0.05);

    if (this.timeMode === 'auto') {
      // Flowing 24-hour cycle: 1 game day every 300 seconds (5 minutes)
      this.autoCyclePhase = (this.autoCyclePhase + dt / 300) % 1;
    }

    const angle = (this.autoCyclePhase - 0.0) * Math.PI * 2;
    const sunElev = Math.sin(angle); // +1 noon, 0 horizon, -1 midnight
    const targetNight = THREE.MathUtils.clamp((-sunElev + 0.12) / 0.45, 0, 1);
    const targetDusk = THREE.MathUtils.clamp(1 - Math.abs(sunElev) * 3.2, 0, 1);
    const targetLampGlow = THREE.MathUtils.clamp((-sunElev + 0.28) / 0.42, 0, 1);
    const targetRain = this.weatherMode === 'rain' ? 1 : 0;

    this.nightFactor = THREE.MathUtils.damp(this.nightFactor, targetNight, 4, dt);
    this.duskFactor = THREE.MathUtils.damp(this.duskFactor, targetDusk, 4, dt);
    this.lampGlow = THREE.MathUtils.damp(this.lampGlow, targetLampGlow, 4, dt);
    this.rainBlend = THREE.MathUtils.damp(this.rainBlend, targetRain, 4, dt);

    // Position Sun & Moon across the sky arc
    const skyR = 72;
    this.sunOrb.position.set(
      Math.cos(angle) * skyR,
      Math.sin(angle) * skyR,
      -26
    );
    this.sunOrb.visible = this.sunOrb.position.y > -4;

    this.moonOrb.position.set(
      -Math.cos(angle) * skyR,
      -Math.sin(angle) * skyR,
      -26
    );
    this.moonOrb.visible = this.moonOrb.position.y > -4;

    // Interpolate Sky Dome, Fog, Sun & Hemisphere lighting
    this._c1.copy(this._dayTop).lerp(this._sunsetTop, this.duskFactor * 0.85);
    this._c1.lerp(this._nightTop, this.nightFactor);
    this._c1.lerp(this._rainTop, this.rainBlend * (1 - this.nightFactor * 0.6) * 0.72);

    this._c2.copy(this._dayHor).lerp(this._sunsetHor, this.duskFactor * 0.9);
    this._c2.lerp(this._nightHor, this.nightFactor);
    this._c2.lerp(this._rainHor, this.rainBlend * (1 - this.nightFactor * 0.5) * 0.72);

    this.outdoor.skyMat.uniforms.topColor.value.copy(this._c1);
    this.outdoor.skyMat.uniforms.horizonColor.value.copy(this._c2);

    const scene = xb.core.scene;
    if (scene) {
      if (scene.background instanceof THREE.Color) {
        scene.background.copy(this._c2);
      }
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.copy(this._c2);
        scene.fog.density = THREE.MathUtils.lerp(
          0.0095,
          0.0135,
          Math.max(this.nightFactor * 0.55, this.rainBlend)
        );
      }
      scene.environmentIntensity = THREE.MathUtils.lerp(
        0.36,
        0.24,
        Math.max(this.nightFactor, this.rainBlend * 0.45)
      );
    }

    // Main sun directional light moves smoothly above horizon, switches to soft moon above horizon at night
    if (this.nightFactor < 0.65) {
      this.outdoor.sunLight.position.set(
        Math.max(-35, Math.min(35, Math.cos(angle) * 28)),
        Math.max(10, Math.sin(angle) * 30),
        22
      );
      this.outdoor.sunLight.color
        .setHex(0xfff1d6)
        .lerp(this._c3.setHex(0xfb923c), this.duskFactor * 0.8);
    } else {
      this.outdoor.sunLight.position.set(-18, 26, 18);
      this.outdoor.sunLight.color.setHex(0xbfdbfe);
    }
    const dayIntensity = THREE.MathUtils.lerp(1.32, 0.58, this.nightFactor);
    this.outdoor.sunLight.intensity = dayIntensity * (1 - this.rainBlend * 0.42);

    const baseHemi = THREE.MathUtils.lerp(0.78, 0.48, this.nightFactor);
    const mobileHemiBoost = DEVICE_QUALITY.simplifiedLighting
      ? THREE.MathUtils.lerp(0.32, 0.22, this.nightFactor)
      : 0;
    this.outdoor.hemiLight.intensity =
      (baseHemi + mobileHemiBoost) * (1 - this.rainBlend * 0.25);
    this.outdoor.hemiLight.color
      .setHex(0xe0f2fe)
      .lerp(this._c3.setHex(0x475569), this.nightFactor);

    this.outdoor.grassMat.color
      .setHex(0xffffff)
      .lerp(this._c3.setHex(0xffdcb8), this.duskFactor * 0.32)
      .lerp(this._c3.setHex(0x88a4b8), this.nightFactor * 0.52);

    this.starPoints.material.opacity =
      Math.max(0, (this.nightFactor - 0.35) / 0.65) * (1 - this.rainBlend * 0.7);
    this.starPoints.rotation.y += dt * 0.008;

    this.outdoor.setNightLampGlow(this.lampGlow, this.playerPosRef);

    // Update Outdoor Rain & Splashes
    const rainActive = this.rainBlend > 0.05;
    this.rainMesh.visible = rainActive;
    this.splashMesh.visible = rainActive;

    if (rainActive) {
      const mat = this.rainMesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.52 * this.rainBlend;

      for (let i = 0; i < RAIN_COUNT; i++) {
        const base = i * 3;
        this.rainPositions[base + 1] -= this.rainSpeeds[i] * dt;
        this.rainPositions[base] += 1.4 * dt; // subtle wind slant
        if (this.rainPositions[base + 1] < 0.1) {
          this.resetRainDrop(i, false);
        }
        this.rainDummy.position.set(
          this.rainPositions[base],
          this.rainPositions[base + 1],
          this.rainPositions[base + 2]
        );
        this.rainDummy.rotation.z = -0.07;
        this.rainDummy.scale.setScalar(1);
        this.rainDummy.updateMatrix();
        this.rainMesh.setMatrixAt(i, this.rainDummy.matrix);
      }
      this.rainMesh.instanceMatrix.needsUpdate = true;

      for (let i = 0; i < SPLASH_COUNT; i++) {
        const s = this.splashes[i];
        s.life += dt;
        if (s.life >= s.maxLife) {
          s.life = 0;
          let sx = (Math.random() - 0.5) * 34;
          const sz = -10 + Math.random() * 34;
          if (Math.abs(sx) < 13.8 && sz < 1.2) {
            sx = sx < 0 ? -14.5 - Math.random() * 6 : 14.5 + Math.random() * 6;
          }
          s.x = sx;
          s.z = sz;
        }
        const p = s.life / s.maxLife;
        this.splashDummy.position.set(s.x, 0.045, s.z);
        this.splashDummy.scale.setScalar(0.3 + p * 1.4);
        this.splashDummy.updateMatrix();
        this.splashMesh.setMatrixAt(i, this.splashDummy.matrix);
      }
      this.splashMesh.instanceMatrix.needsUpdate = true;
    }

    // Animate Light Beam Guide ("Işık Huzmesi")
    if (this.beamTimer > 0) {
      this.beamTimer -= dt;
      if (this.beamTimer <= 0) {
        this.guideGroup.visible = false;
      } else {
        this.guideGroup.visible = true;
        const alpha = Math.min(1, this.beamTimer / 1.2);
        const start = this._v1.copy(this.beamFrom);
        start.y += 0.85;
        const end = this._v2.copy(this.beamTo);
        end.y += 1.05;
        const diff = this._v3.subVectors(end, start);
        const len = Math.max(0.4, diff.length());
        const mid = this._v4.lerpVectors(start, end, 0.5);

        this.beamLineMesh.position.copy(mid);
        this.beamLineMesh.scale.set(1, len, 1);
        this.beamLineMesh.quaternion.setFromUnitVectors(
          this._upVec,
          diff.normalize()
        );
        this.beamLineMesh.material.opacity = 0.48 * alpha;

        const nowSec = performance.now() * 0.001;
        for (let i = 0; i < this.beamArrows.length; i++) {
          const t = ((i / this.beamArrows.length) + nowSec * 0.55) % 1;
          const pos = this._v4.lerpVectors(start, end, t);
          pos.y += Math.sin(nowSec * 5 + i) * 0.08;
          this.beamArrows[i].position.copy(pos);
          this.beamArrows[i].lookAt(end);
          this.beamArrows[i].material.opacity = 0.92 * alpha;
        }

        this.beamTargetBeacon.position.set(this.beamTo.x, this.beamTo.y + 2.1, this.beamTo.z);
        this.beamTargetBeacon.rotation.y += dt * 1.8;
        this.beamTargetBeacon.material.opacity =
          (0.28 + Math.sin(nowSec * 6) * 0.1) * alpha;
      }
    }
  }

  dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
