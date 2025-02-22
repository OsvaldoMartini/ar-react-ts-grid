(function (targetOriginURL, trustedOriginURL, searchTerms, hiddenFields) {
  var pageFullyLoaded = false;
  var elementInfoMap = new Map();
  // var elementInfoSubmit = new Map();
  var allElementInfo = [];

  function init(eventName) {
    if (pageFullyLoaded) {
      console.log("Event Name", eventName);
      if (
        eventName === "DOMContentLoaded" ||
        eventName === "onreadystatechange" ||
        eventName === "load" ||
        eventName === "onload"
      ) {
        elementInfoMap = startCollectingElements(searchTerms);

        limitMapCharacters(elementInfoMap);
        console.log("All element info stored in Map:", allElementInfo);
      }
    }
    {
      pageFullyLoaded = true;
    }
  }

  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    setTimeout(() => init("Direct Execution"), 0); // Ensures it runs after the event loop
  } else if (document.addEventListener) {
    document.addEventListener("DOMContentLoaded", () =>
      setTimeout(() => init("DOMContentLoaded"), 0)
    );
    window.addEventListener("load", () => init("load"));
  } else if (document.attachEvent) {
    document.attachEvent("onreadystatechange", function () {
      if (document.readyState === "complete")
        setTimeout(() => init("onreadystatechange"), 0);
    });
    window.attachEvent("onload", () => init("onload"));
  }

  // Function to collect general elements based on search terms
  const collectElements = function collectElements(
    doc,
    searchTerms,
    collectionFound,
    elementInfoMap
  ) {
    // Collect elements from the current document using the provided search terms
    searchTerms.forEach((selector) => {
      collectionFound.push(...Array.from(doc.querySelectorAll(selector)));
    });

    // After collecting, process element identities for the parent document
    collectionFound.forEach((node) => {
      if (
        ["html", "body", "main", "script", "meta", "head", "style"].includes(
          node.tagName.toLowerCase()
        )
      ) {
        return;
      }

      const elementIdentity = getElementIdentity(node);
      if (elementIdentity) {
        elementInfoMap.set(
          elementIdentity.xpath,
          `tagName-Found;${elementInfoString(node, elementIdentity)}`
        );
      }
    });
  };

  function fetchAndParseIframeContent(iframe) {
    if (!iframe.src) return null;

    const xhr = new XMLHttpRequest();
    xhr.open("GET", iframe.src, false); // 'false' makes the request synchronous

    try {
      xhr.send();

      if (xhr.status !== 200) {
        console.error("Error fetching the iframe content:", xhr.status);
        return null;
      }

      const htmlContent = xhr.responseText;

      // Parse the HTML content
      const parser = new DOMParser();
      const parsedDocument = parser.parseFromString(htmlContent, "text/html");

      // Get all elements inside the parsed document
      const srcElements = parsedDocument.querySelectorAll("*");
      console.log(`srcElements Total: <${srcElements.length}>`);

      srcElements.forEach((element) => {
        console.log(`Element: <${element.tagName}>`);
        console.log("Text Content:", element.textContent.trim());
      });

      return srcElements; // Return the NodeList
    } catch (error) {
      console.error("Error fetching the iframe content:", error);
      return null;
    }
  }

  const iFrameDetails = function iFrameDetails(iframe, xPathIFrame, childSize) {
    const iframeDetails = `Elements inside iframe: ${childSize}`;

    console.log(
      `iFrame Found: ${
        iframe.src ||
        iframe.title ||
        iframe.id ||
        iframe.name ||
        "No description"
      }; ${iframeDetails}`
    );
    // Store the iframe details in the elementInfoMap
    elementInfoMap.set(
      xPathIFrame,
      `xpath:${xPathIFrame};text:${
        iframe.src ||
        iframe.title ||
        iframe.id ||
        iframe.name ||
        "No description"
      };${iframeDetails}`
    );
  };

  // Function to collect iframe elements recursively
  const collectIframeElements = function collectIframeElements(
    doc,
    collectionFound,
    elementInfoMap,
    isIframeChild = false
  ) {
    doc.querySelectorAll("iframe").forEach((iframe) => {
      try {
        let iframeDocument =
          iframe.contentDocument || iframe.contentWindow.document;

        try {
          console.log(
            "Iframe origin:",
            new URL(iframe.src, window.location.origin).origin
          );
          console.log("Parent origin:", window.location.origin);
        } catch (e) {
          console.warn("Cross-origin access denied for iframe:", iframe.src);
        }

        if (iframe) {
          let iframeParsed = null;
          let srcDocElements = null;

          const xPathIFrame = getMartiniXPath(iframe); // Get the XPath of the iframe

          const elementIdentity = getElementIdentity(iframe);
          if (elementIdentity) {
            elementInfoMap.set(
              elementIdentity.xpath,
              `iFrame-Found;${elementInfoString(iframe, elementIdentity)}`
            );
          }

          const parser = new DOMParser();

          if (iframe.srcdoc) {
            iframeParsed = parser.parseFromString(iframe.srcdoc, "text/html");

            // Select all elements inside the parsed document
            srcDocElements = iframeParsed.querySelectorAll("*");
          }

          if (iframe.src) {
            const srcElements = fetchAndParseIframeContent(iframe);
            if (srcElements) {
              console.log("Fetched Elements:", srcElements);

              iFrameDetails(iframe, xPathIFrame, srcElements.length);

              srcElements.forEach(function (element) {
                const elementIdentity = getElementIdentity(element);
                console.log(
                  "elementIdentity.xpath",
                  `${xPathIFrame}${elementIdentity?.xpath}`
                );
                if (elementIdentity) {
                  elementInfoMap.set(
                    `${xPathIFrame}${elementIdentity?.xpath}`,
                    `iFrame-Child;${elementInfoString(
                      element,
                      elementIdentity
                    )}`
                  );
                }
              });
            }
          }

          // Collect all elements inside the iframe
          if (!iframe.src) {
            iFrameDetails(
              iframe,
              xPathIFrame,
              srcDocElements
                ? srcDocElements.length
                : iframeDocument
                ? iframeDocument.querySelectorAll("*").length
                : 0
            );
          }

          iframeDocument
            .querySelectorAll("*")
            .forEach(function (elementInsideIframe) {
              const elementIdentity = getElementIdentity(elementInsideIframe);

              console.log(
                "elementIdentity.xpath",
                `${xPathIFrame}${elementIdentity?.xpath}`
              );
              if (elementIdentity) {
                elementInfoMap.set(
                  `${xPathIFrame}${elementIdentity?.xpath}`,
                  `iFrame-Child;${elementInfoString(
                    elementInsideIframe,
                    elementIdentity
                  )}`
                );
              }
            });

          // Loop through all the elements and extract their properties
          srcDocElements?.forEach(function (element) {
            const elementType = element.tagName; // Get the tag name of the element
            const elementContent = element.textContent.trim(); // Get the text content of the element

            const elementIdentity = getElementIdentity(element);
            console.log(
              "elementIdentity.xpath",
              `${xPathIFrame}${elementIdentity?.xpath}`
            );
            if (elementIdentity) {
              elementInfoMap.set(
                `${xPathIFrame}${elementIdentity?.xpath}`,
                `iFrame-Child;${elementInfoString(element, elementIdentity)}`
              );
            }
          });

          // Process iframe content depending on the presence of srcdoc
          if (iframeParsed) {
            processIframeElements(iframeParsed, xPathIFrame);
          }

          // If the iframe contains nested iframes, recursively collect them
          collectIframeElements(
            iframeDocument,
            collectionFound,
            elementInfoMap,
            true
          );
        } else {
          console.warn(`Skipping cross-origin iframe: ${iframe.src}`);
        }
      } catch (e) {
        console.error(
          `Error accessing iframe: ${iframe.src || "Unknown iframe"}`,
          e
        );
      }
    });
  };

  const processIframeElements = function (iframeDocument, xPathIFrame) {
    // Collect all elements inside the iframe
    iframeDocument
      .querySelectorAll("*")
      .forEach(function (elementInsideIframe) {
        const elementIdentity = getElementIdentity(elementInsideIframe);

        console.log(
          "elementIdentity.xpath",
          `${xPathIFrame}${elementIdentity?.xpath}`
        );
        if (elementIdentity) {
          elementInfoMap.set(
            `${xPathIFrame}${elementIdentity?.xpath}`,
            `iFrame-Child;${elementInfoString(
              elementInsideIframe,
              elementIdentity
            )}`
          );
        }
      });
  };

  // Function to initialize the collection process
  const startCollectingElements = function startCollectingElements(
    searchTerms
  ) {
    // const searchTerms = ["button", "input", "a", "div"]; // Define elements to search for
    let elementInfoMap = new Map(); // Initialize the map to store element information
    let collectionFound = [];

    // First, collect iframe elements
    collectIframeElements(document, collectionFound, elementInfoMap);

    // Then, collect general elements based on search terms
    collectElements(document, searchTerms, collectionFound, elementInfoMap);

    return elementInfoMap;
  };

  const martiniSearchTerm = function martiniSearchTerm(
    searchTerms,
    elementInfoMap
  ) {
    let collectionFound = [];

    // Collect elements from the current document using the provided search terms
    searchTerms.forEach((selector) => {
      collectionFound.push(...Array.from(document.querySelectorAll(selector)));
    });

    // Iterate over iframes and search inside them recursively
    collectIframeElements(
      document,
      searchTerms,
      collectionFound,
      elementInfoMap
    );

    console.log("All element info stored in Map:", elementInfoMap);
    return elementInfoMap;
  };

  const sendDataToIframe = function sendDataToIframe(
    iframe,
    collectionFound,
    elementInfoMap,
    isIframeChild
  ) {
    try {
      const iframeWindow = iframe.contentWindow; // Get iframe's window object

      // Create serializable data (exclude DOM elements)
      const serializableData = collectionFound.map((node) => {
        const { xpath, attribId, attribName, coords, someText, allAttributes } =
          getElementIdentity(node) || {}; // Fallback to empty object
        return { xpath, attribId, attribName, coords, someText, allAttributes };
      });

      const messageType = isIframeChild ? "iFrame-Child" : "iFrame-Found";

      iframeWindow.postMessage(
        {
          type: messageType, // Message type for iFrame parent or child
          data: serializableData, // Send serializable data
          elementInfoMap: Array.from(elementInfoMap.entries()), // Send map as array
        },
        window.trustedOriginURL
      ); // Send message to iframe with trusted origin
    } catch (error) {
      console.error("Error sending data to iframe:", error);
    }
  };

  // Helper function to extract element identity
  const getElementIdentity = function getElementIdentity(element) {
    // if (
    //   element.offsetWidth === 0 ||
    //   element.offsetHeight === 0 ||
    //   window.getComputedStyle(element).visibility === "hidden" ||
    //   !element.offsetWidth || // Safeguard against undefined
    //   !element.offsetHeight
    // ) {
    //   return null; // Skip hidden or non-visible elements
    // }

    const xpath = getMartiniXPath(element);
    const allAttributes = Array.from(element.attributes)
      .map((attr) => `${attr.name}="${attr.value}"`)
      .join(";");
    const attribId = element.id || "";
    const attribName = element.name || "";
    const coords = `${element.getBoundingClientRect().left.toFixed(2)},${element
      .getBoundingClientRect()
      .top.toFixed(2)}`;
    const someText =
      element.textContent.trim() ||
      (element.tagName.toLowerCase() === "input" ? element.value || "" : "");

    return {
      xpath,
      allAttributes,
      customXPath: "",
      attribId,
      attribName,
      coords,
      someText,
    };
  };

  // Helper function to generate a unique XPath for an element
  const getMartiniXPath = function getMartiniXPath(element) {
    if (element === document.body) return "/html/body";
    let ix = 0;
    const siblings = element.parentNode ? element.parentNode.childNodes : [];
    for (let i = 0; i < siblings.length; i++) {
      let sibling = siblings[i];
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
  };

  // Helper function to generate element information string
  const elementInfoString = function elementInfoString(element, identity) {
    return `${element.tagName.toLowerCase()};xpath:${identity.xpath};text:${
      identity.someText
    };attribId:${identity.attribId};attribName:${identity.attribName};coords:${
      identity.coords
    };allAttributes:${identity.allAttributes};customXPath:${
      identity.customXPath
    };`;
  };

  function limitMapCharacters(elementInfoMap, coordText) {
    elementInfoMap.forEach((value, key) => {
      let modifiedValue = value;
      allElementInfo.push(modifiedValue);
    });
  }

  // Event listener to handle incoming messages from iframes
  window.addEventListener("message", function (event) {
    if (event.origin !== window.trustedOriginURL) {
      return; // Ignore messages from untrusted origins
    }

    console.log("Received message data:", event.data);

    if (event.data.type === "elementsData") {
      const elementData = event.data.data; // Process received element data
      console.log("Element data from parent:", elementData);
    }
  });

  function checkEdgeTrackingPrevention() {
    if (navigator.userAgent.includes("Edg")) {
      console.log(
        "Edge Tracking Prevention may be blocking iframes. Go to Edge Settings → Privacy, Search, and Services → Set Tracking Prevention to 'Basic' and refresh the page."
      );
    }
  }

  checkEdgeTrackingPrevention();

  // })(arguments[0], arguments[1], arguments[2], arguments[3]);
})(
  "http://localhost:3000/",
  "http://localhost:3000/",
  ["button", "input", "a", "div"],
  false
);
