// Definición de todos los luchadores. Son personajes ORIGINALES inspirados en
// arquetipos de la cultura popular peruana (no representan a personas reales).
//
// attack: disparo básico (consume 1 de 3 cargas de munición)
// super:  habilidad especial que se carga haciendo daño
//   - dash:    embestida que daña a quien toque
//   - barrage: ráfaga de proyectiles
//   - blast:   proyectil bombeado que explota en área
//   - heal:    curación + aumento de velocidad

export const RARITY = {
  comun: { label: 'Común', color: '#7bd66b' },
  raro: { label: 'Raro', color: '#4db4ff' },
  epico: { label: 'Épico', color: '#c06bff' },
  legendario: { label: 'Legendario', color: '#ffd23e' },
};

export const MAX_LEVEL = 9;
/** Monedas necesarias para subir AL nivel índice+2 (nivel 2, 3, ... 9). */
export const UPGRADE_COSTS = [30, 60, 100, 160, 240, 340, 460, 600];
/** Multiplicador de vida y daño según nivel. */
export const levelMultiplier = (level) => 1 + 0.1 * (level - 1);

export const CHARACTERS = [
  {
    id: 'combi',
    name: 'Tío Combi',
    title: 'Cobrador de combi',
    rarity: 'comun',
    price: 0,
    desc: '"¡Sube, sube, que hay sitio!" Reparte sencillo a corta distancia y embiste como combi en hora punta.',
    hp: 5600,
    speed: 6.3,
    superNeed: 4200,
    attack: { name: 'Lluvia de sencillo', damage: 380, count: 5, spread: 0.55, range: 6.5, speed: 22, reload: 1.5, radius: 0.2, color: 0xffd23e },
    super: { name: 'Hora punta', type: 'dash', distance: 10, speed: 30, damage: 1300, aoe: 2.2 },
    look: { skin: 0xc68642, shirt: 0x2a9d8f, pants: 0x264653, bulk: 1.2, head: 'cap', headColor: 0xe63946, item: 'coins' },
  },
  {
    id: 'chef',
    name: 'Chef Limón',
    title: 'Maestro cevichero',
    rarity: 'comun',
    price: 0,
    desc: 'Lanza limones con precisión de cocinero y sirve una leche de tigre que explota en área.',
    hp: 3800,
    speed: 6.8,
    superNeed: 4000,
    attack: { name: 'Limonazo', damage: 920, count: 1, spread: 0, range: 9.5, speed: 21, reload: 1.3, radius: 0.32, color: 0xb5e61d },
    super: { name: 'Leche de tigre', type: 'blast', range: 10, damage: 1900, radius: 3.6, color: 0xfff1a8 },
    look: { skin: 0xe0ac69, shirt: 0xf8f9fa, pants: 0x343a40, bulk: 1.05, head: 'chef', headColor: 0xffffff, item: 'spoon' },
  },
  {
    id: 'pixelina',
    name: 'Pixelina',
    title: 'Streamer gamer',
    rarity: 'comun',
    price: 0,
    desc: 'Francotiradora del chat. Sus donaciones pegan fuerte de lejos, pero aguanta poco.',
    hp: 3000,
    speed: 6.8,
    superNeed: 4200,
    attack: { name: 'Donación', damage: 1300, count: 1, spread: 0, range: 13, speed: 34, reload: 1.9, radius: 0.18, color: 0xb388ff, shape: 'bolt' },
    super: { name: 'Spam del chat', type: 'barrage', count: 9, duration: 0.9, spread: 0.22, damage: 560, range: 13, speed: 34, radius: 0.18, color: 0xff6bd6, shape: 'bolt' },
    look: { skin: 0xf1c27d, shirt: 0x7b2cbf, pants: 0x240046, bulk: 0.9, head: 'headphones', headColor: 0xff6bd6, item: 'phone' },
  },
  {
    id: 'cumbia',
    name: 'Reina Cumbia',
    title: 'Cantante de cumbia',
    rarity: 'raro',
    price: 250,
    desc: 'Sus ondas de sonido atraviesan rivales y su estribillo cura a todo el equipo.',
    hp: 3700,
    speed: 6.9,
    superNeed: 3600,
    attack: { name: 'Coro pegajoso', damage: 480, count: 3, spread: 0.36, range: 7.5, speed: 18, reload: 1.3, radius: 0.34, color: 0xff8fab, pierce: true },
    super: { name: 'El estribillo', type: 'heal', heal: 0.45, radius: 6.5, speedBoost: 1.35, duration: 4 },
    look: { skin: 0xd9a066, shirt: 0xff006e, pants: 0xffbe0b, bulk: 0.95, head: 'hairLong', headColor: 0x2b1b12, item: 'mic' },
  },
  {
    id: 'crack',
    name: 'El Crack',
    title: 'Futbolista de barrio',
    rarity: 'raro',
    price: 400,
    desc: 'Sus pelotazos rebotan en las paredes. Su chalaca atraviesa todo lo que encuentra.',
    hp: 4200,
    speed: 7.4,
    superNeed: 4000,
    attack: { name: 'Pelotazo', damage: 1000, count: 1, spread: 0, range: 11, speed: 22, reload: 1.4, radius: 0.36, color: 0xffffff, bounce: 2 },
    super: { name: 'Chalaca', type: 'barrage', count: 1, duration: 0, spread: 0, damage: 2300, range: 14, speed: 30, radius: 0.8, color: 0xffd23e, pierce: true, bounce: 1 },
    look: { skin: 0x8d5524, shirt: 0xffffff, pants: 0xffffff, bulk: 1.0, head: 'spiky', headColor: 0x1b1b1b, item: 'ball', sash: 0xd90429 },
  },
  {
    id: 'brasa',
    name: 'Doña Brasa',
    title: 'Reina del anticucho',
    rarity: 'epico',
    price: 600,
    desc: 'Dispara palitos de anticucho en ráfaga y abanica las brasas en un cono de fuego.',
    hp: 4000,
    speed: 6.7,
    superNeed: 3800,
    attack: { name: 'Palitos al toque', damage: 430, count: 3, spread: 0.06, burst: 0.09, range: 10, speed: 27, reload: 1.5, radius: 0.16, color: 0xff7b00, shape: 'bolt' },
    super: { name: 'Abanico de brasas', type: 'barrage', count: 14, duration: 0.5, spread: 0.75, damage: 430, range: 8, speed: 22, radius: 0.26, color: 0xff3c00 },
    look: { skin: 0xb9773f, shirt: 0xe76f51, pants: 0x6d597a, bulk: 1.15, head: 'bun', headColor: 0x3a2a20, item: 'skewer', apron: 0xfff3e0 },
  },
  {
    id: 'mascara',
    name: 'Máscara Inka',
    title: 'Ídolo del cachascán',
    rarity: 'epico',
    price: 900,
    desc: 'Tanque cuerpo a cuerpo. Vuela desde la tercera cuerda y aplasta a quien esté cerca.',
    hp: 6400,
    speed: 7.0,
    superNeed: 3800,
    attack: { name: 'Manazo', damage: 720, count: 3, spread: 0.9, range: 3.2, speed: 24, reload: 0.9, radius: 0.4, color: 0xffe066, melee: true },
    super: { name: 'Tercera cuerda', type: 'dash', distance: 11, speed: 26, damage: 900, aoe: 3.4, aoeDamage: 1500, jump: true },
    look: { skin: 0xa86b3c, shirt: 0xd00000, pants: 0xffba08, bulk: 1.35, head: 'mask', headColor: 0xffba08, item: 'gloves' },
  },
  {
    id: 'brillo',
    name: 'Brillo',
    title: 'Influencer viral',
    rarity: 'legendario',
    price: 1200,
    desc: 'Veloz como un trend. Dispara likes dobles y su filtro la cura y la acelera.',
    hp: 3300,
    speed: 8.2,
    superNeed: 3200,
    attack: { name: 'Doble like', damage: 640, count: 2, spread: 0.12, range: 7.5, speed: 28, reload: 1.0, radius: 0.24, color: 0xff4d6d },
    super: { name: 'Filtro viral', type: 'heal', heal: 0.35, radius: 0, speedBoost: 1.6, duration: 5 },
    look: { skin: 0xf1c27d, shirt: 0x00f5d4, pants: 0xf15bb5, bulk: 0.88, head: 'ponytail', headColor: 0xfee440, item: 'ringlight' },
  },
];

export const CHARACTER_MAP = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));
export const STARTERS = CHARACTERS.filter((c) => c.price === 0).map((c) => c.id);

/** Estadísticas normalizadas (0..1) para las barras de la pantalla de personaje. */
export function statBars(def) {
  const dps = (def.attack.damage * def.attack.count) / def.attack.reload;
  return [
    { label: 'Vida', value: def.hp / 6500 },
    { label: 'Daño', value: dps / 1700 },
    { label: 'Alcance', value: def.attack.range / 13 },
    { label: 'Velocidad', value: (def.speed - 5) / 3.4 },
  ];
}
