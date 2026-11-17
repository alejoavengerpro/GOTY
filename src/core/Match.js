// Una partida: crea la arena y los luchadores, y coordina combate, reglas del modo,
// cámara y efectos. Al terminar entrega el resultado a la aplicación.

import * as THREE from 'three';
import { CHARACTERS, CHARACTER_MAP } from '../data/characters.js';
import { MODES, THEMES, BOT_NAMES } from '../data/modes.js';
import { Arena } from '../world/Arena.js';
import { Fighter } from '../entities/Fighter.js';
import { Projectile } from '../entities/Projectile.js';
import { BotController } from '../ai/BotController.js';
import { PlayerController } from './PlayerController.js';
import { Effects } from '../systems/Effects.js';
import { HUD } from '../ui/HUD.js';
import { clamp, pick, randInt, dist, lerp } from '../utils/math.js';

const INTRO_TIME = 3;
const CAMERA_OFFSET = new THREE.Vector3(0, 25, 16);
const REVEAL_DISTANCE = 3.5;
const ZONE = { delay: 12, shrinkTime: 95, minRadius: 5, tick: 0.5, damage: 260 };

export class Match {
  constructor(app, { modeId, characterId, level, trophies }) {
    this.app = app;
    this.mode = MODES[modeId];
    this.characterId = characterId;
    this.state = 'intro';
    this.introT = INTRO_TIME;
    this.time = 0;
    this.overT = 0;
    this.result = null;
    this.shake = 0;
    this.fighters = [];
    this.projectiles = [];
    this.pickups = [];
    this.scores = [0, 0];
    this.zone = null;

    // ----- Escena -----
    const theme = pick(THEMES);
    this.theme = theme;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(theme.sky);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8aa8, 1.5));
    this.sun = new THREE.DirectionalLight(0xfff2d6, 1.9);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 1; sc.far = 90;
    this.scene.add(this.sun, this.sun.target);
    this.camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.5, 300);

    // ----- Arena -----
    const { cols, rows } = this.mode;
    const spawnCells = this.spawnCells();
    this.arena = new Arena(this.scene, { cols, rows, theme, crates: this.mode.crates, seed: randInt(1, 999999), spawnCells });
    this.effects = new Effects(this.scene);

    // ----- Luchadores -----
    const skill = clamp(trophies / 300, 0, 1);
    const names = [...BOT_NAMES].sort(() => Math.random() - 0.5);
    const playerSlot = this.mode.id === 'team' ? 1 : randInt(0, spawnCells.length - 1);
    spawnCells.forEach((cell, i) => {
      const isPlayer = i === playerSlot;
      const team = this.mode.id === 'team' ? (i < 3 ? 0 : 1) : i;
      const playerTeam = this.mode.id === 'team' ? 0 : playerSlot;
      const def = isPlayer ? CHARACTER_MAP[characterId] : pick(CHARACTERS);
      const fighter = new Fighter(this, {
        def,
        level: isPlayer ? level : clamp(level + randInt(-1, skill > 0.5 ? 1 : 0), 1, 9),
        team,
        isPlayer,
        name: isPlayer ? app.save.data.name : names[i % names.length],
        controller: isPlayer ? new PlayerController(app.input) : new BotController(skill),
        relation: isPlayer ? 'self' : team === playerTeam ? 'ally' : 'enemy',
      });
      fighter.spawn = { x: this.arena.centerX(cell.cx), z: this.arena.centerZ(cell.cz) };
      fighter.placeAt(fighter.spawn.x, fighter.spawn.z);
      fighter.angle = Math.atan2(-fighter.x, -fighter.z);
      fighter.model.rotation.y = fighter.angle;
      fighter.drawLabel();
      this.fighters.push(fighter);
      if (isPlayer) this.player = fighter;
    });

    if (this.mode.id === 'survival') this.setupZone();
    this.setupAimIndicator();

    this.raycaster = new THREE.Raycaster();
    this.ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.mousePoint = new THREE.Vector3();
    this.camTarget = new THREE.Vector3(this.player.x, 0, this.player.z);
    this.updateCamera(1);

    this.hud = new HUD(this);
    app.input.setEnabled(true);
  }

  // ---------- Preparación ----------
  spawnCells() {
    const { cols, rows, fighters } = this.mode;
    const cells = [];
    if (this.mode.id === 'team') {
      const mid = Math.floor(cols / 2);
      for (const dx of [-5, 0, 5]) cells.push({ cx: mid + dx, cz: rows - 3 }); // equipo del jugador (abajo)
      for (const dx of [-5, 0, 5]) cells.push({ cx: mid + dx, cz: 2 });
    } else {
      const r = cols / 2 - 3.5;
      for (let i = 0; i < fighters; i++) {
        const a = (i / fighters) * Math.PI * 2;
        cells.push({ cx: Math.floor(cols / 2 + Math.cos(a) * r), cz: Math.floor(rows / 2 + Math.sin(a) * r) });
      }
    }
    return cells;
  }

  setupZone() {
    const start = Math.hypot(this.arena.width, this.arena.depth) / 2 + 2;
    this.zone = { radius: start, start, tickT: 0 };
    // Neblina: anillo enorme cuyo borde interior marca la zona segura.
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(1, 30, 64),
      new THREE.MeshBasicMaterial({ color: 0x9d4edd, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.2;
    this.zone.mesh = mesh;
    this.scene.add(mesh);
  }

  setupAimIndicator() {
    const a = this.player.def.attack;
    const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0, 0, 0.5);
    this.aimMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false }));
    this.aimMesh.scale.set(Math.max(0.7, a.spread * a.range * 0.7), 1, a.range);
    this.aimMesh.position.y = 0.1;
    this.scene.add(this.aimMesh);
  }

  // ---------- Consultas ----------
  mouseGround() {
    const m = this.app.input.mouse;
    this.raycaster.setFromCamera({ x: (m.x / innerWidth) * 2 - 1, y: -(m.y / innerHeight) * 2 + 1 }, this.camera);
    this.raycaster.ray.intersectPlane(this.ground, this.mousePoint);
    return this.mousePoint;
  }

  canSee(viewer, other) {
    return !other.inBush || other.revealT > 0 || dist(viewer.x, viewer.z, other.x, other.z) < REVEAL_DISTANCE;
  }

  nearestEnemy(f, visibleOnly = true, maxDist = Infinity) {
    let best = null, bestD = maxDist;
    for (const o of this.fighters) {
      if (!o.alive || o.team === f.team) continue;
      const d = dist(f.x, f.z, o.x, o.z);
      if (d < bestD && (!visibleOnly || this.canSee(f, o))) { best = o; bestD = d; }
    }
    return best;
  }

  get aliveCount() {
    return this.fighters.reduce((n, f) => n + (f.alive ? 1 : 0), 0);
  }

  /** Reproduce un sonido atenuado según la distancia al jugador. */
  sound(name, source) {
    const d = source ? dist(source.x, source.z, this.player.x, this.player.z) : 0;
    this.app.audio.play(name, source === this.player ? 1 : clamp(1 - d / 22, 0, 1) * 0.6);
  }

  // ---------- Combate ----------
  spawnProjectile(owner, angle, spec) {
    this.projectiles.push(new Projectile(this, owner, angle, spec));
  }

  damageFighter(target, amount, attacker, charges = true) {
    if (!target.alive || target.invulnT > 0 || this.state === 'over') return;
    amount = Math.round(amount);
    const died = target.takeDamage(amount);
    if (attacker && attacker !== target) {
      attacker.engage();
      if (charges) attacker.chargeSuper(amount);
    }
    if (target.group.visible || died) this.hud.damageNumber(target.x, target.z, amount, target.relation);
    this.effects.burst(target.x, 1.3, target.z, 0xffffff, 4, 4);
    if (target.isPlayer) {
      this.shake = 0.35;
      this.sound('hurt', target);
    } else if (attacker?.isPlayer) this.sound('hit', attacker);
    if (died) this.onDeath(target, attacker);
  }

  explode(x, z, radius, damage, owner, color = 0xffaa33) {
    this.effects.ring(x, z, radius, color);
    this.effects.burst(x, 0.6, z, color, 18, 8);
    this.sound('boom', { x, z });
    for (const f of this.fighters) {
      if (f.alive && f.team !== owner.team && dist(x, z, f.x, f.z) <= radius + 0.5) this.damageFighter(f, damage, owner, false);
    }
    for (const [index, c] of [...this.arena.crates]) {
      if (dist(x, z, c.x, c.z) <= radius + 0.8) this.damageCrate(index, damage, owner);
    }
  }

  damageCrate(index, damage) {
    const crate = this.arena.crates.get(index);
    if (!crate) return;
    crate.hp -= damage;
    crate.mesh.scale.setScalar(0.9);
    this.effects.burst(crate.x, 1, crate.z, 0xb07a3f, 3, 3);
    if (crate.hp <= 0) {
      this.arena.removeCrate(index);
      this.effects.burst(crate.x, 1, crate.z, 0xffd23e, 14, 7);
      this.spawnPickup(crate.x, crate.z);
    }
  }

  spawnPickup(x, z) {
    const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.45), new THREE.MeshBasicMaterial({ color: 0x3dff9e }));
    mesh.position.set(x, 0.9, z);
    this.scene.add(mesh);
    this.pickups.push({ x, z, mesh });
  }

  onDeath(f, killer) {
    this.effects.burst(f.x, 1.2, f.z, f.def.look.shirt, 26, 9);
    this.effects.ring(f.x, f.z, 2.5, 0xffffff);
    this.sound('death', f);
    if (killer) killer.kills++;
    this.hud.feed(killer ? `${killer.name} ⚔ ${f.name}` : `☠ ${f.name} cayó en la neblina`, killer?.isPlayer || f.isPlayer);

    if (this.mode.id === 'survival') {
      f.rank = this.aliveCount + 1;
      this.spawnPickup(f.x, f.z);
      if (f.isPlayer) this.finish({ rank: f.rank });
      else if (this.aliveCount === 1 && this.player.alive) this.finish({ rank: 1 });
    } else {
      this.scores[1 - f.team]++;
      f.respawnT = this.mode.respawn;
      if (this.scores[1 - f.team] >= this.mode.targetScore) this.finishTeam();
    }
  }

  finishTeam() {
    const [mine, theirs] = this.scores;
    this.finish({ outcome: mine > theirs ? 'win' : mine < theirs ? 'loss' : 'draw', score: [...this.scores] });
  }

  finish(partial) {
    if (this.state === 'over') return;
    this.state = 'over';
    this.overT = 2.2;
    this.result = { mode: this.mode.id, characterId: this.characterId, kills: this.player.kills, total: this.fighters.length, ...partial };
    const good = this.result.rank ? this.result.rank <= 3 : this.result.outcome === 'win';
    const text = this.result.rank
      ? (this.result.rank === 1 ? '¡GANASTE!' : `PUESTO #${this.result.rank}`)
      : { win: '¡VICTORIA!', loss: 'DERROTA', draw: 'EMPATE' }[this.result.outcome];
    this.hud.center(text, 99);
    this.app.audio.play(good ? 'win' : 'lose');
    this.app.input.setEnabled(false);
  }

  // ---------- Bucle ----------
  update(dt) {
    dt = Math.min(dt, 0.05);

    if (this.state === 'intro') {
      this.introT -= dt;
      this.hud.center(this.introT > 0.6 ? String(Math.ceil(this.introT - 0.6)) : '¡A PELEAR!', 0.2);
      if (this.introT <= 0) this.state = 'play';
    } else if (this.state === 'play') {
      this.time += dt;
      for (const f of this.fighters) f.update(dt);
      for (const p of this.projectiles) p.update(dt);
      this.projectiles = this.projectiles.filter((p) => p.alive);
      this.updatePickups(dt);
      if (this.mode.id === 'survival') this.updateZone(dt);
      else this.updateTeamMode(dt);
    } else if (this.state === 'over') {
      this.overT -= dt;
      if (this.overT <= 0 && this.result) {
        const result = this.result;
        this.result = null;
        this.app.finishMatch(result);
        return;
      }
    }

    for (const c of this.arena.crates.values()) c.mesh.scale.setScalar(lerp(c.mesh.scale.x, 1, dt * 10));
    this.effects.update(dt);
    this.updateVisibility();
    this.updateAim();
    this.updateCamera(dt);
    this.hud.update(dt);
  }

  updatePickups(dt) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.mesh.rotation.y += dt * 3;
      p.mesh.position.y = 0.9 + Math.sin(this.time * 4 + i) * 0.15;
      const taker = this.fighters.find((f) => f.alive && dist(f.x, f.z, p.x, p.z) < 1.2);
      if (taker) {
        taker.addCube();
        this.effects.burst(p.x, 1, p.z, 0x3dff9e, 10, 5);
        this.sound('pickup', taker);
        this.scene.remove(p.mesh);
        this.pickups.splice(i, 1);
      }
    }
  }

  updateZone(dt) {
    const z = this.zone;
    const k = clamp((this.time - ZONE.delay) / ZONE.shrinkTime, 0, 1);
    z.radius = lerp(z.start, ZONE.minRadius, k);
    z.mesh.scale.setScalar(z.radius);
    z.tickT -= dt;
    if (z.tickT <= 0) {
      z.tickT = ZONE.tick;
      // El daño crece con el tiempo para forzar el final de la partida.
      const damage = ZONE.damage * (1 + this.time / 60);
      for (const f of this.fighters) {
        if (f.alive && Math.hypot(f.x, f.z) > z.radius) this.damageFighter(f, damage, null);
      }
    }
  }

  updateTeamMode(dt) {
    for (const f of this.fighters) {
      if (f.alive) continue;
      f.respawnT -= dt;
      if (f.respawnT <= 0) {
        f.respawn(f.spawn.x, f.spawn.z);
        this.effects.ring(f.x, f.z, 2, 0xffffff);
      }
    }
    if (this.time >= this.mode.duration) this.finishTeam();
  }

  /** Los enemigos dentro de arbustos son invisibles salvo que estén cerca o acaben de atacar. */
  updateVisibility() {
    for (const f of this.fighters) {
      let visible = true;
      if (f.relation === 'enemy' && f.inBush && f.revealT <= 0) {
        visible = this.fighters.some((o) => o.alive && o.relation !== 'enemy' && dist(o.x, o.z, f.x, f.z) < REVEAL_DISTANCE);
      }
      f.group.visible = f.alive && visible;
    }
  }

  updateAim() {
    const p = this.player;
    const ctrl = p.controller;
    this.aimMesh.visible = this.state === 'play' && p.alive && ctrl.aiming;
    if (this.aimMesh.visible) {
      this.aimMesh.position.set(p.x, 0.1, p.z);
      this.aimMesh.rotation.y = ctrl.intent.aim;
    }
  }

  updateCamera(dt) {
    const p = this.player;
    this.camTarget.x = lerp(this.camTarget.x, p.x, Math.min(1, dt * 8));
    this.camTarget.z = lerp(this.camTarget.z, p.z, Math.min(1, dt * 8));
    this.shake = Math.max(0, this.shake - dt * 2);
    const sx = (Math.random() - 0.5) * this.shake, sz = (Math.random() - 0.5) * this.shake;
    // En pantallas verticales la cámara se aleja para mantener el campo de visión horizontal.
    const zoom = this.camera.aspect < 1 ? 1.45 : 1;
    this.camera.position.set(this.camTarget.x + sx, CAMERA_OFFSET.y * zoom, this.camTarget.z + CAMERA_OFFSET.z * zoom + sz);
    this.camera.lookAt(this.camTarget.x + sx, 0, this.camTarget.z + sz);
    this.sun.position.set(this.camTarget.x + 14, 34, this.camTarget.z + 10);
    this.sun.target.position.copy(this.camTarget);
  }

  resize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    this.app.input.setEnabled(false);
    this.hud.dispose();
    this.scene.traverse((o) => {
      if (o.isMesh || o.isSprite) {
        o.geometry?.dispose?.();
        // Los materiales de personajes se comparten y cachean; el resto se libera.
        if (o.material && !o.material.isMeshToonMaterial) {
          o.material.map?.dispose();
          o.material.dispose();
        }
      }
    });
  }
}
