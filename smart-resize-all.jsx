var scriptName = "Scale by Protobacillus";
var baseSize = [2000, 2000];
var vjLoopSize = [1920, 1080];

// start undo group
app.beginUndoGroup(scriptName);

// use info panel for debugging
clearOutput();
writeLn(scriptName);

// adobe sucks and starts with index 1
function getItem (items, index) {
    return items[index + 1];
}

// so we don't have to keep writing the loops
function forEach (elements, callback) {
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
        forEach(element.layers, callback);
    }
}

function setPosition (element, x, y) {
    element.transform.position.setValue([x,y]);
}

function setFramerate (element, frameRate) {
    if (isComp(element)){
        element.frameRate = frameRate;
    }
}

function scalePosition (element, xFactor, yFactor) {
    var positionValue = element.position.value;
    setPosition(element, positionValue[0] * xFactor, positionValue[1] * yFactor);
}

function recursiveVisit(rootItems, callback) {
    forEach(rootItems, function(currentItem){
        if(isFolder(currentItem)){
            return recursiveVisit(currentItem.items, callback);
        }
    
        callback(currentItem);
    })
}

// resize anything with a width and height property
function resize (currentItem, size){
    var x = size[0];
    var y = size[1];
    var xFactor = x / currentItem.width;
    var yFactor = y / currentItem.height;

    // resize
    currentItem.width = x;
    currentItem.height = y;

    // adjust position of layers
    forEachLayer(currentItem, function(layer){
        scalePosition(layer, xFactor, yFactor);
    });
}

function precompLayers(element, compName){
    if(isComp(element) && element.layers.length > 1){
        var layerIndices = times(element.numLayers, function(i){ return i + 1});
        return element.layers.precompose(layerIndices, compName);
    }
}

// resize all items
recursiveVisit(app.project.items, function(currentItem){
    resize(currentItem, baseSize);
});

// these is for the selected item only
var selectedItem = app.project.activeItem;
if(selectedItem){
    precompLayers(selectedItem, 'final-precomp');
    resize(selectedItem, vjLoopSize);
    setFramerate(selectedItem, 60);
    selectedItem.name = '@full-hd_' + app.project.file.name
}else{
    alert("You need to select the export comp.");
}

// end undo group
app.endUndoGroup();
