var scriptName = "Variation by @protobacillus";

(function (thisObj) {
  // Main
  function main() {
    var initialSeed = randomInt(10000, 20000, Math.random);
    var state = {
      seed: initialSeed, // a large number so we can go previous
      random: xoshiro128("" + initialSeed),
      previewCleanup: [], // this is a list of fns to undo preview changes
      mix: {
        // for now just colorama
        color: 0.5,
        // all parameters that change size of something
        sizing: 0.5,
        // all parameters that change angle or direction
        direction: 0.5,
        // mix everything with this
        global: 0.5,
        // turbulent displace, fractal noise, cell pattern...
        seed: 0,
        // wave warp
        waveType: 0,
      },
    };

    var fx = {
      fractalNoise: "fractalNoise",
      cellPattern: "cellPattern",
      turbulentDisplace: "turbulentDisplace",
      directionalBlur: "directionalBlur",
      colorama: "APC Colorama",
      vectorBlur: "CC Vector Blur",
      hexTile: "CC HexTile",
      waveWarp: "Wave Warp",
      ripple: "Ripple",
    };

    // Randomize the params
    function run() {
      var global = state.mix.global;
      var sizing = state.mix.sizing * state.mix.global;
      var direction = state.mix.direction * state.mix.global;
      var color = state.mix.color * state.mix.global;
      var seed = state.mix.seed * state.mix.global;
      var waveType = state.mix.waveType * state.mix.global;

      state.random = xoshiro128("" + state.seed);

      var randomizeSeed = getRandomizer("Random Seed", state.random);
      var randomizePalette = getRandomizer("Use Preset Palette", state.random);
      var randomizeAngle = getRandomizer("Angle Offset", state.random);
      var randomizeRadius = getRandomizer("Radius", state.random);
      var randomizeSmearing = getRandomizer("Smearing", state.random);
      var randomizeWaveWidth = getRandomizer("Wave Width", state.random);
      var randomizeWaveHeight = getRandomizer("Wave Height", state.random);
      var randomizeDirection = getRandomizer("Direction", state.random);
      var randomizeWaveType = getRandomizer("Wave Type", state.random);

      recursiveVisit(app.project.items, function (currentItem) {
        // limit to selected items if there is any selection
        if (app.project.selection.length > 0 && !currentItem.selected) {
          return;
        }

        forEachLayer(currentItem, function (layer) {
          var changeEffect = getChangeEffect(layer);

          const cleanup = [
            changeEffect(fx.fractalNoise, randomizeSeed(0, 10000, seed)),
            changeEffect(fx.cellPattern, randomizeSeed(0, 10000, seed)),
            changeEffect(fx.turbulentDisplace, randomizeSeed(0, 10000, seed)),

            changeEffect(fx.colorama, randomizePalette(1, 35, color)),
            changeEffect(fx.vectorBlur, randomizeAngle(0, 360, direction)),
            changeEffect(fx.hexTile, randomizeRadius(3, 1000, sizing)),
            changeEffect(fx.hexTile, randomizeSmearing(0, 100, global)),
            changeEffect(fx.waveWarp, randomizeWaveWidth(1, 1000, sizing)),
            changeEffect(fx.waveWarp, randomizeWaveHeight(-1000, 1000, sizing)),
            changeEffect(fx.waveWarp, randomizeWaveType(1, 9, waveType)),
            changeEffect(fx.waveWarp, randomizeDirection(1, 360, direction)),
            changeEffect(
              fx.directionalBlur,
              randomizeDirection(1, 360, direction)
            ),
            changeEffect(fx.ripple, randomizeRadius(1, 100, sizing)),
            changeEffect(fx.ripple, randomizeWaveWidth(2, 100, sizing)),
            changeEffect(fx.ripple, randomizeWaveHeight(2, 100, sizing)),
          ];

          forEach(cleanup, function (callback) {
            state.previewCleanup.push(callback);
          });
        });
      });
    }

    function cleanup() {
      forEach(state.previewCleanup, function (callback) {
        callback();
      });
      state.previewCleanup = [];
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

    function getMixerChangeHandler(propName) {
      return function (value) {
        state.mix[propName] = value;
        update();
      };
    }

    buildUI({
      onNext: function () {
        update(state.seed + 1);
      },
      onPrevious: function () {
        update(state.seed - 1);
      },
      onRepeat: function () {
        // start undo group
        app.beginUndoGroup(scriptName);

        run();
        state.previewCleanup = [];

        // end undo group
        app.endUndoGroup();
      },
      mix: {
        color: {
          initialValue: state.mix.color,
          onChange: getMixerChangeHandler("color"),
        },
        sizing: {
          initialValue: state.mix.sizing,
          onChange: getMixerChangeHandler("sizing"),
        },
        direction: {
          initialValue: state.mix.direction,
          onChange: getMixerChangeHandler("direction"),
        },
        global: {
          initialValue: state.mix.global,
          onChange: getMixerChangeHandler("global"),
        },
        seed: {
          initialValue: state.mix.seed,
          onChange: getMixerChangeHandler("seed"),
        },
        waveType: {
          initialValue: state.mix.waveType,
          onChange: getMixerChangeHandler("waveType"),
        },
      },
    });
  }

  main();

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

  function getRandomizer(property, random) {
    return function (min, max, t) {
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

  // UI

  // helper functions
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

  function createSlider(panel, name, onChange) {
    var label = panel.add("staticText", undefined, undefined, {
      name: name + "Label",
    });
    label.text = name;
    label.alignment = ["left", "top"];

    var slider = panel.add(
      "slider",
      undefined,
      undefined,
      undefined,
      undefined,
      {
        name: name,
      }
    );
    //   slider.helpTip = "Weight";
    slider.minvalue = 0;
    slider.maxvalue = 100;
    slider.value = 50;
    slider.preferredSize.width = 250;
    slider.onChange = function () {
      onChange(slider.value / 100);
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

  function createCheckbox(group, name, onChange) {
    var checkbox = group.add("checkbox", undefined, undefined, { name: name });
    checkbox.text = name;
    checkbox.onClick = function () {
      onChange(!!checkbox.value ? 1 : 0);
    };

    return checkbox;
  }

  function buildUI(props) {
    buildPanel(function (myPanel) {
      createText(myPanel, "Randomize", "center");

      createSlider(myPanel, "Size", props.mix.sizing.onChange);
      createSlider(myPanel, "Direction", props.mix.direction.onChange);

      var checkboxGroup = createGroup(myPanel, "checkboxGroup");
      createCheckbox(checkboxGroup, "Seed", props.mix.seed.onChange);
      createCheckbox(checkboxGroup, "Wave Type", props.mix.waveType.onChange);
      createCheckbox(checkboxGroup, "Colorama", props.mix.color.onChange);

      createSlider(myPanel, "Global", props.mix.global.onChange);

      var buttonsGroup = createGroup(myPanel, "buttonsGroup");
      createButton(buttonsGroup, "Previous", props.onPrevious);
      createButton(buttonsGroup, "Next", props.onNext);
      createButton(buttonsGroup, "Repeat", props.onRepeat);
    });
  }

  function buildPanel(createUI) {
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
})(this);
