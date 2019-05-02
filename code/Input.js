maps = {
    "w": 87,
    "s": 83,
    "jump": 32,
    "shift": 16,
    "a": 65,
    "d": 68,
    "noclip": 78,
    "physics": 70,
};

mx = 0;
my = 0;
ax = mx;
ay = my;
dx = 0;
dy = 0;
mp = 0;

state = {}

class Input {
    static init() {
        document.addEventListener("keydown", Input.keydown);
        document.addEventListener("keyup", Input.keyup);
        document.addEventListener("mousemove", Input.movemouse);
        document.addEventListener("mousedown", Input.mousedown);
        document.addEventListener("mouseup", Input.mouseup);
    }

    static keypress(key) {
        var code = maps[key];
        if (code == undefined || null) return false;
        var s = state[code];
        if (s == undefined || null) {
            state[code] = false;
            return false;
        }
        return s;
    }

    static update() {
        dx = mx - ax;
        dy = my - ay;
        ay = my;
        ax = mx;

    }

    static get mouseX() {
        return mx;
    }

    static get mouseY() {
        return my;
    }

    static get deltaX() {
        return dx;
    }

    static get deltaY() {
        return dy;
    }

    static get mousePressed() {
        return mp;
    }
    
    static keydown(key) {
        state[key.keyCode] = true;
    }
    
    static keyup(key) {
        state[key.keyCode] = false;
    }

    static movemouse(mouse) {
        mx = mouse.clientX;
        my = mouse.clientY;
    }

    static mousedown(mouse) {
        if (mouse.buttons == 1) mp = true;
    }

    static mouseup(mouse) {
        if (mouse.buttons == 0) mp = false;
    }
};