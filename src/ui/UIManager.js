// Gestor de pantallas del menú. Cada pantalla es una función que devuelve HTML;
// los clics se resuelven por delegación mediante atributos data-action.

import { lobbyScreen } from './screens/LobbyScreen.js';
import { charactersScreen } from './screens/CharactersScreen.js';
import { characterDetailScreen } from './screens/CharacterDetailScreen.js';
import { trophyRoadScreen } from './screens/TrophyRoadScreen.js';
import { resultsScreen } from './screens/ResultsScreen.js';

const SCREENS = {
  lobby: lobbyScreen,
  characters: charactersScreen,
  character: characterDetailScreen,
  road: trophyRoadScreen,
  results: resultsScreen,
};

export class UIManager {
  constructor(app) {
    this.app = app;
    this.root = document.getElementById('ui');
    this.current = null;
    this.params = null;

    this.root.addEventListener('click', (e) => {
      const el = e.target.closest('[data-action]');
      if (!el || !this.root.contains(el)) return;
      const handler = this.actions[el.dataset.action];
      if (handler) handler(el.dataset);
    });

    const { progression: prog, save, audio } = app;
    const click = () => audio.play('click');

    this.actions = {
      go: ({ screen, id }) => { click(); this.show(screen, id ? { id } : undefined); },
      play: () => { click(); app.startMatch(); },
      mode: ({ id }) => { click(); save.data.mode = id; save.save(); this.refresh(); },
      select: ({ id }) => {
        if (prog.select(id)) { click(); this.toast('¡Luchador elegido!'); this.show('lobby'); }
      },
      upgrade: ({ id }) => {
        if (prog.upgrade(id)) { audio.play('coin'); this.toast('¡Subió de nivel!'); } else { audio.play('error'); this.toast('No tienes suficientes monedas'); }
        this.refresh();
      },
      buy: ({ id }) => {
        if (prog.buy(id)) { audio.play('win'); this.toast('¡Nuevo luchador desbloqueado!'); } else { audio.play('error'); this.toast('No tienes suficientes monedas'); }
        this.refresh();
      },
      claim: ({ index }) => {
        const message = prog.claimRoad(Number(index));
        if (message) { audio.play('coin'); this.toast(message); }
        this.refresh();
      },
      daily: () => {
        const coins = prog.claimDaily();
        if (coins) { audio.play('coin'); this.toast(`Regalo diario: +${coins} monedas`); }
        this.refresh();
      },
      sound: () => {
        save.data.sound = audio.enabled = !audio.enabled;
        save.save();
        click();
        this.refresh();
      },
      rename: () => {
        const name = prompt('Tu nombre de jugador:', save.data.name);
        if (name && name.trim()) {
          save.data.name = name.trim().slice(0, 12);
          save.save();
          this.refresh();
        }
      },
      reset: () => {
        if (confirm('¿Borrar todo tu progreso y empezar de cero?')) {
          save.reset();
          this.show('lobby');
        }
      },
    };
  }

  show(name, params) {
    this.current = name;
    this.params = params;
    this.root.classList.remove('hidden');
    this.root.innerHTML = SCREENS[name](this.app, params);
  }

  refresh() {
    if (this.current) this.show(this.current, this.params);
  }

  hide() {
    this.current = null;
    this.root.innerHTML = '';
    this.root.classList.add('hidden');
  }

  toast(message) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }
}
