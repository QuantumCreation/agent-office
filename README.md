# Agent Office 🫧

A cozy 3D office where your [T3 Code](https://t3.codes) threads are little round workers ("Bloops").
Walk around in first person, peek at their screens, chat with them, hold meetings, hire and lay off agents,
and run an issue board, all backed by your live T3 Code threads.

## Run it

Make sure the T3 Code app is open, then:

```sh
npm install
npm run dev        # http://127.0.0.1:5199
```

`npm start` builds and serves an optimized version instead.

## How it maps to T3 Code

| In the office | In T3 Code |
|---|---|
| A floor | A project (the elevator lists them; "Build floor" adds a project) |
| A Bloop at a desk | A thread |
| Antenna and bubble color | Thread state: blue working, yellow needs input, green done (unread), red error, grey idle |
| Their monitor | The thread's latest activity: commands, thinking, edits, messages |
| Talking to them | Sending a message (`t3 thread send`); questions and approvals can be answered inline |
| Hiring at an empty desk | Starting a thread (`t3 thread start`) with your task |
| Laying off | Archiving the thread (they pack a box and take the elevator out) |
| Meeting room | Your message goes to every attendee; their replies show up in the meeting log |
| Issue board + PM | Tickets stored in `data/office.json`. The PM is a thread that manages the board through the office's HTTP API |

## Controls

- Click the view to grab the mouse, then **WASD** to walk (**Shift** runs). **Esc** lets go of the mouse.
- **E** or click: use whatever is under the crosshair (talk, hire, board, meeting, elevator).
- **V** switches between first person and an over-the-shoulder overview.
- **F** floors · **B** issue board · **M** mute.
- The top-right list shows everyone who needs you on any floor. Click a name to walk over.

## Architecture

- `server/t3.ts` talks to the local T3 Code server. It reads the orchestration shell and thread snapshots
  over HTTP with a scoped token minted by `t3 auth session issue`. It sends archive, stop, settle and
  answer commands over T3's WebSocket RPC, and starts and messages threads with the `t3` CLI.
- `server/bridge.ts` is the office API (`/api/*`) plus a server-sent-events stream. It runs inside Vite in
  dev (`vite.config.ts`) or `server/main.ts` in production. It only accepts requests from this machine.
- `src/world/*` holds the Three.js scene: floor plan (`layout.ts`), office props (`office.ts`), Bloops (`bloop.ts`),
  A* navigation (`nav.ts`), player/camera (`player.ts`) and in-world screens (`screens.ts`).
- `src/ui/*` holds the DOM overlays: agent panel, issue board, modals and toasts.

### The building

- `src/world/floorplan.ts` is the floor plan as data: rooms, walls and doors, furniture, seats and decor. It drives both the 3D build and the 2D drawing. Regenerate the drawing with `node scripts/floorplan-svg.ts`, which writes `docs/floorplan.svg`. Design notes and the review log are in `docs/floorplan.md`.
- `src/world/city.ts` is the downtown outside the windows, with our own tower's façade. Each project floor is a real storey; the first is 12F, about 48 m up. Preview it on its own at `/dev/city-preview.html?view=north&elev=90`.
- `src/world/daynight.ts` runs a day/night cycle on your real local time. It computes the sun's actual position for your time zone's city, or for `?lat=&lon=` if you pass them. After dark the sky fills with stars and a moon in its current phase, windows light up across town, and street lamps, headlights, taillights, tower beacons and the Ferris wheel come on. The office lighting also warms up. To preview a time, add `?time=21:30` to the URL (or `?timescale=600` to fast-forward), or run `dayNight.setTime("6:45")` in the console; `setTime(null)` goes back to live.
- 3D models are scripted in Blender (`assets/blender/*.py`) and exported to `public/models/*.glb`. Rebuild them all with `./assets/blender/build_all.sh`; preview renders go to `assets/previews/`. In-game they're toon-shaded and instanced (`src/world/assets.ts`). A missing model falls back to a simple built-in shape.

### Adding things

New areas are plain functions in `src/world/office.ts` (add meshes + `colliders`). Make them interactive by
adding an entry to `interactables()` in `src/main.ts`. Agents can drive the office through the bridge API too
(see the PM brief in `server/bridge.ts` for the endpoints).
