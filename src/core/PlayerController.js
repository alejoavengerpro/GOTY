// Traduce la entrada del jugador (teclado/ratón o joysticks táctiles) en una intención de combate.

export class PlayerController {
  constructor(input) {
    this.input = input;
    this.intent = { mx: 0, mz: 0, aim: 0, fire: false, super: false, point: null };
    this.aiming = false; // el HUD lo usa para mostrar el indicador de puntería
  }

  getIntent(match, f) {
    const inp = this.input;
    const it = this.intent;
    const move = inp.getMove();
    it.mx = move.x;
    it.mz = move.z;
    it.fire = it.super = false;
    it.point = null;

    const autoAim = () => {
      const target = match.nearestEnemy(f, true, f.def.attack.range + 4);
      if (target) {
        it.aim = Math.atan2(target.x - f.x, target.z - f.z);
        it.point = target;
      } else {
        it.aim = f.angle;
      }
    };

    if (inp.isTouch) {
      const mag = Math.hypot(inp.aim.x, inp.aim.y);
      this.aiming = inp.aim.id !== null && mag > 0.25;
      if (this.aiming) it.aim = Math.atan2(inp.aim.x, inp.aim.y);
      const release = inp.consume('aimRelease');
      if (release) {
        if (release.mag > 0.25) it.aim = Math.atan2(release.x, release.y);
        else autoAim(); // toque rápido: dispara al enemigo más cercano
        it.fire = true;
      }
    } else {
      const p = match.mouseGround();
      it.aim = Math.atan2(p.x - f.x, p.z - f.z);
      it.point = p;
      it.fire = inp.mouse.down;
      this.aiming = true;
      if (inp.consume('superPressed')) it.super = true;
    }

    if (inp.consume('superAuto')) {
      autoAim();
      it.super = true;
    }
    return it;
  }
}
