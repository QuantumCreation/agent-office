// Grid navigation: A* over a coarse occupancy grid built from the office colliders,
// followed by line-of-sight smoothing so agents walk in natural straight lines.

import * as THREE from "three";
import type { Box2 } from "./office.ts";
import { ROOM } from "./layout.ts";

const CELL = 0.25;
const AGENT_RADIUS = 0.22;

export class NavGrid {
  readonly cols: number;
  readonly rows: number;
  private blocked: Uint8Array;
  /** Whether the last find() reached its goal (false means it fell back to a straight line). */
  lastFound = true;

  constructor(colliders: Box2[]) {
    this.cols = Math.ceil((ROOM.maxX - ROOM.minX) / CELL);
    this.rows = Math.ceil((ROOM.maxZ - ROOM.minZ) / CELL);
    this.blocked = new Uint8Array(this.cols * this.rows);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = ROOM.minX + (c + 0.5) * CELL;
        const z = ROOM.minZ + (r + 0.5) * CELL;
        for (const b of colliders) {
          if (x > b.minX - AGENT_RADIUS && x < b.maxX + AGENT_RADIUS && z > b.minZ - AGENT_RADIUS && z < b.maxZ + AGENT_RADIUS) {
            this.blocked[r * this.cols + c] = 1;
            break;
          }
        }
      }
    }
  }

  private cellOf(p: THREE.Vector3): [number, number] {
    const c = Math.min(this.cols - 1, Math.max(0, Math.floor((p.x - ROOM.minX) / CELL)));
    const r = Math.min(this.rows - 1, Math.max(0, Math.floor((p.z - ROOM.minZ) / CELL)));
    return [c, r];
  }

  private center(c: number, r: number) {
    return new THREE.Vector3(ROOM.minX + (c + 0.5) * CELL, 0, ROOM.minZ + (r + 0.5) * CELL);
  }

  private free(c: number, r: number) {
    return c >= 0 && r >= 0 && c < this.cols && r < this.rows && !this.blocked[r * this.cols + c];
  }

  private nearestFree(c: number, r: number): [number, number] {
    if (this.free(c, r)) return [c, r];
    for (let rad = 1; rad < 12; rad++) {
      let best: [number, number] | null = null;
      let bestD = Infinity;
      for (let dr = -rad; dr <= rad; dr++) {
        for (let dc = -rad; dc <= rad; dc++) {
          if (Math.max(Math.abs(dr), Math.abs(dc)) !== rad) continue;
          if (this.free(c + dc, r + dr)) {
            const d = dc * dc + dr * dr;
            if (d < bestD) {
              bestD = d;
              best = [c + dc, r + dr];
            }
          }
        }
      }
      if (best) return best;
    }
    return [c, r];
  }

  isFreeAt(p: THREE.Vector3) {
    const [c, r] = this.cellOf(p);
    return this.free(c, r);
  }

  /** Path from `from` to `to`. The last point is always exactly `to`, even if it sits in a chair. */
  find(from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3[] {
    const [sc, sr] = this.nearestFree(...this.cellOf(from));
    const [gc, gr] = this.nearestFree(...this.cellOf(to));
    const n = this.cols * this.rows;
    const g = new Float32Array(n).fill(Infinity);
    const parent = new Int32Array(n).fill(-1);
    const closed = new Uint8Array(n);
    const start = sr * this.cols + sc;
    const goal = gr * this.cols + gc;
    g[start] = 0;
    const heap = new MinHeap();
    const h = (i: number) => {
      const dc = Math.abs((i % this.cols) - gc);
      const dr = Math.abs(Math.floor(i / this.cols) - gr);
      return Math.max(dc, dr) + 0.414 * Math.min(dc, dr);
    };
    heap.push(start, h(start));
    let found = false;
    while (heap.size) {
      const cur = heap.pop();
      if (cur === goal) {
        found = true;
        break;
      }
      if (closed[cur]) continue;
      closed[cur] = 1;
      const cc = cur % this.cols;
      const cr = Math.floor(cur / this.cols);
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const nc = cc + dc;
          const nr = cr + dr;
          if (!this.free(nc, nr)) continue;
          if (dr && dc && (!this.free(cc + dc, cr) || !this.free(cc, cr + dr))) continue;
          const ni = nr * this.cols + nc;
          if (closed[ni]) continue;
          const ng = g[cur] + (dr && dc ? 1.414 : 1);
          if (ng < g[ni]) {
            g[ni] = ng;
            parent[ni] = cur;
            heap.push(ni, ng + h(ni));
          }
        }
      }
    }
    this.lastFound = found;
    if (!found) return [to.clone()];
    const cells: number[] = [];
    for (let i = goal; i !== -1; i = parent[i]) cells.push(i);
    cells.reverse();
    const pts = cells.map((i) => this.center(i % this.cols, Math.floor(i / this.cols)));
    // Smooth: keep the farthest visible point each step.
    const out: THREE.Vector3[] = [];
    let anchor = from.clone();
    let i = 0;
    while (i < pts.length) {
      let j = pts.length - 1;
      while (j > i && !this.lineFree(anchor, pts[j])) j--;
      out.push(pts[j]);
      anchor = pts[j];
      i = j + 1;
    }
    out.push(to.clone());
    return out;
  }

  private lineFree(a: THREE.Vector3, b: THREE.Vector3) {
    const d = a.distanceTo(b);
    const steps = Math.ceil(d / (CELL * 0.5));
    const p = new THREE.Vector3();
    for (let s = 1; s < steps; s++) {
      p.lerpVectors(a, b, s / steps);
      const [c, r] = this.cellOf(p);
      if (!this.free(c, r)) return false;
    }
    return true;
  }
}

class MinHeap {
  private items: number[] = [];
  private prio: number[] = [];
  get size() {
    return this.items.length;
  }
  push(item: number, p: number) {
    this.items.push(item);
    this.prio.push(p);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.prio[parent] <= this.prio[i]) break;
      this.swap(i, parent);
      i = parent;
    }
  }
  pop(): number {
    const top = this.items[0];
    const lastItem = this.items.pop()!;
    const lastPrio = this.prio.pop()!;
    if (this.items.length) {
      this.items[0] = lastItem;
      this.prio[0] = lastPrio;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < this.items.length && this.prio[l] < this.prio[m]) m = l;
        if (r < this.items.length && this.prio[r] < this.prio[m]) m = r;
        if (m === i) break;
        this.swap(i, m);
        i = m;
      }
    }
    return top;
  }
  private swap(a: number, b: number) {
    [this.items[a], this.items[b]] = [this.items[b], this.items[a]];
    [this.prio[a], this.prio[b]] = [this.prio[b], this.prio[a]];
  }
}

/** Pushes a circle out of axis-aligned boxes (player collision). */
export function resolveCircle(p: THREE.Vector3, radius: number, colliders: Box2[]) {
  for (const b of colliders) {
    const cx = Math.max(b.minX, Math.min(p.x, b.maxX));
    const cz = Math.max(b.minZ, Math.min(p.z, b.maxZ));
    const dx = p.x - cx;
    const dz = p.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= radius * radius) continue;
    if (d2 > 1e-8) {
      const d = Math.sqrt(d2);
      p.x = cx + (dx / d) * radius;
      p.z = cz + (dz / d) * radius;
    } else {
      // Center inside the box: push out along the shallowest axis.
      const pushes = [
        [b.minX - radius - p.x, 0],
        [b.maxX + radius - p.x, 0],
        [0, b.minZ - radius - p.z],
        [0, b.maxZ + radius - p.z],
      ];
      pushes.sort((u, v) => Math.abs(u[0] + u[1]) - Math.abs(v[0] + v[1]));
      p.x += pushes[0][0];
      p.z += pushes[0][1];
    }
  }
}
