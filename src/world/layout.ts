// Game-facing view of the floor plan (floorplan.ts) as three.js vectors.

import * as THREE from "three";
import { DESK_COUNT } from "../../shared/types.ts";
import * as plan from "./floorplan.ts";

export const ROOM = { ...plan.PLATE, wallH: plan.CEILING_HEIGHT };

export interface Seat {
  /** Where the agent's feet go when seated. */
  pos: THREE.Vector3;
  /** Unit vector the seated agent faces. */
  facing: THREE.Vector3;
  /** Agents stand here instead of sitting. */
  stand?: boolean;
  /** Height of the seat cushion (measured from the furniture at startup). */
  height?: number;
  /** Walkable spots beside the seat to hop in from, best first (computed at startup). */
  approaches?: THREE.Vector3[];
}

export interface DeskSlot extends Seat {
  index: number;
  /** Center of the desk top. */
  desk: THREE.Vector3;
}

const v = ([x, z]: plan.XZ) => new THREE.Vector3(x, 0, z);
const seat = (s: plan.Seat): Seat => ({ pos: v(s.pos), facing: v(s.facing).normalize(), stand: s.stand });
const desk = (d: plan.DeskSlot): DeskSlot => ({ ...seat(d), index: d.index, desk: v(d.desk) });

export const DESKS: DeskSlot[] = plan.DESKS.map(desk).sort((a, b) => a.index - b.index);
if (DESKS.length !== DESK_COUNT) throw new Error(`floor plan has ${DESKS.length} desks, expected ${DESK_COUNT}`);
export const PM_SLOT: DeskSlot = desk(plan.PM_DESK);

export const MEETING = {
  table: new THREE.Vector3(plan.BOARDROOM_TABLE.x, 0, plan.BOARDROOM_TABLE.z),
  host: v(plan.MEETING_HOST),
};
export const MEETING_SEATS: Seat[] = plan.MEETING_SEATS.map(seat);

export const BOARD = {
  center: new THREE.Vector3(plan.ISSUE_BOARD.x, plan.ISSUE_BOARD.centerY, plan.ISSUE_BOARD.z),
  width: plan.ISSUE_BOARD.width,
  height: plan.ISSUE_BOARD.height,
  front: v(plan.BOARD_FRONT),
};

export const ELEVATOR = {
  doors: plan.ELEVATOR_DOORS.map(v),
  panel: v(plan.ELEVATOR_PANEL),
  spawn: v(plan.SPAWN),
  exit: v(plan.EXIT),
};

export const PLAYER_START = v(plan.PLAYER_START);
export const PLAYER_START_YAW = plan.PLAYER_START_YAW;
export const HANGOUTS: Seat[] = plan.HANGOUTS.map(seat);
