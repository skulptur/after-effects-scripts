var scriptName = "Variation by Protobacillus";

// UTILS

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

function randomizeSeed(seededEffect){
    seededEffect.property("Random Seed").setValue(randomInt(0, 10000));
}

function randomizePalette(colorama){
    colorama.property("Use Preset Palette").setValue(randomInt(1, 35));
}

function randomizeAngle(effect){
    effect.property("Angle Offset").setValue(randomInt(0, 360));
}

function changeEffect(layer, effectName, callback){
    var effect = layer.property("Effects").property(effectName);
    if(effect){
        callback(effect)
    }

    return effect;
}

function variation(){
    // start undo group
    app.beginUndoGroup(scriptName);

    // use info panel for debugging
    clearOutput();
    writeLn(scriptName);

    recursiveVisit(app.project.items, function(currentItem){
        forEachLayer(currentItem, function(layer){
            changeEffect(layer, "fractalNoise", randomizeSeed);
            changeEffect(layer, "APC Colorama", randomizePalette);
            changeEffect(layer, "CC Vector Blur", randomizeAngle);
        });
    });

    // end undo group
    app.endUndoGroup();
}

variation();