// Small local server for testing the site before Vercel. Node built-ins only.
// Serves site/ and runs site/api/ai.js like Vercel does.
// Run: node --env-file-if-exists=.env server.mjs   then open http://localhost:3000
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import ai from "./site/api/ai.js";

const DIST = path.join(import.meta.dirname, "site");
const API = { "/api/ai": ai };
const MAX_BODY = 10_000;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

function sendJson(res, code, obj) {
  res.statusCode = code;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(obj));
}

// Read the request body. Returns null if it is bigger than MAX_BODY.
async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) return null;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function api(req, res, fn) {
  const raw = await readBody(req);
  if (raw === null) {
    res.setHeader("connection", "close");
    return sendJson(res, 413, { error: "Request is too large." });
  }
  try { req.body = JSON.parse(raw); } catch { req.body = undefined; }
  // Same helpers as Vercel's res.status() / res.json().
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.setHeader("content-type", "application/json; charset=utf-8"); res.end(JSON.stringify(o)); };
  try {
    await fn(req, res);
  } catch (err) {
    console.error("API error", err?.name);
    if (!res.headersSent) sendJson(res, 500, { error: "Server error." });
  }
}

async function serveStatic(req, res, pathname) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    return res.end();
  }
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { decoded = null; }
  if (decoded === null || decoded.includes("\0")) {
    res.statusCode = 400;
    return res.end();
  }
  // Check again after decoding, so "/api%2fai.js" cannot serve the function's code.
  if (decoded.startsWith("/api/")) {
    res.statusCode = 404;
    return res.end();
  }
  // Stay inside site/, so the team's files next to it are never served.
  let p = path.resolve(DIST, "." + decoded);
  if (p !== DIST && !p.startsWith(DIST + path.sep)) {
    res.statusCode = 404;
    return res.end();
  }
  let stat = await fs.promises.stat(p).catch(() => null);
  if (stat?.isDirectory()) {
    p = path.join(p, "index.html");
    stat = await fs.promises.stat(p).catch(() => null);
  }
  if (!stat?.isFile()) {
    res.statusCode = 404;
    return res.end("Not found");
  }
  const data = await fs.promises.readFile(p);
  res.statusCode = 200;
  res.setHeader("content-type", TYPES[path.extname(p).toLowerCase()] || "application/octet-stream");
  res.end(req.method === "HEAD" ? undefined : data);
}

const server = http.createServer(async (req, res) => {
  // Catch everything: Node exits on an unhandled promise rejection.
  try {
    const { pathname } = new URL(req.url, "http://localhost");
    if (API[pathname]) return await api(req, res, API[pathname]);
    // Any other /api/ path is 404, so site/api/ai.js is never served as a file.
    if (pathname.startsWith("/api/")) return sendJson(res, 404, { error: "Not found." });
    return await serveStatic(req, res, pathname);
  } catch (err) {
    console.error("Server error", err?.name);
    if (!res.headersSent) sendJson(res, 500, { error: "Server error." });
    else res.end();
  }
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, "127.0.0.1", () => console.log(`FreeFin is running: http://localhost:${port}`));
