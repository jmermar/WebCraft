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