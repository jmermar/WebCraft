import global from "../global";

function loadShader(type, source) {
  const shader = global.gl.createShader(type);

  global.gl.shaderSource(shader, source);

  global.gl.compileShader(shader);

  if (!global.gl.getShaderParameter(shader, global.gl.COMPILE_STATUS)) {
    alert("Cannot create shader: " + global.gl.getShaderInfoLog(shader));
    global.gl.deleteShader(shader);
    return null;
  }

  return shader;
}

export class Shader {
  constructor(vertexSRC, fragmentSRC) {
    this.vertex = loadShader(global.gl.VERTEX_SHADER, vertexSRC);
    this.fragment = loadShader(global.gl.FRAGMENT_SHADER, fragmentSRC);

    this.program = global.gl.createProgram();
    global.gl.attachShader(this.program, this.vertex);
    global.gl.attachShader(this.program, this.fragment);
    global.gl.linkProgram(this.program);

    if (!global.gl.getProgramParameter(this.program, global.gl.LINK_STATUS)) {
      alert(
        "Cannot link program " + global.gl.getProgramInfoLog(shaderProgram)
      );
      global.gl.deleteProgram(this.program);
      return null;
    }
  }

  free() {
    global.gl.deleteShader(this.vertex);
    global.gl.deleteShader(this.fragment);
    global.gl.deleteProgram(this.program);
    this.vertex = null;
    this.fragment = null;
    this.program = null;
  }

  bind() {
    global.gl.useProgram(this.program);
  }

  unbind() {
    global.gl.useProgram(null);
  }

  getUniform(v) {
    return global.gl.getUniformLocation(this.program, v);
  }
}
