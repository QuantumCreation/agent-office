// 2D canvas drawing for in-world displays: desk monitors, the issue board, the staff board
// in the manager's office, and the signs.

import type { ActivityItem, AgentInfo, BoardSettings, Issue, StaffLogEntry } from "../../shared/types.ts";
import { inkOn, tagColor, viewColumns, visibleTags, WALL_MAX_COLUMNS } from "../../shared/board.ts";
import { ACTIVITY_COLORS } from "./bloop.ts";
import type { Monitor } from "./office.ts";

const MONO = "13px ui-monospace, SFMono-Regular, Menlo, monospace";
const ACTIVITY_LABEL: Record<string, string> = {
  working: "working",
  "needs-input": "needs you",
  done: "done ✓",
  error: "error",
  idle: "idle",
};

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      if (!word) continue;
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) {
        out.push(line);
        line = word;
        if (out.length >= maxLines) return out;
      } else {
        line = next;
      }
    }
    if (line) out.push(line);
    if (out.length >= maxLines) return out;
  }
  return out;
}

function itemPrefix(item: ActivityItem): [string, string] {
  switch (item.type) {
    case "command":
      return ["$ ", "#9ef0a8"];
    case "thinking":
      return ["~ ", "#8b90b0"];
    case "file":
      return ["✎ ", "#ffd36b"];
    case "assistant":
      return ["› ", "#e8ebff"];
    case "user":
      return ["» ", "#8fd3ff"];
    case "search":
    case "web":
      return ["⌕ ", "#c9a7ff"];
    case "todo":
      return ["", "#e8ebff"];
    case "question":
    case "approval":
      return ["? ", "#ffc531"];
    case "error":
      return ["! ", "#ff7b7b"];
    default:
      return ["· ", "#aab0cc"];
  }
}

export function drawMonitor(mon: Monitor, agent: AgentInfo, items: ActivityItem[] | null) {
  const key = `${agent.activity}|${agent.title}|${agent.updatedAt}|${items?.length ?? -1}|${items?.at(-1)?.id ?? ""}`;
  if (key === mon.lastDrawKey) return;
  mon.lastDrawKey = key;
  const ctx = mon.ctx;
  const { width: w, height: h } = ctx.canvas;
  ctx.fillStyle = "#151827";
  ctx.fillRect(0, 0, w, h);
  // title bar
  const color = ACTIVITY_COLORS[agent.activity];
  ctx.fillStyle = "#23283d";
  ctx.fillRect(0, 0, w, 30);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(14, 15, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "bold 14px ui-rounded, system-ui, sans-serif";
  ctx.fillStyle = "#e8ebff";
  const title = agent.title.length > 34 ? agent.title.slice(0, 33) + "…" : agent.title;
  ctx.fillText(title, 28, 20);
  ctx.font = "bold 11px ui-rounded, system-ui, sans-serif";
  ctx.fillStyle = color;
  ctx.textAlign = "right";
  ctx.fillText(ACTIVITY_LABEL[agent.activity] ?? agent.activity, w - 8, 20);
  ctx.textAlign = "left";

  ctx.font = MONO;
  const lineH = 17;
  const maxLines = Math.floor((h - 40) / lineH);
  const lines: [string, string][] = [];
  const source = items && items.length ? items.slice(-14) : null;
  if (source) {
    for (const item of source) {
      const [prefix, col] = itemPrefix(item);
      const text = (item.text || item.title || "").replace(/\s+/g, " ").trim();
      if (!text) continue;
      const wrapped = wrap(ctx, prefix + text, w - 16, item.type === "assistant" ? 3 : 2);
      for (const l of wrapped) lines.push([l, col]);
    }
  } else if (agent.lastMessage) {
    for (const l of wrap(ctx, "› " + agent.lastMessage, w - 16, maxLines)) lines.push([l, "#e8ebff"]);
  } else {
    lines.push(["waiting for work…", "#8b90b0"]);
  }
  const visible = lines.slice(-maxLines);
  visible.forEach(([text, col], i) => {
    ctx.fillStyle = col;
    ctx.fillText(text, 8, 48 + i * lineH);
  });
  if (agent.activity === "working") {
    const y = 48 + Math.min(visible.length, maxLines - 1) * lineH;
    ctx.fillStyle = "#9ef0a8";
    ctx.fillRect(8, y - 11, 8, 14);
  }
  mon.texture.needsUpdate = true;
}

export function drawEmptyMonitor(mon: Monitor, label: string) {
  const key = `empty|${label}`;
  if (mon.lastDrawKey === key) return;
  mon.lastDrawKey = key;
  const ctx = mon.ctx;
  const { width: w, height: h } = ctx.canvas;
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#1f2a44");
  g.addColorStop(1, "#2b1f44");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = "center";
  ctx.fillStyle = "#7cf0a0";
  ctx.font = "bold 30px ui-rounded, system-ui, sans-serif";
  ctx.fillText("NOW HIRING", w / 2, h / 2 - 4);
  ctx.fillStyle = "#aab0cc";
  ctx.font = "15px ui-rounded, system-ui, sans-serif";
  ctx.fillText(label, w / 2, h / 2 + 26);
  ctx.textAlign = "left";
  mon.texture.needsUpdate = true;
}

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  issues: Issue[],
  settings: BoardSettings & { labels?: { name: string; color: string }[] },
  agentName: (id: string) => string,
  pmName: string | null,
) {
  const { width: w, height: h } = ctx.canvas;
  const labels = settings.labels ?? [];
  ctx.fillStyle = "#fbfbf7";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#3a3c4e";
  ctx.font = "bold 26px ui-rounded, system-ui, sans-serif";
  ctx.fillText("ISSUE BOARD", 18, 34);
  ctx.font = "16px ui-rounded, system-ui, sans-serif";
  ctx.fillStyle = "#6a6e85";
  ctx.textAlign = "right";
  const managed = pmName ? `managed by ${pmName}` : "no board manager yet · press E to set up";
  ctx.fillText(settings.gitlab.enabled ? `${managed} · GitLab` : managed, w - 18, 32);
  ctx.textAlign = "left";
  const columns = viewColumns(settings, settings.wall).slice(0, WALL_MAX_COLUMNS);
  const colW = (w - 36) / Math.max(1, columns.length);
  columns.forEach((col, ci) => {
    const x = 18 + ci * colW;
    ctx.fillStyle = "#e9e9f0";
    ctx.fillRect(x + 4, 48, colW - 8, h - 60);
    ctx.fillStyle = "#3a3c4e";
    ctx.font = "bold 17px ui-rounded, system-ui, sans-serif";
    const list = issues.filter((i) => i.status === col.id);
    const header = wrap(ctx, `${col.title} (${list.length})`, colW - 24, 1)[0] ?? "";
    ctx.fillText(header, x + 12, 70);
    const cardH = 52;
    const maxCards = Math.floor((h - 90) / (cardH + 6));
    list.slice(0, maxCards).forEach((issue, i) => {
      const y = 80 + i * (cardH + 6);
      const cw = colW - 20;
      ctx.save();
      ctx.translate(x + 10 + (i % 2 ? 2 : -1), y);
      ctx.rotate(((i * 37) % 7 - 3) * 0.004);
      ctx.fillStyle = col.color;
      ctx.fillRect(0, 0, cw, cardH);
      ctx.fillStyle = inkOn(col.color);
      ctx.font = "bold 13px ui-rounded, system-ui, sans-serif";
      const lines = wrap(ctx, issue.title, cw - 12, 2);
      lines.forEach((l, li) => ctx.fillText(l, 6, 17 + li * 15));
      let left = 6;
      if (issue.assignee) {
        ctx.font = "11px ui-rounded, system-ui, sans-serif";
        ctx.globalAlpha = 0.75;
        const who = "@" + agentName(issue.assignee);
        ctx.fillText(who, 6, cardH - 5);
        ctx.globalAlpha = 1;
        left += ctx.measureText(who).width + 6;
      }
      // Tags, right-aligned on the bottom line, as many as fit.
      ctx.font = "bold 10px ui-rounded, system-ui, sans-serif";
      let right = cw - 5;
      for (const tag of visibleTags(issue, settings.wall, settings)) {
        const text = tag.length > 14 ? tag.slice(0, 13) + "…" : tag;
        const tw = ctx.measureText(text).width + 8;
        if (right - tw < left) break;
        const bg = tagColor(tag, labels);
        ctx.fillStyle = bg;
        roundRect(ctx, right - tw, cardH - 16, tw, 13, 6);
        ctx.fill();
        ctx.fillStyle = inkOn(bg);
        ctx.fillText(text, right - tw + 4, cardH - 6);
        right -= tw + 3;
      }
      ctx.restore();
    });
    if (list.length > maxCards) {
      ctx.fillStyle = "#6a6e85";
      ctx.font = "13px ui-rounded, system-ui, sans-serif";
      ctx.fillText(`+${list.length - maxCards} more`, x + 12, h - 18);
    }
  });
}

export function drawSign(ctx: CanvasRenderingContext2D, floorNumber: number, title: string, accent: string) {
  const { width: w, height: h } = ctx.canvas;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = accent;
  roundRect(ctx, 4, 8, w - 8, h - 16, 26);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 52px ui-rounded, system-ui, sans-serif";
  ctx.fillText(`${floorNumber}F`, 28, 84);
  ctx.font = "bold 40px ui-rounded, system-ui, sans-serif";
  const t = title.length > 16 ? title.slice(0, 15) + "…" : title;
  ctx.fillText(t, 130, 80);
}

const ROSTER_ORDER: Record<string, number> = { "needs-input": 0, error: 1, working: 2, done: 3, idle: 4 };

function ago(iso: string) {
  const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 48 * 60 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
}

/** The staff board: everyone on the floor as cards, with the latest hires and firings along the bottom. */
export function drawRoster(
  ctx: CanvasRenderingContext2D,
  agents: AgentInfo[],
  opts: { nameOf: (id: string) => string; colorOf: (id: string) => string; managerName: string | null; log: StaffLogEntry[]; deskLabel: (a: AgentInfo) => string },
) {
  const { width: w, height: h } = ctx.canvas;
  ctx.fillStyle = "#fbf8f2";
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = "left";
  ctx.fillStyle = "#3a3c4e";
  ctx.font = "bold 26px ui-rounded, system-ui, sans-serif";
  ctx.fillText("THE TEAM", 18, 36);
  ctx.textAlign = "right";
  ctx.font = "16px ui-rounded, system-ui, sans-serif";
  ctx.fillStyle = "#6a6e85";
  ctx.fillText(opts.managerName ? `managed by ${opts.managerName}` : "no floor manager yet · press E at the desk", w - 18, 34);
  ctx.textAlign = "left";

  // Head count by activity
  const counts = new Map<string, number>();
  for (const a of agents) counts.set(a.activity, (counts.get(a.activity) ?? 0) + 1);
  let x = 18;
  ctx.font = "bold 15px ui-rounded, system-ui, sans-serif";
  const head = `${agents.length} on the floor`;
  ctx.fillStyle = "#3a3c4e";
  ctx.fillText(head, x, 64);
  x += ctx.measureText(head).width + 16;
  for (const act of ["working", "needs-input", "error", "done", "idle"]) {
    const n = counts.get(act);
    if (!n) continue;
    const label = `${n} ${ACTIVITY_LABEL[act]}`;
    ctx.fillStyle = ACTIVITY_COLORS[act as AgentInfo["activity"]];
    ctx.beginPath();
    ctx.arc(x + 6, 59, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4a4d60";
    ctx.font = "15px ui-rounded, system-ui, sans-serif";
    ctx.fillText(label, x + 16, 64);
    x += ctx.measureText(label).width + 34;
  }

  // Cards
  const sorted = [...agents].sort(
    (a, b) =>
      Number(b.isManager) - Number(a.isManager) ||
      Number(b.isPm) - Number(a.isPm) ||
      ROSTER_ORDER[a.activity] - ROSTER_ORDER[b.activity] ||
      Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );
  const logH = opts.log.length ? 74 : 0;
  const cols = 3;
  const gap = 10;
  const cardW = (w - 36 - gap * (cols - 1)) / cols;
  const cardH = 58;
  const top = 80;
  const rows = Math.max(1, Math.floor((h - top - logH - 14 + gap) / (cardH + gap)));
  const slots = rows * cols;
  const shown = sorted.length > slots ? sorted.slice(0, slots - 1) : sorted;
  shown.forEach((a, i) => {
    const cx = 18 + (i % cols) * (cardW + gap);
    const cy = top + Math.floor(i / cols) * (cardH + gap);
    ctx.fillStyle = a.isManager ? "#f3e9d8" : "#ffffff";
    roundRect(ctx, cx, cy, cardW, cardH, 10);
    ctx.fill();
    ctx.strokeStyle = "#e2dccf";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // avatar
    ctx.fillStyle = opts.colorOf(a.id);
    ctx.beginPath();
    ctx.arc(cx + 28, cy + cardH / 2, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ACTIVITY_COLORS[a.activity];
    ctx.beginPath();
    ctx.arc(cx + 42, cy + cardH / 2 + 13, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
    const name = opts.nameOf(a.id);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 17px ui-rounded, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(name.replace(/^(PM|Manager) /, "")[0] ?? "?", cx + 28, cy + cardH / 2 + 6);
    ctx.textAlign = "left";
    // name, desk, title
    const textW = cardW - 64 - 10;
    ctx.fillStyle = "#2f3142";
    ctx.font = "bold 15px ui-rounded, system-ui, sans-serif";
    ctx.fillText(wrap(ctx, name, textW - 70, 1)[0] ?? "", cx + 58, cy + 23);
    ctx.textAlign = "right";
    ctx.fillStyle = "#8a8ea3";
    ctx.font = "12px ui-rounded, system-ui, sans-serif";
    ctx.fillText(opts.deskLabel(a), cx + cardW - 10, cy + 22);
    ctx.textAlign = "left";
    ctx.fillStyle = "#5a5e73";
    ctx.font = "13px ui-rounded, system-ui, sans-serif";
    ctx.fillText(wrap(ctx, a.title, textW, 1)[0] ?? "", cx + 58, cy + 43);
  });
  if (sorted.length > shown.length) {
    const i = shown.length;
    const cx = 18 + (i % cols) * (cardW + gap);
    const cy = top + Math.floor(i / cols) * (cardH + gap);
    ctx.fillStyle = "#6a6e85";
    ctx.font = "bold 16px ui-rounded, system-ui, sans-serif";
    ctx.fillText(`+${sorted.length - shown.length} more`, cx + 16, cy + cardH / 2 + 6);
  }
  if (!agents.length) {
    ctx.fillStyle = "#8a8ea3";
    ctx.font = "18px ui-rounded, system-ui, sans-serif";
    ctx.fillText("Nobody here yet. Hire someone at an empty desk, or ask the manager to staff up.", 18, top + 30);
  }

  // Recent hires and firings
  if (logH) {
    const y0 = h - logH;
    ctx.fillStyle = "#efe8da";
    ctx.fillRect(0, y0, w, logH);
    ctx.fillStyle = "#6a5a40";
    ctx.font = "bold 13px ui-rounded, system-ui, sans-serif";
    ctx.fillText("RECENT STAFF CHANGES", 18, y0 + 20);
    ctx.font = "14px ui-rounded, system-ui, sans-serif";
    opts.log.slice(-2).reverse().forEach((e, i) => {
      const verb = e.action === "hire" ? "＋ hired" : "📦 let go";
      const who = e.by === "boss" ? "by you" : `by the ${e.by}`;
      const line = `${verb} ${e.name} · ${e.title}${e.reason ? ` · "${e.reason}"` : ""} · ${who} · ${ago(e.at)}`;
      ctx.fillStyle = e.action === "hire" ? "#2e7d4f" : "#8a4b2e";
      ctx.fillText(wrap(ctx, line, w - 36, 1)[0] ?? "", 18, y0 + 42 + i * 21);
    });
  }
}

/** Nameplate over the manager's door. */
export function drawNameplate(ctx: CanvasRenderingContext2D, name: string | null) {
  const { width: w, height: h } = ctx.canvas;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#4a3526";
  roundRect(ctx, 4, 6, w - 8, h - 12, 18);
  ctx.fill();
  ctx.strokeStyle = "#d9b45a";
  ctx.lineWidth = 4;
  roundRect(ctx, 12, 14, w - 24, h - 28, 12);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = "#e9cf86";
  ctx.font = "bold 22px ui-rounded, system-ui, sans-serif";
  ctx.fillText("FLOOR MANAGER", w / 2, 50);
  ctx.fillStyle = "#fff6e0";
  ctx.font = "bold 36px ui-rounded, system-ui, sans-serif";
  ctx.fillText(name ?? "vacant", w / 2, 94);
  ctx.textAlign = "left";
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
