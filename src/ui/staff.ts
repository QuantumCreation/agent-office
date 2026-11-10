// The staff roster (R, or the board on the manager's office wall): everyone on the floor with
// what they're doing, the floor manager (talk to them, or hire one), and the hiring/firing log.

import type { AgentInfo, OfficeSnapshot, StaffLogEntry } from "../../shared/types.ts";
import { api } from "../api.ts";
import { h, openModal, timeAgo, toast } from "./dom.ts";

export interface StaffHost {
  snapshot(): OfficeSnapshot;
  projectId(): string;
  nameOf(id: string): string;
  colorOf(id: string): string;
  deskLabel(a: AgentInfo): string;
  talkTo(agentId: string): void;
  layOff(agentId: string, reason?: string): void;
  hireManager(): Promise<void>;
  managerHirePending(): boolean;
}

const ORDER: Record<string, number> = { "needs-input": 0, error: 1, working: 2, done: 3, idle: 4 };
const ACTIVITY_TEXT: Record<string, string> = { working: "working", "needs-input": "needs you", done: "done", error: "error", idle: "idle" };
const stop = (e: KeyboardEvent) => e.stopPropagation();

export class StaffModal {
  private body: HTMLElement | null = null;
  private close: (() => void) | null = null;
  private lastKey = "";
  private readonly host: StaffHost;

  constructor(host: StaffHost) {
    this.host = host;
  }

  get isOpen() {
    return this.body !== null;
  }

  open() {
    this.body = h("div", { class: "staff" });
    this.lastKey = "";
    this.render();
    this.close = openModal("Staff", this.body, {
      wide: true,
      onClose: () => {
        this.body = null;
        this.close = null;
      },
    });
  }

  refresh() {
    if (this.body) this.render();
  }

  private render() {
    const body = this.body!;
    const snap = this.host.snapshot();
    const pid = this.host.projectId();
    const agents = snap.agents.filter((a) => a.projectId === pid && !a.isIntern);
    const mgrId = snap.managers?.[pid];
    const mgr = mgrId ? agents.find((a) => a.id === mgrId) : undefined;
    const log = (snap.staffLog ?? []).filter((e) => e.projectId === pid);
    const key = JSON.stringify([agents.map((a) => [a.id, a.activity, a.title, a.desk, a.updatedAt]), mgrId, log.length, this.host.managerHirePending()]);
    if (key === this.lastKey) return;
    // Don't clobber the message box while the boss is typing in it.
    if (body.contains(document.activeElement) && (document.activeElement as HTMLElement).tagName !== "BUTTON") return;
    this.lastKey = key;
    body.replaceChildren(this.managerBar(mgr), this.roster(agents), this.logView(log));
  }

  private managerBar(mgr: AgentInfo | undefined) {
    if (!mgr) {
      const pending = this.host.managerHirePending();
      return h(
        "div",
        { class: "pm-bar manager-bar" },
        h("div", {}, h("strong", {}, "No floor manager yet. "), "A manager staffs this floor for you: they turn your requests into briefs, hire agents for them, keep an eye on everyone, and let go of agents who aren't needed. They don't write code themselves."),
        h(
          "button",
          {
            class: "btn primary",
            disabled: pending,
            onclick: async (e: MouseEvent) => {
              (e.currentTarget as HTMLButtonElement).disabled = true;
              await this.host.hireManager();
            },
          },
          pending ? "Recruiting…" : "🎩 Hire a floor manager",
        ),
      );
    }
    const input = h("textarea", { rows: 2, placeholder: `Ask ${this.host.nameOf(mgr.id)} to staff something, check on someone, or tidy up the floor…`, onkeydown: (e: KeyboardEvent) => {
      stop(e);
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void send();
      }
    } });
    const send = async () => {
      const text = input.value.trim();
      if (!text) return input.focus();
      input.value = "";
      try {
        await api.send(mgr.id, text);
        toast(`Sent to ${this.host.nameOf(mgr.id)}.`, "good");
      } catch (err) {
        input.value = text;
        toast(`Couldn't reach the manager: ${(err as Error).message}`, "bad");
      }
    };
    return h(
      "div",
      { class: "pm-bar manager-bar column" },
      h(
        "div",
        { class: "row spread" },
        h(
          "div",
          {},
          h("span", { class: "dot", style: `background:${this.host.colorOf(mgr.id)}` }),
          h("strong", {}, this.host.nameOf(mgr.id)),
          " runs this floor. ",
          h("span", { class: `pill ${mgr.activity}` }, ACTIVITY_TEXT[mgr.activity] ?? mgr.activity),
        ),
        h("button", { class: "btn", onclick: () => { this.close?.(); this.host.talkTo(mgr.id); } }, "💬 Walk over"),
      ),
      h("div", { class: "row" }, input, h("button", { class: "btn primary", onclick: () => void send() }, "Send")),
    );
  }

  private roster(agents: AgentInfo[]) {
    const sorted = [...agents].sort(
      (a, b) =>
        Number(b.isManager) - Number(a.isManager) ||
        Number(b.isPm) - Number(a.isPm) ||
        ORDER[a.activity] - ORDER[b.activity] ||
        Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
    );
    if (!sorted.length) return h("p", { class: "muted" }, "Nobody on this floor yet.");
    return h(
      "div",
      { class: "staff-list" },
      sorted.map((a) =>
        h(
          "div",
          { class: "staff-row" },
          h("span", { class: "staff-avatar", style: `background:${this.host.colorOf(a.id)}` }, this.host.nameOf(a.id).replace(/^(PM|Manager) /, "")[0] ?? "?"),
          h(
            "div",
            { class: "staff-who" },
            h("div", {}, h("strong", {}, this.host.nameOf(a.id)), a.isManager ? h("span", { class: "tag" }, "Manager") : a.isPm ? h("span", { class: "tag" }, "Board PM") : null),
            h("div", { class: "muted staff-title", title: a.title }, a.title),
          ),
          h("span", { class: `pill ${a.activity}` }, ACTIVITY_TEXT[a.activity] ?? a.activity),
          h("span", { class: "muted staff-desk" }, this.host.deskLabel(a)),
          h("span", { class: "muted staff-when" }, timeAgo(a.updatedAt)),
          h(
            "div",
            { class: "staff-actions" },
            h("button", { class: "mini", title: "Walk over and talk", onclick: () => { this.close?.(); this.host.talkTo(a.id); } }, "💬 Talk"),
            h(
              "button",
              {
                class: "mini danger",
                title: "Lay off: stops them if they're working and settles their thread in T3 (not deleted)",
                onclick: () => {
                  const reason = prompt(`Let ${this.host.nameOf(a.id)} go? Their thread "${a.title}" will be settled in T3 Code (not archived).\n\nWhy? (optional, goes in the staff log)`, "");
                  if (reason === null) return;
                  this.host.layOff(a.id, reason.trim() || undefined);
                },
              },
              "📦 Let go",
            ),
          ),
        ),
      ),
    );
  }

  private logView(log: StaffLogEntry[]) {
    if (!log.length) return h("div", {});
    return h(
      "div",
      { class: "staff-log" },
      h("h3", {}, "Hiring and firing"),
      log
        .slice(-15)
        .reverse()
        .map((e) =>
          h(
            "div",
            { class: `staff-log-line ${e.action}` },
            h("span", { class: "muted" }, timeAgo(e.at)),
            h("span", {}, e.action === "hire" ? "＋ Hired " : "📦 Let go ", h("strong", {}, e.name), ` · ${e.title}`),
            h("span", { class: "muted" }, e.by === "boss" ? "by you" : `by the ${e.by}`, e.reason ? ` · “${e.reason}”` : ""),
          ),
        ),
    );
  }
}
