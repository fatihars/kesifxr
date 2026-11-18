import * as THREE from 'three';
import {DEVICE_QUALITY} from './deviceQuality.ts';

type Disposable = {dispose: () => void};
export type TrackFn = <T extends Disposable>(item: T) => T;

const canvasCache = new Map<string, HTMLCanvasElement>();
const textureCache = new Map<string, THREE.CanvasTexture>();

function makeCanvas(
  key: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): HTMLCanvasElement {
  const existing = canvasCache.get(key);
  if (existing) return existing;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx, width, height);
  canvasCache.set(key, canvas);
  return canvas;
}

function makeRepeatedTexture(
  key: string,
  width: number,
  height: number,
  isColor: boolean,
  repeatX: number,
  repeatY: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.CanvasTexture {
  const cacheKey = `${key}:${repeatX}x${repeatY}:${isColor ? 'srgb' : 'lin'}`;
  const cached = textureCache.get(cacheKey);
  if (cached) return cached;

  const canvas = makeCanvas(key, width, height, draw);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = DEVICE_QUALITY.maxAnisotropy;
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.needsUpdate = true;
  textureCache.set(cacheKey, tex);
  return tex;
}

// Deterministic pseudo-random helper so procedural stone/wood looks natural & consistent
function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Warm Anatolian cut travertine ashlar stone (albedo + bump) */
export function getTravertineTextures(
  repeatX = 2,
  repeatY = 2
): {map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture} {
  const map = makeRepeatedTexture('travertine-albedo', 512, 512, true, repeatX, repeatY, (ctx, w, h) => {
    ctx.fillStyle = '#d9ccb2';
    ctx.fillRect(0, 0, w, h);

    const rows = 8;
    const cols = 4;
    const rowH = h / rows;
    const colW = w / cols;

    for (let r = 0; r < rows; r++) {
      const offset = r % 2 === 0 ? 0 : colW * 0.5;
      for (let c = -1; c <= cols; c++) {
        const bx = c * colW + offset;
        const by = r * rowH;
        const n = hash2(c + 10, r + 5);
        const lum = Math.round(218 + (n - 0.5) * 20);
        const warmG = Math.round(lum * 0.93);
        const warmB = Math.round(lum * 0.80);

        const grad = ctx.createLinearGradient(bx, by, bx + colW, by + rowH);
        grad.addColorStop(0, `rgb(${lum + 5},${warmG + 4},${warmB + 2})`);
        grad.addColorStop(0.5, `rgb(${lum},${warmG},${warmB})`);
        grad.addColorStop(1, `rgb(${lum - 7},${warmG - 6},${warmB - 5})`);
        ctx.fillStyle = grad;
        ctx.fillRect(bx + 2, by + 2, colW - 4, rowH - 4);

        // Subtle travertine pores & horizontal sedimentary bedding streaks
        ctx.fillStyle = 'rgba(130, 108, 78, 0.10)';
        for (let s = 0; s < 5; s++) {
          const sx = bx + 8 + hash2(c * 7 + s, r * 3) * (colW - 28);
          const sy = by + 8 + hash2(r * 11, c * 5 + s) * (rowH - 16);
          ctx.fillRect(sx, sy, 10 + hash2(s, r) * 18, 2);
        }

        // Chamfered sunlit top-left highlight & bottom-right bevel
        ctx.strokeStyle = 'rgba(255, 250, 240, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx + 3, by + rowH - 3);
        ctx.lineTo(bx + 3, by + 3);
        ctx.lineTo(bx + colW - 3, by + 3);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(105, 88, 66, 0.42)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx + colW - 3, by + 3);
        ctx.lineTo(bx + colW - 3, by + rowH - 3);
        ctx.lineTo(bx + 3, by + rowH - 3);
        ctx.stroke();
      }
    }
  });

  const bumpMap = makeRepeatedTexture('travertine-bump', 512, 512, false, repeatX, repeatY, (ctx, w, h) => {
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(0, 0, w, h);

    const rows = 8;
    const cols = 4;
    const rowH = h / rows;
    const colW = w / cols;

    for (let r = 0; r < rows; r++) {
      const offset = r % 2 === 0 ? 0 : colW * 0.5;
      for (let c = -1; c <= cols; c++) {
        const bx = c * colW + offset;
        const by = r * rowH;
        const v = Math.round(195 + (hash2(c, r) - 0.5) * 24);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(bx + 3, by + 3, colW - 6, rowH - 6);
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 4;
        ctx.strokeRect(bx + 1, by + 1, colW - 2, rowH - 2);
      }
    }
  });

  return {map, bumpMap};
}

/** Anatolian cobblestone & cut sandstone plaza paving */
export function getCobblePlazaTextures(
  repeatX = 1,
  repeatY = 1
): {map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture} {
  const map = makeRepeatedTexture('cobble-albedo', 512, 512, true, repeatX, repeatY, (ctx, w, h) => {
    ctx.fillStyle = '#8b7a62';
    ctx.fillRect(0, 0, w, h);

    const cell = 64;
    for (let gy = 0; gy < 8; gy++) {
      const shift = gy % 2 === 0 ? 0 : cell * 0.5;
      for (let gx = -1; gx <= 8; gx++) {
        const x = gx * cell + shift;
        const y = gy * cell;
        const n = hash2(gx + 3, gy + 11);
        const palettes = ['#ccb899', '#c1ab89', '#d6c6a9', '#b59d7a', '#cbb591'];
        ctx.fillStyle = palettes[Math.floor(n * palettes.length)];
        ctx.beginPath();
        ctx.roundRect(x + 3, y + 3, cell - 6, cell - 6, 8);
        ctx.fill();

        // Subtle stone speckle
        ctx.fillStyle = 'rgba(255, 248, 232, 0.22)';
        ctx.beginPath();
        ctx.roundRect(x + 6, y + 6, cell - 14, 10, 4);
        ctx.fill();

        ctx.strokeStyle = 'rgba(72, 60, 44, 0.45)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(x + 3, y + 3, cell - 6, cell - 6, 8);
        ctx.stroke();
      }
    }
  });

  const bumpMap = makeRepeatedTexture('cobble-bump', 512, 512, false, repeatX, repeatY, (ctx, w, h) => {
    ctx.fillStyle = '#404040';
    ctx.fillRect(0, 0, w, h);
    const cell = 64;
    for (let gy = 0; gy < 8; gy++) {
      const shift = gy % 2 === 0 ? 0 : cell * 0.5;
      for (let gx = -1; gx <= 8; gx++) {
        const x = gx * cell + shift;
        const y = gy * cell;
        const v = Math.round(180 + hash2(gx, gy) * 50);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 4, cell - 8, cell - 8, 9);
        ctx.fill();
      }
    }
  });

  return {map, bumpMap};
}

/** Authentic İznik ceramic tile glaze texture */
export function getIznikTileTexture(
  variant: 'turquoise' | 'cobalt' | 'emerald' = 'turquoise',
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  return makeRepeatedTexture(`iznik-${variant}`, 512, 512, true, repeatX, repeatY, (ctx, w, h) => {
    const bg =
      variant === 'cobalt' ? '#132a4f' : variant === 'emerald' ? '#0b4f4a' : '#0c5c6b';
    const accent =
      variant === 'cobalt' ? '#38bdf8' : variant === 'emerald' ? '#34d399' : '#2dd4bf';
    const coral = '#e11d48';
    const ivory = '#faf6ea';

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // 2x2 İznik medallions grid
    const tile = w / 2;
    for (let ty = 0; ty < 2; ty++) {
      for (let tx = 0; tx < 2; tx++) {
        const cx = tx * tile + tile / 2;
        const cy = ty * tile + tile / 2;

        // Crisp ceramic grout joint
        ctx.strokeStyle = 'rgba(255, 250, 235, 0.25)';
        ctx.lineWidth = 3;
        ctx.strokeRect(tx * tile + 2, ty * tile + 2, tile - 4, tile - 4);

        // Ivory 8-pointed Seljuk star backing
        ctx.save();
        ctx.translate(cx, cy);
        ctx.fillStyle = ivory;
        for (let rot = 0; rot < 2; rot++) {
          ctx.save();
          ctx.rotate((rot * Math.PI) / 4);
          ctx.fillRect(-58, -58, 116, 116);
          ctx.restore();
        }

        // Turquoise floral rosette petals inside star
        ctx.fillStyle = accent;
        for (let p = 0; p < 8; p++) {
          ctx.save();
          ctx.rotate((p * Math.PI) / 4);
          ctx.beginPath();
          ctx.ellipse(0, -48, 14, 28, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Coral crimson tulip buds at cardinal corners
        ctx.fillStyle = coral;
        for (let p = 0; p < 4; p++) {
          ctx.save();
          ctx.rotate((p * Math.PI) / 2 + Math.PI / 4);
          ctx.beginPath();
          ctx.ellipse(0, -90, 11, 20, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Center golden/ivory rosette
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  });
}

/** Rich Anatolian woven kilim carpet texture */
export function getAnatolianKilimTexture(
  variant: 'crimson' | 'navy' | 'turquoise' = 'crimson'
): THREE.CanvasTexture {
  return makeRepeatedTexture(`kilim-${variant}`, 512, 512, true, 1, 1, (ctx, w, h) => {
    const base =
      variant === 'navy' ? '#1e3a5f' : variant === 'turquoise' ? '#0f5c5e' : '#8f1d2c';
    const border =
      variant === 'navy' ? '#991b1b' : variant === 'turquoise' ? '#b45309' : '#1e3a5f';
    const cream = '#fef3c7';
    const gold = '#f59e0b';

    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    // Outer double ornamental frame
    ctx.strokeStyle = gold;
    ctx.lineWidth = 18;
    ctx.strokeRect(18, 18, w - 36, h - 36);

    ctx.strokeStyle = border;
    ctx.lineWidth = 26;
    ctx.strokeRect(42, 42, w - 84, h - 84);

    // Stepped zigzag geometric ribbon inside border
    ctx.strokeStyle = cream;
    ctx.lineWidth = 5;
    ctx.strokeRect(64, 64, w - 128, h - 128);

    // Corner Koçboynuzu diamond accents
    const drawDiamond = (cx: number, cy: number, r: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      ctx.fill();
    };

    [
      [112, 112],
      [w - 112, 112],
      [112, h - 112],
      [w - 112, h - 112],
    ].forEach(([dx, dy]) => {
      drawDiamond(dx, dy, 34, gold);
      drawDiamond(dx, dy, 18, border);
      drawDiamond(dx, dy, 8, cream);
    });

    // Grand central Seljuk medallion
    drawDiamond(w / 2, h / 2, 140, border);
    drawDiamond(w / 2, h / 2, 118, gold);
    drawDiamond(w / 2, h / 2, 92, cream);
    drawDiamond(w / 2, h / 2, 62, base);
    drawDiamond(w / 2, h / 2, 32, gold);

    // Subtle wool weave crosshatch
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let y = 0; y < h; y += 6) {
      ctx.fillRect(0, y, w, 2);
    }
  });
}

/** Anatolian walnut & cedar carved timber texture (albedo + bump) */
export function getWalnutWoodTextures(
  repeatX = 1,
  repeatY = 1
): {map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture} {
  const map = makeRepeatedTexture('walnut-albedo', 256, 256, true, repeatX, repeatY, (ctx, w, h) => {
    ctx.fillStyle = '#5c3822';
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 48; i++) {
      const y = (i / 48) * h;
      const tone = Math.round(70 + hash2(i, 3) * 34);
      ctx.strokeStyle = `rgba(${tone + 26}, ${Math.round(tone * 0.65)}, ${Math.round(tone * 0.36)}, 0.45)`;
      ctx.lineWidth = 2 + hash2(i, 9) * 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.33, y + (hash2(i, 1) - 0.5) * 14, w * 0.66, y + (hash2(i, 2) - 0.5) * 14, w, y);
      ctx.stroke();
    }

    // Subtle plank seam every 64px
    ctx.strokeStyle = 'rgba(28, 15, 8, 0.55)';
    ctx.lineWidth = 3;
    for (let y = 64; y < h; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  });

  const bumpMap = makeRepeatedTexture('walnut-bump', 256, 256, false, repeatX, repeatY, (ctx, w, h) => {
    ctx.fillStyle = '#999999';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      const y = (i / 40) * h;
      const v = Math.round(135 + hash2(i, 7) * 55);
      ctx.strokeStyle = `rgb(${v},${v},${v})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = '#303030';
    ctx.lineWidth = 3;
    for (let y = 64; y < h; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  });

  return {map, bumpMap};
}

/** Polished Marmara white-gold veined marble floor tile */
export function getMarbleInlayTexture(repeatX = 4, repeatY = 4): THREE.CanvasTexture {
  return makeRepeatedTexture('marble-inlay', 512, 512, true, repeatX, repeatY, (ctx, w, h) => {
    ctx.fillStyle = '#f2ece1';
    ctx.fillRect(0, 0, w, h);

    // Diagonal veining
    ctx.strokeStyle = 'rgba(175, 160, 138, 0.34)';
    for (let i = 0; i < 14; i++) {
      ctx.lineWidth = 1 + hash2(i, 4) * 3;
      ctx.beginPath();
      const sy = hash2(i, 8) * h;
      ctx.moveTo(0, sy);
      ctx.bezierCurveTo(w * 0.35, sy + (hash2(i, 2) - 0.5) * 90, w * 0.7, sy + (hash2(i, 5) - 0.5) * 90, w, sy + (hash2(i, 9) - 0.5) * 60);
      ctx.stroke();
    }

    // Gold/dark tile inlay border
    ctx.strokeStyle = '#c4a97d';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.strokeStyle = 'rgba(180, 128, 42, 0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, w - 36, h - 36);
  });
}

/** Soft organic Anatolian meadow grass texture */
export function getMeadowGrassTexture(repeatX = 18, repeatY = 18): THREE.CanvasTexture {
  return makeRepeatedTexture('meadow-grass', 256, 256, true, repeatX, repeatY, (ctx, w, h) => {
    ctx.fillStyle = '#5c9c24';
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 240; i++) {
      const x = hash2(i, 1) * w;
      const y = hash2(i, 2) * h;
      const r = 8 + hash2(i, 3) * 18;
      ctx.fillStyle =
        i % 3 === 0
          ? 'rgba(116, 179, 43, 0.26)'
          : i % 3 === 1
            ? 'rgba(72, 134, 24, 0.22)'
            : 'rgba(145, 198, 60, 0.16)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** Alaturka terracotta clay roof tiles (albedo + bump) */
export function getTerracottaRoofTextures(
  repeatX = 4,
  repeatY = 2
): {map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture} {
  const map = makeRepeatedTexture('terracotta-albedo', 256, 256, true, repeatX, repeatY, (ctx, w, h) => {
    ctx.fillStyle = '#a24328';
    ctx.fillRect(0, 0, w, h);
    const cols = 8;
    const rows = 4;
    const cw = w / cols;
    const rh = h / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cw;
        const y = r * rh;
        const n = hash2(c, r);
        const grad = ctx.createLinearGradient(x, y, x + cw, y);
        grad.addColorStop(0, '#7c2d12');
        grad.addColorStop(0.5, n > 0.5 ? '#c25130' : '#b4482a');
        grad.addColorStop(1, '#7c2d12');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, cw, rh - 2);

        ctx.fillStyle = 'rgba(40, 14, 6, 0.45)';
        ctx.fillRect(x, y + rh - 4, cw, 4);
      }
    }
  });

  const bumpMap = makeRepeatedTexture('terracotta-bump', 256, 256, false, repeatX, repeatY, (ctx, w, h) => {
    ctx.fillStyle = '#777777';
    ctx.fillRect(0, 0, w, h);
    const cols = 8;
    const cw = w / cols;
    for (let c = 0; c < cols; c++) {
      const grad = ctx.createLinearGradient(c * cw, 0, (c + 1) * cw, 0);
      grad.addColorStop(0, '#333333');
      grad.addColorStop(0.5, '#e8e8e8');
      grad.addColorStop(1, '#333333');
      ctx.fillStyle = grad;
      ctx.fillRect(c * cw, 0, cw, h);
    }
  });

  return {map, bumpMap};
}

/** Ribbed Ottoman lead dome sheathing texture */
export function getLeadDomeTexture(repeatX = 6, repeatY = 2): THREE.CanvasTexture {
  return makeRepeatedTexture('lead-dome', 256, 256, true, repeatX, repeatY, (ctx, w, h) => {
    ctx.fillStyle = '#3b4a59';
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) {
      const grad = ctx.createLinearGradient(x, 0, x + 32, 0);
      grad.addColorStop(0, '#2a3744');
      grad.addColorStop(0.5, '#526577');
      grad.addColorStop(1, '#2a3744');
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, 30, h);
    }
    ctx.fillStyle = 'rgba(20, 28, 36, 0.35)';
    for (let y = 0; y < h; y += 64) {
      ctx.fillRect(0, y, w, 2);
    }
  });
}

/**
 * Builds an extruded Ottoman/Seljuk pointed Kemer arch frame spandrel block.
 * Bottom edge sits at y = 0, span centered at x = 0, centered on z = 0.
 */
export function createPointedArchGeometry(
  outerW: number,
  outerH: number,
  openingW: number,
  springH: number,
  peakH: number,
  depth: number
): THREE.ExtrudeGeometry {
  const hw = outerW / 2;
  const ow = openingW / 2;

  const shape = new THREE.Shape();
  shape.moveTo(-hw, 0);
  shape.lineTo(-ow, 0);
  shape.lineTo(-ow, springH);
  // Left pointed arch curve toward apex
  shape.quadraticCurveTo(-ow * 0.85, (springH + peakH) * 0.56, 0, peakH);
  // Right pointed arch curve down
  shape.quadraticCurveTo(ow * 0.85, (springH + peakH) * 0.56, ow, springH);
  shape.lineTo(ow, 0);
  shape.lineTo(hw, 0);
  shape.lineTo(hw, outerH);
  shape.lineTo(-hw, outerH);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.025,
    bevelSegments: 2,
    curveSegments: 14,
  });
  geo.translate(0, 0, -depth / 2);
  geo.computeVertexNormals();
  return geo;
}

/** Extruded 8-pointed Seljuk star (Selçuklu Yıldızı) centered on origin */
export function createSeljukStarGeometry(
  outerR: number,
  innerR: number,
  depth: number
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const points = 16;
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.18,
    bevelSize: outerR * 0.04,
    bevelSegments: 1,
  });
  geo.translate(0, 0, -depth / 2);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a classical Anatolian fluted/entasis stone column with stepped plinth,
 * brass collar ring, and faceted Muqarnas-inspired capital.
 */
export function createAnatolianColumn(
  track: TrackFn,
  radius: number,
  totalHeight: number,
  stoneMat: THREE.Material,
  capitalMat?: THREE.Material,
  brassMat?: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  const capM = capitalMat ?? stoneMat;
  const trimM = brassMat ?? capM;

  const baseH = Math.min(0.32, totalHeight * 0.1);
  const capH = Math.min(0.42, totalHeight * 0.14);
  const shaftH = Math.max(0.4, totalHeight - baseH - capH);

  // Square plinth + torus Attic base
  const plinth = new THREE.Mesh(
    track(new THREE.BoxGeometry(radius * 2.85, baseH * 0.58, radius * 2.85)),
    stoneMat
  );
  plinth.position.y = baseH * 0.29;
  plinth.castShadow = true;
  plinth.receiveShadow = true;

  const torusBase = new THREE.Mesh(
    track(new THREE.CylinderGeometry(radius * 1.18, radius * 1.38, baseH * 0.42, 16)),
    stoneMat
  );
  torusBase.position.y = baseH * 0.79;

  // Tapered 16-flute-look column shaft
  const shaft = new THREE.Mesh(
    track(new THREE.CylinderGeometry(radius * 0.88, radius * 1.0, shaftH, 16)),
    stoneMat
  );
  shaft.position.y = baseH + shaftH / 2;
  shaft.castShadow = true;
  shaft.receiveShadow = true;

  // Necking ring
  const collar = new THREE.Mesh(
    track(new THREE.TorusGeometry(radius * 0.94, radius * 0.11, 8, 18)),
    trimM
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.y = baseH + shaftH;

  // Tiered Muqarnas/Baklava Capital
  const capTier1 = new THREE.Mesh(
    track(new THREE.CylinderGeometry(radius * 1.24, radius * 0.9, capH * 0.52, 8)),
    capM
  );
  capTier1.position.y = baseH + shaftH + capH * 0.28;
  capTier1.rotation.y = Math.PI / 8;

  const capTier2 = new THREE.Mesh(
    track(new THREE.CylinderGeometry(radius * 1.48, radius * 1.2, capH * 0.28, 8)),
    capM
  );
  capTier2.position.y = baseH + shaftH + capH * 0.66;

  const abacus = new THREE.Mesh(
    track(new THREE.BoxGeometry(radius * 2.75, capH * 0.22, radius * 2.75)),
    stoneMat
  );
  abacus.position.y = totalHeight - capH * 0.11;
  abacus.castShadow = true;

  g.add(plinth, torusBase, shaft, collar, capTier1, capTier2, abacus);
  return g;
}

/** Brass Ottoman Alem finial (3 graded spheres + crescent + spire) */
export function createOttomanAlem(
  track: TrackFn,
  scale: number,
  brassMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  const s = scale;

  const rod = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.025 * s, 0.042 * s, 0.85 * s, 10)),
    brassMat
  );
  rod.position.y = 0.425 * s;

  const orb1 = new THREE.Mesh(track(new THREE.SphereGeometry(0.11 * s, 12, 10)), brassMat);
  orb1.position.y = 0.22 * s;
  const orb2 = new THREE.Mesh(track(new THREE.SphereGeometry(0.08 * s, 12, 10)), brassMat);
  orb2.position.y = 0.44 * s;
  const orb3 = new THREE.Mesh(track(new THREE.SphereGeometry(0.055 * s, 10, 8)), brassMat);
  orb3.position.y = 0.61 * s;

  const crescent = new THREE.Mesh(
    track(new THREE.TorusGeometry(0.14 * s, 0.026 * s, 8, 20, Math.PI * 1.42)),
    brassMat
  );
  crescent.position.y = 0.94 * s;
  crescent.rotation.z = Math.PI * 0.79;

  g.add(rod, orb1, orb2, orb3, crescent);
  return g;
}

/** Creates an ornate ribbed Ottoman dome + optional octagonal drum + crescent Alem */
export function createRibbedDome(
  track: TrackFn,
  radius: number,
  heightScale: number,
  domeMat: THREE.Material,
  ribMat: THREE.Material,
  finialMat: THREE.Material,
  options?: {
    ribCount?: number;
    alemScale?: number;
    drumHeight?: number;
    drumMat?: THREE.Material;
    windowMat?: THREE.Material;
    drumWindows?: number;
  }
): THREE.Group {
  const g = new THREE.Group();
  const drumH = options?.drumHeight ?? 0;
  const ribCount = options?.ribCount ?? 12;

  if (drumH > 0) {
    const drum = new THREE.Mesh(
      track(new THREE.CylinderGeometry(radius * 1.03, radius * 1.07, drumH, 16)),
      options?.drumMat ?? ribMat
    );
    drum.position.y = drumH / 2;
    drum.castShadow = true;
    drum.receiveShadow = true;
    g.add(drum);

    const cornice = new THREE.Mesh(
      track(new THREE.CylinderGeometry(radius * 1.09, radius * 1.04, 0.14, 16)),
      ribMat
    );
    cornice.position.y = drumH;
    g.add(cornice);

    if (options?.windowMat && (options.drumWindows ?? 0) > 0) {
      const count = options.drumWindows!;
      const winGeo = track(new THREE.BoxGeometry(radius * 0.16, drumH * 0.56, 0.08));
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const w = new THREE.Mesh(winGeo, options.windowMat);
        w.position.set(Math.sin(a) * radius * 1.04, drumH * 0.52, Math.cos(a) * radius * 1.04);
        w.rotation.y = a;
        g.add(w);
      }
    }
  }

  const domeGeo = track(
    new THREE.SphereGeometry(radius, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.52)
  );
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.scale.y = heightScale;
  dome.position.y = drumH;
  dome.castShadow = true;
  g.add(dome);

  // Subtle decorative ribs curving up the dome surface
  const ribGeo = track(
    new THREE.TorusGeometry(radius * 1.008, Math.max(0.024, radius * 0.016), 6, 20, Math.PI * 0.49)
  );
  for (let i = 0; i < ribCount; i++) {
    const rib = new THREE.Mesh(ribGeo, ribMat);
    rib.position.y = drumH;
    rib.scale.y = heightScale;
    rib.rotation.y = (i / ribCount) * Math.PI * 2;
    g.add(rib);
  }

  const alem = createOttomanAlem(track, options?.alemScale ?? Math.max(0.55, radius * 0.25), finialMat);
  alem.position.y = drumH + radius * heightScale * 0.98;
  g.add(alem);

  return g;
}
