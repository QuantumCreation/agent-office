// Talks to the locally running T3 Code server.
//
// Reads use the environment HTTP API (shell snapshot + per-thread snapshots) with a
// scoped bearer token minted by the `t3` CLI. Commands that the CLI doesn't expose
// (archive, stop, settle, answering agent questions) go over the server's WebSocket
// RPC (`orchestration.dispatchCommand`). Starting and messaging threads uses the
// official `t3 thread start|send` CLI commands.

import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const T3_HOME = process.env.T3CODE_HOME ?? join(homedir(), ".t3");
export const T3_CLI = process.env.T3_CLI ?? join(T3_HOME, "bin", "t3");
const PROTOCOL_HEADER = { "x-t3-orchestration-protocol": "2" };

type Json = any;

function readRuntime(): { origin: string } {
  const raw = readFileSync(join(T3_HOME, "userdata", "server-runtime.json"), "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed.origin) throw new Error("T3 Code server runtime file has no origin. Is T3 Code running?");
  return parsed;
}

function readEnvironmentId(): string | null {
  try {
    return readFileSync(join(T3_HOME, "userdata", "environment-id"), "utf8").trim();
  } catch {
    return null;
  }
}

export function runCli(args: string[], input?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      T3_CLI,
      args,
      { maxBuffer: 32 * 1024 * 1024, timeout: 120_000, env: process.env },
      (error, stdout, stderr) => {
        if (error) {
          const detail = (stderr || stdout || error.message).toString().trim();
          reject(new Error(detail || `t3 ${args[0]} failed`));
        } else {
          resolve(stdout.toString());
        }
      },
    );
    if (input !== undefined) {
      child.stdin?.end(input);
    }
  });
}

interface PendingRpc {
  resolve: (value: Json) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class T3Client {
  origin = "";
  environmentId = readEnvironmentId();
  private token: string | null = null;
  private tokenIssuedAt = 0;
  private tokenPromise: Promise<string> | null = null;
  private ws: WebSocket | null = null;
  private wsReady: Promise<WebSocket> | null = null;
  private rpcSeq = 0;
  private pending = new Map<string, PendingRpc>();

  constructor() {
    try {
      this.origin = readRuntime().origin;
    } catch {
      this.origin = "http://127.0.0.1:3773";
    }
  }

  threadLink(threadId: string): string | null {
    return this.environmentId ? `https://app.t3.codes/threads/${this.environmentId}/${threadId}` : null;
  }

  private async issueToken(): Promise<string> {
    const out = await runCli([
      "auth",
      "session",
      "issue",
      "--scope",
      "orchestration:read",
      "--scope",
      "orchestration:operate",
      "--ttl",
      "24h",
      "--label",
      "agent-office",
      "--token-only",
    ]);
    const token = out.trim().split(/\s+/).pop() ?? "";
    if (token.length < 20) throw new Error(`Could not mint a T3 token: ${out.slice(0, 200)}`);
    return token;
  }

  async getToken(force = false): Promise<string> {
    const stale = Date.now() - this.tokenIssuedAt > 20 * 3600_000;
    if (this.token && !force && !stale) return this.token;
    if (!this.tokenPromise) {
      this.tokenPromise = (async () => {
        try {
          this.origin = readRuntime().origin;
        } catch {
          /* keep last known origin */
        }
        const token = await this.issueToken();
        this.token = token;
        this.tokenIssuedAt = Date.now();
        return token;
      })().finally(() => {
        this.tokenPromise = null;
      });
    }
    return this.tokenPromise;
  }

  async get(path: string): Promise<Json> {
    for (let attempt = 0; attempt < 2; attempt++) {
      const token = await this.getToken(attempt > 0);
      const res = await fetch(this.origin + path, {
        headers: { authorization: `Bearer ${token}`, ...PROTOCOL_HEADER },
      });
      if (res.status === 401 && attempt === 0) continue;
      if (!res.ok) throw new Error(`T3 ${path} -> HTTP ${res.status}`);
      return res.json();
    }
    throw new Error("T3 auth failed");
  }

  shell(): Promise<Json> {
    return this.get("/api/orchestration/shell?omitOlderSettled=true&omitIdleSubagents=true");
  }

  threadSnapshot(threadId: string): Promise<Json> {
    return this.get(
      `/api/orchestration/threads/${encodeURIComponent(threadId)}/bounded?compactTurnItems=true&deferWork=true`,
    );
  }

  // ---------- WebSocket RPC ----------

  private async connect(): Promise<WebSocket> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return this.ws;
    if (this.wsReady) return this.wsReady;
    this.wsReady = (async () => {
      let lastError: unknown;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const token = await this.getToken(attempt > 0);
          const res = await fetch(this.origin + "/api/auth/websocket-ticket", {
            method: "POST",
            headers: { authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error(`websocket ticket HTTP ${res.status}`);
          const { ticket } = (await res.json()) as { ticket: string };
          const wsUrl = this.origin.replace(/^http/, "ws") +
            `/ws?wsTicket=${encodeURIComponent(ticket)}&orchestrationProtocol=2`;
          const ws = new WebSocket(wsUrl);
          await new Promise<void>((resolve, reject) => {
            ws.onopen = () => resolve();
            ws.onerror = () => reject(new Error("T3 websocket failed to open"));
          });
          ws.onmessage = (event) => this.onMessage(ws, String(event.data));
          ws.onclose = () => {
            if (this.ws === ws) this.ws = null;
            for (const [id, p] of this.pending) {
              clearTimeout(p.timer);
              p.reject(new Error("T3 websocket closed"));
              this.pending.delete(id);
            }
          };
          this.ws = ws;
          return ws;
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError instanceof Error ? lastError : new Error(String(lastError));
    })().finally(() => {
      this.wsReady = null;
    });
    return this.wsReady;
  }

  private onMessage(ws: WebSocket, raw: string) {
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      let msg: Json;
      try {
        msg = JSON.parse(line);
      } catch {
        continue;
      }
      if (msg._tag === "Ping") {
        ws.send(JSON.stringify({ _tag: "Pong" }));
        continue;
      }
      if (msg._tag === "Exit") {
        const p = this.pending.get(String(msg.requestId));
        if (!p) continue;
        this.pending.delete(String(msg.requestId));
        clearTimeout(p.timer);
        if (msg.exit?._tag === "Success") p.resolve(msg.exit.value);
        else p.reject(new Error(describeCause(msg.exit?.cause)));
      } else if (msg._tag === "Defect") {
        for (const [id, p] of this.pending) {
          clearTimeout(p.timer);
          p.reject(new Error(`T3 RPC defect: ${JSON.stringify(msg.defect).slice(0, 300)}`));
          this.pending.delete(id);
        }
      }
    }
  }

  async rpc(tag: string, payload: Json): Promise<Json> {
    const ws = await this.connect();
    const id = String(++this.rpcSeq);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`T3 RPC ${tag} timed out`));
      }, 30_000);
      this.pending.set(id, { resolve, reject, timer });
      ws.send(JSON.stringify({ _tag: "Request", id, tag, payload, headers: [] }));
    });
  }

  dispatch(command: Record<string, unknown>): Promise<Json> {
    return this.rpc("orchestration.dispatchCommand", { commandId: randomUUID(), ...command });
  }

  // ---------- High-level actions ----------

  archive(threadId: string) {
    return this.dispatch({ type: "thread.archive", threadId });
  }

  stop(threadId: string) {
    return this.dispatch({ type: "thread.stop", threadId, reason: "Stopped from Agent Office" });
  }

  settle(threadId: string) {
    return this.dispatch({ type: "thread.settle", threadId });
  }

  visit(threadId: string) {
    return this.dispatch({ type: "thread.visit", threadId, visitedAt: new Date().toISOString(), opened: true });
  }

  respond(threadId: string, requestId: string, body: { decision?: string; answers?: Json; feedback?: string }) {
    const command: Record<string, unknown> = { type: "runtime-request.respond", threadId, requestId };
    if (body.decision) command.decision = body.decision;
    if (body.answers) command.answers = body.answers;
    if (body.feedback) command.feedback = body.feedback;
    return this.dispatch(command);
  }

  async startThread(opts: { projectId: string; message: string; title?: string; provider?: string; model?: string }) {
    const args = ["thread", "start", opts.projectId, "-", "--json"];
    if (opts.title) args.push("--title", opts.title);
    if (opts.provider) args.push("--provider", opts.provider);
    if (opts.model) args.push("--model", opts.model);
    const out = await runCli(args, opts.message);
    const parsed = parseJsonLoose(out);
    const threadId = parsed?.threadId ?? parsed?.thread?.threadId ?? parsed?.id;
    if (!threadId) throw new Error(`Unexpected t3 thread start output: ${out.slice(0, 300)}`);
    return { threadId: String(threadId), raw: parsed };
  }

  async sendMessage(threadId: string, message: string) {
    await runCli(["thread", "send", threadId, "-", "--json"], message);
  }

  async addProject(path: string) {
    return runCli(["project", "add", path]);
  }
}

function parseJsonLoose(out: string): Json {
  const trimmed = out.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        /* fallthrough */
      }
    }
    return null;
  }
}

function describeCause(cause: Json): string {
  if (!cause) return "T3 command failed";
  const failure = cause.failure ?? cause.error ?? cause.defect ?? cause.left ?? cause.right;
  if (failure?.message) return String(failure.message);
  if (typeof failure === "string") return failure;
  const text = JSON.stringify(cause);
  const m = text.match(/"message":"([^"]+)"/);
  return m ? m[1] : text.slice(0, 300);
}
