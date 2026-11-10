// Where the office keeps its own state (desks, board, managers...).
//
// The dev server, `npm run serve` and the Mac app all share one file, so it's the same office
// however you open it. On macOS that's ~/Library/Application Support/Agent Office/office.json.
// Set AGENT_OFFICE_DATA to use a different file.

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export const APP_NAME = "Agent Office";
export const DEFAULT_PORT = 5199;

export function appDataDir(): string {
  if (process.platform === "darwin") return join(homedir(), "Library", "Application Support", APP_NAME);
  if (process.platform === "win32") return join(process.env.APPDATA ?? join(homedir(), "AppData", "Roaming"), APP_NAME);
  return join(process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"), "agent-office");
}

/**
 * The office data file. `legacyFile` is the old in-repo location (data/office.json): if the
 * shared file doesn't exist yet, it's copied from there once, so nothing is lost in the move.
 */
export function resolveDataFile(legacyFile?: string): string {
  const file = process.env.AGENT_OFFICE_DATA ?? join(appDataDir(), "office.json");
  if (legacyFile && !existsSync(file) && existsSync(legacyFile)) {
    mkdirSync(dirname(file), { recursive: true });
    copyFileSync(legacyFile, file);
    console.log(`Agent Office: moved office data from ${legacyFile} to ${file}`);
  }
  return file;
}
