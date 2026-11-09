// Production server: serves the built client from dist/ plus the office bridge.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createBridge } from "./bridge.ts";

const PORT = Number(process.env.PORT ?? 5199);
const root = fileURLToPath(new URL("../dist/", import.meta.url));
const dataFile = fileURLToPath(new URL("../data/office.json", import.meta.url));
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
};

const bridge = createBridge({ dataFile, publicUrl: () => `http://127.0.0.1:${PORT}` });

const server = createServer((req, res) => {
  bridge.middleware(req, res, async () => {
    const urlPath = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
    let file = normalize(join(root, urlPath));
    if (!file.startsWith(root)) {
      res.statusCode = 403;
      return res.end();
    }
    try {
      if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    } catch {
      file = join(root, "index.html");
    }
    try {
      const body = await readFile(file);
      res.setHeader("content-type", TYPES[extname(file)] ?? "application/octet-stream");
      res.end(body);
    } catch {
      res.statusCode = 404;
      res.end("Not found. Run `npm run build` first.");
    }
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Agent Office running at http://127.0.0.1:${PORT}`);
});
