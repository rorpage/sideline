// app.js
// Main application logic for Sideline

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';
const ESPN_SUMMARY = 'https://site.web.api.espn.com/apis/site/v2/sports';
const POLL_INTERVAL = 15_000; // 15 seconds

let currentSport = 'football';
let currentLeague = 'nfl';
let selectedGame = null;
let pollTimer = null;
let lastPlayId = null;
let gameFinal = false;

// --- ESPN API helpers ---

function localDateStamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

async function fetchScoreboard(sport, league) {
  const today = localDateStamp();
  const url = `${ESPN_BASE}/${sport}/${league}/scoreboard?dates=${today}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Scoreboard fetch failed: ${res.status}`);
  return res.json();
}

async function fetchSummary(sport, league, eventId) {
  const url = `${ESPN_SUMMARY}/${sport}/${league}/summary?event=${eventId}&region=us&lang=en`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Summary fetch failed: ${res.status}`);
  return res.json();
}

// --- Data parsers ---

function parseGames(data, sport, league) {
  return (data.events || []).map(event => {
    const comp = event.competitions?.[0];
    const competitors = comp?.competitors || [];
    const home = competitors.find(c => c.homeAway === 'home');
    const away = competitors.find(c => c.homeAway === 'away');
    const status = event.status?.type;
    const broadcast = comp?.broadcasts?.[0]?.names?.[0] || null;

    return {
      id: event.id,
      sport,
      league,
      home: home?.team?.abbreviation || '?',
      homeName: home?.team?.displayName || home?.team?.abbreviation || '?',
      homeLogo: home?.team?.logo || null,
      away: away?.team?.abbreviation || '?',
      awayName: away?.team?.displayName || away?.team?.abbreviation || '?',
      awayLogo: away?.team?.logo || null,
      homeScore: home?.score ?? null,
      awayScore: away?.score ?? null,
      status: status?.state || 'pre',
      period: event.status?.period || null,
      periodType: detectPeriodType(sport),
      clock: event.status?.displayClock || null,
      startTime: event.date ? new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
      broadcast,
    };
  });
}

function detectPeriodType(sport) {
  if (sport === 'baseball') return 'inning';
  if (sport === 'basketball' || sport === 'football') return 'quarter';
  return 'half';
}

function parsePlays(summaryData) {
  const comp = summaryData?.header?.competitions?.[0];
  const competitors = comp?.competitors || [];
  const home = competitors.find(c => c.homeAway === 'home');
  const away = competitors.find(c => c.homeAway === 'away');

  const gameInfo = {
    home: home?.team?.abbreviation || '?',
    homeName: home?.team?.displayName || home?.team?.abbreviation || '?',
    homeLogo: home?.team?.logo || null,
    away: away?.team?.abbreviation || '?',
    awayName: away?.team?.displayName || away?.team?.abbreviation || '?',
    awayLogo: away?.team?.logo || null,
    homeScore: home?.score ?? null,
    awayScore: away?.score ?? null,
    status: comp?.status?.type?.state || 'pre',
    clock: comp?.status?.displayClock || null,
    period: comp?.status?.period || null,
    periodDisplay: getPeriodDisplay(comp?.status?.period, comp?.status?.type?.description),
  };

  const usePlays = !!summaryData?.plays?.length;
  const src = usePlays ? summaryData.plays : (summaryData?.commentary || []);
  const rawPlays = src.slice().reverse().map(usePlays
    ? p => ({ id: p.id, text: p.text || p.shortText || '', clock: p.clock?.displayValue || '', period: p.period?.number || null, periodLabel: getPeriodDisplay(p.period?.number, p.period?.type), scoring: p.scoringPlay || false, team: p.team?.abbreviation || null })
    : c => ({ id: c.play?.id ?? String(c.sequence), text: c.text || '', clock: c.time?.displayValue || '', period: c.play?.period?.number || null, periodLabel: getPeriodDisplay(c.play?.period?.number, null), scoring: c.play?.type?.type === 'goal', team: c.play?.team?.displayName || null }));

  return { plays: rawPlays, gameInfo };
}

export function getPeriodDisplay(period, type) {
  if (!period) return '';
  const t = (type || '').toLowerCase();
  if (t.includes('overtime') || t.includes('ot')) return period === 5 ? 'OT' : `${period - 4}OT`;
  if (t === 'inning') return `${period}th`;
  const labels = ['1st', '2nd', '3rd', '4th'];
  return labels[period - 1] || `P${period}`;
}

// --- UI helpers ---

function renderGames(games) {
  const container = document.getElementById('games-list');
  if (!games.length) {
    container.innerHTML = `<p class="text-dim text-sm font-mono">No games today.</p>`;
    return;
  }
  container.innerHTML = '';
  games.forEach(game => {
    const card = document.createElement('game-card');
    card.gameData = game;
    if (selectedGame?.id === game.id) card.setAttribute('selected', '');
    container.appendChild(card);
  });
}

function setPollLabel(text) {
  const el = document.getElementById('poll-label');
  if (el) el.textContent = text;
}

// --- Polling logic ---

async function loadScoreboard() {
  try {
    const data = await fetchScoreboard(currentSport, currentLeague);
    const games = parseGames(data, currentSport, currentLeague);
    renderGames(games);
    setPollLabel('live');

    // If a game is selected, refresh its score in the feed header too
    if (selectedGame) {
      const updated = games.find(g => g.id === selectedGame.id);
      if (updated) selectedGame = { ...selectedGame, ...updated };
    }
  } catch (err) {
    console.error('Scoreboard error:', err);
    setPollLabel('error');
  }
}

async function loadPlays() {
  if (!selectedGame) return;
  const feed = document.querySelector('play-feed');
  if (!feed) return;

  try {
    const data = await fetchSummary(selectedGame.sport, selectedGame.league, selectedGame.id);
    const { plays, gameInfo } = parsePlays(data);
    feed.update(plays, gameInfo);

    if (gameInfo.status === 'post') {
      gameFinal = true;
      setPollLabel('final');
    }

    const newLatest = plays[0]?.id;
    if (lastPlayId && newLatest !== lastPlayId) {
      // New play came in
      setPollLabel(`updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)
    }
    lastPlayId = newLatest;
  } catch (err) {
    console.error('Summary error:', err);
    feed.setError('Could not load plays. ESPN may have rate-limited this request. Try again shortly.');
  }
}

function startPolling() {
  stopPolling();
  loadScoreboard();
  loadPlays();
  pollTimer = setInterval(() => {
    loadScoreboard();
    if (!gameFinal) loadPlays();
  }, POLL_INTERVAL);
}

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

// --- Event listeners ---

document.addEventListener('sport-change', (e) => {
  const { sport, league } = e.detail;
  currentSport = sport;
  currentLeague = league;
  selectedGame = null;
  lastPlayId = null;
  gameFinal = false;

  const feed = document.querySelector('play-feed');
  feed?.setEmpty();
  document.getElementById('selected-game-label').textContent = 'select a game';
  document.getElementById('games-list').innerHTML = `<p class="text-dim text-sm font-mono">Loading...</p>`;

  stopPolling();
  startPolling();
});

document.addEventListener('game-select', (e) => {
  const { gameId, sport, league, label } = e.detail;

  // Deselect old card
  document.querySelectorAll('game-card').forEach(c => c.removeAttribute('selected'));

  // Select new card
  const newCard = [...document.querySelectorAll('game-card')].find(c => c._data?.id === gameId);
  newCard?.setAttribute('selected', '');

  selectedGame = { id: gameId, sport, league };
  lastPlayId = null;
  gameFinal = false;
  document.getElementById('selected-game-label').textContent = label;

  const feed = document.querySelector('play-feed');
  feed?.setLoading();
  loadPlays();
});

// --- Boot ---
document.addEventListener('DOMContentLoaded', () => {
  startPolling();
});
