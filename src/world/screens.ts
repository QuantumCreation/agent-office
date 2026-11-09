// 2D canvas drawing for in-world displays: desk monitors, the issue board and the floor sign.

import type { ActivityItem, AgentInfo, BoardSettings, Issue } from "../../shared/types.ts";
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

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
