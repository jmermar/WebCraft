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

class ResourceManager {
    constructor(gl) {
        this.gl = gl;
        this.meshes = new Map();
        this.shaders = new Map();
        this.textures = new Map();
    }

    free() {
        this.meshes.forEach(function(value) {
            value.free();
        });

        this.shaders.forEach(function(value) {
            value.free();
        });

        this.textures.forEach(function(value) {
            value.free();
        });
    }

    getTexture(name) {
        var tex = this.textures.get(name);
        if (tex == null) {
            tex = new Texture(this.gl, name);
            this.textures.set(name, tex);
        }
        return tex;
    }
    

    createMesh(name, data) {
        var mesh = this.meshes.get(name);
        if (mesh) {
            mesh.free();
        }

        mesh = new Mesh(this.gl, data.vertex, data.coords, data.indices);
        this.meshes.set(name, mesh);
        return mesh;
    }

    createShader(name, vertex, fragment) {
        var shader = this.meshes.get(name);
        if (shader) {
            shader.free();
        }

        shader = new Shader(this.gl, vertex, fragment);
        this.shaders.set(name, shader);
        return shader;
    }

    freeMesh(name) {
        var mesh = this.getMesh(name);
        mesh.free();
        this.meshes.delete(name);
    }

    freeTexture(name) {
        var txt = this.getTexture(name);
        txt.free();
        this.textures.delete(name);
    }

    freeShader(name) {
        var shader = this.getShader(name);
        shader.free();
        this.shaders.delete(name);
    }

    getShader(name) {
        return this.shaders.get(name);
    }

    getMesh(name) {
        return this.meshes.get(name);
    }
}