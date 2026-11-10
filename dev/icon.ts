// The Mac app icon: a Bloop, drawn with the game's own code, on a rounded sky tile.
// scripts/render-icon.ts renders this page to assets/app/icon.png (1024x1024, transparent).
// Open /dev/icon.html in the dev server to tweak it by eye.
//
// URL params: hat=sprout, color=#ff9f6e, activity=working

import * as THREE from "three";
import { Bloop } from "../src/world/bloop.ts";
import type { Activity } from "../shared/types.ts";

const q = new URLSearchParams(location.search);
const canvas = document.getElementById("c") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight("#ffffff", "#d8ccb4", 1.55), new THREE.AmbientLight("#fff6e8", 0.35));
const key = new THREE.DirectionalLight("#fff6e6", 1.35);
key.position.set(3, 6, 5);
scene.add(key);

const bloop = new Bloop({
  id: "agent-office-icon",
  color: q.get("color") ?? "#ff9f6e",
  hat: (q.get("hat") ?? "sprout") as ConstructorParameters<typeof Bloop>[0]["hat"],
});
bloop.setActivity((q.get("activity") ?? "working") as Activity);
bloop.root.rotation.y = -0.28;
// Bring the smile out in front of the belly so it reads at small sizes.
(bloop as unknown as { mouth: THREE.Mesh }).mouth.position.set(0, 0.4, 0.33);
scene.add(bloop.root);

const camera = new THREE.PerspectiveCamera(24, canvas.clientWidth / canvas.clientHeight, 0.1, 50);
camera.position.set(0, 0.78, 3.1);
camera.lookAt(0, 0.55, 0);

renderer.render(scene, camera);
document.title = "ready";
