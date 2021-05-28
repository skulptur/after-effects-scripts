var scriptName = "Variation by Protobacillus";

// Utils

// adobe sucks and starts with index 1
function getItem (items, index) {
    return items[index + 1];
}

function forEach (elements, callback) {
    for(var i = 0; i < elements.length; i++){
        callback(elements[i], i);
    }
}

function forEachItem (elements, callback) {
    for(var i = 0; i < elements.length; i++){
        callback(getItem(elements, i), i);
    }
}

// to get the indices
function times(iterations, callback) {
    var result = []
    
    for (var i = 0; i < iterations; i++) {
        result.push(callback(i));
    }
    
    return result
}

function isComp (element) {
    return element instanceof CompItem;
}

function isFolder (element) {
    return element instanceof FolderItem;
}

// to visit the layers of a comp
function forEachLayer (element, callback) {
    if (isComp(element)){
        forEachItem(element.layers, callback);
    }
}

function recursiveVisit(rootItems, callback) {
    forEachItem(rootItems, function(currentItem){
        if(isFolder(currentItem)){
            return recursiveVisit(currentItem.items, callback);
        }
    
        callback(currentItem);
    })
}

// min and max included 
function randomInt(min, max) { 
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function getRandomizer (property) {
    return function(min, max){
        return function(effect){
            effect.property(property).setValue(randomInt(min, max));    
        }
    }
}

function getChangeEffect(layer) {
    return function(effectName, callback){
        var effect = layer.property("Effects").property(effectName);
        if(effect){
            callback(effect)
        }
    
        return effect;
    }
}

// Randomizers
// TODO: add a mix factor (read value and lerp with randomized one)
var randomizeSeed = getRandomizer("Random Seed");
var randomizePalette = getRandomizer("Use Preset Palette");
var randomizeAngle = getRandomizer("Angle Offset");
var randomizeRadius = getRandomizer("Radius");
var randomizeSmearing = getRandomizer("Smearing");
var randomizeWaveWidth = getRandomizer("Wave Width");
var randomizeWaveHeight = getRandomizer("Wave Height");

var fx = {
    fractalNoise: "fractalNoise",
    colorama: "APC Colorama",
    vectorBlur: "CC Vector Blur",
    hexTile: "CC HexTile",
    waveWarp: "Wave Warp",
    ripple: "Ripple",
};

// Main
function variation(){
    // start undo group
    app.beginUndoGroup(scriptName);

    // use info panel for debugging
    clearOutput();
    writeLn(scriptName);

    recursiveVisit(app.project.items, function(currentItem){
        forEachLayer(currentItem, function(layer){
            var changeEffect = getChangeEffect(layer);

            changeEffect(fx.fractalNoise, randomizeSeed(0, 10000));
            changeEffect(fx.colorama, randomizePalette(1, 35));
            changeEffect(fx.vectorBlur, randomizeAngle(0, 360));
            changeEffect(fx.hexTile, randomizeRadius(3, 1000));
            changeEffect(fx.hexTile, randomizeSmearing(0, 100));
            changeEffect(fx.waveWarp, randomizeWaveWidth(1, 1000));
            changeEffect(fx.waveWarp, randomizeWaveHeight(-1000, 1000));
            changeEffect(fx.ripple, randomizeRadius(1, 100));
            changeEffect(fx.ripple, randomizeWaveWidth(2, 100));
            changeEffect(fx.ripple, randomizeWaveHeight(2, 100));
            
        });
    });

    // end undo group
    app.endUndoGroup();
}

variation();