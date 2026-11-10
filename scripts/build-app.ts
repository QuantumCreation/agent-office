// Builds "Agent Office.app" into release/: `npm run app`. Add `--install` (`npm run app:install`)
// to also copy it into /Applications.
//
// Steps: build the client (vite), bundle the Electron main process with the office server
// (esbuild), stage them as a tiny app folder, wrap that in Electron (@electron/packager), and
// sign it ad hoc so macOS will run it on this Mac.

import { build } from "esbuild";
import { packager } from "@electron/packager";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const stage = join(root, "build", "app");
const release = join(root, "release");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const electronVersion: string = JSON.parse(readFileSync(join(root, "node_modules", "electron", "package.json"), "utf8")).version;
const APP_NAME = "Agent Office";
const install = process.argv.includes("--install");

const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { cwd: root, stdio: "inherit" });

console.log("› Building the client");
run(join(root, "node_modules", ".bin", "vite"), ["build", "--logLevel", "warn"]);

console.log("› Bundling the app");
rmSync(stage, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });
await build({
  entryPoints: [join(root, "electron", "main.ts")],
  outfile: join(stage, "main.mjs"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  external: ["electron"],
  logLevel: "warning",
});
await build({
  entryPoints: [join(root, "electron", "preload.ts")],
  outfile: join(stage, "preload.cjs"),
  bundle: true,
  platform: "browser",
  format: "cjs",
  logLevel: "warning",
});
cpSync(join(root, "dist"), join(stage, "dist"), { recursive: true });
writeFileSync(
  join(stage, "package.json"),
  JSON.stringify({ name: pkg.name, productName: APP_NAME, version: pkg.version, description: pkg.description, type: "module", main: "main.mjs" }, null, 2),
);

console.log(`› Packaging with Electron ${electronVersion}`);
const [appDir] = await packager({
  dir: stage,
  out: release,
  name: APP_NAME,
  platform: "darwin",
  arch: process.arch === "arm64" ? "arm64" : "x64",
  electronVersion,
  appVersion: pkg.version,
  appBundleId: "local.agent-office",
  appCategoryType: "public.app-category.developer-tools",
  icon: join(root, "assets", "app", "icon.icns"),
  darwinDarkModeSupport: true,
  asar: true,
  prune: false,
  overwrite: true,
  quiet: true,
  extendInfo: { NSHumanReadableCopyright: "Agent Office" },
});
const appPath = join(appDir, `${APP_NAME}.app`);

console.log("› Signing (ad hoc, for this Mac)");
run("codesign", ["--force", "--deep", "--sign", "-", appPath]);
run("codesign", ["--verify", "--deep", "--strict", appPath]);

if (install) {
  const target = `/Applications/${APP_NAME}.app`;
  try {
    execFileSync("osascript", ["-e", `tell application "${APP_NAME}" to quit`], { stdio: "ignore" });
  } catch {
    /* wasn't running */
  }
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
  run("ditto", [appPath, target]);
  console.log(`\n✓ Installed ${target}`);
} else {
  console.log(`\n✓ Built ${appPath}`);
}
