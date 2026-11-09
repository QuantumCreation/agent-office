// The issue board: a kanban of tickets for the current floor, plus the board's PM agent.

import type { AgentInfo, Issue, IssueStatus, OfficeSnapshot } from "../../shared/types.ts";
import { api } from "../api.ts";
import { h, openModal, toast } from "./dom.ts";

export interface BoardHost {
  snapshot(): OfficeSnapshot;
  projectId(): string;
  nameOf(id: string): string;
  talkTo(agentId: string): void;
}

const COLS: { key: IssueStatus; label: string }[] = [
  { key: "todo", label: "To do" },
  { key: "doing", label: "Doing" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
];

export class IssueBoardModal {
  private body: HTMLElement | null = null;
  private close: (() => void) | null = null;
  private lastKey = "";

  private host: BoardHost;

  constructor(host: BoardHost) {
    this.host = host;
  }

  get isOpen() {
    return this.body !== null;
  }

  open() {
    this.body = h("div", { class: "board" });
    this.lastKey = "";
    this.render();
    this.close = openModal("Issue board", this.body, {
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
    const issues = snap.issues.filter((i) => i.projectId === pid);
    const agents = snap.agents.filter((a) => a.projectId === pid && !a.isPm);
    const pmId = snap.pm[pid];
    const pm = pmId ? snap.agents.find((a) => a.id === pmId) : undefined;
    const key = JSON.stringify([issues, agents.map((a) => [a.id, a.activity, a.title]), pm?.activity ?? null]);
    if (key === this.lastKey) return;
    // Don't clobber a form the user is typing in.
    if (body.contains(document.activeElement) && (document.activeElement as HTMLElement).tagName !== "BUTTON") return;
    this.lastKey = key;

    const pmBar = h(
      "div",
      { class: "pm-bar" },
      pm
        ? [
            h("div", {}, h("strong", {}, `${this.host.nameOf(pm.id)}`), " manages this board. Ask them to plan work, file tickets and assign them out."),
            h("button", { class: "btn primary", onclick: () => { this.close?.(); this.host.talkTo(pm.id); } }, "💬 Talk to the PM"),
          ]
        : [
            h("div", {}, "No board manager yet. Hire one and they'll turn your requests into tickets, assign them to agents, and hire new agents when needed."),
            h(
              "button",
              {
                class: "btn primary",
                onclick: async (e: MouseEvent) => {
                  (e.currentTarget as HTMLButtonElement).disabled = true;
                  try {
                    await api.ensurePm(pid);
                    toast("A board manager is on the way to their desk!", "good");
                  } catch (err) {
                    toast(`Couldn't hire a PM: ${(err as Error).message}`, "bad");
                  }
                },
              },
              "🧑‍💼 Hire a board manager",
            ),
          ],
    );

    const titleIn = h("input", { placeholder: "New ticket title", onkeydown: (e: KeyboardEvent) => e.stopPropagation() });
    const bodyIn = h("textarea", { placeholder: "Details (optional)", rows: 2, onkeydown: (e: KeyboardEvent) => e.stopPropagation() });
    const add = h("form", {
      class: "new-ticket",
      onsubmit: async (e: SubmitEvent) => {
        e.preventDefault();
        if (!titleIn.value.trim()) return;
        try {
          await api.createIssue({ projectId: pid, title: titleIn.value.trim(), body: bodyIn.value.trim() });
          titleIn.value = "";
          bodyIn.value = "";
          (document.activeElement as HTMLElement)?.blur();
        } catch (err) {
          toast((err as Error).message, "bad");
        }
      },
    }, titleIn, bodyIn, h("button", { class: "btn primary", type: "submit" }, "+ Add ticket"));

    const cols = h(
      "div",
      { class: "cols" },
      COLS.map((col, ci) =>
        h(
          "div",
          { class: `col ${col.key}` },
          h("h3", {}, `${col.label} · ${issues.filter((i) => i.status === col.key).length}`),
          issues.filter((i) => i.status === col.key).map((issue) => this.card(issue, ci, agents)),
        ),
      ),
    );
    body.replaceChildren(pmBar, add, cols);
  }

  private card(issue: Issue, colIndex: number, agents: AgentInfo[]) {
    const move = (d: number) => api.updateIssue(issue.id, { status: COLS[colIndex + d].key }).catch((e) => toast(e.message, "bad"));
    const select = h(
      "select",
      {
        onchange: async () => {
          if (!select.value) return;
          try {
            await api.assignIssue(issue.id, select.value);
            toast(`Sent the ticket to ${this.host.nameOf(select.value)}.`, "good");
          } catch (e) {
            toast((e as Error).message, "bad");
          }
        },
      },
      h("option", { value: "" }, issue.assignee ? `@${this.host.nameOf(issue.assignee)}` : "Assign to…"),
      agents.map((a) => h("option", { value: a.id }, `${this.host.nameOf(a.id)} · ${a.activity} · ${a.title.slice(0, 40)}`)),
    );
    return h(
      "div",
      { class: "card" },
      h("div", { class: "card-title" }, issue.title),
      issue.body ? h("div", { class: "card-body" }, issue.body) : null,
      h("div", { class: "card-meta" }, `by ${issue.createdBy}`),
      h(
        "div",
        { class: "card-actions" },
        colIndex > 0 ? h("button", { class: "mini", title: "Move left", onclick: () => move(-1) }, "←") : null,
        colIndex < COLS.length - 1 ? h("button", { class: "mini", title: "Move right", onclick: () => move(1) }, "→") : null,
        select,
        !issue.assignee
          ? h(
              "button",
              {
                class: "mini good",
                title: "Recruit a new agent for this ticket",
                onclick: async () => {
                  try {
                    await api.hireForIssue(issue.id);
                    toast("Recruiting a new agent for this ticket…", "good");
                  } catch (e) {
                    toast((e as Error).message, "bad");
                  }
                },
              },
              "+ Hire",
            )
          : null,
        h("button", { class: "mini danger", title: "Delete", onclick: () => confirm("Delete this ticket?") && api.deleteIssue(issue.id) }, "🗑"),
      ),
    );
  }
}
