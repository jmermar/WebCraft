class Physics {
    static collision(box, world, ignore) {
        if (!(ignore instanceof Set)) ignore = new Set();
        var sx = Math.floor(box.position[0]);
        var sy = Math.floor(box.position[1]);
        var sz = Math.floor(box.position[2]);
        var ex = Math.floor(box.position[0] + box.size[0]);
        var ey = Math.floor(box.position[1] + box.size[1]);
        var ez = Math.floor(box.position[2] + box.size[2]);
        var coll = false;
        var maxX = null;
        var maxY = null;
        var maxZ = null;
        var minX = null;
        var minY = null;
        var minZ = null;

        var b = new Set();

        for(var x = sx; x <= ex; x++) {
            for(var y = sy; y <= ey; y++) {
                for(var z = sz; z <= ez; z++) {
                    if(world.getBlock(x, y, z).nocoll != true && !ignore.has([x, y, z].join(","))) {
                        coll = true;
                        maxX = this.max(x + 1, maxX);
                        minX = this.min(x, minX);
                        maxY = this.max(y + 1, maxY);
                        minY = this.min(y, minY);
                        maxZ = this.max(z + 1, maxZ);
                        minZ = this.min(z, minZ);
                        b.add([x, y, z].join(","));
                    }
                }
            }
        }

        return {
            collision: coll,
            max: [maxX, maxY, maxZ],
            min: [minX, minY, minZ],
            blocks: b,
        }
    }

    static max(a, b) {
        if (a == null) return b;
        if (b == null) return a;
        if (a > b) return a;
        else return b;
    }
    
    static min(a, b) {
        if (a == null) return b;
        if (b == null) return a;
        if (a < b) return a;
        else return b;
    }
}

class Raycast {
    constructor(world, position, dir, max) {
        this.world = world;
        this.position = position.slice(0);
        this.dir = new Array(3);
        this.max = max;
        vec3.normalize(this.dir, dir);
    }

    getBlock(step) {
        var block = null;
        var pos = this.position.slice();
        var bx, by, bz;
        var dir = new Array(3);
        var newPos = new Array(3);
        vec3.scale(dir, this.dir, step);
        for(var i = 0; i < this.max; i += step) {
            vec3.add(newPos, pos, dir);
            bx = Math.floor(newPos[0]);
            by = Math.floor(newPos[1]);
            bz = Math.floor(newPos[2]);
            block = world.getBlock(bx, by, bz);
            if (!block.air) break;
            pos = newPos.slice(0);
        }

        var nx = Math.floor(pos[0]) - bx;
        var ny = Math.floor(pos[1]) - by;
        var nz = Math.floor(pos[2]) - bz;

        if (!block.air) return {
            block: block,
            position: [bx, by, bz],
            normal: [nx, ny, nz],
        }; else return null;
    }
}