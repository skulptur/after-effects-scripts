var scriptName = "Scale by Protobacillus";

// SETTINGS

var mainExport = {
    name: 'export',
    fps: 60,
    dimensions: [2000, 2000],
    duration: 4, // seconds
};
var generatedExports = [
    {
        name: 'full-hd',
        fps: 60,
        dimensions: [1920, 1080],
        duration: 4,
    },
    {
        name: '4x5',
        fps: 30,
        dimensions: [1080, 1350],
        duration: 4,
    }
];

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
    forEachItem(rootItems, function(currentItem){
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

// tries to find item by name, falls back to selected item
function byNameOrActive(compName){
    var myComp = app.project.activeItem
    for (var i = 1; i <= app.project.numItems; i ++) {
        var element = app.project.item(i);
        if (isComp(element) && (element.name === compName)) {
            myComp = element;
            break;
        }
    }
    return myComp
}

function prepareExport(comp, settings){
    resize(comp, settings.dimensions);
    setFramerate(comp, settings.fps);
    comp.name = '@' + settings.name + '_' + settings.dimensions[0] + 'x' + settings.dimensions[1]  + '_' + app.project.file.name;
}

function protoScale(finalComp){
    if(!finalComp){
        return alert("You need to select the export comp.");
    }

    // start undo group
    app.beginUndoGroup(scriptName);

    // use info panel for debugging
    clearOutput();
    writeLn(scriptName);

    // resize all items
    recursiveVisit(app.project.items, function(currentItem){
        resize(currentItem, mainExport.dimensions);
    });

    // this is for the selected item only
    precompLayers(finalComp, 'pre-export');
    
    // prepare the main export
    prepareExport(finalComp, mainExport);

    // create specific exports
    forEach(generatedExports, function(setting){
        prepareExport(finalComp.duplicate(), setting);
    })

    // end undo group
    app.endUndoGroup();
}

protoScale(byNameOrActive(mainExport.name));