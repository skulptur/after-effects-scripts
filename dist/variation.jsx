(function (thisObj) {

var scriptName = "Variation by @protobacillus";

// TODO:
// A/B button to compare but also to navigate (choose A or B to apply small changes)
// Another slider for amount of detail
// Brightness/Contrast/Vibrance/Saturation sliders that work without randomizing so adjustments can be made
// Slider to control change of skipping an effect
// Degrade: randomly disable effects with a slider
// Add more effects options
// Auto generate previews: put whole project in folder in case it isnt, then duplicate it deeply X times, each time automatically generating a variation. Then setup a comp that has 1 frame of each variation to preview easily
// Split into files and join on watch using gulp or a simple webpack config (or even an npm command)

function main() {
  app.beginUndoGroup(scriptName);

  var initialSeed = randomInt(10000, 20000, Math.random);
  var state = {
    seed: initialSeed, // a large number so we can go previous
    random: xoshiro128("" + initialSeed),
    previewCleanup: [], // this is a list of fns to undo preview changes
    options: {
      blur: 0.5,
      sizing: 0.5, // all parameters that change size of something
      direction: 0.5, // all parameters that change angle or direction
      global: 0.5, // mixes everything(ish, for now)
      color: 1, // for now just colorama
      seed: 1, // randomize seed of turbulent displace, fractal noise, and cell pattern?
      kaleidaMirroring: 1, // select a different mirroring option?
      waveType: 1, // randomize wave warp?
      selectedOnly: 0, // affect selected items only?
    },
  };

  function globalFactor(option) {
    return option * state.options.global;
  }

  function globalOff(option) {
    return state.options.global === 0 ? 0 : option;
  }

  // Randomize the params
  function run() {
    var mix = {
      blur: globalFactor(state.options.blur),
      sizing: globalFactor(state.options.sizing),
      direction: globalFactor(state.options.direction),
      global: state.options.global,
      // global off because the ones below are discontinuous
      color: globalOff(state.options.color),
      seed: globalOff(state.options.seed),
      waveType: globalOff(state.options.waveType),
      kaleidaMirroring: globalOff(state.options.kaleidaMirroring),
    };

    state.random = xoshiro128("" + state.seed);

    var randomize = {
      seed: getRandomizer("Random Seed", state.random, mix.seed),
      palette: getRandomizer("Use Preset Palette", state.random, mix.color),
      angle: getRandomizer("Angle Offset", state.random, mix.direction),
      radius: getRandomizer("Radius", state.random, mix.sizing),
      smearing: getRandomizer("Smearing", state.random, mix.global),
      waveWidth: getRandomizer("Wave Width", state.random, mix.sizing),
      waveHeight: getRandomizer("Wave Height", state.random, mix.sizing),
      direction: getRandomizer("Direction", state.random, mix.direction),
      rotation: getRandomizer("Rotation", state.random, mix.direction),
      size: getRandomizer("Size", state.random, mix.sizing),
      waveType: getRandomizer("Wave Type", state.random, mix.waveType),
      blurAmount: getRandomizer("Amount", state.random, mix.blur),
      kaleidaMirroring: getRandomizer(
        "Mirroring",
        state.random,
        mix.kaleidaMirroring
      ),
    };

    var config = [
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
      {
        effect: "CC Kaleida",
        operations: [
          randomize.size(1, 1000),
          randomize.rotation(1, 360),
          randomize.kaleidaMirroring(1, 9),
        ],
      },
      {
        effect: "CC Griddler",
        operations: [randomize.rotation(1, 360)],
      },

      {
        effect: "APC Colorama",
        operations: [randomize.palette(1, 35)],
      },
      {
        effect: "CC Vector Blur",
        operations: [randomize.angle(0, 360), randomize.blurAmount(-500, 500)],
      },
      {
        effect: "CC HexTile",
        operations: [randomize.radius(3, 1000), randomize.smearing(0, 100)],
      },
      {
        effect: "Wave Warp",
        operations: [
          randomize.waveWidth(1, 1000),
          randomize.waveHeight(-1000, 1000),
          randomize.waveType(1, 9),
          randomize.direction(1, 360),
        ],
      },
      {
        effect: "directionalBlur",
        operations: [randomize.direction(1, 360)],
      },
      {
        effect: "Ripple",
        operations: [
          randomize.radius(1, 100),
          randomize.waveWidth(2, 100),
          randomize.waveHeight(2, 100),
        ],
      },
    ];

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

        forEach(config, function (item) {
          forEach(item.operations, function (operate) {
            state.previewCleanup.push(changeEffect(item.effect, operate));
          });
        });
      });
    });
  }

  function commit() {
    state.previewCleanup = [];
  }

  function cleanup() {
    forEach(state.previewCleanup, function (callback) {
      callback();
    });
    commit();
  }

  function apply(isDone) {
    commit();
    app.endUndoGroup();

    if (!isDone) {
      app.beginUndoGroup(scriptName);
    }
  }

  function update(newSeed) {
    if (newSeed != undefined) {
      state.seed = newSeed;
    }

    cleanup();
    run();
  }

  // run first time
  run();

  createUI(function (panel) {
    return {
      onDone: function () {
        apply(true);
        panel.close();
      },
      onCancel: function () {
        cleanup();
        panel.close();
      },
      onNext: function () {
        update(state.seed + 1);
      },
      onPrevious: function () {
        update(state.seed - 1);
      },
      onRepeat: function () {
        run();
        apply(false);
      },
      getUiProps: function (inputName) {
        return {
          initialValue: state.options[inputName],
          onChange: function (value) {
            state.options[inputName] = value;
            update();
          },
        };
      },
    };
  });

  function createUI(getProps) {
    createPanel(function (myPanel) {
      var props = getProps(myPanel);

      createText(myPanel, "Random Amount", "center");

      createSlider(myPanel, "Blur", props.getUiProps("blur"));
      createSlider(myPanel, "Size", props.getUiProps("sizing"));
      createSlider(myPanel, "Direction", props.getUiProps("direction"));

      var checkboxGroup = createGroup(myPanel, "checkboxGroup");
      createCheckbox(checkboxGroup, "Seed", props.getUiProps("seed"));
      createCheckbox(checkboxGroup, "Wave Type", props.getUiProps("waveType"));
      createCheckbox(checkboxGroup, "Colorama", props.getUiProps("color"));
      createCheckbox(
        myPanel,
        "Kaleida Mirroring",
        props.getUiProps("kaleidaMirroring")
      );

      createSlider(myPanel, "Global", props.getUiProps("global"));
      createCheckbox(
        myPanel,
        "Selected Only",
        props.getUiProps("selectedOnly")
      );

      var buttonsGroup = createGroup(myPanel, "buttonsGroup");
      createButton(buttonsGroup, "Previous", props.onPrevious);
      createButton(buttonsGroup, "Next", props.onNext);
      createButton(buttonsGroup, "Repeat", props.onRepeat);

      var actionButtonsGroup = createGroup(myPanel, "actionButtonsGroup");
      createButton(actionButtonsGroup, "Cancel", function () {
        props.onCancel(myPanel);
      });
      createButton(actionButtonsGroup, "Done", function () {
        props.onDone(myPanel);
      });
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