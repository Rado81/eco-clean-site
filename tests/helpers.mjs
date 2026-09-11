import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parse } from "node-html-parser";

export const OUT = "_site";
export const SITE_URL = "https://eco-clean.nu";

export function walk(dir, ext, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, ext, acc);
    else if (p.endsWith(ext)) acc.push(p);
  }
  return acc;
}

export const htmlPages = () => walk(OUT, ".html");

/** "_site/ydelser/x/index.html" -> "/ydelser/x/", "_site/404.html" -> "/404.html" */
export const urlOf = (file) =>
  "/" + relative(OUT, file).replace(/\\/g, "/").replace(/index\.html$/, "");

export const load = (file) => parse(readFileSync(file, "utf8"));

export function pngSize(file) {
  const b = readFileSync(file);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

export const jsonLd = (root) =>
  root
    .querySelectorAll('script[type="application/ld+json"]')
    .map((s) => JSON.parse(s.text));

export const typesOf = (ld) => [].concat(ld["@type"]);

export const words = (text) => text.split(/\s+/).filter(Boolean).length;
