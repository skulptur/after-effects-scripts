(function (thisObj) {

var scriptName = "Randomizer by @protobacillus";

function main() {
  app.beginUndoGroup(scriptName);

  var state = {
    options: {
      selectedOnly: 0, // affect selected items only?
    },
  };

  // Randomize the params
  function run(configName) {
    app.beginUndoGroup(scriptName);

    var randomize = {
      seed: getRandomizer("Random Seed", Math.random, 1),
      palette: getRandomizer("Use Preset Palette", Math.random, 1),
      waveType: getRandomizer("Wave Type", Math.random, 1),
      kaleidaMirroring: getRandomizer("Mirroring", Math.random, 1),
    };

    var config = {
      seed: [
        {
          effect: "fractalNoise",
          operations: [randomize.seed(0, 10000)],
        },
        {
          effect: "cellPattern",
          operations: [randomize.seed(0, 10000)],
        },
        {
          effect: "turbulentDisplace",
          operations: [randomize.seed(0, 10000)],
        },
      ],
      kaleida: [
        {
          effect: "CC Kaleida",
          operations: [randomize.kaleidaMirroring(1, 9)],
        },
      ],
      colorama: [
        {
          effect: "APC Colorama",
          operations: [randomize.palette(1, 35)],
        },
      ],
      waveType: [
        {
          effect: "Wave Warp",
          operations: [randomize.waveType(1, 9)],
        },
      ],
    };

    recursiveVisit(app.project.items, function (currentItem) {
      // limit to selected items if there is any selection
      if (
        app.project.selection.length > 0 &&
        state.options.selectedOnly &&
        !currentItem.selected
      ) {
        return;
      }

      forEachLayer(currentItem, function (layer) {
        var changeEffect = getChangeEffect(layer);

        forEach(config[configName], function (item) {
          forEach(item.operations, function (operate) {
            changeEffect(item.effect, operate);
          });
        });
      });
    });

    app.endUndoGroup();
  }

  createUI(function (panel) {
    return {
      onDone: function () {
        commit();
        app.endUndoGroup();
        panel.close();
      },
      onWaveType: function () {
        run("waveType");
        // alert("waveType");
      },
      onKaleidaMirroring: function () {
        run("kaleida");
        // alert("kaleida");
      },
      onColorama: function () {
        run("colorama");
        // alert("colorama");
      },
      onSeed: function () {
        run("seed");
        // alert("seed");
      },
    };
  });

  function createUI(getProps) {
    createPanel(function (myPanel) {
      var props = getProps(myPanel);

      createText(myPanel, "Randomize", "center");

      createButton(myPanel, "All", function () {
        props.onColorama();
        props.onWaveType();
        props.onSeed();
        props.onKaleidaMirroring();
      });

      var buttonsGroup = createGroup(myPanel, "buttonsGroup");

      createButton(buttonsGroup, "Colorama", props.onColorama);
      createButton(buttonsGroup, "Wave Type", props.onWaveType);

      createButton(buttonsGroup, "Seed", props.onSeed);
      createButton(myPanel, "Kaleida", props.onKaleidaMirroring);

      var actionButtonsGroup = createGroup(myPanel, "actionButtonsGroup");
      // createButton(actionButtonsGroup, "Cancel", props.onCancel);
      createButton(actionButtonsGroup, "Done", props.onDone);
    });
  }
}

main();
// AFTER EFFECTS SPECIFIC UTILS

function getItem(items, index) {
  // adobe sucks and starts with index 1
  return items[index + 1];
}

function forEachItem(elements, callback) {
  for (var i = 0; i < elements.length; i++) {
    callback(getItem(elements, i), i);
  }
}

function isComp(element) {
  return element instanceof CompItem;
}

function isFolder(element) {
  return element instanceof FolderItem;
}

function forEachLayer(element, callback) {
  // to visit the layers of a comp
  if (isComp(element)) {
    forEachItem(element.layers, callback);
  }
}

function recursiveVisit(rootItems, callback) {
  // visit items in the project
  forEachItem(rootItems, function (currentItem) {
    if (isFolder(currentItem)) {
      return recursiveVisit(currentItem.items, callback);
    }

    callback(currentItem);
  });
}

function getRandomizer(property, random, t) {
  // effect param randomizer
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

function byNameOrActive(compName) {
  // tries to find item by name, falls back to selected item
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

function getChangeEffect(layer) {
  return function (effectName, callback) {
    var effect = layer.property("Effects").property(effectName);
    if (effect) {
      return callback(effect);
    }

    return noop;
  };
}
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
// UI UTILS

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
// UTILS
function lerp(v0, v1, t) {
  return v0 * (1 - t) + v1 * t;
}

function forEach(elements, callback) {
  for (var i = 0; i < elements.length; i++) {
    callback(elements[i], i);
  }
}

function times(iterations, callback) {
  var result = [];

  for (var i = 0; i < iterations; i++) {
    result.push(callback(i));
  }

  return result;
}

function randomInt(min, max, random) {
  // min and max included
  return Math.floor(random() * (max - min + 1) + min);
}

function noop() {}

})(this);