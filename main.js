var global = {
    selector: ["dirt", "stone", "glass", "sand", "wood", "leaf", "bricks", "planks", "water"],
}

var rm = null;
var world = null;
var input = null;

function main() {
    GUI.setGenInfo();
    var render = new Renderer();
    const maxFPS = 60;
    input = new Input();

    const size = parseInt(document.getElementById("world_size").value);
    world = new World(size, 8, render);

    world.generateTerrain(function(info) {
         GUI.genInfoShowText(info +
            "\nProgres: " + Math.floor(world.progress * 100) + "%.");
    }, function() {
        GUI.setPlaying(function(block) {
            world.player.buildBlock = block;
        });
        world.autoLoadChunks();
        var last = Date.now();

        var imp = 0;
        render.clearColor(0.53, 0.807, 0.98);
        function draw() {
            var delta = (Date.now() - last) / 1000;
            last = Date.now();
            input.update();

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