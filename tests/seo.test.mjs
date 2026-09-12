import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { OUT, SITE_URL, pngSize, htmlPages, urlOf, load, jsonLd, typesOf, words } from "./helpers.mjs";

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
    if (url === "/404.html" || url === "/tak/") assert.equal(robots, "noindex");
    else assert.equal(robots, undefined, "only the 404 and /tak/ pages may be noindex");
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

  test(`${url}: floating 'Få et tilbud' button links to the contact form`, () => {
    const root = load(file);
    const floats = root.querySelectorAll("a.cta-float");
    if (url === "/404.html" || url === "/tak/") {
      assert.equal(floats.length, 0, `${url} must not show the floating button`);
      return;
    }
    assert.equal(floats.length, 1, "exactly one floating button");
    assert.equal(floats[0].getAttribute("href"), url === "/" ? "#contact" : "/#contact");
    assert.equal(floats[0].text.trim(), "Få et tilbud");
  });
}

test("titles and meta descriptions are unique across all pages", () => {
  const pages = htmlPages();
  const titles = pages.map((f) => load(f).querySelector("title").text.trim());
  const descs = pages.map((f) => load(f).querySelector('meta[name="description"]').getAttribute("content").trim());
  assert.equal(new Set(titles).size, pages.length, `duplicate titles: ${titles.filter((t, i) => titles.indexOf(t) !== i).join(" | ")}`);
  assert.equal(new Set(descs).size, pages.length, `duplicate descriptions: ${descs.filter((d, i) => descs.indexOf(d) !== i).join(" | ")}`);
});

const services = JSON.parse(readFileSync("src/_data/services.json", "utf8"));

test("services.json is internally consistent", () => {
  const slugs = services.map((s) => s.slug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate slugs");
  for (const s of services) {
    assert.match(s.slug, /^[a-z0-9-]+$/, `slug ${s.slug} must be ASCII kebab-case`);
    assert.ok(s.name && s.icon && s.blurb, `${s.slug}: name, icon and blurb required`);
    if (s.hasPage) {
      assert.ok(s.h1, `${s.slug}: h1 required for pages`);
      assert.ok(existsSync(`src/ydelser/${s.slug}.md`), `${s.slug}: src/ydelser/${s.slug}.md missing`);
      assert.ok(Array.isArray(s.related) && s.related.length >= 2, `${s.slug}: at least two related slugs`);
      for (const r of s.related) {
        const target = services.find((x) => x.slug === r);
        assert.ok(target?.hasPage, `${s.slug}: related slug ${r} must point at a service with a page`);
      }
    } else {
      assert.ok(!existsSync(`src/ydelser/${s.slug}.md`), `${s.slug}: hasPage is false but a page file exists`);
    }
  }
});

test("/ home page: structure, links, JSON-LD and removed spam blocks", () => {
  const file = "_site/index.html";
  assert.ok(existsSync(file), "home page not built");
  const root = load(file);
  const html = readFileSync(file, "utf8");

  const business = jsonLd(root).find((ld) => typesOf(ld).includes("LocalBusiness"));
  assert.ok(business, "LocalBusiness JSON-LD missing");
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
  const sections = root.querySelectorAll("section");
  const offerIdx = sections.findIndex((s) => s.classList.contains("custom-offer"));
  const contactIdx = sections.findIndex((s) => s.getAttribute("id") === "contact");
  assert.ok(offerIdx >= 0, "custom-offer section missing");
  assert.equal(contactIdx, offerIdx + 1, "contact section must come directly after the custom-offer section");

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
  assert.equal(form.getAttribute("action"), "/send.php", "form must post to the PHP mailer");
  assert.equal(form.getAttribute("enctype"), undefined, "no text/plain enctype on a real POST");
  assert.ok(form.querySelector('input[type="hidden"][name="_subject"]'), "_subject hidden field");
  const honey = form.querySelector('input[name="website"]');
  assert.ok(honey, "honeypot field missing");
  assert.equal(honey.getAttribute("tabindex"), "-1");
  assert.equal(honey.getAttribute("autocomplete"), "off");
  assert.equal(honey.closest("[aria-hidden='true']") != null, true, "honeypot must be aria-hidden");
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

for (const s of services.filter((x) => x.hasPage)) {
  const file = `_site/ydelser/${s.slug}/index.html`;
  test(`/ydelser/${s.slug}/: service page content and structured data`, () => {
    assert.ok(existsSync(file), `${file} not built`);
    const root = load(file);
    assert.equal(root.querySelector("h1").text.trim(), s.h1);
    assert.ok(root.querySelector(".page-hero .lead")?.text.trim().length > 40, "lead paragraph");

    const main = root.querySelector("main");
    assert.ok(main, "main element");
    const count = words(root.querySelector(".page-hero .lead").text) + words(root.querySelector(".page-body").text);
    assert.ok(count >= 300, `service page has only ${count} words of own copy (lead + body), need 300+`);
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

test("/om-os/: about page with Organization JSON-LD", () => {
  const file = "_site/om-os/index.html";
  assert.ok(existsSync(file), "about page not built");
  const root = load(file);
  assert.equal(root.querySelector("h1").text.trim(), "Om ECO CLEAN DK ApS");
  const count = words(root.querySelector(".page-hero .lead").text) + words(root.querySelector(".page-body").text);
  assert.ok(count >= 300, `about page has only ${count} words`);
  const org = jsonLd(root).find((ld) => typesOf(ld).includes("Organization") && ld.name === "ECO CLEAN DK ApS");
  assert.ok(org, "Organization JSON-LD missing");
  assert.equal(org.parentOrganization?.name, "Frank og Wolmer ApS");
  const crumbs = root.querySelectorAll(".breadcrumb li").map((li) => li.text.trim());
  assert.deepEqual(crumbs, ["Forside", "Om os"]);
});

test("sitemap.xml lists every indexable page once with an ISO lastmod", () => {
  const file = "_site/sitemap.xml";
  assert.ok(existsSync(file), "sitemap missing");
  const xml = readFileSync(file, "utf8");
  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  const expected = ["/", "/om-os/", ...services.filter((s) => s.hasPage).map((s) => `/ydelser/${s.slug}/`)].map((u) => SITE_URL + u);
  assert.deepEqual([...locs].sort(), [...expected].sort());
  assert.ok(!xml.includes("404"), "404 page must not be in the sitemap");
  assert.ok(!xml.includes("/tak/"), "thank-you page must not be in the sitemap");
  const mods = [...xml.matchAll(/<lastmod>(.*?)<\/lastmod>/g)].map((m) => m[1]);
  assert.equal(mods.length, locs.length);
  for (const m of mods) assert.match(m, /^\d{4}-\d{2}-\d{2}$/);
  // every built page except 404 is in the sitemap
  for (const page of htmlPages()) {
    const url = urlOf(page);
    if (url === "/404.html" || url === "/tak/") continue;
    assert.ok(locs.includes(SITE_URL + url), `${url} missing from sitemap`);
  }
});

test("send.php: PHP mailer is built with the site email and a honeypot check", () => {
  const file = "_site/send.php";
  assert.ok(existsSync(file), "send.php not built");
  const php = readFileSync(file, "utf8");
  assert.ok(php.startsWith("<?php"), "must start with <?php");
  assert.ok(php.includes("'info@eco-clean.nu'"), "recipient from site.json");
  assert.ok(/\bmail\(/.test(php), "calls mail()");
  assert.ok(php.includes("$_POST['website']"), "checks the honeypot field");
  assert.ok(php.includes("'/tak/'"), "redirects to /tak/ on success");
  assert.ok(!php.includes("{{") && !php.includes("{%"), "unrendered nunjucks in PHP");
  assert.ok(!php.includes("\r"), "PHP must use LF line endings");
});

test("/tak/: thank-you page is built, noindex and links back", () => {
  const file = "_site/tak/index.html";
  assert.ok(existsSync(file), "thank-you page not built");
  const root = load(file);
  assert.equal(root.querySelector("h1").text.trim(), "Tak for din henvendelse");
  assert.equal(root.querySelector('meta[name="robots"]')?.getAttribute("content"), "noindex");
  assert.ok(root.querySelector('a[href="/"]'), "link back to the front page");
  assert.equal(root.querySelectorAll("a.cta-float").length, 0, "no floating CTA on the thank-you page");
});

test("preview build (SITE_PREVIEW=1) falls back to mailto because GitHub Pages cannot run PHP", () => {
  const out = "_verify/preview-form";
  execSync(`npx @11ty/eleventy --quiet --output=${out} --pathprefix=/eco-clean-site/`, {
    env: { ...process.env, SITE_PREVIEW: "1" },
    stdio: "pipe",
  });
  const root = load(`${out}/index.html`);
  const form = root.querySelector("form.contact-form");
  assert.equal(form.getAttribute("action"), "mailto:info@eco-clean.nu");
  assert.equal(form.getAttribute("enctype"), "text/plain");
  assert.ok(!form.querySelector('input[name="website"]'), "no honeypot on the mailto fallback");
});
