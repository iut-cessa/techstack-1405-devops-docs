# TechStack DevOps Course Notes

Persian course notes and exercises for the TechStack DevOps course. The site is built with [Hugo](https://gohugo.io/) and the [Relearn](https://mcshelby.github.io/hugo-theme-relearn/) documentation theme, then deployed to GitHub Pages with GitHub Actions.

## Features

- Persian, right-to-left content using the [Vazirmatn](https://github.com/rastikerdar/vazirmatn) font
- Search, syntax highlighting, and automatic light/dark themes
- Markdown-based chapters and lessons
- Automatic GitHub Pages deployment from `main`
- Repository-aware deployment URLs, with optional custom-domain support

## Prerequisites

- Git
- [Hugo Extended](https://gohugo.io/installation/) 0.141.0 or newer (CI uses 0.165.0)

## Run locally

Clone the repository with its theme submodule:

```bash
git clone --recurse-submodules https://github.com/iut-cessa/techstack-1405-devops-docs.git
cd techstack-1405-devops-docs
hugo server -D
```

Open <http://localhost:1313/>. The `-D` flag includes draft pages.

If you already cloned the repository without submodules, initialize the theme with:

```bash
git submodule update --init --recursive
```

## Project structure

```text
content/                         Course content
└── chapters/                    Chapters and lessons
assets/css/                      Custom styles and fonts
assets/js/custom.js              RTL/LTR direction handling
static/fonts/                    Local Vazirmatn font files
themes/hugo-theme-relearn/       Theme submodule
hugo.toml                        Hugo configuration
.github/workflows/deploy.yml     GitHub Pages workflow
```

## Add a chapter

Create a numbered directory under `content/chapters/`:

```text
content/chapters/03-my-chapter/
├── _index.md
├── 01-first-lesson.md
└── 02-second-lesson.md
```

Use the following front matter in the chapter's `_index.md`:

```markdown
---
title: عنوان فصل
type: chapter
weight: 3
description: توضیح کوتاه برای جست‌وجو
---

متن معرفی فصل...
```

Set `weight` to control navigation order. Numeric directory and file prefixes such as `01-` and `02-` also keep the source tree easy to scan.

Before committing, preview drafts locally and verify a production build:

```bash
hugo server -D
hugo --gc --minify
```

## Write mixed Persian and English

Content is right-to-left by default. Direction handling in `assets/js/custom.js` applies these rules:

- Persian and mixed Persian/English blocks are RTL, even if they begin with an English term.
- Fully English paragraphs, list items, and table cells are detected as LTR.
- Fenced code blocks and inline code are always LTR, including code with Persian comments.
- `<div dir="ltr">...</div>` forces an entire section to LTR.
- `<bdi>...</bdi>` isolates an inline fragment with awkward bidirectional rendering.

For example:

```markdown
<div dir="ltr">

This entire section is rendered left-to-right.

</div>

این جمله یک قطعه <bdi>LTR fragment</bdi> دارد.
```

## Deploy to GitHub Pages

1. In the GitHub repository, open **Settings → Pages**.
2. Set **Source** to **GitHub Actions**. This is required once per repository.
3. Push to `main`. The workflow builds and deploys the site automatically.

The workflow determines the correct project URL at build time:

```text
https://<owner>.github.io/<repository>/
```

For a custom domain, create an Actions repository variable named `PAGES_BASEURL` under **Settings → Secrets and variables → Actions → Variables**, then configure the domain's DNS records.

When using this project from another repository, also update `params.editURL` in `hugo.toml` so page-edit links target the correct GitHub repository.

## Update the theme

The Relearn theme is included as a submodule and currently pinned to release 9.0.3. To update it:

```bash
git submodule update --remote themes/hugo-theme-relearn
```

Review and test the resulting submodule change before committing it. Prefer pinning stable release tags.

## Licenses

- [Vazirmatn](https://github.com/rastikerdar/vazirmatn) font — SIL Open Font License 1.1; see [`static/fonts/OFL.txt`](static/fonts/OFL.txt)
- [Hugo Relearn](https://github.com/McShelby/hugo-theme-relearn) theme — MIT License
