// Ficha de un luchador: estadísticas, habilidades y acciones (elegir, mejorar, comprar).

import { CHARACTER_MAP, RARITY, MAX_LEVEL, levelMultiplier, statBars } from '../../data/characters.js';
import { screenHeader } from './shared.js';

const SUPER_LABEL = { dash: 'Embestida', barrage: 'Ráfaga', blast: 'Explosión en área', heal: 'Curación y velocidad' };

export function characterDetailScreen(app, { id }) {
  const d = app.save.data;
  const def = CHARACTER_MAP[id];
  const c = d.chars[id];
  const rarity = RARITY[def.rarity];
  const mult = levelMultiplier(c.level);
  const nextMult = levelMultiplier(c.level + 1);
  const cost = app.progression.upgradeCost(id);
  const canUpgrade = c.level < MAX_LEVEL;

  app.menu.setCharacter(id);
  app.menu.setOffset(innerWidth > innerHeight ? -2.6 : 0);

  const bars = statBars(def).map((s) => `
    <div class="stat"><span>${s.label}</span><div class="statbar"><i style="width:${Math.round(Math.min(1, s.value) * 100)}%"></i></div></div>`).join('');

  const gain = (base) => (canUpgrade && c.unlocked ? ` <em>+${Math.round(base * nextMult) - Math.round(base * mult)}</em>` : '');

  let actions;
  if (!c.unlocked) {
    actions = `<button class="btn btn-green btn-big" data-action="buy" data-id="${id}" ${d.coins < def.price ? 'data-poor' : ''}>Desbloquear · 🪙 ${def.price}</button>
      <p class="hint">También puedes conseguir luchadores en el camino de trofeos.</p>`;
  } else {
    actions = `
      ${d.selected === id
        ? '<button class="btn btn-big" disabled>✔ Elegido</button>'
        : `<button class="btn btn-play btn-big" data-action="select" data-id="${id}">Elegir</button>`}
      ${canUpgrade
        ? `<button class="btn btn-green btn-big" data-action="upgrade" data-id="${id}" ${d.coins < cost ? 'data-poor' : ''}>Mejorar a Nv. ${c.level + 1} · 🪙 ${cost}</button>`
        : '<button class="btn btn-big" disabled>Nivel máximo</button>'}`;
  }

  return `
    <div class="screen detail">
      ${screenHeader(app, 'Luchador', 'characters')}
      <section class="detail-panel" style="--rarity:${rarity.color}">
        <div class="detail-title">
          <h2>${def.name}</h2>
          <span class="tag">${rarity.label}</span>
        </div>
        <p class="detail-sub">${def.title} · Nivel ${c.level} · 🏆 ${c.trophies}</p>
        <p class="detail-desc">${def.desc}</p>
        <div class="numbers">
          <div><small>❤ Vida</small><b>${Math.round(def.hp * mult)}${gain(def.hp)}</b></div>
          <div><small>💥 Daño</small><b>${def.attack.count > 1 ? `${def.attack.count} × ` : ''}${Math.round(def.attack.damage * mult)}${gain(def.attack.damage)}</b></div>
        </div>
        ${bars}
        <div class="skills">
          <div><small>ATAQUE</small><b>${def.attack.name}</b></div>
          <div><small>SÚPER · ${SUPER_LABEL[def.super.type]}</small><b>${def.super.name}</b></div>
        </div>
        <div class="detail-actions">${actions}</div>
      </section>
    </div>`;
}
