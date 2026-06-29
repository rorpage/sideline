// components/game-card.js
import { getPeriodDisplay } from '../app.js';

class GameCard extends HTMLElement {
  set gameData(data) {
    this._data = data;
    this.render();
  }

  render() {
    if (!this._data) return;
    const d = this._data;
    const isLive = d.status === 'in';
    const isFinal = d.status === 'post';

    const statusColor = isLive ? 'text-live' : isFinal ? 'text-dim' : 'text-glow';
    const statusText = isLive
      ? `${d.period ? getPeriodDisplay(d.period, d.periodType) : ''} ${d.clock || ''}`
      : isFinal ? 'Final'
      : d.startTime || 'Scheduled';

    const teamRow = (abbr, name, logo, score) => `
      <div class="flex items-center justify-between gap-2 mt-1">
        <div class="flex items-center gap-2 min-w-0">
          ${logo ? `<img src="${logo}" class="w-6 h-6 object-contain flex-shrink-0" onerror="this.style.display='none'" />` : '<div class="w-6"></div>'}
          <div class="min-w-0">
            <div class="text-sm font-mono text-chalk leading-none">${abbr}</div>
            <div class="text-xs font-mono text-dim truncate">${name}</div>
          </div>
        </div>
        <span class="text-sm font-mono font-semibold text-score flex-shrink-0">${score ?? ''}</span>
      </div>`;

    this.innerHTML = `
      <button
        class="w-full text-left rounded-lg px-4 py-3 border transition-all duration-150 cursor-pointer border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
        aria-label="${d.away} vs ${d.home}"
      >
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-mono ${statusColor} flex items-center gap-1">
            ${isLive ? '<span class="ticker-dot w-1.5 h-1.5 rounded-full bg-live inline-block"></span>' : ''}
            ${statusText}
          </span>
          ${d.broadcast ? `<span class="text-xs text-dim font-mono">${d.broadcast}</span>` : ''}
        </div>
        ${teamRow(d.away, d.awayName, d.awayLogo, d.awayScore)}
        ${teamRow(d.home, d.homeName, d.homeLogo, d.homeScore)}
      </button>
    `;

    this.querySelector('button').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('game-select', {
        bubbles: true,
        detail: { gameId: d.id, sport: d.sport, league: d.league, label: `${d.awayName} @ ${d.homeName}` },
      }));
    });
  }
}

customElements.define('game-card', GameCard);
