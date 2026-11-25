# Microsoft Ignite 2026: Copilot Studio, Microsoft IQ and Agent 365

Unofficial, static summary of Ignite 2026 (Nov 17–20, San Francisco) announcements. Plain HTML/CSS/JS, no build step, no tracking, no external dependencies.

## Themes

- **Theme menu**: Galaxy (default, a warm sunset galaxy with orange, red and yellow nebulae, stars and a shooting star) and Editorial (light, sidebar layout). The choice is saved in `localStorage`.
- Preset a theme with a URL parameter, for example `?theme=editorial`. Unknown theme names fall back to Galaxy.
- The page always shows everything: headline numbers, per-product sections with search, filters and every update, the comparison, next steps, and a "Summary at a glance" section at the end with one card per platform (rendered from `data/updates.json`; the one-line `glance` text is set per product).
- Theme colors are CSS variables at the top of `assets/style.css` (base tokens), `assets/editorial.css` and `assets/galaxy.css`; add a theme by adding a `:root[data-theme="name"]` block and an entry in `assets/theme.js`.

## Layout

| Path | Purpose |
|---|---|
| `index.html` | Page shell, diagram, meta tags |
| `data/updates.json` | **All content.** The page is rendered from this file |
| `assets/app.js`, `assets/style.css` | Rendering, filter/search, styling and themes |
| `assets/theme.js` | Theme and view switching (loaded before first paint) |
| `assets/editorial.css`, `assets/galaxy.css`, `assets/fonts/` | Editorial (sidebar) and Galaxy (deep space) themes and their self-hosted fonts |
| `assets/icons/` | Official Microsoft icons, unmodified (see Credits). Mapped in the `logos`, `platforms` and `areaLogos` keys of `data/updates.json` |
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

## Credits

The Editorial theme borrows its visual design from [Editorial by HTML5 UP](https://html5up.net/editorial) (@ajlkn, [CC BY 3.0](https://html5up.net/license)), via [sdasrc/editorial-website-extended](https://github.com/sdasrc/editorial-website-extended). It is re-implemented in plain CSS; no Jekyll code is used. Open Sans and Roboto Slab are self-hosted under the SIL Open Font License (see `assets/fonts`). The Galaxy theme is original CSS using Orbitron and Exo 2, also self-hosted under the SIL Open Font License.

**Microsoft icons.** `assets/icons/` holds the official Microsoft icons, unmodified: Copilot Studio, Agent 365, Power Platform, Power Apps, Power Automate and Dataverse from the [Power Platform icons](https://learn.microsoft.com/en-us/power-platform/guidance/icons) (terms in `assets/icons/LICENSE-power-platform-icons.pdf`), and Microsoft Foundry and Foundry IQ from the [Azure architecture icons](https://learn.microsoft.com/en-us/azure/architecture/icons/). Microsoft permits these only to illustrate the Microsoft products they represent, so keep each product name next to its icon, do not crop, flip, rotate or distort them, and do not use them for other products. Microsoft IQ, Work IQ, Fabric IQ and Web IQ have no published official icon, so they use a neutral symbol. Microsoft and the product names are trademarks of the Microsoft group of companies; this site is unofficial and not endorsed by Microsoft.
