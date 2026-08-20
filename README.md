# Heaven Guardian Website

Static multi-page prototype for the Heaven Guardian gaming account marketplace.

## Project structure

```text
.
├── index.html
├── pages/
│   ├── albion-online-accounts.html
│   ├── albion-online-account-detail.html
│   ├── wanted-accounts.html
│   └── legal/
│       ├── privacy-policy.html
│       ├── return-policy.html
│       └── terms-and-conditions.html
├── assets/
│   ├── css/
│   │   ├── shared/
│   │   │   ├── site-header.css
│   │   │   └── site-footer.css
│   │   └── pages/
│   │       ├── home.css
│   │       ├── albion-online-accounts.css
│   │       ├── albion-online-account-detail.css
│   │       ├── wanted-accounts.css
│   │       └── legal-pages.css
│   ├── js/
│   │   ├── shared/
│   │   │   ├── site-init.js
│   │   │   └── site-header.js
│   │   └── pages/
│   │       ├── home.js
│   │       ├── albion-online-accounts.js
│   │       ├── albion-online-account-detail.js
│   │       ├── wanted-accounts.js
│   │       └── legal-pages.js
│   └── images/
│       ├── albion/gallery/
│       ├── brand/
│       ├── games/{artwork,logos}/
│       ├── home/
│       └── wanted/
└── archive/
    ├── design-drafts/
    ├── legacy-pages/
    ├── legacy-assets/
    ├── source-images/
    └── unused-assets/
```

## Pages

- `index.html` — marketplace homepage.
- `pages/albion-online-accounts.html` — Albion Online account listings.
- `pages/albion-online-account-detail.html` — Albion Online account detail page (PDP).
- `pages/wanted-accounts.html` — Wanted Accounts request board.
- `pages/legal/terms-and-conditions.html` — Terms and Conditions.
- `pages/legal/privacy-policy.html` — Privacy Policy.
- `pages/legal/return-policy.html` — Return Policy / account recall warranty.

Legal pages are linked from the shared site footer on every main page.

## Naming convention

- File and folder names use lowercase kebab-case.
- Page names describe their search intent and purpose.
- Shared styles/scripts live in `assets/{css,js}/shared/`.
- Page-specific styles/scripts live in `assets/{css,js}/pages/` and match the page slug.
- Images are grouped by purpose under `assets/images/`.
- Drafts, superseded pages, and unused assets live in `archive/` and are not linked from production pages.

## Notes

- `node_modules/` may exist from local tooling (e.g. CDP test helpers) and is not part of the static site.
- Open `index.html` directly, or serve this folder with any static web server.
