import global from "../global";

export class Texture {
  constructor(texture) {
    this.texture = global.gl.createTexture();
    global.gl.bindTexture(global.gl.TEXTURE_2D, this.texture);
    global.gl.texImage2D(
      global.gl.TEXTURE_2D,
      0,
      global.gl.RGBA,
      global.gl.RGBA,
      global.gl.UNSIGNED_BYTE,
      texture
    );

    global.gl.texParameteri(
      global.gl.TEXTURE_2D,
      global.gl.TEXTURE_WRAP_S,
      global.gl.CLAMP_TO_EDGE
    );
    global.gl.texParameteri(
      global.gl.TEXTURE_2D,
      global.gl.TEXTURE_WRAP_T,
      global.gl.CLAMP_TO_EDGE
    );
    global.gl.texParameteri(
      global.gl.TEXTURE_2D,
      global.gl.TEXTURE_MIN_FILTER,
      global.gl.NEAREST
    );
    global.gl.texParameteri(
      global.gl.TEXTURE_2D,
      global.gl.TEXTURE_MAG_FILTER,
      global.gl.NEAREST
    );

    global.gl.bindTexture(global.gl.TEXTURE_2D, null);
  }

  free() {
    global.gl.deleteTexture(this.texture);
    this.texture = null;
  }

  bind() {
    global.gl.bindTexture(global.gl.TEXTURE_2D, this.texture);
  }

  unbind() {
    global.gl.bindTexture(global.gl.TEXTURE_2D, null);
  }
}
