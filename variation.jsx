var scriptName = "Variation by @protobacillus";

(function (thisObj) {
  // Main
  function main() {
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

    // Randomize the params
    function run() {
      var mix = {
        global: state.options.global,
        sizing: state.options.sizing * state.options.global,
        direction: state.options.direction * state.options.global,
        color: state.options.color * state.options.global,
        seed: state.options.seed * state.options.global,
        waveType: state.options.waveType * state.options.global,
        blur: state.options.blur * state.options.global,
        kaleidaMirroring: state.options.kaleidaMirroring * state.options.global,
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
          operations: [
            randomize.angle(0, 360),
            randomize.blurAmount(-500, 500),
          ],
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

    function getMixerChangeHandler(inputName) {
      return function (value) {
        state.options[inputName] = value;
        update();
      };
    }

    createUI({
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
      getUiProps: function (inputName) {
        return {
          initialValue: state.options[inputName],
          onChange: getMixerChangeHandler(inputName),
        };
      },
    });
  }

  main();

  // UI

  function createUI(props) {
    createPanel(function (myPanel) {
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
    });
  }

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
