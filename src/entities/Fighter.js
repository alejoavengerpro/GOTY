// Luchador: estado de combate, movimiento, ataque, súper y representación visual.
// Lo controla un "controller" (jugador o bot) que devuelve una intención cada frame.

import * as THREE from 'three';
import { levelMultiplier } from '../data/characters.js';
import { buildCharacterModel, animateModel } from '../characters/ModelFactory.js';
import { BUSH } from '../world/Arena.js';
import { angleLerp, clamp } from '../utils/math.js';

export const FIGHTER_RADIUS = 0.55;
const MAX_AMMO = 3;
const ATTACK_COOLDOWN = 0.3;
const REGEN_DELAY = 3;
const REGEN_RATE = 0.13;
const CUBE_BONUS = 0.1;
const TEAM_COLORS = { self: 0x3ddc84, ally: 0x4db4ff, enemy: 0xff4d4d };

export class Fighter {
  constructor(match, { def, level, team, isPlayer = false, name, controller, relation }) {
    this.match = match;
    this.def = def;
    this.level = level;
    this.team = team;
    this.isPlayer = isPlayer;
    this.name = name;
    this.controller = controller;
    this.relation = relation; // 'self' | 'ally' | 'enemy' (respecto al jugador)

    this.mult = levelMultiplier(level);
    this.baseHp = Math.round(def.hp * this.mult);
    this.maxHp = this.baseHp;
    this.hp = this.maxHp;
    this.cubes = 0;
    this.x = 0;
    this.z = 0;
    this.angle = 0;
    this.ammo = MAX_AMMO;
    this.superCharge = 0;
    this.alive = true;
    this.kills = 0;
    this.attackCd = 0;
    this.attackAnim = 0;
    this.faceAimT = 0;
    this.noCombatT = 0;
    this.revealT = 0;
    this.invulnT = 0;
    this.speedBoostT = 0;
    this.speedMult = 1;
    this.respawnT = 0;
    this.moving = 0;
    this.animT = Math.random() * 10;
    this.dash = null;
    this.queue = []; // disparos programados: { delay, angle, spec }
    this.inBush = false;
    this.visible = true;

    this.buildVisuals();
  }

  get damageMult() {
    return this.mult * (1 + CUBE_BONUS * this.cubes);
  }

  // ---------- Visuales ----------
  buildVisuals() {
    const color = TEAM_COLORS[this.relation];
    this.group = new THREE.Group();
    this.model = buildCharacterModel(this.def.look);
    this.group.add(this.model);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.7, 0.95, 32),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;
    this.group.add(ring);

    // Cartel flotante: nombre, vida, munición y cubos de poder
    this.labelCanvas = document.createElement('canvas');
    this.labelCanvas.width = 256;
    this.labelCanvas.height = 96;
    this.labelTex = new THREE.CanvasTexture(this.labelCanvas);
    this.labelTex.colorSpace = THREE.SRGBColorSpace;
    this.label = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.labelTex, depthTest: false, transparent: true }));
    this.label.scale.set(3.4, 1.275, 1);
    this.label.position.y = 3.35;
    this.label.renderOrder = 10;
    this.group.add(this.label);
    this.labelKey = '';

    this.match.scene.add(this.group);
  }

  drawLabel() {
    const hpShown = Math.ceil(this.hp / 10) * 10;
    const key = `${hpShown}|${Math.floor(this.ammo * 8)}|${this.cubes}|${this.maxHp}`;
    if (key === this.labelKey) return;
    this.labelKey = key;
    const g = this.labelCanvas.getContext('2d');
    const W = 256;
    g.clearRect(0, 0, W, 96);
    g.textAlign = 'center';
    g.lineJoin = 'round';
    g.font = '900 24px system-ui, sans-serif';
    g.lineWidth = 6;
    g.strokeStyle = '#111';
    const title = this.cubes > 0 ? `${this.name} ⚡${this.cubes}` : this.name;
    g.strokeText(title, W / 2, 26);
    g.fillStyle = '#fff';
    g.fillText(title, W / 2, 26);

    // Barra de vida
    const css = { self: '#3ddc84', ally: '#4db4ff', enemy: '#ff4d4d' }[this.relation];
    g.fillStyle = '#111';
    g.fillRect(28, 36, 200, 28);
    g.fillStyle = '#3a3a48';
    g.fillRect(32, 40, 192, 20);
    g.fillStyle = css;
    g.fillRect(32, 40, 192 * clamp(this.hp / this.maxHp, 0, 1), 20);
    g.font = '900 19px system-ui, sans-serif';
    g.lineWidth = 4;
    g.strokeText(String(hpShown), W / 2, 57);
    g.fillStyle = '#fff';
    g.fillText(String(hpShown), W / 2, 57);

    // Munición (solo se muestra la propia)
    if (this.isPlayer) {
      for (let i = 0; i < MAX_AMMO; i++) {
        const x = 28 + i * 68;
        g.fillStyle = '#111';
        g.fillRect(x, 68, 64, 16);
        g.fillStyle = '#5a3d00';
        g.fillRect(x + 3, 71, 58, 10);
        g.fillStyle = this.ammo >= i + 1 ? '#ff9f1c' : '#b36b00';
        g.fillRect(x + 3, 71, 58 * clamp(this.ammo - i, 0, 1), 10);
      }
    }
    this.labelTex.needsUpdate = true;
  }

  // ---------- Ciclo de vida ----------
  placeAt(x, z) {
    this.x = x;
    this.z = z;
    this.group.position.set(x, 0, z);
  }

  respawn(x, z) {
    this.alive = true;
    this.hp = this.maxHp;
    this.ammo = MAX_AMMO;
    this.invulnT = 2;
    this.dash = null;
    this.queue.length = 0;
    this.speedBoostT = 0;
    this.speedMult = 1;
    this.group.visible = true;
    this.model.scale.setScalar(1);
    this.placeAt(x, z);
  }

  update(dt) {
    if (!this.alive) return;
    const { arena } = this.match;
    const intent = this.controller.getIntent(this.match, this, dt);

    this.attackCd -= dt;
    this.attackAnim = Math.max(0, this.attackAnim - dt * 5);
    this.faceAimT -= dt;
    this.noCombatT += dt;
    this.revealT -= dt;
    this.invulnT -= dt;
    if (this.speedBoostT > 0) {
      this.speedBoostT -= dt;
      if (this.speedBoostT <= 0) this.speedMult = 1;
    }

    if (this.dash) {
      this.updateDash(dt);
    } else {
      let { mx, mz } = intent;
      const len = Math.hypot(mx, mz);
      if (len > 1) { mx /= len; mz /= len; }
      const speed = this.def.speed * this.speedMult;
      arena.move(this, mx * speed * dt, mz * speed * dt, FIGHTER_RADIUS);
      this.moving = Math.min(1, len);
      if (len > 0.1 && this.faceAimT <= 0) this.angle = angleLerp(this.angle, Math.atan2(mx, mz), Math.min(1, dt * 14));

      if (intent.fire) this.tryAttack(intent.aim);
      if (intent.super) this.trySuper(intent.aim, intent.point);
    }

    // Recarga y regeneración fuera de combate
    if (this.ammo < MAX_AMMO) this.ammo = Math.min(MAX_AMMO, this.ammo + dt / this.def.attack.reload);
    if (this.noCombatT > REGEN_DELAY && this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + this.maxHp * REGEN_RATE * dt);

    // Disparos programados (ráfagas)
    for (let i = this.queue.length - 1; i >= 0; i--) {
      const q = this.queue[i];
      q.delay -= dt;
      if (q.delay <= 0) {
        this.match.spawnProjectile(this, q.angle ?? this.angle, q.spec);
        this.queue.splice(i, 1);
      }
    }

    this.inBush = arena.kindAt(this.x, this.z) === BUSH;
    this.animT += dt;
    animateModel(this.model, this.animT, this.moving, this.attackAnim);
    this.group.position.set(this.x, this.dash?.jump ? Math.sin(this.dash.progress * Math.PI) * 3 : 0, this.z);
    this.model.rotation.y = this.angle;
    // Parpadeo mientras es invulnerable tras reaparecer
    this.model.visible = this.invulnT <= 0 || Math.floor(this.invulnT * 12) % 2 === 0;
    this.drawLabel();
  }

  // ---------- Combate ----------
  tryAttack(angle) {
    if (this.ammo < 1 || this.attackCd > 0) return false;
    const a = this.def.attack;
    this.ammo -= 1;
    this.attackCd = ATTACK_COOLDOWN;
    this.faceTo(angle);
    this.engage();
    const spec = { ...a, damage: a.damage * this.damageMult };
    for (let i = 0; i < a.count; i++) {
      const offset = a.count > 1 ? (i / (a.count - 1) - 0.5) * a.spread : 0;
      this.queue.push({ delay: a.burst ? i * a.burst : 0, angle: angle + offset, spec });
    }
    this.match.sound('shoot', this);
    return true;
  }

  trySuper(angle, point) {
    if (this.superCharge < 1) return false;
    const s = this.def.super;
    this.superCharge = 0;
    this.faceTo(angle);
    this.engage();
    this.match.sound('super', this);
    this.match.effects.ring(this.x, this.z, 2, 0xffe066);

    if (s.type === 'dash') {
      this.dash = { dx: Math.sin(angle), dz: Math.cos(angle), left: s.distance, total: s.distance, progress: 0, hit: new Set(), jump: !!s.jump };
    } else if (s.type === 'barrage') {
      const spec = { ...s, damage: s.damage * this.damageMult, isSuper: true };
      for (let i = 0; i < s.count; i++) {
        const offset = s.count > 1 ? (Math.random() - 0.5) * s.spread : 0;
        this.queue.push({ delay: s.count > 1 ? (i / s.count) * s.duration : 0, angle: angle + offset, spec });
      }
    } else if (s.type === 'blast') {
      // El punto objetivo se limita al alcance máximo.
      let tx = point ? point.x - this.x : Math.sin(angle) * s.range;
      let tz = point ? point.z - this.z : Math.cos(angle) * s.range;
      const d = Math.hypot(tx, tz);
      if (d > s.range) { tx *= s.range / d; tz *= s.range / d; }
      const spec = { damage: s.damage * this.damageMult, radius: 0.5, color: s.color, range: s.range, speed: 0, isSuper: true, lob: { x: this.x + tx, z: this.z + tz, radius: s.radius } };
      this.queue.push({ delay: 0, angle, spec });
    } else if (s.type === 'heal') {
      const targets = s.radius > 0
        ? this.match.fighters.filter((f) => f.alive && f.team === this.team && Math.hypot(f.x - this.x, f.z - this.z) <= s.radius)
        : [this];
      for (const f of targets) {
        f.heal(f.maxHp * s.heal);
        f.speedMult = s.speedBoost;
        f.speedBoostT = s.duration;
        this.match.effects.burst(f.x, 1.5, f.z, 0x7bffb0, 14, 5);
      }
      if (s.radius > 0) this.match.effects.ring(this.x, this.z, s.radius, 0x7bffb0, 0.6);
    }
    return true;
  }

  updateDash(dt) {
    const s = this.def.super;
    const d = this.dash;
    const step = Math.min(d.left, s.speed * dt);
    // En salto se vuela por encima de los muros (pero se aterriza en casilla libre).
    const { arena } = this.match;
    let moved;
    if (d.jump) {
      const nx = this.x + d.dx * step, nz = this.z + d.dz * step;
      const inside = Math.abs(nx) < arena.width / 2 - 1 && Math.abs(nz) < arena.depth / 2 - 1;
      if (inside) { this.x = nx; this.z = nz; moved = step; } else moved = 0;
    } else {
      moved = arena.move(this, d.dx * step, d.dz * step, FIGHTER_RADIUS);
    }
    d.left -= step;
    d.progress = 1 - d.left / d.total;
    this.moving = 1;

    if (!d.jump) {
      for (const f of this.match.fighters) {
        if (!f.alive || f.team === this.team || d.hit.has(f)) continue;
        if (Math.hypot(f.x - this.x, f.z - this.z) < 1.5) {
          d.hit.add(f);
          this.match.damageFighter(f, s.damage * this.damageMult, this, false);
        }
      }
    }

    if (d.left <= 0.001 || moved < step * 0.3) {
      this.dash = null;
      if (d.jump) this.unstick();
      if (s.aoe) this.match.explode(this.x, this.z, s.aoe, (s.aoeDamage ?? s.damage * 0.5) * this.damageMult, this, 0xffe066);
    }
  }

  /** Si un salto termina dentro de un muro, mueve al luchador a la casilla libre más cercana. */
  unstick() {
    const { arena } = this.match;
    if (!arena.collides(this.x, this.z, FIGHTER_RADIUS)) return;
    for (let r = 0.5; r < 8; r += 0.5) {
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
        const x = this.x + Math.cos(a) * r, z = this.z + Math.sin(a) * r;
        if (!arena.collides(x, z, FIGHTER_RADIUS)) { this.x = x; this.z = z; return; }
      }
    }
  }

  faceTo(angle) {
    this.angle = angle;
    this.faceAimT = 0.35;
    this.attackAnim = 1;
  }

  /** Marca entrada en combate: corta la regeneración y revela al luchador si está en un arbusto. */
  engage() {
    this.noCombatT = 0;
    this.revealT = 1.2;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  addCube() {
    this.cubes++;
    const bonus = Math.round(this.baseHp * CUBE_BONUS);
    this.maxHp += bonus;
    this.hp += bonus;
  }

  chargeSuper(damage) {
    const before = this.superCharge;
    this.superCharge = Math.min(1, this.superCharge + damage / (this.def.superNeed * this.mult));
    if (before < 1 && this.superCharge >= 1 && this.isPlayer) this.match.sound('ready', this);
  }

  /** Aplica daño. Devuelve true si el luchador muere. */
  takeDamage(amount) {
    if (!this.alive || this.invulnT > 0) return false;
    this.hp -= amount;
    this.engage();
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.dash = null;
      this.queue.length = 0;
      this.group.visible = false;
      return true;
    }
    return false;
  }

  dispose() {
    this.match.scene.remove(this.group);
    this.labelTex.dispose();
  }
}
