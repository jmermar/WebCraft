fs = require("fs");
output = ""
fs.readdirSync("Shaders").forEach(function(file) {
    output = output + file.match(/([A-Za-z0-9_]+).glsl+/)[1] + " = '"
        + fs.readFileSync("Shaders/" + file, "utf8")
        .replace(/(\n|\r\n|\r)+/g, "\\n")
        + "';\n";
});

fs.writeFileSync("code/shader_sources.js", output, "utf8");