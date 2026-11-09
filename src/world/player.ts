// The boss (you). First person by default, like a normal FPS: click into the view to
// capture the mouse (cursor hidden, unlimited turning), WASD to walk, Esc to free the
// cursor. V switches to an over-the-shoulder overview camera with drag-to-orbit.

import * as THREE from "three";
import { Bloop } from "./bloop.ts";
import type { Box2 } from "./office.ts";
import { resolveCircle, type NavGrid } from "./nav.ts";
import { ROOM } from "./layout.ts";

const EYE_HEIGHT = 1.5;
const LOOK_SPEED = 0.0022;

export type ViewMode = "first" | "third";

export class Player {
  readonly bloop: Bloop;
  /** Heading: forward is (sin yaw, 0, cos yaw). */
  yaw = Math.PI / 2;
  /** Look up/down in first person. */
  pitch = -0.12;
  view: ViewMode = (localStorage.getItem("office.view") as ViewMode) === "third" ? "third" : "first";
  distance = 8;
  private tpPitch = 0.6;
  private keys = new Set<string>();
  private autoPath: THREE.Vector3[] = [];
  private autoArrive: (() => void) | null = null;
  private autoFace: THREE.Vector3 | null = null;
  private camTarget = new THREE.Vector3();
  private camHoriz = 6;
  private camVert = 4.5;
  private bobPhase = 0;
  private dragging = false;
  private dragMoved = 0;
  private lastX = 0;
  private lastY = 0;
  private readonly dom: HTMLElement;
  inputEnabled = () => true;
  /** Called when the browser refuses to capture the mouse. */
  onLockError: () => void = () => {};

  constructor(dom: HTMLElement) {
    this.dom = dom;
    this.bloop = new Bloop({ id: "boss", color: "#4a5fa8", hat: "crown", scale: 1.25 });
    this.bloop.root.visible = this.view === "third";

    window.addEventListener("keydown", (e) => {
      if (!this.inputEnabled() || isTyping()) return;
      this.keys.add(e.code);
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        this.cancelAuto();
      }
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("blur", () => this.keys.clear());

    // Mouse look: captured mouse in first person, click-drag in third person.
    dom.addEventListener("pointerdown", (e) => {
      this.dragging = true;
      this.dragMoved = 0;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    });
    // Raw mousemove (not pointermove) so captured-mouse deltas arrive unthrottled.
    document.addEventListener("mousemove", (e) => {
      if (!this.isLocked) return;
      // Browsers occasionally report a huge bogus jump right after capturing; drop it.
      if (Math.abs(e.movementX) > 400 || Math.abs(e.movementY) > 400) return;
      this.look(e.movementX, e.movementY);
    });
    document.addEventListener("pointerlockerror", () => this.onLockError());
    window.addEventListener("pointermove", (e) => {
      if (this.isLocked || this.view === "first" || !this.dragging) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.dragMoved += Math.abs(dx) + Math.abs(dy);
      if (this.dragMoved > 4) this.look(dx * 1.4, dy * 1.4);
    });
    window.addEventListener("pointerup", () => (this.dragging = false));
    dom.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        if (this.view === "third") this.distance = THREE.MathUtils.clamp(this.distance * (1 + e.deltaY * 0.0012), 3, 22);
      },
      { passive: false },
    );
  }

  private look(dx: number, dy: number) {
    this.yaw -= dx * LOOK_SPEED;
    if (this.view === "first") {
      this.pitch = THREE.MathUtils.clamp(this.pitch - dy * LOOK_SPEED, -1.35, 1.25);
    } else {
      this.tpPitch = THREE.MathUtils.clamp(this.tpPitch + dy * LOOK_SPEED, 0.18, 1.35);
    }
  }

  get isLocked() {
    return document.pointerLockElement === this.dom;
  }

  /** Capture the mouse. Must be called from a click or key press (browser rule). */
  lock() {
    if (this.view !== "first" || this.isLocked) return;
    const plain = () => {
      try {
        const req = this.dom.requestPointerLock() as unknown;
        if (req instanceof Promise) req.catch(() => {});
      } catch {
        this.onLockError();
      }
    };
    try {
      // Raw, un-accelerated mouse input where supported (feels like a real game).
      const req = (this.dom.requestPointerLock as (o?: object) => unknown).call(this.dom, { unadjustedMovement: true });
      if (req instanceof Promise) req.catch(plain);
    } catch {
      plain();
    }
  }

  unlock() {
    if (this.isLocked) document.exitPointerLock();
  }

  toggleView() {
    this.view = this.view === "first" ? "third" : "first";
    localStorage.setItem("office.view", this.view);
    this.bloop.root.visible = this.view === "third";
    if (this.view === "third") this.unlock();
    this.camTarget.copy(this.position).setY(1.1);
  }

  /** True if the last pointer gesture was a drag (so it shouldn't count as a click). */
  get wasDrag() {
    return this.view === "third" && this.dragMoved > 4;
  }

  get position() {
    return this.bloop.root.position;
  }

  /** Unit vector the player is looking along. */
  viewDir(out = new THREE.Vector3()) {
    const p = this.view === "first" ? this.pitch : -0.2;
    const cp = Math.cos(p);
    return out.set(Math.sin(this.yaw) * cp, Math.sin(p), Math.cos(this.yaw) * cp).normalize();
  }

  eye(out = new THREE.Vector3()) {
    return out.copy(this.position).setY(EYE_HEIGHT);
  }

  goTo(nav: NavGrid, target: THREE.Vector3, onArrive?: () => void, stopShort = 1.0) {
    const path = nav.find(this.position, target);
    // Stop a little short of the target so we stand in front of it.
    const last = path[path.length - 1];
    const prev = path.length > 1 ? path[path.length - 2] : this.position;
    const d = last.distanceTo(prev);
    if (d > stopShort) last.lerp(prev, stopShort / d);
    else path.pop();
    this.autoPath = path;
    this.autoArrive = onArrive ?? null;
    this.autoFace = target.clone();
    if (!path.length) {
      this.faceTowards(target);
      this.autoArrive = null;
      this.autoFace = null;
      onArrive?.();
    }
  }

  faceTowards(p: THREE.Vector3) {
    this.yaw = Math.atan2(p.x - this.position.x, p.z - this.position.z);
    if (this.view === "first") this.pitch = -0.3;
  }

  cancelAuto() {
    this.autoPath = [];
    this.autoArrive = null;
    this.autoFace = null;
  }

  teleport(pos: THREE.Vector3, yaw: number) {
    this.position.copy(pos);
    this.bloop.root.rotation.y = this.bloop.targetYaw = yaw;
    this.yaw = yaw;
    this.pitch = -0.12;
    this.cancelAuto();
    this.camTarget.copy(pos).setY(1.1);
  }

  update(dt: number, colliders: Box2[]) {
    const input = new THREE.Vector2();
    if (this.inputEnabled() && !isTyping()) {
      if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) input.y += 1;
      if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) input.y -= 1;
      if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) input.x -= 1;
      if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) input.x += 1;
    }
    const run = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");
    const speed = run ? 6.0 : 3.4;
    const pos = this.position;
    let moving = false;
    if (input.lengthSq() > 0) {
      input.normalize();
      const fwd = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
      const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
      const move = fwd.multiplyScalar(input.y).add(right.multiplyScalar(input.x));
      pos.addScaledVector(move, speed * dt);
      this.bloop.targetYaw = Math.atan2(move.x, move.z);
      moving = true;
    } else if (this.autoPath.length) {
      const target = this.autoPath[0];
      const dx = target.x - pos.x;
      const dz = target.z - pos.z;
      const dist = Math.hypot(dx, dz);
      const step = 4.2 * dt;
      if (dist <= step) {
        pos.x = target.x;
        pos.z = target.z;
        this.autoPath.shift();
        if (!this.autoPath.length) {
          if (this.autoFace) this.faceTowards(this.autoFace);
          this.autoFace = null;
          const cb = this.autoArrive;
          this.autoArrive = null;
          cb?.();
        }
      } else {
        pos.x += (dx / dist) * step;
        pos.z += (dz / dist) * step;
        const heading = Math.atan2(dx, dz);
        this.bloop.targetYaw = heading;
        if (this.view === "first") {
          // Smoothly turn the view toward where we're walking.
          let d = heading - this.yaw;
          d = Math.atan2(Math.sin(d), Math.cos(d));
          this.yaw += d * Math.min(1, dt * 6);
          this.pitch += (-0.1 - this.pitch) * Math.min(1, dt * 3);
        }
      }
      moving = true;
    }
    if (this.view === "first" && !moving) this.bloop.targetYaw = this.yaw;
    resolveCircle(pos, this.view === "first" ? 0.3 : 0.38, colliders);
    pos.x = THREE.MathUtils.clamp(pos.x, ROOM.minX + 0.35, ROOM.maxX - 0.35);
    pos.z = THREE.MathUtils.clamp(pos.z, ROOM.minZ + 0.35, ROOM.maxZ - 0.35);
    this.bloop.mode = moving ? "walk" : "stand";
    this.bloop.update(dt, performance.now() / 1000);
    this.bobPhase = moving ? this.bobPhase + dt * (run ? 13 : 9) : 0;
  }

  updateCamera(camera: THREE.PerspectiveCamera, dt: number) {
    if (this.view === "first") {
      const bob = Math.sin(this.bobPhase) * 0.035;
      camera.position.copy(this.position).setY(EYE_HEIGHT + bob);
      camera.lookAt(camera.position.clone().add(this.viewDir()));
      this.camTarget.copy(this.position).setY(1.1);
      return;
    }
    const target = this.position.clone().setY(1.1);
    this.camTarget.lerp(target, Math.min(1, dt * 8));
    // Over-the-shoulder overview. When a wall limits how far back the camera can go,
    // it cranes up instead, so you look down over the player rather than into a wall.
    const t = this.camTarget;
    const hx = -Math.sin(this.yaw);
    const hz = -Math.cos(this.yaw);
    const m = 0.5;
    let maxH = Infinity;
    if (hx > 1e-4) maxH = Math.min(maxH, (ROOM.maxX - m - t.x) / hx);
    if (hx < -1e-4) maxH = Math.min(maxH, (ROOM.minX + m - t.x) / hx);
    if (hz > 1e-4) maxH = Math.min(maxH, (ROOM.maxZ - m - t.z) / hz);
    if (hz < -1e-4) maxH = Math.min(maxH, (ROOM.minZ + m - t.z) / hz);
    maxH = Math.max(0.3, maxH);
    let horiz = Math.cos(this.tpPitch) * this.distance;
    let vert = Math.sin(this.tpPitch) * this.distance;
    if (horiz > maxH) {
      horiz = maxH;
      vert = Math.sqrt(Math.max(0, this.distance * this.distance - horiz * horiz));
    }
    this.camHoriz += (horiz - this.camHoriz) * Math.min(1, dt * 8);
    if (this.camHoriz > maxH) this.camHoriz = maxH;
    this.camVert += (vert - this.camVert) * Math.min(1, dt * 8);
    camera.position.set(t.x + hx * this.camHoriz, t.y + this.camVert, t.z + hz * this.camHoriz);
    camera.lookAt(t);
  }
}

export function isTyping() {
  const el = document.activeElement;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || (el as HTMLElement).isContentEditable);
}
