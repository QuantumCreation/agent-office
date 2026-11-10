// Production server for the browser: `npm run serve` (or `npm start`, which builds first).
import { fileURLToPath } from "node:url";
import { startOfficeServer } from "./http.ts";
import { DEFAULT_PORT, resolveDataFile } from "./paths.ts";

const office = await startOfficeServer({
  distDir: fileURLToPath(new URL("../dist/", import.meta.url)),
  dataFile: resolveDataFile(fileURLToPath(new URL("../data/office.json", import.meta.url))),
  port: Number(process.env.PORT ?? DEFAULT_PORT),
});
console.log(`Agent Office running at ${office.url}`);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => void office.close().then(() => process.exit(0)));
}
