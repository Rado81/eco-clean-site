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
