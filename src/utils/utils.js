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
