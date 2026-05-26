# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page static marketing site for **SUDZ DUDE**, a veteran-owned mobile auto detailing business serving Nassau County, Long Island (owner: Jeff Solomon, **(516) 351-5961**, detail@sudzdude.com). The site's only job is to convert a visitor into a quote request or a phone call/text.

Vanilla HTML + CSS + JS. **No build step, no framework, no package manager, no dependencies.** Deployable by dragging the directory onto Netlify, GitHub Pages, S3, etc.

## Run / preview

```bash
# Simplest: open the file directly
open index.html

# Local server (preferred — some browser features misbehave on file://)
python3 -m http.server 8000 --bind 127.0.0.1
open http://127.0.0.1:8000/

# Stop the server
lsof -ti:8000 | xargs kill
```

There are no tests, no linter, no formatter configured.

## Architecture

Three source files in the project root, plus an `images/` directory:

- `index.html` — Single-page semantic structure. Ten `<section>`s under one `<main>`, IDs match the in-page nav anchors (`#services`, `#process`, `#gallery`, `#about`, `#area`, `#quote`). All inline SVG icons live here (no icon library).
- `styles.css` — All styling. CSS custom properties at `:root` are the single source of truth for color/spacing/type. Mobile-first; breakpoints at 600px / 720px / 880px / 980px / 1080px. No preprocessor.
- `main.js` — One IIFE handling four things: footer year, mobile drawer toggle, header scroll-state, "Request this package" buttons preselecting the form dropdown (`data-package` attr → `#qf-package`), quote form submit → builds a `mailto:detail@sudzdude.com` URL and assigns it to `window.location.href`, and an `IntersectionObserver` that adds `.in-view` to `.reveal` elements.

### The design system (load-bearing context)

The token system in `styles.css` was **adapted from Hyer Aviation's design language** (luxury/monochromatic). Four reference files live in the root and **must not be edited as if they were source code** — they are extraction outputs:

- `DESIGN (1).md` — Hyer's full style guide (component specs for pill buttons, typography scale, do's/don'ts)
- `variables (1).css` and `theme (1).css` — Hyer's CSS custom properties
- `tokens (1).json` — Hyer's design tokens in DTCG-ish format

What carried over from Hyer **verbatim**: the typography scale (17/20/30/52/63/187), spacing scale (11/13/15/16/17/21/22/23/31/34/38/53/59/60/68/119), 1000px pill `--radius-full`, 45px `--radius-3xl`, button padding spec (15px top / 22px horizontal / 16px bottom), 68px section gaps.

What was **replaced**: the entire color palette. Hyer's restrained `--color-obsidian` / `--color-desert-sienna` was swapped for colors **sampled from the SUDZ DUDE logo** (`IMG_3705.jpeg`):

| Variable | Value | Role |
|---|---|---|
| `--color-midnight` | `#0A1424` | Primary dark surface (page bg) |
| `--color-midnight-elevated` | `#11203A` | Cards, footer |
| `--color-cyan-sudz` | `#5BFFE4` | **Primary accent / CTA fill** |
| `--color-pink-sudz` | `#FF1E7A` | Secondary accent, focal price tags |
| `--color-orange-sudz` | `#FF8533` | Tertiary — "Most Popular" badge, veteran star |
| `--color-canvas-white` / `--color-slate-mist` | unchanged from Hyer |

**When changing colors:** edit the `:root` block in `styles.css` only. Do not touch the four `(1)` reference files — they document the source aesthetic and stay frozen.

The hero `--text-display` deviates from Hyer's hard-coded `187px` and uses `clamp(56px, 11vw, 140px)` because system fonts (the actual rendered family — HelveticaNowDisplay is licensed and not included) don't carry typography that aggressive cleanly.

### Image handling

The `images/` directory contains 18 files, **12 of which are placed on the page**. Filenames are opaque (`FDBED73D-D6FB-...`, `cURF9NOy-IMG_0279.jpg`, `20251228_113759_3.jpg`) because they were scraped from the predecessor site `sersuds.myshopify.com`. The 6 unused files (`OIP_*.webp` ×2, `PetHair1.webp`, `IMG_2478.webp`, `mapsy-logo.png`, `water-drops-on-car-body-*.webp`) are leftover stock — keep them around in case sections expand.

The 12 images on the page and where:
- Hero bg: `Side_of_car_image_of_wix.jpg`
- Process rows (3): `AdobeStock_578337227.jpg`, `IMG_2476.jpg`, `IMG_9578.PNG`
- Gallery feature (before/after): `Trim_Restoration.jpg`
- Gallery 6-tile grid: `black-river-detail-car-wheels.jpg`, `IMG_2475.jpg`, `IMG_2479.jpg`, `FDBED73D-D6FB-4EF5-B8E6-2AAC676B428F.jpg`, `cURF9NOy-IMG_0279.jpg`, `IMG_2483.jpg`
- About: `20251228_113759_3.jpg`

Logo `IMG_3705.jpeg` lives in the project root (not `images/`) and is referenced as such from nav, mobile drawer, and footer.

### Quote form → Vercel function → Resend → detail@sudzdude.com

The quote form POSTs JSON to `/api/quote`, a Vercel serverless function (`api/quote.js`) that calls the Resend REST API to email the submission to `detail@sudzdude.com`. The `Reply-To` header is set to the customer's email so hitting Reply in the inbox responds to them directly.

**Required env var:** `RESEND_API_KEY` — set in Vercel project settings (Production / Preview / Development). The function returns 500 if it's missing.

**Sender:** `quotes@sudzdude.com` on the verified `sudzdude.com` domain in Resend. The mailbox does not need to exist — Resend only requires DKIM/SPF on the apex.

**Spam protection:** A hidden honeypot field (`name="website"`, hidden via `.hp-field` off-screen positioning, not `display:none` so bots target it) — server quietly returns 200 if filled, without sending. No CAPTCHA.

**Client-side behavior** (`main.js`):
- On success: form innerHTML is replaced with a `.form-success` panel (cyan check, personalized headline, Call/Text CTAs)
- On error: inline `.form-alert` appears above the submit button, button re-enables, error message comes from server
- During send: submit button shows "Sending…" and is disabled

There is **no local dev story** for the function — `python3 -m http.server` only serves static files. To run the function locally, use `npx vercel dev`. In practice, test on the Vercel preview URL after a push.

## Things that are intentionally placeholders

If asked to "wire up" any of these, ask before assuming — they're stubs by design:

- Social links — all `href="#"` (Instagram, Facebook, TikTok)
- Jeff's bio in the About section — explicit `[Full bio coming soon.]` paragraph
- Service prices ($399 / $1,399) — recommended starting points, may not be final
- Service area town list — 25 representative Nassau County towns, not authoritative

## Out of scope

- Booking calendar (Calendly/Square)
- Live service-area map
- Image format conversion (no WebP/AVIF pipeline — JPEGs ship as-is at source resolution)
- HelveticaNowDisplay font hosting (licensed, system fallback only)
