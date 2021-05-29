var scriptName = "Scale by Protobacillus";

// SETTINGS

var mainExport = {
  name: "export",
  fps: 60,
  dimensions: [2020, 1450],
  duration: 4, // seconds
};
var generatedExports = [
  {
    name: "full-hd",
    fps: 60,
    dimensions: [1920, 1080],
    duration: 4,
  },
  {
    name: "4x5",
    fps: 30,
    dimensions: [1080, 1350],
    duration: 4,
  },
];

function getFileId() {
  if (!app.project.file) {
    return "";
  }
  return "_" + app.project.file.name;
}

function prepareExport(comp, settings) {
  resize(comp, settings.dimensions);
  setFramerate(comp, settings.fps);
  comp.name =
    "@" +
    settings.name +
    "_" +
    settings.dimensions[0] +
    "x" +
    settings.dimensions[1] +
    getFileId();
}

function protoScale(finalComp) {
  if (!finalComp) {
    return alert("Please select the main export comp.");
  }

  // start undo group
  app.beginUndoGroup(scriptName);

  // use info panel for debugging
  clearOutput();
  writeLn(scriptName);

  // resize all items
  recursiveVisit(app.project.items, function (currentItem) {
    resize(currentItem, mainExport.dimensions);
  });

  // this is for the selected item only
  precompLayers(finalComp, "pre-export");

  // prepare the main export
  prepareExport(finalComp, mainExport);

  // create specific exports
  forEach(generatedExports, function (setting) {
    prepareExport(finalComp.duplicate(), setting);
  });

  // end undo group
  app.endUndoGroup();
}

protoScale(byNameOrActive(mainExport.name));
