# Agent Office floor plan: design brief

The drawing is `docs/floorplan.svg`, generated from `src/world/floorplan.ts` by `node scripts/floorplan-svg.ts`.
That data file is the single source of truth: the 3D game builds the office from it.

## Brief

One typical floor of a multi-storey office building, fitted out for a single small software team.
Every floor of the building uses the same plan (each floor is a different project in the game).

Program:
- 24 workstations, plus 1 desk for the team's project manager next to a large issue/kanban board.
- One 8-person meeting room (boardroom) and smaller rooms (huddle, meeting, phone, quiet, wellness).
- Kitchen/café, lounge, collaboration area.
- Elevator lobby with reception. People arrive and leave by elevator.
- Building core: 2 elevators, 2 egress stairs, restrooms, IT, janitor, risers, storage.
- Ceiling height 2.9 m. Glazed curtain wall on all four sides.

## Game constraints (must keep)

- 24 desks plus the PM desk with a seat point each; the issue board must be readable from the PM's area.
- An 8-seat meeting table that agents can walk to and sit at.
- Break spots (kitchen, lounge) that idle agents wander to.
- Agents walk between the elevator, desks, meeting room and break spots, so paths must be connected and at least about 1.2 m clear.
- The player walks around in first person at about 1.5 m eye height.

## Coordinates

Meters. +x is east, +z is south (down on the drawing). The plate spans x -18..18 and z -13..13.
Structural grid is A–E (x = -18, -9, 0, 9, 18) by 1–4 (z = -13, -4.25, 4.25, 13).

## Design review (revision 2)

An independent review of revision 1 judged the overall layout sound. It is a 36 × 26 m plate around a central core, 8.75 m from core to glass, on a 9 m column grid with no free-standing columns. Benches run perpendicular to the north glazing, with a band of meeting rooms on the west side.

Changes made in revision 2:

| # | Issue | Fix |
|---|---|---|
| 1 | Stair doors opened onto flights; stairs too short for 4.0 m floor-to-floor | Doors moved onto the landings (Stair 1 north end, Stair 2 south end). Stairs lengthened to 5.6 m. Exit separation is now about 19 m, more than one third of the 44.4 m diagonal (sprinklered). |
| 2 | Restrooms opened onto the desk aisle, weren't accessible, and were far from the riser | Restrooms moved off the elevator lobby onto a 0.4 m plumbing chase, each with an accessible stall and an ambulatory stall. The single-user accessible WC and the mail and print room moved to the north side of the core. |
| 3 | Reception desk blocked the lobby | Desk now faces the lifts with 2.65 m clear in front, and has a feature wall and bookshelf behind it. |
| 4 | Doors swung into the 2 m exit corridors | All room doors swing into their rooms. |
| 5 | Meeting tables ran side-on to their TVs | Both tables now run north–south toward the screen (boardroom 1.2 × 3.6 m with 4 + 4 seats). |
| 6 | Quiet room backed onto the coffee machine | Quiet and huddle rooms swapped. The wall to the kitchen is acoustic (STC 45+). |
| 7 | Furniture through the glazing; water cooler in the corridor | Fridge, sofas and cooler moved. |
| 8 | Dead space in the south strip | It became a focus bar along the south glass. |
| 9 | Minor items | Elevator cars resized to 1.6 × 2.4 m in proper hoistways. PM desk moved off the glass. Boardroom door aligned with the main aisle. Kitchen island at 1.2 m from the counter. Elec room moved off the wet riser. IT rack clearances fixed. Wellness room got a sink and fridge. Orphan strip of floor absorbed. |

## Assumptions

- The building is fully sprinklered. Exit separation relies on the one-third-diagonal rule.
- The building is a high-rise (in the game, floors sit 40–160 m up). The open elevator lobby relies on hoistway smoke curtains at the elevator doors (IBC 3006).
- Mechanical plant is central (rooftop and plant floors). This floor only needs the shaft and riser space shown.
- The not-taken review suggestion: splitting the 28 m² huddle room into a smaller huddle room plus focus rooms. Those rooms would have no corridor frontage without reworking the west band.
