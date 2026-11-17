// Arena basada en una cuadrícula de casillas: generación procedural simétrica,
// render instanciado, colisiones, línea de visión y búsqueda de caminos.

import * as THREE from 'three';
import { mulberry32 } from '../utils/math.js';

export const TILE = 2;
export const FLOOR = 0;
export const WALL = 1;
export const BUSH = 2;
export const CRATE = 3;
export const CRATE_HP = 2600;

export class Arena {
  /**
   * @param {THREE.Scene} scene
   * @param {{cols:number, rows:number, theme:object, crates:boolean, seed:number, spawnCells:{cx:number,cz:number}[]}} opts
   */
  constructor(scene, opts) {
    this.scene = scene;
    this.cols = opts.cols;
    this.rows = opts.rows;
    this.theme = opts.theme;
    this.width = this.cols * TILE;
    this.depth = this.rows * TILE;
    this.spawnCells = opts.spawnCells;
    this.crates = new Map(); // índice de casilla -> { hp, mesh, cx, cz }

    // Regenera con otra semilla si algún punto de aparición queda aislado.
    let seed = opts.seed;
    do {
      this.generate(mulberry32(seed++), opts.crates);
    } while (!this.validateConnectivity());

    this.buildMeshes();
  }

  // ---------- Coordenadas ----------
  idx(cx, cz) { return cz * this.cols + cx; }
  inBounds(cx, cz) { return cx >= 0 && cz >= 0 && cx < this.cols && cz < this.rows; }
  cellX(x) { return Math.floor((x + this.width / 2) / TILE); }
  cellZ(z) { return Math.floor((z + this.depth / 2) / TILE); }
  centerX(cx) { return (cx + 0.5) * TILE - this.width / 2; }
  centerZ(cz) { return (cz + 0.5) * TILE - this.depth / 2; }
  kindAt(x, z) {
    const cx = this.cellX(x), cz = this.cellZ(z);
    return this.inBounds(cx, cz) ? this.grid[this.idx(cx, cz)] : WALL;
  }
  solidCell(cx, cz) {
    if (!this.inBounds(cx, cz)) return true;
    const k = this.grid[this.idx(cx, cz)];
    return k === WALL || k === CRATE;
  }

  // ---------- Generación ----------
  generate(rng, withCrates) {
    const { cols, rows } = this;
    this.grid = new Uint8Array(cols * rows);
    const reserved = new Uint8Array(cols * rows);
    for (const s of this.spawnCells) {
      for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
        if (this.inBounds(s.cx + dx, s.cz + dz)) reserved[this.idx(s.cx + dx, s.cz + dz)] = 1;
      }
    }

    const mirrors = (cx, cz) => [
      [cx, cz], [cols - 1 - cx, cz], [cx, rows - 1 - cz], [cols - 1 - cx, rows - 1 - cz],
    ];
    // Un bloque sólido solo se coloca si él y su contorno están libres: así nunca se cierran pasillos.
    const canPlaceSolid = (cells) => cells.every(([cx, cz]) => mirrors(cx, cz).every(([mx, mz]) => {
      if (mx < 1 || mz < 1 || mx >= cols - 1 || mz >= rows - 1) return false;
      if (reserved[this.idx(mx, mz)]) return false;
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        if (this.grid[this.idx(mx + dx, mz + dz)] !== FLOOR) return false;
      }
      return true;
    }));
    const place = (cells, kind) => {
      for (const [cx, cz] of cells) for (const [mx, mz] of mirrors(cx, cz)) this.grid[this.idx(mx, mz)] = kind;
    };

    const hw = Math.ceil(cols / 2), hh = Math.ceil(rows / 2);
    const rint = (n) => Math.floor(rng() * n);
    const WALL_SHAPES = [
      [[0, 0], [1, 0], [2, 0]],
      [[0, 0], [0, 1], [0, 2]],
      [[0, 0], [1, 0], [0, 1]],
      [[0, 0], [1, 0], [1, 1]],
      [[0, 0], [1, 0], [0, 1], [1, 1]],
      [[0, 0], [1, 0]],
      [[0, 0], [0, 1]],
    ];

    const quarterArea = hw * hh;
    const wallBlobs = Math.round(quarterArea / 24);
    for (let i = 0, tries = 0; i < wallBlobs && tries < 600; tries++) {
      const shape = WALL_SHAPES[rint(WALL_SHAPES.length)];
      const ox = 1 + rint(hw - 1), oz = 1 + rint(hh - 1);
      const cells = shape.map(([dx, dz]) => [ox + dx, oz + dz]);
      if (cells.every(([cx, cz]) => cx < hw && cz < hh) && canPlaceSolid(cells)) {
        place(cells, WALL);
        i++;
      }
    }

    if (withCrates) {
      const crateCount = Math.round(quarterArea / 55);
      for (let i = 0, tries = 0; i < crateCount && tries < 300; tries++) {
        const cells = [[1 + rint(hw - 1), 1 + rint(hh - 1)]];
        if (canPlaceSolid(cells)) {
          place(cells, CRATE);
          i++;
        }
      }
    }

    // Arbustos: parches más grandes; pueden tocar muros pero no pisarlos.
    const bushBlobs = Math.round(quarterArea / 28);
    for (let i = 0; i < bushBlobs; i++) {
      const w = 2 + rint(2), h = 1 + rint(3);
      const ox = rint(hw), oz = rint(hh);
      for (let dz = 0; dz < h; dz++) for (let dx = 0; dx < w; dx++) {
        for (const [mx, mz] of mirrors(ox + dx, oz + dz)) {
          if (this.inBounds(mx, mz) && this.grid[this.idx(mx, mz)] === FLOOR) this.grid[this.idx(mx, mz)] = BUSH;
        }
      }
    }
  }

  /** Comprueba que todos los puntos de aparición estén conectados; rellena huecos inaccesibles. */
  validateConnectivity() {
    const { cols, rows } = this;
    const seen = new Uint8Array(cols * rows);
    const first = this.spawnCells[0];
    const queue = [this.idx(first.cx, first.cz)];
    seen[queue[0]] = 1;
    while (queue.length) {
      const i = queue.pop();
      const cx = i % cols, cz = (i - cx) / cols;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, nz = cz + dz;
        if (!this.inBounds(nx, nz)) continue;
        const ni = this.idx(nx, nz);
        // Las cajas cuentan como transitables porque se pueden romper.
        if (seen[ni] || this.grid[ni] === WALL) continue;
        seen[ni] = 1;
        queue.push(ni);
      }
    }
    if (!this.spawnCells.every((s) => seen[this.idx(s.cx, s.cz)])) return false;
    for (let i = 0; i < seen.length; i++) if (!seen[i] && this.grid[i] !== WALL) this.grid[i] = WALL;
    return true;
  }

  // ---------- Render ----------
  buildMeshes() {
    const { cols, rows, theme, scene } = this;

    // Suelo con patrón de damero
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const g = canvas.getContext('2d');
    g.fillStyle = theme.floorA; g.fillRect(0, 0, 64, 64);
    g.fillStyle = theme.floorB; g.fillRect(0, 0, 32, 32); g.fillRect(32, 32, 32, 32);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(cols / 2, rows / 2);
    tex.magFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(this.width, this.depth), new THREE.MeshLambertMaterial({ map: tex }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const outside = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ color: theme.outside }));
    outside.rotation.x = -Math.PI / 2;
    outside.position.y = -0.05;
    scene.add(outside);

    // Borde de la arena
    const borderMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(theme.wall).multiplyScalar(0.75) });
    const addBorder = (w, d, x, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 2, d), borderMat);
      m.position.set(x, 1, z);
      m.castShadow = m.receiveShadow = true;
      scene.add(m);
    };
    addBorder(this.width + 4, 2, 0, -this.depth / 2 - 1);
    addBorder(this.width + 4, 2, 0, this.depth / 2 + 1);
    addBorder(2, this.depth, -this.width / 2 - 1, 0);
    addBorder(2, this.depth, this.width / 2 + 1, 0);

    // Muros y arbustos instanciados
    const walls = [], bushes = [];
    for (let cz = 0; cz < rows; cz++) for (let cx = 0; cx < cols; cx++) {
      const k = this.grid[this.idx(cx, cz)];
      if (k === WALL) walls.push([cx, cz]);
      else if (k === BUSH) bushes.push([cx, cz]);
      else if (k === CRATE) this.addCrate(cx, cz);
    }

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const wallMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(TILE, 1, TILE), new THREE.MeshLambertMaterial(), walls.length);
    walls.forEach(([cx, cz], i) => {
      const h = 1.5 + ((cx * 7 + cz * 13) % 3) * 0.15;
      dummy.position.set(this.centerX(cx), h / 2, this.centerZ(cz));
      dummy.scale.set(1, h, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      wallMesh.setMatrixAt(i, dummy.matrix);
      wallMesh.setColorAt(i, color.set(theme.wall).multiplyScalar(0.9 + ((cx + cz) % 3) * 0.07));
    });
    wallMesh.castShadow = wallMesh.receiveShadow = true;
    scene.add(wallMesh);

    const perTile = 4;
    const bushMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.72, 1), new THREE.MeshLambertMaterial(), bushes.length * perTile);
    const offsets = [[-0.5, -0.5], [0.5, -0.45], [-0.45, 0.5], [0.5, 0.5]];
    bushes.forEach(([cx, cz], i) => {
      offsets.forEach(([ox, oz], j) => {
        const n = (cx * 31 + cz * 17 + j * 7) % 10;
        // Arbustos achatados para que no tapen por completo a los personajes.
        const size = 0.95 + n * 0.02;
        dummy.position.set(this.centerX(cx) + ox, 0.3 + n * 0.015, this.centerZ(cz) + oz);
        dummy.scale.set(size, size * 0.7, size);
        dummy.rotation.set(0, n, 0);
        dummy.updateMatrix();
        bushMesh.setMatrixAt(i * perTile + j, dummy.matrix);
        bushMesh.setColorAt(i * perTile + j, color.set(theme.bush).multiplyScalar(0.85 + n * 0.03));
      });
    });
    bushMesh.receiveShadow = true;
    scene.add(bushMesh);
  }

  addCrate(cx, cz) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(TILE * 0.8, 1.5, TILE * 0.8), new THREE.MeshLambertMaterial({ color: 0xb07a3f }));
    const band = new THREE.Mesh(new THREE.BoxGeometry(TILE * 0.84, 0.25, TILE * 0.84), new THREE.MeshLambertMaterial({ color: 0xffd23e }));
    mesh.add(band);
    mesh.position.set(this.centerX(cx), 0.75, this.centerZ(cz));
    mesh.castShadow = true;
    this.scene.add(mesh);
    this.crates.set(this.idx(cx, cz), { hp: CRATE_HP, mesh, cx, cz, x: mesh.position.x, z: mesh.position.z });
  }

  removeCrate(index) {
    const crate = this.crates.get(index);
    if (!crate) return;
    this.scene.remove(crate.mesh);
    this.crates.delete(index);
    this.grid[index] = FLOOR;
  }

  // ---------- Colisiones ----------
  /** ¿Un círculo de radio r en (x, z) toca alguna casilla sólida? */
  collides(x, z, r) {
    const x0 = this.cellX(x - r), x1 = this.cellX(x + r);
    const z0 = this.cellZ(z - r), z1 = this.cellZ(z + r);
    for (let cz = z0; cz <= z1; cz++) for (let cx = x0; cx <= x1; cx++) {
      if (!this.solidCell(cx, cz)) continue;
      const minX = cx * TILE - this.width / 2, minZ = cz * TILE - this.depth / 2;
      const nx = Math.max(minX, Math.min(x, minX + TILE));
      const nz = Math.max(minZ, Math.min(z, minZ + TILE));
      if ((x - nx) ** 2 + (z - nz) ** 2 < r * r) return true;
    }
    return false;
  }

  /** Mueve un objeto {x, z} deslizándolo contra los muros. Devuelve la distancia recorrida. */
  move(obj, dx, dz, r) {
    const ox = obj.x, oz = obj.z;
    if (!this.collides(obj.x + dx, obj.z, r)) obj.x += dx;
    if (!this.collides(obj.x, obj.z + dz, r)) obj.z += dz;
    return Math.hypot(obj.x - ox, obj.z - oz);
  }

  /** Línea de visión entre dos puntos (los muros y cajas bloquean). `skip` ignora una casilla. */
  lineClear(x0, z0, x1, z1, skip = -1) {
    const d = Math.hypot(x1 - x0, z1 - z0);
    const steps = Math.ceil(d / 0.5);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const cx = this.cellX(x0 + (x1 - x0) * t), cz = this.cellZ(z0 + (z1 - z0) * t);
      if (this.solidCell(cx, cz) && this.idx(cx, cz) !== skip) return false;
    }
    return true;
  }

  // ---------- Búsqueda de caminos (BFS sobre la cuadrícula) ----------
  findPath(x0, z0, x1, z1) {
    const { cols } = this;
    const sx = this.cellX(x0), sz = this.cellZ(z0);
    let gx = this.cellX(x1), gz = this.cellZ(z1);
    if (!this.inBounds(sx, sz) || !this.inBounds(gx, gz)) return [];
    const start = this.idx(sx, sz);
    const goal = this.idx(gx, gz);
    if (start === goal) return [{ x: x1, z: z1 }];

    const prev = new Int32Array(this.grid.length).fill(-1);
    const queue = new Int32Array(this.grid.length);
    let head = 0, tail = 0;
    queue[tail++] = start;
    prev[start] = start;
    let found = -1;
    while (head < tail) {
      const i = queue[head++];
      if (i === goal) { found = i; break; }
      const cx = i % cols, cz = (i - cx) / cols;
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dz) continue;
        const nx = cx + dx, nz = cz + dz;
        if (!this.inBounds(nx, nz)) continue;
        const ni = this.idx(nx, nz);
        if (prev[ni] !== -1) continue;
        // El destino se acepta aunque sea sólido (p. ej. ir hacia una caja).
        if (ni !== goal && this.solidCell(nx, nz)) continue;
        // Las diagonales no pueden cortar esquinas.
        if (dx && dz && (this.solidCell(cx + dx, cz) || this.solidCell(cx, cz + dz))) continue;
        prev[ni] = i;
        queue[tail++] = ni;
      }
    }
    if (found === -1) return [];
    const path = [];
    for (let i = found; i !== start; i = prev[i]) {
      const cx = i % cols, cz = (i - cx) / cols;
      path.push({ x: this.centerX(cx), z: this.centerZ(cz) });
    }
    return path.reverse();
  }
}
