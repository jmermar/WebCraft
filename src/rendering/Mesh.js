import global from "../global";

export class Mesh {
  constructor(vertex, texCoords, indices) {
    this.vao = global.gl.createVertexArray();
    this.len = indices.length;
    global.gl.bindVertexArray(this.vao);

    this.eb = global.gl.createBuffer();
    global.gl.bindBuffer(global.gl.ELEMENT_ARRAY_BUFFER, this.eb);
    global.gl.bufferData(
      global.gl.ELEMENT_ARRAY_BUFFER,
      new Uint32Array(indices),
      global.gl.STATIC_DRAW
    );

    this.vertex = global.gl.createBuffer();
    global.gl.bindBuffer(global.gl.ARRAY_BUFFER, this.vertex);

    global.gl.bufferData(
      global.gl.ARRAY_BUFFER,
      new Float32Array(vertex),
      global.gl.STATIC_DRAW
    );

    global.gl.vertexAttribPointer(0, 3, global.gl.FLOAT, false, 6 * 4, 0);
    global.gl.enableVertexAttribArray(0);

    global.gl.vertexAttribPointer(1, 3, global.gl.FLOAT, true, 6 * 4, 12);
    global.gl.enableVertexAttribArray(1);

    this.txt = global.gl.createBuffer();
    global.gl.bindBuffer(global.gl.ARRAY_BUFFER, this.txt);

    global.gl.bufferData(
      global.gl.ARRAY_BUFFER,
      new Float32Array(texCoords),
      global.gl.STATIC_DRAW
    );

    global.gl.vertexAttribPointer(2, 2, global.gl.FLOAT, true, 0, 0);
    global.gl.enableVertexAttribArray(2);

    global.gl.bindBuffer(global.gl.ELEMENT_ARRAY_BUFFER, this.eb);
    global.gl.bindBuffer(global.gl.ARRAY_BUFFER, null);
    global.gl.bindVertexArray(null);
  }

  free() {
    global.gl.deleteBuffer(this.txt);
    global.gl.deleteBuffer(this.eb);
    global.gl.deleteBuffer(this.vertex);
    global.gl.deleteVertexArray(this.vao);
    this.vertex = null;
    this.vao = null;
    this.eb = null;
    this.txt = null;
  }

  bind() {
    global.gl.bindVertexArray(this.vao);
  }

  unbind() {
    global.gl.bindVertexArray(null);
  }

  draw() {
    global.gl.drawElements(
      global.gl.TRIANGLES,
      this.len,
      global.gl.UNSIGNED_INT,
      0
    );
  }
}
