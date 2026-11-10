# Agent Office 🫧

A cozy 3D office where your [T3 Code](https://t3.codes) threads and [Claude Code](https://claude.com/claude-code)
sessions are little round workers ("Bloops").
Walk around in first person, peek at their screens, chat with them, hold meetings, hire and lay off agents,
and run an issue board, all backed by your live T3 Code threads and Claude Code sessions.

## Run it

Make sure the T3 Code app is open (or use Claude Code floors, below), then:

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
| Office Chat (T) | Messaging any thread from anywhere; unread badges for new replies, questions and approvals inline |
| Meeting room | Your message goes to every attendee; their replies show up in the meeting log |
| Issue board + PM | Tickets stored in `data/office.json`, or mirrored from a linked GitLab issue board. The PM is a thread that manages the board, and its settings, through the office's HTTP API |

## Claude Code floors

A floor can also be a folder whose agents are [Claude Code](https://claude.com/claude-code) sessions. In the
elevator (**F**), type the folder's path, pick **Claude Code**, and **Build floor**. T3 Code floors are unchanged,
and both kinds can sit in the same building.

| In the office | In Claude Code |
|---|---|
| A floor | A folder on this machine |
| A Bloop at a desk | A session in that folder: the ones hired in the office, plus sessions from the last 24 hours that you ran elsewhere (the CLI, the desktop app, an IDE) |
| Hiring at an empty desk | Starting a session with your task, run here by the [Claude Agent SDK](https://docs.claude.com/en/docs/agent-sdk/overview) with your own Claude Code settings, `CLAUDE.md` and permission rules. Pick Opus, Sonnet or Haiku, or the default |
| Approvals and questions | Tool permission prompts and `AskUserQuestion` show up as "needs input" with Allow / Allow for this session / Deny, or the question's options |
| Talking to them | Sending a message to the session (it resumes it if it was idle). Sessions still running in another window are read-only until they finish |
| Their monitor | The session's transcript (`~/.claude/projects`): commands, edits, searches, todos, messages |
| Laying off | Stopping the session and hiding it from the office; its transcript stays in Claude Code |

The SDK is an optional dependency that only loads once a Claude Code floor exists, and it uses your Claude Code
login. Settings, all optional:

- `AGENT_OFFICE_CLAUDE_PERMISSION_MODE`: the sessions' permission mode (`default`, `acceptEdits`, `plan`, ...). Default `default`, so tools ask first.
- `AGENT_OFFICE_CLAUDE_RECENT_HOURS`: how far back to pick up sessions run outside the office. Default 24.
- `CLAUDE_CODE_PATH`: a Claude Code executable to run instead of the one bundled with the SDK.
- `CLAUDE_CONFIG_DIR`: where Claude Code keeps its data, if not `~/.claude`.

## Controls

- Click the view to grab the mouse, then **WASD** to walk (**Shift** runs). **Esc** lets go of the mouse.
- **E** or click: use whatever is under the crosshair (talk, hire, board, meeting, elevator).
- **V** switches between first person and an over-the-shoulder overview.
- **F** floors · **B** issue board · **M** mute.
- **T** opens Office Chat, a messenger with every agent on every floor. It stays open while you walk:
  **Enter** to type (Enter sends and puts you back to walking), **[** / **]** to switch chats.
- The top-right list shows everyone who needs you on any floor. Click a name to walk over.

## Architecture

- `server/t3.ts` talks to the local T3 Code server. It reads the orchestration shell and thread snapshots
  over HTTP with a scoped token minted by `t3 auth session issue`. It sends archive, stop, settle and
  answer commands over T3's WebSocket RPC, and starts and messages threads with the `t3` CLI.
- `server/claude.ts` runs Claude Code floors: sessions hired in the office run in-process through the Claude
  Agent SDK (approvals and questions come back through `canUseTool`), and the rest are read from their
  transcripts with the SDK's `listSessions`.
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

### The issue board

Each floor's board has its own settings. Open them with **⚙ Board settings** in the board view, or ask the board manager (PM) to change them:

- **Columns**: their names, colors, and order. Each column can mirror a GitLab list: issues with a given label, GitLab's Open list (open issues not in another column), or Closed issues.
- **Wall board vs. board view**: pick which columns (up to 4) the big board on the office wall shows, and which the board you open with **B** shows. Each can show all tags on cards, none, or only the ones you name.
- **Automation**: which column a ticket moves to when it's assigned, and when its agent finishes.
- **GitLab**: paste a project or board URL (`https://gitlab.com/group/project/-/boards/12`, self-hosted works too) and an access token with `api` scope, or start the office with `GITLAB_TOKEN` set. The office syncs every 30 seconds. Moving, adding and editing tickets in the office updates GitLab, and deleting one closes the GitLab issue. **Use the GitLab board's lists as columns** copies the board's lists. Agent assignments stay in the office.

The token is saved in `data/office.json` (git-ignored) and never sent to the page. Agents can read the full board API with `curl -s 'http://127.0.0.1:5199/api/board/guide?projectId=<id>'`.

### Adding things

New areas are plain functions in `src/world/office.ts` (add meshes + `colliders`). Make them interactive by
adding an entry to `interactables()` in `src/main.ts`. Agents can drive the office through the bridge API too
(see the PM brief in `server/bridge.ts` for the endpoints).
