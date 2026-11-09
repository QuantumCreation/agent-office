// The issue board: a kanban of tickets for the current floor, plus the board's PM agent.
// Its settings (columns, what the wall board and this view show, the GitLab link) live
// on the bridge, so the PM agent can change them too.

import type { AgentInfo, BoardColumn, BoardSettings, BoardState, BoardViewConfig, Issue, OfficeSnapshot } from "../../shared/types.ts";
import { defaultBoardSettings, inkOn, parseGitlabUrl, slugify, tagColor, viewColumns, visibleTags, WALL_MAX_COLUMNS } from "../../shared/board.ts";
import { api } from "../api.ts";
import { h, openModal, timeAgo, toast } from "./dom.ts";

export interface BoardHost {
  snapshot(): OfficeSnapshot;
  projectId(): string;
  nameOf(id: string): string;
  talkTo(agentId: string): void;
}

const stop = (e: KeyboardEvent) => e.stopPropagation();

function boardOf(snap: OfficeSnapshot, pid: string): BoardState {
  return (
    snap.boards?.[pid] ?? {
      ...defaultBoardSettings(),
      gitlab: { ...defaultBoardSettings().gitlab, hasToken: false },
      labels: [],
      sync: { at: null, error: null, count: 0, busy: false },
    }
  );
}

export class IssueBoardModal {
  private body: HTMLElement | null = null;
  private close: (() => void) | null = null;
  private lastKey = "";
  private mode: "board" | "settings" = "board";

  private host: BoardHost;

  constructor(host: BoardHost) {
    this.host = host;
  }

  get isOpen() {
    return this.body !== null;
  }

  open(mode: "board" | "settings" = "board") {
    this.body = h("div", { class: "board" });
    this.lastKey = "";
    this.mode = mode;
    if (mode === "settings") this.renderSettings();
    else this.render();
    this.close = openModal("Issue board", this.body, {
      wide: true,
      onClose: () => {
        this.body = null;
        this.close = null;
      },
    });
  }

  refresh() {
    if (this.body && this.mode === "board") this.render();
  }

  private showBoard() {
    this.mode = "board";
    this.lastKey = "";
    this.render();
  }

  private render() {
    const body = this.body!;
    const snap = this.host.snapshot();
    const pid = this.host.projectId();
    const board = boardOf(snap, pid);
    const issues = snap.issues.filter((i) => i.projectId === pid);
    const agents = snap.agents.filter((a) => a.projectId === pid && !a.isPm);
    const pmId = snap.pm[pid];
    const pm = pmId ? snap.agents.find((a) => a.id === pmId) : undefined;
    const key = JSON.stringify([issues, agents.map((a) => [a.id, a.activity, a.title]), pm?.activity ?? null, board]);
    if (key === this.lastKey) return;
    // Don't clobber a form the user is typing in.
    if (body.contains(document.activeElement) && (document.activeElement as HTMLElement).tagName !== "BUTTON") return;
    this.lastKey = key;

    const pmBar = h(
      "div",
      { class: "pm-bar" },
      pm
        ? [
            h("div", {}, h("strong", {}, `${this.host.nameOf(pm.id)}`), " manages this board. Ask them to plan work, file tickets, assign them out, or change the board's settings."),
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

    const columns = viewColumns(board, board.view);
    const shown = new Set(columns.map((c) => c.id));
    const hidden = issues.filter((i) => !shown.has(i.status)).length;
    const g = board.gitlab;
    const statusBar = h(
      "div",
      { class: "board-status" },
      h(
        "div",
        { class: "muted" },
        g.enabled
          ? [
              "🦊 Linked to ",
              h("a", { href: `${g.baseUrl}/${g.project}${g.boardId ? `/-/boards/${g.boardId}` : "/-/issues"}`, target: "_blank", rel: "noreferrer" }, g.project),
              board.sync.busy ? " · syncing…" : board.sync.at ? ` · synced ${timeAgo(board.sync.at)}` : "",
              board.sync.error ? h("span", { class: "bad-text" }, ` · ${board.sync.error}`) : null,
            ]
          : "Tickets are stored in the office. Link a GitLab board in settings.",
        hidden ? ` · ${hidden} ticket${hidden === 1 ? "" : "s"} in hidden columns` : "",
      ),
      h(
        "div",
        { class: "row" },
        g.enabled
          ? h("button", {
              class: "btn",
              disabled: board.sync.busy,
              onclick: () => api.syncBoard(pid).catch((e) => toast((e as Error).message, "bad")),
            }, "↻ Sync")
          : null,
        h("button", { class: "btn", onclick: () => { this.mode = "settings"; this.renderSettings(); } }, "⚙ Board settings"),
      ),
    );

    const titleIn = h("input", { placeholder: g.enabled ? "New GitLab issue title" : "New ticket title", onkeydown: stop });
    const bodyIn = h("textarea", { placeholder: "Details (optional)", rows: 2, onkeydown: stop });
    const add = h("form", {
      class: "new-ticket",
      onsubmit: async (e: SubmitEvent) => {
        e.preventDefault();
        if (!titleIn.value.trim()) return;
        try {
          await api.createIssue({ projectId: pid, title: titleIn.value.trim(), body: bodyIn.value.trim(), status: columns[0]?.id });
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
      { class: "cols", style: `grid-template-columns: repeat(${Math.max(1, columns.length)}, minmax(210px, 1fr))` },
      columns.map((col, ci) => {
        const list = issues.filter((i) => i.status === col.id);
        return h(
          "div",
          { class: "col" },
          h("h3", {}, h("span", { class: "swatch", style: `background:${col.color}` }), `${col.title} · ${list.length}`),
          list.map((issue) => this.card(issue, columns, ci, agents, board)),
        );
      }),
    );
    body.replaceChildren(pmBar, statusBar, add, cols);
  }

  private card(issue: Issue, columns: BoardColumn[], colIndex: number, agents: AgentInfo[], board: BoardState) {
    const move = (d: number) => api.updateIssue(issue.id, { status: columns[colIndex + d].id }).catch((e) => toast(e.message, "bad"));
    const select = h(
      "select",
      {
        onchange: async () => {
          if (!select.value) return;
          try {
            const res = await api.assignIssue(issue.id, select.value);
            toast(res.warning ?? `Sent the ticket to ${this.host.nameOf(select.value)}.`, res.warning ? "warn" : "good");
          } catch (e) {
            toast((e as Error).message, "bad");
          }
        },
      },
      h("option", { value: "" }, issue.assignee ? `@${this.host.nameOf(issue.assignee)}` : "Assign to…"),
      agents.map((a) => h("option", { value: a.id }, `${this.host.nameOf(a.id)} · ${a.activity} · ${a.title.slice(0, 40)}`)),
    );
    const tags = visibleTags(issue, board.view, board);
    const fromGitlab = issue.source === "gitlab" && issue.external;
    const color = columns[colIndex].color;
    return h(
      "div",
      { class: "card", style: `border-top-color:${color}` },
      h(
        "div",
        { class: "card-title" },
        fromGitlab ? h("a", { class: "iid", href: issue.external!.url, target: "_blank", rel: "noreferrer", title: "Open in GitLab" }, `#${issue.external!.iid}`) : null,
        issue.title,
      ),
      issue.body ? h("div", { class: "card-body" }, issue.body) : null,
      tags.length
        ? h("div", { class: "tags" }, tags.map((t) => {
            const bg = tagColor(t, board.labels);
            return h("span", { class: "tag-chip", style: `background:${bg};color:${inkOn(bg)}` }, t);
          }))
        : null,
      h("div", { class: "card-meta" }, `by ${issue.createdBy}`),
      h(
        "div",
        { class: "card-actions" },
        colIndex > 0 ? h("button", { class: "mini", title: `Move to ${columns[colIndex - 1].title}`, onclick: () => move(-1) }, "←") : null,
        colIndex < columns.length - 1 ? h("button", { class: "mini", title: `Move to ${columns[colIndex + 1].title}`, onclick: () => move(1) }, "→") : null,
        select,
        !issue.assignee
          ? h(
              "button",
              {
                class: "mini good",
                title: "Recruit a new agent for this ticket",
                onclick: async () => {
                  try {
                    const res = await api.hireForIssue(issue.id);
                    toast(res.warning ?? "Recruiting a new agent for this ticket…", res.warning ? "warn" : "good");
                  } catch (e) {
                    toast((e as Error).message, "bad");
                  }
                },
              },
              "+ Hire",
            )
          : null,
        h(
          "button",
          {
            class: "mini danger",
            title: fromGitlab ? "Close in GitLab" : "Delete",
            onclick: () =>
              confirm(fromGitlab ? `Close GitLab issue #${issue.external!.iid}?` : "Delete this ticket?") &&
              api.deleteIssue(issue.id).catch((e) => toast((e as Error).message, "bad")),
          },
          fromGitlab ? "✕" : "🗑",
        ),
      ),
    );
  }

  // ---------------------------------------------------------------- settings

  private renderSettings(fresh?: BoardState) {
    const body = this.body!;
    const pid = this.host.projectId();
    const board = fresh ?? boardOf(this.host.snapshot(), pid);
    body.replaceChildren(new SettingsForm(pid, board, {
      back: () => this.showBoard(),
      reload: (state) => this.renderSettings(state),
    }).el);
  }
}

// ------------------------------------------------------------------ settings form

interface DraftColumn {
  key: string;
  id: string | null;
  title: string;
  color: string;
  link: "none" | "opened" | "closed" | "label";
  label: string;
  wall: boolean;
  view: boolean;
}

let draftSeq = 0;

class SettingsForm {
  el: HTMLElement;
  private rows: DraftColumn[];
  private tagModes: Record<"wall" | "view", BoardViewConfig["tags"]>;
  private flow: { onAssign: string; onFinish: string };
  private gitlab: BoardState["gitlab"];
  private token = "";
  private clearToken = false;
  private pid: string;
  private board: BoardState;
  private nav: { back: () => void; reload: (state: BoardState) => void };

  constructor(pid: string, board: BoardState, nav: { back: () => void; reload: (state: BoardState) => void }) {
    this.pid = pid;
    this.board = board;
    this.nav = nav;
    // Keep the view's order: columns it shows first, in its order, then the rest.
    const order = [...board.view.columns, ...board.columns.map((c) => c.id).filter((id) => !board.view.columns.includes(id))];
    const byId = new Map(board.columns.map((c) => [c.id, c]));
    this.rows = order.map((id) => byId.get(id)!).filter(Boolean).map((c) => ({
      key: `k${draftSeq++}`,
      id: c.id,
      title: c.title,
      color: c.color,
      link: c.gitlabLabel ? "label" : (c.gitlabState ?? "none"),
      label: c.gitlabLabel ?? "",
      wall: board.wall.columns.includes(c.id),
      view: board.view.columns.includes(c.id),
    }));
    const keyOf = (id: string) => this.rows.find((r) => r.id === id)?.key ?? "";
    this.flow = { onAssign: keyOf(board.flow.onAssign), onFinish: keyOf(board.flow.onFinish) };
    this.tagModes = { wall: board.wall.tags, view: board.view.tags };
    this.gitlab = { ...board.gitlab };
    this.el = h("div", { class: "board-settings" });
    this.draw();
  }

  private draw() {
    const g = this.gitlab;
    const labelList = h("datalist", { id: "gitlab-labels" }, this.board.labels.map((l) => h("option", { value: l.name })));

    // --- GitLab
    const urlIn = h("input", {
      placeholder: "Paste a GitLab board or project URL, e.g. https://gitlab.com/group/project/-/boards/12",
      onkeydown: stop,
      onchange: () => {
        const parsed = parseGitlabUrl(urlIn.value);
        if (!parsed) return toast("That doesn't look like a GitLab project or board URL.", "warn");
        Object.assign(g, parsed);
        g.enabled = true;
        this.draw();
      },
    });
    const field = (label: string, input: HTMLElement) => h("label", { class: "field" }, h("span", {}, label), input);
    const gitlabSection = h(
      "section",
      {},
      h("h3", {}, "GitLab"),
      h("label", { class: "check" },
        h("input", { type: "checkbox", checked: g.enabled, onchange: (e: Event) => { g.enabled = (e.target as HTMLInputElement).checked; this.draw(); } }),
        "Mirror a GitLab project's issues on this board",
      ),
      urlIn,
      h(
        "div",
        { class: "grid3" },
        field("Instance", h("input", { value: g.baseUrl, onkeydown: stop, oninput: (e: Event) => (g.baseUrl = (e.target as HTMLInputElement).value) })),
        field("Project path or id", h("input", { value: g.project, placeholder: "group/project", onkeydown: stop, oninput: (e: Event) => (g.project = (e.target as HTMLInputElement).value) })),
        field("Board id (for importing columns)", h("input", { value: g.boardId ?? "", inputmode: "numeric", onkeydown: stop, oninput: (e: Event) => {
          const v = (e.target as HTMLInputElement).value.trim();
          g.boardId = v ? Number(v) : null;
        } })),
      ),
      field(
        "Access token (api scope)",
        h("div", { class: "row" },
          h("input", {
            type: "password",
            autocomplete: "off",
            value: this.token,
            placeholder: g.hasToken && !this.clearToken ? "Saved. Type a new one to replace it." : "Personal or project access token",
            onkeydown: stop,
            oninput: (e: Event) => (this.token = (e.target as HTMLInputElement).value),
          }),
          g.hasToken && !this.clearToken ? h("button", { class: "btn", type: "button", onclick: () => { this.clearToken = true; this.token = ""; this.draw(); } }, "Forget") : null,
        ),
      ),
      h("p", { class: "muted small" }, "The token stays in data/office.json on this machine and is never sent to the page. You can also set GITLAB_TOKEN when starting the office."),
      this.board.gitlab.enabled
        ? h("p", { class: "muted small" },
            this.board.sync.at ? `Last synced ${timeAgo(this.board.sync.at)}, ${this.board.sync.count} issues.` : "Not synced yet.",
            this.board.sync.error ? h("span", { class: "bad-text" }, ` ${this.board.sync.error}`) : null)
        : null,
      h("div", { class: "row" },
        h("button", { class: "btn", type: "button", disabled: !g.project || !g.boardId, onclick: () => this.importColumns() }, "⇩ Use the GitLab board's lists as columns"),
      ),
    );

    // --- Columns
    const wallCount = this.rows.filter((r) => r.wall).length;
    const colRows = this.rows.map((r, i) => {
      const labelIn = h("input", { value: r.label, placeholder: "GitLab label", list: "gitlab-labels", onkeydown: stop, oninput: (e: Event) => (r.label = (e.target as HTMLInputElement).value) });
      return h(
        "tr",
        {},
        h("td", {}, h("input", { value: r.title, onkeydown: stop, oninput: (e: Event) => (r.title = (e.target as HTMLInputElement).value) })),
        h("td", {}, h("input", { type: "color", value: r.color, oninput: (e: Event) => (r.color = (e.target as HTMLInputElement).value) })),
        h(
          "td",
          { class: "link-cell" },
          h(
            "select",
            { onchange: (e: Event) => { r.link = (e.target as HTMLSelectElement).value as DraftColumn["link"]; this.draw(); } },
            [["label", "Issues with label"], ["opened", "Open issues (GitLab's Open list)"], ["closed", "Closed issues"], ["none", "Office only (not in GitLab)"]].map(([v, l]) =>
              h("option", { value: v, selected: r.link === v }, l),
            ),
          ),
          r.link === "label" ? labelIn : null,
        ),
        h("td", { class: "center" }, h("input", {
          type: "checkbox",
          checked: r.wall,
          disabled: !r.wall && wallCount >= WALL_MAX_COLUMNS,
          title: !r.wall && wallCount >= WALL_MAX_COLUMNS ? `The wall board fits ${WALL_MAX_COLUMNS} columns` : "",
          onchange: (e: Event) => { r.wall = (e.target as HTMLInputElement).checked; this.draw(); },
        })),
        h("td", { class: "center" }, h("input", { type: "checkbox", checked: r.view, onchange: (e: Event) => (r.view = (e.target as HTMLInputElement).checked) })),
        h(
          "td",
          { class: "nowrap" },
          h("button", { class: "mini", type: "button", disabled: i === 0, title: "Move up", onclick: () => this.swap(i, i - 1) }, "↑"),
          h("button", { class: "mini", type: "button", disabled: i === this.rows.length - 1, title: "Move down", onclick: () => this.swap(i, i + 1) }, "↓"),
          h("button", { class: "mini danger", type: "button", disabled: this.rows.length === 1, title: "Remove column", onclick: () => { this.rows.splice(i, 1); this.draw(); } }, "🗑"),
        ),
      );
    });
    const columnsSection = h(
      "section",
      {},
      h("h3", {}, "Columns"),
      h("p", { class: "muted small" }, `Pick which columns the wall board shows (up to ${WALL_MAX_COLUMNS}) and which the board view shows. Order follows this list.`),
      h(
        "table",
        { class: "col-table" },
        h("thead", {}, h("tr", {}, ["Column", "Color", g.enabled ? "GitLab list" : "GitLab list (when linked)", `Wall (${wallCount}/${WALL_MAX_COLUMNS})`, "Board view", ""].map((t) => h("th", {}, t)))),
        h("tbody", {}, colRows),
      ),
      h("button", {
        class: "btn",
        type: "button",
        onclick: () => {
          this.rows.push({ key: `k${draftSeq++}`, id: null, title: "New column", color: "#d9c8ff", link: g.enabled ? "label" : "none", label: "", wall: false, view: true });
          this.draw();
        },
      }, "+ Add column"),
    );

    // --- Tags
    const tagRow = (which: "wall" | "view", label: string) => {
      const mode = this.tagModes[which];
      const kind = Array.isArray(mode) ? "only" : mode;
      const listIn = h("input", {
        value: Array.isArray(mode) ? mode.join(", ") : "",
        placeholder: "comma-separated tags",
        list: "gitlab-labels",
        onkeydown: stop,
        oninput: (e: Event) => (this.tagModes[which] = (e.target as HTMLInputElement).value.split(",").map((t) => t.trim()).filter(Boolean)),
      });
      return h(
        "div",
        { class: "tag-row" },
        h("span", {}, label),
        h(
          "select",
          {
            onchange: (e: Event) => {
              const v = (e.target as HTMLSelectElement).value;
              this.tagModes[which] = v === "only" ? [] : (v as "all" | "none");
              this.draw();
            },
          },
          [["all", "All tags"], ["none", "No tags"], ["only", "Only these tags…"]].map(([v, l]) => h("option", { value: v, selected: kind === v }, l)),
        ),
        kind === "only" ? listIn : h("span"),
      );
    };
    const tagsSection = h(
      "section",
      {},
      h("h3", {}, "Tags on cards"),
      h("p", { class: "muted small" }, "Tags are GitLab labels (or tags set on office tickets). A column's own label is never repeated on its cards."),
      tagRow("wall", "Wall board"),
      tagRow("view", "Board view"),
    );

    // --- Flow
    const flowSelect = (which: "onAssign" | "onFinish") =>
      h(
        "select",
        { onchange: (e: Event) => (this.flow[which] = (e.target as HTMLSelectElement).value) },
        this.rows.map((r) => h("option", { value: r.key, selected: this.flow[which] === r.key }, r.title || "(untitled)")),
      );
    const flowSection = h(
      "section",
      {},
      h("h3", {}, "Automation"),
      h("div", { class: "tag-row" }, h("span", {}, "When a ticket is assigned, move it to"), flowSelect("onAssign"), h("span")),
      h("div", { class: "tag-row" }, h("span", {}, "When its agent finishes, move it to"), flowSelect("onFinish"), h("span")),
    );

    const actions = h(
      "div",
      { class: "row end" },
      h("button", { class: "btn", type: "button", onclick: () => this.nav.back() }, "Cancel"),
      h("button", {
        class: "btn primary",
        type: "button",
        onclick: async () => {
          if (await this.save()) {
            toast("Board settings saved.", "good");
            this.nav.back();
          }
        },
      }, "Save settings"),
    );

    this.el.replaceChildren(
      h("div", { class: "row spread" }, h("button", { class: "btn", type: "button", onclick: () => this.nav.back() }, "← Back to the board"), h("span", { class: "muted small" }, "Your board manager can change these too.")),
      labelList,
      gitlabSection,
      columnsSection,
      tagsSection,
      flowSection,
      actions,
    );
  }

  private swap(i: number, j: number) {
    [this.rows[i], this.rows[j]] = [this.rows[j], this.rows[i]];
    this.draw();
  }

  /** The draft as a settings patch for the bridge. */
  private patch(): Omit<BoardSettings, "gitlab"> & { gitlab: Record<string, unknown> } {
    const used = new Set(this.rows.map((r) => r.id).filter(Boolean) as string[]);
    for (const r of this.rows) {
      if (r.id) continue;
      let id = slugify(r.title);
      for (let n = 2; used.has(id); n++) id = `${slugify(r.title)}-${n}`;
      used.add(id);
      r.id = id;
    }
    const idOf = (key: string) => this.rows.find((r) => r.key === key)?.id ?? undefined;
    const columns: BoardColumn[] = this.rows.map((r) => ({
      id: r.id!,
      title: r.title.trim() || "Untitled",
      color: r.color,
      gitlabLabel: r.link === "label" ? r.label.trim() || null : null,
      gitlabState: r.link === "opened" || r.link === "closed" ? r.link : null,
    }));
    const pick = (f: (r: DraftColumn) => boolean) => this.rows.filter(f).map((r) => r.id!);
    const gitlab: Record<string, unknown> = {
      enabled: this.gitlab.enabled,
      baseUrl: this.gitlab.baseUrl,
      project: this.gitlab.project,
      boardId: this.gitlab.boardId,
    };
    if (this.token.trim()) gitlab.token = this.token.trim();
    else if (this.clearToken) gitlab.token = "";
    return {
      columns,
      wall: { columns: pick((r) => r.wall), tags: this.tagModes.wall },
      view: { columns: pick((r) => r.view), tags: this.tagModes.view },
      flow: { onAssign: idOf(this.flow.onAssign) ?? columns[0].id, onFinish: idOf(this.flow.onFinish) ?? columns[0].id },
      gitlab,
    };
  }

  private async save(): Promise<BoardState | null> {
    const missingLabel = this.rows.find((r) => r.link === "label" && !r.label.trim());
    if (this.gitlab.enabled && missingLabel) {
      toast(`Column "${missingLabel.title}" needs a GitLab label (or pick another list type).`, "warn");
      return null;
    }
    if (!this.rows.some((r) => r.view)) {
      toast("Show at least one column in the board view.", "warn");
      return null;
    }
    try {
      const state = await api.updateBoardSettings(this.pid, this.patch());
      this.token = "";
      this.clearToken = false;
      return state;
    } catch (e) {
      toast((e as Error).message, "bad");
      return null;
    }
  }

  private async importColumns() {
    if (!confirm("Replace this board's columns with the GitLab board's lists?")) return;
    if (!(await this.save())) return;
    try {
      const state = await api.importBoardColumns(this.pid);
      toast(`Imported ${state.columns.length} columns from GitLab.`, "good");
      this.nav.reload(state);
    } catch (e) {
      toast((e as Error).message, "bad");
    }
  }
}
