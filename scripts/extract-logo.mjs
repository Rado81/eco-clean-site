// One-off: pulls the embedded base64 logo out of the original index.html.
// The second embedded PNG (footer) is the larger render, 121x62.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const matches = [...html.matchAll(/data:image\/png;base64,([A-Za-z0-9+/=]+)/g)];
if (matches.length < 2) throw new Error(`expected 2 embedded PNG logos, found ${matches.length}`);

mkdirSync("src/assets", { recursive: true });
writeFileSync("src/assets/logo.png", Buffer.from(matches[1][1], "base64"));
console.log("wrote src/assets/logo.png");
