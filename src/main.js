// Punto de entrada: crea la aplicación, el renderer y el bucle principal.

import * as THREE from 'three';
import { SaveManager } from './core/SaveManager.js';
import { AudioManager } from './core/AudioManager.js';
import { Input } from './core/Input.js';
import { Match } from './core/Match.js';
import { Progression } from './systems/Progression.js';
import { MenuScene } from './world/MenuScene.js';
import { renderPortraits } from './characters/Portraits.js';
import { UIManager } from './ui/UIManager.js';

class App {
  constructor() {
    this.canvas = document.getElementById('game');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.save = new SaveManager();
    this.progression = new Progression(this.save);
    this.audio = new AudioManager(this.save.data.sound);
    this.input = new Input();
    this.portraits = renderPortraits();
    this.menu = new MenuScene();
    this.match = null;
    this.ui = new UIManager(this);

    addEventListener('resize', () => this.resize());
    addEventListener('pointerdown', () => this.audio.unlock());
    this.resize();
    this.ui.show('lobby');

    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  frame() {
    const dt = Math.min(this.clock.getDelta(), 0.1);
    if (this.match) {
      this.match.update(dt);
      // update() puede haber terminado la partida
      if (this.match) this.renderer.render(this.match.scene, this.match.camera);
    } else {
      this.menu.update(dt);
      this.renderer.render(this.menu.scene, this.menu.camera);
    }
  }

  resize() {
    this.renderer.setSize(innerWidth, innerHeight);
    this.menu.resize();
    this.match?.resize();
  }

  startMatch() {
    const d = this.save.data;
    const char = d.chars[d.selected];
    this.ui.hide();
    this.match = new Match(this, { modeId: d.mode, characterId: d.selected, level: char.level, trophies: char.trophies });
  }

  endMatch() {
    this.match?.dispose();
    this.match = null;
  }

  /** La partida terminó con normalidad: aplica recompensas y muestra resultados. */
  finishMatch(result) {
    this.endMatch();
    const summary = this.progression.applyMatchResult(result);
    this.ui.show('results', summary);
  }

  /** El jugador abandonó: vuelve al lobby sin recompensas. */
  quitMatch() {
    this.endMatch();
    this.ui.show('lobby');
  }
}

window.app = new App();
