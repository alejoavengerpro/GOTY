// Lógica de progresión: recompensas de partida, mejoras, desbloqueos y camino de trofeos.

import { CHARACTER_MAP, MAX_LEVEL, UPGRADE_COSTS } from '../data/characters.js';
import {
  SURVIVAL_REWARDS, TEAM_REWARDS, KILL_BONUS, xpForLevel, LEVEL_UP_COINS,
  TROPHY_ROAD, DUPLICATE_COINS, DAILY_REWARD,
} from '../data/progression.js';

const today = () => new Date().toISOString().slice(0, 10);

export class Progression {
  constructor(saveManager) {
    this.sm = saveManager;
  }

  get data() {
    return this.sm.data;
  }

  /** Aplica el resultado de una partida y devuelve un resumen para la pantalla de resultados. */
  applyMatchResult(result) {
    const d = this.data;
    const char = d.chars[result.characterId];
    let base;
    if (result.mode === 'survival') base = SURVIVAL_REWARDS[Math.min(result.rank - 1, SURVIVAL_REWARDS.length - 1)];
    else base = TEAM_REWARDS[result.outcome];

    const coins = base.coins + result.kills * KILL_BONUS.coins;
    const xp = base.xp + result.kills * KILL_BONUS.xp;
    const before = char.trophies;
    char.trophies = Math.max(0, char.trophies + base.trophies);

    d.coins += coins;
    d.xp += xp;
    let levelUps = 0;
    while (d.xp >= xpForLevel(d.level)) {
      d.xp -= xpForLevel(d.level);
      d.level++;
      d.coins += LEVEL_UP_COINS;
      levelUps++;
    }

    d.stats.matches++;
    d.stats.kills += result.kills;
    const won = result.mode === 'survival' ? result.rank === 1 : result.outcome === 'win';
    if (won) d.stats.wins++;
    this.sm.save();

    return { ...result, won, coins, xp, trophiesDelta: char.trophies - before, levelUps, levelUpCoins: levelUps * LEVEL_UP_COINS };
  }

  upgradeCost(id) {
    const lvl = this.data.chars[id].level;
    return lvl >= MAX_LEVEL ? null : UPGRADE_COSTS[lvl - 1];
  }

  upgrade(id) {
    const cost = this.upgradeCost(id);
    const c = this.data.chars[id];
    if (cost === null || !c.unlocked || this.data.coins < cost) return false;
    this.data.coins -= cost;
    c.level++;
    this.sm.save();
    return true;
  }

  buy(id) {
    const def = CHARACTER_MAP[id];
    const c = this.data.chars[id];
    if (c.unlocked || this.data.coins < def.price) return false;
    this.data.coins -= def.price;
    c.unlocked = true;
    this.sm.save();
    return true;
  }

  select(id) {
    if (!this.data.chars[id]?.unlocked) return false;
    this.data.selected = id;
    this.sm.save();
    return true;
  }

  /** Estado de cada hito del camino de trofeos. */
  roadStatus() {
    const total = this.sm.totalTrophies;
    return TROPHY_ROAD.map((r, i) => ({
      ...r,
      index: i,
      reached: total >= r.trophies,
      claimed: this.data.roadClaimed.includes(i),
    }));
  }

  get roadPending() {
    return this.roadStatus().filter((r) => r.reached && !r.claimed).length;
  }

  claimRoad(index) {
    const r = this.roadStatus()[index];
    if (!r || !r.reached || r.claimed) return null;
    this.data.roadClaimed.push(index);
    let message;
    if (r.unlock) {
      const c = this.data.chars[r.unlock];
      if (c.unlocked) {
        this.data.coins += DUPLICATE_COINS;
        message = `Ya tenías a ${CHARACTER_MAP[r.unlock].name}: +${DUPLICATE_COINS} monedas`;
      } else {
        c.unlocked = true;
        message = `¡Desbloqueaste a ${CHARACTER_MAP[r.unlock].name}!`;
      }
    } else {
      this.data.coins += r.coins;
      message = `+${r.coins} monedas`;
    }
    this.sm.save();
    return message;
  }

  get dailyAvailable() {
    return this.data.lastDaily !== today();
  }

  claimDaily() {
    if (!this.dailyAvailable) return 0;
    this.data.lastDaily = today();
    this.data.coins += DAILY_REWARD;
    this.sm.save();
    return DAILY_REWARD;
  }
}
