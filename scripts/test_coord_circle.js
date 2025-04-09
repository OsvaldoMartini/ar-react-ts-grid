function moveAndClickMouse(x, y) {
  const mouseDiv = document.createElement("div");
  mouseDiv.style.position = "absolute";
  mouseDiv.style.width = "10px";
  mouseDiv.style.height = "10px";
  mouseDiv.style.backgroundColor = "red";
  mouseDiv.style.borderRadius = "50%";
  mouseDiv.style.zIndex = "10000";
  mouseDiv.style.pointerEvents = "none";
  mouseDiv.id = "virtualMouse";
  document.body.appendChild(mouseDiv);

  function blinkMouse() {
    const mouse = document.getElementById("virtualMouse");
    if (mouse) {
      mouse.style.visibility =
        mouse.style.visibility === "hidden" ? "visible" : "hidden";
    }
  }

  const blinkInterval = setInterval(blinkMouse, 500);

  mouseDiv.style.left = `${x}px`;
  mouseDiv.style.top = `${y}px`;

  const element = document.elementFromPoint(x, y);
  if (element) {
    element.click();
  }

  setTimeout(() => {
    clearInterval(blinkInterval);
    const mouse = document.getElementById("virtualMouse");
    if (mouse) {
      mouse.remove();
    }
  }, 3000);
}

// moveAndClickMouse(arguments[0], arguments[1]);
moveAndClickMouse(1065, 509);
