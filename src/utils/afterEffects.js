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
