// The ray tracing checkbox, plus (while it's on) what's on, how fast, and the keys.

import type { RayTracer } from "./renderer.ts";

const VIEWS = ["final", "diffuse light", "reflections", "normals", "roughness / metal"];

export class RTHud {
  private el: HTMLElement;
  private timer = 0;
  private rt: RayTracer;
  private box: HTMLInputElement;
  private info: HTMLElement;

  constructor(rt: RayTracer, parent: HTMLElement, onToggle: (on: boolean) => void) {
    this.rt = rt;
    this.el = document.createElement("div");
    this.el.className = "rt-hud";
    const label = document.createElement("label");
    label.className = "rt-toggle";
    label.title = "Real-time ray tracing: reflections, ray-traced shadows and global illumination. Needs a good GPU. (G)";
    this.box = document.createElement("input");
    this.box.type = "checkbox";
    this.box.addEventListener("change", () => {
      onToggle(this.box.checked);
      this.box.blur(); // so G and walking keys go back to the office
    });
    const text = document.createElement("span");
    label.append(this.box, text);
    this.info = document.createElement("div");
    this.el.append(label, this.info);
    parent.appendChild(this.el);
    const style = document.createElement("style");
    style.textContent = `
      .rt-hud { position: absolute; left: 12px; bottom: 12px; z-index: 5; pointer-events: none;
        font: 600 12px/1.45 system-ui, sans-serif; color: #e9f6ff; background: rgba(8, 10, 22, 0.62);
        border: 1px solid rgba(41, 231, 255, 0.45); border-radius: 10px; padding: 8px 11px;
        box-shadow: 0 0 18px rgba(41, 231, 255, 0.18), inset 0 0 12px rgba(255, 47, 168, 0.08); backdrop-filter: blur(6px); }
      .rt-hud.off { border-color: rgba(255,255,255,.18); box-shadow: none; padding: 5px 10px; }
      .rt-hud label.rt-toggle { pointer-events: auto; cursor: pointer; display: flex; align-items: center; gap: 7px; justify-content: flex-start; width: auto; margin: 0; white-space: nowrap;
        font-weight: 800; letter-spacing: 0.08em; color: #29e7ff; text-shadow: 0 0 8px rgba(41,231,255,.7); user-select: none; }
      .rt-hud.off .rt-toggle { color: #c9ccd8; text-shadow: none; letter-spacing: 0.04em; }
      .rt-hud .rt-toggle input { width: auto; flex: none; margin: 0; padding: 0; border: none; accent-color: #29e7ff; cursor: pointer; }
      .rt-hud .rt-dim { color: #9fb0c8; font-weight: 500; }
      .rt-hud kbd { font: 700 11px system-ui; background: rgba(255,255,255,.12); border-radius: 4px; padding: 0 5px; margin-right: 3px; }
    `;
    document.head.appendChild(style);
    this.draw();
  }

  /** Keep the controls help just above this panel. */
  private placeHelp() {
    const help = document.getElementById("help");
    if (help) help.style.bottom = `${this.el.offsetHeight + 22}px`;
  }

  update(dt: number) {
    this.timer += dt;
    if (this.timer < 0.5) return;
    this.timer = 0;
    this.draw();
  }

  draw() {
    const rt = this.rt;
    const s = rt.stats;
    this.box.checked = rt.enabled;
    queueMicrotask(() => this.placeHelp());
    this.el.classList.toggle("off", !rt.enabled);
    const text = this.box.nextElementSibling as HTMLElement;
    if (!rt.enabled) {
      text.textContent = "⚡ Ray tracing";
      this.info.innerHTML = "";
      return;
    }
    text.textContent = `⚡ RAY TRACED · ${rt.mood.name.toUpperCase()}`;
    const parts = [rt.gi ? "GI" : null, rt.specular ? "reflections" : null, "RT shadows", rt.denoise ? "denoised" : "raw"].filter(Boolean).join(" · ");
    this.info.innerHTML =
      (s.triangles
        ? `<div>${s.fps.toFixed(0)} fps · ${s.width}×${s.height} · ${(s.triangles / 1000).toFixed(0)}k tris in BVH · ${s.lights} lights</div>`
        : `<div class="rt-dim">building the scene for ray tracing…</div>`) +
      `<div class="rt-dim">${parts}${rt.view ? ` · view: ${VIEWS[rt.view]}` : ""}</div>` +
      `<div class="rt-dim"><kbd>G</kbd>off <kbd>L</kbd>mood <kbd>X</kbd>debug view <kbd>N</kbd>denoise</div>`;
  }
}
