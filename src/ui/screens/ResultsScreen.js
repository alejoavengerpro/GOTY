// Resultados de la partida: puesto o marcador y recompensas obtenidas.

import { CHARACTER_MAP } from '../../data/characters.js';

export function resultsScreen(app, r) {
  const def = CHARACTER_MAP[r.characterId];
  app.menu.setCharacter(r.characterId);
  app.menu.setOffset(innerWidth > innerHeight ? -2.6 : 0);

  let title, sub;
  if (r.mode === 'survival') {
    title = r.rank === 1 ? '¡GANASTE!' : `PUESTO #${r.rank}`;
    sub = `de ${r.total} luchadores`;
  } else {
    title = { win: '¡VICTORIA!', loss: 'DERROTA', draw: 'EMPATE' }[r.outcome];
    sub = `Marcador ${r.score[0]} – ${r.score[1]}`;
  }
  const sign = r.trophiesDelta > 0 ? '+' : '';
  const pending = app.progression.roadPending;

  return `
    <div class="screen detail">
      <section class="detail-panel results ${r.won ? 'won' : ''}">
        <h2 class="result-title">${title}</h2>
        <p class="detail-sub">${sub} · ${def.name} · ⚔ ${r.kills} KOs</p>
        <div class="rewards">
          <div class="${r.trophiesDelta < 0 ? 'neg' : ''}"><span>🏆</span><b>${sign}${r.trophiesDelta}</b><small>Trofeos</small></div>
          <div><span>🪙</span><b>+${r.coins}</b><small>Monedas</small></div>
          <div><span>⭐</span><b>+${r.xp}</b><small>Experiencia</small></div>
        </div>
        ${r.levelUps ? `<p class="levelup">¡Subiste al nivel ${app.save.data.level}! +${r.levelUpCoins} 🪙</p>` : ''}
        ${pending ? '<p class="levelup">🎁 Tienes recompensas en el camino de trofeos</p>' : ''}
        <div class="detail-actions">
          <button class="btn btn-play btn-big" data-action="play">Jugar otra vez</button>
          <button class="btn btn-big" data-action="go" data-screen="lobby">Volver al lobby</button>
        </div>
      </section>
    </div>`;
}
