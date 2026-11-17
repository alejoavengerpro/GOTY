// Tablas de progresión: recompensas por partida, niveles de cuenta y camino de trofeos.

/** Recompensas de Supervivencia según el puesto (índice 0 = primer lugar). */
export const SURVIVAL_REWARDS = [
  { trophies: 10, coins: 50, xp: 70 },
  { trophies: 8, coins: 40, xp: 55 },
  { trophies: 6, coins: 32, xp: 45 },
  { trophies: 4, coins: 26, xp: 38 },
  { trophies: 2, coins: 20, xp: 30 },
  { trophies: 0, coins: 16, xp: 25 },
  { trophies: -1, coins: 12, xp: 20 },
  { trophies: -2, coins: 10, xp: 16 },
  { trophies: -3, coins: 8, xp: 12 },
  { trophies: -4, coins: 6, xp: 10 },
];

export const TEAM_REWARDS = {
  win: { trophies: 8, coins: 40, xp: 60 },
  draw: { trophies: 0, coins: 20, xp: 30 },
  loss: { trophies: -4, coins: 12, xp: 18 },
};

/** Bonus por cada KO conseguido en la partida. */
export const KILL_BONUS = { coins: 3, xp: 5 };

/** XP necesaria para pasar del nivel de cuenta `level` al siguiente. */
export const xpForLevel = (level) => 100 + 60 * (level - 1);
export const LEVEL_UP_COINS = 50;
export const DAILY_REWARD = 60;

/** Camino de trofeos: recompensas al alcanzar cierto total de trofeos. */
export const TROPHY_ROAD = [
  { trophies: 15, coins: 60 },
  { trophies: 35, unlock: 'cumbia' },
  { trophies: 60, coins: 120 },
  { trophies: 100, unlock: 'crack' },
  { trophies: 150, coins: 200 },
  { trophies: 210, unlock: 'brasa' },
  { trophies: 280, coins: 300 },
  { trophies: 360, unlock: 'mascara' },
  { trophies: 450, coins: 500 },
  { trophies: 600, unlock: 'brillo' },
];
/** Monedas de compensación si la recompensa desbloquea un personaje que ya tienes. */
export const DUPLICATE_COINS = 150;
