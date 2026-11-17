// Genera retratos (miniaturas PNG) de cada personaje renderizando su modelo 3D
// una sola vez al iniciar. Se usan en las tarjetas de la interfaz.

import * as THREE from 'three';
import { CHARACTERS } from '../data/characters.js';
import { buildCharacterModel } from './ModelFactory.js';

export function renderPortraits(size = 192) {
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(size, size, false);

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x666688, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.8);
  sun.position.set(2, 4, 5);
  scene.add(sun);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0.9, 2.1, 5.6);
  camera.lookAt(0, 1.3, 0);

  const portraits = {};
  for (const def of CHARACTERS) {
    const model = buildCharacterModel(def.look);
    model.rotation.y = 0.35;
    scene.add(model);
    renderer.render(scene, camera);
    portraits[def.id] = canvas.toDataURL('image/png');
    scene.remove(model);
  }
  renderer.dispose();
  return portraits;
}
