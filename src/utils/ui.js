function createPanel(createUI) {
  var myPanel =
    thisObj instanceof Panel
      ? thisObj
      : new Window("window", scriptName, undefined, {
          resizeable: true,
        });

  myPanel.orientation = "column";
  myPanel.alignChildren = ["center", "top"];
  myPanel.spacing = 10;
  myPanel.margins = 16;

  createUI(myPanel);

  myPanel.onResizing = myPanel.onResize = function () {
    this.layout.resize();
  };
  if (myPanel instanceof Window) {
    myPanel.center();
    myPanel.show();
  } else {
    myPanel.layout.layout(true);
    myPanel.layout.resize();
  }
}

function createGroup(panel, name) {
  const group = panel.add("group", undefined, { name: name });
  group.orientation = "row";
  group.alignChildren = ["left", "center"];
  group.spacing = 10;
  group.margins = 0;
  return group;
}

function createButton(panel, name, onClick) {
  var randomizeButton = panel.add("button", undefined, undefined, {
    name: name,
  });
  randomizeButton.text = name;
  randomizeButton.onClick = onClick;
}

function createSlider(panel, name, props) {
  var label = panel.add("staticText", undefined, undefined, {
    name: name + "Label",
  });
  label.text = name;
  label.alignment = ["left", "top"];

  var slider = panel.add("slider", undefined, undefined, undefined, undefined, {
    name: name,
  });
  //   slider.helpTip = "Weight";
  slider.minvalue = 0;
  slider.maxvalue = 100;
  slider.value = props.initialValue * 100;
  slider.preferredSize.width = 250;
  slider.onChange = function () {
    props.onChange(slider.value / 100);
  };

  return slider;
}

function createText(panel, name, align) {
  var staticText = panel.add("statictext", undefined, undefined, {
    name: name,
  });
  staticText.text = name;
  staticText.alignment = [align, "top"];
  return staticText;
}

function createCheckbox(group, name, props) {
  var checkbox = group.add("checkbox", undefined, undefined, { name: name });
  checkbox.text = name;
  checkbox.value = props.initialValue > 0;
  checkbox.onClick = function () {
    props.onChange(!!checkbox.value ? 1 : 0);
  };

  return checkbox;
}
