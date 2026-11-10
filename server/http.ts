// The production HTTP server: serves the built client (dist/) plus the office bridge (/api).
// Used by `npm run serve` (server/main.ts) and by the Mac app (electron/main.ts).

import { createServer, type Server } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";
import { createBridge } from "./bridge.ts";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".json": "application/json",
  ".glb": "model/gltf-binary",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".woff2": "font/woff2",
};

export interface OfficeServerOptions {
  /** The built client: the output of `vite build`. */
  distDir: string;
  dataFile: string;
  port: number;
  host?: string;
}

export interface OfficeServer {
  server: Server;
  url: string;
  close(): Promise<void>;
}

/** Starts the office. Rejects with the listen error (e.g. EADDRINUSE) if the port is taken. */
export function startOfficeServer(options: OfficeServerOptions): Promise<OfficeServer> {
  const host = options.host ?? "127.0.0.1";
  const url = `http://${host}:${options.port}`;
  const root = normalize(options.distDir.endsWith(sep) ? options.distDir : options.distDir + sep);

  return new Promise((resolve, reject) => {
    // The bridge starts polling T3 as soon as it's created, so only create it once we own the port.
    let bridge: ReturnType<typeof createBridge> | null = null;

    const server = createServer((req, res) => {
      if (!bridge) {
        res.statusCode = 503;
        return res.end();
      }
      bridge.middleware(req, res, async () => {
        const urlPath = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
        let file = normalize(join(root, urlPath));
        if (!file.startsWith(root) && file + sep !== root) {
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

    server.once("error", reject);
    server.listen(options.port, host, () => {
      server.off("error", reject);
      bridge = createBridge({ dataFile: options.dataFile, publicUrl: () => url });
      resolve({
        server,
        url,
        close: () =>
          new Promise<void>((done) => {
            bridge?.close();
            server.close(() => done());
            server.closeAllConnections();
          }),
      });
    });
  });
}
