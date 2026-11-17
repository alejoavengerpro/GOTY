// Colección de luchadores: cuadrícula de tarjetas con retrato, nivel y estado.

import { CHARACTERS, RARITY } from '../../data/characters.js';
import { screenHeader } from './shared.js';

export function charactersScreen(app) {
  const d = app.save.data;
  app.menu.setOffset(0);

  const cards = CHARACTERS.map((def) => {
    const c = d.chars[def.id];
    const rarity = RARITY[def.rarity];
    const status = c.unlocked
      ? `<span class="card-level">Nv. ${c.level}</span><span class="card-trophies">🏆 ${c.trophies}</span>`
      : `<span class="card-price">🔒 🪙 ${def.price}</span>`;
    return `
      <button class="char-card ${c.unlocked ? '' : 'locked'} ${d.selected === def.id ? 'selected' : ''}"
              style="--rarity:${rarity.color}" data-action="go" data-screen="character" data-id="${def.id}">
        <img src="${app.portraits[def.id]}" alt="${def.name}" />
        <b>${def.name}</b>
        <small>${rarity.label}</small>
        <div class="card-status">${status}</div>
      </button>`;
  }).join('');

  const owned = CHARACTERS.filter((c) => d.chars[c.id].unlocked).length;
  return `
    <div class="screen solid">
      ${screenHeader(app, `Luchadores ${owned}/${CHARACTERS.length}`)}
      <div class="char-grid">${cards}</div>
    </div>`;
}
