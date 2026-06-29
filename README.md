# Sideline

> Live sport play-by-play in the browser. No server, no auth, no build step.

Sideline is a minimal static webapp that polls the ESPN unofficial API to show live play-by-play for NFL, NBA, MLB, NHL, WNBA, MLS, and the Premier League. Select a sport, pick a game, and watch the feed update every 15 seconds.

---

## How it works

1. On load, Sideline hits the ESPN scoreboard endpoint for the selected sport to show today's games.
2. When you click a game, it fetches the summary endpoint to load the full play list.
3. Both calls repeat every 15 seconds via `setInterval`.

No API key. No backend. No build toolchain. Just `index.html` opened in a browser or deployed to any static host (Vercel, Netlify, GitHub Pages).

---

## ESPN API endpoints used

| Purpose | Endpoint |
|---|---|
| Scoreboard (today's games) | `https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/scoreboard` |
| Game summary + plays | `https://site.web.api.espn.com/apis/site/v2/sports/{sport}/{league}/summary?event={id}` |

These are **unofficial, undocumented** endpoints. They power ESPN's own website and require no authentication, but ESPN can change or remove them at any time. See `AGENTS.md` for notes on this project's conventions.

### Sport/league slugs supported

| Label | `sport` | `league` |
|---|---|---|
| NFL | `football` | `nfl` |
| NBA | `basketball` | `nba` |
| MLB | `baseball` | `mlb` |
| NHL | `hockey` | `nhl` |
| WNBA | `basketball` | `wnba` |
| MLS | `soccer` | `usa.1` |
| EPL | `soccer` | `eng.1` |

---

## Tech stack

- Vanilla HTML, CSS, JavaScript (no framework)
- Web Components (`customElements.define`) for `game-card`, `play-feed`, and `sport-selector`
- Tailwind CSS via CDN (no build step)
- Google Fonts: Inter + JetBrains Mono

---

## Running locally

```bash
# Any static file server works. For example:
npx serve .

# Or with Python:
python -m http.server 8080
```

Then open `http://localhost:8080`.

---

## Deploying to Vercel

```bash
vercel deploy
```

No `vercel.json` config needed for a pure static project. Vercel will detect it automatically.

---

## Caveats

- ESPN play-by-play data lags live broadcasts by roughly 15 to 30 seconds.
- The unofficial API has no SLA. If ESPN changes endpoint structure, parsing will break silently.
- The `plays` array in the summary response is not available for all sports equally. Soccer and some college sports return fewer play details than NFL/NBA.
- Aggressive polling (faster than 10 seconds) risks getting rate-limited by ESPN.

---

## Possible extensions

- Add a CORS proxy or lightweight Edge Function to cache ESPN responses and avoid rate limiting.
- Persist the selected sport to `localStorage` across page loads.
- Add a win probability chart using `competitions/{id}/probabilities`.
- Push notifications for scoring plays via the Web Push API.
