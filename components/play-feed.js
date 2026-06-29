// components/play-feed.js
// Web component for displaying the live play-by-play feed

class PlayFeed extends HTMLElement {
  constructor() {
    super();
    this._plays = [];
    this._gameInfo = null;
    this._empty = true;
  }

  setEmpty() {
    this._empty = true;
    this._plays = [];
    this._gameInfo = null;
    this.render();
  }

  setLoading() {
    this.innerHTML = `
      <div class="rounded-lg border border-white/5 bg-white/[0.02] p-6 text-center">
        <p class="text-dim text-sm font-mono animate-pulse">Fetching plays...</p>
      </div>
    `;
  }

  setError(msg) {
    this.innerHTML = `
      <div class="rounded-lg border border-red-900/30 bg-red-950/10 p-6 text-center">
        <p class="text-red-400 text-sm font-mono">${msg}</p>
      </div>
    `;
  }

  update(plays, gameInfo) {
    this._empty = false;
    this._gameInfo = gameInfo;
    const prevCount = this._plays.length;
    this._plays = plays;
    this.render(prevCount < plays.length);
  }

  render(hasNew = false) {
    if (this._empty) {
      this.innerHTML = `
        <div class="rounded-lg border border-white/5 p-8 text-center" style="background:#0d1a13;">
          <p class="text-dim text-sm font-mono">Select a game to watch the feed</p>
        </div>
      `;
      return;
    }

    const gi = this._gameInfo;
    const plays = this._plays;

    const teamBlock = (abbr, name, logo, score) => `
      <div class="flex items-center gap-2">
        ${logo ? `<img src="${logo}" class="w-7 h-7 object-contain" onerror="this.style.display='none'" />` : ''}
        <div>
          <div class="font-mono text-xs text-dim">${abbr}</div>
          <div class="font-mono text-sm text-chalk leading-none">${name}</div>
        </div>
        <span class="font-mono text-lg font-semibold text-score ml-2">${score ?? 0}</span>
      </div>`;

    const headerHtml = gi ? `
      <div class="rounded-lg border border-white/5 px-4 py-3 mb-3 flex items-center justify-between" style="background:#0d1a13;">
        <div class="flex items-center gap-6">
          ${teamBlock(gi.away, gi.awayName || gi.away, gi.awayLogo, gi.awayScore)}
          <span class="text-dim text-xs">vs</span>
          ${teamBlock(gi.home, gi.homeName || gi.home, gi.homeLogo, gi.homeScore)}
        </div>
        <span class="font-mono text-xs ${gi.status === 'in' ? 'text-live' : 'text-dim'}">
          ${gi.status === 'in' ? `${gi.periodDisplay || ''} ${gi.clock || ''}` : gi.status === 'post' ? 'Final' : 'Scheduled'}
        </span>
      </div>
    ` : '';

    const playsHtml = plays.length === 0
      ? `<p class="text-dim text-sm font-mono px-1 py-4">No plays yet. Check back once the game starts.</p>`
      : plays.map((p, i) => `
          <div class="play-item flex gap-3 px-3 py-2.5 rounded-md ${p.scoring ? 'bg-glow/5 border border-glow/10' : 'border border-transparent hover:bg-white/[0.02]'}" style="${i === 0 && hasNew ? 'animation: slideIn 0.3s ease-out' : ''}">
            <div class="flex-shrink-0 w-12 text-right">
              <span class="font-mono text-xs text-dim">${p.clock || ''}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start gap-2">
                ${p.scoring ? '<span class="text-glow text-xs mt-0.5">⬥</span>' : '<span class="text-white/10 text-xs mt-0.5">·</span>'}
                <p class="text-sm font-mono text-chalk leading-relaxed">${p.text || p.description || ''}</p>
              </div>
              ${p.period ? `<span class="text-xs font-mono text-dim/60 ml-4">${p.periodLabel || ''}</span>` : ''}
            </div>
          </div>
        `).join('');

    this.innerHTML = `
      ${headerHtml}
      <div class="rounded-lg border border-white/5 overflow-hidden" style="background:#0d1a13;">
        <div class="max-h-[60vh] overflow-y-auto p-2 space-y-0.5">
          ${playsHtml}
        </div>
      </div>
    `;
  }
}

customElements.define('play-feed', PlayFeed);
