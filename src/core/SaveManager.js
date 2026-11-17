// Guardado del progreso del jugador en localStorage.

import { CHARACTERS, STARTERS } from '../data/characters.js';

const KEY = 'jarana-arena-save-v1';

function defaultSave() {
  const chars = {};
  for (const c of CHARACTERS) {
    chars[c.id] = { unlocked: STARTERS.includes(c.id), level: 1, trophies: 0 };
  }
  return {
    name: 'Jugador',
    coins: 100,
    xp: 0,
    level: 1,
    selected: STARTERS[0],
    mode: 'survival',
    chars,
    roadClaimed: [],
    lastDaily: '',
    sound: true,
    stats: { matches: 0, wins: 0, kills: 0 },
  };
}

export class SaveManager {
  constructor() {
    this.data = defaultSave();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const loaded = JSON.parse(raw);
        // Fusiona con los valores por defecto para tolerar versiones antiguas / personajes nuevos.
        this.data = { ...this.data, ...loaded, chars: { ...this.data.chars, ...loaded.chars }, stats: { ...this.data.stats, ...loaded.stats } };
      }
    } catch {
      /* guardado corrupto o almacenamiento no disponible: se empieza de cero */
    }
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* sin almacenamiento disponible */
    }
  }

  reset() {
    this.data = defaultSave();
    this.save();
  }

  get totalTrophies() {
    return Object.values(this.data.chars).reduce((sum, c) => sum + c.trophies, 0);
  }
}
