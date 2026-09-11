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
