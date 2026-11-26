# Microsoft Ignite 2026: Copilot Studio, Microsoft IQ, Microsoft Foundry, Agent 365 and Power Platform

Independent summary of Microsoft’s Ignite 2026 announcements. It carries a disclaimer in the page footer and the slide deck: shared for general information only, with no responsibility or liability accepted by the author, and readers should verify against the linked Microsoft sources. Plain HTML/CSS/JS, no build step, no tracking, no external dependencies.

## Theme

- The site uses a single light **Editorial** theme with a sidebar layout on wide screens.
- The page shows everything: headline numbers, per-product sections with search, filters and every update, the comparison, next steps, and a "Summary at a glance" section at the end with one card per platform (rendered from `data/updates.json`; the one-line `glance` text is set per product).
- Colors are CSS variables at the top of `assets/style.css` (base tokens) and `assets/editorial.css`.

## Slides

`slides.html` is a 16:9 deck built from the same `data/updates.json`: title, how the products fit, then per product an overview, top announcements and all updates, followed by the comparison, summary at a glance, next steps and sources.

- **Keys:** arrow keys, Page Up/Down, Space, Home, End; **F** for full screen. The slide number is kept in the URL (`#5`).
- **PDF:** print the page (Ctrl or Cmd+P); each slide is one page.
- **Themes:** chosen by hostname. Hosts ending in `eficode.com` get the **OP format** (white and orange, `assets/slides-op.css`); everywhere else gets the **generic format** (dark navy, `assets/slides-generic.css`). Add `?theme=op` or `?theme=generic` to override.
- The OP format approximates the public OP look only. It has no OP logo and is not an official template; replace `assets/slides-op.css` if you have one.

## Layout

| Path | Purpose |
|---|---|
| `index.html` | Page shell, diagram, meta tags |
| `data/updates.json` | **All content.** The page is rendered from this file |
| `assets/app.js`, `assets/style.css` | Rendering, filter/search and base styling |
| `assets/editorial.css`, `assets/fonts/` | Editorial (sidebar) theme and its self-hosted fonts |
| `assets/icons/` | Official Microsoft icons, unmodified (see Credits). Mapped in the `logos`, `platforms` and `areaLogos` keys of `data/updates.json` |
| `slides.html`, `assets/slides.js`, `assets/slides*.css` | Slide deck, shared layout and the OP and generic themes |
| `scripts/check.mjs` | Validates the data and checks every link |
| `.github/workflows/pages.yml` | Validates, then deploys to GitHub Pages on push to `main` |

## Update content

Edit `data/updates.json`. Each entry in `updates`:

```json
{
  "id": "unique-kebab-id",
  "product": "copilot-studio | iq | foundry | agent-365 | power-platform",
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
- `Announced` means the source gives no single release stage; check the entry's summary and note for component-specific availability or differences between Microsoft sources.
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

The Editorial theme borrows its visual design from [Editorial by HTML5 UP](https://html5up.net/editorial) (@ajlkn, [CC BY 3.0](https://html5up.net/license)), via [sdasrc/editorial-website-extended](https://github.com/sdasrc/editorial-website-extended). It is re-implemented in plain CSS; no Jekyll code is used. Open Sans and Roboto Slab are self-hosted under the SIL Open Font License (see `assets/fonts`).

**Microsoft icons.** `assets/icons/` holds the official Microsoft icons, unmodified: Copilot Studio, Agent 365, Power Platform, Power Apps, Power Automate and Dataverse from the [Power Platform icons](https://learn.microsoft.com/en-us/power-platform/guidance/icons) (terms in `assets/icons/LICENSE-power-platform-icons.pdf`), and Microsoft Foundry (used for the Microsoft Foundry product) and Foundry IQ from the [Azure architecture icons](https://learn.microsoft.com/en-us/azure/architecture/icons/). Microsoft permits these only to illustrate the Microsoft products they represent, so keep each product name next to its icon, do not crop, flip, rotate or distort them, and do not use them for other products. Microsoft IQ has no product icon of its own, so it uses the Microsoft logo (`assets/icons/microsoft.svg`, four squares); Work IQ, Fabric IQ and Web IQ use a neutral symbol. Microsoft and the product names are trademarks of the Microsoft group of companies; this site is not endorsed by Microsoft.
