# ECO CLEAN DK – SEO and multi-page site design

Date: 2026-09-11
Status: approved in chat, awaiting written-spec review
Site: https://eco-clean.nu (ECO CLEAN DK ApS, erhvervsrengøring i København)

## 1. Goal

Turn the current single-file landing page (`index.html`, ~1,900 lines, all CSS
and JS inline) into a small static site where each main service has its own
indexable URL, with complete on-page SEO, structured data, sitemap and robots,
and without the spam-like keyword block that exists today.

Success criteria:

- Thirteen crawlable pages (home, about, eleven service pages), each with a unique
  title, meta description, canonical URL, one H1 and 300–500 words of Danish copy.
- Lighthouse SEO score 100 on home and on one service page; performance and
  accessibility not below the current page.
- Valid JSON-LD (LocalBusiness, Service, BreadcrumbList,
  Organization) that passes Google's Rich Results Test.
- No broken links or asset paths in the built output.
- Visual design of the home page unchanged apart from the changes listed in section 6.

Out of scope: area landing pages, analytics, a form backend beyond a placeholder
endpoint, new photography, changes to the reviews section.

## 2. Decisions already made

| Topic | Decision |
| --- | --- |
| Structure | Multi-page site; home page kept as the landing page |
| Hosting | Static file host, files uploaded manually; no server rewrites available |
| Pages | Home, Om os, eleven service pages (showroom, bus and social rengøring added 2026-09-11 after reviewing the built home page). No area pages. |
| Reviews | The Trustpilot section stays exactly as it is; no rating markup |
| Copy | Claude drafts the Danish text, Kristian/Rado review |
| Tooling | Eleventy (11ty) static site generator, Node-based |

## 3. Project structure

```
Kristians webside v2/
├── package.json              @11ty/eleventy plus dev dependencies for checks
│                             (html-validate, linkinator, node-html-parser,
│                             lighthouse, http-server, @resvg/resvg-js, png-to-ico)
├── eleventy.config.js        input src/, output _site/, passthrough copy for
│                             css/, assets/, robots.txt, favicon.ico; filters
├── .htmlvalidate.json        html-validate rules for the built output
├── scripts/
│   └── make-images.mjs       renders icons, OG image and partner placeholders
├── tests/
│   ├── helpers.mjs           shared helpers (walk _site, parse HTML, PNG size, JSON-LD)
│   └── seo.test.mjs          node:test suite asserting SEO invariants on _site/
├── src/
│   ├── src.json              directory data for all pages: date = Last Modified
│   ├── _includes/
│   │   ├── base.njk          <html>, <head> with all SEO meta, scripts
│   │   ├── service.njk       service page layout; chains to base.njk
│   │   ├── page.njk          generic content page layout (Om os); chains to base.njk
│   │   └── partials/
│   │       ├── nav.njk       nav + mobile menu
│   │       ├── footer.njk    footer, Ydelser column driven by services.json
│   │       └── jsonld-business.njk  LocalBusiness JSON-LD, home page only
│   ├── _data/
│   │   ├── site.json         name, url, phone, email, CVR, address, opening
│   │   │                     hours, priceRange, form endpoint, verification
│   │   ├── services.json     one entry per service (see section 4)
│   │   ├── business.js       builds the LocalBusiness JSON-LD object from site.json
│   │   └── build.js          build-time values (current year for the footer)
│   ├── css/styles.css        all current CSS, deduplicated, one copy, plus
│   │                         rules for the new subpage layout
│   ├── favicon.ico           served from the site root
│   ├── assets/
│   │   ├── logo.png          extracted from the current base64 data (121x62)
│   │   ├── og-image.png      1200x630 branded share image
│   │   ├── favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png,
│   │   │   site.webmanifest
│   │   └── partners/         team-trees.png, team-seas.png,
│   │                         novak-djokovic-foundation.png
│   ├── index.njk             home page
│   ├── om-os.md              about page
│   ├── ydelser/
│   │   ├── ydelser.json      directory data: layout service.njk, tag service
│   │   └── *.md              one Markdown file per service
│   ├── sitemap.njk           generated from the page collection
│   ├── 404.njk               permalink /404.html, noindex
│   └── robots.txt
├── README.md                 how to build, serve, check and upload; list of
│                             inputs still missing
├── docs/superpowers/specs/   this document
└── _site/                    build output; uploaded to the host as-is; never
                              edited by hand
```

Conventions:

- Nunjucks for layouts, the home page and the sitemap (they need loops and
  conditionals). Markdown with YAML front matter for content pages.
- `npm run build` runs Eleventy. `npm run serve` runs the dev server with live
  reload. `npm run check` runs html-validate and the link checker over `_site/`.
- The original `index.html` is kept until the build reproduces it, then removed.

## 4. Pages and URLs

| URL | Page | Source file |
| --- | --- | --- |
| `/` | Forside | `src/index.njk` |
| `/om-os/` | Om os | `src/om-os.md` |
| `/ydelser/kontorrengoering/` | Kontorrengøring | `src/ydelser/kontorrengoering.md` |
| `/ydelser/restaurant-og-cafe/` | Restaurant & café | `src/ydelser/restaurant-og-cafe.md` |
| `/ydelser/klinikrengoering/` | Klinikker | `src/ydelser/klinikrengoering.md` |
| `/ydelser/fitnesscenter-rengoering/` | Fitnesscentre & danselokaler | `src/ydelser/fitnesscenter-rengoering.md` |
| `/ydelser/trappevask-og-vinduespudsning/` | Trappevask & vinduespudsning | `src/ydelser/trappevask-og-vinduespudsning.md` |
| `/ydelser/flytterengoering/` | Ind- & udflytningsrengøring | `src/ydelser/flytterengoering.md` |
| `/ydelser/rengoering-efter-haandvaerkere/` | Rengøring efter håndværkere | `src/ydelser/rengoering-efter-haandvaerkere.md` |
| `/ydelser/doedsborengoering/` | Dødsborengøring | `src/ydelser/doedsborengoering.md` |

Rules:

- Slugs are ASCII (ø to oe, å to aa, æ to ae). Every page is a folder with
  `index.html` so URLs work without server configuration and end in a
  trailing slash.
- Showroom, busrengøring and social rengøring also have pages (/ydelser/showroom/, /ydelser/busrengoering/, /ydelser/social-rengoering/), added after the first review of the built site so every card links somewhere.
- `services.json` entries: `slug`, `name` (card and footer label), `h1` (page
  heading), `icon` (emoji as today), `blurb` (card text), `hasPage` (boolean),
  `related` (list of slugs). It drives the home page cards, the footer
  "Ydelser" column, the service page heading and the related-services block.
  The SEO title, meta description and lead paragraph live in each page's
  front matter. Adding a service = one JSON entry + one Markdown file.

## 5. On-page SEO

Applied by `base.njk` from front matter and `site.json`:

- **Title**: `{Service} i København | ECO CLEAN DK`, at most 60 characters.
  Home: `Erhvervsrengøring i København | ECO CLEAN DK ApS`. About:
  `Om os | ECO CLEAN DK ApS`.
- **Meta description**: unique per page, target 140–155 characters (the
  automated test enforces hard limits of 120–160), naming the service,
  København and one differentiator (Svanemærket, 20 års erfaring).
- **Canonical**: absolute, `site.url + page.url`.
- **Open Graph / Twitter**: `og:type` website, `og:title`, `og:description`,
  `og:url`, `og:site_name`, `og:locale` `da_DK`, `og:image` (shared
  1200x630 image), `twitter:card` `summary_large_image`.
- **Headings**: exactly one H1 per page containing the page's primary term.
  Sections use H2, cards under a section use H3. The current home page's
  mixed H3/H4 usage is normalised to this rule; visual styling is preserved
  via classes.
- **Internal links**: home service cards link to service pages ("Læs mere");
  footer Ydelser column links to service pages; each service page links to
  2–3 related services and home; breadcrumb `Forside › Ydelser › {Service}`
  on every service page.
- **Language**: `lang="da"` everywhere. No hreflang.
- **Images**: every `<img>` has `alt`, `width` and `height`; non-hero images
  use `loading="lazy"`.

## 6. Home page changes

The home page keeps its current design and copy except:

1. **Keyword and hidden-text blocks removed.** Three blocks are deleted: the
   "SEO søgeord" section (about 50 keyword links to `#contact`), the hidden
   keyword paragraph inside the CTA section (styled `font-size:0;
   color:transparent`, which Google treats as hidden text), and the older
   "SEO bynavne" section that lists about 65 place names as links to
   `#contact`. The line "Vi udfører erhvervsrengøring, kontorrengøring,
   restaurantrengøring og flytterengøring i alle ovenstående områder." stays
   under the areas list.
2. **Areas list kept**: the second "SEO bynavne" section, plain text chips
   grouped by region, is kept unchanged apart from its intro line becoming an
   H2 and the section getting `id="omraader"`.
3. **Service cards link out** to their pages where `hasPage` is true.
4. **Reviews section untouched**, including the Trustpilot name and the 4.8
   rating. No rating markup is added.
5. **Logo** served from `assets/logo.png` (referenced in nav and footer)
   instead of two inline base64 copies.
6. **Partner logos** referenced from `assets/partners/`. The three source files
   are not in the project; Rado/Kristian supply them. Until then the build uses
   a neutral placeholder image so nothing 404s, and the missing files are
   listed in the README.
7. **CSS deduplicated** into `css/styles.css`. The three `<style>` blocks and
   the duplicated mobile block become one file.
8. **Inline styles** on sections are moved to classes only where needed to
   make the heading normalisation possible; no visual change intended.

## 7. Structured data (JSON-LD)

Rendered by `base.njk` from `site.json`, so values cannot drift from the page:

- **Home**: `@type: "LocalBusiness"` (schema.org has no CleaningService type) with `name`,
  `url`, `logo`, `image`, `telephone` (+45 50 11 47 14), `email`, `vatID`
  (DK45626865), `address` (PostalAddress; street address to be supplied by
  Rado/Kristian, it is not on the current page), `areaServed` (København and
  the regions listed on the page), `openingHoursSpecification`, `priceRange`,
  `parentOrganization` (Frank og Wolmer ApS), `sameAs` (Trustpilot profile URL
  if one exists, otherwise omitted).
- **Service pages**: `Service` with `name`, `serviceType`, `description`,
  `provider` (`@id` of the LocalBusiness), `areaServed`, `url`; plus a
  `BreadcrumbList` with three items.
- **About**: `Organization` with `name`, `url`, `logo`, `foundingDate` if
  known, `parentOrganization`.
- **No** `AggregateRating` or `Review` markup anywhere.

## 8. Technical additions

- `robots.txt`: `User-agent: *`, `Allow: /`, `Sitemap: https://eco-clean.nu/sitemap.xml`.
- `sitemap.xml`: generated from the page collection; `lastmod` from the source
  file's modification date; excludes 404.
- Favicon set: `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`
  (180 px), `icon-192.png`, `icon-512.png`, `site.webmanifest`. The only logo
  in the project is a 121x62 PNG, too small to cut icons from, so the icons
  are rendered by `scripts/make-images.mjs` from an SVG in the brand green
  with the initials "EC". The OG image is rendered the same way with the
  company name and tagline as text. If a vector or high-resolution logo is
  supplied later, the script is the one place to swap it in.
- Fonts: `<link rel="preconnect">` to `fonts.googleapis.com` and
  `fonts.gstatic.com` (crossorigin); existing font stylesheet kept with
  `display=swap`.
- Contact form: `method="POST"` with `action` taken from `site.formEndpoint`
  (placeholder value until a service such as Formspree is chosen); `name`
  attributes on all fields; a `mailto:info@eco-clean.nu` link next to the
  submit button as fallback. Existing HTML5 validation attributes kept.
- `404.html` at the root of `_site/`, styled with the site layout, with
  `noindex` and excluded from the sitemap.
- Search Console verification: optional `site.googleSiteVerification` value
  rendered as a meta tag when present. No analytics script.

## 9. Content plan

Each service page, 300–500 words of Danish, drafted by Claude from the current
site text and reviewed by Kristian/Rado:

1. H1: `{Service} i København`.
2. Lead paragraph: who the service is for and the core promise.
3. H2 "Hvad er inkluderet": bulleted list of concrete tasks.
4. H2 "Derfor vælger virksomheder ECO CLEAN": three short points reusing the
   site's existing claims (Svanemærket/EU Blomst midler, 20+ års erfaring,
   fast team, fleksible tider).
5. H2 "Sådan kommer du i gang": the three-step tilbud flow from the home page.
6. CTA block (phone + link to the contact form on the home page) and the
   related-services list.

Prices appear only where the current site already states them (timepris fra
485 kr. eks. moms). No claims are added that the current site does not make.

The about page reuses the existing "Om os", "Hvorfor os" and "Miljø" copy,
expanded to a full page with the same H1/H2 rules.

## 10. Verification

- `npm run build` succeeds with zero warnings.
- `npm test`: a node:test suite over `_site/` asserts the SEO invariants on
  every page (lang, single title within 60 characters, description within
  120–160 characters, absolute canonical, Open Graph tags, exactly one H1,
  no heading-level jumps, alt/width/height on every image, no hidden text,
  parseable JSON-LD with the expected types, sitemap coverage, asset
  dimensions).
- `npm run check`: html-validate over `_site/` passes; the link checker reports
  no broken internal links or asset paths.
- Lighthouse (via the Playwright browser against `npm run serve`) on `/` and
  `/ydelser/kontorrengoering/`: SEO 100; performance and accessibility not
  below the current single page.
- Google Rich Results Test on the built home page and one service page: no
  errors.
- Visual check of `/` and one service page at desktop width and 375 px mobile
  width against the current design.

## 11. Inputs needed from Rado/Kristian

- Street address and postal code for the LocalBusiness markup.
- Opening hours (default if none: Mon–Fri 08:00–16:00, marked as assumption).
- The three partner logo files.
- Trustpilot profile URL, if one exists (for `sameAs` only).
- Choice of form endpoint (or confirmation that mailto fallback is enough for now).
- Optional: the logo as SVG or a PNG of at least 512 px, for sharper icons
  and share image.

## 12. Deployment

Upload the contents of `_site/` to the web root of the host, replacing the
current `index.html`. No redirects are needed: the home URL is unchanged and all
new URLs are additions.
