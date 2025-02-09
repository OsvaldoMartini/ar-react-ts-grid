(function (targetOriginURL, trustedOriginURL) {
  var tooltip = document.createElement("div");
  tooltip.id = "Martini-Is-Awesome";
  tooltip.style.position = "absolute";
  tooltip.style.backgroundColor = "rgba(255, 165, 0, 0.5)";
  tooltip.style.border = "1px solid #ccc";
  tooltip.style.padding = "10px";
  tooltip.style.borderRadius = "5px";
  tooltip.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.2)";
  tooltip.style.fontFamily = "Arial, sans-serif";
  tooltip.style.fontSize = "14px";
  tooltip.style.color = "#333";
  tooltip.style.zIndex = "10000";
  tooltip.style.display = "none";
  document.body.appendChild(tooltip);
  function getMartiniAbsoluteXPath(element) {
    if (element === document.body) {
      return "/html/" + element.tagName.toLowerCase();
    }
    var ix = 0;
    var siblings = element.parentNode.childNodes;
    for (var i = 0; i < siblings.length; i++) {
      var sibling = siblings[i];
      if (sibling === element) {
        return (
          getMartiniAbsoluteXPath(element.parentNode) +
          "/" +
          element.tagName.toLowerCase() +
          "[" +
          (ix + 1) +
          "]"
        );
      }
      if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
        ix++;
      }
    }
    return "";
  }
  function getMartiniXPath(element) {
    if (element === document.body) {
      return "/html/body";
    }
    var ix = 0;
    var siblings = element.parentNode ? element.parentNode.childNodes : [];
    for (var i = 0; i < siblings.length; i++) {
      var sibling = siblings[i];
      if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
        if (sibling === element) {
          return (
            getMartiniXPath(element.parentNode) +
            "/" +
            element.tagName.toLowerCase() +
            "[" +
            (ix + 1) +
            "]"
          );
        }
        ix++;
      }
    }
    return "";
  }
  function getMartiniCustomXPath(element) {
    if (element === document.body) {
      return "/html/" + element.tagName.toLowerCase();
    }
    var className = element.className
      .split(" ")
      .filter(function (cls) {
        return !/\d/.test(cls);
      })
      .join(".");
    var tagName = element.tagName.toLowerCase();
    var ix = 0;
    var siblings = element.parentNode.childNodes;
    for (var i = 0; i < siblings.length; i++) {
      var sibling = siblings[i];
      if (sibling === element) {
        var path = getMartiniCustomXPath(element.parentNode) + "/" + tagName;
        if (className) {
          path += '[contains(@class, "' + className + '")]';
        } else {
          path += "[" + (ix + 1) + "]";
        }
        return path;
      }
      if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
        ix++;
      }
    }
    return "";
  }
  function showMartiniTooltip(event) {
    // Ensure the element exists and is valid
    var elementBelowTooltip = document.elementFromPoint(
      event.clientX,
      event.clientY
    );

    // Check if the element exists and is a valid DOM element
    if (elementBelowTooltip && elementBelowTooltip.tagName) {
      window.tagNameTemp = elementBelowTooltip.tagName.toLowerCase();

      // Ensure getBoundingClientRect() is called on a valid element
      try {
        window.coordsTemp = elementBelowTooltip.getBoundingClientRect();
        window.coordsTemp =
          window.coordsTemp.left + "," + window.coordsTemp.top;
      } catch (e) {
        console.error("Error getting bounding rectangle:", e);
        window.coordsTemp = "Invalid Coordinates";
      }

      tooltip.textContent =
        window.tagNameTemp + "-Coordinates:(" + window.coordsTemp + ")";

      // Calculate tooltip dimensions and position
      var tooltipWidth = tooltip.offsetWidth;
      var tooltipHeight = tooltip.offsetHeight;
      var left = event.pageX - tooltipWidth / 2;
      var top = event.pageY - tooltipHeight / 2;

      // Set tooltip position
      tooltip.style.left = left + "px";
      tooltip.style.top = top + "px";
      tooltip.style.display = "block";
    } else {
      tooltip.style.display = "none"; // Hide tooltip if no valid element is found
    }
  }

  function hideMartiniTooltip() {
    tooltip.style.display = "none";
  }
  function handleMartiniClick(event) {
    event.preventDefault();
    event.stopPropagation();
    tooltip.style.display = "none";
    var elementBelowTooltip = document.elementFromPoint(
      event.clientX,
      event.clientY
    );
    tooltip.style.display = "block";
    console.log(elementBelowTooltip);
    var xpath = getMartiniXPath(elementBelowTooltip);
    var absoluteXPath = getMartiniAbsoluteXPath(elementBelowTooltip);
    var customXPath = getMartiniCustomXPath(elementBelowTooltip);
    window.currentXPath = xpath;
    window.currentAbsoluteXPath = absoluteXPath;
    window.customXPath = customXPath;
    window.attribId = elementBelowTooltip.id || "";
    window.attribName = elementBelowTooltip.name || "";
    window.tagName = elementBelowTooltip.tagName.toLowerCase();
    window.coords = elementBelowTooltip.getBoundingClientRect();
    window.coords = window.coords.left + "," + window.coords.top;

    // Remove the tooltip from the page and delete the reference after 5 seconds
    setTimeout(() => {
      elementBelowTooltip = null;
      window.currentXPath = "";
      window.currentAbsoluteXPath = "";
      window.customXPath = "";
      window.attribId = "";
      window.attribName = "";
      window.tagName = "";
      window.coords = "";
      window.coords = "";
      console.log("elementBelowTooltip", elementBelowTooltip);
    }, 2000);
  }
  window.currentXPath = "";
  window.currentAbsoluteXPath = "";
  window.customXPath = "";
  window.attribId = "";
  window.attribName = "";
  window.tagName = "";
  window.coords = "";
  window.tagNameTemp = "";
  window.coordsTemp = "";
  document.addEventListener("mouseover", showMartiniTooltip);
  document.addEventListener("click", handleMartiniClick);

  window.revertCloneInjections = function () {
    document.removeEventListener("mouseover", showMartiniTooltip);
    document.removeEventListener("click", handleMartiniClick);
    console.log("revertCloneInjections");
  };

  // window.postMessage({ type: "myMessage", data: "some data" }, targetOriginURL);

  window.addEventListener("message", function (event) {
    if (event.origin !== trustedOriginURL) return; // check the origin
    console.log(event.data);
  });
})(arguments[0], arguments[1]);
// })("http://localhost:3000/", "http://localhost:3000/");
