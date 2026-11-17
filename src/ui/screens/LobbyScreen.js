// Pantalla principal: perfil, luchador elegido, selector de modo y botón de jugar.

import { CHARACTER_MAP, RARITY } from '../../data/characters.js';
import { MODES } from '../../data/modes.js';
import { xpForLevel } from '../../data/progression.js';
import { currencyBar, escapeHtml } from './shared.js';

export function lobbyScreen(app) {
  const d = app.save.data;
  const def = CHARACTER_MAP[d.selected];
  const char = d.chars[d.selected];
  const prog = app.progression;
  app.menu.setCharacter(d.selected);
  app.menu.setOffset(0);

  const modes = Object.values(MODES).map((m) => `
    <button class="mode-card ${m.id === d.mode ? 'active' : ''}" data-action="mode" data-id="${m.id}">
      <span class="mode-icon">${m.icon}</span>
      <span class="mode-text"><b>${m.name}</b><small>${m.desc}</small></span>
    </button>`).join('');

  const pending = prog.roadPending;
  return `
    <div class="screen lobby">
      <header class="topbar">
        <button class="profile" data-action="rename" title="Cambiar nombre">
          <span class="profile-level">${d.level}</span>
          <span class="profile-info">
            <b>${escapeHtml(d.name)} ✎</b>
            <span class="xpbar"><i style="width:${Math.round((d.xp / xpForLevel(d.level)) * 100)}%"></i></span>
            <small>${d.xp} / ${xpForLevel(d.level)} XP</small>
          </span>
        </button>
        <div class="logo">JARANA<span>ARENA</span></div>
        ${currencyBar(app)}
      </header>

      <nav class="side-menu">
        <button class="btn" data-action="go" data-screen="characters">🧑‍🤝‍🧑 Luchadores</button>
        <button class="btn" data-action="go" data-screen="road">🏆 Camino de trofeos ${pending ? `<span class="badge">${pending}</span>` : ''}</button>
        ${prog.dailyAvailable ? '<button class="btn btn-green" data-action="daily">🎁 Regalo diario</button>' : ''}
        <button class="btn btn-small" data-action="sound">${d.sound ? '🔊 Sonido' : '🔇 Silencio'}</button>
      </nav>

      <button class="hero-card" data-action="go" data-screen="character" data-id="${def.id}">
        <b style="color:${RARITY[def.rarity].color}">${def.name}</b>
        <small>${def.title}</small>
        <span>Nivel ${char.level} · 🏆 ${char.trophies}</span>
      </button>

      <footer class="lobby-bottom">
        <div class="modes">${modes}</div>
        <button class="btn btn-play" data-action="play">¡JUGAR!</button>
      </footer>
    </div>`;
}
