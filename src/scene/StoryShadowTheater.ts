import {metin} from "../metinler.ts";
import * as THREE from 'three';

export type SilhouetteId =
  | 'keloglan'
  | 'anasi'
  | 'karinca'
  | 'kaplumbaga'
  | 'leylek'
  | 'muhtar'
  | 'koyluler'
  | 'cesme'
  | 'koyEvleri'
  | 'dag'
  | 'kaya'
  | 'agac'
  | 'dereYatagi';

export type SilhouetteMotion = 'still' | 'walk' | 'sway' | 'flap' | 'creep';

export interface ScenePropPlacement {
  id: SilhouetteId;
  x: number; // 0..1 normalized across curtain width
  y: number; // 0..1 normalized from top (ground around 0.82)
  scale: number;
  motion: SilhouetteMotion;
  flip?: boolean;
  speed?: number;
}

export interface TaleScene {
  startTime: number; // Start timestamp (seconds) in masal1_706f5c13.wav
  subtitle: string;
  narration: string;
  placements: ScenePropPlacement[];
}

export interface AnatolianTale {
  id: string;
  title: string;
  badge: string;
  moral: string;
  scenes: TaleScene[];
}

/**
 * Pure inline SVG silhouette bodies (viewBox 0 0 120 120) — zero external images.
 * Uses deep charcoal-obsidian ink (#141118) with delicate shadow-puppet cut-out highlights (#fdf3d7).
 */
export const SILHOUETTE_PATHS: Record<SilhouetteId, string> = {
  dag: `
    <path d="M2 108 L28 46 L48 72 L76 22 L104 68 L118 52 L118 108 Z" fill="#18121c"/>
    <path d="M58 58 L76 28 L91 52 L82 48 L74 56 L68 49 Z" fill="#f7e3b2" opacity="0.22"/>
  `,
  kaya: `
    <path d="M12 108 L18 76 L38 62 L58 68 L74 54 L96 66 L108 92 L112 108 Z" fill="#18121c"/>
    <path d="M40 72 L56 76 L64 96" stroke="#f7e3b2" stroke-width="2" fill="none" opacity="0.28"/>
  `,
  agac: `
    <path d="M55 108 L56 64 L44 50 L49 48 L57 58 L57 42 L63 42 L63 57 L73 47 L76 51 L65 64 L66 108 Z" fill="#16111a"/>
    <path d="M36 58 C20 56 18 32 36 28 C40 12 64 10 74 22 C94 18 104 38 92 52 C94 64 78 68 64 62 C52 68 38 65 36 58 Z" fill="#16111a"/>
    <circle cx="48" cy="36" r="3" fill="#f7e3b2" opacity="0.28"/>
    <circle cx="72" cy="40" r="3.5" fill="#f7e3b2" opacity="0.28"/>
  `,
  koyEvleri: `
    <path d="M6 108 L6 66 L26 46 L46 66 L46 108 Z" fill="#17121b"/>
    <path d="M44 108 L44 58 L70 34 L96 58 L96 108 Z" fill="#17121b"/>
    <path d="M92 108 L92 72 L106 58 L118 72 L118 108 Z" fill="#17121b"/>
    <rect x="20" y="72" width="10" height="12" rx="1" fill="#fbbf24" opacity="0.72"/>
    <rect x="64" y="66" width="12" height="13" rx="1" fill="#fbbf24" opacity="0.78"/>
    <rect x="65" y="88" width="10" height="20" rx="4" fill="#0f0b12"/>
    <rect x="81" y="28" width="6" height="14" fill="#17121b"/>
  `,
  dereYatagi: `
    <path d="M4 96 Q34 84 62 94 T116 90 L118 112 Q84 118 58 108 T2 114 Z" fill="#1a141d" opacity="0.88"/>
    <path d="M14 101 Q38 92 60 100 T108 98" stroke="#f7e3b2" stroke-width="2.4" stroke-dasharray="8 6" fill="none" opacity="0.52"/>
    <ellipse cx="30" cy="105" rx="6" ry="3" fill="#f7e3b2" opacity="0.25"/>
    <ellipse cx="78" cy="104" rx="8" ry="3.5" fill="#f7e3b2" opacity="0.25"/>
  `,
  cesme: `
    <path d="M22 108 L22 44 L44 26 L76 26 L98 44 L98 108 Z" fill="#16111a"/>
    <path d="M40 104 L40 58 C40 44 80 44 80 58 L80 104 Z" fill="#f7e3b2" opacity="0.24"/>
    <rect x="34" y="88" width="52" height="16" rx="3" fill="#16111a"/>
    <path d="M58 64 L66 64 L66 72" stroke="#16111a" stroke-width="4" fill="none"/>
    <path d="M64 73 Q65 82 63 89" stroke="#fde68a" stroke-width="2.6" stroke-dasharray="4 3" fill="none" opacity="0.82"/>
  `,
  keloglan: `
    <circle cx="60" cy="30" r="14" fill="#16111a"/>
    <path d="M52 24 Q60 18 68 24" stroke="#f7e3b2" stroke-width="1.8" fill="none" opacity="0.35"/>
    <circle cx="54" cy="30" r="2" fill="#f7e3b2" opacity="0.7"/>
    <path d="M46 46 L74 46 L78 78 L42 78 Z" fill="#16111a"/>
    <path d="M44 48 L26 66 L31 71 L46 57 Z" fill="#16111a"/>
    <path d="M76 48 L92 64 L87 70 L74 57 Z" fill="#16111a"/>
    <path d="M44 78 L40 106 L52 106 L58 84 L64 84 L70 106 L82 106 L76 78 Z" fill="#16111a"/>
    <rect x="44" y="69" width="32" height="5" fill="#f7e3b2" opacity="0.3"/>
  `,
  anasi: `
    <circle cx="60" cy="30" r="13" fill="#16111a"/>
    <path d="M44 28 C44 14 76 14 76 28 L82 54 L38 54 Z" fill="#16111a"/>
    <path d="M40 50 L80 50 L92 106 L28 106 Z" fill="#16111a"/>
    <path d="M48 56 L72 56 L76 92 L44 92 Z" fill="#f7e3b2" opacity="0.22"/>
    <path d="M40 54 L26 70 L32 75 L44 63 Z" fill="#16111a"/>
    <path d="M80 54 L92 70 L86 75 L76 63 Z" fill="#16111a"/>
  `,
  karinca: `
    <ellipse cx="36" cy="82" rx="14" ry="10" fill="#16111a"/>
    <ellipse cx="58" cy="78" rx="9" ry="7" fill="#16111a"/>
    <circle cx="76" cy="73" r="8" fill="#16111a"/>
    <path d="M79 66 Q88 54 96 58 M76 65 Q82 52 88 52" stroke="#16111a" stroke-width="2.6" fill="none"/>
    <path d="M48 82 L40 102 M58 84 L58 104 M68 82 L76 102" stroke="#16111a" stroke-width="3.2" stroke-linecap="round"/>
    <circle cx="79" cy="71" r="1.8" fill="#f7e3b2" opacity="0.7"/>
  `,
  kaplumbaga: `
    <path d="M22 88 C22 52 88 52 88 88 Z" fill="#16111a"/>
    <path d="M38 66 L54 62 L66 72 L52 80 L38 76 Z" fill="#f7e3b2" opacity="0.26"/>
    <path d="M86 82 C98 78 106 82 104 90 C100 94 88 92 84 88 Z" fill="#16111a"/>
    <circle cx="97" cy="83" r="1.8" fill="#f7e3b2" opacity="0.7"/>
    <path d="M30 88 L26 106 L38 106 L40 90 M70 90 L72 106 L84 106 L80 88" fill="#16111a"/>
    <path d="M22 86 L12 88 L22 92 Z" fill="#16111a"/>
  `,
  leylek: `
    <ellipse cx="58" cy="60" rx="18" ry="11" fill="#16111a"/>
    <path d="M70 54 C76 42 74 28 82 24 C86 22 90 25 89 30 C84 36 82 48 76 58 Z" fill="#16111a"/>
    <path d="M89 26 L112 24 L89 30 Z" fill="#16111a"/>
    <path d="M52 70 L46 106 M62 70 L68 106" stroke="#16111a" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M40 58 C24 38 18 22 36 18 C50 18 58 38 60 54 Z" fill="#16111a"/>
    <circle cx="85" cy="26" r="1.6" fill="#f7e3b2" opacity="0.75"/>
  `,
  muhtar: `
    <circle cx="60" cy="28" r="12.5" fill="#16111a"/>
    <path d="M46 21 L74 21 L76 15 L44 15 Z" fill="#16111a"/>
    <path d="M54 34 Q60 39 66 34" stroke="#f7e3b2" stroke-width="2" fill="none" opacity="0.4"/>
    <path d="M42 44 L78 44 L82 84 L38 84 Z" fill="#16111a"/>
    <path d="M42 84 L38 108 L52 108 L58 88 L62 88 L68 108 L82 108 L78 84 Z" fill="#16111a"/>
    <path d="M82 56 L94 64 L96 108" stroke="#16111a" stroke-width="3.8" stroke-linecap="round" fill="none"/>
  `,
  koyluler: `
    <circle cx="30" cy="36" r="10" fill="#16111a"/>
    <path d="M18 50 L42 50 L45 106 L15 106 Z" fill="#16111a"/>
    <circle cx="62" cy="32" r="11" fill="#16111a"/>
    <path d="M48 46 L76 46 L80 106 L44 106 Z" fill="#16111a"/>
    <circle cx="94" cy="38" r="9.5" fill="#16111a"/>
    <path d="M82 52 L106 52 L108 106 L80 106 Z" fill="#16111a"/>
  `,
};

export const ANATOLIAN_TALES: AnatolianTale[] = [
  {
    id: 'keloglan-pinarli',
    title: metin("StoryShadowTheater", "keloglan_ve_pinarli_cesmesi_nin_sirri"),
    badge: metin("StoryShadowTheater", "masal_1"),
    moral: metin("StoryShadowTheater", "kucuk_iyilik_buyuk_yol_acar_birlik_olunca"),
    scenes: [
      {
        startTime: 0,
        subtitle: metin("StoryShadowTheater", "1_sahne_pinarli_koyu_ve_susmus_tas"),
        narration:
          metin("StoryShadowTheater", "daglarin_etegindeki_pinarli_koyu_nde_keloglan_ile"),
        placements: [
          {id: 'dag', x: 0.24, y: 0.78, scale: 1.55, motion: 'still'},
          {id: 'dag', x: 0.76, y: 0.78, scale: 1.4, motion: 'still', flip: true},
          {id: 'koyEvleri', x: 0.16, y: 0.84, scale: 1.0, motion: 'still'},
          {id: 'cesme', x: 0.5, y: 0.84, scale: 1.05, motion: 'still'},
          {id: 'anasi', x: 0.34, y: 0.85, scale: 0.84, motion: 'sway'},
          {id: 'keloglan', x: 0.63, y: 0.85, scale: 0.82, motion: 'walk', speed: 1.05},
          {id: 'muhtar', x: 0.76, y: 0.85, scale: 0.84, motion: 'sway', flip: true},
          {id: 'koyluler', x: 0.88, y: 0.85, scale: 0.78, motion: 'sway', flip: true},
        ],
      },
      {
        startTime: 110,
        subtitle: metin("StoryShadowTheater", "2_sahne_kurumus_dere_ve_cinar_yapragi"),
        narration:
          metin("StoryShadowTheater", "kurumus_dere_yatagindaki_kocaman_catlagin_kiyisinda_bugday"),
        placements: [
          {id: 'dag', x: 0.52, y: 0.78, scale: 1.55, motion: 'still'},
          {id: 'agac', x: 0.18, y: 0.84, scale: 1.05, motion: 'sway', speed: 0.9},
          {id: 'dereYatagi', x: 0.54, y: 0.92, scale: 1.38, motion: 'still'},
          {id: 'keloglan', x: 0.38, y: 0.85, scale: 0.88, motion: 'walk', speed: 1.1},
          {id: 'karinca', x: 0.62, y: 0.88, scale: 0.58, motion: 'creep', speed: 1.35},
        ],
      },
      {
        startTime: 167,
        subtitle: metin("StoryShadowTheater", "3_sahne_yoldaki_bilge_kaplumbaga"),
        narration:
          metin("StoryShadowTheater", "sirtustu_dusup_donemeyen_kaplumbagayi_yavasca_cevirmis_yavas"),
        placements: [
          {id: 'dag', x: 0.3, y: 0.78, scale: 1.5, motion: 'still'},
          {id: 'kaya', x: 0.8, y: 0.86, scale: 1.12, motion: 'still'},
          {id: 'agac', x: 0.15, y: 0.84, scale: 0.96, motion: 'sway'},
          {id: 'keloglan', x: 0.42, y: 0.85, scale: 0.88, motion: 'walk', speed: 1.15},
          {id: 'kaplumbaga', x: 0.61, y: 0.88, scale: 0.68, motion: 'creep', flip: true, speed: 0.85},
        ],
      },
      {
        startTime: 209,
        subtitle: metin("StoryShadowTheater", "4_sahne_leylekle_paylasilan_ekmek_ve_yel"),
        narration:
          metin("StoryShadowTheater", "agacin_yaninda_tek_ayagi_ustunde_bekleyen_leylekle"),
        placements: [
          {id: 'dag', x: 0.65, y: 0.78, scale: 1.6, motion: 'still'},
          {id: 'agac', x: 0.22, y: 0.84, scale: 1.08, motion: 'sway'},
          {id: 'keloglan', x: 0.36, y: 0.85, scale: 0.86, motion: 'sway'},
          {id: 'leylek', x: 0.56, y: 0.46, scale: 0.95, motion: 'flap', speed: 1.35},
          {id: 'kaya', x: 0.83, y: 0.86, scale: 1.18, motion: 'still'},
        ],
      },
      {
        startTime: 273,
        subtitle: metin("StoryShadowTheater", "5_sahne_karinca_ordusu_ve_fiskiran_berrak"),
        narration:
          metin("StoryShadowTheater", "karinca_ordusu_kumu_kazmis_kaplumbaga_sirtini_dayanak"),
        placements: [
          {id: 'dag', x: 0.34, y: 0.78, scale: 1.48, motion: 'still'},
          {id: 'kaya', x: 0.74, y: 0.85, scale: 1.16, motion: 'sway', speed: 0.7},
          {id: 'dereYatagi', x: 0.5, y: 0.92, scale: 1.42, motion: 'still'},
          {id: 'leylek', x: 0.52, y: 0.44, scale: 0.9, motion: 'flap', speed: 1.4},
          {id: 'keloglan', x: 0.28, y: 0.84, scale: 0.86, motion: 'walk', speed: 1.2},
          {id: 'kaplumbaga', x: 0.44, y: 0.88, scale: 0.62, motion: 'creep'},
          {id: 'karinca', x: 0.58, y: 0.88, scale: 0.54, motion: 'creep', flip: true},
          {id: 'karinca', x: 0.64, y: 0.89, scale: 0.48, motion: 'creep'},
        ],
      },
      {
        startTime: 378,
        subtitle: metin("StoryShadowTheater", "6_sahne_pinarli_cesmesi_yeniden_sarki_soyluyor"),
        narration:
          metin("StoryShadowTheater", "cesme_yeniden_akmis_keloglan_cesmenin_yanina_kuslar"),
        placements: [
          {id: 'koyEvleri', x: 0.16, y: 0.84, scale: 0.96, motion: 'still'},
          {id: 'agac', x: 0.87, y: 0.84, scale: 0.96, motion: 'sway'},
          {id: 'cesme', x: 0.5, y: 0.84, scale: 1.12, motion: 'still'},
          {id: 'anasi', x: 0.33, y: 0.85, scale: 0.82, motion: 'sway'},
          {id: 'keloglan', x: 0.64, y: 0.85, scale: 0.84, motion: 'walk'},
          {id: 'muhtar', x: 0.75, y: 0.85, scale: 0.84, motion: 'sway', flip: true},
          {id: 'koyluler', x: 0.24, y: 0.85, scale: 0.78, motion: 'sway'},
          {id: 'leylek', x: 0.54, y: 0.32, scale: 0.72, motion: 'flap', speed: 1.1},
        ],
      },
    ],
  },
];

export function buildInlineSilhouetteSvg(
  id: SilhouetteId,
  className = ''
): string {
  return `<svg viewBox="0 0 120 120" class="${className}" aria-hidden="true">${SILHOUETTE_PATHS[id]}</svg>`;
}

/**
 * Renders live animated inline-SVG silhouettes onto a backlit cream shadow curtain canvas texture.
 */
export class ShadowCurtainCanvas {
  readonly canvas: HTMLCanvasElement;
  readonly texture: THREE.CanvasTexture;
  private ctx: CanvasRenderingContext2D | null;
  private images = new Map<SilhouetteId, HTMLImageElement>();
  private taleIndex = 0;
  private sceneIndex = 0;
  private sceneElapsed = 0;
  private prevScene: TaleScene | null = null;
  private fadeProgress = 1;
  private lastDrawTime = -1;
  private bgGrad?: CanvasGradient;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 512;
    this.ctx = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.preloadInlineSvgImages();
    this.draw(0);
  }

  private preloadInlineSvgImages(): void {
    (Object.keys(SILHOUETTE_PATHS) as SilhouetteId[]).forEach((id) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">${SILHOUETTE_PATHS[id]}</svg>`;
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      this.images.set(id, img);
    });
  }

  getCurrentTale(): AnatolianTale {
    return ANATOLIAN_TALES[this.taleIndex];
  }

  getCurrentScene(): TaleScene {
    const tale = this.getCurrentTale();
    return tale.scenes[this.sceneIndex % tale.scenes.length];
  }

  getCurrentSceneIndex(): number {
    return this.sceneIndex;
  }

  getCurrentTaleIndex(): number {
    return this.taleIndex;
  }

  getSceneCount(): number {
    return this.getCurrentTale().scenes.length;
  }

  getSceneIndexForTime(timeSec: number): number {
    const scenes = this.getCurrentTale().scenes;
    let matched = 0;
    for (let i = 0; i < scenes.length; i++) {
      if (timeSec >= scenes[i].startTime) {
        matched = i;
      }
    }
    return matched;
  }

  selectTaleAndScene(taleIdx: number, sceneIdx = 0): void {
    const nextTale =
      ((taleIdx % ANATOLIAN_TALES.length) + ANATOLIAN_TALES.length) %
      ANATOLIAN_TALES.length;
    const tale = ANATOLIAN_TALES[nextTale];
    const nextScene =
      ((sceneIdx % tale.scenes.length) + tale.scenes.length) %
      tale.scenes.length;
    if (nextTale !== this.taleIndex || nextScene !== this.sceneIndex) {
      this.prevScene = this.getCurrentScene();
      this.fadeProgress = 0;
    }
    this.taleIndex = nextTale;
    this.sceneIndex = nextScene;
    this.sceneElapsed = 0;
  }

  advanceScene(): void {
    const tale = this.getCurrentTale();
    const nextIdx = (this.sceneIndex + 1) % tale.scenes.length;
    this.selectTaleAndScene(this.taleIndex, nextIdx);
  }

  update(
    dt: number,
    elapsedSec: number,
    audioTimeSec = 0,
    syncToAudio = false
  ): void {
    if (this.fadeProgress < 1) {
      this.fadeProgress = Math.min(1, this.fadeProgress + dt * 0.72); // Smooth ~1.4s gentle fade
    }

    if (syncToAudio && audioTimeSec >= 0) {
      const targetIdx = this.getSceneIndexForTime(audioTimeSec);
      if (targetIdx !== this.sceneIndex) {
        this.selectTaleAndScene(this.taleIndex, targetIdx);
      }
    } else {
      // Auto-play Gölge Perdesi continuously even when audio is paused or visitor is afar
      this.sceneElapsed += dt;
      if (this.sceneElapsed >= 10.5) {
        this.advanceScene();
      }
    }

    if (Math.abs(elapsedSec - this.lastDrawTime) > 0.065) {
      this.lastDrawTime = elapsedSec;
      this.draw(elapsedSec);
    }
  }

  private drawSceneLayer(
    ctx: CanvasRenderingContext2D,
    scene: TaleScene,
    alpha: number,
    t: number
  ): void {
    if (alpha <= 0.01) return;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.save();
    ctx.globalAlpha = alpha;

    for (let i = 0; i < scene.placements.length; i++) {
      const p = scene.placements[i];
      const img = this.images.get(p.id);
      if (!img || !img.complete || img.naturalWidth === 0) continue;

      const spd = p.speed ?? 1;
      const ph = t * spd * 1.8 + i * 1.3;
      let ox = 0;
      let oy = 0;
      let rot = 0;
      let sx = p.scale;
      let sy = p.scale;

      if (p.motion === 'walk') {
        ox = Math.sin(ph * 0.65) * 26;
        oy = -Math.abs(Math.sin(ph * 2.2)) * 8;
        rot = Math.sin(ph * 2.2) * 0.05;
      } else if (p.motion === 'sway') {
        rot = Math.sin(ph * 0.8) * 0.045;
      } else if (p.motion === 'flap') {
        ox = Math.sin(ph * 0.55) * 44;
        oy = Math.sin(ph * 1.6) * 14;
        sy = p.scale * (0.9 + Math.sin(ph * 4.2) * 0.14);
      } else if (p.motion === 'creep') {
        ox = Math.sin(ph * 0.5) * 18;
        oy = -Math.abs(Math.sin(ph * 1.9)) * 3;
      }

      const drawSize = 152;
      const cx = p.x * W + ox;
      const cy = p.y * H + oy;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.scale((p.flip ? -1 : 1) * sx, sy);
      ctx.drawImage(img, -drawSize / 2, -drawSize * 0.9, drawSize, drawSize);
      ctx.restore();
    }

    ctx.restore();
  }

  private draw(t: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const W = this.canvas.width;
    const H = this.canvas.height;

    // Warm backlit cream parchment curtain (kehribar -> krem -> koyu kenar vinyeti)
    if (!this.bgGrad) {
      const grad = ctx.createRadialGradient(
        W * 0.5,
        H * 0.52,
        40,
        W * 0.5,
        H * 0.52,
        W * 0.58
      );
      grad.addColorStop(0, '#fff4d6');
      grad.addColorStop(0.55, '#fde4a9');
      grad.addColorStop(0.88, '#e8b366');
      grad.addColorStop(1, '#9c5a25');
      this.bgGrad = grad;
    }
    ctx.fillStyle = this.bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle starry night horizon arc at upper sky of screen
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.14)';
    ctx.fillRect(0, 0, W, H * 0.24);
    for (let s = 0; s < 14; s++) {
      const sx = ((s * 83 + 42) % (W - 80)) + 40;
      const sy = 26 + ((s * 37) % 68);
      const tw = 0.35 + 0.3 * Math.sin(t * 1.4 + s);
      ctx.fillStyle = `rgba(255, 248, 220, ${tw.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, s % 3 === 0 ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Soft ground horizon silhouette strip
    ctx.fillStyle = '#18121c';
    ctx.fillRect(0, H * 0.85, W, H * 0.15);

    // Gentle crossfade between previous & current tale scenes
    if (this.prevScene && this.fadeProgress < 1) {
      this.drawSceneLayer(ctx, this.prevScene, 1 - this.fadeProgress, t);
    }
    this.drawSceneLayer(ctx, this.getCurrentScene(), this.fadeProgress, t);

    // Title pill header softly stitched onto upper margin of curtain
    const tale = this.getCurrentTale();
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 250, 14, 500, 40, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 21px "Google Sans", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🎭 ${tale.title}`, W / 2, 34);
    ctx.restore();

    this.texture.needsUpdate = true;
  }

  dispose(): void {
    this.texture.dispose();
  }
}
