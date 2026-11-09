import { defineConfig, type Plugin } from "vite";
import { fileURLToPath } from "node:url";
import { createBridge } from "./server/bridge.ts";

const PORT = Number(process.env.PORT ?? 5199);
const dataFile = fileURLToPath(new URL("./data/office.json", import.meta.url));

function officeBridge(): Plugin {
  return {
    name: "agent-office-bridge",
    configureServer(server) {
      const bridge = createBridge({ dataFile, publicUrl: () => `http://127.0.0.1:${PORT}` });
      server.middlewares.use(bridge.middleware);
      server.httpServer?.on("close", () => bridge.close());
    },
  };
}

export default defineConfig({
  plugins: [officeBridge()],
  server: { port: PORT, strictPort: true, host: "127.0.0.1", open: true },
  build: { target: "es2022", chunkSizeWarningLimit: 1200 },
});
