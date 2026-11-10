// The office floor plan, as plain data. This single file drives both the 2D drawing
// (scripts/floorplan-svg.ts -> docs/floorplan.svg) and the 3D build (office.ts).
//
// Units are meters. Plan coordinates: +x is east, +z is south (down on the drawing),
// y is up in 3D. The floor plate is 36 m x 26 m with a central core.
//
// Revision 2: incorporates the design review in docs/floorplan.md (stairs and exits,
// core zoning with restrooms off the lobby, reception, door swings, meeting room
// orientation, acoustic zoning, furniture clearances, and the south "focus bar").
// Revision 3: the southeast corner becomes the floor manager's office, with a private 1:1 room
// (the old wellness room). Wellness takes the second phone room; the collaboration area's
// high table and whiteboard move to the east end of the window bar.

export type XZ = [number, number];
export type Rect = [x0: number, z0: number, x1: number, z1: number];

export const PLATE = { minX: -18, maxX: 18, minZ: -13, maxZ: 13 };
/** Open, loft-style ceiling. The 4 m storey leaves a shallow plenum for services above it. */
export const CEILING_HEIGHT = 3.6;
export const FLOOR_TO_FLOOR = 4.0;
/** Curtain-wall glass runs from a low sill to just under the ceiling. */
export const WINDOW_SILL = 0.3;
export const WINDOW_HEAD = CEILING_HEIGHT - 0.3;
/** Door height (tall doors, in proportion with the ceiling). */
export const DOOR_HEIGHT = 2.4;
export const EXTERIOR_WALL = 0.3;
export const INTERIOR_WALL = 0.12;
export const CORE_WALL = 0.2;
export const CHASE_WALL = 0.4;

export type Finish = "carpet" | "carpet-accent" | "wood" | "tile" | "vinyl" | "concrete" | "stone";

export interface Room {
  id: string;
  name: string;
  rect: Rect;
  finish: Finish;
  /** Enclosed rooms get their own label style and ceiling lights layout. */
  enclosed: boolean;
  /** Service rooms the game never enters (shown as closed doors). */
  service?: boolean;
}

export type OpeningKind = "door" | "glass-door" | "opening" | "elevator" | "stair-door";

export interface Opening {
  /** Distance from wall start `a` to the opening's center. */
  at: number;
  width: number;
  kind: OpeningKind;
  /** Which side the door leaf swings into (+1: left of a->b, i.e. (dz, -dx); -1: right). */
  swing?: 1 | -1;
}

export type WallKind = "exterior" | "core" | "partition" | "glass";

export interface Wall {
  a: XZ;
  b: XZ;
  kind: WallKind;
  openings?: Opening[];
  /** Overrides the default thickness for the wall kind (e.g. a plumbing chase). */
  thickness?: number;
}

export type FurnitureKind =
  | "desk"
  | "chair"
  | "divider"
  | "table-rect"
  | "table-round"
  | "high-table"
  | "stool"
  | "sofa"
  | "armchair"
  | "coffee-table"
  | "beanbag"
  | "counter"
  | "island"
  | "fridge"
  | "coffee-machine"
  | "water-cooler"
  | "reception-desk"
  | "plant"
  | "tv"
  | "whiteboard"
  | "issue-board"
  | "bookshelf"
  | "credenza"
  | "printer"
  | "rug"
  | "toilet"
  | "sink-counter"
  | "stall"
  | "stair"
  | "elevator-car"
  | "server-rack"
  | "bar-counter"
  | "planter"
  | "drinking-fountain";

export interface Furniture {
  kind: FurnitureKind;
  /** Center. */
  x: number;
  z: number;
  /** Footprint along local x (width) and local z (depth). */
  w: number;
  d: number;
  /** Rotation about y in radians. 0 means the item's front faces +z (south). */
  rot: number;
  color?: string;
}

export interface Seat {
  pos: XZ;
  /** Unit vector the seated agent faces. */
  facing: XZ;
  stand?: boolean;
}

export interface DeskSlot extends Seat {
  index: number;
  desk: XZ;
}

// ------------------------------------------------------------------ rooms

export const CORE: Rect = [-9, -4.25, 9, 4.25];

export const ROOMS: Room[] = [
  // North: open workspace and team hub along the north glazing
  { id: "workspace", name: "Open workspace", rect: [-11, -13, 11, -6.5], finish: "carpet", enclosed: false },
  { id: "hub", name: "Team hub", rect: [11, -13, 18, -6.5], finish: "carpet-accent", enclosed: false },
  { id: "aisle-n", name: "Main aisle", rect: [-11, -6.5, 11, -4.25], finish: "vinyl", enclosed: false },

  // West band: boardroom, quiet room (away from the kitchen), huddle room
  { id: "boardroom", name: "Boardroom", rect: [-18, -13, -11, -6.5], finish: "wood", enclosed: true },
  { id: "quiet", name: "Quiet room", rect: [-18, -6.5, -11, -2.5], finish: "carpet-accent", enclosed: true },
  { id: "huddle", name: "Huddle room", rect: [-18, -2.5, -11, 1.5], finish: "carpet-accent", enclosed: true },
  { id: "aisle-w", name: "West corridor", rect: [-11, -6.5, -9, 1.5], finish: "vinyl", enclosed: false },

  // East band. The 1:1 room is the manager's: it opens only into their office.
  { id: "meeting-b", name: "Meeting room", rect: [11, -6.5, 18, -1.5], finish: "carpet-accent", enclosed: true },
  { id: "phone-1", name: "Phone room", rect: [11, -1.5, 14.5, 1], finish: "carpet-accent", enclosed: true },
  { id: "wellness", name: "Wellness room", rect: [11, 1, 14.5, 3.5], finish: "carpet-accent", enclosed: true },
  { id: "one-on-one", name: "1:1 room", rect: [14.5, -1.5, 18, 3.5], finish: "carpet-accent", enclosed: true },
  { id: "aisle-e", name: "East corridor", rect: [9, -6.5, 11, 4.25], finish: "vinyl", enclosed: false },

  // South
  { id: "kitchen", name: "Kitchen & café", rect: [-18, 1.5, -9, 13], finish: "tile", enclosed: false },
  { id: "lounge", name: "Lounge", rect: [-9, 8, 1, 13], finish: "wood", enclosed: false },
  { id: "lobby", name: "Elevator lobby & reception", rect: [-9, 4.25, 11, 8], finish: "stone", enclosed: false },
  // Southeast corner office: glass on two sides, glass front onto the lobby.
  { id: "manager", name: "Manager's office", rect: [11, 3.5, 18, 13], finish: "wood", enclosed: true },
  { id: "focus-bar", name: "Window bar", rect: [1, 8, 11, 13], finish: "carpet-accent", enclosed: false },

  // Core: back-of-house faces the desks' side only through closed service doors;
  // restrooms open off the elevator lobby.
  { id: "stair-w", name: "Stair 1", rect: [-9, -4.25, -6, 1.35], finish: "concrete", enclosed: true, service: true },
  { id: "janitor", name: "Janitor / wet riser", rect: [-9, 1.35, -6, 4.25], finish: "concrete", enclosed: true, service: true },
  { id: "wc-acc", name: "Accessible WC", rect: [-6, -4.25, -3, 0], finish: "tile", enclosed: true, service: true },
  { id: "mail", name: "Mail & print", rect: [-3, -4.25, 0, 0], finish: "vinyl", enclosed: true, service: true },
  { id: "wc-w", name: "WC (W)", rect: [-6, 0, -3, 4.25], finish: "tile", enclosed: true, service: true },
  { id: "wc-m", name: "WC (M)", rect: [-3, 0, 0, 4.25], finish: "tile", enclosed: true, service: true },
  { id: "it", name: "IT / server", rect: [0, -4.25, 3, 1.4], finish: "vinyl", enclosed: true, service: true },
  { id: "elec", name: "Elec.", rect: [3, -4.25, 5, 1.4], finish: "concrete", enclosed: true, service: true },
  { id: "elevators", name: "Elevators", rect: [0, 1.4, 5, 4.25], finish: "concrete", enclosed: true, service: true },
  { id: "shaft", name: "Shaft", rect: [5, -1.35, 6, 4.25], finish: "concrete", enclosed: true, service: true },
  { id: "storage", name: "Storage", rect: [5, -4.25, 9, -1.35], finish: "vinyl", enclosed: true, service: true },
  { id: "stair-e", name: "Stair 2", rect: [6, -1.35, 9, 4.25], finish: "concrete", enclosed: true, service: true },
];

// ------------------------------------------------------------------ walls

const P = PLATE;
/** Elevator hoistways: x 0.3..2.65 and 2.65..5.0, doors centered on each. */
export const ELEVATOR_DOOR_X = [1.475, 3.825];

export const WALLS: Wall[] = [
  // Exterior curtain wall
  { a: [P.minX, P.minZ], b: [P.maxX, P.minZ], kind: "exterior" },
  { a: [P.maxX, P.minZ], b: [P.maxX, P.maxZ], kind: "exterior" },
  { a: [P.maxX, P.maxZ], b: [P.minX, P.maxZ], kind: "exterior" },
  { a: [P.minX, P.maxZ], b: [P.minX, P.minZ], kind: "exterior" },

  // Core perimeter. North face (toward the desks): only closed service doors.
  {
    a: [-9, -4.25],
    b: [9, -4.25],
    kind: "core",
    openings: [
      { at: 4.5, width: 0.9, kind: "door", swing: -1 }, // Accessible WC
      { at: 7.5, width: 0.9, kind: "door", swing: -1 }, // Mail & print
      { at: 10.5, width: 0.9, kind: "door", swing: -1 }, // IT
      { at: 13, width: 0.9, kind: "door", swing: -1 }, // Elec
      { at: 16, width: 0.9, kind: "door", swing: -1 }, // Storage
    ],
  },
  // South face (lobby): janitor, restrooms (swing in), elevators
  {
    a: [-9, 4.25],
    b: [9, 4.25],
    kind: "core",
    openings: [
      { at: 1.5, width: 0.9, kind: "door", swing: 1 }, // Janitor / wet riser
      { at: 4.5, width: 0.9, kind: "door", swing: 1 }, // WC (W)
      { at: 7.5, width: 0.9, kind: "door", swing: 1 }, // WC (M)
      { at: 9 + ELEVATOR_DOOR_X[0], width: 1.1, kind: "elevator" },
      { at: 9 + ELEVATOR_DOOR_X[1], width: 1.1, kind: "elevator" },
    ],
  },
  // Stair doors open onto the stair landings (Stair 1 landing north, Stair 2 landing south).
  // Stair doors: 0.915 m leaves on the 1.2 m landings, hinged at the end-wall corner,
  // swinging into the stair (direction of egress). Stair 2's wall runs south->north so
  // its hinge (the opening's start) is on the south side.
  { a: [-9, -4.25], b: [-9, 4.25], kind: "core", openings: [{ at: 0.8, width: 0.915, kind: "stair-door", swing: 1 }] },
  { a: [9, 4.25], b: [9, -4.25], kind: "core", openings: [{ at: 0.8, width: 0.915, kind: "stair-door", swing: 1 }] },

  // Core partitions
  { a: [-6, -4.25], b: [-6, 4.25], kind: "core" },
  { a: [-9, 1.35], b: [-6, 1.35], kind: "core" },
  { a: [-3, -4.25], b: [-3, 4.25], kind: "partition" },
  { a: [-6, 0], b: [0, 0], kind: "core", thickness: CHASE_WALL }, // plumbing chase, toilets back onto it
  { a: [0, 1.4], b: [5, 1.4], kind: "core" },
  { a: [0, -4.25], b: [0, 4.25], kind: "core" },
  { a: [3, -4.25], b: [3, 1.4], kind: "partition" },
  { a: [2.65, 1.4], b: [2.65, 4.25], kind: "core" },
  { a: [5, -4.25], b: [5, 4.25], kind: "core" },
  { a: [6, -1.35], b: [6, 4.25], kind: "core" },
  { a: [5, -1.35], b: [9, -1.35], kind: "core" },

  // West band (doors swing into the rooms, not the exit corridor)
  // Hinge at the south corner: the open leaf folds against the boardroom's south wall.
  { a: [-11, -6.5], b: [-11, -13], kind: "glass", openings: [{ at: 0.6, width: 1.0, kind: "glass-door", swing: 1 }] },
  { a: [-18, -6.5], b: [-11, -6.5], kind: "partition" },
  { a: [-11, -6.5], b: [-11, -2.5], kind: "partition", openings: [{ at: 2.0, width: 0.9, kind: "door", swing: -1 }] },
  { a: [-18, -2.5], b: [-11, -2.5], kind: "partition" },
  { a: [-11, -2.5], b: [-11, 1.5], kind: "glass", openings: [{ at: 2.0, width: 1.0, kind: "glass-door", swing: -1 }] },
  { a: [-18, 1.5], b: [-11, 1.5], kind: "partition" }, // acoustic (STC 45+) wall to the kitchen

  // East band
  { a: [11, -6.5], b: [18, -6.5], kind: "partition" },
  { a: [11, -6.5], b: [11, -1.5], kind: "glass", openings: [{ at: 3.0, width: 1.0, kind: "glass-door", swing: 1 }] },
  { a: [11, -1.5], b: [18, -1.5], kind: "partition" },
  { a: [11, -1.5], b: [11, 3.5], kind: "partition", openings: [{ at: 1.25, width: 0.9, kind: "door", swing: 1 }, { at: 3.75, width: 0.9, kind: "door", swing: 1 }] },
  { a: [11, 1], b: [14.5, 1], kind: "partition" },
  { a: [14.5, -1.5], b: [14.5, 3.5], kind: "partition" },
  // Manager's office: its north wall has the private door into the 1:1 room (swings into the 1:1).
  { a: [11, 3.5], b: [18, 3.5], kind: "partition", openings: [{ at: 5.25, width: 0.9, kind: "door", swing: 1 }] },
  // Glass front onto the lobby with a glass door (swings in), then a solid wall: the staff board
  // hangs on its inside face and the window bar's whiteboard on its outside face.
  { a: [11, 3.5], b: [11, 8], kind: "glass", openings: [{ at: 1.5, width: 1.0, kind: "glass-door", swing: 1 }] },
  { a: [11, 8], b: [11, 13], kind: "partition" },

  // Reception feature wall
  { a: [3, 8.9], b: [8, 8.9], kind: "partition" },
];

/** Structural columns (0.6 m square), on a 9 m grid; interior ones sit in the core walls. */
export const COLUMN_SIZE = 0.6;
export const COLUMNS: XZ[] = [
  ...[-9, 0, 9].flatMap((x) => [[x, P.minZ], [x, P.maxZ]] as XZ[]),
  ...[-4.25, 4.25].flatMap((z) => [[P.minX, z], [P.maxX, z]] as XZ[]),
  ...[-9, 0, 9].flatMap((x) => [[x, -4.25], [x, 4.25]] as XZ[]),
  [P.minX, P.minZ],
  [P.maxX, P.minZ],
  [P.minX, P.maxZ],
  [P.maxX, P.maxZ],
];

// ------------------------------------------------------------------ desks

/** Four benches of six desks, perpendicular to the north glazing. */
export const BENCH_CENTERS_X = [-7.5, -2.5, 2.5, 7.5];
export const BENCH_DESK_Z = [-11.2, -9.6, -8.0];
export const DESK_W = 1.6; // along the bench (z)
export const DESK_D = 0.8; // across the bench (x)
const SEAT_FROM_BENCH_CENTER = DESK_D + 0.5;

export const DESKS: DeskSlot[] = BENCH_CENTERS_X.flatMap((cx, bench) =>
  [-1, 1].flatMap((side, s) =>
    BENCH_DESK_Z.map((z, i) => {
      // side -1: west half of the bench, seated agent faces east (+x)
      const facing: XZ = [-side, 0];
      return {
        index: bench * 6 + s * 3 + i,
        desk: [cx + side * (DESK_D / 2), z] as XZ,
        pos: [cx + side * SEAT_FROM_BENCH_CENTER, z] as XZ,
        facing,
      };
    }),
  ),
);

/** Board manager desk in the team hub, facing the issue board, back kept off the glass. */
export const PM_DESK: DeskSlot = { index: -1, desk: [14.5, -10.0], pos: [14.5, -10.8], facing: [0, 1] };

export const ISSUE_BOARD = { x: 14.5, z: -6.5 - INTERIOR_WALL / 2 - 0.03, width: 5.6, height: 2.6, centerY: 1.8, facing: [0, -1] as XZ };
/** Where you stand to read the board (far enough back to take in its full height). */
export const BOARD_FRONT: XZ = [14.5, -8.6];

// ------------------------------------------------------------------ manager's office

/**
 * The floor manager's desk: in the south half of the corner office, back to the east glass
 * (with a credenza behind), facing west across the room to the staff board.
 */
const MGR_Z = 10.3;
export const MANAGER_DESK: DeskSlot = { index: -2, desk: [15.9, MGR_Z], pos: [16.7, MGR_Z], facing: [-1, 0] };
/** Roster of everyone on the floor, on the inside of the office's west wall. */
export const STAFF_BOARD = { x: 11 + INTERIOR_WALL / 2 + 0.03, z: MGR_Z, width: 4.0, height: 2.2, centerY: 1.75, facing: [1, 0] as XZ };
export const STAFF_BOARD_FRONT: XZ = [13.4, MGR_Z];
/** Nameplate over the office's glass door, read from the lobby. */
export const MANAGER_SIGN = { x: 11 - 0.06, z: 5.0, y: DOOR_HEIGHT + 0.32, width: 1.6, height: 0.4, facing: [-1, 0] as XZ };
export const MANAGER_DOOR: XZ = [11, 5.0];

// ------------------------------------------------------------------ meeting (boardroom)

/** Long axis north-south, so the TV on the south wall is at the end of the table. */
export const BOARDROOM_TABLE = { x: -14.5, z: -10.2, w: 1.2, d: 3.6 };
export const MEETING_SEATS: Seat[] = [-11.55, -10.65, -9.75, -8.85].flatMap((z) => [
  { pos: [-15.65, z] as XZ, facing: [1, 0] as XZ },
  { pos: [-13.35, z] as XZ, facing: [-1, 0] as XZ },
]);
/** Where the boss stands during a meeting (head of the table, by the TV). */
export const MEETING_HOST: XZ = [-14.5, -7.75];
export const MEETING_DOOR: XZ = [-11, -7.1];

// ------------------------------------------------------------------ elevators

export const ELEVATOR_DOORS: XZ[] = ELEVATOR_DOOR_X.map((x) => [x, 4.25] as XZ);
export const SPAWN: XZ = [ELEVATOR_DOOR_X[0], 5.0];
export const EXIT: XZ = [ELEVATOR_DOOR_X[1], 4.7];
export const ELEVATOR_PANEL: XZ = [2.65, 4.4];
export const PLAYER_START: XZ = [2.65, 5.6];
export const PLAYER_START_YAW = 0.9; // facing reception
export const FLOOR_SIGN = { x: 2.65, z: 4.25 + CORE_WALL / 2 + 0.02, y: DOOR_HEIGHT + 0.55, facing: [0, 1] as XZ };

// ------------------------------------------------------------------ hangouts (idle breaks)

export const CAFE_TABLES: XZ[] = [
  [-15.6, 8.6],
  [-12.2, 8.6],
  [-15.6, 11.4],
  [-12.2, 11.4],
];

export const HANGOUTS: Seat[] = [
  // café chairs (two per table)
  ...CAFE_TABLES.flatMap(([x, z]) => [
    { pos: [x - 0.75, z] as XZ, facing: [1, 0] as XZ },
    { pos: [x + 0.75, z] as XZ, facing: [-1, 0] as XZ },
  ]),
  // kitchen: coffee machine and water cooler (standing)
  { pos: [-13.0, 2.75], facing: [0, -1], stand: true },
  { pos: [-11.6, 2.55], facing: [0, -1], stand: true },
  // lounge sofas
  ...[-5.0, -4.0, -3.0].map((x) => ({ pos: [x, 9.55] as XZ, facing: [0, 1] as XZ })),
  ...[-5.0, -4.0, -3.0].map((x) => ({ pos: [x, 11.8] as XZ, facing: [0, -1] as XZ })),
  // focus bar by the south glass (standing at the bar)
  ...[3.05, 5.0, 6.95].map((x) => ({ pos: [x, 11.85] as XZ, facing: [0, 1] as XZ, stand: true })),
  // high table at the east end of the window bar (standing)
  { pos: [9.6, 9.45], facing: [0, 1], stand: true },
  { pos: [9.6, 11.75], facing: [0, -1], stand: true },
];

// ------------------------------------------------------------------ furniture

const F = (kind: FurnitureKind, x: number, z: number, w: number, d: number, rot = 0, color?: string): Furniture => ({ kind, x, z, w, d, rot, color });
const FACE = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 };
const IW = INTERIOR_WALL / 2;

export const FURNITURE: Furniture[] = [
  // Bench dividers
  ...BENCH_CENTERS_X.map((cx) => F("divider", cx, -9.6, 0.05, 4.8)),

  // Team hub
  F("plant", 17.4, -12.4, 0.6, 0.6),
  F("plant", 11.6, -12.4, 0.6, 0.6),

  // Boardroom: table runs north-south toward the TV
  F("table-rect", BOARDROOM_TABLE.x, BOARDROOM_TABLE.z, BOARDROOM_TABLE.w, BOARDROOM_TABLE.d),
  ...MEETING_SEATS.map((s) => F("chair", s.pos[0], s.pos[1], 0.55, 0.55, Math.atan2(s.facing[0], s.facing[1]))),
  F("tv", -14.5, -6.5 - IW - 0.05, 2.2, 0.08, FACE.n),
  F("credenza", -14.5, -6.95, 2.4, 0.5, FACE.n),
  F("plant", -17.4, -12.4, 0.6, 0.6),

  // Quiet room (solid walls, away from the kitchen)
  F("bookshelf", -14.5, -6.5 + IW + 0.2, 4.0, 0.38),
  F("armchair", -16.6, -4.6, 0.9, 0.9, FACE.e),
  F("armchair", -16.6, -3.4, 0.9, 0.9, FACE.e),
  F("table-round", -15.4, -4.0, 0.6, 0.6),
  F("armchair", -12.6, -4.0, 0.9, 0.9, FACE.w),
  F("plant", -17.4, -2.95, 0.5, 0.5),

  // Huddle room
  F("table-rect", -14.5, -0.5, 2.0, 1.0),
  ...[-15.1, -14.5, -13.9].flatMap((x) => [F("chair", x, -1.3, 0.55, 0.55, FACE.s), F("chair", x, 0.3, 0.55, 0.55, FACE.n)]),
  F("whiteboard", -14.5, -2.5 + IW + 0.04, 2.4, 0.06, FACE.s),

  // Meeting room B: table north-south toward the TV on the south wall
  F("table-rect", 14.5, -4.3, 1.2, 2.6),
  ...[-5.1, -4.3, -3.5].flatMap((z) => [F("chair", 13.35, z, 0.55, 0.55, FACE.e), F("chair", 15.65, z, 0.55, 0.55, FACE.w)]),
  F("tv", 14.5, -1.5 - IW - 0.05, 1.8, 0.08, FACE.n),

  // Phone room
  F("table-rect", 13.3, -0.25, 1.0, 0.6, FACE.w),
  F("chair", 12.6, -0.25, 0.55, 0.55, FACE.e),

  // Wellness room (sink + small fridge on the north wall, armchair in the far corner)
  F("sink-counter", 13.3, 1 + IW + 0.25, 1.0, 0.5, FACE.s),
  F("fridge", 14.15, 1 + IW + 0.3, 0.5, 0.55, FACE.s),
  F("armchair", 13.85, 2.8, 0.85, 0.85, FACE.w),
  F("rug", 12.7, 2.55, 1.6, 1.3),
  F("plant", 11.4, 3.15, 0.45, 0.45),

  // 1:1 room (the manager's, off their office): two chairs across a small table
  F("table-rect", 16.25, 0.9, 1.2, 0.8),
  F("chair", 16.25, 0.05, 0.55, 0.55, FACE.s),
  F("chair", 16.25, 1.75, 0.55, 0.55, FACE.n),
  F("plant", 17.45, -1.0, 0.5, 0.5),
  F("plant", 15.0, -1.0, 0.5, 0.5),

  // Manager's office. South half: desk facing west to the staff board, credenza behind it,
  // two guest chairs across the desk. North half: a round table for four and a lounge
  // against the east glass. Bookshelf along the north wall.
  F("rug", 15.5, MGR_Z, 3.6, 3.2),
  F("credenza", 17.6, MGR_Z, 2.2, 0.45, FACE.w),
  F("chair", 14.75, MGR_Z - 0.55, 0.55, 0.55, FACE.e),
  F("chair", 14.75, MGR_Z + 0.55, 0.55, 0.55, FACE.e),
  F("bookshelf", 13.0, 3.5 + IW + 0.2, 3.2, 0.38),
  F("table-round", 13.0, 6.4, 1.1, 1.1),
  F("chair", 12.25, 6.4, 0.55, 0.55, FACE.e),
  F("chair", 13.75, 6.4, 0.55, 0.55, FACE.w),
  F("chair", 13.0, 5.65, 0.55, 0.55, FACE.s),
  F("chair", 13.0, 7.15, 0.55, 0.55, FACE.n),
  F("sofa", 17.3, 6.6, 2.6, 0.95, FACE.w),
  F("coffee-table", 16.0, 6.6, 1.1, 0.6, FACE.w),
  F("armchair", 16.0, 5.4, 0.85, 0.85, FACE.s),
  F("armchair", 16.0, 7.8, 0.85, 0.85, FACE.n),
  F("plant", 17.4, 12.4, 0.6, 0.6),
  F("plant", 11.5, 12.5, 0.45, 0.45),
  F("plant", 17.2, 4.05, 0.6, 0.6),

  // Kitchen & café: counter on the huddle room's south wall (acoustic), island 1.2 m off it
  F("counter", -14.4, 1.5 + IW + 0.33, 4.6, 0.65),
  F("fridge", -17.4, 1.98, 0.8, 0.75),
  F("coffee-machine", -13.0, 1.95, 0.45, 0.4),
  F("island", -14.4, 4.0, 3.0, 1.1),
  ...CAFE_TABLES.map(([x, z]) => F("table-round", x, z, 0.9, 0.9)),
  ...CAFE_TABLES.flatMap(([x, z]) => [F("chair", x - 0.75, z, 0.5, 0.5, FACE.e), F("chair", x + 0.75, z, 0.5, 0.5, FACE.w)]),
  F("water-cooler", -11.6, 1.85, 0.4, 0.4),
  F("plant", -17.4, 12.4, 0.6, 0.6),
  F("plant", -9.6, 12.4, 0.6, 0.6),

  // Lounge
  F("rug", -4.0, 10.7, 5.2, 3.4),
  F("sofa", -4.0, 9.1, 3.0, 0.95, FACE.s),
  F("sofa", -4.0, 12.25, 3.0, 0.95, FACE.n),
  F("coffee-table", -4.0, 10.7, 1.6, 0.8),
  F("beanbag", -7.6, 10.7, 0.9, 0.9),
  F("beanbag", -0.4, 10.7, 0.9, 0.9),
  F("plant", -8.4, 12.4, 0.6, 0.6),

  // Lobby & reception: desk faces the lifts, feature wall behind
  F("reception-desk", 5.5, 7.15, 2.6, 0.8, FACE.n),
  F("chair", 5.5, 8.05, 0.55, 0.55, FACE.n),
  // high-low drinking fountain on the core wall between the janitor and WC doors
  F("drinking-fountain", -6.2, 4.25 + CORE_WALL / 2 + 0.2, 0.9, 0.4),
  F("plant", -8.3, 4.9, 0.6, 0.6),
  F("armchair", 9.4, 6.0, 0.9, 0.9, FACE.w),
  F("armchair", 9.4, 7.2, 0.9, 0.9, FACE.w),

  // Focus bar along the south glazing
  F("bar-counter", 5.0, 12.45, 6.0, 0.6),
  ...[2.2, 3.9, 6.1, 7.8].map((x) => F("stool", x, 11.85, 0.4, 0.4)),
  F("armchair", 3.0, 10.3, 0.9, 0.9, FACE.e),
  F("armchair", 4.6, 10.3, 0.9, 0.9, FACE.w),
  F("table-round", 3.8, 10.3, 0.5, 0.5),
  F("planter", 7.2, 10.3, 1.8, 0.5),
  F("plant", 10.45, 12.4, 0.6, 0.6),
  F("plant", 1.6, 12.4, 0.6, 0.6),
  F("bookshelf", 5.5, 8.9 + IW + 0.2, 4.6, 0.38),
  // Collaboration corner at the bar's east end (moved here from the old collaboration area):
  // a standing table by a whiteboard on the manager's office wall.
  F("high-table", 9.6, 10.6, 1.8, 1.2),
  F("whiteboard", 11 - IW - 0.04, 10.5, 2.4, 0.06, FACE.w),

  // Core: stairs (landing at the door end), elevator cars, restrooms on the chase, IT
  F("stair", -7.5, -1.45, 2.6, 5.4, Math.PI),
  F("stair", 7.5, 1.45, 2.6, 5.4, 0),
  ...ELEVATOR_DOOR_X.map((x) => F("elevator-car", x, 2.9, 1.6, 2.4)),
  // WC (W): accessible stall + ambulatory stall on the chase, basins on the west wall
  F("stall", -5.14, 1.15, 1.52, 1.9),
  F("toilet", -5.47, 0.55, 0.45, 0.7, FACE.s),
  F("stall", -3.93, 1.15, 0.9, 1.9),
  F("toilet", -3.93, 0.55, 0.45, 0.7, FACE.s),
  F("sink-counter", -5.65, 3.2, 1.4, 0.5, FACE.e),
  // WC (M): mirrored
  F("stall", -0.86, 1.15, 1.52, 1.9),
  F("toilet", -0.53, 0.55, 0.45, 0.7, FACE.s),
  F("stall", -2.07, 1.15, 0.9, 1.9),
  F("toilet", -2.07, 0.55, 0.45, 0.7, FACE.s),
  F("sink-counter", -0.35, 3.2, 1.4, 0.5, FACE.w),
  // Accessible WC: toilet 0.45 m off the side wall, basin on the east wall
  F("toilet", -5.45, -0.55, 0.45, 0.7, FACE.n),
  F("sink-counter", -3.35, -2.0, 0.6, 0.5, FACE.w),
  F("printer", -1.5, -0.65, 1.4, 0.7, FACE.n),
  F("server-rack", 1.3, -2.2, 0.6, 1.0, FACE.e),
  F("server-rack", 1.3, -1.1, 0.6, 1.0, FACE.e),
];

/** Chairs at each desk seat. */
export function deskChairs(): Furniture[] {
  return [...DESKS, PM_DESK, MANAGER_DESK].map((d) => ({
    kind: "chair",
    x: d.pos[0],
    z: d.pos[1],
    w: 0.55,
    d: 0.55,
    rot: Math.atan2(d.facing[0], d.facing[1]),
  }));
}

// ------------------------------------------------------------------ decor (set dressing)

export interface Decor {
  asset: string;
  x: number;
  z: number;
  /** Height of the origin; omit for floor items (0) or ceiling items (set `ceiling`). */
  y?: number;
  rot?: number;
  scale?: number;
  tint?: string;
  /** Wall-mounted (origin on the wall surface). */
  wall?: boolean;
  /** Hangs from the ceiling (origin at the ceiling). */
  ceiling?: boolean;
  /** Collision footprint [w, d] for floor items people can't walk through. */
  collide?: [number, number];
}

const WALL = (asset: string, x: number, z: number, rot: number, scale?: number, y?: number): Decor => ({ asset, x, z, rot, wall: true, scale, y });
const HANG = (asset: string, x: number, z: number, rot = 0): Decor => ({ asset, x, z, rot, ceiling: true });
const FLOOR = (asset: string, x: number, z: number, rot = 0, collide?: [number, number], scale?: number): Decor => ({ asset, x, z, rot, collide, scale });

export const DECOR: Decor[] = [
  // Pendant lights over tables
  HANG("pendant_lamp_linear", BOARDROOM_TABLE.x, BOARDROOM_TABLE.z, Math.PI / 2),
  HANG("pendant_lamp_linear", 14.5, -4.3, Math.PI / 2),
  HANG("pendant_lamp", -14.5, -0.5),
  ...CAFE_TABLES.map(([x, z]) => HANG("pendant_lamp", x, z)),
  HANG("pendant_lamp", -15.2, 4.0),
  HANG("pendant_lamp", -13.6, 4.0),
  HANG("pendant_lamp", 9.6, 10.6), // window bar high table
  // Manager's office: a linear pendant along the desk, one over the round table; 1:1 table
  HANG("pendant_lamp_linear", MANAGER_DESK.desk[0], MANAGER_DESK.desk[1], Math.PI / 2),
  HANG("pendant_lamp", 13.0, 6.4),
  HANG("pendant_lamp", 16.25, 0.9),
  // Window bar: a row of pendants over the counter
  ...[3.05, 5.0, 6.95].map((x) => HANG("pendant_lamp", x, 12.35)),
  // Trailing plants along the north and south glazing
  ...[-6.5, -1.5, 3.5, 8.5].map((x) => HANG("plant_hanging", x, -12.45)),
  ...[-6.0, 0.0].map((x) => HANG("plant_hanging", x, 12.45)),
  ...[13.0, 16.0].map((x) => HANG("plant_hanging", x, 12.45)),
  // Lounge
  // Arc lamp: base in the window corner, shade arcing out over the sofa (its front is the arc direction).
  FLOOR("floor_lamp", -7.0, 12.45, 2.15, [0.45, 0.45]),
  FLOOR("magazine_rack", -1.6, 12.4, Math.PI),
  // Wall art and clocks
  // Wall-mounted items face away from their wall: rot 0 faces south (+z), π faces north.
  // The big lobby and aisle walls get larger prints (scaling also lifts them, to suit the tall walls).
  WALL("wall_art_a", -3.0, 4.25 + CORE_WALL / 2, 0, 1.3), // lobby: core south face between the WC doors
  WALL("wall_art_b", 7.0, 4.25 + CORE_WALL / 2, 0, 1.3), // lobby: core south face east of the lifts
  WALL("wall_art_c", -15.0, -2.5 - INTERIOR_WALL / 2, Math.PI), // quiet room: its south wall, facing north
  WALL("wall_art_a", 12.75, 1.0 - INTERIOR_WALL / 2, Math.PI), // phone room 1
  WALL("wall_art_b", 14.5 + INTERIOR_WALL / 2, 0.9, Math.PI / 2), // 1:1 room: its west wall, facing east
  WALL("wall_art_b", 5.5, -4.25 - CORE_WALL / 2, Math.PI, 1.3), // main aisle: core north face, between Elec and Storage doors
  WALL("wall_art_c", -7.0, -4.25 - CORE_WALL / 2, Math.PI, 1.3), // main aisle: core north face by Stair 1
  // Clocks ride higher on the tall walls so they read over the desks and counters.
  WALL("wall_clock", 2.65, -4.25 - CORE_WALL / 2, Math.PI, 1.2), // main aisle, in view of the desks (center ~2.65 m)
  WALL("wall_clock", -11.55, 1.5 + INTERIOR_WALL / 2, 0, undefined, 0.3), // kitchen, above the water cooler (center 2.5 m)
  // Bins and utilities
  FLOOR("trash_bin", -10.2, -6.9, 0, [0.3, 0.3]),
  FLOOR("recycling_bin", -10.2, -7.3, 0, [0.3, 0.3]),
  FLOOR("trash_bin", 10.2, -6.9, 0, [0.3, 0.3]),
  FLOOR("trash_bin", -17.5, 3.0, 0, [0.3, 0.3]),
  FLOOR("recycling_bin", -17.5, 3.4, 0, [0.3, 0.3]),
  FLOOR("vending_machine", -17.45, 6.2, Math.PI / 2, [0.8, 0.9]),
  { asset: "microwave", x: -16.2, z: 1.92, y: 0.9, rot: 0 },
  FLOOR("coat_rack", 8.5, 5.0, 0, [0.4, 0.4]),
  FLOOR("umbrella_stand", 0.6, 4.75, 0),
  FLOOR("filing_cabinet", 17.6, -9.0, -Math.PI / 2, [0.6, 0.45]),
  FLOOR("filing_cabinet", 17.6, -9.5, -Math.PI / 2, [0.6, 0.45]),
  FLOOR("plant_fiddle", 17.3, -7.4, 0, [0.5, 0.5]),
  FLOOR("plant_monstera", -10.4, -12.3, 0, [0.5, 0.5]),
  FLOOR("plant_monstera", 10.4, -12.3, 0, [0.5, 0.5]),
  // Manager's office lounge, and a filing cabinet by the desk
  FLOOR("rug_round", 16.2, 6.6, 0),
  FLOOR("filing_cabinet", 17.55, 8.55, -Math.PI / 2, [0.6, 0.45]),
];

