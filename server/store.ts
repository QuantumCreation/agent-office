// Small JSON persistence for office-only state: desk seating, the issue board,
// board settings (incl. the GitLab link), and which thread is each floor's board manager.

import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { BoardSettings, Issue } from "../shared/types.ts";
import { normalizeBoardSettings } from "../shared/board.ts";
import type { ClaudeData } from "./claude.ts";

/** Board settings as saved. The GitLab token stays on this machine and is never sent to the page. */
export interface StoredBoard {
  settings: BoardSettings;
  gitlabToken: string | null;
}

export interface OfficeData {
  version: 1;
  desks: Record<string, { projectId: string; desk: number }>;
  issues: Issue[];
  pm: Record<string, string>;
  boards: Record<string, StoredBoard>;
  /** Claude Code floors and the office's notes on their sessions (absent until one is added). */
  claude?: ClaudeData;
}

export class Store {
  data: OfficeData;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly path: string;

  constructor(path: string) {
    this.path = path;
    this.data = { version: 1, desks: {}, issues: [], pm: {}, boards: {} };
    try {
      const parsed = JSON.parse(readFileSync(path, "utf8"));
      this.data = { ...this.data, ...parsed };
    } catch {
      /* first run */
    }
    // Older saves: tickets had no tags/source, boards had no settings.
    this.data.issues = this.data.issues.map((i) => ({
      ...i,
      labels: Array.isArray(i.labels) ? i.labels : [],
      source: i.source ?? "local",
      external: i.external ?? null,
    }));
    for (const [pid, b] of Object.entries(this.data.boards)) {
      this.data.boards[pid] = { settings: normalizeBoardSettings(b?.settings), gitlabToken: b?.gitlabToken ?? null };
    }
  }

  save() {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      mkdirSync(dirname(this.path), { recursive: true });
      const tmp = this.path + ".tmp";
      writeFileSync(tmp, JSON.stringify(this.data, null, 2));
      renameSync(tmp, this.path);
    }, 250);
  }
}
