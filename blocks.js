blocks = [
    {
        name: "air",
        nocoll: true,
        air: true,
        transparent: true,
    },
    {
        name: "nopass",
        air: true,
        transparent: true,
    },
    {
        name: "dirt",
        top:    [0, 0],
        bottom: [0, 0],
        sides:  [0, 0],
        refresh: function(world, x, y, z) {
            var ublock = world.getBlock(x, y + 1, z);
            if (ublock.transparent && ublock.name != "water") {
                for (var i = y - 1; i <= y + 1; i++) {
                    var b1 = world.getBlock(x - 1, i, z).name;
                    var b2 = world.getBlock(x + 1, i, z).name;
                    var b3 = world.getBlock(x, i, z + 1).name;
                    var b4 = world.getBlock(x, i, z - 1).name;
    
                    if (b1 == "grass"
                        || b2 == "grass"
                        || b3 == "grass"
                        || b4 == "grass") {
                        world.setBlock(x, y, z, "grass", true);
                        break;
                    }
                }
            }
        }
    },
    {
        name: "water",
        nocoll: true,
        transparent: true,
        top:    [3, 0],
        bottom: [3, 0],
        sides:  [3, 0],
        refresh: function(world, x, y, z) {
            if (world.getBlock(x - 1, y, z).air) world.setBlock(x - 1, y, z, "water", true);
            if (world.getBlock(x + 1, y, z).air) world.setBlock(x + 1, y, z, "water", true);
            if (world.getBlock(x, y - 1, z).air) world.setBlock(x, y - 1, z, "water", true);
            if (world.getBlock(x, y, z - 1).air) world.setBlock(x, y, z - 1, "water", true);
            if (world.getBlock(x, y, z + 1).air) world.setBlock(x, y, z + 1, "water", true);
        }
    },
    {
        name: "grass",
        top:    [0, 3],
        bottom: [0, 0],
        sides:  [1, 3],
        refresh: function(world, x, y, z) {
            var ublock = world.getBlock(x, y + 1, z);
            if (!ublock.transparent || ublock.name == "water") world.setBlock(x, y, z, "dirt", true);
        }
    },
    {
        name: "snowgrass",
        top:    [2, 3],
        bottom: [0, 0],
        sides:  [3, 3],
    },
    {
        name: "snow",
        top:    [2, 3],
        bottom: [2, 3],
        sides:  [2, 3],
    },
    {
        name: "stone",
        top:    [1, 0],
        bottom: [1, 0],
        sides:  [1, 0],
    },
    {
        name: "sand",
        top:    [2, 0],
        bottom: [2, 0],
        sides:  [2, 0],
        refresh: function(world, x, y, z) {
            if (world.getBlock(x, y - 1, z).nocoll) {
                world.setBlock(x, y, z, "air", true);
                world.setBlock(x, y - 1, z, "sand", true);
            }
        }
    },
    {
        name: "glass",
        top:    [0, 2],
        bottom: [0, 2],
        sides:  [0, 2],
        transparent: true,
    },
    {
        name: "wood",
        top:    [1, 1],
        bottom: [1, 1],
        sides:  [0, 1],
    },
    {
        name: "leaf",
        top:    [2, 1],
        bottom: [2, 1],
        sides:  [2, 1],
    },
    {
        name: "bricks",
        top:    [1, 2],
        bottom: [1, 2],
        sides:  [1, 2],
    },
    {
        name: "planks",
        top:    [3, 2],
        bottom: [3, 2],
        sides:  [3, 2],
    }
];