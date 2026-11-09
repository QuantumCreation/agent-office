// Renders the office floor plan (src/world/floorplan.ts) as an architectural 2D drawing.
// Usage: node scripts/floorplan-svg.ts [out.svg]   (default: docs/floorplan.svg)

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  BOARD_FRONT,
  CEILING_HEIGHT,
  COLUMNS,
  COLUMN_SIZE,
  CORE_WALL,
  DESKS,
  DESK_D,
  DESK_W,
  ELEVATOR_DOORS,
  EXTERIOR_WALL,
  FURNITURE,
  HANGOUTS,
  INTERIOR_WALL,
  ISSUE_BOARD,
  MEETING_SEATS,
  PLATE,
  PM_DESK,
  ROOMS,
  SPAWN,
  WALLS,
  deskChairs,
  type Finish,
  type Furniture,
  type Wall,
} from "../src/world/floorplan.ts";

const S = 30; // px per meter
const M = 110; // margin px
const W = (PLATE.maxX - PLATE.minX) * S + M * 2;
const H = (PLATE.maxZ - PLATE.minZ) * S + M * 2 + 120;
const X = (x: number) => +(M + (x - PLATE.minX) * S).toFixed(1);
const Z = (z: number) => +(M + (z - PLATE.minZ) * S).toFixed(1);
const L = (m: number) => +(m * S).toFixed(1);

const FILL: Record<Finish, string> = {
  carpet: "#e8eef7",
  "carpet-accent": "#e9e4f3",
  wood: "#f3e6d3",
  tile: "#eef2ee",
  vinyl: "#f4f4f1",
  concrete: "#e2e2e2",
  stone: "#ecebe6",
};

const out: string[] = [];
const push = (s: string) => out.push(s);

push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Helvetica, Arial, sans-serif">`);
push(`<defs>
  <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#c9c9c9" stroke-width="1.2"/></pattern>
  <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#555"/></marker>
</defs>`);
push(`<rect width="100%" height="100%" fill="#ffffff"/>`);

// Structural grid
const gridX = [-18, -9, 0, 9, 18];
const gridZ = [-13, -4.25, 4.25, 13];
gridX.forEach((x, i) => {
  push(`<line x1="${X(x)}" y1="${Z(PLATE.minZ) - 55}" x2="${X(x)}" y2="${Z(PLATE.maxZ) + 30}" stroke="#d6d6d6" stroke-dasharray="8 4 2 4" stroke-width="1"/>`);
  push(`<circle cx="${X(x)}" cy="${Z(PLATE.minZ) - 68}" r="12" fill="#fff" stroke="#888"/><text x="${X(x)}" y="${Z(PLATE.minZ) - 64}" font-size="12" text-anchor="middle" fill="#555">${"ABCDE"[i]}</text>`);
});
gridZ.forEach((z, i) => {
  push(`<line x1="${X(PLATE.minX) - 55}" y1="${Z(z)}" x2="${X(PLATE.maxX) + 30}" y2="${Z(z)}" stroke="#d6d6d6" stroke-dasharray="8 4 2 4" stroke-width="1"/>`);
  push(`<circle cx="${X(PLATE.minX) - 68}" cy="${Z(z)}" r="12" fill="#fff" stroke="#888"/><text x="${X(PLATE.minX) - 68}" y="${Z(z) + 4}" font-size="12" text-anchor="middle" fill="#555">${i + 1}</text>`);
});

// Rooms
for (const r of ROOMS) {
  const [x0, z0, x1, z1] = r.rect;
  push(`<rect x="${X(x0)}" y="${Z(z0)}" width="${L(x1 - x0)}" height="${L(z1 - z0)}" fill="${FILL[r.finish]}"/>`);
  if (r.service) push(`<rect x="${X(x0)}" y="${Z(z0)}" width="${L(x1 - x0)}" height="${L(z1 - z0)}" fill="url(#hatch)" opacity="0.35"/>`);
}

// Furniture
function furniture(f: Furniture) {
  const deg = (-f.rot * 180) / Math.PI;
  const t = `transform="translate(${X(f.x)} ${Z(f.z)}) rotate(${deg})"`;
  const w = L(f.w);
  const d = L(f.d);
  const box = (fill: string, stroke = "#9a9a9a", rx = 2) => `<rect x="${-w / 2}" y="${-d / 2}" width="${w}" height="${d}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`;
  switch (f.kind) {
    case "chair":
      return `<g ${t}><rect x="${-w / 2 + 2}" y="${-d / 2 + 2}" width="${w - 4}" height="${d - 4}" rx="4" fill="#fff" stroke="#9a9a9a"/><line x1="${-w / 2 + 3}" y1="${-d / 2 + 3}" x2="${w / 2 - 3}" y2="${-d / 2 + 3}" stroke="#777" stroke-width="2.5"/></g>`;
    case "stool":
      return `<g ${t}><circle r="${w / 2}" fill="#fff" stroke="#9a9a9a"/></g>`;
    case "table-round":
      return `<g ${t}><circle r="${w / 2}" fill="#fff" stroke="#8a8a8a"/></g>`;
    case "sofa":
      return `<g ${t}>${box("#fff", "#8a8a8a", 5)}<rect x="${-w / 2}" y="${-d / 2}" width="${w}" height="${L(0.25)}" rx="4" fill="#ddd" stroke="#8a8a8a"/></g>`;
    case "armchair":
      return `<g ${t}>${box("#fff", "#8a8a8a", 6)}<rect x="${-w / 2}" y="${-d / 2}" width="${w}" height="${L(0.22)}" rx="4" fill="#ddd" stroke="#8a8a8a"/></g>`;
    case "beanbag":
      return `<g ${t}><ellipse rx="${w / 2}" ry="${d / 2}" fill="#fff" stroke="#9a9a9a"/></g>`;
    case "rug":
      return `<g ${t}>${box("none", "#c4b9a6", 6).replace('stroke-width="1"', 'stroke-width="1" stroke-dasharray="4 3"')}</g>`;
    case "plant":
      return `<g ${t}><circle r="${w / 2}" fill="#d9eed9" stroke="#7fb27f"/><circle r="${w / 5}" fill="#9fd09f"/></g>`;
    case "stall":
      return `<g ${t}><rect x="${-w / 2}" y="${-d / 2}" width="${w}" height="${d}" fill="none" stroke="#aaa" stroke-width="1"/><line x1="${-w / 2 + 3}" y1="${d / 2}" x2="${w / 2 - 3}" y2="${d / 2}" stroke="#fff" stroke-width="3"/></g>`;
    case "toilet":
      return `<g ${t}><rect x="${-w / 2}" y="${-d / 2}" width="${w}" height="${L(0.18)}" fill="#fff" stroke="#999"/><ellipse cy="${L(0.1)}" rx="${w / 2.4}" ry="${d / 3}" fill="#fff" stroke="#999"/></g>`;
    case "stair": {
      // Switchback stair: 1.2 m landing at the door end (local +z), 11 treads per flight,
      // 1.12 m turning landing at the far end. Up flight on the left, down on the right.
      const half = w / 2;
      const landDoor = L(1.2);
      const landFar = L(1.12);
      const treads: string[] = [];
      const y0 = -d / 2 + landFar;
      const y1 = d / 2 - landDoor;
      for (let i = 0; i <= 11; i++) {
        const y = y0 + ((y1 - y0) * i) / 11;
        treads.push(`<line x1="${-half}" y1="${y}" x2="-3" y2="${y}" stroke="#999"/><line x1="3" y1="${y}" x2="${half}" y2="${y}" stroke="#999"/>`);
      }
      return `<g ${t}>${box("#f4f4f4", "#777", 0)}${treads.join("")}<line x1="0" y1="${y0}" x2="0" y2="${y1}" stroke="#777" stroke-width="2"/><path d="M ${-half / 2} ${y1 - 4} L ${-half / 2} ${y0 + 6}" stroke="#555" marker-end="url(#arrow)"/><path d="M ${half / 2} ${y0 + 6} L ${half / 2} ${y1 - 4}" stroke="#555" marker-end="url(#arrow)"/></g>`;
    }
    case "elevator-car":
      return `<g ${t}>${box("#f7f7f7", "#777", 0)}<line x1="${-w / 2}" y1="${-d / 2}" x2="${w / 2}" y2="${d / 2}" stroke="#aaa"/><line x1="${w / 2}" y1="${-d / 2}" x2="${-w / 2}" y2="${d / 2}" stroke="#aaa"/></g>`;
    case "divider":
      return `<g ${t}><rect x="${-1.5}" y="${-d / 2}" width="3" height="${d}" fill="#888"/></g>`;
    case "tv":
    case "whiteboard":
      return `<g ${t}><rect x="${-w / 2}" y="-2" width="${w}" height="4" fill="${f.kind === "tv" ? "#333" : "#7aa7d8"}"/></g>`;
    case "counter":
    case "bar-counter":
    case "planter":
    case "drinking-fountain":
    case "island":
    case "reception-desk":
    case "credenza":
    case "sink-counter":
      return `<g ${t}>${box("#f1f1f1", "#7a7a7a", 1)}</g>`;
    default:
      return `<g ${t}>${box("#fff")}</g>`;
  }
}

for (const f of FURNITURE) push(furniture(f));
for (const f of deskChairs()) push(furniture(f));
// Desks with monitors
for (const d of [...DESKS, PM_DESK]) {
  const along = d.facing[0] !== 0; // desks whose agents face east/west are long in z
  const w = along ? DESK_D : DESK_W;
  const h = along ? DESK_W : DESK_D;
  push(`<rect x="${X(d.desk[0] - w / 2)}" y="${Z(d.desk[1] - h / 2)}" width="${L(w)}" height="${L(h)}" fill="${d.index < 0 ? "#fff3d6" : "#fbf6ec"}" stroke="#8a7a5a" stroke-width="1"/>`);
  const mx = d.desk[0] + d.facing[0] * 0.22;
  const mz = d.desk[1] + d.facing[1] * 0.22;
  const mw = along ? 0.06 : 0.6;
  const mh = along ? 0.6 : 0.06;
  push(`<rect x="${X(mx - mw / 2)}" y="${Z(mz - mh / 2)}" width="${L(mw)}" height="${L(mh)}" fill="#555"/>`);
}
// Issue board
{
  const b = ISSUE_BOARD;
  push(`<rect x="${X(b.x - b.width / 2)}" y="${Z(b.z) - 3}" width="${L(b.width)}" height="5" fill="#f2b632"/>`);
}

// Walls
function segments(w: Wall) {
  const len = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
  const cuts = (w.openings ?? []).map((o) => [o.at - o.width / 2, o.at + o.width / 2]).sort((p, q) => p[0] - q[0]);
  const segs: [number, number][] = [];
  let cur = 0;
  for (const [s0, s1] of cuts) {
    if (s0 > cur) segs.push([cur, s0]);
    cur = Math.max(cur, s1);
  }
  if (cur < len) segs.push([cur, len]);
  return { len, segs };
}

const WALL_STYLE: Record<Wall["kind"], { t: number; color: string }> = {
  exterior: { t: EXTERIOR_WALL, color: "#3b3b3b" },
  core: { t: CORE_WALL, color: "#4a4a4a" },
  partition: { t: INTERIOR_WALL, color: "#5c5c5c" },
  glass: { t: 0.08, color: "#5aa0d8" },
};

for (const w of WALLS) {
  const { len, segs } = segments(w);
  const dx = (w.b[0] - w.a[0]) / len;
  const dz = (w.b[1] - w.a[1]) / len;
  const at = (s: number) => [w.a[0] + dx * s, w.a[1] + dz * s];
  const st = { ...WALL_STYLE[w.kind], t: w.thickness ?? WALL_STYLE[w.kind].t };
  for (const [s0, s1] of segs) {
    const [x0, z0] = at(s0);
    const [x1, z1] = at(s1);
    if (w.kind === "exterior") {
      // Curtain wall: outer frame line, glass line, mullions every 1.5 m
      const nx = -dz;
      const nz = dx; // points inward for the clockwise exterior loop
      const o = EXTERIOR_WALL / 2;
      push(`<line x1="${X(x0 - nx * o)}" y1="${Z(z0 - nz * o)}" x2="${X(x1 - nx * o)}" y2="${Z(z1 - nz * o)}" stroke="#3b3b3b" stroke-width="3"/>`);
      push(`<line x1="${X(x0)}" y1="${Z(z0)}" x2="${X(x1)}" y2="${Z(z1)}" stroke="#5aa0d8" stroke-width="1.5"/>`);
      push(`<line x1="${X(x0 + nx * o)}" y1="${Z(z0 + nz * o)}" x2="${X(x1 + nx * o)}" y2="${Z(z1 + nz * o)}" stroke="#3b3b3b" stroke-width="1"/>`);
      for (let s = s0; s <= s1 + 1e-6; s += 1.5) {
        const [mx, mz] = at(s);
        push(`<line x1="${X(mx - nx * o)}" y1="${Z(mz - nz * o)}" x2="${X(mx + nx * o)}" y2="${Z(mz + nz * o)}" stroke="#3b3b3b" stroke-width="1.5"/>`);
      }
    } else if (w.kind === "glass") {
      push(`<line x1="${X(x0)}" y1="${Z(z0)}" x2="${X(x1)}" y2="${Z(z1)}" stroke="#5aa0d8" stroke-width="${L(st.t)}" stroke-opacity="0.45"/>`);
      push(`<line x1="${X(x0)}" y1="${Z(z0)}" x2="${X(x1)}" y2="${Z(z1)}" stroke="#2f7fc0" stroke-width="1"/>`);
    } else {
      push(`<line x1="${X(x0)}" y1="${Z(z0)}" x2="${X(x1)}" y2="${Z(z1)}" stroke="${st.color}" stroke-width="${L(st.t)}" stroke-linecap="square"/>`);
    }
  }
  // Openings: door leaves and swings
  for (const o of w.openings ?? []) {
    const [hx, hz] = at(o.at - o.width / 2); // hinge
    const [ex, ez] = at(o.at + o.width / 2);
    if (o.kind === "elevator") {
      const [cx, cz] = at(o.at);
      push(`<line x1="${X(hx)}" y1="${Z(hz)}" x2="${X(ex)}" y2="${Z(ez)}" stroke="#777" stroke-width="2" stroke-dasharray="3 2"/>`);
      push(`<text x="${X(cx)}" y="${Z(cz) + 16}" font-size="9" text-anchor="middle" fill="#555">LIFT</text>`);
      continue;
    }
    if (o.kind === "opening") continue;
    const side = o.swing ?? 1;
    const nx = dz * side;
    const nz = -dx * side;
    const lx = hx + nx * o.width;
    const lz = hz + nz * o.width;
    const color = o.kind === "glass-door" ? "#2f7fc0" : "#333";
    push(`<line x1="${X(hx)}" y1="${Z(hz)}" x2="${X(lx)}" y2="${Z(lz)}" stroke="${color}" stroke-width="1.5"/>`);
    const sweep = side > 0 ? 0 : 1;
    push(`<path d="M ${X(lx)} ${Z(lz)} A ${L(o.width)} ${L(o.width)} 0 0 ${sweep} ${X(ex)} ${Z(ez)}" fill="none" stroke="${color}" stroke-width="0.8" stroke-dasharray="3 2"/>`);
    if (o.kind === "stair-door") {
      const [cx, cz] = at(o.at);
      push(`<rect x="${X(cx) - 15}" y="${Z(cz) - 22}" width="30" height="12" rx="2" fill="#2e9e5a"/><text x="${X(cx)}" y="${Z(cz) - 13}" font-size="9" font-weight="bold" text-anchor="middle" fill="#fff">EXIT</text>`);
    }
  }
}

// Columns
for (const [x, z] of COLUMNS) {
  const c = COLUMN_SIZE;
  push(`<rect x="${X(x - c / 2)}" y="${Z(z - c / 2)}" width="${L(c)}" height="${L(c)}" fill="#222"/>`);
}

// Room labels
for (const r of ROOMS) {
  if (!r.name) continue;
  const [x0, z0, x1, z1] = r.rect;
  const cx = (x0 + x1) / 2;
  let cz = (z0 + z1) / 2;
  if (r.id === "workspace") cz = -6.85;
  if (r.id === "lounge") cz = 8.45;
  if (r.id === "kitchen") cz = 7.0;
  if (r.id === "collab") cz = 5.2;
  if (r.id === "hub") cz = -7.3;
  if (r.id === "boardroom") cz = -12.3;
  if (r.id === "meeting-b") cz = -6.0;
  if (r.id === "focus-bar") cz = 10.6;
  const area = (x1 - x0) * (z1 - z0);
  if (r.id === "lobby") {
    push(`<text x="${X(-3.5)}" y="${Z(6.6)}" font-size="12" font-weight="bold" text-anchor="middle" fill="#333">Elevator lobby &amp; reception</text>`);
    push(`<text x="${X(-3.5)}" y="${Z(6.6) + 14}" font-size="10" text-anchor="middle" fill="#777">${area.toFixed(0)} m²</text>`);
    continue;
  }
  const small = (x1 - x0) < 3.6 || (z1 - z0) < 2.4;
  const vertical = r.id === "aisle-w" || r.id === "aisle-e";
  const rot = vertical ? ` transform="rotate(-90 ${X(cx)} ${Z(cz)})"` : "";
  push(`<text x="${X(cx)}" y="${Z(cz)}" font-size="${small ? 9.5 : 12}" font-weight="bold" text-anchor="middle" fill="#333"${rot}>${r.name}</text>`);
  if (!vertical && !r.id.startsWith("aisle")) {
    push(`<text x="${X(cx)}" y="${Z(cz) + (small ? 11 : 14)}" font-size="${small ? 8.5 : 10}" text-anchor="middle" fill="#777">${area.toFixed(area < 10 ? 1 : 0)} m²</text>`);
  }
}

// Game markers (agent seats, spawn, board front)
for (const s of MEETING_SEATS) push(`<circle cx="${X(s.pos[0])}" cy="${Z(s.pos[1])}" r="3" fill="#ff8a5c"/>`);
for (const s of HANGOUTS) push(`<circle cx="${X(s.pos[0])}" cy="${Z(s.pos[1])}" r="3" fill="#43b37a"/>`);
for (const d of [...DESKS, PM_DESK]) push(`<text x="${X(d.desk[0])}" y="${Z(d.desk[1]) + 3}" font-size="8" text-anchor="middle" fill="#8a7a5a">${d.index < 0 ? "PM" : d.index + 1}</text>`);
push(`<circle cx="${X(SPAWN[0])}" cy="${Z(SPAWN[1])}" r="4" fill="none" stroke="#c03" stroke-width="1.5"/>`);
push(`<circle cx="${X(BOARD_FRONT[0])}" cy="${Z(BOARD_FRONT[1])}" r="4" fill="none" stroke="#f2b632" stroke-width="1.5"/>`);
void ELEVATOR_DOORS;

// Dimensions
function dim(x0: number, z0: number, x1: number, z1: number, label: string, off: number) {
  const horiz = z0 === z1;
  const ax = X(x0) + (horiz ? 0 : off);
  const az = Z(z0) + (horiz ? off : 0);
  const bx = X(x1) + (horiz ? 0 : off);
  const bz = Z(z1) + (horiz ? off : 0);
  push(`<line x1="${ax}" y1="${az}" x2="${bx}" y2="${bz}" stroke="#555" marker-start="url(#arrow)" marker-end="url(#arrow)"/>`);
  const mx = (ax + bx) / 2;
  const mz = (az + bz) / 2;
  push(`<text x="${mx}" y="${mz - 5}" font-size="11" text-anchor="middle" fill="#333"${horiz ? "" : ` transform="rotate(-90 ${mx - 6} ${mz})"`}>${label}</text>`);
}
dim(PLATE.minX, PLATE.minZ, PLATE.maxX, PLATE.minZ, "36.0 m", -32);
dim(PLATE.minX, PLATE.minZ, PLATE.minX, PLATE.maxZ, "26.0 m", -32);
for (let i = 0; i < gridX.length - 1; i++) dim(gridX[i], PLATE.maxZ, gridX[i + 1], PLATE.maxZ, "9.0 m", 26);
dim(PLATE.maxX, PLATE.minZ, PLATE.maxX, -4.25, "8.75 m", 26);
dim(PLATE.maxX, -4.25, PLATE.maxX, 4.25, "8.5 m", 26);
dim(PLATE.maxX, 4.25, PLATE.maxX, PLATE.maxZ, "8.75 m", 26);

// Title block, scale bar, north arrow, legend
const ty = Z(PLATE.maxZ) + 62;
push(`<text x="${M}" y="${ty}" font-size="18" font-weight="bold" fill="#222">Agent Office · Typical floor plan</text>`);
push(`<text x="${M}" y="${ty + 20}" font-size="11" fill="#555">Gross 936 m² · 36 × 26 m plate, central core · ceiling ${CEILING_HEIGHT.toFixed(1)} m · 24 workstations + 1 PM desk · scale 1:${Math.round(1000 / S * 3.78)} approx.</text>`);
const sx = M + 520;
for (let i = 0; i < 5; i++) push(`<rect x="${sx + i * S}" y="${ty - 8}" width="${S}" height="6" fill="${i % 2 ? "#fff" : "#333"}" stroke="#333" stroke-width="0.8"/>`);
push(`<text x="${sx}" y="${ty + 10}" font-size="10" fill="#333">0</text><text x="${sx + 5 * S}" y="${ty + 10}" font-size="10" text-anchor="middle" fill="#333">5 m</text>`);
const nx0 = W - M + 40;
const nz0 = M + 10;
push(`<g transform="translate(${nx0} ${nz0})"><circle r="18" fill="#fff" stroke="#555"/><path d="M0,-15 L6,8 L0,3 L-6,8 Z" fill="#333"/><text y="-22" font-size="12" font-weight="bold" text-anchor="middle">N</text></g>`);
const lx = M + 720;
const legend: [string, string][] = [
  ["#3b3b3b", "Curtain wall (glazed)"],
  ["#4a4a4a", "Core wall"],
  ["#5c5c5c", "Partition"],
  ["#2f7fc0", "Glass partition / door"],
  ["#222", "Structural column"],
  ["#ff8a5c", "Meeting seat (game)"],
  ["#43b37a", "Break spot (game)"],
];
legend.forEach(([c, label], i) => {
  const col = Math.floor(i / 4);
  const row = i % 4;
  push(`<rect x="${lx + col * 170}" y="${ty - 30 + row * 15}" width="14" height="8" fill="${c}"/><text x="${lx + col * 170 + 20}" y="${ty - 22 + row * 15}" font-size="10" fill="#333">${label}</text>`);
});

push(`</svg>`);

const file = process.argv[2] ?? new URL("../docs/floorplan.svg", import.meta.url).pathname;
mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, out.join("\n"));
console.log(`Wrote ${file}`);
