// Efectos visuales ligeros: partículas y ondas expansivas.

import * as THREE from 'three';

const MAX_PARTICLES = 320;

export class Effects {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.rings = [];
    this.geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    this.ringGeo = new THREE.RingGeometry(0.82, 1, 40);
    this.mats = new Map();
  }

  material(color) {
    if (!this.mats.has(color)) this.mats.set(color, new THREE.MeshBasicMaterial({ color }));
    return this.mats.get(color);
  }

  burst(x, y, z, color, count = 8, speed = 6) {
    for (let i = 0; i < count && this.particles.length < MAX_PARTICLES; i++) {
      const mesh = new THREE.Mesh(this.geo, this.material(color));
      mesh.position.set(x, y, z);
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.8);
      this.scene.add(mesh);
      this.particles.push({ mesh, vx: Math.cos(a) * s, vy: 2 + Math.random() * speed * 0.7, vz: Math.sin(a) * s, life: 0.35 + Math.random() * 0.35 });
    }
  }

  /** Onda expansiva sobre el suelo. */
  ring(x, z, radius, color, duration = 0.4) {
    const mesh = new THREE.Mesh(this.ringGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.12, z);
    this.scene.add(mesh);
    this.rings.push({ mesh, radius, t: 0, duration });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.vy -= 22 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y = Math.max(0.1, p.mesh.position.y + p.vy * dt);
      p.mesh.position.z += p.vz * dt;
      p.mesh.rotation.x += dt * 9;
      p.mesh.rotation.y += dt * 7;
      p.mesh.scale.setScalar(Math.max(0.01, Math.min(1, p.life * 3)));
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.t += dt;
      const k = Math.min(1, r.t / r.duration);
      r.mesh.scale.setScalar(Math.max(0.01, r.radius * (0.2 + 0.8 * k)));
      r.mesh.material.opacity = 0.9 * (1 - k);
      if (k >= 1) {
        this.scene.remove(r.mesh);
        r.mesh.material.dispose();
        this.rings.splice(i, 1);
      }
    }
  }
}
