// Camino de trofeos: recompensas por alcanzar hitos de trofeos totales.

import { CHARACTER_MAP } from '../../data/characters.js';
import { screenHeader } from './shared.js';

export function trophyRoadScreen(app) {
  const total = app.save.totalTrophies;
  app.menu.setOffset(0);

  const rows = app.progression.roadStatus().map((r) => {
    const reward = r.unlock
      ? `<img src="${app.portraits[r.unlock]}" alt="" /><b>${CHARACTER_MAP[r.unlock].name}</b>`
      : `<span class="coin-big">🪙</span><b>${r.coins} monedas</b>`;
    const action = r.claimed
      ? '<span class="tag done">✔ Reclamado</span>'
      : r.reached
        ? `<button class="btn btn-green" data-action="claim" data-index="${r.index}">Reclamar</button>`
        : `<span class="tag">Faltan ${r.trophies - total} 🏆</span>`;
    return `
      <div class="road-row ${r.reached ? 'reached' : ''}">
        <div class="road-goal">🏆 ${r.trophies}</div>
        <div class="road-reward">${reward}</div>
        ${action}
      </div>`;
  }).join('');

  const s = app.save.data.stats;
  return `
    <div class="screen solid">
      ${screenHeader(app, 'Camino de trofeos')}
      <div class="road">
        <p class="road-summary">Tienes <b>🏆 ${total}</b> · Partidas: ${s.matches} · Victorias: ${s.wins} · KOs: ${s.kills}</p>
        ${rows}
        <button class="btn btn-small btn-red reset" data-action="reset">Borrar progreso</button>
      </div>
    </div>`;
}
