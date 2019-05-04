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
        this.movingCamera = false;

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



        if (this.collision) {
            this.vspeed -= this.gravity * delta;
            if (Input.keypress("jump") && this.ground) {
                this.vspeed = this.jumpSpeed;
            }
            iy += this.vspeed * delta;
        } else {
            if (Input.keypress("jump")) {
                iy += this.speed * delta;;
            }
            if (Input.keypress("shift")) {
                iy -= this.speed * delta;;
            }
        }

        if (Input.keypress("noclip")) {
            this.collision = false;
            this.vspeed = 0;
        }

        if (Input.keypress("physics")) {
            this.collision = true;
        }

        if (Input.mousePressed != 0) {
            this.pressing = true;
            if (Math.abs(Input.deltaX) - 2 > 0 || Math.abs(Input.deltaY) - 2 > 0) this.movingCamera = true;
            this.rot[1] += Input.deltaX * delta * this.rotSpeed;
            this.rot[0] += Input.deltaY * delta * this.rotSpeed;
            if (this.rot[0] < -75) this.rot[0] = -75;
            if (this.rot[0] > 75) this.rot[0] = 75;
        } else if (Input.mousePressed == 0) {
            if (!this.movingCamera && this.pressing) {
                var pCoords = world.render.screenToWorld(Input.mouseX, Input.mouseY);
                vec3.sub(pCoords, pCoords, this.eyePos);
                var rcast = new Raycast(world, this.eyePos, pCoords, 10);
                var block = rcast.getBlock(0.05);
                if (block != null) {
                    //console.log(block.position);
                    world.setBlock(block.position[0], block.position[1], block.position[2], "air");
                }
            }
            this.pressing = false;
            this.movingCamera = false;
        }
        if (Input.mouseRightPressed == 1) {
            var pCoords = world.render.screenToWorld(Input.mouseX, Input.mouseY);
            vec3.sub(pCoords, pCoords, this.eyePos);
            var rcast = new Raycast(world, this.eyePos, pCoords, 10);
            var block = rcast.getBlock(0.05);
            if (block != null) {
                //console.log(block.position);
                world.setBlock(
                    block.position[0] + block.normal[0],
                    block.position[1] + block.normal[1],
                    block.position[2] + block.normal[2],
                    "stone");
            }
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
                var h = Math.floor(50 + noise.simplex2(x / 50, z / 50) * 4);
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

    setBlock(x, y, z, block) {
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

var rm = null;
var world = null;

function main() {
    document.getElementById("main_menu").hidden = true;
    document.getElementById("gen_info").hidden = false;
    var gen_info = document.getElementById("gen_info");

    var render = new Renderer();
    const maxFPS = 60;
    Input.init();

    const size = parseInt(document.getElementById("world_size").value);
    world = new World(size, 8, render);

    world.generateTerrain(function(info) {
        gen_info.innerText = info + "\nProgres: " + Math.floor(world.progress * 100) + "%.";
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