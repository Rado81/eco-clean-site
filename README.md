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

## Preview on GitHub Pages

Every push to the `seo-multipage` branch runs `.github/workflows/pages.yml`, which runs
`npm test`, builds with `--pathprefix=/eco-clean-site/` and `SITE_PREVIEW=1`, and publishes
to <https://rado81.github.io/eco-clean-site/>. The preview build adds `noindex` to every page
so search engines ignore the copy; canonical URLs still point at eco-clean.nu.

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
