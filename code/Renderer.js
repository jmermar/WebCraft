class Mesh {
    constructor(gl, vertex, texCoords, indices) {
        this.gl = gl;
        this.vao = gl.createVertexArray();
        this.len = indices.length;
        gl.bindVertexArray(this.vao);

        this.eb = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.eb);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);

        this.vertex = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex), gl.STATIC_DRAW);

        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 6 * 4, 0);
        gl.enableVertexAttribArray(0);

        gl.vertexAttribPointer(1, 3, gl.FLOAT, true, 6 * 4, 12);
        gl.enableVertexAttribArray(1);

        this.txt = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.txt);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        gl.vertexAttribPointer(2, 2, gl.FLOAT, true, 0, 0);
        gl.enableVertexAttribArray(2);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.eb);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    free() {
        this.gl.deleteBuffer(this.txt);
        this.gl.deleteBuffer(this.eb);
        this.gl.deleteBuffer(this.vertex);
        this.gl.deleteVertexArray(this.vao);
        this.vertex = null;
        this.vao = null;
        this.eb = null;
        this.txt = null;
    }

    bind() {
        this.gl.bindVertexArray(this.vao);
    }

    unbind() {
        this.gl.bindVertexArray(null);
    }

    draw() {
        this.gl.drawElements(this.gl.TRIANGLES, this.len, this.gl.UNSIGNED_INT, 0);
    }
}

function loadShader(gl, type, source) {

    reader = new FileReader();

    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);

    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("Cannot create shader: "+ gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

class Shader {
    constructor(gl, vertexSRC, fragmentSRC) {
        this.gl = gl;
        this.vertex = loadShader(gl, gl.VERTEX_SHADER, vertexSRC);
        this.fragment = loadShader(gl, gl.FRAGMENT_SHADER, fragmentSRC);

        this.program = gl.createProgram();
        gl.attachShader(this.program, this.vertex);
        gl.attachShader(this.program, this.fragment);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            alert("Cannot link program " + gl.getProgramInfoLog(shaderProgram));
            gl.deleteProgram(this.program);
            return null;
          }
    }

    free() {
        this.gl.deleteShader(this.vertex);
        this.gl.deleteShader(this.fragment);
        this.gl.deleteProgram(this.program);
        this.vertex = null;
        this.fragment = null;
        this.program = null;
    }

    bind() {
        this.gl.useProgram(this.program);
    }

    unbind() {
        this.gl.useProgram(null);
    }

    getUniform(v) {
        return this.gl.getUniformLocation(this.program, v);
    }
}

class Texture {
    constructor(gl, texture) {
        this.gl = gl;
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
            gl.UNSIGNED_BYTE,
            document.getElementById(texture)
        );
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    free() {
        this.gl.deleteTexture(this.texture);
        this.texture = null;
    }

    bind() {
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    }

    unbind() {
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }
}

class Renderer {
    constructor() {
        this.chunkMeshes = new Map();

        this.models = new Map();

        this.canvas = document.getElementById("glCanvas");

        this.gl = this.canvas.getContext("webgl2");
        if (this.gl == null) {
            alert("Cannot use webgl");
            return;
        }

        this.altas = new Texture(this.gl, "atlas");

        this.shader = new Shader(this.gl, basic_vertex, basic_fragment);
        this.mUniform = this.shader.getUniform("modelMatrix");
        this.vUniform = this.shader.getUniform("viewMatrix");
        this.pUniform = this.shader.getUniform("projMatrix");

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.enable(this.gl.SAMPLE_ALPHA_TO_COVERAGE);
        this.gl.sampleCoverage(0.9, false);
        this.gl.frontFace(this.gl.CW);
        this.gl.cullFace(this.gl.FRONT);

        this.pMatrix = new Float32Array(16);
        this.mvMatrix = new Float32Array(16);
        this.vMatrix = new Float32Array(16);

        this.resizeCanvas(800, 600);
        this.setCam([0, 0, 0], [0, 0, 0]);
    }

    get opengl() {
        return this.gl;
    }

    loadModel(name, texture, data) {
        var model = this.models.get(name);

        if (model != null) {
            model.mesh.free();
            model.tex.free();
        }

        model = {
            mesh: new Mesh(this.gl, data.vertex, data.coords, data.indices),
            tex: new Texture(this.gl, texture),
            instances: new Set(),
        }

        this.models.set(name, model);
    }

    freeModel(name) {
        var model = this.models.get(name);

        if (model != null) {
            model.mesh.free();
            model.tex.free();

            this.models.delete(model);
        }
    }

    addInstance(model, instance) {
        var i = this.models.get(model).instances;

        var mMatrix = new Float32Array(16);
        mat4.identity(mMatrix);

        mat4.translate(mMatrix, mMatrix, instance.position);

        mat4.rotate(mMatrix, mMatrix, glMatrix.toRadian(instance.rotation[0]), [1, 0, 0]);
        mat4.rotate(mMatrix, mMatrix, glMatrix.toRadian(instance.rotation[1]), [0, 1, 0]);
        mat4.rotate(mMatrix, mMatrix, glMatrix.toRadian(instance.rotation[2]), [0, 0, 1]);

        instance.matrix = mMatrix;

        i.add(instance);
    }

    clearColor(red, green, blue) {
        this.gl.clearColor(red, green, blue, 1.0);
    }

    freeChunk(hash) {
        var chunk = this.chunkMeshes.get(hash);

        if (chunk != null) {
            chunk.mesh.free();
        }

        this.chunkMeshes.delete(hash)
    }

    generateChunkMesh(world, position) {
        var chunk = this.chunkMeshes.get(world.chunkHash(position[0], position[1], position[2]));
        if (chunk != undefined ) {
            chunk.mesh.free();
        }

        var vertex = [];
        var indices = [];
        var coords = [];

        for(var x = 0; x < world.cl; x++) {
            for(var y = 0; y < world.cl; y++) {
                for(var z = 0; z < world.cl; z++) {
                    var bx = x + position[0] * world.cl;
                    var by = y + position[1] * world.cl;
                    var bz = z + position[2] * world.cl;
                    var block = world.getBlock(bx, by, bz);

                    var addFace = function(face, coord, normal) {
                        var idx = Math.floor(vertex.length / 6);

                        for(var i = 0; i < 4; i++) {
                            vertex.push(x + face[0 + i * 3]);
                            vertex.push(y + face[1 + i * 3]);
                            vertex.push(z + face[2 + i * 3]);
                            vertex.push(normal[0]);
                            vertex.push(normal[1]);
                            vertex.push(normal[2]);
                        }
                        indices.push(idx); indices.push(idx + 1); indices.push(idx + 2);
                        indices.push(idx); indices.push(idx + 2); indices.push(idx + 3);

                        var rc = [coord[0] / 16, coord[1] / 16, (coord[0] + 1) / 16, (coord[1] + 1) / 16];

                        coords.push(rc[0]);  coords.push(rc[1]);
                        coords.push(rc[2]);  coords.push(rc[1]);
                        coords.push(rc[2]);  coords.push(rc[3]);
                        coords.push(rc[0]);  coords.push(rc[3]);
                    }
                    
                    if (!block.air) {
                        if (world.getBlock(bx - 1, by, bz).transparent == true) {
                            addFace([
                                0, 1, 1,
                                0, 1, 0,
                                0, 0, 0,
                                0, 0, 1,
                            ], block.sides, [-1, 0, 0]);
                        }

                        if (world.getBlock(bx + 1, by, bz).transparent == true) {
                            addFace([
                                1, 1, 0,
                                1, 1, 1,
                                1, 0, 1,
                                1, 0, 0
                            ], block.sides, [+1, 0, 0]);
                        }

                        if (world.getBlock(bx, by, bz - 1).transparent == true) {
                            addFace([
                                0, 1, 0,
                                1, 1, 0,
                                1, 0, 0,
                                0, 0, 0
                            ], block.sides, [0, 0, -1]);
                        }

                        if (world.getBlock(bx, by, bz + 1).transparent == true) {
                            addFace([
                                1, 1, 1,
                                0, 1, 1,
                                0, 0, 1,
                                1, 0, 1,
                            ], block.sides, [0, 0, 1]);
                        }

                        if (world.getBlock(bx, by + 1, bz).transparent == true) {
                            addFace([
                                0, 1, 1,
                                1, 1, 1,
                                1, 1, 0,
                                0, 1, 0,
                            ], block.top, [0, 1, 0]);
                        }

                        if (world.getBlock(bx, by - 1, bz).transparent == true) {
                            addFace([
                               0, 0, 0,
                               1, 0, 0,
                               1, 0, 1,
                               0, 0, 1,
                            ], block.bottom, [0, -1, 0]);
                        }
                    }
                }
            }
        }

        if (indices.length == 0) return;

        var model = new Float32Array(16);
        mat4.identity(model);

        mat4.translate(model, model, [position[0] * world.cl, position[1] * world.cl, position[2] * world.cl]);
        this.chunkMeshes.set(world.chunkHash(position[0], position[1], position[2]), {
            model : model,
            mesh : new Mesh(this.gl, vertex, coords, indices)
        });
    }

    resizeCanvas(w, h) {
        mat4.perspective(this.pMatrix,
            glMatrix.toRadian(45),
            w / h,
            0.1, 1000);

        this.canvas.width = w;
        this.canvas.height = h;
        this.gl.viewport(0, 0, w, h);
    }

    setCam(position, rotation) {
        var desp = [-position[0], -position[1], -position[2]];
        mat4.identity(this.vMatrix);

        mat4.rotate(this.vMatrix, this.vMatrix, glMatrix.toRadian(rotation[0]), [1, 0, 0]);
        mat4.rotate(this.vMatrix, this.vMatrix, glMatrix.toRadian(rotation[1]), [0, 1, 0]);
        mat4.rotate(this.vMatrix, this.vMatrix, glMatrix.toRadian(rotation[2]), [0, 0, 1]);

        mat4.translate(this.vMatrix, this.vMatrix, desp);
    }

    render() {
        if (this.canvas.width != window.innerWidth
            || this.canvas.height != window.innerHeight)
            this.resizeCanvas(window.innerWidth, window.innerHeight);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.shader.bind();

        this.gl.uniformMatrix4fv(this.pUniform, false, this.pMatrix);
        this.gl.uniformMatrix4fv(this.vUniform, false, this.vMatrix);

        //Draw chunks
        this.altas.bind();
        var rnd = this;
        this.chunkMeshes.forEach(function(value, key, map) {
            rnd.gl.uniformMatrix4fv(rnd.mUniform, false, value.model);
            var mesh = value.mesh;
            mesh.bind();
            mesh.draw();
            mesh.unbind();
        });

        this.altas.unbind();

        this.models.forEach(function(value) {
            value.tex.bind();
            value.mesh.bind();
            value.instances.forEach(function(ins) {
                rnd.gl.uniformMatrix4fv(rnd.mUniform, false, ins.matrix);
                value.mesh.draw();
            });
            value.mesh.unbind();
            value.tex.unbind();
        });

        this.shader.unbind();
    }
}