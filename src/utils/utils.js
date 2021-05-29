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
