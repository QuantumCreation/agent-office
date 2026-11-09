// Tiny DOM helpers: element builder, toasts, modals, light markdown.

type Child = Node | string | null | undefined | false;
type Attrs = Record<string, unknown> & { class?: string; style?: string };

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: (Child | Child[])[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") {
      el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    } else if (k === "class") {
      el.className = String(v);
    } else if (k === "style") {
      el.setAttribute("style", String(v));
    } else if (k in el && typeof v !== "string") {
      (el as unknown as Record<string, unknown>)[k] = v;
    } else {
      el.setAttribute(k, v === true ? "" : String(v));
    }
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return el;
}

const toastRoot = () => document.getElementById("toasts")!;

export function toast(message: string, kind: "info" | "good" | "warn" | "bad" = "info", onClick?: () => void) {
  const el = h("div", { class: `toast ${kind}`, onclick: () => { onClick?.(); el.remove(); } }, message);
  toastRoot().append(el);
  setTimeout(() => el.classList.add("out"), 4200);
  setTimeout(() => el.remove(), 4700);
}

let activeModal: { el: HTMLElement; close: () => void } | null = null;
let modalClosedHook: () => void = () => {};
/** Runs after any modal closes (used to recapture the mouse). */
export function onModalClosed(fn: () => void) {
  modalClosedHook = fn;
}

export function openModal(title: string, body: HTMLElement, opts: { wide?: boolean; onClose?: () => void } = {}) {
  closeModal();
  const close = () => {
    backdrop.remove();
    if (activeModal?.el === backdrop) activeModal = null;
    opts.onClose?.();
    modalClosedHook();
  };
  const backdrop = h(
    "div",
    { class: "modal-backdrop", onmousedown: (e: MouseEvent) => e.target === backdrop && close() },
    h(
      "div",
      { class: `modal ${opts.wide ? "wide" : ""}` },
      h("header", {}, h("h2", {}, title), h("button", { class: "icon-btn", title: "Close (Esc)", onclick: close }, "×")),
      body,
    ),
  );
  // Capture phase so Esc closes the modal even while typing in one of its fields.
  backdrop.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    },
    true,
  );
  document.getElementById("ui")!.append(backdrop);
  activeModal = { el: backdrop, close };
  const first = body.querySelector<HTMLElement>("textarea, input, select");
  setTimeout(() => first?.focus(), 30);
  return close;
}

export function closeModal() {
  activeModal?.close();
}

export function modalOpen() {
  return activeModal !== null;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Very small markdown subset: code fences, inline code, bold, links, lists, tables-as-pre. */
export function renderMarkdown(src: string): HTMLElement {
  const out = h("div", { class: "md" });
  const parts = src.split(/```/);
  parts.forEach((part, i) => {
    if (i % 2 === 1) {
      const code = part.replace(/^[a-zA-Z0-9_-]*\n/, "");
      out.append(h("pre", {}, code));
      return;
    }
    const lines = part.split("\n");
    let buf: string[] = [];
    const flush = () => {
      if (!buf.length) return;
      const html = buf
        .map((l) => {
          let x = escapeHtml(l);
          x = x.replace(/`([^`]+)`/g, "<code>$1</code>");
          x = x.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
          x = x.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
          x = x.replace(/^#{1,6}\s+(.*)$/, "<strong>$1</strong>");
          x = x.replace(/^\s*[-*]\s+/, "• ");
          return x;
        })
        .join("<br>");
      const p = document.createElement("p");
      p.innerHTML = html;
      out.append(p);
      buf = [];
    };
    let table: string[] = [];
    for (const line of lines) {
      if (/^\s*\|/.test(line)) {
        if (buf.length) flush();
        table.push(line);
        continue;
      }
      if (table.length) {
        out.append(h("pre", { class: "table" }, table.join("\n")));
        table = [];
      }
      if (!line.trim()) flush();
      else buf.push(line);
    }
    if (table.length) out.append(h("pre", { class: "table" }, table.join("\n")));
    flush();
  });
  return out;
}

export function timeAgo(iso: string | null) {
  if (!iso) return "";
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
