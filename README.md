# DevOps Course Docs — دورنوشت‌های دوره DevOps

Documentation site for the DevOps course. Static site generated with [Hugo](https://gohugo.io/) + [Relearn theme](https://mcshelby.github.io/hugo-theme-relearn/), deployed to GitHub Pages via GitHub Actions.

- Persian (RTL, [Vazirmatn](https://github.com/rastikerdar/vazirmatn) font)
- Markdown chapters, dark/light mode, search
- Portable: the same repo deploys to **any** GitHub account/repo — `baseURL` is computed at build time

## Local development

```bash
hugo server -D
# http://localhost:1313/
```

Requires Hugo **extended ≥ 0.141** (pinned CI version: 0.165.0). Clone with `--recurse-submodules` (theme lives in `themes/hugo-theme-relearn`).

## Adding a chapter — افزودن فصل جدید

```
content.fa/chapters/03-my-chapter/
├── _index.md        # chapter intro page
├── 01-first-lesson.md
└── 02-second-lesson.md
```

`content.fa/chapters/03-my-chapter/_index.md`:

```markdown
---
title: عنوان فصل
type: chapter
weight: 3
description: توضیح کوتاه برای جست‌وجو
---

متن معرفی فصل...
```

- **Ordering**: `weight` in front matter (or the numeric folder/file prefix `01-`, `02-`, …)
- Push to `main` → the site builds and deploys automatically

## Writing mixed Persian/English — نگارش متن دوجهته

Direction follows one rule — **everything is RTL unless explicitly LTR** (logic in `assets/js/custom.js`):

- Persian and mixed Persian/English blocks → RTL, even when they start with an English term ("**Git** یک سیستم ...")
- Pure-Latin blocks (fully English paragraphs, list items, table cells) → LTR, detected automatically
- Fenced code blocks and inline code → always LTR, even with Persian comments inside
- Escape hatches: `<div dir="ltr">…</div>` forces a whole section LTR; `<bdi>fragment</bdi>` isolates a tricky inline piece

Escape hatches for rare cases:

```markdown
<div dir="ltr">

Whole section forced left-to-right.

</div>

این جمله با یک قطعه <bdi>مشکل‌دار</bdi> ایزوله شده است.
```

## Deployment

1. Push this repo to any GitHub account (e.g. `alirezaja1384/techstack-1405-devops-docs` or `iut-cessa/techstack-1405-devops-docs`)
2. Repo **Settings → Pages → Source: GitHub Actions** (one-time, per repo)
3. Push to `main` — `.github/workflows/deploy.yml` builds and deploys
4. Site URL: `https://<owner>.github.io/<repo>/` — computed automatically, no config change needed

**Custom domain** (optional): set repo *variable* `PAGES_BASEURL` (Settings → Secrets and variables → Actions → Variables) and configure DNS.

## Updating the theme

```bash
git submodule update --remote themes/hugo-theme-relearn
```

Pin to a release tag when possible (currently `9.0.3`).

## Licenses

- Font [Vazirmatn](https://github.com/rastikerdar/vazirmatn) — SIL OFL 1.1 (see `static/fonts/OFL.txt`)
- Theme [Hugo Relearn](https://github.com/McShelby/hugo-theme-relearn) — MIT
