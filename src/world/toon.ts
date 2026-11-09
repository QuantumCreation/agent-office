// Shared cel-shaded materials. Reusing materials keeps draw state changes low.

import * as THREE from "three";

let gradient: THREE.DataTexture | null = null;

function gradientMap() {
  if (gradient) return gradient;
  const steps = [90, 160, 215, 255];
  const data = new Uint8Array(steps.length * 4);
  steps.forEach((v, i) => data.set([v, v, v, 255], i * 4));
  gradient = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  return gradient;
}

const cache = new Map<string, THREE.MeshToonMaterial>();

export function toon(color: THREE.ColorRepresentation, opts: { emissive?: THREE.ColorRepresentation; transparent?: number } = {}) {
  const key = `${new THREE.Color(color).getHexString()}|${opts.emissive ?? ""}|${opts.transparent ?? ""}`;
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color, gradientMap: gradientMap() });
    if (opts.emissive !== undefined) {
      m.emissive = new THREE.Color(opts.emissive);
    }
    if (opts.transparent !== undefined) {
      m.transparent = true;
      m.opacity = opts.transparent;
      m.depthWrite = false;
    }
    cache.set(key, m);
  }
  return m;
}

/** A fresh (unshared) toon material, for things whose color changes at runtime. */
export function toonUnique(color: THREE.ColorRepresentation) {
  return new THREE.MeshToonMaterial({ color, gradientMap: gradientMap() });
}

const basicCache = new Map<string, THREE.MeshBasicMaterial>();
export function flat(color: THREE.ColorRepresentation) {
  const key = new THREE.Color(color).getHexString();
  let m = basicCache.get(key);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color });
    basicCache.set(key, m);
  }
  return m;
}

export function mesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  opts: { pos?: [number, number, number]; rot?: [number, number, number]; shadow?: boolean; receive?: boolean } = {},
) {
  const m = new THREE.Mesh(geometry, material);
  if (opts.pos) m.position.set(...opts.pos);
  if (opts.rot) m.rotation.set(...opts.rot);
  m.castShadow = opts.shadow ?? true;
  m.receiveShadow = opts.receive ?? true;
  return m;
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function canvasTexture(canvas: HTMLCanvasElement) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
