# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See `.claude/PONYTAIL.md` for this repo's required engineering style (lazy/minimal-diff approach) — read it before making non-trivial changes.

## What this is

Static marketing site + blog for Greenrise Energy Solutions (solar EPC company), deployed to GitHub Pages at `https://greenriseenergy.com`. No build tooling beyond Jekyll — no npm/webpack, no JS framework, no backend in this repo.

## Business

Greenrise Energy Solutions is a solar EPC (engineering, procurement, construction) company with these business lines:

- **Residential rooftop solar** — 3kW and up.
- **MSME / industrial rooftop solar** — rooftop systems for small/medium industries.
- **BESS (Battery Energy Storage Systems)**.
- **CSR-funded installs** — solar systems for orphanages, funded via corporate CSR budgets.
- **Retail distribution** — distributing/reselling for other solar companies.
- **Large-scale / utility installations with PPA** — investor-funded large installations where the investor sells power to industrial buyers under a Power Purchase Agreement.
- **PPA facilitation** — brokering PPAs between power buyers and sellers (not always the EPC on these deals).
- Uses home-grown internal tools to optimize workflows (not part of this repo).

The homepage services grid reflects this business line-up. The "Capabilities" section (`#capabilities`, formerly "Projects") and "What You Can Expect" section (`#testimonials`) deliberately avoid specific project case studies, client names, or usage/savings stats — none exist yet, so the copy sticks to process/standards claims rather than fabricating numbers. Replace with real case studies, testimonials, and stats once there's verifiable data to publish.

## Commands

```bash
bundle install && bundle exec jekyll serve   # run locally (http://localhost:4000)
bundle exec jekyll build                     # production build -> ./_site
```

No test suite, linter, or package.json in this repo — there is nothing to run beyond the Jekyll build.

## Deployment

- Pushing to `main` triggers `.github/workflows/jekyll-build-deploy.yml`, which runs `bundle exec jekyll build` and deploys `_site/` to GitHub Pages. GitHub repo Settings → Pages must have Source set to "GitHub Actions" (not "Deploy from a branch").
- Custom domain is pinned via the `CNAME` file.

## Architecture

- **Homepage** (`index.html`) carries empty Jekyll front matter (`---\n---`) solely so Jekyll will process its `{% include %}` tags — it is otherwise hand-written static HTML, not a Jekyll layout/template. **Campaign landing page** (`campaign/index.html`) has no front matter and is genuinely static — Liquid is not used in it. `campaign/index.html` is a standalone lead-capture page (own `<style>`/`<script>`, not wired into the shared header/footer or `css/style.css`/`js/script.js`).
- **Blog** uses real Jekyll: posts live in `_posts/*.md` with YAML front matter (`title`, `excerpt`, `date`, `categories`, `tags`), rendered through `_layouts/single.html` at the permalink pattern `/blog/:year/:month/:day/:title/` (set in `_config.yml`).
- `blog/index.html` is a Jekyll page (`layout: null`, `permalink: /blog/`) that loops `site.posts` server-side at build time, then paginates client-side with inline JS (10 posts/page, show/hide via `display:none`) — **not** `jekyll-paginate-v2`. (The README describes a different pagination plugin setup than what's actually implemented; don't trust it over this file.)
- `_config.yml` uses `remote_theme: mmistakes/minimal-mistakes`, but the theme's own layouts aren't used — `_layouts/single.html` and `blog/index.html` fully override markup with custom HTML/CSS matching the main site's design system. Treat the Minimal Mistakes theme as present but effectively unused for layout purposes.
- Shared site chrome lives in `_includes/header.html` and `_includes/footer.html`, pulled in via `{% include header.html %}` / `{% include footer.html %}` from `index.html`, `_layouts/single.html`, and `blog/index.html` — edit the include once, not all three. `header.html` takes an optional `active="blog"` param to highlight the Blog nav link (passed by `_layouts/single.html` and `blog/index.html`, omitted on the homepage).
- `css/style.css` is a single global stylesheet driven by CSS custom properties defined in `:root` (`--color-*`, `--font-size-*`, `--spacing-*`). Match this token system rather than hardcoding colors/sizes in new styles.
- `js/script.js` holds shared homepage behavior (mobile menu toggle, scroll animations, contact form handling, etc.).
- The homepage contact form (`#contact-form` in `index.html`) posts leads to the same `https://app.greenriseenergy.com/api/leads` endpoint the campaign page uses, via `initContactForm` in `js/script.js` — same `fetch`/Turnstile/`visitor_id` pattern as `campaign/index.html`, tagged `source: 'website_contact'` to distinguish these leads from campaign ones. It sends `email` and `message` fields that aren't proven to exist in the campaign page's known payload shape (that page never collects them) — if the API starts rejecting or silently dropping them, that's the signal those field names need fixing, not a guess to repeat. On success the form is swapped for a static `#contact-form-success` panel; `campaign/index.html` itself is untouched.
- **`/shop`** (`shop/index.html`) is an EPC trade catalogue, deliberately unlinked from nav/footer, `noindex` and `sitemap: false` until launch. Products live in `_data/shop.yml` (looped by Liquid; placeholder photos in `images/shop/`, swap files in place). Prices are "on request": each card has a WhatsApp link plus "Add to quote", which fills the quote form. That form reuses `#contact-form` ids so `initContactForm` handles it unchanged, with hidden `project-type` = `EPC Shop Order`.
- The campaign page posts leads via `fetch` to an external API (`https://app.greenriseenergy.com/api/leads`, outside this repo) and is protected by Cloudflare Turnstile (`cf-turnstile-response` sent in the JSON payload; a `403` response means verification failed and resets the widget).
- `_posts/` is the Jekyll blog archive (Markdown). `blog/` and `campaign/` directories each hold exactly one hand-maintained HTML file. `_config.yml`/`Gemfile`/`.github/workflows/` control the Jekyll build and GitHub Pages deploy.
