import { lifecycleReceipts } from './lifecycle-receipt.mjs';
import { createSecureServer } from "node:http2";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, extname, relative } from "node:path";
import { root, registry, sha, options, selectSystems } from "./config.mjs";
import { files, encodings } from "./prepare.mjs";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".map": "application/json",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};
export const lifecycleSnapshots = new Map();
export function chooseEncoding(header = "") {
  const q = new Map(
    header.split(",").map((part) => {
      const [name, quality] = part.trim().split(";");
      return [name, quality ? Number(quality.trim().replace("q=", "")) : 1];
    }),
  );
  return (
    ["br", "gzip"]
      .filter((k) => (q.get(k) ?? q.get("*") ?? 0) > 0)
      .sort((a, b) => (q.get(b) ?? q.get("*")) - (q.get(a) ?? q.get("*")))[0] ||
    "identity"
  );
}
export async function startServers({
  isolated = false,
  systems = registry,
  variant,
} = {}) {
  const servers = [];
  const encodedCache = resolve(root, ".cache/encoded");
  await mkdir(encodedCache, { recursive: true });
  const credentials = {
    cert: await readFile(resolve(root, ".cache/cert.pem")),
    key: await readFile(resolve(root, ".cache/key.pem")),
    allowHTTP1: true,
  };
  try {
    for (const system of systems) {
      const dir =
        variant && system.id === "en-reve"
          ? resolve(root, ".cache/variants", variant)
          : resolve(root, ".cache/snapshots", system.id);
      const assets = new Map();
      for (const path of await files(dir)) {
        if (path.endsWith(".map")) continue; // Source maps remain local diagnostic artifacts.
        const data = await readFile(path),
          hash = sha(data);
        let encoded;
        try {
          encoded = {
            identity: data,
            gzip: await readFile(resolve(encodedCache, hash + ".gz")),
            br: await readFile(resolve(encodedCache, hash + ".br")),
          };
        } catch {
          encoded = encodings(data);
          await writeFile(resolve(encodedCache, hash + ".gz"), encoded.gzip);
          await writeFile(resolve(encodedCache, hash + ".br"), encoded.br);
        }
        assets.set("/" + relative(dir, path), {
          ...encoded,
          etag: '"' + hash + '"',
          type: types[extname(path)] || "application/octet-stream",
        });
      }
      const server = createSecureServer(credentials, (req, res) => {
        const path = new URL(req.url, "https://localhost").pathname;
        if (isolated) {
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
        }
        res.setHeader("Timing-Allow-Origin", "*");
        if (path === "/__perf/collect" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", () => {
            try {
              const data = JSON.parse(body);
              lifecycleSnapshots.set(data.documentId, data);
              lifecycleReceipts.deliver(data);
              res.writeHead(204);
              res.end();
            } catch {
              res.writeHead(400);
              res.end();
            }
          });
          return;
        }
        if (path === "/__perf/network-calibration") {
          const size = Number(new URL(req.url, "https://localhost").searchParams.get("bytes"));
          if (![1024, 1000000].includes(size)) { res.writeHead(400); res.end(); return; }
          res.writeHead(200, { "content-type": "application/octet-stream", "content-length": size, "cache-control": "no-store" });
          res.end(Buffer.alloc(size, 113));
          return;
        }
        if (path === "/__perf/calibration") {
          res.writeHead(200, {
            "content-type": "text/html",
            "cache-control": "no-store",
          });
          res.end(
            '<!doctype html><title>Collector calibration</title><h1>Known browser work</h1><div id="spacer"></div><button id="work">Run 60ms task</button><p id="result">Ready</p><script>work.onclick=()=>{const start=performance.now();while(performance.now()-start<60){};result.textContent="Done"}</script>',
          );
          return;
        }
        if (path === "/__perf/away") {
          res.writeHead(200, {
            "content-type": "text/html",
            "cache-control": "no-cache",
          });
          res.end(
            '<!doctype html><title>Performance lifecycle destination</title><a href="/">Return</a>',
          );
          return;
        }
        const asset = assets.get(path === "/" ? "/index.html" : path);
        if (!asset) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }
        res.setHeader("ETag", asset.etag);
        res.setHeader("Vary", "Accept-Encoding");
        res.setHeader("Content-Type", asset.type);
        res.setHeader(
          "Cache-Control",
          /\.[a-z0-9]+$/i.test(path) && !path.endsWith(".html")
            ? "public, max-age=31536000, immutable"
            : "no-cache",
        );
        if (req.headers["if-none-match"] === asset.etag) {
          res.writeHead(304);
          res.end();
          return;
        }
        const encoding = chooseEncoding(req.headers["accept-encoding"]);
        if (encoding !== "identity")
          res.setHeader("Content-Encoding", encoding);
        res.setHeader("Content-Length", asset[encoding].length);
        res.writeHead(200);
        res.end(req.method === "HEAD" ? undefined : asset[encoding]);
      });
      const port = system.port + (isolated ? 100 : 0);
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, "127.0.0.1", resolve);
      });
      servers.push(server);
    }
  } catch (error) {
    await Promise.all(servers.map((s) => new Promise((r) => s.close(r))));
    throw error;
  }
  return async () => {
    for (const server of servers) {
      server.closeAllConnections?.();
      server.close();
    }
  };
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const args = options(["serve", ...process.argv.slice(2)]);
  await startServers({
    systems: selectSystems(args.systems),
    isolated: Boolean(args.isolated),
    variant: args.variant,
  });
  console.log(
    "Selected showcase HTTPS/HTTP2 servers listening in https://127.0.0.1:4610–4618 (4710–4718 with --isolated).",
  );
}
