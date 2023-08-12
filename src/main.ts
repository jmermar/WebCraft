import { World } from "./World.js";
import { Renderer } from "./rendering/Renderer.js";
import { Input } from "./Input.js";
import { GUI } from "./GUI.js";
import { ResourceManager } from "./ResourceManager.js";
import global from "./global.js";

global.canvas = document.getElementById(
  "glCanvas"
) as unknown as HTMLCanvasElement;

global.gl = global.canvas.getContext("webgl2");
if (global.gl == null) {
  alert("Cannot use webgl");
}

async function main() {
  GUI.setGenInfo();
  global.rm = new ResourceManager();
  await global.rm.loadImages();
  var render = new Renderer();
  const maxFPS = 60;
  global.input = new Input();

  const selSize: any = document.getElementById("world_size");
  const size = parseInt(selSize.options[selSize.selectedIndex].value);
  global.world = new World(size, 8, render);

  global.world.generateTerrain(
    function (info: any) {
      GUI.genInfoShowText(
        info + "\nProgres: " + Math.floor(global.world.progress * 100) + "%."
      );
    },
    function () {
      GUI.setPlaying(function (block: any) {
        global.world.player.buildBlock = block;
      });
      global.world.autoLoadChunks();
      var last = Date.now();

      var imp = 0;
      render.clearColor(0.53, 0.807, 0.98);
      function draw() {
        var delta = (Date.now() - last) / 1000;
        last = Date.now();
        global.input.update();

        global.world.update(delta);

        render.render();

        imp++;
        if (imp >= 20) {
          imp = 0;
        }

        while (Date.now() - last < 1000 / maxFPS);
        requestAnimationFrame(draw);
      }

      requestAnimationFrame(draw);
    }
  );
}

export { main };
