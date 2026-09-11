import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { OUT, SITE_URL, pngSize, htmlPages, urlOf, load, jsonLd } from "./helpers.mjs";

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

test("at least one HTML page is built", () => {
  assert.ok(htmlPages().length >= 1, "no HTML pages in _site");
});

for (const file of htmlPages()) {
  const url = urlOf(file);
  test(`${url}: head has complete, consistent SEO metadata`, () => {
    const root = load(file);
    assert.equal(root.querySelector("html")?.getAttribute("lang"), "da");

    const titles = root.querySelectorAll("title");
    assert.equal(titles.length, 1, "exactly one <title>");
    const title = titles[0].text.trim();
    assert.ok(title.length > 0 && title.length <= 60, `title length ${title.length}: "${title}"`);

    const descs = root.querySelectorAll('meta[name="description"]');
    assert.equal(descs.length, 1, "exactly one meta description");
    const desc = descs[0].getAttribute("content").trim();
    assert.ok(desc.length >= 120 && desc.length <= 160, `description length ${desc.length}: "${desc}"`);

    const canonical = root.querySelector('link[rel="canonical"]')?.getAttribute("href");
    assert.equal(canonical, SITE_URL + url);

    const meta = (p) => root.querySelector(`meta[property="${p}"]`)?.getAttribute("content");
    assert.equal(meta("og:title"), title);
    assert.equal(meta("og:description"), desc);
    assert.equal(meta("og:url"), SITE_URL + url);
    assert.equal(meta("og:image"), `${SITE_URL}/assets/og-image.png`);
    assert.equal(meta("og:locale"), "da_DK");
    assert.equal(meta("og:type"), "website");
    assert.equal(root.querySelector('meta[name="twitter:card"]')?.getAttribute("content"), "summary_large_image");

    assert.ok(root.querySelector('link[rel="stylesheet"][href="/css/styles.css"]'), "stylesheet link");
    assert.ok(root.querySelector('link[rel="preconnect"][href="https://fonts.googleapis.com"]'), "preconnect googleapis");
    assert.ok(root.querySelector('link[rel="preconnect"][href="https://fonts.gstatic.com"]'), "preconnect gstatic");
    assert.ok(root.querySelector('link[rel="icon"]'), "favicon link");
    assert.ok(root.querySelector('link[rel="apple-touch-icon"]'), "apple touch icon");
    assert.ok(root.querySelector('link[rel="manifest"]'), "manifest link");

    const robots = root.querySelector('meta[name="robots"]')?.getAttribute("content");
    if (url === "/404.html") assert.equal(robots, "noindex");
    else assert.equal(robots, undefined, "only the 404 page may be noindex");
  });

  test(`${url}: heading structure, images and hidden-text hygiene`, () => {
    const root = load(file);
    const h1s = root.querySelectorAll("h1");
    assert.equal(h1s.length, 1, `expected one h1, found ${h1s.length}`);
    const levels = root.querySelectorAll("h1,h2,h3,h4,h5,h6").map((h) => Number(h.tagName[1]));
    assert.equal(levels[0], 1, "first heading must be the h1");
    let prev = 1;
    for (const lvl of levels) {
      assert.ok(lvl <= prev + 1, `heading level jumps from h${prev} to h${lvl}`);
      prev = lvl;
    }
    for (const img of root.querySelectorAll("img")) {
      const src = img.getAttribute("src") ?? "";
      assert.ok(img.hasAttribute("alt"), `img ${src} missing alt`);
      assert.ok(img.getAttribute("width") && img.getAttribute("height"), `img ${src} missing width/height`);
      assert.ok(!src.startsWith("data:"), `img ${src.slice(0, 30)} is still base64`);
      assert.ok(!src.startsWith("/mnt/"), `img ${src} points at a non-existent upload path`);
    }
    const html = readFileSync(file, "utf8");
    assert.ok(!/font-size:\s*0[;"]/.test(html), "hidden text via font-size:0 found");
    assert.ok(!html.includes("ren arbejdsplads kundetilfredshed"), "hidden keyword paragraph found");
    for (const ld of jsonLd(root)) assert.ok(ld["@context"] === "https://schema.org", "JSON-LD @context");
  });
}
