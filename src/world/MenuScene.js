// Escena 3D del menú: muestra al personaje seleccionado girando sobre un pedestal.

import * as THREE from 'three';
import { CHARACTER_MAP } from '../data/characters.js';
import { buildCharacterModel, animateModel } from '../characters/ModelFactory.js';
import { lerp } from '../utils/math.js';

export class MenuScene {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2b1d5c);
    this.scene.fog = new THREE.Fog(0x2b1d5c, 12, 30);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x6a4fb3, 1.5));
    const sun = new THREE.DirectionalLight(0xfff0d0, 2);
    sun.position.set(4, 8, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    this.scene.add(sun);

    this.camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100);

    const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 48), new THREE.MeshLambertMaterial({ color: 0x4527a0 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    this.stage = new THREE.Group();
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.3, 40), new THREE.MeshLambertMaterial({ color: 0xffd23e }));
    pedestal.position.y = 0.15;
    pedestal.receiveShadow = true;
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.0, 0.12, 40), new THREE.MeshLambertMaterial({ color: 0xd90429 }));
    rim.position.y = 0.06;
    this.stage.add(pedestal, rim);
    this.scene.add(this.stage);

    // Decoración: banderines de colores flotando al fondo
    const colors = [0xd90429, 0xffffff, 0xffd23e, 0x00f5d4, 0xff6bd6];
    this.flags = [];
    for (let i = 0; i < 26; i++) {
      const m = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.5, 3), new THREE.MeshBasicMaterial({ color: colors[i % colors.length] }));
      m.position.set((Math.random() - 0.5) * 26, 1 + Math.random() * 7, -4 - Math.random() * 10);
      m.rotation.z = Math.PI;
      this.scene.add(m);
      this.flags.push(m);
    }

    this.model = null;
    this.characterId = null;
    this.t = 0;
    this.offsetX = 0;
    this.targetOffsetX = 0;
    this.resize();
  }

  setCharacter(id) {
    if (id === this.characterId) return;
    this.characterId = id;
    if (this.model) this.stage.remove(this.model);
    this.model = buildCharacterModel(CHARACTER_MAP[id].look);
    this.model.position.y = 0.3;
    this.model.scale.setScalar(0.01); // aparece con un pequeño "pop"
    this.stage.add(this.model);
  }

  /** Desplaza el pedestal para dejar sitio a los paneles de la interfaz. */
  setOffset(x) {
    this.targetOffsetX = x;
  }

  update(dt) {
    this.t += dt;
    this.offsetX = lerp(this.offsetX, this.targetOffsetX, Math.min(1, dt * 8));
    this.stage.position.x = this.offsetX;
    if (this.model) {
      this.model.scale.setScalar(lerp(this.model.scale.x, 1, Math.min(1, dt * 10)));
      this.model.rotation.y = Math.sin(this.t * 0.7) * 0.6;
      animateModel(this.model, this.t, 0, 0);
    }
    this.flags.forEach((f, i) => {
      f.position.y += Math.sin(this.t * 1.5 + i) * dt * 0.3;
      f.rotation.y += dt * 0.8;
    });
  }

  resize() {
    const aspect = innerWidth / innerHeight;
    this.camera.aspect = aspect;
    // En vertical la cámara se aleja para que el personaje quepa.
    const d = aspect < 1 ? 13 : 10.5;
    this.camera.position.set(0, 2.6, d);
    this.camera.lookAt(0, 0.9, 0);
    this.camera.updateProjectionMatrix();
  }
}
