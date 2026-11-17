// Entrada unificada: teclado + ratón en escritorio, doble joystick virtual en táctil.

const STICK_RADIUS = 60;

export class Input {
  constructor() {
    this.keys = new Set();
    this.mouse = { x: innerWidth / 2, y: innerHeight / 2, down: false };
    this.isTouch = matchMedia('(pointer: coarse)').matches;
    this.enabled = false;
    this.superPressed = false; // súper apuntado con el ratón
    this.superAuto = false; // súper con auto-apuntado (botón del HUD)
    this.move = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
    this.aim = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
    this.aimRelease = null; // {x, y, mag} al soltar el joystick de disparo
    this.onStick = null; // callback(which, stick) para dibujar los joysticks

    addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      this.keys.add(e.code);
      if (e.code === 'Space' || e.code === 'KeyQ') {
        this.superPressed = true;
        e.preventDefault();
      }
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => { this.keys.clear(); this.mouse.down = false; });

    addEventListener('mousemove', (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; });
    addEventListener('mousedown', (e) => {
      if (!this.enabled || this.isUi(e.target)) return;
      this.isTouch = false; // hay un ratón real
      if (e.button === 0) this.mouse.down = true;
      if (e.button === 2) this.superPressed = true;
    });
    addEventListener('mouseup', (e) => { if (e.button === 0) this.mouse.down = false; });
    addEventListener('contextmenu', (e) => { if (this.enabled) e.preventDefault(); });

    addEventListener('touchstart', (e) => this.touchStart(e), { passive: false });
    addEventListener('touchmove', (e) => this.touchMove(e), { passive: false });
    addEventListener('touchend', (e) => this.touchEnd(e));
    addEventListener('touchcancel', (e) => this.touchEnd(e));
  }

  isUi(target) {
    return !!target.closest?.('button');
  }

  setEnabled(on) {
    this.enabled = on;
    this.keys.clear();
    this.mouse.down = false;
    this.superPressed = this.superAuto = false;
    this.aimRelease = null;
    this.move.id = this.aim.id = null;
    this.move.x = this.move.y = this.aim.x = this.aim.y = 0;
  }

  touchStart(e) {
    if (!this.enabled || this.isUi(e.target)) return;
    this.isTouch = true;
    e.preventDefault();
    for (const t of e.changedTouches) {
      const stick = t.clientX < innerWidth / 2 ? this.move : this.aim;
      if (stick.id !== null) continue;
      stick.id = t.identifier;
      stick.ox = t.clientX;
      stick.oy = t.clientY;
      stick.x = stick.y = 0;
      this.onStick?.(stick === this.move ? 'move' : 'aim', stick);
    }
  }

  touchMove(e) {
    if (!this.enabled) return;
    e.preventDefault();
    for (const t of e.changedTouches) {
      const stick = t.identifier === this.move.id ? this.move : t.identifier === this.aim.id ? this.aim : null;
      if (!stick) continue;
      let dx = (t.clientX - stick.ox) / STICK_RADIUS;
      let dy = (t.clientY - stick.oy) / STICK_RADIUS;
      const len = Math.hypot(dx, dy);
      if (len > 1) { dx /= len; dy /= len; }
      stick.x = dx;
      stick.y = dy;
      this.onStick?.(stick === this.move ? 'move' : 'aim', stick);
    }
  }

  touchEnd(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === this.move.id) {
        this.move.id = null;
        this.move.x = this.move.y = 0;
        this.onStick?.('move', this.move);
      } else if (t.identifier === this.aim.id) {
        this.aimRelease = { x: this.aim.x, y: this.aim.y, mag: Math.hypot(this.aim.x, this.aim.y) };
        this.aim.id = null;
        this.aim.x = this.aim.y = 0;
        this.onStick?.('aim', this.aim);
      }
    }
  }

  /** Vector de movimiento (-1..1) combinando teclado y joystick. */
  getMove() {
    let x = this.move.x;
    let z = this.move.y;
    const k = this.keys;
    if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
    if (k.has('KeyW') || k.has('ArrowUp')) z -= 1;
    if (k.has('KeyS') || k.has('ArrowDown')) z += 1;
    const len = Math.hypot(x, z);
    if (len > 1) { x /= len; z /= len; }
    return { x, z };
  }

  consume(flag) {
    const v = this[flag];
    this[flag] = flag === 'aimRelease' ? null : false;
    return v;
  }
}
