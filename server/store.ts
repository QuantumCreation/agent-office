// Small JSON persistence for office-only state: desk seating, the issue board,
// and which thread is each floor's board manager.

import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Issue } from "../shared/types.ts";

export interface OfficeData {
  version: 1;
  desks: Record<string, { projectId: string; desk: number }>;
  issues: Issue[];
  pm: Record<string, string>;
}

export class Store {
  data: OfficeData;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly path: string;

  constructor(path: string) {
    this.path = path;
    this.data = { version: 1, desks: {}, issues: [], pm: {} };
    try {
      const parsed = JSON.parse(readFileSync(path, "utf8"));
      this.data = { ...this.data, ...parsed };
    } catch {
      /* first run */
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
