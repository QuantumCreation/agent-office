// The Mac app: runs the office server in-process and shows it in a native window
// with no browser chrome. Built into "Agent Office.app" by scripts/build-app.ts.

import { app, BrowserWindow, dialog, Menu, screen, shell, type MenuItemConstructorOptions } from "electron";
import { execFile } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { startOfficeServer, type OfficeServer } from "../server/http.ts";
import { APP_NAME, appDataDir, DEFAULT_PORT, resolveDataFile } from "../server/paths.ts";

const PORT = Number(process.env.PORT ?? DEFAULT_PORT);
const BACKGROUND = "#cfe3f7"; // the page's own background, so there's no white flash while loading

app.setName(APP_NAME);
app.setPath("userData", appDataDir());

let office: OfficeServer | null = null;
let officeUrl = "";
let win: BrowserWindow | null = null;
let quitting = false;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => showWindow());
  app.whenReady().then(start).catch((err) => fail("Agent Office couldn't start.", err));
}

async function start() {
  Menu.setApplicationMenu(buildMenu());
  await loadLoginShellEnv();
  officeUrl = await startOrAttach();
  showWindow();
}

/**
 * Starts the office server on the usual port. If something already has that port and it's an
 * office (say `npm run dev`), the window shows that one instead of running a second copy.
 */
async function startOrAttach(): Promise<string> {
  try {
    office = await startOfficeServer({
      distDir: join(app.getAppPath(), "dist"),
      dataFile: resolveDataFile(),
      port: PORT,
    });
    return office.url;
  } catch (err) {
    const url = `http://127.0.0.1:${PORT}`;
    if ((err as NodeJS.ErrnoException).code === "EADDRINUSE" && (await isOffice(url))) return url;
    throw err;
  }
}

async function isOffice(url: string): Promise<boolean> {
  try {
    const res = await fetch(`${url}/api/state`, { signal: AbortSignal.timeout(3000) });
    const body = (await res.json()) as { projects?: unknown };
    return res.ok && Array.isArray(body.projects);
  } catch {
    return false;
  }
}

/**
 * Apps opened from Finder get a bare environment, not your shell's. Load the login shell's
 * environment so the office sees the same PATH, GITLAB_TOKEN, T3CODE_HOME... as in a terminal.
 */
function loadLoginShellEnv(): Promise<void> {
  const shellPath = process.env.SHELL || "/bin/zsh";
  const marker = "__AGENT_OFFICE_ENV__";
  return new Promise((resolve) => {
    execFile(
      shellPath,
      ["-ilc", `printf '${marker}'; env -0; printf '${marker}'`],
      { timeout: 5000, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, DISABLE_AUTO_UPDATE: "true" } },
      (_err, stdout) => {
        const body = String(stdout ?? "").split(marker)[1];
        if (body) {
          for (const entry of body.split("\0")) {
            const eq = entry.indexOf("=");
            if (eq <= 0) continue;
            const key = entry.slice(0, eq);
            if (key.startsWith("ELECTRON_") || key === "_" || key === "SHLVL" || key === "PWD" || key === "OLDPWD") continue;
            process.env[key] = entry.slice(eq + 1);
          }
        } else {
          process.env.PATH = ["/opt/homebrew/bin", "/usr/local/bin", process.env.PATH].filter(Boolean).join(":");
        }
        resolve();
      },
    );
  });
}

// ---------------------------------------------------------------- window

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  maximized?: boolean;
  fullScreen?: boolean;
}

const stateFile = () => join(app.getPath("userData"), "window.json");

function loadWindowState(): WindowState {
  const fallback: WindowState = { width: 1440, height: 900 };
  try {
    const s = JSON.parse(readFileSync(stateFile(), "utf8")) as WindowState;
    if (!(s.width > 0 && s.height > 0)) return fallback;
    // Forget the position if it's no longer on any screen (a monitor was unplugged).
    if (s.x !== undefined && s.y !== undefined) {
      const onScreen = screen.getAllDisplays().some(({ workArea: a }) => s.x! < a.x + a.width - 100 && s.x! + s.width > a.x + 100 && s.y! >= a.y - 10 && s.y! < a.y + a.height - 100);
      if (!onScreen) return { width: s.width, height: s.height };
    }
    return s;
  } catch {
    return fallback;
  }
}

function saveWindowState(w: BrowserWindow) {
  const state: WindowState = { ...w.getNormalBounds(), maximized: w.isMaximized(), fullScreen: w.isFullScreen() };
  try {
    writeFileSync(stateFile(), JSON.stringify(state));
  } catch {
    /* not worth failing over */
  }
}

function showWindow() {
  if (!officeUrl) return; // still starting; the window opens when the office is up
  if (win) {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
    return;
  }

  const state = loadWindowState();
  const w = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    minWidth: 960,
    minHeight: 600,
    title: APP_NAME,
    show: false,
    backgroundColor: BACKGROUND,
    // The 3D view runs right up under the window controls, like a native game.
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 18, y: 26 }, // centered on the HUD pills (#hud-tl)
    webPreferences: {
      preload: join(import.meta.dirname, "preload.cjs"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
      autoplayPolicy: "no-user-gesture-required",
    },
  });
  win = w;
  if (state.maximized) w.maximize();
  if (state.fullScreen) w.setFullScreen(true);

  const wc = w.webContents;
  // No pinch zoom (needs a live page, so set it once each load is in).
  wc.on("did-finish-load", () => void wc.setVisualZoomLevelLimits(1, 1).catch(() => {}));
  wc.on("zoom-changed", () => wc.setZoomFactor(1));

  // Links to anything outside the office (T3 threads, GitLab issues...) open in your real browser.
  wc.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: "deny" };
  });
  wc.on("will-navigate", (event, url) => {
    if (new URL(url).origin === new URL(officeUrl).origin) return;
    event.preventDefault();
    openExternal(url);
  });

  // The page shows its own "Connecting..." state if the server is still waking up, so a failed
  // load only happens if the server is gone: retry instead of showing a browser error page.
  wc.on("did-fail-load", (_e, code, _desc, _url, isMainFrame) => {
    if (isMainFrame && code !== -3 /* aborted */) setTimeout(() => !w.isDestroyed() && load(w), 1000);
  });

  w.once("ready-to-show", () => w.show());
  w.on("close", (event) => {
    saveWindowState(w);
    // Mac convention: closing the window keeps the app (and the office) running in the Dock,
    // so floor managers still hear when their agents finish.
    if (!quitting && process.platform === "darwin") {
      event.preventDefault();
      if (w.isFullScreen()) {
        w.once("leave-full-screen", () => w.hide());
        w.setFullScreen(false);
      } else {
        w.hide();
      }
    }
  });
  w.on("closed", () => (win = null));

  load(w);
}

// Failures are handled by did-fail-load above; the promise also rejects when a load is cut short.
function load(w: BrowserWindow) {
  w.loadURL(officeUrl).catch(() => {});
}

function openExternal(url: string) {
  if (/^(https?|mailto):/i.test(url)) void shell.openExternal(url);
}

// ---------------------------------------------------------------- menu

function buildMenu(): Menu {
  const template: MenuItemConstructorOptions[] = [
    {
      label: APP_NAME,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      // Needed for copy/paste in the chat and board text boxes.
      label: "Edit",
      submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" }],
    },
    {
      label: "View",
      submenu: [{ role: "togglefullscreen" }],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        { role: "close" },
        { type: "separator" },
        { label: "Agent Office", accelerator: "CmdOrCtrl+0", click: () => showWindow() },
        { type: "separator" },
        { role: "front" },
      ],
    },
    {
      role: "help",
      submenu: [
        { label: "Open in Browser", click: () => officeUrl && void shell.openExternal(officeUrl) },
        { label: "Show Office Data in Finder", click: () => shell.showItemInFolder(resolveDataFile()) },
        { type: "separator" },
        { label: "Developer Tools", accelerator: "Alt+CmdOrCtrl+I", click: () => win?.webContents.toggleDevTools() },
      ],
    },
  ];
  return Menu.buildFromTemplate(template);
}

// ---------------------------------------------------------------- lifecycle

app.on("activate", () => showWindow()); // Dock icon clicked
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", (event) => {
  quitting = true;
  if (!office) return;
  // Let the server save and hang up before the process exits.
  event.preventDefault();
  const closing = office;
  office = null;
  void Promise.race([closing.close(), new Promise((r) => setTimeout(r, 2000))]).then(() => app.quit());
});

function fail(message: string, err: unknown) {
  const detail =
    (err as NodeJS.ErrnoException)?.code === "EADDRINUSE"
      ? `Port ${PORT} is already in use by another program. Quit it and open Agent Office again.`
      : String((err as Error)?.stack ?? err);
  dialog.showErrorBox(message, detail);
  app.exit(1);
}
