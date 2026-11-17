// Inteligencia artificial de los bots: elige objetivo, se mueve con búsqueda de caminos,
// dispara con margen de error, huye con poca vida y evita la neblina.

import { rand, dist, clamp } from '../utils/math.js';

export class BotController {
  /** @param {number} skill 0..1, mejora puntería y reacción */
  constructor(skill = 0.3) {
    this.skill = skill;
    this.path = [];
    this.repathT = rand(0, 0.4);
    this.fireT = rand(0.5, 1.2);
    this.strafeDir = Math.random() < 0.5 ? 1 : -1;
    this.strafeT = rand(1, 2.5);
    this.wander = null;
    this.intent = { mx: 0, mz: 0, aim: 0, fire: false, super: false, point: null };
  }

  getIntent(match, f, dt) {
    const it = this.intent;
    it.mx = it.mz = 0;
    it.fire = it.super = false;
    it.point = null;
    const arena = match.arena;
    const range = f.def.attack.range;

    const target = match.nearestEnemy(f, true);
    const td = target ? dist(f.x, f.z, target.x, target.z) : Infinity;
    const los = target ? arena.lineClear(f.x, f.z, target.x, target.z) : false;

    // ----- Decidir a dónde ir -----
    let goal = null;
    let strafe = false;
    const zone = match.zone;
    const centerDist = Math.hypot(f.x, f.z);
    if (zone && centerDist > zone.radius - 3) {
      goal = { x: 0, z: 0 }; // prioridad: salir de la neblina
    } else if (target && f.hp / f.maxHp < 0.32 && td < range + 3) {
      // Huir en dirección opuesta al enemigo
      const k = 8 / Math.max(td, 0.1);
      goal = {
        x: clamp(f.x + (f.x - target.x) * k, -arena.width / 2 + 2, arena.width / 2 - 2),
        z: clamp(f.z + (f.z - target.z) * k, -arena.depth / 2 + 2, arena.depth / 2 - 2),
      };
    } else if (target) {
      if (td > range * 0.75 || !los) goal = target;
      else strafe = true;
    } else {
      goal = this.idleGoal(match, f);
    }

    // ----- Movimiento -----
    if (strafe) {
      this.strafeT -= dt;
      if (this.strafeT <= 0) { this.strafeDir *= -1; this.strafeT = rand(0.8, 2.2); }
      const dx = (target.x - f.x) / td, dz = (target.z - f.z) / td;
      // Perpendicular al enemigo, alejándose un poco si está demasiado cerca.
      const back = td < range * 0.45 ? -0.7 : 0;
      it.mx = -dz * this.strafeDir + dx * back;
      it.mz = dx * this.strafeDir + dz * back;
    } else if (goal) {
      this.repathT -= dt;
      if (this.repathT <= 0 || this.path.length === 0) {
        this.path = arena.findPath(f.x, f.z, goal.x, goal.z);
        this.repathT = rand(0.35, 0.6);
      }
      while (this.path.length && dist(f.x, f.z, this.path[0].x, this.path[0].z) < 0.6) this.path.shift();
      const next = this.path[0];
      if (next) {
        const d = dist(f.x, f.z, next.x, next.z) || 1;
        it.mx = (next.x - f.x) / d;
        it.mz = (next.z - f.z) / d;
      }
    }

    // ----- Disparo -----
    this.fireT -= dt;
    if (target && los && td < range * 0.95) {
      // Apunta con algo de anticipación y un error que disminuye con la habilidad.
      const error = (Math.random() - 0.5) * (0.5 - this.skill * 0.35);
      it.aim = Math.atan2(target.x - f.x, target.z - f.z) + error;
      it.point = target;
      if (f.superCharge >= 1 && this.fireT <= 0.2) it.super = true;
      else if (this.fireT <= 0 && f.ammo >= 1) {
        it.fire = true;
        this.fireT = rand(0.75, 1.5) - this.skill * 0.6;
      }
    } else if (!target && this.crate && this.fireT <= 0 && f.ammo >= 2) {
      // Sin enemigos a la vista: romper la caja más cercana.
      const c = this.crate;
      if (dist(f.x, f.z, c.x, c.z) < range * 0.9 && arena.lineClear(f.x, f.z, c.x, c.z, arena.idx(c.cx, c.cz))) {
        it.aim = Math.atan2(c.x - f.x, c.z - f.z);
        it.fire = true;
        this.fireT = 0.5;
      }
    }
    return it;
  }

  /** Objetivo cuando no hay enemigos visibles: cubos de poder, cajas o deambular. */
  idleGoal(match, f) {
    this.crate = null;
    let best = null, bestD = 14;
    for (const p of match.pickups) {
      const d = dist(f.x, f.z, p.x, p.z);
      if (d < bestD) { best = p; bestD = d; }
    }
    if (best) return best;

    bestD = 18;
    for (const c of match.arena.crates.values()) {
      const d = dist(f.x, f.z, c.x, c.z);
      if (d < bestD && (!match.zone || Math.hypot(c.x, c.z) < match.zone.radius - 4)) { this.crate = c; bestD = d; }
    }
    if (this.crate) return this.crate;

    if (!this.wander || dist(f.x, f.z, this.wander.x, this.wander.z) < 2) {
      const maxR = match.zone ? Math.max(2, match.zone.radius - 5) : Math.min(match.arena.width, match.arena.depth) / 2 - 3;
      const a = rand(0, Math.PI * 2), r = rand(0, maxR);
      this.wander = { x: Math.cos(a) * r, z: Math.sin(a) * r };
    }
    return this.wander;
  }
}
