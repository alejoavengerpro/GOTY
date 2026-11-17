// Proyectiles: rectos (con rebote / perforación opcional) y bombeados (explotan en área).

import * as THREE from 'three';
import { CRATE } from '../world/Arena.js';

const sphereGeo = new THREE.SphereGeometry(1, 12, 10);
const FIGHTER_RADIUS = 0.6;

export class Projectile {
  /**
   * @param {object} match partida actual
   * @param {object} owner luchador que dispara
   * @param {number} angle dirección (0 = +Z)
   * @param {object} spec { damage, range, speed, radius, color, pierce, bounce, shape, melee, lob?: {x,z,radius} }
   */
  constructor(match, owner, angle, spec) {
    this.match = match;
    this.owner = owner;
    this.team = owner.team;
    this.spec = spec;
    this.x = owner.x + Math.sin(angle) * 0.7;
    this.z = owner.z + Math.cos(angle) * 0.7;
    this.dx = Math.sin(angle);
    this.dz = Math.cos(angle);
    this.left = spec.range;
    this.bounces = spec.bounce ?? 0;
    this.hit = new Set();
    this.alive = true;

    this.mesh = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: spec.color }));
    const r = spec.radius;
    if (spec.shape === 'bolt') this.mesh.scale.set(r * 0.7, r * 0.7, r * 3);
    else if (spec.melee) this.mesh.scale.set(r * 1.6, r * 0.5, r);
    else this.mesh.scale.setScalar(r);
    this.mesh.rotation.y = angle;
    this.mesh.position.set(this.x, 1, this.z);
    match.scene.add(this.mesh);

    if (spec.lob) {
      // Trayectoria bombeada: viaja del origen al destino ignorando obstáculos.
      this.lob = { x0: owner.x, z0: owner.z, x1: spec.lob.x, z1: spec.lob.z, t: 0 };
      this.lob.duration = Math.max(0.35, Math.hypot(this.lob.x1 - this.lob.x0, this.lob.z1 - this.lob.z0) / 14);
    }
  }

  update(dt) {
    if (this.lob) return this.updateLob(dt);
    const { arena } = this.match;
    let remaining = this.spec.speed * dt;
    while (remaining > 0 && this.alive) {
      const step = Math.min(0.35, remaining);
      remaining -= step;
      const nx = this.x + this.dx * step;
      const nz = this.z + this.dz * step;
      const cx = arena.cellX(nx), cz = arena.cellZ(nz);

      if (arena.solidCell(cx, cz)) {
        const index = arena.idx(cx, cz);
        if (arena.inBounds(cx, cz) && arena.grid[index] === CRATE) {
          this.match.damageCrate(index, this.spec.damage, this.owner);
          this.destroy(true);
          return;
        }
        if (this.bounces > 0) {
          this.bounces--;
          const hitX = arena.solidCell(cx, arena.cellZ(this.z));
          const hitZ = arena.solidCell(arena.cellX(this.x), cz);
          if (hitX || !hitZ) this.dx = -this.dx;
          if (hitZ || !hitX) this.dz = -this.dz;
          this.mesh.rotation.y = Math.atan2(this.dx, this.dz);
          continue;
        }
        this.destroy(true);
        return;
      }

      this.x = nx;
      this.z = nz;
      this.left -= step;

      for (const f of this.match.fighters) {
        if (!f.alive || f.team === this.team || this.hit.has(f)) continue;
        if (Math.hypot(f.x - this.x, f.z - this.z) < this.spec.radius + FIGHTER_RADIUS) {
          this.hit.add(f);
          this.match.damageFighter(f, this.spec.damage, this.owner, !this.spec.isSuper);
          if (!this.spec.pierce) {
            this.destroy(true);
            return;
          }
        }
      }
      if (this.left <= 0) this.destroy(false);
    }
    this.mesh.position.set(this.x, 1, this.z);
  }

  updateLob(dt) {
    const l = this.lob;
    l.t += dt / l.duration;
    const t = Math.min(1, l.t);
    this.x = l.x0 + (l.x1 - l.x0) * t;
    this.z = l.z0 + (l.z1 - l.z0) * t;
    this.mesh.position.set(this.x, 1 + Math.sin(t * Math.PI) * 5, this.z);
    if (t >= 1) {
      this.match.explode(this.x, this.z, this.spec.lob.radius, this.spec.damage, this.owner, this.spec.color);
      this.destroy(false);
    }
  }

  destroy(impact) {
    if (!this.alive) return;
    this.alive = false;
    if (impact) this.match.effects.burst(this.x, 1, this.z, this.spec.color, 5, 4);
    this.match.scene.remove(this.mesh);
    this.mesh.material.dispose();
  }
}
