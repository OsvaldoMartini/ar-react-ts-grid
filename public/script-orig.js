(function () {
  var tooltip = document.createElement("div");
  tooltip.id = "Martini-Is-Awesome";
  tooltip.style.position = "absolute";
  tooltip.style.backgroundColor = "rgba(255, 165, 0, 0.5)"; // Slightly opaque light orange
  tooltip.style.border = "1px solid #ccc";
  tooltip.style.padding = "10px";
  tooltip.style.borderRadius = "5px";
  tooltip.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.2)";
  tooltip.style.fontFamily = "Arial, sans-serif";
  tooltip.style.fontSize = "14px";
  tooltip.style.color = "#333";
  tooltip.style.zIndex = "10000"; // Higher z-index
  tooltip.style.display = "none";
  document.body.appendChild(tooltip);

  var elementInfoMap = new Map();
  var allElementInfo = [];

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

    // Ensure className is a string; otherwise, set it as an empty string
    var className = (
      typeof element.className === "string" ? element.className : ""
    )
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

  var lastHoveredIsIframe = null; // Keep track of the last hovered element type

  function showMartiniTooltip(event) {
    var elementBelowTooltip = document.elementFromPoint(
      event.clientX,
      event.clientY
    );
    if (!elementBelowTooltip || elementBelowTooltip === tooltip) {
      return;
    }

    var isIframe = elementBelowTooltip.tagName.toLowerCase() === "iframe";

    // Reset only if switching between iframe and non-iframe elements
    if (lastHoveredIsIframe !== isIframe) {
      console.clear();
      elementInfoMap.clear();
      allElementInfo = [];
    }

    lastHoveredIsIframe = isIframe; // Update last hovered element type

    // Get the tag name and coordinates of the element
    var tagNameTemp = elementBelowTooltip.tagName.toLowerCase();
    var coordsTemp = elementBelowTooltip.getBoundingClientRect();
    var coordsString = coordsTemp.left + "," + coordsTemp.top;
    var xPathTemp = getMartiniXPath(elementBelowTooltip);

    var someText = getSomeText(tagNameTemp, elementBelowTooltip);

    // Store tagName and coordinates in the Map
    elementInfoMap.set(tagNameTemp, `${coordsString};${xPathTemp};${someText}`);

    // Display the tooltip
    tooltip.textContent =
      (isIframe ? "[Iframe] " : "") +
      tagNameTemp +
      "-Coordinates:(" +
      coordsString +
      ")";
    var tooltipWidth = tooltip.offsetWidth;
    var tooltipHeight = tooltip.offsetHeight;
    var left = event.pageX - tooltipWidth / 2;
    var top = event.pageY - tooltipHeight / 2;

    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";
    tooltip.style.display = "block";

    console.log("Element Info:", elementInfoMap);
  }

  function hideMartiniTooltip() {
    tooltip.style.display = "none";
  }

  function handleMartiniClick(event) {
    event.preventDefault();
    event.stopPropagation();
    tooltip.style.display = "none";

    allElementInfo = [];

    var elementBelowTooltip = document.elementFromPoint(
      event.clientX,
      event.clientY
    );
    tooltip.style.display = "block";
    cleanOldValues();

    if (elementBelowTooltip.tagName.toLowerCase() === "iframe") {
      // Initialize an array to store the iframe elements' information

      // If the clicked element is an iframe, get the iframe's XPath
      var iframeXPath = getMartiniXPath(elementBelowTooltip);

      allElementInfo.push(`clicked-iFrame:${iframeXPath};`);

      // Format the string and push it to the array
      elementInfoMap.forEach((value, key) => {
        allElementInfo.push(`clicked-Coord:${key};${value};`);
      });

      // Get the document inside the iframe
      var iframeDocument =
        elementBelowTooltip.contentDocument ||
        elementBelowTooltip.contentWindow.document;

      // Get all elements inside the iframe
      var iframeElements = iframeDocument.querySelectorAll("*");

      // Loop through each element inside the iframe and log its XPath, coordinates, and handle input values
      iframeElements.forEach(function (elementInsideIframe) {
        // Get the XPath of the current element
        var iframeElementXPath = getMartiniXPath(elementInsideIframe);

        // Extract text content (or input value if applicable)
        var someText = "";

        // Convert the tagName to lowercase for comparison to avoid case sensitivity issues
        var tagName = elementInsideIframe.tagName.toLowerCase();

        // Convert the tagName to lowercase for comparison to avoid case sensitivity issues
        var tagName = elementInsideIframe.tagName.toLowerCase();

        var someText = getSomeText(tagName, elementInsideIframe);

        // Create a string with the element's information
        var elementInfoString = `iFrame-Child:${elementInsideIframe.tagName.toLowerCase()};xpath:${iframeElementXPath};text:${someText}`;

        // Push the string with element's info to the allElementInfo array
        allElementInfo.push(elementInfoString);
      });

      // Return the list of iframe elements with their tagName, XPath, and text content
      console.log("List of iframe elements:", allElementInfo);
      window.allElementInfo = allElementInfo;
    } else {
      // Format the string and push it to the array
      elementInfoMap.forEach((value, key) => {
        allElementInfo.push(`Coord:${key};${value};`);
      });

      // If the clicked element is not an iframe, get the regular XPath
      var tagName = elementBelowTooltip.tagName.toLowerCase();
      var xpath = getMartiniXPath(elementBelowTooltip);

      var absoluteXPath = getMartiniAbsoluteXPath(elementBelowTooltip);
      var customXPath = getMartiniCustomXPath(elementBelowTooltip);

      var attribId = elementBelowTooltip.id || "";
      var attribName = elementBelowTooltip.name || "";
      var coords = elementBelowTooltip.getBoundingClientRect();
      coords = coords.left + "," + coords.top;

      var someText = "";

      // Extract text content (or input value if applicable)
      if (
        elementBelowTooltip.tagName.toLowerCase() === "input" ||
        elementBelowTooltip.tagName.toLowerCase() === "textarea"
      ) {
        someText = elementBelowTooltip.value || "";
      } else {
        someText = elementBelowTooltip.textContent.trim() || "";
      }

      // Format the string and push it to the array
      elementInfoMap.forEach((value, key) => {
        allElementInfo.push(`Coord:${key};${value};`);
      });

      // Create a tagName /  xpath / text
      var elementInfoTags = `clicked-tagName:${tagName.toLowerCase()};xpath:${xpath};text:${someText}`;
      allElementInfo.push(elementInfoTags);
      // Create a tagName /  xpath / text
      var elementInfoExtra1 = `clicked-attribId:${attribId};attribName:${attribName};coords:${coords}`;
      allElementInfo.push(elementInfoExtra1);
      var elementInfoExtra2 = `clicked-absoluteXPath:${absoluteXPath};customXPath:${customXPath};`;
      allElementInfo.push(elementInfoExtra2);

      console.log("List of elements:", allElementInfo);
      window.allElementInfo = allElementInfo;
    }
  }

  function getSomeText(tagName, elementInsideIframe) {
    var someText = "";
    // Check for input, textarea, select, or button elements
    if (
      tagName === "input" ||
      tagName === "textarea" ||
      tagName === "select" ||
      tagName === "button"
    ) {
      // If the element is an input or textarea, get its value
      someText =
        (elementInsideIframe.value && elementInsideIframe.value.trim()) ||
        (elementInsideIframe.placeholder &&
          elementInsideIframe.placeholder.trim()) ||
        "";
    } else if (tagName === "option") {
      // Handle <option> elements specifically
      someText =
        (elementInsideIframe.textContent &&
          elementInsideIframe.textContent.trim()) ||
        "";
    } else if (
      tagName === "html" ||
      tagName === "body" ||
      tagName === "script"
    ) {
      // Handle <option> elements specifically
      someText = "";
    } else {
      // For other elements, get textContent or innerText as a fallback for better compatibility
      someText =
        (elementInsideIframe.textContent &&
          elementInsideIframe.textContent.trim()) ||
        (elementInsideIframe.innerText &&
          elementInsideIframe.innerText.trim()) ||
        "";
    }
    return someText;
  }

  function cleanOldValues() {
    window.allElementInfo = [];
  }

  cleanOldValues();

  document.addEventListener("mouseover", showMartiniTooltip);
  //                document.addEventListener('mouseout', hideMartiniTooltip);
  document.addEventListener("click", handleMartiniClick);
  window.removeClickListener = function () {
    document.removeEventListener("mouseover", showMartiniTooltip);
    //                    document.removeEventListener('mouseout', hideMartiniTooltip);
    document.removeEventListener("click", handleMartiniClick);
  };
})();
