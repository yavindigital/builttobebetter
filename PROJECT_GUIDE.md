# Built to Be Better — Project Guide

## 1. Project Overview

HTML prototype for Built to Be Better, a website image optimization audit product. Vanilla HTML/CSS/JS. Review host: `https://builttobebetter.clientreview.co`. Repo: `yavindigital/builttobebetter`.

## 2. File Structure

```
CNAME
PROJECT_GUIDE.md
SCOPE.md
index.html
architecture.html
roadmap.html
roadmap.md
site.css
js/layout.js
js/site.js
js/anim.js
js/modal.js
img/
```

Local `README.md` in this Mac folder is a sales-opp SOP, not the client site. It is not in git.

## 3. Architecture

- Home is the image-audit landing page (`site.css` + `js/`).
- `architecture.html` and `roadmap.html` are self-contained product docs with inlined CSS.
- Shared chrome for Home is `js/layout.js`.
- Audit form is mocked. It does not crawl a live site in this prototype.

## 4. Work completed

- Home, architecture, and roadmap pages from the local prototype folder.
- GitHub Pages CNAME `builttobebetter.clientreview.co`.

## 5. Git workflow

- Remote: `https://github.com/yavindigital/builttobebetter`
- Never commit directly to `main`. Feature branch → PR → squash merge.
