// Renders the Mac app icon (dev/icon.html, a Bloop on a sky tile) to assets/app/icon.png and
// assets/app/icon.icns. Run with `node scripts/render-icon.ts [hat=sprout] [color=#ff9f6e]`.

import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import electronPath from "electron";

const root = fileURLToPath(new URL("..", import.meta.url));
const outDir = join(root, "assets", "app");
const work = mkdtempSync(join(tmpdir(), "agent-office-icon-"));
const query = new URLSearchParams(process.argv.slice(2).map((a) => a.split("=") as [string, string])).toString();

try {
  // The page, bundled into one classic script so it loads straight from disk.
  await build({ entryPoints: [join(root, "dev", "icon.ts")], bundle: true, format: "iife", outfile: join(work, "icon.js"), logLevel: "warning" });
  const html = readFileSync(join(root, "dev", "icon.html"), "utf8").replace(/<script type="module" src="\.\/icon\.ts"><\/script>/, '<script src="./icon.js"></script>');
  writeFileSync(join(work, "icon.html"), html);

  const png = join(outDir, "icon.png");
  writeFileSync(
    join(work, "main.mjs"),
    `
import { app, BrowserWindow } from "electron";
import { writeFileSync } from "node:fs";
app.dock?.hide();
app.whenReady().then(async () => {
  const w = new BrowserWindow({ width: 1024, height: 1024, show: false, transparent: true, frame: false, useContentSize: true,
    webPreferences: { offscreen: true } });
  w.webContents.setFrameRate(1);
  await w.loadFile(${JSON.stringify(join(work, "icon.html"))}, { search: ${JSON.stringify(query)} });
  for (let i = 0; i < 100 && w.webContents.getTitle() !== "ready"; i++) await new Promise((r) => setTimeout(r, 50));
  await new Promise((r) => setTimeout(r, 300));
  const image = await w.webContents.capturePage({ x: 0, y: 0, width: 1024, height: 1024 });
  writeFileSync(${JSON.stringify(png)}, image.resize({ width: 1024, height: 1024 }).toPNG());
  app.quit();
});
`,
  );
  mkdirSync(outDir, { recursive: true });
  execFileSync(electronPath as unknown as string, [join(work, "main.mjs")], { stdio: "inherit", timeout: 60_000 });

  // .icns: every size macOS asks for, from the 1024px render.
  const iconset = join(work, "icon.iconset");
  mkdirSync(iconset);
  for (const size of [16, 32, 128, 256, 512]) {
    for (const scale of [1, 2]) {
      const px = size * scale;
      const name = `icon_${size}x${size}${scale === 2 ? "@2x" : ""}.png`;
      execFileSync("sips", ["-z", String(px), String(px), png, "--out", join(iconset, name)], { stdio: "ignore" });
    }
  }
  execFileSync("iconutil", ["-c", "icns", iconset, "-o", join(outDir, "icon.icns")]);
  console.log(`Wrote ${png} and icon.icns`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
