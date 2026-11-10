// Standalone preview of the city exterior with a crude stand-in for the office floor.
//
// URL params:
//   view=north|south|east|west|down|up|orbit   (default north)
//   dir=north|south|east|west                  facing for down/up (default north)
//   elev=90                                    meters above the street
//   x=, z=                                     camera offset along the window wall
//   yaw=, pitch=                               extra degrees
//   fov=62, t=0 (seconds of traffic to simulate), shot=1 (hide HUD)
//   time=21:30, timescale=600, lat=, lon=       time of day (see src/world/daynight.ts)
//   cam=x,y,z&look=x,y,z                       free camera (world space)
//   focus=ferris-wheel&dist=150                look at a named city object
// Drag to look around.

import * as THREE from "three";
import { buildCity } from "../src/world/city.ts";
import { CEILING_HEIGHT, WINDOW_HEAD, WINDOW_SILL } from "../src/world/floorplan.ts";
import { DayNight } from "../src/world/daynight.ts";

const q = new URLSearchParams(location.search);
const num = (k: string, d: number) => (q.has(k) ? Number(q.get(k)) : d);
const view = q.get("view") ?? "north";
const elev = num("elev", 90);
if (q.has("shot")) document.body.classList.add("shot");

const canvas = document.getElementById("c") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const city = buildCity();
scene.add(city.group);
scene.fog = city.fog;
scene.background = city.background;
city.setElevation(elev);

const camera = new THREE.PerspectiveCamera(num("fov", 62), 1, 0.08, city.cameraFar);

// Same lights as the game.
const hemi = new THREE.HemisphereLight("#ffffff", "#d8ccb4", 1.55);
const ambient = new THREE.AmbientLight("#fff6e8", 0.35);
scene.add(hemi, ambient);
const sun = new THREE.DirectionalLight("#fff6e6", 1.35);
sun.position.set(6, 30, 9);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -21, right: 21, top: 16, bottom: -16, near: 1, far: 60 });
scene.add(sun);
// Time of day: live by default, or ?time=21:30 / ?timescale=600 (see daynight.ts).
const dayNight = new DayNight(city, { hemi, ambient, key: sun });
(window as unknown as Record<string, unknown>).dayNight = dayNight;

// ------------------------------------------------------------------ office stand-in
const office = new THREE.Group();
{
  const toonMat = (c: string) => new THREE.MeshToonMaterial({ color: c });
  const wall = toonMat("#f3efe6");
  const mull = toonMat("#6d7385");
  const glass = new THREE.MeshToonMaterial({ color: "#cfe8ff", transparent: true, opacity: 0.12, depthWrite: false });
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    b.position.set(x, y, z);
    b.castShadow = b.receiveShadow = true;
    office.add(b);
  };
  box(36, 0.3, 26, 0, -0.15, 0, toonMat("#bfd0e6"));
  const H = CEILING_HEIGHT, sill = WINDOW_SILL, head = WINDOW_HEAD;
  box(36, 0.2, 26, 0, H + 0.1, 0, toonMat("#f6f3ec"));
  const edges: [number, number, number, number][] = [
    [-18, -13, 18, -13],
    [-18, 13, 18, 13],
    [-18, -13, -18, 13],
    [18, -13, 18, 13],
  ];
  for (const [x0, z0, x1, z1] of edges) {
    const alongX = z0 === z1;
    const len = alongX ? x1 - x0 : z1 - z0;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const seg = (h: number, y: number, t: number, m: THREE.Material) =>
      alongX ? box(len, h, t, cx, y, cz, m) : box(t, h, len, cx, y, cz, m);
    seg(sill, sill / 2, 0.3, wall);
    seg(H - head, (head + H) / 2, 0.3, wall);
    seg(head - sill, (sill + head) / 2, 0.02, glass);
    seg(0.06, sill, 0.2, mull);
    for (let s = 0; s <= len + 1e-6; s += 1.5) {
      if (alongX) box(0.06, head - sill, 0.14, x0 + s, (sill + head) / 2, cz, mull);
      else box(0.14, head - sill, 0.06, cx, (sill + head) / 2, z0 + s, mull);
    }
  }
  // A couple of desks and a plant for scale.
  const desk = toonMat("#dcb98e");
  box(1.6, 0.05, 0.8, 2, 0.74, -10.5, desk);
  box(1.6, 0.05, 0.8, -3, 0.74, -10.5, desk);
  const plant = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), toonMat("#7cc46a"));
  plant.position.set(-1, 0.9, -11.6);
  office.add(plant);
}
scene.add(office);

// ------------------------------------------------------------------ camera placement
const DIRS: Record<string, { pos: [number, number]; yaw: number }> = {
  north: { pos: [0.75, -12], yaw: 0 },
  south: { pos: [0.75, 12], yaw: Math.PI },
  east: { pos: [17, 0.75], yaw: -Math.PI / 2 },
  west: { pos: [-17, 0.75], yaw: Math.PI / 2 },
};
let yaw = 0;
let pitch = 0;
if (q.has("cam")) {
  const [x, y, z] = q.get("cam")!.split(",").map(Number);
  const [lx, ly, lz] = (q.get("look") ?? "0,0,0").split(",").map(Number);
  camera.position.set(x, y, z);
  camera.lookAt(lx, ly, lz);
  const e = new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ");
  yaw = e.y;
  pitch = e.x;
} else if (q.has("focus")) {
  // Look at a named part of the city, e.g. focus=ferris-wheel&dist=160.
  const target = city.group.getObjectByName(q.get("focus")!);
  const p = new THREE.Vector3();
  target?.getWorldPosition(p);
  const dist = num("dist", 150);
  camera.position.set(p.x - dist * 0.5, p.y + dist * 0.35, p.z - dist * 0.8);
  camera.lookAt(p);
  const e = new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ");
  yaw = e.y;
  pitch = e.x;
} else {
  const facing = view === "down" || view === "up" ? (q.get("dir") ?? "north") : view;
  const d = DIRS[facing] ?? DIRS.north;
  const along = facing === "north" || facing === "south" ? [num("x", d.pos[0]), d.pos[1]] : [d.pos[0], num("z", d.pos[1])];
  camera.position.set(along[0], 1.5, along[1]);
  yaw = d.yaw;
  pitch = view === "down" ? -0.75 : view === "up" ? 0.55 : -0.04;
}
yaw += THREE.MathUtils.degToRad(num("yaw", 0));
pitch += THREE.MathUtils.degToRad(num("pitch", 0));
function applyLook() {
  camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, "YXZ"));
}
applyLook();

let dragging = false;
canvas.addEventListener("pointerdown", (e) => {
  dragging = true;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointerup", () => (dragging = false));
canvas.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  yaw -= e.movementX * 0.004;
  pitch = THREE.MathUtils.clamp(pitch - e.movementY * 0.004, -1.5, 1.5);
  applyLook();
});
window.addEventListener("keydown", (e) => {
  const n = Number(e.key);
  if (n >= 1 && n <= 4) city.setElevation([40, 90, 130, 160][n - 1]);
});

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

// ------------------------------------------------------------------ loop
const t0 = num("t", 0);
if (t0 > 0) city.update(t0, t0);
const hud = document.getElementById("hud")!;
const clock = new THREE.Clock();
let time = t0;
let frames = 0;
declare global {
  interface Window {
    __stats?: { calls: number; triangles: number; geometries: number; textures: number; cityCalls: number; cityTriangles: number };
    __ready?: boolean;
    __breakdown?: Record<string, number>;
  }
}

function cityOnlyStats() {
  // Render once with the office hidden to count the city's own cost.
  office.visible = false;
  sun.castShadow = false;
  renderer.render(scene, camera);
  const s = { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles };
  office.visible = true;
  sun.castShadow = true;
  return s;
}

function frame() {
  const dt = Math.min(clock.getDelta(), 0.1);
  time += dt;
  city.update(dt, time);
  dayNight.update(dt);
  renderer.render(scene, camera);
  frames++;
  if (frames === 3) {
    const info = renderer.info;
    const all = { calls: info.render.calls, triangles: info.render.triangles };
    const c = cityOnlyStats();
    renderer.render(scene, camera);
    window.__stats = { calls: all.calls, triangles: all.triangles, geometries: info.memory.geometries, textures: info.memory.textures, cityCalls: c.calls, cityTriangles: c.triangles };
    console.log("[city-preview] stats", JSON.stringify(window.__stats));
    hud.textContent = `view ${view}  elev ${elev} m\nscene: ${all.calls} calls, ${all.triangles} tris\ncity only: ${c.calls} calls, ${c.triangles} tris\n1-4: elevation 40/90/130/160, drag to look`;
    const breakdown: Record<string, number> = {};
    city.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const g = m.geometry;
      const tris = (g.index ? g.index.count : g.getAttribute("position").count) / 3;
      breakdown[o.name || o.type] = Math.round(tris * ((o as THREE.InstancedMesh).isInstancedMesh ? (o as THREE.InstancedMesh).count : 1));
    });
    window.__breakdown = breakdown;
    window.__ready = true;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
