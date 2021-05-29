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
