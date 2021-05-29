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
