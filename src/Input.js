export class Input {
  constructor() {
    this.maps = {
      w: 87,
      s: 83,
      jump: 32,
      shift: 16,
      a: 65,
      d: 68,
      noclip: 78,
      physics: 70,
    };
    this.mx = 0;
    this.my = 0;
    this.ax = this.mx;
    this.ay = this.my;
    this.dx = 0;
    this.dy = 0;
    this.mp = false;
    this.mrp = false;
    this.ms = 0;
    this.mrs = false;
    this.state = {};
    this.cx = 0;
    this.cy = 0;

    document.addEventListener("keydown", this.keydown.bind(this));
    document.addEventListener("keyup", this.keyup.bind(this));
    document
      .getElementById("glCanvas")
      .addEventListener("mousemove", this.movemouse.bind(this));
    document
      .getElementById("glCanvas")
      .addEventListener("mousedown", this.mousedown.bind(this));
    document
      .getElementById("glCanvas")
      .addEventListener("mouseup", this.mouseup.bind(this));
  }

  keypress(key) {
    var code = this.maps[key];
    if (code == undefined || null) return false;
    var s = this.state[code];
    if (s == undefined || null) {
      this.state[code] = false;
      return false;
    }
    return s;
  }

  update() {
    var rect = document.getElementById("glCanvas").getBoundingClientRect();
    this.cx = rect.x;
    this.cy = rect.y;
    this.dx = this.mx - this.ax;
    this.dy = this.my - this.ay;
    this.ay = this.my;
    this.ax = this.mx;
    if (this.mp) {
      this.ms = this.ms == 0 ? 1 : -1;
    } else {
      this.ms = 0;
    }

    if (this.mrp) {
      this.mrs = this.mrs == 0 ? 1 : -1;
    } else {
      this.mrs = 0;
    }
  }

  get mouseX() {
    return this.mx - this.cx;
  }

  get mouseY() {
    return this.my - this.cy;
  }

  get deltaX() {
    return this.dx;
  }

  get deltaY() {
    return this.dy;
  }

  get mousePressed() {
    return this.ms;
  }

  get mouseRightPressed() {
    return this.mrs;
  }

  keydown(key) {
    this.state[key.keyCode] = true;
  }

  keyup(key) {
    this.state[key.keyCode] = false;
  }

  movemouse(mouse) {
    this.mx = mouse.clientX;
    this.my = mouse.clientY;
  }

  mousedown(mouse) {
    if (mouse.button == 0) this.mp = true;
    if (mouse.button == 2) this.mrp = true;
  }

  mouseup(mouse) {
    if (mouse.button == 0) this.mp = false;
    if (mouse.button == 2) this.mrp = false;
  }
}
