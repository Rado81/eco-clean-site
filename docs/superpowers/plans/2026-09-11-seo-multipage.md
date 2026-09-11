# ECO CLEAN DK – SEO Multi-Page Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the single-file landing page `index.html` into an Eleventy-built static site with a home page, an about page and eight indexable service pages, each with complete on-page SEO, structured data, sitemap and robots, and with the spam-like keyword blocks removed.

**Architecture:** Eleventy 3 (ESM config) reads `src/` and writes `_site/`. One base layout (`base.njk`) owns the `<head>`, nav and footer; `service.njk` and `page.njk` chain to it. `src/_data/site.json` and `src/_data/services.json` are the single sources for business facts and the service list; the home page cards, footer links, JSON-LD and sitemap are generated from them. The original `index.html` is a read-only source of copy and markup until the final task deletes it.

**Tech Stack:** Node 22.11, @11ty/eleventy 3.1.x (Nunjucks + Markdown), node:test + node-html-parser for SEO invariant tests, html-validate, linkinator, @resvg/resvg-js + png-to-ico for icons, http-server + lighthouse for performance checks, Playwright MCP browser for screenshots.

**Spec:** `docs/superpowers/specs/2026-09-11-seo-multipage-design.md`

## Global Constraints

- Node 22.11.0, npm 10.9. Package versions to install: `@11ty/eleventy@^3.1.6`, `html-validate@^11.15.0`, `linkinator@^8.1.0`, `node-html-parser@^9.0.4`, `@resvg/resvg-js@^2.6.2`, `png-to-ico@^3.0.2`, `http-server@^14.1.1`, `lighthouse@^13.4.1`. All are devDependencies.
- `package.json` has `"type": "module"`; every `.js`/`.mjs` file uses ESM `import`/`export`.
- Working directory for every command: `C:\Ondrive\OneDrive - crossjoin.dk\Desktop\ClaudeCode Projects\Kristians webside v2`. Paths contain spaces: quote them.
- `index.html` at the project root is **read-only** until Task 10. Never edit it; the line numbers in this plan depend on it staying exactly as it is (1917 lines).
- `lang="da"` on every page. Slugs are ASCII (ø→oe, å→aa, æ→ae). Every page URL is a folder ending in `/` served by `index.html`.
- `<title>` at most 60 characters. Meta description 120–160 characters (target 140–155). Exactly one `<h1>` per page. Heading levels never skip downward (h2 → h3, never h2 → h4).
- The Trustpilot reviews strip is copied verbatim and never changed. No `AggregateRating` or `Review` JSON-LD anywhere.
- The home page's visible copy stays verbatim except for the edits listed in Task 5. No visual changes are intended; styling is preserved via classes and inline styles.
- No claims are added to the new pages that the current site does not make. Prices: only "timepris fra 485 kr. ekskl. moms".
- Commit after every task. Commit messages end with the trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Tests are run with `npm test` (builds, then runs node:test). Do not mark a task done until its tests pass.

---

## File map

| Path | Responsibility |
| --- | --- |
| `package.json`, `eleventy.config.js`, `.gitignore`, `.htmlvalidate.json` | Tooling and build config |
| `scripts/extract-logo.mjs` | One-off: writes `src/assets/logo.png` from the base64 in `index.html` (deleted in Task 10) |
| `scripts/make-images.mjs` | Renders favicon set, OG image, web manifest, partner placeholders |
| `tests/helpers.mjs` | Shared helpers for the test suite (walk `_site`, parse HTML, PNG size, JSON-LD) |
| `tests/seo.test.mjs` | All SEO invariant tests, grown task by task |
| `src/src.json` | Directory data for every page: `date: "Last Modified"` |
| `src/_data/site.json` | Business facts: name, URL, phone, email, CVR, address, hours, form endpoint |
| `src/_data/services.json` | The 11 services: slug, name, h1, icon, blurb, hasPage, related |
| `src/_data/business.js` | Builds the LocalBusiness JSON-LD object from `site.json` |
| `src/_data/build.js` | `{ year }` for the footer copyright |
| `src/_includes/base.njk` | `<html>`, `<head>` with all SEO meta, nav, footer, script |
| `src/_includes/partials/nav.njk`, `footer.njk`, `jsonld-business.njk` | Shared fragments |
| `src/_includes/service.njk` | Service page layout: breadcrumb, hero, body, CTA, related, Service + BreadcrumbList JSON-LD |
| `src/_includes/page.njk` | Generic content page layout (Om os), Organization JSON-LD |
| `src/css/styles.css` | All CSS, deduplicated, plus subpage rules |
| `src/favicon.ico`, `src/assets/*` | Static assets (passthrough copy) |
| `src/index.njk` | Home page (migrated from `index.html`) |
| `src/404.njk` | 404 page, `noindex`, excluded from collections |
| `src/om-os.md` | About page |
| `src/ydelser/ydelser.json` + eight `.md` | Service pages |
| `src/sitemap.njk`, `src/robots.txt` | Crawl files |
| `README.md` | Build, check, deploy, missing inputs, how to add a service |

---

### Task 1: Project scaffold, git, first passing test

**Files:**
- Create: `.gitignore`, `package.json`, `eleventy.config.js`, `src/src.json`, `src/robots.txt`, `tests/helpers.mjs`, `tests/seo.test.mjs`

**Interfaces:**
- Produces: `npm run build` (Eleventy build to `_site/`), `npm run serve` (dev server on port 8080), `npm test` (build + node:test over `tests/**/*.test.mjs`). Helpers exported from `tests/helpers.mjs`: `OUT`, `SITE_URL`, `walk(dir, ext)`, `htmlPages()`, `urlOf(file)`, `load(file)`, `pngSize(file)`, `jsonLd(root)`, `typesOf(ld)`, `words(text)`. Nunjucks filters `isoDate` and `findBySlug` registered in `eleventy.config.js`.

- [ ] **Step 1: Initialise git and ignore build output**

```bash
git init
```

Create `.gitignore`:

```
node_modules/
_site/
_verify/
.cache/
Thumbs.db
.DS_Store
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "eco-clean-site",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "eco-clean.nu – ECO CLEAN DK ApS website, built with Eleventy",
  "scripts": {
    "build": "eleventy",
    "serve": "eleventy --serve",
    "images": "node scripts/make-images.mjs",
    "test": "npm run build && node --test \"tests/**/*.test.mjs\"",
    "check": "npm run build && html-validate \"_site/**/*.html\" && linkinator ./_site --recurse --skip \"^https://eco-clean\\.nu\" --verbosity error"
  },
  "devDependencies": {
    "@11ty/eleventy": "^3.1.6",
    "@resvg/resvg-js": "^2.6.2",
    "html-validate": "^11.15.0",
    "http-server": "^14.1.1",
    "lighthouse": "^13.4.1",
    "linkinator": "^8.1.0",
    "node-html-parser": "^9.0.4",
    "png-to-ico": "^3.0.2"
  }
}
```

- [ ] **Step 3: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, `package-lock.json` written, no errors. (Warnings about optional dependencies are fine.)

- [ ] **Step 4: Write the test helpers**

Create `tests/helpers.mjs`:

```js
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
```

- [ ] **Step 5: Write the first failing test**

Create `tests/seo.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { OUT, SITE_URL } from "./helpers.mjs";

test("robots.txt is copied to the site root and points at the sitemap", () => {
  const file = join(OUT, "robots.txt");
  assert.ok(existsSync(file), "_site/robots.txt missing");
  const txt = readFileSync(file, "utf8");
  assert.match(txt, /^User-agent: \*$/m);
  assert.match(txt, /^Allow: \/$/m);
  assert.match(txt, new RegExp(`^Sitemap: ${SITE_URL}/sitemap.xml$`, "m"));
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npm test`
Expected: the build step fails because `eleventy.config.js` does not exist yet, or the test fails with "_site/robots.txt missing".

- [ ] **Step 7: Write the Eleventy config, directory data and robots.txt**

Create `eleventy.config.js`:

```js
export default function (eleventyConfig) {
  // Static files copied 1:1 into _site/ (paths are relative to the project root).
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/favicon.ico");

  // YYYY-MM-DD for sitemap <lastmod>.
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));

  // services | findBySlug(page.fileSlug) -> the matching entry of services.json
  eleventyConfig.addFilter("findBySlug", (list, slug) => list.find((s) => s.slug === slug));

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
```

Create `src/src.json` (directory data file for the whole input folder; makes `page.date` the file's last-modified time, used by the sitemap):

```json
{ "date": "Last Modified" }
```

Create `src/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://eco-clean.nu/sitemap.xml
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npm test`
Expected: Eleventy prints `Copied 1 file` (or similar) and `Wrote 0 files`; node:test reports `# pass 1`, `# fail 0`.

- [ ] **Step 9: Commit**

```bash
git add .gitignore package.json package-lock.json eleventy.config.js src/src.json src/robots.txt tests/ docs/
git commit -m "chore: scaffold Eleventy project with robots.txt and test harness

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

(`docs/` includes the spec and this plan.)

---

### Task 2: Logo extraction, icons, OG image, partner placeholders

**Files:**
- Create: `scripts/extract-logo.mjs`, `scripts/make-images.mjs`
- Generated (committed): `src/assets/logo.png`, `src/assets/og-image.png`, `src/assets/favicon-32.png`, `src/assets/apple-touch-icon.png`, `src/assets/icon-192.png`, `src/assets/icon-512.png`, `src/assets/site.webmanifest`, `src/favicon.ico`, `src/assets/partners/team-trees.png`, `src/assets/partners/team-seas.png`, `src/assets/partners/novak-djokovic-foundation.png`
- Modify: `tests/seo.test.mjs`

**Interfaces:**
- Produces: the asset URLs used by every template: `/assets/logo.png` (121x62), `/assets/og-image.png` (1200x630), `/assets/favicon-32.png`, `/assets/apple-touch-icon.png` (180x180), `/assets/icon-192.png`, `/assets/icon-512.png`, `/assets/site.webmanifest`, `/favicon.ico`, `/assets/partners/<name>.png` (144x144).

- [ ] **Step 1: Add the failing asset tests**

Append to `tests/seo.test.mjs`:

```js
import { pngSize } from "./helpers.mjs";

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
```

(Merge the `import { pngSize }` into the existing import line from `./helpers.mjs`; keep one import statement per module.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL with `_site/assets/logo.png missing`.

- [ ] **Step 3: Write the one-off logo extraction script and run it**

Create `scripts/extract-logo.mjs`:

```js
// One-off: pulls the embedded base64 logo out of the original index.html.
// The second embedded PNG (footer) is the larger render, 121x62.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const matches = [...html.matchAll(/data:image\/png;base64,([A-Za-z0-9+/=]+)/g)];
if (matches.length < 2) throw new Error(`expected 2 embedded PNG logos, found ${matches.length}`);

mkdirSync("src/assets", { recursive: true });
writeFileSync("src/assets/logo.png", Buffer.from(matches[1][1], "base64"));
console.log("wrote src/assets/logo.png");
```

Run: `node scripts/extract-logo.mjs`
Expected: `wrote src/assets/logo.png`. Verify: `node -e "const b=require('fs').readFileSync('src/assets/logo.png');console.log(b.readUInt32BE(16),b.readUInt32BE(20))"` prints `121 62`.

- [ ] **Step 4: Write the image generation script**

Create `scripts/make-images.mjs`:

```js
// Renders the favicon set, the Open Graph share image, the web manifest and
// placeholder partner logos. Re-run with `npm run images` after changing colours
// or text. Partner placeholders are only written if the file does not exist,
// so real logos dropped into src/assets/partners/ are never overwritten.
import { Resvg } from "@resvg/resvg-js";
import pngToIco from "png-to-ico";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const GREEN = "#2d6a2d";
const BLUE = "#1a3a6b";
const ASSETS = "src/assets";
mkdirSync(`${ASSETS}/partners`, { recursive: true });

function renderPng(svg, width) {
  const r = new Resvg(svg, { fitTo: { mode: "width", value: width }, font: { loadSystemFonts: true } });
  return r.render().asPng();
}

// --- Icons: brand-green rounded square with the initials "EC" ---
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="22" fill="${GREEN}"/>
  <text x="50" y="66" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
        font-weight="700" font-size="44" fill="#ffffff">EC</text>
</svg>`;

const icons = {
  "favicon-32.png": 32,
  "apple-touch-icon.png": 180,
  "icon-192.png": 192,
  "icon-512.png": 512,
};
for (const [name, size] of Object.entries(icons)) {
  writeFileSync(`${ASSETS}/${name}`, renderPng(iconSvg, size));
  console.log(`wrote ${ASSETS}/${name}`);
}
writeFileSync("src/favicon.ico", await pngToIco([`${ASSETS}/favicon-32.png`]));
console.log("wrote src/favicon.ico");

// --- Open Graph image 1200x630: gradient with company name and tagline ---
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${GREEN}"/>
      <stop offset="1" stop-color="${BLUE}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <circle cx="1050" cy="120" r="260" fill="#ffffff" fill-opacity="0.06"/>
  <text x="80" y="250" font-family="Georgia, 'Times New Roman', serif" font-weight="700"
        font-size="88" fill="#ffffff">ECO CLEAN DK ApS</text>
  <text x="80" y="340" font-family="'Segoe UI', Arial, sans-serif" font-size="44"
        fill="#ffffff" fill-opacity="0.92">Erhvervsrengøring i København og omegn</text>
  <text x="80" y="420" font-family="'Segoe UI', Arial, sans-serif" font-size="30"
        fill="#ffffff" fill-opacity="0.8">Svanemærket &amp; EU Blomst · 20+ års erfaring · Tlf. 50 114 714</text>
</svg>`;
writeFileSync(`${ASSETS}/og-image.png`, renderPng(ogSvg, 1200));
console.log(`wrote ${ASSETS}/og-image.png`);

// --- Web manifest ---
const manifest = {
  name: "ECO CLEAN DK ApS",
  short_name: "ECO CLEAN",
  icons: [
    { src: "/assets/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/assets/icon-512.png", sizes: "512x512", type: "image/png" },
  ],
  theme_color: GREEN,
  background_color: "#ffffff",
  display: "browser",
};
writeFileSync(`${ASSETS}/site.webmanifest`, JSON.stringify(manifest, null, 2) + "\n");
console.log(`wrote ${ASSETS}/site.webmanifest`);

// --- Partner logo placeholders (neutral circle), only if missing ---
const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">
  <circle cx="72" cy="72" r="72" fill="#e8f5e8"/>
  <circle cx="72" cy="72" r="28" fill="#4a9a3f"/>
</svg>`;
for (const name of ["team-trees.png", "team-seas.png", "novak-djokovic-foundation.png"]) {
  const file = `${ASSETS}/partners/${name}`;
  if (existsSync(file)) { console.log(`kept ${file}`); continue; }
  writeFileSync(file, renderPng(placeholderSvg, 144));
  console.log(`wrote ${file} (placeholder)`);
}
```

- [ ] **Step 5: Run the script and inspect the rendered images**

Run: `npm run images`
Expected: one `wrote …` line per file, no errors.

Then open `src/assets/og-image.png` and `src/assets/icon-512.png` with the Read tool and confirm the text "ECO CLEAN DK ApS" and the initials "EC" are actually rendered (not blank). If the text is missing, system fonts were not found: replace `font-family="Georgia, 'Times New Roman', serif"` with `font-family="serif"` and `'Segoe UI', Arial, sans-serif` with `sans-serif`, re-run, re-check.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test`
Expected: `# pass 2`, `# fail 0`.

- [ ] **Step 7: Commit**

```bash
git add scripts/ src/assets/ src/favicon.ico tests/seo.test.mjs
git commit -m "feat: add logo, favicon set, OG image and partner placeholders

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Extract and deduplicate the CSS

**Files:**
- Create: `src/css/styles.css`
- Modify: `tests/seo.test.mjs`

**Interfaces:**
- Produces: `/css/styles.css` containing every rule from the three inline `<style>` blocks of `index.html` exactly once, plus new classes used by later tasks: `.page`, `.page-hero`, `.breadcrumb`, `.page-body`, `.page-cta`, `.related`, `.service-card .card-link`, `.footer-heading`, `.form-fallback`, `.areas-title`.

- [ ] **Step 1: Add the failing CSS test**

Append to `tests/seo.test.mjs`:

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL with `_site/css/styles.css missing`.

- [ ] **Step 3: Assemble styles.css from the three inline blocks**

The three `<style>` blocks in `index.html` are at lines 8–539 (main), 604–772 (Trustpilot strip) and 812–980 (customer strip). The mobile block `/* ===== MOBILE OPTIMERING - Android & Apple ===== */` through the end of `@media (max-width: 400px) { … }` is repeated in all three; it is kept only from the main block (lines 413–538). The Trustpilot-specific rules are lines 605–645 and the customer-strip rules are lines 813–853 (both end just before their copy of the mobile block).

Run (Git Bash):

```bash
mkdir -p src/css
{
  echo "/* ECO CLEAN DK – all site styles. Extracted from the original index.html; the mobile block appears once. */"
  sed -n '9,538p' index.html
  echo ""
  echo "  /* TRUSTPILOT STRIP */"
  sed -n '605,645p' index.html
  echo ""
  echo "  /* KUNDER STRIP */"
  sed -n '813,853p' index.html
} > src/css/styles.css
```

Verify the boundaries: `sed -n '1,3p;530,533p' src/css/styles.css` should show the header comment, `:root {` on line 2, and the `@media (max-width: 400px)` block near line 530; `grep -c "MOBILE OPTIMERING" src/css/styles.css` prints `1`; `tail -3 src/css/styles.css` ends with `.kunde-item span.kl { … }`.

- [ ] **Step 4: Rename the selectors that change with the heading normalisation**

In `src/css/styles.css` make exactly these replacements (use Edit; each string occurs once):

| Old | New |
| --- | --- |
| `.offer-step h4 {` | `.offer-step h3 {` |
| `.eco-card h4 {` | `.eco-card h3 {` |
| `.footer-col h5 {` | `.footer-col .footer-heading {` |

Leave `.why-text h4` unchanged (those headings stay h4 under an h3).

- [ ] **Step 5: Append the rules for the new subpage layout and small additions**

Append to `src/css/styles.css`:

```css

/* ===== SUBPAGES (ydelser, om os) ===== */
.page { padding-top: 72px; }
.page-hero {
  background: linear-gradient(135deg, #f0f7ee 0%, #e8eef8 100%);
  padding: 72px 5% 56px;
}
.page-hero-inner { max-width: 900px; margin: 0 auto; }
.page-hero h1 {
  font-family: 'Playfair Display', serif;
  font-size: clamp(2.2rem, 4vw, 3.2rem);
  line-height: 1.15; color: var(--blue);
  margin: 12px 0 16px;
}
.page-hero .lead {
  font-size: 1.1rem; line-height: 1.75; color: var(--gray);
  max-width: 640px; margin-bottom: 28px;
}
.breadcrumb ol {
  list-style: none; display: flex; flex-wrap: wrap; gap: 6px;
  font-size: 0.85rem; color: var(--gray); margin-bottom: 20px;
}
.breadcrumb li + li::before { content: "›"; margin-right: 6px; color: var(--gray); }
.breadcrumb a { color: var(--blue); text-decoration: none; font-weight: 500; }
.breadcrumb a:hover { color: var(--green); }
.page-body {
  max-width: 760px; margin: 0 auto; padding: 64px 5%;
  font-size: 1.02rem; line-height: 1.75; color: #333;
}
.page-body h2 {
  font-family: 'Playfair Display', serif; font-size: 1.6rem;
  color: var(--blue); margin: 40px 0 14px; line-height: 1.25;
}
.page-body h2:first-child { margin-top: 0; }
.page-body p { margin-bottom: 16px; }
.page-body ul, .page-body ol { margin: 0 0 20px 22px; }
.page-body li { margin-bottom: 8px; }
.page-body strong { color: var(--blue); }
.page-cta {
  background: linear-gradient(135deg, var(--green) 0%, var(--blue) 100%);
  color: white; text-align: center; padding: 64px 5%;
}
.page-cta h2 { font-family: 'Playfair Display', serif; font-size: 1.8rem; margin-bottom: 14px; }
.page-cta p { max-width: 600px; margin: 0 auto; line-height: 1.7; opacity: 0.92; }
.page-cta a { color: white; font-weight: 700; }
.related { padding: 64px 5%; background: var(--off-white); }
.related h2 {
  font-family: 'Playfair Display', serif; font-size: 1.6rem;
  color: var(--blue); margin-bottom: 20px; text-align: center;
}
.related ul { list-style: none; display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
.related a {
  display: inline-block; background: white; border: 1px solid rgba(0,0,0,0.08);
  border-radius: 10px; padding: 12px 20px; color: var(--blue);
  text-decoration: none; font-weight: 600; transition: all 0.2s;
}
.related a:hover { border-color: var(--green); color: var(--green); }
.service-card .card-link {
  display: inline-block; margin-top: 14px; color: var(--green);
  font-weight: 600; text-decoration: none; font-size: 0.9rem;
}
.service-card .card-link:hover { text-decoration: underline; }
.footer-heading { color: white; font-weight: 700; font-size: 0.92rem; margin-bottom: 16px; }
.form-fallback { font-size: 0.82rem; color: var(--gray); margin-top: 12px; text-align: center; }
.form-fallback a { color: var(--green); font-weight: 600; text-decoration: none; }
.areas-title {
  font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 700;
  color: var(--blue); margin-bottom: 6px;
}
.error-page { text-align: center; padding: 120px 5% 96px; }
.error-page h1 { font-family: 'Playfair Display', serif; font-size: 2.4rem; color: var(--blue); margin-bottom: 16px; }
.error-page p { color: var(--gray); margin-bottom: 28px; }
@media (max-width: 768px) {
  .page { padding-top: 60px; }
  .page-hero { padding: 48px 4% 40px; }
  .page-body { padding: 40px 4%; }
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test`
Expected: `# pass 3`, `# fail 0`.

- [ ] **Step 7: Commit**

```bash
git add src/css/styles.css tests/seo.test.mjs
git commit -m "feat: extract and deduplicate site CSS into styles.css

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Data files, base layout, partials and the 404 page

**Files:**
- Create: `src/_data/site.json`, `src/_data/services.json`, `src/_data/business.js`, `src/_data/build.js`, `src/_includes/base.njk`, `src/_includes/partials/nav.njk`, `src/_includes/partials/footer.njk`, `src/_includes/partials/jsonld-business.njk`, `src/404.njk`
- Modify: `tests/seo.test.mjs`

**Interfaces:**
- Consumes: `/css/styles.css`, asset URLs from Task 2, filters `findBySlug` from Task 1.
- Produces: layout `base.njk` expecting front matter `title` (string), `description` (string), optional `noindex` (boolean). Global data `site` (fields below), `services` (array), `business` (object), `build.year`. Every page rendered through `base.njk` gets the full SEO `<head>`, nav, footer and the menu script.

- [ ] **Step 1: Add the failing page-level tests**

Append to `tests/seo.test.mjs`:

```js
import { htmlPages, urlOf, load, jsonLd } from "./helpers.mjs";

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
```

(Merge the import into the existing `./helpers.mjs` import line.)

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL with `no HTML pages in _site`.

- [ ] **Step 3: Create site.json**

Create `src/_data/site.json`. Fields with empty strings are inputs still to be supplied by the client (see README in Task 10); templates handle them being empty.

```json
{
  "name": "ECO CLEAN DK",
  "legalName": "ECO CLEAN DK ApS",
  "url": "https://eco-clean.nu",
  "phoneDisplay": "50 114 714",
  "phoneTel": "50114714",
  "phoneIntl": "+4550114714",
  "email": "info@eco-clean.nu",
  "cvr": "45626865",
  "vatId": "DK45626865",
  "parentCompany": "Frank og Wolmer ApS",
  "priceRange": "Timepris fra 485 kr. ekskl. moms",
  "address": {
    "streetAddress": "",
    "postalCode": "",
    "addressLocality": "København",
    "addressCountry": "DK"
  },
  "openingHours": {
    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "opens": "08:00",
    "closes": "16:00",
    "note": "Assumed default until confirmed by the client"
  },
  "areaServed": ["København", "Frederiksberg", "Storkøbenhavn", "Nordsjælland", "Vestegnen", "Amager"],
  "areaServedLabel": "København og omegn",
  "trustpilotUrl": "",
  "formEndpoint": "",
  "googleSiteVerification": "",
  "ogImage": "/assets/og-image.png"
}
```

- [ ] **Step 4: Create services.json**

Create `src/_data/services.json`. Order and blurbs are exactly the current card order and text from `index.html` lines 1021–1076.

```json
[
  {
    "slug": "kontorrengoering",
    "name": "Kontorrengøring",
    "h1": "Kontorrengøring i København",
    "icon": "🏢",
    "hasPage": true,
    "blurb": "Grundig og diskret rengøring af kontorer, kontorhoteller og bureauer. Vi tilpasser os jeres behov og arbejdstider.",
    "related": ["restaurant-og-cafe", "trappevask-og-vinduespudsning", "rengoering-efter-haandvaerkere"]
  },
  {
    "slug": "restaurant-og-cafe",
    "name": "Restaurant & Café",
    "h1": "Restaurantrengøring i København",
    "icon": "🍽️",
    "hasPage": true,
    "blurb": "Professionel rengøring af restauranter og caféer med fokus på hygiejne og fødevaresikkerhed.",
    "related": ["kontorrengoering", "klinikrengoering", "trappevask-og-vinduespudsning"]
  },
  {
    "slug": "klinikrengoering",
    "name": "Klinikker",
    "h1": "Klinikrengøring i København",
    "icon": "🏥",
    "hasPage": true,
    "blurb": "Højt hygiejneniveau til klinikker og sundhedsfaciliteter, hvor renlighed er afgørende.",
    "related": ["kontorrengoering", "fitnesscenter-rengoering", "trappevask-og-vinduespudsning"]
  },
  {
    "slug": "fitnesscenter-rengoering",
    "name": "Fitnesscentre & Danselokaler",
    "h1": "Rengøring af fitnesscentre og danselokaler i København",
    "icon": "💪",
    "hasPage": true,
    "blurb": "Effektiv rengøring af træningsfaciliteter og danselokaler med fokus på desinfektion og frisk luft.",
    "related": ["klinikrengoering", "kontorrengoering", "trappevask-og-vinduespudsning"]
  },
  {
    "slug": "showroom",
    "name": "Showroom",
    "icon": "✨",
    "hasPage": false,
    "blurb": "Præsentabel og detaljefokuseret rengøring af showrooms og udstillingslokaler."
  },
  {
    "slug": "trappevask-og-vinduespudsning",
    "name": "Trappevask & Vinduespudsning",
    "h1": "Trappevask og vinduespudsning i København",
    "icon": "🪟",
    "hasPage": true,
    "blurb": "Grundig rengøring af trapper og professionel vinduespudsning for det perfekte udtryk.",
    "related": ["kontorrengoering", "flytterengoering", "rengoering-efter-haandvaerkere"]
  },
  {
    "slug": "flytterengoering",
    "name": "Ind- & Udflytningsrengøring",
    "h1": "Flytterengøring i København",
    "icon": "📦",
    "hasPage": true,
    "blurb": "Vi laver ind- og udflytningsrengøring for både private og erhverv. Grundig afleveringsrengøring og istandsættelse — så alt er klar til næste lejer eller køber.",
    "related": ["rengoering-efter-haandvaerkere", "doedsborengoering", "trappevask-og-vinduespudsning"]
  },
  {
    "slug": "rengoering-efter-haandvaerkere",
    "name": "Rengøring efter håndværkere",
    "h1": "Rengøring efter håndværkere i København",
    "icon": "🔨",
    "hasPage": true,
    "blurb": "Grundig oprydning og rengøring efter bygge- og renoveringsarbejde. Støv og snavs er vores speciale.",
    "related": ["flytterengoering", "kontorrengoering", "trappevask-og-vinduespudsning"]
  },
  {
    "slug": "busrengoering",
    "name": "Busrengøring",
    "icon": "🚌",
    "hasPage": false,
    "blurb": "Professionel ind- og udvendig rengøring af busser og større køretøjer."
  },
  {
    "slug": "social-rengoering",
    "name": "Social rengøring",
    "icon": "🤝",
    "hasPage": false,
    "blurb": "Vi samarbejder med kommuner, boligforeninger og institutioner om social rengøring — en indsats der udføres med nærvær, respekt og diskretion."
  },
  {
    "slug": "doedsborengoering",
    "name": "Dødsborengøring",
    "h1": "Dødsborengøring i København",
    "icon": "🕊️",
    "hasPage": true,
    "blurb": "En skånsom og respektfuld tømning og rengøring af bolig efter dødsfald. Vi håndterer opgaven med stor omhu og takt, så pårørende slipper for en svær byrde.",
    "related": ["flytterengoering", "rengoering-efter-haandvaerkere", "kontorrengoering"]
  }
]
```

- [ ] **Step 5: Create business.js and build.js**

Create `src/_data/business.js`:

```js
// LocalBusiness / CleaningService JSON-LD for the home page, built from site.json
// so the structured data can never disagree with the visible contact details.
import { readFileSync } from "node:fs";

const site = JSON.parse(readFileSync(new URL("./site.json", import.meta.url), "utf8"));

export default function () {
  const address = { "@type": "PostalAddress", addressLocality: site.address.addressLocality, addressCountry: site.address.addressCountry };
  if (site.address.streetAddress) address.streetAddress = site.address.streetAddress;
  if (site.address.postalCode) address.postalCode = site.address.postalCode;

  const business = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "CleaningService"],
    "@id": `${site.url}/#business`,
    name: site.legalName,
    alternateName: site.name,
    url: `${site.url}/`,
    logo: `${site.url}/assets/logo.png`,
    image: `${site.url}${site.ogImage}`,
    telephone: site.phoneIntl,
    email: site.email,
    vatID: site.vatId,
    priceRange: site.priceRange,
    address,
    areaServed: site.areaServed,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: site.openingHours.days,
        opens: site.openingHours.opens,
        closes: site.openingHours.closes,
      },
    ],
    parentOrganization: { "@type": "Organization", name: site.parentCompany },
  };
  if (site.trustpilotUrl) business.sameAs = [site.trustpilotUrl];
  return business;
}
```

Create `src/_data/build.js`:

```js
export default { year: new Date().getFullYear() };
```

- [ ] **Step 6: Create the nav partial**

Create `src/_includes/partials/nav.njk` (markup from `index.html` lines 544–567 with absolute links, the logo file, `/om-os/` and ARIA on the hamburger):

```njk
<nav>
  <a href="/" class="nav-logo" style="text-decoration:none; display:flex; align-items:center;">
    <img src="/assets/logo.png" alt="ECO CLEAN DK ApS" width="121" height="62" style="height:52px; width:auto;">
  </a>
  <ul class="nav-links">
    <li><a href="/#services">Ydelser</a></li>
    <li><a href="/om-os/">Om os</a></li>
    <li><a href="/#why">Hvorfor os</a></li>
    <li><a href="/#eco">Miljø</a></li>
    <li><a href="/#contact">Kontakt</a></li>
  </ul>
  <a href="tel:{{ site.phoneTel }}" class="nav-cta">📞 {{ site.phoneDisplay }}</a>
  <button class="hamburger" type="button" onclick="toggleMenu()" aria-label="Menu" aria-expanded="false" aria-controls="mobileMenu">
    <span></span><span></span><span></span>
  </button>
</nav>
<div class="mobile-menu" id="mobileMenu">
  <a href="/#services" onclick="closeMenu()">Ydelser</a>
  <a href="/om-os/" onclick="closeMenu()">Om os</a>
  <a href="/#why" onclick="closeMenu()">Hvorfor os</a>
  <a href="/#eco" onclick="closeMenu()">Miljø</a>
  <a href="/#contact" onclick="closeMenu()">Kontakt</a>
  <a href="tel:{{ site.phoneTel }}" style="color:var(--green); margin-top:8px;">📞 {{ site.phoneDisplay }}</a>
</div>
```

- [ ] **Step 7: Create the footer partial**

Create `src/_includes/partials/footer.njk` (from `index.html` lines 1851–1889; logo as file, `h5` headings as `<p class="footer-heading">`, Ydelser column generated from `services`, year from `build`):

```njk
<footer>
  <div class="footer-grid">
    <div class="footer-brand">
      <div style="margin-bottom:12px;">
        <img src="/assets/logo.png" alt="ECO CLEAN DK ApS" width="121" height="62" style="height:62px; width:auto; background:white; padding:8px 16px; border-radius:8px;">
      </div>
      <p>Miljø, kvalitet og langvarige samarbejd.<br>Erhvervsrengøring i København og omegn med over 20 års erfaring. En del af {{ site.parentCompany }}.</p>
    </div>
    <div class="footer-col">
      <p class="footer-heading">Ydelser</p>
      <ul>
        {%- for s in services %}
        <li><a href="{% if s.hasPage %}/ydelser/{{ s.slug }}/{% else %}/#services{% endif %}">{{ s.name }}</a></li>
        {%- endfor %}
      </ul>
    </div>
    <div class="footer-col">
      <p class="footer-heading">Information</p>
      <ul>
        <li><a href="/om-os/">Om os</a></li>
        <li><a href="/#eco">Miljøpolitik</a></li>
        <li><a href="/#omraader">Områder</a></li>
        <li><a href="/#contact">Kontakt</a></li>
        <li><a href="tel:{{ site.phoneTel }}">{{ site.phoneDisplay }}</a></li>
        <li><a href="mailto:{{ site.email }}">{{ site.email }}</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© {{ build.year }} {{ site.legalName }} · CVR: {{ site.cvr }} · En del af {{ site.parentCompany }}</span>
    <span>Erhvervsrengøring i København og omegn</span>
  </div>
</footer>
```

- [ ] **Step 8: Create the JSON-LD partial and the base layout**

Create `src/_includes/partials/jsonld-business.njk`:

```njk
{%- if page.url == "/" %}
<script type="application/ld+json">{{ business | dump | safe }}</script>
{%- endif %}
```

Create `src/_includes/base.njk`:

```njk
<!DOCTYPE html>
<html lang="da">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{ title }}</title>
<meta name="description" content="{{ description }}">
<link rel="canonical" href="{{ site.url }}{{ page.url }}">
{%- if noindex %}
<meta name="robots" content="noindex">
{%- endif %}
{%- if site.googleSiteVerification %}
<meta name="google-site-verification" content="{{ site.googleSiteVerification }}">
{%- endif %}
<meta property="og:type" content="website">
<meta property="og:site_name" content="{{ site.legalName }}">
<meta property="og:locale" content="da_DK">
<meta property="og:title" content="{{ title }}">
<meta property="og:description" content="{{ description }}">
<meta property="og:url" content="{{ site.url }}{{ page.url }}">
<meta property="og:image" content="{{ site.url }}{{ site.ogImage }}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ title }}">
<meta name="twitter:description" content="{{ description }}">
<meta name="twitter:image" content="{{ site.url }}{{ site.ogImage }}">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="manifest" href="/assets/site.webmanifest">
<meta name="theme-color" content="#2d6a2d">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/styles.css">
{% include "partials/jsonld-business.njk" %}
</head>
<body>

{% include "partials/nav.njk" %}

{{ content | safe }}

{% include "partials/footer.njk" %}

<script>
  // Fade-up on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

  function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    const open = menu.classList.toggle('open');
    document.querySelector('.hamburger').setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function closeMenu() {
    document.getElementById('mobileMenu').classList.remove('open');
    document.querySelector('.hamburger').setAttribute('aria-expanded', 'false');
  }
  // Close menu on outside click
  document.addEventListener('click', function(e) {
    const menu = document.getElementById('mobileMenu');
    const hamburger = document.querySelector('.hamburger');
    if (!menu.contains(e.target) && !hamburger.contains(e.target)) {
      closeMenu();
    }
  });
</script>
</body>
</html>
```

- [ ] **Step 9: Create the 404 page**

Create `src/404.njk`:

```njk
---
layout: base.njk
permalink: /404.html
eleventyExcludeFromCollections: true
noindex: true
title: Siden blev ikke fundet | ECO CLEAN DK
description: Siden blev ikke fundet. Gå tilbage til forsiden for ECO CLEAN DK ApS, erhvervsrengøring i København og omegn, eller ring til os på 50 114 714.
---
<main class="page">
  <section class="error-page">
    <span class="section-label">Fejl 404</span>
    <h1>Siden blev ikke fundet</h1>
    <p>Siden er flyttet eller findes ikke længere. Du kan gå til forsiden eller ringe til os direkte.</p>
    <div class="hero-buttons" style="justify-content:center;">
      <a href="/" class="btn-primary">Til forsiden</a>
      <a href="tel:{{ site.phoneTel }}" class="btn-secondary">Ring {{ site.phoneDisplay }}</a>
    </div>
  </section>
</main>
```

- [ ] **Step 10: Run the tests to verify they pass**

Run: `npm test`
Expected: Eleventy writes `_site/404.html`; all tests pass (`# fail 0`). If the heading test fails on the 404 page, check that no heading precedes the `<h1>` in nav (nav has none).

- [ ] **Step 11: Commit**

```bash
git add src/_data src/_includes src/404.njk tests/seo.test.mjs
git commit -m "feat: add base layout with SEO head, nav/footer partials, data files and 404 page

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Migrate the home page to index.njk

**Files:**
- Create: `src/index.njk`
- Modify: `tests/seo.test.mjs`
- Read-only source: `index.html` (line numbers below refer to it)

**Interfaces:**
- Consumes: `base.njk`, `services`, `site`, `build`.
- Produces: `/` with section ids `services`, `om-os`, `why`, `eco`, `contact`, `omraader` (used by nav, footer and breadcrumbs).

- [ ] **Step 1: Add the failing home page tests**

Append to `tests/seo.test.mjs`:

```js
const services = JSON.parse(readFileSync("src/_data/services.json", "utf8"));

test("/ home page: structure, links, JSON-LD and removed spam blocks", () => {
  const file = "_site/index.html";
  assert.ok(existsSync(file), "home page not built");
  const root = load(file);
  const html = readFileSync(file, "utf8");

  const business = jsonLd(root).find((ld) => typesOf(ld).includes("LocalBusiness"));
  assert.ok(business, "LocalBusiness JSON-LD missing");
  assert.ok(typesOf(business).includes("CleaningService"));
  assert.equal(business.telephone, "+4550114714");
  assert.equal(business.vatID, "DK45626865");
  assert.ok(!jsonLd(root).some((ld) => typesOf(ld).some((t) => /Rating|Review/.test(t))), "no rating markup allowed");

  assert.equal(root.querySelectorAll(".service-card").length, 11);
  const cardLinks = root.querySelectorAll(".service-card a.card-link").map((a) => a.getAttribute("href"));
  const expected = services.filter((s) => s.hasPage).map((s) => `/ydelser/${s.slug}/`);
  assert.deepEqual(cardLinks, expected);

  for (const id of ["services", "om-os", "why", "eco", "contact", "omraader"]) {
    assert.ok(root.querySelector(`#${id}`), `section #${id} missing`);
  }

  // Reviews strip untouched
  for (const quote of [
    "Altid punktlige og grundige. Vores kontor skinner efter hver rengøring!",
    "Brugt dem i 2 år. Miljøvenlige midler og super service hver gang.",
    "Utroligt dygtige — tager vores kliniks hygiejnekrav meget seriøst.",
    "Fleksible og pålidelige. De tilpasser sig altid vores skiftende behov.",
    "Vores fitnesscenter er altid rent og friskt. Gæsterne bemærker det!",
    "Professionel og venlig betjening. Vi anbefaler ECO CLEAN til alle!",
  ]) assert.ok(html.includes(quote), `review missing: ${quote}`);
  assert.ok(html.includes("4.8 ud af 5"));

  // Areas list kept, keyword blocks and link-list gone
  assert.ok(html.includes("Birkerød") && html.includes("Dragør"), "areas list missing");
  const anchorTexts = root.querySelectorAll("a").map((a) => a.text.trim());
  assert.ok(!anchorTexts.includes("Sønderborg") && !anchorTexts.includes("Running"), "old area link list still present");
  assert.ok(!anchorTexts.includes("Rengøringskontrakt"), "keyword link block still present");
  const contactAnchors = root.querySelectorAll('a[href="#contact"], a[href="/#contact"]').length;
  assert.ok(contactAnchors <= 12, `too many #contact anchors (${contactAnchors}); keyword links still present?`);

  // Contact form is a real form
  const form = root.querySelector("form.contact-form");
  assert.ok(form, "contact form missing");
  assert.equal(form.getAttribute("method")?.toLowerCase(), "post");
  assert.ok(form.getAttribute("action"), "form action missing");
  for (const name of ["navn", "virksomhed", "telefon", "ydelse", "besked"]) {
    assert.ok(form.querySelector(`[name="${name}"]`), `field ${name} missing`);
  }
  assert.ok(form.querySelector('button[type="submit"]'), "submit button");
  assert.ok(!html.includes("alert("), "old alert() handler still present");
  assert.ok(!html.includes("Eco-Clean.nu"), "email should be lower-case");

  // Assets
  assert.ok(root.querySelectorAll('img[src="/assets/logo.png"]').length >= 2, "logo in nav and footer");
  assert.equal(root.querySelectorAll('img[src^="/assets/partners/"]').length, 3, "three partner logos");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL with `home page not built`.

- [ ] **Step 3: Assemble index.njk from the original markup**

Run (Git Bash). This copies every kept block verbatim, skipping the three `<style>` blocks, the hidden keyword paragraph, the old form, the link-based area list and the keyword section:

```bash
{
  printf -- '---\nlayout: base.njk\ntitle: Erhvervsrengøring i København | ECO CLEAN DK ApS\ndescription: Erhvervsrengøring i København med over 20 års erfaring. Svanemærkede midler, fast kontaktperson og timepris fra 485 kr. Ring 50 114 714 for et tilbud.\n---\n'
  sed -n '569,594p' index.html            # HERO
  echo
  sed -n '596,603p;774,793p' index.html   # TRUSTPILOT strip (style block skipped)
  echo
  sed -n '794,809p' index.html            # ECO strip
  echo
  sed -n '810,811p;982,1012p' index.html  # KUNDER strip (style block skipped)
  echo
  echo '<!-- SERVICES (generated from services.json) -->'
  echo '@@SERVICES@@'
  echo
  sed -n '1079,1106p' index.html          # SKRÆDDERSYET TILBUD
  echo
  sed -n '1108,1151p' index.html          # VI HJÆLPER
  echo
  sed -n '1153,1214p' index.html          # VÆRDIER & KONCEPT
  echo
  sed -n '1216,1302p' index.html          # OM OS
  echo
  sed -n '1304,1365p' index.html          # WHY
  echo
  sed -n '1367,1433p' index.html          # ECO
  echo
  sed -n '1435,1459p' index.html          # VISION
  echo
  sed -n '1461,1517p;1520,1521p' index.html  # CTA (hidden keyword paragraph skipped)
  echo
  sed -n '1523,1581p' index.html          # CONTACT up to end of contact-info
  echo '@@FORM@@'
  sed -n '1620,1621p' index.html          # close contact-grid + section
  echo
  sed -n '1700,1783p' index.html          # AREAS (kept list)
} > src/index.njk
```

Verify: `grep -c '<style' src/index.njk` prints `0`; `grep -c 'Skjulte SEO' src/index.njk` prints `0`; `grep -c 'Sønderborg' src/index.njk` prints `0`; `grep -c 'SEO SØGEORD' src/index.njk` prints `0`; `grep -n '@@' src/index.njk` shows the two markers.

- [ ] **Step 4: Replace the services marker with the generated cards**

In `src/index.njk` replace the single line `@@SERVICES@@` with:

```njk
<section class="services" id="services">
  <div class="fade-up">
    <span class="section-label">Vores ydelser</span>
    <h2 class="section-title">Alt inden for erhvervsrengøring</h2>
    <p class="section-sub">Vi tilbyder professionel erhvervsrengøring til virksomheder i København og omegn. Det eneste private vi laver er ind- og udflytningsrengøring samt dødsborengøring.</p>
  </div>
  <div class="services-grid fade-up">
    {%- for s in services %}
    <div class="service-card">
      <div class="service-icon">{{ s.icon }}</div>
      <h3>{{ s.name }}</h3>
      <p>{{ s.blurb }}</p>
      {%- if s.hasPage %}
      <a class="card-link" href="/ydelser/{{ s.slug }}/">Læs mere om {{ s.name | lower }}</a>
      {%- endif %}
    </div>
    {%- endfor %}
  </div>
</section>
```

- [ ] **Step 5: Replace the form marker with a real form**

In `src/index.njk` replace the single line `@@FORM@@` with (the original `<div class="contact-form">` block at lines 1582–1619 becomes a `<form>` with the same class, names, labels and a working submit):

```njk
    {%- set formAction = site.formEndpoint or ("mailto:" + site.email) %}
    <form class="contact-form" method="POST" action="{{ formAction }}"{% if not site.formEndpoint %} enctype="text/plain"{% endif %}>
      <h3>Skriv til os</h3>
      <input type="hidden" name="_subject" value="Henvendelse fra eco-clean.nu">
      <div class="form-group">
        <label for="f-navn">Navn *</label>
        <input id="f-navn" name="navn" type="text" placeholder="Dit fulde navn" required autocomplete="name">
      </div>
      <div class="form-group">
        <label for="f-virksomhed">Virksomhed</label>
        <input id="f-virksomhed" name="virksomhed" type="text" placeholder="Firmanavn" autocomplete="organization">
      </div>
      <div class="form-group">
        <label for="f-telefon">Telefon *</label>
        <input id="f-telefon" name="telefon" type="tel" placeholder="Dit telefonnummer" required autocomplete="tel">
      </div>
      <div class="form-group">
        <label for="f-ydelse">Ydelse</label>
        <select id="f-ydelse" name="ydelse">
          <option value="">Vælg ydelse...</option>
          <option>Kontorrengøring</option>
          <option>Restaurant & Café</option>
          <option>Klinik</option>
          <option>Fitnesscenter / Danselokale</option>
          <option>Showroom</option>
          <option>Trappevask & Vinduespudsning</option>
          <option>Ind- & Udflytningsrengøring</option>
          <option>Rengøring efter håndværkere</option>
          <option>Busrengøring</option>
          <option>Social rengøring</option>
          <option>Dødsborengøring</option>
          <option>Andet</option>
        </select>
      </div>
      <div class="form-group">
        <label for="f-besked">Besked</label>
        <textarea id="f-besked" name="besked" placeholder="Fortæl os om jeres behov..."></textarea>
      </div>
      <button class="form-submit" type="submit">Send besked</button>
      <p class="form-fallback">Eller send en mail direkte til <a href="mailto:{{ site.email }}">{{ site.email }}</a></p>
    </form>
```

- [ ] **Step 6: Apply the heading, link, image and email edits**

All edits are in `src/index.njk`. Use Edit with the exact old strings; each `<h4` line below occurs once with that text.

Heading normalisation (h4 → h3 where the h4 sits directly under an h2). Change only the tag name (`<h4` → `<h3`, `</h4>` → `</h3>`) on the lines whose heading text is:

- Skræddersyet tilbud: `Vi lytter til jer`, `Vi tilpasser løsningen`, `Langvarigt samarbejde`
- Vi hjælper: `Boligselskaber & boligforeninger`, `Kontorer, kontorhoteller & caféer`, `Fitnesscentre & dansesale`, `Showrooms, bureauer & social rengøring`
- Værdier: `Selve rengøringen`, `Miljøvenlige midler & artikler`, `Personlig service & kommunikation`
- Om os: `Familieejet virksomhed`, `Engagerede & kompetente medarbejdere`, `Tre kerneværdier`
- Eco: `Svanemærket`, `EU Blomst`, `Ressourcebevidst`, `#TeamTrees 🌳`, `#TeamSeas 🌊`, `Novak Djokovic Foundation 🎓`, `FN's 17 Verdensmål`
- Vision: `🏆 For vores kunder`, `👷 For vores medarbejdere`, `🌿 For miljøet`
- CTA: `Vores tilbud inkluderer`, `Hvorfor vælge ECO CLEAN DK ApS?`

Do **not** change the h4s under `Derfor vælger vores kunder os:` (they sit under an h3) nor the h3s.

Quick check after editing: `grep -c '<h4' src/index.njk` prints `5` (only the five "Derfor vælger vores kunder os" items).

Partner images (Eco section): replace the three `src` values and add dimensions:

| Old | New |
| --- | --- |
| `src="/mnt/user-data/uploads/1000031956.png" alt="Team Trees"` | `src="/assets/partners/team-trees.png" alt="Team Trees" width="72" height="72" loading="lazy"` |
| `src="/mnt/user-data/uploads/1000031957.png" alt="Team Seas"` | `src="/assets/partners/team-seas.png" alt="Team Seas" width="72" height="72" loading="lazy"` |
| `src="/mnt/user-data/uploads/1000032084.jpg" alt="Novak Djokovic Foundation"` | `src="/assets/partners/novak-djokovic-foundation.png" alt="Novak Djokovic Foundation" width="72" height="72" loading="lazy"` |

Email (contact-info block): replace `<a href="mailto:info@Eco-Clean.nu" style="color:var(--green); text-decoration:none; font-weight:600">info@Eco-Clean.nu</a>` with `<a href="mailto:{{ site.email }}" style="color:var(--green); text-decoration:none; font-weight:600">{{ site.email }}</a>`.

Areas section (last block): on its `<section style="background:#f0f4f0; padding:48px 5%; border-top:1px solid rgba(0,0,0,0.06);">` opening tag add `id="omraader"` (`<section id="omraader" style="…">`), and replace the intro line `<p style="font-family:'Playfair Display',serif; font-size:1rem; font-weight:700; color:var(--blue); margin-bottom:6px;">Erhvervsrengøring i København og omegn</p>` with `<h2 class="areas-title">Erhvervsrengøring i København og omegn</h2>`.

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm test`
Expected: all tests pass. Typical failures and fixes:
- `heading level jumps from h2 to h4` → an h4 from the list in Step 6 was missed; find it with `grep -n '<h4' src/index.njk`.
- `img … missing width/height` → the Eco partner images; re-check Step 6.
- Nunjucks syntax error mentioning `{{` or `{%` → the copied markup contained template characters; escape them with `{% raw %}…{% endraw %}` around the offending line.

- [ ] **Step 8: Eyeball the page**

Run `npm run serve` in the background, open `http://localhost:8080/` with the Playwright MCP browser (`browser_navigate`), take a full-page screenshot (`browser_take_screenshot` with `fullPage: true`, filename `_verify/home-task5.png`), and Read the PNG. Confirm: hero, review strip, eco strip, customer strip, 11 service cards with "Læs mere" links on 8 of them, all sections down to the areas list and the footer with 11 Ydelser links. Stop the server afterwards.

- [ ] **Step 9: Commit**

```bash
git add src/index.njk tests/seo.test.mjs
git commit -m "feat: migrate home page to Eleventy with cleaned headings, real form and spam blocks removed

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Service page layout and the first service page

**Files:**
- Create: `src/_includes/service.njk`, `src/ydelser/ydelser.json`, `src/ydelser/kontorrengoering.md`
- Modify: `tests/seo.test.mjs`

**Interfaces:**
- Consumes: `base.njk`, `services`, `site`, filter `findBySlug`.
- Produces: layout `service.njk` expecting front matter `title`, `description`, `lead`; it looks the service up by `page.fileSlug` in `services.json`, so a service page's file name must equal its slug. Renders `<main class="page service-page">` with breadcrumb, `<h1>{{ service.h1 }}</h1>`, lead, `<article class="page-body">` (Markdown body), CTA, related links, and `Service` + `BreadcrumbList` JSON-LD.

- [ ] **Step 1: Add the failing service page tests**

Append to `tests/seo.test.mjs`:

```js
import { words } from "./helpers.mjs";

for (const s of services.filter((x) => x.hasPage)) {
  const file = `_site/ydelser/${s.slug}/index.html`;
  test(`/ydelser/${s.slug}/: service page content and structured data`, () => {
    assert.ok(existsSync(file), `${file} not built`);
    const root = load(file);
    assert.equal(root.querySelector("h1").text.trim(), s.h1);
    assert.ok(root.querySelector(".page-hero .lead")?.text.trim().length > 40, "lead paragraph");

    const main = root.querySelector("main");
    assert.ok(main, "main element");
    const count = words(main.text);
    assert.ok(count >= 300, `service page has only ${count} words, need 300+`);
    assert.ok(main.querySelectorAll(".page-body h2").length >= 3, "at least three h2 sections in the body");

    const crumbs = root.querySelectorAll(".breadcrumb li").map((li) => li.text.trim());
    assert.deepEqual(crumbs, ["Forside", "Ydelser", s.name]);

    const related = root.querySelectorAll(".related a").map((a) => a.getAttribute("href"));
    assert.deepEqual(related, s.related.map((slug) => `/ydelser/${slug}/`));
    assert.ok(root.querySelector('a[href="/"]'), "link back to the home page");

    const lds = jsonLd(root);
    const service = lds.find((ld) => typesOf(ld).includes("Service"));
    assert.ok(service, "Service JSON-LD");
    assert.equal(service.url, `${SITE_URL}/ydelser/${s.slug}/`);
    assert.equal(service.provider["@id"], `${SITE_URL}/#business`);
    const crumbLd = lds.find((ld) => typesOf(ld).includes("BreadcrumbList"));
    assert.equal(crumbLd?.itemListElement?.length, 3);
    assert.equal(crumbLd.itemListElement[2].name, s.name);
  });
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: eight failures `… not built` (one per service with `hasPage: true`).

- [ ] **Step 3: Create the directory data file and the layout**

Create `src/ydelser/ydelser.json`:

```json
{ "layout": "service.njk", "tags": ["service"] }
```

Create `src/_includes/service.njk`:

```njk
---
layout: base.njk
---
{%- set service = services | findBySlug(page.fileSlug) %}
<main class="page service-page">
  <header class="page-hero">
    <div class="page-hero-inner">
      <nav class="breadcrumb" aria-label="Brødkrumme">
        <ol>
          <li><a href="/">Forside</a></li>
          <li><a href="/#services">Ydelser</a></li>
          <li aria-current="page">{{ service.name }}</li>
        </ol>
      </nav>
      <span class="section-label">{{ service.icon }} Erhvervsrengøring – København og omegn</span>
      <h1>{{ service.h1 }}</h1>
      <p class="lead">{{ lead }}</p>
      <div class="hero-buttons">
        <a href="/#contact" class="btn-primary">Få et tilbud</a>
        <a href="tel:{{ site.phoneTel }}" class="btn-secondary">Ring {{ site.phoneDisplay }}</a>
      </div>
    </div>
  </header>

  <article class="page-body">
    {{ content | safe }}
  </article>

  <section class="page-cta">
    <h2>Skal vi tage en snak om {{ service.name | lower }}?</h2>
    <p>Ring til os på <a href="tel:{{ site.phoneTel }}">{{ site.phoneDisplay }}</a>, skriv til <a href="mailto:{{ site.email }}">{{ site.email }}</a> eller brug <a href="/#contact">kontaktformularen</a>. Vi svarer hurtigt, og et tilbud er altid uforpligtende.</p>
  </section>

  <section class="related">
    <h2>Andre ydelser</h2>
    <ul>
      {%- for slug in service.related %}
      {%- set r = services | findBySlug(slug) %}
      <li><a href="/ydelser/{{ r.slug }}/">{{ r.icon }} {{ r.name }}</a></li>
      {%- endfor %}
    </ul>
  </section>
</main>

{%- set serviceLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": service.h1,
  "serviceType": service.name,
  "description": description,
  "url": site.url + page.url,
  "provider": { "@type": "LocalBusiness", "@id": site.url + "/#business", "name": site.legalName },
  "areaServed": site.areaServedLabel
} %}
{%- set breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Forside", "item": site.url + "/" },
    { "@type": "ListItem", "position": 2, "name": "Ydelser", "item": site.url + "/#services" },
    { "@type": "ListItem", "position": 3, "name": service.name }
  ]
} %}
<script type="application/ld+json">{{ serviceLd | dump | safe }}</script>
<script type="application/ld+json">{{ breadcrumbLd | dump | safe }}</script>
```

- [ ] **Step 4: Create the first service page**

Create `src/ydelser/kontorrengoering.md`:

```md
---
title: Kontorrengøring i København | ECO CLEAN DK
description: Professionel kontorrengøring i København og omegn med Svanemærkede midler, fast kontaktperson og 20+ års erfaring. Få et uforpligtende tilbud i dag.
lead: Et rent kontor er en god start på arbejdsdagen. Vi sørger for, at jeres lokaler altid fremstår rene, indbydende og klar til medarbejdere og gæster, så I kan koncentrere jer om kerneopgaven.
---
## Kontorrengøring tilpasset jeres hverdag

Ingen kontorer er ens. Et lille bureau, et kontorhotel med mange lejere og et hovedkontor med mødelokaler og kantine har hver deres behov. Derfor starter vi altid med en uforpligtende gennemgang af jeres lokaler, hvor vi aftaler, hvad der skal gøres, hvor ofte og på hvilke tidspunkter. Rengøringen kan ligge før arbejdstid, efter lukketid eller i løbet af dagen, alt efter hvad der passer jer bedst.

I får en fast kontaktperson med direkte mobilnummer og mail, og det samme faste team møder ind hver gang. Det giver ro, kontinuitet og en rengøring, der bliver bedre for hver uge, fordi vi lærer jeres lokaler at kende.

## Hvad er inkluderet

- Støvsugning og gulvvask af kontorer, gange og fællesarealer
- Aftørring af skriveborde, reoler, vindueskarme og kontaktflader
- Rengøring af mødelokaler og receptionsområder
- Grundig rengøring af toiletter og badefaciliteter, inklusive opfyldning af sæbe og papir
- Rengøring af køkken og kantine, inklusive køleskab og mikroovn efter aftale
- Tømning af affald og sortering efter jeres retningslinjer
- Perioderengøring af vinduer, lamper, radiatorer og andre steder, der ikke kræver ugentlig indsats

## Derfor vælger virksomheder ECO CLEAN

- **Svanemærkede og EU Blomst-godkendte midler.** Vi bruger udelukkende miljømærkede produkter, som er skånsomme for både medarbejdere og miljø.
- **Over 20 års erfaring.** Vi har gjort rent for københavnske virksomheder med høje kvalitetskrav i mere end to årtier og ved, hvad der skal til.
- **Daglig synlighed og daglig kontrol.** Vi følger op på vores eget arbejde, så standarden holder, uden at I skal bruge tid på det.
- **Fleksibel aftale.** Fast ugentlig rengøring eller ekstra rengøring efter behov. I vælger selv, og vi tilpasser os, når jeres behov ændrer sig.

## Sådan kommer I i gang

1. **Vi lytter.** Ring eller skriv til os, og fortæl om jeres lokaler og ønsker. Vi kommer gerne forbi til en gratis gennemgang.
2. **Vi tilpasser løsningen.** Ud fra gennemgangen sammensætter vi ydelser, frekvens og tidspunkter, der passer til jeres hverdag og budget.
3. **Vi starter samarbejdet.** Ved et opstartsmøde aftaler vi de sidste detaljer, og herefter justerer vi løbende, så I altid får præcis det, I har brug for.

Timeprisen starter fra 485 kr. ekskl. moms, og et tilbud er altid uforpligtende.
```

- [ ] **Step 5: Run the tests**

Run: `npm test`
Expected: the `kontorrengoering` test passes; the other seven service tests still fail with `not built` (they are created in Task 7). All page-level tests for `/ydelser/kontorrengoering/` pass (title 42 chars, description 148 chars).

- [ ] **Step 6: Eyeball the page**

Run `npm run serve` in the background, open `http://localhost:8080/ydelser/kontorrengoering/` with the Playwright MCP browser, screenshot to `_verify/service-task6.png`, Read it. Confirm the breadcrumb, H1, lead, body sections, CTA band and "Andre ydelser" chips render with the site's fonts and colours. Stop the server.

- [ ] **Step 7: Commit**

```bash
git add src/_includes/service.njk src/ydelser tests/seo.test.mjs
git commit -m "feat: add service page layout and kontorrengoering page

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: The remaining seven service pages

**Files:**
- Create: `src/ydelser/restaurant-og-cafe.md`, `src/ydelser/klinikrengoering.md`, `src/ydelser/fitnesscenter-rengoering.md`, `src/ydelser/trappevask-og-vinduespudsning.md`, `src/ydelser/flytterengoering.md`, `src/ydelser/rengoering-efter-haandvaerkere.md`, `src/ydelser/doedsborengoering.md`

**Interfaces:**
- Consumes: `service.njk` (file name must equal the slug in `services.json`).
- Produces: the seven remaining `/ydelser/<slug>/` URLs.

The tests for these pages already exist (Task 6) and currently fail with `not built`.

- [ ] **Step 1: Create restaurant-og-cafe.md**

```md
---
title: Restaurantrengøring i København | ECO CLEAN DK
description: Rengøring af restauranter og caféer i København med fokus på hygiejne og fødevaresikkerhed. Miljøvenlige midler, fleksible tider og fast team.
lead: I en restaurant eller café skal der være rent både foran og bag disken. Vi leverer grundig rengøring med fokus på hygiejne og fødevaresikkerhed, tilpasset jeres åbningstider.
---
## Rengøring, der passer til jeres åbningstider

Restauranter og caféer har lange dage og korte pauser. Vi planlægger rengøringen, så den ligger efter lukketid eller tidligt om morgenen, før de første gæster kommer, og vi tilpasser os, når sæsonen, menuen eller åbningstiderne ændrer sig. Det faste team kender jeres lokaler og jeres rutiner og arbejder effektivt, uden at det går ud over grundigheden.

Hygiejne er ikke til forhandling i en fødevarevirksomhed. Vi arbejder med faste tjeklister for køkken, bar og gæsteområder, så intet bliver glemt, og så I altid kan dokumentere, hvad der er gjort.

## Hvad er inkluderet

- Gulvvask og rengøring af gæsteområde, borde, stole og bardisk
- Rengøring af køkkenoverflader, emhætter, stålborde og udstyr efter aftale
- Grundig rengøring af toiletter med opfyldning af sæbe og papir
- Rengøring af indgangsparti, vinduer og udeservering
- Affaldshåndtering og sortering efter kommunens regler
- Perioderengøring af køleskabe, ovne, lamper og andre steder, der kræver ekstra indsats

## Derfor vælger restauranter og caféer ECO CLEAN

- **Fokus på fødevaresikkerhed.** Vi ved, hvad et køkken kræver, og bruger midler og metoder, der er egnede til områder, hvor der håndteres fødevarer.
- **Svanemærkede og EU Blomst-godkendte midler.** Miljømærkede produkter, som er skånsomme for jeres medarbejdere, jeres gæster og miljøet.
- **Over 20 års erfaring.** Vi har gjort rent for københavnske spisesteder i mere end to årtier og kender branchens tempo og krav.
- **Personlig kontaktperson.** Én fast person med direkte mobilnummer, som I altid kan få fat på, hvis noget skal ændres.

## Sådan kommer I i gang

1. **Vi lytter.** Ring eller skriv, og fortæl om jeres sted, jeres åbningstider og jeres ønsker. Vi kommer gerne forbi til en gratis gennemgang.
2. **Vi tilpasser løsningen.** Vi sammensætter ydelser, frekvens og tidspunkter, så rengøringen passer til jeres drift og budget.
3. **Vi starter samarbejdet.** Efter et kort opstartsmøde går vi i gang, og vi justerer løbende, så standarden holder, også når I har travlt.

Timeprisen starter fra 485 kr. ekskl. moms, og et tilbud er altid uforpligtende.
```

- [ ] **Step 2: Create klinikrengoering.md**

```md
---
title: Klinikrengøring i København | ECO CLEAN DK
description: Klinikrengøring i København med højt hygiejneniveau til klinikker og sundhedsfaciliteter. Svanemærkede midler, faste rutiner og daglig kontrol.
lead: I en klinik er renlighed afgørende for både patienter og personale. Vi leverer rengøring med højt hygiejneniveau, faste rutiner og den diskretion, som sundhedsfaciliteter kræver.
---
## Rengøring med højt hygiejneniveau

Læge- og tandlægeklinikker, fysioterapeuter, kiropraktorer, laboratorier og andre sundhedsfaciliteter stiller særlige krav til rengøringen. Det handler ikke kun om, at lokalerne ser rene ud, men om at kontaktflader, behandlingsrum og venteværelser bliver rengjort systematisk og på samme måde hver gang.

Vi arbejder efter faste tjeklister, som vi udarbejder sammen med jer ud fra klinikkens egne hygiejnekrav. Rengøringen lægges uden for behandlingstiden, så den ikke forstyrrer patienter eller personale, og det samme faste team kommer hver gang.

## Hvad er inkluderet

- Rengøring og aftørring af behandlingsrum, kontaktflader, håndtag og armaturer
- Gulvvask af behandlingsrum, venteværelse, gange og personalerum
- Grundig rengøring af toiletter og håndvaske med opfyldning af sæbe og papir
- Rengøring af reception, venteværelse og legehjørne
- Affaldshåndtering efter klinikkens retningslinjer
- Perioderengøring af vinduer, lamper, ventilationsriste og inventar

## Derfor vælger klinikker ECO CLEAN

- **Faste rutiner og daglig kontrol.** Vi følger op på vores eget arbejde, så standarden holder, og så I kan dokumentere, hvad der er gjort.
- **Svanemærkede og EU Blomst-godkendte midler.** Miljømærkede produkter, der er skånsomme for patienter, personale og miljø.
- **Diskretion og stabilitet.** Et fast team, der kender klinikken, og en fast kontaktperson med direkte mobilnummer.
- **Over 20 års erfaring.** Vi har gjort rent for københavnske virksomheder med høje kvalitetskrav i mere end to årtier.

## Sådan kommer I i gang

1. **Vi lytter.** Ring eller skriv, og fortæl om klinikken, jeres hygiejnekrav og jeres åbningstider. Vi kommer gerne forbi til en gratis gennemgang.
2. **Vi tilpasser løsningen.** Vi udarbejder en rengøringsplan med ydelser, frekvens og tidspunkter, der passer til klinikkens drift.
3. **Vi starter samarbejdet.** Efter et kort opstartsmøde går vi i gang, og vi justerer planen løbende, hvis jeres behov ændrer sig.

Timeprisen starter fra 485 kr. ekskl. moms, og et tilbud er altid uforpligtende.
```

- [ ] **Step 3: Create fitnesscenter-rengoering.md**

```md
---
title: Fitnesscentre & danselokaler i København | ECO CLEAN DK
description: Rengøring af fitnesscentre og danselokaler i København med fokus på desinfektion, hygiejne og frisk luft. Miljøvenlige midler og fleksible tidspunkter.
lead: Der skal være plads til at svede, men ikke til at glide. Vi sørger for ren, hygiejnisk og sikker rengøring af trænings- og danselokaler, så jeres medlemmer mærker forskellen.
---
## Rengøring, jeres medlemmer lægger mærke til

Fitnesscentre, danseskoler og træningsfaciliteter bliver brugt hårdt, ofte fra tidlig morgen til sen aften. Sved, støv fra magnesium og mange mennesker på lidt plads stiller store krav til rengøringen. Vi lægger rengøringen på de tidspunkter, hvor der er færrest medlemmer, og tilpasser frekvensen efter, hvor meget lokalerne bliver brugt.

Vores team arbejder med faste tjeklister for træningsgulve, maskiner, omklædning og bad, så intet bliver sprunget over, og så jeres medlemmer altid møder et rent center.

## Hvad er inkluderet

- Rengøring og desinfektion af maskiner, håndvægte, måtter og kontaktflader
- Gulvvask af træningsgulve, dansesale og fællesarealer med midler, der ikke gør gulvet glat
- Grundig rengøring af omklædningsrum, brusere og toiletter med opfyldning af sæbe og papir
- Rengøring af spejle, vinduer og glaspartier
- Rengøring af reception, café- og loungeområde
- Affaldshåndtering og perioderengøring af ventilationsriste, lamper og inventar

## Derfor vælger fitnesscentre ECO CLEAN

- **Fokus på hygiejne og frisk luft.** Vi ved, hvor bakterier og lugt opstår i et træningscenter, og vi gør en ekstra indsats netop der.
- **Svanemærkede og EU Blomst-godkendte midler.** Miljømærkede produkter, der er skånsomme for medlemmer, personale og miljø.
- **Fleksible tidspunkter.** Tidlig morgen, sen aften eller midt på dagen. Vi tilpasser os jeres åbningstider og jeres travleste perioder.
- **Fast team og fast kontaktperson.** Det samme team kender jeres center, og én person med direkte mobilnummer har ansvaret for opgaven.

## Sådan kommer I i gang

1. **Vi lytter.** Ring eller skriv, og fortæl om jeres center, jeres åbningstider og jeres ønsker. Vi kommer gerne forbi til en gratis gennemgang.
2. **Vi tilpasser løsningen.** Vi sammensætter ydelser, frekvens og tidspunkter, så rengøringen passer til jeres drift og budget.
3. **Vi starter samarbejdet.** Efter et kort opstartsmøde går vi i gang, og vi justerer løbende, så standarden holder hele året.

Timeprisen starter fra 485 kr. ekskl. moms, og et tilbud er altid uforpligtende.
```

- [ ] **Step 4: Create trappevask-og-vinduespudsning.md**

```md
---
title: Trappevask & vinduespudsning i København | ECO CLEAN DK
description: Trappevask og vinduespudsning i København for ejendomme, boligforeninger og virksomheder. Fast aftale eller efter behov, med miljøvenlige midler.
lead: Trappeopgangen og vinduerne er det første, beboere, kunder og gæster ser. Vi holder dem rene med faste intervaller, så ejendommen altid fremstår præsentabel.
---
## Trappevask for ejendomme og boligforeninger

En ren trappeopgang gør en stor forskel for indtrykket af en ejendom. Vi tilbyder fast trappevask til boligselskaber, boligforeninger, ejendomsadministratorer og virksomheder i København og omegn, typisk ugentligt eller hver 14. dag, alt efter hvor mange der bruger opgangen.

Vi vasker trapper, reposer og gelændere, tørrer postkasser, dørhåndtag og vinduespartier af og fjerner spindelvæv og snavs i hjørner og kroge. Måtter bliver banket eller støvsuget, og indgangspartiet bliver holdt rent, så det ser ordentligt ud hver dag.

## Vinduespudsning inde og ude

Rene vinduer giver mere lys og et bedre indtryk, både i kontoret og i ejendommen. Vi pudser vinduer indvendigt og udvendigt med faste intervaller eller efter behov, og vi tager også glasdøre, glaspartier og spejle med. Vinduespudsning kan kombineres med trappevask eller med den almindelige erhvervsrengøring, så I kun har én leverandør at holde styr på.

## Hvad er inkluderet

- Vask af trapper, reposer, gelændere og indgangsparti
- Aftørring af postkasser, dørhåndtag, vindueskarme og lamper i opgangen
- Rengøring og udskiftning af måtter efter aftale
- Vinduespudsning indvendigt og udvendigt, inklusive rammer og karme
- Pudsning af glasdøre, glaspartier og spejle
- Perioderengøring af kælder, loft og fællesrum efter aftale

## Derfor vælger ejendomme ECO CLEAN

- **Fast aftale eller efter behov.** Vælg et fast interval, eller bestil, når der er brug for det. Vi tilpasser os.
- **Svanemærkede og EU Blomst-godkendte midler.** Miljømærkede produkter, der er skånsomme for beboere, medarbejdere og miljø.
- **Over 20 års erfaring.** Vi har holdt københavnske ejendomme og kontorer rene i mere end to årtier.
- **Fast kontaktperson.** Én person med direkte mobilnummer, som ejendomsadministrator eller bestyrelse altid kan få fat på.

## Sådan kommer I i gang

1. **Vi lytter.** Ring eller skriv, og fortæl om ejendommen eller virksomheden. Vi kommer gerne forbi til en gratis gennemgang.
2. **Vi tilpasser løsningen.** Vi aftaler interval, omfang og tidspunkter, der passer til ejendommen og budgettet.
3. **Vi starter samarbejdet.** Herefter kører aftalen fast, og vi justerer løbende, hvis behovet ændrer sig.

Timeprisen starter fra 485 kr. ekskl. moms, og et tilbud er altid uforpligtende.
```

- [ ] **Step 5: Create flytterengoering.md**

```md
---
title: Flytterengøring i København | ECO CLEAN DK
description: Flytterengøring i København for private og erhverv. Grundig ind- og udflytningsrengøring, så boligen eller lokalerne er klar til aflevering. Få et tilbud.
lead: Når I flytter, skal boligen eller lokalerne afleveres rene og klar til den næste. Vi laver grundig ind- og udflytningsrengøring for både private og erhverv, så I slipper for bekymringen.
---
## Udflytningsrengøring, der består synet

Ved fraflytning stiller udlejer eller boligforening ofte krav om, at boligen eller lokalerne afleveres i rengjort stand. Er rengøringen ikke i orden, bliver den trukket i depositummet, typisk til en højere pris. Vi laver udflytningsrengøring, som er grundig nok til at bestå flyttesynet, og vi ved, hvad udlejere og boligselskaber lægger vægt på ved synet.

Vi tilbyder også indflytningsrengøring, så jeres nye bolig eller nye lokaler er rene, før møblerne kommer ind, og afleveringsrengøring og istandsættelse for boligforeninger og ejendomsadministratorer, der skal have en lejlighed klar til næste lejer.

## Hvad er inkluderet

- Grundig rengøring af køkken, inklusive skabe indvendigt, emhætte, ovn, kogeplader og køleskab
- Afkalkning og rengøring af bad og toilet, inklusive fliser, fuger, armaturer og afløb
- Vask af gulve, paneler, fodlister, dørkarme og døre
- Aftørring af radiatorer, stikkontakter, lampeudtag og vindueskarme
- Vinduespudsning indvendigt, og udvendigt hvor det er muligt
- Rengøring af skabe, hylder og indbyggede møbler indvendigt og udvendigt

## Derfor vælger private og virksomheder ECO CLEAN

- **Grundighed, der kan ses.** Flytterengøring er detaljearbejde, og vores team arbejder efter en fast tjekliste, så intet bliver glemt.
- **Svanemærkede og EU Blomst-godkendte midler.** Miljømærkede produkter, der er skånsomme for den næste beboer og for miljøet.
- **Over 20 års erfaring.** Vi har lavet flytterengøring for private, boligforeninger og virksomheder i København i mere end to årtier.
- **Gratis gennemgang.** Vi kommer gerne forbi og ser boligen eller lokalerne, før vi giver et tilbud, så prisen passer til opgaven.

## Sådan kommer I i gang

1. **Vi lytter.** Ring eller skriv, og fortæl om boligen eller lokalerne, størrelsen og datoen for aflevering.
2. **Vi tilpasser løsningen.** Vi giver et tilbud ud fra størrelse og stand, og vi aftaler et tidspunkt, der passer til jeres flyttedag.
3. **Vi gør rent.** Vores team gør boligen eller lokalerne klar til aflevering, så I kan koncentrere jer om flytningen.

Timeprisen starter fra 485 kr. ekskl. moms, og et tilbud er altid uforpligtende.
```

- [ ] **Step 6: Create rengoering-efter-haandvaerkere.md**

(The description contains a colon, so it is quoted in YAML.)

```md
---
title: Rengøring efter håndværkere i København | ECO CLEAN DK
description: "Rengøring efter håndværkere i København: grundig byggerengøring efter renovering og nybyggeri, så lokalerne er klar til brug. Erfarent team, fair priser."
lead: Når håndværkerne er færdige, ligger der støv overalt. Vi laver grundig byggerengøring efter renovering, ombygning og nybyggeri, så lokalerne er klar til at blive taget i brug.
---
## Byggerengøring, der fjerner støvet helt

Byggestøv sætter sig alle steder: i skabe, på lamper, i ventilationsriste og i fugerne mellem fliserne. Almindelig rengøring er ikke nok. Vi arbejder i flere runder, hvor vi først fjerner det grove affald og støv, dernæst vasker alle overflader og til sidst gør lokalerne klar til brug, så I kan flytte ind eller åbne uden at støve rundt i ugevis.

Vi laver rengøring efter håndværkere for kontorer, butikker, restauranter, klinikker, boligforeninger og byggeprojekter i København og omegn, både efter mindre renoveringer og efter større ombygninger.

## Hvad er inkluderet

- Fjernelse af byggeaffald, emballage og groft snavs
- Støvsugning og afvaskning af gulve, vægge, lofter og paneler
- Rengøring af vinduer, karme og rammer indvendigt og udvendigt, inklusive fjernelse af klistermærker og malerstænk
- Aftørring af lamper, radiatorer, ventilationsriste, stikkontakter og kontakter
- Rengøring af køkken, bad og toiletter, inklusive skabe og skuffer indvendigt
- Afsluttende rengøring, så lokalerne er klar til indflytning eller åbning

## Derfor vælger bygherrer og virksomheder ECO CLEAN

- **Støv og snavs er vores speciale.** Vi ved, hvor byggestøvet gemmer sig, og vi bliver ved, indtil det er væk.
- **Svanemærkede og EU Blomst-godkendte midler.** Miljømærkede produkter, der er skånsomme for de mennesker, der skal bruge lokalerne.
- **Over 20 års erfaring.** Vi har gjort rent efter håndværkere for københavnske virksomheder og ejendomme i mere end to årtier.
- **Vi leverer til tiden.** Byggerengøring ligger ofte lige før en deadline. Vi møder op, når vi har aftalt det, og bliver, til opgaven er løst.

## Sådan kommer I i gang

1. **Vi lytter.** Ring eller skriv, og fortæl om projektet, lokalernes størrelse og hvornår håndværkerne er færdige.
2. **Vi tilpasser løsningen.** Vi kommer gerne forbi til en gratis gennemgang og giver et tilbud, der passer til opgavens omfang.
3. **Vi gør rent.** Vores team rykker ind, når håndværkerne rykker ud, og afleverer lokalerne klar til brug.

Timeprisen starter fra 485 kr. ekskl. moms, og et tilbud er altid uforpligtende.
```

- [ ] **Step 7: Create doedsborengoering.md**

```md
---
title: Dødsborengøring i København | ECO CLEAN DK
description: Skånsom og respektfuld dødsborengøring i København og omegn. Vi tømmer og rengør boligen med omhu og diskretion, så pårørende slipper for en svær opgave.
lead: At tømme og rengøre en bolig efter et dødsfald er en tung opgave midt i en svær tid. Vi håndterer den med omhu, respekt og diskretion, så I som pårørende kan bruge kræfterne på hinanden.
---
## Vi tager os af det praktiske

Når en bolig skal afleveres efter et dødsfald, er der ofte en frist fra udlejer eller boligforening, og der er mange ting at tage stilling til. Vi hjælper med at tømme boligen, sortere og bortskaffe indbo efter jeres anvisninger og gøre grundigt rent, så boligen kan afleveres eller sættes til salg.

Vi arbejder i jeres tempo og efter jeres ønsker. Personlige ejendele, papirer og genstande med affektionsværdi bliver sat til side og overdraget til jer, og intet bliver smidt ud uden aftale. I får én fast kontaktperson, som I kan ringe direkte til undervejs.

## Hvad er inkluderet

- Tømning af boligen, inklusive møbler, hårde hvidevarer og løsøre
- Sortering af indbo efter jeres anvisninger, og bortskaffelse eller aflevering til genbrug
- Grundig rengøring af alle rum, inklusive køkken, bad og toilet
- Vask af gulve, paneler, døre og vindueskarme, samt vinduespudsning indvendigt
- Rengøring af skabe, skuffer og hvidevarer indvendigt
- Afsluttende gennemgang, så boligen er klar til aflevering eller salg

## Derfor vælger pårørende ECO CLEAN

- **Respekt og diskretion.** Vi ved, at vi arbejder i et hjem med minder, og vi opfører os derefter.
- **Én kontaktperson.** I skal kun tale med én person, som kender opgaven og kan træffes på direkte mobilnummer.
- **Svanemærkede og EU Blomst-godkendte midler.** Miljømærkede produkter, der er skånsomme for de næste beboere og for miljøet.
- **Over 20 års erfaring.** Vi har hjulpet familier og boligforeninger i København i mere end to årtier.

## Sådan kommer I i gang

1. **Vi lytter.** Ring eller skriv, og fortæl om boligen og jeres situation. Vi kommer gerne forbi til en gratis gennemgang, hvor vi aftaler, hvad der skal ske.
2. **Vi tilpasser løsningen.** Vi giver et tilbud ud fra boligens størrelse og opgavens omfang, og vi aftaler en dato, der passer til jeres frist.
3. **Vi løser opgaven.** Vores team tømmer og rengør boligen, og I får besked, når den er klar til aflevering.

Et tilbud er altid uforpligtende, og I er velkomne til at ringe, hvis I bare har spørgsmål.
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npm test`
Expected: all eight service page tests pass; all page-level tests pass for the new pages. If a description length assertion fails, the character count printed in the message tells you which page; adjust wording to land between 120 and 160 characters (target 140–155) without dropping the service name or "København".

- [ ] **Step 9: Commit**

```bash
git add src/ydelser
git commit -m "feat: add the seven remaining service pages

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Generic page layout and the Om os page

**Files:**
- Create: `src/_includes/page.njk`, `src/om-os.md`
- Modify: `tests/seo.test.mjs`

**Interfaces:**
- Consumes: `base.njk`, `site`.
- Produces: layout `page.njk` expecting front matter `title`, `description`, `h1`, `lead`, optional `jsonld: organization`. Renders `<main class="page">` with a two-item breadcrumb, hero, body and CTA.

- [ ] **Step 1: Add the failing about page test**

Append to `tests/seo.test.mjs`:

```js
test("/om-os/: about page with Organization JSON-LD", () => {
  const file = "_site/om-os/index.html";
  assert.ok(existsSync(file), "about page not built");
  const root = load(file);
  assert.equal(root.querySelector("h1").text.trim(), "Om ECO CLEAN DK ApS");
  const count = words(root.querySelector("main").text);
  assert.ok(count >= 300, `about page has only ${count} words`);
  const org = jsonLd(root).find((ld) => typesOf(ld).includes("Organization") && ld.name === "ECO CLEAN DK ApS");
  assert.ok(org, "Organization JSON-LD missing");
  assert.equal(org.parentOrganization?.name, "Frank og Wolmer ApS");
  const crumbs = root.querySelectorAll(".breadcrumb li").map((li) => li.text.trim());
  assert.deepEqual(crumbs, ["Forside", "Om os"]);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL with `about page not built`.

- [ ] **Step 3: Create page.njk**

```njk
---
layout: base.njk
---
<main class="page">
  <header class="page-hero">
    <div class="page-hero-inner">
      <nav class="breadcrumb" aria-label="Brødkrumme">
        <ol>
          <li><a href="/">Forside</a></li>
          <li aria-current="page">{{ crumb or h1 }}</li>
        </ol>
      </nav>
      <h1>{{ h1 }}</h1>
      <p class="lead">{{ lead }}</p>
      <div class="hero-buttons">
        <a href="/#contact" class="btn-primary">Få et tilbud</a>
        <a href="tel:{{ site.phoneTel }}" class="btn-secondary">Ring {{ site.phoneDisplay }}</a>
      </div>
    </div>
  </header>

  <article class="page-body">
    {{ content | safe }}
  </article>

  <section class="page-cta">
    <h2>Skal vi tage en snak?</h2>
    <p>Ring til os på <a href="tel:{{ site.phoneTel }}">{{ site.phoneDisplay }}</a>, skriv til <a href="mailto:{{ site.email }}">{{ site.email }}</a> eller brug <a href="/#contact">kontaktformularen</a>. Vi svarer hurtigt, og et tilbud er altid uforpligtende.</p>
  </section>
</main>

{%- if jsonld == "organization" %}
{%- set orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": site.url + "/#organization",
  "name": site.legalName,
  "url": site.url + "/",
  "logo": site.url + "/assets/logo.png",
  "telephone": site.phoneIntl,
  "email": site.email,
  "vatID": site.vatId,
  "parentOrganization": { "@type": "Organization", "name": site.parentCompany }
} %}
<script type="application/ld+json">{{ orgLd | dump | safe }}</script>
{%- endif %}
```

- [ ] **Step 4: Create om-os.md**

```md
---
layout: page.njk
title: Om os | ECO CLEAN DK ApS
description: "Om ECO CLEAN DK ApS: familieejet rengøringsfirma i København med 20 års erfaring, Svanemærkede midler og personlig service. En del af Frank og Wolmer ApS."
h1: Om ECO CLEAN DK ApS
crumb: Om os
lead: Vi er et familieejet rengøringsfirma med base i København. Vi servicerer virksomheder i København og omegn med personlig service, høj kvalitet og omtanke for miljøet.
jsonld: organization
---
## Vi startede, fordi vi så et behov

Vi startede ECO CLEAN DK ApS, fordi vi så et behov for et rengøringsfirma, der kombinerer erfaring, pålidelighed og en personlig tilgang til hver kunde. Vores mission er at skabe kvalitetsrengøring og sunde miljøer, der gør en reel forskel for vores kunders hverdag. Virksomheden er en del af Frank og Wolmer ApS.

## Engagerede medarbejdere og personlig service

Vores team består af engagerede og kompetente medarbejdere, der hver dag møder ind med en positiv tilgang og et smil, og som har over 20 års erfaring i branchen. Vi sætter stabilitet og tillid i højsædet og har derfor altid stabile og dygtige medarbejdere, der yder deres bedste. Vi udvikler løbende vores medarbejdere, så de bliver ved med at være så dygtige, som de er, for vi stiller os ikke tilfredse med halvhjertet rengøring.

Alle kunder har en personlig kontaktperson, som har ansvar for deres opgave, og som altid kan træffes på direkte mobilnummer og mail. Vi sætter en ære i det gode samarbejde og starter det gerne med et personligt opstartsmøde med kaffe og kage.

## Kvalitet er vores kodeord

Vi arbejder ud fra én klar værdi: daglig rengøring, daglig synlighed og daglig kontrol. Selve rengøringen skal være grundig, konsekvent og detaljeorienteret, hver dag og uden kompromis. Vi er til stede og synlige, så I altid kan se og mærke vores arbejde, og vi følger op, så standarden holdes. Alt sammen til fornuftige priser, for professionel erhvervsrengøring behøver ikke koste en formue.

## Vi rengør med omtanke for miljøet

Vi bruger udelukkende Svanemærkede og EU Blomst-godkendte produkter, midler og materialer, som er sikre for både mennesker og natur, og vi arbejder aktivt på at reducere ressourceforbruget i alt, hvad vi gør. Vi støtter desuden #TeamTrees, #TeamSeas og Novak Djokovic Foundation og arbejder i overensstemmelse med FN's 17 verdensmål.

## Vores vision

Vores mål er at være det foretrukne rengøringsfirma i København og omegn, både for kunder og medarbejdere. For kunderne vil vi være det mest pålidelige og nærværende valg med fokus på kvalitet, fleksibilitet og langvarige samarbejder. For medarbejderne vil vi skabe en arbejdsplads med gode vilkår, stolthed i arbejdet og fælles vækst. Og for miljøet vil vi investere i teknologi og metoder, der gør rengøring endnu mere bæredygtig, uden at gå på kompromis med den personlige service, der kendetegner os.

## Fakta om virksomheden

- ECO CLEAN DK ApS, CVR-nummer 45626865
- En del af Frank og Wolmer ApS
- Familieejet, med base i København
- Over 20 års erfaring med erhvervsrengøring
- Telefon 50 114 714, e-mail info@eco-clean.nu
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`
Expected: `# fail 0`. (Title "Om os | ECO CLEAN DK ApS" is 24 characters; description is 154.)

- [ ] **Step 6: Commit**

```bash
git add src/_includes/page.njk src/om-os.md tests/seo.test.mjs
git commit -m "feat: add generic page layout and Om os page

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Sitemap, HTML validation and link check

**Files:**
- Create: `src/sitemap.njk`, `.htmlvalidate.json`
- Modify: `tests/seo.test.mjs`, possibly `src/index.njk` / layouts to fix validation findings

**Interfaces:**
- Consumes: `collections.all`, `page.url`, `page.date`, filter `isoDate`, `site.url`.
- Produces: `/sitemap.xml` listing every indexable page; `npm run check` passing.

- [ ] **Step 1: Add the failing sitemap test**

Append to `tests/seo.test.mjs`:

```js
test("sitemap.xml lists every indexable page once with an ISO lastmod", () => {
  const file = "_site/sitemap.xml";
  assert.ok(existsSync(file), "sitemap missing");
  const xml = readFileSync(file, "utf8");
  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  const expected = ["/", "/om-os/", ...services.filter((s) => s.hasPage).map((s) => `/ydelser/${s.slug}/`)].map((u) => SITE_URL + u);
  assert.deepEqual([...locs].sort(), [...expected].sort());
  assert.ok(!xml.includes("404"), "404 page must not be in the sitemap");
  const mods = [...xml.matchAll(/<lastmod>(.*?)<\/lastmod>/g)].map((m) => m[1]);
  assert.equal(mods.length, locs.length);
  for (const m of mods) assert.match(m, /^\d{4}-\d{2}-\d{2}$/);
  // every built page except 404 is in the sitemap
  for (const page of htmlPages()) {
    const url = urlOf(page);
    if (url === "/404.html") continue;
    assert.ok(locs.includes(SITE_URL + url), `${url} missing from sitemap`);
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL with `sitemap missing`.

- [ ] **Step 3: Create the sitemap template**

Create `src/sitemap.njk`:

```njk
---
permalink: /sitemap.xml
eleventyExcludeFromCollections: true
---
<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{%- for p in collections.all %}
  <url>
    <loc>{{ site.url }}{{ p.url }}</loc>
    <lastmod>{{ p.date | isoDate }}</lastmod>
  </url>
{%- endfor %}
</urlset>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: `# fail 0`. If `/404.html` appears in the sitemap, confirm `eleventyExcludeFromCollections: true` is in `src/404.njk`'s front matter.

- [ ] **Step 5: Configure html-validate**

Create `.htmlvalidate.json`. The `standard` preset checks HTML conformance only; the rules that matter for SEO and accessibility are enabled explicitly. Inline styles are allowed because the design relies on them.

```json
{
  "extends": ["html-validate:standard"],
  "rules": {
    "heading-level": "error",
    "no-dup-id": "error",
    "no-missing-references": "error",
    "element-required-attributes": "error",
    "wcag/h37": "error",
    "wcag/h32": "error",
    "long-title": ["error", { "maxlength": 60 }],
    "meta-refresh": "error",
    "no-inline-style": "off",
    "require-sri": "off"
  }
}
```

- [ ] **Step 6: Run the check script and fix findings**

Run: `npm run check`
Expected: html-validate prints nothing (or a summary with 0 errors) and linkinator prints nothing at `--verbosity error`, exit code 0.

Likely findings and their fixes (fix the source in `src/`, never the output):
- `element-permitted-content` for a `<div>` inside a `<p>` or a `<span>` wrapping block content: in `src/index.njk` change the outer `<p …>` to `<div …>` keeping the same inline style (no visual change).
- `no-dup-id` from the two-copy scrolling strips: those cards carry no ids, so this should not appear; if it does, remove the duplicated id from the second copy.
- `heading-level` on a page: an h4 under an h2 was missed in Task 5; change the tag.
- linkinator reports a broken `/assets/...` path: check the file name in `src/assets/` against the `src` attribute.
- linkinator reports `https://eco-clean.nu…` failures: the skip pattern in `package.json` must be `^https://eco-clean\\.nu` (double backslash inside JSON).

Re-run `npm run check` and `npm test` until both pass.

- [ ] **Step 7: Commit**

```bash
git add src/sitemap.njk .htmlvalidate.json tests/seo.test.mjs src/
git commit -m "feat: add sitemap, html-validate config and link check; fix validation findings

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Lighthouse, visual verification, README and cut-over

**Files:**
- Create: `README.md`
- Delete: `index.html`, `scripts/extract-logo.mjs`
- Output (gitignored): `_verify/`

**Interfaces:**
- Consumes: the complete `_site/` build.
- Produces: the deployable `_site/`, documented in `README.md`.

- [ ] **Step 1: Capture the Lighthouse baseline of the original page**

The original `index.html` is the baseline the spec measures against. Serve it from a scratch folder on port 8081 and the new build on port 8080:

```bash
mkdir -p _verify/original && cp index.html _verify/original/index.html
npm run build
```

Start two servers in the background (use the Bash tool's `run_in_background`):

```bash
npx http-server _verify/original -p 8081 -s
```

```bash
npx http-server _site -p 8080 -s
```

Run Lighthouse (Chrome is installed at `C:\Program Files\Google\Chrome\Application\chrome.exe`; if Lighthouse cannot find it, set `CHROME_PATH` to that path first):

```bash
npx lighthouse http://localhost:8081/ --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=_verify/lh-original.json --chrome-flags="--headless=new" --quiet
npx lighthouse http://localhost:8080/ --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=_verify/lh-home.json --chrome-flags="--headless=new" --quiet
npx lighthouse http://localhost:8080/ydelser/kontorrengoering/ --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=_verify/lh-service.json --chrome-flags="--headless=new" --quiet
```

Print the scores:

```bash
node -e '
for (const f of ["lh-original","lh-home","lh-service"]) {
  const r = JSON.parse(require("fs").readFileSync(`_verify/${f}.json`,"utf8")).categories;
  console.log(f.padEnd(12), Object.entries(r).map(([k,v]) => `${k}=${Math.round(v.score*100)}`).join("  "));
}'
```

Expected: `lh-home` and `lh-service` show `seo=100`, and their `performance` and `accessibility` scores are greater than or equal to `lh-original`. Record the three lines; they go into the final report.

If `seo` is below 100, open the JSON, find the failing audit under `audits` with `score: 0` in the SEO category, and fix its cause in `src/`.

If `performance` is more than 2 points below the original, the external stylesheet is the likely cause. Mitigation: inline it. Move `src/css/styles.css` to `src/_includes/css/styles.css`, replace `<link rel="stylesheet" href="/css/styles.css">` in `base.njk` with `<style>{% include "css/styles.css" %}</style>`, remove `addPassthroughCopy("src/css")` from the config, and change the two CSS tests to read `_site/index.html` and assert the same rules appear inside the `<style>` element. Rebuild and re-measure.

- [ ] **Step 2: Screenshot old and new at desktop and mobile widths**

With both servers still running, use the Playwright MCP browser (load the tools with ToolSearch `select:mcp__plugin_playwright_playwright__browser_navigate,mcp__plugin_playwright_playwright__browser_resize,mcp__plugin_playwright_playwright__browser_take_screenshot,mcp__plugin_playwright_playwright__browser_close`):

| Screenshot | URL | Viewport |
| --- | --- | --- |
| `_verify/original-desktop.png` | `http://localhost:8081/` | 1280×900 |
| `_verify/home-desktop.png` | `http://localhost:8080/` | 1280×900 |
| `_verify/original-mobile.png` | `http://localhost:8081/` | 375×812 |
| `_verify/home-mobile.png` | `http://localhost:8080/` | 375×812 |
| `_verify/service-desktop.png` | `http://localhost:8080/ydelser/kontorrengoering/` | 1280×900 |
| `_verify/service-mobile.png` | `http://localhost:8080/ydelser/kontorrengoering/` | 375×812 |

For each: `browser_resize` to the viewport, `browser_navigate` to the URL, `browser_take_screenshot` with `fullPage: true` and the filename. Then Read the PNGs and compare original vs new at each width: same hero, same section order, same colours and fonts, the three partner cards showing placeholder circles instead of broken images, the keyword block gone before the footer, the footer with the Ydelser links. Note any difference other than those intended and fix it in `src/` before continuing.

Stop both background servers when done.

- [ ] **Step 3: Write the README**

Create `README.md`:

```md
# eco-clean.nu

Website for ECO CLEAN DK ApS, built as a static site with [Eleventy](https://www.11ty.dev/).

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Install dependencies (Node 22 or newer) |
| `npm run build` | Build the site into `_site/` |
| `npm run serve` | Dev server with live reload at http://localhost:8080 |
| `npm test` | Build, then run the SEO invariant tests in `tests/` |
| `npm run check` | Build, validate the HTML and check every link |
| `npm run images` | Re-render icons, share image and partner placeholders |

## Deploy

Upload the **contents** of `_site/` to the web root of the host, replacing what is there.
All pages are folders with an `index.html`, so no server configuration is required.
`404.html` at the root is picked up by most static hosts automatically.

## Structure

- `src/index.njk` – home page
- `src/om-os.md` – about page
- `src/ydelser/*.md` – one file per service page; the file name is the URL slug
- `src/_data/site.json` – phone, e-mail, CVR, address, opening hours, form endpoint
- `src/_data/services.json` – the service list (cards, footer, service pages)
- `src/_includes/` – layouts and partials
- `src/css/styles.css` – all styles
- `src/assets/` – logo, icons, share image, partner logos

## Adding a service page

1. Add an entry to `src/_data/services.json` with `hasPage: true`, an `h1` and 2–3 `related` slugs.
2. Create `src/ydelser/<slug>.md` with front matter `title` (max 60 characters), `description` (120–160 characters) and `lead`, followed by the body in Markdown.
3. Run `npm test`. The sitemap, footer link and home page card are generated.

## Inputs still missing (placeholders in use)

- **Street address and postal code** → `src/_data/site.json`, `address`. Until set, the structured data carries only "København, DK".
- **Opening hours** → `site.json`, `openingHours`. Currently an assumed Mon–Fri 08:00–16:00.
- **Partner logos** → drop the real files in `src/assets/partners/` as `team-trees.png`, `team-seas.png`, `novak-djokovic-foundation.png` (square, at least 144×144). Placeholders are in place and are never overwritten by `npm run images`.
- **Trustpilot profile URL** → `site.json`, `trustpilotUrl` (used only for `sameAs`).
- **Contact form endpoint** → `site.json`, `formEndpoint`, e.g. a Formspree form URL. Until set, the form opens the visitor's mail client addressed to info@eco-clean.nu.
- **Google Search Console** → `site.json`, `googleSiteVerification`, if the meta-tag verification method is used.
- **Higher-resolution logo** (optional) → replace `src/assets/logo.png` and adapt `scripts/make-images.mjs` to use it for the icons and share image.

## Manual checks after deploy

1. Rich Results Test: https://search.google.com/test/rich-results with `https://eco-clean.nu/` and one service URL. Expect LocalBusiness and Breadcrumb items with no errors.
2. Submit `https://eco-clean.nu/sitemap.xml` in Google Search Console.
```

- [ ] **Step 4: Remove the original file and the one-off script**

The build now reproduces the home page; the migration is complete.

```bash
git rm index.html scripts/extract-logo.mjs
```

Run `npm test` and `npm run check` once more.
Expected: both pass (nothing depends on `index.html` any more).

- [ ] **Step 5: Final commit**

```bash
git add README.md
git commit -m "docs: add README; remove original index.html after cut-over to Eleventy build

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 6: Report**

Report to the user: the three Lighthouse score lines from Step 1, the screenshot comparison result, the `npm test` and `npm run check` results, the list of inputs still missing from the README, and the deploy instruction (upload the contents of `_site/`).

---

## Self-review notes

- **Spec coverage:** structure and build (Task 1), assets (Task 2), CSS (Task 3), head metadata, canonical, OG, favicon, preconnect, LocalBusiness JSON-LD, 404 (Task 4), home page changes including the three removed spam blocks, form, partner images, heading normalisation, areas H2 (Task 5), service layout, Service and BreadcrumbList JSON-LD, related links (Task 6), all eight service pages with 300+ words (Tasks 6–7), about page with Organization JSON-LD (Task 8), sitemap, robots, html-validate, link check (Tasks 1 and 9), Lighthouse, screenshots, README with missing inputs and Rich Results instructions, deployment (Task 10).
- **Names used across tasks:** filters `isoDate`, `findBySlug`; data `site.phoneTel`, `site.phoneDisplay`, `site.phoneIntl`, `site.email`, `site.legalName`, `site.url`, `site.ogImage`, `site.formEndpoint`, `site.areaServedLabel`, `site.parentCompany`, `site.cvr`, `site.vatId`; `services[].slug/name/h1/icon/blurb/hasPage/related`; `build.year`; helpers `htmlPages`, `urlOf`, `load`, `pngSize`, `jsonLd`, `typesOf`, `words`; classes `.page`, `.page-hero`, `.page-hero-inner`, `.breadcrumb`, `.page-body`, `.page-cta`, `.related`, `.card-link`, `.footer-heading`, `.form-fallback`, `.areas-title`, `.error-page`.
