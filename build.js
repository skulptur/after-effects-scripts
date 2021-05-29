var concat = require("concat-files");

function getPaths(paths) {
  var before = [];
  var after = [
    "./src/utils/afterEffects.js",
    "./src/utils/seededRandom.js",
    "./src/utils/ui.js",
    "./src/utils/utils.js",
  ];

  return ["./src/utils/header.js"]
    .concat(before)
    .concat(paths)
    .concat(after)
    .concat(["./src/utils/footer.js"]);
}

function build(filePaths, name) {
  concat(getPaths(filePaths), "./dist/" + name + ".jsx", function (err) {
    if (err) throw err;
    console.log("done with ", name);
  });
}

build(["./src/variation.js"], "variation");
build(["./src/randomizer.js"], "randomizer");
build(["./src/smart-resize-all.js"], "smart-resize-all");
