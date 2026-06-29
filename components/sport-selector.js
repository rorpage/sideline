// components/sport-selector.js
// Web component for selecting sport/league

const SPORTS = [
  { label: 'NFL',  sport: 'football',   league: 'nfl' },
  { label: 'NBA',  sport: 'basketball', league: 'nba' },
  { label: 'MLB',  sport: 'baseball',   league: 'mlb' },
  { label: 'NHL',  sport: 'hockey',     league: 'nhl' },
  { label: 'WNBA', sport: 'basketball', league: 'wnba' },
  { label: 'MLS',  sport: 'soccer',     league: 'usa.1' },
  { label: 'EPL',  sport: 'soccer',     league: 'eng.1' },
  { label: 'World Cup', sport: 'soccer', league: 'fifa.world' },
];

class SportSelector extends HTMLElement {
  connectedCallback() {
    this.selected = SPORTS[0];
    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="flex flex-wrap gap-2" role="group" aria-label="Select sport">
        ${SPORTS.map(s => `
          <button
            data-sport="${s.sport}"
            data-league="${s.league}"
            class="sport-btn px-3 py-1 rounded text-xs font-mono border transition-colors duration-150
              ${this.selected.league === s.league
                ? 'bg-electric/10 border-electric/40 text-electric'
                : 'border-white/10 text-dim hover:border-white/20 hover:text-chalk'}"
            aria-pressed="${this.selected.league === s.league}"
          >${s.label}</button>
        `).join('')}
      </div>
    `;

    this.querySelectorAll('.sport-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sport = btn.dataset.sport;
        const league = btn.dataset.league;
        this.selected = SPORTS.find(s => s.league === league);
        this.render();
        this.dispatchEvent(new CustomEvent('sport-change', {
          bubbles: true,
          detail: { sport, league },
        }));
      });
    });
  }
}

customElements.define('sport-selector', SportSelector);
export { SPORTS };
