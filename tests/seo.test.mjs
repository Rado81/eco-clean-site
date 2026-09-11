import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { OUT, SITE_URL, pngSize } from "./helpers.mjs";

test("robots.txt is copied to the site root and points at the sitemap", () => {
  const file = join(OUT, "robots.txt");
  assert.ok(existsSync(file), "_site/robots.txt missing");
  const txt = readFileSync(file, "utf8");
  assert.match(txt, /^User-agent: \*$/m);
  assert.match(txt, /^Allow: \/$/m);
  assert.match(txt, new RegExp(`^Sitemap: ${SITE_URL}/sitemap.xml$`, "m"));
});

test("logo and icon assets are built with the expected dimensions", () => {
  const expect = {
    "_site/assets/logo.png": [121, 62],
    "_site/assets/og-image.png": [1200, 630],
    "_site/assets/favicon-32.png": [32, 32],
    "_site/assets/apple-touch-icon.png": [180, 180],
    "_site/assets/icon-192.png": [192, 192],
    "_site/assets/icon-512.png": [512, 512],
    "_site/assets/partners/team-trees.png": [144, 144],
    "_site/assets/partners/team-seas.png": [144, 144],
    "_site/assets/partners/novak-djokovic-foundation.png": [144, 144],
  };
  for (const [file, [w, h]] of Object.entries(expect)) {
    assert.ok(existsSync(file), `${file} missing`);
    assert.deepEqual(pngSize(file), { width: w, height: h }, `${file} has wrong size`);
  }
  assert.ok(existsSync("_site/favicon.ico"), "_site/favicon.ico missing");
  const manifest = JSON.parse(readFileSync("_site/assets/site.webmanifest", "utf8"));
  assert.equal(manifest.name, "ECO CLEAN DK ApS");
  assert.equal(manifest.icons.length, 2);
});

test("styles.css is built once, deduplicated, and contains all original blocks", () => {
  const file = "_site/css/styles.css";
  assert.ok(existsSync(file), `${file} missing`);
  const css = readFileSync(file, "utf8");
  for (const needle of [".hero {", ".tp-wrapper {", ".kunde-wrapper {", ".hamburger {", ".page-hero {", ".breadcrumb ol {", ".footer-heading {"]) {
    assert.ok(css.includes(needle), `missing rule ${needle}`);
  }
  const mobileBlocks = css.split("MOBILE OPTIMERING").length - 1;
  assert.equal(mobileBlocks, 1, `mobile block should appear once, found ${mobileBlocks}`);
  assert.equal(css.split(".tp-wrapper {").length - 1, 1, ".tp-wrapper defined more than once");
  assert.ok(!css.includes("<style>") && !css.includes("</style>"), "style tags leaked into css");
  assert.ok(!css.includes(".offer-step h4"), "selector .offer-step h4 should have been renamed to h3");
  assert.ok(!css.includes(".eco-card h4"), "selector .eco-card h4 should have been renamed to h3");
  assert.ok(!css.includes(".footer-col h5"), "selector .footer-col h5 should have been replaced by .footer-heading");
});
