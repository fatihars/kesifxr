import {metin} from "../metinler.ts";
import * as THREE from 'three';
import * as xb from 'xrblocks';
import {
  getCobblePlazaTextures,
  getTravertineTextures,
  getWalnutWoodTextures,
} from '../utils/anatolianMaterials.ts';

const FIELD_ORIGIN = new THREE.Vector3(14.2, 0, 29.9);
export const CELIK_START = FIELD_ORIGIN.clone().add(new THREE.Vector3(0, 0, -1.4));
const TOP = 0.095;
const ROUNDS = 3;
const GRAVITY = 9.8;

type Phase = 'ready' | 'lift' | 'flight' | 'result' | 'finished';

export class CelikComakField extends xb.Script {
  readonly targets: THREE.Object3D[] = [];
  private readonly resources: Array<{dispose(): void}> = [];
  private piece!: THREE.Mesh;
  private marker!: THREE.Mesh;
  private bat!: THREE.Mesh;
  private phase: Phase = 'ready';
  private round = 1;
  private time = 0;
  private score = 0;
  private distance = 0;
  private velocity = 0;
  private launchHeight = 0;
  private flightLength = 0;

  active = false;
  onWin?: (score: number) => void;

  private keep<T extends {dispose(): void}>(value: T): T {
    this.resources.push(value);
    return value;
  }

  init(): void {
    this.position.copy(FIELD_ORIGIN);
    this.rotation.y = -Math.PI / 2;
    const clayTex = getTravertineTextures(5, 1);
    const curbTex = getCobblePlazaTextures(6, 1);
    const walnutTex = getWalnutWoodTextures(1, 1);

    const pitch = this.keep(
      new THREE.MeshStandardMaterial({
        color: 0xd1b184,
        map: clayTex.map,
        bumpMap: clayTex.bumpMap,
        bumpScale: 0.025,
        roughness: 0.94,
      })
    );
    const curbMat = this.keep(
      new THREE.MeshStandardMaterial({
        color: 0xd6ccb6,
        map: curbTex.map,
        bumpMap: curbTex.bumpMap,
        bumpScale: 0.02,
        roughness: 0.84,
      })
    );
    const line = this.keep(new THREE.MeshBasicMaterial({color: 0xfff3d1}));
    const wood = this.keep(
      new THREE.MeshStandardMaterial({
        color: 0x78472a,
        map: walnutTex.map,
        bumpMap: walnutTex.bumpMap,
        bumpScale: 0.015,
        roughness: 0.65,
      })
    );
    const amber = this.keep(
      new THREE.MeshStandardMaterial({
        color: 0xf0b254,
        map: walnutTex.map,
        roughness: 0.55,
      })
    );
    const brass = this.keep(
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.78,
        roughness: 0.28,
      })
    );

    const box = (mat: THREE.Material, w: number, h: number, d: number, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(this.keep(new THREE.BoxGeometry(w, h, d)), mat);
      mesh.position.set(x, y, z);
      this.add(mesh);
      return mesh;
    };
    const field = box(pitch, 9.2, 0.048, 2.6, 3.9, 0.048, 0);
    field.receiveShadow = true;
    field.userData.activityType = 'celikcomak';
    this.targets.push(field);

    // Cut-stone curb borders framing the pitch
    for (const side of [-1, 1]) {
      box(curbMat, 9.4, 0.11, 0.16, 3.9, 0.055, side * 1.32);
      box(line, 8.7, 0.012, 0.045, 3.8, TOP - 0.004, side * 1.12);
    }

    // Distance stripes & carved travertine distance bollards along north curb
    const bollardGeo = this.keep(new THREE.CylinderGeometry(0.065, 0.085, 0.34, 8));
    const capGeo = this.keep(new THREE.SphereGeometry(0.055, 8, 8));
    for (const distance of [0, 2, 4, 6, 8]) {
      box(line, 0.035, 0.012, 2.24, distance, TOP - 0.004, 0);
      const pillar = new THREE.Mesh(bollardGeo, curbMat);
      pillar.position.set(distance, 0.22, -1.32);
      const cap = new THREE.Mesh(capGeo, brass);
      cap.position.set(distance, 0.4, -1.32);
      this.add(pillar, cap);
    }

    this.marker = box(brass, 0.095, 0.024, 0.96, 0, TOP + 0.016, 0);
    this.marker.visible = false;

    // Tapered double-pointed traditional Anatolian Çelik spindle via LatheGeometry
    const pieceProfile = [
      new THREE.Vector2(0.001, -0.18),
      new THREE.Vector2(0.022, -0.14),
      new THREE.Vector2(0.042, -0.07),
      new THREE.Vector2(0.044, 0),
      new THREE.Vector2(0.042, 0.07),
      new THREE.Vector2(0.022, 0.14),
      new THREE.Vector2(0.001, 0.18),
    ];
    this.piece = new THREE.Mesh(
      this.keep(new THREE.LatheGeometry(pieceProfile, 12)),
      amber
    );
    this.piece.castShadow = true;

    // Turned walnut Çomak bat with flared head and grip knob
    const batProfile = [
      new THREE.Vector2(0.001, -0.47),
      new THREE.Vector2(0.038, -0.45),
      new THREE.Vector2(0.028, -0.41),
      new THREE.Vector2(0.03, -0.12),
      new THREE.Vector2(0.044, 0.28),
      new THREE.Vector2(0.046, 0.44),
      new THREE.Vector2(0.001, 0.47),
    ];
    this.bat = new THREE.Mesh(
      this.keep(new THREE.LatheGeometry(batProfile, 12)),
      wood
    );
    this.bat.castShadow = true;

    this.add(this.piece, this.bat);
    this.resetPiece();
  }

  start(): void {
    this.active = true;
    this.round = 1;
    this.score = 0;
    this.distance = 0;
    this.nextRound();
  }

  stop(): void {
    this.active = false;
    this.phase = 'ready';
    this.marker.visible = false;
    this.resetPiece();
  }

  private resetPiece(): void {
    this.piece.position.set(0, TOP + 0.055, 0);
    this.piece.rotation.set(0, 0, Math.PI / 2);
    this.bat.position.set(-0.62, TOP + 0.07, -0.36);
    this.bat.rotation.set(0, 0, 1.33);
  }

  private nextRound(): void {
    this.phase = 'ready';
    this.time = 0;
    this.marker.visible = false;
    this.resetPiece();
  }

  get prompt(): {key: string; title: string; action: string} {
    const stage = metin("CelikComakField", "celik_comak_tur_1_2", this.round, ROUNDS);
    if (this.phase === 'ready') return {key: 'ready', title: stage, action: metin("CelikComakField", "celigi_havalandir")};
    if (this.phase === 'lift') {
      const timed = Math.abs(this.time - 0.53) <= 0.14;
      return {key: timed ? 'strike' : 'lift', title: timed ? metin("CelikComakField", "simdi_vur") : metin("CelikComakField", "celik_yukseliyor"), action: metin("CelikComakField", "vur")};
    }
    if (this.phase === 'flight') return {key: 'flight', title: metin("CelikComakField", "celik_havada"), action: metin("CelikComakField", "iptal")};
    const result = `${this.distance.toFixed(1)} m · Toplam ${this.score.toFixed(1)} m`;
    if (this.phase === 'result') return {key: 'result', title: result, action: metin("CelikComakField", "sonraki_tur")};
    const winText = this.score >= 16.5 ? metin("CelikComakField", "kupa_kazandin") : metin("CelikComakField", "kupa_hedefi_16_5_m");
    return {key: 'finished', title: `${result} · ${winText}`, action: metin("CelikComakField", "yeniden_oyna")};
  }

  action(): void {
    if (this.phase === 'ready') {
      this.phase = 'lift';
      this.time = 0;
    } else if (this.phase === 'lift') {
      const quality = Math.max(0, 1 - Math.abs(this.time - 0.53) / 0.48);
      this.velocity = 1.7 + quality * 5.35;
      this.launchHeight = this.piece.position.y;
      this.flightLength = (3.7 + Math.sqrt(3.7 ** 2 + 2 * GRAVITY * (this.launchHeight - TOP))) / GRAVITY;
      this.phase = 'flight';
      this.time = 0;
    } else if (this.phase === 'result') {
      this.round++;
      this.nextRound();
    } else if (this.phase === 'finished') {
      this.start();
    } else {
      this.stop();
    }
  }

  updateFlight(dt: number): void {
    if (!this.active) return;
    this.time += dt;
    if (this.phase === 'lift') {
      const t = Math.min(1.06, this.time);
      this.piece.position.y = TOP + 0.055 + 1.19 * Math.sin(t / 1.06 * Math.PI);
      this.piece.rotation.z = Math.PI / 2 + t * 5;
      this.bat.rotation.z = 1.3 - Math.min(t, 0.55) * 1.5;
      if (this.time >= 1.06) this.finish(0);
    } else if (this.phase === 'flight') {
      const t = Math.min(this.time, this.flightLength);
      this.piece.position.x = this.velocity * t;
      this.piece.position.y = this.launchHeight + 3.7 * t - GRAVITY / 2 * t * t;
      this.piece.rotation.z = 1 + t * 12;
      this.bat.rotation.z = 0.45 + Math.min(t * 5, 1.6);
      if (this.time >= this.flightLength) this.finish(this.velocity * this.flightLength);
    }
  }

  private finish(distance: number): void {
    this.distance = distance;
    this.score += distance;
    this.piece.position.set(distance, TOP + 0.047, 0);
    this.piece.rotation.set(0, 0, Math.PI / 2);
    this.marker.position.x = distance;
    this.marker.visible = true;
    this.phase = this.round === ROUNDS ? 'finished' : 'result';
    if (this.phase === 'finished' && this.score >= 16.5) this.onWin?.(this.score);
  }

  dispose(): void {
    this.resources.forEach((value) => value.dispose());
  }
}
