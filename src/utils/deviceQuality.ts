import * as THREE from 'three';

export interface AdaptiveQualityProfile {
  isMobile: boolean;
  pixelRatio: number;
  antialias: boolean;
  shadowsEnabled: boolean;
  simplifiedLighting: boolean;
  useEnvironmentPmrem: boolean;
  maxAnisotropy: number;
  lodHighDist: number;
  lodMidDist: number;
  lodUnloadDist: number;
  frustumGraceSec: number;
  maxConcurrentTextureLoads: number;
  maxLoadStartsPerFrame: number;
}

export function detectMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent || navigator.vendor || '';
  const uaDataMobile = (
    navigator as Navigator & {userAgentData?: {mobile?: boolean}}
  ).userAgentData?.mobile;

  if (uaDataMobile === true) {
    return true;
  }

  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(
      ua
    )
  ) {
    return true;
  }

  // iPadOS Safari reports MacIntel with multi-touch support
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
    return true;
  }

  const viewportWidth = window.innerWidth || document.documentElement?.clientWidth || 1280;
  if (viewportWidth <= 860) {
    return true;
  }

  const isCoarsePointer =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;

  return isCoarsePointer && viewportWidth <= 1024;
}

function buildAdaptiveQualityProfile(): AdaptiveQualityProfile {
  const isMobile = detectMobileDevice();
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  if (isMobile) {
    return {
      isMobile: true,
      pixelRatio: Math.min(Math.max(dpr, 1), 1.35),
      antialias: true,
      shadowsEnabled: false,
      simplifiedLighting: false,
      useEnvironmentPmrem: true,
      maxAnisotropy: 4,
      lodHighDist: 9.5,
      lodMidDist: 17.5,
      lodUnloadDist: 22.0,
      frustumGraceSec: 1.5,
      maxConcurrentTextureLoads: 3,
      maxLoadStartsPerFrame: 2,
    };
  }

  return {
    isMobile: false,
    pixelRatio: Math.min(dpr, 1.5),
    antialias: true,
    shadowsEnabled: true,
    simplifiedLighting: false,
    useEnvironmentPmrem: true,
    maxAnisotropy: 4,
    lodHighDist: 10.5,
    lodMidDist: 19.5,
    lodUnloadDist: 24.0,
    frustumGraceSec: 2.0,
    maxConcurrentTextureLoads: 4,
    maxLoadStartsPerFrame: 2,
  };
}

export const DEVICE_QUALITY: AdaptiveQualityProfile = buildAdaptiveQualityProfile();

const ANISOTROPY_TEXTURE_KEYS = [
  'map',
  'emissiveMap',
  'roughnessMap',
  'normalMap',
  'bumpMap',
  'aoMap',
] as const;

export function applyRendererQuality(
  renderer: unknown,
  rootObject?: THREE.Object3D
): void {
  const webglRenderer = renderer as THREE.WebGLRenderer | undefined;
  let targetAnisotropy = DEVICE_QUALITY.maxAnisotropy;
  if (webglRenderer) {
    if (typeof webglRenderer.setPixelRatio === 'function') {
      webglRenderer.setPixelRatio(DEVICE_QUALITY.pixelRatio);
    }
    if (typeof webglRenderer.capabilities?.getMaxAnisotropy === 'function') {
      targetAnisotropy = Math.min(
        DEVICE_QUALITY.maxAnisotropy,
        webglRenderer.capabilities.getMaxAnisotropy()
      );
    }

    if (webglRenderer.shadowMap) {
      if (DEVICE_QUALITY.shadowsEnabled) {
        webglRenderer.shadowMap.enabled = true;
        webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
      } else {
        webglRenderer.shadowMap.enabled = false;
        webglRenderer.shadowMap.autoUpdate = false;
      }
    }
  }

  if (rootObject) {
    const applyMaterialAnisotropy = (mat: THREE.Material) => {
      const record = mat as unknown as Record<string, unknown>;
      for (const key of ANISOTROPY_TEXTURE_KEYS) {
        const tex = record[key];
        if (tex instanceof THREE.Texture && tex.anisotropy < targetAnisotropy) {
          tex.anisotropy = targetAnisotropy;
          tex.needsUpdate = true;
        }
      }
    };

    rootObject.traverse((obj) => {
      if (!DEVICE_QUALITY.shadowsEnabled) {
        obj.castShadow = false;
        obj.receiveShadow = false;
      }
      if (targetAnisotropy > 1 && 'material' in obj) {
        const mat = (obj as THREE.Mesh).material;
        if (Array.isArray(mat)) {
          for (const entry of mat) {
            if (entry) applyMaterialAnisotropy(entry);
          }
        } else if (mat) {
          applyMaterialAnisotropy(mat);
        }
      }
    });
  }
}
