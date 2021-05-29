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
