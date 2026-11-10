// A small status panel for the ray tracer: what's on, how fast, and the keys.

import type { RayTracer } from "./renderer.ts";

const VIEWS = ["final", "diffuse light", "reflections", "normals", "roughness / metal"];

export class RTHud {
  private el: HTMLElement;
  private timer = 0;
  private rt: RayTracer;

  constructor(rt: RayTracer, parent: HTMLElement) {
    this.rt = rt;
    this.el = document.createElement("div");
    this.el.className = "rt-hud";
    parent.appendChild(this.el);
    const style = document.createElement("style");
    style.textContent = `
      .rt-hud { position: absolute; left: 12px; bottom: 12px; z-index: 5; pointer-events: none;
        font: 600 12px/1.45 system-ui, sans-serif; color: #e9f6ff; background: rgba(8, 10, 22, 0.62);
        border: 1px solid rgba(41, 231, 255, 0.45); border-radius: 10px; padding: 8px 11px;
        box-shadow: 0 0 18px rgba(41, 231, 255, 0.18), inset 0 0 12px rgba(255, 47, 168, 0.08); backdrop-filter: blur(6px); }
      .rt-hud .rt-title { font-weight: 800; letter-spacing: 0.08em; color: #29e7ff; text-shadow: 0 0 8px rgba(41,231,255,.7); }
      .rt-hud .rt-title.off { color: #c9ccd8; text-shadow: none; }
      .rt-hud .rt-dim { color: #9fb0c8; font-weight: 500; }
      .rt-hud kbd { font: 700 11px system-ui; background: rgba(255,255,255,.12); border-radius: 4px; padding: 0 5px; margin-right: 3px; }
      #help { bottom: 92px !important; }
    `;
    document.head.appendChild(style);
    this.draw();
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
    if (!rt.enabled) {
      this.el.innerHTML = `<div class="rt-title off">RASTER (original look)</div><div class="rt-dim"><kbd>R</kbd>back to ray tracing</div>`;
      return;
    }
    const parts = [rt.gi ? "GI" : null, rt.specular ? "reflections" : null, "RT shadows", rt.denoise ? "denoised" : "raw"].filter(Boolean).join(" · ");
    this.el.innerHTML =
      `<div class="rt-title">⚡ RAY TRACED · ${rt.mood.name.toUpperCase()}</div>` +
      `<div>${s.fps.toFixed(0)} fps · ${s.width}×${s.height} · ${(s.triangles / 1000).toFixed(0)}k tris in BVH · ${s.lights} lights</div>` +
      `<div class="rt-dim">${parts}${rt.view ? ` · view: ${VIEWS[rt.view]}` : ""}</div>` +
      `<div class="rt-dim"><kbd>R</kbd>raster <kbd>L</kbd>mood <kbd>X</kbd>debug view <kbd>N</kbd>denoise</div>`;
  }
}
