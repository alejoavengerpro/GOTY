// Construye los modelos 3D de los personajes con primitivas de Three.js
// (estilo "chibi" low-poly, sin assets externos).

import * as THREE from 'three';

const matCache = new Map();
function mat(color) {
  if (!matCache.has(color)) matCache.set(color, new THREE.MeshToonMaterial({ color }));
  return matCache.get(color);
}

function part(geo, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

const sphere = (r, w = 16, h = 12) => new THREE.SphereGeometry(r, w, h);
const halfSphere = (r) => new THREE.SphereGeometry(r, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2);
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, s = 14) => new THREE.CylinderGeometry(rt, rb, h, s);

const HAIR_DARK = 0x1b1b24;

/** Peinados, gorros y máscaras. Se añaden al grupo de la cabeza (radio ~0.48). */
function buildHead(head, look) {
  const c = look.headColor;
  switch (look.head) {
    case 'cap': {
      head.add(part(halfSphere(0.51), c, 0, 0.05, 0));
      head.add(part(box(0.5, 0.06, 0.34), c, 0, 0.1, 0.5));
      break;
    }
    case 'chef': {
      head.add(part(cyl(0.34, 0.36, 0.42), c, 0, 0.55, 0));
      head.add(part(sphere(0.42), c, 0, 0.82, 0));
      head.add(part(box(0.3, 0.07, 0.06), 0x2b1b12, 0, -0.12, 0.46)); // bigote
      break;
    }
    case 'headphones': {
      head.add(part(halfSphere(0.52), 0x3c1a5b, 0, 0.02, -0.02));
      head.add(part(box(0.16, 0.7, 0.2), 0x3c1a5b, -0.34, -0.3, -0.25));
      head.add(part(box(0.16, 0.7, 0.2), 0x3c1a5b, 0.34, -0.3, -0.25));
      const band = part(new THREE.TorusGeometry(0.52, 0.05, 8, 20, Math.PI), c, 0, 0.02, 0);
      head.add(band);
      head.add(part(cyl(0.16, 0.16, 0.12), c, -0.52, 0, 0).rotateZ(Math.PI / 2));
      head.add(part(cyl(0.16, 0.16, 0.12), c, 0.52, 0, 0).rotateZ(Math.PI / 2));
      break;
    }
    case 'hairLong': {
      head.add(part(halfSphere(0.53), c, 0, 0.02, -0.03));
      head.add(part(box(0.9, 0.95, 0.3), c, 0, -0.35, -0.32));
      head.add(part(sphere(0.1), 0xffbe0b, 0.36, 0.3, 0.2)); // flor
      break;
    }
    case 'spiky': {
      head.add(part(halfSphere(0.5), c, 0, 0.04, 0));
      for (let i = -1; i <= 1; i++) head.add(part(new THREE.ConeGeometry(0.13, 0.36, 6), c, i * 0.2, 0.56, 0.05));
      break;
    }
    case 'bun': {
      head.add(part(halfSphere(0.52), c, 0, 0.03, -0.02));
      head.add(part(sphere(0.2), c, 0, 0.6, -0.1));
      break;
    }
    case 'mask': {
      head.add(part(sphere(0.5, 18, 14), c, 0, 0, -0.01));
      head.add(part(box(0.1, 0.5, 0.1), 0xd00000, 0, 0.32, 0.38));
      head.add(part(sphere(0.13), 0xffffff, -0.18, 0.06, 0.4));
      head.add(part(sphere(0.13), 0xffffff, 0.18, 0.06, 0.4));
      break;
    }
    case 'ponytail': {
      head.add(part(halfSphere(0.52), c, 0, 0.03, -0.02));
      head.add(part(sphere(0.16), c, 0, 0.35, -0.5));
      head.add(part(new THREE.ConeGeometry(0.16, 0.7, 8), c, 0, -0.05, -0.62).rotateX(Math.PI));
      break;
    }
    default:
      head.add(part(halfSphere(0.5), HAIR_DARK, 0, 0.04, 0));
  }
}

/** Objeto característico de cada personaje, colocado en la mano derecha. */
function buildItem(hand, look) {
  switch (look.item) {
    case 'coins': {
      hand.add(part(sphere(0.2), 0x8d6e63, 0, -0.1, 0.1));
      hand.add(part(cyl(0.1, 0.1, 0.04), 0xffd23e, 0, 0.1, 0.12));
      break;
    }
    case 'spoon': {
      hand.add(part(cyl(0.035, 0.035, 0.7), 0xdee2e6, 0, 0.15, 0.15).rotateX(Math.PI / 2.4));
      hand.add(part(sphere(0.14), 0xb5e61d, 0, 0.3, 0.45));
      break;
    }
    case 'phone': {
      hand.add(part(box(0.2, 0.36, 0.04), 0x111111, 0, 0.05, 0.14));
      hand.add(part(box(0.16, 0.3, 0.01), 0x9bf6ff, 0, 0.05, 0.165));
      break;
    }
    case 'mic': {
      hand.add(part(cyl(0.04, 0.04, 0.34), 0x222222, 0, 0.1, 0.1));
      hand.add(part(sphere(0.1), 0xdee2e6, 0, 0.32, 0.1));
      break;
    }
    case 'ball': {
      const ball = part(sphere(0.22), 0xffffff, 0, -0.2, 0.25);
      ball.add(part(sphere(0.09), 0x111111, 0, 0.16, 0.1));
      hand.add(ball);
      break;
    }
    case 'skewer': {
      const stick = part(cyl(0.025, 0.025, 0.9), 0xd4a373, 0, 0.1, 0.3).rotateX(Math.PI / 2);
      hand.add(stick);
      for (let i = 0; i < 3; i++) hand.add(part(box(0.14, 0.14, 0.14), 0x7f4f24, 0, 0.1, 0.25 + i * 0.18));
      break;
    }
    case 'gloves': {
      hand.add(part(sphere(0.24), 0xffba08, 0, -0.02, 0));
      break;
    }
    case 'ringlight': {
      const ring = part(new THREE.TorusGeometry(0.2, 0.045, 8, 18), 0xffffff, 0, 0.3, 0.12);
      hand.add(ring);
      hand.add(part(cyl(0.025, 0.025, 0.4), 0x333333, 0, 0.02, 0.12));
      break;
    }
    default:
      break;
  }
}

/**
 * Crea el modelo de un personaje a partir de su descripción `look`.
 * El modelo mira hacia +Z y sus pies están en y = 0.
 */
export function buildCharacterModel(look) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const bulk = look.bulk ?? 1;

  // Piernas (pivotan desde la cadera)
  const legGeo = new THREE.CapsuleGeometry(0.15, 0.28, 4, 8);
  const makeLeg = (x) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.6, 0);
    pivot.add(part(legGeo, look.pants, 0, -0.3, 0));
    pivot.add(part(box(0.26, 0.14, 0.38), 0x222222, 0, -0.53, 0.06));
    body.add(pivot);
    return pivot;
  };
  const legL = makeLeg(-0.2 * bulk);
  const legR = makeLeg(0.2 * bulk);

  // Torso
  body.add(part(new THREE.CapsuleGeometry(0.4 * bulk, 0.36, 6, 14), look.shirt, 0, 1.0, 0));
  if (look.sash) body.add(part(box(0.16, 0.9, 0.82 * bulk), look.sash, 0, 1.0, 0).rotateZ(-0.6).rotateY(Math.PI / 2));
  if (look.apron) body.add(part(box(0.6 * bulk, 0.7, 0.08), look.apron, 0, 0.9, 0.38 * bulk));

  // Brazos (pivotan desde el hombro)
  const armGeo = new THREE.CapsuleGeometry(0.12, 0.3, 4, 8);
  const makeArm = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.52 * bulk, 1.25, 0);
    pivot.rotation.z = side * 0.22;
    pivot.add(part(armGeo, look.shirt, 0, -0.25, 0));
    const hand = new THREE.Group();
    hand.position.set(0, -0.55, 0);
    hand.add(part(sphere(0.13, 10, 8), look.head === 'mask' ? look.headColor : look.skin));
    pivot.add(hand);
    body.add(pivot);
    return { pivot, hand };
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);
  buildItem(armR.hand, look);
  if (look.item === 'gloves') armL.hand.add(part(sphere(0.24), 0xffba08, 0, -0.02, 0));

  // Cabeza
  const head = new THREE.Group();
  head.position.set(0, 1.82, 0);
  head.add(part(sphere(0.48, 20, 16), look.skin));
  if (look.head !== 'mask') {
    head.add(part(sphere(0.07, 8, 8), 0x111111, -0.17, 0.02, 0.43));
    head.add(part(sphere(0.07, 8, 8), 0x111111, 0.17, 0.02, 0.43));
    head.add(part(box(0.16, 0.035, 0.04), 0x7a2e1d, 0, -0.2, 0.44)); // boca
  }
  buildHead(head, look);
  body.add(head);

  root.userData.parts = { body, legL, legR, armL: armL.pivot, armR: armR.pivot, head };
  return root;
}

/**
 * Animación procedural: caminar, reposo y golpe de ataque.
 * @param {number} t tiempo acumulado
 * @param {number} moving 0..1 intensidad de movimiento
 * @param {number} attack 0..1 progreso del gesto de ataque (1 = recién disparado)
 */
export function animateModel(model, t, moving, attack = 0) {
  const p = model.userData.parts;
  const swing = Math.sin(t * 13) * 0.75 * moving;
  p.legL.rotation.x = swing;
  p.legR.rotation.x = -swing;
  p.armL.rotation.x = -swing * 0.8;
  p.armR.rotation.x = swing * 0.8 - attack * 1.9;
  p.body.position.y = Math.abs(Math.sin(t * 13)) * 0.08 * moving + Math.sin(t * 2.5) * 0.02;
  p.head.rotation.z = Math.sin(t * 2) * 0.04;
}
