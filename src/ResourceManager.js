import { Mesh } from "./rendering/Mesh";
import { Shader } from "./rendering/Shader";
import { Texture } from "./rendering/Texture";

export class ResourceManager {
  constructor() {
    this.meshes = new Map();
    this.shaders = new Map();
    this.textures = new Map();
    this.images = {};
  }

  async loadImages() {
    const loadImage = (url) => {
      const image = new Image();
      image.src = `textures/${url}.png`;
      return new Promise((resolve) => {
        image.onload = () => {
          resolve();
        };
        this.images[url] = image;
      });
    };
    await loadImage("atlas");
    await loadImage("wall");
  }

  free() {
    this.meshes.forEach(function (value) {
      value.free();
    });

    this.shaders.forEach(function (value) {
      value.free();
    });

    this.textures.forEach(function (value) {
      value.free();
    });
  }

  getTexture(name) {
    var tex = this.textures.get(name);
    if (tex == null) {
      tex = new Texture(this.images[name]);
      this.textures.set(name, tex);
    }
    return tex;
  }

  createMesh(name, data) {
    var mesh = this.meshes.get(name);
    if (mesh) {
      mesh.free();
    }

    mesh = new Mesh(data.vertex, data.coords, data.indices);
    this.meshes.set(name, mesh);
    return mesh;
  }

  createShader(name, vertex, fragment) {
    var shader = this.meshes.get(name);
    if (shader) {
      shader.free();
    }

    shader = new Shader(vertex, fragment);
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
