# Microsoft Ignite 2026: Copilot Studio, Microsoft IQ and Agent 365

Unofficial, static summary of Ignite 2026 (Nov 17–20, San Francisco) announcements. Plain HTML/CSS/JS, no build step, no tracking, no external dependencies.

> Unofficial summary. Verify against the Microsoft sources listed in the site footer.

## Layout

| Path | Purpose |
|---|---|
| `index.html` | Page shell, diagram, meta tags |
| `data/updates.json` | **All content.** The page is rendered from this file |
| `assets/app.js`, `assets/style.css` | Rendering, filter/search, theming |
| `scripts/check.mjs` | Validates the data and checks every link |
| `.github/workflows/pages.yml` | Validates, then deploys to GitHub Pages on push to `main` |

## Update content

Edit `data/updates.json`. Each entry in `updates`:

```json
{
  "id": "unique-kebab-id",
  "product": "copilot-studio | iq | agent-365",
  "area": "Sub-area label",
  "name": "Feature name",
  "summary": "1–2 sentences.",
  "status": "GA | Preview | Coming soon | Announced",
  "note": "optional caveat, e.g. a source discrepancy",
  "audience": ["maker", "admin", "developer", "security", "data"],
  "top": false,
  "source": "source id from `sources`",
  "also": ["optional extra source ids"]
}
```

Rules:
- Official Microsoft sources only. Never infer; if unverified, leave it out or say so in `note`.
- `Announced` means the source gives no explicit availability label.
- Keep 3–5 items with `"top": true` per product.
- Bump `meta.lastUpdated`.

Then run `node scripts/check.mjs` (add `--offline` to skip link checks). Some Microsoft hosts return 403 to bots; these show as warnings.

## Run locally

`fetch` does not work from `file://`, so serve the folder:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

Push to `main`. The workflow validates the data and deploys with the official Pages actions. In the repository settings, set **Pages → Source** to **GitHub Actions**. On GitHub Enterprise Server, the Pages feature and the `actions/*-pages` actions must be available; otherwise publish from the `main` branch root in Pages settings (the site has no build step).
