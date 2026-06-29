# AGENTS.md

Project conventions and session history for **Sideline**, a live ESPN play-by-play webapp.

---

## Project overview

Sideline is a zero-dependency static webapp. It polls the ESPN unofficial API to display live sport play-by-play. No server, no build step, no framework.

**Live at:** Vercel (deploy with `vercel deploy`)  
**Entry point:** `index.html`

---

## Architecture

```
sideline/
  index.html              # Shell, layout, Tailwind CDN
  app.js                  # Polling logic, ESPN API calls, event wiring
  components/
    sport-selector.js     # <sport-selector> web component
    game-card.js          # <game-card> web component
    play-feed.js          # <play-feed> web component
  README.md
  CLAUDE.md               # Points here
  AGENTS.md               # This file
```

All components are native Web Components registered with `customElements.define`. No Shadow DOM: styles come from Tailwind utility classes applied directly in `innerHTML`.

---

## Coding conventions

- **No em dashes** anywhere in code comments, strings, or docs. Use commas, colons, semicolons, or rewrite the sentence.
- **No build step.** Keep Tailwind on CDN. If complexity grows to warrant a bundler, document that decision here first.
- **No frameworks.** Web Components only. Avoid React, Vue, Svelte, etc. unless a compelling reason is documented here.
- **Minimal files.** One JS file per component. Logic lives in `app.js`. Don't split without reason.
- **Error handling:** All ESPN API calls are wrapped in try/catch. Errors surface to the UI (never silently swallowed).
- **Poll rate:** 15 seconds (`POLL_INTERVAL` in `app.js`). Do not reduce below 10 seconds.
- **No localStorage** in the current version. Noted in README as a possible extension.

---

## ESPN API notes

Two base domains are in use:

| Domain | Used for |
|---|---|
| `site.api.espn.com` | Scoreboard (game list) |
| `site.web.api.espn.com` | Summary + plays |

**Play-by-play endpoint:**
```
GET https://site.web.api.espn.com/apis/site/v2/sports/{sport}/{league}/summary?event={eventId}&region=us&lang=en
```
Returns a `plays` array (reversed in the UI to show newest first) and a `header` object with live score/status.

**Known fragility:** The `plays` array is inconsistent across sports. Soccer returns fewer fields. Always guard with optional chaining (`?.`).

---

## Color palette

| Token | Hex | Use |
|---|---|---|
| `field` | `#0a0f0d` | Page background |
| `turf` | `#0d1a13` | Card/panel backgrounds |
| `chalk` | `#e8ede9` | Primary text |
| `dim` | `#6b7c70` | Secondary/muted text |
| `live` | `#22c55e` | Live indicator, scoring plays |
| `score` | `#f0fdf4` | Score numbers |

Tailwind config is extended in `index.html` via `tailwind.config` on the CDN build.

---

## Session history

### Session 1 (2026-06-29)

**Context:** Robbie wanted a webapp to follow live sport play-by-play by polling the ESPN unofficial API.

**Decisions made:**
- Named the project "Sideline" (chosen from a shortlist that included Pitchside, The Ticker, Livewire).
- Stack: vanilla JS, Web Components, Tailwind CDN. No framework, no build step, consistent with Alfred and Rutetid project conventions.
- Three web components: `<sport-selector>`, `<game-card>`, `<play-feed>`. All use `innerHTML` templating inside `connectedCallback` or `render()`.
- ESPN unofficial API: `site.api.espn.com` for scoreboard, `site.web.api.espn.com` for summary/plays.
- Poll interval: 15 seconds.
- Dark green "field" aesthetic: monochrome with a single live-green accent. JetBrains Mono for data, Inter for UI copy.
- CORS: ESPN API allows cross-origin requests from the browser. No proxy needed for the current feature set.

**Files created:**
- `index.html`, `app.js`, `components/sport-selector.js`, `components/game-card.js`, `components/play-feed.js`, `README.md`, `CLAUDE.md`, `AGENTS.md`

**Known issues / next steps:**
- Play-by-play for soccer leagues returns limited data compared to NFL/NBA.
- No CORS proxy: if ESPN tightens origin headers, plays will break for the summary endpoint.
- `game-card` re-renders fully on each scoreboard poll. Fine for the current scale, but worth revisiting if there are 20+ games.
- Consider adding a `vercel.json` with cache headers to reduce ESPN request volume in production.
