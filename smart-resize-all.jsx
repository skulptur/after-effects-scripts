var scriptName = "Scale by Protobacillus";
var targetSize = 2000;
var targetWidth = targetSize;
var targetHeight = targetSize;

// start undo group
app.beginUndoGroup(scriptName);

// use info panel for debugging
clearOutput();
writeLn('Running ' + scriptName);

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

// to visit the layers of a comp
function forEachLayer (element, callback) {
    // adjust position of layers
    if (element instanceof CompItem){
        forEach(element.layers, callback);
    }
}

function setPosition (element, x, y) {
    element.transform.position.setValue([x,y]);
}

function scalePosition (element, xFactor, yFactor) {
    var positionValue = element.position.value;
    write(xFactor + ' - ' + yFactor);
    setPosition(element, positionValue[0] * xFactor, positionValue[1] * yFactor);
}

// TODO: we should start from base not from "root dir"
function recursiveVisit(rootItems, callback) {
    forEach(rootItems, function(currentElement){
        if(currentElement instanceof FolderItem){
            return recursiveVisit(currentElement.items, callback);
        }
    
        callback(currentElement);
    })
}

function resize (currentElement){
    const xFactor = targetSize / currentElement.width;
    const yFactor = targetSize / currentElement.height;

    // resize
    currentElement.width = targetSize;
    currentElement.height = targetSize;

    // adjust position of layers
    forEachLayer(currentElement, function(layer){
        scalePosition(layer, xFactor, yFactor);
    });

    // write(currentElement.name + ',');
}

var rootItems = app.project.items;
// we need to start with the base so that it gets scaled properly
var firstItem = app.project.activeItem;

resize(firstItem);

// // do the resize for the rest
// recursiveVisit(rootItems, resize);

// end undo group
app.endUndoGroup();
