// The office bridge: a tiny HTTP API + server-sent-events stream that the 3D client
// (and agents like the issue-board PM) use. Mounted into Vite in dev, or served by
// server/main.ts in production.

import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { T3Client } from "./t3.ts";
import { Store } from "./store.ts";
import {
  DESK_COUNT,
  PM_DESK,
  type Activity,
  type ActivityItem,
  type AgentInfo,
  type Issue,
  type IssueStatus,
  type OfficeSnapshot,
  type PendingRequest,
  type ProjectInfo,
  type ThreadDetail,
} from "../shared/types.ts";

type Json = any;
type Next = (err?: unknown) => void;

const RUNNING = new Set(["preparing", "queued", "starting", "running"]);
const POLL_MS = 1500;

export interface BridgeOptions {
  dataFile: string;
  /** Where agents can reach this bridge, e.g. http://127.0.0.1:5199 */
  publicUrl: () => string;
}

export function createBridge(options: BridgeOptions) {
  const t3 = new T3Client();
  const store = new Store(options.dataFile);
  const clients = new Set<ServerResponse>();
  const detailCache = new Map<string, { key: string; detail: ThreadDetail }>();
  const prevActivity = new Map<string, Activity>();
  const deskReservations = new Map<string, number[]>(); // projectId -> desks being hired into

  let snapshot: OfficeSnapshot = {
    connected: false,
    error: null,
    projects: [],
    agents: [],
    issues: store.data.issues,
    pm: store.data.pm,
    bridgeUrl: options.publicUrl(),
  };
  let lastSent = "";
  let rawThreads = new Map<string, Json>();
  let pollTimer: ReturnType<typeof setTimeout> | null = null;
  let polling = false;

  // ---------------------------------------------------------------- polling

  function deriveActivity(t: Json): Activity {
    if (t.pendingRuntimeRequest) return "needs-input";
    const status = String(t.status ?? "idle");
    if (RUNNING.has(status)) return "working";
    if (status === "waiting") return t.blockedOnThreadWait ? "working" : "needs-input";
    const completedAt = t.latestRunCompletedAt ? Date.parse(t.latestRunCompletedAt) : 0;
    const visitedAt = t.lastVisitedAt ? Date.parse(t.lastVisitedAt) : 0;
    const unseen = completedAt > 0 && visitedAt < completedAt && !t.settledAt;
    if (status === "failed") return unseen ? "error" : "idle";
    if (status === "completed" || status === "interrupted" || status === "cancelled") {
      return unseen ? "done" : "idle";
    }
    return "idle";
  }

  function assignDesks(agents: AgentInfo[]) {
    const desks = store.data.desks;
    const present = new Set(agents.map((a) => a.id));
    let changed = false;
    for (const id of Object.keys(desks)) {
      if (!present.has(id)) {
        delete desks[id];
        changed = true;
      }
    }
    const byProject = new Map<string, AgentInfo[]>();
    for (const a of agents) {
      const list = byProject.get(a.projectId) ?? [];
      list.push(a);
      byProject.set(a.projectId, list);
    }
    for (const [projectId, list] of byProject) {
      const taken = new Set<number>();
      const reserved = new Set(deskReservations.get(projectId) ?? []);
      for (const a of list) {
        const seat = desks[a.id];
        if (a.isPm) {
          a.desk = PM_DESK;
          continue;
        }
        if (seat && seat.projectId === projectId && seat.desk >= 0 && seat.desk < DESK_COUNT && !taken.has(seat.desk)) {
          a.desk = seat.desk;
          taken.add(seat.desk);
        }
      }
      const newcomers = list
        .filter((a) => a.desk === null && !a.isPm)
        .sort((x, y) => Date.parse(y.updatedAt) - Date.parse(x.updatedAt));
      for (const a of newcomers) {
        let desk = -1;
        for (let i = 0; i < DESK_COUNT; i++) {
          if (!taken.has(i) && !reserved.has(i)) {
            desk = i;
            break;
          }
        }
        if (desk < 0) continue;
        a.desk = desk;
        taken.add(desk);
        desks[a.id] = { projectId, desk };
        changed = true;
      }
    }
    if (changed) store.save();
  }

  function updateIssuesFromActivity(agents: AgentInfo[]) {
    let changed = false;
    const byId = new Map(agents.map((a) => [a.id, a]));
    for (const issue of store.data.issues) {
      if (issue.status !== "doing" || !issue.assignee) continue;
      const agent = byId.get(issue.assignee);
      if (!agent) continue;
      const before = prevActivity.get(agent.id);
      if (before === "working" && (agent.activity === "done" || agent.activity === "idle")) {
        issue.status = "review";
        issue.updatedAt = new Date().toISOString();
        changed = true;
      }
    }
    for (const a of agents) prevActivity.set(a.id, a.activity);
    if (changed) store.save();
  }

  async function poll() {
    if (polling) return;
    polling = true;
    try {
      const shell = await t3.shell();
      const projects: ProjectInfo[] = (shell.projects ?? [])
        .filter((p: Json) => !p.archivedAt && !p.deletedAt)
        .map((p: Json) => ({ id: p.id, title: p.title, workspaceRoot: p.workspaceRoot }));
      const projectIds = new Set(projects.map((p) => p.id));
      const pmIds = new Set(Object.values(store.data.pm));
      rawThreads = new Map();
      const agents: AgentInfo[] = [];
      for (const t of shell.threads ?? []) {
        if (t.archivedAt || t.deletedAt) continue;
        if (!projectIds.has(t.projectId)) continue;
        if (t.lineage?.relationshipToParent === "subagent") continue;
        rawThreads.set(t.id, t);
        agents.push({
          id: t.id,
          projectId: t.projectId,
          title: t.title,
          status: t.status,
          activity: deriveActivity(t),
          pendingKind: t.pendingRuntimeRequest?.kind ?? null,
          lastMessage: t.latestVisibleMessage?.text?.slice(0, 600) ?? null,
          lastMessageRole: t.latestVisibleMessage?.role ?? null,
          model: t.modelSelection?.model ?? null,
          provider: t.providerInstanceId ?? null,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          link: t3.threadLink(t.id),
          lastError: t.lastError ?? null,
          desk: null,
          isPm: pmIds.has(t.id),
        });
      }
      // Forget PMs whose threads are gone.
      for (const [pid, tid] of Object.entries(store.data.pm)) {
        if (!rawThreads.has(tid)) {
          delete store.data.pm[pid];
          store.save();
        }
      }
      assignDesks(agents);
      updateIssuesFromActivity(agents);
      snapshot = {
        connected: true,
        error: null,
        projects,
        agents,
        issues: store.data.issues,
        pm: store.data.pm,
        bridgeUrl: options.publicUrl(),
      };
    } catch (error) {
      snapshot = { ...snapshot, connected: false, error: error instanceof Error ? error.message : String(error) };
    } finally {
      polling = false;
    }
    broadcast();
  }

  function schedule() {
    pollTimer = setTimeout(async () => {
      await poll();
      schedule();
    }, POLL_MS);
  }

  function broadcast(force = false) {
    snapshot.issues = store.data.issues;
    snapshot.pm = store.data.pm;
    const body = JSON.stringify(snapshot);
    if (!force && body === lastSent) return;
    lastSent = body;
    for (const res of clients) res.write(`event: snapshot\ndata: ${body}\n\n`);
  }

  // ---------------------------------------------------------------- details

  function itemText(item: Json): ActivityItem | null {
    const base = {
      id: String(item.id),
      title: item.title ?? null,
      status: item.status ?? null,
      at: item.startedAt ?? item.updatedAt ?? null,
    };
    const clip = (s: unknown, n = 4000) => String(s ?? "").slice(0, n);
    switch (item.type) {
      case "user_message":
        return { ...base, type: "user", text: clip(item.text) };
      case "assistant_message":
        return { ...base, type: "assistant", text: clip(item.text, 8000) };
      case "reasoning":
        return { ...base, type: "thinking", text: clip(item.text, 1200) };
      case "command_execution":
        if (item.input === "Preparing workspace") return null;
        return { ...base, type: "command", text: clip(item.input, 600) };
      case "file_change":
        return {
          ...base,
          type: "file",
          text: `${item.fileName}${item.additions != null ? `  +${item.additions}` : ""}${item.deletions != null ? ` -${item.deletions}` : ""}`,
        };
      case "file_search":
        return { ...base, type: "search", text: clip(item.pattern ?? item.title ?? "search") };
      case "web_search":
        return { ...base, type: "web", text: clip((item.patterns ?? []).join(", ") || item.title || "web search") };
      case "todo_list":
        return {
          ...base,
          type: "todo",
          text: (item.steps ?? [])
            .map((s: Json) => `${s.status === "completed" ? "☑" : s.status === "in_progress" ? "▶" : "☐"} ${s.step ?? s.text ?? s.title ?? ""}`)
            .join("\n"),
        };
      case "proposed_plan":
        return { ...base, type: "plan", text: clip(item.markdown, 4000) };
      case "user_input_request":
        return { ...base, type: "question", text: (item.questions ?? []).map((q: Json) => q.question).join("\n") };
      case "approval_request":
        return { ...base, type: "approval", text: clip(item.prompt ?? item.reason ?? item.requestKind) };
      case "error":
        return { ...base, type: "error", text: clip(item.message ?? item.text ?? item.title ?? "Error") };
      case "system_notice":
        return { ...base, type: "notice", text: clip(item.text ?? item.message ?? item.title ?? "") };
      default:
        return null;
    }
  }

  async function getDetail(threadId: string): Promise<ThreadDetail> {
    const raw = rawThreads.get(threadId);
    const key = raw ? `${raw.updatedAt}|${raw.itemCount}|${raw.pendingRuntimeRequest?.id ?? ""}` : "";
    const cached = detailCache.get(threadId);
    if (cached && key && cached.key === key) return cached.detail;
    const snap = await t3.threadSnapshot(threadId);
    const projection = snap.projection ?? {};
    const visible: Json[] = projection.visibleTurnItems ?? [];
    const turnItems: Json[] = visible.length
      ? [...visible].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((v) => v.item ?? v)
      : [...(projection.turnItems ?? [])].sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0));
    const items = turnItems.slice(-80).map(itemText).filter((x): x is ActivityItem => x !== null);
    let pending: PendingRequest | null = null;
    const pendingReq = (projection.runtimeRequests ?? []).find((r: Json) => r.status === "pending");
    if (pendingReq) {
      const match = turnItems.find((i) => i.requestId === pendingReq.id);
      pending = {
        requestId: pendingReq.id,
        kind: pendingReq.kind,
        prompt: match?.prompt ?? null,
        reason: match?.reason ?? null,
        questions: (match?.questions ?? []).map((q: Json) => ({
          id: q.id,
          header: q.header,
          question: q.question,
          multiSelect: Boolean(q.multiSelect),
          options: q.options ?? [],
        })),
        options: (match?.options ?? []).map((o: Json) => ({ decision: o.decision, label: o.label })),
      };
    }
    const detail: ThreadDetail = { id: threadId, items, pending };
    detailCache.set(threadId, { key, detail });
    return detail;
  }

  // ---------------------------------------------------------------- issues + PM

  function findIssue(id: string): Issue {
    const issue = store.data.issues.find((i) => i.id === id);
    if (!issue) throw httpError(404, "No such issue");
    return issue;
  }

  function ticketMessage(issue: Issue) {
    const base = options.publicUrl();
    return [
      `You've been assigned ticket #${issue.id.slice(0, 6)} from the office issue board.`,
      ``,
      `# ${issue.title}`,
      issue.body ? `\n${issue.body}\n` : "",
      `When you finish, mark the ticket for review: curl -s -X PATCH ${base}/api/issues/${issue.id} -H 'content-type: application/json' -d '{"status":"review"}'`,
    ].join("\n");
  }

  function pmBrief(project: ProjectInfo) {
    const base = options.publicUrl();
    return `You are the Issue Board Manager for the "${project.title}" floor of Agent Office, a 3D office where coding agents (T3 Code threads) work at desks. Project folder: ${project.workspaceRoot}. Project id: ${project.id}.

Your job is to run the floor's issue board: turn the boss's requests into clear tickets, keep the board tidy, and get tickets done by assigning them to agents. Don't write the project code yourself. Delegate it.

Board API (JSON over HTTP, use curl):
- List tickets:     curl -s '${base}/api/issues?projectId=${project.id}'
- Create a ticket:  curl -s -X POST ${base}/api/issues -H 'content-type: application/json' -d '{"projectId":"${project.id}","title":"...","body":"..."}'
- Update a ticket:  curl -s -X PATCH ${base}/api/issues/<id> -H 'content-type: application/json' -d '{"status":"todo|doing|review|done","title":"...","body":"..."}'
- Delete a ticket:  curl -s -X DELETE ${base}/api/issues/<id>
- List agents on this floor (id, title, activity): curl -s '${base}/api/agents?projectId=${project.id}'
- Assign a ticket to an existing agent (sends them the ticket): curl -s -X POST ${base}/api/issues/<id>/assign -H 'content-type: application/json' -d '{"threadId":"<agent id>"}'
- Hire a new agent for a ticket (they take a free desk and start on it): curl -s -X POST ${base}/api/issues/<id>/hire

Prefer assigning to idle agents whose title fits the work; hire a new agent when nobody fits. Keep replies short and say what you changed on the board. Start by checking the board and the agents, then say hi to the boss in one or two sentences and wait for instructions.`;
  }

  async function hire(projectId: string, opts: { message: string; title?: string; model?: string; provider?: string; desk?: number }) {
    const desk = typeof opts.desk === "number" && opts.desk >= 0 && opts.desk < DESK_COUNT ? opts.desk : undefined;
    if (desk !== undefined) {
      deskReservations.set(projectId, [...(deskReservations.get(projectId) ?? []), desk]);
    }
    try {
      const { threadId } = await t3.startThread({
        projectId,
        message: opts.message,
        title: opts.title,
        model: opts.model,
        provider: opts.provider,
      });
      if (desk !== undefined) {
        for (const [id, seat] of Object.entries(store.data.desks)) {
          if (seat.projectId === projectId && seat.desk === desk && id !== threadId) delete store.data.desks[id];
        }
        store.data.desks[threadId] = { projectId, desk };
        store.save();
      }
      return threadId;
    } finally {
      if (desk !== undefined) {
        const list = (deskReservations.get(projectId) ?? []).filter((d) => d !== desk);
        deskReservations.set(projectId, list);
      }
      void poll();
    }
  }

  // ---------------------------------------------------------------- routing

  async function route(method: string, path: string, query: URLSearchParams, body: Json): Promise<Json> {
    const parts = path.split("/").filter(Boolean).map(decodeURIComponent); // ["api", ...]
    const [, a, b, c] = parts;

    if (method === "GET" && a === "state") return snapshot;
    if (method === "GET" && a === "agents") {
      const pid = query.get("projectId");
      return snapshot.agents
        .filter((x) => !pid || x.projectId === pid)
        .map(({ id, title, activity, status, projectId, desk, isPm }) => ({ id, title, activity, status, projectId, desk, isPm }));
    }
    if (method === "GET" && a === "threads" && b && !c) return getDetail(b);

    if (method === "POST" && a === "hire") {
      if (!body.projectId || !body.message) throw httpError(400, "projectId and message are required");
      const threadId = await hire(body.projectId, body);
      return { threadId };
    }

    if (method === "POST" && a === "threads" && b) {
      switch (c) {
        case "send":
          if (!body.text?.trim()) throw httpError(400, "text is required");
          await t3.sendMessage(b, body.text);
          break;
        case "archive":
          await t3.archive(b);
          break;
        case "stop":
          await t3.stop(b);
          break;
        case "settle":
          await t3.settle(b);
          break;
        case "visit":
          await t3.visit(b);
          break;
        case "respond":
          await t3.respond(b, body.requestId, body);
          break;
        default:
          throw httpError(404, "Unknown thread action");
      }
      detailCache.delete(b);
      void poll();
      return { ok: true };
    }

    if (method === "POST" && a === "meeting") {
      const ids: string[] = body.threadIds ?? [];
      if (!ids.length || !body.text?.trim()) throw httpError(400, "threadIds and text are required");
      const roster = ids
        .map((id) => snapshot.agents.find((x) => x.id === id))
        .filter(Boolean)
        .map((x) => `"${x!.title}"`)
        .join(", ");
      const message = `[Office meeting. Attendees: you and ${ids.length - 1} other agent(s): ${roster}. The boss says:]\n\n${body.text}\n\n(Reply briefly and directly, as in a meeting.)`;
      const results = await Promise.allSettled(ids.map((id) => t3.sendMessage(id, message)));
      void poll();
      return { sent: results.filter((r) => r.status === "fulfilled").length };
    }

    if (method === "POST" && a === "projects") {
      if (!body.path) throw httpError(400, "path is required");
      await t3.addProject(body.path);
      void poll();
      return { ok: true };
    }

    if (method === "POST" && a === "pm") {
      const projectId = body.projectId;
      const project = snapshot.projects.find((p) => p.id === projectId);
      if (!project) throw httpError(404, "Unknown project");
      const existing = store.data.pm[projectId];
      if (existing && rawThreads.has(existing)) return { threadId: existing };
      const { threadId } = await t3.startThread({
        projectId,
        message: pmBrief(project),
        title: `Issue Board PM · ${project.title}`,
      });
      store.data.pm[projectId] = threadId;
      store.save();
      void poll();
      return { threadId };
    }

    if (a === "issues") {
      if (method === "GET" && !b) {
        const pid = query.get("projectId");
        return store.data.issues.filter((i) => !pid || i.projectId === pid);
      }
      if (method === "POST" && !b) {
        if (!body.projectId || !body.title) throw httpError(400, "projectId and title are required");
        const now = new Date().toISOString();
        const issue: Issue = {
          id: randomUUID(),
          projectId: body.projectId,
          title: String(body.title).slice(0, 200),
          body: String(body.body ?? "").slice(0, 8000),
          status: "todo",
          assignee: null,
          createdBy: body.createdBy ?? "agent",
          createdAt: now,
          updatedAt: now,
        };
        store.data.issues.push(issue);
        store.save();
        broadcast();
        return issue;
      }
      if (b) {
        const issue = findIssue(b);
        if (method === "PATCH" && !c) {
          const statuses: IssueStatus[] = ["todo", "doing", "review", "done"];
          if (body.status && statuses.includes(body.status)) issue.status = body.status;
          if (typeof body.title === "string") issue.title = body.title.slice(0, 200);
          if (typeof body.body === "string") issue.body = body.body.slice(0, 8000);
          if (body.assignee !== undefined) issue.assignee = body.assignee;
          issue.updatedAt = new Date().toISOString();
          store.save();
          broadcast();
          return issue;
        }
        if (method === "DELETE" && !c) {
          store.data.issues = store.data.issues.filter((i) => i.id !== issue.id);
          store.save();
          broadcast();
          return { ok: true };
        }
        if (method === "POST" && c === "assign") {
          if (!body.threadId) throw httpError(400, "threadId is required");
          await t3.sendMessage(body.threadId, ticketMessage(issue));
          issue.assignee = body.threadId;
          issue.status = "doing";
          issue.updatedAt = new Date().toISOString();
          store.save();
          broadcast();
          return issue;
        }
        if (method === "POST" && c === "hire") {
          const threadId = await hire(issue.projectId, {
            message: ticketMessage(issue),
            title: issue.title,
            desk: typeof body.desk === "number" ? body.desk : undefined,
          });
          issue.assignee = threadId;
          issue.status = "doing";
          issue.updatedAt = new Date().toISOString();
          store.save();
          broadcast();
          return { issue, threadId };
        }
      }
    }
    throw httpError(404, `No route for ${method} ${path}`);
  }

  async function middleware(req: IncomingMessage, res: ServerResponse, next: Next) {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (!url.pathname.startsWith("/api/")) return next();
    // Agents here run with full access, so only this machine's own pages and local
    // tools (curl) may drive them: reject DNS-rebound hosts and cross-site origins.
    if (!isLocalRequest(req)) {
      res.statusCode = 403;
      return res.end("Forbidden");
    }
    if (url.pathname === "/api/events") {
      res.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      });
      res.write(`event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`);
      clients.add(res);
      const keepAlive = setInterval(() => res.write(": ping\n\n"), 15000);
      req.on("close", () => {
        clearInterval(keepAlive);
        clients.delete(res);
      });
      return;
    }
    try {
      const body = req.method === "GET" ? {} : await readJson(req);
      const result = await route(req.method ?? "GET", url.pathname, url.searchParams, body);
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(result));
    } catch (error) {
      const status = (error as { status?: number }).status ?? 500;
      res.statusCode = status;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
    }
  }

  void poll().then(schedule);

  return {
    middleware,
    close() {
      if (pollTimer) clearTimeout(pollTimer);
      for (const res of clients) res.end();
    },
  };
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

function hostnameOf(value: string): string | null {
  try {
    return new URL(value.includes("://") ? value : `http://${value}`).hostname;
  } catch {
    return null;
  }
}

function isLocalRequest(req: IncomingMessage): boolean {
  const host = hostnameOf(req.headers.host ?? "");
  if (!host || !LOCAL_HOSTS.has(host)) return false;
  const origin = req.headers.origin;
  if (origin && origin !== "null") {
    const originHost = hostnameOf(origin);
    if (!originHost || !LOCAL_HOSTS.has(originHost)) return false;
  } else if (origin === "null") {
    return false;
  }
  return true;
}

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function readJson(req: IncomingMessage): Promise<Json> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) reject(httpError(413, "Body too large"));
    });
    req.on("end", () => {
      if (!data.trim()) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(httpError(400, "Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}
