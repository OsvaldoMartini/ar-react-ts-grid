(function (targetOriginURL, trustedOriginURL) {
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

  let lastHoveredElement = null; // Keep track of the previously hovered element
  // Declare global variables to store iframe details
  var iframeDocument = null;
  var iframeElementsCount = 0;

  function showMartiniTooltip(event) {
    var elementBelowTooltip = document.elementFromPoint(
      event.clientX,
      event.clientY
    );

    // Do nothing if the hovered element is the tooltip itself or an excluded tag (html, body, main)
    if (
      !elementBelowTooltip ||
      elementBelowTooltip === tooltip ||
      ["html", "body", "main"].includes(
        elementBelowTooltip.tagName.toLowerCase()
      )
    ) {
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

    // Get the tag name of the element
    var tagNameTemp = elementBelowTooltip.tagName.toLowerCase();

    // // Get the text content of the element (if it has text)
    // var someText = elementBelowTooltip.textContent.trim();
    // if (someText === "") {
    //   someText = "No text content";
    // }

    var someText = getSomeText(
      elementBelowTooltip.tagName.toLowerCase(),
      elementBelowTooltip
    );

    // If it's an iframe, get the number of elements inside the iframe
    var iframeDetails = "";
    if (isIframe) {
      iframeDocument =
        elementBelowTooltip.contentDocument ||
        elementBelowTooltip.contentWindow.document;
      iframeElementsCount = iframeDocument
        ? iframeDocument.body.getElementsByTagName("*").length
        : 0;
      iframeDetails = `Elements inside iframe: ${iframeElementsCount}`;
    }

    var elementXPath = getMartiniXPath(elementBelowTooltip);

    // Store tagName and other details in the Map
    if (iframeDetails && iframeDetails.length > 0) {
      elementInfoMap.set(
        tagNameTemp,
        `xpath:${elementXPath};text:${someText};${iframeDetails};`
      );
    } else {
      const {
        xpath,
        absoluteXPath,
        customXPath,
        attribId,
        attribName,
        coords,
        someText,
      } = getElementIdentity(elementBelowTooltip);

      var elementInfoString = `${elementBelowTooltip.tagName.toLowerCase()};xpath:${xpath};text:${someText};attribId:${attribId};attribName:${attribName};coords:${coords};absoluteXPath:${absoluteXPath};customXPath:${customXPath};`;

      elementInfoMap.set(tagNameTemp, elementInfoString);
    }

    // Parse the someText using the semicolon delimiter
    var parsedText = someText.split(";");

    // Format the tooltip content to make it more readable
    var tooltipContent = "";
    tooltipContent += isIframe ? "[Iframe] <br>" : "";
    tooltipContent += `Tag Name: ${tagNameTemp}<br>`;
    tooltipContent += isIframe ? `- ${iframeDetails}<br>` : "";

    // Replace new lines with <br> before adding each item from parsedText
    tooltipContent += someText
      ? parsedText.map((item) => `- ${item}<br>`).join("")
      : "No Text<br>";

    // Set the tooltip content with line breaks
    tooltip.innerHTML = tooltipContent;

    // Position the tooltip near the mouse cursor
    var tooltipWidth = tooltip.offsetWidth;
    var tooltipHeight = tooltip.offsetHeight;
    var left = event.pageX - tooltipWidth / 2;
    var top = event.pageY - tooltipHeight / 2;

    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";
    tooltip.style.display = "block";

    // Highlight the hovered element
    if (lastHoveredElement !== elementBelowTooltip) {
      // Remove highlight from the previous element if any
      if (lastHoveredElement) {
        lastHoveredElement.style.outline = ""; // Remove the previous highlight
      }
      // Add a border to highlight the current element
      elementBelowTooltip.style.outline = "3px solid red"; // Highlight the element

      lastHoveredElement = elementBelowTooltip; // Update the last hovered element
    }

    console.log("Element Info:", elementInfoMap);
  }

  function hideMartiniTooltip() {
    tooltip.style.display = "none";
  }

  function handleMartiniClick(event) {
    event.preventDefault();
    event.stopPropagation();
    tooltip.style.display = "none";

    // Determine the element below the tooltip (mouse position)
    var elementBelowTooltip = document.elementFromPoint(
      event.clientX,
      event.clientY
    );

    // Hide the tooltip
    tooltip.style.display = "none";

    // If the element below the tooltip is an iframe
    if (
      elementBelowTooltip &&
      elementBelowTooltip.tagName.toLowerCase() === "iframe"
    ) {
      // Get the document inside the iframe
      var iframeDocument =
        elementBelowTooltip.contentDocument ||
        elementBelowTooltip.contentWindow.document;

      // If the iframe document is valid
      if (iframeDocument) {
        // Format the iframe details
        var iframeDetails = `Elements inside iframe: ${
          iframeDocument.body.getElementsByTagName("*").length
        }`;

        // Display the tooltip with iframe details
        tooltip.innerHTML = `[Iframe] <br> ${iframeDetails}`;

        // Position the tooltip near the mouse cursor
        var tooltipWidth = tooltip.offsetWidth;
        var tooltipHeight = tooltip.offsetHeight;
        var left = event.pageX - tooltipWidth / 2;
        var top = event.pageY - tooltipHeight / 2;

        tooltip.style.left = left + "px";
        tooltip.style.top = top + "px";
        tooltip.style.display = "block";

        // Initialize an array to store the iframe element information
        allElementInfo = [];

        const {
          xpath,
          absoluteXPath,
          customXPath,
          attribId,
          attribName,
          coords,
          someText,
        } = getElementIdentity(elementBelowTooltip);

        var elementInfoString = `${elementBelowTooltip.tagName.toLowerCase()};xpath:${xpath};text:${someText};attribId:${attribId};attribName:${attribName};coords:${coords};absoluteXPath:${absoluteXPath};customXPath:${customXPath};`;

        allElementInfo.push(`clicked-iFrame:${elementInfoString};`);

        // limitMapCharacters(elementInfoMap, "clicked-tagName");

        // Get all elements inside the iframe and log their details
        var iframeElements = iframeDocument.querySelectorAll("*");
        iframeElements.forEach(function (elementInsideIframe) {
          const {
            xpath,
            absoluteXPath,
            customXPath,
            attribId,
            attribName,
            coords,
            someText,
          } = getElementIdentity(elementInsideIframe);

          var elementInfoString = `iFrame-Child:${elementInsideIframe.tagName.toLowerCase()};xpath:${xpath};text:${someText};attribId:${attribId};attribName:${attribName};coords:${coords};absoluteXPath:${absoluteXPath};customXPath:${customXPath};`;

          allElementInfo.push(elementInfoString);
        });

        // Log the list of iframe elements
        console.log("List of iframe elements:", allElementInfo);
        window.allElementInfo = allElementInfo;
      } else {
        tooltip.innerHTML = "No iframe document found.";

        // Position the tooltip near the mouse cursor
        var tooltipWidth = tooltip.offsetWidth;
        var tooltipHeight = tooltip.offsetHeight;
        var left = event.pageX - tooltipWidth / 2;
        var top = event.pageY - tooltipHeight / 2;

        tooltip.style.left = left + "px";
        tooltip.style.top = top + "px";
        tooltip.style.display = "block";
      }
    } else {
      // If the clicked element is not an iframe, gather its regular information
      var tagName = elementBelowTooltip.tagName.toLowerCase();

      // Avoid main, body, and html tags
      if (["html", "body", "main"].includes(tagName)) {
        return; // Don't proceed if it's one of these elements
      }

      // Format and push regular element information to the array
      limitMapCharacters(elementInfoMap, "tagName-found");

      const {
        xpath,
        absoluteXPath,
        customXPath,
        attribId,
        attribName,
        coords,
        someText,
      } = getElementIdentity(elementBelowTooltip);

      var elementInfoString = `clicked:${elementBelowTooltip.tagName.toLowerCase()};xpath:${xpath};text:${someText};attribId:${attribId};attribName:${attribName};coords:${coords};absoluteXPath:${absoluteXPath};customXPath:${customXPath};`;

      allElementInfo.push(elementInfoString);

      console.log("List of elements:", allElementInfo);
      window.allElementInfo = allElementInfo;

      // Show the tooltip with the element details
      tooltip.innerHTML = `${tagName} <br> ${someText}`;
      var tooltipWidth = tooltip.offsetWidth;
      var tooltipHeight = tooltip.offsetHeight;
      var left = event.pageX - tooltipWidth / 2;
      var top = event.pageY - tooltipHeight / 2;

      tooltip.style.left = left + "px";
      tooltip.style.top = top + "px";
      tooltip.style.display = "block";
    }
  }

  function getElementIdentity(element) {
    var xpath = getMartiniXPath(element);
    var absoluteXPath = null;
    try {
      console.log("element", element);
      absoluteXPath = getMartiniAbsoluteXPath(element);
    } catch (error) {}
    var customXPath = null;
    try {
      customXPath = getMartiniCustomXPath(element);
    } catch (error) {}

    var attribId = element.id || "";
    var attribName = element.name || "";
    var coords = element.getBoundingClientRect();
    coords = `${coords.left},${coords.top}`;

    var someText = element.textContent.trim() || "";
    if (
      element.tagName.toLowerCase() === "input" ||
      element.tagName.toLowerCase() === "textarea"
    ) {
      someText = element.value || "";
    }

    var someText = getSomeText(element.tagName.toLowerCase(), element);

    return {
      xpath,
      absoluteXPath,
      customXPath,
      attribId,
      attribName,
      coords,
      someText,
    };
  }

  function limitMapCharacters(elementInfoMap, coordText) {
    elementInfoMap.forEach((value, key) => {
      let modifiedValue = value;

      // Check if the key is "html" or value length is greater than 400
      if (key === "html" || value.length > 400) {
        // Truncate the value to 150 characters and add "..."
        if (value.length > 150) {
          modifiedValue = value.substring(0, 150) + "...";
        }

        // If the length exceeds 400 characters, break the value into multiple lines
        if (value.length > 400) {
          const firstPart = value.substring(0, 150);
          const secondPart = value.substring(150);
          modifiedValue = `${firstPart}<br>...${secondPart}`;
        }
      }

      // Push the formatted value and key to the array
      allElementInfo.push(`${coordText}:${modifiedValue}`);
    });
  }

  function getSomeText(tagName, element) {
    let someText = "";

    if (["input", "textarea", "select", "button"].includes(tagName)) {
      const extractedText = extractTextFromHTML(element || "");
      someText = [
        ...extractedText.titles,
        ...extractedText.text,
        ...extractedText.labels,
      ]
        .join("; ")
        .trim();
    } else if (["option", "label", "a"].includes(tagName)) {
      const extractedText = extractTextFromHTML(element || "");
      someText = [
        ...extractedText.titles,
        ...extractedText.text,
        ...extractedText.labels,
      ]
        .join("; ")
        .trim();
    } else if (!["html", "body", "script"].includes(tagName)) {
      const extractedText = extractTextFromHTML(element || "");
      someText = [
        ...extractedText.titles,
        ...extractedText.text,
        ...extractedText.labels,
      ]
        .join("; ")
        .trim();
    }

    someText = someText
      .split(";")
      .map((text) => text.trim())
      .filter(Boolean)
      .join(";"); // Clean up sequential text

    return someText;
  }

  function extractTextFromHTML(element) {
    let result = {
      titles: [],
      text: [],
      labels: [],
    };

    // If the input is a string, parse it as HTML
    let doc;
    if (typeof element === "string") {
      const parser = new DOMParser();
      doc = parser.parseFromString(element, "text/html");
    } else {
      doc = element;
    }

    // Extract h1, h2, h3, etc.
    doc.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
      result.titles.push(h.textContent.trim());
    });

    // Extract text from p elements
    doc.querySelectorAll("p").forEach((p) => {
      let textContent = p.textContent.trim();
      if (textContent) {
        result.text.push(textContent);
      }
    });

    // Extract label text from input placeholders
    doc.querySelectorAll("input[placeholder]").forEach((input) => {
      result.labels.push(input.getAttribute("placeholder").trim());
    });

    // Extract iframe titles and nested content
    doc.querySelectorAll("iframe").forEach((iframe) => {
      let title = iframe.getAttribute("title")?.trim();
      if (title) {
        result.titles.push(title);
      }

      try {
        let iframeDoc =
          iframe.contentDocument ||
          new DOMParser().parseFromString(iframe.srcdoc || "", "text/html");
        let iframeContent = extractTextFromHTML(iframeDoc);
        result.titles.push(...iframeContent.titles);
        result.text.push(...iframeContent.text);
        result.labels.push(...iframeContent.labels);
      } catch (e) {
        console.warn("Could not access iframe content", e);
      }
    });

    return result;
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

  // window.postMessage({ type: "myMessage", data: "some data" }, targetOriginURL);

  window.addEventListener("message", function (event) {
    if (event.origin !== trustedOriginURL) return; // check the origin
    console.log(event.data);
  });
  // })(arguments[0], arguments[1]);
})("http://localhost:3000/", "http://localhost:3000/");
