// Issue board settings: defaults, validation of edits (from the UI or the PM agent),
// and small helpers shared by the bridge and the client.

import type { BoardColumn, BoardSettings, BoardViewConfig, GitlabLink, Issue } from "./types.ts";

/** The wall board has room for four columns. */
export const WALL_MAX_COLUMNS = 4;
const MAX_COLUMNS = 16;
const PALETTE = ["#ffe680", "#9fd8ff", "#ffc0dd", "#b7f0b1", "#d9c8ff", "#ffd2a8", "#c8f2ee", "#e3e3ea"];

export class BoardSettingsError extends Error {}

export function defaultBoardSettings(): BoardSettings {
  const columns: BoardColumn[] = [
    { id: "todo", title: "To do", color: "#ffe680", gitlabLabel: null, gitlabState: "opened" },
    { id: "doing", title: "Doing", color: "#9fd8ff", gitlabLabel: "Doing", gitlabState: null },
    { id: "review", title: "Review", color: "#ffc0dd", gitlabLabel: "Review", gitlabState: null },
    { id: "done", title: "Done", color: "#b7f0b1", gitlabLabel: null, gitlabState: "closed" },
  ];
  return {
    columns,
    wall: { columns: columns.map((c) => c.id), tags: "all" },
    view: { columns: columns.map((c) => c.id), tags: "all" },
    flow: { onAssign: "doing", onFinish: "review" },
    gitlab: { enabled: false, baseUrl: "https://gitlab.com", project: "", boardId: null },
  };
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "column"
  );
}

/** Reads a GitLab URL like https://gitlab.com/group/project/-/boards/12 (or the project URL). */
export function parseGitlabUrl(input: string): { baseUrl: string; project: string; boardId: number | null } | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const [projectPart, rest = ""] = url.pathname.split("/-/");
  const project = projectPart.replace(/^\/+|\/+$/g, "").replace(/\.git$/, "");
  if (!project || project.startsWith("groups/")) return null;
  const board = rest.match(/^boards\/(\d+)/);
  return { baseUrl: url.origin, project, boardId: board ? Number(board[1]) : null };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const fail = (msg: string): never => {
  throw new BoardSettingsError(msg);
};

function readColumns(input: unknown): BoardColumn[] {
  if (!Array.isArray(input) || !input.length) fail("columns must be a non-empty array");
  const list = input as unknown[];
  if (list.length > MAX_COLUMNS) fail(`at most ${MAX_COLUMNS} columns`);
  const seen = new Set<string>();
  return list.map((raw, i) => {
    if (!isObj(raw)) return fail(`columns[${i}] must be an object`);
    const title = str(raw.title, 60) || str(raw.gitlabLabel, 60);
    if (!title) fail(`columns[${i}] needs a title`);
    let id = str(raw.id, 40) ? slugify(str(raw.id, 40)) : slugify(title);
    if (seen.has(id)) {
      if (str(raw.id)) fail(`duplicate column id "${id}"`);
      let n = 2;
      while (seen.has(`${id}-${n}`)) n++;
      id = `${id}-${n}`;
    }
    seen.add(id);
    const color = /^#[0-9a-f]{6}$/i.test(str(raw.color)) ? str(raw.color) : PALETTE[i % PALETTE.length];
    const gitlabLabel = str(raw.gitlabLabel, 255) || null;
    const state = raw.gitlabState;
    if (state != null && state !== "opened" && state !== "closed") fail(`columns[${i}].gitlabState must be "opened", "closed" or null`);
    if (gitlabLabel && state) fail(`columns[${i}] can mirror a GitLab label or a state (Open/Closed), not both`);
    return { id, title, color, gitlabLabel, gitlabState: (state as BoardColumn["gitlabState"]) ?? null };
  });
}

function readView(input: unknown, prev: BoardViewConfig, ids: Set<string>, max: number, name: string): BoardViewConfig {
  if (!isObj(input)) return fail(`${name} must be an object`);
  const next = { ...prev };
  if (input.columns !== undefined) {
    if (!Array.isArray(input.columns) || !input.columns.length) fail(`${name}.columns must be a non-empty array of column ids`);
    const cols = [...new Set((input.columns as unknown[]).map((c) => String(c)))];
    const unknown = cols.filter((c) => !ids.has(c));
    if (unknown.length) fail(`${name}.columns has unknown column id(s): ${unknown.join(", ")}`);
    if (cols.length > max) fail(`${name} can show at most ${max} columns`);
    next.columns = cols;
  }
  if (input.tags !== undefined) {
    if (input.tags === "all" || input.tags === "none") next.tags = input.tags;
    else if (Array.isArray(input.tags)) next.tags = [...new Set(input.tags.map((t) => String(t).trim()).filter(Boolean))].slice(0, 50);
    else fail(`${name}.tags must be "all", "none" or an array of tag names`);
  }
  return next;
}

function readGitlab(input: unknown, prev: GitlabLink): GitlabLink {
  if (!isObj(input)) return fail("gitlab must be an object");
  const next = { ...prev };
  if (typeof input.url === "string" && input.url.trim()) {
    const parsed = parseGitlabUrl(input.url);
    if (!parsed) fail("gitlab.url must be a GitLab project or project board URL, e.g. https://gitlab.com/group/project/-/boards/12");
    Object.assign(next, parsed);
  }
  if (input.baseUrl !== undefined) {
    let base: URL | null = null;
    try {
      base = new URL(String(input.baseUrl));
    } catch {
      /* handled below */
    }
    if (!base || (base.protocol !== "https:" && base.protocol !== "http:")) fail("gitlab.baseUrl must be an http(s) URL");
    next.baseUrl = base!.origin;
  }
  if (input.project !== undefined) next.project = str(input.project, 300).replace(/^\/+|\/+$/g, "");
  if (input.boardId !== undefined) {
    const n = input.boardId === null || input.boardId === "" ? null : Number(input.boardId);
    if (n !== null && (!Number.isInteger(n) || n <= 0)) fail("gitlab.boardId must be a positive integer or null");
    next.boardId = n;
  }
  if (input.enabled !== undefined) next.enabled = Boolean(input.enabled);
  if (next.enabled && !next.project) fail("set gitlab.project (or gitlab.url) before enabling the GitLab link");
  return next;
}

/**
 * Applies a partial edit to board settings and validates the result. Throws
 * BoardSettingsError with a readable message when the edit doesn't make sense.
 */
export function applyBoardPatch(prev: BoardSettings, patch: unknown): BoardSettings {
  if (!isObj(patch)) fail("settings must be a JSON object");
  const p = patch as Record<string, unknown>;
  const next: BoardSettings = structuredClone(prev);
  if (p.columns !== undefined) {
    next.columns = readColumns(p.columns);
    // Keep each view's choices for columns that still exist; new columns join the board view.
    const ids = new Set(next.columns.map((c) => c.id));
    const known = new Set(prev.columns.map((c) => c.id));
    next.wall.columns = next.wall.columns.filter((id) => ids.has(id));
    next.view.columns = [
      ...next.view.columns.filter((id) => ids.has(id)),
      ...next.columns.filter((c) => !known.has(c.id)).map((c) => c.id),
    ];
  }
  const ids = new Set(next.columns.map((c) => c.id));
  if (p.wall !== undefined) next.wall = readView(p.wall, next.wall, ids, WALL_MAX_COLUMNS, "wall");
  if (p.view !== undefined) next.view = readView(p.view, next.view, ids, MAX_COLUMNS, "view");
  if (!next.view.columns.length) next.view.columns = next.columns.map((c) => c.id);
  if (!next.wall.columns.length) next.wall.columns = next.view.columns.slice(0, WALL_MAX_COLUMNS);
  if (p.flow !== undefined) {
    if (!isObj(p.flow)) fail("flow must be an object");
    const flow = p.flow as Record<string, unknown>;
    for (const key of ["onAssign", "onFinish"] as const) {
      if (flow[key] === undefined) continue;
      if (!ids.has(String(flow[key]))) fail(`flow.${key} must be a column id (${[...ids].join(", ")})`);
      next.flow[key] = String(flow[key]);
    }
  }
  if (!ids.has(next.flow.onAssign)) next.flow.onAssign = guessColumn(next.columns, /doing|progress|active|wip|develop/i, 1);
  if (!ids.has(next.flow.onFinish)) next.flow.onFinish = guessColumn(next.columns, /review|qa|test|verify/i, -2);
  if (p.gitlab !== undefined) next.gitlab = readGitlab(p.gitlab, next.gitlab);
  return next;
}

function guessColumn(columns: BoardColumn[], pattern: RegExp, fallbackIndex: number): string {
  const hit = columns.find((c) => pattern.test(c.title) || pattern.test(c.id));
  if (hit) return hit.id;
  const i = fallbackIndex < 0 ? columns.length + fallbackIndex : fallbackIndex;
  return columns[Math.max(0, Math.min(columns.length - 1, i))].id;
}

/** Fills in anything missing from settings loaded from disk (older versions, hand edits). */
export function normalizeBoardSettings(raw: unknown): BoardSettings {
  const base = defaultBoardSettings();
  if (!isObj(raw)) return base;
  try {
    return applyBoardPatch(base, raw);
  } catch {
    return base;
  }
}

/** The configured columns of a view, in display order. */
export function viewColumns(settings: BoardSettings, view: BoardViewConfig): BoardColumn[] {
  const byId = new Map(settings.columns.map((c) => [c.id, c]));
  return view.columns.map((id) => byId.get(id)).filter((c): c is BoardColumn => Boolean(c));
}

/** The tags a view shows on this card. */
export function visibleTags(issue: Issue, view: BoardViewConfig, settings: BoardSettings): string[] {
  if (view.tags === "none") return [];
  // A column's own label is already said by the column it sits in.
  const columnLabels = new Set(settings.columns.map((c) => c.gitlabLabel?.toLowerCase()).filter(Boolean));
  const tags = issue.labels.filter((l) => !columnLabels.has(l.toLowerCase()));
  if (view.tags === "all") return tags;
  const wanted = new Set(view.tags.map((t) => t.toLowerCase()));
  return tags.filter((t) => wanted.has(t.toLowerCase()));
}

/** Color for a tag: GitLab's label color when known, otherwise a stable pastel. */
export function tagColor(name: string, labels: { name: string; color: string }[]): string {
  const known = labels.find((l) => l.name === name)?.color;
  if (known) return known;
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return `hsl(${Math.abs(hash) % 360} 70% 80%)`;
}

/** Black or white text, whichever reads better on this background. */
export function inkOn(color: string): string {
  const m = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return "#2e3040";
  const [r, g, b] = m.slice(1).map((x) => parseInt(x, 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#2e3040" : "#ffffff";
}
