// Minimal GitLab REST (v4) client for mirroring a project's issues onto the office board.

import type { BoardColumn, GitlabLink } from "../shared/types.ts";

type Json = any;

export interface GitlabTarget {
  baseUrl: string;
  project: string;
  token: string | null;
}

export interface GitlabIssue {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string | null;
  state: "opened" | "closed";
  labels: string[];
  web_url: string;
  created_at: string;
  updated_at: string;
  author?: { username?: string };
}

export class GitlabError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function targetOf(link: GitlabLink, token: string | null): GitlabTarget {
  return { baseUrl: link.baseUrl.replace(/\/+$/, ""), project: link.project, token };
}

async function request(t: GitlabTarget, method: string, path: string, body?: unknown): Promise<{ data: Json; headers: Headers }> {
  const project = encodeURIComponent(t.project);
  const url = `${t.baseUrl}/api/v4/projects/${project}${path}`;
  const headers: Record<string, string> = { accept: "application/json" };
  if (t.token) headers["PRIVATE-TOKEN"] = t.token;
  if (body !== undefined) headers["content-type"] = "application/json";
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    throw new GitlabError(`Couldn't reach ${t.baseUrl}: ${(error as Error).message}`, 502);
  }
  const text = await res.text();
  let data: Json = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const detail = typeof data === "object" && data ? (data.message ?? data.error ?? JSON.stringify(data)) : String(data ?? "");
    const hint =
      res.status === 401 ? " (check the access token)" : res.status === 404 ? ` (is "${t.project}" right, and can the token see it?)` : "";
    throw new GitlabError(`GitLab ${res.status}: ${typeof detail === "string" ? detail : JSON.stringify(detail)}${hint}`, res.status === 404 ? 404 : 502);
  }
  return { data, headers: res.headers };
}

async function pages(t: GitlabTarget, path: string, maxPages: number): Promise<Json[]> {
  const out: Json[] = [];
  let page = 1;
  while (page && page <= maxPages) {
    const sep = path.includes("?") ? "&" : "?";
    const { data, headers } = await request(t, "GET", `${path}${sep}page=${page}`);
    if (Array.isArray(data)) out.push(...data);
    page = Number(headers.get("x-next-page") || 0);
  }
  return out;
}

/** Open issues (up to 500) plus the most recently closed ones if the board shows a Closed column. */
export async function listIssues(t: GitlabTarget, opts: { closed: boolean }): Promise<GitlabIssue[]> {
  const open = await pages(t, "/issues?state=opened&per_page=100&order_by=updated_at&sort=desc", 5);
  const closed = opts.closed ? await pages(t, "/issues?state=closed&per_page=50&order_by=updated_at&sort=desc", 1) : [];
  return [...open, ...closed];
}

export async function listLabels(t: GitlabTarget): Promise<{ name: string; color: string }[]> {
  const labels = await pages(t, "/labels?per_page=100&include_ancestor_groups=true", 3);
  return labels.map((l: Json) => ({ name: String(l.name), color: String(l.color ?? "#e3e3ea") }));
}

/** Columns that mirror a GitLab issue board: Open, its label lists in order, then Closed. */
export async function boardColumns(t: GitlabTarget, boardId: number): Promise<Omit<BoardColumn, "id">[]> {
  const { data: board } = await request(t, "GET", `/boards/${boardId}`);
  const lists: Json[] = [...(board.lists ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const cols: Omit<BoardColumn, "id">[] = [];
  if (!board.hide_backlog_list) cols.push({ title: "Open", color: "#e3e3ea", gitlabLabel: null, gitlabState: "opened" });
  for (const list of lists) {
    if (!list.label?.name) continue; // assignee / milestone / iteration lists have no label
    const color = /^#[0-9a-f]{6}$/i.test(list.label.color ?? "") ? list.label.color : "#e3e3ea";
    cols.push({ title: list.label.name, color, gitlabLabel: list.label.name, gitlabState: null });
  }
  if (!board.hide_closed_list) cols.push({ title: "Closed", color: "#b7f0b1", gitlabLabel: null, gitlabState: "closed" });
  return cols;
}

export async function createIssue(t: GitlabTarget, body: { title: string; description: string; labels: string[] }): Promise<GitlabIssue> {
  const { data } = await request(t, "POST", "/issues", { ...body, labels: body.labels.join(",") });
  return data;
}

export async function updateIssue(
  t: GitlabTarget,
  iid: number,
  body: { title?: string; description?: string; labels?: string[]; add_labels?: string[]; remove_labels?: string[]; state_event?: "close" | "reopen" },
): Promise<GitlabIssue> {
  const payload: Json = { ...body };
  for (const k of ["labels", "add_labels", "remove_labels"]) {
    if (Array.isArray(payload[k])) payload[k] = payload[k].join(",");
  }
  const { data } = await request(t, "PUT", `/issues/${iid}`, payload);
  return data;
}

/** Which board column a GitLab issue sits in, following GitLab's own board rules. */
export function columnForIssue(issue: { state: string; labels: string[] }, columns: BoardColumn[]): BoardColumn | null {
  if (issue.state === "closed") return columns.find((c) => c.gitlabState === "closed") ?? null;
  const labels = new Set(issue.labels.map((l) => l.toLowerCase()));
  const byLabel = columns.find((c) => c.gitlabLabel && labels.has(c.gitlabLabel.toLowerCase()));
  if (byLabel) return byLabel;
  // GitLab's Open list holds open issues that aren't in any label list.
  return columns.find((c) => c.gitlabState === "opened") ?? null;
}

/** The GitLab edit that moves an issue into a column. */
export function moveEdit(issue: { state: string; labels: string[] }, to: BoardColumn, columns: BoardColumn[]) {
  if (!to.gitlabLabel && !to.gitlabState) {
    throw new GitlabError(`Column "${to.title}" isn't linked to a GitLab label or state, so GitLab tickets can't move there`, 400);
  }
  const has = new Set(issue.labels.map((l) => l.toLowerCase()));
  const remove = columns
    .filter((c) => c.gitlabLabel && c.id !== to.id && has.has(c.gitlabLabel.toLowerCase()))
    .map((c) => c.gitlabLabel!);
  const edit: { add_labels?: string[]; remove_labels?: string[]; state_event?: "close" | "reopen" } = {};
  if (remove.length) edit.remove_labels = remove;
  if (to.gitlabLabel && !has.has(to.gitlabLabel.toLowerCase())) edit.add_labels = [to.gitlabLabel];
  if (to.gitlabState === "closed" && issue.state !== "closed") edit.state_event = "close";
  if (to.gitlabState !== "closed" && issue.state === "closed") edit.state_event = "reopen";
  return edit;
}
