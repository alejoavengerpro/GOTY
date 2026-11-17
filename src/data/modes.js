// Modos de juego, temas visuales de arena y nombres de los bots.

export const MODES = {
  survival: {
    id: 'survival',
    name: 'Supervivencia',
    icon: '💀',
    desc: '10 luchadores, todos contra todos. Rompe cajas, hazte fuerte y escapa de la neblina.',
    cols: 33,
    rows: 33,
    fighters: 10,
    crates: true,
  },
  team: {
    id: 'team',
    name: 'Pichanga 3v3',
    icon: '⚽',
    desc: 'Dos equipos de 3. Gana el primero en lograr 8 KOs o el que vaya arriba a los 2 minutos.',
    cols: 21,
    rows: 29,
    fighters: 6,
    crates: false,
    targetScore: 8,
    duration: 120,
    respawn: 3,
  },
};

export const THEMES = [
  { name: 'Costa Verde', floorA: '#e9c98a', floorB: '#e2bf7c', wall: 0xc8553d, outside: 0x3a86c8, sky: 0x8fd3ff, bush: 0x4caf50 },
  { name: 'Plaza de la Sierra', floorA: '#8fc46a', floorB: '#86bb61', wall: 0x8d8d99, outside: 0x4a7a3a, sky: 0xbfe8ff, bush: 0x2e8b57 },
  { name: 'Mercado Nocturno', floorA: '#6c6f93', floorB: '#666990', wall: 0xf4a261, outside: 0x22223b, sky: 0x2b2d5b, bush: 0x52b788 },
];

export const BOT_NAMES = [
  'Causa99', 'Chato', 'Pataza', 'Chibolo', 'Mostro', 'Chochera', 'Flaca', 'Wawita',
  'Churre', 'Jato', 'Calichín', 'Yunta', 'Brócoli', 'Pulpín', 'Cañita', 'Bacán',
];
