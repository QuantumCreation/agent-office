// The boss's intern: a little Bloop with no desk who tags along behind you, floor to floor.
// They hang back over your shoulder while you walk, jog to catch up when you get ahead,
// and pop round in front of you when you talk to them.

import * as THREE from "three";
import type { Activity } from "../../shared/types.ts";
import { Bloop } from "./bloop.ts";
import type { NavGrid } from "./nav.ts";
import type { Player } from "./player.ts";

/** Start following once you're farther than this (m). */
const FOLLOW_GAP = 2.3;
/** Keep pace with you (you walk 3.4 m/s, 4.2 when walking yourself over, 6 running). */
const STROLL = 3.4;
const JOG = 4.6;
const RUN = 6.6;
/** Jog beyond this gap, run beyond CATCH_UP. */
const JOG_GAP = 3;
const CATCH_UP = 4.5;
/** How often to re-plan the route while following a moving boss (s). */
const REPATH_S = 0.35;

const yawToward = (from: THREE.Vector3, to: THREE.Vector3) => Math.atan2(to.x - from.x, to.z - from.z);

export interface InternWorld {
  scene: THREE.Scene;
  nav: NavGrid;
  player: Player;
  /** Where people step out of the elevator, and where they walk to leave. */
  elevator: { spawn: THREE.Vector3; exit: THREE.Vector3 };
}

export class InternFollower {
  bloop: Bloop | null = null;
  /** While set, the intern comes round in front of you and stays put (you're talking to them). */
  summoned = false;
  private readonly world: InternWorld;
  private leaving: Bloop[] = [];
  private repath = 0;
  private goal = new THREE.Vector3();

  constructor(world: InternWorld) {
    this.world = world;
  }

  get id() {
    return this.bloop?.id ?? null;
  }

  /**
   * Keep the intern in step with the office: `id` is their thread (null if you don't have one).
   * `arriving` makes a new intern step out of the elevator instead of already being beside you.
   */
  sync(id: string | null, activity: Activity | undefined, arriving = false) {
    if (this.bloop && this.bloop.id !== id) this.depart();
    if (!id) return;
    if (!this.bloop) this.spawn(id, arriving ? this.world.elevator.spawn : null);
    if (activity) this.bloop!.setActivity(activity);
  }

  /** You changed floors: they ride up with you and step out of the elevator behind you. */
  arriveWithBoss() {
    for (const b of this.leaving) b.dispose();
    this.leaving = [];
    const b = this.bloop;
    if (!b) return;
    const activity = b.activity;
    b.dispose();
    this.bloop = null;
    this.spawn(b.id, this.world.elevator.spawn);
    this.bloop!.setActivity(activity);
  }

  /** Laid off: pack a box and take the elevator out. */
  depart() {
    const b = this.bloop;
    if (!b) return;
    this.bloop = null;
    this.summoned = false;
    b.errand = "leaving";
    this.leaving.push(b);
    b.walk([]);
    setTimeout(() => {
      b.setCarrying(true);
      setTimeout(() => b.walk(this.world.nav.find(b.position, this.world.elevator.exit), () => (b.removeWhenArrived = true)), 500);
    }, 400);
  }

  update(dt: number, time: number) {
    for (const b of [...this.leaving]) {
      b.update(dt, time);
      if (!b.removeWhenArrived) continue;
      b.root.scale.multiplyScalar(1 - Math.min(1, dt * 6));
      if (b.root.scale.x < 0.05) {
        b.dispose();
        this.leaving = this.leaving.filter((x) => x !== b);
      }
    }
    const b = this.bloop;
    if (!b) return;
    const boss = this.world.player.position;
    const dist = Math.hypot(boss.x - b.position.x, boss.z - b.position.z);
    this.repath -= dt;
    const want = this.summoned ? this.spotInFront(b) : this.spotBehind(b);
    if (b.isWalking) {
      if (this.repath <= 0 && want.distanceTo(this.goal) > 0.5) this.walkTo(want);
      b.speed = dist > CATCH_UP ? RUN : dist > JOG_GAP ? JOG : STROLL;
    } else {
      const off = this.summoned ? Math.hypot(want.x - b.position.x, want.z - b.position.z) > 0.4 : dist > FOLLOW_GAP;
      if (off && this.repath <= 0) this.walkTo(want);
      else if (dist < 5) b.targetYaw = yawToward(b.position, boss);
    }
    b.update(dt, time);
  }

  private spawn(id: string, at: THREE.Vector3 | null) {
    const b = new Bloop({ id, hat: "sprout", scale: 0.82 });
    b.speed = STROLL;
    this.world.scene.add(b.root);
    const pos = at ?? this.spotBehind(null);
    b.placeStanding(pos, yawToward(pos, this.world.player.position));
    this.bloop = b;
    this.repath = 0;
    this.goal.copy(pos);
  }

  private walkTo(p: THREE.Vector3) {
    const b = this.bloop!;
    this.goal.copy(p);
    this.repath = REPATH_S;
    b.walk(this.world.nav.find(b.position, p));
  }

  /** A free spot just behind you, over your shoulder (whichever side they're already on). */
  private spotBehind(b: Bloop | null) {
    const { player, nav } = this.world;
    const yaw = player.bloop.root.rotation.y;
    const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const right = new THREE.Vector3(fwd.z, 0, -fwd.x);
    const side = b && right.dot(b.position.clone().sub(player.position)) < 0 ? -1 : 1;
    const offsets: [number, number][] = [
      [side * 0.75, -1.25],
      [-side * 0.75, -1.25],
      [0, -1.5],
      [side * 1.2, -0.2],
      [-side * 1.2, -0.2],
    ];
    for (const [r, f] of offsets) {
      const p = player.position.clone().addScaledVector(right, r).addScaledVector(fwd, f).setY(0);
      if (nav.isFreeAt(p)) return p;
    }
    return (b?.position ?? player.position).clone().setY(0);
  }

  /** A free spot in front of you, where you can see them. */
  private spotInFront(b: Bloop) {
    const { player, nav } = this.world;
    const look = player.viewDir();
    const fwd = new THREE.Vector3(look.x, 0, look.z).normalize();
    for (const d of [1.3, 1.0, 0.8]) {
      const p = player.position.clone().addScaledVector(fwd, d).setY(0);
      if (nav.isFreeAt(p)) return p;
    }
    return b.position.clone();
  }
}
