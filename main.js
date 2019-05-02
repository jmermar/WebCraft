class Player {
    constructor(world, position, rotation) {
        this.world = world;
        this.pos = position.slice(0);
        this.rot = rotation.slice(0);
        this.speed = 10;
        this.rotSpeed = 15;
        this.width = 0.8;
        this.height = 1.9;
        this.vspeed = 0.0;
        this.collision = true;

        this.setGravityAndJump(1.2, 0.5);
    }

    setGravityAndJump(h, t) {
        this.jumpSpeed = 4 * h / t;
        this.gravity = this.jumpSpeed * 2 / t;
    }

    update(delta) {
        var angle = this.rotation[1];
        var ix = 0;
        var iy = 0;
        var iz = 0;

        this.vspeed -= this.gravity * delta;
        if (Input.keypress("w")) {
            iz -= Math.cos(glMatrix.toRadian(angle)) * delta * this.speed;
            ix += Math.sin(glMatrix.toRadian(angle)) * delta * this.speed;
        }

        if (Input.keypress("s")) {
            iz += Math.cos(glMatrix.toRadian(angle)) * delta * this.speed;
            ix -= Math.sin(glMatrix.toRadian(angle)) * delta * this.speed;
        }

        if (Input.keypress("d")) {
            iz += Math.sin(glMatrix.toRadian(angle)) * delta * this.speed / 2;
            ix += Math.cos(glMatrix.toRadian(angle)) * delta * this.speed / 2;
        }

        if (Input.keypress("a")) {
            iz -= Math.sin(glMatrix.toRadian(angle)) * delta * this.speed / 2;
            ix -= Math.cos(glMatrix.toRadian(angle)) * delta * this.speed / 2;
        }

        if (Input.keypress("jump") && this.ground) {
            this.vspeed = this.jumpSpeed;
        }

        iy += this.vspeed * delta;

        if (Input.keypress("noclip")) {
            this.collision = false;
        }

        if (Input.keypress("physics")) {
            this.collision = true;
        }

        if (Input.mousePressed) {
            this.rot[1] += Input.deltaX * delta * this.rotSpeed;
            this.rot[0] += Input.deltaY * delta * this.rotSpeed;
            if (this.rot[0] < -75) this.rot[0] = -75;
            if (this.rot[0] > 75) this.rot[0] = 75;
        }

        if (this.collision == true) {
            var ignoreBlocks = Physics.collision(this.collbox, this.world).blocks;
            //Move y
            if (iy != 0) {
                this.pos[1] += iy;
                var result = Physics.collision(this.collbox, this.world, ignoreBlocks);
                if (result.collision) {
                    if(iy < 0) {
                        this.ground = true;
                        this.vspeed = 0;
                    }
                    this.pos[1] = iy > 0 ? (result.min[1] - 0.01 - this.height) : result.max[1];
                } else {
                    this.ground = false;
                }
            }
            //Move x
            if (ix != 0) {
                this.pos[0] += ix;
                var result = Physics.collision(this.collbox, this.world, ignoreBlocks);
                if (result.collision) {
                    this.pos[0] = ix > 0 ? (result.min[0] - 0.01 - this.width / 2) : (result.max[0] + 0.01 + this.width / 2);
                }
            }
            //Move z
            if (iz != 0) {
                this.pos[2] += iz;
                var result = Physics.collision(this.collbox, this.world, ignoreBlocks);
                if (result.collision) {
                    this.pos[2] = iz > 0 ? (result.min[2] - 0.01 - this.width / 2) : (result.max[2] + 0.01 + this.width / 2);
                }
            }
        } else {
            this.pos[0] += ix;
            this.pos[1] += iy;
            this.pos[2] += iz;
        }
    }

    get position() {
        return this.pos.slice();
    }

    get rotation() {
        return this.rot.slice();
    }

    get collbox() {
        return {
            position: [this.pos[0] - this.width / 2, this.pos[1], this.pos[2] - this.width / 2],
            size: [this.width, this.height, this.width],
        };
    }

    get eyePos() {
        return [this.pos[0], this.pos[1] + 1.8, this.pos[2]];
    }
}

class World {
    constructor(size, height, render) {
        this.generated = false;
        this.render = render;
        this.size = size;
        this.height = height;
        this.renderDistance = 8;

        this.cl = 16;

        this.blockMaps = new Map();

        var t = this;
        blocks.forEach(function(val, i) {
            val.id = i;
            t.blockMaps.set(val.name, val);
        });

        this.map = new Int16Array(this.numChunks * this.chunkVolume);

        this.chunks = new Map();

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

        var x = 0;
        var z = 0;

        var t = this;

        var fun = function() {
            update();
            t.generateChunk(x, z);
            t.progress += 1.0 / (t.size * t.size);
            x++;
            if (x >= t.size) {
                x = 0;
                z++;
                if (z >= t.size) {
                    t.placePlayer();
                    finish();
                    return;
                } 
            }
            requestAnimationFrame(fun);
        };

        requestAnimationFrame(fun);
    }

    generateChunk(cx, cz) {
        for (var x = cx * this.cl; x < (cx + 1) * this.cl; x++) {
            for (var z = cz * this.cl; z < (cz + 1) * this.cl; z++) {
                var h = Math.floor(50 + noise.simplex2(x / 32, z / 32) * 2);
                for (var y = 0; y < this.worldHeight; y++) {
                    var n3d = noise.simplex3(x/16, y/10, z/16);
                    if (n3d > -0.5 || y  == 0) {
                        if (y == h) this.setBlock(x, y, z, "grass");
                        else if (y < h && y > h - 5) this.setBlock(x, y, z, "dirt");
                        else if (y <= h - 5) this.setBlock(x, y, z, "stone");
                        else this.setBlock(x, y, z, "air");
                    } else this.setBlock(x, y, z, "air");
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

    setBlock(x, y, z, block) {
        if (x < 0 || x >= this.cl * this.size) return;
        if (z < 0 || z >= this.cl * this.size) return;
        if (y < 0 || y >= this.cl * this.height) return;

        this.map[y * this.worldLength * this.worldLength + z * this.worldLength + x] = this.blockMaps.get(block).id;
    }

    update(delta) {
        var t = this;
        this.chunks.forEach(function(value, key, map) {
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

function main() {
    document.getElementById("main_menu").hidden = true;
    document.getElementById("gen_info").hidden = false;
    var gen_info = document.getElementById("gen_info");

    var render = new Renderer();
    const maxFPS = 60;
    Input.init();

    const size = parseInt(document.getElementById("world_size").value);
    var world = new World(size, 8, render);

    world.generateTerrain(function() {
        gen_info.innerText = "Generating world.\nProgres: " + Math.floor(world.progress * 100) + "%.";
    }, function() {
        gen_info.hidden = true;
        document.getElementById("glCanvas").hidden = false;
        world.generateBor
        world.autoLoadChunks();
        var last = Date.now();

        var imp = 0;
        render.clearColor(0.53, 0.807, 0.98);
        function draw() {
            var delta = (Date.now() - last) / 1000;
            last = Date.now();
            Input.update();

            world.update(delta);

            render.render();

            imp++;
            if (imp >= 20) {
                imp = 0;
            }

            while(Date.now() - last < 1000 / maxFPS);
            requestAnimationFrame(draw);
        }

        requestAnimationFrame(draw);
    });
}