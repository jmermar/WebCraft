class World {
    constructor(size, height, render) {
        this.generated = false;
        this.render = render;
        this.size = size;
        this.height = height;
        this.renderDistance = 8;
        this.updateTicks = 4;
        this.updateWait = 0;

        this.cl = 16;

        this.blockMaps = new Map();

        var t = this;
        blocks.forEach(function(val, i) {
            val.id = i;
            t.blockMaps.set(val.name, val);
        });

        this.map = new Int16Array(this.numChunks * this.chunkVolume);

        this.chunks = new Map();

        this.refresh = new Array();
        this.nextRefresh = new Array();

        this.createBorders();
    }

    get numChunks() {
        return this.size * this.size * this.height;
    }

    get chunkVolume() {
        return this.cl * this.cl * this.cl;
    }

    get worldLength() {
        return this.cl * this.size;
    }

    get worldHeight() {
        return this.cl * this.height;
    }

    autoLoadChunks() {
        var t = this;
        this.interval = setInterval((function(){t.loader();}), 100);
        this.fchunks = setInterval((function() {t.freeChunks();}), 100)
    }

    stopAutoLoad() {
        clearInterval(this.interval);
        clearInterval(this.fchunks);
    }

    freeChunks() {
        const t = this;

        var freeChunks = [];

        this.chunks.forEach(function(chunk, key) {
            var dx = Math.floor(Math.abs((chunk.position[0] * t.cl + t.cl / 2) - t.player.eyePos[0]) / t.cl);
            var dz = Math.floor(Math.abs((chunk.position[2] * t.cl + t.cl / 2) - t.player.eyePos[2]) / t.cl);

            if (dx > t.renderDistance || dz > t.renderDistance) freeChunks.push(key);
        });

        freeChunks.forEach(function(chunk) {
            t.render.freeChunk(chunk);
            t.chunks.delete(chunk);
        });
    }

    loader() {
        var x = 0;
        var y = 0;
        var z = 0;

        var p = 1;
        var sx = Math.floor(Math.max(0, (this.player.eyePos[0] / this.cl) - p));
        var sz = Math.floor(Math.max(0, (this.player.eyePos[2] / this.cl) - p));

        var ex = Math.floor(Math.min(this.size - 1, (this.player.eyePos[0] / this.cl) + p));
        var ez = Math.floor(Math.min(this.size - 1, (this.player.eyePos[2] / this.cl) + p));

        x = sx;
        y = 0;
        z = sz;

        while(this.chunks.get(this.chunkHash(x, y, z)) != null) {
            y++;
            if (y >= this.height) {
                y = 0;
                x++;
                if (x > ex) {
                    x = sx;
                    z++;
                    if (z > ez) {
                        p++;
                        if (p > this.renderDistance) return;
                        sx = Math.floor(Math.max(0, (this.player.eyePos[0] / this.cl) - p));
                        sz = Math.floor(Math.max(0, (this.player.eyePos[2] / this.cl) - p));

                        ex = Math.floor(Math.min(this.size - 1, (this.player.eyePos[0] / this.cl) + p));
                        ez = Math.floor(Math.min(this.size - 1, (this.player.eyePos[2] / this.cl) + p));
                        x = sx;
                        z = sz;
                    }
                }
            }


        }

        for(y = 0; y < this.height; y++) {
            if(this.chunks.get(this.chunkHash(x, y, z)) == null) {
                this.chunks.set(this.chunkHash(x, y, z), {
                    position: [x, y, z],
                    dirty: true,
                });
            }
        }
    }

    createBorders() {
        var wall = {
            vertex: new Array(this.worldHeight * this.worldLength * 24),
            coords: new Array(this.worldHeight * this.worldLength * 8),
            indices: new Array(this.worldHeight * this.worldLength * 6),
        }

        const face = [
            0, 1, 0,
            1, 1, 0,
            1, 0, 0,
            0, 0, 0,
        ];

        const coord = this.blockMaps.get("glass").sides;
        const rc = [coord[0] / 16, coord[1] / 16, (coord[0] + 1) / 16, (coord[1] + 1) / 16];

        for(var x = 0; x < this.worldLength; x++) {
            for(var y = 0; y < this.worldHeight; y++) {
                const i = y * this.worldLength + x;

                for(var e = 0; e < 4; e++) {
                    const idx = i * 24 + e * 6;
                    wall.vertex[idx + 0] = x + face[0 + e * 3];
                    wall.vertex[idx + 1] = y + face[1 + e * 3];
                    wall.vertex[idx + 2] = 0 + face[2 + e * 3];
                    wall.vertex[idx + 3] = 0;
                    wall.vertex[idx + 4] = 0;
                    wall.vertex[idx + 5] = -1;
                }

                wall.indices[i * 6 + 0] = i * 4 + 2; wall.indices[i * 6 + 1] = i * 4 + 1; wall.indices[i * 6 + 2] = i * 4;
                wall.indices[i * 6 + 3] = i * 4 + 3; wall.indices[i * 6 + 4] = i * 4 + 2; wall.indices[i * 6 + 5] = i * 4;

                wall.coords[i * 8 + 0] = rc[0];  wall.coords[i * 8 + 1] = rc[1];
                wall.coords[i * 8 + 2] = rc[2];  wall.coords[i * 8 + 3] = rc[1];
                wall.coords[i * 8 + 4] = rc[2];  wall.coords[i * 8 + 5] = rc[3];
                wall.coords[i * 8 + 6] = rc[0];  wall.coords[i * 8 + 7] = rc[3];
            }
        }

        this.render.loadModel("wall", "atlas", wall);

        this.render.addInstance("wall", {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
        });

        this.render.addInstance("wall", {
            position: [this.worldLength, 0, this.worldLength],
            rotation: [0, 180, 0],
        });

        this.render.addInstance("wall", {
            position: [this.worldLength, 0, 0],
            rotation: [0, -90, 0],
        });

        this.render.addInstance("wall", {
            position: [0, 0, this.worldLength],
            rotation: [0, 90, 0],
        });
        
    }

    placePlayer() {
        var startPos = [this.worldLength / 2, this.worldHeight, this.worldLength / 2];
        for (var i = this.worldHeight; i > 0; i--) {
            if (this.getBlock(startPos[0], i - 1, startPos[2]).name != "air") {
                startPos[1] = i + 1;
                break;
            }
        }
        this.player = new Player(this, startPos, [0, 0, 0]);
    }

    generateTerrain(update, finish) {
        noise.seed(Math.random());
        this.progress = 0.0;

        var t = this;

        var generate = function(generator, name, next) {
            t.progress = 0;
            var x = 0;
            var z = 0;
            var f = function() {
                update(name);
                generator(x, z);
                t.progress += 1.0 / (t.size * t.size);
                x++;
                if (x >= t.size) {
                    x = 0;
                    z++;
                    if (z >= t.size) {
                        next();
                        return;
                    } 
                }
                requestAnimationFrame(f);
            }
            requestAnimationFrame(f);
        }

        generate(t.generateChunkTerrain.bind(t), "Generating chunk terrain.",
            function() {
                generate(t.generateChunkCaves.bind(t), "Generating caves.",
                    function() {
                        generate(t.decorateChunk.bind(t), "Decorating chunks.", function() {
                            t.placePlayer();
                            finish();
                        });
                    });
                });
    }

    generateChunkTerrain(cx, cz) {
        const waterLevel = 49;
        for (var x = cx * this.cl; x < (cx + 1) * this.cl; x++) {
            for (var z = cz * this.cl; z < (cz + 1) * this.cl; z++) {
                var dx = ((this.worldLength / 2) -  x) / (this.worldLength / 2);
                var dz = ((this.worldLength / 2) -  z) / (this.worldLength / 2);
                var d = Math.sqrt(dx*dx+dz*dz);
                var h = Math.floor(53 + noise.simplex2(x / 50, z / 50) * 6) - d * d * 7;
                for (var y = 0; y < this.worldHeight; y++) {
                    var block;
                    if (y <= h) block = "stone";
                    else if (y <= waterLevel) block = "water"
                    else block = "air"

                    this.setBlock(x, y, z, block);
                }
            }
        }
    }

    generateChunkCaves(cx, cz) {
        for (var x = cx * this.cl; x < (cx + 1) * this.cl; x++) {
            for (var z = cz * this.cl; z < (cz + 1) * this.cl; z++) {
                for (var y = 0; y < this.worldHeight; y++) {
                    var n3d = ((y / 65) + noise.simplex3(x/12, y/10, z/12) * 3 + noise.simplex3(x / 80, y / 20, z / 80) * 10) / 14;
                    var block = this.getBlock(x, y, z).name;
                    if (n3d < -0.5 && block == "stone") block = "air";
                    if (y== 0) block = "stone";

                    this.setBlock(x, y, z, block);
                }
            }
        }
    }

    decorateChunk(cx, cz) {
        const dirtLevel = 4;
        for (var x = cx * this.cl; x < (cx + 1) * this.cl; x++) {
            for (var z = cz * this.cl; z < (cz + 1) * this.cl; z++) {
                var h = -1;
                for (var y = this.worldHeight - 1; y >= 0; y--) {
                    var block = this.getBlock(x, y, z).name;
                    var sblock = block;
                    var u = this.getBlock(x, y + 1, z).name;
                    if (h == -1 && block == "stone") {
                        if (u == "air") {
                            sblock = "grass";
                            h = y;
                        }
                        if (u == "water") {
                            sblock = "dirt";
                            h = y;
                        }
                    }
                    if (u == "water" && block == "air") sblock = "water"
                    else if (y >= h - dirtLevel && y < h) sblock = "dirt";

                    this.setBlock(x, y, z, sblock);
                }
            }
        }
    }

    getBlock(x, y, z) {
        if (x < 0 || x >= this.worldLength) return this.blockMaps.get("nopass");
        if (z < 0 || z >= this.worldLength) return this.blockMaps.get("nopass");
        if (y < 0 || y >= this.worldHeight) return this.blockMaps.get("nopass");
        
        return blocks[this.map[y * this.worldLength * this.worldLength + z * this.worldLength + x]];
    }

    updateChunk(x, y, z) {
        if (x < 0 || x >= this.size || y < 0 || y >= this.height || z < 0 || z >= this.size) return;
        var chunk = this.chunks.get(this.chunkHash(x, y, z));
        if (chunk != null) {
            chunk.dirty = true;
        }
    }

    setBlock(x, y, z, block, refresh) {
        if (x < 0 || x >= this.cl * this.size) return;
        if (z < 0 || z >= this.cl * this.size) return;
        if (y < 0 || y >= this.cl * this.height) return;

        this.map[y * this.worldLength * this.worldLength + z * this.worldLength + x] = this.blockMaps.get(block).id;
        var cx = Math.floor(x / this.cl);
        var cy = Math.floor(y / this.cl);
        var cz = Math.floor(z / this.cl);
        this.updateChunk(cx, cy, cz);
        if (x % this.cl == 0) this.updateChunk(cx - 1, cy, cz);
        if (y % this.cl == 0) this.updateChunk(cx, cy - 1, cz);
        if (z % this.cl == 0) this.updateChunk(cx, cy, cz - 1);
        if (x % this.cl - 1) this.updateChunk(cx + 1, cy, cz);
        if (y % this.cl - 1) this.updateChunk(cx, cy + 1, cz);
        if (z % this.cl - 1) this.updateChunk(cx, cy, cz + 1);
        if (refresh) {
            this.nextRefresh.push([x, y, z]);
            this.nextRefresh.push([x - 1, y, z]);
            this.nextRefresh.push([x, y - 1, z]);
            this.nextRefresh.push([x, y, z - 1]);
            this.nextRefresh.push([x + 1, y, z]);
            this.nextRefresh.push([x, y + 1, z]);
            this.nextRefresh.push([x, y, z + 1]);
        }
    }

    refreshBlock(x, y, z) {
        var block = this.getBlock(x, y, z);
        if(block.refresh != null) block.refresh(this, x, y, z);
    }

    updateBlock(x, y, z) {
        var block = this.getBlock(x, y, z);
        if (block.name == "dirt") {
            for (var i = y - 1; i <= y + 1; i++) {
                var b1 = this.getBlock(x - 1, i, z).name;
                var b2 = this.getBlock(x + 1, i, z).name;
                var b3 = this.getBlock(x, i, z + 1).name;
                var b4 = this.getBlock(x, i, z - 1).name;

                var a1 = this.getBlock(x - 1, i + 1, z);
                var a2 = this.getBlock(x + 1, i + 1, z);
                var a3 = this.getBlock(x, i + 1, z + 1);
                var a4 = this.getBlock(x, i + 1, z - 1);

                if (b1 == "grass" && a1.transparent) {
                    this.setBlock(x, y, z, "grass", true);
                    break;
                }
                if (b2 == "grass" && a2.transparent) {
                    this.setBlock(x, y, z, "grass", true);
                    break;
                }
                if (b3 == "grass" && a3.transparent) {
                    this.setBlock(x, y, z, "grass", true);
                    break;
                }
                if (b4 == "grass" && a4.transparent) {
                    this.setBlock(x, y, z, "grass", true);
                    break;
                }
            }
        }
    }

    update(delta) {
        var t = this;
        var update = false;
        this.updateWait += delta;
        if (this.updateWait >= 1 / this.updateTicks) {
            update = false;
            this.updateWait = 0;
        }
        var nr = this.nextRefresh;
        this.nextRefresh = [];
        if (t.refresh.length > 0) {
            t.refresh.forEach(function(val) {
                t.refreshBlock(val[0], val[1], val[2]);
            });
        }

        this.refresh = nr;

        this.chunks.forEach(function(value, key, map) {
            if (update) {
                var bx = value.position[0] * t.cl + Math.floor(Math.random() * t.cl);
                var by = value.position[1] * t.cl + Math.floor(Math.random() * t.cl);
                var bz = value.position[2] * t.cl + Math.floor(Math.random() * t.cl);
                t.updateBlock(bx, by, bz);
            }
            if(value.dirty) {
                value.dirty = false;
                t.render.generateChunkMesh(t, value.position);
            }
        });

        this.player.update(delta);
        this.render.setCam(this.player.eyePos, this.player.rotation);
    }

    chunkHash(x, y, z) {
        return y * this.size * this.size + z * this.size + x;
    }
}