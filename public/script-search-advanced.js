window.onload = function () {
  console.log("Page fully loaded. Collecting elements...");
  startCollectingElements();
};

// For testing, set trustedOriginURL locally
window.trustedOriginURL = "http://localhost:3000/";

function startCollectingElements() {
  var searchTerms = ["button", "input", "a", "div"]; // Add relevant selectors
  martiniSearchTerm(searchTerms);
}

function collectIframeElements(doc, searchTerms, collectionFound) {
  // Collect elements from the current document
  searchTerms.forEach((selector) => {
    collectionFound.push(...Array.from(doc.querySelectorAll(selector)));
  });

  // Iterate over iframes and search inside them recursively
  doc.querySelectorAll("iframe").forEach((iframe) => {
    try {
      const iframeDocument =
        iframe.contentDocument || iframe.contentWindow.document;

      // Log iframe information
      let iframeInfo = iframe.src ? `src: ${iframe.src}` : `No src provided`;

      // Try to find the iframe's title or other useful information if src is null
      if (!iframe.src) {
        if (iframe.title) {
          iframeInfo = `title: ${iframe.title}`;
        } else if (iframe.id) {
          iframeInfo = `id: ${iframe.id}`;
        } else if (iframe.name) {
          iframeInfo = `name: ${iframe.name}`;
        } else {
          iframeInfo = `No title, id, or name available`;
        }
      }

      console.log(`Processing iframe: ${iframeInfo}`);

      if (iframeDocument && iframeDocument.body) {
        collectIframeElements(iframeDocument, searchTerms, collectionFound);
        sendDataToIframe(iframe, collectionFound); // Send data to iframe
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
}

function martiniSearchTerm(searchTerms) {
  let elementInfoMap = new Map();
  let collectionFound = [];

  // Start searching from the main document
  collectIframeElements(document, searchTerms, collectionFound);

  collectionFound.forEach((node) => {
    if (
      ["html", "body", "main", "script", "meta", "head", "style"].includes(
        node.tagName.toLowerCase()
      )
    ) {
      return;
    }

    const elementIdentity = getElementIdentity(node); // This function is now defined
    if (elementIdentity) {
      const {
        xpath,
        allAttributes,
        customXPath,
        attribId,
        attribName,
        coords,
        someText,
      } = elementIdentity || {}; // Add fallback to empty object if elementIdentity is null

      let elementInfoString = `${node.tagName.toLowerCase()};xpath:${xpath};text:${someText};attribId:${attribId};attribName:${attribName};coords:${coords};allAttributes:${allAttributes};customXPath:${customXPath};`;

      if (!elementInfoMap.has(xpath)) {
        elementInfoMap.set(xpath, elementInfoString);
      }
    }
  });

  console.log("All element info stored in Map:", elementInfoMap);

  return elementInfoMap;
}

// Function to send serializable data to iframe
function sendDataToIframe(iframe, collectionFound) {
  try {
    const iframeWindow = iframe.contentWindow; // Get iframe's window object

    // Create a new array with only serializable data (no DOM elements)
    const serializableData = collectionFound.map((node) => {
      const { xpath, attribId, attribName, coords, someText, allAttributes } =
        getElementIdentity(node) || {}; // Fallback to empty object
      return { xpath, attribId, attribName, coords, someText, allAttributes };
    });

    iframeWindow.postMessage(
      {
        type: "elementsData", // Message type
        data: serializableData, // Send serializable data to iframe
      },
      window.trustedOriginURL
    ); // Use the dynamic trusted origin URL
  } catch (error) {
    console.error("Error sending data to iframe:", error);
  }
}

// Listen for messages in the iframe
window.addEventListener("message", function (event) {
  if (event.origin !== window.trustedOriginURL) {
    // Use dynamic trusted origin URL
    // console.warn("Message origin is not trusted.");
    return;
  }

  // Handle the received data
  console.log("Received message data:", event.data);

  if (event.data.type === "elementsData") {
    // Process the received element data
    const elementData = event.data.data;
    console.log("Element data from parent:", elementData);
    // You can process the elementData here...
  }
});

// Helper function to get element identity
function getElementIdentity(element) {
  if (
    element.offsetWidth === 0 ||
    element.offsetHeight === 0 ||
    window.getComputedStyle(element).visibility === "hidden"
  ) {
    return null;
  }

  let xpath = getMartiniXPath(element);
  let allAttributes = Array.from(element.attributes)
    .map((attr) => `${attr.name}="${attr.value}"`)
    .join(";");
  let attribId = element.id || "";
  let attribName = element.name || "";
  let coords = element.getBoundingClientRect();
  coords = `${coords.left},${coords.top}`;
  let someText =
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
}

// Helper function to generate a unique XPath for an element
function getMartiniXPath(element) {
  if (element === document.body) return "/html/body";
  let ix = 0;
  let siblings = element.parentNode ? element.parentNode.childNodes : [];
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
}
