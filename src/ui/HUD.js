// HUD de la partida (DOM sobre el canvas): marcador, botón de súper, joysticks,
// números de daño y registro de KOs.

import * as THREE from 'three';

const v = new THREE.Vector3();

export class HUD {
  constructor(match) {
    this.match = match;
    this.input = match.app.input;
    this.root = document.getElementById('hud');
    this.root.classList.remove('hidden');
    const s = match.player.def.super;
    this.root.innerHTML = `
      <div class="hud-top">
        <button class="btn btn-small btn-red" id="hud-quit">✕ Salir</button>
        <div class="hud-info" id="hud-info"></div>
        <div class="hud-theme">${match.theme.name}</div>
      </div>
      <div class="hud-feed" id="hud-feed"></div>
      <div class="hud-center" id="hud-center"></div>
      <div class="hud-dmg" id="hud-dmg"></div>
      <div class="hud-help">${this.input.isTouch
        ? 'Izquierda: moverse · Derecha: apuntar y soltar para disparar'
        : 'WASD: moverse · Clic: disparar · Espacio / clic derecho: súper'}</div>
      <button class="hud-super" id="hud-super"><span>SÚPER</span><small>${s.name}</small></button>
      <div class="stick" id="stick-move"><i></i></div>
      <div class="stick" id="stick-aim"><i></i></div>`;

    this.info = this.root.querySelector('#hud-info');
    this.feedEl = this.root.querySelector('#hud-feed');
    this.centerEl = this.root.querySelector('#hud-center');
    this.dmgEl = this.root.querySelector('#hud-dmg');
    this.superBtn = this.root.querySelector('#hud-super');
    this.sticks = { move: this.root.querySelector('#stick-move'), aim: this.root.querySelector('#stick-aim') };
    this.centerT = 0;
    this.infoKey = '';

    this.root.querySelector('#hud-quit').addEventListener('click', () => match.app.quitMatch());
    const fireSuper = (e) => {
      e.preventDefault();
      this.input.superAuto = true;
    };
    this.superBtn.addEventListener('touchstart', fireSuper, { passive: false });
    this.superBtn.addEventListener('mousedown', fireSuper);

    this.input.onStick = (which, stick) => {
      const el = this.sticks[which];
      el.style.display = stick.id === null ? 'none' : 'block';
      el.style.left = `${stick.ox}px`;
      el.style.top = `${stick.oy}px`;
      el.firstElementChild.style.transform = `translate(${stick.x * 60}px, ${stick.y * 60}px)`;
    };
  }

  update(dt) {
    const m = this.match;
    let html;
    if (m.mode.id === 'survival') {
      html = `<span>👥 ${m.aliveCount} vivos</span><span>⚔ ${m.player.kills}</span><span>⚡ ${m.player.cubes}</span>`;
    } else {
      const left = Math.max(0, Math.ceil(m.mode.duration - m.time));
      const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
      html = `<span class="blue">${m.scores[0]}</span><span>⏱ ${clock}</span><span class="red">${m.scores[1]}</span>`;
    }
    if (html !== this.infoKey) {
      this.infoKey = html;
      this.info.innerHTML = html;
    }

    const charge = m.player.superCharge;
    this.superBtn.style.setProperty('--charge', `${Math.round(charge * 360)}deg`);
    this.superBtn.classList.toggle('ready', charge >= 1);

    if (this.centerT > 0) {
      this.centerT -= dt;
      if (this.centerT <= 0) this.centerEl.textContent = '';
    }
    if (m.mode.id === 'team' && !m.player.alive && m.state === 'play') {
      this.center(`Reapareces en ${Math.ceil(m.player.respawnT)}`, 0.2);
    }
  }

  center(text, duration = 1) {
    if (this.centerEl.textContent !== text) this.centerEl.textContent = text;
    this.centerT = duration;
  }

  feed(text, highlight = false) {
    const el = document.createElement('div');
    el.textContent = text;
    if (highlight) el.className = 'me';
    this.feedEl.prepend(el);
    while (this.feedEl.children.length > 4) this.feedEl.lastChild.remove();
    setTimeout(() => el.remove(), 4000);
  }

  /** Número de daño flotante proyectado desde el mundo 3D a la pantalla. */
  damageNumber(x, z, amount, relation) {
    v.set(x + (Math.random() - 0.5), 2.8, z).project(this.match.camera);
    if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) return;
    const el = document.createElement('div');
    el.className = `dmg ${relation === 'enemy' ? 'enemy' : 'friend'}`;
    el.textContent = amount;
    el.style.left = `${(v.x * 0.5 + 0.5) * innerWidth}px`;
    el.style.top = `${(-v.y * 0.5 + 0.5) * innerHeight}px`;
    this.dmgEl.appendChild(el);
    setTimeout(() => el.remove(), 700);
  }

  dispose() {
    this.input.onStick = null;
    this.root.innerHTML = '';
    this.root.classList.add('hidden');
  }
}
