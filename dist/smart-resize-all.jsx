(function (thisObj) {

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

// UTILS

// adobe sucks and starts with index 1
function getItem(items, index) {
  return items[index + 1];
}

function forEach(elements, callback) {
  for (var i = 0; i < elements.length; i++) {
    callback(elements[i], i);
  }
}

function forEachItem(elements, callback) {
  for (var i = 0; i < elements.length; i++) {
    callback(getItem(elements, i), i);
  }
}

// to get the indices
function times(iterations, callback) {
  var result = [];

  for (var i = 0; i < iterations; i++) {
    result.push(callback(i));
  }

  return result;
}

function isComp(element) {
  return element instanceof CompItem;
}

function isFolder(element) {
  return element instanceof FolderItem;
}

// to visit the layers of a comp
function forEachLayer(element, callback) {
  if (isComp(element)) {
    forEachItem(element.layers, callback);
  }
}

function setPosition(element, x, y) {
  element.transform.position.setValue([x, y]);
}

function setFramerate(element, frameRate) {
  if (isComp(element)) {
    element.frameRate = frameRate;
  }
}

function scalePosition(element, xFactor, yFactor) {
  var positionValue = element.position.value;
  setPosition(element, positionValue[0] * xFactor, positionValue[1] * yFactor);
}

function recursiveVisit(rootItems, callback) {
  forEachItem(rootItems, function (currentItem) {
    if (isFolder(currentItem)) {
      return recursiveVisit(currentItem.items, callback);
    }

    callback(currentItem);
  });
}

// resize anything with a width and height property
function resize(currentItem, size) {
  var x = size[0];
  var y = size[1];
  var xFactor = x / currentItem.width;
  var yFactor = y / currentItem.height;

  // resize
  currentItem.width = x;
  currentItem.height = y;

  // adjust position of layers
  forEachLayer(currentItem, function (layer) {
    scalePosition(layer, xFactor, yFactor);
  });
}

function precompLayers(element, compName) {
  if (isComp(element) && element.layers.length > 1) {
    var layerIndices = times(element.numLayers, function (i) {
      return i + 1;
    });
    return element.layers.precompose(layerIndices, compName);
  }
}

// tries to find item by name, falls back to selected item
function byNameOrActive(compName) {
  var myComp = app.project.activeItem;
  for (var i = 1; i <= app.project.numItems; i++) {
    var element = app.project.item(i);
    if (isComp(element) && element.name === compName) {
      myComp = element;
      break;
    }
  }
  return myComp;
}

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
// UTILS

function lerp(v0, v1, t) {
  return v0 * (1 - t) + v1 * t;
}

// adobe sucks and starts with index 1
function getItem(items, index) {
  return items[index + 1];
}

function forEach(elements, callback) {
  for (var i = 0; i < elements.length; i++) {
    callback(elements[i], i);
  }
}

function forEachItem(elements, callback) {
  for (var i = 0; i < elements.length; i++) {
    callback(getItem(elements, i), i);
  }
}

// to get the indices
function times(iterations, callback) {
  var result = [];

  for (var i = 0; i < iterations; i++) {
    result.push(callback(i));
  }

  return result;
}

function isComp(element) {
  return element instanceof CompItem;
}

function isFolder(element) {
  return element instanceof FolderItem;
}

// to visit the layers of a comp
function forEachLayer(element, callback) {
  if (isComp(element)) {
    forEachItem(element.layers, callback);
  }
}

function recursiveVisit(rootItems, callback) {
  forEachItem(rootItems, function (currentItem) {
    if (isFolder(currentItem)) {
      return recursiveVisit(currentItem.items, callback);
    }

    callback(currentItem);
  });
}

// min and max included
function randomInt(min, max, random) {
  return Math.floor(random() * (max - min + 1) + min);
}

function getRandomizer(property, random, t) {
  return function (min, max) {
    return function (effect) {
      var propValue = effect.property(property).value;
      var value = Math.round(lerp(propValue, randomInt(min, max, random), t));

      effect.property(property).setValue(value);

      // to undo
      return function () {
        effect.property(property).setValue(propValue);
      };
    };
  };
}

function noop() {}

function imul(a, b) {
  var aHi = (a >>> 16) & 0xffff;
  var aLo = a & 0xffff;
  var bHi = (b >>> 16) & 0xffff;
  var bLo = b & 0xffff;
  // the shift by 0 fixes the sign on the high part
  // the final |0 converts the unsigned value into a signed value
  return (aLo * bLo + (((aHi * bLo + aLo * bHi) << 16) >>> 0)) | 0;
}

function seedGenerator(seed) {
  var h = 2166136261 >>> 0;

  for (var i = 0; i < seed.length; i++) {
    h = imul(h ^ seed.charCodeAt(i), 16777619);
  }

  return function () {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;

    return (h += h << 5) >>> 0;
  };
}

function xoshiro128(seed) {
  const getSeed = seedGenerator(seed);
  var a = getSeed();
  var b = getSeed();
  var c = getSeed();
  var d = getSeed();

  return function () {
    const t = b << 9;
    var r = a * 5;

    r = (r << 7) | ((r >>> 25) * 9);

    c ^= a;
    d ^= b;
    b ^= c;
    a ^= d;
    c ^= t;
    d = (d << 11) | (d >>> 21);

    return (r >>> 0) / 4294967296;
  };
}

function getChangeEffect(layer) {
  return function (effectName, callback) {
    var effect = layer.property("Effects").property(effectName);
    if (effect) {
      return callback(effect);
    }

    return noop;
  };
}

// UI helper functions

function createPanel(createUI) {
  var myPanel =
    thisObj instanceof Panel
      ? thisObj
      : new Window("window", scriptName, undefined, {
          resizeable: true,
        });

  myPanel.orientation = "column";
  myPanel.alignChildren = ["center", "top"];
  myPanel.spacing = 10;
  myPanel.margins = 16;

  createUI(myPanel);

  myPanel.onResizing = myPanel.onResize = function () {
    this.layout.resize();
  };
  if (myPanel instanceof Window) {
    myPanel.center();
    myPanel.show();
  } else {
    myPanel.layout.layout(true);
    myPanel.layout.resize();
  }
}

function createGroup(panel, name) {
  const group = panel.add("group", undefined, { name: name });
  group.orientation = "row";
  group.alignChildren = ["left", "center"];
  group.spacing = 10;
  group.margins = 0;
  return group;
}

function createButton(panel, name, onClick) {
  var randomizeButton = panel.add("button", undefined, undefined, {
    name: name,
  });
  randomizeButton.text = name;
  randomizeButton.onClick = onClick;
}

function createSlider(panel, name, props) {
  var label = panel.add("staticText", undefined, undefined, {
    name: name + "Label",
  });
  label.text = name;
  label.alignment = ["left", "top"];

  var slider = panel.add("slider", undefined, undefined, undefined, undefined, {
    name: name,
  });
  //   slider.helpTip = "Weight";
  slider.minvalue = 0;
  slider.maxvalue = 100;
  slider.value = props.initialValue * 100;
  slider.preferredSize.width = 250;
  slider.onChange = function () {
    props.onChange(slider.value / 100);
  };

  return slider;
}

function createText(panel, name, align) {
  var staticText = panel.add("statictext", undefined, undefined, {
    name: name,
  });
  staticText.text = name;
  staticText.alignment = [align, "top"];
  return staticText;
}

function createCheckbox(group, name, props) {
  var checkbox = group.add("checkbox", undefined, undefined, { name: name });
  checkbox.text = name;
  checkbox.value = props.initialValue > 0;
  checkbox.onClick = function () {
    props.onChange(!!checkbox.value ? 1 : 0);
  };

  return checkbox;
}

})(this);