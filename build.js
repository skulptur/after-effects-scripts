var concat = require("concat-files");

function getPaths(paths) {
  var before = ["./src/utils/header.js"];
  var after = [
    "./src/utils/utils.js",
    "./src/utils/ui.js",
    "./src/utils/footer.js",
  ];
  return before.concat(paths).concat(after);
}

function build(filePaths, name) {
  concat(getPaths(filePaths), "./dist/" + name + ".jsx", function (err) {
    if (err) throw err;
    console.log("done with ", name);
  });
}

build(["./src/variation.js"], "variation");
build(["./src/smart-resize-all.js"], "smart-resize-all");
